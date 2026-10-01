// `review run` (M3.2, P45; PAR-REVIEWER-INDEPENDENCE,
// PAR-REVIEW-TAMPER-EVIDENT). A review verdict must come from a separate,
// non-interactive invocation (reviewInvocationId) that is never the
// Builder's own session/invocation id, and must be bound to exactly what
// the Reviewer was shown (inputDigest). The local tamper-evidence
// guarantee for the recorded verdict is events.jsonl's hash chain
// (runtime/circuit/events.mjs#verifyChain); the strong guarantee is the
// CI review-gate (M4.3), not this module.
import { randomBytes, createHash } from "node:crypto";
import { appendEvent, readEvents } from "./events.mjs";

export class ReviewerIndependenceError extends Error {}

export function sha256Digest(content) {
  return `sha256:${createHash("sha256").update(content, "utf8").digest("hex")}`;
}

export function generateReviewInvocationId() {
  return `review-${randomBytes(16).toString("hex")}`;
}

export function generateNonce() {
  return randomBytes(12).toString("hex");
}

/**
 * Builds and appends a `review` event. Throws ReviewerIndependenceError
 * (writing nothing) when reviewInvocationId equals the Builder's own
 * invocation id, or when toolSessionId was explicitly asserted to be the
 * Builder's own session -- the independence check this whole mechanism
 * exists for.
 */
export function createReviewRun(
  logPath,
  unitId,
  { stage, verdict, tool, model, content, builderInvocationId, parentInvocationId = null, toolSessionId = null, findings = [] },
) {
  const reviewInvocationId = generateReviewInvocationId();
  if (builderInvocationId && reviewInvocationId === builderInvocationId) {
    throw new ReviewerIndependenceError("reviewInvocationId must never equal the Builder's own invocation id");
  }
  if (builderInvocationId && toolSessionId && toolSessionId === builderInvocationId) {
    throw new ReviewerIndependenceError("toolSessionId must never equal the Builder's own invocation id (reviewer independence)");
  }
  const inputDigest = sha256Digest(content);
  return appendEvent(logPath, unitId, "review", {
    stage,
    verdict,
    reviewInvocationId,
    nonce: generateNonce(),
    inputDigest,
    tool,
    ...(model ? { model } : {}),
    toolSessionId,
    parentInvocationId,
    findings,
  });
}

/**
 * PAR-VERDICT-COMPAT: the last `review` event for `stage` in the log
 * wins -- append-only chronological order is authoritative, replacing
 * TEMPLATE v2.0.5's "highest attempt-N.md wins" file convention.
 */
export function getLatestVerdict(events, stage) {
  const reviews = events.filter((e) => e.eventType === "review" && e.stage === stage);
  return reviews.length > 0 ? reviews[reviews.length - 1] : null;
}

export function readLatestVerdict(logPath, stage) {
  return getLatestVerdict(readEvents(logPath), stage);
}
