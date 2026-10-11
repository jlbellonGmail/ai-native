// Optional architecture contract check: layer dependency direction, module public
// contracts and forbidden external imports. Technology-free: it only reads import
// specifiers (JS/TS and Python) and maps them to the paths the project declares.
// Best effort, stated honestly: static import forms are read from code (not from comments, strings or regex literals);
// computed imports (variables, templates with ${}), aliases (`@/x`, tsconfig paths) and __import__/importlib are not resolved.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../lib/schema-lite.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA = JSON.parse(readFileSync(join(here, "..", "..", "contracts", "architecture.schema.json"), "utf8"));
const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
const SOURCE = /\.(?:mjs|cjs|js|jsx|ts|tsx|py)$/;
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "__pycache__", ".venv"]);
const norm = (p) => p.replaceAll(String.fromCharCode(92), "/").replace(/^\.\//, "").replace(/\/+$/, "");
const noExt = (p) => p.replace(/\.(?:mjs|cjs|js|jsx|ts|tsx|py)$/, "");
const under = (file, dir) => ((file = noExt(file)), (dir = noExt(dir)), file === dir || file.startsWith(`${dir}/`));

const BACKSLASH = "\x5c";
// After these a "/" starts a regex literal. Deliberately absent: ")" "]" "}" (division or end of block), "<" ">" (JSX closing
// tags like </div>, comparisons) and "+" "-" (handled below: "i++ / 2" divides, "a + /x/.test(s)" is a regex).
const REGEX_AFTER = new Set(["", "(", ",", "=", ":", "[", "!", "&", "|", "?", "{", ";", "*", "%", "~", "^"]);
const regexAllowed = (prev, prev2, tail) =>
  REGEX_AFTER.has(prev) || ((prev === "+" || prev === "-") && prev2 !== prev) || (prev === ">" && prev2 === "=") || REGEX_KEYWORDS.test(tail.trimEnd());
const REGEX_KEYWORDS = /(?:^|[^\w$])(?:return|typeof|case|do|else|in|of|instanceof|new|delete|void|throw|yield|await)$/;

/**
 * Blanks comments and string/regex/template text (keeping delimiters, newlines and offsets) so import-like text inside
 * them is never read as an import. Code inside template `${...}` stays visible. Single linear pass; a quote that is
 * never closed on its line only damages that line (strings stop at a newline), and an unterminated template or block
 * comment makes the caller fall back to the unblanked text (over-report, never under-report).
 * @returns {{text:string, clean:boolean}}
 */
function blank(text, py) {
  const out = text.split("");
  const n = text.length;
  const wipe = (from, to) => { for (let k = from; k < to; k++) if (out[k] !== "\n" && out[k] !== "\r") out[k] = " "; };
  const stack = []; // JS: open `${` expressions, each with its brace depth
  let clean = true;
  let prev = ""; // last significant character, decides regex vs division
  let prev2 = ""; // the one before it ("++" and "=>" differ from "+" and ">")
  let tail = ""; // last word, for `return /x/`
  let i = 0;
  const template = (from) => {
    // scans template text from `from` (after a backtick or a closing `}`); returns index to continue code scanning at
    let j = from;
    while (j < n) {
      if (text[j] === BACKSLASH) j += 2;
      else if (text[j] === "`") { wipe(from, j); return j + 1; }
      else if (text[j] === "$" && text[j + 1] === "{") { wipe(from, j); stack.push(0); return j + 2; }
      else j++;
    }
    wipe(from, n);
    clean = false;
    return n;
  };
  while (i < n) {
    const c = text[i];
    if (py ? c === "#" : c === "/" && text[i + 1] === "/") {
      const e = text.indexOf("\n", i);
      const stop = e < 0 ? n : e;
      wipe(i, stop);
      i = stop;
    } else if (!py && c === "/" && text[i + 1] === "*") {
      const e = text.indexOf("*/", i + 2);
      if (e < 0) clean = false;
      const stop = e < 0 ? n : e + 2;
      wipe(i, stop);
      i = stop;
    } else if (!py && c === "/" && regexAllowed(prev, prev2, tail)) {
      // regex literal: body up to the closing slash on the same line, `[...]` may contain slashes
      let j = i + 1;
      let inClass = false;
      while (j < n && text[j] !== "\n") {
        if (text[j] === BACKSLASH) j++;
        else if (text[j] === "[") inClass = true;
        else if (text[j] === "]") inClass = false;
        else if (text[j] === "/" && !inClass) break;
        j++;
      }
      wipe(i + 1, Math.min(j, n));
      i = Math.min(j + 1, n);
      prev2 = prev;
      prev = "/";
      tail = "";
    } else if (!py && c === "`") {
      i = template(i + 1);
      prev2 = prev;
      prev = "`";
      tail = "";
    } else if (c === '"' || c === "'") {
      const triple = py && text.startsWith(c.repeat(3), i);
      const q = triple ? c.repeat(3) : c;
      let j = i + q.length;
      while (j < n && !text.startsWith(q, j)) {
        if (text[j] === BACKSLASH) j++;
        else if (!triple && text[j] === "\n") break;
        j++;
      }
      if (j >= n && triple) clean = false;
      wipe(i + q.length, Math.min(j, n));
      i = Math.min(j + q.length, n);
      prev2 = prev;
      prev = c;
      tail = "";
    } else {
      if (!py && stack.length) {
        if (c === "{") stack[stack.length - 1]++;
        else if (c === "}") {
          if (stack[stack.length - 1] === 0) { stack.pop(); i = template(i + 1); prev2 = prev; prev = "`"; tail = ""; continue; }
          stack[stack.length - 1]--;
        }
      }
      if (!/\s/.test(c)) {
        prev2 = prev;
        prev = c;
        tail = /[\w$]/.test(c) ? tail + c : "";
        if (tail.length > 12) tail = tail.slice(-12);
      } else if (tail) tail += " ";
      i++;
    }
  }
  if (stack.length) clean = false;
  return { text: clean ? out.join("") : text, clean };
}

/** Line number of an offset, by binary search over precomputed line starts (no per-match rescans). */
function lineIndex(text) {
  const starts = [0];
  for (let i = text.indexOf("\n"); i >= 0; i = text.indexOf("\n", i + 1)) starts.push(i + 1);
  return (index) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

/**
 * Import specifiers of one file: [{ spec, line, py? }]. Best effort, not a proof: it reads the static forms below from
 * code (never from comments, strings or regex literals) and does not resolve computed imports.
 *   JS/TS: import ... from "x" (also multi-line, "import type", "export ... from"), import "x", require("x"), import("x")
 *          (a constant template literal counts; one with ${} is computed)
 *   Python: import a.b, c as d | from a.b import c, d | from a import (b, c) | multi-line and backslash continuations
 *          | ;-separated | after `if x:`/`else:`/`try:` on the same line
 */
export function importsOf(file, text) {
  const js = /\.(?:mjs|cjs|js|jsx|ts|tsx)$/.test(file);
  const { text: code } = blank(text, !js);
  const lineAt = lineIndex(code);
  const out = [];
  if (js) {
    const pathAt = (quoteIndex) => {
      const q = text[quoteIndex];
      const e = text.indexOf(q, quoteIndex + 1);
      if (e < 0) return null;
      const spec = text.slice(quoteIndex + 1, e);
      return q === "`" && spec.includes("${") ? null : spec;
    };
    const take = (re) => {
      for (const m of code.matchAll(re)) {
        const spec = pathAt(m.index + m[0].length - 1);
        if (spec !== null) out.push({ spec, line: lineAt(m.index) });
      }
    };
    // `from "x"` preceded, within the same statement, by import/export. Walking back from each `from "` stops at the
    // previous quote or `;`, so the total work is linear (a forward lazy scan from every `import` token was quadratic).
    for (const m of code.matchAll(/\bfrom\s*["'`]/g)) {
      let k = m.index - 1;
      const floor = Math.max(0, m.index - 1000);
      while (k >= floor && !";'\"`".includes(code[k])) k--;
      if (!/\b(?:import|export)\b/.test(code.slice(k + 1, m.index))) continue;
      const spec = pathAt(m.index + m[0].length - 1);
      if (spec !== null) out.push({ spec, line: lineAt(m.index) });
    }
    take(/\bimport\s*["'`]/g);
    take(/\b(?:require|import)\s*\(\s*["'`]/g);
    return out.sort((a, b) => a.line - b.line);
  }
  // a backslash-newline is a line continuation: blank it (same length, so offsets and line numbers hold) and a statement is one logical line
  const flat = code.replace(/;/g, "\n").replace(/\x5c\r?\n/g, (m) => " ".repeat(m.length));
  const names = (list) => list.replace(/[()]/g, " ").split(",").map((x) => x.trim().split(/\s+as\s+/)[0].trim()).filter((x) => /^[\w.]+$/.test(x));
  const lead = String.raw`^[ \t]*(?:[^\n=()\[\]{}'"]*:[ \t]*)?`;
  const fromRe = new RegExp(lead + String.raw`from[ \t]+(\.*[\w.]*)[ \t]+import[ \t]*(\([^)]*\)|[^\n]*)`, "gm");
  const importRe = new RegExp(lead + String.raw`import[ \t]+([^\n]+)`, "gm");
  for (const m of flat.matchAll(fromRe)) {
    const line = lineAt(m.index);
    const base = m[1];
    const listed = names(m[2]).filter((x) => x !== "*");
    const join = (name) => (/^\.+$/.test(base) ? base + name : base + "." + name);
    if (listed.length) for (const name of listed) out.push({ spec: join(name), line, py: true });
    else out.push({ spec: base, line, py: true });
  }
  for (const m of flat.matchAll(importRe)) {
    const line = lineAt(m.index);
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
    if (text.length > MAX_SOURCE_BYTES) {
      violations.push({ rule: "unanalyzable", file, message: `source larger than ${MAX_SOURCE_BYTES} bytes is not analyzed (generated or minified?): exclude it or split it` });
      continue;
    }
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
