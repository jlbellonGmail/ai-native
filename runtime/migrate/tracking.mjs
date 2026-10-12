// A file ai-native manages in a consumer must belong to the state a clean clone gets, not only to the working tree
// that ran the adoption (v3.1.2; the gi-clinicadental escape: a local .gitignore hid two projected files, `git add -A`
// skipped them and every gate read the working tree).
// The managed set is exactly what ai-native recorded it wrote (adoption + migration journals, the lock, the journals):
// no "everything must be tracked" rule, no opinion on files the project keeps or ignores for itself.
//   IGNORED     present, not tracked, and a .gitignore rule hides it   -> `git add -A` will never take it
//   UNTRACKED   present, not tracked, not ignored                      -> not staged yet
//   ABSENT      not in the committed/staged state and not on disk      -> what a clean clone looks like
//   DIVERGENT   in the state but the working tree differs from it      -> the validated tree is not what a clone gets
// `source: "index"` (default) judges what `git add` has staged = what the next commit, and so a clean clone of the PR, has;
// `source: "head"` judges the last commit. Line endings are not a difference (core.autocrlf).
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { normalizedSha } from "./adopt.mjs";
import { ADOPTION_JOURNAL, MIGRATION_JOURNAL, readOwnership } from "./journals.mjs";

const git = (cwd, args, input) => spawnSync("git", args, { cwd, input, maxBuffer: 256 * 1024 * 1024 });
const lines = (buf) => buf.toString("utf8").split("\0").filter(Boolean);

/** { path: reason } of everything ai-native owns in `root`. */
export function managedPaths(root) {
  const own = readOwnership(root);
  const out = {};
  for (const rel of Object.keys(own.created)) out[rel] = "adoption journal (created)";
  for (const rel of Object.keys(own.adopted)) out[rel] = "adoption journal (adopted)";
  for (const rel of Object.keys(own.migrationCreated)) out[rel] ??= "migration journal";
  if (existsSync(join(root, "ai-native.lock.json"))) out["ai-native.lock.json"] ??= "lock";
  for (const [flag, rel] of [[own.hasAdoption, ADOPTION_JOURNAL], [own.hasMigration, MIGRATION_JOURNAL]]) if (flag) out[rel] ??= "journal";
  return out;
}

/** Paths a .gitignore rule would hide, among `paths` (batched; `--no-index` so tracked files are judged by the rules too). */
function ignoredAmong(root, paths) {
  if (!paths.length) return new Set();
  const r = git(root, ["check-ignore", "-z", "--no-index", "--stdin"], paths.join("\0"));
  // exit 1 = none ignored; anything else non-zero is a real error
  if (r.status !== 0 && r.status !== 1) throw new Error(`git check-ignore failed: ${r.stderr}`);
  return new Set(lines(r.stdout));
}

/** { path: blobId } of the state being judged. */
function stateBlobs(root, source) {
  const args = source === "head" ? ["ls-tree", "-r", "-z", "HEAD"] : ["ls-files", "-s", "-z"];
  const r = git(root, args);
  if (r.status !== 0) {
    // a repository without a commit has an empty committed state
    if (source === "head") return {};
    throw new Error(`git ${args[0]} failed: ${r.stderr}`);
  }
  const blobs = {};
  for (const entry of lines(r.stdout)) {
    const tab = entry.indexOf("\t");
    const meta = entry.slice(0, tab).split(" ");
    // ls-files -s: <mode> <oid> <stage>; ls-tree: <mode> <type> <oid>
    const oid = source === "head" ? meta[2] : meta[1];
    if (source !== "head" && meta[2] !== "0") continue; // a conflicted entry is not a state
    blobs[entry.slice(tab + 1)] = oid;
  }
  return blobs;
}

