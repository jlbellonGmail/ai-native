// Plan Approval Receipt (bootstrap). Pure decision logic, no I/O: every function takes already-collected
// GitHub facts and returns findings. ANY finding means BLOCKED; there is no warning tier and no default-allow.
// Malformed or missing evidence is a finding too: every public evaluator is wrapped so that an exception can never
// be read as an approval (see `guarded`).
//
// Trust model:
//  - The workflow runs from `main` (workflow_dispatch) and treats the PR as untrusted DATA: the nine plan
//    documents are read through the contents API at the exact head SHA and only hashed, never executed.
//  - The request must come from the `ai-native-plan-approval` GitHub App: run.actor AND run.triggering_actor
//    must be that bot user (login + type Bot + pinned numeric id). `github.actor` alone is not accepted as proof.
//  - The human approval is the dedicated Environment `ai-native-plan-approval`; it is read back from the run's
//    approvals history and bound to a pinned reviewer id that differs from the requesting identity.
//  - The workflow REVISION is trusted only if the git blobs of every file it executes match an entry of the
//    governed list `workflow.trustedRevisions`. Being an ancestor of main is necessary, never sufficient.
//  - A receipt is only evidence together with its provenance: `verifyReceiptProvenance` needs the real artifact
//    (metadata, digest, downloaded bytes, extracted content), the run and the live PR/document/approval state.
//    An isolated JSON is never sufficient.
//  - The CONFIGURATION (governance/gates/plan-approval.json) is trusted by where it comes from, never by a hash kept
//    inside itself (that would be circular): the root of trust is a commit of `main` (content-addressed git history,
//    changed only through the human-reviewed merge-gate). Three separate facts, never mixed:
//      1. plan fingerprint     = what was approved: scope, repository, PR, head SHA and the nine document hashes
//      2. configuration identity = which configuration judged it: { sourceRevision, gitBlobSha, sha256, repositoryId, workflowRunId }
//      3. workflow provenance  = which code ran: the git blobs of the files the run executed (workflow.trustedRevisions)
//    `sourceRevision` is part of (2) and is deliberately NOT an input of (1) (decision approved for v4): moving the
//    configuration on `main` must not rewrite what the human approved; it makes the receipt BLOCKED instead.
// The receipt authorises nothing else: no merge, no release, nothing outside the approved documents.
import { createHash } from "node:crypto";
import { types } from "node:util";
import { validate } from "../lib/schema-lite.mjs";

const SHA1 = /^[0-9a-f]{40}$/;
const SHA256 = /^[0-9a-f]{64}$/;
const CLOCK_SKEW_MS = 5 * 60 * 1000;

export const TRUSTED_CONFIG_PATH = "governance/gates/plan-approval.json";

export const sha256Hex = (data) => createHash("sha256").update(data).digest("hex");

/** Git blob object id of raw bytes (what `git hash-object` and the contents API call `sha`). sha1 only because git says so. */
export const gitBlobSha = (bytes) => createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");

/**
 * A Windows worktree stores text as CRLF while the git blob (and GitHub) hold LF (.gitattributes: eol=lf). Only the
 * "does my local copy equal the trusted one" comparison tolerates that difference; identities are always computed over
 * the bytes GitHub returns, never over a local file.
 */
export const sameConfigBytes = (local, trusted) => Buffer.isBuffer(local) && Buffer.isBuffer(trusted) && Buffer.from(local.toString("utf8").replace(/\r\n/g, "\n")).equals(trusted);

/** Identity of a configuration file = digests of its ORIGINAL bytes (never of a re-serialised object). */
export function describeConfigBytes(bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.length) throw new Error("describeConfigBytes: no configuration bytes");
  return { sha256: sha256Hex(bytes), gitBlobSha: gitBlobSha(bytes) };
}

