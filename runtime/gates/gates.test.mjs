// M4.3: PAR-GOVERNANCE-MODES, PAR-MERGE-GATE-TRUST, PAR-POST-MERGE, PAR-PR-GATE,
// PAR-SUPPLY-CHAIN, PAR-PROPORTIONAL-GATES, PAR-AGENT-IDENTITY, PAR-BRANCH-PROTECTION,
// PAR-SINGLE-HITL, PAR-HUMAN-MERGE and P45 enforcement (reviewer-independence).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { requiredApprovals, evaluateApprovals } from "./governance-modes.mjs";
import { evaluateMergeGate, evaluateRequiredChecks } from "./merge-gate.mjs";
import { evaluatePostMerge } from "./post-merge.mjs";
import { checkWorkflow, checkWorkflows, scanSecrets } from "./supply-chain.mjs";
import { checkProportionality, gatesForLevel } from "./proportional.mjs";
import { checkIdentities, checkCommitIdentities } from "./agent-identity.mjs";
import { evaluateDocsGate } from "./docs-gate.mjs";
import { checkEventLog } from "./reviewer-independence.mjs";
import { resolveRuleset, verifyRuleset } from "./ruleset.mjs";
import { runPrGate } from "./pr-gate.mjs";

const read = (rel) => readFileSync(new URL(`../../${rel}`, import.meta.url), "utf8");
const config = JSON.parse(read("governance/gates/gates.json"));
const policy = JSON.parse(read("core/security-policy.json"));
const sdd = JSON.parse(read("contracts/sdd-levels.json"));
const HEAD = "a".repeat(40);

// ---------- PAR-GOVERNANCE-MODES + P45 (approval independence)
test("PAR-GOVERNANCE-MODES: SingleMaintainer needs 0 approvals, MultiMaintainer >= 1, unknown mode throws", () => {
  assert.equal(requiredApprovals("SingleMaintainer"), 0);
  assert.equal(requiredApprovals("MultiMaintainer"), 1);
  assert.throws(() => requiredApprovals("Whatever"));
  const none = { reviews: [], prAuthor: "dev", headSha: HEAD };
  assert.equal(evaluateApprovals({ mode: "SingleMaintainer", ...none }).ok, true);
  assert.equal(evaluateApprovals({ mode: "MultiMaintainer", ...none }).ok, false);
});

test("P45: author, commit-author, bot and stale approvals never count", () => {
  const reviews = [
    { user: "dev", state: "APPROVED", commitId: HEAD },
    { user: "pair", state: "APPROVED", commitId: HEAD },
    { user: "ai-native-worker[bot]", state: "APPROVED", commitId: HEAD },
    { user: "late", state: "APPROVED", commitId: "b".repeat(40) },
  ];
  const r = evaluateApprovals({ mode: "MultiMaintainer", reviews, prAuthor: "dev", commitAuthors: ["pair"], headSha: HEAD, botLogins: config.worker.botLogins });
  assert.deepEqual(r.approvals, []);
  assert.equal(r.rejected.length, 4);
  assert.equal(r.ok, false);
  const good = evaluateApprovals({ mode: "MultiMaintainer", reviews: [{ user: "other", state: "APPROVED", commitId: HEAD }], prAuthor: "dev", headSha: HEAD });
  assert.equal(good.ok, true);
});

test("P45: only the latest review per user counts; changes requested blocks", () => {
  const reviews = [
    { user: "r", state: "APPROVED", commitId: HEAD },
    { user: "r", state: "CHANGES_REQUESTED", commitId: HEAD },
  ];
  const r = evaluateApprovals({ mode: "MultiMaintainer", reviews, prAuthor: "dev", headSha: HEAD });
  assert.equal(r.ok, false);
  assert.equal(r.changesRequested, true);
});

