#!/usr/bin/env node
// Plan Approval Receipt: GitHub I/O around the pure decisions in plan-approval-receipt.mjs.
//   request               before the human gate: verify request, App identity, workflow revision, PR, nine documents, Environment.
//   issue                 after the Environment approval: re-verify everything, read the approval history, write the receipt.
//   verify <receipt> <scopeId> <pr> <headSha>
//                         consumer-side check against GitHub: recovers the trusted configuration from the tip of main (never
//                         from the worktree or the PR), downloads the real artifact, checks digest, bytes, content, run,
//                         approval, Environment, PR and documents (PR and main read twice for TOCTOU). Prints the binding on PASS.
//   trusted-config        read-only: prints the identity of the configuration at the tip of main (sourceRevision, git blob, sha256).
//   check-environment     read-only audit of the Environment protection (for the owner / the independent reviewer).
//   check-agent-isolation run from the AGENT's profile: is the owner's GitHub identity reachable from here? (names only;
//                         DETECTION IS NOT ISOLATION, see governance/security/AGENT-HUMAN-IDENTITY-SEPARATION.md)
// The PR is untrusted data: documents are fetched through the contents API at an exact commit SHA and only hashed.
// Nothing here executes PR content, installs anything, approves anything, or calls a write endpoint. Every path
// that is not a clean PASS exits non-zero (fail-closed), including unexpected exceptions.
import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describeArchive } from "./plan-approval-artifact.mjs";
import { TRUSTED_CONFIG_PATH, buildReceipt, describeConfigBytes, evaluateAgentIsolation, evaluateApproval, evaluateEnvironment, evaluateRequest, planSetFingerprint, sameConfigBytes, sha256Hex, validateReceipt, verdict, verifyReceiptProvenance } from "./plan-approval-receipt.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
// The branch whose history is the root of trust of the configuration (content-addressed commits, human-reviewed merges).
export const TRUSTED_BRANCH = "main";
const SHA1 = /^[0-9a-f]{40}$/;
const REPO_NAME = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
/** The configuration the PROCESS runs with: its original bytes (the identity is computed over them) and their parse. */
export const loadConfigFile = () => {
  const bytes = readFileSync(join(root, ...TRUSTED_CONFIG_PATH.split("/")));
  return { bytes, config: JSON.parse(bytes.toString("utf8")) };
};
export const loadConfig = () => loadConfigFile().config;
export const loadSchema = () => JSON.parse(readFileSync(join(root, "contracts", "plan-approval-receipt.schema.json"), "utf8"));

