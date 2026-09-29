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

const contract = await readJson("_deprecated/2026-06-11/obsolete-artifacts.contract.json");
const detection = await readJson("_deprecated/2026-06-11/duplicate-detection.contract.json");
const coverage = await readJson("validation/roadmap-coverage.json");
const roadmapToFiles = await readFile(join(root, "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md"), "utf8");
const policy = await readFile(join(root, "_deprecated/2026-06-11/obsolete-artifacts.md"), "utf8");
const readme = await readFile(join(root, "_deprecated/2026-06-11/README.md"), "utf8");

assert(contract.schemaVersion === "obsolete-artifacts.v1", "obsolete artifacts schema version changed");
assert(contract.roadmapTask === "W8-T4", "obsolete artifacts must bind to W8-T4");
assert(contract.repo === "ai-foundation", "obsolete artifacts repo mismatch");
assert(contract.basedOnDetectionTask === "W8-T3", "obsolete artifacts must build on W8-T3");
assert(contract.governance.nextEligibleTask === "W8-T5", "W8-T5 must be next eligible");
assert(contract.governance.deletionAllowed === false, "W8-T4 must not allow deletion");
assert(contract.governance.physicalMoveAllowed === false, "W8-T4 must not move archive files");
assert(contract.governance.runtimeDeletionAllowed === false, "W8-T4 must not delete runtime");
assert(contract.governance.runtimeActivationAllowed === false, "W8-T4 must not activate runtime");
assert(contract.governance.doesNotOpen.includes("W8-T5"), "W8-T4 must not open W8-T5");
assert(contract.governance.doesNotClose.includes("W8-T5"), "W8-T4 must not close W8-T5");

const classes = new Set(contract.deprecationModel.map((item) => item.id));
const duplicatePaths = new Set(detection.duplicates.map((entry) => entry.path));
assert(contract.obsoleteArtifacts.length === detection.duplicates.length, "obsolete artifacts must match W8-T3 duplicate count");

for (const entry of contract.obsoleteArtifacts) {
  assert(exists(entry.path), `obsolete artifact path missing: ${entry.path}`);
  assert(duplicatePaths.has(entry.path), `${entry.path} missing from W8-T3 duplicate detection`);
  assert(classes.has(entry.obsoleteClass), `${entry.path} has unknown obsolete class`);
  assert(entry.lifecycleState === "deprecated_retained", `${entry.path} must remain retained`);
  assert(entry.lifecycleAction && entry.lifecycleAction.startsWith("retain_"), `${entry.path} must retain lifecycle action`);
  assert(entry.removalAllowed === false, `${entry.path} must not be removal allowed`);
  assert(entry.runtimeDeletionAllowed === false, `${entry.path} must not allow runtime deletion`);
}

for (const file of contract.traceability) assert(exists(file), `traceability file missing: ${file}`);
for (const file of coverage.tasks["W8-T4"]) assert(exists(file), `W8-T4 maps missing file ${file}`);

assert(coverage.taskStates["W8-T1"] === "IMPLEMENTED", "W8-T1 must remain IMPLEMENTED");
assert(coverage.taskStates["W8-T2"] === "IMPLEMENTED", "W8-T2 must remain IMPLEMENTED");
assert(coverage.taskStates["W8-T3"] === "IMPLEMENTED", "W8-T3 must remain IMPLEMENTED");
assert(coverage.taskStates["W8-T4"] === "IMPLEMENTED", "W8-T4 must be IMPLEMENTED in product coverage");
assert(coverage.taskStates["W8-T5"] !== "IMPLEMENTED", "W8-T4 must not close W8-T5 in product coverage");
assert(roadmapToFiles.includes("| W8-T4 | Obsolete Artifacts |"), "roadmap-to-files missing W8-T4");
assert(roadmapToFiles.includes("obsolete-artifacts.contract.json"), "roadmap-to-files missing obsolete artifacts contract");
assert(roadmapToFiles.includes("validate-obsolete-artifacts.mjs"), "roadmap-to-files missing obsolete artifacts validator");
assert(policy.includes("Obsolete Policy"), "obsolete policy doc must describe obsolete policy");
assert(policy.includes("Deprecation Model"), "obsolete policy doc must describe deprecation model");
assert(policy.includes("Lifecycle Rules"), "obsolete policy doc must describe lifecycle rules");
assert(readme.includes("W8-T4 Obsolete Artifacts"), "deprecated README must mention W8-T4 obsolete artifacts");

console.log("ENTERPRISE-10-10 W8-T4 obsolete artifacts validation PASS");