// ---------- P45 enforcement on events.jsonl
const sha = (s) => `sha256:${createHash("sha256").update(s, "utf8").digest("hex")}`;
function log(events) {
  const lines = [];
  let prev = "genesis";
  for (const e of events) {
    const line = JSON.stringify({ schemaVersion: 1, unitId: "M9", timestamp: "2026-01-01T00:00:00.000Z", prevHash: prev, ...e });
    lines.push(line);
    prev = sha(line);
  }
  return lines.join("\n") + "\n";
}
const review = (over = {}) => ({ eventType: "review", stage: "code", verdict: "approve", reviewInvocationId: `review-${"1".repeat(32)}`, nonce: "n1", inputDigest: sha("x"), tool: "claude", toolSessionId: null, parentInvocationId: null, findings: [], ...over });

test("P45: well-formed append-only review log passes; appended event keeps base as prefix", () => {
  const base = log([review()]);
  const head = log([review(), review({ reviewInvocationId: `review-${"2".repeat(32)}`, nonce: "n2" })]);
  assert.deepEqual(checkEventLog("runs/M9/events.jsonl", base, head), []);
  assert.deepEqual(checkEventLog("runs/M9/events.jsonl", null, base), []);
});

test("P45 / PAR-REVIEW-TAMPER-EVIDENT: rewritten history, broken chain, forged ids and reused nonces are findings", () => {
  const base = log([review()]);
  const rewritten = log([review({ verdict: "reject" })]);
  assert.ok(checkEventLog("p", base, rewritten).some((f) => f.code === "HISTORY_REWRITTEN"));
  const broken = base.replace(/"prevHash":"genesis"/, `"prevHash":"sha256:${"0".repeat(64)}"`);
  assert.ok(checkEventLog("p", null, broken).some((f) => f.code === "CHAIN_BROKEN"));
  assert.ok(checkEventLog("p", null, log([review({ reviewInvocationId: "builder-session-1" })])).some((f) => f.code === "REVIEW_ID_INVALID"));
  assert.ok(checkEventLog("p", null, log([review(), review({ reviewInvocationId: `review-${"3".repeat(32)}` })])).some((f) => f.code === "REVIEW_NONCE"));
  assert.ok(checkEventLog("p", null, log([review({ toolSessionId: `review-${"1".repeat(32)}` })])).some((f) => f.code === "REVIEW_NOT_INDEPENDENT"));
});

// ---------- PAR-MERGE-GATE-TRUST (+ P44 source pinning)
const goodChecks = config.requiredChecks.map((c) => ({ name: c.name, status: "completed", conclusion: "success", appSlug: c.appSlug }));
const pr = { state: "open", draft: false, author: "dev", headSha: HEAD, commitAuthors: [] };

test("PAR-MERGE-GATE-TRUST: all required checks from the expected sources -> success on that exact SHA", () => {
  const v = evaluateMergeGate({ config, pr, reviews: [], checkRuns: goodChecks });
  assert.equal(v.conclusion, "success");
  assert.equal(v.verifiedSha, HEAD);
});

test("P44: a same-named trust-gate emitted by github-actions is ignored and fails the merge-gate", () => {
  const forged = goodChecks.map((c) => (c.name === "ai-native/trust-gate" ? { ...c, appSlug: "github-actions" } : c));
  const v = evaluateMergeGate({ config, pr, reviews: [], checkRuns: forged });
  assert.equal(v.conclusion, "failure");
  assert.ok(v.findings.some((f) => f.code === "CHECK_WRONG_SOURCE"));
  assert.ok(v.findings.some((f) => f.code === "CHECK_MISSING"));
});

