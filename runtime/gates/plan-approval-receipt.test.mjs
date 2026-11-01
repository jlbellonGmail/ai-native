// Plan Approval Receipt: fixtures and mocks only. No credentials, no network, no real dispatch, no simulated human approval
// presented as real: the "approval" below is a fixture row shaped like the Environment approvals API response, and the
// artifact archives are real zip files generated in memory.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateRawSync } from "node:zlib";
import { describeArchive, readSingleEntryZip, sha256OfBytes } from "./plan-approval-artifact.mjs";
import { buildZip } from "./plan-approval-zip.fixture.mjs";
import { BINDING_IDENTITY, REQUIRED_EVIDENCE, TRUSTED_CONFIG_PATH, buildReceipt, canonicalJson, describeConfigBytes, evaluateAgentIsolation, evaluateApproval, evaluateBinding, evaluateConfigSource, evaluateEnvironment, evaluateRequest, evaluateTrustedConfig, evaluateWorkflowRevision, gitBlobSha, parseIsoInstant, planSetFingerprint, sameConfigBytes, sha256Hex, validateReceipt, verdict, verifyReceiptProvenance } from "./plan-approval-receipt.mjs";
import { collectFacts, collectIsolationProbe, collectProvenanceEvidence, loadConfig, loadConfigFile, loadSchema, loadTrustedConfig, readConfigAt, run, verifyFromGitHub } from "./plan-approval.mjs";
import { checkWorkflow } from "./supply-chain.mjs";

const real = loadConfig();
const schema = loadSchema();
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

// Same config as the repository one, with every fail-closed pin filled with explicit FIXTURE values (the suite never
// depends on the real pins, so rotating them in the governed file does not change what these scenarios exercise).
const ENV_ID = 7000000001;
const FILES = Object.fromEntries(real.workflow.trustedFiles.map((p, i) => [p, String(i + 1).repeat(40)]));
const config = {
  ...structuredClone(real),
  requester: { ...real.requester, botUserId: 900001 },
  environment: { ...real.environment, id: ENV_ID },
  workflow: { ...real.workflow, trustedRevisions: [{ id: "rev-1", files: { ...FILES } }] },
};
// Isolated NEGATIVE fixtures: each one is a deep copy of the valid fixture config with exactly ONE pin explicitly unset.
// They never read or mutate the real governed file (which is pinned) and never pretend it is in an earlier state.
const derive = (mutate) => { const c = structuredClone(config); mutate(c); return c; };
const unpinnedBot = derive((c) => { c.requester.botUserId = null; });
const noRevisions = derive((c) => { c.workflow.trustedRevisions = []; });
const unpinnedEnv = derive((c) => { c.environment.id = null; });
const SCOPE = "acceptance-v4-plans-v1";
const scope = config.scopes[SCOPE];
const HEAD = "a".repeat(40);
const MAIN = "b".repeat(40);
const TIP = "e".repeat(40); // head of main when the consumer verifies (ahead of the run commit MAIN)
const CONFIG_BYTES = Buffer.from(JSON.stringify(config));
const CONFIG_ID = describeConfigBytes(CONFIG_BYTES);
const cfgSource = (bytes = CONFIG_BYTES) => ({ local: CONFIG_BYTES, remote: { bytes, blobSha: gitBlobSha(bytes) }, tip: { sha: TIP, blobSha: gitBlobSha(bytes) } });
const liveConfig = (bytes = CONFIG_BYTES) => ({
  repository: { id: config.repository.id, fullName: config.repository.fullName },
  tip: { sha: TIP }, tipRecheck: { sha: TIP },
  atTip: { bytes, blobSha: gitBlobSha(bytes) }, atSource: { bytes, blobSha: gitBlobSha(bytes) }, ancestry: "ahead",
});
const RUN_ID = 41999000001;
const ART_ID = 12345;
const NOW = "2026-10-30T14:00:00Z";
const RUN_CREATED = "2026-10-30T12:00:00Z";
const bot = { login: "ai-native-plan-approval[bot]", id: 900001, type: "Bot" };
const docs = () => scope.documents.map((p, i) => ({ path: p, type: "file", sha256: sha256Hex(`document ${i}`) }));
const workflowFiles = () => real.workflow.trustedFiles.map((p) => ({ path: p, type: "file", blobSha: FILES[p] }));
const goodEnv = () => ({
  id: ENV_ID, name: config.environment.name, canAdminsBypass: false, preventSelfReview: true,
  reviewers: [{ type: "User", login: config.reviewer.login, id: config.reviewer.id }], protectedBranches: false, customBranchPolicies: true, branchPolicies: ["main"],
});
const goodPr = () => ({ number: 168, state: "open", merged: false, baseRef: "develop", headRef: "feature/acceptance-v4", headSha: HEAD, baseRepoId: config.repository.id, headRepoId: config.repository.id, headRepoFork: false });
const approvalRow = () => ({ state: "approved", userLogin: config.reviewer.login, userId: config.reviewer.id, userType: "User", environments: [{ id: ENV_ID, name: config.environment.name }] });

function requestFacts() {
  return {
    inputs: { prNumber: "168", headSha: HEAD, scopeId: SCOPE },
    context: { repository: config.repository.fullName, runId: String(RUN_ID), runAttempt: 1, eventName: "workflow_dispatch", ref: "refs/heads/main", sha: MAIN },
    run: { id: RUN_ID, run_attempt: 1, event: "workflow_dispatch", path: config.workflow.path, head_sha: MAIN, head_branch: "main", repository: { id: config.repository.id }, actor: { ...bot }, triggering_actor: { ...bot } },
    botUser: { ...bot },
    workflowAncestry: "identical",
    workflowFiles: workflowFiles(),
    configSource: cfgSource(),
    pr: goodPr(),
    documents: docs(),
    environment: goodEnv(),
  };
}
const fingerprintOf = (f) => planSetFingerprint({ scopeId: SCOPE, repositoryId: config.repository.id, pullRequestNumber: 168, headSHA: f.pr.headSha, documents: f.documents });
function approvedFacts() {
  const f = requestFacts();
  f.expectedFingerprint = fingerprintOf(f);
  f.approvals = [approvalRow()];
  return f;
}
const OBSERVED = "2026-10-30T13:00:00.000Z";
const GENERATED = "2026-10-30T13:00:01.000Z";
const goodReceipt = () => buildReceipt(config, approvedFacts(), { approvalObservedAt: OBSERVED, generatedAt: GENERATED });

/** Archives come from the fixture: byte-exact upload-artifact layout (the reader's own tests: plan-approval-artifact.test.mjs). */
const makeZip = (name, data, o = {}) => buildZip({ name, data, ...o });
const zipOf = (receipt, o) => makeZip(config.artifact.fileName, Buffer.from(JSON.stringify(receipt)), o);
const artifactFor = (bytes) => ({
  id: ART_ID, name: `${config.artifact.namePrefix}${RUN_ID}`, expired: false, createdAt: "2026-10-30T13:00:05Z", expiresAt: "2027-01-28T13:00:05Z",
  sizeInBytes: bytes.length, digest: `sha256:${sha256OfBytes(bytes)}`,
  workflowRun: { id: RUN_ID, repositoryId: config.repository.id, headRepositoryId: config.repository.id, headBranch: "main", headSha: MAIN },
});
/** Replaces the downloaded archive AND keeps GitHub's recorded digest/size consistent with it (isolates the content layer). */
function setArchive(live, bytes) {
  live.artifacts = [artifactFor(bytes)];
  live.archive = describeArchive({ artifactId: ART_ID, bytes, entryName: config.artifact.fileName });
}
function liveFor(receipt) {
  const bytes = zipOf(receipt);
  const pr = goodPr();
  return {
    now: NOW,
    artifacts: [artifactFor(bytes)],
    archive: describeArchive({ artifactId: ART_ID, bytes, entryName: config.artifact.fileName }),
    run: { id: RUN_ID, path: config.workflow.path, event: "workflow_dispatch", head_branch: "main", run_attempt: 1, conclusion: "success", head_sha: MAIN, created_at: RUN_CREATED, actor: { ...bot }, triggering_actor: { ...bot }, repository: { id: config.repository.id } },
    workflowAncestry: "ahead",
    workflowFiles: workflowFiles(),
    trustedConfig: liveConfig(),
    pr,
    prRecheck: { ...pr },
    documents: docs(),
    environment: goodEnv(),
    approvals: [approvalRow()],
    expected: { scopeId: SCOPE, repositoryId: config.repository.id, pullRequestNumber: 168, headSha: HEAD, planSetFingerprint: receipt.planSetFingerprint },
  };
}

const codes = (findings) => findings.map((f) => f.code);
/** Applies a mutation to fresh approved facts and requires BLOCKED with the given code. */
function blockedApproval(code, mutate, cfg = config) {
  const f = approvedFacts();
  mutate(f);
  const findings = evaluateApproval(cfg, f);
  assert.equal(verdict(findings).status, "BLOCKED");
  assert.ok(codes(findings).includes(code), `expected ${code}, got ${codes(findings)}`);
}
function blockedProvenance(code, mutate, cfg = config) {
  const receipt = goodReceipt();
  const live = liveFor(receipt);
  const r = mutate({ receipt, live }) ?? receipt;
  const out = verifyReceiptProvenance({ receipt: r, schema, config: cfg, live });
  assert.equal(out.status, "BLOCKED");
  assert.ok(codes(out.findings).includes(code), `expected ${code}, got ${codes(out.findings)}`);
}

// ---------- positive path
test("PASS: a complete, fresh, correctly attributed request is accepted before and after the approval", () => {
  assert.deepEqual(evaluateRequest(config, requestFacts()), []);
  assert.deepEqual(evaluateApproval(config, approvedFacts()), []);
});

test("receipt: built only from PASS facts, valid against the schema, bound to head + nine documents + run", () => {
  const r = goodReceipt();
  assert.deepEqual(validateReceipt(r, schema, config), []);
  assert.equal(r.documents.length, 9);
  assert.equal(r.headSHA, HEAD);
  assert.equal(r.workflowRunId, RUN_ID);
  assert.equal(r.runAttempt, 1);
  assert.equal(r.actorLogin, "ai-native-plan-approval[bot]");
  assert.equal(r.reviewerLogin, "jlbellonGmail");
  assert.equal(r.environmentName, "ai-native-plan-approval");
  assert.equal(r.approvalObservedAt, OBSERVED);
});

test("provenance PASS needs ALL the evidence and returns the binding to the verified head SHA and workflow revision", () => {
  const r = goodReceipt();
  const out = verifyReceiptProvenance({ receipt: r, schema, config, live: liveFor(r) });
  assert.equal(out.status, "PASS", JSON.stringify(out.findings));
  assert.deepEqual(out.binding, { scopeId: SCOPE, repositoryId: config.repository.id, pullRequestNumber: 168, headSHA: HEAD, planSetFingerprint: r.planSetFingerprint, workflowRunId: RUN_ID, workflowRevisionId: "rev-1", trustedConfigSha256: CONFIG_ID.sha256, trustedConfigBlobSha: CONFIG_ID.gitBlobSha, trustedConfigSourceRevision: MAIN, mainTipSha: TIP, verifiedAt: NOW });
  assert.equal(verdict([{ code: "X", detail: "x" }], { binding: 1 }).binding, undefined);
});

test("reuse: the same receipt verifies again for later tasks while every condition still matches (no single-use consumption)", () => {
  const r = goodReceipt();
  for (const now of ["2026-10-30T14:00:00Z", "2026-11-15T09:30:00Z"]) {
    const live = liveFor(r);
    live.now = now;
    assert.equal(verifyReceiptProvenance({ receipt: r, schema, config, live }).status, "PASS");
  }
});

// ---------- canonicalization and fingerprint
test("fingerprint: canonical JSON + SHA-256, independent of key and document order, sensitive to head and to each document", () => {
  assert.equal(canonicalJson({ b: 1, a: [2, { d: 1, c: 2 }] }), '{"a":[2,{"c":2,"d":1}],"b":1}');
  assert.equal(canonicalJson({ z: 1, a: 2 }), canonicalJson({ a: 2, z: 1 }));
  const base = { scopeId: SCOPE, repositoryId: 1, pullRequestNumber: 168, headSHA: HEAD, documents: docs() };
  const fp = planSetFingerprint(base);
  assert.match(fp, /^[0-9a-f]{64}$/);
  assert.equal(planSetFingerprint({ ...base, documents: [...base.documents].reverse() }), fp);
  assert.notEqual(planSetFingerprint({ ...base, headSHA: "d".repeat(40) }), fp);
  assert.notEqual(planSetFingerprint({ ...base, pullRequestNumber: 169 }), fp);
  assert.notEqual(planSetFingerprint({ ...base, scopeId: "other" }), fp);
  const changed = docs();
  changed[4].sha256 = sha256Hex("tampered");
  assert.notEqual(planSetFingerprint({ ...base, documents: changed }), fp);
});

test("canonicalJson rejects every value without a single canonical JSON form (undefined, non-JSON, sparse, cyclic, too deep)", () => {
  assert.throws(() => canonicalJson({ a: NaN }), /non-finite/);
  assert.throws(() => canonicalJson({ a: Infinity }), /non-finite/);
  assert.throws(() => canonicalJson({ a: undefined }), /undefined property 'a'/);
  assert.throws(() => canonicalJson(undefined), /undefined/);
  assert.throws(() => canonicalJson([1, undefined]), /undefined/);
  assert.throws(() => canonicalJson({ a: new Date() }), /unsupported/);
  assert.throws(() => canonicalJson({ a: new Map() }), /unsupported/);
  assert.throws(() => canonicalJson({ a: () => 1 }), /unsupported/);
  assert.throws(() => canonicalJson({ a: Symbol("x") }), /unsupported/);
  assert.throws(() => canonicalJson({ a: 1n }), /unsupported/);
  assert.throws(() => canonicalJson(new Array(3)), /sparse/);
  const cyc = {};
  cyc.self = cyc;
  assert.throws(() => canonicalJson(cyc), /too deep/);
  assert.notEqual(canonicalJson({ a: 1 }), canonicalJson({ a: "1" }));
});

test("planSetFingerprint rejects malformed binding fields and malformed or duplicated documents", () => {
  const ok = { scopeId: SCOPE, repositoryId: 1, pullRequestNumber: 168, headSHA: HEAD, documents: docs() };
  assert.throws(() => planSetFingerprint({ ...ok, headSHA: "HEAD" }), /malformed binding/);
  assert.throws(() => planSetFingerprint({ ...ok, repositoryId: "1" }), /malformed binding/);
  assert.throws(() => planSetFingerprint({ ...ok, documents: [] }), /no documents/);
  assert.throws(() => planSetFingerprint({ ...ok, documents: [{ path: "a", sha256: "x" }] }), /malformed document/);
  assert.throws(() => planSetFingerprint({ ...ok, documents: [...docs(), docs()[0]] }), /duplicate/);
  assert.throws(() => planSetFingerprint({ ...ok, documents: undefined }), /no documents/);
});

test("inconsistent fingerprint / id / content inside a receipt is RECEIPT_TAMPERED or RECEIPT_SCHEMA", () => {
  const r = goodReceipt();
  assert.ok(codes(validateReceipt({ ...r, planSetFingerprint: "0".repeat(64) }, schema, config)).includes("RECEIPT_TAMPERED"));
  assert.ok(codes(validateReceipt({ ...r, headSHA: "c".repeat(40) }, schema, config)).includes("RECEIPT_TAMPERED"));
  assert.ok(codes(validateReceipt({ ...r, documents: [...r.documents].reverse() }, schema, config)).length === 0, "document order is not significant");
  assert.ok(codes(validateReceipt({ ...r, headSHA: undefined }, schema, config)).includes("RECEIPT_SCHEMA"));
  assert.ok(codes(validateReceipt({ ...r, documents: "nope" }, schema, config)).includes("RECEIPT_SCHEMA"));
  assert.ok(codes(validateReceipt(null, schema, config)).length > 0);
  assert.ok(codes(validateReceipt("receipt", schema, config)).length > 0);
});

test("buildReceipt refuses to produce a receipt from BLOCKED facts", () => {
  const f = approvedFacts();
  f.approvals = [];
  assert.throws(() => buildReceipt(config, f, { approvalObservedAt: OBSERVED, generatedAt: GENERATED }), /BLOCKED: APPROVAL_ABSENT/);
});

// ---------- fail-closed: malformed evidence is a finding, never an exception that reads as approval
test("fail-closed: evaluators turn malformed or missing evidence into BLOCKED findings instead of throwing", () => {
  for (const bad of [undefined, null, {}, { inputs: {} }, { inputs: { scopeId: SCOPE }, context: null }, "facts", 42]) {
    for (const fn of [evaluateRequest, evaluateApproval]) {
      const findings = fn(config, bad);
      assert.equal(verdict(findings).status, "BLOCKED");
      assert.ok(findings.length > 0);
    }
  }
  assert.equal(verdict(evaluateEnvironment(config, "not an env")).status, "BLOCKED");
  assert.equal(verdict(evaluateWorkflowRevision(config, "nope")).status, "BLOCKED");
  assert.equal(verdict(evaluateAgentIsolation(config, null)).status, "BLOCKED");
  for (const input of [{}, { receipt: null, schema, config, live: null }, { receipt: goodReceipt(), schema, config, live: undefined }, { receipt: goodReceipt(), schema, config: null, live: {} }]) {
    assert.equal(verifyReceiptProvenance(input).status, "BLOCKED");
  }
});

test("fail-closed: approval history that cannot be read, or a missing/ill-typed live field, never passes", () => {
  blockedApproval("APPROVAL_ABSENT", (f) => { f.approvals = undefined; });
  blockedApproval("APPROVAL_ABSENT", (f) => { f.approvals = null; });
  blockedApproval("EVIDENCE_MALFORMED", (f) => { f.approvals = [null]; });
  blockedApproval("EVIDENCE_MALFORMED", (f) => { f.approvals = [{ state: "approved", environments: null }].concat([{ ...approvalRow(), environments: 5 }]); });
  blockedApproval("PLAN_SET_CHANGED", (f) => { f.documents[0].sha256 = "not-a-hash"; });
});

// ---------- identity of the requester
test("BLOCKED: wrong actor", () => blockedApproval("ACTOR_WRONG", (f) => { f.run.actor = { login: "someone", id: 900001, type: "Bot" }; }));
test("BLOCKED: unknown App (another bot, other id)", () => blockedApproval("ACTOR_ID_MISMATCH", (f) => { f.run.actor = { login: bot.login, id: 123, type: "Bot" }; f.run.triggering_actor = { login: bot.login, id: 123, type: "Bot" }; }));
test("BLOCKED: a human with the right-looking login is not the App (type User)", () => blockedApproval("ACTOR_NOT_BOT", (f) => { f.run.actor = { login: bot.login, id: 900001, type: "User" }; }));
test("BLOCKED: github-actions[bot] (dispatch from a GITHUB_TOKEN workflow) is not the App", () => blockedApproval("ACTOR_WRONG", (f) => { f.run.actor = { login: "github-actions[bot]", id: 41898282, type: "Bot" }; f.run.triggering_actor = f.run.actor; }));
test("BLOCKED: triggering_actor differs from actor (re-run by someone else)", () => blockedApproval("ACTOR_TRIGGERING_DIFFER", (f) => { f.run.triggering_actor = { login: config.reviewer.login, id: config.reviewer.id, type: "User" }; }));
test("BLOCKED: the owner dispatching the run (requester is the reviewer)", () => blockedApproval("REQUESTER_IS_REVIEWER", (f) => { f.run.actor = { login: config.reviewer.login, id: config.reviewer.id, type: "User" }; f.run.triggering_actor = f.run.actor; }));
test("BLOCKED: GitHub user record of the bot does not match the pin", () => blockedApproval("BOT_USER_MISMATCH", (f) => { f.botUser = { login: bot.login, id: 5, type: "Bot" }; }));
test("BLOCKED: botUserId null (App identity not pinned) — isolated fixture, the valid fixture stays pinned", () => {
  assert.equal(unpinnedBot.requester.botUserId, null);
  assert.equal(config.requester.botUserId, bot.id, "deriving the negative fixture must not touch the valid one");
  const findings = evaluateRequest(unpinnedBot, requestFacts());
  assert.ok(codes(findings).includes("REQUESTER_NOT_PINNED"));
  assert.equal(verdict(findings).status, "BLOCKED");
  assert.ok(!codes(evaluateRequest(config, requestFacts())).includes("REQUESTER_NOT_PINNED"));
  blockedApproval("REQUESTER_NOT_PINNED", () => {}, unpinnedBot);
});
test("BLOCKED: self-approval (approver is the requesting identity, or reviewer id equals actor id)", () => {
  blockedApproval("SELF_APPROVAL", (f) => { f.approvals[0].userId = bot.id; });
  const r = goodReceipt();
  const other = { ...config, requester: { ...config.requester, botUserId: config.reviewer.id } };
  assert.ok(codes(validateReceipt({ ...r, actorId: config.reviewer.id }, schema, other)).includes("SELF_APPROVAL"));
});
test("BLOCKED: wrong reviewer in the receipt / history (login, id or type)", () => {
  blockedApproval("REVIEWER_MISMATCH", (f) => { f.approvals[0].userLogin = "intruder"; });
  blockedApproval("REVIEWER_MISMATCH", (f) => { f.approvals[0].userId = 1; });
  blockedApproval("REVIEWER_MISMATCH", (f) => { f.approvals[0].userType = "Bot"; });
  blockedProvenance("REVIEWER_MISMATCH", ({ receipt }) => { const r = structuredClone(receipt); r.reviewerId = 42; return r; });
});

