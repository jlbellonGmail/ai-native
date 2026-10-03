#!/usr/bin/env node
// M4.3 trust-gate (P44). Runs from the BASE checkout under `pull_request_target`
// and judges the PR head as DATA. Verdict -> check run `ai-native/trust-gate`
// authored by the `ai-native-trust` App (a token other than GITHUB_TOKEN).
//   success : nothing suspicious, control plane untouched
//   neutral : control plane modified -> evaluated from base, human review mandatory
//   failure : spoofed reserved check name, trusted caller removed, config unreadable
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { classifyPaths, changedFiles, listFilesAtCommit, readFromCommit, loadGateConfig } from "./control-plane.mjs";
import { findSpoofedCheckNames, checkCallerIntegrity, HARD_FAIL_CODES } from "./trusted-caller.mjs";

export function evaluateTrustGate({ config, changed, baseWorkflows, headWorkflows }) {
  const caller = config.trustGate.callerWorkflow;
  const { controlPlane } = classifyPaths(changed, config.controlPlane);
  const findings = [
    ...checkCallerIntegrity(baseWorkflows[caller] ?? null, headWorkflows[caller] ?? null, caller),
    ...findSpoofedCheckNames(headWorkflows, config.reservedCheckNames, caller),
  ];
  const hard = findings.filter((f) => HARD_FAIL_CODES.has(f.code));
  if (hard.length) return { conclusion: "failure", title: `TRUST_GATE_FAIL: ${hard.map((f) => f.code).join(", ")}`, findings, controlPlane };
  if (controlPlane.length || findings.length) {
    return { conclusion: "neutral", title: `CONTROL_PLANE_CHANGED: ${controlPlane.length} file(s); human review mandatory`, findings, controlPlane };
  }
  return { conclusion: "success", title: "TRUST_GATE_PASS: control plane untouched", findings, controlPlane };
}

function workflowsAt(cwd, sha) {
  const out = {};
  for (const p of listFilesAtCommit(cwd, sha, ".github/workflows")) {
    const t = readFromCommit(cwd, sha, p);
    if (t !== null) out[p] = t;
  }
  return out;
}

export function summary(verdict) {
  const lines = [verdict.title, ""];
  if (verdict.controlPlane.length) lines.push("Control plane files changed:", ...verdict.controlPlane.map((p) => `- ${p}`), "");
  for (const f of verdict.findings) lines.push(`- [${f.code}] ${f.path}: ${f.detail}`);
  lines.push("", "Config and gate code were read from the BASE commit; the PR head was treated as data.");
  return lines.join("\n");
}

function postCheck({ repo, headSha, checkName, verdict }) {
  const body = { name: checkName, head_sha: headSha, status: "completed", conclusion: verdict.conclusion, output: { title: verdict.title.slice(0, 250), summary: summary(verdict) } };
  const r = spawnSync("gh", ["api", `repos/${repo}/check-runs`, "--method", "POST", "--input", "-"], { input: JSON.stringify(body), encoding: "utf8" });
  if (r.status !== 0) throw new Error(`could not create check run: ${r.stderr || r.stdout}`);
  const res = JSON.parse(r.stdout);
  return { id: res.id, appSlug: res.app?.slug, appId: res.app?.id };
}

function main() {
  const { BASE_SHA: base, HEAD_SHA: head, GITHUB_REPOSITORY: repo } = process.env;
  const dry = process.argv.includes("--dry-run");
  if (!base || !head || (!dry && !repo)) {
    console.error("trust-gate: BASE_SHA, HEAD_SHA and GITHUB_REPOSITORY are required");
    process.exit(2);
  }
  const cwd = process.cwd();
  let verdict;
  let config;
  try {
    config = loadGateConfig(cwd, base);
    verdict = evaluateTrustGate({ config, changed: changedFiles(cwd, base, head), baseWorkflows: workflowsAt(cwd, base), headWorkflows: workflowsAt(cwd, head) });
  } catch (e) {
    config = config ?? { trustGate: { checkName: "ai-native/trust-gate" } };
    verdict = { conclusion: "failure", title: `TRUST_GATE_ERROR: ${e.message}`.slice(0, 250), findings: [], controlPlane: [] };
  }
  console.log(summary(verdict));
  if (dry) return;
  const posted = postCheck({ repo, headSha: head, checkName: config.trustGate.checkName, verdict });
  console.log(`check run ${posted.id} emitted by app '${posted.appSlug}' (id ${posted.appId}): ${verdict.conclusion}`);
  if (config.trustGate.appSlug && posted.appSlug !== config.trustGate.appSlug) {
    console.error(`check was emitted by '${posted.appSlug}', expected '${config.trustGate.appSlug}'`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
