#!/usr/bin/env node
// M4.3 merge-gate (PAR-MERGE-GATE-TRUST, PAR-HUMAN-MERGE, PAR-SINGLE-HITL).
// Decides, from BASE-trusted code and config, whether a PR head SHA is ready
// for THE single human decision (MERGE / NO MERGE). It never merges: the
// verdict is the check `ai-native/merge-gate` emitted by the `ai-native-trust`
// App on exactly that head SHA, so any later push invalidates it.
// A required check only counts if it was emitted by the expected app: a
// same-named check from another source (github-actions) is ignored (P44).
import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { evaluateApprovals } from "./governance-modes.mjs";
import { loadGateConfig } from "./control-plane.mjs";

// `neutral` is NOT a pass (fail closed): GitHub branch protection treats it as success, so this gate is what blocks it.
// The only neutral that can ever be accepted is the trust-gate one on a control-plane change, and only after the workflow
// reports a human approval (Environment `ai-native-human-review`) for this exact run: HUMAN_REVIEWED=true.
const OK = new Set(["success", "skipped"]);

/** checkRuns: [{ name, status, conclusion, appSlug }] for the head SHA. */
export function evaluateRequiredChecks(requiredChecks, checkRuns, { humanReviewed = false, reviewableNeutral = [] } = {}) {
  const findings = [];
  for (const req of requiredChecks) {
    const same = checkRuns.filter((c) => c.name === req.name);
    const trusted = same.filter((c) => c.appSlug === req.appSlug);
    const forged = same.filter((c) => c.appSlug !== req.appSlug);
    for (const f of forged) findings.push({ code: "CHECK_WRONG_SOURCE", detail: `'${req.name}' emitted by '${f.appSlug}', ignored (expected '${req.appSlug}')` });
    if (!trusted.length) findings.push({ code: "CHECK_MISSING", detail: `'${req.name}' not emitted by '${req.appSlug}'` });
    else if (trusted.some((c) => c.status !== "completed")) findings.push({ code: "CHECK_PENDING", detail: `'${req.name}' not completed` });
    else if (!trusted.every((c) => OK.has(c.conclusion) || (humanReviewed && c.conclusion === "neutral" && reviewableNeutral.includes(req.name)))) {
      const neutralOnly = trusted.every((c) => OK.has(c.conclusion) || c.conclusion === "neutral") && reviewableNeutral.includes(req.name);
      if (neutralOnly) findings.push({ code: "HUMAN_REVIEW_REQUIRED", detail: `'${req.name}' is neutral (control plane changed): needs explicit human review` });
      else findings.push({ code: trusted.some((c) => c.conclusion === "neutral") ? "CHECK_NEUTRAL" : "CHECK_FAILED", detail: `'${req.name}' concluded '${trusted.map((c) => c.conclusion).join(",")}'` });
    }
  }
  return findings;
}

export function evaluateMergeGate({ config, pr, reviews, checkRuns, humanReviewed = false, expectedHeadSha = null }) {
  const findings = [];
  // A human approval belongs to the head the approver saw (the event head). If the PR moved since, it is void.
  if (humanReviewed && expectedHeadSha !== pr.headSha) {
    findings.push({ code: "HEAD_CHANGED", detail: `human review was for ${String(expectedHeadSha).slice(0, 7)}, PR head is ${pr.headSha.slice(0, 7)}` });
    humanReviewed = false;
  }
  if (pr.state !== "open") findings.push({ code: "PR_NOT_OPEN", detail: `state=${pr.state}` });
  if (pr.draft) findings.push({ code: "PR_DRAFT", detail: "draft PR" });
  findings.push(...evaluateRequiredChecks(config.requiredChecks, checkRuns, { humanReviewed, reviewableNeutral: [config.trustGate.checkName] }));
  const appr = evaluateApprovals({
    mode: config.governance.mode,
    reviews,
    prAuthor: pr.author,
    commitAuthors: pr.commitAuthors ?? [],
    headSha: pr.headSha,
    botLogins: config.worker.botLogins,
  });
  if (!appr.ok) findings.push({ code: "APPROVALS", detail: `mode=${config.governance.mode} requires ${appr.required}, valid ${appr.approvals.length}${appr.changesRequested ? ", changes requested" : ""}` });
  const ok = findings.length === 0;
  // Only the human-review finding on its own can be unblocked by a human; anything else is a hard failure.
  const needsHuman = findings.length > 0 && findings.every((f) => f.code === "HUMAN_REVIEW_REQUIRED");
  return {
    conclusion: ok ? "success" : "failure",
    needsHuman,
    title: ok ? `MERGE_GATE_PASS: head ${pr.headSha.slice(0, 7)} ready for human merge` : `MERGE_GATE_FAIL: ${[...new Set(findings.map((f) => f.code))].join(", ")}`,
    findings,
    approvals: appr,
    verifiedSha: pr.headSha,
  };
}

