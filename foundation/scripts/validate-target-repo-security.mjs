import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(relativePath) {
  return existsSync(path.join(root, relativePath));
}

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

const procedurePath = "security/target-repo-validation.md";
const contractPath = "security/target-repo-validation.contract.json";
const w1AuditPath = "security/enterprise-10-10/security-audit-final.json";

assert(exists(procedurePath), `missing ${procedurePath}`);
assert(exists(contractPath), `missing ${contractPath}`);
assert(exists(w1AuditPath), `missing ${w1AuditPath}`);

const procedure = await readText(procedurePath);
const contract = await readJson(contractPath);
const w1Audit = await readJson(w1AuditPath);

assert(contract.program === "AI-NATIVE-HARDENING-V1.1", "contract program mismatch");
assert(contract.task === "H6", "contract must reference H6");
assert(contract.status === "IMPLEMENTED", "contract status must be IMPLEMENTED");
assert(contract.procedure === procedurePath, "contract procedure path mismatch");
assert(contract.closureRules.remoteAssumptionAsPassAllowed === false, "remote assumptions must not be PASS");
assert(contract.closureRules.doesNotModifyRemotes === true, "procedure must not modify remotes");
assert(contract.closureRules.doesNotRequireCredentials === true, "procedure must not require credentials");

for (const status of ["PASS", "FAIL", "NOT_RUN", "NOT_APPLICABLE", "CONTEXTUAL_NON_BLOCKING"]) {
  assert(contract.allowedStatuses.includes(status), `missing status ${status}`);
  assert(procedure.includes(status), `procedure must document ${status}`);
}

for (const control of ["dependency_review", "dependabot", "sbom", "artifact_attestation"]) {
  const record = contract.remoteControls.find((item) => item.id === control);
  assert(record, `missing remote control ${control}`);
  assert(record.localFilePresenceIsPass === false, `${control} must reject local-only PASS`);
  assert(Array.isArray(record.evidenceRequired) && record.evidenceRequired.length >= 3, `${control} needs evidence requirements`);
}

for (const task of ["W1-T3", "W1-T4", "W1-T5", "W1-T6", "W1-T7"]) {
  assert(procedure.includes(task), `procedure must cross-reference ${task}`);
}

for (const task of ["W1-T3", "W1-T4", "W1-T5", "W1-T6", "W1-T7"]) {
  assert(w1Audit.controls.some((control) => control.task === task), `W1 audit missing ${task}`);
}

console.log("target repository security validation PASS");
