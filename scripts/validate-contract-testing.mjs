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

const contract = await readJson("validation/contract-testing.contract.json");
const coverage = await readJson("validation/roadmap-coverage.json");
const roadmapToFiles = await readFile(join(root, "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md"), "utf8");
const testingReadme = await readFile(join(root, "validation/tests/README.md"), "utf8");
const validationReadme = await readFile(join(root, "validation/README.md"), "utf8");

assert(contract.schemaVersion === "contract-testing.v1", "contract testing schema version must be v1");
assert(contract.roadmapTask === "W6-T1", "contract must bind to W6-T1");
assert(contract.governance.roadmapTask === "W6-T1", "governance block must bind to W6-T1");
assert(contract.governance.validation === "scripts/validate-contract-testing.mjs", "validation path changed");
assert(contract.governance.doesNotClose.includes("W6-T2"), "W6-T2 must remain outside W6-T1 closure");
assert(contract.model.runtimeExecution === "not-required-by-w6-t1", "W6-T1 must not require runtime execution");
assert(contract.model.pipelineExecution === "not-created-by-w6-t1", "W6-T1 must not create pipelines");
assert(contract.validationPolicy.requiredBeforeStableBoundary === true, "contract tests must be required before stable boundaries");

for (const field of contract.model.requiredContractFields) {
  for (const reference of contract.referenceContracts) {
    assert(Object.hasOwn(reference, field), `${reference.id} missing required contract field ${field}`);
  }
}

const boundaryTypes = new Set(contract.model.boundaryTypes);
for (const reference of contract.referenceContracts) {
  assert(boundaryTypes.has(reference.boundaryType), `${reference.id} has unknown boundary type ${reference.boundaryType}`);
  assert(reference.negativeCases.length >= contract.model.minimumNegativeCases, `${reference.id} needs negative cases`);
  assert(reference.executionStatus === "not-executed-by-w6-t1", `${reference.id} must not be executed by W6-T1`);
  for (const path of reference.evidence) {
    assert(exists(path), `${reference.id} evidence path missing: ${path}`);
  }
}

for (const file of coverage.tasks["W6-T1"]) {
  assert(exists(file), `W6-T1 maps missing file ${file}`);
}
assert(coverage.taskStates["W6-T1"] === "IMPLEMENTED", "W6-T1 must be marked IMPLEMENTED");
assert(coverage.taskStates["W6-T2"] === "IMPLEMENTED", "W6-T2 may be implemented after W6-T1 closure");
assert(coverage.taskStates["W6-T3"] === "IMPLEMENTED", "W6-T3 may be implemented after W6-T1 closure");
for (const task of ["W6-T4", "W6-T5", "W6-T6", "W6-T7"]) {
  assert(coverage.taskStates[task] === "READY_FOR_FUTURE_TASK", `${task} must remain open after W6-T1`);
}

assert(roadmapToFiles.includes("| W6-T1 | Contract Testing |"), "roadmap-to-files must include W6-T1");
assert(roadmapToFiles.includes("contract-testing.contract.json"), "roadmap-to-files must map contract testing contract");
assert(roadmapToFiles.includes("validate-contract-testing.mjs"), "roadmap-to-files must map contract testing validator");
assert(testingReadme.includes("Contract Testing"), "validation tests README must document contract testing");
assert(validationReadme.includes("validate-contract-testing.mjs"), "validation README must list contract testing validator");

console.log("ENTERPRISE-10-10 W6-T1 contract testing validation PASS");
