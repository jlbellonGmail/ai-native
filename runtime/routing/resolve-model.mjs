// Real model routing (M3.4, AGT-06/AGT-11, PAR-ROUTING-EVIDENCE/
// PAR-ROUTING-SAFEGUARDS). Ported from TEMPLATE v2.0.5's
// resolve-agentic-model.ps1, driven by the already-prepared core/models.json
// (M2.2; see its own "notes" field). Deliberately does not port the
// run.yaml/-RunFile CLI surface: no consumer in ai-native reads run.yaml
// today (core/models.json's executionDeclaration documents the format as
// data only), so reproducing that parser here would be speculative. This
// module is a pure library: resolveModel() takes its role/capabilities/
// risk/etc. as explicit parameters.
//
// Safeguards preserved/improved from v2.0.5 (AGT-11):
// - BLOCKED (RoutingBlockedError) when no implementation satisfies the
//   required capabilities/context/security profile, or when no candidate
//   (primary + fallback chain) has usable credentials -- never a silent
//   default.
// - Deterministic tie-break by alias when scores are equal.
// - F07 eval evidence (readEvalSignal) is consumed only as a relative,
//   auditable signal; missing evidence never invents a result.
// - There is no "live catalog" code path at all (v2.0.5 exposed
//   -UseLiveCatalog and blocked it at runtime); v3 simply has no surface
//   that could consult a remote catalog or spend real credit.
// - metricStatus.cost is always the explicit string
//   "NOT_AVAILABLE_FROM_TOOL", never a silent null (v2.0.5's
//   model-routing.jsonl always had cost=null with no explanation; see
//   contracts/unit-event.schema.json's "routing" variant).
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { appendEvent } from "../circuit/events.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const defaultModelsPath = join(here, "..", "..", "core", "models.json");

export class RoutingBlockedError extends Error {}

let cachedModels = null;
let cachedModelsPath = null;

/** Loads core/models.json (or `path`), cached by path. */
export function loadModels(path = defaultModelsPath) {
  if (cachedModels && cachedModelsPath === path) return cachedModels;
  cachedModels = JSON.parse(readFileSync(path, "utf8"));
  cachedModelsPath = path;
  return cachedModels;
}

function getProviderConfig(models, providerName) {
  const providerConfig = models.providers?.[providerName];
  if (!providerConfig) throw new Error(`unknown or unauthorized provider: ${providerName}`);
  return providerConfig;
}

function splitModelRef(modelRef) {
  const idx = modelRef.indexOf("/");
  if (idx <= 0 || idx === modelRef.length - 1) {
    throw new Error(`invalid model "${modelRef}". Use opencode-go/<model>, opencode/<model> or openrouter/<provider>/<model>.`);
  }
  return { provider: modelRef.slice(0, idx), model: modelRef.slice(idx + 1), ref: modelRef };
}

/** Validates `modelRef` against models.providers[*].models. Throws if the provider or model is unknown. */
export function assertModelAllowed(models, modelRef) {
  const split = splitModelRef(modelRef);
  const providerConfig = getProviderConfig(models, split.provider);
  if (!(providerConfig.models || []).includes(split.model)) {
    throw new Error(`model not authorized or does not exist for ${split.provider}: ${split.model}`);
  }
  return { ...split, providerConfig };
}

function hasProviderCredentials(providerConfig, env, allowMissingCredentials) {
  if (allowMissingCredentials) return true;
  return (providerConfig.credentialEnv || []).some((name) => !!env[name]);
}

function isEnvAvailable(item, env, allowMissingCredentials) {
  if (allowMissingCredentials) return true;
  const envs = item.availabilityEnv || [];
  if (envs.length === 0) return true;
  return envs.some((name) => !!env[name]);
}

/**
 * readEvalSignal(path) -> null (no path given) | {usable, source, reason}
 * (no file, or no record with a passRate) | {usable, passRate, source,
 * reason} (last JSONL record with a passRate). Mirrors v2.0.5's
 * Read-EvalSignal exactly: the signal is read-only evidence, never
 * generated or inferred when absent.
 */
export function readEvalSignal(path) {
  if (!path || !existsSync(path)) return path ? { usable: false, source: path, reason: "sin resumen passRate" } : null;
  const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
  let summary = null;
  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      throw new Error(`invalid eval evidence: ${path}`);
    }
    if (row.passRate !== undefined && row.passRate !== null) summary = row;
  }
  if (!summary) return { usable: false, source: path, reason: "sin resumen passRate" };
  const rate = Number(summary.passRate);
  return { usable: rate >= 0 && rate <= 1, passRate: rate, source: path, reason: "senal relativa del resumen F07" };
}

