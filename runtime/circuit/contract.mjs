// Evidence contract (M3.2, CIR-04, CIR-05, CIR-06, CIR-07; PAR-SDD-LIGHT,
// PAR-SDD-STANDARD, PAR-SDD-FULL, PAR-SDD-NO-RECLASSIFY, PAR-VERDICT-COMPAT).
//
// contracts/sdd-levels.json (M2.1) is the ONLY source of required
// artifacts/reviews per depth -- this module never re-derives or
// hardcodes a parallel list (PAR-SDD-NO-RECLASSIFY is exactly the
// regression TEMPLATE v2.0.5 risked: assess-work-unit.ps1's depth and
// feature-contract.ps1's Get-EvidenceContract could, in principle,
// disagree because they were two separate hardcoded tables).
//
// TEMPLATE v2.0.5's file-based "last attempt wins" verdict convention
// (audit-N.md / test-report-N.md / code-review-N.md, YAML front matter)
// is read here read-only, for historical/migration fixtures only
// (parseLegacyVerdictArtifact). New Work Units record verdicts as
// `review`/`verify` events (runtime/circuit/review-run.mjs,
// runtime/circuit/verify.mjs) -- PAR-VERDICT-COMPAT covers both paths.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sddLevels = JSON.parse(readFileSync(join(here, "..", "..", "contracts", "sdd-levels.json"), "utf8"));

/** The sdd-levels.json entry for `depth` is the single evidence contract. */
export function getEvidenceContract(depth) {
  const level = sddLevels.levels[depth];
  if (!level) throw new Error(`unknown SDD depth: ${depth}`);
  return { depth, requiredArtifacts: level.requiredArtifacts, requiredReviews: level.requiredReviews, steps: level.steps, convergenceBudget: level.convergenceBudget };
}

/** Historical-only: TEMPLATE v2.0.5 runs with no sdd.json evidence at
 * all predate the adaptive contract. Never applied to a new Work Unit;
 * exists so migrated/legacy fixtures can still be read. */
export const LEGACY_EVIDENCE_CONTRACT = Object.freeze({
  depth: "LEGACY",
  requiredArtifacts: ["decision.md", "spec.md", "plan.md", "tasks.md", "SUMMARY.md"],
  requiredReviews: ["audit", "test-report", "code-review"],
});

function fileNonEmpty(path) {
  return existsSync(path) && readFileSync(path, "utf8").trim().length > 0;
}

/** Checks every requiredArtifact for `depth` exists and is non-empty
 * under `runDir`. Returns { ok, missing } rather than throwing, so
 * callers can report every gap at once (PAR-READY needs the full list). */
export function checkRequiredArtifacts(runDir, depth) {
  const contract = getEvidenceContract(depth);
  const missing = contract.requiredArtifacts.filter((name) => !fileNonEmpty(join(runDir, name)));
  return { ok: missing.length === 0, missing };
}

const SUMMARY_SECTIONS = ["Objetivo", "Resultado", "Cambios principales", "Validación", "Decisiones", "Incidencias", "Detalle"];
const SUMMARY_FIELDS = ["Estado", "Versión", "Tipo", "SDD", "PR", "Merge"];

/**
 * CIR-06: SUMMARY.md's 7-section/6-field contract, preserved from
 * TEMPLATE v2.0.5. LIGHT additionally accepts a compact "Intent" section
 * in place of the full section set (LIGHT's own steps are
 * intent/build/verify/code-review -- there is no separate spec step to
 * summarize against).
 */
export function checkSummaryContract(content, depth) {
  const missingSections = SUMMARY_SECTIONS.filter((section) => !new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, "m").test(content));
  const missingFields = SUMMARY_FIELDS.filter((field) => !new RegExp(`^${escapeRegExp(field)}:\\s*\\S`, "m").test(content));
  if (depth === "LIGHT" && missingSections.length > 0) {
    const hasIntent = /^##\s+Intent\s*$/m.test(content);
    if (hasIntent) {
      return { ok: missingFields.length === 0, missingSections: [], missingFields, usedLightIntent: true };
    }
  }
  return { ok: missingSections.length === 0 && missingFields.length === 0, missingSections, missingFields, usedLightIntent: false };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- Legacy (v2.0.5) verdict artifact compatibility (PAR-VERDICT-COMPAT) ---

/**
 * Read-only port of Get-LatestVerdictArtifact: among `<prefix>-N.md`
 * files in `entries`, selects the highest REAL integer N (not
 * lexicographic order -- audit-10 sorts after audit-2), parses its ```yaml
 * fenced block, and validates status (approved|rejected, case-sensitive)
 * and that its `attempt:` field matches N. For historical v2 fixtures
 * only; never used to decide a new Work Unit's verdict.
 */
export function parseLegacyVerdictArtifact(entries, prefix) {
  const pattern = new RegExp(`^${escapeRegExp(prefix)}-(\\d+)\\.md$`);
  const candidates = entries
    .map((entry) => ({ name: entry.name, content: entry.content, match: entry.name.match(pattern) }))
    .filter((c) => c.match)
    .map((c) => ({ ...c, number: parseInt(c.match[1], 10) }));

  if (candidates.length === 0) {
    throw new Error(`missing at least one ${prefix}-N.md`);
  }
  const latest = candidates.sort((a, b) => b.number - a.number)[0];
  if (!latest.content || latest.content.trim().length === 0) {
    throw new Error(`${latest.name} is empty`);
  }

  const yamlMatch = latest.content.match(/```yaml\s*\r?\n([\s\S]*?)```/);
  if (!yamlMatch) {
    throw new Error(`${latest.name} has no valid \`\`\`yaml fenced block`);
  }
  const yamlBlock = yamlMatch[1];

  const statusMatches = [...yamlBlock.matchAll(/^\s*status:\s*(\S+)\s*$/gm)];
  if (statusMatches.length !== 1) {
    throw new Error(`${latest.name} has a missing or invalid status`);
  }
  const status = statusMatches[0][1];
  if (status !== "approved" && status !== "rejected") {
    throw new Error(`${latest.name} has a missing or invalid status: '${status}'`);
  }

  const attemptMatches = [...yamlBlock.matchAll(/^\s*attempt:\s*(\d+)\s*$/gm)];
  if (attemptMatches.length !== 1) {
    throw new Error(`${latest.name} has a missing or non-numeric attempt`);
  }
  const attempt = parseInt(attemptMatches[0][1], 10);
  if (attempt !== latest.number) {
    throw new Error(`${latest.name} has attempt (${attempt}) that does not match the filename (expected ${latest.number})`);
  }

  return { name: latest.name, attempt, status };
}

/** Throws unless the latest legacy verdict artifact is status=approved. */
export function assertLegacyVerdictApproved(entries, prefix, label) {
  const artifact = parseLegacyVerdictArtifact(entries, prefix);
  if (artifact.status !== "approved") {
    throw new Error(`the latest ${label} attempt (${artifact.name}, attempt ${artifact.attempt}) is not approved (status: ${artifact.status})`);
  }
  return artifact;
}