/** Default transport: the gh CLI, GET only, args as an array (no shell). */
export function ghApi(path) {
  const r = spawnSync("gh", ["api", "-H", "Accept: application/vnd.github+json", path], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw Object.assign(new Error(`gh api ${path}: ${(r.stderr || r.stdout || r.error?.message || "").trim()}`), { notFound: /HTTP 404/.test(r.stderr) });
  return JSON.parse(r.stdout);
}

/** Authenticated download of raw bytes (artifact zip). GET only; gh follows the 302 to the short-lived storage URL. */
export function ghDownload(path) {
  const r = spawnSync("gh", ["api", path], { maxBuffer: 16 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`gh api ${path}: ${String(r.stderr ?? "").trim()}`);
  return r.stdout;
}

const attempt = (fn) => {
  try {
    return fn();
  } catch {
    return null;
  }
};
const tryApi = (api, path) => attempt(() => api(path));

const encodePath = (p) => p.split("/").map(encodeURIComponent).join("/");
const idOf = (u) => (u ? { login: u.login, id: u.id, type: u.type } : null);

/** The configuration file at an exact commit: the bytes exactly as GitHub stores them, and the git blob id GitHub reports. */
export function readConfigAt(api, repo, ref) {
  if (!SHA1.test(String(ref))) return null;
  const c = tryApi(api, `repos/${repo}/contents/${encodePath(TRUSTED_CONFIG_PATH)}?ref=${ref}`);
  if (!c || Array.isArray(c) || c.type !== "file" || c.encoding !== "base64" || typeof c.content !== "string" || !SHA1.test(String(c.sha))) return null;
  const bytes = Buffer.from(c.content, "base64");
  return bytes.length && bytes.length === c.size ? { bytes, blobSha: c.sha } : null;
}

/** Current head commit of the trusted branch. */
export const readMainTip = (api, repo) => {
  const r = tryApi(api, `repos/${repo}/git/ref/heads/${TRUSTED_BRANCH}`);
  return r?.object?.type === "commit" && SHA1.test(String(r.object.sha)) ? { sha: r.object.sha } : null;
};

export const readRepository = (api, repo) => {
  const r = tryApi(api, `repos/${repo}`);
  return r && Number.isInteger(r.id) && typeof r.full_name === "string" ? { id: r.id, fullName: r.full_name } : null;
};

/**
 * CONSUMER side: the configuration is recovered from the tip of main on GitHub and from nowhere else (not from the
 * worktree, not from the PR, not from the receipt). Returns null when no non-circular root of trust can be established.
 * `repo` is only a locator: the repository identity is cross-checked (id and name) by evaluateTrustedConfig.
 */
export function loadTrustedConfig({ api, repo }) {
  if (!REPO_NAME.test(String(repo)) || String(repo).split("/").some((p) => /^\.+$/.test(p))) return null;
  const repository = readRepository(api, repo);
  const tip = readMainTip(api, repo);
  const atTip = tip ? readConfigAt(api, repo, tip.sha) : null;
  if (!repository || !tip || !atTip) return null;
  let config;
  try {
    config = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(atTip.bytes));
  } catch {
    return null;
  }
  return config && typeof config === "object" && !Array.isArray(config) ? { config, repository, tip, atTip } : null;
}

export function readEnvironment(api, repo, name) {
  const e = tryApi(api, `repos/${repo}/environments/${encodeURIComponent(name)}`);
  const pol = tryApi(api, `repos/${repo}/environments/${encodeURIComponent(name)}/deployment-branch-policies`);
  if (!e || !pol) return null;
  const rule = (e.protection_rules ?? []).find((r) => r.type === "required_reviewers");
  return {
    id: e.id,
    name: e.name,
    canAdminsBypass: e.can_admins_bypass,
    preventSelfReview: rule ? rule.prevent_self_review : null,
    reviewers: (rule?.reviewers ?? []).map((r) => ({ type: r.type, login: r.reviewer?.login, id: r.reviewer?.id })),
    protectedBranches: e.deployment_branch_policy?.protected_branches ?? null,
    customBranchPolicies: e.deployment_branch_policy?.custom_branch_policies ?? null,
    branchPolicies: (pol.branch_policies ?? []).map((p) => (p.type === "branch" ? p.name : `${p.type}:${p.name}`)),
  };
}

export function readPullRequest(api, repo, number) {
  const p = tryApi(api, `repos/${repo}/pulls/${number}`);
  if (!p) return null;
  return {
    number: p.number,
    state: p.state,
    merged: p.merged === true,
    baseRef: p.base?.ref,
    headRef: p.head?.ref,
    headSha: p.head?.sha,
    baseRepoId: p.base?.repo?.id ?? null,
    headRepoId: p.head?.repo?.id ?? null,
    headRepoFork: p.head?.repo ? p.head.repo.fork === true : true,
  };
}

/** Hashes the scope documents at the exact commit. Missing => { missing: true }; never executes or parses content. */
export function readDocuments(api, repo, paths, sha) {
  return paths.map((path) => {
    const c = tryApi(api, `repos/${repo}/contents/${encodePath(path)}?ref=${sha}`);
    if (!c || Array.isArray(c)) return { path, missing: true };
    const bytes = c.encoding === "base64" && typeof c.content === "string" && c.content.length ? Buffer.from(c.content, "base64") : null;
    return { path, type: c.type, sha256: bytes && bytes.length === c.size ? sha256Hex(bytes) : null };
  });
}

/** Git blob ids (as GitHub reports them) of the files the workflow executes, at the run commit. */
export function readWorkflowFiles(api, repo, paths, sha) {
  return paths.map((path) => {
    const c = tryApi(api, `repos/${repo}/contents/${encodePath(path)}?ref=${sha}`);
    return !c || Array.isArray(c) ? { path, type: "missing", blobSha: null } : { path, type: c.type, blobSha: c.sha };
  });
}

export const readApprovals = (api, repo, runId) =>
  api(`repos/${repo}/actions/runs/${Number(runId)}/approvals`).map((a) => ({ state: a.state, userLogin: a.user?.login, userId: a.user?.id, userType: a.user?.type, environments: (a.environments ?? []).map((e) => ({ id: e.id, name: e.name })) }));

const normRun = (r) => r && { id: r.id, run_attempt: r.run_attempt, event: r.event, path: r.path, head_sha: r.head_sha, head_branch: r.head_branch, conclusion: r.conclusion ?? null, created_at: r.created_at, repository: { id: r.repository?.id }, actor: idOf(r.actor), triggering_actor: idOf(r.triggering_actor) };

export function collectFacts({ api, env, config, configBytes, withApprovals }) {
  const repo = env.GITHUB_REPOSITORY;
  const inputs = { prNumber: env.INPUT_PR ?? "", headSha: env.INPUT_SHA ?? "", scopeId: env.INPUT_SCOPE ?? "" };
  const context = { repository: repo, runId: env.GITHUB_RUN_ID, runAttempt: Number(env.GITHUB_RUN_ATTEMPT), eventName: env.GITHUB_EVENT_NAME, ref: env.GITHUB_REF, sha: env.GITHUB_SHA };
  const scope = config.scopes[inputs.scopeId];
  const validInputs = /^[1-9][0-9]*$/.test(inputs.prNumber) && /^[0-9a-f]{40}$/.test(inputs.headSha);
  const r = api(`repos/${repo}/actions/runs/${Number(context.runId)}`);
  const tip = readMainTip(api, repo);
  const tipConfig = tip ? readConfigAt(api, repo, tip.sha) : null;
  const facts = {
    inputs,
    context,
    run: normRun(r),
    configSource: { local: configBytes ?? null, remote: readConfigAt(api, repo, r.head_sha), tip: tip && tipConfig ? { sha: tip.sha, blobSha: tipConfig.blobSha } : null },
    botUser: tryApi(api, `users/${encodeURIComponent(config.requester.botLogin)}`),
    workflowAncestry: tryApi(api, `repos/${repo}/compare/${r.head_sha}...${config.workflow.branch}?per_page=1`)?.status ?? null,
    workflowFiles: readWorkflowFiles(api, repo, config.workflow.trustedFiles, r.head_sha),
    pr: validInputs ? readPullRequest(api, repo, inputs.prNumber) : null,
    documents: scope && validInputs ? readDocuments(api, repo, scope.documents, inputs.headSha) : [],
    environment: readEnvironment(api, repo, config.environment.name),
  };
  if (facts.botUser) facts.botUser = { login: facts.botUser.login, id: facts.botUser.id, type: facts.botUser.type };
  if (withApprovals) {
    facts.approvals = readApprovals(api, repo, context.runId);
    facts.expectedFingerprint = env.EXPECTED_FINGERPRINT || null;
  }
  return facts;
}

/**
 * Consumer side. Layer 1 = authenticated download (here), layer 2 = bytes (describeArchive), layer 3 = content and
 * layer 4 = run provenance (verifyReceiptProvenance). The PR is read before AND after everything else (TOCTOU).
 * Nothing is trusted from the receipt except which run and which PR to look at.
 */
export function collectProvenanceEvidence({ api, download, config, trusted, receipt, expected, now }) {
  const repo = config.repository.fullName;
  const runId = receipt?.workflowRunId;
  // The receipt is untrusted JSON: nothing from it reaches an API path unless it has the exact expected shape.
  if (!Number.isInteger(runId) || runId < 1) throw new Error("receipt.workflowRunId is not a positive integer");
  if (!Number.isInteger(receipt.pullRequestNumber) || receipt.pullRequestNumber < 1) throw new Error("receipt.pullRequestNumber is not a positive integer");
  const sourceRevision = receipt.trustedConfig?.sourceRevision;
  if (!SHA1.test(String(sourceRevision))) throw new Error("receipt.trustedConfig.sourceRevision is not a commit id");
  if (!trusted?.tip || !trusted.atTip || !trusted.repository) throw new Error("the trusted configuration was not recovered from GitHub");
  const scope = config.scopes[receipt.scopeId];
  const run = normRun(tryApi(api, `repos/${repo}/actions/runs/${runId}`));
  const name = `${config.artifact.namePrefix}${runId}`;
  const list = tryApi(api, `repos/${repo}/actions/runs/${runId}/artifacts?name=${encodeURIComponent(name)}&per_page=100`);
  const artifacts = list && Array.isArray(list.artifacts)
    ? list.artifacts.map((a) => ({ id: a.id, name: a.name, expired: a.expired, createdAt: a.created_at, expiresAt: a.expires_at, sizeInBytes: a.size_in_bytes, digest: a.digest ?? null, workflowRun: a.workflow_run ? { id: a.workflow_run.id, repositoryId: a.workflow_run.repository_id, headRepositoryId: a.workflow_run.head_repository_id, headBranch: a.workflow_run.head_branch, headSha: a.workflow_run.head_sha } : null }))
    : null;
  const target = artifacts?.filter((a) => a.name === name);
  let bytes = null;
  if (target?.length === 1 && Number.isInteger(target[0].sizeInBytes) && target[0].sizeInBytes <= 2 * 1024 * 1024) bytes = attempt(() => download(`repos/${repo}/actions/artifacts/${target[0].id}/zip`));
  const archive = describeArchive({ artifactId: target?.length === 1 ? target[0].id : null, bytes, entryName: config.artifact.fileName });
  const pr = readPullRequest(api, repo, receipt.pullRequestNumber);
  const headForDocs = pr?.headSha ?? receipt.headSHA;
  const live = {
    now,
    artifacts,
    archive,
    run,
    workflowAncestry: run ? tryApi(api, `repos/${repo}/compare/${run.head_sha}...${config.workflow.branch}?per_page=1`)?.status ?? null : null,
    workflowFiles: run ? readWorkflowFiles(api, repo, config.workflow.trustedFiles, run.head_sha) : null,
    environment: readEnvironment(api, repo, config.environment.name),
    approvals: attempt(() => readApprovals(api, repo, runId)),
    pr,
    documents: scope ? readDocuments(api, repo, scope.documents, headForDocs) : null,
    expected,
  };
  // Everything that can move while the evidence is collected is read AGAIN, last: the PR and the tip of main.
  live.prRecheck = readPullRequest(api, repo, receipt.pullRequestNumber);
  live.trustedConfig = {
    repository: trusted.repository,
    tip: trusted.tip,
    atTip: trusted.atTip,
    atSource: readConfigAt(api, repo, sourceRevision),
    ancestry: tryApi(api, `repos/${repo}/compare/${sourceRevision}...${trusted.tip.sha}?per_page=1`)?.status ?? null,
    tipRecheck: readMainTip(api, repo),
  };
  return live;
}

/**
 * Consumer entry point. The configuration is NOT a parameter: it is recovered here from the tip of main on GitHub
 * (loadTrustedConfig) and the receipt is judged by it. `repo` only says where to look. `localConfigBytes` (optional, the
 * consumer's own checkout) can only ADD a finding: a checkout that differs from main is BLOCKED, never preferred.
 */
export function verifyFromGitHub({ api, download, schema, receipt, expected, now, repo, localConfigBytes }) {
  try {
    const trusted = loadTrustedConfig({ api, repo });
    if (!trusted) return verdict([{ code: "CONFIG_UNREADABLE", detail: "the trusted configuration could not be recovered from the tip of main: no non-circular root of trust, nothing is verified" }]);
    const live = collectProvenanceEvidence({ api, download, config: trusted.config, trusted, receipt, expected, now });
    const result = verifyReceiptProvenance({ receipt, schema, config: trusted.config, live });
    if (localConfigBytes !== undefined && !sameConfigBytes(localConfigBytes, trusted.atTip.bytes)) {
      return verdict([...result.findings, { code: "CONFIG_LOCAL_DIFFERS", detail: "the local checkout holds a configuration that differs from the tip of main: update the checkout from main" }]);
    }
    return result;
  } catch (e) {
    return verdict([{ code: "EVIDENCE_MALFORMED", detail: `verify: ${e.message}` }]);
  }
}

const PROBE_OPTS = { encoding: "utf8", timeout: 20000, windowsHide: true };
const token = (v) => String(v).replace(/[^A-Za-z0-9_]/g, "").slice(0, 24) || "unknown";

/**
 * Why a spawned probe tool did not produce a usable answer, as a short NON-SENSITIVE cause (fixed words, an error code, an
 * exit status, never tool output), or null when it ran and exited 0. Every cause is UNKNOWN: a missing tool, a spawn
 * error, a timeout, a signal and a non-zero exit are all "could not find out", never "found nothing".
 */
function spawnCause(tool, r) {
  if (!r || typeof r !== "object") return `${tool}-no-result`;
  if (r.error) return r.error.code === "ENOENT" ? `${tool}-not-found` : r.error.code === "ETIMEDOUT" ? `${tool}-timeout` : `${tool}-spawn-error:${token(r.error.code)}`;
  if (r.signal) return `${tool}-signal:${token(r.signal)}`;
  if (r.status !== 0) return `${tool}-exit-${Number.isInteger(r.status) ? r.status : "unknown"}`;
  return typeof r.stdout === "string" ? null : `${tool}-no-output`;
}

/**
 * Accounts known to gh, from its machine-readable output (`gh auth status --json hosts`: language independent, exit 0
 * even with problems, no token in it). Only host and login are kept. Returns { accounts } ONLY when gh ran, exited 0 and
 * printed the expected JSON; { unknown: cause } for every other outcome: gh missing (ENOENT), spawn error, timeout, signal,
 * non-zero exit, output that is not JSON, JSON of another shape, a host whose accounts are not a list, an entry without a
 * login. An empty `hosts` object is "no accounts" only in that case: gh prints `{"hosts":{}}` with exit 0 when it is
 * logged into nothing (verified with gh 2.101.0 against an empty GH_CONFIG_DIR), so it is a recognised, successful answer.
 */
function probeGhAccounts(spawn) {
  const g = spawn("gh", ["auth", "status", "--json", "hosts"], PROBE_OPTS);
  const why = spawnCause("gh", g);
  if (why) return { unknown: why };
  let j;
  try {
    j = JSON.parse(g.stdout);
  } catch {
    return { unknown: "gh-json-invalid" };
  }
  if (!j || typeof j !== "object" || Array.isArray(j) || !j.hosts || typeof j.hosts !== "object" || Array.isArray(j.hosts)) return { unknown: "gh-schema-unexpected" };
  const accounts = [];
  for (const [host, entries] of Object.entries(j.hosts)) {
    if (!host || !Array.isArray(entries)) return { unknown: "gh-schema-unexpected" };
    for (const e of entries) {
      if (!e || typeof e !== "object" || typeof e.login !== "string" || !e.login.trim()) return { unknown: "gh-account-without-login" };
      accounts.push({ host, login: e.login });
    }
  }
  return { accounts };
}

/**
 * Formats of `cmdkey /list` that are RECOGNISED. The labels and the "nothing stored" marker are localised by Windows, and a
 * marker is never guessed: each entry below was read from the cmdkey.exe.mui resource of that Windows language (the strings
 * the tool itself prints). A language that is not listed is UNKNOWN, which blocks; add it only after reading ITS
 * cmdkey.exe.mui, never from memory.
 */
const CMDKEY_LOCALES = [
  { lang: "en-US", header: "Currently stored credentials:", target: "Target:", type: "Type:", none: "* NONE *" },
  { lang: "es-ES", header: "Credenciales almacenadas en la actualidad:", target: "Destino:", type: "Tipo:", none: "* NINGUNO *" },
];
const labelled = (line, label) => line.startsWith(label) && line.slice(label.length).trim().length > 0;
/** One stored credential: the target line, the type line, then at most a few more lines (user, persistence text). */
const isCredentialBlock = (b, loc) => b.length >= 2 && b.length <= 8 && labelled(b[0], loc.target) && labelled(b[1], loc.type);

/**
 * GitHub-looking targets in the Windows credential store, without ever reading a secret (cmdkey does not print passwords).
 * The listing is the one-line localised header, a blank line, then EITHER the localised "nothing stored" marker as
 * the only block OR one block per credential, each starting with the localised Target and Type lines. Returns { targets }
 * only for those recognised shapes ([] only for the marker); { unknown: cause } for everything else: a failed query, an
 * empty or truncated output, an unexpected header (also a header of one language with the body of another), a language that is not in CMDKEY_LOCALES, any other single-line block
 * (for example "* UNRECOGNIZED ERROR *") or a mix of both. The cause carries counts, never output text.
 */
function probeWindowsCredentials(spawn) {
  const c = spawn("cmdkey", ["/list"], PROBE_OPTS);
  const why = spawnCause("cmdkey", c);
  if (why) return { unknown: why };
  const blocks = [];
  let cur = [];
  const lines = c.stdout.split(/\r?\n/).map((l) => l.trim());
  for (const line of [...lines, ""]) {
    if (line) cur.push(line);
    else if (cur.length) { blocks.push(cur); cur = []; }
  }
  const shape = `lines=${lines.filter(Boolean).length},blocks=${blocks.length}`;
  if (!blocks.length) return { unknown: "cmdkey-output-empty" };
  if (blocks.length < 2) return { unknown: `cmdkey-output-truncated(${shape})` };
  if (blocks[0].length !== 1 || !/[:：]$/.test(blocks[0][0])) return { unknown: `cmdkey-header-unrecognised(${shape})` };
  const body = blocks.slice(1);
  for (const loc of CMDKEY_LOCALES.filter((l) => l.header === blocks[0][0])) {
    if (body.length === 1 && body[0].length === 1 && body[0][0] === loc.none) return { targets: [] };
    if (body.every((b) => isCredentialBlock(b, loc))) return { targets: body.filter((b) => b.some((l) => /github/i.test(l))).map((b) => b[0].slice(loc.target.length).trim()) };
  }
  return { unknown: `cmdkey-format-unrecognised(${shape})` };
}

/**
 * Facts about the agent's own process: names, logins and credential target names only, never token values.
 * A source that could not be queried or understood is null (UNKNOWN) with its cause in `unknown`; it is never an empty
 * list, because an empty list means "queried successfully, nothing there". evaluateAgentIsolation turns every null into BLOCKED.
 * DETECTION IS NOT ISOLATION: a clean probe does not prove that this Windows user cannot reach another user's credentials.
 * Run it from the AGENT profile.
 */
export function collectIsolationProbe({ env = process.env, spawn = spawnSync, platform = process.platform } = {}) {
  const tokenNames = ["GH_TOKEN", "GITHUB_TOKEN", "GH_ENTERPRISE_TOKEN", "GITHUB_ENTERPRISE_TOKEN"];
  const tokenEnvNames = Object.keys(env).filter((k) => tokenNames.includes(k.toUpperCase()) && env[k]);
  const gh = probeGhAccounts(spawn);
  const store = platform === "win32" ? probeWindowsCredentials(spawn) : { unknown: `credential-store-not-probed-on-${token(platform)}` };
  const unknown = {};
  if (gh.unknown) unknown.ghAccounts = gh.unknown;
  if (store.unknown) unknown.credentialTargets = store.unknown;
  return { tokenEnvNames, ghAccounts: gh.accounts ?? null, credentialTargets: store.targets ?? null, ...(Object.keys(unknown).length ? { unknown } : {}) };
}

function report(title, findings) {
  console.log(`${title}: ${verdict(findings).status}`);
  for (const f of findings) console.log(`  - ${f.code}: ${f.detail}`);
}

const setOutput = (env, k, v) => env.GITHUB_OUTPUT && appendFileSync(env.GITHUB_OUTPUT, `${k}=${v}\n`);

function runMode(mode, { api, download, env, now, outDir, config, configBytes, args, probe }) {
  if (mode === "trusted-config") {
    const t = loadTrustedConfig({ api, repo: config.repository.fullName });
    if (!t) {
      report("trusted-config", [{ code: "CONFIG_UNREADABLE", detail: "the configuration could not be recovered from the tip of main" }]);
      return 1;
    }
    const id = describeConfigBytes(t.atTip.bytes);
    console.log(JSON.stringify({ path: TRUSTED_CONFIG_PATH, sourceRevision: t.tip.sha, gitBlobSha: id.gitBlobSha, sha256: id.sha256, repositoryId: t.repository.id, repositoryFullName: t.repository.fullName }));
    const findings = sameConfigBytes(configBytes, t.atTip.bytes) ? [] : [{ code: "CONFIG_LOCAL_DIFFERS", detail: "the local checkout holds a configuration that differs from the tip of main" }];
    report("trusted-config", findings);
    return findings.length ? 1 : 0;
  }
  if (mode === "check-environment") {
    const findings = evaluateEnvironment(config, readEnvironment(api, env.GITHUB_REPOSITORY ?? config.repository.fullName, config.environment.name));
    report("environment", findings);
    return findings.length ? 1 : 0;
  }
  if (mode === "check-agent-isolation") {
    const findings = evaluateAgentIsolation(config, probe());
    report("agent-isolation", findings);
    return findings.length ? 1 : 0;
  }
  if (mode === "verify") {
    const [file, scopeId, pr, headSha] = args;
    // The local file only says WHERE to look and which repository id the consumer expects (its own pin). The
    // configuration that judges the receipt is the one recovered from the tip of main; a differing checkout is BLOCKED.
    const result = verifyFromGitHub({
      api, download, schema: loadSchema(), receipt: JSON.parse(readFileSync(file, "utf8")), now: now(), repo: config.repository.fullName, localConfigBytes: configBytes,
      expected: { scopeId, repositoryId: config.repository.id, pullRequestNumber: Number(pr), headSha },
    });
    report("verify", result.findings);
    if (result.status === "PASS") console.log(JSON.stringify(result.binding));
    return result.status === "PASS" ? 0 : 1;
  }
  if (mode !== "request" && mode !== "issue") {
    console.error("usage: plan-approval.mjs request | issue | verify <receipt.json> <scopeId> <pr> <headSha> | trusted-config | check-environment | check-agent-isolation");
    return 2;
  }
  let facts;
  try {
    facts = collectFacts({ api, env, config, configBytes, withApprovals: mode === "issue" });
  } catch (e) {
    report(mode, [{ code: "API_ERROR", detail: e.message }]);
    return 1;
  }
  const findings = mode === "request" ? evaluateRequest(config, facts) : evaluateApproval(config, facts);
  if (findings.length) {
    report(mode, findings);
    return 1;
  }
  if (mode === "request") {
    const fp = planSetFingerprint({ scopeId: facts.inputs.scopeId, repositoryId: config.repository.id, pullRequestNumber: facts.pr.number, headSHA: facts.pr.headSha, documents: facts.documents });
    setOutput(env, "plan_set_fingerprint", fp);
    setOutput(env, "head_sha", facts.pr.headSha);
    console.log(`request: PASS (PR #${facts.pr.number} @ ${facts.pr.headSha}, fingerprint ${fp})`);
    return 0;
  }
  // approvalObservedAt is when THIS workflow verified the approval in the run's history, not the instant of the click.
  const observed = now();
  const receipt = buildReceipt(config, facts, { approvalObservedAt: observed, generatedAt: now() });
  const bad = validateReceipt(receipt, loadSchema(), config);
  if (bad.length) {
    report("receipt", bad);
    return 1;
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, config.artifact.fileName), `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(`issue: PASS receipt ${receipt.receiptId} fingerprint ${receipt.planSetFingerprint}`);
  return 0;
}

/** Fail-closed entry point: whatever goes wrong (including a thrown exception) is a non-zero exit, never a PASS. */
export function run(mode, { api = ghApi, download = ghDownload, env = process.env, now = () => new Date().toISOString(), outDir = "receipt", config, configBytes, args = process.argv.slice(3), probe = collectIsolationProbe } = {}) {
  try {
    // An injected config (tests) travels with its bytes; the real one is read once, as bytes, and parsed from them.
    const loaded = config ? { config, bytes: configBytes ?? Buffer.from(JSON.stringify(config)) } : loadConfigFile();
    return runMode(mode, { api, download, env, now, outDir, config: loaded.config, configBytes: loaded.bytes, args, probe });
  } catch (e) {
    report(String(mode), [{ code: "EVIDENCE_MALFORMED", detail: e.message }]);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(run(process.argv[2]));
