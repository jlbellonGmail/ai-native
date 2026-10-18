import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const storage = JSON.parse(
  await readFile(new URL("../registries/prompts/registry.storage.json", import.meta.url), "utf8")
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

assert(storage.schemaVersion === "prompt-registry-storage.v1", "storage schema version must be prompt-registry-storage.v1");
assert(storage.roadmapTask === "W4-T2", "storage contract must bind to W4-T2");
assert(storage.storageRoot === "registries/prompts", "storage root must be registries/prompts");
assert(storage.storageMode === "repository-filesystem", "storage mode must be repository-filesystem");
assert(storage.layout?.pathTemplate === "registries/prompts/<prompt-family>/<storage-slot>/system-prompt.md", "storage layout path template changed");
assert(storage.lifecycle?.initialState === "stored", "storage lifecycle must start as stored");
assert(storage.integrity?.algorithm === "sha256", "storage integrity must use sha256");
assert(storage.integrity?.requiredForEveryEntry === true, "sha256 must be required for every entry");
assert(storage.governance?.roadmapTask === "W4-T2", "governance block must bind to W4-T2");
for (const task of ["W4-T4", "W4-T5", "W4-T6"]) {
  assert(storage.governance.doesNotClose.includes(task), `${task} must remain outside W4-T2 closure`);
}

const states = new Set(storage.lifecycle.states);
for (const state of ["stored", "candidate", "active", "retired"]) {
  assert(states.has(state), `missing lifecycle state ${state}`);
}

assert(Array.isArray(storage.entries) && storage.entries.length >= 3, "storage registry must contain prompt entries");
const coordinates = new Set();
for (const entry of storage.entries) {
  assert(entry.id === "code-generator.system", "baseline entries must keep the W4-T1 prompt id");
  assert(entry.family === "code-generator", "baseline entries must use code-generator family");
  assert(/^v[0-9]+$/.test(entry.storageSlot), `${entry.storageSlot} must be a storage slot`);
  assert(entry.role === "system", "baseline prompt entries must be system prompts");
  assert(states.has(entry.lifecycleState), `${entry.storagePath} has unknown lifecycle state`);
  assert(entry.contentType === "text/markdown", `${entry.storagePath} must be markdown`);
  assert(entry.storagePath === normalizePath(entry.storagePath), `${entry.storagePath} must use forward slashes`);
  assert(entry.storagePath.startsWith(`${storage.storageRoot}/`), `${entry.storagePath} must stay inside storage root`);
  assert(!entry.storagePath.includes(".."), `${entry.storagePath} must not traverse directories`);
  assert(entry.storagePath.endsWith(`/${entry.storageSlot}/${storage.layout.promptFileName}`), `${entry.storagePath} must match its storage slot`);
  assert(entry.sha256 === await sha256(entry.storagePath), `${entry.storagePath} checksum mismatch`);

  const coordinate = `${entry.id}:${entry.storageSlot}`;
  assert(!coordinates.has(coordinate), `duplicate storage coordinate ${coordinate}`);
  coordinates.add(coordinate);
}

assert(coverage.taskStates["W4-T1"] === "IMPLEMENTED", "W4-T1 must remain implemented");
assert(coverage.taskStates["W4-T2"] === "IMPLEMENTED", "W4-T2 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W4-T3"] === "IMPLEMENTED", "W4-T3 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W4-T4"] === "IMPLEMENTED", "W4-T4 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W4-T5"] === "IMPLEMENTED", "W4-T5 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W4-T6"] === "IMPLEMENTED", "W4-T6 must be marked IMPLEMENTED after product validation");

for (const file of coverage.tasks["W4-T2"]) {
  assert(file.startsWith("registries/prompts/") || file === "scripts/validate-prompt-registry-storage.mjs", `${file} is outside W4-T2 scope`);
  await readFile(new URL(`../${file}`, import.meta.url), "utf8");
}

console.log("ENTERPRISE-10-10 W4-T2 prompt registry storage validation PASS");