test("PAR-MERGE-GATE-TRUST: pending, failed, draft and closed PRs are not mergeable", () => {
  const pend = goodChecks.map((c, i) => (i === 0 ? { ...c, status: "in_progress", conclusion: null } : c));
  assert.ok(evaluateRequiredChecks(config.requiredChecks, pend).some((f) => f.code === "CHECK_PENDING"));
  const failed = goodChecks.map((c, i) => (i === 1 ? { ...c, conclusion: "failure" } : c));
  assert.ok(evaluateMergeGate({ config, pr, reviews: [], checkRuns: failed }).findings.some((f) => f.code === "CHECK_FAILED"));
  assert.ok(evaluateMergeGate({ config, pr: { ...pr, draft: true }, reviews: [], checkRuns: goodChecks }).findings.some((f) => f.code === "PR_DRAFT"));
  assert.ok(evaluateMergeGate({ config, pr: { ...pr, state: "closed" }, reviews: [], checkRuns: goodChecks }).findings.some((f) => f.code === "PR_NOT_OPEN"));
});

test("PAR-SINGLE-HITL / PAR-HUMAN-MERGE: gates never merge; the merge-gate workflow has no merge capability", () => {
  for (const f of ["merge-gate.mjs", "post-merge.mjs", "trust-gate.mjs", "pr-gate.mjs"]) {
    const src = read(`runtime/gates/${f}`);
    assert.doesNotMatch(src, /pulls\/\$\{[^}]+\}\/merge|"pr", "merge"|gh pr merge|\/merge["'`]/, `${f} must not call a merge endpoint`);
  }
  for (const f of ["merge-gate.yml", "post-merge.yml", "trust-gate.yml", "pr-gate.yml"]) {
    const yml = read(`.github/workflows/${f}`);
    assert.doesNotMatch(yml, /contents:\s*write|pull-requests:\s*write/, `${f} must not hold write on contents/PRs`);
  }
  assert.equal(policy.matrix.builder.MERGE, "deny");
  assert.equal(policy.matrix.reviewer.MERGE, "deny");
  assert.equal(policy.matrix.human.MERGE, "allow");
});

// ---------- PAR-POST-MERGE (human merge, read-only)
const merged = { merged: true, mergedBy: "jlbellonGmail", mergeCommitSha: "c".repeat(40), headSha: HEAD, baseRef: "main" };
const gateRun = { name: "ai-native/merge-gate", conclusion: "success", appSlug: "ai-native-trust" };

test("PAR-HUMAN-MERGE / PAR-POST-MERGE: human merge with a green App merge-gate passes", () => {
  assert.equal(evaluatePostMerge({ config, pr: merged, checkRuns: [gateRun], mergeCommitOnMain: true }).ok, true);
});

test("PAR-HUMAN-MERGE: merge by a bot/worker or a non-maintainer, or without gate evidence, fails", () => {
  const byBot = evaluatePostMerge({ config, pr: { ...merged, mergedBy: "ai-native-worker[bot]" }, checkRuns: [gateRun], mergeCommitOnMain: true });
  assert.ok(byBot.findings.some((f) => f.code === "MERGED_BY_BOT"));
  const stranger = evaluatePostMerge({ config, pr: { ...merged, mergedBy: "someone" }, checkRuns: [gateRun], mergeCommitOnMain: true });
  assert.ok(stranger.findings.some((f) => f.code === "MERGED_BY_NOT_HUMAN_MAINTAINER"));
  const noEvidence = evaluatePostMerge({ config, pr: merged, checkRuns: [{ ...gateRun, appSlug: "github-actions" }], mergeCommitOnMain: true });
  assert.ok(noEvidence.findings.some((f) => f.code === "NO_MERGE_GATE_EVIDENCE"));
  assert.ok(evaluatePostMerge({ config, pr: merged, checkRuns: [gateRun], mergeCommitOnMain: false }).findings.some((f) => f.code === "MERGE_COMMIT_NOT_ON_BASE"));
  assert.equal(evaluatePostMerge({ config, pr: { ...merged, merged: false }, checkRuns: [], mergeCommitOnMain: false }).ok, true);
});

test("PAR-POST-MERGE: post-merge workflow and script are read-only", () => {
  const yml = read(".github/workflows/post-merge.yml");
  assert.match(yml, /permissions:\n  contents: read\n  pull-requests: read\n  checks: read/);
  assert.doesNotMatch(yml, /git push|gh release|git tag|gh pr comment|--method (POST|PUT|PATCH|DELETE)/);
  const src = read("runtime/gates/post-merge.mjs");
  assert.doesNotMatch(src, /--method|"push"|"tag"|writeFile/);
});

// ---------- PAR-SUPPLY-CHAIN
test("PAR-SUPPLY-CHAIN: permissions, SHA pinning, pull_request_target head checkout, pipe-to-shell", () => {
  const codes = (t) => checkWorkflow("w.yml", t).map((f) => f.code);
  assert.ok(codes("on: push\njobs: {}\n").includes("NO_PERMISSIONS"));
  assert.ok(codes("permissions: write-all\n").includes("WRITE_ALL"));
  assert.ok(codes("permissions:\n  contents: read\njobs:\n  a:\n    steps:\n      - uses: actions/checkout@v4\n").includes("UNPINNED_ACTION"));
  const prt = "on:\n  pull_request_target:\npermissions:\n  contents: read\njobs:\n  a:\n    steps:\n      - uses: actions/checkout@" + "a".repeat(40) + "\n        with:\n          ref: ${{ github.event.pull_request.head.sha }}\n";
  assert.ok(codes(prt).includes("PRT_CHECKOUT_HEAD"));
  assert.ok(codes("permissions:\n  contents: read\nrun: curl -s https://x | sh\n").includes("PIPE_TO_SHELL"));
});

test("PAR-SUPPLY-CHAIN: every real workflow in this repo satisfies the policy", () => {
  const wf = {};
  for (const n of readdirSync(new URL("../../.github/workflows/", import.meta.url)).filter((f) => /\.ya?ml$/.test(f))) wf[n] = read(`.github/workflows/${n}`);
  assert.deepEqual(checkWorkflows(wf), []);
});

test("PAR-SUPPLY-CHAIN: secret-shape scan", () => {
  assert.equal(scanSecrets("a", "token ghp_" + "a".repeat(36)).length, 1);
  assert.equal(scanSecrets("a", "-----BEGIN RSA " + "PRIVATE KEY-----").length, 1);
  assert.equal(scanSecrets("a", "nothing here").length, 0);
});

// ---------- PAR-PROPORTIONAL-GATES
test("PAR-PROPORTIONAL-GATES: gates grow with the level, baseline always present, consistent with sdd-levels.json", () => {
  assert.deepEqual(checkProportionality(config, sdd), []);
  assert.ok(gatesForLevel(config, "FULL").length > gatesForLevel(config, "LIGHT").length);
  assert.throws(() => gatesForLevel(config, "NOPE"));
  const broken = { gatesByLevel: { LIGHT: ["ci"], STANDARD: ["ci", "trust-gate", "pr-gate"], FULL: ["ci", "trust-gate", "pr-gate", "spec-review"] } };
  const codes = checkProportionality(broken, sdd).map((f) => f.code);
  assert.ok(codes.includes("BASELINE_MISSING"));
  assert.ok(codes.includes("REVIEW_GATE_MISSING"));
});

// ---------- PAR-AGENT-IDENTITY
test("PAR-AGENT-IDENTITY: separated identities with minimum permissions; builder has no MERGE/TAG/ADMIN", () => {
  assert.deepEqual(checkIdentities(config, policy), []);
  const same = { ...config, worker: { ...config.worker, appSlug: config.trustGate.appSlug } };
  assert.ok(checkIdentities(same, policy).some((f) => f.code === "IDENTITY_NOT_SEPARATED"));
  const powerful = { ...config, trustApp: { permissions: { ...config.trustApp.permissions, contents: "write" } } };
  assert.ok(checkIdentities(powerful, policy).some((f) => f.code === "TRUST_CAN_WRITE"));
  const admin = { ...config, worker: { ...config.worker, permissions: { ...config.worker.permissions, administration: "write" } } };
  assert.ok(checkIdentities(admin, policy).some((f) => f.code === "FORBIDDEN_PERMISSION"));
  const lax = { matrix: { builder: { MERGE: "allow", TAG: "deny", ADMIN: "deny" } } };
  assert.ok(checkIdentities(config, lax).some((f) => f.code === "BUILDER_CAPABILITY"));
  assert.equal(checkCommitIdentities(["jlbellonGmail", "ai-native-worker[bot]"], config).length, 0);
  assert.equal(checkCommitIdentities(["evil-app[bot]"], config)[0].code, "UNKNOWN_BOT_COMMITTER");
});

// ---------- docs gate
test("docs gate: behaviour-bearing change needs a documentation/governance change", () => {
  assert.equal(evaluateDocsGate(["runtime/x.mjs"], config.docGate).ok, false);
  assert.equal(evaluateDocsGate(["runtime/x.mjs", "governance/SESSION-CONTEXT.md"], config.docGate).ok, true);
  assert.equal(evaluateDocsGate(["notes.txt"], config.docGate).ok, true);
});

// ---------- PAR-BRANCH-PROTECTION
const template = JSON.parse(read("governance/rulesets/main.json"));
const desired = resolveRuleset(template, 4242);

test("PAR-BRANCH-PROTECTION: desired ruleset has no bypass, requires the App-sourced checks, and resolves the App id", () => {
  assert.deepEqual(desired.bypass_actors, []);
  const checks = desired.rules.find((r) => r.type === "required_status_checks").parameters.required_status_checks;
  assert.equal(checks.find((c) => c.context === "ai-native/trust-gate").integration_id, 4242);
  assert.equal(checks.find((c) => c.context === "ai-native/merge-gate").integration_id, 4242);
  assert.equal(JSON.stringify(desired).includes("@TRUST_APP_ID@"), false);
  assert.deepEqual(verifyRuleset(structuredClone(desired), desired, config), []);
});

test("PAR-BRANCH-PROTECTION: weakened live rulesets are detected", () => {
  const f = (mutate) => { const l = structuredClone(desired); mutate(l); return verifyRuleset(l, desired, config).map((x) => x.code); };
  assert.deepEqual(verifyRuleset(null, desired, config).map((x) => x.code), ["RULESET_MISSING"]);
  assert.ok(f((l) => (l.enforcement = "disabled")).includes("NOT_ACTIVE"));
  assert.ok(f((l) => (l.bypass_actors = [{ actor_id: 5, actor_type: "RepositoryRole" }])).includes("BYPASS_ACTORS"));
  assert.ok(f((l) => (l.rules = l.rules.filter((r) => r.type !== "non_fast_forward"))).includes("RULE_MISSING"));
  const rsc = (l) => l.rules.find((r) => r.type === "required_status_checks").parameters.required_status_checks;
  assert.ok(f((l) => delete rsc(l).find((c) => c.context === "ai-native/trust-gate").integration_id).includes("CHECK_SOURCE"));
  assert.ok(f((l) => delete rsc(l).find((c) => c.context === "ai-native/trust-gate").integration_id).includes("RESERVED_CHECK_ANY_SOURCE"));
  assert.ok(f((l) => (l.rules.find((r) => r.type === "required_status_checks").parameters.required_status_checks = rsc(l).filter((c) => c.context !== "pin-check"))).includes("CHECK_NOT_REQUIRED"));
});

// ---------- PAR-PR-GATE
test("PAR-PR-GATE: aggregate gate passes on this repo and reports product tests as NOT_APPLICABLE", () => {
  const report = runPrGate({ root: new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") });
  assert.equal(report.status, "PASS");
  assert.equal(report.productTests, "NOT_APPLICABLE");
});