/** Deterministic JSON: keys sorted recursively, no whitespace. Rejects every value without a single canonical form. */
export function canonicalJson(value, depth = 0) {
  if (depth > 32) throw new Error("canonicalJson: nesting too deep");
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("canonicalJson: non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const parts = [];
    for (let i = 0; i < value.length; i++) {
      if (!(i in value)) throw new Error("canonicalJson: sparse array");
      parts.push(canonicalJson(value[i], depth + 1));
    }
    return `[${parts.join(",")}]`;
  }
  const proto = value !== undefined && typeof value === "object" ? Object.getPrototypeOf(value) : undefined;
  if (proto === Object.prototype || proto === null) {
    return `{${Object.keys(value).sort().map((k) => {
      if (value[k] === undefined) throw new Error(`canonicalJson: undefined property '${k}'`);
      return `${JSON.stringify(k)}:${canonicalJson(value[k], depth + 1)}`;
    }).join(",")}}`;
  }
  throw new Error(`canonicalJson: unsupported value of type ${value === undefined ? "undefined" : typeof value}`);
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/;

/** Epoch ms of a strictly valid ISO 8601 instant (real calendar date, real time, valid zone), else NaN. */
export function parseIsoInstant(s) {
  const m = typeof s === "string" ? s.match(ISO) : null;
  if (!m) return NaN;
  const [y, mo, d, h, mi, se] = m.slice(1, 7).map(Number);
  if (y < 1970 || mo < 1 || mo > 12 || h > 23 || mi > 59 || se > 59) return NaN;
  if (d < 1 || d > new Date(Date.UTC(y, mo, 0)).getUTCDate()) return NaN;
  let offset = 0;
  if (m[8] !== "Z") {
    const oh = Number(m[8].slice(1, 3)), om = Number(m[8].slice(4, 6));
    if (oh > 23 || om > 59) return NaN;
    offset = (m[8][0] === "-" ? -1 : 1) * (oh * 60 + om) * 60000;
  }
  const ms = m[7] ? Number(m[7].slice(0, 3).padEnd(3, "0")) : 0;
  return Date.UTC(y, mo - 1, d, h, mi, se, ms) - offset;
}

/**
 * Binds the approval to the exact PR, head SHA and every document hash (documents sorted by path).
 * Reads ONLY those fields: configuration identity and sourceRevision are intentionally not inputs (see header).
 */
export function planSetFingerprint({ scopeId, repositoryId, pullRequestNumber, headSHA, documents }) {
  if (typeof scopeId !== "string" || !Number.isInteger(repositoryId) || !Number.isInteger(pullRequestNumber) || !SHA1.test(String(headSHA))) throw new Error("planSetFingerprint: malformed binding fields");
  if (!Array.isArray(documents) || !documents.length) throw new Error("planSetFingerprint: no documents");
  const docs = documents.map((d) => {
    if (typeof d?.path !== "string" || !SHA256.test(String(d.sha256))) throw new Error("planSetFingerprint: malformed document entry");
    return { path: d.path, sha256: d.sha256 };
  }).sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  if (new Set(docs.map((d) => d.path)).size !== docs.length) throw new Error("planSetFingerprint: duplicate document path");
  return sha256Hex(canonicalJson({ scopeId, repositoryId, pullRequestNumber, headSHA, documents: docs }));
}

export const verdict = (findings, extra = {}) => ({ status: findings.length ? "BLOCKED" : "PASS", findings, ...(findings.length ? {} : extra) });

/** Any exception while evaluating evidence is a finding, never an approval. */
const guarded = (name, fn) => (...args) => {
  try {
    return fn(...args);
  } catch (e) {
    return [{ code: "EVIDENCE_MALFORMED", detail: `${name}: ${e.message}` }];
  }
};

/**
 * Id of a governed workflow revision (`workflow.trustedRevisions[].id`). No contract fixes its charset (the docs only give
 * "r1-<short M>" as an example), so only what is safe to demand is demanded: ONE visible token, never empty, never padded
 * or multi-line. Used by the producer (evaluateWorkflowRevision) and by the binding validator, so they cannot disagree.
 */
const REVISION_ID = (v) => typeof v === "string" && /^[^\s\u0000-\u001f\u007f]{1,128}$/.test(v);

const sameSet = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

function checkIdentity(config, who, label, out) {
  const req = config.requester;
  if (!who) return out.push({ code: "ACTOR_MISSING", detail: `${label} absent from the run` });
  if (who.login !== req.botLogin) out.push({ code: "ACTOR_WRONG", detail: `${label} is '${who.login}', expected '${req.botLogin}'` });
  if (who.type !== req.actorType) out.push({ code: "ACTOR_NOT_BOT", detail: `${label} type is '${who.type}', expected '${req.actorType}'` });
  if (req.botUserId !== null && who.id !== req.botUserId) out.push({ code: "ACTOR_ID_MISMATCH", detail: `${label} id ${who.id} is not the pinned App bot user id` });
}

/**
 * Environment protection as observed from the API (fail closed when it cannot be read or is not pinned).
 * The id stays null in the governed config until the dedicated Environment exists and a human pins it.
 */
export const evaluateEnvironment = guarded("environment", (config, env) => {
  const ce = config.environment;
  const out = [];
  if (!Number.isInteger(ce.id)) out.push({ code: "ENV_NOT_PINNED", detail: `environment '${ce.name}' id is not pinned in the governed config: the Environment cannot be verified` });
  if (!env) return [...out, { code: "ENV_UNREADABLE", detail: "Environment protection rules could not be read" }];
  if (env.name !== ce.name || env.id !== ce.id) out.push({ code: "ENV_MISMATCH", detail: `environment '${env.name}' (${env.id})` });
  if (env.canAdminsBypass !== ce.canAdminsBypass || ce.canAdminsBypass !== false) out.push({ code: "ENV_ADMIN_BYPASS", detail: "administrators can bypass the Environment protection" });
  if (env.preventSelfReview !== ce.preventSelfReview || ce.preventSelfReview !== true) out.push({ code: "ENV_SELF_REVIEW_ALLOWED", detail: "prevent_self_review is not enabled on the Environment" });
  const r = env.reviewers ?? [];
  if (r.length !== 1 || r[0].type !== "User" || r[0].id !== config.reviewer.id || r[0].login !== config.reviewer.login) out.push({ code: "ENV_REVIEWERS", detail: "required reviewers are not exactly the pinned owner" });
  if (env.protectedBranches !== false || env.customBranchPolicies !== true || !sameSet(env.branchPolicies ?? [], ce.deploymentBranches)) out.push({ code: "ENV_BRANCH_POLICY", detail: `deployment branches are not exclusively ${ce.deploymentBranches.join(",")}` });
  return out;
});

/**
 * The workflow revision = the git blobs of every file the run executes (workflow.trustedFiles) at run.head_sha.
 * `files` = [{ path, type, blobSha }] read from GitHub at that commit. Returns the matching governed entry or null.
 * The governed config itself is deliberately NOT one of the files: it holds the list, so registering a revision
 * does not change the revision.
 */
export function findWorkflowRevision(config, files) {
  const wf = config.workflow;
  if (!Array.isArray(files)) return null;
  const blobs = new Map(files.map((f) => [f?.path, f]));
  if (!wf.trustedFiles.every((p) => blobs.get(p)?.type === "file" && SHA1.test(String(blobs.get(p).blobSha)))) return null;
  return wf.trustedRevisions.find((rev) => wf.trustedFiles.every((p) => rev.files?.[p] === blobs.get(p).blobSha)) ?? null;
}

export const evaluateWorkflowRevision = guarded("workflow revision", (config, files) => {
  const wf = config.workflow;
  if (!Array.isArray(wf.trustedFiles) || !wf.trustedFiles.length || !wf.trustedFiles.includes(wf.path) || new Set(wf.trustedFiles).size !== wf.trustedFiles.length) return [{ code: "TRUST_CONFIG_INVALID", detail: "workflow.trustedFiles is missing, duplicated or does not include the workflow itself" }];
  if (!Array.isArray(wf.trustedRevisions) || !wf.trustedRevisions.length) return [{ code: "WORKFLOW_REVISIONS_EMPTY", detail: "no trusted workflow revision is registered: nothing is accepted until a human registers one (see PLAN-APPROVAL-RECEIPT.md)" }];
  const bad = wf.trustedRevisions.some((rev) => !REVISION_ID(rev?.id) || !sameSet(Object.keys(rev.files ?? {}), wf.trustedFiles) || !Object.values(rev.files).every((b) => SHA1.test(String(b))));
  if (bad) return [{ code: "TRUST_CONFIG_INVALID", detail: "a trusted revision does not pin exactly workflow.trustedFiles with git blob SHAs" }];
  if (!Array.isArray(files)) return [{ code: "WORKFLOW_FILES_UNREADABLE", detail: "the workflow files could not be read at the run commit" }];
  const unreadable = wf.trustedFiles.filter((p) => { const f = files.find((x) => x?.path === p); return !f || f.type !== "file" || !SHA1.test(String(f.blobSha)); });
  if (unreadable.length) return [{ code: "WORKFLOW_FILES_UNREADABLE", detail: `not readable as regular files at the run commit: ${unreadable.join(", ")}` }];
  return findWorkflowRevision(config, files) ? [] : [{ code: "WORKFLOW_REVISION_UNKNOWN", detail: "the workflow files at the run commit match no trusted revision (unknown or historical, not authorised)" }];
});

const parseConfigBytes = (bytes) => JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));

/**
 * ISSUING side. The configuration the run is using must be exactly the one in the git history of `main` at the run
 * commit, and `main` must not have moved the file since:
 *   src = { local: Buffer,                         the bytes the process loaded (its checkout of the run commit)
 *           remote: { bytes, blobSha },            the same path read from GitHub at run.head_sha (contents API)
 *           tip: { sha, blobSha } }                the same path at the CURRENT tip of main
 * Nothing here comes from the PR or from an input: `local` is only a claim until it equals `remote`.
 */
