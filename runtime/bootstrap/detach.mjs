// `ai-native detach` engine: takes ai-native OUT of the current repository. It removes only what the adoption journal says ai-native wrote
// (the projections and the launcher), the journal itself and the lock, and only while each file still equals what ai-native wrote. A managed
// file the person edited is never deleted silently: without --keep-modified the run FAILS CLOSED naming the file and changes nothing; with it
// the file stays on disk as an ordinary file of the project. Files that were already there and identical (`adopted`) were never ai-native's to
// remove and stay. Nothing outside the journal is touched; the repository is left as a normal one, with the removal staged (not committed).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { LOCK_FILE } from "./install.mjs";
import { callerFrom, negotiate } from "./compat.mjs";
import { fail, renderText, repoFacts } from "./adopt.mjs";
import { JOURNAL_PATH, normalizedSha, pruneEmptyDirs, safeJoin, sha } from "../migrate/adopt.mjs";
import { readOwnership } from "../migrate/journals.mjs";
import { consumerFiles } from "../adapters/consumer.mjs";
import { CALLER_WORKFLOW } from "../migrate/bump.mjs";

const unchanged = (buf, hash) => sha(buf) === hash || normalizedSha(buf) === hash;

export function detach({ projectRoot, keepModified = false, offline = false, caller = callerFrom(), platform = null }) {
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
  if (!own.hasAdoption && hasLock) return detachLegacyLock({ projectRoot, offline });
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
  if (offline) warnings.push("offline: revocation status of the release that ran this command NOT checked");
  if (modified.length) warnings.push(`kept your edited file(s), now ordinary project files: ${modified.join(", ")}`);
  if (keep.length) warnings.push(`kept ${keep.length} file(s) that existed before ai-native and are identical to what it projects: ${keep.join(", ")}`);
  if (existsSync(join(projectRoot, CALLER_WORKFLOW))) warnings.push(`${CALLER_WORKFLOW} is not tracked by the adoption journal and was left as it is; remove it if you no longer want the check`);
  const out = {
    state: "NOT_ADOPTED", status: warnings.length ? "PASS_WITH_WARNINGS" : "PASS", errors: [], warnings,
    detach: `DETACHED (${remove.length} managed file(s), the journal and the lock removed; review with \`git status\`, nothing was committed)`,
  };
  return { ...out, text: renderText(out) };
}

/**
 * A repository pinned by the bootstrap of v3.1.x and earlier has the lock and NO adoption journal: the lock is the only file ai-native is known to have
 * written there, so it is the only file removed (nothing else can be lost). If `.ai-native/` exists the repository was adopted at some point and the
 * journal that says what is ai-native's is missing: that stays a fail-closed refusal, and the way out is `ai-native upgrade` (records ownership), then detach.
 * Files this release would project that are present stay where they are and are listed: the person decides about them.
 */
function detachLegacyLock({ projectRoot, offline }) {
  const lockFile = join(projectRoot, LOCK_FILE);
  const inconsistent = (why) => fail([`ADOPTION_INCONSISTENT: ${LOCK_FILE} without ${JOURNAL_PATH}${why}; ai-native cannot tell which files are its own. Nothing was removed. Run \`ai-native upgrade\` (it records what is ai-native's without overwriting anything), then \`ai-native detach\``]);
  if (existsSync(join(projectRoot, dirname(JOURNAL_PATH)))) return inconsistent(`, and ${dirname(JOURNAL_PATH)}/ exists`);
  let content;
  try {
    content = readFileSync(lockFile); // a directory or an unreadable path throws here: no separate check, so no check-then-use window
    const lock = JSON.parse(content.toString("utf8"));
    if (!lock || typeof lock !== "object" || !lock.platform || typeof lock.platform !== "object") throw new Error("not an ai-native lock");
  } catch {
    return inconsistent(", and the lock is not a readable ai-native lock");
  }
  let present = [];
  try {
    const releaseRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
    present = Object.keys(consumerFiles(releaseRoot, {})).filter((rel) => existsSync(safeJoin(projectRoot, rel)));
  } catch { /* only a hint for the person: never a reason to stop */ }
  try {
    rmSync(lockFile);
    spawnSync("git", ["rm", "--cached", "-q", "--ignore-unmatch", "--", LOCK_FILE], { cwd: projectRoot, encoding: "utf8" });
  } catch (error) {
    writeFileSync(lockFile, content);
    return fail([`detach failed and was undone: ${error.message}`]);
  }
  const warnings = [`legacy repository: it has no adoption journal, so only ${LOCK_FILE} (the one file ai-native is known to have written here) was removed`];
  if (offline) warnings.push("offline: revocation status of the release that ran this command NOT checked");
  if (present.length) warnings.push(`${present.length} file(s) that ai-native can project are present and were left as they are, because no journal says they are ai-native's; review them: ${present.slice(0, 8).join(", ")}${present.length > 8 ? ", ..." : ""}`);
  if (existsSync(join(projectRoot, CALLER_WORKFLOW))) warnings.push(`${CALLER_WORKFLOW} is not tracked by the adoption journal and was left as it is; remove it if you no longer want the check`);
  const out = { state: "NOT_ADOPTED", status: "PASS_WITH_WARNINGS", errors: [], warnings, detach: "DETACHED (the lock removed; review with `git status`, nothing was committed)" };
  return { ...out, text: renderText(out) };
}
