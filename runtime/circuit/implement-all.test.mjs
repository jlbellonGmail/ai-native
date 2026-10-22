import { test } from "node:test";
import assert from "node:assert/strict";
import { implementAll } from "./implement-all.mjs";
import { runCoordinator, validateHandoff, phasesFor } from "./coordinator.mjs";

const task = (id, state = "pending") => ({ id, title: id, state, requirements: [], doneWhen: "ok" });
// a runtime that can run the Reviewer isolated, and the evidence such a review leaves (no reasoning, only who/how/what)
const REV = "sha256:rev-1";
// what core/agents.json would say about a runtime the platform verified, and what its adapter attests for a review
const RUNTIMES = { "test-runtime": { independentReview: "verified", evidence: "x", executions: { "delegated-fresh-context": "verified", "separate-process": "unavailable" } } };
const ISOLATED = { runtime: "test-runtime", agentDelegation: "available", contextIsolation: "available" };
const evidence = (verdict = "APPROVED", reviewedRevision = REV) => ({ runtime: "test-runtime", agent: "reviewer", execution: "delegated-fresh-context", isolation: "fresh-context", reviewId: "review-1", reviewedRevision, verdict, attestation: { source: "runtime", adapter: "test-runtime", agentId: "agent-1" } });
const approve = () => ({ verdict: "APPROVED", findings: [], evidence: evidence() });
const pass = () => ({ passed: true, output: "ok" });
const coordinate = (args) => runCoordinator({ capability: ISOLATED, runtimes: RUNTIMES, ...args });

function harness(overrides = {}) {
  const calls = [];
  const agents = {
    implement: async (t, ctx) => { calls.push(["implement", t.id, ctx.attempt, ctx.diagnosis]); },
    test: async (t) => { calls.push(["test", t.id]); return pass(); },
    accept: async (t) => { calls.push(["accept", t.id]); return { accepted: true }; },
    fullSuite: async () => { calls.push(["suite"]); return pass(); },
    review: async () => { calls.push(["review"]); return approve(); },
    fix: async () => { calls.push(["fix"]); },
    revision: async () => REV,
    capability: ISOLATED,
    runtimes: RUNTIMES,
    ...overrides,
  };
  return { calls, agents };
}

test("implement-all: strict sequential order, then full suite, then review", async () => {
  const { calls, agents } = harness();
  const run = await implementAll({ tasks: [task("T1"), task("T2"), task("T3")], level: "normal", ...agents });
  assert.equal(run.status, "DONE");
  assert.deepEqual(run.completed, ["T1", "T2", "T3"]);
  const order = calls.map((c) => c.slice(0, 2).join(":"));
  assert.deepEqual(order, ["implement:T1", "test:T1", "accept:T1", "implement:T2", "test:T2", "accept:T2", "implement:T3", "test:T3", "accept:T3", "suite", "review"]);
});

test("implement-all: already-done tasks are skipped (no reimplementation)", async () => {
  const { calls, agents } = harness();
  const run = await implementAll({ tasks: [task("T1", "done"), task("T2")], level: "light", ...agents });
  assert.equal(run.status, "DONE");
  assert.deepEqual(run.completed, ["T2"]);
  assert.ok(!calls.some((c) => c[0] === "implement" && c[1] === "T1"));
});

test("implement-all: convergence retries with the diagnosis, then succeeds", async () => {
  let failures = 1;
  const { calls, agents } = harness({
    test: async (t) => (t.id === "T2" && failures-- > 0 ? { passed: false, output: "expected 2 got 3" } : pass()),
  });
  const run = await implementAll({ tasks: [task("T1"), task("T2")], level: "normal", ...agents });
  assert.equal(run.status, "DONE");
  const retry = calls.find((c) => c[0] === "implement" && c[1] === "T2" && c[2] === 2);
  assert.match(retry[3], /tests failed: expected 2 got 3/);
  assert.equal(run.evidence.filter((e) => e.task === "T2" && e.step === "test").length, 2);
});

