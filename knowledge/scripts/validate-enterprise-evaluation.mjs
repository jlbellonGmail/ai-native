import { readFile } from "node:fs/promises";

const program = JSON.parse(
  await readFile(new URL("../evaluation/enterprise-10-10/evaluation-program.json", import.meta.url), "utf8")
);
const benchmarks = JSON.parse(await readFile(new URL("../benchmarks/catalog.json", import.meta.url), "utf8"));
const datasets = JSON.parse(await readFile(new URL("../datasets/registry.json", import.meta.url), "utf8"));
const rubric = JSON.parse(await readFile(new URL("../scoring/rubric.json", import.meta.url), "utf8"));
const policy = JSON.parse(await readFile(new URL("../config/evaluation-policy.json", import.meta.url), "utf8"));
const linkage = JSON.parse(
  await readFile(new URL("../config/prompt-registry/evaluation-linkage.json", import.meta.url), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(program.status === "PRODUCT_REPAIRED", "evaluation program must be PRODUCT_REPAIRED");
assert(program.promptEvaluation?.task === "W3-T1", "prompt evaluation must map to W3-T1");
assert(program.agentEvaluation?.task === "W3-T2", "agent evaluation must map to W3-T2");
assert(program.benchmarks?.task === "W3-T3", "benchmarks must map to W3-T3");
assert(program.scoring?.task === "W3-T4", "scoring must map to W3-T4");
assert(program.datasets?.task === "W3-T5", "datasets must map to W3-T5");
assert(program.reports?.task === "W3-T6", "reports must map to W3-T6");
assert(program.audit?.task === "W3-T7", "audit must map to W3-T7");
assert(program.promptRegistryLinkage?.task === "W4-T5", "prompt registry linkage must map to W4-T5");
assert(program.promptRegistryLinkage.contract === "config/prompt-registry/evaluation-linkage.json", "prompt registry linkage contract path changed");
assert(program.promptRegistryLinkage.runtimeStatus === "not-executed", "W4-T5 must not execute evaluations");
assert(program.promptRegistryLinkage.pipelineStatus === "not-created", "W4-T5 must not create evaluation pipelines");
assert(program.promptRegistryLinkage.resultStatus === "not-produced", "W4-T5 must not produce evaluation results");
assert(policy.promptRegistryLinkage?.roadmapTask === "W4-T5", "evaluation policy must expose W4-T5 linkage");
assert(policy.promptRegistryLinkage.contract === "config/prompt-registry/evaluation-linkage.json", "policy linkage contract path changed");
assert(linkage.roadmapTask === "W4-T5", "linkage contract must map to W4-T5");

const datasetIds = new Set(datasets.datasets.map((dataset) => dataset.id));
for (const benchmark of benchmarks.benchmarks) {
  assert(datasetIds.has(benchmark.dataset), `benchmark ${benchmark.id} references missing dataset ${benchmark.dataset}`);
  assert(benchmark.scoringModel === rubric.id, `benchmark ${benchmark.id} references unknown scoring model`);
}

const weightTotal = Object.values(rubric.weights).reduce((sum, value) => sum + value, 0);
assert(Math.abs(weightTotal - 1) < 0.0001, "scoring weights must sum to 1");
assert(program.reports.requiredSections.includes("decision"), "report template must include decision");

const benchmarkById = new Map(benchmarks.benchmarks.map((benchmark) => [benchmark.id, benchmark]));
const programBindings = new Set(program.promptRegistryLinkage.bindings.map((binding) => `${binding.promptId}:${binding.promptVersion}`));
for (const binding of linkage.bindings) {
  const benchmark = benchmarkById.get(binding.benchmarkId);
  assert(benchmark, `${binding.benchmarkId} must exist`);
  assert(benchmark.target === "prompt", `${binding.benchmarkId} must target prompts`);
  assert(benchmark.dataset === binding.datasetId, `${binding.benchmarkId} dataset mismatch`);
  assert(datasetIds.has(binding.datasetId), `${binding.datasetId} must exist`);
  assert(benchmark.scoringModel === binding.scoringModel, `${binding.benchmarkId} scoring model mismatch`);
  assert(binding.scoringModel === rubric.id, `${binding.scoringModel} must match rubric`);
  assert(benchmark.minimumScore === binding.minimumScore, `${binding.benchmarkId} minimum score mismatch`);
  assert(programBindings.has(`${binding.promptId}:${binding.promptVersion}`), `${binding.promptId}@${binding.promptVersion} missing program binding`);
}

console.log("ENTERPRISE-10-10 ai-knowledge evaluation validation PASS");
