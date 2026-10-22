import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  PLATFORM_ROOT, loadWorkflow, validateWorkflow, selectLevel, classifyWorkUnit, parseTasks,
  validateSpecFolder, deriveSddStatus, formatSddStatus, markTaskState, requirementIds, persistTaskState,
} from "./sdd-workflow.mjs";

const SPEC = "# Spec 001\n- RF-1. WHEN x, THE SYSTEM y.\n- RF-2. THE SYSTEM z.\n";
const PLAN = "# Plan\nCovers RF-1, RF-2\n";
const TASKS = "- [ ] **T1. First.** RF-1\n  - Done when: test passes.\n- [ ] **T2. Second.** RF-2\n  - Done when: test passes.\n";

function folder(files) {
  const dir = mkdtempSync(join(tmpdir(), "sdd-"));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  return dir;
}

test("the shipped contract is consistent with core/, sdd-levels and command bodies", () => {
  assert.deepEqual(validateWorkflow(), []);
});

test("canonical command catalog is exactly the documented interface", () => {
  const names = loadWorkflow().commands.map((c) => c.name).sort();
  assert.deepEqual(names, ["feature", "sdd-analyze", "sdd-change", "sdd-clarify", "sdd-implement", "sdd-implement-all", "sdd-plan", "sdd-spec", "sdd-status", "sdd-tasks", "sdd-validate"]);
});

