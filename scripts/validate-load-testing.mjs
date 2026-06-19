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

const loadTesting = await readJson("validation/load-testing.contract.json");
const mutationTesting = await readJson("validation/mutation-testing.contract.json");
const contractTesting = await readJson("validation/contract-testing.contract.json");
const coverage = await readJson("validation/roadmap-coverage.json");
const roadmapToFiles = await readFile(join(root, "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md"), "utf8");
const validationReadme = await readFile(join(root, "validation/README.md"), "utf8");
const strategy = await readFile(join(root, "validation/strategy.md"), "utf8");
const loadTestingDoc = await readFile(join(root, "validation/load-testing.md"), "utf8");

assert(loadTesting.schemaVersion === "load-testing.v1", "load testing schema version must be v1");
assert(loadTesting.roadmapTask === "W6-T3", "load testing contract must bind to W6-T3");
assert(loadTesting.governance.roadmapTask === "W6-T3", "governance block must bind to W6-T3");
assert(loadTesting.governance.validation === "scripts/validate-load-testing.mjs", "validation path changed");
assert(loadTesting.governance.doesNotClose.includes("W6-T4"), "W6-T4 must remain outside W6-T3 closure");
assert(loadTesting.governanceModel.runtimeExecution === "not-run-by-w6-t3", "W6-T3 must not generate load");
assert(loadTesting.governanceModel.environmentProvisioning === "not-created-by-w6-t3", "W6-T3 must not create environments");
assert(
  loadTesting.governanceModel.productRuntimeModification === "not-modified-by-w6-t3",
  "W6-T3 must not modify product runtime"
);
assert(loadTesting.executionContract.requiresStableEntrypoint === true, "load scenarios must require stable entrypoints");
assert(loadTesting.executionContract.requiresOwner === true, "load scenarios must require owners");
assert(
  loadTesting.executionContract.requiresIsolatedEnvironmentBeforeExecution === true,
  "load execution must require isolated environments before future execution"
);
assert(loadTesting.executionContract.requiresStopConditions === true, "load execution must require stop conditions");
assert(loadTesting.executionContract.requiresDataSafetyControls === true, "load execution must require data safety controls");
assert(
  loadTesting.executionContract.requiresExternalDependencyPolicy === true,
  "load execution must require external dependency policy"
);
assert(
  loadTesting.executionContract.requiredStopConditions.length >= 3,
  "load execution must define stop conditions"
);
assert(
  loadTesting.executionContract.requiredObservabilitySignals.length >= 3,
  "load execution must define observability signals"
);

const categories = new Set(loadTesting.governanceModel.scenarioCategories);
const contractIds = new Set(contractTesting.referenceContracts.map((contract) => contract.id));
const mutationEvidence = new Set(mutationTesting.targetGroups.flatMap((group) => group.evidence));

for (const scenario of loadTesting.scenarioCatalog) {
  for (const field of loadTesting.governanceModel.requiredScenarioFields) {
    assert(Object.hasOwn(scenario, field), `${scenario.id ?? "scenario"} missing required field ${field}`);
  }
  assert(categories.has(scenario.category), `${scenario.id} has unknown category ${scenario.category}`);
  assert(contractIds.has(scenario.contractBinding), `${scenario.id} contract binding missing from W6-T1 contract testing`);
  assert(exists(scenario.sourceTarget), `${scenario.id} source target missing: ${scenario.sourceTarget}`);
  assert(scenario.executionStatus === "not-run-by-w6-t3", `${scenario.id} must not generate load by W6-T3`);
  assert(
    scenario.environmentProvisioning === "not-created-by-w6-t3",
    `${scenario.id} must not create environments by W6-T3`
  );
  assert(scenario.trafficProfile.arrivalRatePerMinute > 0, `${scenario.id} must define positive arrival rate`);
  assert(scenario.trafficProfile.durationSeconds > 0, `${scenario.id} must define positive duration`);
  assert(scenario.trafficProfile.concurrencyLimit > 0, `${scenario.id} must define positive concurrency limit`);
  for (const stopCondition of loadTesting.executionContract.requiredStopConditions) {
    assert(
      scenario.stopConditions.includes(stopCondition) || stopCondition === "manual-abort",
      `${scenario.id} must account for stop condition ${stopCondition}`
    );
  }
  assert(scenario.stopConditions.includes("manual-abort"), `${scenario.id} must allow manual abort`);
  assert(scenario.observabilitySignals.length >= 3, `${scenario.id} must define observability signals`);
  for (const evidence of scenario.evidence) {
    assert(exists(evidence), `${scenario.id} evidence path missing: ${evidence}`);
  }
  assert(
    scenario.evidence.includes("validation/mutation-testing.contract.json") ||
      scenario.evidence.some((evidence) => mutationEvidence.has(evidence)),
    `${scenario.id} must bind to W6-T2 mutation readiness evidence`
  );
}

for (const file of coverage.tasks["W6-T3"]) {
  assert(exists(file), `W6-T3 maps missing file ${file}`);
}
assert(coverage.taskStates["W6-T1"] === "IMPLEMENTED", "W6-T1 must remain implemented");
assert(coverage.taskStates["W6-T2"] === "IMPLEMENTED", "W6-T2 must remain implemented");
assert(coverage.taskStates["W6-T3"] === "IMPLEMENTED", "W6-T3 must be marked IMPLEMENTED");
assert(coverage.taskStates["W6-T4"] === "IMPLEMENTED", "W6-T4 may be implemented after W6-T3 closure");
assert(coverage.taskStates["W6-T5"] === "IMPLEMENTED", "W6-T5 may be implemented after W6-T3 closure");
for (const task of ["W6-T6", "W6-T7"]) {
  assert(coverage.taskStates[task] === "READY_FOR_FUTURE_TASK", `${task} must remain open after W6-T3`);
}

assert(roadmapToFiles.includes("| W6-T3 | Load Testing |"), "roadmap-to-files must include W6-T3");
assert(roadmapToFiles.includes("load-testing.contract.json"), "roadmap-to-files must map load testing contract");
assert(roadmapToFiles.includes("validate-load-testing.mjs"), "roadmap-to-files must map load testing validator");
assert(validationReadme.includes("validate-load-testing.mjs"), "validation README must list load testing validator");
assert(strategy.includes("load testing governance"), "strategy must retain load testing governance");
assert(loadTestingDoc.includes("Scenario Catalog"), "load testing docs must describe the scenario catalog");
assert(loadTestingDoc.includes("Execution Contract"), "load testing docs must describe the execution contract");

console.log("ENTERPRISE-10-10 W6-T3 load testing validation PASS");
