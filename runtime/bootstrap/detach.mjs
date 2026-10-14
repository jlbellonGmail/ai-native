// `ai-native detach` engine: takes ai-native OUT of the current repository. It removes only what the adoption journal says ai-native wrote
// (the projections and the launcher), the journal itself and the lock, and only while each file still equals what ai-native wrote. A managed
// file the person edited is never deleted silently: without --keep-modified the run FAILS CLOSED naming the file and changes nothing; with it
// the file stays on disk as an ordinary file of the project. Files that were already there and identical (`adopted`) were never ai-native's to
// remove and stay. Nothing outside the journal is touched; the repository is left as a normal one, with the removal staged (not committed).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { LOCK_FILE } from "./install.mjs";
import { callerFrom, negotiate } from "./compat.mjs";
import { fail, renderText, repoFacts } from "./adopt.mjs";
import { JOURNAL_PATH, normalizedSha, pruneEmptyDirs, safeJoin, sha } from "../migrate/adopt.mjs";
import { readOwnership } from "../migrate/journals.mjs";
import { CALLER_WORKFLOW } from "../migrate/bump.mjs";

const unchanged = (buf, hash) => sha(buf) === hash || normalizedSha(buf) === hash;

export function detach({ projectRoot, keepModified = false, caller = callerFrom(), platform = null }) {
  projectRoot = resolve(projectRoot);
  const facts = repoFacts(projectRoot);
  if (facts.errors.length) return fail(facts.errors);
  if (caller.error) return fail([caller.error]);
  if (platform) {
    const deal = negotiate({ platform, caller });
    if (!deal.ok) return fail(deal.errors);
  }
  const hasLock = existsSync(join(projectRoot, LOCK_FILE));
  const own = readOwnership(projectRoot);
  if (!own.hasAdoption && !own.hasMigration && !hasLock) {
    const out = { state: "NOT_ADOPTED", status: "PASS", errors: [], warnings: [], detach: "nothing to remove: this repository is not adopted" };
    return { ...out, text: renderText(out) };
  }
  if (own.hasMigration) return fail(["MIGRATED_FROM_V2: this repository carries a v2 migration journal; revert it with `migrate revert` first, `detach` does not guess what a migration owns"]);
  if (!own.hasAdoption || !hasLock) return fail([`ADOPTION_INCONSISTENT: ${hasLock ? `${LOCK_FILE} without ${JOURNAL_PATH}` : `${JOURNAL_PATH} without ${LOCK_FILE}`}; ai-native cannot tell which files are its own. Nothing was removed`]);

  const remove = [];
  const modified = [];
  const keep = Object.keys(own.adopted);
  for (const [rel, hash] of Object.entries(own.created)) {
    const full = safeJoin(projectRoot, rel);
    if (!existsSync(full)) continue;
    (unchanged(readFileSync(full), hash) ? remove : modified).push(rel);
  }
  if (modified.length && !keepModified) {
    return fail([`DETACH_BLOCKED: ${modified.length} managed file(s) were edited since ai-native wrote them, so removing them could lose your work: ${modified.join(", ")}. Nothing was removed. Review them, or run \`ai-native detach --keep-modified\` to leave exactly those files in place as ordinary project files`]);
  }

  const gone = [...remove, JOURNAL_PATH, ...(hasLock ? [LOCK_FILE] : [])];
  const saved = new Map(gone.map((rel) => [rel, existsSync(join(projectRoot, rel)) ? readFileSync(join(projectRoot, rel)) : null]));
  try {
    for (const rel of gone) {
      const full = safeJoin(projectRoot, rel);
      if (!existsSync(full)) continue;
      rmSync(full);
      pruneEmptyDirs(projectRoot, rel);
    }
    // the removal is staged like the adoption was; nothing is committed. A path git never knew is not an error.
    spawnSync("git", ["rm", "--cached", "-q", "--ignore-unmatch", "--", ...gone], { cwd: projectRoot, encoding: "utf8" });
  } catch (error) {
    for (const [rel, content] of saved) {
      if (content === null) continue;
      const full = join(projectRoot, rel);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
    return fail([`detach failed and was undone: ${error.message}`]);
  }
  const warnings = [];
  if (modified.length) warnings.push(`kept your edited file(s), now ordinary project files: ${modified.join(", ")}`);
  if (keep.length) warnings.push(`kept ${keep.length} file(s) that existed before ai-native and are identical to what it projects: ${keep.join(", ")}`);
  if (existsSync(join(projectRoot, CALLER_WORKFLOW))) warnings.push(`${CALLER_WORKFLOW} is not tracked by the adoption journal and was left as it is; remove it if you no longer want the check`);
  const out = {
    state: "NOT_ADOPTED", status: warnings.length ? "PASS_WITH_WARNINGS" : "PASS", errors: [], warnings,
    detach: `DETACHED (${remove.length} managed file(s), the journal and the lock removed; review with \`git status\`, nothing was committed)`,
  };
  return { ...out, text: renderText(out) };
}
