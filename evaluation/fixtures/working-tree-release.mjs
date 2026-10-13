// Test helper: a release bundle built from the WORKING TREE (what `build.mjs` builds from a commit), so tests exercise code that is not
// committed yet. Same shipped-path rules as the real build (runtime/release/bundle.mjs), a fabricated platform.json.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { isShipped } from "../../runtime/release/bundle.mjs";
import { writeTar } from "../../runtime/bootstrap/tar.mjs";
import { sha256 } from "../../runtime/bootstrap/cache.mjs";

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function workingTreeRelease({ version = "v9.9.9", commit = "c".repeat(40), mutate = (files) => files } = {}) {
  const ls = spawnSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const entries = {};
  for (const path of ls.stdout.split("\0").filter(Boolean)) if (isShipped(path)) entries[path] = readFileSync(join(REPO_ROOT, path));
  entries["platform.json"] = `${JSON.stringify({ schemaVersion: 1, version, commit, digest: `sha256:${"0".repeat(64)}`, generatedAt: "2026-10-13T00:00:00Z", components: { "unit-event": { version: "1" } }, capabilities: [] }, null, 2)}\n`;
  const bytes = gzipSync(writeTar(mutate(entries)));
  return { bytes, digest: `sha256:${sha256(bytes)}`, version, commit };
}

export const record = (rel, repo = "o/ai-native") => ({ digest: rel.digest, repo, version: rel.version, verifiedBy: "gh attestation verify", verifiedAt: "2026-10-13T00:00:00.000Z" });