function gh(args, input, token) {
  const env = token ? { ...process.env, GH_TOKEN: token } : process.env;
  const r = spawnSync("gh", args, { input, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`gh ${args.join(" ")}: ${r.stderr || r.stdout}`);
  return r.stdout ? JSON.parse(r.stdout) : null;
}

function fetchPr(repo, number) {
  const pr = gh(["api", `repos/${repo}/pulls/${number}`]);
  const reviews = gh(["api", "--paginate", "--slurp", `repos/${repo}/pulls/${number}/reviews`]).flat();
  const commits = gh(["api", "--paginate", "--slurp", `repos/${repo}/pulls/${number}/commits`]).flat();
  const checks = gh(["api", "--paginate", "--slurp", `repos/${repo}/commits/${pr.head.sha}/check-runs`]).flatMap((p) => p.check_runs);
  return {
    pr: { state: pr.state, draft: pr.draft, author: pr.user.login, headSha: pr.head.sha, commitAuthors: [...new Set(commits.map((c) => c.author?.login).filter(Boolean))] },
    reviews: reviews.map((r) => ({ user: r.user.login, state: r.state, commitId: r.commit_id })),
    checkRuns: checks.map((c) => ({ name: c.name, status: c.status, conclusion: c.conclusion, appSlug: c.app?.slug })),
  };
}

function main() {
  const { BASE_SHA: base, PR_NUMBER: number, GITHUB_REPOSITORY: repo } = process.env;
  if (!base || !number || !repo) {
    console.error("merge-gate: BASE_SHA, PR_NUMBER and GITHUB_REPOSITORY are required");
    process.exit(2);
  }
  const config = loadGateConfig(process.cwd(), base);
  // Wait (bounded) for the required checks to finish so a single run decides;
  // the PR concurrency group cancels it on a new push (new head SHA).
  const deadline = Date.now() + Number(process.env.WAIT_SECONDS ?? 0) * 1000;
  let data = fetchPr(repo, number);
  while (Date.now() < deadline && evaluateMergeGate({ config, ...data }).findings.some((f) => f.code === "CHECK_PENDING" || f.code === "CHECK_MISSING")) {
    spawnSync(process.execPath, ["-e", "setTimeout(()=>{},20000)"]);
    data = fetchPr(repo, number);
  }
  // The merge-gate check itself is excluded from its own inputs by construction
  // (it is not in requiredChecks), so there is no circular dependency.
  const humanReviewed = process.env.HUMAN_REVIEWED === "true";
  const expectedHeadSha = process.env.EXPECTED_HEAD_SHA || null;
  // A stale run (re-run of an old approval, or a push after it) must not publish anything on the newer head.
  if (expectedHeadSha && expectedHeadSha !== data.pr.headSha) {
    console.log(`merge-gate: run is for ${expectedHeadSha.slice(0, 7)} but the PR head is ${data.pr.headSha.slice(0, 7)}; stale run, nothing published`);
    return;
  }
  const verdict = evaluateMergeGate({ config, ...data, humanReviewed, expectedHeadSha });
  console.log(verdict.title);
  for (const f of verdict.findings) console.log(`- [${f.code}] ${f.detail}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `needs_human=${verdict.needsHuman}
`);
  if (process.argv.includes("--dry-run")) return;
  // Awaiting the human: the check stays pending (never success) until the human-review job approves this run.
  const pending = verdict.needsHuman;
  const body = {
    name: config.mergeGate.checkName,
    head_sha: verdict.verifiedSha,
    ...(pending ? { status: "in_progress" } : { status: "completed", conclusion: verdict.conclusion }),
    output: { title: verdict.title.slice(0, 250), summary: `${verdict.title}\n\n${verdict.findings.map((f) => `- [${f.code}] ${f.detail}`).join("\n")}\n\nThis gate never merges. Merge stays the single human decision.` },
  };
  // The final verdict updates the pending run created while waiting for the human (one run per SHA, never a stale in_progress).
  const existing = process.env.CHECK_RUN_ID;
  const res = existing && /^[0-9]+$/.test(existing)
    ? gh(["api", `repos/${repo}/check-runs/${existing}`, "--method", "PATCH", "--input", "-"], JSON.stringify({ status: body.status, conclusion: body.conclusion, output: body.output }), process.env.POST_TOKEN)
    : gh(["api", `repos/${repo}/check-runs`, "--method", "POST", "--input", "-"], JSON.stringify(body), process.env.POST_TOKEN);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `check_run_id=${res.id}
`);
  console.log(`check run ${res.id} emitted by app '${res.app?.slug}'`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
