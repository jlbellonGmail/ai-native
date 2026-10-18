// M4.3 (PAR-PROPORTIONAL-GATES). Gates scale with the SDD level but the HITL
// never does: every level ends in the same single human merge. The gate list
// per level comes from governance/gates/gates.json (read from base) and is
// cross-checked against contracts/sdd-levels.json so the two cannot drift.

export function gatesForLevel(config, level) {
  const gates = config.gatesByLevel?.[level];
  if (!gates) throw new Error(`no gates configured for SDD level '${level}'`);
  return gates;
}

/** Findings for inconsistencies between gatesByLevel and sdd-levels.json. */
export function checkProportionality(config, sddLevels) {
  const findings = [];
  const order = ["LIGHT", "STANDARD", "FULL"];
  let prev = new Set();
  for (const level of order) {
    const gates = config.gatesByLevel?.[level];
    if (!gates) {
      findings.push({ code: "LEVEL_MISSING", detail: `gatesByLevel lacks ${level}` });
      continue;
    }
    const set = new Set(gates);
    for (const g of prev) if (!set.has(g)) findings.push({ code: "NOT_MONOTONIC", detail: `${level} drops gate '${g}' required at a lower level` });
    for (const base of ["ci", "trust-gate", "pr-gate"]) if (!set.has(base)) findings.push({ code: "BASELINE_MISSING", detail: `${level} lacks baseline gate '${base}'` });
    const reviews = sddLevels.levels?.[level]?.requiredReviews ?? [];
    if (reviews.includes("spec") && !set.has("spec-review")) findings.push({ code: "REVIEW_GATE_MISSING", detail: `${level} requires a spec review in sdd-levels.json but gatesByLevel lacks spec-review` });
    if (!reviews.includes("spec") && set.has("spec-review")) findings.push({ code: "REVIEW_GATE_EXTRA", detail: `${level} lists spec-review but sdd-levels.json does not require a spec review` });
    prev = set;
  }
  return findings;
}
