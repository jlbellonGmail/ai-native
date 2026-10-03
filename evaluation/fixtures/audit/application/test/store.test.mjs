import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/store.mjs";

test("create trims the title and assigns increasing ids", () => {
  const s = createStore();
  assert.deepEqual(s.create({ title: "  a  " }), { id: 1, title: "a", body: "" });
  assert.equal(s.create({ title: "b" }).id, 2);
});

test("create rejects an empty, missing or oversized title and an oversized body", () => {
  const s = createStore();
  assert.throws(() => s.create({ title: "   " }), RangeError);
  assert.throws(() => s.create({}), RangeError);
  assert.throws(() => s.create({ title: "x".repeat(121) }), RangeError);
  assert.throws(() => s.create({ title: "ok", body: "y".repeat(10_001) }), RangeError);
});

test("get, list and remove", () => {
  const s = createStore();
  const n = s.create({ title: "a" });
  assert.equal(s.get(n.id).title, "a");
  assert.equal(s.get(99), null);
  assert.equal(s.list().length, 1);
  assert.equal(s.remove(n.id), true);
  assert.equal(s.remove(n.id), false);
});
