// Optional architecture contract check: layer dependency direction, module public
// contracts and forbidden external imports. Technology-free: it only reads import
// specifiers (JS/TS and Python) and maps them to the paths the project declares.
import { readFileSync, readdirSync, existsSync, lstatSync } from "node:fs";
import { join, dirname, relative, resolve, posix, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../lib/schema-lite.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA = JSON.parse(readFileSync(join(here, "..", "..", "contracts", "architecture.schema.json"), "utf8"));
const SOURCE = /\.(?:mjs|cjs|js|jsx|ts|tsx|py)$/;
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "__pycache__", ".venv"]);
const norm = (p) => p.split(sep).join("/").replace(/^\.\//, "").replace(/\/+$/, "");
const noExt = (p) => p.replace(/\.(?:mjs|cjs|js|jsx|ts|tsx|py)$/, "");
const under = (file, dir) => ((file = noExt(file)), (dir = noExt(dir)), file === dir || file.startsWith(`${dir}/`));

/** Import specifiers of one file: [{ spec, line }]. Comments are not stripped: a mention in a comment may over-report, never under-report. */
export function importsOf(file, text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  const js = /\.(?:mjs|cjs|js|jsx|ts|tsx)$/.test(file);
  lines.forEach((raw, i) => {
    const line = i + 1;
    if (js) {
      for (const m of raw.matchAll(/\b(?:from|import|require|import\()\s*\(?\s*["']([^"']+)["']/g)) out.push({ spec: m[1], line });
    } else {
      let m = /^\s*from\s+(\.*[\w.]*)\s+import\s+([\w, ]+)/.exec(raw);
      if (m && /^\.+$/.test(m[1])) for (const name of m[2].split(",")) out.push({ spec: m[1] + name.trim(), line, py: true });
      else if (m) out.push({ spec: m[1], line, py: true });
      else if ((m = /^\s*import\s+([\w.]+(?:\s*,\s*[\w.]+)*)/.exec(raw))) for (const name of m[1].split(",")) out.push({ spec: name.trim(), line, py: true });
    }
  });
  return out;
}

/** Project-relative path an import points to, or null when it is an external package. */
function target(file, { spec, py }) {
  if (py) {
    if (spec.startsWith(".")) {
      const dots = /^\.+/.exec(spec)[0].length;
      const base = dirname(file).split("/").slice(0, Math.max(0, dirname(file).split("/").length - (dots - 1))).join("/");
      return posix.normalize(posix.join(base, spec.slice(dots).replaceAll(".", "/")));
    }
    return spec.replaceAll(".", "/");
  }
  return spec.startsWith(".") ? posix.normalize(posix.join(dirname(file), spec)) : null;
}

const longest = (file, entries) => {
  let best = null;
  for (const [name, paths] of entries) for (const p of paths) if (under(file, p) && (!best || p.length > best.len)) best = { name, len: p.length };
  return best?.name ?? null;
};

/** Violations of `contract` over { path: text } sources. */
export function checkSources(contract, sources) {
  const errors = validate(contract, SCHEMA);
  if (errors.length) return errors.map((message) => ({ rule: "contract", file: "(contract)", message }));
  const layers = Object.entries(contract.layers).map(([n, l]) => [n, l.paths.map(norm)]);
  const modules = Object.entries(contract.modules ?? {}).map(([n, m]) => [n, [norm(m.path)]]);
  const violations = [];
  for (const [name, layer] of Object.entries(contract.layers)) {
    for (const dep of layer.mayDependOn) if (!contract.layers[dep]) violations.push({ rule: "contract", file: "(contract)", message: `layer ${name} depends on unknown layer ${dep}` });
  }
  if (violations.length) return violations;
  for (const [rawFile, text] of Object.entries(sources)) {
    const file = norm(rawFile);
    const from = longest(file, layers);
    const fromModule = longest(file, modules);
    for (const imp of importsOf(file, text)) {
      const dest = target(file, imp);
      const where = `${file}:${imp.line}`;
      if (from) {
        for (const banned of contract.layers[from].forbiddenImports ?? []) {
          const bare = imp.spec.replace(/^node:/, "");
          const internal = dest !== null && (longest(dest, layers) || longest(dest, modules));
          if (!internal && (bare === banned || bare.startsWith(`${banned}/`) || imp.spec === banned)) {
            violations.push({ rule: "forbidden-import", file: where, message: `layer ${from} must not import ${imp.spec}` });
          }
        }
        const toLayer = dest === null ? null : longest(dest, layers);
        if (toLayer && toLayer !== from && !contract.layers[from].mayDependOn.includes(toLayer)) {
          violations.push({ rule: "dependency-direction", file: where, message: `layer ${from} must not depend on layer ${toLayer} (${imp.spec})` });
        }
      }
      const toModule = dest === null ? null : longest(dest, modules);
      if (toModule && toModule !== fromModule) {
        const publicPaths = contract.modules[toModule].public.map(norm);
        if (!publicPaths.some((p) => under(dest, p))) {
          violations.push({ rule: "module-boundary", file: where, message: `${fromModule ?? "code"} must consume module ${toModule} only through its public contract (${publicPaths.join(", ")}), not ${imp.spec}` });
        }
      }
    }
  }
  return violations;
}

/** Reads the project's sources (skips vendored/build dirs and symlinks) and checks them. */
export function checkProject(projectDir, contract) {
  const root = resolve(projectDir);
  const sources = {};
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isSymbolicLink() || lstatSync(full).isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(full);
      } else if (SOURCE.test(entry.name)) sources[norm(relative(root, full))] = readFileSync(full, "utf8");
    }
  };
  walk(root);
  return checkSources(contract, sources);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
  const project = resolve(arg("--project") ?? ".");
  const contractPath = resolve(arg("--contract") ?? join(project, "architecture.json"));
  if (!existsSync(contractPath)) {
    console.log(`NOT_APPLICABLE: no architecture contract at ${contractPath} (optional)`);
    process.exit(0);
  }
  const violations = checkProject(project, JSON.parse(readFileSync(contractPath, "utf8")));
  for (const v of violations) console.error(`FAIL [${v.rule}] ${v.file}: ${v.message}`);
  console.log(violations.length ? `FAIL: ${violations.length} architecture violation(s)` : "PASS: architecture contract respected");
  process.exit(violations.length ? 1 : 0);
}
