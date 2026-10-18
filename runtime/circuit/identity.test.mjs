import { test } from "node:test";
import assert from "node:assert/strict";
import { assertValidSlug, getWorkUnitInfo, getItemState, assertItemsTransition, markItemsDone, resolveMaintenanceScope, validateTaskDag, TaskDagError } from "./identity.mjs";

// --- slug validation ---

test("Feature/Maintenance/Milestone slug patterns accept their own shape and reject the others", () => {
  assertValidSlug("Feature", "02-item-a");
  assertValidSlug("Maintenance", "T02-fix-bug");
  assertValidSlug("Milestone", "my-milestone");
  assert.throws(() => assertValidSlug("Feature", "T02-fix-bug"));
  assert.throws(() => assertValidSlug("Milestone", "02-item-a"), /invalid Milestone slug/);
  assert.throws(() => assertValidSlug("Maintenance", "02-item-a"));
});

// --- getWorkUnitInfo ---

test("getWorkUnitInfo computes branch/runDir for Feature, Milestone and Maintenance", () => {
  assert.deepEqual(getWorkUnitInfo("Feature", "02-item-a"), { mode: "Feature", slug: "02-item-a", branch: "feature/02-item-a", runDir: "runs/02-item-a", manifestPath: null });
  assert.deepEqual(getWorkUnitInfo("Maintenance", "T02-fix-bug"), { mode: "Maintenance", slug: "T02-fix-bug", branch: "maintenance/T02-fix-bug", runDir: "runs/T02-fix-bug", manifestPath: null });
  const milestone = getWorkUnitInfo("Milestone", "my-milestone");
  assert.equal(milestone.branch, "milestone/my-milestone");
  assert.equal(milestone.runDir, "runs/milestone-my-milestone");
  assert.equal(milestone.manifestPath, "runs/milestone-my-milestone/work-unit.json");
});

test("getWorkUnitInfo prefixes branch/runDir with the version when given", () => {
  const info = getWorkUnitInfo("Feature", "02-item-a", { version: "v3.0.0" });
  assert.equal(info.branch, "feature/v3.0.0-02-item-a");
  assert.equal(info.runDir, "runs/v3.0.0/02-item-a");
});

// --- getItemState ---

test("getItemState recognizes [ ] and the [~] read-only compat alias as Pending", () => {
  assert.equal(getItemState("- [ ] 02-item-a - Title\n", "02-item-a"), "Pending");
  assert.equal(getItemState("- [~] 02-item-a - Title\n", "02-item-a"), "Pending");
});

test("getItemState recognizes [x] as Done, and absence as Missing", () => {
  assert.equal(getItemState("- [x] 02-item-a - Title\n", "02-item-a"), "Done");
  assert.equal(getItemState("- [ ] 03-other - Title\n", "02-item-a"), "Missing");
});

test("getItemState recognizes a duplicated slug as Ambiguous", () => {
  const content = "- [ ] 02-item-a - A\n- [x] 02-item-a - A again\n";
  assert.equal(getItemState(content, "02-item-a"), "Ambiguous");
});

// --- assertItemsTransition / markItemsDone ---

test("markItemsDone flips [ ] straight to [x] (v3 has no persisted [-] state)", () => {
  const content = "- [ ] 02-item-a - Title\n";
  const updated = markItemsDone(content, ["02-item-a"]);
  assert.equal(updated, "- [x] 02-item-a - Title\n");
});

test("markItemsDone also closes the [~] compat alias", () => {
  const content = "- [~] 02-item-a - Title\n";
  assert.equal(markItemsDone(content, ["02-item-a"]), "- [x] 02-item-a - Title\n");
});

test("markItemsDone is all-or-nothing: if one item is not Pending, nothing is mutated", () => {
  const content = "- [ ] 02-item-a - A\n- [x] 03-item-b - B\n";
  assert.throws(() => markItemsDone(content, ["02-item-a", "03-item-b"]), /Invalid ROADMAP\.md transition/);
});

