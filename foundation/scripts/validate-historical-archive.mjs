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

const contract = await readJson("_deprecated/2026-06-11/historical-archive.contract.json");
const inventory = await readJson("_deprecated/2026-06-11/legacy-inventory.contract.json");
const coverage = await readJson("validation/roadmap-coverage.json");
const roadmapToFiles = await readFile(join(root, "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md"), "utf8");
const archiveDoc = await readFile(join(root, "_deprecated/2026-06-11/historical-archive.md"), "utf8");
const readme = await readFile(join(root, "_deprecated/2026-06-11/README.md"), "utf8");

assert(contract.schemaVersion === "historical-archive.v1", "historical archive schema version changed");
assert(contract.roadmapTask === "W8-T2", "historical archive must bind to W8-T2");
assert(contract.repo === "ai-foundation", "historical archive repo mismatch");
assert(contract.basedOnInventoryTask === "W8-T1", "historical archive must build on W8-T1");
assert(contract.governance.nextEligibleTask === "W8-T3", "W8-T3 must be next eligible");
assert(contract.governance.deletionAllowed === false, "W8-T2 must not allow deletion");
assert(contract.governance.physicalMoveAllowed === false, "W8-T2 must not move archive files");
assert(contract.governance.runtimeActivationAllowed === false, "W8-T2 must not activate runtime");
assert(contract.governance.doesNotOpen.includes("W8-T3"), "W8-T2 must not open W8-T3");
assert(contract.governance.doesNotClose.includes("W8-T3"), "W8-T2 must not close W8-T3");

const retentionClasses = new Set(contract.retentionModel.map((item) => item.id));
const inventoryPaths = new Set(inventory.inventory.map((entry) => entry.path));
assert(contract.archiveEntries.length === inventory.inventory.length, "archive entries must match W8-T1 inventory count");

for (const entry of contract.archiveEntries) {
  assert(exists(entry.path), `archive path missing: ${entry.path}`);
  assert(inventoryPaths.has(entry.path), `${entry.path} missing from W8-T1 inventory`);
  assert(retentionClasses.has(entry.retentionClass), `${entry.path} has unknown retention class`);
  assert(entry.archivalState === "retained_in_place", `${entry.path} must be retained in place`);
  assert(entry.activeUseAllowed === false, `${entry.path} must not be active-use allowed`);
  assert(entry.deletionAllowed === false, `${entry.path} must not be deletion allowed`);
}

for (const file of contract.traceability) assert(exists(file), `traceability file missing: ${file}`);
for (const file of coverage.tasks["W8-T2"]) assert(exists(file), `W8-T2 maps missing file ${file}`);

assert(coverage.taskStates["W8-T1"] === "IMPLEMENTED", "W8-T1 must remain IMPLEMENTED");
assert(coverage.taskStates["W8-T2"] === "IMPLEMENTED", "W8-T2 must be IMPLEMENTED in product coverage");
assert(
  !coverage.taskStates["W8-T3"] || coverage.taskStates["W8-T3"] === "IMPLEMENTED",
  "W8-T3 must be absent or implemented by its own task in product coverage"
);
assert(roadmapToFiles.includes("| W8-T2 | Historical Archive |"), "roadmap-to-files missing W8-T2");
assert(roadmapToFiles.includes("historical-archive.contract.json"), "roadmap-to-files missing historical archive contract");
assert(roadmapToFiles.includes("validate-historical-archive.mjs"), "roadmap-to-files missing historical archive validator");
assert(archiveDoc.includes("Archive Policy"), "archive doc must describe archive policy");
assert(archiveDoc.includes("Retention Model"), "archive doc must describe retention model");
assert(readme.includes("W8-T2 Historical Archive"), "deprecated README must mention W8-T2 historical archive");

console.log("ENTERPRISE-10-10 W8-T2 historical archive validation PASS");
