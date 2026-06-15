import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), "utf8"));
}

const audit = await readJson("config/prompt-registry/prompt-registry.audit.json");
const schema = await readJson("config/prompt-registry.schema.json");
const example = await readJson("examples/prompt-registry-entry.valid.json");
const storage = await readJson("registries/prompts/registry.storage.json");
const versioning = await readJson("config/prompt-registry/versioning.compatibility.json");
const ownership = await readJson("config/prompt-registry/ownership.policy.json");
const linkage = await readJson("config/prompt-registry/evaluation-linkage.json");
const coverage = await readJson("validation/roadmap-coverage.json");
const roadmapToFiles = await readFile(join(root, "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md"), "utf8");
const readme = await readFile(join(root, "config/prompt-registry/README.md"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(path) {
  return existsSync(join(root, path));
}

assert(audit.schemaVersion === "prompt-registry-audit.v1", "audit schema version must be prompt-registry-audit.v1");
assert(audit.roadmapTask === "W4-T6", "audit contract must bind to W4-T6");
assert(audit.scope.workstream === "W4 Prompt Registry", "audit workstream changed");
assert(audit.governance.roadmapTask === "W4-T6", "audit governance must bind to W4-T6");
assert(audit.governance.nextEligibleTask === "W5-T1", "W5-T1 must be the next eligible task after W4-T6");
assert(audit.governance.doesNotOpen.includes("W5-T1"), "W4-T6 must not open W5-T1");

for (const task of ["W4-T1", "W4-T2", "W4-T3", "W4-T4", "W4-T5"]) {
  assert(audit.scope.auditedTasks.includes(task), `${task} must be audited by W4-T6`);
  assert(coverage.taskStates[task] === "IMPLEMENTED", `${task} must be implemented for W4-T6 audit`);
}
assert(audit.scope.closedByThisTask.includes("W4-T6"), "W4-T6 must be closed only by the audit task");
assert(coverage.taskStates["W4-T6"] === "IMPLEMENTED", "W4-T6 must be marked IMPLEMENTED");

assert(
  ["IMPLEMENTED", "PREPARED_NOT_CLOSED"].includes(coverage.taskStates["W5-T1"]),
  "W5-T1 may be implemented only after W4-T6 closure"
);
for (const task of ["W5-T2", "W5-T3", "W5-T4", "W5-T5", "W5-T6"]) {
  assert(audit.scope.doesNotClose.includes(task), `${task} must remain outside W4-T6 closure`);
  assert(
    ["PREPARED_NOT_CLOSED", "BASELINE_PRESENT", "READY_FOR_FUTURE_TASK"].includes(coverage.taskStates[task]),
    `${task} must remain unopened or baseline-only`
  );
}

for (const [name, path] of Object.entries(audit.auditInputs)) {
  assert(exists(path), `${name} audit input missing: ${path}`);
}
for (const validator of audit.validators) {
  assert(exists(validator), `audit validator target missing: ${validator}`);
}
for (const file of coverage.tasks["W4-T6"]) {
  assert(exists(file), `W4-T6 maps missing file ${file}`);
}

assert(schema.properties.governance.properties.roadmapTask.const === "W4-T1", "schema must remain bound to W4-T1");
assert(example.id === "code-generator.system", "audit example prompt id changed");
assert(versioning.roadmapTask === "W4-T3", "versioning contract must remain bound to W4-T3");
assert(ownership.roadmapTask === "W4-T4", "ownership contract must remain bound to W4-T4");
assert(linkage.roadmapTask === "W4-T5", "evaluation linkage contract must remain bound to W4-T5");

const storageBySlot = new Map(storage.entries.map((entry) => [`${entry.id}:${entry.storageSlot}`, entry]));
const versionsByPrompt = new Map();
for (const promptVersion of versioning.promptVersions) {
  const key = `${promptVersion.id}:${promptVersion.storageSlot}`;
  assert(storageBySlot.has(key), `${key} versioning coordinate missing from storage`);
  assert(storageBySlot.get(key).storagePath === promptVersion.storagePath, `${key} storage path mismatch`);

  const versions = versionsByPrompt.get(promptVersion.id) ?? new Set();
  versions.add(promptVersion.version);
  versionsByPrompt.set(promptVersion.id, versions);
}

const ownershipByPrompt = new Map(ownership.records.map((record) => [record.id, record]));
for (const [promptId, versions] of versionsByPrompt) {
  const owner = ownershipByPrompt.get(promptId);
  assert(owner, `${promptId} ownership record missing`);
  for (const version of versions) {
    assert(owner.appliesToVersions.includes(version), `${promptId}@${version} missing ownership coverage`);
  }
}

for (const binding of linkage.bindings) {
  assert(binding.promptId === example.id, `${binding.promptId} must match schema example`);
  assert(storageBySlot.has(`${binding.promptId}:${binding.storageSlot}`), `${binding.promptId}:${binding.storageSlot} missing storage`);
  assert(versionsByPrompt.get(binding.promptId)?.has(binding.promptVersion), `${binding.promptId}@${binding.promptVersion} missing versioning`);
  assert(ownershipByPrompt.get(binding.promptId)?.owner.team === binding.ownerTeam, `${binding.promptId} linkage owner mismatch`);
  for (const path of binding.traceability) {
    assert(exists(path), `${binding.promptId} traceability path missing: ${path}`);
  }
}

assert(readme.includes("AUDIT.md"), "prompt registry README must list audit guide");
assert(readme.includes("prompt-registry.audit.json"), "prompt registry README must list audit contract");
assert(readme.includes("validate-prompt-registry-audit.mjs"), "prompt registry README must list audit validator");
assert(roadmapToFiles.includes("| W4-T6 | Prompt Registry Audit |"), "roadmap-to-files must include W4-T6");
assert(roadmapToFiles.includes("prompt-registry.audit.json"), "roadmap-to-files must map audit contract");
assert(roadmapToFiles.includes("IMPLEMENTED"), "roadmap-to-files must mark implemented tasks");

console.log("ENTERPRISE-10-10 W4-T6 prompt registry audit validation PASS");
