// Reads a feature spec's acceptance section and classifies the feature
// (spec 002 RF-19; spec 003 RF-18). Pure text processing, no LLM.
const HEADING = /^ {0,3}(#{1,6})\s+(.*)$/;
const ACCEPTANCE_HEADING = /^[*_]*(?:\d+(?:\.\d+)*[.)]?\s*)?[*_]*(?:acceptance criteria|criterios de aceptaci[oó]n)\b/i;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/** "RF-1, RF-3 to RF-5, NF-2" -> ["RF-1","RF-3","RF-4","RF-5","NF-2"] */
export function expandRequirements(text) {
  const out = new Set();
  const re = /\b([A-Z]{1,4})-(\d+)(?:\s*(?:to|–|-|\.\.)\s*(?:\1-)?(\d+))?\b/g;
  let m;
  while ((m = re.exec(text))) {
    const lo = Number(m[2]);
    const hi = m[3] ? Number(m[3]) : lo;
    if (hi >= lo && hi - lo <= 200) for (let i = lo; i <= hi; i++) out.add(`${m[1]}-${i}`);
  }
  return [...out].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

/**
 * @returns {{ hasSection, criteria:[{id,requirements}], notApplicable:null|{justification,cites}, errors:string[] }}
 */
export function parseSpecAcceptance(specText) {
  const criteria = [];
  const errors = [];
  let hasSection = false;
  let depthOfSection = 0;
  let fenced = false;
  let current = null;
  for (const line of String(specText).normalize("NFC").split(/\r?\n/)) {
    if (FENCE.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const h = HEADING.exec(line);
    if (h) {
      const depth = h[1].length;
      if (depthOfSection && depth <= depthOfSection) depthOfSection = 0;
      if (!depthOfSection && ACCEPTANCE_HEADING.test(h[2].trim())) { depthOfSection = depth; hasSection = true; }
      current = null;
      continue;
    }
    if (!depthOfSection) continue;
    const item = /^\s*[-*]\s+\**(AC-\d+)\**\s*(?:\(([^)]*)\))?\s*:?\s*(.*)$/.exec(line);
    if (item) {
      if (criteria.some((c) => c.id === item[1])) errors.push(`duplicate criterion ${item[1]}`);
      current = { id: item[1], requirements: expandRequirements(item[2] ?? "") };
      criteria.push(current);
    } else if (current && /^\s{2,}\S/.test(line) && !current.requirements.length) {
      // continuation line carrying the citation
      current.requirements = expandRequirements(line);
    }
  }
  for (const c of criteria) if (!c.requirements.length) errors.push(`${c.id} cites no requirement`);
  // explicit N/A declaration: `acceptance: not-applicable` + justification citing requirements
  let notApplicable = null;
  const decl = /^acceptance:\s*not-applicable\b.*$/im.exec(specText);
  if (decl) {
    const just = /^acceptance-justification:\s*(.+)$/im.exec(specText);
    const cites = just ? expandRequirements(just[1]) : [];
    notApplicable = { justification: just?.[1]?.trim() ?? "", cites };
    if (!notApplicable.justification || !cites.length) errors.push("acceptance: not-applicable requires a justification citing its requirements");
  }
  return { hasSection, criteria, notApplicable, errors };
}

/**
 * RF-18 classification. `legacySlugs` is the cutoff recorded by the upgrade.
 * @returns {{ kind: "REQUIRED"|"NOT_APPLICABLE"|"LEGACY"|"MISSING", blocking:boolean, reasons:string[] }}
 */
export function classifyFeature({ slug, specText, legacySlugs = [] }) {
  const parsed = parseSpecAcceptance(specText ?? "");
  // the cutoff wins: a legacy spec keeps v4.0.2 behavior even when it has AC-n lines (the v4.0.2 template writes them)
  if (legacySlugs.includes(slug)) return { kind: "LEGACY", blocking: false, reasons: [], parsed };
  if (parsed.criteria.length) return { kind: "REQUIRED", blocking: false, reasons: parsed.errors, parsed };
  if (parsed.notApplicable) return { kind: "NOT_APPLICABLE", blocking: parsed.errors.length > 0, reasons: parsed.errors, parsed, humanGate: "required", pendingApproval: true };
  return { kind: "MISSING", blocking: true, reasons: ["spec declares neither AC-n acceptance criteria nor `acceptance: not-applicable` with a justification"], parsed };
}
