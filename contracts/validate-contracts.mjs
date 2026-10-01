#!/usr/bin/env node
// M2.1: structural validator for contracts/*.schema.json and their data
// files. Dependency-free by design (consistent with every other validator
// in this repo — see .github/workflows/ci.yml's "no install step" note).
// Supports the JSON Schema subset these contracts actually use: type,
// required, properties, additionalProperties (boolean only), items, enum,
// const, pattern, minimum/maximum, minItems, allOf/if-then. Local $ref
// (#/...) is resolved against the same document; a $ref to another file is
// not resolved (README.md documents this) and accepted as-is. Not a
// general-purpose JSON Schema implementation.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { RESULT_STATUS, statusFromCounts, exitCodeFor, formatLine } from "../runtime/lib/result.mjs";

const here = dirname(fileURLToPath(import.meta.url));

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

// --- minimal structural validator ---
function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value; // "object" | "string" | "number" | "boolean"
}

function matchesType(value, type) {
  if (type === "integer") return typeof value === "number" && Number.isInteger(value);
  return typeOf(value) === type;
}

function resolveLocalRef(ref, root) {
  if (!ref.startsWith("#/")) return null; // external $ref: not resolved, documented limitation
  return ref
    .slice(2)
    .split("/")
    .reduce((node, key) => (node ? node[key] : undefined), root);
}

function checkNode(value, schema, path, errs, root = schema) {
  if (schema.$ref) {
    const resolved = resolveLocalRef(schema.$ref, root);
    if (resolved) checkNode(value, resolved, path, errs, root);
    return;
  }
  if (schema.const !== undefined) {
    if (value !== schema.const) errs.push(`${path}: expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(value)}`);
    return;
  }
  if (schema.enum) {
    if (!schema.enum.includes(value)) errs.push(`${path}: ${JSON.stringify(value)} not in enum ${JSON.stringify(schema.enum)}`);
  }
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : null;
  if (types && !types.some((t) => matchesType(value, t))) {
    errs.push(`${path}: expected type ${types.join("|")}, got ${typeOf(value)}`);
    return;
  }
  if (typeof value === "string") {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errs.push(`${path}: "${value}" does not match pattern ${schema.pattern}`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errs.push(`${path}: ${value} < minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errs.push(`${path}: ${value} > maximum ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errs.push(`${path}: array shorter than minItems ${schema.minItems}`);
    if (schema.items) value.forEach((item, i) => checkNode(item, schema.items, `${path}[${i}]`, errs, root));
  }
  if (typeOf(value) === "object") {
    for (const key of schema.required || []) {
      if (!(key in value)) errs.push(`${path}: missing required property "${key}"`);
    }
    for (const [key, propSchema] of Object.entries(schema.properties || {})) {
      if (key in value) checkNode(value[key], propSchema, `${path}.${key}`, errs, root);
    }
    if (schema.additionalProperties === false) {
      const known = new Set(Object.keys(schema.properties || {}));
      for (const key of Object.keys(value)) {
        if (!known.has(key)) errs.push(`${path}: unexpected property "${key}" (additionalProperties: false)`);
      }
    }
    if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
      const known = new Set(Object.keys(schema.properties || {}));
      for (const [key, v] of Object.entries(value)) {
        if (!known.has(key)) checkNode(v, schema.additionalProperties, `${path}.${key}`, errs, root);
      }
    }
  }
  for (const branch of schema.allOf || []) {
    if (branch.if) {
      const condErrs = [];
      checkNode(value, branch.if, path, condErrs, root);
      if (condErrs.length === 0 && branch.then) checkNode(value, branch.then, path, errs, root);
    } else {
      checkNode(value, branch, path, errs, root);
    }
  }
}

function validate(data, schema) {
  const errs = [];
  checkNode(data, schema, "$", errs);
  return errs;
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
