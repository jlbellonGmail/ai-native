#!/usr/bin/env node
// M4.5 CLI. `check` validates the audit framework structure of this repo
// (always on in CI). `release-gate` is for release/milestone use only --
// never wire it as a merge gate (.audit isMergeGate is const false).
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { checkAuditFramework, evaluateReleaseGate } from "./framework.mjs";
import { buildReport, renderOutput, exitCodeForReport } from "../lib/json.mjs";
import { statusFromCounts } from "../lib/result.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const command = argv.shift() ?? "check";
const value = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const json = argv.includes("--json");

let report;
if (command === "check") {
  const { errors, profiles, auditMethod } = checkAuditFramework(repoRoot);
  report = buildReport({ status: statusFromCounts({ errors: errors.length, warnings: 0 }), errors, data: { auditMethod, profiles } });
} else if (command === "release-gate") {
  const root = resolve(value("--root") ?? process.cwd());
  const dir = resolve(value("--reports") ?? join(root, ".audit", "reports"));
  const reports = existsSync(dir)
    ? readdirSync(dir).filter((n) => n.endsWith(".md") && n !== "README.md").map((name) => ({ name, text: readFileSync(join(dir, name), "utf8") }))
    : [];
  const { profiles } = checkAuditFramework(repoRoot);
  const r = evaluateReleaseGate({ root, reports, candidate: value("--candidate"), profile: value("--profile"), minScore: Number(value("--min-score") ?? 90), tolerance: Number(value("--tolerance") ?? 2), profiles });
  const { status, errors, warnings, ...data } = r;
  report = buildReport({ status, errors, warnings, data });
} else {
  report = buildReport({ status: "ERROR", errors: [`unknown command: ${command}`] });
}
console.log(renderOutput(report, { json }));
process.exit(exitCodeForReport(report, { strict: false }));
