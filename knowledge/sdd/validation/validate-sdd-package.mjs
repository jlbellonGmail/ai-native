import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const contractPath = "sdd/contracts/sdd-package.contract.json";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function exists(path) {
  return existsSync(join(root, path));
}

async function readText(path) {
  return readFile(join(root, path), "utf8");
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

const contract = await readJson(contractPath);

assert(contract.schemaVersion === "sdd-package.v1", "contract schemaVersion must be sdd-package.v1");
assert(contract.roadmap === "AI-NATIVE-HARDENING-V1.1", "contract must bind to HARDENING-V1.1");
assert(contract.roadmapTask === "H1", "contract must bind to H1");
assert(contract.status === "implemented", "contract status must be implemented");
assert(contract.flow.displayOrder === "Specify -> Plan -> Implement -> Verify", "canonical flow display order changed");
assert(contract.flow.chatMemoryRequired === false, "SDD package must not depend on chat memory");

const expectedPhases = ["specify", "plan", "implement", "verify"];
const expectedGates = ["SPEC_READY", "PLAN_READY", "IMPLEMENTATION_READY", "VERIFICATION_READY", "DONE"];

assert(JSON.stringify(contract.flow.canonicalOrder) === JSON.stringify(expectedPhases), "canonical phase order changed");
assert(Array.isArray(contract.phases) && contract.phases.length === expectedPhases.length, "contract must define four phases");
assert(Array.isArray(contract.gates) && contract.gates.length === expectedGates.length, "contract must define five gates");

for (const phaseId of expectedPhases) {
  const phase = contract.phases.find((entry) => entry.id === phaseId);
  assert(phase, `missing phase ${phaseId}`);
  assert(phase.template && exists(phase.template), `missing template for phase ${phaseId}: ${phase?.template}`);
  assert(expectedGates.includes(phase.requiredGate), `phase ${phaseId} has unknown required gate`);
  assert(Array.isArray(phase.requiredOutputs) && phase.requiredOutputs.length > 0, `phase ${phaseId} must define required outputs`);
}

for (const gateId of expectedGates) {
  const gate = contract.gates.find((entry) => entry.id === gateId);
  assert(gate, `missing gate ${gateId}`);
  assert(Array.isArray(gate.criteria) && gate.criteria.length > 0, `gate ${gateId} must define criteria`);
}

for (const file of contract.validation.requiresMarkdownFiles) {
  assert(exists(file), `required markdown file missing: ${file}`);
}

assert(exists(contract.validation.validator), "validator path in contract must exist");
assert(contract.validation.requiresContract === contractPath, "contract must reference itself as required contract");

assert(contract.acceptancePolicy.acceptanceCriteriaRequiredBeforeImplementation === true, "acceptance criteria must be required before implementation");
assert(contract.acceptancePolicy.verificationRequiredBeforeClosure === true, "verification must be required before closure");
assert(contract.acceptancePolicy.definitionOfReadyRequired === true, "Definition of Ready must be required");
assert(contract.acceptancePolicy.definitionOfDoneRequired === true, "Definition of Done must be required");
assert(contract.acceptancePolicy.builderInspectorRequired === true, "Builder + Inspector must be required");

for (const futureTask of ["H2", "H3", "H4", "H5", "H6", "H7", "H8"]) {
  assert(contract.scopeBoundaries.doesNotOpen.includes(futureTask), `${futureTask} must remain unopened by H1`);
}

assert(contract.scopeBoundaries.doesNotReopen.includes("ENTERPRISE-10-10-V1"), "H1 must not reopen ENTERPRISE-10-10-V1");
assert(contract.scopeBoundaries.doesNotCreate.includes("ENTERPRISE-10-10-V2"), "H1 must not create ENTERPRISE-10-10-V2");

const forbiddenImplementations = [
  "project-generator",
  "runtime-observability-wiring",
  "executable-testing-profiles",
  "real-evaluation-runs",
  "target-repository-security-validation",
  "first-client-project-playbook",
  "adoption-readiness-final-audit"
];

for (const item of forbiddenImplementations) {
  assert(contract.scopeBoundaries.doesNotImplement.includes(item), `H1 must exclude ${item}`);
}

const readme = await readText("sdd/README.md");
const flow = await readText("sdd/canonical-flow.md");
const gates = await readText("sdd/gates.md");

for (const term of ["Specify", "Plan", "Implement", "Verify"]) {
  assert(readme.includes(term), `README must reference ${term}`);
  assert(flow.includes(term), `canonical flow must reference ${term}`);
}

for (const gate of expectedGates) {
  assert(gates.includes(gate), `gates document must describe ${gate}`);
}

console.log("AI-NATIVE HARDENING-V1.1 H1 SDD package validation PASS");
