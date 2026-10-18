// M4.3 (PAR-AGENT-IDENTITY, A1/A3). The agent acts through its own identity
// (the `ai-native-worker` GitHub App) and the gate through a DIFFERENT one
// (`ai-native-trust`). Checks, from config + security policy (data only):
//  - the two identities are distinct apps with distinct credential names
//  - the worker has no admin/merge/tag power in the policy matrix and its
//    declared App permissions match the minimum from the Master Plan
//  - the trust app has no write permission other than checks
//  - commits in a PR come from a human or from the worker identity only
import { isBotLogin } from "./governance-modes.mjs";

const WORKER_MIN = { contents: "write", pull_requests: "write", workflows: "write", metadata: "read" };
const TRUST_MIN = { checks: "write", pull_requests: "read", actions: "read", contents: "read", metadata: "read" };
const FORBIDDEN = ["administration", "members", "secrets", "environments", "actions_variables", "repository_hooks", "organization_administration"];

function sameMap(a, b) {
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && a[k] === b[k]);
}

export function checkIdentities(config, securityPolicy) {
  const findings = [];
  if (config.worker.appSlug === config.trustGate.appSlug) findings.push({ code: "IDENTITY_NOT_SEPARATED", detail: "worker and trust-gate use the same app" });
  if (!sameMap(config.worker.permissions, WORKER_MIN)) findings.push({ code: "WORKER_PERMISSIONS", detail: `worker permissions differ from the minimum ${JSON.stringify(WORKER_MIN)}` });
  if (!sameMap(config.trustApp.permissions, TRUST_MIN)) findings.push({ code: "TRUST_PERMISSIONS", detail: `trust app permissions differ from the minimum ${JSON.stringify(TRUST_MIN)}` });
  for (const [perm, level] of Object.entries(config.trustApp.permissions)) {
    if (level === "write" && perm !== "checks") findings.push({ code: "TRUST_CAN_WRITE", detail: `trust app has write on '${perm}'` });
  }
  for (const f of FORBIDDEN) {
    if (f in config.worker.permissions || f in config.trustApp.permissions) findings.push({ code: "FORBIDDEN_PERMISSION", detail: `'${f}' must not be granted to an agent/gate app` });
  }
  const builder = securityPolicy.matrix?.builder ?? {};
  for (const cap of ["MERGE", "TAG", "ADMIN"]) {
    if (builder[cap] !== "deny") findings.push({ code: "BUILDER_CAPABILITY", detail: `builder ${cap} is '${builder[cap]}' in core/security-policy.json, expected deny` });
  }
  return findings;
}

/** commitAuthors: GitHub logins of every commit author in the PR. */
export function checkCommitIdentities(commitAuthors, config) {
  const findings = [];
  for (const login of commitAuthors) {
    if (!isBotLogin(login, config.worker.botLogins)) continue;
    if (!config.worker.botLogins.includes(login)) findings.push({ code: "UNKNOWN_BOT_COMMITTER", detail: `bot '${login}' is not the worker identity` });
  }
  return findings;
}
