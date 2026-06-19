import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(path) {
  return existsSync(join(root, path));
}

const performance = await readJson("validation/performance-testing.contract.json");
const loadTesting = await readJson("validation/load-testing.contract.json");
const coverage = await readJson("validation/roadmap-coverage.json");
const roadmapToFiles = await readFile(join(root, "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md"), "utf8");
const validationReadme = await readFile(join(root, "validation/README.md"), "utf8");
const strategy = await readFile(join(root, "validation/strategy.md"), "utf8");
const performanceDoc = await readFile(join(root, "validation/performance-testing.md"), "utf8");

assert(performance.schemaVersion === "performance-testing.v1", "performance testing schema version must be v1");
assert(performance.roadmapTask === "W6-T4", "performance contract must bind to W6-T4");
assert(performance.governance.roadmapTask === "W6-T4", "governance block must bind to W6-T4");
assert(performance.governance.validation === "scripts/validate-performance-testing.mjs", "validation path changed");
assert(performance.governance.doesNotClose.includes("W6-T5"), "W6-T5 must remain outside W6-T4 closure");
assert(performance.performanceModel.runtimeExecution === "not-run-by-w6-t4", "W6-T4 must not run runtime tests");
assert(performance.performanceModel.benchmarkExecution === "not-run-by-w6-t4", "W6-T4 must not run benchmarks");
assert(
  performance.performanceModel.productRuntimeModification === "not-modified-by-w6-t4",
  "W6-T4 must not modify product runtime"
);
assert(performance.measurementContract.requiresSourceLoadScenario === true, "W6-T4 must require W6-T3 load scenarios");
assert(performance.measurementContract.requiresStableBoundary === true, "W6-T4 must require stable boundaries");
assert(performance.measurementContract.requiresOwner === true, "W6-T4 must require owners");
assert(performance.measurementContract.w6T4ResultStatus === "planned", "W6-T4 results must remain planned");
assert(performance.reportingSchema.schemaId === "performance-report.v1", "reporting schema id changed");

const categories = new Set(performance.performanceModel.targetCategories);
const metricIds = new Set(performance.performanceModel.metricDefinitions.map((metric) => metric.id));
const scenarioIds = new Set(loadTesting.scenarioCatalog.map((scenario) => scenario.id));
const allowedStatuses = new Set(performance.measurementContract.allowedResultStatuses);

for (const target of performance.performanceTargets) {
  for (const field of performance.performanceModel.requiredTargetFields) {
    assert(Object.hasOwn(target, field), `${target.id ?? "target"} missing required field ${field}`);
  }
  assert(categories.has(target.category), `${target.id} has unknown category ${target.category}`);
  assert(scenarioIds.has(target.sourceScenario), `${target.id} source scenario missing from W6-T3 load testing`);
  assert(exists(target.measuredBoundary), `${target.id} measured boundary missing: ${target.measuredBoundary}`);
  assert(target.executionStatus === "not-run-by-w6-t4", `${target.id} must not run benchmarks by W6-T4`);
  assert(target.samplePolicy.minimumIterations > 0, `${target.id} must define positive minimum iterations`);
  assert(target.samplePolicy.sampleWindowSeconds > 0, `${target.id} must define positive sample window`);
  assert(target.samplePolicy.environmentLabelRequired === true, `${target.id} must require environment labels`);
  assert(target.samplePolicy.runtimeVersionRequired === true, `${target.id} must require runtime versions`);

  for (const metric of target.metrics) {
    assert(metricIds.has(metric), `${target.id} references unknown metric ${metric}`);
    assert(Object.hasOwn(target.thresholds, metric), `${target.id} missing threshold for ${metric}`);
    assert(allowedStatuses.has(target.thresholds[metric].status), `${target.id} threshold ${metric} has invalid status`);
    assert(target.thresholds[metric].status === "planned", `${target.id} threshold ${metric} must be planned by W6-T4`);
  }

  for (const field of performance.reportingSchema.requiredFields) {
    assert(Object.hasOwn(target.reportTemplate, field), `${target.id} report template missing ${field}`);
  }
  assert(target.reportTemplate.status === "planned", `${target.id} report status must be planned by W6-T4`);
  assert(
    target.reportTemplate.metricResults === "not-measured-by-w6-t4",
    `${target.id} must not include measured results by W6-T4`
  );
  assert(
    target.reportTemplate.environment === "not-provisioned-by-w6-t4",
    `${target.id} must not provision environments by W6-T4`
  );
  for (const field of performance.reportingSchema.requiredReviewFields) {
    assert(Object.hasOwn(target.reportTemplate.review, field), `${target.id} review missing ${field}`);
  }
  for (const evidence of target.evidence) {
    assert(exists(evidence), `${target.id} evidence path missing: ${evidence}`);
  }
  assert(
    target.evidence.includes("validation/load-testing.contract.json"),
    `${target.id} must bind to W6-T3 load testing evidence`
  );
}

for (const file of coverage.tasks["W6-T4"]) {
  assert(exists(file), `W6-T4 maps missing file ${file}`);
}
for (const task of ["W6-T1", "W6-T2", "W6-T3", "W6-T4"]) {
  assert(coverage.taskStates[task] === "IMPLEMENTED", `${task} must be marked IMPLEMENTED`);
}
assert(coverage.taskStates["W6-T5"] === "IMPLEMENTED", "W6-T5 may be implemented after W6-T4 closure");
for (const task of ["W6-T6", "W6-T7"]) {
  assert(coverage.taskStates[task] === "READY_FOR_FUTURE_TASK", `${task} must remain open after W6-T4`);
}

assert(roadmapToFiles.includes("| W6-T4 | Performance Testing |"), "roadmap-to-files must include W6-T4");
assert(roadmapToFiles.includes("performance-testing.contract.json"), "roadmap-to-files must map performance contract");
assert(roadmapToFiles.includes("validate-performance-testing.mjs"), "roadmap-to-files must map performance validator");
assert(validationReadme.includes("validate-performance-testing.mjs"), "validation README must list performance validator");
assert(strategy.includes("performance testing model"), "strategy must retain performance testing model");
assert(performanceDoc.includes("Performance Model"), "performance docs must describe the performance model");
assert(performanceDoc.includes("Measurement Contract"), "performance docs must describe the measurement contract");
assert(performanceDoc.includes("Reporting Schema"), "performance docs must describe the reporting schema");

console.log("ENTERPRISE-10-10 W6-T4 performance testing validation PASS");
