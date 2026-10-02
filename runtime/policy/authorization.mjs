// Generic scoped-authorization assertion (M3.4). Ported from TEMPLATE
// v2.0.5's Assert-ScopedAuthorization (security-policy.ps1).
//
// Real bug fixed here (B14, documented in core/security-policy.json's
// description): v2.0.5 hardcoded the literal pair ('decision','MERGE') for
// *every* scoped authorization it checked, including ones gating MCP
// capabilities that have nothing to do with a PR merge decision. That
// conflated two different gates: the single real HITL (MERGE/NO MERGE on a
// PR, contracts/state-machine.json) and a step-up grant for an unrelated
// capability (e.g. an MCP EXTERNAL_WRITE call). Callers now pass the
// decision token they actually expect via `expectedDecision` -- "MERGE"
// stays available for real PR-merge evidence, and runtime/mcp/decision.mjs
// uses "ALLOW" for step-up capability grants instead.
export class AuthorizationError extends Error {}

function findValue(text, key) {
  const pattern = new RegExp(`(?:^|\\r?\\n)[ \\t]*${key}:[ \\t]*(.+?)[ \\t]*(?:\\r?\\n|$)`);
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
}

/**
 * assertScopedAuthorization(text, {expectedDecision, expectedScope,
 * expectedAction, expectedBranch, expectedBase}) -> true, or throws
 * AuthorizationError. Never accepts a document containing a
 * token/secret/password/api-key line, regardless of how the rest matches.
 */
export function assertScopedAuthorization(text, { expectedDecision, expectedScope, expectedAction = "", expectedBranch = "", expectedBase = "" } = {}) {
  if (!expectedDecision) throw new Error("assertScopedAuthorization requires expectedDecision (no hardcoded default -- see B14)");
  if (!expectedScope) throw new Error("assertScopedAuthorization requires expectedScope");

  if (findValue(text, "decision") !== expectedDecision) {
    throw new AuthorizationError(`invalid authorization: missing or mismatched decision (expected "${expectedDecision}")`);
  }
  if (findValue(text, "scope") !== expectedScope) {
    throw new AuthorizationError(`invalid authorization: missing or mismatched scope (expected "${expectedScope}")`);
  }
  if (expectedAction && findValue(text, "action") !== expectedAction) {
    throw new AuthorizationError("invalid authorization: action out of scope");
  }
  if (expectedBranch && findValue(text, "branch") !== expectedBranch) {
    throw new AuthorizationError("invalid authorization: branch out of scope");
  }
  if (expectedBase && findValue(text, "base") !== expectedBase) {
    throw new AuthorizationError("invalid authorization: base out of scope");
  }
  if (/(?:^|\r?\n)[ \t]*(token|secret|password|api[_-]?key)[ \t]*:/i.test(text)) {
    throw new AuthorizationError("invalid authorization: must not contain secrets");
  }
  return true;
}
