// Human gate per work unit: required | final-only | none, chosen by risk.
// The decision is DERIVED, not declared: risk comes from the changed paths (ASSESS), control plane
// from the trusted base gate config, environment from the caller (CI / release), and `none` needs the
// repo policy (profile.governance.allowNone) on top of the work unit's own explicit declaration
// (human_gate: none + autonomy: full). It never lifts branch protection or the release policy.
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assess } from "../circuit/assess.mjs";
import { classifyPaths, loadGateConfig } from "../gates/control-plane.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PLATFORM_ROOT = join(here, "..", "..");
const KNOWN = new Set(["risk", "humanGate", "autonomy", "controlPlane", "release", "production", "security"]);
export const ENVIRONMENTS = ["development", "release", "production"];

export const loadHitlPolicy = (root = PLATFORM_ROOT) => JSON.parse(readFileSync(join(root, "contracts", "hitl-policy.json"), "utf8"));

/**
 * Pure rule: effective gate for a unit whose facts are already known.
 * @returns {{ok:boolean, gate:string, reasons:string[]}} gate is the effective gate; reasons explain a refusal or a forced upgrade.
 */
export function resolveHumanGate(unit, policy = loadHitlPolicy()) {
  const rule = Object.hasOwn(policy.risks, unit.risk) ? policy.risks[unit.risk] : null;
  if (!rule) return { ok: false, gate: "required", reasons: [`unknown risk: ${unit.risk}`] };
  const unknown = Object.keys(unit).filter((k) => !KNOWN.has(k));
  if (unknown.length) return { ok: false, gate: "required", reasons: [`unknown work unit key: ${unknown.join(", ")}`] };
  const forced = policy.forceRequired.filter((flag) => unit[flag]);
  const wanted = unit.humanGate ?? rule.default;
  if (!policy.gates.includes(wanted)) return { ok: false, gate: "required", reasons: [`unknown human_gate: ${wanted}`] };
  if (!rule.allowed.includes(wanted)) {
    return { ok: false, gate: "required", reasons: [`human_gate ${wanted} is not allowed for ${unit.risk} risk (allowed: ${rule.allowed.join(", ")})`] };
  }
  if (wanted === "none" && unit.autonomy !== policy.noneRequires.autonomy) {
    return { ok: false, gate: "required", reasons: [`human_gate none requires autonomy: ${policy.noneRequires.autonomy}`] };
  }
  if (forced.length && wanted !== "required") {
    // not a refusal: protection wins, the unit simply keeps its human gate
    return { ok: true, gate: "required", reasons: [`${forced.join(", ")} keeps the human gate required (external protection wins)`] };
  }
  return { ok: true, gate: wanted, reasons: [] };
}

export function assertHumanGate(unit, policy) {
  const result = resolveHumanGate(unit, policy);
  if (!result.ok) throw new Error(result.reasons.join("; "));
  return result;
}

/**
 * Derives the facts from evidence and applies the rule.
 * @param {{changedPaths:string[], declared?:{humanGate?:string, autonomy?:string}, controlPlanePatterns?:string[],
 *          environment?:string, allowNone?:boolean}} input
 * No changed paths means the change cannot be assessed: risk is `medium` (never `none`, never silently low).
 */
export function deriveHumanGate({ changedPaths = [], declared = {}, controlPlanePatterns = [], environment = "development", allowNone = false }, policy = loadHitlPolicy()) {
  if (!ENVIRONMENTS.includes(environment)) return { ok: false, gate: "required", risk: "high", reasons: [`unknown environment: ${environment}`] };
  const assessed = changedPaths.length ? assess(changedPaths) : null;
  const risk = assessed ? assessed.risk.toLowerCase() : "medium";
  const facts = {
    risk,
    controlPlane: classifyPaths(changedPaths, controlPlanePatterns).controlPlane.length > 0,
    release: environment === "release",
    production: environment === "production",
    security: Boolean(assessed?.signals.some((s) => s.code === "sensitive-or-data")),
  };
  if (declared.humanGate !== undefined) facts.humanGate = declared.humanGate;
  if (declared.autonomy !== undefined) facts.autonomy = declared.autonomy;
  if (facts.humanGate === "none" && !allowNone) {
    return { ok: false, gate: "required", risk, reasons: ["human_gate none is not allowed by this repository's policy (profile governance.allowNone)"] };
  }
  return { ...resolveHumanGate(facts, policy), risk };
}

