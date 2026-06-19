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

const chaos = await readJson("validation/chaos-testing.contract.json");
const performance = await readJson("validation/performance-testing.contract.json");
const coverage = await readJson("validation/roadmap-coverage.json");
const roadmapToFiles = await readFile(join(root, "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md"), "utf8");
const validationReadme = await readFile(join(root, "validation/README.md"), "utf8");
const strategy = await readFile(join(root, "validation/strategy.md"), "utf8");
const chaosDoc = await readFile(join(root, "validation/chaos-testing.md"), "utf8");

assert(chaos.schemaVersion === "chaos-testing.v1", "chaos testing schema version must be v1");
assert(chaos.roadmapTask === "W6-T5", "chaos contract must bind to W6-T5");
assert(chaos.governance.roadmapTask === "W6-T5", "governance block must bind to W6-T5");
assert(chaos.governance.validation === "scripts/validate-chaos-testing.mjs", "validation path changed");
assert(chaos.governance.doesNotClose.includes("W6-T6"), "W6-T6 must remain outside W6-T5 closure");
assert(chaos.chaosGovernance.failureInjection === "not-run-by-w6-t5", "W6-T5 must not inject failures");
assert(chaos.chaosGovernance.environmentAlteration === "not-altered-by-w6-t5", "W6-T5 must not alter environments");
assert(
  chaos.chaosGovernance.productRuntimeModification === "not-modified-by-w6-t5",
  "W6-T5 must not modify product runtime"
);
assert(chaos.validationContract.requiresSourcePerformanceTarget === true, "W6-T5 must require W6-T4 performance targets");
assert(chaos.validationContract.requiresOwner === true, "W6-T5 must require owners");
assert(chaos.validationContract.requiresBlastRadiusLimit === true, "W6-T5 must require blast-radius limits");
assert(chaos.validationContract.requiresRollbackPlan === true, "W6-T5 must require rollback plans");
assert(chaos.validationContract.requiresAbortTriggers === true, "W6-T5 must require abort triggers");
assert(chaos.validationContract.requiresDataSafetyControls === true, "W6-T5 must require data safety controls");
assert(chaos.validationContract.w6T5ExecutionStatus === "not-run-by-w6-t5", "W6-T5 execution status must remain not-run");

const categories = new Set(chaos.chaosGovernance.scenarioCategories);
const performanceTargets = new Set(performance.performanceTargets.map((target) => target.id));
const allowedStatuses = new Set(chaos.validationContract.allowedExecutionStatuses);

for (const scenario of chaos.resilienceScenarios) {
  for (const field of chaos.chaosGovernance.requiredScenarioFields) {
    assert(Object.hasOwn(scenario, field), `${scenario.id ?? "scenario"} missing required field ${field}`);
  }
  assert(categories.has(scenario.category), `${scenario.id} has unknown category ${scenario.category}`);
  assert(
    performanceTargets.has(scenario.sourcePerformanceTarget),
    `${scenario.id} source performance target missing from W6-T4`
  );
  assert(scenario.failureMode.injectionMechanism === "not-created-by-w6-t5", `${scenario.id} must not create injectors`);
  assert(scenario.blastRadius.maximumDurationSeconds > 0, `${scenario.id} must define positive maximum duration`);
  assert(scenario.blastRadius.externalUserImpact === "none-by-w6-t5", `${scenario.id} must avoid user impact by W6-T5`);
  assert(scenario.blastRadius.dataMutation === "none", `${scenario.id} must not mutate data by W6-T5`);
  assert(scenario.controls.rollbackPlan, `${scenario.id} must define rollback plan`);
  assert(scenario.controls.abortTriggers.includes("manual-abort"), `${scenario.id} must include manual abort trigger`);
  assert(scenario.controls.dataSafety, `${scenario.id} must define data safety controls`);
  assert(
    scenario.controls.environmentRequirement === "future-isolated-environment-required",
    `${scenario.id} must require future isolated environments`
  );
  assert(scenario.observabilitySignals.length >= 3, `${scenario.id} must define observability signals`);
  assert(scenario.expectedResilienceBehavior.length >= 2, `${scenario.id} must define expected resilience behavior`);
  assert(allowedStatuses.has(scenario.executionStatus), `${scenario.id} has invalid execution status`);
  assert(scenario.executionStatus === "not-run-by-w6-t5", `${scenario.id} must not run by W6-T5`);
  assert(scenario.environmentAlteration === "not-altered-by-w6-t5", `${scenario.id} must not alter environments`);
  for (const evidence of scenario.evidence) {
    assert(exists(evidence), `${scenario.id} evidence path missing: ${evidence}`);
  }
  assert(
    scenario.evidence.includes("validation/performance-testing.contract.json"),
    `${scenario.id} must bind to W6-T4 performance evidence`
  );
}

for (const file of coverage.tasks["W6-T5"]) {
  assert(exists(file), `W6-T5 maps missing file ${file}`);
}
for (const task of ["W6-T1", "W6-T2", "W6-T3", "W6-T4", "W6-T5"]) {
  assert(coverage.taskStates[task] === "IMPLEMENTED", `${task} must be marked IMPLEMENTED`);
}
assert(coverage.taskStates["W6-T6"] === "IMPLEMENTED", "W6-T6 may be implemented after W6-T5 closure");
assert(coverage.taskStates["W6-T7"] === "READY_FOR_FUTURE_TASK", "W6-T7 must remain open after W6-T5");

assert(roadmapToFiles.includes("| W6-T5 | Chaos Testing |"), "roadmap-to-files must include W6-T5");
assert(roadmapToFiles.includes("chaos-testing.contract.json"), "roadmap-to-files must map chaos contract");
assert(roadmapToFiles.includes("validate-chaos-testing.mjs"), "roadmap-to-files must map chaos validator");
assert(validationReadme.includes("validate-chaos-testing.mjs"), "validation README must list chaos validator");
assert(strategy.includes("chaos testing governance"), "strategy must retain chaos testing governance");
assert(chaosDoc.includes("Chaos Governance"), "chaos docs must describe chaos governance");
assert(chaosDoc.includes("Resilience Scenarios"), "chaos docs must describe resilience scenarios");
assert(chaosDoc.includes("Validation Contract"), "chaos docs must describe the validation contract");

console.log("ENTERPRISE-10-10 W6-T5 chaos testing validation PASS");
