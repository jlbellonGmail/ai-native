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

const contract = await readJson("_deprecated/2026-06-11/duplicate-detection.contract.json");
const archive = await readJson("_deprecated/2026-06-11/historical-archive.contract.json");
const coverage = await readJson("validation/roadmap-coverage.json");
const roadmapToFiles = await readFile(join(root, "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md"), "utf8");
const report = await readFile(join(root, "_deprecated/2026-06-11/duplicate-detection.md"), "utf8");
const readme = await readFile(join(root, "_deprecated/2026-06-11/README.md"), "utf8");

assert(contract.schemaVersion === "duplicate-detection.v1", "duplicate detection schema version changed");
assert(contract.roadmapTask === "W8-T3", "duplicate detection must bind to W8-T3");
assert(contract.repo === "ai-foundation", "duplicate detection repo mismatch");
assert(contract.basedOnArchiveTask === "W8-T2", "duplicate detection must build on W8-T2");
assert(contract.governance.nextEligibleTask === "W8-T4", "W8-T4 must be next eligible");
assert(contract.governance.deletionAllowed === false, "W8-T3 must not allow deletion");
assert(contract.governance.automaticRemovalAllowed === false, "W8-T3 must not allow automatic removal");
assert(contract.governance.physicalMoveAllowed === false, "W8-T3 must not move archive files");
assert(contract.governance.doesNotOpen.includes("W8-T4"), "W8-T3 must not open W8-T4");
assert(contract.governance.doesNotClose.includes("W8-T4"), "W8-T3 must not close W8-T4");

const ruleIds = new Set(contract.duplicationRules.map((rule) => rule.id));
const archivePaths = new Set(archive.archiveEntries.map((entry) => entry.path));
assert(contract.duplicates.length === archive.archiveEntries.length, "duplicate entries must match W8-T2 archive count");

for (const entry of contract.duplicates) {
  assert(exists(entry.path), `duplicate path missing: ${entry.path}`);
  assert(archivePaths.has(entry.path), `${entry.path} missing from W8-T2 archive`);
  assert(ruleIds.has(entry.duplicateClass), `${entry.path} has unknown duplicate class`);
  assert(entry.disposition && entry.disposition.startsWith("retain_"), `${entry.path} must retain a disposition`);
  assert(entry.deletionAllowed === false, `${entry.path} must not be deletion allowed`);
}

for (const file of contract.traceability) assert(exists(file), `traceability file missing: ${file}`);
for (const file of coverage.tasks["W8-T3"]) assert(exists(file), `W8-T3 maps missing file ${file}`);

assert(coverage.taskStates["W8-T1"] === "IMPLEMENTED", "W8-T1 must remain IMPLEMENTED");
assert(coverage.taskStates["W8-T2"] === "IMPLEMENTED", "W8-T2 must remain IMPLEMENTED");
assert(coverage.taskStates["W8-T3"] === "IMPLEMENTED", "W8-T3 must be IMPLEMENTED in product coverage");
assert(
  !coverage.taskStates["W8-T4"] || coverage.taskStates["W8-T4"] === "IMPLEMENTED",
  "W8-T4 must be absent or implemented by its own task in product coverage"
);
assert(roadmapToFiles.includes("| W8-T3 | Duplicate Detection |"), "roadmap-to-files missing W8-T3");
assert(roadmapToFiles.includes("duplicate-detection.contract.json"), "roadmap-to-files missing duplicate detection contract");
assert(roadmapToFiles.includes("validate-duplicate-detection.mjs"), "roadmap-to-files missing duplicate detection validator");
assert(report.includes("Duplication Rules"), "duplicate report must describe duplication rules");
assert(report.includes("Classification Report"), "duplicate report must describe classification report");
assert(readme.includes("W8-T3 Duplicate Detection"), "deprecated README must mention W8-T3 duplicate detection");

console.log("ENTERPRISE-10-10 W8-T3 duplicate detection validation PASS");
