// Shared JSON/human output helper (M3.1, PAR-RESULT-SEMANTICS / P3 applied
// in practice). TEMPLATE v2.0.5's check-status.ps1 computes a real
// INCONSISTENTE/STALE/OK status, but its -Json branch only prints the JSON
// and falls through to an unconditional `exit 0` -- the exit code the
// human-readable branch computes (exit 1 on errors) never runs (B09). Any
// script that builds its own ad-hoc "if ($Json) {...} else {...}" branch
// risks repeating that bug. buildReport()/exitCodeForReport() make the
// exit code a pure function of `status`, independent of how the caller
// chooses to render it.
import { exitCodeFor, formatLine } from "./result.mjs";

export function buildReport({ status, errors = [], warnings = [], data = {} }) {
  return {
    status,
    summary: formatLine(status, { errors: errors.length, warnings: warnings.length }),
    errors,
    warnings,
    ...data,
  };
}

export function renderOutput(report, { json = false } = {}) {
  if (json) {
    return JSON.stringify(report, null, 2);
  }
  const lines = [report.summary];
  for (const warning of report.warnings) lines.push(`WARNING ${warning}`);
  for (const error of report.errors) lines.push(`ERROR ${error}`);
  return lines.join("\n");
}

/**
 * The exit code depends only on `report.status`, never on `json`/`strict`
 * being the thing that selects a different code path. Call this the same
 * way regardless of output format -- that identity is the point.
 */
export function exitCodeForReport(report, { strict = false } = {}) {
  return exitCodeFor(report.status, { strict });
}