test("implement-all: a task that never converges BLOCKS the unit, later tasks stay pending", async () => {
  const { calls, agents } = harness({ test: async (t) => (t.id === "T2" ? { passed: false, output: "boom" } : pass()) });
  const run = await implementAll({ tasks: [task("T1"), task("T2"), task("T3")], level: "light", ...agents });
  assert.equal(run.status, "BLOCKED");
  assert.equal(run.blockedTask, "T2");
  assert.deepEqual(run.completed, ["T1"]);
  assert.deepEqual(run.states, { T1: "done", T2: "blocked", T3: "pending" });
  assert.equal(calls.filter((c) => c[0] === "implement" && c[1] === "T2").length, 2, "light budget is 2 attempts");
  assert.ok(!calls.some((c) => c[1] === "T3"), "T3 is never started");
  assert.ok(!calls.some((c) => c[0] === "suite"), "no full suite on a blocked unit");
});

test("implement-all: failed acceptance is treated like a failure, never as success", async () => {
  const { agents } = harness({ accept: async () => ({ accepted: false, reason: "done-when not met" }) });
  const run = await implementAll({ tasks: [task("T1")], level: "light", ...agents });
  assert.equal(run.status, "BLOCKED");
  assert.deepEqual(run.completed, []);
});

test("implement-all: an already blocked task stops the run immediately", async () => {
  const { calls, agents } = harness();
  const run = await implementAll({ tasks: [task("T1", "blocked"), task("T2")], level: "normal", ...agents });
  assert.equal(run.status, "BLOCKED");
  assert.equal(calls.length, 0);
});

test("implement-all: review findings are fixed through the loop until approved", async () => {
  let round = 0;
  let rev = REV;
  const { calls, agents } = harness({
    review: async () => (++round === 1
      ? { verdict: "CHANGES_REQUESTED", findings: [{ id: "F1", severity: "HIGH", description: "missing edge case", status: "OPEN" }], evidence: evidence("CHANGES_REQUESTED") }
      : { verdict: "APPROVED", findings: [{ id: "F1", severity: "HIGH", description: "missing edge case", status: "RESOLVED" }], evidence: evidence("APPROVED", "sha256:rev-2") }),
    fix: async () => { calls.push(["fix"]); rev = "sha256:rev-2"; },
    revision: async () => rev,
  });
  const run = await implementAll({ tasks: [task("T1")], level: "normal", ...agents });
  assert.equal(run.status, "DONE");
  assert.equal(run.outcome.finalReviewStatus, "APPROVED");
  assert.equal(calls.filter((c) => c[0] === "fix").length, 1);
  assert.equal(calls.filter((c) => c[0] === "suite").length, 2, "suite re-run after the fix");
});

test("implement-all (F2, L1): a fix that changes nothing cannot be approved over the adverse review of the same revision", async () => {
  let round = 0;
  const { agents } = harness({
    review: async () => (++round === 1
      ? { verdict: "CHANGES_REQUESTED", findings: [{ id: "F1", severity: "HIGH", description: "missing edge case", status: "OPEN" }], evidence: evidence("CHANGES_REQUESTED") }
      : approve()),
  });
  const run = await implementAll({ tasks: [task("T1")], level: "normal", ...agents, humanGate: { ok: true, gate: "none" } });
  assert.equal(run.status, "NEEDS_HUMAN_DECISION");
  assert.equal(run.reason, "adverse_review_stands");
  assert.equal(run.outcome.finalReviewStatus, "CHANGES_REQUESTED");
  assert.equal(run.outcome.humanGate, "required");
  // and the Coordinator does not report it ready
  const trace = [];
  const unchanged = coordinatorAgents(trace);
  let rounds = 0;
  unchanged.reviewer.review = async () => (++rounds === 1 ? { verdict: "CHANGES_REQUESTED", findings: [{ id: "F1", severity: "HIGH", description: "x", status: "OPEN" }], evidence: evidence("CHANGES_REQUESTED") } : approve());
  const coordinated = await coordinate({ goal: "fix balance rounding", signals: { scope: 1 }, agents: unchanged });
  assert.equal(coordinated.status, "NEEDS_HUMAN_DECISION");
  assert.equal(coordinated.gate.gate, "required");
  assert.ok(!trace.includes("validate"));
});

