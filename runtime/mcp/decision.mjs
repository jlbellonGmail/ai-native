// Real MCP capability decision function (M3.4, AGT-08/PAR-POLICY-ENFORCED).
// Ported from TEMPLATE v2.0.5's Get-McpCapabilityDecision/Get-McpCatalog
// (mcp-tools.ps1), now driven by runtime/policy (role x capability) instead
// of the old SDD-level x capability gate. Consumes mcp/catalog.json
// (currently empty; PAR-MCP-TRUST / the real gateway is M4.4) and
// core/security-policy.json's mcp section (readOnly -> NETWORK_READ,
// writeOrAction -> EXTERNAL_WRITE, credentials -> SECRET_ACCESS).
//
// This module is a local decision/evidence function, not a security
// boundary by itself: per M2.3's compatibility findings, client-side
// permission enforcement does not actually block on Codex on Windows, so
// the real enforcement boundary for anything that reaches outside the
// repo remains server-side (M4.3's trust-gate/merge-gate). What this
// module does guarantee is that, given a (role, server, operation), the
// decision it returns is the one core/security-policy.json actually
// implies -- not an arbitrary one two real bugs used to allow (B14):
//
//  1. DENY -> ALLOW: v2.0.5 only special-cased a GATE decision with no
//     AuthorizationPath; any other non-ALLOW decision (including a
//     straight DENY -- capability not declared for the role at all)
//     still ran Assert-ScopedAuthorization if a path was supplied, and
//     fell through to ALLOW once that file validated. A DENY from the
//     policy is now terminal: no authorization can override it.
//  2. 'decision: MERGE' forced for MCP: the authorization document no
//     longer has to literally say "decision: MERGE" (meaningless for a
//     NETWORK_READ/EXTERNAL_WRITE grant that is not a PR merge); it must
//     say "decision: ALLOW" (runtime/policy/authorization.mjs).
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolvePolicyDecision } from "../policy/policy.mjs";
import { assertScopedAuthorization } from "../policy/authorization.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const defaultCatalogPath = join(here, "..", "..", "mcp", "catalog.json");

const VALID_MODES = ["read-only", "write", "action"];
const VALID_TYPES = ["local", "remote"];
const REQUIRED_FIELDS = ["type", "capability", "mode", "risk", "permissions", "optional", "load"];

/** Structurally validates an in-memory MCP catalog object. Throws an actionable message naming the offending server, same contract as v2.0.5's Get-McpCatalog. */
export function validateMcpCatalog(catalog) {
  if (!catalog || catalog.schemaVersion !== 1 || typeof catalog.servers !== "object" || catalog.servers === null) {
    throw new Error("invalid MCP catalog: schemaVersion/servers");
  }
  for (const [name, server] of Object.entries(catalog.servers)) {
    for (const field of REQUIRED_FIELDS) {
      if (server[field] === undefined || server[field] === null) throw new Error(`invalid MCP catalog: "${name}" is missing "${field}"`);
    }
    if (server.load !== "on-demand") throw new Error(`invalid MCP catalog: "${name}" must use load=on-demand`);
    if (!VALID_MODES.includes(server.mode)) throw new Error(`invalid MCP catalog: unsupported mode in "${name}"`);
    if (!VALID_TYPES.includes(server.type)) throw new Error(`invalid MCP catalog: unsupported type in "${name}"`);
  }
  return catalog;
}

/** Reads and validates mcp/catalog.json (or `path`). */
export function loadMcpCatalog(path = defaultCatalogPath) {
  if (!existsSync(path)) throw new Error(`MCP catalog does not exist: ${path}`);
  let catalog;
  try {
    catalog = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(`invalid MCP catalog: not valid JSON (${path})`);
  }
  return validateMcpCatalog(catalog);
}

/**
 * resolveMcpDecision({server, scope, role, operation, catalog,
 * authorizationPath, environment}) ->
 * {decision: "ALLOW"|"DENY"|"FALLBACK"|"BLOCKED", reason, server, scope?, operation?}.
 *
 * - server not registered in the catalog -> FALLBACK (capability_not_configured).
 * - policy DENY for (role, capability) -> DENY, always, regardless of any
 *   authorizationPath (bug 1 above).
 * - policy GATE (step-up) with no authorizationPath -> DENY
 *   (authorization_required), matching v2.0.5's observable behaviour for
 *   that branch.
 * - policy GATE with a valid, scoped "decision: ALLOW" authorization ->
 *   proceeds to the mode/secret checks below (bug 2 fix: never "MERGE").
 * - read requested against a write/action-only server -> DENY (operation_mismatch).
 * - required secretEnv missing from `environment` -> FALLBACK if optional, BLOCKED otherwise.
 * - otherwise -> ALLOW.
 */
export function resolveMcpDecision({ server, scope, role, operation = "read", catalog = loadMcpCatalog(), authorizationPath = "", approved = false, environment = {} }) {
  const entry = catalog.servers[server];
  if (!entry) return { decision: "FALLBACK", reason: "capability_not_configured", server };

  const capability = entry.mode === "read-only" ? "NETWORK_READ" : "EXTERNAL_WRITE";
  const policyDecision = resolvePolicyDecision({ role, capability, scope });

  if (policyDecision.decision === "DENY") {
    return { decision: "DENY", reason: "not_declared_by_profile", server };
  }

  if (policyDecision.decision === "GATE") {
    // `approved` is set only by runtime/mcp-gateway after it verified a
    // step-up grant bound to server+operation+args digest (M4.4); the
    // file-based authorization remains the path for other callers.
    if (!approved) {
      if (!authorizationPath) return { decision: "DENY", reason: "authorization_required", server };
      const text = readFileSync(authorizationPath, "utf8");
      assertScopedAuthorization(text, { expectedDecision: "ALLOW", expectedScope: scope, expectedAction: operation });
    }
  }

  if (entry.mode !== "read-only" && operation === "read") {
    return { decision: "DENY", reason: "operation_mismatch", server };
  }

  const secretEnv = entry.requirements?.secretEnv;
  if (secretEnv && !(secretEnv in environment)) {
    if (entry.optional) return { decision: "FALLBACK", reason: "secret_missing", server };
    return { decision: "BLOCKED", reason: "secret_missing", server };
  }

  return { decision: "ALLOW", reason: "scoped_capability", server, scope, operation };
}
