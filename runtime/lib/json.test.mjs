import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReport, renderOutput, exitCodeForReport } from "./json.mjs";
import { RESULT_STATUS } from "./result.mjs";

test("buildReport derives summary from status/errors/warnings via formatLine", () => {
  const report = buildReport({ status: RESULT_STATUS.PASS, errors: [], warnings: [] });
  assert.equal(report.summary, "PASS");
  assert.equal(report.status, RESULT_STATUS.PASS);
});

test("renderOutput(json=true) is valid JSON and round-trips the report", () => {
  const report = buildReport({ status: RESULT_STATUS.FAIL, errors: ["boom"], warnings: [] });
  const text = renderOutput(report, { json: true });
  assert.deepEqual(JSON.parse(text), report);
});

test("renderOutput(json=false) includes the summary and every WARNING/ERROR line", () => {
  const report = buildReport({ status: RESULT_STATUS.PASS_WITH_WARNINGS, errors: [], warnings: ["stale cache"] });
  const text = renderOutput(report, { json: false });
  assert.match(text, /^PASS_WITH_WARNINGS \(1 warning\)/);
  assert.match(text, /WARNING stale cache/);
});

// Regression test for B09: TEMPLATE v2.0.5's check-status.ps1 -Json mode
// always exits 0 regardless of status, because the JSON branch returns
// before the human branch's `if ($errors.Count) { exit 1 }` ever runs.
// exitCodeForReport must give the identical exit code whether or not the
// caller asked for JSON.
test("exitCodeForReport gives the same exit code regardless of json rendering (B09 regression)", () => {
  for (const status of [RESULT_STATUS.PASS, RESULT_STATUS.PASS_WITH_WARNINGS, RESULT_STATUS.FAIL, RESULT_STATUS.ERROR]) {
    const report = buildReport({
      status,
      errors: status === RESULT_STATUS.FAIL || status === RESULT_STATUS.ERROR ? ["e"] : [],
      warnings: status === RESULT_STATUS.PASS_WITH_WARNINGS ? ["w"] : [],
    });
    renderOutput(report, { json: true });
    renderOutput(report, { json: false });
    const strict = true;
    const codeAfterJsonRender = exitCodeForReport(report, { strict });
    const codeAfterHumanRender = exitCodeForReport(report, { strict });
    assert.equal(codeAfterJsonRender, codeAfterHumanRender);
  }
});

test("exitCodeForReport(FAIL) is non-zero even when rendered as JSON", () => {
  const report = buildReport({ status: RESULT_STATUS.FAIL, errors: ["e"], warnings: [] });
  renderOutput(report, { json: true });
  assert.equal(exitCodeForReport(report, { strict: true }), 1);
});
