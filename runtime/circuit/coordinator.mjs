// Coordinator (automatic mode): classify -> select level -> plan -> delegate ->
// implement -> test -> review -> validate. The Coordinator never implements;
// it only calls injected agents and validates every handoff between phases
// (a handoff is the contract between roles: no hidden chat context).
//   planner.spec/clarify/plan/tasks(ctx) -> { artifact }
//   implementer: consumed through implementAll (see implement-all.mjs)
//   reviewer.validate(ctx) -> { verdict }
import { classifyWorkUnit, loadWorkflow, parseTasks, validateWorkflow } from "./sdd-workflow.mjs";
import { implementAll } from "./implement-all.mjs";

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

export async function runCoordinator({ goal, signals = {}, agents, workflow = loadWorkflow() }) {
  const problems = validateWorkflow(workflow);
  if (problems.length) return { status: "BLOCKED", reason: `invalid workflow contract: ${problems[0]}`, log: [] };

  const classification = classifyWorkUnit(signals);
  const log = [{ phase: "classify", goal, ...classification }];
  const { workUnit, level } = classification;
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
    hand("implementer", "implement");
    const tasks = phases[0] === "implement" ? [{ id: "T1", title: goal, state: "pending", requirements: [], doneWhen: "acceptance met" }] : parseTasks(await agents.planner.readTasks());
    const run = await implementAll({ tasks, level, workflow, ...agents.implementer, ...agents.verify, review: agents.reviewer.review, fix: agents.implementer.fix });
    log.push({ phase: "implement", status: run.status, completed: run.completed });
    if (run.status !== "DONE") return { status: run.status, classification, run, log };
    hand("reviewer", "validate");
    const validation = await agents.reviewer.validate({ goal, level, artifacts: [...artifacts] });
    log.push({ phase: "validate", verdict: validation.verdict });
    return { status: validation.verdict === "APPROVED" ? "READY_FOR_HITL" : "CHANGES_REQUESTED", classification, run, log };
  } catch (error) {
    return { status: "BLOCKED", reason: error.message, classification, log };
  }
}