test("implement-all: review that never improves stops (no infinite loop) and is not DONE", async () => {
  const stuck = { verdict: "CHANGES_REQUESTED", findings: [{ id: "F1", severity: "HIGH", description: "same", status: "OPEN" }], evidence: evidence("CHANGES_REQUESTED") };
  const { calls, agents } = harness({ review: async () => stuck });
  const run = await implementAll({ tasks: [task("T1")], level: "normal", ...agents });
  assert.equal(run.status, "BLOCKED");
  assert.equal(run.reason, "convergence_stalled");
  assert.ok(calls.filter((c) => c[0] === "fix").length <= 4);
});

test("implement-all: a red full suite cannot be approved", async () => {
  const { agents } = harness({ fullSuite: async () => ({ passed: false, output: "1 failed" }), review: async () => approve() });
  const run = await implementAll({ tasks: [task("T1")], level: "light", ...agents });
  assert.notEqual(run.status, "DONE");
});

test("handoff validation: complete handoffs pass, hidden/incomplete ones are rejected", () => {
  const ok = { from: "coordinator", to: "planner", phase: "specify", workUnit: "feature", level: "normal", artifacts: [] };
  assert.deepEqual(validateHandoff(ok), []);
  assert.ok(validateHandoff({ ...ok, artifacts: undefined }).includes("handoff missing 'artifacts'"));
  assert.ok(validateHandoff({ ...ok, to: "wizard" }).some((e) => e.includes("unknown role")));
  assert.ok(validateHandoff({ ...ok, level: "extreme" }).some((e) => e.includes("invalid level")));
  assert.ok(validateHandoff({ ...ok, artifacts: [1] }).some((e) => e.includes("list of paths")));
});

test("phases per work unit and level", () => {
  assert.deepEqual(phasesFor("task", "light"), ["implement", "validate"]);
  assert.deepEqual(phasesFor("feature", "normal"), ["specify", "plan", "tasks", "implement", "validate"]);
  assert.deepEqual(phasesFor("feature", "full"), ["specify", "clarify", "plan", "tasks", "implement", "validate"]);
  assert.deepEqual(phasesFor("milestone", "full"), ["decompose"]);
});

function coordinatorAgents(trace) {
  const tasksMd = "- [ ] **T1. A.** RF-1\n  - Done when: ok.\n- [ ] **T2. B.** RF-2\n  - Done when: ok.\n";
  return {
    planner: {
      spec: async () => { trace.push("spec"); return { artifact: "specs/001-x/spec.md" }; },
      clarify: async () => { trace.push("clarify"); return { artifact: "specs/001-x/spec.md" }; },
      plan: async () => { trace.push("plan"); return { artifact: "specs/001-x/plan.md" }; },
      tasks: async () => { trace.push("tasks"); return { artifact: "specs/001-x/tasks.md" }; },
      readTasks: async () => tasksMd,
      decompose: async ({ goal }) => { trace.push("decompose"); return [{ workUnit: "feature", goal: `${goal} / A` }, { workUnit: "task", goal: `${goal} / B` }]; },
    },
    implementer: {
      implement: async (t) => { trace.push(`implement:${t.id}`); },
      fix: async () => { trace.push("fix"); },
    },
    verify: {
      revision: async () => REV,
      test: async () => pass(),
      accept: async () => ({ accepted: true }),
      fullSuite: async () => { trace.push("suite"); return pass(); },
    },
    reviewer: {
      review: async () => { trace.push("review"); return approve(); },
      validate: async () => { trace.push("validate"); return { verdict: "APPROVED", evidence: evidence() }; },
    },
  };
}

test("E2E automatic Task+light: minimal artifacts, no spec/plan/tasks phases", async () => {
  const trace = [];
  const out = await coordinate({ goal: "fix balance rounding", signals: { scope: 1 }, agents: coordinatorAgents(trace) });
  assert.equal(out.status, "READY_FOR_HITL");
  assert.equal(out.classification.workUnit, "task");
  assert.equal(out.classification.level, "light");
  assert.deepEqual(trace, ["implement:T1", "suite", "review", "validate"]);
});

test("E2E automatic Feature+normal: classify -> plan -> implement -> test -> review -> validate", async () => {
  const trace = [];
  const out = await coordinate({ goal: "weekly goal", signals: { newCapability: true, scope: 1, complexity: 1 }, agents: coordinatorAgents(trace) });
  assert.equal(out.status, "READY_FOR_HITL");
  assert.equal(out.classification.level, "normal");
  assert.deepEqual(trace, ["spec", "plan", "tasks", "implement:T1", "implement:T2", "suite", "review", "validate"]);
  assert.deepEqual(out.log.filter((l) => l.handoff).map((l) => l.handoff.to), ["planner", "planner", "planner", "implementer", "reviewer"]);
});

