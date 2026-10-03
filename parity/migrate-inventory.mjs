#!/usr/bin/env node
// M1.2 (governance/roadmaps/AI-NATIVE-V3-ROADMAP.md): `migrate --inventory`.
// Read-only classification of a consumer repository's files against the
// Hash DB (parity/hash-db/hash-db.json). Never writes inside the target;
// with --out it writes only the report JSON, to a path of the caller's
// choosing (never inside --target). This is the "inventario" step of the
// Contrato de Paridad migration model (ADR-002 / DIS-02, DIS-03): it only
// classifies, it never copies, deletes, or modifies anything. `--apply` is
// out of scope here and belongs to a later phase (M4/M6), once a real
// migration plan exists.
//
// Classification per file (relative path from --target):
//   IDENTICAL_TO_TEMPLATE(vX[,vY...]) — sha256 matches that tag at the same path
//   MODIFIED_FROM_TEMPLATE(vX[,vY...]) — path exists in that tag, content differs
//   LOCAL — path does not exist in any tag's Hash DB
//   DUPLICATED_CAPABILITY — LOCAL, but matches a known capability-overlap
//     heuristic (see DUPLICATE_CAPABILITY_HINTS below); always a candidate
//     for human/agent review, never auto-resolved here.
//   UNKNOWN — classification itself failed (e.g. unreadable file); should
//     stay empty in practice and is reported as an error, not silently
//     dropped.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative, resolve } from "node:path";
import { RESULT_STATUS, statusFromCounts, exitCodeFor, formatLine } from "../runtime/lib/result.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith("--")) return process.argv[idx + 1];
  return fallback;
}
function flag(name) {
  return process.argv.includes(`--${name}`);
}

