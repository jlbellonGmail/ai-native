#!/usr/bin/env node
// M4.3 merge-gate (PAR-MERGE-GATE-TRUST, PAR-HUMAN-MERGE, PAR-SINGLE-HITL).
// Decides, from BASE-trusted code and config, whether a PR head SHA is ready
// for THE single human decision (MERGE / NO MERGE). It never merges: the
// verdict is the check `ai-native/merge-gate` emitted by the `ai-native-trust`
// App on exactly that head SHA, so any later push invalidates it.
// A required check only counts if it was emitted by the expected app: a
// same-named check from another source (github-actions) is ignored (P44).
import { spawnSync } from "node:child_process";
import { appendFileSync, closeSync, constants, fstatSync, openSync, readFileSync } from "node:fs";
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

// ---- v4.1.0 acceptance governance (002 RF-25/RF-31/RF-35) --------------------------------------------------------
// The verdict is produced by the `acceptance-analyze` job of this workflow: BASE code, no secrets, no Environment,
// candidate read as Git objects, CI closure artifact verified against its producing run. This job (the existing
// trust-App holder) reads ONLY that schema-checked JSON: it never reads candidate data itself.
export const ACCEPTANCE_STATUSES = new Set(["PASS", "NEEDS_HUMAN", "FAIL", "BLOCKED"]);
export const HUMAN_ENVIRONMENT = "ai-native-human-review";

/** The Environment approval of THIS run, by a pinned human merger, as approval evidence (RF-35). */
export function approvalEvidence({ approvals = [], humanMergers = [], runId, headSha, findingsDigest, approvedAt = null }) {
  const a = (Array.isArray(approvals) ? approvals : []).find((x) => x?.state === "approved" && (x.environments ?? []).some((e) => e?.name === HUMAN_ENVIRONMENT));
  if (!a) return { ok: false, reason: `no approval of the Environment ${HUMAN_ENVIRONMENT} in run ${runId}` };
  const login = a.user?.login;
  if (!humanMergers.includes(login)) return { ok: false, reason: `approver '${login}' is not a pinned human merger of the trusted config` };
  return { ok: true, record: { runId: String(runId), environment: HUMAN_ENVIRONMENT, headSha, reviewer: { login, id: a.user?.id ?? null }, approvedAt, findingsDigest, comment: String(a.comment ?? "").slice(0, 200) } };
}

/**
 * @param verdict  parsed verdict JSON or null; @param approval result of approvalEvidence (finalize only)
 * @returns {{ findings, check: { pending, conclusion, title, summary } }}
 */
export function evaluateAcceptance(verdict, { headSha, humanReviewed = false, approval = null } = {}) {
  const blocked = (detail) => ({ findings: [{ code: "ACCEPTANCE_BLOCKED", detail }], check: { pending: false, conclusion: "failure", title: `ACCEPTANCE_BLOCKED: ${detail}`.slice(0, 250), summary: detail } });
  if (!verdict || typeof verdict !== "object" || Array.isArray(verdict) || verdict.schemaVersion !== 1) return blocked("no trusted acceptance verdict for this head SHA");
  if (verdict.headSha !== headSha) return blocked(`acceptance verdict is bound to ${String(verdict.headSha).slice(0, 12)}, not to the head ${String(headSha).slice(0, 12)}`);
  if (!ACCEPTANCE_STATUSES.has(verdict.status)) return blocked("acceptance verdict has an unknown status");
  const reasons = (Array.isArray(verdict.reasons) ? verdict.reasons : []).map(String).slice(0, 8);
  const kinds = (Array.isArray(verdict.findings) ? verdict.findings : []).map((f) => `${f?.kind}${f?.slug ? ` (${f.slug})` : ""}: ${f?.detail}`).slice(0, 20);
  const summary = (head) => [head, ...reasons.map((r) => `- ${r}`), ...(kinds.length ? ["", "Findings (human decision):", ...kinds.map((k) => `- ${k}`)] : []), "", `findings digest: ${verdict.digest ?? "none"}`].join("\n");
  if (verdict.status === "FAIL") return { findings: [{ code: "ACCEPTANCE_FAIL", detail: reasons[0] ?? "a mandatory acceptance case failed" }], check: { pending: false, conclusion: "failure", title: "ACCEPTANCE_FAIL", summary: summary("A mandatory acceptance case failed in the CI closure.") } };
  if (verdict.status === "BLOCKED") return { findings: [{ code: "ACCEPTANCE_BLOCKED", detail: reasons[0] ?? "acceptance is BLOCKED" }], check: { pending: false, conclusion: "failure", title: "ACCEPTANCE_BLOCKED", summary: summary("Acceptance cannot be closed for this head SHA.") } };
  if (verdict.status === "PASS") return { findings: [], check: { pending: false, conclusion: "success", title: "ACCEPTANCE_PASS", summary: summary("Every changed feature closed from the CI raw output; no governance finding.") } };
  // NEEDS_HUMAN: governance findings (contract created/changed, N/A, DOWNGRADE) wait for the human Environment
  if (!humanReviewed) return { findings: [{ code: "ACCEPTANCE_HUMAN_REVIEW", detail: `${kinds.length} acceptance governance finding(s) need the human Environment approval` }], check: { pending: true, conclusion: null, title: "ACCEPTANCE_NEEDS_HUMAN", summary: summary("Pending the human Environment approval for this head SHA.") } };
  if (!approval?.ok) return blocked(`human review reported but not verifiable: ${approval?.reason ?? "no approval evidence"}`);
  return { findings: [], check: { pending: false, conclusion: "success", title: `ACCEPTANCE_APPROVED by ${approval.record.reviewer.login}`, summary: `${summary("Approved by the human Environment gate for this exact head SHA.")}\n\napproval: ${JSON.stringify(approval.record)}` } };
}

