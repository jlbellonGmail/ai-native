#!/usr/bin/env node
// M4.3 (PAR-BRANCH-PROTECTION, CI-05; replaces the reactive guard-develop
// workflow with a native ruleset). governance/rulesets/main.json is the
// desired state; `@TRUST_APP_ID@` is resolved at apply time from the id of the
// App that really emitted `ai-native/trust-gate` (never from a guess), so the
// required checks are pinned to source = that App.
//   node runtime/gates/ruleset.mjs verify [--repo owner/name]
//   node runtime/gates/ruleset.mjs apply  [--repo owner/name] [--enforcement active|disabled]
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const GITHUB_ACTIONS_APP_ID = 15368;
const PLACEHOLDER = "@TRUST_APP_ID@";

export function resolveRuleset(template, trustAppId) {
  const text = JSON.stringify(template).split(JSON.stringify(PLACEHOLDER)).join(String(Number(trustAppId)));
  return JSON.parse(text);
}

function requiredChecks(ruleset) {
  const rule = ruleset.rules?.find((r) => r.type === "required_status_checks");
  return rule?.parameters?.required_status_checks ?? [];
}

/** Findings for a live ruleset that deviates from the desired one. */
export function verifyRuleset(live, desired, config) {
  const findings = [];
  if (!live) return [{ code: "RULESET_MISSING", detail: `ruleset '${desired.name}' not found` }];
  if (live.enforcement !== "active") findings.push({ code: "NOT_ACTIVE", detail: `enforcement=${live.enforcement}` });
  if ((live.bypass_actors ?? []).length) findings.push({ code: "BYPASS_ACTORS", detail: `${live.bypass_actors.length} bypass actor(s); policy is none` });
  if (!live.conditions?.ref_name?.include?.includes("~DEFAULT_BRANCH")) findings.push({ code: "NOT_DEFAULT_BRANCH", detail: "ruleset does not target ~DEFAULT_BRANCH" });
  for (const t of ["deletion", "non_fast_forward", "pull_request"]) {
    if (!live.rules?.some((r) => r.type === t)) findings.push({ code: "RULE_MISSING", detail: `rule '${t}' missing` });
  }
  const liveChecks = requiredChecks(live);
  for (const want of requiredChecks(desired)) {
    const got = liveChecks.find((c) => c.context === want.context);
    if (!got) findings.push({ code: "CHECK_NOT_REQUIRED", detail: `'${want.context}' is not a required check` });
    else if (want.integration_id !== undefined && got.integration_id !== want.integration_id) findings.push({ code: "CHECK_SOURCE", detail: `'${want.context}' source is ${got.integration_id}, expected app ${want.integration_id}` });
  }
  for (const name of config.reservedCheckNames) {
    const got = liveChecks.find((c) => c.context === name);
    if (got && (got.integration_id === undefined || got.integration_id === GITHUB_ACTIONS_APP_ID)) findings.push({ code: "RESERVED_CHECK_ANY_SOURCE", detail: `reserved check '${name}' is not pinned to the trust App` });
  }
  return findings;
}

function gh(args, input) {
  const r = spawnSync("gh", args, { input, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`gh ${args.join(" ")}: ${r.stderr || r.stdout}`);
  return r.stdout ? JSON.parse(r.stdout) : null;
}

function trustAppIdFromChecks(repo, config) {
  const main = gh(["api", `repos/${repo}/commits/main/check-runs?check_name=${encodeURIComponent(config.trustGate.checkName)}`]);
  const prs = gh(["api", `repos/${repo}/pulls?state=all&per_page=5`]);
  for (const p of prs) {
    const cr = gh(["api", `repos/${repo}/commits/${p.head.sha}/check-runs?check_name=${encodeURIComponent(config.trustGate.checkName)}`]);
    const hit = cr.check_runs.find((c) => c.app?.slug === config.trustGate.appSlug);
    if (hit) return hit.app.id;
  }
  throw new Error(`no '${config.trustGate.checkName}' check from '${config.trustGate.appSlug}' found on recent PRs; cannot resolve the App id`);
}

function main() {
  const [cmd] = process.argv.slice(2);
  const argv = process.argv.slice(2);
  const opt = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
  const repo = opt("--repo", "jlbellonGmail/ai-native");
  const config = JSON.parse(readFileSync("governance/gates/gates.json", "utf8"));
  const template = JSON.parse(readFileSync("governance/rulesets/main.json", "utf8"));
  const appId = opt("--trust-app-id", null) ?? trustAppIdFromChecks(repo, config);
  const desired = resolveRuleset(template, appId);
  const list = gh(["api", `repos/${repo}/rulesets`]);
  const existing = list.find((r) => r.name === desired.name);
  if (cmd === "apply") {
    desired.enforcement = opt("--enforcement", desired.enforcement);
    const out = existing
      ? gh(["api", `repos/${repo}/rulesets/${existing.id}`, "--method", "PUT", "--input", "-"], JSON.stringify(desired))
      : gh(["api", `repos/${repo}/rulesets`, "--method", "POST", "--input", "-"], JSON.stringify(desired));
    console.log(`ruleset ${out.id} '${out.name}' enforcement=${out.enforcement} trustAppId=${appId}`);
    return;
  }
  const live = existing ? gh(["api", `repos/${repo}/rulesets/${existing.id}`]) : null;
  const findings = verifyRuleset(live, desired, config);
  console.log(findings.length ? `RULESET_FAIL: ${findings.map((f) => f.code).join(", ")}` : `RULESET_PASS: '${desired.name}' active, no bypass, checks pinned to apps (trust app id ${appId})`);
  for (const f of findings) console.log(`- [${f.code}] ${f.detail}`);
  process.exit(findings.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