const targetArg = arg("target", null);
if (!targetArg) {
  console.error("Usage: node parity/migrate-inventory.mjs --target <path> [--out <report.json>] [--json] [--hash-db <path>]");
  process.exit(2);
}
const target = resolve(targetArg);
const outPath = arg("out", null);
const jsonOutput = flag("json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Same normalization as build-hash-db.mjs: hash CRLF-normalized-to-LF
// content for text files, so a consumer's local core.autocrlf setting
// never produces a false MODIFIED_FROM_TEMPLATE. Binary files are hashed
// as-is (null-byte heuristic in the first 8000 bytes, matching git's own).
function isBinary(buffer) {
  return buffer.subarray(0, 8000).includes(0);
}
function normalizedSha256(buffer) {
  const content = isBinary(buffer) ? buffer : Buffer.from(buffer.toString("utf8").replace(/\r\n/g, "\n"));
  return createHash("sha256").update(content).digest("hex");
}

assert(existsSync(target) && statSync(target).isDirectory(), `--target does not exist or is not a directory: ${target}`);

// --- Hash DB ---
const hashDbPath = resolve(arg("hash-db", join(here, "hash-db", "hash-db.json")));
assert(existsSync(hashDbPath), `Hash DB not found at ${hashDbPath}; run parity/hash-db/build-hash-db.mjs first`);
const hashDb = JSON.parse(readFileSync(hashDbPath, "utf8"));
const tagOrder = Object.keys(hashDb.tags); // v2.0.0 .. v2.0.5, in that order

// path -> sha256 -> [tags]
const byPath = new Map();
for (const tag of tagOrder) {
  for (const [path, sha] of Object.entries(hashDb.tags[tag].files)) {
    if (!byPath.has(path)) byPath.set(path, new Map());
    const shaMap = byPath.get(path);
    if (!shaMap.has(sha)) shaMap.set(sha, []);
    shaMap.get(sha).push(tag);
  }
}

// --- Preflight (read-only; never aborts, only reports) ---
function gitMaybe(args) {
  try {
    return execFileSync("git", args, { cwd: target, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

const isGitRepo = gitMaybe(["rev-parse", "--is-inside-work-tree"]) === "true";
const porcelain = isGitRepo ? gitMaybe(["status", "--porcelain"]) : null;
const preflight = {
  isGitRepo,
  clean: isGitRepo ? (porcelain === "" || porcelain === null && false) : null,
};
if (isGitRepo) preflight.clean = (porcelain ?? "") === "";

// in-flight ROADMAP items ([-])
let inFlightItems = [];
const roadmapPath = join(target, "ROADMAP.md");
if (existsSync(roadmapPath)) {
  const text = readFileSync(roadmapPath, "utf8");
  inFlightItems = [...text.matchAll(/^- \[-\] (\S+)/gm)].map((m) => m[1]);
}
preflight.inFlightRoadmapItems = inFlightItems;

// worktrees (informational)
preflight.worktrees = isGitRepo ? (gitMaybe(["worktree", "list", "--porcelain"]) ?? "").split("\n\n").filter(Boolean).length : null;

// declared template version
let declaredVersion = null;
let manifestSchemaVersion = null;
const manifestPath = join(target, "scripts", "template-starter-manifest.json");
if (existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifestSchemaVersion = manifest.schemaVersion ?? null;
    declaredVersion = manifest.templateVersion ?? null;
  } catch {
    // malformed manifest; leave both null, report via preflight
    preflight.manifestParseError = true;
  }
}

// --- Walk target, skipping .git and other noise ---
const SKIP_DIRS = new Set([".git", "node_modules", ".venv", "__pycache__", ".pytest_cache", ".next", "dist", "build", "coverage"]);

function walk(dir, results = [], unreadable = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    // Locked/permission-denied directories (e.g. a leftover pytest temp dir
    // under antivirus lock) must not crash a read-only inventory; report
    // and skip instead.
    unreadable.push({ dir, error: error.message });
    return results;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, results, unreadable);
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

// Known capability-overlap hints: a LOCAL file at one of these relative
// paths is flagged DUPLICATED_CAPABILITY for human/agent review, because it
// plausibly duplicates something the platform centralizes (Contrato de
// Paridad AGT-05 skills, AGT-08 MCP catalog, GOV-07 domain rules).
const DUPLICATE_CAPABILITY_HINTS = [
  { test: (p) => p === ".mcp.json", reason: "MCP server config — platform centralizes this as mcp/catalog.json + profiles (AGT-08)" },
  { test: (p) => p.startsWith(".claude/skills/") || p.startsWith(".agents/skills/") || p.startsWith(".opencode/skills/"), reason: "local skill — platform centralizes skills with lazy loading (AGT-05)" },
  { test: (p) => p.startsWith(".claude/rules/") && p !== ".claude/rules/README.md" && p !== ".claude/rules/.gitkeep", reason: "domain rule — candidate for a pack or the AGENTS.md local section (GOV-07)" },
];

const unreadableDirs = [];
const files = walk(target, [], unreadableDirs);
const classified = [];
const counts = { IDENTICAL_TO_TEMPLATE: 0, MODIFIED_FROM_TEMPLATE: 0, LOCAL: 0, DUPLICATED_CAPABILITY: 0, UNKNOWN: 0 };
const errors = [];

for (const abs of files) {
  const rel = relative(target, abs).split("\\").join("/");
  try {
    const content = readFileSync(abs);
    const sha = normalizedSha256(content);
    const shaMap = byPath.get(rel);

    let classification;
    let matchedTags = [];
    if (shaMap && shaMap.has(sha)) {
      classification = "IDENTICAL_TO_TEMPLATE";
      matchedTags = shaMap.get(sha);
    } else if (shaMap) {
      classification = "MODIFIED_FROM_TEMPLATE";
      matchedTags = [...new Set([...shaMap.values()].flat())];
    } else {
      const hint = DUPLICATE_CAPABILITY_HINTS.find((h) => h.test(rel));
      classification = hint ? "DUPLICATED_CAPABILITY" : "LOCAL";
    }

    counts[classification] += 1;
    const entry = { path: rel, classification, sha256: sha };
    if (matchedTags.length) entry.matchedTags = matchedTags;
    const hint = DUPLICATE_CAPABILITY_HINTS.find((h) => h.test(rel));
    if (classification === "DUPLICATED_CAPABILITY" && hint) entry.reason = hint.reason;
    classified.push(entry);
  } catch (error) {
    counts.UNKNOWN += 1;
    errors.push(`${rel}: ${error.message}`);
    classified.push({ path: rel, classification: "UNKNOWN", error: error.message });
  }
}

const report = {
  schemaVersion: 1,
  generatedBy: "parity/migrate-inventory.mjs",
  generatedAt: new Date().toISOString(),
  target,
  hashDbTags: tagOrder,
  declaredVersion,
  manifestSchemaVersion,
  preflight,
  totalFiles: files.length,
  counts,
  unreadableDirs,
  files: classified,
};

const warningCount = (!preflight.clean ? 1 : 0) + (inFlightItems.length > 0 ? 1 : 0) + unreadableDirs.length;
const status = statusFromCounts({ errors: counts.UNKNOWN, warnings: warningCount });

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`migrate --inventory: ${formatLine(status, { errors: counts.UNKNOWN, warnings: warningCount })}`);
  console.log(`  target: ${target}`);
  console.log(`  declaredVersion: ${declaredVersion ?? "(none declared)"} (manifest schemaVersion: ${manifestSchemaVersion ?? "n/a"})`);
  console.log(`  git: clean=${preflight.clean}, inFlightRoadmapItems=${inFlightItems.length}`);
  console.log(`  totalFiles: ${files.length}`);
  for (const [k, v] of Object.entries(counts)) console.log(`    ${k}: ${v}`);
  if (unreadableDirs.length) {
    console.log("  unreadableDirs (skipped, not counted in totalFiles):");
    for (const u of unreadableDirs) console.log(`    - ${u.dir}: ${u.error}`);
  }
  if (errors.length) {
    console.log("  errors:");
    for (const e of errors) console.log(`    - ${e}`);
  }
}

if (outPath) {
  writeFileSync(resolve(outPath), JSON.stringify(report, null, 2) + "\n", "utf8");
  if (!jsonOutput) console.log(`  report written to ${resolve(outPath)}`);
}

// exitCode, not process.exit(): with stdout on a pipe (Linux) process.exit() truncates output larger than the pipe buffer.
process.exitCode = exitCodeFor(status, { strict: false });
