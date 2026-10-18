#!/usr/bin/env node
// M1.2 (governance/roadmaps/AI-NATIVE-V3-ROADMAP.md): generates the Hash DB
// used by migrate-inventory.mjs. Read-only against the source TEMPLATE
// checkout: only `git ls-tree` / `git cat-file` are used, nothing is
// written there. Needs a local clone with the vX.Y.Z tags present (default
// `../../../template` relative to this file, i.e. a sibling of ai-native;
// override with --source <path> or the AI_NATIVE_TEMPLATE_SOURCE env var).
//
// sha256 (not git's blob sha1) is used for consistency with the rest of the
// paridad tooling (upgrade-template-consumer.ps1, registry.storage.json).
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const TAGS = ["v2.0.0", "v2.0.1", "v2.0.2", "v2.0.3", "v2.0.4", "v2.0.5", "v2.0.6"];

function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

const sourceRoot = resolve(
  arg("source", process.env.AI_NATIVE_TEMPLATE_SOURCE || join(here, "..", "..", "..", "template")),
);

function git(args, opts = {}) {
  return execFileSync("git", args, { cwd: sourceRoot, encoding: "utf8", maxBuffer: 1024 * 1024 * 64, ...opts });
}

function gitBuffer(args) {
  return execFileSync("git", args, { cwd: sourceRoot, maxBuffer: 1024 * 1024 * 64 });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Content is hashed after normalizing CRLF -> LF, for the same reason
// .gitattributes was added to ai-native in M0.2: a checkout's line endings
// depend on each machine's core.autocrlf, not on the content itself, so
// comparing raw bytes across machines produces false "modified" diffs.
// Binary files (detected by a null byte in the first 8000 bytes, matching
// git's own heuristic) are hashed as-is, never normalized.
function isBinary(buffer) {
  const sample = buffer.subarray(0, 8000);
  return sample.includes(0);
}

function normalizedSha256(buffer) {
  const content = isBinary(buffer) ? buffer : Buffer.from(buffer.toString("utf8").replace(/\r\n/g, "\n"));
  return createHash("sha256").update(content).digest("hex");
}

// Preflight: source must be a real, unmodified git checkout with every tag.
assert(git(["rev-parse", "--is-inside-work-tree"]).trim() === "true", `--source ${sourceRoot} is not a git repository`);
for (const tag of TAGS) {
  let sha;
  try {
    sha = git(["rev-list", "-n", "1", tag]).trim();
  } catch {
    throw new Error(`tag ${tag} not found in ${sourceRoot}`);
  }
  assert(/^[0-9a-f]{40}$/.test(sha), `unexpected rev-list output for ${tag}`);
}

const db = { schemaVersion: 1, generatedBy: "parity/hash-db/build-hash-db.mjs", source: sourceRoot, generatedAt: new Date().toISOString(), tags: {} };

let totalFiles = 0;
for (const tag of TAGS) {
  const commit = git(["rev-list", "-n", "1", tag]).trim();
  const fileList = git(["ls-tree", "-r", "--name-only", tag]).split("\n").filter(Boolean);
  const files = {};
  for (const path of fileList) {
    const content = gitBuffer(["show", `${tag}:${path}`]);
    files[path] = normalizedSha256(content);
  }
  db.tags[tag] = { commit, fileCount: fileList.length, files };
  totalFiles += fileList.length;
  console.log(`${tag} (${commit.slice(0, 7)}): ${fileList.length} files hashed`);
}

db.totalFileEntries = totalFiles;

const outPath = join(here, "hash-db.json");
writeFileSync(outPath, JSON.stringify(db, null, 2) + "\n", { encoding: "utf8" });
console.log(`\nwrote ${outPath}: ${TAGS.length} tags, ${totalFiles} file entries total`);
