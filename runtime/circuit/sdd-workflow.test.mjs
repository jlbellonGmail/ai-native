import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  PLATFORM_ROOT, loadWorkflow, validateWorkflow, selectLevel, classifyWorkUnit, parseTasks,
  validateSpecFolder, deriveSddStatus, markTaskState, requirementIds,
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
  const walk = (rel) => {
    const full = join(PLATFORM_ROOT, rel);
    if (statSync(full).isDirectory()) {
      if (rel.endsWith("node_modules")) return;
      for (const entry of readdirSync(full)) walk(`${rel}/${entry}`);
    } else if (/\.(md|json|mjs)$/.test(rel) && !own.has(rel)) {
      const text = readFileSync(full, "utf8");
      for (const name of workflow.retiredNames) {
        if (new RegExp(`(^|[^a-z-])${name}([^a-z-]|$)`).test(text)) hits.push(`${rel}: ${name}`);
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
  const validate = workflow.commands.find((c) => c.name === "sdd-validate");
  validate.mutatesCode = true;
  workflow.commands.find((c) => c.name === "sdd-spec").mutatesCode = true;
  const errors = validateWorkflow(workflow);
  assert.ok(errors.some((e) => e.includes("sdd-validate: cannot be both readOnly and mutatesCode")));
  assert.ok(errors.some((e) => e.includes("sdd-spec: role 'planner' is not allowed to write code")));
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

test("cleanup of temp folders is not required for assertions (sanity)", () => {
  const dir = folder({ "spec.md": SPEC });
  mkdirSync(join(dir, "x"));
  rmSync(dir, { recursive: true, force: true });
});