export function evaluateMergeGate({ config, pr, reviews, checkRuns, humanReviewed = false, expectedHeadSha = null, acceptance }) {
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
  // acceptance governance is part of the merge decision when the trusted config requires it; no verdict is BLOCKED
  if (config.acceptanceGovernance?.required) {
    if (!acceptance) findings.push({ code: "ACCEPTANCE_BLOCKED", detail: "no trusted acceptance verdict for this head SHA" });
    else findings.push(...acceptance.findings);
  }
  const ok = findings.length === 0;
  // Only the human-review findings on their own can be unblocked by a human; anything else is a hard failure.
  const needsHuman = findings.length > 0 && findings.every((f) => f.code === "HUMAN_REVIEW_REQUIRED" || f.code === "ACCEPTANCE_HUMAN_REVIEW");
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
  let acceptance;
  if (config.acceptanceGovernance?.required) {
    const raw = readVerdict(process.env.ACCEPTANCE_VERDICT);
    let approval = null;
    if (humanReviewed && raw?.status === "NEEDS_HUMAN") {
      try {
        const runId = process.env.GITHUB_RUN_ID;
        const approvals = gh(["api", `repos/${repo}/actions/runs/${runId}/approvals`]);
        const jobs = gh(["api", `repos/${repo}/actions/runs/${runId}/jobs`]).jobs ?? [];
        const approvedAt = jobs.find((j) => j.name === "human-review")?.completed_at ?? null;
        approval = approvalEvidence({ approvals, humanMergers: config.governance.humanMergers ?? [], runId, headSha: data.pr.headSha, findingsDigest: raw.digest ?? null, approvedAt });
      } catch (e) { approval = { ok: false, reason: `approval could not be read: ${String(e.message).slice(0, 120)}` }; }
    }
    acceptance = evaluateAcceptance(raw, { headSha: data.pr.headSha, humanReviewed, approval });
  }
  const verdict = evaluateMergeGate({ config, ...data, humanReviewed, expectedHeadSha, acceptance });
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
  if (acceptance) {
    // the acceptance check is published by the same App on the same head SHA (visibility; merge already depends on it)
    const a = acceptance.check;
    const aBody = { ...(a.pending ? { status: "in_progress" } : { status: "completed", conclusion: a.conclusion }), output: { title: a.title.slice(0, 250), summary: a.summary.slice(0, 60000) } };
    const prior = process.env.ACCEPTANCE_CHECK_RUN_ID;
    const ar = prior && /^[0-9]+$/.test(prior)
      ? gh(["api", `repos/${repo}/check-runs/${prior}`, "--method", "PATCH", "--input", "-"], JSON.stringify(aBody), process.env.POST_TOKEN)
      : gh(["api", `repos/${repo}/check-runs`, "--method", "POST", "--input", "-"], JSON.stringify({ name: config.acceptanceGovernance.checkName, head_sha: verdict.verifiedSha, ...aBody }), process.env.POST_TOKEN);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `acceptance_check_run_id=${ar.id}
`);
    console.log(`acceptance check run ${ar.id}: ${a.title}`);
  }
}

/** The verdict file written by the acceptance-analyze job: bounded, regular file, never a symlink. */
export function readVerdict(file) {
  if (!file) return null;
  let fd;
  try { fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)); } catch { return null; }
  try {
    const st = fstatSync(fd);
    if (!st.isFile() || st.size > 1024 * 1024) return null;
    return JSON.parse(readFileSync(fd, "utf8"));
  } catch { return null; } finally { closeSync(fd); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
