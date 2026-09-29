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

const contract = await readJson("_deprecated/2026-06-11/legacy-inventory.contract.json");
const coverage = await readJson("validation/roadmap-coverage.json");
const roadmapToFiles = await readFile(join(root, "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md"), "utf8");
const inventoryDoc = await readFile(join(root, "_deprecated/2026-06-11/legacy-inventory.md"), "utf8");
const readme = await readFile(join(root, "_deprecated/2026-06-11/README.md"), "utf8");

assert(contract.schemaVersion === "legacy-inventory.v1", "legacy inventory schema version changed");
assert(contract.roadmapTask === "W8-T1", "legacy inventory must bind to W8-T1");
assert(contract.repo === "ai-foundation", "legacy inventory repo mismatch");
assert(contract.governance.nextEligibleTask === "W8-T2", "W8-T2 must remain next eligible");
assert(contract.governance.deletionAllowed === false, "W8-T1 must not allow deletion");
assert(contract.governance.runtimeActivationAllowed === false, "W8-T1 must not activate runtime");
assert(contract.governance.doesNotOpen.includes("W8-T2"), "W8-T1 must not open W8-T2");
assert(contract.governance.doesNotClose.includes("W8-T2"), "W8-T1 must not close W8-T2");

const classifications = new Set(contract.classificationModel.map((item) => item.id));
assert(contract.inventory.length >= 10, "legacy inventory must enumerate foundation legacy groups");

for (const entry of contract.inventory) {
  assert(exists(entry.path), `legacy inventory path missing: ${entry.path}`);
  assert(classifications.has(entry.classification), `${entry.path} has unknown classification`);
  assert(entry.owner && entry.owner.endsWith("-stewards"), `${entry.path} missing steward owner`);
  assert(entry.deletionAllowed === false, `${entry.path} must not be deletion allowed`);
}

for (const file of contract.traceability) assert(exists(file), `traceability file missing: ${file}`);
for (const file of coverage.tasks["W8-T1"]) assert(exists(file), `W8-T1 maps missing file ${file}`);

assert(coverage.taskStates["W8-T1"] === "IMPLEMENTED", "W8-T1 must be IMPLEMENTED in product coverage");
assert(
  !coverage.taskStates["W8-T2"] || coverage.taskStates["W8-T2"] === "IMPLEMENTED",
  "W8-T2 must be absent or implemented by its own task in product coverage"
);
assert(roadmapToFiles.includes("| W8-T1 | Legacy Inventory |"), "roadmap-to-files missing W8-T1");
assert(roadmapToFiles.includes("legacy-inventory.contract.json"), "roadmap-to-files missing inventory contract");
assert(roadmapToFiles.includes("validate-legacy-inventory.mjs"), "roadmap-to-files missing inventory validator");
assert(inventoryDoc.includes("Classification Model"), "inventory doc must describe classification model");
assert(inventoryDoc.includes("Ownership Map"), "inventory doc must describe ownership map");
assert(readme.includes("W8-T1 Legacy Inventory"), "deprecated README must mention W8-T1 inventory");

console.log("ENTERPRISE-10-10 W8-T1 legacy inventory validation PASS");
