import { test } from "node:test";
import assert from "node:assert/strict";
import { isLockContention } from "./lock.mjs";

test("EEXIST is contention on every platform", () => {
  for (const p of ["win32", "linux", "darwin"]) assert.equal(isLockContention({ code: "EEXIST" }, p), true);
});

test("EPERM/EBUSY are contention only on Windows", () => {
  for (const code of ["EPERM", "EBUSY"]) {
    assert.equal(isLockContention({ code }, "win32"), true);
    assert.equal(isLockContention({ code }, "linux"), false);
  }
});

test("other errors are never contention", () => {
  for (const code of ["ENOENT", "EACCES", "ENOSPC", undefined]) assert.equal(isLockContention({ code }, "win32"), false);
  assert.equal(isLockContention(null, "win32"), false);
});