export const evaluateConfigSource = guarded("configuration source", (config, src) => {
  if (!src || !Buffer.isBuffer(src.local) || !src.local.length) return [{ code: "CONFIG_UNREADABLE", detail: "the configuration the process runs with was not captured as bytes" }];
  if (!src.remote || !Buffer.isBuffer(src.remote.bytes) || !SHA1.test(String(src.remote.blobSha))) return [{ code: "CONFIG_UNREADABLE", detail: "the configuration could not be read from GitHub at the run commit" }];
  const out = [];
  if (gitBlobSha(src.remote.bytes) !== src.remote.blobSha) out.push({ code: "CONFIG_BLOB_MISMATCH", detail: "bytes returned by GitHub do not hash to the git blob id GitHub reported" });
  if (!sameConfigBytes(src.local, src.remote.bytes)) out.push({ code: "CONFIG_NOT_FROM_REVISION", detail: "the configuration in use differs from the one in main at the run commit" });
  if (canonicalJson(parseConfigBytes(src.local)) !== canonicalJson(config)) out.push({ code: "CONFIG_OBJECT_MISMATCH", detail: "the configuration object in use is not the parse of the captured bytes" });
  if (!src.tip || !SHA1.test(String(src.tip.sha)) || !SHA1.test(String(src.tip.blobSha))) out.push({ code: "CONFIG_TIP_UNREADABLE", detail: "the configuration at the current tip of main could not be read" });
  else if (src.tip.blobSha !== src.remote.blobSha) out.push({ code: "CONFIG_CHANGED", detail: "the configuration changed on main after the run commit: a receipt issued now could not be verified" });
  return out;
});

/**
 * CONSUMER side. `live` = {
 *   repository: { id, fullName },            GET repos/{repo}
 *   tip: { sha }, tipRecheck: { sha },       head of main read before AND after the rest of the evidence
 *   atTip: { bytes, blobSha },               the configuration at that tip (the ONLY source of the config in use)
 *   atSource: { bytes, blobSha },            the configuration at receipt.trustedConfig.sourceRevision
 *   ancestry }                               compare sourceRevision...tip
 * The `config` under evaluation must be the parse of atTip.bytes; the receipt must carry the very same identity;
 * anything else (changed configuration, a revision that is not an ancestor of main, a moved tip) is BLOCKED.
 */
export const evaluateTrustedConfig = guarded("trusted configuration", (config, receipt, live, expected) => {
  const ok = (x) => x && Buffer.isBuffer(x.bytes) && x.bytes.length && SHA1.test(String(x.blobSha));
  if (!live || !ok(live.atTip) || !ok(live.atSource) || !SHA1.test(String(live.tip?.sha)) || !SHA1.test(String(live.tipRecheck?.sha)) || !live.repository) {
    return [{ code: "CONFIG_UNREADABLE", detail: "the trusted configuration could not be recovered from GitHub: no non-circular root of trust" }];
  }
  const out = [];
  const tc = receipt.trustedConfig;
  const tip = describeConfigBytes(live.atTip.bytes), src = describeConfigBytes(live.atSource.bytes);
  if (tip.gitBlobSha !== live.atTip.blobSha || src.gitBlobSha !== live.atSource.blobSha) out.push({ code: "CONFIG_BLOB_MISMATCH", detail: "bytes returned by GitHub do not hash to the git blob id GitHub reported" });
  if (canonicalJson(parseConfigBytes(live.atTip.bytes)) !== canonicalJson(config)) out.push({ code: "CONFIG_NOT_TRUSTED_SOURCE", detail: "the configuration in use is not the one at the tip of main (a PR, a worktree or an input is not a source)" });
  if (live.tip.sha !== live.tipRecheck.sha) out.push({ code: "CONFIG_TIP_MOVED", detail: "main moved while the evidence was being collected" });
  if (live.repository.id !== config.repository.id || live.repository.id !== receipt.repositoryId || live.repository.id !== expected.repositoryId || live.repository.fullName !== config.repository.fullName) out.push({ code: "CONFIG_REPO_MISMATCH", detail: `repository ${live.repository.fullName} (${live.repository.id})` });
  if (tc.path !== TRUSTED_CONFIG_PATH) out.push({ code: "CONFIG_PATH", detail: tc.path });
  if (tc.sha256 !== tip.sha256 || tc.gitBlobSha !== tip.gitBlobSha) out.push({ code: "CONFIG_CHANGED", detail: "the trusted configuration on main is not the one that judged this receipt: reissue after review" });
  if (tc.sha256 !== src.sha256 || tc.gitBlobSha !== src.gitBlobSha) out.push({ code: "CONFIG_AT_REVISION_MISMATCH", detail: "the configuration at the receipt's sourceRevision is not the one recorded in the receipt" });
  if (live.ancestry !== "identical" && live.ancestry !== "ahead") out.push({ code: "CONFIG_REVISION_NOT_ON_MAIN", detail: `sourceRevision is not an ancestor of the tip of main (compare: ${live.ancestry})` });
  return out;
});

/** Approval history of the run: exactly one `approved` entry of the pinned Environment by the pinned human. */
function checkApprovalHistory(config, approvals, run, out) {
  const ce = config.environment, rev = config.reviewer;
  const entries = approvals.filter((a) => (a.environments ?? []).some((e) => e.id === ce.id || e.name === ce.name));
  if (!entries.length) out.push({ code: "APPROVAL_ABSENT", detail: "no approval history for the Environment in this run" });
  else if (entries.some((a) => a.state === "rejected")) out.push({ code: "APPROVAL_REJECTED", detail: "the Environment review was rejected" });
  else if (entries.length > 1) out.push({ code: "APPROVAL_HISTORY_AMBIGUOUS", detail: `${entries.length} history entries for the Environment, exactly one is required` });
  else {
    const a = entries[0];
    if (a.state !== "approved") out.push({ code: "APPROVAL_NOT_APPROVED", detail: `state=${a.state}` });
    if (a.environments.length !== 1 || a.environments[0].id !== ce.id || a.environments[0].name !== ce.name) out.push({ code: "APPROVAL_ENV_MISMATCH", detail: "approval does not refer exactly to the pinned Environment" });
    if (a.userLogin !== rev.login || a.userId !== rev.id || a.userType !== rev.type) out.push({ code: "REVIEWER_MISMATCH", detail: `approved by '${a.userLogin}' (${a.userId}, ${a.userType})` });
    if (a.userId === run?.actor?.id || a.userId === run?.triggering_actor?.id) out.push({ code: "SELF_APPROVAL", detail: "the approver is the identity that requested the run" });
  }
}

