#!/usr/bin/env node
// M4.3 post-merge (PAR-POST-MERGE, PAR-HUMAN-MERGE; replaces v2.0.5
// post-merge-close-feature.yml). READ-ONLY by construction: it only reads the
// merged PR and the repository, and its verdict is the process exit code (a
// red run is the alert). It never pushes, tags, edits STATUS.md or comments;
// local cleanup stays a local, human-run step.
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { isBotLogin } from "./governance-modes.mjs";
import { loadGateConfig } from "./control-plane.mjs";

/** pr: { merged, mergedBy, mergeCommitSha, headSha, baseRef }; checkRuns for the merged head. */
export function evaluatePostMerge({ config, pr, checkRuns, mergeCommitOnMain }) {
  const findings = [];
  if (!pr.merged) return { ok: true, findings, title: "POST_MERGE_SKIP: PR closed without merge" };
  if (!pr.mergedBy) findings.push({ code: "MERGED_BY_UNKNOWN", detail: "merged_by missing" });
  else if (isBotLogin(pr.mergedBy, config.worker.botLogins)) findings.push({ code: "MERGED_BY_BOT", detail: `merged by bot/worker '${pr.mergedBy}' (human merge is the only HITL)` });
  else if (!config.governance.humanMergers.includes(pr.mergedBy)) findings.push({ code: "MERGED_BY_NOT_HUMAN_MAINTAINER", detail: `'${pr.mergedBy}' is not in governance.humanMergers` });
  if (!mergeCommitOnMain) findings.push({ code: "MERGE_COMMIT_NOT_ON_BASE", detail: `${pr.mergeCommitSha} is not reachable from ${pr.baseRef}` });
  const gate = checkRuns.find((c) => c.name === config.mergeGate.checkName && c.appSlug === config.trustGate.appSlug);
  if (!gate) findings.push({ code: "NO_MERGE_GATE_EVIDENCE", detail: `no '${config.mergeGate.checkName}' from '${config.trustGate.appSlug}' on merged head ${String(pr.headSha).slice(0, 7)}` });
  else if (gate.conclusion !== "success") findings.push({ code: "MERGE_GATE_NOT_GREEN", detail: `merge-gate concluded '${gate.conclusion}' at merge time` });
  return { ok: findings.length === 0, findings, title: findings.length ? `POST_MERGE_FAIL: ${findings.map((f) => f.code).join(", ")}` : "POST_MERGE_PASS" };
}

function gh(args) {
  const r = spawnSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`gh ${args.join(" ")}: ${r.stderr || r.stdout}`);
  return JSON.parse(r.stdout);
}

function main() {
  const { PR_NUMBER: number, GITHUB_REPOSITORY: repo } = process.env;
  if (!number || !repo) {
    console.error("post-merge: PR_NUMBER and GITHUB_REPOSITORY are required");
    process.exit(2);
  }
  const p = gh(["api", `repos/${repo}/pulls/${number}`]);
  const checks = gh(["api", "--paginate", "--slurp", `repos/${repo}/commits/${p.head.sha}/check-runs`]).flatMap((x) => x.check_runs);
  let onMain = false;
  if (p.merged) {
    const cmp = gh(["api", `repos/${repo}/compare/${p.merge_commit_sha}...${p.base.ref}`]);
    onMain = cmp.status === "ahead" || cmp.status === "identical";
  }
  const config = loadGateConfig(process.cwd(), "HEAD");
  const verdict = evaluatePostMerge({
    config,
    pr: { merged: p.merged, mergedBy: p.merged_by?.login, mergeCommitSha: p.merge_commit_sha, headSha: p.head.sha, baseRef: p.base.ref },
    checkRuns: checks.map((c) => ({ name: c.name, conclusion: c.conclusion, appSlug: c.app?.slug })),
    mergeCommitOnMain: onMain,
  });
  console.log(verdict.title);
  for (const f of verdict.findings) console.log(`- [${f.code}] ${f.detail}`);
  process.exit(verdict.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
