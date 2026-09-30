import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { exitCodeFor, statusFromCounts, formatLine, RESULT_STATUS } from "./result.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(readFileSync(join(here, "result.conformance.json"), "utf8"));

test("exitCodeFor matches the shared conformance corpus", () => {
  for (const c of corpus.exitCodeCases) {
    assert.equal(
      exitCodeFor(c.status, { strict: c.strict }),
      c.exitCode,
      `status=${c.status} strict=${c.strict}`,
    );
  }
});

test("NOT_RUN/NOT_APPLICABLE are rejected as a gate's own status (PAR-RESULT-SEMANTICS)", () => {
  for (const status of corpus.invalidGateStatuses) {
    assert.throws(() => exitCodeFor(status), /must not be used as a gate/);
  }
});

test("statusFromCounts matches the shared conformance corpus", () => {
  for (const c of corpus.statusFromCountsCases) {
    assert.equal(
      statusFromCounts({ errors: c.errors, warnings: c.warnings }),
      c.status,
      `errors=${c.errors} warnings=${c.warnings}`,
    );
  }
});

test("B08 regression: formatLine never prints bare PASS when warnings > 0", () => {
  const line = formatLine(RESULT_STATUS.PASS_WITH_WARNINGS, { warnings: 2 });
  assert.notEqual(line, "PASS");
  assert.match(line, /^PASS_WITH_WARNINGS/);
});

test("B09 regression: exitCodeFor has no output-format parameter, so strict mode cannot be silently bypassed", () => {
  assert.equal(exitCodeFor(RESULT_STATUS.PASS_WITH_WARNINGS, { strict: true }), 1);
  assert.equal(exitCodeFor.length, 1, "exitCodeFor takes (status, options) only, no format flag");
});

test("B10 regression: a stale/warning condition is never exit 0 under --strict", () => {
  const status = statusFromCounts({ errors: 0, warnings: 1 });
  assert.equal(status, RESULT_STATUS.PASS_WITH_WARNINGS);
  assert.equal(exitCodeFor(status, { strict: true }), 1);
});

test("assertValidStatus rejects unknown statuses", () => {
  assert.throws(() => exitCodeFor("PASS!!"), /invalid result status/);
});