/** Everything that can be decided BEFORE asking the human. Also re-run after the approval. */
export const evaluateRequest = guarded("request", (config, facts) => {
  const out = [];
  const { inputs, context, run, pr } = facts;
  const scope = config.scopes[inputs.scopeId];

  // --- scope and inputs
  if (!/^[a-z0-9][a-z0-9-]*$/.test(String(inputs.scopeId)) || !scope) out.push({ code: "SCOPE_UNKNOWN", detail: `scope '${inputs.scopeId}' is not defined in governance/gates/plan-approval.json` });
  if (!/^[1-9][0-9]*$/.test(String(inputs.prNumber))) out.push({ code: "PR_INPUT_INVALID", detail: "pull request number is not a positive integer" });
  if (!SHA1.test(String(inputs.headSha))) out.push({ code: "SHA_INPUT_INVALID", detail: "expected head SHA is not a 40-hex commit id" });
  if (scope && String(scope.pullRequest) !== String(inputs.prNumber)) out.push({ code: "PR_MISMATCH", detail: `scope '${inputs.scopeId}' is for PR #${scope.pullRequest}, request is for #${inputs.prNumber}` });

  // --- repository and trusted workflow
  if (context.repository !== config.repository.fullName) out.push({ code: "REPO_MISMATCH", detail: `repository '${context.repository}'` });
  if (run?.repository?.id !== config.repository.id) out.push({ code: "REPO_ID_MISMATCH", detail: `run repository id ${run?.repository?.id}` });
  if (context.eventName !== config.workflow.eventName || run?.event !== config.workflow.eventName) out.push({ code: "EVENT_INVALID", detail: `event '${context.eventName}'/'${run?.event}', expected ${config.workflow.eventName}` });
  if (run?.path !== config.workflow.path) out.push({ code: "WORKFLOW_UNTRUSTED", detail: `workflow path '${run?.path}', expected ${config.workflow.path}` });
  if (context.ref !== config.workflow.ref || run?.head_branch !== config.workflow.branch) out.push({ code: "WORKFLOW_NOT_FROM_MAIN", detail: `ref '${context.ref}', run branch '${run?.head_branch}'` });
  if (facts.workflowAncestry !== "identical" && facts.workflowAncestry !== "ahead") out.push({ code: "WORKFLOW_NOT_ON_MAIN", detail: `workflow commit is not on main (compare: ${facts.workflowAncestry ?? "unavailable"})` });
  out.push(...evaluateWorkflowRevision(config, facts.workflowFiles));
  out.push(...evaluateConfigSource(config, facts.configSource));
  if (!SHA1.test(String(run?.head_sha)) || run.head_sha !== context.sha) out.push({ code: "RUN_SHA_MISMATCH", detail: "run head_sha differs from the executing commit" });
  if (context.runAttempt !== config.workflow.runAttempt || run?.run_attempt !== config.workflow.runAttempt) out.push({ code: "RUN_ATTEMPT", detail: `run_attempt ${context.runAttempt}/${run?.run_attempt}, only attempt ${config.workflow.runAttempt} is accepted` });
  if (String(run?.id) !== String(context.runId)) out.push({ code: "RUN_ID_MISMATCH", detail: `run id ${run?.id} vs ${context.runId}` });

  // --- requesting identity: the App bot user, as actor AND triggering_actor
  if (config.requester.botUserId === null) out.push({ code: "REQUESTER_NOT_PINNED", detail: "requester.botUserId is not pinned: the App identity cannot be verified" });
  checkIdentity(config, run?.actor, "actor", out);
  checkIdentity(config, run?.triggering_actor, "triggering_actor", out);
  if (run?.actor && run?.triggering_actor && run.actor.id !== run.triggering_actor.id) out.push({ code: "ACTOR_TRIGGERING_DIFFER", detail: "actor and triggering_actor are different identities (re-run or delegated trigger)" });
  const bu = facts.botUser;
  if (config.requester.botUserId !== null && (!bu || bu.login !== config.requester.botLogin || bu.type !== "Bot" || bu.id !== config.requester.botUserId)) out.push({ code: "BOT_USER_MISMATCH", detail: "GitHub user record for the App bot does not match the pinned identity" });
  if (run?.actor?.id === config.reviewer.id || run?.actor?.login === config.reviewer.login || run?.triggering_actor?.id === config.reviewer.id) out.push({ code: "REQUESTER_IS_REVIEWER", detail: "the requesting identity is the human reviewer" });

  // --- pull request (untrusted data, only compared)
  if (!pr) out.push({ code: "PR_UNAVAILABLE", detail: "pull request could not be read" });
  else {
    if (String(pr.number) !== String(inputs.prNumber)) out.push({ code: "PR_MISMATCH", detail: `PR #${pr.number} returned for #${inputs.prNumber}` });
    if (pr.state !== "open") out.push({ code: "PR_NOT_OPEN", detail: `state=${pr.state}` });
    if (pr.merged) out.push({ code: "PR_MERGED", detail: "pull request is merged" });
    if (scope && pr.baseRef !== scope.baseBranch) out.push({ code: "BASE_MISMATCH", detail: `base '${pr.baseRef}', expected '${scope.baseBranch}'` });
    if (scope && pr.headRef !== scope.headBranch) out.push({ code: "HEAD_BRANCH_MISMATCH", detail: `head branch '${pr.headRef}', expected '${scope.headBranch}'` });
    if (pr.headRepoFork || pr.headRepoId !== config.repository.id || pr.baseRepoId !== config.repository.id) out.push({ code: "PR_FROM_FORK", detail: "head repository is not this repository" });
    if (pr.headSha !== inputs.headSha) out.push({ code: "HEAD_MISMATCH", detail: `PR head ${String(pr.headSha).slice(0, 7)} is not the expected ${String(inputs.headSha).slice(0, 7)}` });
  }

  // --- the nine documents
  const docs = facts.documents ?? [];
  if (scope) {
    if (!sameSet(docs.map((d) => d.path), scope.documents)) out.push({ code: "DOC_SET_MISMATCH", detail: "the document list differs from the scope definition" });
    for (const d of docs) {
      if (d.missing) out.push({ code: "DOC_MISSING", detail: d.path });
      else if (d.type !== "file") out.push({ code: "DOC_NOT_REGULAR_FILE", detail: `${d.path} is '${d.type}'` });
      else if (!SHA256.test(String(d.sha256))) out.push({ code: "DOC_UNREADABLE", detail: d.path });
    }
  }

  out.push(...evaluateEnvironment(config, facts.environment));
  return out;
});

/** After the Environment approval: everything above again, plus the approval history and "nothing moved since the request". */
export const evaluateApproval = guarded("approval", (config, facts) => {
  const out = evaluateRequest(config, facts);
  if (!facts.expectedFingerprint) out.push({ code: "NO_REQUEST_BINDING", detail: "fingerprint recorded before the approval is missing" });
  else if (facts.documents && facts.pr) {
    let current = null;
    try {
      current = planSetFingerprint({ scopeId: facts.inputs.scopeId, repositoryId: config.repository.id, pullRequestNumber: Number(facts.inputs.prNumber), headSHA: facts.pr.headSha, documents: facts.documents });
    } catch { /* falls through: an unfingerprintable plan set is a changed one */ }
    if (current !== facts.expectedFingerprint) out.push({ code: "PLAN_SET_CHANGED", detail: "head SHA or a document changed between the request and the approval" });
  }
  if (!Array.isArray(facts.approvals)) out.push({ code: "APPROVAL_ABSENT", detail: "approval history could not be read" });
  else checkApprovalHistory(config, facts.approvals, facts.run, out);
  return out;
});

