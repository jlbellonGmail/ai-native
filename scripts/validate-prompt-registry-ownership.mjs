import { readFile } from "node:fs/promises";

const ownership = JSON.parse(
  await readFile(new URL("../config/prompt-registry/ownership.policy.json", import.meta.url), "utf8")
);
const schema = JSON.parse(
  await readFile(new URL("../config/prompt-registry.schema.json", import.meta.url), "utf8")
);
const example = JSON.parse(
  await readFile(new URL("../examples/prompt-registry-entry.valid.json", import.meta.url), "utf8")
);
const storage = JSON.parse(
  await readFile(new URL("../registries/prompts/registry.storage.json", import.meta.url), "utf8")
);
const versioning = JSON.parse(
  await readFile(new URL("../config/prompt-registry/versioning.compatibility.json", import.meta.url), "utf8")
);
const coverage = JSON.parse(
  await readFile(new URL("../validation/roadmap-coverage.json", import.meta.url), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(ownership.schemaVersion === "prompt-registry-ownership.v1", "ownership schema version must be prompt-registry-ownership.v1");
assert(ownership.roadmapTask === "W4-T4", "ownership contract must bind to W4-T4");
assert(ownership.appliesTo.entrySchema === "config/prompt-registry.schema.json", "ownership must bind to prompt registry schema");
assert(ownership.appliesTo.storageContract === "registries/prompts/registry.storage.json", "ownership must bind to storage contract");
assert(ownership.appliesTo.versioningContract === "config/prompt-registry/versioning.compatibility.json", "ownership must bind to versioning contract");
assert(ownership.governance.roadmapTask === "W4-T4", "governance block must bind to W4-T4");
for (const task of ["W4-T5", "W4-T6"]) {
  assert(ownership.governance.doesNotClose.includes(task), `${task} must remain outside W4-T4 closure`);
}

for (const field of ownership.ownershipModel.requiredOwnerFields) {
  assert(schema.properties.owner.required.includes(field), `schema owner must require ${field}`);
}
assert(schema.properties.owner.description?.includes("W4-T4"), "schema owner description must reference W4-T4 ownership policy");

const roleIds = new Set(ownership.ownershipModel.roles.map((role) => role.id));
for (const role of ["prompt_owner", "prompt_reviewer", "risk_accountable", "registry_steward"]) {
  assert(roleIds.has(role), `missing ownership role ${role}`);
  assert(Object.hasOwn(ownership.accountability, role === "prompt_owner" ? "maintenance" : role === "prompt_reviewer" ? "changeReview" : role === "risk_accountable" ? "riskControls" : "registryConsistency"), `${role} must have an accountability mapping`);
}

assert(ownership.approvalRules.states.includes(ownership.approvalRules.defaultState), "default approval state must be a governed state");
assert(ownership.approvalRules.activationRule === "human-review-required-before-active", "activation must require human review");
assert(ownership.approvalRules.nonGoals.includes("No W4-T5 evaluation linkage is closed by W4-T4."), "W4-T5 must remain outside ownership closure");

const storageIds = new Set(storage.entries.map((entry) => entry.id));
const versionsByPrompt = new Map();
for (const promptVersion of versioning.promptVersions) {
  const versions = versionsByPrompt.get(promptVersion.id) ?? new Set();
  versions.add(promptVersion.version);
  versionsByPrompt.set(promptVersion.id, versions);
}

assert(Array.isArray(ownership.records) && ownership.records.length > 0, "ownership records are required");
const recordIds = new Set();
for (const record of ownership.records) {
  assert(storageIds.has(record.id), `${record.id} must exist in storage registry`);
  assert(versionsByPrompt.has(record.id), `${record.id} must exist in versioning contract`);
  assert(!recordIds.has(record.id), `${record.id} ownership record is duplicated`);
  recordIds.add(record.id);

  assert(record.owner.team === example.owner.team, `${record.id} owner team must match schema example owner`);
  assert(record.owner.contact === example.owner.contact, `${record.id} owner contact must match schema example owner`);
  assert(ownership.approvalRules.states.includes(record.approvalState), `${record.id} approval state is not governed`);
  assert(record.activationApproval === "not-approved", `${record.id} must not be activated by W4-T4`);

  for (const role of roleIds) {
    assert(Object.hasOwn(record.roles, role), `${record.id} must assign ${role}`);
  }

  const governedVersions = versionsByPrompt.get(record.id);
  for (const version of record.appliesToVersions) {
    assert(governedVersions.has(version), `${record.id} version ${version} must exist in versioning contract`);
  }
  assert(record.accountabilityNotes.some((note) => note.includes("Evaluation linkage remains outside W4-T4")), `${record.id} must keep W4-T5 outside W4-T4`);
}

assert(coverage.taskStates["W4-T1"] === "IMPLEMENTED", "W4-T1 must remain implemented");
assert(coverage.taskStates["W4-T2"] === "IMPLEMENTED", "W4-T2 must remain implemented");
assert(coverage.taskStates["W4-T3"] === "IMPLEMENTED", "W4-T3 must remain implemented");
assert(coverage.taskStates["W4-T4"] === "IMPLEMENTED", "W4-T4 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W4-T5"] === "IMPLEMENTED", "W4-T5 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W4-T6"] === "READY_FOR_FUTURE_TASK", "W4-T6 must remain next task");

for (const file of coverage.tasks["W4-T4"]) {
  await readFile(new URL(`../${file}`, import.meta.url), "utf8");
}

console.log("ENTERPRISE-10-10 W4-T4 prompt registry ownership validation PASS");
