#!/usr/bin/env node
// M2.1: structural validator for contracts/*.schema.json and their data
// files. Dependency-free by design (consistent with every other validator
// in this repo — see .github/workflows/ci.yml's "no install step" note).
// The actual JSON Schema subset checker lives in runtime/lib/schema-lite.mjs
// (shared with core/validate-core.mjs, M2.2, for profiles/*.json).
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { RESULT_STATUS, statusFromCounts, exitCodeFor, formatLine } from "../runtime/lib/result.mjs";
import { validate } from "../runtime/lib/schema-lite.mjs";

const here = dirname(fileURLToPath(import.meta.url));

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

// --- 1. every *.schema.json is well-formed and self-describing ---
const schemaFiles = readdirSync(here).filter((f) => f.endsWith(".schema.json"));
const schemas = {};
for (const file of schemaFiles) {
  try {
    const schema = JSON.parse(readFileSync(join(here, file), "utf8"));
    schemas[file] = schema;
    for (const field of ["$schema", "$id", "title", "type"]) {
      if (!schema[field]) fail(`${file}: missing top-level "${field}"`);
    }
  } catch (error) {
    fail(`${file}: invalid JSON (${error.message})`);
  }
}

// --- 2. data files validated against their schema ---
const DATA_FILES = [
  { data: "sdd-levels.json", schema: "sdd-levels.schema.json" },
  { data: "state-machine.json", schema: "state-machine.schema.json" },
];
for (const { data, schema } of DATA_FILES) {
  if (!schemas[schema]) {
    fail(`${data}: cannot validate, ${schema} failed to load`);
    continue;
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(join(here, data), "utf8"));
  } catch (error) {
    fail(`${data}: invalid JSON (${error.message})`);
    continue;
  }
  const errs = validate(parsed, schemas[schema]);
  for (const e of errs) fail(`${data} vs ${schema}: ${e}`);
}

// --- 3. cross-check: every *.schema.json File-column entry in README.md's
// inventory table exists on disk. Only the first `backtick span` of each
// table row is checked (the "File" column); other backtick spans in that
// row describe data/example filenames the schema produces, which are not
// expected to live in contracts/ itself (e.g. platform.json, unit.json).
const readme = readFileSync(join(here, "README.md"), "utf8");
const listedSchemaFiles = [...readme.matchAll(/^\| `([a-z0-9.-]+\.schema\.json)`/gm)].map((m) => m[1]);
const allFiles = new Set(readdirSync(here).filter((f) => f !== "README.md" && f !== "validate-contracts.mjs" && f !== "validate-contracts.test.mjs"));
for (const f of listedSchemaFiles) {
  if (!allFiles.has(f)) warnings.push(`README.md inventory table references ${f}, which does not exist in contracts/`);
}
for (const f of schemaFiles) {
  if (!listedSchemaFiles.includes(f)) warnings.push(`${f} exists but is not listed in README.md's inventory table`);
}

const status = statusFromCounts({ errors: errors.length, warnings: warnings.length });
console.log(`contracts validation: ${formatLine(status, { errors: errors.length, warnings: warnings.length })}`);
console.log(`  schemas checked: ${schemaFiles.length}`);
console.log(`  data files checked: ${DATA_FILES.length}`);
for (const w of warnings) console.log(`  WARNING: ${w}`);
for (const e of errors) console.log(`  ERROR: ${e}`);

process.exit(exitCodeFor(status, { strict: true }));