/** The receipt, from facts that already passed evaluateApproval. Throws if they did not: no receipt without PASS. */
export function buildReceipt(config, facts, { approvalObservedAt, generatedAt }) {
  const findings = evaluateApproval(config, facts);
  if (findings.length) throw new Error(`BLOCKED: ${findings.map((f) => f.code).join(", ")}`);
  const documents = facts.documents.map((d) => ({ path: d.path, sha256: d.sha256 })).sort((a, b) => (a.path < b.path ? -1 : 1));
  const fp = planSetFingerprint({ scopeId: facts.inputs.scopeId, repositoryId: config.repository.id, pullRequestNumber: facts.pr.number, headSHA: facts.pr.headSha, documents });
  const a = facts.approvals.find((x) => x.environments.some((e) => e.id === config.environment.id));
  const identity = describeConfigBytes(facts.configSource.remote.bytes);
  return {
    schemaVersion: 1,
    receiptId: `par-${facts.run.id}-${fp.slice(0, 16)}`,
    scopeId: facts.inputs.scopeId,
    repositoryId: config.repository.id,
    repositoryName: config.repository.fullName,
    pullRequestNumber: facts.pr.number,
    baseBranch: facts.pr.baseRef,
    headBranch: facts.pr.headRef,
    headSHA: facts.pr.headSha,
    documents,
    planSetFingerprint: fp,
    workflowPath: facts.run.path,
    workflowSHA: facts.run.head_sha,
    workflowRunId: facts.run.id,
    trustedConfig: { path: TRUSTED_CONFIG_PATH, sourceRevision: facts.run.head_sha, gitBlobSha: identity.gitBlobSha, sha256: identity.sha256, repositoryId: config.repository.id, workflowRunId: facts.run.id },
    runAttempt: facts.run.run_attempt,
    eventName: facts.run.event,
    actorLogin: facts.run.actor.login,
    actorId: facts.run.actor.id,
    actorType: facts.run.actor.type,
    environmentName: config.environment.name,
    environmentId: config.environment.id,
    approvalState: a.state,
    reviewerLogin: a.userLogin,
    reviewerId: a.userId,
    approvalObservedAt,
    generatedAt,
  };
}

/** Structure (schema) plus self-consistency (fingerprint, id, scope, strict dates). Says nothing about provenance. */
export const validateReceipt = guarded("receipt", (receipt, schema, config) => {
  const out = validate(receipt, schema).map((detail) => ({ code: "RECEIPT_SCHEMA", detail }));
  if (out.length) return out;
  const scope = config.scopes[receipt.scopeId];
  if (!scope) return [{ code: "RECEIPT_SCOPE", detail: `scope '${receipt.scopeId}' is not defined` }];
  const paths = receipt.documents.map((d) => d.path);
  if (new Set(paths).size !== paths.length || !sameSet(paths, scope.documents)) out.push({ code: "RECEIPT_DOCUMENTS", detail: "receipt documents differ from the scope definition" });
  const fp = planSetFingerprint(receipt);
  if (fp !== receipt.planSetFingerprint) out.push({ code: "RECEIPT_TAMPERED", detail: "planSetFingerprint does not match the receipt content" });
  if (receipt.receiptId !== `par-${receipt.workflowRunId}-${receipt.planSetFingerprint.slice(0, 16)}`) out.push({ code: "RECEIPT_TAMPERED", detail: "receiptId is not derived from run id and fingerprint" });
  if (receipt.repositoryId !== config.repository.id || receipt.repositoryName !== config.repository.fullName) out.push({ code: "RECEIPT_REPO", detail: "receipt is for another repository" });
  if (receipt.workflowPath !== config.workflow.path) out.push({ code: "WORKFLOW_UNTRUSTED", detail: receipt.workflowPath });
  const tc = receipt.trustedConfig;
  if (tc.path !== TRUSTED_CONFIG_PATH) out.push({ code: "CONFIG_PATH", detail: tc.path });
  if (tc.sourceRevision !== receipt.workflowSHA) out.push({ code: "CONFIG_SOURCE_NOT_RUN_COMMIT", detail: "the configuration was not read at the commit the run executed" });
  if (tc.repositoryId !== receipt.repositoryId) out.push({ code: "CONFIG_REPO_MISMATCH", detail: String(tc.repositoryId) });
  if (tc.workflowRunId !== receipt.workflowRunId) out.push({ code: "CONFIG_RUN_MISMATCH", detail: String(tc.workflowRunId) });
  if (receipt.environmentName !== config.environment.name || receipt.environmentId !== config.environment.id) out.push({ code: "ENV_MISMATCH", detail: receipt.environmentName });
  if (receipt.reviewerLogin !== config.reviewer.login || receipt.reviewerId !== config.reviewer.id) out.push({ code: "REVIEWER_MISMATCH", detail: receipt.reviewerLogin });
  if (receipt.actorLogin !== config.requester.botLogin || receipt.actorId !== config.requester.botUserId) out.push({ code: "ACTOR_WRONG", detail: receipt.actorLogin });
  if (receipt.reviewerId === receipt.actorId) out.push({ code: "SELF_APPROVAL", detail: "reviewer and actor share an id" });
  const observed = parseIsoInstant(receipt.approvalObservedAt), generated = parseIsoInstant(receipt.generatedAt);
  if (Number.isNaN(observed) || Number.isNaN(generated)) out.push({ code: "RECEIPT_TIME_INVALID", detail: "approvalObservedAt or generatedAt is not a real ISO 8601 instant" });
  else if (generated < observed) out.push({ code: "RECEIPT_TIME", detail: "generatedAt precedes approvalObservedAt" });
  return out;
});

export const REQUIRED_EVIDENCE = ["now", "artifacts", "archive", "run", "workflowAncestry", "workflowFiles", "trustedConfig", "pr", "prRecheck", "documents", "environment", "approvals", "expected"];
const PR_FIELDS = ["number", "state", "merged", "baseRef", "headRef", "headSha", "headRepoId", "headRepoFork"];

