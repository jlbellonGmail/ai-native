import { readFile } from "node:fs/promises";

const ownership = JSON.parse(
  await readFile(new URL("../config/agent-registry/ownership.policy.json", import.meta.url), "utf8")
);
const schema = JSON.parse(
  await readFile(new URL("../config/agent-registry.schema.json", import.meta.url), "utf8")
);
const example = JSON.parse(
  await readFile(new URL("../examples/agent-registry-entry.valid.json", import.meta.url), "utf8")
);
const storage = JSON.parse(
  await readFile(new URL("../registries/agents/registry.storage.json", import.meta.url), "utf8")
);
const catalog = JSON.parse(
  await readFile(new URL("../config/agent-registry/capabilities.catalog.json", import.meta.url), "utf8")
);
const coverage = JSON.parse(
  await readFile(new URL("../validation/roadmap-coverage.json", import.meta.url), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(ownership.schemaVersion === "agent-registry-ownership.v1", "ownership schema version must be agent-registry-ownership.v1");
assert(ownership.roadmapTask === "W5-T4", "ownership contract must bind to W5-T4");
assert(ownership.appliesTo.entrySchema === "config/agent-registry.schema.json", "ownership must bind to agent registry schema");
assert(ownership.appliesTo.storageContract === "registries/agents/registry.storage.json", "ownership must bind to storage contract");
assert(ownership.appliesTo.capabilityCatalog === "config/agent-registry/capabilities.catalog.json", "ownership must bind to capability catalog");
assert(ownership.governance.roadmapTask === "W5-T4", "governance block must bind to W5-T4");
assert(ownership.governance.validation === "scripts/validate-agent-registry-ownership.mjs", "ownership validation path changed");
for (const task of ["W5-T5", "W5-T6"]) {
  assert(ownership.governance.doesNotClose.includes(task), `${task} must remain outside W5-T4 closure`);
}

for (const field of ownership.ownershipModel.requiredOwnerFields) {
  assert(schema.properties.owner.required.includes(field), `agent schema owner must require ${field}`);
}
assert(schema.properties.owner.description?.includes("W5-T4 ownership policy"), "schema owner description must reference W5-T4 ownership policy");
assert(schema.properties.owner.description?.includes("not IAM"), "schema owner description must distinguish ownership from IAM");

const roleIds = new Set(ownership.ownershipModel.roles.map((role) => role.id));
for (const role of ["agent_owner", "approval_reviewer", "capability_steward", "risk_accountable", "registry_steward"]) {
  assert(roleIds.has(role), `missing ownership role ${role}`);
}
for (const mapping of ["maintenance", "changeReview", "capabilityConsistency", "riskControls", "registryConsistency"]) {
  assert(roleIds.has(ownership.accountability[mapping]), `${mapping} must map to a governed role`);
}

assert(ownership.approvalChain.states.includes(ownership.approvalChain.defaultState), "default approval state must be governed");
assert(ownership.approvalChain.activationRule === "human-review-required-before-active", "activation must require human review");
assert(ownership.approvalChain.nonGoals.includes("No IAM role is created."), "W5-T4 must not create IAM");
assert(ownership.approvalChain.nonGoals.includes("No runtime permission is granted."), "W5-T4 must not grant runtime permission");
assert(ownership.approvalChain.nonGoals.includes("No W5-T5 evaluation linkage is closed by W5-T4."), "W5-T5 must remain outside W5-T4");

const storageIds = new Set(storage.entries.map((entry) => entry.id));
const capabilityIds = new Set(catalog.capabilities.map((capability) => capability.id));
assert(storage.roadmapTask === "W5-T2", "W5-T4 must build on W5-T2 storage");
assert(catalog.roadmapTask === "W5-T3", "W5-T4 must build on W5-T3 capability catalog");

assert(Array.isArray(ownership.records) && ownership.records.length === storage.entries.length, "ownership must cover every W5-T2 storage entry");
const recordIds = new Set();
for (const record of ownership.records) {
  assert(!recordIds.has(record.id), `${record.id} ownership record is duplicated`);
  recordIds.add(record.id);
  assert(storageIds.has(record.sourceStorageEntry), `${record.id} references missing storage entry ${record.sourceStorageEntry}`);
  assert(ownership.ownershipModel.subjectTypes.includes(record.subjectType), `${record.id} has invalid subject type`);
  assert(record.owner.team === example.owner.team, `${record.id} owner team must match agent schema example owner`);
  assert(record.owner.contact === example.owner.contact, `${record.id} owner contact must match agent schema example owner`);
  assert(ownership.approvalChain.states.includes(record.approvalState), `${record.id} approval state is not governed`);
  assert(record.approvalState === ownership.approvalChain.defaultState, `${record.id} must remain in default approval state`);
  assert(record.activationApproval === "not-approved", `${record.id} must not be activated by W5-T4`);
  assert(record.runtimePermission === "not-granted", `${record.id} must not receive runtime permissions`);
  assert(record.iamProvisioning === "not-created", `${record.id} must not create IAM`);

  for (const role of roleIds) {
    assert(Object.hasOwn(record.roles, role), `${record.id} must assign ${role}`);
  }
  assert(record.accountabilityNotes.some((note) => note.includes("Evaluation linkage remains outside W5-T4")), `${record.id} must keep W5-T5 outside W5-T4`);

  for (const capabilityId of record.accountableCapabilities) {
    assert(capabilityIds.has(capabilityId), `${record.id} references unknown capability ${capabilityId}`);
  }
}

for (const capability of catalog.capabilities) {
  assert(
    ownership.records.some((record) => record.accountableCapabilities.includes(capability.id)),
    `${capability.id} must have an ownership record`
  );
}

assert(coverage.taskStates["W5-T1"] === "IMPLEMENTED", "W5-T1 must remain implemented");
assert(coverage.taskStates["W5-T2"] === "IMPLEMENTED", "W5-T2 must remain implemented");
assert(coverage.taskStates["W5-T3"] === "IMPLEMENTED", "W5-T3 must remain implemented");
assert(coverage.taskStates["W5-T4"] === "IMPLEMENTED", "W5-T4 must be marked IMPLEMENTED");
assert(coverage.taskStates["W5-T5"] === "IMPLEMENTED", "W5-T5 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W5-T6"] === "IMPLEMENTED", "W5-T6 must be marked IMPLEMENTED after product validation");
for (const file of coverage.tasks["W5-T4"]) {
  await readFile(new URL(`../${file}`, import.meta.url), "utf8");
}

console.log("ENTERPRISE-10-10 W5-T4 agent registry ownership validation PASS");