// ---------- agent/human separation (what can be proven from the agent's own process)
const cleanProbe = () => ({ tokenEnvNames: [], ghAccounts: [], credentialTargets: [] });
test("agent isolation: PASS only when no token variable, no gh account of the owner and no stored GitHub credential is reachable", () => {
  assert.deepEqual(evaluateAgentIsolation(config, cleanProbe()), []);
  assert.deepEqual(evaluateAgentIsolation(config, { ...cleanProbe(), ghAccounts: [{ host: "github.com", login: "some-other-account" }] }), []);
});
test("BLOCKED: the human identity is accessible to the agent (token env, gh keyring account, stored credential, unknown state)", () => {
  assert.ok(codes(evaluateAgentIsolation(config, { ...cleanProbe(), tokenEnvNames: ["GH_TOKEN"] })).includes("AGENT_TOKEN_IN_ENV"));
  assert.ok(codes(evaluateAgentIsolation(config, { ...cleanProbe(), ghAccounts: [{ host: "github.com", login: "jlbellonGmail" }] })).includes("AGENT_HUMAN_GH_ACCOUNT"));
  assert.ok(codes(evaluateAgentIsolation(config, { ...cleanProbe(), ghAccounts: [{ host: "github.com", login: "JLBELLONGMAIL" }] })).includes("AGENT_HUMAN_GH_ACCOUNT"));
  assert.ok(codes(evaluateAgentIsolation(config, { ...cleanProbe(), credentialTargets: ["git:https://github.com"] })).includes("AGENT_GIT_CREDENTIAL"));
  assert.ok(codes(evaluateAgentIsolation(config, { ...cleanProbe(), ghAccounts: null })).includes("AGENT_PROBE_UNAVAILABLE"));
  assert.ok(codes(evaluateAgentIsolation(config, { ...cleanProbe(), credentialTargets: null })).includes("AGENT_PROBE_UNAVAILABLE"));
});
test("check-agent-isolation exits 1 while the human identity is reachable and 0 once it is not", () => {
  const quiet = console.log;
  console.log = () => {};
  try {
    assert.equal(run("check-agent-isolation", { config, probe: () => ({ ...cleanProbe(), ghAccounts: [{ host: "github.com", login: "jlbellonGmail" }] }) }), 1);
    assert.equal(run("check-agent-isolation", { config, probe: () => cleanProbe() }), 0);
    assert.equal(run("check-agent-isolation", { config, probe: () => { throw new Error("probe crashed"); } }), 1);
  } finally {
    console.log = quiet;
  }
});

// ---------- PR, SHA, scope, documents
test("BLOCKED: wrong PR", () => blockedApproval("PR_MISMATCH", (f) => { f.inputs.prNumber = "169"; f.pr.number = 169; }));
test("BLOCKED: wrong head SHA", () => blockedApproval("HEAD_MISMATCH", (f) => { f.pr.headSha = "d".repeat(40); }));
test("BLOCKED: malformed SHA / PR input", () => {
  blockedApproval("SHA_INPUT_INVALID", (f) => { f.inputs.headSha = "HEAD"; });
  blockedApproval("PR_INPUT_INVALID", (f) => { f.inputs.prNumber = "168; rm -rf /"; });
});
test("BLOCKED: unknown scope", () => blockedApproval("SCOPE_UNKNOWN", (f) => { f.inputs.scopeId = "other-scope"; }));
test("BLOCKED: closed / merged / fork / orphan PR, wrong base or head branch, unreadable PR", () => {
  blockedApproval("PR_NOT_OPEN", (f) => { f.pr.state = "closed"; });
  blockedApproval("PR_MERGED", (f) => { f.pr.state = "closed"; f.pr.merged = true; });
  blockedApproval("PR_FROM_FORK", (f) => { f.pr.headRepoId = 777; f.pr.headRepoFork = true; });
  blockedApproval("PR_FROM_FORK", (f) => { f.pr.headRepoId = null; f.pr.headRepoFork = true; });
  blockedApproval("BASE_MISMATCH", (f) => { f.pr.baseRef = "main"; });
  blockedApproval("HEAD_BRANCH_MISMATCH", (f) => { f.pr.headRef = "feature/other"; });
  blockedApproval("PR_UNAVAILABLE", (f) => { f.pr = null; });
});
test("BLOCKED: missing document, set differing from the scope, non-regular file, unreadable", () => {
  blockedApproval("DOC_MISSING", (f) => { f.documents[3] = { path: f.documents[3].path, missing: true }; });
  blockedApproval("DOC_SET_MISMATCH", (f) => { f.documents.pop(); });
  blockedApproval("DOC_SET_MISMATCH", (f) => { f.documents.push({ path: "specs/evil.md", type: "file", sha256: sha256Hex("x") }); });
  blockedApproval("DOC_NOT_REGULAR_FILE", (f) => { f.documents[0].type = "symlink"; });
  blockedApproval("DOC_UNREADABLE", (f) => { f.documents[0].sha256 = null; });
});
test("BLOCKED: document or head changed between the request and the approval; no binding recorded", () => {
  blockedApproval("PLAN_SET_CHANGED", (f) => { f.documents[2].sha256 = sha256Hex("edited after the request"); });
  blockedApproval("PLAN_SET_CHANGED", (f) => { f.pr.headSha = "e".repeat(40); f.inputs.headSha = "e".repeat(40); });
  blockedApproval("NO_REQUEST_BINDING", (f) => { f.expectedFingerprint = null; });
});

// ---------- workflow trust
test("BLOCKED: workflow not from main, commit not on main, ancestry unavailable, untrusted file, wrong event, re-run, wrong repository", () => {
  blockedApproval("WORKFLOW_NOT_FROM_MAIN", (f) => { f.context.ref = "refs/heads/feature/x"; f.run.head_branch = "feature/x"; });
  blockedApproval("WORKFLOW_NOT_ON_MAIN", (f) => { f.workflowAncestry = "diverged"; });
  blockedApproval("WORKFLOW_NOT_ON_MAIN", (f) => { f.workflowAncestry = null; });
  blockedApproval("WORKFLOW_UNTRUSTED", (f) => { f.run.path = ".github/workflows/evil.yml"; });
  blockedApproval("EVENT_INVALID", (f) => { f.context.eventName = "pull_request"; f.run.event = "pull_request"; });
  blockedApproval("RUN_ATTEMPT", (f) => { f.context.runAttempt = 2; f.run.run_attempt = 2; });
  blockedApproval("REPO_MISMATCH", (f) => { f.context.repository = "someone/else"; });
  blockedApproval("REPO_ID_MISMATCH", (f) => { f.run.repository.id = 1; });
});
test("BLOCKED: no trusted workflow revision registered (isolated fixture: empty list, and a missing list)", () => {
  assert.deepEqual(noRevisions.workflow.trustedRevisions, []);
  assert.equal(config.workflow.trustedRevisions.length, 1, "deriving the negative fixture must not touch the valid one");
  const findings = evaluateRequest(noRevisions, requestFacts());
  assert.ok(codes(findings).includes("WORKFLOW_REVISIONS_EMPTY"));
  assert.equal(verdict(findings).status, "BLOCKED");
  assert.ok(!codes(evaluateRequest(config, requestFacts())).includes("WORKFLOW_REVISIONS_EMPTY"));
  blockedApproval("WORKFLOW_REVISIONS_EMPTY", () => {}, noRevisions);
  blockedApproval("WORKFLOW_REVISIONS_EMPTY", () => {}, derive((c) => { delete c.workflow.trustedRevisions; }));
  blockedProvenance("WORKFLOW_REVISIONS_EMPTY", () => {}, noRevisions);
});
test("BLOCKED: ancestry of main is not enough — unknown / historical workflow revision (any executed file differs)", () => {
  for (const p of real.workflow.trustedFiles) {
    blockedApproval("WORKFLOW_REVISION_UNKNOWN", (f) => { f.workflowAncestry = "ahead"; f.workflowFiles.find((x) => x.path === p).blobSha = "9".repeat(40); });
    blockedProvenance("WORKFLOW_REVISION_UNKNOWN", ({ live }) => { live.workflowAncestry = "identical"; live.workflowFiles.find((x) => x.path === p).blobSha = "9".repeat(40); });
  }
});
test("BLOCKED: a revision that was trusted once but is no longer in the governed list (revoked / historical)", () => {
  const rotated = { ...config, workflow: { ...config.workflow, trustedRevisions: [{ id: "rev-2", files: Object.fromEntries(Object.keys(FILES).map((p) => [p, "8".repeat(40)])) }] } };
  blockedApproval("WORKFLOW_REVISION_UNKNOWN", () => {}, rotated);
  blockedProvenance("WORKFLOW_REVISION_UNKNOWN", () => {}, rotated);
});
test("BLOCKED: workflow files unreadable at the run commit, or governed trust config malformed", () => {
  blockedApproval("WORKFLOW_FILES_UNREADABLE", (f) => { f.workflowFiles[1] = { path: f.workflowFiles[1].path, type: "missing", blobSha: null }; });
  blockedApproval("WORKFLOW_FILES_UNREADABLE", (f) => { f.workflowFiles = undefined; });
  blockedApproval("WORKFLOW_FILES_UNREADABLE", (f) => { f.workflowFiles[0].type = "symlink"; });
  blockedApproval("TRUST_CONFIG_INVALID", () => {}, { ...config, workflow: { ...config.workflow, trustedRevisions: [{ id: "x", files: { [config.workflow.path]: "1".repeat(40) } }] } });
  blockedApproval("TRUST_CONFIG_INVALID", () => {}, { ...config, workflow: { ...config.workflow, trustedRevisions: [{ id: "x", files: Object.fromEntries(Object.keys(FILES).map((p) => [p, "not-a-sha"])) }] } });
  blockedApproval("TRUST_CONFIG_INVALID", () => {}, { ...config, workflow: { ...config.workflow, trustedFiles: [] } });
  blockedApproval("TRUST_CONFIG_INVALID", () => {}, { ...config, workflow: { ...config.workflow, trustedFiles: ["runtime/gates/plan-approval.mjs"] } });
});
test("a registered revision is accepted, and registering it does not change it (the governed config is not one of the pinned files)", () => {
  assert.ok(!real.workflow.trustedFiles.includes("governance/gates/plan-approval.json"));
  assert.ok(real.workflow.trustedFiles.includes(real.workflow.path));
  assert.deepEqual(evaluateWorkflowRevision(config, workflowFiles()), []);
});

