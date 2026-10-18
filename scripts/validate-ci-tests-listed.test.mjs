import { test } from "node:test";
import assert from "node:assert/strict";
import { ciTestArgs, unlistedTests } from "./validate-ci-tests-listed.mjs";

const wf = `
      - run: node --test runtime/lib/git.test.mjs
      - run: node --test runtime/circuit/*.test.mjs
      - run: echo node --version
`;

test("ciTestArgs collects the arguments of every node --test command", () => {
  assert.deepEqual(ciTestArgs(wf), ["runtime/lib/git.test.mjs", "runtime/circuit/*.test.mjs"]);
});

test("a test file matched by an explicit path or by a glob is listed", () => {
  const args = ciTestArgs(wf);
  assert.deepEqual(unlistedTests(["runtime/lib/git.test.mjs", "runtime/circuit/events.test.mjs"], args), []);
});

test("a test file no step runs is reported (a forgotten suite must fail loudly)", () => {
  const args = ciTestArgs(wf);
  assert.deepEqual(unlistedTests(["runtime/lib/lock.test.mjs", "runtime/observability/correlate.test.mjs"], args), [
    "runtime/lib/lock.test.mjs",
    "runtime/observability/correlate.test.mjs",
  ]);
});

test("a glob does not cross directories, and fixture projects are excluded", () => {
  const args = ciTestArgs(wf);
  assert.deepEqual(unlistedTests(["runtime/circuit/sub/deep.test.mjs", "evaluation/fixtures/audit/library/test/x.test.mjs"], args), [
    "runtime/circuit/sub/deep.test.mjs",
  ]);
});
