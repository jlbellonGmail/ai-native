// Deterministic ASSESS (M3.2, CIR-03; PAR-SDD-LIGHT/STANDARD/FULL).
// Ported from TEMPLATE v2.0.5's assess-work-unit.ps1. The signal weights,
// breadth rules and score thresholds that used to be hardcoded in the
// pwsh elseif-chain now live in contracts/assess-rules.json, so the rule
// set can be audited or amended as data. Deterministic: same changed
// paths always produce the same signals/score/risk/depth -- this is the
// one contract runtime/circuit/contract.mjs trusts without re-deriving it
// (PAR-SDD-NO-RECLASSIFY).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const rulesPath = join(here, "..", "..", "contracts", "assess-rules.json");

let cachedRules = null;
function loadRules() {
  if (!cachedRules) {
    cachedRules = JSON.parse(readFileSync(rulesPath, "utf8"));
  }
  return cachedRules;
}

function classifyPath(path, rules) {
  const normalized = path.replace(/\\/g, "/").toLowerCase();
  for (const signal of rules.pathSignals) {
    if (new RegExp(signal.pattern).test(normalized)) {
      return signal;
    }
  }
  return rules.defaultSignal;
}

/**
 * assess(changedPaths) -> { schemaVersion, deterministic, changedFiles,
 * fileCount, score, risk, depth, signals, rationale }. Throws if
 * changedPaths is empty (ASSESS requires evidence, same as the pwsh
 * original's "-ChangedPath" requirement).
 */
export function assess(changedPaths, { rules = loadRules() } = {}) {
  const unique = [...new Set(changedPaths.map((p) => p.trim()).filter(Boolean))].sort();
  if (unique.length === 0) {
    throw new Error("assess() requires at least one changed path");
  }

  let score = 0;
  let forcedHigh = false;
  const signals = unique.map((path) => {
    const rule = classifyPath(path, rules);
    score += rule.weight;
    if (rule.forcesHigh) forcedHigh = true;
    return { code: rule.code, level: rule.level, weight: rule.weight, reason: rule.reason, path };
  });

  const breadthRule = [...rules.breadthRules].sort((a, b) => b.minFiles - a.minFiles).find((r) => unique.length >= r.minFiles);
  if (breadthRule) {
    score += breadthRule.addScore;
    if (breadthRule.forcesHigh) forcedHigh = true;
  }

  let risk;
  let depth;
  if (forcedHigh || score >= rules.thresholds.fullScore) {
    risk = "HIGH";
    depth = "FULL";
  } else if (score >= rules.thresholds.standardScore) {
    risk = "MEDIUM";
    depth = "STANDARD";
  } else {
    risk = "LOW";
    depth = "LIGHT";
  }

  return {
    schemaVersion: 1,
    assessment: "ASSESS",
    deterministic: true,
    changedFiles: unique,
    fileCount: unique.length,
    score,
    risk,
    depth,
    signals,
    rationale: "Deterministic classification by paths and breadth; auditable recommendation, does not activate stages or relax contracts.",
  };
}
