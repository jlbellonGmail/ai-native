// Independent review: runtime capability, review evidence, staleness and the
// final review outcome. Runtime-neutral: it never names a tool, hook or agent
// type; runtime adapters (runtime/adapters) turn what a runtime observably did
// into a ReviewEvidence, and this module only judges that evidence.
//
// A reviewer role being DEFINED (core/agents.json, a projected agent file) is
// not the runtime being ABLE to run it isolated, and a caller SAYING a review
// was independent is not evidence that it was. Independence is fail-closed: it
// needs a ReviewEvidence attested by the runtime adapter, for a runtime and an
// execution class the platform verified (core/agents.json `runtimes`), from the
// reviewer agent, bound to the review it answers and to the revision it judged.
// Validation PASS, tests green or a self-review are never an independent review,
// so they can never produce APPROVED; an adverse review of the same revision
// withdraws any approval of it.
//
// ReviewEvidence (produced by an adapter, never by the caller):
//   { runtime, agent, execution, isolation, reviewId, reviewedRevision, verdict,
//     attestation: { source: "runtime", adapter, mechanism, ... } }
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const CAPABILITY_STATES = ["available", "unavailable", "unknown"];
export const RUNTIME_SUPPORT = ["verified", "unverified", "unsupported"];
// execution classes in which a Reviewer can run without the Builder's context
export const ISOLATED_EXECUTIONS = ["delegated-fresh-context", "separate-process"];
export const REVIEW_VERDICTS = ["APPROVED", "CHANGES_REQUESTED", "BLOCKED", "NEEDS_HUMAN_DECISION"];
// verdicts that withdraw an approval of the same revision, most severe first
export const ADVERSE_VERDICTS = ["BLOCKED", "NEEDS_HUMAN_DECISION", "CHANGES_REQUESTED"];
export const FINAL_REVIEW_STATUSES = ["APPROVED", "CHANGES_REQUESTED", "REVIEW_PENDING", "NEEDS_HUMAN_DECISION", "BLOCKED"];
export const REVIEWER_AGENT = "reviewer";

const here = dirname(fileURLToPath(import.meta.url));
/** core/agents.json `runtimes`: what the platform has verified per runtime (never what a session claims). */
export const loadRuntimeCapabilities = (root = join(here, "..", "..")) => JSON.parse(readFileSync(join(root, "core", "agents.json"), "utf8")).runtimes ?? {};

const state = (value) => (CAPABILITY_STATES.includes(value) ? value : "unknown");

/** Whether `runtime` may run a Reviewer in `execution`: only a class the platform verified for it. */
export function executionAllowed(runtimes, runtime, execution) {
  return Object.hasOwn(runtimes ?? {}, runtime) && runtimes[runtime].independentReview === "verified" && runtimes[runtime].executions?.[execution] === "verified";
}

/**
 * Capability of this session to run an independent review. `support` is never the caller's word: it is what the
 * platform verified for `runtime` (core/agents.json `runtimes`); the other two are what the session observed
 * (the runtime adapter's discovery). Missing facts are `unknown`, and unknown is unavailable.
 */
export function resolveReviewCapability({ reviewerDefined = false, runtime = null, runtimes = loadRuntimeCapabilities(), agentDelegation, contextIsolation } = {}) {
  const declared = runtime !== null && Object.hasOwn(runtimes ?? {}, runtime) ? runtimes[runtime].independentReview : undefined;
  const facts = {
    reviewerDefined: reviewerDefined === true,
    runtime,
    support: RUNTIME_SUPPORT.includes(declared) ? declared : "unverified",
    agentDelegation: state(agentDelegation),
    contextIsolation: state(contextIsolation),
  };
  const reasons = [];
  if (!facts.reviewerDefined) reasons.push("no reviewer role is defined");
  if (facts.support !== "verified") reasons.push(`independent review is ${facts.support} for runtime '${runtime ?? "unknown"}'`);
  if (facts.agentDelegation !== "available") reasons.push(`agent delegation is ${facts.agentDelegation} in this session`);
  if (facts.contextIsolation !== "available") reasons.push(`context isolation is ${facts.contextIsolation} in this session`);
  return { ...facts, independentReview: reasons.length ? "unavailable" : "available", reasons };
}

/**
 * Errors when `evidence` does not prove an independent review. Every field is
 * checked against the platform's verified capabilities, never against what the
 * caller declared; `reviewId`/`revision` bind it to the review asked for and the
 * state of the change it judged; `verdict`, when given, must be the evidence's.
 */