/**
 * Consumer-side check (the Coordinator will call this; the Coordinator itself is out of scope here). ALL evidence
 * is mandatory; a missing piece is BLOCKED, never skipped. live = {
 *   now,                       consumer clock (ISO), only used for artifact expiry and future-dated receipts
 *   artifacts,                 artifacts of the receipt's run as listed by GitHub (normalized)
 *   archive,                   describeArchive(): digest/size of the bytes DOWNLOADED from that artifact + parsed content
 *   run, workflowAncestry, workflowFiles,   the run, main-ancestry of its commit, blobs of the workflow files there
 *   pr, prRecheck, documents,  live PR, a second PR read taken AFTER everything else (TOCTOU), live document hashes
 *   environment, approvals,    live Environment protection and the run's approval history
 *   expected                   what the consumer is about to authorise: { scopeId, pullRequestNumber, headSha }
 * }
 * The PASS verdict carries `binding`: the Builder may only be enabled for exactly that head SHA, and the consumer must
 * call this again immediately before each enabling (a previous PASS is not an authorisation).
 */
export function verifyReceiptProvenance({ receipt, schema, config, live }) {
  try {
    return verifyProvenance({ receipt, schema, config, live });
  } catch (e) {
    return verdict([{ code: "EVIDENCE_MALFORMED", detail: `provenance: ${e.message}` }]);
  }
}

function verifyProvenance({ receipt, schema, config, live }) {
  const out = validateReceipt(receipt, schema, config);
  if (out.some((f) => f.code === "RECEIPT_SCHEMA" || f.code === "EVIDENCE_MALFORMED")) return verdict(out);
  if (!live || typeof live !== "object") return verdict([...out, { code: "EVIDENCE_INCOMPLETE", detail: "no live evidence was supplied" }]);
  const missing = REQUIRED_EVIDENCE.filter((k) => live[k] === undefined || live[k] === null);
  const ex = live.expected;
  if (ex && (typeof ex.scopeId !== "string" || !Number.isInteger(ex.repositoryId) || !Number.isInteger(ex.pullRequestNumber) || !SHA1.test(String(ex.headSha)))) missing.push("expected.{scopeId,repositoryId,pullRequestNumber,headSha}");
  if (missing.length) return verdict([...out, ...missing.map((k) => ({ code: "EVIDENCE_INCOMPLETE", detail: `live.${k} is missing or malformed` }))]);
  const now = parseIsoInstant(live.now);
  if (Number.isNaN(now)) return verdict([...out, { code: "EVIDENCE_INCOMPLETE", detail: "live.now is not a real ISO 8601 instant" }]);
  const { run, pr } = live;

  // --- layer 3/4: the real artifact of the trusted run, bytes and content
  const want = `${config.artifact.namePrefix}${receipt.workflowRunId}`;
  const matching = live.artifacts.filter((a) => a?.name === want);
  if (matching.length === 0) out.push({ code: "ARTIFACT_MISSING", detail: `no artifact '${want}' in the run (absent, deleted or expired)` });
  else if (matching.length > 1) out.push({ code: "ARTIFACT_AMBIGUOUS", detail: `${matching.length} artifacts named '${want}'` });
  else {
    const a = matching[0], wr = a.workflowRun;
    const created = parseIsoInstant(a.createdAt), expires = parseIsoInstant(a.expiresAt);
    if (a.expired !== false) out.push({ code: "ARTIFACT_EXPIRED", detail: "GitHub reports the artifact as expired" });
    if (Number.isNaN(created) || Number.isNaN(expires) || expires <= created) out.push({ code: "ARTIFACT_TIME_INVALID", detail: "artifact created_at/expires_at are not real, ordered instants" });
    else if (expires <= now) out.push({ code: "ARTIFACT_EXPIRED", detail: "artifact expires_at is in the past" });
    if (!wr) out.push({ code: "ARTIFACT_PROVENANCE", detail: "artifact has no workflow_run" });
    else {
      if (wr.id !== receipt.workflowRunId) out.push({ code: "ARTIFACT_RUN_MISMATCH", detail: `artifact belongs to run ${wr.id}` });
      if (wr.repositoryId !== receipt.repositoryId || wr.headRepositoryId !== receipt.repositoryId) out.push({ code: "ARTIFACT_REPO_MISMATCH", detail: `artifact repository ${wr.repositoryId}/${wr.headRepositoryId}` });
      if (wr.headBranch !== config.workflow.branch || wr.headSha !== receipt.workflowSHA) out.push({ code: "ARTIFACT_PROVENANCE", detail: "artifact workflow_run branch/commit differs from the trusted run" });
    }
    const ar = live.archive;
    if (!/^sha256:[0-9a-f]{64}$/.test(String(a.digest))) out.push({ code: "ARTIFACT_DIGEST_MISSING", detail: "GitHub recorded no sha256 digest for the artifact: provenance cannot be guaranteed" });
    if (ar.artifactId !== a.id) out.push({ code: "ARTIFACT_ID_MISMATCH", detail: `downloaded artifact ${ar.artifactId}, listed artifact ${a.id}` });
    if (!SHA256.test(String(ar.sha256)) || !Number.isInteger(ar.sizeBytes)) out.push({ code: "ARTIFACT_BYTES_MISSING", detail: "no downloaded bytes were hashed" });
    else {
      if (/^sha256:[0-9a-f]{64}$/.test(String(a.digest)) && a.digest !== `sha256:${ar.sha256}`) out.push({ code: "ARTIFACT_DIGEST_MISMATCH", detail: "digest of the downloaded bytes differs from the digest GitHub recorded" });
      if (ar.sizeBytes !== a.sizeInBytes) out.push({ code: "ARTIFACT_SIZE_MISMATCH", detail: `downloaded ${ar.sizeBytes} bytes, GitHub lists ${a.sizeInBytes}` });
    }
    if (ar.receipt === null || ar.receipt === undefined || typeof ar.receipt !== "object") out.push({ code: "ARTIFACT_CONTENT_INVALID", detail: ar.error ?? "the archive holds no receipt" });
    else {
      for (const f of validateReceipt(ar.receipt, schema, config)) out.push({ code: "ARTIFACT_CONTENT_INVALID", detail: `${f.code}: ${f.detail}` });
      if (canonicalJson(ar.receipt) !== canonicalJson(receipt)) out.push({ code: "ARTIFACT_TAMPERED", detail: "the receipt under test differs from the receipt inside the run's artifact" });
    }
  }

  // --- the configuration itself: recovered from the tip of main, recorded identity must match exactly
  out.push(...evaluateTrustedConfig(config, receipt, live.trustedConfig, ex));

  // --- layer 4: run provenance, trusted workflow revision
  if (run.id !== receipt.workflowRunId) out.push({ code: "RUN_ID_MISMATCH", detail: String(run.id) });
  if (run.path !== config.workflow.path || run.event !== config.workflow.eventName || run.head_branch !== config.workflow.branch) out.push({ code: "WORKFLOW_UNTRUSTED", detail: `path '${run.path}', event '${run.event}', branch '${run.head_branch}'` });
  if (run.run_attempt !== 1) out.push({ code: "RUN_ATTEMPT", detail: `run_attempt ${run.run_attempt}` });
  if (run.conclusion !== "success") out.push({ code: "RUN_NOT_SUCCESSFUL", detail: `conclusion=${run.conclusion}` });
  if (run.head_sha !== receipt.workflowSHA) out.push({ code: "WORKFLOW_UNTRUSTED", detail: "run head_sha differs from receipt.workflowSHA" });
  if (run.actor?.id !== receipt.actorId || run.actor?.login !== receipt.actorLogin || run.actor?.type !== "Bot" || run.triggering_actor?.id !== receipt.actorId) out.push({ code: "ACTOR_WRONG", detail: "run actor differs from the receipt" });
  if (run.repository?.id !== receipt.repositoryId) out.push({ code: "REPO_ID_MISMATCH", detail: String(run.repository?.id) });
  const created = parseIsoInstant(run.created_at), observed = parseIsoInstant(receipt.approvalObservedAt);
  if (Number.isNaN(created)) out.push({ code: "RUN_TIME_INVALID", detail: "run created_at is not a real ISO 8601 instant" });
  else if (observed < created) out.push({ code: "RECEIPT_TIME", detail: "approvalObservedAt precedes the creation of the run" });
  if (observed > now + CLOCK_SKEW_MS) out.push({ code: "RECEIPT_TIME", detail: "receipt is dated in the future" });
  if (live.workflowAncestry !== "identical" && live.workflowAncestry !== "ahead") out.push({ code: "WORKFLOW_NOT_ON_MAIN", detail: `compare: ${live.workflowAncestry}` });
  out.push(...evaluateWorkflowRevision(config, live.workflowFiles));
  const revision = findWorkflowRevision(config, live.workflowFiles);

  // --- approval state and Environment, re-read now (not inherited from the issuing run)
  if (!Array.isArray(live.approvals)) out.push({ code: "EVIDENCE_INCOMPLETE", detail: "live.approvals is not a list" });
  else checkApprovalHistory(config, live.approvals, run, out);
  out.push(...evaluateEnvironment(config, live.environment));

  // --- live PR, scope, documents, TOCTOU
  if (pr.state !== "open") out.push({ code: "PR_NOT_OPEN", detail: `state=${pr.state}` });
  if (pr.merged) out.push({ code: "PR_MERGED", detail: "pull request is merged" });
  if (pr.number !== receipt.pullRequestNumber) out.push({ code: "PR_MISMATCH", detail: String(pr.number) });
  if (pr.headSha !== receipt.headSHA) out.push({ code: "HEAD_CHANGED", detail: `PR head is ${String(pr.headSha).slice(0, 7)}, receipt is for ${receipt.headSHA.slice(0, 7)}` });
  if (pr.baseRef !== receipt.baseBranch) out.push({ code: "BASE_CHANGED", detail: `base is '${pr.baseRef}'` });
  if (pr.headRef !== receipt.headBranch) out.push({ code: "HEAD_BRANCH_MISMATCH", detail: pr.headRef });
  if (pr.headRepoFork || pr.headRepoId !== receipt.repositoryId) out.push({ code: "PR_FROM_FORK", detail: "head repository is not this repository" });
  if (PR_FIELDS.some((k) => pr[k] !== live.prRecheck[k])) out.push({ code: "TOCTOU_PR_CHANGED", detail: "the PR changed while the evidence was being collected" });
  const scope = config.scopes[receipt.scopeId];
  if (scope && (scope.pullRequest !== receipt.pullRequestNumber || scope.baseBranch !== receipt.baseBranch || scope.headBranch !== receipt.headBranch)) out.push({ code: "SCOPE_CHANGED", detail: "the scope definition no longer matches the receipt" });
  const byPath = new Map(live.documents.map((d) => [d.path, d]));
  for (const d of receipt.documents) {
    const l = byPath.get(d.path);
    if (!l || l.missing) out.push({ code: "DOC_MISSING", detail: d.path });
    else if (l.type !== "file" || l.sha256 !== d.sha256) out.push({ code: "DOC_CHANGED", detail: d.path });
  }

  // --- what the consumer is about to authorise
  if (ex.scopeId !== receipt.scopeId) out.push({ code: "SCOPE_MISMATCH", detail: `consumer expects scope '${ex.scopeId}'` });
  if (ex.pullRequestNumber !== receipt.pullRequestNumber) out.push({ code: "PR_MISMATCH", detail: `consumer expects PR #${ex.pullRequestNumber}` });
  if (ex.headSha !== receipt.headSHA) out.push({ code: "RECEIPT_STALE", detail: "receipt belongs to a previous head SHA" });
  if (ex.planSetFingerprint && ex.planSetFingerprint !== receipt.planSetFingerprint) out.push({ code: "RECEIPT_STALE", detail: "receipt belongs to a previous plan set" });

  return verdict(out, {
    binding: Object.freeze({
      scopeId: receipt.scopeId, repositoryId: receipt.repositoryId, pullRequestNumber: receipt.pullRequestNumber, headSHA: receipt.headSHA,
      planSetFingerprint: receipt.planSetFingerprint, workflowRunId: receipt.workflowRunId, workflowRevisionId: revision?.id ?? null,
      trustedConfigSha256: receipt.trustedConfig.sha256, trustedConfigBlobSha: receipt.trustedConfig.gitBlobSha, trustedConfigSourceRevision: receipt.trustedConfig.sourceRevision,
      mainTipSha: live.trustedConfig.tip?.sha ?? null, verifiedAt: live.now,
    }),
  });
}

