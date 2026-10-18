// Real policy engine for core/security-policy.json (M3.4, AGT-07,
// PAR-POLICY-ENFORCED). Ported from TEMPLATE v2.0.5's security-policy.ps1
// (Get-SecurityDecision), but resolves role x capability instead of SDD
// level x capability: core/security-policy.json's matrix is identical
// across LIGHT/STANDARD/FULL (sameAcrossSddLevels=true) -- the SDD level
// only changes required evidence/gates (contracts/sdd-levels.json), never
// grants or removes a capability. In v2.0.5 this engine was only ever
// consumed by mcp-tools.ps1; nothing else called Get-SecurityDecision.
// v3's runtime/mcp/decision.mjs is the first real caller, and more
// mutating-action callers can be added without changing this module.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const defaultPolicyPath = join(here, "..", "..", "core", "security-policy.json");

let cachedPolicy = null;
let cachedPolicyPath = null;

/** Loads and structurally validates core/security-policy.json (fail-closed: throws on anything unexpected rather than guessing). Cached by path. */
export function loadSecurityPolicy(path = defaultPolicyPath) {
  if (cachedPolicy && cachedPolicyPath === path) return cachedPolicy;
  const policy = JSON.parse(readFileSync(path, "utf8"));
  if (policy.schemaVersion !== 1) throw new Error(`invalid security policy: unexpected schemaVersion in ${path}`);
  if (policy.defaultDecision !== "deny") throw new Error(`invalid security policy: defaultDecision must be "deny" (fail-closed) in ${path}`);
  for (const role of policy.roles || []) {
    if (!policy.matrix || !policy.matrix[role]) throw new Error(`invalid security policy: matrix missing role "${role}" in ${path}`);
  }
  cachedPolicy = policy;
  cachedPolicyPath = path;
  return policy;
}

function scopePatternToRegex(pattern, unitId) {
  let p = pattern.replace(/<unit>/g, unitId || "[^/]+");
  p = p.replace(/[.+^$()|[\]\\]/g, "\\$&");
  p = p.replace(/\{([^}]+)\}/g, (_, inner) => `(${inner.split(",").join("|")})`);
  return new RegExp(`^${p}$`);
}

/**
 * Matches a `scoped:<pattern>` value from the policy matrix against a
 * caller-supplied scope. Abstract labels (no "/" and no "{"), e.g.
 * "worktree" or "own-unit-branch", require an exact match. Path-shaped
 * patterns, e.g. "runs/<unit>/{spec,plan,tasks,decision}", support a
 * single "<unit>" placeholder and one brace-alternation group -- the two
 * real shapes present in core/security-policy.json today. An unrecognised
 * shape is not silently generalised: it falls through to exact match too,
 * which fails closed instead of guessing a wider grant.
 */
export function scopeMatches(pattern, scope, { unitId } = {}) {
  if (!scope) return false;
  if (!pattern.includes("/") && !pattern.includes("{")) return scope === pattern;
  return scopePatternToRegex(pattern, unitId).test(scope);
}

/**
 * resolvePolicyDecision({role, capability, scope, unitId, policy}) ->
 * {decision: "ALLOW"|"DENY"|"GATE", rawValue, reason}.
 *
 * - "allow" -> ALLOW. "deny"/"n/a"/undeclared/unknown role -> DENY
 *   (fail-closed, matches defaultDecision).
 * - "approves-step-up" (the human role's own entry) -> ALLOW: this value
 *   describes the human's authority to grant step-up, it does not gate
 *   the human.
 * - "step-up" -> GATE: real interactive step-up (bound to server +
 *   operation + argument digest) is PAR-STEP-UP, M4.4. Until then, GATE
 *   means "not autonomous for this role"; callers decide what evidence
 *   (if any) can satisfy it -- this module never does that by itself.
 * - "scoped:<pattern>" -> ALLOW if `scope` matches, DENY otherwise. This
 *   is a real, automatic, deterministic boundary (no human involved),
 *   unlike "step-up".
 */
export function resolvePolicyDecision({ role, capability, scope, unitId, policy = loadSecurityPolicy() }) {
  if (!policy.capabilities.includes(capability)) {
    throw new Error(`unknown capability "${capability}" (not declared in security-policy.json)`);
  }
  const roleMatrix = policy.matrix[role];
  if (!roleMatrix) {
    return { decision: "DENY", rawValue: null, reason: `unknown role "${role}" (fail-closed, defaultDecision=${policy.defaultDecision})` };
  }
  const rawValue = roleMatrix[capability];
  if (rawValue === undefined) {
    return { decision: "DENY", rawValue: null, reason: `capability "${capability}" not declared for role "${role}" (fail-closed)` };
  }
  if (rawValue === "allow") return { decision: "ALLOW", rawValue, reason: "autonomous" };
  if (rawValue === "deny") return { decision: "DENY", rawValue, reason: "not declared by profile" };
  if (rawValue === "n/a") return { decision: "DENY", rawValue, reason: "capability not applicable to this role" };
  if (rawValue === "approves-step-up") return { decision: "ALLOW", rawValue, reason: "human role approves step-up requests" };
  if (rawValue === "step-up") return { decision: "GATE", rawValue, reason: "requires interactive human step-up approval (PAR-STEP-UP, M4.4)" };
  if (rawValue.startsWith("scoped:")) {
    const pattern = rawValue.slice("scoped:".length);
    if (scopeMatches(pattern, scope, { unitId })) {
      return { decision: "ALLOW", rawValue, reason: `scope "${scope}" matches required scope "${pattern}"` };
    }
    return { decision: "DENY", rawValue, reason: `scope "${scope ?? "(none)"}" does not match required scope "${pattern}"` };
  }
  throw new Error(`unrecognised policy value "${rawValue}" for ${role}/${capability} (fail-closed: unknown decision shapes are never autonomously resolved)`);
}
