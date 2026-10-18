#!/usr/bin/env node
// M3.1: PAR-INTEGRITY-IN-CI / P37, "check-integrity siempre activo en
// pr-gate". Runs the STATUS/git integrity check (runtime/status/
// integrity.mjs) against this repo's own live state on every CI run,
// read-only. Not having a STATUS.md at the repo root is a legitimate,
// documented state (NOT_APPLICABLE), not a warning: this repo does not
// yet maintain one. NOT_APPLICABLE is never this gate's own terminal
// exit status (PAR-RESULT-SEMANTICS / P3) -- it is normalized to PASS.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkIntegrity } from "./integrity.mjs";
import { buildReport, renderOutput, exitCodeForReport } from "../lib/json.mjs";
import { RESULT_STATUS } from "../lib/result.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

const json = process.argv.includes("--json");

const result = checkIntegrity(repoRoot);
const status = result.status === "NOT_APPLICABLE" ? RESULT_STATUS.PASS : result.status;

const report = buildReport({
  status,
  errors: result.errors,
  warnings: result.warnings,
  data: {
    statusFile: result.statusFile,
    deferred: result.deferred,
    branch: result.snapshot.branch,
    head: result.snapshot.head,
    observedCommit: result.snapshot.observedCommit,
  },
});

console.log(renderOutput(report, { json }));
process.exit(exitCodeForReport(report, { strict: true }));
