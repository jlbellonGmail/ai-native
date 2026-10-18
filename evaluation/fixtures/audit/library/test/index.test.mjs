import test from "node:test";
import assert from "node:assert/strict";
import { slugify } from "../src/index.mjs";

test("basic text, accents and punctuation", () => {
  assert.equal(slugify("Hello, World!"), "hello-world");
  assert.equal(slugify("Crème Brûlée"), "creme-brulee");
  assert.equal(slugify("  --a--b--  "), "a-b");
});

test("custom separator and maxLength never leave a trailing separator", () => {
  assert.equal(slugify("a b c", { separator: "_" }), "a_b_c");
  assert.equal(slugify("one two three", { maxLength: 4 }), "one");
});

test("invalid input is rejected", () => {
  assert.throws(() => slugify(42), TypeError);
  assert.throws(() => slugify("a", { separator: "ab" }), RangeError);
  assert.equal(slugify(""), "");
});
