import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const linkage = JSON.parse(
  await readFile(new URL("../config/agent-registry/evaluation-linkage.json", import.meta.url), "utf8")
);
const schema = JSON.parse(await readFile(new URL("../config/agent-registry.schema.json", import.meta.url), "utf8"));
const example = JSON.parse(
  await readFile(new URL("../examples/agent-registry-entry.valid.json", import.meta.url), "utf8")
);
const storage = JSON.parse(
  await readFile(new URL("../registries/agents/registry.storage.json", import.meta.url), "utf8")
);
const catalog = JSON.parse(
  await readFile(new URL("../config/agent-registry/capabilities.catalog.json", import.meta.url), "utf8")
);
const ownership = JSON.parse(
  await readFile(new URL("../config/agent-registry/ownership.policy.json", import.meta.url), "utf8")
);
const policy = JSON.parse(await readFile(new URL("../config/evaluation-policy.json", import.meta.url), "utf8"));
const program = JSON.parse(
  await readFile(new URL("../evaluation/enterprise-10-10/evaluation-program.json", import.meta.url), "utf8")
);
const benchmarks = JSON.parse(await readFile(new URL("../benchmarks/catalog.json", import.meta.url), "utf8"));
const datasets = JSON.parse(await readFile(new URL("../datasets/registry.json", import.meta.url), "utf8"));
const rubric = JSON.parse(await readFile(new URL("../scoring/rubric.json", import.meta.url), "utf8"));
const coverage = JSON.parse(await readFile(new URL("../validation/roadmap-coverage.json", import.meta.url), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(linkage.schemaVersion === "agent-registry-evaluation-linkage.v1", "linkage schema version must be v1");
assert(linkage.roadmapTask === "W5-T5", "linkage contract must bind to W5-T5");
assert(linkage.governance.roadmapTask === "W5-T5", "governance block must bind to W5-T5");
assert(linkage.governance.validation === "scripts/validate-agent-registry-evaluation-linkage.mjs", "validation path changed");
assert(linkage.governance.doesNotClose.includes("W5-T6"), "W5-T6 must remain outside W5-T5 closure");

for (const [name, path] of Object.entries(linkage.appliesTo)) {
  assert(existsSync(join(root, path)), `${name} target is missing: ${path}`);
}

for (const field of linkage.linkageContract.requiredBindingFields) {
  assert(linkage.bindings.every((binding) => Object.hasOwn(binding, field)), `all bindings must define ${field}`);
}
for (const evidence of linkage.linkageContract.evidenceRequired) {
  assert(policy.requiredEvidence.includes(evidence), `policy must require ${evidence} evidence`);
}

assert(policy.agentRegistryLinkage?.roadmapTask === "W5-T5", "policy must include W5-T5 agent registry linkage");
assert(policy.agentRegistryLinkage.contract === "config/agent-registry/evaluation-linkage.json", "policy linkage contract path changed");
assert(policy.agentRegistryLinkage.requiredBeforeActivation === true, "agent linkage must be required before activation");
assert(policy.agentRegistryLinkage.runtimeEvaluation === "not-created-by-w5-t5", "W5-T5 must not create runtime evaluation");
assert(policy.agentRegistryLinkage.agentExecution === "not-executed-by-w5-t5", "W5-T5 must not execute agents");
assert(policy.agentRegistryLinkage.doesNotClose.includes("W5-T6"), "policy must keep W5-T6 open");

assert(program.agentRegistryLinkage?.task === "W5-T5", "evaluation program must expose W5-T5 agent registry linkage");
assert(program.agentRegistryLinkage.contract === "config/agent-registry/evaluation-linkage.json", "program linkage contract path changed");
assert(program.agentRegistryLinkage.agentExecutionStatus === "not-executed", "W5-T5 must not execute agents");
assert(program.agentRegistryLinkage.evaluationRunStatus === "not-created", "W5-T5 must not create evaluation runs");
assert(program.agentRegistryLinkage.pipelineStatus === "not-created", "W5-T5 must not create pipelines");
assert(program.agentRegistryLinkage.resultStatus === "not-produced", "W5-T5 must not produce results");
assert(program.agentRegistryLinkage.doesNotClose.includes("W5-T6"), "program must keep W5-T6 open");

assert(schema.properties.evaluationSuite.description?.includes("W5-T5 defines evaluation linkage"), "schema must defer linkage to W5-T5");
assert(storage.roadmapTask === "W5-T2", "W5-T5 must build on W5-T2 storage");
assert(catalog.roadmapTask === "W5-T3", "W5-T5 must build on W5-T3 capability catalog");
assert(ownership.roadmapTask === "W5-T4", "W5-T5 must build on W5-T4 ownership");

const benchmarkById = new Map(benchmarks.benchmarks.map((benchmark) => [benchmark.id, benchmark]));
const datasetIds = new Set(datasets.datasets.map((dataset) => dataset.id));
const storageIds = new Set(storage.entries.map((entry) => entry.id));
const capabilityIds = new Set(catalog.capabilities.map((capability) => capability.id));
const ownershipByCapability = new Map();
for (const record of ownership.records) {
  for (const capabilityId of record.accountableCapabilities) {
    ownershipByCapability.set(capabilityId, record);
  }
}
const programBindings = new Set(
  program.agentRegistryLinkage.bindings.map((binding) => `${binding.agentId}:${binding.agentVersion}:${binding.capabilityId}`)
);

for (const binding of linkage.bindings) {
  assert(binding.agentId === example.id, `${binding.agentId} must match agent registry entry example`);
  assert(binding.agentVersion === example.version, `${binding.agentId} version must match agent registry entry example`);
  assert(binding.evaluationSuite === example.evaluationSuite.id, `${binding.agentId} evaluation suite mismatch`);
  assert(binding.minimumScore === example.evaluationSuite.minimumScore, `${binding.agentId} minimum score mismatch`);
  assert(storageIds.has(binding.sourceStorageEntry), `${binding.agentId} source storage entry missing`);
  assert(capabilityIds.has(binding.capabilityId), `${binding.agentId} capability missing from W5-T3 catalog`);

  const ownershipRecord = ownershipByCapability.get(binding.capabilityId);
  assert(ownershipRecord, `${binding.capabilityId} must have W5-T4 ownership`);
  assert(ownershipRecord.sourceStorageEntry === binding.sourceStorageEntry, `${binding.capabilityId} storage ownership mismatch`);
  assert(ownershipRecord.owner.team === binding.ownerTeam, `${binding.capabilityId} owner team mismatch`);
  assert(ownershipRecord.activationApproval === "not-approved", `${binding.capabilityId} must not be activated by W5-T5`);
  assert(ownershipRecord.runtimePermission === "not-granted", `${binding.capabilityId} must not receive runtime permission`);

  const benchmark = benchmarkById.get(binding.benchmarkId);
  assert(benchmark, `${binding.benchmarkId} must exist`);
  assert(benchmark.target === "agent", `${binding.benchmarkId} must target agents`);
  assert(benchmark.dataset === binding.datasetId, `${binding.benchmarkId} dataset mismatch`);
  assert(benchmark.scoringModel === binding.scoringModel, `${binding.benchmarkId} scoring model mismatch`);
  assert(benchmark.minimumScore === binding.minimumScore, `${binding.benchmarkId} minimum score mismatch`);
  assert(datasetIds.has(binding.datasetId), `${binding.datasetId} must exist`);
  assert(rubric.id === binding.scoringModel, `${binding.scoringModel} must match rubric id`);
  assert(
    programBindings.has(`${binding.agentId}:${binding.agentVersion}:${binding.capabilityId}`),
    `${binding.agentId}@${binding.agentVersion} missing program binding`
  );

  assert(binding.agentExecutionStatus === "not-executed", `${binding.agentId} must not have agent execution`);
  assert(binding.evaluationRunStatus === "not-created", `${binding.agentId} must not have an evaluation run`);
  assert(binding.pipelineStatus === "not-created", `${binding.agentId} must not have a pipeline`);
  assert(binding.resultStatus === "not-produced", `${binding.agentId} must not have produced results`);
  assert(binding.activationStatus === "not-approved", `${binding.agentId} must not be approved for activation`);

  for (const path of binding.traceability) {
    assert(existsSync(join(root, path)), `${binding.agentId} traceability path missing: ${path}`);
  }
}

for (const task of ["W5-T1", "W5-T2", "W5-T3", "W5-T4", "W5-T5"]) {
  assert(coverage.taskStates[task] === "IMPLEMENTED", `${task} must be marked IMPLEMENTED`);
}
assert(coverage.taskStates["W5-T6"] === "IMPLEMENTED", "W5-T6 must be marked IMPLEMENTED after product validation");
for (const file of coverage.tasks["W5-T5"]) {
  assert(existsSync(join(root, file)), `W5-T5 maps missing file ${file}`);
}

console.log("ENTERPRISE-10-10 W5-T5 agent registry evaluation linkage validation PASS");
