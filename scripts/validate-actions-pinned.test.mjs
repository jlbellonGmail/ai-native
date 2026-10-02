import test from "node:test";
import assert from "node:assert/strict";
import { findUnpinned } from "./validate-actions-pinned.mjs";

const SHA = "11bd71901bbe5b1630ceea73d27597364c9af683";

test("accepts full-SHA pins with a trailing version comment", () => {
  assert.deepEqual(findUnpinned(`      - uses: actions/checkout@${SHA} # v4.2.2`), []);
});

test("rejects tag, branch and short-SHA references", () => {
  for (const ref of ["actions/checkout@v4", "actions/checkout@main", "actions/checkout@11bd719", "actions/checkout"]) {
    assert.equal(findUnpinned(`        uses: ${ref}`).length, 1, ref);
  }
});

test("rejects a 40-char ref that is not hex", () => {
  assert.equal(findUnpinned(`uses: a/b@${"g".repeat(40)}`).length, 1);
});

test("exempts local actions, requires digest for docker", () => {
  assert.deepEqual(findUnpinned("uses: ./.github/actions/x"), []);
  assert.equal(findUnpinned("uses: docker://alpine:3").length, 1);
  assert.deepEqual(findUnpinned(`uses: docker://alpine@sha256:${"a".repeat(64)}`), []);
});

test("reports line numbers and ignores non-uses text", () => {
  const r = findUnpinned(`name: x\nsteps:\n  - uses: a/b@v1\n  - run: echo "uses: c/d@v1"`);
  assert.deepEqual(r, [{ line: 3, ref: "a/b@v1" }]);
});
