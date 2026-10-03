// M3.5: PAR-DOC-DRIFT + PAR-CANONICAL-SOURCE (CIR-14 / DOC-01).
//
// TEMPLATE v2.0.5 documented behavior in ~55 prose docs with nothing
// checking them against the code, so docs and code drifted apart (the 13
// inherited doc<->code contradictions M3.5 reconciles). This module is
// the always-on check that keeps the authoritative docs honest:
//   - DRIFT-PATH: a repo-relative path a doc points at must exist (an
//                 extensionless module reference resolves to its .mjs).
//   - DRIFT-PAR:  a PAR-* id a doc cites must be registered in
//                 parity/par-tests.json.
//   - DRIFT-CMD:  a `node <script>.mjs` command a doc shows must exist.
// And the canonical-source rules (one source per fact):
//   - every skill in .agents/skills/registry.json has a directory with a
//     SKILL.md whose frontmatter `name` equals its id, and vice versa;
//   - no other SKILL.md in the repo (outside legacy/, frozen by design)
//     redeclares a canonical skill name (the former factory-*/project-*
//     duplicated pair).
// Pure node: builtins only, read-only, never executes anything it reads.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

// Docs that state how the repo works today. Frozen/historical material
// (legacy/, governance/ history, specs/, parity/ generated maps) is
// deliberately not checked: it describes the past, not current behavior.
const DOC_GLOBS = [
  "AGENTS.md",
  "CLAUDE.md",
  "OPENCLAW.md",
  "README.md",
  "core/kernel.md",
  "core/constitution.md",
  "core/roles/*.md",
  "contracts/*.md",
  ".agents/prompts/*.md",
  ".agents/skills/*/SKILL.md",
];

const ROOTS = [
  ".agents", "core", "contracts", "runtime", "governance", "parity",
  "profiles", "mcp", "evaluation", "scripts", "foundation", "knowledge", "template",
];
const PATH_RE = new RegExp(
  "(?<![\\w./-])((?:" + ROOTS.map((r) => r.replace(".", "\\.")).join("|") + ")/[\\w./-]*[\\w])",
  "g",
);
const PAR_RE = /\bPAR-[A-Z0-9][A-Z0-9-]*[A-Z0-9]\b/g;
const CMD_RE = /\bnode\s+((?:[\w.-]+\/)*[\w.-]+\.mjs)\b/g;
// A script a doc tells the reader to run must exist. `bootstrap.ps1` is the v2-era name that the node CLI replaced.
const PS1_RE = /(?<![\w./-])((?:[\w.-]+\/)*[\w.-]+\.ps1)\b/g;

const trackedCache = new Map(); // per repo root: the list is never shared across roots
function scriptExists(repoRoot, s) {
  if (existsSync(join(repoRoot, s))) return true;
  // a bare name matches any tracked file with that basename (docs say `status-lib.ps1`, the file lives under scripts/)
  if (!trackedCache.has(repoRoot)) {
    const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split("\n").map((f) => f.trim());
    trackedCache.set(repoRoot, files.filter((f) => !f.startsWith("legacy/"))); // the legacy v2 baseline still ships a bootstrap.ps1: it must not hide drift
  }
  return trackedCache.get(repoRoot).some((f) => f === s || f.endsWith(`/${s}`));
}

