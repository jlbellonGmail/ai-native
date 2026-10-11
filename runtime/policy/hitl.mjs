// Human gate per work unit: required | final-only | none, chosen by risk.
// `none` is an explicit decision (human_gate: none + autonomy: full), never a default,
// and it cannot lift a gate that branch protection or the release policy imposes.
import { readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const KNOWN = new Set(["risk", "humanGate", "autonomy", "controlPlane", "release", "production", "security"]);
export const loadHitlPolicy = (root = join(here, "..", "..")) =>
  JSON.parse(readFileSync(join(root, "contracts", "hitl-policy.json"), "utf8"));

/**
 * @param {{risk:"low"|"medium"|"high", humanGate?:string, autonomy?:string,
 *          controlPlane?:boolean, release?:boolean, production?:boolean, security?:boolean}} unit
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

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  // CLI used by the Coordinator before /sdd-implement-all: node hitl.mjs --risk low --human-gate none --autonomy full [--control-plane --release --production --security]
  const a = process.argv.slice(2);
  const val = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  const unit = { risk: val("--risk"), humanGate: val("--human-gate"), autonomy: val("--autonomy"), controlPlane: a.includes("--control-plane"), release: a.includes("--release"), production: a.includes("--production"), security: a.includes("--security") };
  const r = resolveHumanGate(unit);
  console.log(r.ok ? `PASS: human_gate ${r.gate}${r.reasons.length ? ` (${r.reasons[0]})` : ""}` : `FAIL: ${r.reasons.join("; ")}`);
  process.exit(r.ok ? 0 : 1);
}
