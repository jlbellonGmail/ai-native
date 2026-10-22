// /sdd-implement-all as an executable loop (first-class, not "run implement N times").
// The agents are injected, so the loop is testable and runtime-neutral:
//   implement(task, { attempt, diagnosis }) -> void      (Implementer)
//   test(task)      -> { passed, output }                 (targeted tests)
//   accept(task)    -> { accepted, reason }               (done-when / acceptance)
//   fullSuite()     -> { passed, output }                 (official regression suite)
//   review(iteration, { revision }) -> { verdict, findings, evidence }   (independent Reviewer, read-only, isolated;
//                    the composition root injects it with its runtime adapter: the core checks the evidence fields,
//                    it cannot re-attest an in-process object the way `sdd review status` re-attests a receipt)
//   selfReview(iteration, { revision }) -> { verdict, findings }         optional: same-context review, never approves
//   fix(findings)   -> void                               (Implementer, via the Coordinator)
//   revision()      -> string                             identity of the current change (what a review is bound to)
//   capability: what the session observed { runtime, agentDelegation, contextIsolation } (independent-review.mjs);
//                absent = unavailable. Whether `runtime` may review at all is read from `runtimes`, never from the caller
//   runtimes: core/agents.json `runtimes` (default: loaded from the platform)
//   builderInvocationId: optional id of the authoring session; a review from it is never independent
//   humanGate: optional { ok, gate, reasons } from deriveHumanGate; ok:false blocks before any task
//   persist(taskId, state) -> void   optional: writes the task state (e.g. tasks.md) as it changes;
//                                    without it the returned `states` is the only record
// An agent that throws counts as a failed attempt with that error as the diagnosis.
// Guarantees: strict task order; bounded convergence per task (detect ->
// diagnose -> fix -> retest) using the level budget from contracts/sdd-levels.json;
// a task that does not converge BLOCKS the work unit, later tasks stay pending
// and are never reported as done; the review loop reuses decideConvergence.
// DONE needs an isolated review bound to the final revision; without the capability
// the run ends REVIEW_PENDING (self-review at most) and the human gate stays required.
import { loadWorkflow } from "./sdd-workflow.mjs";
import { convergenceBudgetFor, decideConvergence } from "./converge.mjs";
import { checkReviewEvidence, deriveReviewOutcome, loadRuntimeCapabilities, resolveReviewCapability } from "./independent-review.mjs";

const circuitLevelOf = (workflow, level) => {
  const found = workflow.levels.find((l) => l.id === level);
  if (!found) throw new Error(`unknown SDD level: ${level}`);
  return found.circuitLevel;
};

// the reviewer's verdict as the outcome sees it once the convergence decision is terminal
const TERMINAL_VERDICT = { NEEDS_HUMAN_DECISION: "NEEDS_HUMAN_DECISION", BLOCKED: "BLOCKED" };