const DECLARATION = (key) => new RegExp(`^[ \\t>*-]*${key}:[ \\t]*([A-Za-z-]+)`, "im");

/** `human_gate:` / `autonomy:` lines of a spec.md (the work unit's explicit declaration, reviewed in the PR). */
export function readDeclaration(specText) {
  // fenced code blocks are examples, not declarations
  specText = specText.replace(/^[ \t]*(```|~~~)[\s\S]*?^[ \t]*\1[^\n]*$/gm, "");
  const gate = DECLARATION("human_gate").exec(specText);
  const autonomy = DECLARATION("autonomy").exec(specText);
  return { ...(gate && { humanGate: gate[1].toLowerCase() }), ...(autonomy && { autonomy: autonomy[1].toLowerCase() }) };
}

function git(cwd, args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return r.status === 0 ? r.stdout : null;
}

/**
 * Gate check of a change in a project: every changed `specs/<slug>/spec.md` is a work unit; its declaration
 * (or the default) is evaluated against facts derived from the whole change. No spec = one anonymous unit, defaults only.
 * @returns {{ok:boolean, units:{unit:string, ok:boolean, gate:string, risk:string, reasons:string[]}[]}}
 */
export function checkHumanGate({ project, changedPaths, base = null, allowNone = false, environment = "development", controlPlanePatterns = null, requireGateConfig = false, policy = loadHitlPolicy() }) {
  let patterns = controlPlanePatterns;
  if (patterns === null) {
    try {
      patterns = base ? loadGateConfig(project, base).controlPlane : [];
    } catch (error) {
      // only a consumer that never had a gate config ("not found") has no control-plane globs of its own;
      // an invalid config, or a missing one where it is required, fails closed
      const absent = /not found at base/.test(error.message);
      if (!absent || requireGateConfig) return { ok: false, units: [{ unit: "(gate config)", ok: false, gate: "required", risk: "high", reasons: [`control-plane config unusable: ${error.message}`] }] };
      patterns = [];
    }
  }
  const specs = changedPaths.filter((p) => /^specs\/[^/]+\/spec\.md$/.test(p));
  const declared = specs.map((p) => ({ unit: p, declaration: existsSync(join(project, p)) ? readDeclaration(readFileSync(join(project, p), "utf8")) : {} }));
  if (!declared.length) declared.push({ unit: "(change)", declaration: {} });
  const units = declared.map(({ unit, declaration }) => ({ unit, ...deriveHumanGate({ changedPaths, declared: declaration, controlPlanePatterns: patterns, environment, allowNone }, policy) }));
  return { ok: units.every((u) => u.ok), units };
}

/** Repo policy comes from the pinned profile, never from the project's own files. */
export function allowNoneFor(profileId, platformRoot = PLATFORM_ROOT) {
  const file = join(platformRoot, "profiles", `${profileId}.json`);
  if (!profileId || !existsSync(file)) return false;
  return JSON.parse(readFileSync(file, "utf8")).governance?.allowNone === true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  // node hitl.mjs --base <ref> [--project .] [--environment development|release|production] [--profile <id>]
  // The diff and the base gate config are read from git; risk and protected areas are never taken from flags.
  const a = process.argv.slice(2);
  const val = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  const project = resolve(val("--project") ?? ".");
  const base = val("--base");
  if (!base) {
    console.error("FAIL: --base <ref> is required: the change must be assessed from git");
    process.exit(1);
  }
  const out = git(project, ["diff", "--name-only", "--no-renames", base, "HEAD"]);
  if (out === null) {
    console.error(`FAIL: cannot diff ${base}..HEAD`);
    process.exit(1);
  }
  const result = checkHumanGate({
    project,
    base,
    changedPaths: out.split(/\r?\n/).filter(Boolean),
    environment: val("--environment") ?? "development",
    allowNone: allowNoneFor(val("--profile") ?? "factory"),
    requireGateConfig: existsSync(join(project, "governance", "gates", "gates.json")),
  });
  for (const u of result.units) console.log(`${u.ok ? "PASS" : "FAIL"} ${u.unit}: risk ${u.risk}, human_gate ${u.gate}${u.reasons.length ? ` (${u.reasons.join("; ")})` : ""}`);
  process.exit(result.ok ? 0 : 1);
}
