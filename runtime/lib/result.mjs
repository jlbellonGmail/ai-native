// Common result-status semantics for every gate and validator in ai-native.
//
// Origin: Contrato de Paridad TEMPLATE v2.0.5 -> AI-NATIVE v3, condition
// PAR-RESULT-SEMANTICS / P3. TEMPLATE v2.0.5's check-status.ps1 prints the
// literal string "PASS ... (warnings regenerables)" and exits 0 even when
// there are warnings (B08), and its -Json mode always exits 0 regardless of
// status (B09). check-integrity.ps1 has the same "stale STATUS only warns,
// still prints PASS" pattern (B10). This module exists so no script can
// reproduce that pattern: NOT_RUN and NOT_APPLICABLE cannot be used as a
// gate's own exit status, and PASS_WITH_WARNINGS never renders as bare
// "PASS".
//
// See governance/adr/ADR-002-contrato-paridad-template-v205.md and
// runtime/lib/result.conformance.json (corpus shared with the pwsh
// reference implementation, runtime/lib/result.ps1, since M3.1).

export const RESULT_STATUS = Object.freeze({
  PASS: "PASS",
  PASS_WITH_WARNINGS: "PASS_WITH_WARNINGS",
  FAIL: "FAIL",
  ERROR: "ERROR",
  // Valid only inside reports (audit-report, eval-result, etc). Never a
  // gate's own terminal status.
  NOT_RUN: "NOT_RUN",
  NOT_APPLICABLE: "NOT_APPLICABLE",
});

const VALID_STATUSES = new Set(Object.values(RESULT_STATUS));
const REPORT_ONLY_STATUSES = new Set([RESULT_STATUS.NOT_RUN, RESULT_STATUS.NOT_APPLICABLE]);

export function assertValidStatus(status) {
  if (!VALID_STATUSES.has(status)) {
    throw new Error(`invalid result status: ${status}`);
  }
}

/**
 * Exit code semantics:
 *   PASS                     -> 0
 *   PASS_WITH_WARNINGS       -> 0, or 1 when strict=true (CI runs strict)
 *   FAIL                     -> 1
 *   ERROR                    -> 2 (an execution/technical error; a gate
 *                                  must treat it the same as FAIL)
 *   NOT_RUN / NOT_APPLICABLE -> throws; these are report-only statuses
 *
 * There is deliberately no output-format parameter (no --json branch):
 * the exit code must not depend on how the result is rendered.
 */
export function exitCodeFor(status, { strict = false } = {}) {
  assertValidStatus(status);
  if (REPORT_ONLY_STATUSES.has(status)) {
    throw new Error(`${status} must not be used as a gate's own exit status`);
  }
  switch (status) {
    case RESULT_STATUS.PASS:
      return 0;
    case RESULT_STATUS.PASS_WITH_WARNINGS:
      return strict ? 1 : 0;
    case RESULT_STATUS.FAIL:
      return 1;
    case RESULT_STATUS.ERROR:
      return 2;
    /* c8 ignore next 2 */
    default:
      throw new Error(`unhandled status: ${status}`);
  }
}

/** Derives a status deterministically from error/warning counts. */
export function statusFromCounts({ errors = 0, warnings = 0 } = {}) {
  if (errors > 0) return RESULT_STATUS.FAIL;
  if (warnings > 0) return RESULT_STATUS.PASS_WITH_WARNINGS;
  return RESULT_STATUS.PASS;
}

/**
 * Renders a one-line, human-readable label. The literal string "PASS" is
 * only ever returned for RESULT_STATUS.PASS itself (0 warnings, 0 errors) —
 * this is the direct regression guard for B08.
 */
export function formatLine(status, { warnings = 0, errors = 0 } = {}) {
  assertValidStatus(status);
  if (status === RESULT_STATUS.PASS_WITH_WARNINGS && warnings === 0) {
    throw new Error("PASS_WITH_WARNINGS requires at least one warning");
  }
  if ((status === RESULT_STATUS.FAIL) && errors === 0) {
    throw new Error("FAIL requires at least one error");
  }
  if (status === RESULT_STATUS.PASS_WITH_WARNINGS) {
    return `PASS_WITH_WARNINGS (${warnings} warning${warnings === 1 ? "" : "s"})`;
  }
  if (status === RESULT_STATUS.FAIL) {
    return `FAIL (${errors} error${errors === 1 ? "" : "s"})`;
  }
  return status;
}