/** Fields of a binding that identify WHAT was approved and by WHICH rules. `mainTipSha` and `verifiedAt` are observations, not identity. */
export const BINDING_IDENTITY = ["scopeId", "repositoryId", "pullRequestNumber", "headSHA", "planSetFingerprint", "workflowRunId", "workflowRevisionId", "trustedConfigSha256", "trustedConfigBlobSha", "trustedConfigSourceRevision"];
const BINDING_OBSERVED = ["mainTipSha", "verifiedAt"];

const positiveId = (v) => typeof v === "number" && Number.isSafeInteger(v) && v >= 1;
const matches = (re) => (v) => typeof v === "string" && re.test(v);
/**
 * One validator per identity field, derived from the producers: the receipt schema (scopeId, ids, SHAs, sha256) and
 * the governed configuration (workflowRevisionId, see REVISION_ID). Shape only; what the value MEANS is decided by the
 * verification that produced the binding. Values are never normalised (no trim, no lower-casing, no coercion).
 */
const BINDING_FIELD_VALID = {
  scopeId: matches(/^[a-z0-9][a-z0-9-]*$/),
  repositoryId: positiveId,
  pullRequestNumber: positiveId,
  headSHA: matches(SHA1),
  planSetFingerprint: matches(SHA256),
  workflowRunId: positiveId,
  workflowRevisionId: REVISION_ID,
  trustedConfigSha256: matches(SHA256),
  trustedConfigBlobSha: matches(SHA1),
  trustedConfigSourceRevision: matches(SHA1),
};
const BINDING_OBSERVED_VALID = {
  mainTipSha: (v) => v === null || matches(SHA1)(v),
  verifiedAt: (v) => typeof v === "string" && !Number.isNaN(parseIsoInstant(v)),
};