export function checkReviewEvidence(evidence, { runtimes, reviewId = null, revision = null, verdict = null, builderInvocationId = null } = {}) {
  if (!evidence || typeof evidence !== "object") return ["no runtime evidence of an independent review"];
  const errors = [];
  for (const field of ["runtime", "agent", "execution", "isolation", "reviewId", "reviewedRevision", "verdict"]) {
    if (typeof evidence[field] !== "string" || !evidence[field]) errors.push(`evidence lacks '${field}'`);
  }
  const attestation = evidence.attestation;
  if (!attestation || attestation.source !== "runtime" || attestation.adapter !== evidence.runtime) errors.push("evidence is not attested by the runtime adapter that ran the review");
  if (evidence.runtime && runtimes?.[evidence.runtime]?.independentReview !== "verified") errors.push(`independent review is ${runtimes?.[evidence.runtime]?.independentReview ?? "unknown"} for runtime '${evidence.runtime}'`);
  if (evidence.execution && !ISOLATED_EXECUTIONS.includes(evidence.execution)) errors.push(`execution '${evidence.execution}' is not isolated`);
  else if (evidence.runtime && evidence.execution && !executionAllowed(runtimes, evidence.runtime, evidence.execution)) errors.push(`execution '${evidence.execution}' is not verified for runtime '${evidence.runtime}'`);
  if (evidence.agent && evidence.agent !== REVIEWER_AGENT) errors.push(`the review was run by '${evidence.agent}', not by the '${REVIEWER_AGENT}' agent`);
  if (evidence.isolation && evidence.isolation !== "fresh-context" && evidence.isolation !== "separate-process") errors.push(`isolation '${evidence.isolation}' does not withhold the Builder's context`);
  if (evidence.verdict && !REVIEW_VERDICTS.includes(evidence.verdict)) errors.push(`evidence verdict '${evidence.verdict}' is not a review verdict`);
  if (builderInvocationId && (evidence.reviewId === builderInvocationId || attestation?.agentId === builderInvocationId)) errors.push("the reviewer invocation is the Builder's own");
  if (reviewId && evidence.reviewId && evidence.reviewId !== reviewId) errors.push("evidence answers another review");
  if (revision && evidence.reviewedRevision && evidence.reviewedRevision !== revision) errors.push("evidence reviewed another revision");
  if (verdict && evidence.verdict && String(verdict).toUpperCase() !== evidence.verdict) errors.push(`declared verdict ${verdict} is not the reviewer's (${evidence.verdict})`);
  return errors;
}

// a review carries its evidence nested (loop results, ledger records; null when it has none) or is itself the evidence
const evidenceOf = (review) => (review && Object.hasOwn(review, "evidence") ? review.evidence : review);
const revisionOf = (review) => review?.reviewedRevision ?? review?.evidence?.reviewedRevision ?? null;

/** A review belongs to one state of the change: any later change makes it stale. */
export function isReviewStale(review, currentRevision) {
  const reviewed = revisionOf(review);
  return !reviewed || !currentRevision || reviewed !== currentRevision;
}

const verdictOf = (review) => String(review?.verdict ?? "").toUpperCase();

/**
 * The separated results of a work unit. `policyGate` is the gate the HITL policy
 * derived (runtime/policy/hitl.mjs); it only applies to an APPROVED independent
 * review, every other outcome keeps the human gate `required`. `otherReviews` are
 * any further reviews of the change (any kind): an adverse one of the current
 * revision withdraws an approval, whatever came first. `validationReviewed` says
 * whether the approving Reviewer was shown the validation runs that count now.
 */
