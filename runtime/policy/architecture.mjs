// Optional architecture contract check: layer dependency direction, module public
// contracts and forbidden external imports. Technology-free: it only reads import
// specifiers (JS/TS and Python) and maps them to the paths the project declares.
// Best effort, stated honestly: static import forms are read from code (not from comments or strings); computed
// imports (variables, template strings), aliases (`@/x`, tsconfig paths) and regex literals containing quotes are not resolved.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../lib/schema-lite.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA = JSON.parse(readFileSync(join(here, "..", "..", "contracts", "architecture.schema.json"), "utf8"));
const SOURCE = /\.(?:mjs|cjs|js|jsx|ts|tsx|py)$/;
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "__pycache__", ".venv"]);
const norm = (p) => p.replaceAll(String.fromCharCode(92), "/").replace(/^\.\//, "").replace(/\/+$/, "");
const noExt = (p) => p.replace(/\.(?:mjs|cjs|js|jsx|ts|tsx|py)$/, "");
const under = (file, dir) => ((file = noExt(file)), (dir = noExt(dir)), file === dir || file.startsWith(`${dir}/`));

/**
 * Blanks comments and string contents (keeping quotes, newlines and offsets) so that import-like text inside a comment,
 * docstring or string literal is never read as an import. Single linear pass. Strings that carry an import path are
 * recovered from the original text by position, so only the code structure is taken from the blanked copy.
 */
function blank(text, py) {
  const out = text.split("");
  const n = text.length;
  const wipe = (from, to) => { for (let k = from; k < to; k++) if (out[k] !== "\n" && out[k] !== "\r") out[k] = " "; };
  let i = 0;
  while (i < n) {
    const c = text[i];
    if (py ? c === "#" : c === "/" && text[i + 1] === "/") {
      const e = text.indexOf("\n", i);
      const stop = e < 0 ? n : e;
      wipe(i, stop);
      i = stop;
    } else if (!py && c === "/" && text[i + 1] === "*") {
      const e = text.indexOf("*/", i + 2);
      const stop = e < 0 ? n : e + 2;
      wipe(i, stop);
      i = stop;
    } else if (c === '"' || c === "'" || (!py && c === "`")) {
      const triple = py && text.startsWith(c.repeat(3), i);
      const q = triple ? c.repeat(3) : c;
      let j = i + q.length;
      while (j < n && !text.startsWith(q, j)) {
        if (text[j] === "\\") j++;
        else if (!triple && c !== "`" && text[j] === "\n") break;
        j++;
      }
      // keep the delimiters, blank the body; import paths are read back from the original at the same offsets
      for (let k = i + q.length; k < Math.min(j, n); k++) if (out[k] !== "\n" && out[k] !== "\r") out[k] = " ";
      i = Math.min(j + q.length, n);
    } else i++;
  }
  return out.join("");
}

const lineAt = (text, index) => text.slice(0, index).split("\n").length;

/**
 * Import specifiers of one file: [{ spec, line, py? }]. Best effort, not a proof: it reads the static forms below from
 * code (never from comments or strings) and does not resolve computed imports.
 *   JS/TS: import ... from "x" (also multi-line, "import type", "export ... from"), import "x", require("x"), import("x")
 *   Python: import a.b, c as d | from a.b import c, d | from a import (b, c) | multi-line and backslash continuations | ;-separated
 */
export function importsOf(file, text) {
  const js = /\.(?:mjs|cjs|js|jsx|ts|tsx)$/.test(file);
  const code = blank(text, !js);
  const out = [];
  if (js) {
    // quotes survive in the blanked copy; the path is read from the original at the same offsets
    const pathAt = (quoteIndex) => {
      const q = text[quoteIndex];
      const e = text.indexOf(q, quoteIndex + 1);
      return e < 0 ? null : text.slice(quoteIndex + 1, e);
    };
    for (const m of code.matchAll(/\b(?:import|export)\b([^;'"]{0,2000}?)\bfrom\s*(["'])/g)) {
      const at = m.index + m[0].length - 1;
      const spec = pathAt(at);
      if (spec !== null) out.push({ spec, line: lineAt(code, m.index) });
    }
    for (const m of code.matchAll(/\bimport\s*(["'])/g)) {
      const at = m.index + m[0].length - 1;
      const spec = pathAt(at);
      if (spec !== null) out.push({ spec, line: lineAt(code, m.index) });
    }
    for (const m of code.matchAll(/\b(?:require|import)\s*\(\s*(["'])/g)) {
      const at = m.index + m[0].length - 1;
      const spec = pathAt(at);
      if (spec !== null) out.push({ spec, line: lineAt(code, m.index) });
    }
    return out.sort((a, b) => a.line - b.line);
  }
  const flat = code.replace(/;/g, "\n");
  // \x5c is a backslash: a line continuation inside a Python import list
  const names = (list) => list.replace(/\x5c\r?\n/g, " ").replace(/[()]/g, " ").split(",").map((x) => x.trim().split(/\s+as\s+/)[0].trim()).filter((x) => /^[\w.]+$/.test(x));
  for (const m of flat.matchAll(/^[ \t]*from[ \t]+(\.*[\w.]*)[ \t]*\x5c?[ \t]+import[ \t]*(\([^)]*\)|(?:[^\n\x5c]|\x5c\r?\n)*)/gm)) {
    const line = lineAt(flat, m.index);
    const base = m[1];
    const listed = names(m[2]).filter((x) => x !== "*");
    const join = (name) => (/^\.+$/.test(base) ? base + name : base + "." + name);
    if (listed.length) for (const name of listed) out.push({ spec: join(name), line, py: true });
    else out.push({ spec: base, line, py: true });
  }
  for (const m of flat.matchAll(/^[ \t]*import[ \t]+((?:[^\n\x5c]|\x5c\r?\n)+)/gm)) {
    const line = lineAt(flat, m.index);
    for (const name of names(m[1])) out.push({ spec: name, line, py: true });
  }
  return out.sort((a, b) => a.line - b.line);
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
          const bare = (imp.py ? imp.spec.replaceAll(".", "/") : imp.spec).replace(/^node:/, "");
          const internal = dest !== null && (longest(dest, layers) || longest(dest, modules));
          if (!internal && (bare === banned || bare.startsWith(`${banned}/`))) {
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
      // the directory entry type already says symlink or not: no separate check that could race with the read
      if (entry.isSymbolicLink()) continue;
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