test("E2E automatic Feature+full adds the formal clarify phase", async () => {
  const trace = [];
  const out = await coordinate({ goal: "payments migration", signals: { newCapability: true, migration: true }, agents: coordinatorAgents(trace) });
  assert.equal(out.classification.level, "full");
  assert.deepEqual(trace.slice(0, 4), ["spec", "clarify", "plan", "tasks"]);
  assert.equal(out.status, "READY_FOR_HITL");
});

test("E2E Milestone is decomposed into work units, never run as one mega-spec", async () => {
  const trace = [];
  const out = await coordinate({ goal: "billing overhaul", signals: { capabilities: 3 }, agents: coordinatorAgents(trace) });
  assert.equal(out.status, "DECOMPOSED");
  assert.deepEqual(out.workUnits.map((w) => w.workUnit), ["feature", "task"]);
  assert.deepEqual(trace, ["decompose"]);
});

test("E2E coordinator never reports ready when the work unit is blocked or the reviewer rejects", async () => {
  const blockedTrace = [];
  const blocked = coordinatorAgents(blockedTrace);
  blocked.verify.test = async () => ({ passed: false, output: "red" });
  const a = await coordinate({ goal: "x", signals: { newCapability: true }, agents: blocked });
  assert.equal(a.status, "BLOCKED");
  assert.ok(!blockedTrace.includes("validate"));

  const rejected = coordinatorAgents([]);
  rejected.reviewer.validate = async () => ({ verdict: "CHANGES_REQUESTED" });
  const b = await coordinate({ goal: "x", signals: { newCapability: true }, agents: rejected });
  assert.equal(b.status, "CHANGES_REQUESTED");
});

test("E2E coordinator refuses to run on an invalid workflow contract", async () => {
  const bad = structuredClone((await import("./sdd-workflow.mjs")).loadWorkflow());
  bad.commands.push({ ...bad.commands[0] });
  const out = await coordinate({ goal: "x", agents: coordinatorAgents([]), workflow: bad });
  assert.equal(out.status, "BLOCKED");
  assert.match(out.reason, /invalid workflow contract/);
});

test("implement-all persists every state change, including the block", async () => {
  const writes = [];
  const { agents } = harness({ test: async (t) => (t.id === "T2" ? { passed: false, output: "red" } : pass()) });
  const run = await implementAll({ tasks: [task("T1"), task("T2"), task("T3")], level: "light", persist: async (id, state) => { writes.push([id, state]); }, ...agents });
  assert.equal(run.status, "BLOCKED");
  assert.deepEqual(writes, [["T1", "done"], ["T2", "blocked"]]);
});

test("implement-all: an agent that throws is a failed attempt with the error as diagnosis, then converges or blocks", async () => {
  let boom = 1;
  const { calls, agents } = harness({ test: async (t) => { if (t.id === "T1" && boom-- > 0) throw new Error("runner crashed"); return pass(); } });
  const ok = await implementAll({ tasks: [task("T1")], level: "normal", ...agents });
  assert.equal(ok.status, "DONE");
  assert.match(calls.find((c) => c[0] === "implement" && c[2] === 2)[3], /agent error: runner crashed/);
  const never = harness({ implement: async () => { throw new Error("always"); } });
  const blocked = await implementAll({ tasks: [task("T1")], level: "light", ...never.agents });
  assert.equal(blocked.status, "BLOCKED");
  assert.equal(blocked.states.T1, "blocked");
});

test("implement-all: a red suite approved by the Reviewer becomes an actionable finding, not an empty fix", async () => {
  let suiteRuns = 0;
  const fixed = [];
  const { agents } = harness({
    fullSuite: async () => (++suiteRuns === 1 ? { passed: false, output: "2 failed" } : pass()),
    fix: async (findings) => { fixed.push(findings); },
  });
  const run = await implementAll({ tasks: [task("T1")], level: "normal", ...agents });
  assert.equal(run.status, "DONE");
  assert.equal(fixed.length, 1);
  assert.equal(fixed[0][0].id, "SUITE");
  assert.match(fixed[0][0].description, /2 failed/);
});

