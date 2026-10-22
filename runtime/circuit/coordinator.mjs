// Coordinator (automatic mode): classify -> select level -> plan -> delegate ->
// implement -> test -> review -> validate. The Coordinator never implements;
// it only calls injected agents and validates every handoff between phases
// (a handoff is the contract between roles: no hidden chat context).
//   planner.spec/clarify/plan/tasks(ctx) -> { artifact }
//   implementer: consumed through implementAll (see implement-all.mjs); implementer.selfReview is optional
//   reviewer.review/validate(ctx) -> { verdict, evidence }
//   verify.revision() -> identity of the current change; capability -> runtime facts (independent-review.mjs)
import { classifyWorkUnit, loadWorkflow, parseTasks, validateWorkflow } from "./sdd-workflow.mjs";
import { implementAll } from "./implement-all.mjs";
import { checkReviewEvidence, loadRuntimeCapabilities } from "./independent-review.mjs";
import { deriveHumanGate } from "../policy/hitl.mjs";

const HANDOFF_FIELDS = ["from", "to", "phase", "workUnit", "level", "artifacts"];

/** Errors for an invalid handoff (null/empty artifacts, unknown roles, bad level). */
export function validateHandoff(handoff, workflow = loadWorkflow()) {
  const errors = [];
  for (const field of HANDOFF_FIELDS) {
    if (handoff?.[field] === undefined || handoff[field] === null) errors.push(`handoff missing '${field}'`);
  }
  if (errors.length) return errors;
  const roles = new Set(workflow.roles.map((r) => r.id));
  if (!roles.has(handoff.from)) errors.push(`handoff from unknown role '${handoff.from}'`);
  if (!roles.has(handoff.to)) errors.push(`handoff to unknown role '${handoff.to}'`);
  if (!workflow.levels.some((l) => l.id === handoff.level)) errors.push(`handoff has invalid level '${handoff.level}'`);
  if (!workflow.workUnits.some((w) => w.id === handoff.workUnit)) errors.push(`handoff has invalid work unit '${handoff.workUnit}'`);
  if (!Array.isArray(handoff.artifacts) || handoff.artifacts.some((a) => typeof a !== "string")) errors.push("handoff artifacts must be a list of paths");
  return errors;
}

/** Plan of phases (and their roles) for a work unit/level; light has no spec folder. */
export function phasesFor(workUnit, level) {
  if (workUnit === "milestone") return ["decompose"];
  // a Task never has a spec folder, whatever the level; only a Feature does
  if (workUnit === "task" || level === "light") return ["implement", "validate"];
  const phases = ["specify"];
  if (level === "full") phases.push("clarify");
  phases.push("plan", "tasks", "implement", "validate");
  return phases;
}

