import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const linkage = JSON.parse(
  await readFile(new URL("../config/prompt-registry/evaluation-linkage.json", import.meta.url), "utf8")
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
const ownership = JSON.parse(
  await readFile(new URL("../config/prompt-registry/ownership.policy.json", import.meta.url), "utf8")
);
const policy = JSON.parse(
  await readFile(new URL("../config/evaluation-policy.json", import.meta.url), "utf8")
);
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

assert(linkage.schemaVersion === "prompt-registry-evaluation-linkage.v1", "linkage schema version must be v1");
assert(linkage.roadmapTask === "W4-T5", "linkage contract must bind to W4-T5");
assert(linkage.governance.roadmapTask === "W4-T5", "governance block must bind to W4-T5");
assert(linkage.governance.doesNotClose.includes("W4-T6"), "W4-T6 must remain outside W4-T5 closure");
assert(linkage.governance.validation === "scripts/validate-prompt-registry-evaluation-linkage.mjs", "validation path changed");

for (const [name, path] of Object.entries(linkage.appliesTo)) {
  assert(existsSync(join(root, path)), `${name} target is missing: ${path}`);
}

for (const evidence of linkage.linkageContract.evidenceRequired) {
  assert(policy.requiredEvidence.includes(evidence), `policy must require ${evidence} evidence`);
}
assert(policy.forbiddenAsSoleEvidence.includes("governance_archive"), "governance archive cannot be sole evidence");
assert(policy.promptRegistryLinkage?.roadmapTask === "W4-T5", "policy must include W4-T5 prompt registry linkage");
assert(policy.promptRegistryLinkage.requiredBeforeActivation === true, "linkage must be required before activation");
assert(policy.promptRegistryLinkage.runtimeEvaluation === "not-created-by-w4-t5", "W4-T5 must not create runtime evaluation");

assert(program.promptRegistryLinkage?.task === "W4-T5", "evaluation program must expose W4-T5 prompt registry linkage");
assert(program.promptRegistryLinkage.contract === "config/prompt-registry/evaluation-linkage.json", "program linkage contract path changed");
assert(program.promptRegistryLinkage.runtimeStatus === "not-executed", "W4-T5 must not execute evaluations");
assert(program.promptRegistryLinkage.pipelineStatus === "not-created", "W4-T5 must not create pipelines");
assert(program.promptRegistryLinkage.resultStatus === "not-produced", "W4-T5 must not produce results");

const benchmarkById = new Map(benchmarks.benchmarks.map((benchmark) => [benchmark.id, benchmark]));
const datasetIds = new Set(datasets.datasets.map((dataset) => dataset.id));
const storageCoordinates = new Set(storage.entries.map((entry) => `${entry.id}:${entry.storageSlot}`));
const versionByCoordinate = new Map(versioning.promptVersions.map((promptVersion) => [`${promptVersion.id}:${promptVersion.version}`, promptVersion]));
const ownershipByPrompt = new Map(ownership.records.map((record) => [record.id, record]));
const programBindings = new Set(program.promptRegistryLinkage.bindings.map((binding) => `${binding.promptId}:${binding.promptVersion}`));

for (const binding of linkage.bindings) {
  assert(binding.promptId === example.id, `${binding.promptId} must match prompt registry entry example`);
  assert(binding.evaluationSuite === example.evaluationSuite.id, `${binding.promptId} evaluation suite mismatch`);
  assert(binding.minimumScore === example.evaluationSuite.minimumScore, `${binding.promptId} minimum score mismatch`);
  assert(binding.runtimeStatus === "not-executed", `${binding.promptId} must not have runtime execution`);
  assert(binding.pipelineStatus === "not-created", `${binding.promptId} must not have a pipeline`);
  assert(binding.resultStatus === "not-produced", `${binding.promptId} must not have produced results`);

  const promptVersion = versionByCoordinate.get(`${binding.promptId}:${binding.promptVersion}`);
  assert(promptVersion, `${binding.promptId}@${binding.promptVersion} must exist in versioning contract`);
  assert(promptVersion.storageSlot === binding.storageSlot, `${binding.promptId}@${binding.promptVersion} storage slot mismatch`);
  assert(storageCoordinates.has(`${binding.promptId}:${binding.storageSlot}`), `${binding.promptId}:${binding.storageSlot} must exist in storage`);

  const ownershipRecord = ownershipByPrompt.get(binding.promptId);
  assert(ownershipRecord, `${binding.promptId} must have ownership`);
  assert(ownershipRecord.owner.team === binding.ownerTeam, `${binding.promptId} owner team mismatch`);
  assert(ownershipRecord.appliesToVersions.includes(binding.promptVersion), `${binding.promptId}@${binding.promptVersion} missing ownership coverage`);

  const benchmark = benchmarkById.get(binding.benchmarkId);
  assert(benchmark, `${binding.benchmarkId} must exist`);
  assert(benchmark.target === "prompt", `${binding.benchmarkId} must target prompts`);
  assert(benchmark.dataset === binding.datasetId, `${binding.benchmarkId} dataset mismatch`);
  assert(benchmark.scoringModel === binding.scoringModel, `${binding.benchmarkId} scoring model mismatch`);
  assert(benchmark.minimumScore === binding.minimumScore, `${binding.benchmarkId} minimum score mismatch`);
  assert(datasetIds.has(binding.datasetId), `${binding.datasetId} must exist`);
  assert(rubric.id === binding.scoringModel, `${binding.scoringModel} must match rubric id`);
  assert(programBindings.has(`${binding.promptId}:${binding.promptVersion}`), `${binding.promptId}@${binding.promptVersion} missing program binding`);

  for (const path of binding.traceability) {
    assert(existsSync(join(root, path)), `${binding.promptId} traceability path missing: ${path}`);
  }
}

assert(coverage.taskStates["W4-T1"] === "IMPLEMENTED", "W4-T1 must remain implemented");
assert(coverage.taskStates["W4-T2"] === "IMPLEMENTED", "W4-T2 must remain implemented");
assert(coverage.taskStates["W4-T3"] === "IMPLEMENTED", "W4-T3 must remain implemented");
assert(coverage.taskStates["W4-T4"] === "IMPLEMENTED", "W4-T4 must remain implemented");
assert(coverage.taskStates["W4-T5"] === "IMPLEMENTED", "W4-T5 must be marked IMPLEMENTED");
assert(coverage.taskStates["W4-T6"] === "IMPLEMENTED", "W4-T6 must be marked IMPLEMENTED");
for (const file of coverage.tasks["W4-T5"]) {
  assert(existsSync(join(root, file)), `W4-T5 maps missing file ${file}`);
}

console.log("ENTERPRISE-10-10 W4-T5 prompt registry evaluation linkage validation PASS");
