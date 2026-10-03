#!/usr/bin/env node
// Gate: UNMAPPED=0 (Contrato de Paridad, condiciones P38/P40).
// Read-only. Checks that parity/v2.0.5/{capabilities,tests-map,files-map}.json
// and parity/par-tests.json are internally consistent and that every
// capability's parTests references either a real PAR-* id in par-tests.json
// or a compatibility test id (C1-C6). See governance/adr/ADR-002.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { RESULT_STATUS, statusFromCounts, exitCodeFor, formatLine } from "../runtime/lib/result.mjs";

const here = dirname(fileURLToPath(import.meta.url));

function readJson(rel) {
  return JSON.parse(readFileSync(join(here, rel), "utf8"));
}

const errors = [];
const warnings = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}
function warn(condition, message) {
  if (!condition) warnings.push(message);
}

const capabilities = readJson("v2.0.5/capabilities.json");
const testsMap = readJson("v2.0.5/tests-map.json");
const filesMap = readJson("v2.0.5/files-map.json");
const parTests = readJson("par-tests.json");

// --- capabilities.json ---
check(capabilities.totalCapabilities === 74, `capabilities.json: expected 74, got ${capabilities.totalCapabilities}`);
check(capabilities.capabilities.length === capabilities.totalCapabilities, "capabilities.json: totalCapabilities does not match array length");
check(capabilities.unmapped === 0, `capabilities.json: unmapped=${capabilities.unmapped}, expected 0`);
const capIds = new Set();
for (const c of capabilities.capabilities) {
  check(!capIds.has(c.id), `capabilities.json: duplicate id ${c.id}`);
  capIds.add(c.id);
}
const sumClassifications = Object.values(capabilities.classificationCounts).reduce((a, b) => a + b, 0);
check(sumClassifications === capabilities.totalCapabilities, "capabilities.json: classificationCounts does not sum to totalCapabilities");

// --- tests-map.json ---
check(testsMap.totalFiles === 35, `tests-map.json: expected 35 files, got ${testsMap.totalFiles}`);
check(testsMap.totalFunctions === 264, `tests-map.json: expected 264 functions, got ${testsMap.totalFunctions}`);
check(testsMap.unmappedFunctions === 0, `tests-map.json: unmappedFunctions=${testsMap.unmappedFunctions}, expected 0`);
check(testsMap.files.length === testsMap.totalFiles, "tests-map.json: totalFiles does not match array length");
const sumFunctions = testsMap.files.reduce((sum, f) => sum + f.functions, 0);
check(sumFunctions === testsMap.totalFunctions, `tests-map.json: files sum to ${sumFunctions} functions, expected ${testsMap.totalFunctions}`);

// --- files-map.json ---
check(filesMap.totalFiles === 576, `files-map.json: expected 576 files, got ${filesMap.totalFiles}`);
check(filesMap.unmappedFiles === 0, `files-map.json: unmappedFiles=${filesMap.unmappedFiles}, expected 0`);
const sumAreaFiles = filesMap.areas.reduce((sum, a) => sum + a.files, 0);
check(sumAreaFiles === filesMap.totalFiles, `files-map.json: areas sum to ${sumAreaFiles} files, expected ${filesMap.totalFiles}`);
warn(filesMap.granularity && filesMap.granularity.startsWith("area"), "files-map.json: granularity is not area-level as expected pre-M1.1");

// --- cross-check: every capability.parTests id exists in par-tests.json (or is C1-C6) ---
const knownParIds = new Set(parTests.tests.map((t) => t.id));
const COMPAT_IDS = new Set(["C1", "C2", "C3", "C4", "C5", "C6"]);
let unresolvedParRefs = 0;
for (const c of capabilities.capabilities) {
  for (const p of c.parTests) {
    if (!knownParIds.has(p) && !COMPAT_IDS.has(p)) {
      errors.push(`capabilities.json: ${c.id} references unknown parTest '${p}' (not in par-tests.json)`);
      unresolvedParRefs += 1;
    }
  }
}
check(unresolvedParRefs === 0, `${unresolvedParRefs} capability parTest reference(s) not found in the closed par-tests.json registry`);

// --- par-tests.json: implemented ones must exist on disk and be runnable ---
const implemented = parTests.tests.filter((t) => t.status === "IMPLEMENTED");
warn(implemented.length >= 1, "par-tests.json: no test is marked IMPLEMENTED yet");
for (const t of implemented) {
  check(typeof t.implementedBy === "string" && t.implementedBy.length > 0, `par-tests.json: ${t.id} is IMPLEMENTED but has no implementedBy`);
  if (typeof t.implementedBy === "string" && t.implementedBy.length > 0) {
    for (const file of t.implementedBy.split(/[,;]\s*/)) check(existsSync(join(here, "..", file)), `par-tests.json: ${t.id} implementedBy "${file}" does not exist on disk`);
  }
}

const status = statusFromCounts({ errors: errors.length, warnings: warnings.length });
console.log(`parity validation: ${formatLine(status, { errors: errors.length, warnings: warnings.length })}`);
console.log(`  capabilities: ${capabilities.totalCapabilities} (unmapped=${capabilities.unmapped})`);
console.log(`  tests-map: ${testsMap.totalFiles} files / ${testsMap.totalFunctions} functions (unmapped=${testsMap.unmappedFunctions})`);
console.log(`  files-map: ${filesMap.totalFiles} files across ${filesMap.areas.length} areas (unmapped=${filesMap.unmappedFiles})`);
console.log(`  par-tests: ${parTests.tests.length} registered, ${implemented.length} implemented`);
for (const w of warnings) console.log(`  WARNING: ${w}`);
for (const e of errors) console.log(`  ERROR: ${e}`);

process.exit(exitCodeFor(status, { strict: true }));
