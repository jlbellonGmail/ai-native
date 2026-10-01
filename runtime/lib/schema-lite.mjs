// Dependency-free structural JSON Schema checker, shared by every validator
// in this repo that needs to check data against a contracts/*.schema.json
// (no ajv, consistent with ci.yml's "no install step").
//
// Supports the JSON Schema 2020-12 subset these contracts actually use:
// type, required, properties, additionalProperties (boolean only), items,
// enum, const, pattern, minimum/maximum, minItems, allOf/if-then, and local
// $ref (#/...) resolved against the same document. A $ref to another file
// is NOT resolved and is accepted as-is (documented limitation). Not a
// general-purpose JSON Schema implementation.
//
// Extracted from contracts/validate-contracts.mjs (M2.1) so core/ (M2.2)
// can validate profiles/*.json against contracts/profile.schema.json
// without duplicating this logic.

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

export function checkNode(value, schema, path, errs, root = schema) {
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

export function validate(data, schema) {
  const errs = [];
  checkNode(data, schema, "$", errs);
  return errs;
}
