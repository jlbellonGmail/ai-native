import { test } from "node:test";
import assert from "node:assert/strict";
import { validate } from "./schema-lite.mjs";

test("required, type and enum violations are reported", () => {
  const schema = {
    type: "object",
    required: ["id", "level"],
    properties: {
      id: { type: "string" },
      level: { type: "string", enum: ["LIGHT", "STANDARD", "FULL"] },
    },
  };
  const errs = validate({ level: "MEDIUM" }, schema);
  assert.ok(errs.some((e) => e.includes('missing required property "id"')));
  assert.ok(errs.some((e) => e.includes("not in enum")));
});

test("a well-formed document produces zero errors", () => {
  const schema = {
    type: "object",
    required: ["id"],
    properties: { id: { type: "string" } },
  };
  assert.deepEqual(validate({ id: "ok" }, schema), []);
});

test("local $ref (#/...) is resolved against the same document", () => {
  const schema = {
    type: "object",
    required: ["a", "b"],
    properties: {
      a: { $ref: "#/$defs/item" },
      b: { $ref: "#/$defs/item" },
    },
    $defs: {
      item: { type: "integer", enum: [2, 4, 6] },
    },
  };
  const errs = validate({ a: 2, b: "two" }, schema);
  assert.ok(errs.length > 0);
  assert.ok(errs.every((e) => e.startsWith("$.b")));
});

test("an external $ref (to another file) is accepted as-is, not resolved", () => {
  const schema = {
    type: "object",
    properties: { status: { $ref: "result-status.schema.json#/properties/status" } },
  };
  // Any value passes: the external ref is a documented, deliberate limitation.
  assert.deepEqual(validate({ status: "NOT_A_REAL_STATUS" }, schema), []);
});

test("additionalProperties: false rejects unknown keys", () => {
  const schema = {
    type: "object",
    properties: { a: { type: "string" } },
    additionalProperties: false,
  };
  const errs = validate({ a: "x", b: "unexpected" }, schema);
  assert.ok(errs.some((e) => e.includes('unexpected property "b"')));
});
