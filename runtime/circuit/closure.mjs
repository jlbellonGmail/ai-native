// Closure verification (M3.2, CIR-16, CIR-18; PAR-WAIT-CI,
// PAR-CLOSURE-BY-MERGE, PAR-CLOSE). TEMPLATE v2.0.5's close-feature.ps1
// mutated ROADMAP.md after merge; contracts/roadmap.md changes that for
// v3: the `[x]` edit already happened inside the merged PR
// (runtime/circuit/ready.mjs), so this module is read-only verification
// that the merge really landed, not a second mutation. Pure functions
// over gh's own JSON shapes, so they are testable without spawning gh.
import { getItemState } from "./identity.mjs";
import { appendEvent } from "./events.mjs";

export class NotMergedError extends Error {}

/**
 * Appends a `trace` event binding this Work Unit to the exact merge
 * commit (and PR, when known) that closed it (PAR-TRACE) -- the
 * events.jsonl-native replacement for TEMPLATE v2.0.5's SUMMARY.md
 * `Merge:`/`PR:` free-text fields (CIR-07 neighbours this, but a trace
 * event is structured and machine-checkable).
 */
export function recordTrace(logPath, unitId, { commit, prNumber = null, prUrl = null }) {
  return appendEvent(logPath, unitId, "trace", { commit, prNumber, prUrl });
}

/**
 * Throws NotMergedError unless `pr` (gh's `pr view --json
 * state,mergedAt,baseRefName,headRefName,number` shape) is confirmed
 * MERGED into `baseBranch`, with a `headRefName` matching `branch` when
 * given. Port of Confirm-PrMergedIntoBase.
 */
export function assertPrMergedIntoBase(pr, { baseBranch, branch = null }) {
  if (pr.state !== "MERGED") {
    throw new NotMergedError(`PR is not merged. GitHub reports state: ${pr.state}`);
  }
  if (pr.baseRefName !== baseBranch) {
    throw new NotMergedError(`PR was merged against '${pr.baseRefName}', not '${baseBranch}'`);
  }
  if (!pr.mergedAt) {
    throw new NotMergedError("GitHub reports MERGED but did not return mergedAt");
  }
  if (branch && pr.headRefName !== branch) {
    throw new NotMergedError(`PR head is '${pr.headRefName}', not '${branch}'`);
  }
  return true;
}

/** PAR-CLOSE: the item must appear exactly once, and as [x]. */
export function isRoadmapItemClosedOnce(content, slug) {
  return getItemState(content, slug) === "Done";
}

/** PAR-CLOSE (Milestone): every item in the group closed atomically. */
export function areRoadmapItemsClosedOnce(content, items) {
  return items.every((item) => isRoadmapItemClosedOnce(content, item));
}

// --- CIR-16 / PAR-WAIT-CI ---

/**
 * PENDING/PASS/FAIL from a `gh run list`-shaped CI object (the same
 * shape runtime/status/snapshot.mjs's `ci` field uses). No event loop,
 * no sleep: the polling itself is an orchestration concern for the
 * caller; this is the pure decision TEMPLATE v2.0.5's wait-pr-ci.ps1
 * ultimately reduces to (did `gh pr checks --watch` end green?).
 */
export function interpretCiConclusion(ci) {
  if (!ci || ci.status !== "completed") return "PENDING";
  return ci.conclusion === "success" ? "PASS" : "FAIL";
}
