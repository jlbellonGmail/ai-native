// Deterministic acceptance plan validator (spec 002 RF-19..RF-22, RF-32, RF-33).
// The Builder generates the plan; this validator decides. No LLM judgement.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { validate } from "../lib/schema-lite.mjs";
import { normalizeRepoPath } from "./manifest.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const PLAN_SCHEMA = JSON.parse(readFileSync(join(here, "..", "..", "contracts", "acceptance-plan.schema.json"), "utf8"));
export const CATEGORIES = Object.freeze(["positive", "negative", "boundary", "integration", "contract", "persistence", "cross-cutting"]);

// detectable secrets / real personal data (RF-22); the rest is a review obligation
const SECRET_PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}\b/, "GitHub token"],
  [/\bsk-[A-Za-z0-9]{20,}\b/, "API key"],
  [/\b(?:password|passwd|secret|api[_-]?key|token)\s*[:=]\s*["']?[^\s"',]{6,}/i, "credential assignment"],
];
const PII_PATTERNS = [
  [/\b[A-Za-z0-9._%+-]+@(?!example\.(?:com|org|net|invalid)\b|[A-Za-z0-9.-]*\.invalid\b|test\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, "real-looking e-mail address"],
  [/\b\d{3}-\d{2}-\d{4}\b/, "SSN-like number"],
  [/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}\b/, "IBAN-like number"],
  [/\b(?:\d[ -]?){13,16}\b/, "card-like number"],
];

export const sha256File = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Scans text for detectable secrets/personal data. Never echoes the matched value. */
export function scanSynthetic(text) {
  const found = [];
  for (const [re, label] of [...SECRET_PATTERNS, ...PII_PATTERNS]) if (re.test(text)) found.push(label);
  return found;
}

/**
 * @param plan parsed plan.json
 * @param {object} ctx
 *   spec:     { criteria: [{id, requirements:[...]}] }  parsed spec acceptance section
 *   runners:  Map<runnerId, runner> from the validated contract
 *   readFile: (repoRelPath) => Buffer | null  (datasets)
 *   generate: (dataset) => Buffer   (only for generator datasets)
 * @returns {{ ok, errors, status }}  status BLOCKED when invalid
 */
export function validatePlan(plan, { spec, runners, readFile = () => null, generate = null } = {}) {
  if (plan === null || typeof plan !== "object" || Array.isArray(plan)) return { ok: false, status: "BLOCKED", errors: ["plan must be a JSON object"] };
  const errors = new Set(validate(plan, PLAN_SCHEMA).map((e) => `schema: ${e}`));
  if (errors.size) return { ok: false, status: "BLOCKED", errors: [...errors].sort() };

  const acIds = new Set();
  for (const c of plan.criteria) {
    if (acIds.has(c.id)) errors.add(`duplicate criterion ${c.id}`);
    acIds.add(c.id);
    if (!c.requirements.length) errors.add(`${c.id} cites no requirement`);
  }
  // the plan's criteria must be exactly the spec's (RF-19)
  if (spec) {
    const specIds = new Set(spec.criteria.map((c) => c.id));
    for (const id of specIds) if (!acIds.has(id)) errors.add(`spec criterion ${id} is absent from the plan`);
    for (const id of acIds) if (!specIds.has(id)) errors.add(`plan criterion ${id} is not in the spec`);
    const specReq = new Map(spec.criteria.map((c) => [c.id, c.requirements]));
    for (const c of plan.criteria) if (specReq.has(c.id) && JSON.stringify([...specReq.get(c.id)].sort()) !== JSON.stringify([...c.requirements].sort())) errors.add(`${c.id} requirements differ from the spec`);
  }

  const datasets = new Map();
  for (const d of plan.datasets) {
    if (datasets.has(d.id)) errors.add(`duplicate dataset ${d.id}`);
    datasets.set(d.id, d);
    let bytes = null;
    if (d.kind === "file") {
      if (!d.path || normalizeRepoPath(d.path) === null) errors.add(`dataset ${d.id}: file dataset needs a safe path`);
      else {
        bytes = readFile(normalizeRepoPath(d.path));
        if (bytes === null) errors.add(`dataset ${d.id}: committed file is missing`);
      }
    } else {
      if (!Number.isInteger(d.seed)) errors.add(`dataset ${d.id}: generator dataset needs a fixed integer seed`);
      if (!d.generator || normalizeRepoPath(d.generator) === null) errors.add(`dataset ${d.id}: generator dataset needs a declared generator path`);
      else if (generate) {
        try { bytes = generate(d); } catch { errors.add(`dataset ${d.id}: generator failed`); }
      } else errors.add(`dataset ${d.id}: generator output cannot be reproduced here`);
    }
    if (bytes !== null) {
      if (sha256File(bytes) !== d.sha256) errors.add(`dataset ${d.id}: digest mismatch`);
      for (const label of scanSynthetic(bytes.toString("utf8"))) errors.add(`dataset ${d.id}: contains a ${label} (datasets must be synthetic)`);
    }
  }

  // applicability matrix (RF-20)
  const casesByCategory = new Map(CATEGORIES.map((c) => [c, []]));
  const caseIds = new Set();
  for (const k of plan.cases) {
    if (caseIds.has(k.id)) errors.add(`duplicate case ${k.id}`);
    caseIds.add(k.id);
    casesByCategory.get(k.category).push(k);
  }
  const citable = new Set([...acIds, ...plan.criteria.flatMap((c) => c.requirements)]);
  for (const cat of Object.keys(plan.matrix)) if (!CATEGORIES.includes(cat)) errors.add(`matrix: unknown category ${cat}`);
  for (const cat of CATEGORIES) {
    const m = plan.matrix[cat];
    if (m === undefined || m === null || typeof m !== "object") { errors.add(`matrix: category ${cat} is not declared`); continue; }
    if (m.status === "APPLICABLE") {
      if (!casesByCategory.get(cat).length) errors.add(`matrix: ${cat} is APPLICABLE without a case`);
    } else if (m.status === "NOT_APPLICABLE") {
      if (typeof m.justification !== "string" || m.justification.trim().length < 10) errors.add(`matrix: ${cat} NOT_APPLICABLE lacks a written justification`);
      const cites = Array.isArray(m.cites) ? m.cites : [];
      if (!cites.length || !cites.every((x) => citable.has(x))) errors.add(`matrix: ${cat} NOT_APPLICABLE must cite requirement(s) or AC(s) of this feature`);
      if (casesByCategory.get(cat).length) errors.add(`matrix: ${cat} is NOT_APPLICABLE but has cases (cases are not generated for N/A categories)`);
    } else errors.add(`matrix: ${cat} status must be APPLICABLE or NOT_APPLICABLE`);
  }

  // cases
  const reqByAc = new Map(plan.criteria.map((c) => [c.id, c.requirements]));
  const acHasCase = new Map([...acIds].map((id) => [id, false]));
  const acFailCapable = new Map([...acIds].map((id) => [id, false]));
  const reqReached = new Set();
  for (const k of plan.cases) {
    for (const a of k.ac) {
      if (!acIds.has(a)) errors.add(`case ${k.id}: unknown criterion ${a}`);
      else {
        if (k.mandatory) acHasCase.set(a, true);
        if (k.expected === "reject" || (k.seededFailure && typeof k.seededFailure === "object" && Object.keys(k.seededFailure).length)) acFailCapable.set(a, true);
        for (const r of reqByAc.get(a)) reqReached.add(r);
      }
    }
    if (!runners?.has(k.runner)) errors.add(`case ${k.id}: runner '${k.runner}' is not in the validation contract`);
    if (k.dataset !== undefined && !datasets.has(k.dataset)) errors.add(`case ${k.id}: unknown dataset ${k.dataset}`);
    for (const f of ["why", "realSystemUse", "intentionalErrors", "limitations", "restore"]) if (!String(k[f]).trim()) errors.add(`case ${k.id}: ${f} must not be empty`);
    if (!k.sutPaths.length) errors.add(`case ${k.id}: declares no SUT input path`);
    for (const p of k.sutPaths) if (normalizeRepoPath(p) === null) errors.add(`case ${k.id}: SUT path escapes the repository`);
    if (k.mandatory === false) errors.add(`case ${k.id}: a case may not be declared non-mandatory in a plan (use the matrix)`);
  }
  for (const [id, has] of acHasCase) if (!has) errors.add(`${id} has no mandatory case`);
  for (const [id, ok] of acFailCapable) if (!ok && acHasCase.get(id)) errors.add(`${id} has only vacuously passing cases: needs a rejection-expecting case or a recorded seeded-failure run`);
  for (const c of plan.criteria) for (const r of c.requirements) if (!reqReached.has(r)) errors.add(`requirement ${r} is not reachable from a case`);

  return { ok: errors.size === 0, status: errors.size ? "BLOCKED" : "OK", errors: [...errors].sort() };
}

/** Pending approval items derived from the plan matrix (RF-35): one per NOT_APPLICABLE category. */
export function naItems(plan) {
  return CATEGORIES.filter((c) => plan.matrix?.[c]?.status === "NOT_APPLICABLE").map((c) => ({
    kind: "NOT_APPLICABLE",
    id: `matrix:${c}`,
    justificationDigest: sha256File(Buffer.from(JSON.stringify({ c, j: plan.matrix[c].justification, cites: plan.matrix[c].cites }))),
  }));
}
