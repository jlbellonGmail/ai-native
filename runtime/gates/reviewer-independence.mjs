// M4.3 (P45 REVIEWER_INDEPENDENCE_ENFORCEMENT; PAR-REVIEWER-INDEPENDENCE,
// PAR-REVIEW-TAMPER-EVIDENT). runtime/circuit/review-run.mjs creates the
// independence guarantee locally; this module is the CI ("review-gate") side
// that does not trust the local log: for every runs/**/events.jsonl a PR
// touches it checks, from data only,
//   1. the hash chain verifies (runtime/circuit/events.mjs#verifyChain),
//   2. the log is append-only against the BASE version (no rewritten history),
//   3. every `review` event carries a runtime-generated reviewInvocationId, a
//      unique nonce and an inputDigest, and never reuses a session/parent id
//      as its own invocation id,
//   4. REVIEW-GATE: once a unit reached a post-review state, every review stage
//      its SDD depth requires (contracts/sdd-levels.json) has an APPROVED
//      verdict, so a Builder cannot move a unit forward on a missing or
//      rejected review.
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyChain, EventChainError } from "../circuit/events.mjs";
import { deriveState } from "../circuit/state-machine.mjs";
import { getEvidenceContract } from "../circuit/contract.mjs";
import { getLatestVerdict } from "../circuit/review-run.mjs";

/** States reachable only after the code review and convergence. */
export const POST_REVIEW_STATES = new Set(["GATES_PASSED", "READY_FOR_PR", "PR_OPEN", "CI_PENDING", "AWAITING_HITL"]);
const REVIEW_ID = /^review-[0-9a-f]{32}$/;
export const EVENT_LOG = /^runs\/.+\/events\.jsonl$/;

function parse(text) {
  return text.split(/\r?\n/).filter((l) => l.trim().length > 0);
}

/** Findings for one events.jsonl (baseText null when the file is new). */
export function checkEventLog(path, baseText, headText) {
  const findings = [];
  const dir = mkdtempSync(join(tmpdir(), "ai-native-p45-"));
  try {
    const file = join(dir, "events.jsonl");
    writeFileSync(file, headText, "utf8");
    try {
      verifyChain(file);
    } catch (e) {
      if (e instanceof EventChainError) findings.push({ code: "CHAIN_BROKEN", path, detail: e.message });
      else findings.push({ code: "LOG_UNREADABLE", path, detail: e.message });
      return findings;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  const head = parse(headText);
  if (baseText !== null) {
    const base = parse(baseText);
    if (base.length > head.length || base.some((line, i) => line !== head[i])) {
      findings.push({ code: "HISTORY_REWRITTEN", path, detail: "events.jsonl is append-only; base lines were altered or removed" });
    }
  }
  const nonces = new Set();
  for (const line of head) {
    const ev = JSON.parse(line);
    if (ev.eventType !== "review") continue;
    if (!REVIEW_ID.test(ev.reviewInvocationId ?? "")) findings.push({ code: "REVIEW_ID_INVALID", path, detail: `review event has non-runtime reviewInvocationId '${ev.reviewInvocationId}'` });
    if (!ev.inputDigest) findings.push({ code: "REVIEW_UNBOUND", path, detail: "review event lacks inputDigest" });
    if (!ev.nonce || nonces.has(ev.nonce)) findings.push({ code: "REVIEW_NONCE", path, detail: "review nonce missing or reused" });
    nonces.add(ev.nonce);
    if (ev.toolSessionId && ev.toolSessionId === ev.reviewInvocationId) findings.push({ code: "REVIEW_NOT_INDEPENDENT", path, detail: "reviewInvocationId equals toolSessionId" });
    if (ev.parentInvocationId && ev.parentInvocationId === ev.reviewInvocationId) findings.push({ code: "REVIEW_NOT_INDEPENDENT", path, detail: "reviewInvocationId equals parentInvocationId" });
  }
  findings.push(...checkReviewGate(path, head.map((l) => JSON.parse(l))));
  return findings;
}

/** Pure: findings when a post-review unit lacks an approved review for a required stage. */
export function checkReviewGate(path, events) {
  const assess = [...events].reverse().find((e) => e.eventType === "assess");
  if (!assess || !POST_REVIEW_STATES.has(deriveState(events))) return [];
  const findings = [];
  for (const stage of getEvidenceContract(assess.depth).requiredReviews) {
    const latest = getLatestVerdict(events, stage);
    if (!latest) findings.push({ code: "REVIEW_GATE_MISSING", path, detail: `${assess.depth} unit is past code review but has no '${stage}' review event` });
    else if (latest.verdict !== "approved") findings.push({ code: "REVIEW_GATE_NOT_APPROVED", path, detail: `latest '${stage}' review is '${latest.verdict}', not approved` });
  }
  return findings;
}

/** Applies checkEventLog to every touched events.jsonl; readBase/readHead return text or null. */
export function checkReviewIndependence(changed, readBase, readHead) {
  const findings = [];
  for (const p of changed.filter((f) => EVENT_LOG.test(f))) {
    const head = readHead(p);
    if (head === null) {
      findings.push({ code: "HISTORY_REWRITTEN", path: p, detail: "events.jsonl deleted by the PR" });
      continue;
    }
    findings.push(...checkEventLog(p, readBase(p), head));
  }
  return findings;
}
