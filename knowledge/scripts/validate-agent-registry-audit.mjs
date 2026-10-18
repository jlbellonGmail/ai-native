import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), "utf8"));
}

const audit = await readJson("config/agent-registry/agent-registry.audit.json");
const schema = await readJson("config/agent-registry.schema.json");
const example = await readJson("examples/agent-registry-entry.valid.json");
const storage = await readJson("registries/agents/registry.storage.json");
const capabilitySchema = await readJson("config/agent-registry.capability.schema.json");
const catalog = await readJson("config/agent-registry/capabilities.catalog.json");
const ownership = await readJson("config/agent-registry/ownership.policy.json");
const linkage = await readJson("config/agent-registry/evaluation-linkage.json");
const coverage = await readJson("validation/roadmap-coverage.json");
const roadmapToFiles = await readFile(join(root, "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md"), "utf8");
const readme = await readFile(join(root, "config/agent-registry/README.md"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(path) {
  return existsSync(join(root, path));
}

assert(audit.schemaVersion === "agent-registry-audit.v1", "audit schema version must be agent-registry-audit.v1");
assert(audit.roadmapTask === "W5-T6", "audit contract must bind to W5-T6");
assert(audit.scope.workstream === "W5 Agent Registry", "audit workstream changed");
assert(audit.governance.roadmapTask === "W5-T6", "audit governance must bind to W5-T6");
assert(audit.governance.nextEligibleTask === "W6-T1", "W6-T1 must be the next eligible task after W5-T6");
assert(audit.governance.doesNotOpen.includes("W6-T1"), "W5-T6 must not open W6-T1");

for (const task of ["W5-T1", "W5-T2", "W5-T3", "W5-T4", "W5-T5"]) {
  assert(audit.scope.auditedTasks.includes(task), `${task} must be audited by W5-T6`);
  assert(coverage.taskStates[task] === "IMPLEMENTED", `${task} must be implemented for W5-T6 audit`);
}
assert(audit.scope.closedByThisTask.includes("W5-T6"), "W5-T6 must be closed only by the audit task");
assert(coverage.taskStates["W5-T6"] === "IMPLEMENTED", "W5-T6 must be marked IMPLEMENTED");
assert(!Object.hasOwn(coverage.taskStates, "W6-T1"), "W5-T6 must not add W6-T1 to product coverage");
for (const task of audit.scope.doesNotClose) {
  assert(task.startsWith("W6-"), `${task} must identify W6 non-closure scope`);
  assert(!Object.hasOwn(coverage.taskStates, task), `${task} must not be closed by W5-T6`);
}

for (const [name, path] of Object.entries(audit.auditInputs)) {
  assert(exists(path), `${name} audit input missing: ${path}`);
}
for (const validator of audit.validators) {
  assert(exists(validator), `audit validator target missing: ${validator}`);
}
for (const file of coverage.tasks["W5-T6"]) {
  assert(exists(file), `W5-T6 maps missing file ${file}`);
}

assert(schema.properties.governance.properties.roadmapTask.const === "W5-T1", "schema must remain bound to W5-T1");
assert(example.id === "knowledge.reviewer", "audit example agent id changed");
assert(storage.roadmapTask === "W5-T2", "storage contract must remain bound to W5-T2");
assert(capabilitySchema.properties.governance.properties.roadmapTask.const === "W5-T3", "capability schema must remain bound to W5-T3");
assert(catalog.roadmapTask === "W5-T3", "capability catalog must remain bound to W5-T3");
assert(ownership.roadmapTask === "W5-T4", "ownership contract must remain bound to W5-T4");
assert(linkage.roadmapTask === "W5-T5", "evaluation linkage contract must remain bound to W5-T5");

const storageById = new Map(storage.entries.map((entry) => [entry.id, entry]));
const capabilityById = new Map(catalog.capabilities.map((capability) => [capability.id, capability]));
const ownershipByStorageEntry = new Map(ownership.records.map((record) => [record.sourceStorageEntry, record]));

for (const capability of catalog.capabilities) {
  for (const sourceAgentEntry of capability.sourceAgentEntries) {
    assert(storageById.has(sourceAgentEntry), `${capability.id} source storage entry missing: ${sourceAgentEntry}`);
  }
  for (const required of capability.dependencyModel.requires) {
    assert(capabilityById.has(required), `${capability.id} requires unknown capability ${required}`);
  }
  for (const supported of capability.dependencyModel.supports) {
    assert(capabilityById.has(supported), `${capability.id} supports unknown capability ${supported}`);
  }
  for (const incompatible of capability.dependencyModel.incompatibleWith) {
    assert(capabilityById.has(incompatible), `${capability.id} incompatibleWith unknown capability ${incompatible}`);
  }
}

for (const entry of storage.entries) {
  assert(ownershipByStorageEntry.has(entry.id), `${entry.id} missing ownership record`);
}

for (const binding of linkage.bindings) {
  assert(binding.agentId === example.id, `${binding.agentId} must match schema example`);
  assert(binding.agentVersion === example.version, `${binding.agentId} version mismatch`);
  assert(storageById.has(binding.sourceStorageEntry), `${binding.sourceStorageEntry} missing storage entry`);
  assert(capabilityById.has(binding.capabilityId), `${binding.capabilityId} missing capability`);

  const capability = capabilityById.get(binding.capabilityId);
  assert(
    capability.sourceAgentEntries.includes(binding.sourceStorageEntry),
    `${binding.capabilityId} must bind to ${binding.sourceStorageEntry}`
  );

  const owner = ownershipByStorageEntry.get(binding.sourceStorageEntry);
  assert(owner.owner.team === binding.ownerTeam, `${binding.sourceStorageEntry} owner team mismatch`);
  assert(owner.accountableCapabilities.includes(binding.capabilityId), `${binding.sourceStorageEntry} ownership missing capability`);
  assert(owner.activationApproval === "not-approved", `${binding.sourceStorageEntry} must not be activated by W5-T6`);
  assert(owner.runtimePermission === "not-granted", `${binding.sourceStorageEntry} must not receive runtime permissions`);
  assert(binding.agentExecutionStatus === "not-executed", `${binding.agentId} must not execute during audit`);
  assert(binding.evaluationRunStatus === "not-created", `${binding.agentId} must not create evaluation run during audit`);

  for (const path of binding.traceability) {
    assert(exists(path), `${binding.agentId} traceability path missing: ${path}`);
  }
}

assert(readme.includes("AUDIT.md"), "agent registry README must list audit guide");
assert(readme.includes("agent-registry.audit.json"), "agent registry README must list audit contract");
assert(readme.includes("validate-agent-registry-audit.mjs"), "agent registry README must list audit validator");
assert(roadmapToFiles.includes("| W5-T6 | Agent Registry Audit |"), "roadmap-to-files must include W5-T6");
assert(roadmapToFiles.includes("agent-registry.audit.json"), "roadmap-to-files must map audit contract");
assert(!roadmapToFiles.includes("| W6-T1 |"), "roadmap-to-files must not open W6-T1 during W5-T6");

console.log("ENTERPRISE-10-10 W5-T6 agent registry audit validation PASS");
