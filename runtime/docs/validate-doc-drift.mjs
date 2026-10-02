#!/usr/bin/env node
// M3.5: PAR-DOC-DRIFT / PAR-CANONICAL-SOURCE, always active in CI. Runs
// doc-drift.mjs read-only against this repo's own authoritative docs.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkDocDrift, checkCanonicalSource } from "./doc-drift.mjs";
import { buildReport, renderOutput, exitCodeForReport } from "../lib/json.mjs";
import { statusFromCounts } from "../lib/result.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

const json = process.argv.includes("--json");

const drift = checkDocDrift(repoRoot);
const canonical = checkCanonicalSource(repoRoot);
const errors = [...drift.errors, ...canonical.errors];
const report = buildReport({
  status: statusFromCounts({ errors: errors.length, warnings: 0 }),
  errors,
  warnings: [],
  data: { docsChecked: drift.docsChecked },
});

console.log(renderOutput(report, { json }));
process.exit(exitCodeForReport(report, { strict: true }));
