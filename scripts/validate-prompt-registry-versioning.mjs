import { readFile } from "node:fs/promises";

const versioning = JSON.parse(
  await readFile(new URL("../config/prompt-registry/versioning.compatibility.json", import.meta.url), "utf8")
);
const schema = JSON.parse(
  await readFile(new URL("../config/prompt-registry.schema.json", import.meta.url), "utf8")
);
const storage = JSON.parse(
  await readFile(new URL("../registries/prompts/registry.storage.json", import.meta.url), "utf8")
);
const coverage = JSON.parse(
  await readFile(new URL("../validation/roadmap-coverage.json", import.meta.url), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function majorOf(version) {
  return Number(version.split(".")[0]);
}

assert(versioning.schemaVersion === "prompt-registry-versioning.v1", "versioning schema version must be prompt-registry-versioning.v1");
assert(versioning.roadmapTask === "W4-T3", "versioning contract must bind to W4-T3");
assert(versioning.appliesTo.entrySchema === "config/prompt-registry.schema.json", "versioning must bind to prompt registry schema");
assert(versioning.appliesTo.storageContract === "registries/prompts/registry.storage.json", "versioning must bind to prompt storage contract");
assert(versioning.versionFields.promptVersionField === "version", "prompt version field must be version");
assert(versioning.versionFields.promptVersionPattern === schema.properties.version.pattern, "versioning pattern must match schema version pattern");
assert(versioning.versionFields.storageSlotPattern === "^v\\d+$", "storage slot pattern must be major slot form");
assert(versioning.model.globalVersionPolicy === "do-not-modify-repository-VERSION-for-prompt-version-changes", "global VERSION must remain outside prompt versioning");
assert(versioning.compatibilityPolicy.requiresExplicitMajorDecision === true, "major compatibility decisions must be explicit");
assert(versioning.governance.roadmapTask === "W4-T3", "governance block must bind to W4-T3");
for (const task of ["W4-T5", "W4-T6"]) {
  assert(versioning.governance.doesNotClose.includes(task), `${task} must remain outside W4-T3 closure`);
}

const components = new Map(versioning.model.components.map((component) => [component.component, component]));
assert(components.get("MAJOR")?.compatible === false, "MAJOR changes must be incompatible");
assert(components.get("MINOR")?.compatible === true, "MINOR changes must be compatible");
assert(components.get("PATCH")?.compatible === true, "PATCH changes must be compatible");

const changeClasses = new Map(versioning.compatibilityPolicy.changeClasses.map((changeClass) => [changeClass.id, changeClass]));
assert(changeClasses.get("behavior_contract_break")?.versionComponent === "MAJOR", "behavior contract breaks must be major changes");
assert(changeClasses.get("behavior_contract_break")?.requiresNewStorageSlot === true, "major breaks must require a new storage slot");

const storageEntries = new Map(storage.entries.map((entry) => [`${entry.id}:${entry.storageSlot}`, entry]));
const versionCoordinates = new Set();
for (const promptVersion of versioning.promptVersions) {
  assert(new RegExp(versioning.versionFields.promptVersionPattern).test(promptVersion.version), `${promptVersion.version} must be semver`);
  assert(new RegExp(versioning.versionFields.storageSlotPattern).test(promptVersion.storageSlot), `${promptVersion.storageSlot} must be a storage slot`);
  assert(promptVersion.major === majorOf(promptVersion.version), `${promptVersion.version} major field mismatch`);
  assert(promptVersion.storageSlot === `v${promptVersion.major}`, `${promptVersion.version} must map to matching major storage slot`);
  assert(promptVersion.compatibilityLine === `${promptVersion.id}@${promptVersion.major}`, `${promptVersion.version} compatibility line mismatch`);
  assert(changeClasses.has(promptVersion.changeClass), `${promptVersion.changeClass} must be a governed change class`);

  const storageEntry = storageEntries.get(`${promptVersion.id}:${promptVersion.storageSlot}`);
  assert(storageEntry, `${promptVersion.id}:${promptVersion.storageSlot} must exist in storage registry`);
  assert(storageEntry.storagePath === promptVersion.storagePath, `${promptVersion.version} storage path must match storage registry`);
  await readFile(new URL(`../${promptVersion.storagePath}`, import.meta.url), "utf8");

  const coordinate = `${promptVersion.id}:${promptVersion.version}`;
  assert(!versionCoordinates.has(coordinate), `duplicate prompt version ${coordinate}`);
  versionCoordinates.add(coordinate);
}

assert(coverage.taskStates["W4-T1"] === "IMPLEMENTED", "W4-T1 must remain implemented");
assert(coverage.taskStates["W4-T2"] === "IMPLEMENTED", "W4-T2 must remain implemented");
assert(coverage.taskStates["W4-T3"] === "IMPLEMENTED", "W4-T3 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W4-T4"] === "IMPLEMENTED", "W4-T4 must be marked IMPLEMENTED after product validation");
for (const task of ["W4-T5", "W4-T6"]) {
  assert(
    ["BASELINE_PRESENT", "READY_FOR_FUTURE_TASK"].includes(coverage.taskStates[task]),
    `${task} must remain open after W4-T3`
  );
}

for (const file of coverage.tasks["W4-T3"]) {
  await readFile(new URL(`../${file}`, import.meta.url), "utf8");
}

console.log("ENTERPRISE-10-10 W4-T3 prompt registry versioning validation PASS");
