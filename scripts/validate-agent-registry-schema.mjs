import { readFile } from "node:fs/promises";

const schema = JSON.parse(
  await readFile(new URL("../config/agent-registry.schema.json", import.meta.url), "utf8")
);
const example = JSON.parse(
  await readFile(new URL("../examples/agent-registry-entry.valid.json", import.meta.url), "utf8")
);
const coverage = JSON.parse(
  await readFile(new URL("../validation/roadmap-coverage.json", import.meta.url), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
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
    assert(value.length >= (definition.minItems ?? 0), `${path} has too few items`);
    if (definition.uniqueItems) {
      assert(new Set(value).size === value.length, `${path} must contain unique values`);
    }
    for (const [index, item] of value.entries()) {
      validateValue(definition.items, item, `${path}[${index}]`);
    }
  }
}

assert(schema.$schema?.includes("json-schema.org"), "schema must declare JSON Schema draft");
assert(schema.$id?.includes("agent-registry-entry.v1"), "schema id must identify agent registry v1");
assert(schema.title === "Agent Registry Entry", "schema title must be Agent Registry Entry");
assert(schema.type === "object", "schema root must be an object");
assert(schema.additionalProperties === false, "schema must reject unknown root properties");
assert(schema.properties.governance.properties.roadmapTask.const === "W5-T1", "schema governance must bind to W5-T1");
assert(schema.description?.includes("does not create registry storage"), "schema must keep W5-T2 outside W5-T1");
assert(schema.properties.version.description?.includes("not the repository VERSION"), "version field must distinguish agent version from repository VERSION");

for (const field of [
  "schemaVersion",
  "id",
  "owner",
  "purpose",
  "version",
  "status",
  "capabilities",
  "tools",
  "evaluationSuite",
  "runtimeControls",
  "governance"
]) {
  assert(schema.required.includes(field), `schema must require ${field}`);
}

validateValue(schema, example, "example");

assert(example.governance.doesNotClose.includes("W5-T2"), "W5-T2 must remain outside W5-T1 closure");
assert(example.runtimeControls.toolUse === "declared-only", "W5-T1 must not grant runtime orchestration");
assert(example.evaluationSuite.requiredBeforeActivation === true, "agent evaluation must be required before activation");

assert(coverage.taskStates["W4-T6"] === "IMPLEMENTED", "W4 must remain complete before W5-T1");
assert(coverage.taskStates["W5-T1"] === "IMPLEMENTED", "W5-T1 must be marked IMPLEMENTED");
assert(coverage.taskStates["W5-T2"] === "IMPLEMENTED", "W5-T2 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W5-T3"] === "IMPLEMENTED", "W5-T3 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W5-T4"] === "IMPLEMENTED", "W5-T4 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W5-T5"] === "IMPLEMENTED", "W5-T5 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W5-T6"] === "READY_FOR_FUTURE_TASK", "W5-T6 must remain open after W5-T5");

for (const file of coverage.tasks["W5-T1"]) {
  await readFile(new URL(`../${file}`, import.meta.url), "utf8");
}

console.log("ENTERPRISE-10-10 W5-T1 agent registry schema validation PASS");
