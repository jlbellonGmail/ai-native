// Acceptance result contract and fail-closed consolidation (spec 002 RF-3, RF-4,
// RF-29, RF-35). Maps onto runtime/lib/result.mjs WITHOUT changing its enum.
import { RESULT_STATUS } from "../lib/result.mjs";

export const ACCEPTANCE_STATUS = Object.freeze({
  PASS: "PASS",
  FAIL: "FAIL",
  BLOCKED: "BLOCKED",
  STALE: "STALE",
  NOT_RUN: "NOT_RUN",
  NOT_APPLICABLE: "NOT_APPLICABLE",
});
const VALID = new Set(Object.values(ACCEPTANCE_STATUS));
export const PENDING_REASONS = Object.freeze({
  NA: "NOT_APPLICABLE_PENDING_APPROVAL",
  DOWNGRADE: "DOWNGRADE_PENDING_APPROVAL",
});

/** RF-29 mapping, exactly: BLOCKED, STALE, NOT_RUN -> ERROR. Unknown input -> ERROR (fail closed). */
export function toResultStatus(status) {
  switch (status) {
    case "PASS": return RESULT_STATUS.PASS;
    case "FAIL": return RESULT_STATUS.FAIL;
    case "NOT_APPLICABLE": return RESULT_STATUS.NOT_APPLICABLE;
    default: return RESULT_STATUS.ERROR; // BLOCKED, STALE, NOT_RUN and anything unrecognised
  }
}

/** Only PASS and NOT_APPLICABLE are non-blocking. */
export const isBlocking = (status) => status !== "PASS" && status !== "NOT_APPLICABLE";

/**
 * Consolidates scenario results. Order of severity (worst wins):
 * FAIL > BLOCKED > STALE > NOT_RUN > PASS > NOT_APPLICABLE.
 * Zero scenarios is never PASS (RF-3). Pending N/A or DOWNGRADE approvals keep a
 * would-be PASS BLOCKED with the pending reason (RF-35).
 */
export function consolidate(results, { pending = [] } = {}) {
  const reasons = [];
  const statuses = results.map((r) => (VALID.has(r?.status) ? r.status : "BLOCKED"));
  results.forEach((r, i) => {
    if (!VALID.has(r?.status)) reasons.push(`scenario ${r?.id ?? i}: unrecognised status`);
    else if (isBlocking(r.status) || r.status === "FAIL") reasons.push(`${r.id ?? i}: ${r.status}${r.reason ? ` (${r.reason})` : ""}`);
  });
  const applicable = statuses.filter((s) => s !== "NOT_APPLICABLE");
  let status;
  if (statuses.includes("FAIL")) status = "FAIL";
  else if (statuses.includes("BLOCKED")) status = "BLOCKED";
  else if (statuses.includes("STALE")) status = "STALE";
  else if (statuses.includes("NOT_RUN")) status = "NOT_RUN";
  else if (applicable.length === 0) {
    status = "BLOCKED";
    reasons.push("no applicable scenario ran: an empty acceptance is never PASS");
  } else status = "PASS";
  const pendingReasons = [...new Set(pending)].sort();
  if (status === "PASS" && pendingReasons.length) {
    status = "BLOCKED";
    reasons.push(...pendingReasons);
  }
  return { status, reasons, pending: pendingReasons, resultStatus: toResultStatus(status), blocking: isBlocking(status) };
}