function expandDocs(repoRoot) {
  const out = [];
  for (const pattern of DOC_GLOBS) {
    const parts = pattern.split("/");
    const walk = (dir, i) => {
      if (i === parts.length) return;
      const abs = join(repoRoot, dir);
      if (i === parts.length - 1) {
        if (!parts[i].includes("*")) {
          if (existsSync(join(abs, parts[i]))) out.push(join(dir, parts[i]));
          return;
        }
        if (!existsSync(abs)) return;
        const re = new RegExp("^" + parts[i].replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
        for (const name of readdirSync(abs)) {
          if (re.test(name) && statSync(join(abs, name)).isFile()) out.push(join(dir, name));
        }
        return;
      }
      if (!parts[i].includes("*")) return walk(join(dir, parts[i]), i + 1);
      if (!existsSync(abs)) return;
      for (const name of readdirSync(abs)) {
        if (statSync(join(abs, name)).isDirectory()) walk(join(dir, name), i + 1);
      }
    };
    walk("", 0);
  }
  return out.map((p) => p.split(sep).join("/"));
}

// Text that is inside a fenced block is still checked: the docs list real
// paths there. Placeholders and globs are not paths and are skipped.
function isConcrete(path) {
  return !/[*<>{}$]/.test(path) && !path.endsWith("/..");
}

export function checkDocDrift(repoRoot) {
  const errors = [];
  const parIds = new Set(
    JSON.parse(readFileSync(join(repoRoot, "parity", "par-tests.json"), "utf8")).tests.map((t) => t.id),
  );
  const docs = expandDocs(repoRoot);
  for (const doc of docs) {
    const text = readFileSync(join(repoRoot, doc), "utf8");
    const seen = new Set();
    const report = (code, subject) => {
      const key = `${code}:${subject}`;
      if (seen.has(key)) return;
      seen.add(key);
      errors.push(`${code}: ${doc} references ${subject}`);
    };
    const cmds = new Set([...text.matchAll(CMD_RE)].map((m) => m[1]));
    for (const m of text.matchAll(PATH_RE)) {
      const p = m[1].replace(/[.,;:]+$/, "");
      if (cmds.has(p)) continue; // reported once, as DRIFT-CMD
      if (isConcrete(p) && !existsSync(join(repoRoot, p)) && !existsSync(join(repoRoot, p + ".mjs"))) report("DRIFT-PATH", `missing path ${p}`);
    }
    for (const m of text.matchAll(PAR_RE)) {
      if (!parIds.has(m[0])) report("DRIFT-PAR", `unregistered ${m[0]}`);
    }
    for (const m of text.matchAll(PS1_RE)) {
      if (isConcrete(m[1]) && !scriptExists(repoRoot, m[1])) report("DRIFT-SCRIPT", `missing script ${m[1]}`);
    }
    for (const c of cmds) {
      if (isConcrete(c) && !existsSync(join(repoRoot, c))) report("DRIFT-CMD", `missing script ${c}`);
    }
  }
  return { errors, docsChecked: docs.length };
}

function frontmatterName(text) {
  const m = /^---\r?\nname:\s*(.+?)\r?\n/.exec(text);
  return m ? m[1].trim() : null;
}

function findSkillFiles(dir, repoRoot, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "legacy"].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) findSkillFiles(full, repoRoot, out);
    else if (entry.name === "SKILL.md") out.push(relative(repoRoot, full).split(sep).join("/"));
  }
  return out;
}

export function checkCanonicalSource(repoRoot) {
  const errors = [];
  const skillsDir = join(repoRoot, ".agents", "skills");
  const registry = JSON.parse(readFileSync(join(skillsDir, "registry.json"), "utf8"));
  const registered = new Set(registry.skills.map((s) => s.id));

  for (const id of registered) {
    const file = join(skillsDir, id, "SKILL.md");
    if (!existsSync(file)) {
      errors.push(`CANONICAL-SKILL: registry id ${id} has no .agents/skills/${id}/SKILL.md`);
      continue;
    }
    const name = frontmatterName(readFileSync(file, "utf8"));
    if (name !== id) errors.push(`CANONICAL-SKILL: .agents/skills/${id}/SKILL.md frontmatter name is ${name}, expected ${id}`);
  }
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (entry.isDirectory() && !registered.has(entry.name)) {
      errors.push(`CANONICAL-SKILL: .agents/skills/${entry.name}/ is not declared in registry.json`);
    }
  }
  for (const file of findSkillFiles(repoRoot, repoRoot)) {
    if (file.startsWith(".agents/skills/")) continue;
    const name = frontmatterName(readFileSync(join(repoRoot, file), "utf8"));
    if (name && registered.has(name.replace(/^(factory|project)-/, ""))) {
      errors.push(`CANONICAL-DUPLICATE: ${file} redeclares canonical skill ${name}`);
    }
  }
  return { errors };
}