/** { oid: Buffer } for the blobs asked, in one `git cat-file --batch`. */
function readBlobs(root, oids) {
  const out = {};
  if (!oids.length) return out;
  const r = git(root, ["cat-file", "--batch"], `${oids.join("\n")}\n`);
  if (r.status !== 0) throw new Error(`git cat-file failed: ${r.stderr}`);
  let at = 0;
  const buf = r.stdout;
  for (const oid of oids) {
    const eol = buf.indexOf(0x0a, at);
    const [, type, size] = buf.subarray(at, eol).toString("utf8").split(" ");
    if (type !== "blob") throw new Error(`unexpected git object for ${oid}`);
    out[oid] = buf.subarray(eol + 1, eol + 1 + Number(size));
    at = eol + 1 + Number(size) + 1;
  }
  return out;
}

export function isGitRepo(root) {
  try {
    return execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() === "true";
  } catch {
    return false;
  }
}

/**
 * Read-only. `onlyIgnored` is for the moment right after a command wrote files (nothing is staged yet, so UNTRACKED is
 * expected): it reports only what `git add` can never take.
 * Returns { status: PASS|FAIL|NOT_APPLICABLE, source, managed, ignored[], untracked[], absent[], divergent[], detail }.
 */
export function checkTracking(root, { source = "index", onlyIgnored = false } = {}) {
  const empty = { source, managed: 0, ignored: [], untracked: [], absent: [], divergent: [] };
  if (!isGitRepo(root)) return { status: "NOT_APPLICABLE", ...empty, detail: "not a git repository: tracking cannot be judged" };
  const managed = managedPaths(root);
  const paths = Object.keys(managed).sort();
  const state = stateBlobs(root, source);
  const missing = paths.filter((p) => !(p in state));
  const hidden = ignoredAmong(root, missing.filter((p) => existsSync(join(root, p))));
  const result = { ...empty, managed: paths.length };
  for (const p of missing) {
    if (existsSync(join(root, p))) (hidden.has(p) ? result.ignored : result.untracked).push(p);
    else result.absent.push(p);
  }
  const present = paths.filter((p) => p in state);
  const blobs = readBlobs(root, [...new Set(present.map((p) => state[p]))]);
  for (const p of present) {
    const full = join(root, p);
    if (!existsSync(full) || !statSync(full).isFile()) result.divergent.push(p);
    else if (normalizedSha(readFileSync(full)) !== normalizedSha(blobs[state[p]])) result.divergent.push(p);
  }
  if (onlyIgnored) {
    result.untracked = [];
    result.absent = [];
    result.divergent = [];
  }
  const problems = result.ignored.length + result.untracked.length + result.absent.length + result.divergent.length;
  return { status: problems ? "FAIL" : "PASS", ...result, detail: problems ? describe(result) : `${paths.length} managed file(s) are part of the ${source === "head" ? "committed" : "staged"} state` };
}

export function describe(r) {
  const part = (label, list) => (list.length ? `${label}=[${list.slice(0, 8).join(", ")}${list.length > 8 ? `, +${list.length - 8} more` : ""}]` : "");
  return [part("ignored-by-gitignore", r.ignored), part("untracked", r.untracked), part("absent-from-state", r.absent), part("differs-from-state", r.divergent)].filter(Boolean).join(" ");
}

/** What to do about it, for a human or an agent reading the error. */
export function remedy(r) {
  const steps = [];
  if (r.ignored.length) steps.push("a .gitignore rule hides managed files: add an exception for each (e.g. `!<name>` in the nearest .gitignore) or `git add -f <path>`");
  if (r.untracked.length || r.absent.length) steps.push("`git add` the managed files and commit them");
  if (r.divergent.length) steps.push("stage or revert the edits so the working tree equals what a clean clone gets");
  return steps.join("; ");
}

/** Paths a .gitignore rule hides among `paths` that do NOT exist yet (planning: nothing written, nothing tracked). */
export function wouldBeIgnored(root, paths) {
  if (!isGitRepo(root)) return [];
  const tracked = new Set(lines(git(root, ["ls-files", "-z"]).stdout));
  const candidates = paths.filter((p) => !tracked.has(p));
  const hidden = ignoredAmong(root, candidates);
  return candidates.filter((p) => hidden.has(p)).sort();
}