test("assertItemsTransition passes silently when every item is already in a fromState", () => {
  assert.doesNotThrow(() => assertItemsTransition("- [ ] a - A\n- [ ] b - B\n", ["a", "b"], ["Pending"], "Done"));
});

// --- resolveMaintenanceScope ---

const ROADMAP_WITH_T02 = "- [ ] T02-reconciliar-status - Reconciliacion\n";

test("resolveMaintenanceScope resolves a single canonical TNN candidate", () => {
  const result = resolveMaintenanceScope("maintenance/T02-reconciliar-status", ROADMAP_WITH_T02);
  assert.equal(result.scope, "canonical-unit");
  assert.equal(result.canonicalSlug, "T02-reconciliar-status");
  assert.equal(result.closeRoadmap, true);
});

test("resolveMaintenanceScope falls back to an allowlisted auxiliary purpose when there is no canonical TNN", () => {
  const result = resolveMaintenanceScope("maintenance/T09-status-refresh", "- [ ] T05-other - X\n");
  assert.equal(result.scope, "auxiliary");
  assert.equal(result.canonicalSlug, null);
});

test("resolveMaintenanceScope fails safely (throws) for a non-allowlisted purpose with no canonical TNN", () => {
  assert.throws(() => resolveMaintenanceScope("maintenance/T09-mystery-change", "- [ ] T05-other - X\n"), /FAILED_SAFELY/);
});

test("resolveMaintenanceScope throws on an ambiguous TNN (multiple candidates)", () => {
  const roadmap = "- [ ] T02-item-one - A\n- [ ] T02-item-two - B\n";
  assert.throws(() => resolveMaintenanceScope("maintenance/T02-item-one", roadmap), /ambiguous identity/);
});

test("resolveMaintenanceScope throws on an invalid branch shape", () => {
  assert.throws(() => resolveMaintenanceScope("maintenance/not-a-tnn-slug", ROADMAP_WITH_T02), /invalid Maintenance branch/);
});

// --- validateTaskDag (CIR-23, PAR-TASK-DAG) ---

test("validateTaskDag with no tasks declared accepts any order", () => {
  assert.deepEqual(validateTaskDag(["a", "b"], []), ["a", "b"]);
  assert.deepEqual(validateTaskDag(["a", "b"], undefined), ["a", "b"]);
});

test("validateTaskDag returns a topological order respecting dependsOn", () => {
  const tasks = [
    { id: "a", dependsOn: [] },
    { id: "b", dependsOn: ["a"] },
    { id: "c", dependsOn: ["b"] },
  ];
  const order = validateTaskDag(["a", "b", "c"], tasks);
  assert.ok(order.indexOf("a") < order.indexOf("b"));
  assert.ok(order.indexOf("b") < order.indexOf("c"));
});

test("validateTaskDag throws on a dependency cycle", () => {
  const tasks = [
    { id: "a", dependsOn: ["b"] },
    { id: "b", dependsOn: ["a"] },
  ];
  assert.throws(() => validateTaskDag(["a", "b"], tasks), TaskDagError);
});

test("validateTaskDag throws when a task depends on an unknown task id", () => {
  const tasks = [{ id: "a", dependsOn: ["ghost"] }];
  assert.throws(() => validateTaskDag(["a"], tasks), /unknown task/);
});

test("validateTaskDag throws when an item has no corresponding task", () => {
  const tasks = [{ id: "a", dependsOn: [] }];
  assert.throws(() => validateTaskDag(["a", "b"], tasks), /item 'b' has no corresponding task/);
});

test("validateTaskDag throws when a task id is declared more than once", () => {
  const tasks = [
    { id: "a", dependsOn: [] },
    { id: "a", dependsOn: [] },
  ];
  assert.throws(() => validateTaskDag(["a"], tasks), /appears in more than one task/);
});

test("validateTaskDag throws when a task id does not correspond to any manifest item", () => {
  const tasks = [{ id: "ghost-task", dependsOn: [] }];
  assert.throws(() => validateTaskDag(["a"], tasks), /does not correspond to any item/);
});
