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

const mutation = await readJson("validation/mutation-testing.contract.json");
const contractTesting = await readJson("validation/contract-testing.contract.json");
const coverage = await readJson("validation/roadmap-coverage.json");
const roadmapToFiles = await readFile(join(root, "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md"), "utf8");
const validationReadme = await readFile(join(root, "validation/README.md"), "utf8");
const strategy = await readFile(join(root, "validation/strategy.md"), "utf8");

assert(mutation.schemaVersion === "mutation-testing.v1", "mutation testing schema version must be v1");
assert(mutation.roadmapTask === "W6-T2", "mutation contract must bind to W6-T2");
assert(mutation.governance.roadmapTask === "W6-T2", "governance block must bind to W6-T2");
assert(mutation.governance.validation === "scripts/validate-mutation-testing.mjs", "validation path changed");
assert(mutation.governance.doesNotClose.includes("W6-T3"), "W6-T3 must remain outside W6-T2 closure");
assert(mutation.framework.runtimeExecution === "not-run-by-w6-t2", "W6-T2 must not run mutations");
assert(mutation.framework.productModification === "not-modified-by-w6-t2", "W6-T2 must not modify product code");
assert(mutation.mutationRules.requiresExistingTestTarget === true, "mutation targets must require existing tests");
assert(mutation.mutationRules.requiresOwner === true, "mutation targets must require owners");
assert(mutation.framework.minimumMutationScore > 0 && mutation.framework.minimumMutationScore <= 1, "minimum mutation score must be normalized");

const categories = new Set(mutation.framework.targetCategories);
const contractIds = new Set(contractTesting.referenceContracts.map((contract) => contract.id));

for (const group of mutation.targetGroups) {
  assert(categories.has(group.category), `${group.id} has unknown category ${group.category}`);
  assert(group.owner, `${group.id} must define owner`);
  assert(group.minimumMutationScore >= mutation.framework.minimumMutationScore, `${group.id} minimum score below framework minimum`);
  assert(group.executionStatus === "not-run-by-w6-t2", `${group.id} must not run mutations by W6-T2`);
  assert(group.productModification === "not-modified-by-w6-t2", `${group.id} must not modify product code by W6-T2`);
  assert(contractIds.has(group.contractBinding), `${group.id} contract binding missing from W6-T1 contract testing`);
  assert(exists(group.testTarget), `${group.id} test target missing: ${group.testTarget}`);
  assert(Array.isArray(group.mutationOperators) && group.mutationOperators.length > 0, `${group.id} must define mutation operators`);
  for (const evidence of group.evidence) {
    assert(exists(evidence), `${group.id} evidence path missing: ${evidence}`);
  }
}

for (const file of coverage.tasks["W6-T2"]) {
  assert(exists(file), `W6-T2 maps missing file ${file}`);
}
assert(coverage.taskStates["W6-T1"] === "IMPLEMENTED", "W6-T1 must remain implemented");
assert(coverage.taskStates["W6-T2"] === "IMPLEMENTED", "W6-T2 must be marked IMPLEMENTED");
assert(coverage.taskStates["W6-T3"] === "IMPLEMENTED", "W6-T3 may be implemented after W6-T2 closure");
assert(coverage.taskStates["W6-T4"] === "IMPLEMENTED", "W6-T4 may be implemented after W6-T2 closure");
assert(coverage.taskStates["W6-T5"] === "IMPLEMENTED", "W6-T5 may be implemented after W6-T2 closure");
assert(coverage.taskStates["W6-T6"] === "IMPLEMENTED", "W6-T6 may be implemented after W6-T2 closure");
assert(coverage.taskStates["W6-T7"] === "IMPLEMENTED", "W6-T7 may be implemented after W6-T2 closure");

assert(roadmapToFiles.includes("| W6-T2 | Mutation Testing |"), "roadmap-to-files must include W6-T2");
assert(roadmapToFiles.includes("mutation-testing.contract.json"), "roadmap-to-files must map mutation testing contract");
assert(roadmapToFiles.includes("validate-mutation-testing.mjs"), "roadmap-to-files must map mutation testing validator");
assert(validationReadme.includes("validate-mutation-testing.mjs"), "validation README must list mutation testing validator");
assert(strategy.includes("mutation-testing readiness"), "strategy must retain mutation testing readiness");

console.log("ENTERPRISE-10-10 W6-T2 mutation testing validation PASS");
