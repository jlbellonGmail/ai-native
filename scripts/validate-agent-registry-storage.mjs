import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const storage = JSON.parse(
  await readFile(new URL("../registries/agents/registry.storage.json", import.meta.url), "utf8")
);
const schema = JSON.parse(
  await readFile(new URL("../config/agent-registry.schema.json", import.meta.url), "utf8")
);
const coverage = JSON.parse(
  await readFile(new URL("../validation/roadmap-coverage.json", import.meta.url), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizePath(path) {
  return path.replaceAll("\\", "/");
}

async function sha256(path) {
  const content = await readFile(new URL(`../${path}`, import.meta.url));
  return createHash("sha256").update(content).digest("hex");
}

assert(storage.schemaVersion === "agent-registry-storage.v1", "storage schema version must be agent-registry-storage.v1");
assert(storage.roadmapTask === "W5-T2", "storage contract must bind to W5-T2");
assert(storage.storageRoot === "registries/agents", "storage root must be registries/agents");
assert(storage.storageMode === "repository-filesystem", "storage mode must be repository-filesystem");
assert(storage.layout.indexFile === "skills-index.md", "agent registry index file changed");
assert(storage.layout.folderEntryTemplate === "registries/agents/<agent-family>/skill.md", "folder entry template changed");
assert(storage.layout.singleFileEntryTemplate === "registries/agents/<agent-family>.md", "single-file entry template changed");
assert(storage.lifecycle.initialState === "stored", "storage lifecycle must start as stored");
assert(storage.retention.policy === "git-retained-stable-paths", "retention policy changed");
assert(storage.retention.minimumRetention === "retain-while-referenced-by-storage-contract", "minimum retention changed");
assert(storage.integrity.algorithm === "sha256", "storage integrity must use sha256");
assert(storage.integrity.requiredForEveryEntry === true, "sha256 must be required for every entry");
assert(storage.governance.roadmapTask === "W5-T2", "governance block must bind to W5-T2");
assert(storage.governance.validation === "scripts/validate-agent-registry-storage.mjs", "storage validation path changed");
for (const task of ["W5-T3", "W5-T4", "W5-T5", "W5-T6"]) {
  assert(storage.governance.doesNotClose.includes(task), `${task} must remain outside W5-T2 closure`);
}

assert(schema.properties.id.description.includes("W5-T2"), "agent schema id field must acknowledge W5-T2 storage layout");

const states = new Set(storage.lifecycle.states);
for (const state of ["stored", "candidate", "active", "retired"]) {
  assert(states.has(state), `missing lifecycle state ${state}`);
}

assert(Array.isArray(storage.entries) && storage.entries.length >= 8, "storage registry must contain existing agent entries");
const ids = new Set();
for (const entry of storage.entries) {
  assert(!ids.has(entry.id), `${entry.id} storage entry is duplicated`);
  ids.add(entry.id);
  assert(/^[a-z][a-z0-9-]*$/.test(entry.id), `${entry.id} must be kebab-case`);
  assert(["index", "folder-skill", "single-file"].includes(entry.storageKind), `${entry.id} has invalid storage kind`);
  assert(states.has(entry.lifecycleState), `${entry.id} has unknown lifecycle state`);
  assert(entry.lifecycleState === "stored", `${entry.id} must remain stored in W5-T2`);
  assert(entry.contentType === "text/markdown", `${entry.id} must be markdown`);
  assert(entry.storagePath === normalizePath(entry.storagePath), `${entry.id} path must use forward slashes`);
  assert(entry.storagePath.startsWith(`${storage.storageRoot}/`), `${entry.id} must stay inside storage root`);
  assert(!entry.storagePath.includes(".."), `${entry.id} path must not traverse directories`);
  assert(entry.retentionClass === "agent-skill" || entry.retentionClass === "registry-index", `${entry.id} retention class changed`);

  if (entry.storageKind === "index") {
    assert(entry.storagePath === `${storage.storageRoot}/${storage.layout.indexFile}`, "index entry path mismatch");
  }
  if (entry.storageKind === "folder-skill") {
    assert(entry.storagePath === `${storage.storageRoot}/${entry.family}/skill.md`, `${entry.id} folder skill path mismatch`);
  }
  if (entry.storageKind === "single-file") {
    assert(entry.storagePath === `${storage.storageRoot}/${entry.family}.md`, `${entry.id} single-file path mismatch`);
  }
  assert(entry.sha256 === await sha256(entry.storagePath), `${entry.storagePath} checksum mismatch`);
}

assert(coverage.taskStates["W5-T1"] === "IMPLEMENTED", "W5-T1 must remain implemented");
assert(coverage.taskStates["W5-T2"] === "IMPLEMENTED", "W5-T2 must be marked IMPLEMENTED");
assert(coverage.taskStates["W5-T3"] === "IMPLEMENTED", "W5-T3 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W5-T4"] === "IMPLEMENTED", "W5-T4 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W5-T5"] === "IMPLEMENTED", "W5-T5 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W5-T6"] === "IMPLEMENTED", "W5-T6 must be marked IMPLEMENTED after product validation");
for (const file of coverage.tasks["W5-T2"]) {
  await readFile(new URL(`../${file}`, import.meta.url), "utf8");
}

console.log("ENTERPRISE-10-10 W5-T2 agent registry storage validation PASS");