// ---------- dedicated Environment and approval history
test("BLOCKED: approval absent / pending / rejected / ambiguous / from another Environment", () => {
  blockedApproval("APPROVAL_ABSENT", (f) => { f.approvals = []; });
  blockedApproval("APPROVAL_ABSENT", (f) => { f.approvals = [{ ...f.approvals[0], environments: [{ id: 1, name: "other" }] }]; });
  blockedApproval("APPROVAL_ABSENT", (f) => { f.approvals = [{ ...f.approvals[0], environments: [{ id: 23407797697, name: "ai-native-human-review" }] }]; });
  blockedApproval("APPROVAL_NOT_APPROVED", (f) => { f.approvals[0].state = "pending"; });
  blockedApproval("APPROVAL_REJECTED", (f) => { f.approvals[0].state = "rejected"; });
  blockedApproval("APPROVAL_REJECTED", (f) => { f.approvals.unshift({ ...f.approvals[0], state: "rejected" }); });
  blockedApproval("APPROVAL_HISTORY_AMBIGUOUS", (f) => { f.approvals.push({ ...f.approvals[0] }); });
  blockedApproval("APPROVAL_ENV_MISMATCH", (f) => { f.approvals[0].environments = [{ id: ENV_ID, name: "renamed" }]; });
  blockedApproval("APPROVAL_ENV_MISMATCH", (f) => { f.approvals[0].environments.push({ id: 5, name: "extra" }); });
});
test("BLOCKED: Environment protections (wrong Environment, reviewer absent/extra, self-review allowed, admin bypass, branch policy, unreadable, not pinned)", () => {
  blockedApproval("ENV_MISMATCH", (f) => { f.environment.name = "ai-native-human-review"; f.environment.id = 23407797697; });
  blockedApproval("ENV_MISMATCH", (f) => { f.environment.id = 1; });
  blockedApproval("ENV_REVIEWERS", (f) => { f.environment.reviewers = []; });
  blockedApproval("ENV_REVIEWERS", (f) => { f.environment.reviewers = undefined; });
  blockedApproval("ENV_REVIEWERS", (f) => { f.environment.reviewers.push({ type: "User", login: "other", id: 2 }); });
  blockedApproval("ENV_REVIEWERS", (f) => { f.environment.reviewers[0].type = "Team"; });
  blockedApproval("ENV_SELF_REVIEW_ALLOWED", (f) => { f.environment.preventSelfReview = false; });
  blockedApproval("ENV_SELF_REVIEW_ALLOWED", (f) => { f.environment.preventSelfReview = null; });
  blockedApproval("ENV_ADMIN_BYPASS", (f) => { f.environment.canAdminsBypass = true; });
  blockedApproval("ENV_BRANCH_POLICY", (f) => { f.environment.branchPolicies = ["main", "develop"]; });
  blockedApproval("ENV_BRANCH_POLICY", (f) => { f.environment.branchPolicies = ["develop"]; });
  blockedApproval("ENV_BRANCH_POLICY", (f) => { f.environment.protectedBranches = true; });
  blockedApproval("ENV_BRANCH_POLICY", (f) => { f.environment.customBranchPolicies = false; });
  blockedApproval("ENV_UNREADABLE", (f) => { f.environment = null; });
  assert.equal(unpinnedEnv.environment.id, null);
  assert.equal(config.environment.id, ENV_ID, "deriving the negative fixture must not touch the valid one");
  blockedApproval("ENV_NOT_PINNED", () => {}, unpinnedEnv);
  assert.ok(codes(evaluateRequest(unpinnedEnv, requestFacts())).includes("ENV_NOT_PINNED"));
  assert.ok(!codes(evaluateRequest(config, requestFacts())).includes("ENV_NOT_PINNED"));
});
test("a config that tries to weaken the Environment policy itself is rejected (bypass allowed / self-review off)", () => {
  assert.ok(codes(evaluateEnvironment({ ...config, environment: { ...config.environment, canAdminsBypass: true } }, { ...goodEnv(), canAdminsBypass: true })).includes("ENV_ADMIN_BYPASS"));
  assert.ok(codes(evaluateEnvironment({ ...config, environment: { ...config.environment, preventSelfReview: false } }, { ...goodEnv(), preventSelfReview: false })).includes("ENV_SELF_REVIEW_ALLOWED"));
});
test("the shared merge-gate Environment `ai-native-human-review` is not the Environment of this flow, and merge-gate still uses it", () => {
  assert.equal(real.environment.name, "ai-native-plan-approval");
  assert.notEqual(real.environment.name, "ai-native-human-review");
  assert.match(read(".github/workflows/merge-gate.yml"), /human-review:[\s\S]*?environment: ai-native-human-review/);
  assert.doesNotMatch(read(".github/workflows/plan-approval-receipt.yml").replace(/^\s*#.*$/gm, ""), /ai-native-human-review/);
});
test("Environment audit reproduces the live state of the shared Environment (prevent_self_review=false) as BLOCKED for the dedicated policy", () => {
  const live = { ...goodEnv(), preventSelfReview: false };
  assert.deepEqual(codes(evaluateEnvironment(config, live)), ["ENV_SELF_REVIEW_ALLOWED"]);
  assert.deepEqual(evaluateEnvironment(config, goodEnv()), []);
});

// ---------- strict dates
test("parseIsoInstant: real calendar dates, real times and valid zones only", () => {
  assert.equal(parseIsoInstant("2026-10-30T13:00:00Z"), Date.UTC(2026, 9, 30, 13, 0, 0));
  assert.equal(parseIsoInstant("2026-10-30T13:00:00.123456Z"), Date.UTC(2026, 9, 30, 13, 0, 0, 123));
  assert.equal(parseIsoInstant("2026-10-30T15:00:00+02:00"), Date.UTC(2026, 9, 30, 13, 0, 0));
  assert.equal(parseIsoInstant("2028-02-29T00:00:00Z"), Date.UTC(2028, 1, 29));
  for (const bad of ["2026-99-99T99:99:99Z", "2026-02-29T00:00:00Z", "2026-04-31T00:00:00Z", "2026-13-01T00:00:00Z", "2026-00-10T00:00:00Z", "2026-10-00T00:00:00Z", "2026-10-30T24:00:00Z", "2026-10-30T23:60:00Z", "2026-10-30T23:59:60Z", "2026-10-30T13:00:00+25:00", "2026-10-30T13:00:00+02:99", "2026-10-30T13:00:00", "2026-10-30 13:00:00Z", "2026-10-30T13:00:00z", "NaN", "", NaN, null, undefined, 1761829200000, {}, "1969-12-31T23:59:59Z"]) {
    assert.ok(Number.isNaN(parseIsoInstant(bad)), `accepted ${String(bad)}`);
  }
});
test("BLOCKED: impossible dates, NaN, wrong temporal order and invalid time zones in a receipt", () => {
  const r = goodReceipt();
  assert.ok(codes(validateReceipt({ ...r, approvalObservedAt: "2026-99-99T99:99:99Z" }, schema, config)).includes("RECEIPT_TIME_INVALID"));
  assert.ok(codes(validateReceipt({ ...r, generatedAt: "2026-02-30T10:00:00Z" }, schema, config)).includes("RECEIPT_TIME_INVALID"));
  assert.ok(codes(validateReceipt({ ...r, generatedAt: "NaN" }, schema, config)).includes("RECEIPT_SCHEMA"));
  assert.ok(codes(validateReceipt({ ...r, generatedAt: "2026-10-30T13:00:00+25:00" }, schema, config)).includes("RECEIPT_SCHEMA"));
  assert.ok(codes(validateReceipt({ ...r, generatedAt: "2026-10-30T13:00:00+02:00" }, schema, config)).includes("RECEIPT_SCHEMA"), "receipts are UTC only");
  assert.ok(codes(validateReceipt({ ...r, generatedAt: "2026-10-30T12:59:59.000Z" }, schema, config)).includes("RECEIPT_TIME"));
  blockedProvenance("RECEIPT_TIME_INVALID", ({ receipt }) => ({ ...receipt, approvalObservedAt: "2026-99-99T99:99:99Z" }));
});
test("BLOCKED: temporal inconsistency between receipt, run and artifact", () => {
  blockedProvenance("RECEIPT_TIME", ({ live }) => { live.run.created_at = "2026-10-30T13:30:00Z"; }); // run created after the approval was observed
  blockedProvenance("RECEIPT_TIME", ({ live }) => { live.now = "2026-10-30T12:30:00Z"; }); // receipt dated in the consumer's future
  blockedProvenance("RUN_TIME_INVALID", ({ live }) => { live.run.created_at = "2026-99-99T99:99:99Z"; });
  blockedProvenance("RUN_TIME_INVALID", ({ live }) => { live.run.created_at = NaN; });
  blockedProvenance("ARTIFACT_TIME_INVALID", ({ live }) => { live.artifacts[0].createdAt = "2026-13-01T00:00:00Z"; });
  blockedProvenance("ARTIFACT_TIME_INVALID", ({ live }) => { live.artifacts[0].expiresAt = "2026-10-30T13:00:00Z"; }); // not after created_at
  blockedProvenance("EVIDENCE_INCOMPLETE", ({ live }) => { live.now = "2026-99-99T99:99:99Z"; });
});

// ---------- artifact: the real artifact is mandatory (G1, G2, G3)
test("BLOCKED: no artifact evidence at all, or any single piece of it missing", () => {
  for (const key of ["artifacts", "archive", "run", "workflowAncestry", "workflowFiles", "pr", "prRecheck", "documents", "environment", "approvals", "expected", "now"]) {
    blockedProvenance("EVIDENCE_INCOMPLETE", ({ live }) => { delete live[key]; });
    blockedProvenance("EVIDENCE_INCOMPLETE", ({ live }) => { live[key] = null; });
  }
  blockedProvenance("EVIDENCE_INCOMPLETE", ({ live }) => { live.expected = { scopeId: SCOPE }; });
  blockedProvenance("EVIDENCE_INCOMPLETE", ({ live }) => { live.expected.headSha = "main"; });
  const r = goodReceipt();
  assert.ok(codes(verifyReceiptProvenance({ receipt: r, schema, config, live: {} }).findings).includes("EVIDENCE_INCOMPLETE"));
});
test("BLOCKED: artifact absent, deleted, expired (flag or expires_at) or ambiguous", () => {
  blockedProvenance("ARTIFACT_MISSING", ({ live }) => { live.artifacts = []; });
  blockedProvenance("ARTIFACT_MISSING", ({ live }) => { live.artifacts[0].name = "plan-approval-receipt-1"; });
  blockedProvenance("ARTIFACT_EXPIRED", ({ live }) => { live.artifacts[0].expired = true; });
  blockedProvenance("ARTIFACT_EXPIRED", ({ live }) => { live.artifacts[0].expired = undefined; });
  blockedProvenance("ARTIFACT_EXPIRED", ({ live }) => { live.now = "2027-02-01T00:00:00Z"; });
  blockedProvenance("ARTIFACT_AMBIGUOUS", ({ live }) => { live.artifacts.push({ ...live.artifacts[0], id: 99 }); });
});
test("BLOCKED: no downloaded content, no trusted metadata (digest/workflow_run), digest not sha256", () => {
  blockedProvenance("ARTIFACT_BYTES_MISSING", ({ live }) => { live.archive = describeArchive({ artifactId: ART_ID, bytes: null, entryName: config.artifact.fileName }); });
  blockedProvenance("ARTIFACT_CONTENT_INVALID", ({ live }) => { live.archive = describeArchive({ artifactId: ART_ID, bytes: null, entryName: config.artifact.fileName }); });
  blockedProvenance("ARTIFACT_BYTES_MISSING", ({ live }) => { live.archive = { artifactId: ART_ID, sizeBytes: null, sha256: null, receipt: goodReceipt(), error: null }; }); // content without hashed bytes
  blockedProvenance("ARTIFACT_DIGEST_MISSING", ({ live }) => { live.artifacts[0].digest = null; });
  blockedProvenance("ARTIFACT_DIGEST_MISSING", ({ live }) => { delete live.artifacts[0].digest; });
  blockedProvenance("ARTIFACT_DIGEST_MISSING", ({ live }) => { live.artifacts[0].digest = `sha1:${"a".repeat(40)}`; });
  blockedProvenance("ARTIFACT_PROVENANCE", ({ live }) => { live.artifacts[0].workflowRun = null; });
});
test("BLOCKED: wrong artifact id, run id, repository, branch or commit", () => {
  blockedProvenance("ARTIFACT_ID_MISMATCH", ({ live }) => { live.archive.artifactId = 1; });
  blockedProvenance("ARTIFACT_RUN_MISMATCH", ({ live }) => { live.artifacts[0].workflowRun.id = 1; });
  blockedProvenance("ARTIFACT_REPO_MISMATCH", ({ live }) => { live.artifacts[0].workflowRun.repositoryId = 2; });
  blockedProvenance("ARTIFACT_REPO_MISMATCH", ({ live }) => { live.artifacts[0].workflowRun.headRepositoryId = 2; });
  blockedProvenance("ARTIFACT_PROVENANCE", ({ live }) => { live.artifacts[0].workflowRun.headBranch = "feature/x"; });
  blockedProvenance("ARTIFACT_PROVENANCE", ({ live }) => { live.artifacts[0].workflowRun.headSha = "1".repeat(40); });
});
test("BLOCKED: digest of the downloaded bytes differs from GitHub's digest; size differs", () => {
  blockedProvenance("ARTIFACT_DIGEST_MISMATCH", ({ live }) => { live.artifacts[0].digest = `sha256:${"d".repeat(64)}`; });
  blockedProvenance("ARTIFACT_DIGEST_MISMATCH", ({ receipt, live }) => { live.archive = describeArchive({ artifactId: ART_ID, bytes: zipOf({ ...receipt, generatedAt: "2026-10-30T13:00:02.000Z" }), entryName: config.artifact.fileName }); }); // bytes swapped after GitHub recorded the digest
  blockedProvenance("ARTIFACT_SIZE_MISMATCH", ({ live }) => { live.artifacts[0].sizeInBytes += 1; });
});
test("BLOCKED: manipulated content / a different receipt inside an artifact whose digest is consistent", () => {
  blockedProvenance("ARTIFACT_TAMPERED", ({ receipt, live }) => { setArchive(live, zipOf({ ...receipt, generatedAt: "2026-10-30T13:00:02.000Z" })); });
  blockedProvenance("ARTIFACT_TAMPERED", ({ receipt, live }) => { setArchive(live, zipOf(structuredClone({ ...receipt, reviewerLogin: "someone" }))); });
  blockedProvenance("ARTIFACT_CONTENT_INVALID", ({ receipt, live }) => { setArchive(live, zipOf({ ...receipt, injected: true })); });
  blockedProvenance("ARTIFACT_CONTENT_INVALID", ({ receipt, live }) => { const r = structuredClone(receipt); r.documents[0].sha256 = sha256Hex("forged"); setArchive(live, zipOf(r)); });
  blockedProvenance("ARTIFACT_CONTENT_INVALID", ({ live }) => { setArchive(live, makeZip(config.artifact.fileName, Buffer.from("{not json"))); });
  blockedProvenance("ARTIFACT_CONTENT_INVALID", ({ live }) => { setArchive(live, makeZip(config.artifact.fileName, Buffer.from("[1,2]"))); });
  blockedProvenance("ARTIFACT_CONTENT_INVALID", ({ live }) => { setArchive(live, makeZip(config.artifact.fileName, Buffer.from([0xff, 0xfe, 0x7b]))); });
  blockedProvenance("ARTIFACT_CONTENT_INVALID", ({ receipt, live }) => { setArchive(live, makeZip("other.json", Buffer.from(JSON.stringify(receipt)))); });
});
test("BLOCKED: a local receipt that differs from the artifact's (locally forged JSON is not provenance)", () => {
  blockedProvenance("RECEIPT_TAMPERED", ({ receipt }) => { const r = structuredClone(receipt); r.documents[0].sha256 = sha256Hex("forged"); return r; });
  blockedProvenance("RECEIPT_TAMPERED", ({ receipt }) => ({ ...receipt, receiptId: `par-${receipt.workflowRunId}-${"0".repeat(16)}` }));
  blockedProvenance("RECEIPT_SCHEMA", ({ receipt }) => ({ ...receipt, injected: true }));
  blockedProvenance("RECEIPT_SCHEMA", ({ receipt }) => ({ ...receipt, runAttempt: 2 }));
  blockedProvenance("RECEIPT_SCHEMA", ({ receipt }) => ({ ...receipt, approvalState: "rejected" }));
  // a perfectly self-consistent forgery for another head: the artifact of the real run does not contain it
  blockedProvenance("ARTIFACT_TAMPERED", ({ receipt }) => {
    const docsOther = receipt.documents.map((d) => ({ ...d }));
    const fp = planSetFingerprint({ ...receipt, headSHA: "c".repeat(40), documents: docsOther });
    return { ...receipt, headSHA: "c".repeat(40), planSetFingerprint: fp, receiptId: `par-${receipt.workflowRunId}-${fp.slice(0, 16)}` };
  });
});

test("zip reader (smoke; the exhaustive profile tests are in plan-approval-artifact.test.mjs)", () => {
  const data = Buffer.from('{"a":1}');
  assert.deepEqual(readSingleEntryZip(makeZip("r.json", data)).data, data);
  assert.throws(() => readSingleEntryZip(makeZip("r.json", data, { mode: 0o120777 })), /regular file/);
  assert.throws(() => readSingleEntryZip(makeZip("r.json", data, { entries: [{ data }, { data, name: "b.json" }] })), /exactly one entry/);
  assert.equal(describeArchive({ artifactId: 1, bytes: makeZip("r.json", data), entryName: "r.json" }).error, null);
  assert.match(describeArchive({ artifactId: 1, bytes: "text", entryName: "r.json" }).error, /no bytes/);
});

// ---------- run provenance
test("BLOCKED: run behind the receipt is not the trusted one (path, branch, event, attempt, commit, failed, actor, repository, unavailable)", () => {
  blockedProvenance("WORKFLOW_UNTRUSTED", ({ live }) => { live.run.path = ".github/workflows/ci.yml"; });
  blockedProvenance("WORKFLOW_UNTRUSTED", ({ live }) => { live.run.head_branch = "feature/x"; });
  blockedProvenance("WORKFLOW_UNTRUSTED", ({ live }) => { live.run.event = "push"; });
  blockedProvenance("WORKFLOW_UNTRUSTED", ({ live }) => { live.run.event = "pull_request"; });
  blockedProvenance("WORKFLOW_UNTRUSTED", ({ live }) => { live.run.head_sha = "1".repeat(40); });
  blockedProvenance("RUN_ID_MISMATCH", ({ live }) => { live.run.id = 5; });
  blockedProvenance("RUN_ATTEMPT", ({ live }) => { live.run.run_attempt = 2; });
  blockedProvenance("WORKFLOW_NOT_ON_MAIN", ({ live }) => { live.workflowAncestry = "diverged"; });
  blockedProvenance("WORKFLOW_NOT_ON_MAIN", ({ live }) => { live.workflowAncestry = "behind"; });
  blockedProvenance("RUN_NOT_SUCCESSFUL", ({ live }) => { live.run.conclusion = "failure"; });
  blockedProvenance("RUN_NOT_SUCCESSFUL", ({ live }) => { live.run.conclusion = null; });
  blockedProvenance("ACTOR_WRONG", ({ live }) => { live.run.actor = { login: config.reviewer.login, id: config.reviewer.id, type: "User" }; });
  blockedProvenance("ACTOR_WRONG", ({ live }) => { live.run.triggering_actor = { ...bot, id: 1 }; });
  blockedProvenance("REPO_ID_MISMATCH", ({ live }) => { live.run.repository.id = 3; });
  blockedProvenance("EVIDENCE_INCOMPLETE", ({ live }) => { live.run = null; });
});
test("a receipt cannot be validated by a config pinned to another reviewer, App, Environment or repository", () => {
  const r = goodReceipt();
  assert.ok(codes(validateReceipt(r, schema, { ...config, reviewer: { ...config.reviewer, id: 42 } })).includes("REVIEWER_MISMATCH"));
  assert.ok(codes(validateReceipt(r, schema, real)).includes("ACTOR_WRONG"));
  assert.ok(codes(validateReceipt(r, schema, real)).includes("ENV_MISMATCH"));
  assert.ok(codes(validateReceipt(r, schema, { ...config, repository: { ...config.repository, id: 5 } })).includes("RECEIPT_REPO"));
});

// ---------- TOCTOU, replay and invalidation
test("BLOCKED: receipt invalidated by HEAD, document, base, PR or scope change", () => {
  blockedProvenance("HEAD_CHANGED", ({ live }) => { live.pr.headSha = "f".repeat(40); live.prRecheck.headSha = "f".repeat(40); });
  blockedProvenance("DOC_CHANGED", ({ live }) => { live.documents[1].sha256 = sha256Hex("changed"); });
  blockedProvenance("DOC_CHANGED", ({ live }) => { live.documents[1].type = "symlink"; });
  blockedProvenance("DOC_MISSING", ({ live }) => { live.documents.pop(); });
  blockedProvenance("DOC_MISSING", ({ live }) => { live.documents[0] = { path: live.documents[0].path, missing: true }; });
  blockedProvenance("BASE_CHANGED", ({ live }) => { live.pr.baseRef = "main"; live.prRecheck.baseRef = "main"; });
  blockedProvenance("HEAD_BRANCH_MISMATCH", ({ live }) => { live.pr.headRef = "feature/other"; live.prRecheck.headRef = "feature/other"; });
  blockedProvenance("PR_NOT_OPEN", ({ live }) => { live.pr.state = "closed"; live.prRecheck.state = "closed"; });
  blockedProvenance("PR_MERGED", ({ live }) => { live.pr.state = "closed"; live.pr.merged = true; live.prRecheck = { ...live.pr }; });
  blockedProvenance("PR_FROM_FORK", ({ live }) => { live.pr.headRepoFork = true; live.prRecheck.headRepoFork = true; });
  blockedProvenance("PR_MISMATCH", ({ live }) => { live.pr.number = 169; live.prRecheck.number = 169; });
  const receipt = goodReceipt();
  const moved = structuredClone(config);
  moved.scopes[SCOPE].baseBranch = "main";
  const out = verifyReceiptProvenance({ receipt, schema, config: moved, live: liveFor(receipt) });
  assert.ok(codes(out.findings).includes("SCOPE_CHANGED"));
  const widened = structuredClone(config);
  widened.scopes[SCOPE].documents = [...widened.scopes[SCOPE].documents, "specs/004-new/spec.md"];
  assert.ok(codes(verifyReceiptProvenance({ receipt, schema, config: widened, live: liveFor(receipt) }).findings).includes("RECEIPT_DOCUMENTS"), "a receipt never covers a wider scope than it was issued for");
});
test("BLOCKED: TOCTOU — the PR moved while the evidence was being collected, or the approval state changed after the issuing run", () => {
  blockedProvenance("TOCTOU_PR_CHANGED", ({ live }) => { live.prRecheck.headSha = "f".repeat(40); });
  blockedProvenance("TOCTOU_PR_CHANGED", ({ live }) => { live.prRecheck.state = "closed"; });
  blockedProvenance("TOCTOU_PR_CHANGED", ({ live }) => { live.prRecheck.merged = true; });
  blockedProvenance("TOCTOU_PR_CHANGED", ({ live }) => { live.prRecheck.baseRef = "main"; });
  blockedProvenance("APPROVAL_ABSENT", ({ live }) => { live.approvals = []; });
  blockedProvenance("APPROVAL_REJECTED", ({ live }) => { live.approvals[0].state = "rejected"; });
  blockedProvenance("APPROVAL_HISTORY_AMBIGUOUS", ({ live }) => { live.approvals.push(approvalRow()); });
  blockedProvenance("REVIEWER_MISMATCH", ({ live }) => { live.approvals[0].userId = 3; });
  blockedProvenance("ENV_SELF_REVIEW_ALLOWED", ({ live }) => { live.environment.preventSelfReview = false; }); // Environment weakened after the receipt was issued
  blockedProvenance("ENV_ADMIN_BYPASS", ({ live }) => { live.environment.canAdminsBypass = true; });
});
test("BLOCKED: stale / reused receipt for another head, plan set, PR or scope", () => {
  blockedProvenance("RECEIPT_STALE", ({ live }) => { live.expected.headSha = "9".repeat(40); });
  blockedProvenance("RECEIPT_STALE", ({ live }) => { live.expected.planSetFingerprint = "8".repeat(64); });
  blockedProvenance("SCOPE_MISMATCH", ({ live }) => { live.expected.scopeId = "another-scope-v1"; });
  blockedProvenance("PR_MISMATCH", ({ live }) => { live.expected.pullRequestNumber = 169; });
});

// ---------- collection layer against a mocked GitHub API
const REPO = config.repository.fullName;
const encodePath = (p) => p.split("/").map(encodeURIComponent).join("/");
function fakeApi({ pr = {}, contents = {}, approvals, env = {}, runOverride = {}, fail = [], override = {}, artifacts, receipt, cfgAtMain, cfgAtTip } = {}) {
  const handlers = {
    [`repos/${REPO}/actions/runs/${RUN_ID}`]: () => ({ id: RUN_ID, run_attempt: 1, event: "workflow_dispatch", path: config.workflow.path, head_sha: MAIN, head_branch: "main", conclusion: "success", created_at: RUN_CREATED, repository: { id: config.repository.id }, actor: { ...bot, node_id: "x" }, triggering_actor: { ...bot }, ...runOverride }),
    [`users/${encodeURIComponent(bot.login)}`]: () => ({ ...bot, avatar_url: "x" }),
    [`repos/${REPO}/compare/${MAIN}...main?per_page=1`]: () => ({ status: "identical" }),
    [`repos/${REPO}/pulls/168`]: () => ({ number: 168, state: "open", merged: false, base: { ref: "develop", repo: { id: config.repository.id } }, head: { ref: "feature/acceptance-v4", sha: HEAD, repo: { id: config.repository.id, fork: false } }, ...pr }),
    [`repos/${REPO}/environments/${config.environment.name}`]: () => ({
      id: ENV_ID, name: config.environment.name, can_admins_bypass: false,
      protection_rules: [{ type: "required_reviewers", prevent_self_review: true, reviewers: [{ type: "User", reviewer: { login: config.reviewer.login, id: config.reviewer.id } }] }, { type: "branch_policy" }],
      deployment_branch_policy: { protected_branches: false, custom_branch_policies: true }, ...env,
    }),
    [`repos/${REPO}/environments/${config.environment.name}/deployment-branch-policies`]: () => ({ branch_policies: [{ name: "main", type: "branch" }] }),
    [`repos/${REPO}/actions/runs/${RUN_ID}/approvals`]: () => approvals ?? [{ state: "approved", comment: "", user: { login: config.reviewer.login, id: config.reviewer.id, type: "User" }, environments: [{ id: ENV_ID, name: config.environment.name }] }],
  };
  const cfgHandler = (bytes) => () => ({ type: "file", encoding: "base64", size: bytes.length, content: bytes.toString("base64"), sha: gitBlobSha(bytes) });
  handlers[`repos/${REPO}`] = () => ({ id: config.repository.id, full_name: config.repository.fullName, private: false });
  handlers[`repos/${REPO}/git/ref/heads/main`] = () => ({ ref: "refs/heads/main", object: { type: "commit", sha: TIP } });
  handlers[`repos/${REPO}/compare/${MAIN}...${TIP}?per_page=1`] = () => ({ status: "ahead" });
  handlers[`repos/${REPO}/contents/${encodePath(TRUSTED_CONFIG_PATH)}?ref=${MAIN}`] = cfgHandler(cfgAtMain ?? CONFIG_BYTES);
  handlers[`repos/${REPO}/contents/${encodePath(TRUSTED_CONFIG_PATH)}?ref=${TIP}`] = cfgHandler(cfgAtTip ?? CONFIG_BYTES);
  scope.documents.forEach((p, i) => {
    handlers[`repos/${REPO}/contents/${encodePath(p)}?ref=${HEAD}`] = () => {
      const body = Buffer.from(contents[p] ?? `document ${i}`);
      return { type: "file", encoding: "base64", size: body.length, content: body.toString("base64") };
    };
  });
  real.workflow.trustedFiles.forEach((p) => { handlers[`repos/${REPO}/contents/${encodePath(p)}?ref=${MAIN}`] = () => ({ type: "file", sha: FILES[p], size: 10 }); });
  if (receipt) {
    const bytes = zipOf(receipt);
    handlers[`repos/${REPO}/actions/runs/${RUN_ID}/artifacts?name=${encodeURIComponent(`${config.artifact.namePrefix}${RUN_ID}`)}&per_page=100`] = () => ({
      total_count: 1,
      artifacts: artifacts ?? [{ id: ART_ID, name: `${config.artifact.namePrefix}${RUN_ID}`, expired: false, created_at: "2026-10-30T13:00:05Z", expires_at: "2027-01-28T13:00:05Z", size_in_bytes: bytes.length, digest: `sha256:${sha256OfBytes(bytes)}`, workflow_run: { id: RUN_ID, repository_id: config.repository.id, head_repository_id: config.repository.id, head_branch: "main", head_sha: MAIN } }],
    });
  }
  Object.assign(handlers, override);
  return (path) => {
    if (fail.includes(path)) throw Object.assign(new Error(`HTTP 404 ${path}`), { notFound: true });
    const h = handlers[path];
    if (!h) throw new Error(`unmocked API path: ${path}`);
    return h();
  };
}
const baseEnv = () => ({ GITHUB_REPOSITORY: REPO, GITHUB_RUN_ID: String(RUN_ID), GITHUB_RUN_ATTEMPT: "1", GITHUB_EVENT_NAME: "workflow_dispatch", GITHUB_REF: "refs/heads/main", GITHUB_SHA: MAIN, INPUT_PR: "168", INPUT_SHA: HEAD, INPUT_SCOPE: SCOPE });

test("collectFacts: mocked API maps to facts that pass; documents are hashed from raw bytes and workflow files by git blob at the run commit", () => {
  const f = collectFacts({ api: fakeApi(), env: baseEnv(), config, configBytes: CONFIG_BYTES, withApprovals: false });
  assert.deepEqual(evaluateRequest(config, f), []);
  assert.equal(f.documents[0].sha256, sha256Hex("document 0"));
  assert.equal(f.environment.preventSelfReview, true);
  assert.deepEqual(f.workflowFiles, workflowFiles());
});

test("collectFacts: API 404 on a document, a workflow file, the Environment, or a fork PR end up as findings (BLOCKED)", () => {
  const docPath = `repos/${REPO}/contents/${encodePath(scope.documents[0])}?ref=${HEAD}`;
  const wfPath = `repos/${REPO}/contents/${encodePath(real.workflow.trustedFiles[2])}?ref=${MAIN}`;
  const mk = (opts) => codes(evaluateRequest(config, collectFacts({ api: fakeApi(opts), env: baseEnv(), config, configBytes: CONFIG_BYTES, withApprovals: false })));
  assert.ok(mk({ fail: [docPath] }).includes("DOC_MISSING"));
  assert.ok(mk({ fail: [wfPath] }).includes("WORKFLOW_FILES_UNREADABLE"));
  assert.ok(mk({ fail: [`repos/${REPO}/environments/${config.environment.name}`] }).includes("ENV_UNREADABLE"));
  assert.ok(mk({ pr: { head: { ref: "feature/acceptance-v4", sha: HEAD, repo: { id: 999, fork: true } } } }).includes("PR_FROM_FORK"));
});

test("collectFacts: hostile inputs never reach an API path", () => {
  const env = { ...baseEnv(), INPUT_PR: "168/../../x", INPUT_SHA: "main" };
  const seen = [];
  const api = (p) => { seen.push(p); return fakeApi()(p); };
  const f = collectFacts({ api, env, config, configBytes: CONFIG_BYTES, withApprovals: false });
  assert.ok(seen.length > 0 && seen.every((p) => !p.includes("/../") && !p.includes("168/") && !p.includes("ref=main")));
  assert.ok(!seen.some((p) => p.includes("/pulls/") || /\/contents\/specs/.test(p)), "no PR or document read with invalid inputs");
  assert.ok(codes(evaluateRequest(config, f)).includes("PR_INPUT_INVALID"));
});

test("run(): request -> issue end to end on mocks writes a valid receipt; any BLOCKED case exits 1 and writes nothing", () => {
  const dir = mkdtempSync(join(tmpdir(), "par-"));
  try {
    const out = join(dir, "gho");
    const env = { ...baseEnv(), GITHUB_OUTPUT: join(dir, "output.txt") };
    assert.equal(run("request", { api: fakeApi(), env, config, outDir: out }), 0);
    const fp = readFileSync(env.GITHUB_OUTPUT, "utf8").match(/plan_set_fingerprint=([0-9a-f]{64})/)[1];
    assert.equal(run("issue", { api: fakeApi(), env: { ...env, EXPECTED_FINGERPRINT: fp }, config, outDir: out, now: () => "2026-10-30T13:00:00.000Z" }), 0);
    const receipt = JSON.parse(readFileSync(join(out, "plan-approval-receipt.json"), "utf8"));
    assert.deepEqual(validateReceipt(receipt, schema, config), []);
    assert.equal(receipt.planSetFingerprint, fp);

    const out2 = join(dir, "blocked");
    const quiet = console.log;
    console.log = () => {};
    try {
      assert.equal(run("issue", { api: fakeApi({ approvals: [] }), env: { ...env, EXPECTED_FINGERPRINT: fp }, config, outDir: out2 }), 1);
      assert.equal(run("issue", { api: fakeApi({ contents: { [scope.documents[0]]: "edited" } }), env: { ...env, EXPECTED_FINGERPRINT: fp }, config, outDir: out2 }), 1);
      assert.equal(run("issue", { api: fakeApi(), env: { ...env, GITHUB_RUN_ATTEMPT: "2" }, config, outDir: out2 }), 1);
      assert.equal(run("request", { api: fakeApi(), env, config: real, outDir: out2 }), 1); // real config: App, Environment and workflow revision not pinned yet
      assert.equal(run("request", { api: () => { throw new Error("boom"); }, env, config, outDir: out2 }), 1);
      assert.equal(run("issue", { api: fakeApi(), env: { ...env, EXPECTED_FINGERPRINT: fp }, config, outDir: out2, now: () => "2026-99-99T99:99:99Z" }), 1); // impossible clock value never becomes a receipt
      assert.equal(run("request", { api: fakeApi(), env: null, config, outDir: out2 }), 1); // unexpected exception => non-zero, not PASS
      assert.equal(run("no-such-mode", { api: fakeApi(), env, config, outDir: out2 }), 2);
    } finally {
      console.log = quiet;
    }
    assert.deepEqual(readdirSync(dir).filter((n) => n === "blocked"), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------- consumer-side verification against a mocked GitHub (download -> bytes -> content -> provenance)
const verifyWith = (receipt, opts = {}, expected = { scopeId: SCOPE, repositoryId: config.repository.id, pullRequestNumber: 168, headSha: HEAD }) => {
  const bytes = zipOf(receipt);
  return verifyFromGitHub({ api: fakeApi({ receipt, ...opts }), download: opts.download ?? (() => bytes), schema, receipt, expected, now: NOW, repo: REPO });
};
test("verifyFromGitHub: downloads the artifact, checks digest/bytes/content/run/approval/Environment/PR/documents and PASSes only with everything", () => {
  const r = goodReceipt();
  const out = verifyWith(r);
  assert.equal(out.status, "PASS", JSON.stringify(out.findings));
  assert.equal(out.binding.headSHA, HEAD);
  assert.equal(out.binding.workflowRevisionId, "rev-1");
});
test("verifyFromGitHub: BLOCKED when the download fails, returns other bytes, the artifact list is missing, or any GET fails", () => {
  const r = goodReceipt();
  const status = (out) => out.status;
  assert.equal(status(verifyWith(r, { download: () => { throw new Error("HTTP 410 gone"); } })), "BLOCKED");
  assert.ok(codes(verifyWith(r, { download: () => { throw new Error("HTTP 410 gone"); } }).findings).includes("ARTIFACT_BYTES_MISSING"));
  assert.ok(codes(verifyWith(r, { download: () => zipOf({ ...r, generatedAt: "2026-10-30T13:00:09.000Z" }) }).findings).includes("ARTIFACT_DIGEST_MISMATCH"));
  assert.ok(codes(verifyWith(r, { download: () => Buffer.from("garbage") }).findings).includes("ARTIFACT_DIGEST_MISMATCH"));
  assert.ok(codes(verifyWith(r, { artifacts: [] }).findings).includes("ARTIFACT_MISSING"));
  assert.equal(status(verifyWith(r, { fail: [`repos/${REPO}/actions/runs/${RUN_ID}/artifacts?name=${encodeURIComponent(`${config.artifact.namePrefix}${RUN_ID}`)}&per_page=100`] })), "BLOCKED");
  assert.equal(status(verifyWith(r, { fail: [`repos/${REPO}/actions/runs/${RUN_ID}`] })), "BLOCKED");
  assert.equal(status(verifyWith(r, { fail: [`repos/${REPO}/actions/runs/${RUN_ID}/approvals`] })), "BLOCKED");
  assert.equal(status(verifyWith(r, { fail: [`repos/${REPO}/pulls/168`] })), "BLOCKED");
  assert.equal(status(verifyWith(r, { fail: [`repos/${REPO}/environments/${config.environment.name}`] })), "BLOCKED");
  assert.equal(status(verifyWith(r, { fail: [`repos/${REPO}/contents/${encodePath(real.workflow.trustedFiles[0])}?ref=${MAIN}`] })), "BLOCKED");
  assert.equal(status(verifyWith(r, { artifacts: [{ id: ART_ID, name: `${config.artifact.namePrefix}${RUN_ID}`, expired: false, created_at: "2026-10-30T13:00:05Z", expires_at: "2027-01-28T13:00:05Z", size_in_bytes: 3, digest: null, workflow_run: null }] })), "BLOCKED");
  assert.equal(status(verifyFromGitHub({ api: () => { throw new Error("offline"); }, download: () => { throw new Error("offline"); }, schema, repo: REPO, receipt: r, expected: { scopeId: SCOPE, pullRequestNumber: 168, headSha: HEAD }, now: NOW })), "BLOCKED");
  assert.equal(status(verifyFromGitHub({ api: fakeApi({ receipt: r }), download: () => zipOf(r), schema, repo: REPO, receipt: { workflowRunId: "x" }, expected: {}, now: NOW })), "BLOCKED");
  assert.equal(status(verifyFromGitHub({ api: fakeApi({ receipt: r }), download: () => zipOf(r), schema, repo: REPO, receipt: null, expected: {}, now: NOW })), "BLOCKED");
});
test("verifyFromGitHub: BLOCKED on head/document change, closed PR, unknown workflow revision, rejected approval", () => {
  const r = goodReceipt();
  const docPath = `repos/${REPO}/contents/${encodePath(scope.documents[0])}?ref=${"f".repeat(40)}`;
  assert.ok(codes(verifyWith(r, { pr: { head: { ref: "feature/acceptance-v4", sha: "f".repeat(40), repo: { id: config.repository.id, fork: false } } }, override: { [docPath]: () => ({ type: "file", encoding: "base64", size: 1, content: Buffer.from("x").toString("base64") }) } }).findings).includes("HEAD_CHANGED"));
  assert.ok(codes(verifyWith(r, { pr: { state: "closed" } }).findings).includes("PR_NOT_OPEN"));
  assert.ok(codes(verifyWith(r, { contents: { [scope.documents[4]]: "edited after approval" } }).findings).includes("DOC_CHANGED"));
  assert.ok(codes(verifyWith(r, { override: { [`repos/${REPO}/contents/${encodePath(real.workflow.trustedFiles[1])}?ref=${MAIN}`]: () => ({ type: "file", sha: "7".repeat(40), size: 10 }) } }).findings).includes("WORKFLOW_REVISION_UNKNOWN"));
  assert.ok(codes(verifyWith(r, { approvals: [{ state: "rejected", user: { login: config.reviewer.login, id: config.reviewer.id, type: "User" }, environments: [{ id: ENV_ID, name: config.environment.name }] }] }).findings).includes("APPROVAL_REJECTED"));
  assert.ok(codes(verifyWith(r, {}, { scopeId: SCOPE, repositoryId: config.repository.id, pullRequestNumber: 168, headSha: "9".repeat(40) }).findings).includes("RECEIPT_STALE"));
});
test("verifyFromGitHub: TOCTOU — the PR head moves between the first read and the re-read", () => {
  const r = goodReceipt();
  let calls = 0;
  const moving = () => {
    calls += 1;
    return { number: 168, state: "open", merged: false, base: { ref: "develop", repo: { id: config.repository.id } }, head: { ref: "feature/acceptance-v4", sha: calls === 1 ? HEAD : "e".repeat(40), repo: { id: config.repository.id, fork: false } } };
  };
  const out = verifyWith(r, { override: { [`repos/${REPO}/pulls/168`]: moving } });
  assert.equal(out.status, "BLOCKED");
  assert.ok(codes(out.findings).includes("TOCTOU_PR_CHANGED"));
  assert.equal(calls, 2, "the PR is read before and after the rest of the evidence");
});
test("collectProvenanceEvidence is read-only: only GET-style paths, a single artifact download, no write endpoints", () => {
  const r = goodReceipt();
  const seen = [];
  const api = fakeApi({ receipt: r });
  const dl = [];
  const spy = (p) => { seen.push(p); return api(p); };
  collectProvenanceEvidence({ api: spy, download: (p) => { dl.push(p); return zipOf(r); }, config, trusted: loadTrustedConfig({ api: spy, repo: REPO }), receipt: r, expected: { scopeId: SCOPE, repositoryId: config.repository.id, pullRequestNumber: 168, headSha: HEAD }, now: NOW });
  assert.equal(seen.filter((p) => p.endsWith("/git/ref/heads/main")).length, 2, "the tip of main is read before and after the evidence");
  assert.deepEqual(dl, [`repos/${REPO}/actions/artifacts/${ART_ID}/zip`]);
  assert.ok(seen.every((p) => !/dispatches|pending_deployments|merge|approve|rerun|cancel/.test(p)));
  assert.equal(seen.filter((p) => p.includes("/pulls/168")).length, 2);
});
test("verify CLI mode: exit 0 only on PASS, prints the binding; unreadable receipt file exits 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "par-verify-"));
  const quiet = console.log;
  const lines = [];
  console.log = (l) => lines.push(l);
  try {
    const r = goodReceipt();
    const file = join(dir, "receipt.json");
    writeFileSync(file, JSON.stringify(r));
    const opts = { api: fakeApi({ receipt: r }), download: () => zipOf(r), config, now: () => NOW };
    assert.equal(run("verify", { ...opts, args: [file, SCOPE, "168", HEAD] }), 0);
    assert.ok(lines.some((l) => String(l).includes(`"headSHA":"${HEAD}"`)));
    assert.equal(run("verify", { ...opts, args: [file, SCOPE, "168", "9".repeat(40)] }), 1);
    assert.equal(run("verify", { ...opts, args: [join(dir, "missing.json"), SCOPE, "168", HEAD] }), 1);
    writeFileSync(file, "{ broken");
    assert.equal(run("verify", { ...opts, args: [file, SCOPE, "168", HEAD] }), 1);
  } finally {
    console.log = quiet;
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------- static guarantees of the committed workflow, config and code
test("workflow: workflow_dispatch only, no PR checkout, read-only permissions, dedicated Environment before the receipt, pinned actions", () => {
  const full = read(".github/workflows/plan-approval-receipt.yml");
  const y = full.replace(/^\s*#.*$/gm, ""); // structure only: comments may legitimately mention what the App is granted
  assert.match(y, /^on:\s*\n\s+workflow_dispatch:/m);
  assert.doesNotMatch(y, /pull_request|pull_request_target|workflow_run|schedule:|push:|issue_comment/);
  assert.doesNotMatch(y, /:\s*write\b|write-all/);
  assert.doesNotMatch(y, /secrets\./);
  assert.doesNotMatch(y, /head\.(sha|ref)|head_ref|github\.event\.pull_request/);
  assert.doesNotMatch(y, /\b(npm|pnpm|yarn|pip|npx)\b/);
  assert.match(y, /human-approval:[\s\S]*?environment: ai-native-plan-approval\r?\n/);
  assert.equal(y.match(/environment: (\S+)/g).length, 1);
  assert.equal(y.match(/environment: (\S+)/)[1], real.environment.name);
  assert.match(y, /issue-receipt:[\s\S]*?needs: \[verify-request, human-approval\]/);
  assert.match(y, /if: github\.ref == 'refs\/heads\/main' && github\.run_attempt == 1/);
  assert.equal((y.match(/ref: \$\{\{ github\.sha \}\}/g) ?? []).length, 2);
  assert.deepEqual(checkWorkflow(".github/workflows/plan-approval-receipt.yml", full), []);
  assert.doesNotMatch(y, /ai-native\/(trust|merge)-gate/); // does not touch reserved check names
});

test("blast radius of Actions: write: the set of dispatchable workflows is explicit and none of them can write contents, release or approve", () => {
  const dir = new URL("../../.github/workflows/", import.meta.url);
  const dispatchable = readdirSync(dir).filter((n) => /\.ya?ml$/.test(n) && /^\s*workflow_dispatch:/m.test(read(`.github/workflows/${n}`))).sort();
  // Adding a dispatchable workflow widens what the ai-native-plan-approval App can start: it must be a conscious, reviewed change.
  assert.deepEqual(dispatchable, ["pilot.yml", "plan-approval-receipt.yml"]);
  for (const n of dispatchable) {
    const y = read(`.github/workflows/${n}`).replace(/^\s*#.*$/gm, "");
    assert.doesNotMatch(y, /(contents|id-token|attestations|packages|deployments|pull-requests):\s*write|write-all/, n);
  }
});

test("code: no write verbs, no approval, merge or dispatch endpoints in the receipt tooling", () => {
  for (const f of ["plan-approval.mjs", "plan-approval-receipt.mjs", "plan-approval-artifact.mjs"]) {
    const src = read(`runtime/gates/${f}`);
    assert.doesNotMatch(src, /--method|-X\s*(POST|PUT|PATCH|DELETE)|"POST"|"PUT"|"PATCH"|"DELETE"/, f);
    assert.doesNotMatch(src, /pending_deployments|\/dispatches|\/merge\b|gh pr merge|\/approve\b/, f);
    assert.doesNotMatch(src, /\bexec\(|\beval\(|new Function|execSync/, f);
    assert.doesNotMatch(src, /auth token|--show-token|GH_TOKEN\]|process\.env\.(GH|GITHUB)_TOKEN/, f); // never reads credential values
  }
});

test("config: governance/gates/plan-approval.json is coherent, and every fail-closed pin is registered with its exact value", () => {
  assert.equal(Object.keys(real.scopes[SCOPE].documents).length, 9);
  assert.equal(new Set(real.scopes[SCOPE].documents).size, 9);

  // requester identity: the dedicated App bot, a Bot (never a User), and not the human reviewer
  assert.equal(real.requester.appSlug, "ai-native-plan-approval");
  assert.equal(real.requester.botLogin, "ai-native-plan-approval[bot]");
  assert.equal(real.requester.botUserId, 350901564);
  assert.equal(real.requester.actorType, "Bot");
  assert.ok(Number.isSafeInteger(real.requester.botUserId) && real.requester.botUserId > 0);
  assert.notEqual(real.requester.botUserId, real.reviewer.id, "the requesting identity is never the human reviewer");
  assert.notEqual(real.requester.botLogin, real.reviewer.login);
  assert.equal(real.reviewer.type, "User");

  // dedicated Environment: pinned by name AND id, with the protections the evaluator enforces
  assert.equal(real.environment.name, "ai-native-plan-approval");
  assert.equal(real.environment.id, 25906730072);
  assert.ok(Number.isSafeInteger(real.environment.id) && real.environment.id > 0);
  assert.notEqual(real.environment.id, 23407797697, "not the human-review Environment");

  // trusted workflow revision: exactly one, covering exactly trustedFiles, six git blob SHA-1 (no extra, no missing)
  const EXPECTED_REVISION = {
    id: "r1-07d93c13d7a8",
    files: {
      ".github/workflows/plan-approval-receipt.yml": "d8ff23f761d625e6ef0901b28dc28d871a0ef1b6",
      "runtime/gates/plan-approval.mjs": "0908ae08001cc622469f3ba4e92157dca2194ea5",
      "runtime/gates/plan-approval-receipt.mjs": "0c247d755701367326af52a137eb843f56983baa",
      "runtime/gates/plan-approval-artifact.mjs": "483d6ea056fa444f0d7cdae26cdf3506adcd1a82",
      "runtime/lib/schema-lite.mjs": "2798b5b93fff0b13c0c9fdc73d9556c25899992d",
      "contracts/plan-approval-receipt.schema.json": "124c50516ebee34375fd0fa949b2da866d3dc4b2",
    },
  };
  assert.equal(real.workflow.trustedFiles.length, 6);
  assert.equal(real.workflow.trustedRevisions.length, 1);
  const [rev] = real.workflow.trustedRevisions;
  assert.deepEqual(rev, EXPECTED_REVISION);
  assert.deepEqual(Object.keys(rev.files).sort(), [...real.workflow.trustedFiles].sort());
  assert.equal(Object.keys(rev.files).length, 6);
  for (const [p, sha] of Object.entries(rev.files)) assert.match(sha, /^[0-9a-f]{40}$/, `${p} must pin a git blob SHA-1`);
  assert.equal(new Set(Object.values(rev.files)).size, 6, "six distinct blobs");

  // the registered pins satisfy the evaluators with the REAL config (no fail-closed pin finding is raised)
  const realWorkflowFiles = real.workflow.trustedFiles.map((p) => ({ path: p, type: "file", blobSha: rev.files[p] }));
  assert.deepEqual(evaluateWorkflowRevision(real, realWorkflowFiles), []);
  assert.ok(codes(evaluateWorkflowRevision(real, realWorkflowFiles.map((f, i) => (i === 0 ? { ...f, blobSha: "9".repeat(40) } : f)))).includes("WORKFLOW_REVISION_UNKNOWN"), "a single differing file is not the registered revision");
  const pinFindings = codes(evaluateRequest(real, requestFacts()));
  for (const c of ["REQUESTER_NOT_PINNED", "ENV_NOT_PINNED", "WORKFLOW_REVISIONS_EMPTY", "TRUST_CONFIG_INVALID"]) assert.ok(!pinFindings.includes(c), `${c} must not be raised by the registered pins`);
  assert.deepEqual(codes(evaluateEnvironment(real, { ...goodEnv(), id: real.environment.id, name: real.environment.name })).filter((c) => c === "ENV_NOT_PINNED" || c === "ENV_MISMATCH"), []);

  assert.equal(real.environment.preventSelfReview, true);
  assert.equal(real.environment.canAdminsBypass, false);
  assert.deepEqual(real.environment.deploymentBranches, ["main"]);
  assert.notEqual(real.requester.appSlug, "ai-native-worker");
  assert.notEqual(real.requester.appSlug, "ai-native-trust");
  assert.equal(real.requester.botLogin, `${real.requester.appSlug}[bot]`);
  assert.equal(schema.properties.runAttempt.const, 1);
  assert.equal(schema.additionalProperties, false);
  for (const p of real.scopes[SCOPE].documents) assert.match(p, /^specs\/00[123]-[a-z-]+\/(spec|plan|tasks)\.md$/);
  for (const p of real.workflow.trustedFiles) assert.ok(read(p).length > 0, `${p} must exist`);
  assert.ok(!real.workflow.trustedFiles.includes("governance/gates/plan-approval.json"));
});

// =====================================================================================================================
// Third remediation. G1/G3: hostile archives at provenance level. G6-G8: non-circular trusted configuration.
// G9: immutable binding / TOCTOU contract. G10: fail-closed probe. G11: Actions: write evaluation (document guards).
// =====================================================================================================================

// ---------- G1 / G3 at provenance level: a hostile archive is BLOCKED even if GitHub's digest and size are consistent with it
test("provenance: an artifact whose entry is a symlink, or whose headers disagree, is BLOCKED (digest and size consistent with the hostile bytes)", () => {
  const hostile = [
    { mode: 0o120777 },                                  // the Codex repro: entry marked as a symlink
    { mode: 0o040755 }, { mode: 0o010644 }, { mode: 0o140644 },
    { locName: "other.json" }, { flags: 8, locFlags: 0 }, { locMethod: 0 }, { crc: 1 },
    { uSize: 1 }, { cSize: 3 }, { descCrc: 1 }, { comment: Buffer.from("x") }, { cenExtra: Buffer.from([1, 0, 0, 0]) },
  ];
  for (const o of hostile) blockedProvenance("ARTIFACT_CONTENT_INVALID", ({ receipt, live }) => { setArchive(live, zipOf(receipt, o)); });
  blockedProvenance("ARTIFACT_CONTENT_INVALID", ({ receipt, live }) => {
    const data = Buffer.from(JSON.stringify(receipt));
    setArchive(live, buildZip({ entries: [{ name: config.artifact.fileName, data }, { name: "hidden.json", data }] }));
  });
  blockedProvenance("ARTIFACT_CONTENT_INVALID", ({ receipt, live }) => {
    const data = Buffer.from(JSON.stringify(receipt));
    setArchive(live, buildZip({ name: config.artifact.fileName, data, suffix: buildZip({ name: "x.json", data }) }));
  });
  // download side: the real GitHub listing describes the good archive, the bytes served are hostile
  const r = goodReceipt();
  const out = verifyWith(r, { download: () => zipOf(r, { mode: 0o120777 }) });
  assert.equal(out.status, "BLOCKED");
  assert.ok(codes(out.findings).includes("ARTIFACT_CONTENT_INVALID"));
  assert.ok(codes(out.findings).includes("ARTIFACT_DIGEST_MISMATCH"));
});

test("provenance: UNKNOWN / unreadable states are never a PASS (incomplete evidence, unknown states, nulls)", () => {
  blockedProvenance("EVIDENCE_INCOMPLETE", ({ live }) => { delete live.trustedConfig; });
  blockedProvenance("EVIDENCE_INCOMPLETE", ({ live }) => { live.environment = null; });
  blockedProvenance("EVIDENCE_INCOMPLETE", ({ live }) => { live.workflowAncestry = null; });
  blockedProvenance("EVIDENCE_INCOMPLETE", ({ live }) => { live.prRecheck = undefined; });
  blockedProvenance("EVIDENCE_INCOMPLETE", ({ live }) => { delete live.expected.repositoryId; });
  blockedProvenance("EVIDENCE_INCOMPLETE", ({ live }) => { live.expected.repositoryId = "1262211240"; });
  blockedProvenance("WORKFLOW_NOT_ON_MAIN", ({ live }) => { live.workflowAncestry = "unknown"; });
  blockedProvenance("WORKFLOW_NOT_ON_MAIN", ({ live }) => { live.workflowAncestry = "diverged"; });
  blockedProvenance("RUN_NOT_SUCCESSFUL", ({ live }) => { live.run.conclusion = null; });
  blockedProvenance("RUN_NOT_SUCCESSFUL", ({ live }) => { live.run.conclusion = "unknown"; });
  blockedProvenance("PR_NOT_OPEN", ({ live }) => { live.pr.state = "unknown"; live.prRecheck.state = "unknown"; });
  blockedProvenance("APPROVAL_NOT_APPROVED", ({ live }) => { live.approvals[0].state = "unknown"; });
  blockedProvenance("EVIDENCE_INCOMPLETE", ({ live }) => { live.approvals = "unreadable"; });
  assert.ok(codes(evaluateEnvironment(config, null)).includes("ENV_UNREADABLE"));
});

// ---------- G6 / G7 / G8: trusted configuration, non-circular
test("G6 trusted configuration: the receipt records its identity (sourceRevision, git blob, sha256, repository id, run id)", () => {
  const r = goodReceipt();
  assert.deepEqual(r.trustedConfig, { path: TRUSTED_CONFIG_PATH, sourceRevision: MAIN, gitBlobSha: CONFIG_ID.gitBlobSha, sha256: CONFIG_ID.sha256, repositoryId: config.repository.id, workflowRunId: RUN_ID });
  assert.deepEqual(validateReceipt(r, schema, config), []);
  assert.equal(CONFIG_ID.sha256, sha256Hex(CONFIG_BYTES));
  assert.equal(CONFIG_ID.gitBlobSha, gitBlobSha(CONFIG_BYTES));
  assert.equal(gitBlobSha(Buffer.from("hello\n")), "ce013625030ba8dba906f756967f9e9ca394464a"); // `echo hello | git hash-object --stdin`
  assert.throws(() => describeConfigBytes(Buffer.alloc(0)), /no configuration bytes/);
  assert.throws(() => describeConfigBytes("text"), /no configuration bytes/);
});

test("G8 sourceRevision and the whole configuration identity are EXCLUDED from the plan fingerprint (three separate concepts)", () => {
  const r = goodReceipt();
  const fp = planSetFingerprint(r);
  assert.equal(fp, r.planSetFingerprint);
  const mutations = [
    (x) => { x.trustedConfig.sourceRevision = "1".repeat(40); }, (x) => { x.trustedConfig.sha256 = "2".repeat(64); }, (x) => { x.trustedConfig.gitBlobSha = "3".repeat(40); },
    (x) => { x.trustedConfig.workflowRunId = 5; }, (x) => { x.workflowSHA = "4".repeat(40); }, (x) => { x.workflowRunId = 6; }, (x) => { x.actorId = 7; },
  ];
  for (const mutate of mutations) { const m = structuredClone(r); mutate(m); assert.equal(planSetFingerprint(m), fp); }
  const src = read("runtime/gates/plan-approval-receipt.mjs");
  const body = src.slice(src.indexOf("export function planSetFingerprint"), src.indexOf("export const verdict"));
  assert.ok(body.length > 200);
  assert.doesNotMatch(body, /sourceRevision|trustedConfig|gitBlobSha|workflowSHA|configIdentity/);
  // moving the configuration is a CONFIG finding, never a fingerprint tamper, and what the human approved is untouched
  const m = structuredClone(r); m.trustedConfig.sourceRevision = "1".repeat(40);
  const f = codes(validateReceipt(m, schema, config));
  assert.ok(f.includes("CONFIG_SOURCE_NOT_RUN_COMMIT"));
  assert.ok(!f.includes("RECEIPT_TAMPERED"));
  // the pieces are three different things: documents/PR/SHA (fingerprint), configuration identity, workflow provenance
  assert.notEqual(r.planSetFingerprint, r.trustedConfig.sha256);
  assert.ok(!JSON.stringify(r.documents).includes(r.trustedConfig.sha256));
});

test("G7 no circularity: the repository configuration holds no hash of itself, is not one of the pinned workflow files and lives outside the PR", () => {
  const { bytes, config: parsed } = loadConfigFile();
  const lf = Buffer.from(bytes.toString("utf8").replace(/\r\n/g, "\n"));
  const text = lf.toString("utf8");
  assert.ok(!text.includes(sha256Hex(lf)) && !text.includes(gitBlobSha(lf)), "a file cannot pin its own digest");
  assert.ok(!parsed.workflow.trustedFiles.includes(TRUSTED_CONFIG_PATH));
  assert.ok(!text.includes("sourceRevision"), "the identity lives in the receipt, not in the configuration");
  assert.equal(TRUSTED_CONFIG_PATH, "governance/gates/plan-approval.json");
  assert.equal(sameConfigBytes(bytes, lf), true);
  // the PR documents (the nine plans) never include the configuration
  for (const d of parsed.scopes[SCOPE].documents) assert.notEqual(d, TRUSTED_CONFIG_PATH);
  assert.equal(sameConfigBytes(Buffer.from("a\r\nb"), Buffer.from("a\nb")), true);
  assert.equal(sameConfigBytes(Buffer.from("a\nb"), Buffer.from("a\r\nb")), false);
  assert.equal(sameConfigBytes(Buffer.from("a"), Buffer.from("b")), false);
  assert.equal(sameConfigBytes("a", Buffer.from("a")), false);
  assert.equal(sameConfigBytes(null, Buffer.from("a")), false);
});

test("G6 issuing side: the configuration in use must be exactly main's at the run commit, and main must not have moved it", () => {
  assert.deepEqual(evaluateConfigSource(config, cfgSource()), []);
  const f = (src, cfg = config) => codes(evaluateConfigSource(cfg, src));
  const tampered = Buffer.from(JSON.stringify({ ...config, reviewer: { ...config.reviewer, login: "someone-else" } }));
  assert.ok(f({ ...cfgSource(), local: tampered }).includes("CONFIG_NOT_FROM_REVISION"));       // local worktree edited
  assert.ok(f({ ...cfgSource(), local: tampered }).includes("CONFIG_OBJECT_MISMATCH"));         // and the object in use is not what main holds
  assert.ok(f(cfgSource(tampered)).includes("CONFIG_NOT_FROM_REVISION"));                       // main holds something else
  assert.ok(f({ ...cfgSource(), remote: { bytes: CONFIG_BYTES, blobSha: "0".repeat(40) } }).includes("CONFIG_BLOB_MISMATCH"));
  assert.ok(f({ ...cfgSource(), tip: { sha: TIP, blobSha: "9".repeat(40) } }).includes("CONFIG_CHANGED"));
  assert.ok(f({ ...cfgSource(), tip: null }).includes("CONFIG_TIP_UNREADABLE"));
  assert.ok(f({ ...cfgSource(), tip: { sha: "not-a-sha", blobSha: CONFIG_ID.gitBlobSha } }).includes("CONFIG_TIP_UNREADABLE"));
  assert.ok(f({ ...cfgSource(), local: null }).includes("CONFIG_UNREADABLE"));
  assert.ok(f({ ...cfgSource(), local: Buffer.alloc(0) }).includes("CONFIG_UNREADABLE"));
  assert.ok(f({ ...cfgSource(), remote: null }).includes("CONFIG_UNREADABLE"));
  assert.ok(f({ ...cfgSource(), remote: { bytes: "text", blobSha: CONFIG_ID.gitBlobSha } }).includes("CONFIG_UNREADABLE"));
  assert.ok(f(undefined).includes("CONFIG_UNREADABLE"));
  assert.ok(f({ ...cfgSource(), local: Buffer.from("{ not json") }).includes("EVIDENCE_MALFORMED"));
  assert.ok(f(cfgSource(), { ...config, repository: { ...config.repository, id: 5 } }).includes("CONFIG_OBJECT_MISMATCH"));
  // a Windows checkout (CRLF) of the same configuration is the same configuration
  const lf = Buffer.from(JSON.stringify(config, null, 2) + "\n");
  assert.deepEqual(evaluateConfigSource(config, { local: Buffer.from(lf.toString().replace(/\n/g, "\r\n")), remote: { bytes: lf, blobSha: gitBlobSha(lf) }, tip: { sha: TIP, blobSha: gitBlobSha(lf) } }), []);
  // through the whole request/approval pipeline
  blockedApproval("CONFIG_NOT_FROM_REVISION", (x) => { x.configSource.local = tampered; });
  blockedApproval("CONFIG_CHANGED", (x) => { x.configSource.tip.blobSha = "9".repeat(40); });
  blockedApproval("CONFIG_UNREADABLE", (x) => { delete x.configSource; });
  assert.throws(() => buildReceipt(config, { ...approvedFacts(), configSource: { ...cfgSource(), tip: null } }, { approvalObservedAt: OBSERVED, generatedAt: GENERATED }), /BLOCKED/);
});

test("G6 consumer side: manipulated, changed, moved, foreign and historical configurations are BLOCKED", () => {
  const altered = Buffer.from(JSON.stringify({ ...config, workflow: { ...config.workflow, trustedRevisions: [...config.workflow.trustedRevisions, { id: "rev-evil", files: { ...FILES } }] } }));
  blockedProvenance("CONFIG_CHANGED", ({ live }) => { live.trustedConfig = liveConfig(altered); });                 // main now holds another configuration
  blockedProvenance("CONFIG_AT_REVISION_MISMATCH", ({ live }) => { live.trustedConfig = liveConfig(altered); });
  blockedProvenance("CONFIG_NOT_TRUSTED_SOURCE", ({ live }) => { live.trustedConfig = liveConfig(altered); });       // the config in use is not main's
  blockedProvenance("CONFIG_CHANGED", ({ live }) => { live.trustedConfig.atTip = { bytes: altered, blobSha: gitBlobSha(altered) }; });
  blockedProvenance("CONFIG_AT_REVISION_MISMATCH", ({ live }) => { live.trustedConfig.atSource = { bytes: altered, blobSha: gitBlobSha(altered) }; }); // historical configuration
  blockedProvenance("CONFIG_NOT_TRUSTED_SOURCE", () => {}, { ...config, environment: { ...config.environment, preventSelfReview: false } }); // a PR / worktree config handed in
  blockedProvenance("CONFIG_NOT_TRUSTED_SOURCE", () => {}, { ...config, reviewer: { ...config.reviewer, id: 1 } });
  blockedProvenance("CONFIG_BLOB_MISMATCH", ({ live }) => { live.trustedConfig.atTip.blobSha = "0".repeat(40); });
  blockedProvenance("CONFIG_BLOB_MISMATCH", ({ live }) => { live.trustedConfig.atSource.blobSha = "0".repeat(40); });
  blockedProvenance("CONFIG_TIP_MOVED", ({ live }) => { live.trustedConfig.tipRecheck = { sha: "f".repeat(40) }; });
  blockedProvenance("CONFIG_REPO_MISMATCH", ({ live }) => { live.trustedConfig.repository = { id: 999, fullName: config.repository.fullName }; });
  blockedProvenance("CONFIG_REPO_MISMATCH", ({ live }) => { live.trustedConfig.repository = { id: config.repository.id, fullName: "attacker/ai-native" }; });
  blockedProvenance("CONFIG_REPO_MISMATCH", ({ live }) => { live.expected.repositoryId = 999; });
  for (const ancestry of ["diverged", "behind", "unknown", null, undefined]) {
    blockedProvenance("CONFIG_REVISION_NOT_ON_MAIN", ({ live }) => { live.trustedConfig.ancestry = ancestry; });
  }
  // unreadable / missing pieces: no non-circular root of trust => BLOCKED
  for (const k of ["atTip", "atSource"]) {
    blockedProvenance("CONFIG_UNREADABLE", ({ live }) => { live.trustedConfig[k] = null; });
    blockedProvenance("CONFIG_UNREADABLE", ({ live }) => { live.trustedConfig[k] = { bytes: "text", blobSha: CONFIG_ID.gitBlobSha }; });
    blockedProvenance("CONFIG_UNREADABLE", ({ live }) => { live.trustedConfig[k] = { bytes: Buffer.alloc(0), blobSha: CONFIG_ID.gitBlobSha }; });
  }
  blockedProvenance("CONFIG_UNREADABLE", ({ live }) => { live.trustedConfig.tip = undefined; });
  blockedProvenance("CONFIG_UNREADABLE", ({ live }) => { live.trustedConfig.tipRecheck = { sha: "x" }; });
  blockedProvenance("CONFIG_UNREADABLE", ({ live }) => { live.trustedConfig.repository = undefined; });
  assert.deepEqual(evaluateTrustedConfig(config, goodReceipt(), liveConfig(), { repositoryId: config.repository.id }), []);
});

test("G6 consumer side: a receipt that forges its own configuration identity is BLOCKED", () => {
  const forge = (patchTc) => ({ receipt }) => ({ ...receipt, trustedConfig: { ...receipt.trustedConfig, ...patchTc } });
  blockedProvenance("CONFIG_CHANGED", forge({ sha256: "2".repeat(64) }));
  blockedProvenance("CONFIG_CHANGED", forge({ gitBlobSha: "3".repeat(40) }));
  blockedProvenance("ARTIFACT_TAMPERED", forge({ sha256: "2".repeat(64) }));                    // the run's own artifact says otherwise
  blockedProvenance("CONFIG_SOURCE_NOT_RUN_COMMIT", forge({ sourceRevision: "1".repeat(40) }));
  blockedProvenance("CONFIG_REPO_MISMATCH", forge({ repositoryId: 5 }));
  blockedProvenance("CONFIG_RUN_MISMATCH", forge({ workflowRunId: 5 }));
  blockedProvenance("RECEIPT_SCHEMA", forge({ path: "governance/gates/other.json" }));
  blockedProvenance("RECEIPT_SCHEMA", forge({ extra: 1 }));
  blockedProvenance("RECEIPT_SCHEMA", ({ receipt }) => { const { trustedConfig, ...rest } = receipt; return rest; });
});

test("G6 verifyFromGitHub recovers the configuration from the tip of main and IGNORES any configuration handed to it", () => {
  const r = goodReceipt();
  assert.equal(verifyWith(r).status, "PASS", JSON.stringify(verifyWith(r).findings));
  // a weakened config passed as a parameter is not an input: the result is the same PASS, from main's configuration
  const weak = { ...config, environment: { ...config.environment, preventSelfReview: false, canAdminsBypass: true }, reviewer: { ...config.reviewer, id: 1 } };
  const res = verifyFromGitHub({ api: fakeApi({ receipt: r }), download: () => zipOf(r), config: weak, schema, receipt: r, expected: { scopeId: SCOPE, repositoryId: config.repository.id, pullRequestNumber: 168, headSha: HEAD }, now: NOW, repo: REPO });
  assert.equal(res.status, "PASS");
  // main holds another configuration (manipulated after the approval): BLOCKED
  const altered = Buffer.from(JSON.stringify({ ...config, note: "changed after the approval" }));
  assert.ok(codes(verifyWith(r, { cfgAtTip: altered }).findings).includes("CONFIG_CHANGED"));
  const weakAtTip = Buffer.from(JSON.stringify({ ...config, environment: { ...config.environment, preventSelfReview: false } }));
  assert.ok(codes(verifyWith(r, { cfgAtTip: weakAtTip }).findings).includes("CONFIG_CHANGED"));
  // the configuration at the receipt's revision is not what the receipt recorded (historical / unknown revision)
  assert.ok(codes(verifyWith(r, { cfgAtMain: altered }).findings).includes("CONFIG_AT_REVISION_MISMATCH"));
});

test("G6/G7 verifyFromGitHub: no recoverable trusted configuration => BLOCKED with nothing else evaluated", () => {
  const r = goodReceipt();
  const cfgPath = (ref) => `repos/${REPO}/contents/${encodePath(TRUSTED_CONFIG_PATH)}?ref=${ref}`;
  const only = (out) => { assert.equal(out.status, "BLOCKED"); assert.deepEqual(codes(out.findings), ["CONFIG_UNREADABLE"]); };
  only(verifyWith(r, { fail: [cfgPath(TIP)] }));
  only(verifyWith(r, { fail: [`repos/${REPO}/git/ref/heads/main`] }));
  only(verifyWith(r, { fail: [`repos/${REPO}`] }));
  only(verifyWith(r, { cfgAtTip: Buffer.from("{ not json") }));
  only(verifyWith(r, { cfgAtTip: Buffer.from("[]") }));
  only(verifyWith(r, { cfgAtTip: Buffer.from([0xff, 0xfe, 0x7b, 0x7d]) }));
  only(verifyWith(r, { override: { [`repos/${REPO}/git/ref/heads/main`]: () => ({ object: { type: "tag", sha: TIP } }) } }));
  only(verifyWith(r, { override: { [`repos/${REPO}/git/ref/heads/main`]: () => ({ object: { type: "commit", sha: "not-a-sha" } }) } }));
  only(verifyWith(r, { override: { [cfgPath(TIP)]: () => ({ type: "dir" }) } }));
  only(verifyWith(r, { override: { [cfgPath(TIP)]: () => ({ type: "file", encoding: "none", content: "", size: 0, sha: CONFIG_ID.gitBlobSha }) } }));
  only(verifyWith(r, { override: { [cfgPath(TIP)]: () => ({ type: "file", encoding: "base64", content: CONFIG_BYTES.toString("base64"), size: CONFIG_BYTES.length + 1, sha: CONFIG_ID.gitBlobSha }) } }));
  const seen = [];
  const out = verifyFromGitHub({ api: (p) => { seen.push(p); return fakeApi({ receipt: r })(p); }, download: () => zipOf(r), schema, receipt: r, expected: { scopeId: SCOPE, repositoryId: config.repository.id, pullRequestNumber: 168, headSha: HEAD }, now: NOW, repo: "../x" });
  only(out);
  assert.deepEqual(seen, [], "a hostile repository locator never reaches the API");
});

test("G6 verifyFromGitHub: repository mismatch, a tip that moves, and hostile receipt fields never pass or reach an API path", () => {
  const r = goodReceipt();
  assert.ok(codes(verifyWith(r, { override: { [`repos/${REPO}`]: () => ({ id: 999, full_name: REPO }) } }).findings).includes("CONFIG_REPO_MISMATCH"));
  assert.ok(codes(verifyWith(r, { override: { [`repos/${REPO}`]: () => ({ id: config.repository.id, full_name: "someone/else" }) } }).findings).includes("CONFIG_REPO_MISMATCH"));
  let n = 0;
  const moving = () => ({ ref: "refs/heads/main", object: { type: "commit", sha: n++ === 0 ? TIP : "d".repeat(40) } });
  assert.ok(codes(verifyWith(r, { override: { [`repos/${REPO}/git/ref/heads/main`]: moving } }).findings).includes("CONFIG_TIP_MOVED"));
  for (const bad of [{ sourceRevision: "../../x" }, { sourceRevision: "main" }, { sourceRevision: `${MAIN}/../x` }]) {
    const seen = [];
    const hostile = { ...r, trustedConfig: { ...r.trustedConfig, ...bad } };
    const api = fakeApi({ receipt: r });
    const out = verifyFromGitHub({ api: (p) => { seen.push(p); return api(p); }, download: () => zipOf(r), schema, receipt: hostile, expected: { scopeId: SCOPE, repositoryId: config.repository.id, pullRequestNumber: 168, headSha: HEAD }, now: NOW, repo: REPO });
    assert.equal(out.status, "BLOCKED");
    assert.ok(codes(out.findings).includes("EVIDENCE_MALFORMED"), JSON.stringify(bad));
    assert.ok(seen.every((p) => !p.includes("..") && !p.includes("ref=main")), "no hostile receipt field reaches an API path");
  }
  for (const bad of [{ pullRequestNumber: "168/../x" }, { pullRequestNumber: 0 }, { workflowRunId: "1" }]) {
    const seen = [];
    const api = fakeApi({ receipt: r });
    const out = verifyFromGitHub({ api: (p) => { seen.push(p); return api(p); }, download: () => zipOf(r), schema, receipt: { ...r, ...bad }, expected: { scopeId: SCOPE, repositoryId: config.repository.id, pullRequestNumber: 168, headSha: HEAD }, now: NOW, repo: REPO });
    assert.equal(out.status, "BLOCKED");
    assert.ok(seen.every((p) => !p.includes("..")), JSON.stringify(bad));
  }
});

test("G6 readConfigAt only reads a commit id: any other ref never reaches the API", () => {
  const seen = [];
  const api = (p) => { seen.push(p); return fakeApi()(p); };
  for (const ref of ["main", "../x", "HEAD", "refs/heads/main", MAIN.toUpperCase(), `${MAIN}/../x`, "", undefined, null, 5, "a".repeat(39), "a".repeat(41)]) assert.equal(readConfigAt(api, REPO, ref), null, String(ref));
  assert.deepEqual(seen, []);
  const ok = readConfigAt(api, REPO, MAIN);
  assert.deepEqual(ok.bytes, CONFIG_BYTES);
  assert.equal(ok.blobSha, CONFIG_ID.gitBlobSha);
  assert.equal(seen.length, 1);
});

test("G6 CLI: a local checkout that differs from main is BLOCKED (never preferred); trusted-config prints the identity of main's configuration", () => {
  const dir = mkdtempSync(join(tmpdir(), "par-cfg-"));
  const quiet = console.log;
  const lines = [];
  console.log = (l) => lines.push(String(l));
  try {
    const r = goodReceipt();
    const file = join(dir, "receipt.json");
    writeFileSync(file, JSON.stringify(r));
    const opts = { api: fakeApi({ receipt: r }), download: () => zipOf(r), config, now: () => NOW, args: [file, SCOPE, "168", HEAD] };
    assert.equal(run("verify", opts), 0);
    assert.equal(run("verify", { ...opts, configBytes: Buffer.from(JSON.stringify({ ...config, extra: 1 })) }), 1);
    assert.ok(lines.some((l) => l.includes("CONFIG_LOCAL_DIFFERS")));

    lines.length = 0;
    assert.equal(run("trusted-config", { api: fakeApi(), config }), 0);
    const printed = JSON.parse(lines.find((l) => l.startsWith("{")));
    assert.deepEqual(printed, { path: TRUSTED_CONFIG_PATH, sourceRevision: TIP, gitBlobSha: CONFIG_ID.gitBlobSha, sha256: CONFIG_ID.sha256, repositoryId: config.repository.id, repositoryFullName: config.repository.fullName });
    assert.equal(run("trusted-config", { api: fakeApi(), config, configBytes: Buffer.from("{}") }), 1);
    assert.equal(run("trusted-config", { api: fakeApi({ fail: [`repos/${REPO}/git/ref/heads/main`] }), config }), 1);
    assert.equal(run("trusted-config", { api: () => { throw new Error("offline"); }, config }), 1);
  } finally {
    console.log = quiet;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("G6 request/issue: a configuration edited in the checkout, or changed on main while the run waits, blocks the run (exit 1, no receipt)", () => {
  const dir = mkdtempSync(join(tmpdir(), "par-cfgrun-"));
  const quiet = console.log;
  console.log = () => {};
  try {
    const env = { ...baseEnv(), GITHUB_OUTPUT: join(dir, "output.txt") };
    const edited = Buffer.from(JSON.stringify({ ...config, reviewer: { ...config.reviewer, login: "someone-else" } }));
    assert.equal(run("request", { api: fakeApi(), env, config, outDir: join(dir, "a") }), 0);
    assert.equal(run("request", { api: fakeApi(), env, config, configBytes: edited, outDir: join(dir, "b") }), 1);       // local differs from main
    assert.equal(run("request", { api: fakeApi({ cfgAtTip: edited }), env, config, outDir: join(dir, "c") }), 1);          // main moved the file after the run commit
    assert.equal(run("request", { api: fakeApi({ cfgAtMain: edited }), env, config, outDir: join(dir, "d") }), 1);         // main at the run commit holds something else
    assert.equal(run("request", { api: fakeApi({ fail: [`repos/${REPO}/git/ref/heads/main`] }), env, config, outDir: join(dir, "e") }), 1);
    assert.deepEqual(readdirSync(dir).filter((n) => ["b", "c", "d", "e"].includes(n)), []);
  } finally {
    console.log = quiet;
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------- G9: binding and TOCTOU contract of the future consumer
test("G9 binding: frozen, carries SHA, fingerprint, run, workflow revision and configuration identity; reusable while the identity is unchanged", () => {
  const r = goodReceipt();
  const a = verifyReceiptProvenance({ receipt: r, schema, config, live: liveFor(r) });
  assert.equal(a.status, "PASS", JSON.stringify(a.findings));
  assert.ok(Object.isFrozen(a.binding));
  assert.throws(() => { a.binding.headSHA = "c".repeat(40); }, TypeError);
  assert.throws(() => { a.binding.trustedConfigSha256 = "0".repeat(64); }, TypeError);
  assert.equal(a.binding.trustedConfigSha256, CONFIG_ID.sha256);
  assert.equal(a.binding.trustedConfigBlobSha, CONFIG_ID.gitBlobSha);
  assert.equal(a.binding.trustedConfigSourceRevision, MAIN);
  assert.equal(a.binding.mainTipSha, TIP);
  // later: main advanced (unrelated commits), time passed: the identity is the same, the observations are not
  const live = liveFor(r);
  live.now = "2026-11-20T09:00:00Z";
  live.trustedConfig.tip = { sha: "d".repeat(40) };
  live.trustedConfig.tipRecheck = { sha: "d".repeat(40) };
  const b = verifyReceiptProvenance({ receipt: r, schema, config, live });
  assert.equal(b.status, "PASS", JSON.stringify(b.findings));
  assert.notEqual(b.binding.mainTipSha, a.binding.mainTipSha);
  assert.notEqual(b.binding.verifiedAt, a.binding.verifiedAt);
  assert.deepEqual(evaluateBinding(a.binding, b.binding), []);
});

test("G9 binding: a changed SHA (or any identity field) invalidates it; incomplete or malformed bindings are BLOCKED", () => {
  const r = goodReceipt();
  const a = verifyReceiptProvenance({ receipt: r, schema, config, live: liveFor(r) });
  const ids = ["scopeId", "repositoryId", "pullRequestNumber", "headSHA", "planSetFingerprint", "workflowRunId", "workflowRevisionId", "trustedConfigSha256", "trustedConfigBlobSha", "trustedConfigSourceRevision"];
  for (const k of ids) {
    // the "other" value must itself be a VALID value of the field: a malformed one is rejected before any comparison (G12)
    const v = a.binding[k];
    const other = typeof v === "number" ? v + 1 : /^[0-9a-f]+$/.test(v) ? (v[0] === "f" ? "0" : "f") + v.slice(1) : `${v}-changed`;
    const changed = { ...a.binding, [k]: other };
    const f = evaluateBinding(a.binding, changed);
    assert.deepEqual(codes(f), ["BINDING_CHANGED"], k);
    assert.match(f[0].detail, new RegExp(k));
  }
  assert.deepEqual(codes(evaluateBinding(a.binding, { ...a.binding, headSHA: "c".repeat(40) })), ["BINDING_CHANGED"]);
  for (const bad of [null, undefined, {}, "x", 5, [], { ...a.binding, headSHA: undefined }, { ...a.binding, planSetFingerprint: null }, { ...a.binding, workflowRevisionId: null }]) {
    assert.ok(codes(evaluateBinding(bad, a.binding)).includes("BINDING_INCOMPLETE"), JSON.stringify(bad));
    assert.ok(codes(evaluateBinding(a.binding, bad)).includes("BINDING_INCOMPLETE"), JSON.stringify(bad));
  }
  // the real verification path: the PR head moved => no PASS, no binding at all
  const live = liveFor(r);
  live.pr.headSha = "c".repeat(40);
  live.prRecheck.headSha = "c".repeat(40);
  const moved = verifyReceiptProvenance({ receipt: r, schema, config, live });
  assert.equal(moved.status, "BLOCKED");
  assert.ok(codes(moved.findings).includes("HEAD_CHANGED"));
  assert.equal(moved.binding, undefined);
});

test("G9 the Coordinator contract document exists, lists every required piece of evidence and does not claim TOCTOU is solved", () => {
  const doc = read("governance/security/PLAN-APPROVAL-COORDINATOR-CONTRACT.md");
  for (const k of REQUIRED_EVIDENCE) assert.ok(doc.includes(`\`live.${k}\``), `contract does not list live.${k}`);
  assert.match(doc, /TOCTOU end-to-end: NO RESUELTO/);
  assert.match(doc, /NO está implementado/);
  assert.match(doc, /BLOCKED/);
  for (const cond of ["Repository ID", "Head SHA", "Environment", "binding", "evaluateBinding", "sin ceremonia por tarea"]) assert.ok(doc.includes(cond), cond);
  const main = read("governance/security/PLAN-APPROVAL-RECEIPT.md");
  assert.match(main, /TOCTOU end-to-end: NO RESUELTO/);
});

// ---------- G10: fail-closed isolation probe
const GH_JSON = JSON.stringify({ hosts: { "github.com": [{ state: "success", active: true, host: "github.com", login: "jlbellonGmail", tokenSource: "keyring", scopes: "repo, workflow", gitProtocol: "https" }] } });
const CMDKEY_EN = "\nCurrently stored credentials:\n\n    Target: LegacyGeneric:target=git:https://github.com\n    Type: Generic\n    User: PersonalAccessToken\n    Saved for this logon only\n\n    Target: LegacyGeneric:target=other-app\n    Type: Generic\n    User: someone\n    Local machine persistence\n\n";
const CMDKEY_ES = "\r\nCredenciales almacenadas en la actualidad:\r\n\r\n    Destino: LegacyGeneric:target=git:https://github.com\r\n    Tipo: Gen�rica\r\n    Usuario: PersonalAccessToken\r\n    Persistencia del equipo local\r\n\r\n";
const CMDKEY_ZH = "\n当前存储的凭据：\n\n    目标：LegacyGeneric:target=git:https://github.com\n    类型：通用\n\n";
const probeWith = (gh, cmdkey, extra = {}) => collectIsolationProbe({ env: {}, platform: "win32", spawn: (cmd) => (cmd === "gh" ? gh : cmdkey), ...extra });
const NONE = { status: 0, stdout: "\nCurrently stored credentials:\n\n* NONE *\n\n" };
const BLOCKED_UNKNOWN = (probe) => {
  const f = evaluateAgentIsolation(config, probe);
  assert.ok(codes(f).includes("AGENT_PROBE_UNAVAILABLE"), JSON.stringify(probe));
  assert.ok(f.some((x) => x.code === "AGENT_PROBE_UNAVAILABLE" && /^UNKNOWN/.test(x.detail)));
  assert.equal(verdict(f).status, "BLOCKED");
};

test("G10 gh accounts come from gh's machine-readable output (names only); the empty state is gh's real output", () => {
  const p = probeWith({ status: 0, stdout: GH_JSON }, NONE);
  assert.deepEqual(p.ghAccounts, [{ host: "github.com", login: "jlbellonGmail" }]);
  assert.ok(!JSON.stringify(p).match(/keyring|repo, workflow|scopes|tokenSource/), "only host and login are kept");
  // captured from `gh auth status --json hosts` with an empty GH_CONFIG_DIR (stdout), 2026-10-30
  const empty = probeWith({ status: 0, stdout: '{"hosts":{}}\n', stderr: "You are not logged into any GitHub hosts. To log in, run: gh auth login\n\n" }, NONE);
  assert.deepEqual(empty.ghAccounts, []);
  assert.deepEqual(evaluateAgentIsolation(config, empty), []);
  assert.deepEqual(probeWith({ status: 0, stdout: JSON.stringify({ hosts: { "github.com": [{ login: "a", state: "error" }], "ghe.example": [{ login: "b" }] } }) }, NONE).ghAccounts, [{ host: "github.com", login: "a" }, { host: "ghe.example", login: "b" }]);
  // gh not installed (ENOENT) is NOT "no accounts": it is UNKNOWN (G12)
  assert.equal(probeWith({ error: { code: "ENOENT" } }, NONE).ghAccounts, null);
  // a broken token is still an account in the keyring of the agent profile
  const broken = probeWith({ status: 0, stdout: JSON.stringify({ hosts: { "github.com": [{ login: "jlbellonGmail", state: "error" }] } }) }, NONE);
  assert.ok(codes(evaluateAgentIsolation(config, broken)).includes("AGENT_HUMAN_GH_ACCOUNT"));
});

test("G10 every UNRECOGNISED gh outcome is UNKNOWN (null) => BLOCKED, never an empty account list", () => {
  const unknown = [
    { status: 0, stdout: "github.com\n  Logged in to github.com account jlbellonGmail (keyring)\n" },   // text mode, not JSON
    { status: 0, stdout: "" }, { status: 0 }, { status: 0, stdout: "not json" }, { status: 0, stdout: "{}" }, { status: 0, stdout: "[]" }, { status: 0, stdout: "null" },
    { status: 0, stdout: '{"hosts":null}' }, { status: 0, stdout: '{"hosts":[]}' }, { status: 0, stdout: '{"hosts":"x"}' }, { status: 0, stdout: '{"hosts":{"github.com":{}}}' },
    { status: 0, stdout: '{"hosts":{"github.com":[{"state":"error"}]}}' }, { status: 0, stdout: '{"hosts":{"github.com":[{"login":""}]}}' },
    { status: 0, stdout: '{"hosts":{"github.com":[null]}}' }, { status: 0, stdout: '{"hosts":{"github.com":[{"login":7}]}}' },
    { status: 1, stdout: "", stderr: "You are not logged into any GitHub hosts. To log in, run: gh auth login" },      // the OLD code read this as "no accounts"
    { status: 1, stdout: "", stderr: "network down" }, { status: 2, stdout: '{"hosts":{}}' }, { status: null, stdout: "" },
    { status: 0, stdout: '{"hosts":{}}', signal: "SIGTERM" }, { status: null, signal: "SIGKILL", stdout: "" },
    { error: { code: "ETIMEDOUT" } }, { error: { code: "EPERM" } }, { error: new Error("spawn failed") }, { error: { code: "ENOENT_BUT_NOT" } },
  ];
  for (const gh of unknown) {
    const p = probeWith(gh, NONE);
    assert.equal(p.ghAccounts, null, JSON.stringify(gh));
    BLOCKED_UNKNOWN(p);
  }
});

test("G10 cmdkey: the English and Spanish listings (strings read from cmdkey.exe.mui) are recognised, targets only", () => {
  assert.deepEqual(probeWith({ status: 0, stdout: '{"hosts":{}}' }, { status: 0, stdout: CMDKEY_EN }).credentialTargets, ["LegacyGeneric:target=git:https://github.com"]);
  assert.deepEqual(probeWith({ status: 0, stdout: '{"hosts":{}}' }, { status: 0, stdout: CMDKEY_ES }).credentialTargets, ["LegacyGeneric:target=git:https://github.com"]);
  // a language whose cmdkey.exe.mui was not read is never guessed: UNKNOWN (G12)
  assert.equal(probeWith({ status: 0, stdout: '{"hosts":{}}' }, { status: 0, stdout: CMDKEY_ZH }).credentialTargets, null);
  for (const none of ["\nCurrently stored credentials:\n\n* NONE *\n\n", "\r\nCredenciales almacenadas en la actualidad:\r\n\r\n* NINGUNO *\r\n\r\n"]) {
    assert.deepEqual(probeWith({ status: 0, stdout: '{"hosts":{}}' }, { status: 0, stdout: none }).credentialTargets, []);
  }
  // a stored credential that merely mentions github in another field is reported by its TARGET name; nothing else is kept
  const userField = "\nCurrently stored credentials:\n\n    Target: LegacyGeneric:target=some-app\n    Type: Generic\n    User: github-user\n    Password: ghp_SECRETSECRETSECRET\n\n";
  const p = probeWith({ status: 0, stdout: '{"hosts":{}}' }, { status: 0, stdout: userField });
  assert.deepEqual(p.credentialTargets, ["LegacyGeneric:target=some-app"]);
  assert.ok(!JSON.stringify(p).includes("ghp_") && !JSON.stringify(p).includes("github-user"));
  assert.deepEqual(probeWith({ status: 0, stdout: '{"hosts":{}}' }, { status: 0, stdout: CMDKEY_EN.replace(/github/g, "gitlab") }).credentialTargets, []);
  assert.equal(probeWith({ status: 0, stdout: '{"hosts":{}}' }, { status: 0, stdout: CMDKEY_EN }, { platform: "linux" }).credentialTargets, null);
});

test("G10 every UNRECOGNISED cmdkey outcome is UNKNOWN (null) => BLOCKED", () => {
  const unknown = [
    { status: 0, stdout: "" }, { status: 0 }, { status: 0, stdout: "garbage" }, { status: 0, stdout: "\n\n\n" },
    { status: 0, stdout: "Currently stored credentials:\n\n" },                                         // header without the empty marker or any credential
    { status: 0, stdout: "Target LegacyGeneric:target=git:https://github.com\nType Generic\n" },       // no label separator
    { status: 0, stdout: "Currently stored credentials:\n\n    Target: a\n    Type\n" },               // a line that is not label: value
    { status: 0, stdout: "Currently stored credentials:\n\n    Target: a\n" },                           // a one-line block that is not the marker
    { status: 0, stdout: "Credentials:\nTarget: x\nType: y\n" },                                        // no blank line after the header
    { status: 1, stdout: CMDKEY_EN }, { status: 5, stdout: "" }, { status: null, stdout: CMDKEY_EN }, { status: 0, stdout: CMDKEY_EN, signal: "SIGTERM" },
    { error: { code: "ENOENT" } }, { error: { code: "ETIMEDOUT" } }, { status: 0, stdout: Buffer.from(CMDKEY_EN) },
  ];
  for (const c of unknown) {
    const p = probeWith({ status: 0, stdout: '{"hosts":{}}' }, c);
    assert.equal(p.credentialTargets, null, JSON.stringify(c));
    BLOCKED_UNKNOWN(p);
  }
});

test("G10 evaluateAgentIsolation: malformed or missing probe shapes are UNKNOWN, never PASS; findings carry names only", () => {
  for (const bad of [null, undefined, "x", 5, [], {}, { tokenEnvNames: "GH_TOKEN", ghAccounts: [], credentialTargets: [] }, { tokenEnvNames: [1], ghAccounts: [], credentialTargets: [] },
    { ...cleanProbe(), ghAccounts: [{ host: "github.com" }] }, { ...cleanProbe(), ghAccounts: [{ host: "github.com", login: "" }] }, { ...cleanProbe(), ghAccounts: [null] }, { ...cleanProbe(), ghAccounts: [{ login: "x" }] },
    { ...cleanProbe(), credentialTargets: [1] }, { ...cleanProbe(), credentialTargets: "none" }, { ...cleanProbe(), tokenEnvNames: undefined }]) BLOCKED_UNKNOWN(bad);
  const f = evaluateAgentIsolation(config, { tokenEnvNames: ["GH_TOKEN"], ghAccounts: [{ host: "github.com", login: "jlbellonGmail" }], credentialTargets: ["git:https://github.com"] });
  assert.deepEqual(codes(f).sort(), ["AGENT_GIT_CREDENTIAL", "AGENT_HUMAN_GH_ACCOUNT", "AGENT_TOKEN_IN_ENV"]);
});

test("G10 check-agent-isolation: UNKNOWN exits 1, never prints values, and the report states what a PASS does and does not mean", () => {
  const lines = [];
  const quiet = console.log;
  console.log = (l) => lines.push(String(l));
  try {
    assert.equal(run("check-agent-isolation", { config, probe: () => ({ ...cleanProbe(), ghAccounts: null }) }), 1);
    assert.equal(run("check-agent-isolation", { config, probe: () => ({ tokenEnvNames: ["GH_TOKEN"], ghAccounts: [], credentialTargets: [] }) }), 1);
    assert.equal(run("check-agent-isolation", { config, probe: () => cleanProbe() }), 0);
    // a probe built from hostile process output never leaks it
    const p = probeWith({ status: 0, stdout: GH_JSON.replace("keyring", "gho_FAKETOKENVALUE") }, { status: 0, stdout: CMDKEY_EN.replace("PersonalAccessToken", "ghp_FAKETOKENVALUE") });
    assert.equal(run("check-agent-isolation", { config, probe: () => p }), 1);
  } finally {
    console.log = quiet;
  }
  assert.ok(lines.some((l) => l.includes("UNKNOWN")));
  assert.ok(lines.every((l) => !/gho_|ghp_|FAKETOKEN/.test(l)), "no token-like value is ever printed");
  for (const f of ["governance/security/PLAN-APPROVAL-RECEIPT.md", "governance/security/AGENT-HUMAN-IDENTITY-SEPARATION.md"]) assert.ok(read(f).includes("DETECCIÓN NO ES AISLAMIENTO"), f);
  assert.match(read("runtime/gates/plan-approval-receipt.mjs"), /DETECTION IS NOT ISOLATION/);
  assert.match(read("runtime/gates/plan-approval.mjs"), /DETECTION IS NOT ISOLATION/);
});

test("G10 the probe source reads no secret: no token flag, no credential value, no ACL, user or WSL change", () => {
  const src = read("runtime/gates/plan-approval.mjs");
  assert.doesNotMatch(src, /--show-token|\bauth token\b|\bcmdkey\b.*\/(add|delete|generic)|icacls|net user|wsl\b.*--(unregister|import)|Set-Acl|New-LocalUser/i);
  assert.match(src, /"auth", "status", "--json", "hosts"/);
});

// ---------- G11: Actions: write evaluation is documented against the official permission table
test("G11 Actions: write is evaluated per operation, with alternatives, blast radius and no unproven claim about repository_dispatch", () => {
  const doc = read("governance/security/PLAN-APPROVAL-RECEIPT.md");
  for (const needle of [
    "Create workflow dispatch event", "Actions: write", "Actions: read", "Contents: write", "Deployments: write",
    "repository_dispatch", "workflow_dispatch", "Cancel workflow run", "Force cancel", "Re-run workflow", "Delete artifact", "Delete workflow run", "Download artifact",
    "pilot.yml", "blast radius", "Environments", "Administration",
  ]) assert.ok(doc.toLowerCase().includes(needle.toLowerCase()), `Actions: write evaluation lacks '${needle}'`);
  assert.doesNotMatch(doc, /repository_dispatch[^\n]*(menos privilegi|less privilege)/i);
});

// ---------- G12: fourth remediation. UNKNOWN / ERROR / MALFORMED => BLOCKED, through the whole flow (probe -> verdict)
// Every case below goes from the (mocked) process output of gh / cmdkey, through collectIsolationProbe, to evaluateAgentIsolation
// and verdict: the assertion is on the FINAL status, never only on the parser.
const flow = (gh, cmdkey, extra = {}) => {
  const probe = probeWith(gh, cmdkey, extra);
  const findings = evaluateAgentIsolation(config, probe);
  return { probe, findings, status: verdict(findings).status };
};
const GH_EMPTY = { status: 0, stdout: '{"hosts":{}}\n' };
const CMDKEY_NONE_ES = { status: 0, stdout: "\r\nCredenciales almacenadas en la actualidad:\r\n\r\n* NINGUNO *\r\n" };
const causeOf = (f, key) => f.find((x) => x.code === "AGENT_PROBE_UNAVAILABLE" && x.detail.includes(key))?.detail ?? "";

test("G12 reproduction 1 (Codex): gh missing (ENOENT) with every other signal empty is BLOCKED, not an empty account list", () => {
  const r = flow({ error: Object.assign(new Error("spawn gh ENOENT"), { code: "ENOENT" }) }, NONE);
  assert.equal(r.probe.ghAccounts, null);
  assert.notDeepEqual(r.probe.ghAccounts, []);
  assert.equal(r.status, "BLOCKED");
  assert.match(causeOf(r.findings, "gh account"), /^UNKNOWN: gh account state could not be determined \[gh-not-found\]$/);
  // the same facts with a gh that ran and found nothing are a PASS: the difference is the evidence, not the lack of it
  assert.equal(flow(GH_EMPTY, NONE).status, "PASS");
  const lines = [];
  const quiet = console.log;
  console.log = (l) => lines.push(String(l));
  try {
    assert.equal(run("check-agent-isolation", { config, probe: () => r.probe }), 1);
  } finally {
    console.log = quiet;
  }
  assert.ok(lines.some((l) => l.includes("gh-not-found")));
});

test("G12 gh: spawn error, exit code, timeout, invalid JSON and unexpected schema are each UNKNOWN with their cause => BLOCKED", () => {
  const cases = [
    [{ error: Object.assign(new Error("denied"), { code: "EACCES" }) }, "gh-spawn-error:EACCES"],
    [{ error: Object.assign(new Error("denied"), { code: "EPERM" }), status: null }, "gh-spawn-error:EPERM"],
    [{ status: 1, stdout: "", stderr: "You are not logged into any GitHub hosts" }, "gh-exit-1"],
    [{ status: 4, stdout: '{"hosts":{}}' }, "gh-exit-4"],
    [{ status: null, signal: "SIGTERM", error: Object.assign(new Error("timed out"), { code: "ETIMEDOUT" }) }, "gh-timeout"],
    [{ status: null, signal: "SIGKILL", stdout: "" }, "gh-signal:SIGKILL"],
    [{ status: 0, stdout: "" }, "gh-json-invalid"],
    [{ status: 0, stdout: "not json" }, "gh-json-invalid"],
    [{ status: 0, stdout: '{"hosts":' }, "gh-json-invalid"],
    [{ status: 0, stdout: "{}" }, "gh-schema-unexpected"],
    [{ status: 0, stdout: "[]" }, "gh-schema-unexpected"],
    [{ status: 0, stdout: '{"hosts":[]}' }, "gh-schema-unexpected"],
    [{ status: 0, stdout: '{"hosts":{"github.com":{}}}' }, "gh-schema-unexpected"],
    [{ status: 0, stdout: '{"hosts":{"github.com":[{"state":"error"}]}}' }, "gh-account-without-login"],
    [{ status: 0, stdout: '{"hosts":{"github.com":[{"login":"  "}]}}' }, "gh-account-without-login"],
    [{}, "gh-exit-unknown"],
    [null, "gh-no-result"],
  ];
  for (const [gh, cause] of cases) {
    const r = flow(gh, NONE);
    assert.equal(r.probe.ghAccounts, null, cause);
    assert.equal(r.status, "BLOCKED", cause);
    assert.ok(causeOf(r.findings, "gh account").endsWith(`[${cause}]`), `${cause}: ${causeOf(r.findings, "gh account")}`);
  }
});

test("G12 gh: known results are known. Empty hosts = zero accounts (gh's real exit-0 answer); accounts are reported by host and login only", () => {
  const none = flow(GH_EMPTY, NONE);
  assert.deepEqual(none.probe.ghAccounts, []);
  assert.equal(none.probe.unknown, undefined);
  assert.equal(none.status, "PASS");
  const other = flow({ status: 0, stdout: JSON.stringify({ hosts: { "github.com": [{ login: "agent-bot", state: "success", tokenSource: "keyring" }] } }) }, NONE);
  assert.deepEqual(other.probe.ghAccounts, [{ host: "github.com", login: "agent-bot" }]);
  assert.equal(other.status, "PASS");
  const human = flow({ status: 0, stdout: GH_JSON }, NONE);
  assert.deepEqual(codes(human.findings), ["AGENT_HUMAN_GH_ACCOUNT"]);
  assert.equal(human.status, "BLOCKED");
});

test("G12 reproduction 2 (Codex): '* UNRECOGNIZED ERROR *' is never 'no credentials'", () => {
  const exact = [
    "\nCurrently stored credentials:\n\n* UNRECOGNIZED ERROR *\n",
    "\r\nCurrently stored credentials:\r\n\r\n* UNRECOGNIZED ERROR *\r\n\r\n",
    "\r\nCredenciales almacenadas en la actualidad:\r\n\r\n* UNRECOGNIZED ERROR *\r\n",
    "* UNRECOGNIZED ERROR *",
    "Currently stored credentials:\n* UNRECOGNIZED ERROR *\n",
  ];
  for (const stdout of exact) {
    const r = flow(GH_EMPTY, { status: 0, stdout });
    assert.equal(r.probe.credentialTargets, null, JSON.stringify(stdout));
    assert.equal(r.status, "BLOCKED", JSON.stringify(stdout));
    const d = causeOf(r.findings, "stored credential");
    assert.match(d, /\[cmdkey-(format-unrecognised|output-truncated|header-unrecognised)\(lines=\d+,blocks=\d+\)\]$/, d);
    assert.ok(!d.includes("UNRECOGNIZED"), "the diagnostic carries counts, never the tool's text");
  }
  const lines = [];
  const quiet = console.log;
  console.log = (l) => lines.push(String(l));
  try {
    assert.equal(run("check-agent-isolation", { config, probe: () => flow(GH_EMPTY, { status: 0, stdout: exact[0] }).probe }), 1);
  } finally {
    console.log = quiet;
  }
  assert.ok(lines.some((l) => l.includes("cmdkey-format-unrecognised")));
});

test("G12 cmdkey: empty, unknown-localised, truncated and look-alike outputs are UNKNOWN => BLOCKED", () => {
  const H_EN = "\nCurrently stored credentials:\n\n", H_ES = "\r\nCredenciales almacenadas en la actualidad:\r\n\r\n";
  const outputs = [
    "", "\n", "   \r\n  \r\n",                                          // nothing at all
    H_EN, H_ES, H_EN.trim(),                                          // header only (cut before the body)
    `${H_EN}* NONE`, `${H_EN}* NON`, `${H_EN}*`, `${H_ES}* NINGUN`,    // marker cut in the middle
    `${H_EN}    Target: LegacyGeneric:target=x`,                       // credential cut after one line
    `${H_ES}    Destino: LegacyGeneric:target=x\r\n`,
    `${H_EN}* none *\n`, `${H_EN}* NONE *\n* NONE *\n`, `${H_EN}*NONE*\n`, `${H_EN}* NINGUNO *\n`, `${H_ES}* NONE *\n`, // not the exact documented marker of a language, or marker twice
    `${H_EN}* NONE *\n\n    Target: a\n    Type: Generic\n`,           // marker mixed with a credential
    `${H_EN}    Target: a\n    Type: Generic\n\n* NONE *\n`,
    "\nGespeicherte Anmeldeinformationen:\n\n* KEINE *\n",             // languages whose cmdkey.exe.mui was not read are not guessed
    "\n当前存储的凭据：\n\n    目标：LegacyGeneric:target=git:https://github.com\n    类型：通用\n\n",
    `${H_ES}* ERROR DESCONOCIDO *\r\n`, `${H_EN}* ACCESS DENIED *\n`, `${H_EN}Error: 5\nDetails: access denied\n`,
    `${H_EN}    Error: 1312\n    Details: x\n`,                       // two "label: value" lines that are NOT a credential
    `${H_EN}    Target: a\n    Kind: Generic\n`,                      // second line is not the Type line
    `${H_EN}    Type: Generic\n    Target: a\n`,                      // wrong order
    `${H_EN}    Target: \n    Type: Generic\n`,                        // empty target value
    `${H_EN}    Target: a\n    Type: Generic\n    x\n    x\n    x\n    x\n    x\n    x\n    x\n`, // block longer than any real credential
    "Currently stored credentials:\n    Target: a\n    Type: Generic\n", // no blank line: the header block is not alone
    "The command line parameters are incorrect.\n\nThe syntax of this command is:\n",
  ];
  for (const stdout of outputs) {
    const r = flow(GH_EMPTY, { status: 0, stdout });
    assert.equal(r.probe.credentialTargets, null, JSON.stringify(stdout));
    assert.equal(r.status, "BLOCKED", JSON.stringify(stdout));
    assert.match(causeOf(r.findings, "stored credential"), /\[cmdkey-[a-z-]+(\(lines=\d+,blocks=\d+\))?\]$/, JSON.stringify(stdout));
  }
  // the query itself failed
  for (const [c, cause] of [
    [{ status: 1, stdout: CMDKEY_EN }, "cmdkey-exit-1"], [{ status: 5, stdout: "" }, "cmdkey-exit-5"], [{ status: null, stdout: CMDKEY_EN, signal: "SIGTERM" }, "cmdkey-signal:SIGTERM"],
    [{ error: { code: "ENOENT" } }, "cmdkey-not-found"], [{ error: { code: "ETIMEDOUT" } }, "cmdkey-timeout"], [{ error: { code: "EPERM" } }, "cmdkey-spawn-error:EPERM"],
    [{ status: 0 }, "cmdkey-no-output"], [{ status: 0, stdout: Buffer.from(CMDKEY_EN) }, "cmdkey-no-output"], [null, "cmdkey-no-result"],
  ]) {
    const r = flow(GH_EMPTY, c);
    assert.equal(r.status, "BLOCKED", cause);
    assert.ok(causeOf(r.findings, "stored credential").endsWith(`[${cause}]`), `${cause}: ${causeOf(r.findings, "stored credential")}`);
  }
  // not Windows: the credential store is not probed, so it is unknown rather than empty
  const linux = flow(GH_EMPTY, NONE, { platform: "linux" });
  assert.equal(linux.status, "BLOCKED");
  assert.ok(causeOf(linux.findings, "stored credential").endsWith("[credential-store-not-probed-on-linux]"));
});

test("G12 cmdkey: recognised formats are understood. A documented empty marker is empty; a listing with credentials is reported", () => {
  const nones = [NONE, CMDKEY_NONE_ES, { status: 0, stdout: "\r\nCurrently stored credentials:\r\n\r\n* NONE *\r\n" }, { status: 0, stdout: "\nCredenciales almacenadas en la actualidad:\n\n  * NINGUNO *  \n\n" }];
  for (const c of nones) {
    const r = flow(GH_EMPTY, c);
    assert.deepEqual(r.probe.credentialTargets, []);
    assert.equal(r.probe.unknown, undefined);
    assert.equal(r.status, "PASS");
  }
  for (const c of [CMDKEY_EN, CMDKEY_ES]) {
    const r = flow(GH_EMPTY, { status: 0, stdout: c });
    assert.deepEqual(r.probe.credentialTargets, ["LegacyGeneric:target=git:https://github.com"]);
    assert.deepEqual(codes(r.findings), ["AGENT_GIT_CREDENTIAL"]);
    assert.equal(r.status, "BLOCKED");
  }
  // a recognised listing without any GitHub target is a known "none of ours"; the persistence lines are part of the real format
  const other = flow(GH_EMPTY, { status: 0, stdout: CMDKEY_EN.replace(/github/g, "gitlab") });
  assert.deepEqual(other.probe.credentialTargets, []);
  assert.equal(other.status, "PASS");
  const real = "\r\nCredenciales almacenadas en la actualidad:\r\n\r\n    Destino: MicrosoftAccount:user=someone\r\n    Tipo: Genérica\r\n    Usuario: someone\r\n    Se guarda solo para este inicio de sesión\r\n\r\n    Destino: WindowsLive:target=virtualapp/didlogical\r\n    Tipo: Genérica\r\n    Usuario: 02abc\r\n    Persistencia del equipo local\r\n\r\n";
  const r = flow(GH_EMPTY, { status: 0, stdout: real });
  assert.deepEqual(r.probe.credentialTargets, []);
  assert.equal(r.status, "PASS");
});

test("G12 the documented empty markers are the ones the Windows cmdkey.exe.mui resources print (read-only check, skipped where the file is absent)", (t) => {
  const win = process.env.SystemRoot ?? process.env.windir;
  const files = { "en-US": ["* NONE *", "Currently stored credentials:", "Target:", "Type:"], "es-ES": ["* NINGUNO *", "Credenciales almacenadas en la actualidad:", "Destino:", "Tipo:"] };
  let checked = 0;
  for (const [lang, strings] of Object.entries(files)) {
    if (!win) break;
    let text;
    try {
      text = readFileSync(join(win, "System32", lang, "cmdkey.exe.mui")).toString("utf16le");
    } catch {
      continue;
    }
    checked++;
    for (const s of strings) assert.ok(text.includes(s), `${lang} cmdkey.exe.mui does not contain '${s}'`);
  }
  if (!checked) t.skip("no cmdkey.exe.mui available on this host");
});

test("G12 the probe never prints or keeps output text: hostile stderr/stdout never reach a finding", () => {
  const r = flow({ status: 1, stdout: "", stderr: "token ghp_FAKESECRET0123456789 rejected" }, { status: 0, stdout: "\nCurrently stored credentials:\n\n* ghp_FAKESECRET0123456789 *\n" });
  assert.equal(r.status, "BLOCKED");
  assert.ok(!JSON.stringify(r).includes("ghp_"));
  const lines = [];
  const quiet = console.log;
  console.log = (l) => lines.push(String(l));
  try {
    assert.equal(run("check-agent-isolation", { config, probe: () => r.probe }), 1);
  } finally {
    console.log = quiet;
  }
  assert.ok(lines.some((l) => l.includes("gh-exit-1")) && lines.every((l) => !l.includes("ghp_")));
  // a cause that is not one of the probe's own short words is dropped, not printed
  const forged = evaluateAgentIsolation(config, { ...cleanProbe(), ghAccounts: null, unknown: { ghAccounts: "line1\nghp_SECRET value with spaces and a very long text ".repeat(5) } });
  assert.ok(forged.every((f) => !f.detail.includes("ghp_")));
  assert.equal(verdict(forged).status, "BLOCKED");
});

test("G12 matrix: no combination with an UNKNOWN source is ever a PASS", () => {
  const ghOutcomes = { ok: GH_EMPTY, enoent: { error: { code: "ENOENT" } }, exit1: { status: 1, stdout: "" }, timeout: { error: { code: "ETIMEDOUT" }, signal: "SIGTERM" }, json: { status: 0, stdout: "{" }, schema: { status: 0, stdout: "{}" } };
  const cmdOutcomes = { ok: NONE, okEs: CMDKEY_NONE_ES, unrecognised: { status: 0, stdout: "\nCurrently stored credentials:\n\n* UNRECOGNIZED ERROR *\n" }, empty: { status: 0, stdout: "" }, truncated: { status: 0, stdout: "\nCurrently stored credentials:\n\n" }, enoent: { error: { code: "ENOENT" } }, exit1: { status: 1, stdout: "" } };
  let passes = 0;
  for (const [g, gh] of Object.entries(ghOutcomes)) {
    for (const [c, cmd] of Object.entries(cmdOutcomes)) {
      const r = flow(gh, cmd);
      const recognised = g === "ok" && (c === "ok" || c === "okEs");
      assert.equal(r.status, recognised ? "PASS" : "BLOCKED", `${g} x ${c}`);
      if (r.status === "PASS") passes++;
    }
  }
  assert.equal(passes, 2, "only the two fully recognised empty combinations pass");
  // token variables are still reported independently of the UNKNOWN sources
  assert.ok(codes(evaluateAgentIsolation(config, probeWith(GH_EMPTY, NONE, { env: { GH_TOKEN: "x" } }))).includes("AGENT_TOKEN_IN_ENV"));
});

// ----- evaluateBinding: both bindings are validated BEFORE they are compared
const goodBinding = () => {
  const r = goodReceipt();
  const out = verifyReceiptProvenance({ receipt: r, schema, config, live: liveFor(r) });
  assert.equal(out.status, "PASS", JSON.stringify(out.findings));
  return out.binding;
};
const plain = (b) => ({ ...b });
const BLOCKING = ["BINDING_INCOMPLETE", "BINDING_MALFORMED", "EVIDENCE_MALFORMED"];
const assertBlocked = (findings, label) => {
  assert.ok(findings.length > 0, `${label}: PASS`);
  assert.ok(findings.every((f) => BLOCKING.includes(f.code)), `${label}: ${codes(findings)}`);
  assert.equal(verdict(findings).status, "BLOCKED");
};
const bothSides = (good, bad, label) => {
  assertBlocked(evaluateBinding(bad, good), `${label} [approved]`);
  assertBlocked(evaluateBinding(good, bad), `${label} [fresh]`);
};

test("G12 reproduction 3 (Codex): a binding whose every identity field is '' is BLOCKED, as the approved or as the fresh one", () => {
  const empty = Object.fromEntries(BINDING_IDENTITY.map((k) => [k, ""]));
  const f = evaluateBinding(empty, empty);
  assertBlocked(f, "all empty, both");
  assert.ok(f.filter((x) => x.code === "BINDING_MALFORMED").length >= BINDING_IDENTITY.length * 2, "every field of both bindings is reported");
  bothSides(goodBinding(), empty, "all empty");
});

test("G12 evaluateBinding: the valid binding passes, an identical one passes, ONE different valid field is BINDING_CHANGED", () => {
  const a = goodBinding();
  assert.deepEqual(BINDING_IDENTITY.filter((k) => !(k in a)), []);
  assert.deepEqual(evaluateBinding(a, a), []);
  assert.deepEqual(evaluateBinding(a, plain(a)), []);
  assert.deepEqual(evaluateBinding(plain(a), Object.assign(Object.create(null), a)), [], "a null-prototype copy is the same flat JSON object");
  assert.deepEqual(evaluateBinding(a, JSON.parse(JSON.stringify(a))), []);
  const { mainTipSha, verifiedAt, ...identityOnly } = a;
  assert.deepEqual(evaluateBinding(identityOnly, a), [], "observations are optional");
  assert.deepEqual(evaluateBinding(a, { ...a, mainTipSha: "e".repeat(40), verifiedAt: "2030-01-01T00:00:00Z" }), [], "observations are not identity");
  assert.deepEqual(evaluateBinding(a, { ...a, mainTipSha: null }), []);
  const valid = { scopeId: "other-scope", repositoryId: a.repositoryId + 1, pullRequestNumber: a.pullRequestNumber + 1, headSHA: "c".repeat(40), planSetFingerprint: "d".repeat(64), workflowRunId: a.workflowRunId + 1, workflowRevisionId: "rev-2", trustedConfigSha256: "e".repeat(64), trustedConfigBlobSha: "f".repeat(40), trustedConfigSourceRevision: "9".repeat(40) };
  assert.deepEqual(Object.keys(valid).sort(), [...BINDING_IDENTITY].sort());
  for (const k of BINDING_IDENTITY) {
    const f = evaluateBinding(a, { ...a, [k]: valid[k] });
    assert.deepEqual(codes(f), ["BINDING_CHANGED"], k);
    assert.match(f[0].detail, new RegExp(k));
    assert.deepEqual(codes(evaluateBinding({ ...a, [k]: valid[k] }, a)), ["BINDING_CHANGED"], k);
  }
});

test("G12 evaluateBinding: each identity field, empty/absent/null/blank/wrong type/invalid format, as approved and as fresh", () => {
  const a = goodBinding();
  const NUM = ["repositoryId", "pullRequestNumber", "workflowRunId"];
  const SHA = { headSHA: 40, trustedConfigBlobSha: 40, trustedConfigSourceRevision: 40, planSetFingerprint: 64, trustedConfigSha256: 64 };
  const common = [undefined, null, "", " ", "   ", "\t\n", {}, [], [a.headSHA], () => 1, Symbol("x"), true, false, 0, -1, NaN, Infinity, -Infinity, 12n, new Date(0), /x/];
  let n = 0;
  for (const k of BINDING_IDENTITY) {
    const extra = NUM.includes(k)
      ? ["168", "1", 1.5, 0, -7, Number.MAX_SAFE_INTEGER + 1, 1e21, "0x10", " 168", "168 "]
      : k in SHA
        ? ["a".repeat(SHA[k] - 1), "a".repeat(SHA[k] + 1), "A".repeat(SHA[k]), "g".repeat(SHA[k]), `${"a".repeat(SHA[k])}\n`, ` ${"a".repeat(SHA[k] - 1)}`, `sha256:${"a".repeat(SHA[k])}`, a[k].toUpperCase(), `${a[k].slice(0, -1)}z`]
        : k === "scopeId"
          ? ["Acceptance-v4", "-acceptance", "acceptance v4", "acceptance_v4", "acceptance-v4\n", "a/b", "ñandú", "..", "aaaa\u0000"]
          : ["rev 1", " rev-1", "rev-1 ", "rev\n1", "rev\u0000", "x".repeat(129), "\u007f"];
    for (const v of [...common, ...(NUM.includes(k) ? [] : [1]), ...extra]) {
      if (v === undefined) {
        const gone = plain(a);
        delete gone[k];
        bothSides(a, gone, `${k} absent`);
      }
      bothSides(a, { ...a, [k]: v }, `${k}=${typeof v === "symbol" ? "symbol" : typeof v === "bigint" ? `${v}n` : String(v)}`);
      n++;
    }
  }
  assert.ok(n > 300, `only ${n} cases`);
  // observations, when present, are validated too
  for (const bad of [{ mainTipSha: "x" }, { mainTipSha: "E".repeat(40) }, { mainTipSha: 5 }, { mainTipSha: undefined }, { verifiedAt: "" }, { verifiedAt: "tomorrow" }, { verifiedAt: null }, { verifiedAt: 1700000000000 }, { verifiedAt: "2026-02-30T00:00:00Z" }]) bothSides(a, { ...a, ...bad }, JSON.stringify(bad));
});

test("G12 evaluateBinding: not a plain flat object, inherited or non-own properties, accessors, unexpected properties", () => {
  const a = goodBinding();
  for (const v of [null, undefined, "", "x", 5, 0, true, false, NaN, [], [a], Symbol("x"), 12n, () => a, new Map(Object.entries(a)), new (class B {})(), Object.create(a), Object.create(Object.create(null))]) bothSides(a, v, String(typeof v));
  // required properties that are inherited, not own
  bothSides(a, Object.create(plain(a)), "all inherited");
  const mixed = Object.assign(Object.create({ headSHA: a.headSHA }), (({ headSHA, ...rest }) => rest)(a));
  bothSides(a, mixed, "headSHA inherited");
  // Object.prototype pollution cannot supply a missing field
  for (const k of BINDING_IDENTITY) {
    const gone = plain(a);
    delete gone[k];
    Object.defineProperty(Object.prototype, k, { value: a[k], configurable: true, enumerable: false, writable: true });
    try {
      bothSides(a, gone, `polluted Object.prototype.${k}`);
    } finally {
      delete Object.prototype[k];
    }
  }
  // accessors (a getter can answer differently each time it is read) and non-enumerable properties
  for (const k of BINDING_IDENTITY) {
    let reads = 0;
    const getter = plain(a);
    Object.defineProperty(getter, k, { get: () => (reads++ ? "0".repeat(40) : a[k]), enumerable: true, configurable: true });
    bothSides(a, getter, `getter ${k}`);
    const hidden = plain(a);
    Object.defineProperty(hidden, k, { value: a[k], enumerable: false, configurable: true, writable: true });
    bothSides(a, hidden, `non-enumerable ${k}`);
  }
  // closed schema: no unexpected property of any kind
  const sym = Symbol("sneaky");
  for (const extra of [{ extra: "x" }, { Extra: 1 }, { headSha: a.headSHA }, { approved: true }, { [sym]: 1 }, JSON.parse('{"__proto__": {"x": 1}}'), { constructor: "x" }]) bothSides(a, Object.assign(plain(a), extra), Reflect.ownKeys(extra).map(String).join());
  const hiddenExtra = plain(a);
  Object.defineProperty(hiddenExtra, "hiddenExtra", { value: 1, enumerable: false });
  bothSides(a, hiddenExtra, "non-enumerable extra");
  // no coercion or normalisation: the same value in another form is a malformed binding, not an equal one
  bothSides(a, { ...a, headSHA: a.headSHA.toUpperCase() }, "upper-case SHA");
  bothSides(a, { ...a, pullRequestNumber: String(a.pullRequestNumber) }, "numeric string");
  bothSides(a, { ...a, scopeId: ` ${a.scopeId} ` }, "padded scope");
  bothSides(a, { ...a, workflowRunId: `${a.workflowRunId}.0` }, "decimal string");
});

test("G12 evaluateBinding never throws: a hostile object yields findings, never an exception that could be read as authorisation", () => {
  const a = goodBinding();
  const trap = () => { throw new Error("trap"); };
  const hostile = [
    new Proxy({}, { getPrototypeOf: trap }), new Proxy(plain(a), { ownKeys: trap }), new Proxy(plain(a), { getOwnPropertyDescriptor: trap }),
  ];
  for (const h of hostile) {
    let f;
    assert.doesNotThrow(() => { f = evaluateBinding(h, a); });
    assertBlocked(f, "hostile approved");
    assert.doesNotThrow(() => { f = evaluateBinding(a, h); });
    assertBlocked(f, "hostile fresh");
  }
  assertBlocked(evaluateBinding(), "no arguments");
  assertBlocked(evaluateBinding(a), "no fresh");
  assertBlocked(evaluateBinding(undefined, a), "no approved");
  // findings never echo the offending values
  const f = evaluateBinding({ ...a, headSHA: "ghp_SECRETSECRETSECRET", scopeId: { token: "ghp_SECRET" } }, a);
  assert.ok(!JSON.stringify(f).includes("ghp_"));
});

test("G13 reproduction (Codex): evaluateBinding(new Proxy(valid, {}), valid) is BLOCKED; any Proxy, on either side, is BLOCKED", () => {
  const a = goodBinding();
  assert.deepEqual(evaluateBinding(a, plain(a)), [], "control: the plain binding passes");
  const transparent = [new Proxy(plain(a), {}), new Proxy(a, {}), new Proxy(Object.freeze(plain(a)), {}), new Proxy(new Proxy(plain(a), {}), {}), new Proxy(Object.create(null), { get: (_, k) => a[k], ownKeys: () => Reflect.ownKeys(a), getOwnPropertyDescriptor: (_, k) => Reflect.getOwnPropertyDescriptor(a, k) })];
  for (const px of transparent) {
    for (const f of [evaluateBinding(px, a), evaluateBinding(a, px), evaluateBinding(px, px), evaluateBinding(px, plain(a))]) {
      assert.deepEqual(codes(f).filter((c) => c !== "BINDING_MALFORMED"), []);
      assert.ok(f.length > 0 && f.every((x) => /is a Proxy/.test(x.detail)));
      assert.equal(verdict(f).status, "BLOCKED");
    }
  }
  assert.equal(evaluateBinding(transparent[0], transparent[1]).length, 2, "both sides are reported");
  // a revoked proxy is still a proxy; so is a proxy of a function or an array
  const r = Proxy.revocable(plain(a), {});
  r.revoke();
  for (const px of [r.proxy, new Proxy(() => a, {}), new Proxy([a], {}), new Proxy(function () {}, {})]) bothSides(a, px, "exotic proxy");
  // an observation field is not a way around it: the check is on the binding object itself
  assertBlocked(evaluateBinding(new Proxy({ ...a, mainTipSha: null }, {}), a), "proxy with observations");
});

test("G13 a Proxy is rejected BEFORE any trap can run: no trap code executes, whatever the handler does", () => {
  const a = goodBinding();
  const ran = [];
  const handler = new Proxy({}, { get: (_, trap) => (...args) => { ran.push(trap); return Reflect[trap](...args); } });
  const spy = new Proxy(plain(a), handler);
  ran.length = 0;
  assertBlocked(evaluateBinding(spy, a), "spy approved");
  assertBlocked(evaluateBinding(a, spy), "spy fresh");
  assertBlocked(evaluateBinding(spy, spy), "spy both");
  assert.deepEqual(ran, [], `traps ran: ${ran.join(",")}`);
  // the handler's own get on a trap name is never consulted either, and a throwing trap is never reached
  let touched = 0;
  const hostile = new Proxy(plain(a), new Proxy({}, { get() { touched++; throw new Error("trap reached"); } }));
  for (const [x, y] of [[hostile, a], [a, hostile]]) {
    let f;
    assert.doesNotThrow(() => { f = evaluateBinding(x, y); });
    assertBlocked(f, "throwing handler");
    assert.ok(f.every((q) => q.code === "BINDING_MALFORMED"), "decided by the Proxy check, not by an exception caught afterwards");
  }
  assert.equal(touched, 0);
  // a getter that lies is rejected as before; the Proxy rule did not loosen the accessor rule
  const lying = plain(a);
  let reads = 0;
  Object.defineProperty(lying, "headSHA", { get: () => (reads++ ? "0".repeat(40) : a.headSHA), enumerable: true, configurable: true });
  bothSides(a, lying, "getter");
  assert.equal(reads, 0, "accessors are rejected without being invoked");
});

test("G13 plain bindings are unaffected by the Proxy rule: valid and identical pass; one different field is BINDING_CHANGED", () => {
  const a = goodBinding();
  assert.deepEqual(evaluateBinding(a, a), []);
  assert.deepEqual(evaluateBinding(a, plain(a)), []);
  assert.deepEqual(evaluateBinding(plain(a), JSON.parse(JSON.stringify(a))), []);
  assert.deepEqual(evaluateBinding(Object.assign(Object.create(null), a), plain(a)), []);
  assert.deepEqual(codes(evaluateBinding(a, { ...a, headSHA: "c".repeat(40) })), ["BINDING_CHANGED"]);
  assert.deepEqual(codes(evaluateBinding({ ...a, pullRequestNumber: a.pullRequestNumber + 1 }, a)), ["BINDING_CHANGED"]);
  // a Proxy held somewhere else (not as the binding) is irrelevant: the validated values are primitives
  const holder = new Proxy({}, {});
  assert.ok(holder !== null);
  assert.deepEqual(evaluateBinding(a, plain(a)), []);
  // the earlier fixes still hold on this code path
  assertBlocked(evaluateBinding(Object.fromEntries(BINDING_IDENTITY.map((k) => [k, ""])), a), "all empty");
  assert.equal(flow({ error: { code: "ENOENT" } }, NONE).status, "BLOCKED");
  assert.equal(flow(GH_EMPTY, { status: 0, stdout: "\nCurrently stored credentials:\n\n* UNRECOGNIZED ERROR *\n" }).status, "BLOCKED");
});

test("G13 the Proxy rule is in the source before any property read, and the contract document says so", () => {
  const src = read("runtime/gates/plan-approval-receipt.mjs");
  const body = src.slice(src.indexOf("function readBinding"), src.indexOf("export const evaluateBinding"));
  assert.ok(body.startsWith("function readBinding(label, b, out) {\n  if (types.isProxy(b)) {"), "isProxy is the first statement");
  assert.ok(body.indexOf("types.isProxy") < body.indexOf("Object.getPrototypeOf"));
  assert.ok(src.includes('import { types } from "node:util";'));
  assert.match(read("governance/security/PLAN-APPROVAL-COORDINATOR-CONTRACT.md"), /Proxy/);
});

test("G12 the producer and the validator agree: a workflow revision id that a binding would reject is TRUST_CONFIG_INVALID at the source", () => {
  assert.equal(goodBinding().workflowRevisionId, "rev-1");
  for (const id of ["", " ", "a b", " rev", "rev ", "rev\n", "x".repeat(129), 7, null, undefined, {}]) {
    const cfg = { ...config, workflow: { ...config.workflow, trustedRevisions: [{ id, files: { ...FILES } }] } };
    blockedApproval("TRUST_CONFIG_INVALID", () => {}, cfg);
    blockedProvenance("TRUST_CONFIG_INVALID", () => {}, cfg);
  }
  // real, current producers still satisfy the validators
  const r = goodReceipt();
  const out = verifyReceiptProvenance({ receipt: r, schema, config, live: liveFor(r) });
  assert.deepEqual(evaluateBinding(out.binding, out.binding), []);
});

test("G12 documentation states the failure rules and the limits (UNKNOWN => BLOCKED, localisation, TOCTOU stays open)", () => {
  const main = read("governance/security/PLAN-APPROVAL-RECEIPT.md");
  const coord = read("governance/security/PLAN-APPROVAL-COORDINATOR-CONTRACT.md");
  for (const needle of ["gh-not-found", "UNRECOGNIZED ERROR", "cmdkey.exe.mui", "BINDING_MALFORMED"]) assert.ok(main.includes(needle), `PLAN-APPROVAL-RECEIPT.md lacks '${needle}'`);
  assert.ok(coord.includes("BINDING_MALFORMED") && coord.includes("propi"), "the Coordinator contract describes the binding validation");
  assert.match(main, /TOCTOU end-to-end: NO RESUELTO/);
  assert.match(coord, /NO está implementado/);
});
