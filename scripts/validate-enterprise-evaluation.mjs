import { readFile } from "node:fs/promises";

const program = JSON.parse(
  await readFile(new URL("../evaluation/enterprise-10-10/evaluation-program.json", import.meta.url), "utf8")
);
const benchmarks = JSON.parse(await readFile(new URL("../benchmarks/catalog.json", import.meta.url), "utf8"));
const datasets = JSON.parse(await readFile(new URL("../datasets/registry.json", import.meta.url), "utf8"));
const rubric = JSON.parse(await readFile(new URL("../scoring/rubric.json", import.meta.url), "utf8"));

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

const datasetIds = new Set(datasets.datasets.map((dataset) => dataset.id));
for (const benchmark of benchmarks.benchmarks) {
  assert(datasetIds.has(benchmark.dataset), `benchmark ${benchmark.id} references missing dataset ${benchmark.dataset}`);
  assert(benchmark.scoringModel === rubric.id, `benchmark ${benchmark.id} references unknown scoring model`);
}

const weightTotal = Object.values(rubric.weights).reduce((sum, value) => sum + value, 0);
assert(Math.abs(weightTotal - 1) < 0.0001, "scoring weights must sum to 1");
assert(program.reports.requiredSections.includes("decision"), "report template must include decision");

console.log("ENTERPRISE-10-10 ai-knowledge evaluation validation PASS");
