import { readFile } from "node:fs/promises";

const program = JSON.parse(
  await readFile(new URL("../evaluations/enterprise-10-10/evaluation-program.json", import.meta.url), "utf8")
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(program.status === "PRODUCT_REPAIRED", "evaluation program must be PRODUCT_REPAIRED");
assert(program.promptEvaluation?.task === "W3-T1", "prompt evaluation must map to W3-T1");
assert(program.agentEvaluation?.task === "W3-T2", "agent evaluation must map to W3-T2");
assert(program.benchmarks?.task === "W3-T3", "benchmarks must map to W3-T3");
assert(program.scoring?.task === "W3-T4", "scoring must map to W3-T4");
assert(program.datasets?.task === "W3-T5", "datasets must map to W3-T5");
assert(program.reports?.task === "W3-T6", "reports must map to W3-T6");
assert(program.audit?.task === "W3-T7", "audit must map to W3-T7");

assert(program.promptEvaluation.dimensions.length >= 5, "prompt evaluation needs at least 5 dimensions");
assert(program.agentEvaluation.inputs.length > 0 && program.agentEvaluation.outputs.length > 0, "agent evaluation needs inputs and outputs");
assert(program.benchmarks.suites.length >= 3, "benchmark framework needs at least 3 suites");
assert(program.datasets.registry.length >= 3, "dataset registry needs at least 3 datasets");
assert(program.reports.requiredSections.includes("decision"), "report template must include decision");

const weightTotal = Object.values(program.scoring.weights).reduce((sum, value) => sum + value, 0);
assert(Math.abs(weightTotal - 1) < 0.0001, "scoring weights must sum to 1");

for (const suite of program.benchmarks.suites) {
  assert(program.datasets.registry.some((dataset) => dataset.id === suite.dataset), `suite ${suite.id} references an unknown dataset`);
}

console.log("ENTERPRISE-10-10 ai-knowledge evaluation validation PASS");
