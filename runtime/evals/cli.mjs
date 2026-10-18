#!/usr/bin/env node
// M4.6 CLI: node runtime/evals/cli.mjs l1 [--suite <file>] [--out <file>] [--json]
// Runs the deterministic L1 suite against the CURRENT checkout (HEAD commit).
// L2 has no CLI: it needs a real agent, injected via runL2() by whoever has one.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadSuite, runL1, writeResult, DEFAULT_SUITE } from "./harness.mjs";
import { headSha } from "../lib/git.mjs";
import { buildReport, renderOutput, exitCodeForReport } from "../lib/json.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const command = argv.shift();
const value = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);

let report;
try {
  if (command !== "l1") throw new Error(`unknown command: ${command ?? "(none)"} (only "l1" is available)`);
  const { scenarios, result } = runL1({ suite: loadSuite(value("--suite") ? resolve(value("--suite")) : DEFAULT_SUITE), commit: headSha(repoRoot) });
  if (value("--out")) writeResult(resolve(value("--out")), result);
  const failed = scenarios.filter((s) => !s.passed);
  report = buildReport({ status: result.status, errors: failed.map((s) => `${s.id}: ${s.failures.join("; ")}`), data: { score: result.metrics.score, scenarios: scenarios.length, datasetDigest: result.datasetDigest } });
} catch (error) {
  report = buildReport({ status: "ERROR", errors: [error.message] });
}
console.log(renderOutput(report, { json: argv.includes("--json") }));
process.exit(exitCodeForReport(report, { strict: false }));
