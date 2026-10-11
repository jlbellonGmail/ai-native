// /sdd-implement-all as an executable loop (first-class, not "run implement N times").
// The agents are injected, so the loop is testable and runtime-neutral:
//   implement(task, { attempt, diagnosis }) -> void      (Implementer)
//   test(task)      -> { passed, output }                 (targeted tests)
//   accept(task)    -> { accepted, reason }               (done-when / acceptance)
//   fullSuite()     -> { passed, output }                 (official regression suite)
//   review(iteration) -> { verdict, findings }            (independent Reviewer, read-only)
//   fix(findings)   -> void                               (Implementer, via the Coordinator)
//   persist(taskId, state) -> void   optional: writes the task state (e.g. tasks.md) as it changes;
//                                    without it the returned `states` is the only record
// An agent that throws counts as a failed attempt with that error as the diagnosis.
// Guarantees: strict task order; bounded convergence per task (detect ->
// diagnose -> fix -> retest) using the level budget from contracts/sdd-levels.json;
// a task that does not converge BLOCKS the work unit, later tasks stay pending
// and are never reported as done; the review loop reuses decideConvergence.
import { loadWorkflow } from "./sdd-workflow.mjs";
import { convergenceBudgetFor, decideConvergence } from "./converge.mjs";

const circuitLevelOf = (workflow, level) => {
  const found = workflow.levels.find((l) => l.id === level);
  if (!found) throw new Error(`unknown SDD level: ${level}`);
  return found.circuitLevel;
};

export async function implementAll({ tasks, level = "normal", implement, test, accept, fullSuite, review, fix, persist = async () => {}, workflow = loadWorkflow() }) {
  const depth = circuitLevelOf(workflow, level);
  const budget = convergenceBudgetFor(depth);
  const evidence = [];
  const completed = [];
  const states = new Map(tasks.map((t) => [t.id, t.state]));
  const result = (status, extra = {}) => ({
    status,
    completed,
    states: Object.fromEntries(states),
    evidence,
    ...extra,
  });

  for (const task of tasks) {
    if (task.state === "done") continue;
    if (task.state === "blocked") return result("BLOCKED", { blockedTask: task.id, reason: "task already blocked" });
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
      return result("BLOCKED", { blockedTask: task.id, reason: `task did not converge in ${budget} attempts`, escalation: "convergence_stalled" });
    }
    await setState("done");
    completed.push(task.id);
  }

  let previous = null;
  for (let iteration = 1; ; iteration++) {
    const suite = await fullSuite();
    evidence.push({ step: "full-suite", iteration, passed: Boolean(suite.passed), output: suite.output ?? "" });
    const reviewed = await review(iteration);
    // a red suite is never approvable: it becomes an explicit OPEN finding the Implementer can act on
    const reviewer = suite.passed
      ? reviewed
      : { ...reviewed, verdict: "CHANGES_REQUESTED", findings: [...(reviewed.findings ?? []), { id: "SUITE", severity: "HIGH", description: `full suite failed: ${String(suite.output ?? "").slice(0, 300)}`, status: "OPEN" }] };
    const decision = decideConvergence({
      depth,
      iteration,
      reviewer,
      tests: { status: suite.passed ? "green" : "red", previouslyFailed: previous ? !previous.suitePassed : false },
      previous: previous && { findingsFingerprint: previous.fingerprint, openFindings: previous.open },
    });
    evidence.push({ step: "review", iteration, verdict: decision.verdict, openFindings: decision.findings.openCount });
    if (decision.terminal) {
      if (decision.verdict === "APPROVED") return result("DONE", { convergence: decision });
      const status = decision.verdict === "NEEDS_HUMAN_DECISION" ? "NEEDS_HUMAN_DECISION" : "BLOCKED";
      return result(status, { reason: decision.escalation, convergence: decision });
    }
    await fix(decision.findings.open);
    previous = { fingerprint: decision.findings.fingerprint, open: decision.findings.openCount, suitePassed: suite.passed };
  }
}