/**
 * resolveDynamicCandidate({routing, role, requiredCapabilities, depth,
 * securityProfile, contextTokens, allowedAliases, models, env,
 * allowMissingCredentials}) -> the best models.routing.implementations[]
 * entry. Deterministic weighted score (quality/cost/latency per SDD
 * depth), tie-broken by alias ascending. Throws RoutingBlockedError if no
 * implementation satisfies capabilities/context/security/credentials.
 */
export function resolveDynamicCandidate({ routing, role, requiredCapabilities = [], depth, securityProfile, contextTokens = 0, allowedAliases = [], models, env = process.env, allowMissingCredentials = false }) {
  const weights = routing.depthWeights?.[depth];
  if (!weights) throw new Error(`no routing policy for SDD level: ${depth}`);
  const roleCaps = routing.roleCapabilities?.[role] || [];
  const required = requiredCapabilities.length > 0 ? requiredCapabilities : roleCaps;

  const options = [];
  for (const item of routing.implementations || []) {
    if (allowedAliases.length > 0 && !allowedAliases.includes(item.alias)) continue;
    const caps = item.capabilities || [];
    if (required.some((c) => !caps.includes(c))) continue;
    if (contextTokens > 0 && item.context < contextTokens) continue;
    if (securityProfile && !(item.securityProfiles || []).includes(securityProfile)) continue;
    const providerConfig = getProviderConfig(models, item.provider);
    if (!isEnvAvailable(item, env, allowMissingCredentials) || !hasProviderCredentials(providerConfig, env, allowMissingCredentials)) continue;
    const score = item.quality * weights.quality - item.cost * weights.cost - item.latency * weights.latency;
    options.push({ item, score });
  }
  if (options.length === 0) {
    throw new RoutingBlockedError(`BLOCKED: no implementation satisfies the required capabilities/context/security for role "${role}"`);
  }
  options.sort((a, b) => (b.score - a.score) || (a.item.alias < b.item.alias ? -1 : a.item.alias > b.item.alias ? 1 : 0));
  return options[0].item;
}

function fallbackLabelsFor(explicitFallback) {
  if (explicitFallback && explicitFallback.length > 0) {
    return explicitFallback.flatMap((v) => String(v).split(",")).map((s) => s.trim()).filter(Boolean);
  }
  return ["go", "zen"];
}

/**
 * resolveModel(options) -> routing evidence object matching
 * contracts/unit-event.schema.json's "routing" eventType (role, provider,
 * model, variant, fallbackApplied, metricStatus), plus extra evidence
 * fields (selectionReason, capabilitiesRequired, risk, sddLevel,
 * contextTokens, securityProfile, evalSignal, fallback*). Throws
 * RoutingBlockedError when nothing in the fallback chain is usable.
 */