/**
 * Validates ONE binding before anything is compared and returns a snapshot of its identity fields (or null).
 * A Proxy (even a transparent one, even revoked) is rejected FIRST, before any property, prototype or descriptor is read:
 * its traps are code supplied by the caller and could answer differently on each read. A binding is data, never a Proxy.
 * The binding is a closed, flat JSON object: a plain object whose every identity field is an OWN data property (inherited
 * values, getters and symbol keys are rejected, so what is validated is what is compared), no unexpected property, each
 * value present (not undefined/null) and valid for its field. Values are never echoed in findings.
 */
function readBinding(label, b, out) {
  if (types.isProxy(b)) {
    out.push({ code: "BINDING_MALFORMED", detail: `${label} binding is a Proxy: not accepted as identity evidence` });
    return null;
  }
  const proto = b !== null && typeof b === "object" ? Object.getPrototypeOf(b) : undefined;
  if (!b || typeof b !== "object" || (proto !== Object.prototype && proto !== null)) {
    out.push({ code: "BINDING_INCOMPLETE", detail: `${label} binding is missing or is not a plain object` });
    return null;
  }
  const before = out.length;
  const allowed = [...BINDING_IDENTITY, ...BINDING_OBSERVED];
  const extra = Reflect.ownKeys(b).filter((k) => !allowed.includes(k));
  if (extra.length) out.push({ code: "BINDING_MALFORMED", detail: `${label} binding has ${extra.length} unexpected propert${extra.length === 1 ? "y" : "ies"}` });
  const snapshot = {};
  for (const k of allowed) {
    const observed = BINDING_OBSERVED.includes(k);
    if (!Object.hasOwn(b, k)) {
      if (!observed) out.push({ code: "BINDING_INCOMPLETE", detail: `${label} binding.${k} is not an own property` });
      continue;
    }
    const d = Object.getOwnPropertyDescriptor(b, k);
    if (!("value" in d) || !d.enumerable) out.push({ code: "BINDING_MALFORMED", detail: `${label} binding.${k} is not an enumerable data property` });
    else if (d.value === undefined || (d.value === null && !observed)) out.push({ code: "BINDING_INCOMPLETE", detail: `${label} binding.${k} is absent or null` });
    else if (!(BINDING_FIELD_VALID[k] ?? BINDING_OBSERVED_VALID[k])(d.value)) out.push({ code: "BINDING_MALFORMED", detail: `${label} binding.${k} is not a valid ${typeof d.value === "string" ? "value for its format" : `${typeof d.value} value`}` });
    else snapshot[k] = d.value;
  }
  return out.length === before ? snapshot : null;
}

/**
 * Compares the binding of an earlier PASS with the binding of a FRESH verification. BOTH are validated first (shape,
 * own properties, type and format of every identity field); a binding that cannot be validated is BLOCKED and nothing is
 * compared. Then any difference in any identity field (a new head SHA, another fingerprint, a changed configuration, a
 * different workflow revision, another run) is BLOCKED: the earlier approval does not cover the new state. Comparison is
 * exact. This never replaces the fresh verification, it only says whether the freshly verified state is still the
 * approved one. Whatever the input, the answer is a list of findings: an empty list is the only authorisation.
 */
export const evaluateBinding = guarded("binding", (approved, fresh) => {
  const out = [];
  const a = readBinding("approved", approved, out);
  const f = readBinding("fresh", fresh, out);
  if (out.length || !a || !f) return out.length ? out : [{ code: "BINDING_INCOMPLETE", detail: "a binding could not be validated" }];
  for (const k of BINDING_IDENTITY) if (a[k] !== f[k]) out.push({ code: "BINDING_CHANGED", detail: `${k} differs from the approved binding` });
  return out;
});

/**
 * Separation of the human and the agent identity, as observed from the process that runs the agent.
 * probe = { tokenEnvNames: string[], ghAccounts: [{ host, login }] | null, credentialTargets: string[] | null,
 *            unknown?: { ghAccounts?: string, credentialTargets?: string } }
 * Names and logins only, never secret values. `null` or any malformed shape = UNKNOWN => BLOCKED (never "nothing found").
 * An empty list means "none" ONLY because the probe that produced it ran successfully and recognised its own output;
 * `unknown.*` carries the non-sensitive cause of a null (tool missing, timeout, unrecognised output...) into the finding.
 *
 * DETECTION IS NOT ISOLATION. A PASS means "none of the usual ways to reach the owner's GitHub identity was seen from
 * this process". It does not prove that the Windows user cannot read another user's credentials, the owner's browser
 * session or any store this probe does not know. The boundary is the OS account separation of
 * governance/security/AGENT-HUMAN-IDENTITY-SEPARATION.md, which is not implemented here.
 */
export const evaluateAgentIsolation = guarded("agent isolation", (config, probe) => {
  const out = [];
  const cause = (key) => (typeof probe.unknown?.[key] === "string" && /^[A-Za-z0-9_:=(),. -]{1,120}$/.test(probe.unknown[key]) ? ` [${probe.unknown[key]}]` : "");
  const unknown = (detail, key) => out.push({ code: "AGENT_PROBE_UNAVAILABLE", detail: `UNKNOWN: ${detail}${key ? cause(key) : ""}` });
  if (!probe || typeof probe !== "object") return [{ code: "AGENT_PROBE_UNAVAILABLE", detail: "UNKNOWN: no probe result" }];
  const human = config.reviewer.login.toLowerCase();
  const names = probe.tokenEnvNames;
  if (!Array.isArray(names) || !names.every((n) => typeof n === "string")) unknown("token environment variables could not be determined");
  else if (names.length) out.push({ code: "AGENT_TOKEN_IN_ENV", detail: `token variables set in the agent environment: ${names.join(", ")}` });
  const accounts = probe.ghAccounts;
  if (!Array.isArray(accounts)) unknown("gh account state could not be determined", "ghAccounts");
  else if (!accounts.every((a) => a && typeof a.login === "string" && a.login.length && typeof a.host === "string")) unknown("gh reported an account without a readable login");
  else if (accounts.some((a) => a.login.toLowerCase() === human)) out.push({ code: "AGENT_HUMAN_GH_ACCOUNT", detail: `gh is authenticated as the human owner '${config.reviewer.login}' in the agent profile` });
  const targets = probe.credentialTargets;
  if (!Array.isArray(targets) || !targets.every((t) => typeof t === "string")) unknown("stored credential targets could not be determined", "credentialTargets");
  else if (targets.length) out.push({ code: "AGENT_GIT_CREDENTIAL", detail: `GitHub credentials are stored in the agent profile: ${targets.join(", ")}` });
  return out;
});