test("a Task never gets spec phases, whatever the level", () => {
  assert.deepEqual(phasesFor("task", "normal"), ["implement", "validate"]);
  assert.deepEqual(phasesFor("task", "full"), ["implement", "validate"]);
});

const NONE = { humanGate: "none", autonomy: "full" };

test("gate wiring: a low-risk Task with human_gate none, allowed by the repo, completes DONE with no human step", async () => {
  const trace = [];
  const agents = coordinatorAgents(trace);
  agents.verify.changedPaths = async () => ["docs/guide.md"];
  const out = await coordinate({ goal: "fix typo", signals: { scope: 1, changedPaths: ["docs/guide.md"] }, agents, policy: { declared: NONE, allowNone: true } });
  assert.equal(out.status, "DONE");
  assert.equal(out.gate.gate, "none");
});

test("gate wiring: the same declaration is refused when the repo does not allow none, before any work", async () => {
  const trace = [];
  const out = await coordinate({ goal: "fix typo", signals: { scope: 1, changedPaths: ["docs/guide.md"] }, agents: coordinatorAgents(trace), policy: { declared: NONE } });
  assert.equal(out.status, "BLOCKED");
  assert.match(out.reason, /human gate refused.*repository's policy/);
  assert.deepEqual(trace, []);
});

test("gate wiring: high risk announced -> none refused; high risk only discovered after the work -> blocked, not DONE", async () => {
  const early = await coordinate({ goal: "g", signals: { scope: 1, changedPaths: ["scripts/deploy.sh"] }, agents: coordinatorAgents([]), policy: { declared: NONE, allowNone: true } });
  assert.equal(early.status, "BLOCKED");
  const agents = coordinatorAgents([]);
  agents.verify.changedPaths = async () => ["docs/a.md", "src/auth/login.js"];
  const late = await coordinate({ goal: "g", signals: { scope: 1, changedPaths: ["docs/a.md"] }, agents, policy: { declared: NONE, allowNone: true } });
  assert.equal(late.status, "BLOCKED");
  assert.match(late.reason, /not allowed for high risk/);
});

test("gate wiring: required stops before implementation; default final-only ends READY_FOR_HITL", async () => {
  const trace = [];
  const req = await coordinate({ goal: "g", signals: { scope: 1, changedPaths: ["docs/a.md"] }, agents: coordinatorAgents(trace), policy: { declared: { humanGate: "required" } } });
  assert.equal(req.status, "AWAITING_HUMAN_APPROVAL");
  assert.ok(!trace.some((t) => t.startsWith("implement")));
  const out = await coordinate({ goal: "g", signals: { scope: 1 }, agents: coordinatorAgents([]) });
  assert.equal(out.status, "READY_FOR_HITL");
});

test("implementAll refuses to start with a refused gate", async () => {
  const { calls, agents } = harness();
  const run = await implementAll({ tasks: [task("T1")], level: "light", humanGate: { ok: false, gate: "required", reasons: ["no"] }, ...agents });
  assert.equal(run.status, "BLOCKED");
  assert.equal(run.escalation, "human_gate");
  assert.deepEqual(calls, []);
});

test("review: human_gate none without the changedPaths evidence is refused; final-only does not need it", async () => {
  const none = await coordinate({ goal: "g", signals: { scope: 1, changedPaths: ["docs/a.md"] }, agents: coordinatorAgents([]), policy: { declared: NONE, allowNone: true } });
  assert.equal(none.status, "BLOCKED");
  assert.match(none.reason, /changedPaths/);
  const empty = coordinatorAgents([]);
  empty.verify.changedPaths = async () => [];
  assert.equal((await coordinate({ goal: "g", signals: { scope: 1, changedPaths: ["docs/a.md"] }, agents: empty, policy: { declared: NONE, allowNone: true } })).status, "BLOCKED");
  const fo = await coordinate({ goal: "g", signals: { scope: 1, changedPaths: ["docs/a.md"] }, agents: coordinatorAgents([]) });
  assert.equal(fo.status, "READY_FOR_HITL");
});
