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

const coverageValidation = await readJson("validation/coverage-validation.contract.json");
const chaos = await readJson("validation/chaos-testing.contract.json");
const coverage = await readJson("validation/roadmap-coverage.json");
const roadmapToFiles = await readFile(join(root, "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md"), "utf8");
const validationReadme = await readFile(join(root, "validation/README.md"), "utf8");
const strategy = await readFile(join(root, "validation/strategy.md"), "utf8");
const coverageDoc = await readFile(join(root, "validation/coverage-validation.md"), "utf8");
const vitestConfig = await readFile(join(root, "vitest.config.ts"), "utf8");

assert(coverageValidation.schemaVersion === "coverage-validation.v1", "coverage validation schema version must be v1");
assert(coverageValidation.roadmapTask === "W6-T6", "coverage validation contract must bind to W6-T6");
assert(coverageValidation.governance.roadmapTask === "W6-T6", "governance block must bind to W6-T6");
assert(
  coverageValidation.governance.validation === "scripts/validate-coverage-validation.mjs",
  "validation path changed"
);
assert(coverageValidation.governance.doesNotClose.includes("W6-T7"), "W6-T7 must remain outside W6-T6 closure");
assert(coverageValidation.coverageGovernance.coverageExecution === "not-run-by-w6-t6", "W6-T6 must not run coverage");
assert(
  coverageValidation.coverageGovernance.pipelineModification === "not-modified-by-w6-t6",
  "W6-T6 must not modify pipelines"
);
assert(
  coverageValidation.coverageGovernance.productRuntimeModification === "not-modified-by-w6-t6",
  "W6-T6 must not modify product runtime"
);
assert(coverageValidation.validationModel.provider === "v8", "coverage provider must remain v8");
assert(coverageValidation.validationModel.reporters.includes("text"), "coverage reporters must include text");
assert(coverageValidation.validationModel.reporters.includes("json"), "coverage reporters must include json");
assert(coverageValidation.validationModel.reporters.includes("html"), "coverage reporters must include html");
assert(
  coverageValidation.validationModel.w6T6ExecutionStatus === "defined-not-executed-by-w6-t6",
  "W6-T6 execution status must remain not executed"
);

const requiredSignals = new Set(coverageValidation.coverageGovernance.requiredCoverageSignals);
const minimumThresholds = coverageValidation.coverageGovernance.minimumThresholds;
for (const signal of requiredSignals) {
  assert(Object.hasOwn(minimumThresholds, signal), `missing minimum threshold for ${signal}`);
  assert(minimumThresholds[signal] >= 80, `${signal} threshold must be at least 80`);
  assert(vitestConfig.includes(`${signal}: ${minimumThresholds[signal]}`), `vitest config missing ${signal} threshold`);
}
assert(vitestConfig.includes("provider: 'v8'"), "vitest config must use v8 coverage provider");
assert(vitestConfig.includes("reporter: ['text', 'json', 'html']"), "vitest config must keep text/json/html reporters");

const sourceTasks = new Set(coverageValidation.coverageGovernance.sourceTasks);
for (const task of ["W6-T1", "W6-T2", "W6-T3", "W6-T4", "W6-T5"]) {
  assert(sourceTasks.has(task), `coverage governance missing source task ${task}`);
  assert(coverage.taskStates[task] === "IMPLEMENTED", `${task} must be marked IMPLEMENTED`);
  for (const file of coverage.tasks[task]) {
    assert(exists(file), `${task} maps missing file ${file}`);
  }
}
assert(chaos.roadmapTask === "W6-T5", "W6-T6 must bind to W6-T5 chaos readiness");
assert(coverage.taskStates["W6-T6"] === "IMPLEMENTED", "W6-T6 must be marked IMPLEMENTED");
assert(coverage.taskStates["W6-T7"] === "READY_FOR_FUTURE_TASK", "W6-T7 must remain open after W6-T6");
for (const file of coverage.tasks["W6-T6"]) {
  assert(exists(file), `W6-T6 maps missing file ${file}`);
}

const allowedStatuses = new Set(coverageValidation.validationModel.allowedItemStatuses);
const requiredEvidenceTypes = new Set(coverageValidation.completenessContract.requiredEvidenceTypes);
for (const item of coverageValidation.coverageItems) {
  for (const field of coverageValidation.completenessContract.requiredItemFields) {
    assert(Object.hasOwn(item, field), `${item.id ?? "coverage item"} missing required field ${field}`);
  }
  assert(sourceTasks.has(item.sourceTask), `${item.id} source task is not governed by W6-T6`);
  assert(exists(item.sourceBoundary), `${item.id} source boundary missing: ${item.sourceBoundary}`);
  assert(allowedStatuses.has(item.status), `${item.id} has invalid status ${item.status}`);
  assert(item.status === "defined-not-executed-by-w6-t6", `${item.id} must not execute coverage by W6-T6`);
  for (const signal of requiredSignals) {
    assert(item.coverageSignals.includes(signal), `${item.id} missing coverage signal ${signal}`);
  }
  const evidenceTypes = new Set(item.evidence.map((evidence) => evidence.type));
  for (const evidenceType of requiredEvidenceTypes) {
    assert(evidenceTypes.has(evidenceType), `${item.id} missing evidence type ${evidenceType}`);
  }
  for (const evidence of item.evidence) {
    assert(exists(evidence.path), `${item.id} evidence path missing: ${evidence.path}`);
  }
  assert(
    item.evidence.some((evidence) => evidence.path === "validation/chaos-testing.contract.json"),
    `${item.id} must bind to W6-T5 chaos contract`
  );
}

assert(roadmapToFiles.includes("| W6-T6 | Coverage Validation |"), "roadmap-to-files must include W6-T6");
assert(roadmapToFiles.includes("coverage-validation.contract.json"), "roadmap-to-files must map coverage contract");
assert(roadmapToFiles.includes("validate-coverage-validation.mjs"), "roadmap-to-files must map coverage validator");
assert(validationReadme.includes("validate-coverage-validation.mjs"), "validation README must list coverage validator");
assert(strategy.includes("coverage validation model"), "strategy must describe coverage validation model");
assert(coverageDoc.includes("Coverage Governance"), "coverage docs must describe coverage governance");
assert(coverageDoc.includes("Validation Model"), "coverage docs must describe validation model");
assert(coverageDoc.includes("Completeness Contract"), "coverage docs must describe completeness contract");

console.log("ENTERPRISE-10-10 W6-T6 coverage validation PASS");
