#!/usr/bin/env node
// M4.3 pr-gate (PAR-PR-GATE, CI-01/CI-02, PAR-SUPPLY-CHAIN, PAR-PROPORTIONAL-GATES).
// Read-only aggregate of the local, deterministic gates. It does NOT replace
// the trust-gate: the trust-gate judges the PR from base and is emitted by the
// App; this gate runs the repo's own checks on the checked-out PR.
//   --base <sha>   compare against this base (default origin/main) for docs/P45 gates
//   --json         machine-readable report
// NOT_APPLICABLE (e.g. no product tests configured) is reported as such and
// never as a silent pass (PAR-RESULT-SEMANTICS).
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { statusFromCounts, exitCodeFor, formatLine } from "../lib/result.mjs";
import { checkWorkflows, scanSecrets } from "./supply-chain.mjs";
import { checkProportionality } from "./proportional.mjs";
import { checkIdentities } from "./agent-identity.mjs";
import { evaluateDocsGate } from "./docs-gate.mjs";
import { checkReviewIndependence } from "./reviewer-independence.mjs";
import { changedFiles, readFromCommit } from "./control-plane.mjs";

function readJson(root, rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

function workflowsOnDisk(root) {
  const dir = join(root, ".github", "workflows");
  const out = {};
  for (const n of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort()) out[`.github/workflows/${n}`] = readFileSync(join(dir, n), "utf8");
  return out;
}

export function runPrGate({ root, base = null, head = "HEAD" }) {
  const config = readJson(root, "governance/gates/gates.json");
  const findings = [];
  const add = (gate, list) => list.forEach((f) => findings.push({ gate, ...f }));

  add("supply-chain", checkWorkflows(workflowsOnDisk(root)));
  add("proportional-gates", checkProportionality(config, readJson(root, "contracts/sdd-levels.json")));
  add("agent-identity", checkIdentities(config, readJson(root, "core/security-policy.json")));

  let docs = { ok: true, relevant: [] };
  if (base) {
    const changed = changedFiles(root, base, head);
    docs = evaluateDocsGate(changed, config.docGate);
    add("docs-gate", docs.findings);
    add("reviewer-independence", checkReviewIndependence(changed, (p) => readFromCommit(root, base, p), (p) => readFromCommit(root, head, p)));
    for (const p of changed) {
      if (!existsSync(join(root, p))) continue;
      const text = readFileSync(join(root, p), "utf8");
      if (text.length < 2_000_000) add("security-scan", scanSecrets(p, text));
    }
  }
  const errors = findings.length;
  return { status: statusFromCounts({ errors, warnings: 0 }), findings, productTests: "NOT_APPLICABLE" };
}

function main() {
  const argv = process.argv.slice(2);
  const base = argv.includes("--base") ? argv[argv.indexOf("--base") + 1] : null;
  const root = process.cwd();
  const report = runPrGate({ root, base });
  if (argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else {
    for (const f of report.findings) console.log(`[${f.gate}/${f.code}] ${f.path ?? ""} ${f.detail}`.trim());
    console.log(`product tests: ${report.productTests} (no productTestCommand in the lock)`);
    console.log(formatLine(report.status, { errors: report.findings.length, warnings: 0 }));
  }
  process.exit(exitCodeFor(report.status));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
