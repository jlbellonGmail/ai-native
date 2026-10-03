// M4.3 (P44 TRUSTED_CALLER_INTEGRITY, PAR-TRUSTED-CALLER). Two defences:
//  1. Source: the required check is emitted by the `ai-native-trust` GitHub
//     App from a `pull_request_target` workflow, which GitHub always runs
//     from the BASE branch. A PR cannot replace that caller.
//  2. Name: no workflow in the PR may claim a reserved check name. A job
//     with the same name would come from `github-actions`, not the App, and
//     the ruleset pins the required check to the App -- but we also reject
//     the attempt loudly instead of relying on the ruleset alone.

const normalize = (s) => s.toLowerCase().replace(/["']/g, "");

/** Findings for every workflow (other than the caller) that mentions a reserved check name. */
export function findSpoofedCheckNames(headWorkflows, reservedNames, callerPath) {
  const findings = [];
  for (const [path, text] of Object.entries(headWorkflows)) {
    if (path === callerPath) continue;
    const t = normalize(text);
    for (const name of reservedNames) {
      if (t.includes(normalize(name))) findings.push({ code: "SPOOFED_CHECK_NAME", path, detail: `workflow references reserved check name '${name}'` });
    }
  }
  return findings;
}

/** Compares the caller at base and at head. */
export function checkCallerIntegrity(baseText, headText, callerPath) {
  if (baseText === null) return [{ code: "CALLER_MISSING_AT_BASE", path: callerPath, detail: "trusted caller does not exist at base" }];
  if (headText === null) return [{ code: "CALLER_REMOVED", path: callerPath, detail: "PR deletes the trusted caller" }];
  if (headText !== baseText) return [{ code: "CALLER_MODIFIED", path: callerPath, detail: "PR modifies the trusted caller; the base version is the one that ran" }];
  return [];
}

export const HARD_FAIL_CODES = new Set(["SPOOFED_CHECK_NAME", "CALLER_REMOVED", "CALLER_MISSING_AT_BASE"]);