export function resolveModel({
  role,
  model,
  variant,
  explicitFallback = [],
  failedModel = "",
  failureReason = "",
  capabilities = [],
  risk = "",
  sddLevel = "",
  contextTokens = 0,
  securityProfile = "",
  evalEvidencePath = "",
  availableAliases = [],
  models = loadModels(),
  env = process.env,
  allowMissingCredentials = false,
}) {
  const start = Date.now();
  const requestedRole = role;
  const resolvedRole = models.roleAliases?.[role] || role;
  const roleConfig = models.roles?.[resolvedRole];
  if (!roleConfig) throw new Error(`unknown role: ${requestedRole}`);
  role = resolvedRole;

  const depth = sddLevel || models.routing?.defaultSdd || "STANDARD";
  const profile = securityProfile || depth;
  const evalSignal = evalEvidencePath ? readEvalSignal(evalEvidencePath) : null;

  let selectedModel = roleConfig.default.model;
  let selectedVariant = roleConfig.default.variant;
  let modelOrigin = "role-default";
  let variantOrigin = "role-default";

  if (model) {
    selectedModel = model;
    modelOrigin = "explicit-parameter";
  }
  if (variant) {
    selectedVariant = variant;
    variantOrigin = "explicit-parameter";
  }

  const dynamic = capabilities.length > 0 || !!risk || contextTokens > 0 || !!evalEvidencePath || availableAliases.length > 0;
  if (dynamic && !model && models.routing?.implementations?.length > 0) {
    const item = resolveDynamicCandidate({ routing: models.routing, role, requiredCapabilities: capabilities, depth, securityProfile: profile, contextTokens, allowedAliases: availableAliases, models, env, allowMissingCredentials });
    selectedModel = `${item.provider}/${item.model}`;
    selectedVariant = depth === "LIGHT" ? "medium" : "high";
    modelOrigin = "capability-routing";
  }

  if (!(models.validVariants || []).includes(selectedVariant)) {
    throw new Error(`invalid or unauthorized variant: ${selectedVariant}`);
  }

  assertModelAllowed(models, selectedModel);
  const fallbackLabels = fallbackLabelsFor(explicitFallback);
  const candidates = [{ modelRef: selectedModel, variant: selectedVariant, origin: modelOrigin }];
  const seen = new Set([`${selectedModel}::${selectedVariant}`]);

  for (const label of fallbackLabels) {
    const match = (roleConfig.fallback || []).find((f) => f.label === label);
    if (!match) throw new Error(`fallback not authorized for ${role}: ${label}`);
    if (!(models.validVariants || []).includes(match.variant)) throw new Error(`invalid fallback variant for ${label} on ${role}: ${match.variant}`);
    const allowed = assertModelAllowed(models, match.model);
    const explicitlyRequested = (explicitFallback || []).some((v) => String(v).split(",").map((s) => s.trim()).includes(label));
    if (allowed.providerConfig.requiresExplicitFallback && !explicitlyRequested) {
      throw new Error(`provider ${allowed.provider} requires an explicit fallback (not applied implicitly via role defaults)`);
    }
    const key = `${match.model}::${match.variant}`;
    if (!seen.has(key)) {
      seen.add(key);
      candidates.push({ modelRef: match.model, variant: match.variant, origin: `fallback:${label}`, label });
    }
  }

  const unavailable = [];
  let chosen = null;
  for (const candidate of candidates) {
    if (failureReason) {
      const modelToSkip = failedModel || selectedModel;
      if (candidate.modelRef === modelToSkip) {
        unavailable.push(`${candidate.modelRef}: ${failureReason}`);
        continue;
      }
    }
    const allowed = assertModelAllowed(models, candidate.modelRef);
    if (!hasProviderCredentials(allowed.providerConfig, env, allowMissingCredentials)) {
      unavailable.push(`${candidate.modelRef}: missing credentials or availability flag (${(allowed.providerConfig.credentialEnv || []).join(", ")})`);
      continue;
    }
    chosen = { candidate, allowed };
    break;
  }

  if (!chosen) {
    const details = unavailable.length > 0 ? ` Details: ${unavailable.join("; ")}` : "";
    throw new RoutingBlockedError(`no model available with the authorized fallback for ${role}.${details}`);
  }

  const fallbackApplied = chosen.candidate.modelRef !== selectedModel || !!failureReason;
  return {
    role,
    provider: chosen.allowed.provider,
    model: chosen.allowed.model,
    modelRef: chosen.allowed.ref,
    variant: chosen.candidate.variant,
    modelSelectionOrigin: chosen.candidate.origin,
    variantSelectionOrigin: variantOrigin,
    fallbackApplied,
    fallbackFrom: fallbackApplied ? failedModel || selectedModel : null,
    fallbackReason: failureReason || null,
    durationMs: Date.now() - start,
    capabilitiesRequired: capabilities,
    risk: risk || null,
    sddLevel: depth,
    contextTokens,
    securityProfile: profile,
    evalSignal,
    selectionReason: modelOrigin === "capability-routing" ? "capabilities + SDD/risk policy + availability/cost/latency; deterministic tie-break by alias" : "role default/fallback",
    metricStatus: { cost: "NOT_AVAILABLE_FROM_TOOL" },
  };
}

/**
 * recordRoutingDecision(path, unitId, result, opts) -> appends `result`
 * (as produced by resolveModel) to the Work Unit's events.jsonl as an
 * eventType="routing" entry (PAR-ROUTING-EVIDENCE). Reuses
 * runtime/circuit/events.mjs's hash-chained, schema-validated log instead
 * of a separate model-routing.jsonl file (M3.2 already consolidated the 5
 * legacy machine files behind one log).
 */
export function recordRoutingDecision(path, unitId, result, opts = {}) {
  return appendEvent(path, unitId, "routing", result, opts);
}
