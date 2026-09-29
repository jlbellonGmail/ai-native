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

const audit = await readJson("validation/testing-audit-final.contract.json");
const coverage = await readJson("validation/roadmap-coverage.json");
const roadmapToFiles = await readFile(join(root, "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md"), "utf8");
const validationReadme = await readFile(join(root, "validation/README.md"), "utf8");
const strategy = await readFile(join(root, "validation/strategy.md"), "utf8");
const auditDoc = await readFile(join(root, "validation/testing-audit-final.md"), "utf8");

assert(audit.schemaVersion === "testing-audit-final.v1", "testing audit final schema version must be v1");
assert(audit.roadmapTask === "W6-T7", "testing audit final contract must bind to W6-T7");
assert(audit.auditScope.workstream === "W6 Testing Enterprise", "audit must bind to W6 Testing Enterprise");
assert(audit.auditScope.closesWorkstream === true, "W6-T7 must close the W6 workstream");
assert(audit.auditScope.finalTask === "W6-T7", "final task must be W6-T7");
assert(audit.auditScope.nextEligibleTask === "W7-T1", "next eligible task must be W7-T1");
assert(audit.auditScope.w7T1Opened === false, "W6-T7 must not open W7-T1");
assert(audit.governance.roadmapTask === "W6-T7", "governance block must bind to W6-T7");
assert(audit.governance.validation === "scripts/validate-testing-audit-final.mjs", "validation path changed");
assert(audit.governance.doesNotClose.includes("W7-T1"), "W6-T7 must not close W7-T1");
assert(audit.governance.doesNotClose.includes("W7"), "W6-T7 must not close W7");

for (const field of [
  "requiresHumanReadablePolicy",
  "requiresMachineReadableContract",
  "requiresLocalValidator",
  "requiresRoadmapCoverageMapping",
  "requiresRoadmapToFilesMapping",
  "requiresAllW6TaskStatesImplemented"
]) {
  assert(audit.auditRequirements[field] === true, `audit requirement ${field} must be true`);
}

const expectedTasks = ["W6-T1", "W6-T2", "W6-T3", "W6-T4", "W6-T5", "W6-T6"];
assert(JSON.stringify(audit.auditScope.sourceTasks) === JSON.stringify(expectedTasks), "audit source tasks changed");

for (const domain of audit.testingDomains) {
  assert(expectedTasks.includes(domain.task), `${domain.task} is not part of W6 audit scope`);
  assert(exists(domain.policy), `${domain.task} policy missing: ${domain.policy}`);
  assert(exists(domain.contract), `${domain.task} contract missing: ${domain.contract}`);
  assert(exists(domain.validator), `${domain.task} validator missing: ${domain.validator}`);
  assert(coverage.taskStates[domain.task] === "IMPLEMENTED", `${domain.task} must be IMPLEMENTED`);
  assert(coverage.tasks[domain.task].includes(domain.policy), `${domain.task} coverage missing policy`);
  assert(coverage.tasks[domain.task].includes(domain.contract), `${domain.task} coverage missing contract`);
  assert(coverage.tasks[domain.task].includes(domain.validator), `${domain.task} coverage missing validator`);
  for (const file of coverage.tasks[domain.task]) {
    assert(exists(file), `${domain.task} maps missing file ${file}`);
  }
  assert(roadmapToFiles.includes(`| ${domain.task} | ${domain.name} |`), `roadmap-to-files missing ${domain.task}`);
  assert(roadmapToFiles.includes(domain.contract), `roadmap-to-files missing ${domain.contract}`);
  assert(roadmapToFiles.includes(domain.validator), `roadmap-to-files missing ${domain.validator}`);
}

assert(coverage.taskStates["W6-T7"] === "IMPLEMENTED", "W6-T7 must be marked IMPLEMENTED");
assert(coverage.taskStates["W7-T1"] === undefined, "W6-T7 must not open W7-T1 in W6 coverage state");
for (const file of coverage.tasks["W6-T7"]) {
  assert(exists(file), `W6-T7 maps missing file ${file}`);
}
for (const file of audit.finalAuditArtifacts) {
  assert(exists(file), `final audit artifact missing: ${file}`);
  assert(coverage.tasks["W6-T7"].includes(file), `W6-T7 coverage missing final artifact ${file}`);
}

assert(roadmapToFiles.includes("| W6-T7 | Testing Audit Final |"), "roadmap-to-files must include W6-T7");
assert(roadmapToFiles.includes("testing-audit-final.contract.json"), "roadmap-to-files must map final audit contract");
assert(roadmapToFiles.includes("validate-testing-audit-final.mjs"), "roadmap-to-files must map final audit validator");
assert(validationReadme.includes("validate-testing-audit-final.mjs"), "validation README must list final audit validator");
assert(strategy.includes("testing audit final"), "strategy must describe testing audit final");
assert(auditDoc.includes("Audit Scope"), "audit docs must describe audit scope");
assert(auditDoc.includes("Traceability Rules"), "audit docs must describe traceability rules");
assert(auditDoc.includes("Machine-Readable Validation"), "audit docs must describe machine-readable validation");

console.log("ENTERPRISE-10-10 W6-T7 testing audit final validation PASS");