// `policy` = { declared, environment, allowNone, controlPlanePatterns }: facts for the human gate. Risk is never taken
// from it: it is derived from signals.changedPaths and, after the work, from agents.verify.changedPaths().
export async function runCoordinator({ goal, signals = {}, agents, workflow = loadWorkflow(), policy = {}, capability = null, runtimes = loadRuntimeCapabilities() }) {
  const problems = validateWorkflow(workflow);
  if (problems.length) return { status: "BLOCKED", reason: `invalid workflow contract: ${problems[0]}`, log: [] };

  const classification = classifyWorkUnit(signals);
  const log = [{ phase: "classify", goal, ...classification }];
  const { workUnit, level } = classification;
  const gateFor = (paths) => deriveHumanGate({ ...policy, changedPaths: paths });
  let gate = gateFor(signals.changedPaths ?? []);
  log.push({ phase: "human-gate", gate: gate.gate, risk: gate.risk, ok: gate.ok });
  if (!gate.ok) return { status: "BLOCKED", reason: `human gate refused: ${gate.reasons.join("; ")}`, classification, log };
  const phases = phasesFor(workUnit, level);
  if (workUnit === "milestone") {
    const parts = await agents.planner.decompose({ goal, level });
    return { status: "DECOMPOSED", classification, workUnits: parts, log };
  }

  const artifacts = [];
  let previous = "coordinator";
  const hand = (to, phase) => {
    const errors = validateHandoff({ from: previous, to, phase, workUnit, level, artifacts: [...artifacts] }, workflow);
    if (errors.length) throw new Error(`invalid handoff to ${to} at ${phase}: ${errors.join("; ")}`);
    log.push({ phase, handoff: { from: previous, to } });
    previous = to;
  };

  try {
    for (const phase of phases.filter((p) => ["specify", "clarify", "plan", "tasks"].includes(p))) {
      hand("planner", phase);
      const produced = await agents.planner[phase === "specify" ? "spec" : phase]({ goal, level, artifacts: [...artifacts] });
      artifacts.push(produced.artifact);
    }
    if (gate.gate === "required") return { status: "AWAITING_HUMAN_APPROVAL", reason: "human_gate required: a human approves the plan before implementation", gate, classification, log };
    hand("implementer", "implement");
    const tasks = phases[0] === "implement" ? [{ id: "T1", title: goal, state: "pending", requirements: [], doneWhen: "acceptance met" }] : parseTasks(await agents.planner.readTasks());
    const run = await implementAll({ tasks, level, workflow, humanGate: gate, capability, runtimes, ...agents.implementer, ...agents.verify, review: agents.reviewer?.review, fix: agents.implementer.fix });
    log.push({ phase: "implement", status: run.status, completed: run.completed, review: run.outcome?.finalReviewStatus });
    // without an independent approval the work unit is never ready, and the human gate stays required
    if (run.status !== "DONE") return { status: run.status, classification, run, outcome: run.outcome, ...(run.outcome ? { gate: { ...gate, gate: run.outcome.humanGate } } : {}), log };
    // the gate is re-derived from what actually changed: a bigger change than announced cannot keep a lighter gate
    const actual = await agents.verify?.changedPaths?.();
    // `none` is the only gate that completes with no human step, so it needs this evidence: without it, refuse
    if (gate.gate === "none" && !(Array.isArray(actual) && actual.length)) {
      return { status: "BLOCKED", reason: "human gate refused: human_gate none needs agents.verify.changedPaths() to confirm what actually changed", classification, run, log };
    }
    if (Array.isArray(actual) && actual.length) {
      gate = gateFor(actual);
      log.push({ phase: "human-gate", gate: gate.gate, risk: gate.risk, ok: gate.ok, derivedFrom: "actual changes" });
      if (!gate.ok) return { status: "BLOCKED", reason: `human gate refused: ${gate.reasons.join("; ")}`, classification, run, log };
    }
    hand("reviewer", "validate");
    const revision = await agents.verify?.revision?.();
    const validation = await agents.reviewer.validate({ goal, level, artifacts: [...artifacts], revision });
    // the final validation is a review too: it approves only with its own isolation evidence on this revision
    const isolation = validation.verdict === "APPROVED" ? checkReviewEvidence(validation.evidence, { runtimes, revision, verdict: validation.verdict }) : [];
    log.push({ phase: "validate", verdict: validation.verdict, ...(isolation.length ? { notIndependent: isolation } : {}) });
    if (isolation.length) {
      return { status: "REVIEW_PENDING", reason: `final validation not independent: ${isolation.join("; ")}`, gate: { ...gate, gate: "required" }, classification, run, log };
    }
    const approved = validation.verdict === "APPROVED";
    // merge and release stay protected by the repository whatever the gate says; `none` only means no work-unit step
    return { status: approved ? (gate.gate === "none" ? "DONE" : "READY_FOR_HITL") : "CHANGES_REQUESTED", gate: approved ? gate : { ...gate, gate: "required" }, classification, run, outcome: run.outcome, log };
  } catch (error) {
    return { status: "BLOCKED", reason: error.message, classification, log };
  }
}