export async function implementAll({ tasks, level = "normal", implement, test, accept, fullSuite, review, selfReview = null, fix, revision = async () => null, capability = null, runtimes = loadRuntimeCapabilities(), builderInvocationId = null, persist = async () => {}, workflow = loadWorkflow(), humanGate = null }) {
  const depth = circuitLevelOf(workflow, level);
  const budget = convergenceBudgetFor(depth);
  const evidence = [];
  const completed = [];
  const reviews = [];
  const states = new Map(tasks.map((t) => [t.id, t.state]));
  // a reviewer is "defined" here when one was injected; that alone never makes it independent
  const cap = resolveReviewCapability({ runtime: capability?.runtime ?? null, agentDelegation: capability?.agentDelegation, contextIsolation: capability?.contextIsolation, reviewerDefined: typeof review === "function", runtimes });
  const outcomeOf = (fields) => deriveReviewOutcome({ capability: cap, builderInvocationId, policyGate: humanGate?.gate ?? "required", runtimes, ...fields });
  const result = (status, extra = {}) => ({
    status,
    completed,
    states: Object.fromEntries(states),
    evidence,
    capability: cap,
    reviews,
    ...extra,
  });

  // a gate derived by the Coordinator (see runtime/policy/hitl.mjs); a refused one never starts the loop
  if (humanGate && humanGate.ok === false) return result("BLOCKED", { reason: `human gate refused: ${(humanGate.reasons ?? []).join("; ")}`, escalation: "human_gate" });

  for (const task of tasks) {
    if (task.state === "done") continue;
    if (task.state === "blocked") return result("BLOCKED", { blockedTask: task.id, reason: "task already blocked", outcome: outcomeOf({ implementation: "BLOCKED" }) });
    const setState = async (state) => {
      states.set(task.id, state);
      await persist(task.id, state);
    };

    let converged = false;
    let diagnosis = null;
    for (let attempt = 1; attempt <= budget; attempt++) {
      let tested;
      try {
        await implement(task, { attempt, diagnosis });
        tested = await test(task);
      } catch (error) {
        evidence.push({ task: task.id, attempt, step: "error", passed: false, output: String(error?.message ?? error) });
        diagnosis = `agent error: ${String(error?.message ?? error).slice(0, 500)}`;
        continue;
      }
      evidence.push({ task: task.id, attempt, step: "test", passed: Boolean(tested?.passed), output: tested?.output ?? "" });
      if (!tested?.passed) {
        diagnosis = `tests failed: ${String(tested?.output ?? "").slice(0, 500)}`;
        continue;
      }
      let accepted;
      try {
        accepted = await accept(task);
      } catch (error) {
        evidence.push({ task: task.id, attempt, step: "error", passed: false, output: String(error?.message ?? error) });
        diagnosis = `agent error: ${String(error?.message ?? error).slice(0, 500)}`;
        continue;
      }
      evidence.push({ task: task.id, attempt, step: "acceptance", passed: Boolean(accepted?.accepted), output: accepted?.reason ?? "" });
      if (!accepted?.accepted) {
        diagnosis = `acceptance failed: ${accepted?.reason ?? "done-when not met"}`;
        continue;
      }
      converged = true;
      break;
    }
    if (!converged) {
      await setState("blocked");
      return result("BLOCKED", { blockedTask: task.id, reason: `task did not converge in ${budget} attempts`, escalation: "convergence_stalled", outcome: outcomeOf({ implementation: "BLOCKED" }) });
    }
    await setState("done");
    completed.push(task.id);
  }

  // the author of the change reviews only when no isolated reviewer is available, and that review never approves
  const independent = cap.independentReview === "available";
  const reviewer = independent ? review : selfReview;
  const kind = independent ? "independent" : "self";
  let previous = null;
  for (let iteration = 1; ; iteration++) {
    const suite = await fullSuite();
    evidence.push({ step: "full-suite", iteration, passed: Boolean(suite.passed), output: suite.output ?? "" });
    const validation = suite.passed ? "PASS" : "FAIL";
    const reviewedRevision = await revision();
    if (typeof reviewer !== "function") {
      return result("REVIEW_PENDING", { reason: "no reviewer can run in this session", outcome: outcomeOf({ implementation: "PASS", validation, currentRevision: reviewedRevision }) });
    }
    const reviewed = (await reviewer(iteration, { revision: reviewedRevision })) ?? {};
    const record = independent ? { ...reviewed, evidence: reviewed.evidence ?? null } : { ...reviewed, reviewedRevision };
    reviews.push({ kind, iteration, verdict: reviewed.verdict, reviewedRevision, openFindings: (reviewed.findings ?? []).filter((f) => f.status === "OPEN").length, ...(independent ? { evidence: record.evidence } : {}) });
    // independence that cannot be shown is not repairable by the Builder: stop, never approve
    const isolation = independent ? checkReviewEvidence(record.evidence, { runtimes, builderInvocationId, revision: reviewedRevision, verdict: reviewed.verdict ?? null }) : [];
    if (isolation.length) {
      return result("REVIEW_PENDING", { reason: `independent review not proven: ${isolation.join("; ")}`, outcome: outcomeOf({ implementation: "PASS", validation, independentReview: record, currentRevision: reviewedRevision }) });
    }
    // a red suite is never approvable: it becomes an explicit OPEN finding the Implementer can act on
    const view = suite.passed
      ? reviewed
      : { ...reviewed, verdict: "CHANGES_REQUESTED", findings: [...(reviewed.findings ?? []), { id: "SUITE", severity: "HIGH", description: `full suite failed: ${String(suite.output ?? "").slice(0, 300)}`, status: "OPEN" }] };
    const decision = decideConvergence({
      depth,
      iteration,
      reviewer: view,
      tests: { status: suite.passed ? "green" : "red", previouslyFailed: previous ? !previous.suitePassed : false },
      previous: previous && { findingsFingerprint: previous.fingerprint, openFindings: previous.open },
    });
    evidence.push({ step: independent ? "review" : "self-review", iteration, verdict: decision.verdict, openFindings: decision.findings.openCount });
    if (decision.terminal) {
      if (decision.verdict === "APPROVED") {
        const current = await revision();
        if (!independent) {
          return result("REVIEW_PENDING", { reason: "no independent review in this session: a self-review never approves", convergence: decision, outcome: outcomeOf({ implementation: "PASS", validation, selfReview: record, currentRevision: current }) });
        }
        if (current !== reviewedRevision) {
          // the change moved after the verdict: that verdict is stale, the new state needs its own review
          evidence.push({ step: "review-stale", iteration, reviewedRevision, currentRevision: current });
          if (iteration >= budget) return result("REVIEW_PENDING", { reason: "the last approval is stale and the review budget is spent", escalation: "convergence_stalled", convergence: decision, outcome: outcomeOf({ implementation: "PASS", validation, independentReview: record, currentRevision: current }) });
          previous = null;
          continue;
        }
        // an adverse review of this same revision stands (F2): a fix that changed nothing cannot be approved over it
        const outcome = outcomeOf({ implementation: "PASS", validation, independentReview: record, otherReviews: reviews, currentRevision: current });
        if (outcome.finalReviewStatus !== "APPROVED") {
          return result(outcome.finalReviewStatus === "REVIEW_PENDING" ? "REVIEW_PENDING" : "NEEDS_HUMAN_DECISION", { reason: "adverse_review_stands", cause: outcome.reasons.join("; "), convergence: decision, outcome });
        }
        return result("DONE", { convergence: decision, outcome });
      }
      const status = decision.verdict === "NEEDS_HUMAN_DECISION" ? "NEEDS_HUMAN_DECISION" : "BLOCKED";
      const terminal = { ...record, verdict: TERMINAL_VERDICT[decision.verdict] ?? record.verdict };
      const cause = reviewed.reason ?? decision.findings.open.map((f) => f.description).join("; ");
      return result(status, {
        reason: decision.escalation,
        ...(decision.escalation === "convergence_stalled" ? { nonConvergence: true } : {}),
        ...(cause ? { cause } : {}),
        findings: decision.findings.open,
        convergence: decision,
        outcome: outcomeOf({ implementation: "PASS", validation, currentRevision: reviewedRevision, ...(independent ? { independentReview: terminal } : { selfReview: terminal }) }),
      });
    }
    await fix(decision.findings.open);
    previous = { fingerprint: decision.findings.fingerprint, open: decision.findings.openCount, suitePassed: suite.passed };
  }
}
