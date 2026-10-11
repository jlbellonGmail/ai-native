// Human gate per work unit: required | final-only | none, chosen by risk.
// `none` is an explicit decision (human_gate: none + autonomy: full), never a default,
// and it cannot lift a gate that branch protection or the release policy imposes.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const loadHitlPolicy = (root = join(here, "..", "..")) =>
  JSON.parse(readFileSync(join(root, "contracts", "hitl-policy.json"), "utf8"));

/**
 * @param {{risk:"low"|"medium"|"high", humanGate?:string, autonomy?:string,
 *          controlPlane?:boolean, release?:boolean, production?:boolean, security?:boolean}} unit
 * @returns {{ok:boolean, gate:string, reasons:string[]}} gate is the effective gate; reasons explain a refusal or a forced upgrade.
 */
export function resolveHumanGate(unit, policy = loadHitlPolicy()) {
  const rule = policy.risks[unit.risk];
  if (!rule) return { ok: false, gate: "required", reasons: [`unknown risk: ${unit.risk}`] };
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
