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
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizedSha, safeJoin } from "./adopt.mjs";
import { ADOPTION_JOURNAL, MIGRATION_JOURNAL, JournalError, parseJournal, readOwnership } from "./journals.mjs";

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

/** true | false (git says: not a repository). Any other git failure (broken GIT_DIR, corrupt repo, git missing) throws: it must not read as "nothing to check". */
export function isGitRepo(root) {
  const r = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: root, encoding: "utf8" });
  if (r.error) throw new Error(`git could not run: ${r.error.message}`);
  if (r.status === 0) return r.stdout.trim() === "true";
  // an explicit GIT_DIR/GIT_WORK_TREE that git rejects is a broken environment, not a directory without a repository
  if (/not a git repository/i.test(r.stderr) && process.env.GIT_DIR === undefined && process.env.GIT_WORK_TREE === undefined) return false;
  throw new Error(`git rev-parse failed: ${r.stderr.trim()}`);
}

/**
 * Read-only. `onlyIgnored` is for the moment right after a command wrote files (nothing is staged yet, so UNTRACKED is
 * expected): it reports only what `git add` can never take.
 * Returns { status: PASS|FAIL|NOT_APPLICABLE, source, managed, ignored[], untracked[], absent[], divergent[], detail }.
 */
export function checkTracking(root, { source = "index", onlyIgnored = false } = {}) {
  const empty = { source, managed: 0, ignored: [], untracked: [], absent: [], divergent: [], unsafe: [] };
  if (!isGitRepo(root)) return { status: "NOT_APPLICABLE", ...empty, detail: "not a git repository: tracking cannot be judged" };
  const managed = managedPaths(root);
  // journals are untrusted input (a PR can edit them): a path that leaves the project is a finding, never something to probe
  const unsafe = [];
  for (const p of Object.keys(managed)) {
    try { safeJoin(root, p); } catch { unsafe.push(p); delete managed[p]; }
  }
  const paths = Object.keys(managed).sort();
  const state = stateBlobs(root, source);
  const missing = paths.filter((p) => !(p in state));
  const hidden = ignoredAmong(root, missing.filter((p) => existsSync(join(root, p))));
  const result = { ...empty, managed: paths.length, unsafe };
  for (const p of missing) {
    if (existsSync(join(root, p))) (hidden.has(p) ? result.ignored : result.untracked).push(p);
    else result.absent.push(p);
  }
  const present = paths.filter((p) => p in state);
  const blobs = readBlobs(root, [...new Set(present.map((p) => state[p]))]);
  for (const p of present) {
    // one read, no check-then-use: a missing file, a directory or an unreadable entry all read as "differs from the state"
    let have = null;
    try { have = readFileSync(join(root, p)); } catch { /* ENOENT, EISDIR, EACCES */ }
    if (have === null || normalizedSha(have) !== normalizedSha(blobs[state[p]])) result.divergent.push(p);
  }
  if (onlyIgnored) {
    result.untracked = [];
    result.absent = [];
    result.divergent = [];
  }
  const problems = result.ignored.length + result.untracked.length + result.absent.length + result.divergent.length + result.unsafe.length;
  return { status: problems ? "FAIL" : "PASS", ...result, detail: problems ? describe(result) : `${paths.length} managed file(s) are part of the ${source === "head" ? "committed" : "staged"} state` };
}

export function describe(r) {
  const part = (label, list) => (list.length ? `${label}=[${list.slice(0, 8).join(", ")}${list.length > 8 ? `, +${list.length - 8} more` : ""}]` : "");
  return [part("ignored-by-gitignore", r.ignored), part("untracked", r.untracked), part("absent-from-state", r.absent), part("differs-from-state", r.divergent), part("UNSAFE_PATH", r.unsafe ?? [])].filter(Boolean).join(" ");
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

/**
 * Persisted-state contract (v3.1.3, N-02b): everything the BASE branch's journals owned must still be owned at HEAD, unless the
 * file left the tree with it (the matching revert, or an upgrade that retires a pristine projection). "Some journal exists" is not
 * the question: deleting one of two journals, or emptying one, kept every other check green.
 * Read-only. { status: PASS|FAIL|NOT_APPLICABLE, lost[], corrupt[], detail }.
 */
export function checkPersistedState(root, { base = null } = {}) {
  const none = { lost: [], corrupt: [] };
  if (!base) return { status: "NOT_APPLICABLE", ...none, detail: "no base ref: there is no earlier state to compare with" };
  if (!isGitRepo(root)) return { status: "NOT_APPLICABLE", ...none, detail: "not a git repository" };
  // a base that cannot be resolved is not "a base without journals": judging nothing would fail open
  if (String(base).startsWith("-") || git(root, ["rev-parse", "--verify", "--quiet", `${base}^{commit}`]).status !== 0) {
    return { status: "FAIL", ...none, detail: `the base ref '${base}' cannot be read in this checkout (shallow clone, unfetched ref): the persisted state cannot be compared and the gate fails closed` };
  }
  const corrupt = [];
  let adoptionBase = null;
  const owned = new Set();
  const released = new Set(); // `adopted` files of an adoption journal that was reverted: pre-existing files the revert deliberately leaves to the project
  for (const rel of [ADOPTION_JOURNAL, MIGRATION_JOURNAL]) {
    const r = git(root, ["cat-file", "blob", `${base}:${rel}`]);
    if (r.status !== 0) continue; // the base never had this journal: nothing to preserve
    owned.add(rel);
    try {
      const j = parseJournal(r.stdout.toString("utf8"), rel);
      const paths = rel === ADOPTION_JOURNAL ? [...Object.keys(j.created ?? {}), ...Object.keys(j.adopted ?? {})] : (j.created ?? []).map((c) => c.path);
      for (const p of paths) owned.add(p);
      if (rel === ADOPTION_JOURNAL) adoptionBase = j;
    } catch (error) {
      corrupt.push(`base ${error.message}`);
    }
  }
  let current = {};
  try {
    current = managedPaths(root);
  } catch (error) {
    if (!(error instanceof JournalError)) throw error;
    corrupt.push(`HEAD ${error.message}`);
  }
  const inTree = stateBlobs(root, "head");
  // `consumer.mjs --revert` removes what the adoption created and the journal, and keeps the `adopted` files (they were the project's).
  // So an adoption journal that is gone with NONE of its `created` files left is a revert, not a deletion; one that is gone while
  // any created file remains is a deletion, and everything it owned is still owed.
  if (adoptionBase && !(ADOPTION_JOURNAL in inTree) && !Object.keys(adoptionBase.created ?? {}).some((p) => p in inTree)) {
    for (const p of Object.keys(adoptionBase.adopted ?? {})) released.add(p);
  }
  const lost = [...owned].filter((p) => !(p in current) && p in inTree && !released.has(p)).filter((p) => { try { safeJoin(root, p); return true; } catch { return false; } }).sort();
  if (!lost.length && !corrupt.length) return { status: "PASS", ...none, detail: `${owned.size} path(s) owned by the base branch are still owned` };
  const detail = [
    corrupt.length ? `corrupt journal: ${corrupt.join("; ")}` : "",
    lost.length ? `the base branch's journals owned ${lost.length} file(s) that remain in the tree but no longer belong to any journal: ${lost.slice(0, 5).join(", ")}${lost.length > 5 ? `, +${lost.length - 5} more` : ""}. Restore the journal, or remove the files together with it (consumer.mjs --revert / migrate revert)` : "",
  ].filter(Boolean).join(". ");
  return { status: "FAIL", lost, corrupt, detail };
}