test("Implementer is the role and implement the action: retired names are absent from the whole repo surface", () => {
  const workflow = loadWorkflow();
  const roots = ["core", "contracts", "runtime", ".agents", "knowledge/sdd"];
  const own = new Set(["contracts/sdd-workflow.json", "contracts/sdd-workflow.schema.json", "runtime/circuit/sdd-workflow.test.mjs", "knowledge/sdd/methodology/migration.md"]);
  const hits = [];
  // Dirent-based walk: no stat-then-read gap between checking a path and opening it
  const walk = (rel) => {
    for (const entry of readdirSync(join(PLATFORM_ROOT, rel), { withFileTypes: true })) {
      const child = `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") walk(child);
      } else if (entry.isFile() && /\.(md|json|mjs)$/.test(entry.name) && !own.has(child)) {
        const text = readFileSync(join(PLATFORM_ROOT, child), "utf8");
        for (const name of workflow.retiredNames) {
          if (new RegExp(`(^|[^a-z-])${name}([^a-z-]|$)`).test(text)) hits.push(`${child}: ${name}`);
        }
      }
    }
  };
  roots.forEach(walk);
  assert.deepEqual(hits, []);
});

test("validateWorkflow rejects a role mapped to nothing, duplicates and retired command names", () => {
  const workflow = structuredClone(loadWorkflow());
  workflow.roles[2].runtimeRole = "ghost";
  workflow.commands.push({ ...workflow.commands[0] });
  workflow.commands.push({ ...workflow.commands[1], name: "sdd-implementer" });
  const errors = validateWorkflow(workflow);
  assert.ok(errors.some((e) => e.includes("'ghost' is not in core/agents.json")));
  assert.ok(errors.some((e) => e.includes("duplicate command: feature")));
  assert.ok(errors.some((e) => e.includes("retired name")));
  assert.ok(errors.some((e) => e.includes("runtime role 'builder' is mapped by 0")));
});

test("a read-only command cannot mutate code and a planner cannot write code", () => {
  const workflow = structuredClone(loadWorkflow());
  const analyze = workflow.commands.find((c) => c.name === "sdd-analyze");
  analyze.mutatesCode = true;
  workflow.commands.find((c) => c.name === "sdd-spec").mutatesCode = true;
  const errors = validateWorkflow(workflow);
  assert.ok(errors.some((e) => e.includes("sdd-analyze: cannot be both readOnly and mutatesCode")));
  assert.ok(errors.some((e) => e.includes("sdd-spec: role 'planner' is not allowed to write code")));
});

test("F4: sdd-validate coordinates and records a review: a coordinator command whose only write is the review state", () => {
  const validate = loadWorkflow().commands.find((c) => c.name === "sdd-validate");
  assert.deepEqual({ role: validate.role, readOnly: validate.readOnly, mutatesCode: validate.mutatesCode, writes: validate.writes }, { role: "coordinator", readOnly: false, mutatesCode: false, writes: "review-state" });
  for (const [label, mutate, expected] of [
    ["declared read-only again", (c) => { c.readOnly = true; }, /sdd-validate: writes review-state, so it is neither readOnly nor mutatesCode/],
    ["owned by the reviewer again", (c) => { c.role = "reviewer"; }, /sdd-validate: only a state-only role \(coordinator\) may write the review state/],
    ["write left undeclared", (c) => { delete c.writes; }, /sdd-validate: records a review, so it must declare writes/],
  ]) {
    const workflow = structuredClone(loadWorkflow());
    mutate(workflow.commands.find((c) => c.name === "sdd-validate"));
    assert.match(validateWorkflow(workflow).join("\n"), expected, label);
  }
});

test("level selection: small reversible work is light, file count alone never decides", () => {
  assert.equal(selectLevel({}).level, "light");
  assert.equal(selectLevel({ scope: 1, complexity: 1 }).level, "light");
  assert.equal(selectLevel({ scope: 1, complexity: 1, impact: 1, uncertainty: 1 }).level, "normal");
  assert.equal(selectLevel({ scope: 2, complexity: 2, impact: 2, uncertainty: 1 }).level, "normal");
  assert.equal(selectLevel({ scope: 2, complexity: 2, impact: 2, uncertainty: 2 }).level, "full");
  assert.equal(selectLevel({ irreversibility: 2 }).level, "full");
  assert.equal(selectLevel({ security: true }).level, "full");
  assert.equal(selectLevel({ migration: true }).level, "full");
  assert.throws(() => selectLevel({ risk: 3 }), /integer 0\.\.2/);
});

test("classification: Task+light, Feature+normal, Feature+full, Milestone", () => {
  assert.deepEqual(classifyWorkUnit({ scope: 1 }), { workUnit: "task", level: "light", score: 1, reasons: [] });
  const feature = classifyWorkUnit({ newCapability: true, scope: 1, complexity: 1 });
  assert.equal(feature.workUnit, "feature");
  assert.equal(feature.level, "normal");
  assert.equal(classifyWorkUnit({ newCapability: true, breakingChange: true }).level, "full");
  const heavyTask = classifyWorkUnit({ security: true });
  assert.equal(heavyTask.workUnit, "feature", "a heavy Task is promoted, not inflated");
  const milestone = classifyWorkUnit({ capabilities: 3, newCapability: true });
  assert.equal(milestone.workUnit, "milestone");
  assert.equal(milestone.level, "full");
});

test("tasks.md parsing: ids, states, requirements, done-when and invalid lines", () => {
  const tasks = parseTasks("- [x] **T1. Done one.** RF-1\n  - Done when: ok.\n- [!] **T2. Stuck.** RF-2, RF-3\n  - Hecho cuando: algo.\n- [~] **T3. Bad.**\n");
  assert.deepEqual(tasks.map((t) => t.state ?? "invalid"), ["done", "blocked", "invalid"]);
  assert.deepEqual(tasks[1].requirements, ["RF-2", "RF-3"]);
  assert.equal(tasks[1].doneWhen, "algo.");
  assert.deepEqual(requirementIds(SPEC), ["RF-1", "RF-2"]);
});

test("markTaskState flips one checkbox and nothing else, and rejects unknown tasks", () => {
  const next = markTaskState(TASKS, "T2", "done");
  assert.equal(next, TASKS.replace("- [ ] **T2.", "- [x] **T2."));
  assert.throws(() => markTaskState(TASKS, "T9", "done"), /task not found/);
  assert.throws(() => markTaskState(TASKS, "T1", "weird"), /invalid task state/);
});

test("spec folder validation: missing spec, orphan artifacts, bad tasks, broken references", () => {
  assert.deepEqual(validateSpecFolder(folder({ "spec.md": SPEC, "plan.md": PLAN, "tasks.md": TASKS })), []);
  assert.deepEqual(validateSpecFolder(folder({}), { level: "light" }), [], "light needs no artifacts");
  assert.ok(validateSpecFolder(folder({})).includes("missing spec.md"));
  assert.ok(validateSpecFolder(folder({ "plan.md": PLAN })).includes("plan.md exists without spec.md"));
  assert.ok(validateSpecFolder(folder({ "spec.md": SPEC, "tasks.md": TASKS })).includes("tasks.md exists without plan.md"));
  const bad = "- [ ] **T1. A.** RF-9\n- [ ] **T1. B.** RF-1\n  - Done when: x.\n- [?] oops\n";
  const errors = validateSpecFolder(folder({ "spec.md": SPEC, "plan.md": PLAN, "tasks.md": bad }));
  assert.ok(errors.some((e) => e.includes("T1 has no \"Done when\"")));
  assert.ok(errors.some((e) => e.includes("cites RF-9")));
  assert.ok(errors.some((e) => e.includes("duplicate task id T1")));
  assert.ok(errors.some((e) => e.includes("invalid task line")));
  // self-correction needs the error to say how to fix it: free-form tasks get the expected format, not just "no tasks"
  const freeForm = validateSpecFolder(folder({ "spec.md": SPEC, "plan.md": PLAN, "tasks.md": "## Task 1: do it\n**Done when:** ok\n" }));
  assert.ok(freeForm.some((e) => /has no tasks.*- \[ \] \*\*T1\. Title\.\*\* RF-1.*Done when/.test(e)), freeForm.join("|"));
  assert.ok(errors.some((e) => /invalid task line.*- \[ \] \*\*T1\. Title\.\*\*/.test(e)));
  const open = folder({ "spec.md": `${SPEC}[NEEDS CLARIFICATION] who?\n` });
  assert.ok(validateSpecFolder(open, { level: "full" }).some((e) => e.includes("NEEDS CLARIFICATION")));
});

test("status derives phase and exact next command from the artifacts only", () => {
  const slug = "001-demo";
  assert.equal(deriveSddStatus(folder({}), slug).next, '/sdd-spec 001-demo "<idea>"');
  assert.equal(deriveSddStatus(folder({ "spec.md": `${SPEC}[NEEDS CLARIFICATION] q\n` }), slug).phase, "clarify");
  assert.equal(deriveSddStatus(folder({ "spec.md": SPEC }), slug).next, "/sdd-plan 001-demo");
  assert.equal(deriveSddStatus(folder({ "spec.md": SPEC, "plan.md": PLAN }), slug).next, "/sdd-tasks 001-demo");
  const mid = deriveSddStatus(folder({ "spec.md": SPEC, "plan.md": PLAN, "tasks.md": markTaskState(TASKS, "T1", "done") }), slug);
  assert.deepEqual(mid.tasks, { done: 1, pending: 1, blocked: 0, total: 2 });
  assert.match(mid.next, /\/sdd-implement 001-demo T2/);
  const done = deriveSddStatus(folder({ "spec.md": SPEC, "plan.md": PLAN, "tasks.md": markTaskState(markTaskState(TASKS, "T1", "done"), "T2", "done") }), slug);
  assert.equal(done.next, "/sdd-validate 001-demo");
  const stuck = deriveSddStatus(folder({ "spec.md": SPEC, "plan.md": PLAN, "tasks.md": markTaskState(TASKS, "T1", "blocked") }), slug);
  assert.match(stuck.next, /unblock T1/);
});


test("light status never asks for a spec folder; a heavy-level Task is not given spec phases", () => {
  const status = deriveSddStatus(folder({}), "001-x", { level: "light" });
  assert.equal(status.phase, "implement");
  assert.match(status.next, /^Task flow/);
});

test("tasks.md with CRLF line endings parses and updates without corruption", () => {
  const crlf = TASKS.split("\n").join("\r\n");
  assert.deepEqual(parseTasks(crlf).map((t) => t.id), ["T1", "T2"]);
  assert.equal(parseTasks(crlf)[0].doneWhen, "test passes.");
  const next = markTaskState(crlf, "T1", "done");
  assert.equal(next, crlf.replace("- [ ] **T1.", "- [x] **T1."));
});

test("persistTaskState writes the new state to disk", () => {
  const dir = folder({ "tasks.md": TASKS });
  persistTaskState(join(dir, "tasks.md"), "T1", "blocked");
  assert.equal(parseTasks(readFileSync(join(dir, "tasks.md"), "utf8"))[0].state, "blocked");
  assert.ok(!readdirSync(dir).some((f) => f.endsWith(".tmp")), "write-then-rename leaves no temp file");
});

test("a state-only role may mutate code only through an explicit orchestrates flag", () => {
  const workflow = structuredClone(loadWorkflow());
  delete workflow.commands.find((c) => c.name === "sdd-implement-all").orchestrates;
  assert.ok(validateWorkflow(workflow).some((e) => e.includes("only an orchestrating command")));
});

test("level budgets come from contracts/sdd-levels.json for every user-facing level", async () => {
  const { convergenceBudgetFor } = await import("./converge.mjs");
  const budgets = Object.fromEntries(loadWorkflow().levels.map((l) => [l.id, convergenceBudgetFor(l.circuitLevel)]));
  assert.deepEqual(budgets, { light: 2, normal: 4, full: 6 });
});

test("feature status is derived from tasks.md: progress, last completed, blockers and next", () => {
  const tasks = "- [x] **T1. First.** RF-1\n  - Done when: test passes.\n- [!] **T2. Second.** RF-2\n  - Done when: test passes.\n- [ ] **T3. Third.** RF-2\n  - Done when: test passes.\n";
  const dir = folder({ "spec.md": SPEC, "plan.md": PLAN, "tasks.md": tasks });
  assert.equal(formatSddStatus(deriveSddStatus(dir, "001-demo")), [
    "STATE: blocked", "PROGRESS: 1/3 tasks", "LAST COMPLETED: T1. First", "NEXT: unblock T2, then /sdd-implement 001-demo T2", "BLOCKERS: T2. Second",
  ].join("\n"));
  // marking tasks done changes the status with no second file to update
  persistTaskState(join(dir, "tasks.md"), "T2", "done");
  persistTaskState(join(dir, "tasks.md"), "T3", "done");
  assert.equal(formatSddStatus(deriveSddStatus(dir, "001-demo")), [
    "STATE: validate", "PROGRESS: 3/3 tasks", "LAST COMPLETED: T3. Third", "NEXT: /sdd-validate 001-demo", "BLOCKERS: none",
  ].join("\n"));
});

test("status before tasks exist says so and points to the next command", () => {
  assert.equal(formatSddStatus(deriveSddStatus(folder({ "spec.md": SPEC, "plan.md": PLAN }), "001-demo")), [
    "STATE: tasks", "PROGRESS: no tasks yet", "LAST COMPLETED: -", "NEXT: /sdd-tasks 001-demo", "BLOCKERS: none",
  ].join("\n"));
});
