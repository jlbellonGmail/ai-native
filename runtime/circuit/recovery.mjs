// Recovery/reentry classification (M3.2, GOV-04; PAR-RECOVERY). Ported
// from TEMPLATE v2.0.5's "AGENTS.md #Reentrada" + status-lib.ps1 reentry
// signals, but using ai-native's own 8-state vocabulary already declared
// authoritative in AGENTS.md's "Recovery Policy" section (not a new,
// separate taxonomy invented here): NOT_STARTED,
// IN_PROGRESS_UNCOMMITTED, IMPLEMENTED_UNVALIDATED,
// VALIDATED_UNCOMMITTED, COMMITTED_UNGOVERNED,
// CLOSED_LOCALLY_HUMAN_APPROVAL_REQUIRED, FORMALLY_CLOSED,
// INCONSISTENT_STATE. Deterministic: same observed git/evidence/roadmap
// state always classifies the same way, so an agent reentering a Work
// Unit never has to "assume continuity from previous chat context"
// (AGENTS.md's own recovery rule).
export const RECOVERY_STATES = Object.freeze([
  "NOT_STARTED",
  "IN_PROGRESS_UNCOMMITTED",
  "IMPLEMENTED_UNVALIDATED",
  "VALIDATED_UNCOMMITTED",
  "COMMITTED_UNGOVERNED",
  "CLOSED_LOCALLY_HUMAN_APPROVAL_REQUIRED",
  "FORMALLY_CLOSED",
  "INCONSISTENT_STATE",
]);

/**
 * classifyRecoveryState({ branchExists, workingTree, hasCommits,
 * hasPassingVerify, roadmapState, prState }) -> one of RECOVERY_STATES.
 * Any combination this function cannot place confidently returns
 * INCONSISTENT_STATE rather than guessing -- per AGENTS.md, the agent
 * must not implement new changes during recovery until the state is
 * classified, and a wrong guess here is worse than an honest "ask a
 * human". `prState` is one of null/"OPEN"/"MERGED"/"CLOSED"; only
 * "MERGED" (together with roadmapState="Done") can ever produce
 * FORMALLY_CLOSED -- a GitHub review approval on a still-open PR is not
 * by itself formal closure, the single HITL this models is the merge.
 */
export function classifyRecoveryState({
  branchExists = false,
  workingTree = "clean",
  hasCommits = false,
  hasPassingVerify = false,
  roadmapState = "Missing",
  prState = null,
} = {}) {
  if (roadmapState === "Ambiguous") {
    return "INCONSISTENT_STATE";
  }
  if (roadmapState === "Done" && prState !== "MERGED") {
    return "INCONSISTENT_STATE";
  }
  if (prState === "MERGED" && roadmapState !== "Done") {
    return "INCONSISTENT_STATE";
  }
  if (roadmapState === "Done" && prState === "MERGED") {
    return "FORMALLY_CLOSED";
  }
  if (!branchExists && !hasCommits) {
    return "NOT_STARTED";
  }
  if (prState === "OPEN") {
    // Formal closure requires MERGED (handled above), not merely a
    // human review approval on the PR: the single HITL this state
    // waits for is the merge action itself, approved or not yet.
    return "CLOSED_LOCALLY_HUMAN_APPROVAL_REQUIRED";
  }
  if (!hasCommits) {
    return workingTree === "dirty" ? "IN_PROGRESS_UNCOMMITTED" : "NOT_STARTED";
  }
  if (!hasPassingVerify) {
    return "IMPLEMENTED_UNVALIDATED";
  }
  return workingTree === "dirty" ? "VALIDATED_UNCOMMITTED" : "COMMITTED_UNGOVERNED";
}
