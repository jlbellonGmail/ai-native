// Audit framework checks and release gate (M4.5, AUD-01..05;
// PAR-AUDIT-METHOD). Ports TEMPLATE v2.0.5's tests/test_audit_framework.py
// and generalizes it from "one hardcoded TEMPLATE profile" to the
// profile set in audit/profiles/, and records what changes from
// auditMethod 1.1 (v2.0.5) to 1.2 (audit/method.json).
//
// .audit is NOT a merge gate (preserved from v2.0.5's AUDIT_RULES.md and
// enforced by contracts/audit-report.schema.json `isMergeGate: const
// false`): evaluateReleaseGate is meant for release/milestone checks
// only, and tolerates a score slightly under the threshold with an
// explicit warning instead of failing a release on rounding noise.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { validateReport, certifyExactCommit } from "./report.mjs";

export const PROFILES = ["PLATFORM", "APPLICATION", "LIBRARY", "FACTORY", "TEMPLATE"];
const METHOD_FILES = ["QUALITY_SCORE.md", "AUDIT_RULES.md", "AUDIT_PROMPT.md"];
const NORMATIVE_ORDER = ["QUALITY_SCORE.md", "AUDIT_RULES.md", "profiles/"];

const read = (root, ...p) => readFileSync(join(root, ...p), "utf8");

function profileState(text) {
  const m = /\*\*Estado:\*\*\s*(.+)/.exec(text);
  return m ? m[1].trim() : null;
}

/** Structural check of audit/ (method + profiles). Pure read-only. */
export function checkAuditFramework(root) {
  const errors = [];
  const methodPath = join(root, "audit", "method.json");
  if (!existsSync(methodPath)) return { errors: ["audit/method.json missing"], profiles: {} };
  const method = JSON.parse(readFileSync(methodPath, "utf8"));
  if (!/^\d+\.\d+$/.test(method.auditMethod ?? "")) errors.push("audit/method.json: auditMethod must be MAJOR.MINOR");

  for (const f of METHOD_FILES) {
    const p = join(root, "audit", "method", f);
    if (!existsSync(p) || !read(root, "audit", "method", f).trim()) errors.push(`audit/method/${f} missing or empty`);
  }

  const states = {};
  for (const id of PROFILES) {
    const p = join(root, "audit", "profiles", `${id}.md`);
    if (!existsSync(p)) {
      errors.push(`audit/profiles/${id}.md missing`);
      continue;
    }
    const text = read(root, "audit", "profiles", `${id}.md`);
    states[id] = profileState(text);
    if (!states[id]) errors.push(`audit/profiles/${id}.md has no **Estado:** line`);
    if (states[id] === "Activo" && !text.includes("QUALITY_SCORE.md")) errors.push(`audit/profiles/${id}.md is Activo but does not depend on QUALITY_SCORE.md`);
  }
  const declared = new Set(Object.keys(method.profiles ?? {}));
  for (const id of PROFILES) {
    if (!declared.has(id)) errors.push(`audit/method.json does not declare profile ${id}`);
    else if (states[id] && method.profiles[id] !== states[id]) errors.push(`profile ${id}: method.json says ${method.profiles[id]} but the profile file says ${states[id]}`);
  }
  const dir = join(root, "audit", "profiles");
  if (existsSync(dir)) {
    for (const name of readdirSync(dir)) {
      if (name.endsWith(".md") && !PROFILES.includes(name.slice(0, -3))) errors.push(`audit/profiles/${name} is not a known profile`);
    }
  }

  // The prompt must impose the normative reading order and exactly one profile.
  const prompt = existsSync(join(root, "audit", "method", "AUDIT_PROMPT.md")) ? read(root, "audit", "method", "AUDIT_PROMPT.md") : "";
  const rules = existsSync(join(root, "audit", "method", "AUDIT_RULES.md")) ? read(root, "audit", "method", "AUDIT_RULES.md") : "";
  if (!/exactamente un perfil/i.test(prompt)) errors.push("AUDIT_PROMPT.md must state that exactly one profile applies");
  if (!/no (debe|deben) modificar|no modificar/i.test(`${rules}\n${prompt}`)) errors.push("audit rules must forbid the auditor from modifying the audited repository");
  if (/reviewer-agent/i.test(`${rules}\n${prompt}`)) errors.push("the audit must not be framed as a reviewer/merge gate");
  const order = NORMATIVE_ORDER.map((s) => prompt.indexOf(s));
  if (order.some((i) => i === -1) || order.join() !== [...order].sort((a, b) => a - b).join()) errors.push("AUDIT_PROMPT.md must list QUALITY_SCORE, AUDIT_RULES, then the profile, in that order");
  if (existsSync(join(root, "audit", "runs"))) errors.push("audit/ must not create a second runs/ directory");
  return { errors, profiles: states, auditMethod: method.auditMethod };
}

/**
 * Release/milestone gate over a set of report texts. Only a CURRENT,
 * valid report for an Activo profile counts. NEVER invoked as a merge gate.
 */
export function evaluateReleaseGate({ root, reports, candidate, profile, minScore = 90, tolerance = 2, profiles = {} }) {
  const errors = [];
  const warnings = [];
  if (!PROFILES.includes(profile)) return { status: "FAIL", errors: [`unknown profile ${profile}`], warnings };
  if (profiles[profile] && profiles[profile] !== "Activo") {
    return { status: "FAIL", errors: [`profile ${profile} is ${profiles[profile]}: it must not be used to score a project`], warnings };
  }
  let best = null;
  const rejected = [];
  for (const { name, text } of reports) {
    const { errors: shape, report } = validateReport(text);
    if (shape.length) { rejected.push(`${name}: ${shape[0]}`); continue; }
    if (report.profile !== profile) { rejected.push(`${name}: profile ${report.profile} != ${profile}`); continue; }
    if (report.isMergeGate === true) { rejected.push(`${name}: declares itself a merge gate`); continue; }
    const cert = certifyExactCommit({ root, report, candidate });
    if (cert.status !== "CURRENT") { rejected.push(`${name}: ${cert.status} (${cert.reason})`); continue; }
    if (!best || report.score > best.score) best = { ...report, name };
  }
  if (!best) {
    errors.push(`no current valid ${profile} audit report for ${candidate}`);
    return { status: "FAIL", errors: [...errors, ...rejected], warnings };
  }
  warnings.push(...rejected.map((r) => `ignored report ${r}`));
  if (best.score >= minScore) return { status: warnings.length ? "PASS_WITH_WARNINGS" : "PASS", errors, warnings, report: best.name, score: best.score };
  if (best.score >= minScore - tolerance) {
    warnings.push(`score ${best.score} is below ${minScore} but within the ${tolerance}-point tolerance`);
    return { status: "PASS_WITH_WARNINGS", errors, warnings, report: best.name, score: best.score };
  }
  errors.push(`score ${best.score} is below the release threshold ${minScore} (tolerance ${tolerance})`);
  return { status: "FAIL", errors, warnings, report: best.name, score: best.score };
}
