// Deterministic verify (M3.2, CIR-10; PAR-QA-VERIFY, PAR-STALE-EVIDENCE).
// The runtime runs the command and records a treeSha-bound result; the
// Reviewer interprets that result (this corrects TEMPLATE v2.0.5's
// ambiguity where qa-agent was expected to execute tests but the
// Reviewer role had no execution permission -- see ADR-002). A verify
// event is bound to an exact git tree: any later code/test/config change
// invalidates it, which is what isVerifyStale() checks.
import { headSha } from "../lib/git.mjs";
import { appendEvent } from "./events.mjs";

/** Current tree identity to bind a verify event to. HEAD's tree, not the
 * commit itself: a verify run against a dirty working tree (uncommitted
 * changes) still needs a stable identity, so callers that verify before
 * committing should pass their own treeSha (e.g. `git write-tree`). */
export function currentTreeSha(cwd) {
  return headSha(cwd);
}

/** Appends a `verify` event binding `status`/`exitCode` to `treeSha`. */
export function recordVerify(logPath, unitId, { treeSha, command, status, exitCode, testingProfile }) {
  return appendEvent(logPath, unitId, "verify", {
    treeSha,
    ...(command ? { command } : {}),
    status,
    exitCode,
    ...(testingProfile ? { testingProfile } : {}),
  });
}

/** A verify event is stale once the actual tree has moved past treeSha. */
export function isVerifyStale(verifyEvent, actualTreeSha) {
  return verifyEvent.treeSha !== actualTreeSha;
}

/** The most recent verify event, or null if none yet recorded. */
export function getLatestVerify(events) {
  const verifies = events.filter((e) => e.eventType === "verify");
  return verifies.length > 0 ? verifies[verifies.length - 1] : null;
}

/** True only when the latest verify event exists, is bound to the
 * current tree, and passed (PASS or PASS_WITH_WARNINGS). */
export function hasFreshPassingVerify(events, actualTreeSha) {
  const latest = getLatestVerify(events);
  if (!latest) return false;
  if (isVerifyStale(latest, actualTreeSha)) return false;
  return latest.status === "PASS" || latest.status === "PASS_WITH_WARNINGS";
}
