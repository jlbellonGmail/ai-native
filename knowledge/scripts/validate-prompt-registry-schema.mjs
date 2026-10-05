import { readFile } from "node:fs/promises";

const schema = JSON.parse(
  await readFile(new URL("../config/prompt-registry.schema.json", import.meta.url), "utf8")
);
const example = JSON.parse(
  await readFile(new URL("../examples/prompt-registry-entry.valid.json", import.meta.url), "utf8")
);
const coverage = JSON.parse(
  await readFile(new URL("../validation/roadmap-coverage.json", import.meta.url), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isJsonSchemaUri(value) {
  try {
    return new URL(value).hostname === "json-schema.org";
  } catch {
    return false;
  }
}

function typeOf(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function validateValue(definition, value, path) {
  if (definition.const !== undefined) {
    assert(value === definition.const, `${path} must equal ${definition.const}`);
  }
  if (definition.enum) {
    assert(definition.enum.includes(value), `${path} must be one of ${definition.enum.join(", ")}`);
  }
  if (definition.type) {
    assert(typeOf(value) === definition.type, `${path} must be ${definition.type}`);
  }
  if (definition.minLength !== undefined) {
    assert(value.length >= definition.minLength, `${path} is shorter than ${definition.minLength}`);
  }
  if (definition.minimum !== undefined) {
    assert(value >= definition.minimum, `${path} is below ${definition.minimum}`);
  }
  if (definition.maximum !== undefined) {
    assert(value <= definition.maximum, `${path} is above ${definition.maximum}`);
  }
  if (definition.pattern) {
    assert(new RegExp(definition.pattern).test(value), `${path} does not match ${definition.pattern}`);
  }
  if (definition.type === "object") {
    for (const key of definition.required ?? []) {
      assert(Object.hasOwn(value, key), `${path}.${key} is required`);
    }
    if (definition.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        assert(Object.hasOwn(definition.properties ?? {}, key), `${path}.${key} is not allowed`);
      }
    }
    for (const [key, child] of Object.entries(definition.properties ?? {})) {
      if (Object.hasOwn(value, key)) validateValue(child, value[key], `${path}.${key}`);
    }
  }
  if (definition.type === "array") {
    if (definition.uniqueItems) {
      assert(new Set(value).size === value.length, `${path} must contain unique values`);
    }
    for (const [index, item] of value.entries()) {
      validateValue(definition.items, item, `${path}[${index}]`);
    }
  }
}

assert(isJsonSchemaUri(schema.$schema), "schema must declare JSON Schema draft");
assert(schema.$id?.includes("prompt-registry-entry.v1"), "schema id must identify prompt registry v1");
assert(schema.title === "Prompt Registry Entry", "schema title must be Prompt Registry Entry");
assert(schema.type === "object", "schema root must be an object");
assert(schema.additionalProperties === false, "schema must reject unknown root properties");
assert(schema.properties.governance.properties.roadmapTask.const === "W4-T1", "schema governance must bind to W4-T1");
assert(schema.properties.version.description?.includes("not the repository VERSION"), "version field must distinguish prompt version from repository VERSION");
assert(schema.properties.owner.description?.includes("W4-T4 ownership policy"), "owner field must bind to W4-T4 ownership policy");

for (const field of [
  "schemaVersion",
  "id",
  "owner",
  "purpose",
  "version",
  "status",
  "evaluationSuite",
  "prompt",
  "riskControls",
  "governance"
]) {
  assert(schema.required.includes(field), `schema must require ${field}`);
}

validateValue(schema, example, "example");

assert(coverage.taskStates["W4-T1"] === "IMPLEMENTED", "W4-T1 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W4-T2"] === "IMPLEMENTED", "W4-T2 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W4-T3"] === "IMPLEMENTED", "W4-T3 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W4-T4"] === "IMPLEMENTED", "W4-T4 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W4-T5"] === "IMPLEMENTED", "W4-T5 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W4-T6"] === "IMPLEMENTED", "W4-T6 must be marked IMPLEMENTED after product validation");

console.log("ENTERPRISE-10-10 W4-T1 prompt schema validation PASS");
