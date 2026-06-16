import { readFile } from "node:fs/promises";

const catalog = JSON.parse(
  await readFile(new URL("../config/agent-registry/capabilities.catalog.json", import.meta.url), "utf8")
);
const capabilitySchema = JSON.parse(
  await readFile(new URL("../config/agent-registry.capability.schema.json", import.meta.url), "utf8")
);
const storage = JSON.parse(
  await readFile(new URL("../registries/agents/registry.storage.json", import.meta.url), "utf8")
);
const agentSchema = JSON.parse(
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

function assertNoRequiresCycle(capabilities) {
  const byId = new Map(capabilities.map((capability) => [capability.id, capability]));
  const visiting = new Set();
  const visited = new Set();

  function visit(id, trail) {
    if (visited.has(id)) return;
    assert(!visiting.has(id), `requires graph contains a cycle: ${[...trail, id].join(" -> ")}`);
    visiting.add(id);
    for (const dependency of byId.get(id).dependencyModel.requires) {
      visit(dependency, [...trail, id]);
    }
    visiting.delete(id);
    visited.add(id);
  }

  for (const id of byId.keys()) visit(id, []);
}

assert(catalog.schemaVersion === "agent-capabilities-catalog.v1", "catalog schema version changed");
assert(catalog.roadmapTask === "W5-T3", "catalog must bind to W5-T3");
assert(catalog.capabilitySchema === "config/agent-registry.capability.schema.json", "capability schema path changed");
assert(catalog.capabilitySource.storageContract === "registries/agents/registry.storage.json", "storage contract binding changed");
assert(catalog.capabilitySource.runtimeBinding === "none", "W5-T3 must not create runtime binding");
assert(catalog.dependencyRules.requiresGraphMustBeAcyclic === true, "requires graph must remain acyclic");
assert(catalog.governance.validation === "scripts/validate-agent-registry-capabilities.mjs", "validation path changed");
for (const task of ["W5-T4", "W5-T5", "W5-T6"]) {
  assert(catalog.governance.doesNotClose.includes(task), `${task} must remain outside W5-T3 closure`);
}

assert(capabilitySchema.$id?.includes("agent-registry-capability.v1"), "capability schema id must identify v1");
assert(capabilitySchema.properties.governance.properties.roadmapTask.const === "W5-T3", "capability schema must bind to W5-T3");
assert(capabilitySchema.description.includes("does not implement capabilities"), "schema must keep implementation outside W5-T3");

const storageIds = new Set(storage.entries.map((entry) => entry.id));
assert(storage.roadmapTask === "W5-T2", "W5-T3 must build on W5-T2 storage");

const capabilities = catalog.capabilities;
assert(Array.isArray(capabilities) && capabilities.length >= 8, "catalog must contain the known baseline capabilities");
const capabilityIds = new Set();
for (const capability of capabilities) {
  validateValue(capabilitySchema, capability, `capability.${capability.id ?? "unknown"}`);
  assert(!capabilityIds.has(capability.id), `${capability.id} is duplicated`);
  capabilityIds.add(capability.id);
  assert(capability.lifecycleState === "cataloged", `${capability.id} must remain cataloged in W5-T3`);
  assert(capability.executionPolicy.implementationState === "not-implemented-by-W5-T3", `${capability.id} must not be implemented`);
  assert(capability.executionPolicy.runtimeActivation === "not-granted", `${capability.id} must not activate runtime`);
  assert(capability.executionPolicy.toolGrant === "none", `${capability.id} must not grant tools`);
  assert(capability.governance.doesNotClose.includes("W5-T4"), `${capability.id} must not close W5-T4`);
  assert(capability.governance.doesNotClose.includes("W5-T5"), `${capability.id} must not close W5-T5`);
  assert(capability.governance.doesNotClose.includes("W5-T6"), `${capability.id} must not close W5-T6`);

  for (const sourceEntry of capability.sourceAgentEntries) {
    assert(storageIds.has(sourceEntry), `${capability.id} references missing W5-T2 storage entry ${sourceEntry}`);
  }
}

for (const capability of capabilities) {
  for (const relationship of ["requires", "supports", "incompatibleWith"]) {
    for (const target of capability.dependencyModel[relationship]) {
      assert(capabilityIds.has(target), `${capability.id}.${relationship} references unknown capability ${target}`);
      assert(target !== capability.id, `${capability.id}.${relationship} must not self-reference`);
    }
  }
}
assertNoRequiresCycle(capabilities);

for (const declared of example.capabilities) {
  assert(capabilityIds.has(declared.id), `example capability ${declared.id} must exist in W5-T3 catalog`);
}
assert(agentSchema.properties.capabilities.description.includes("W5-T3"), "agent schema must acknowledge W5-T3 capability catalog");

assert(coverage.taskStates["W5-T1"] === "IMPLEMENTED", "W5-T1 must remain implemented");
assert(coverage.taskStates["W5-T2"] === "IMPLEMENTED", "W5-T2 must remain implemented");
assert(coverage.taskStates["W5-T3"] === "IMPLEMENTED", "W5-T3 must be marked IMPLEMENTED");
assert(coverage.taskStates["W5-T4"] === "IMPLEMENTED", "W5-T4 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W5-T5"] === "IMPLEMENTED", "W5-T5 must be marked IMPLEMENTED after product validation");
assert(coverage.taskStates["W5-T6"] === "READY_FOR_FUTURE_TASK", "W5-T6 must remain open after W5-T5");
for (const file of coverage.tasks["W5-T3"]) {
  await readFile(new URL(`../${file}`, import.meta.url), "utf8");
}

console.log("ENTERPRISE-10-10 W5-T3 agent registry capabilities validation PASS");