export function deriveReviewOutcome({ implementation, validation = "NOT_RUN", validationReviewed = true, selfReview = null, independentReview = null, otherReviews = [], capability, currentRevision = null, builderInvocationId = null, policyGate = "required", runtimes = loadRuntimeCapabilities() }) {
  const reasons = [];
  // a self-review never approves; it is reported for what it found, and as STALE once the change moved after it
  const selfStale = Boolean(selfReview && currentRevision && isReviewStale(selfReview, currentRevision));
  const selfResult = !selfReview ? "NOT_RUN" : selfStale ? "STALE" : verdictOf(selfReview) === "APPROVED" ? "PASS" : verdictOf(selfReview);
  let independent;
  if (capability?.independentReview !== "available") {
    independent = "UNAVAILABLE";
    reasons.push(...(capability?.reasons ?? ["runtime capability unknown"]));
  } else if (!independentReview) {
    independent = "NOT_RUN";
  } else {
    // evidence first: a review the runtime cannot attest is not independent, fresh or not
    const evidenceErrors = checkReviewEvidence(evidenceOf(independentReview), { runtimes, builderInvocationId, verdict: independentReview.verdict ?? null });
    if (evidenceErrors.length) {
      independent = "NOT_PROVEN";
      reasons.push(...evidenceErrors);
    } else if (isReviewStale(independentReview, currentRevision)) {
      independent = "STALE";
      reasons.push("the change moved after the independent review: a new review is required");
    } else {
      independent = verdictOf(independentReview) === "APPROVED" ? "PASS" : verdictOf(independentReview);
    }
  }

  // any adverse review of the current revision (self, independent, attested or not) stands until the change moves
  const adverse = [selfReview, independentReview, ...otherReviews]
    .filter((r) => r && currentRevision && !isReviewStale(r, currentRevision) && ADVERSE_VERDICTS.includes(verdictOf(r)))
    .map(verdictOf)
    .sort((a, b) => ADVERSE_VERDICTS.indexOf(a) - ADVERSE_VERDICTS.indexOf(b))[0];

  let finalReviewStatus;
  if (implementation !== "PASS") finalReviewStatus = implementation === "BLOCKED" ? "BLOCKED" : "REVIEW_PENDING";
  else if (ADVERSE_VERDICTS.includes(independent)) finalReviewStatus = independent;
  else if (adverse) finalReviewStatus = adverse;
  else if (independent !== "PASS") finalReviewStatus = "REVIEW_PENDING";
  else if (validation !== "PASS") finalReviewStatus = "CHANGES_REQUESTED";
  // the Reviewer approved what it was shown: validation runs it never saw are not part of that approval
  else if (!validationReviewed) finalReviewStatus = "REVIEW_PENDING";
  else finalReviewStatus = "APPROVED";
  if (adverse && independent === "PASS") reasons.push(`a later ${adverse} review of this revision withdraws the approval: fix, validate and review the new revision`);
  if (finalReviewStatus === "CHANGES_REQUESTED" && independent === "PASS" && !adverse) reasons.push(`validation is ${validation}`);
  if (finalReviewStatus === "REVIEW_PENDING" && independent === "PASS" && !validationReviewed) reasons.push("the validation runs changed after the review: the Reviewer never saw them, begin a new review");

  const humanGate = finalReviewStatus === "APPROVED" ? policyGate : "required";
  return { implementation, validation, selfReview: selfResult, independentReview: independent, finalReviewStatus, humanGate, reasons };
}

/** Contradictions the outcome must never contain (e.g. APPROVED without an independent review). */
export function checkOutcomeCoherence(outcome) {
  const errors = [];
  if (!FINAL_REVIEW_STATUSES.includes(outcome?.finalReviewStatus)) errors.push(`unknown final review status '${outcome?.finalReviewStatus}'`);
  if (outcome?.finalReviewStatus === "APPROVED") {
    if (outcome.independentReview !== "PASS") errors.push(`APPROVED requires an independent review PASS, got ${outcome.independentReview}`);
    if (outcome.validation !== "PASS") errors.push(`APPROVED requires validation PASS, got ${outcome.validation}`);
    if (outcome.implementation !== "PASS") errors.push(`APPROVED requires implementation PASS, got ${outcome.implementation}`);
    if (ADVERSE_VERDICTS.includes(outcome.selfReview)) errors.push(`APPROVED contradicts a ${outcome.selfReview} self-review of the same revision`);
    if (!["none", "final-only", "required"].includes(outcome.humanGate)) errors.push(`unknown human gate '${outcome.humanGate}'`);
  } else if (outcome?.humanGate !== "required") {
    errors.push(`a ${outcome?.finalReviewStatus} outcome must keep human_gate required, got ${outcome?.humanGate}`);
  }
  return errors;
}

/** One line per result, the report's fixed vocabulary. */
export function formatReviewOutcome(outcome) {
  return [
    `IMPLEMENTATION: ${outcome.implementation}`,
    `VALIDATION: ${outcome.validation}`,
    `SELF_REVIEW: ${outcome.selfReview}`,
    `INDEPENDENT_REVIEW: ${outcome.independentReview}`,
    `FINAL_REVIEW_STATUS: ${outcome.finalReviewStatus}`,
    `HUMAN_GATE: ${outcome.humanGate}`,
    ...(outcome.reasons.length ? [`REASONS: ${outcome.reasons.join("; ")}`] : []),
  ].join("\n");
}
