import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readTextIfExists, readLinesIfExists } from "./fs-safe.mjs";

function dir() {
  const d = mkdtempSync(join(tmpdir(), "ai-native-fssafe-test-"));
  return { d, cleanup: () => rmSync(d, { recursive: true, force: true }) };
}

test("readTextIfExists returns the text, or null only for a missing file", () => {
  const { d, cleanup } = dir();
  try {
    writeFileSync(join(d, "a.txt"), "hola");
    assert.equal(readTextIfExists(join(d, "a.txt")), "hola");
    assert.equal(readTextIfExists(join(d, "absent.txt")), null);
  } finally {
    cleanup();
  }
});

test("readTextIfExists propagates every error that is not ENOENT (a directory is not 'absent')", () => {
  const { d, cleanup } = dir();
  try {
    mkdirSync(join(d, "sub"));
    assert.throws(() => readTextIfExists(join(d, "sub")), (e) => e.code === "EISDIR" || e.code === "EPERM");
  } finally {
    cleanup();
  }
});

test("readLinesIfExists drops empty lines and treats a missing file as empty", () => {
  const { d, cleanup } = dir();
  try {
    writeFileSync(join(d, "l.jsonl"), "a\n\nb\n");
    assert.deepEqual(readLinesIfExists(join(d, "l.jsonl")), ["a", "b"]);
    assert.deepEqual(readLinesIfExists(join(d, "absent")), []);
  } finally {
    cleanup();
  }
});
