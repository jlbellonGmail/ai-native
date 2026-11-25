// `ai-native sdd acceptance plan|manual|run|status <slug>` (spec 003 RF-1): re-runs and manual use of the
// acceptance phase that /sdd-implement-all runs automatically. No new slash command.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { CONTRACT_PATH, featureAcceptanceStatus, planPath, runFeatureAcceptance, writeTraceability } from "./feature.mjs";
import { validateContract } from "./contract.mjs";
import { CATEGORIES, validatePlan } from "./plan.mjs";
import { classifyFeature, parseSpecAcceptance } from "./spec-acceptance.mjs";
import { checkParity, renderManual } from "./manual.mjs";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const manualPath = (slug) => `specs/${slug}/acceptance/MANUAL.md`;
export const PROPOSAL_PATH = "acceptance/validation-contract.proposal.json";
// a deliberately incomplete proposal: it validates only after a human-reviewed runner replaces the placeholder argv
const CONTRACT_PROPOSAL = {
  schemaVersion: 1,
  minObservedCases: 1,
  runners: [{ id: "acceptance", executable: "node", argv: ["--test", "--test-reporter=tap", "<acceptance test file(s)>"], cwd: ".", format: "tap13", timeoutMs: 120000, isolation: "restricted", env: [] }],
  nonSutPaths: [],
};

function printStatus(st, json) {
  if (json) console.log(JSON.stringify(st, null, 2));
  else {
    console.log(`ACCEPTANCE: ${st.status}`);
    console.log(`CLASSIFICATION: ${st.classification}`);
    if (st.revision) console.log(`REVISION: ${st.revision}`);
    if (st.pending?.length) console.log(`PENDING_APPROVAL: ${st.pending.join(", ")}`);
    for (const c of st.cases ?? []) console.log(`  ${c.status.padEnd(8)} ${c.id}${c.reason && c.status !== "PASS" ? ` (${c.reason})` : ""}`);
    for (const r of (st.reasons ?? []).slice(0, 15)) console.log(`  reason: ${r}`);
  }
  return st.status === "PASS" || st.status === "NOT_APPLICABLE" ? 0 : 1;
}

export function acceptanceCommand({ sub, slug, project, base, json = false }) {
  const specFile = join(project, "specs", slug, "spec.md");
  if (sub === "plan") {
    if (!existsSync(specFile)) { console.error(`FAIL: specs/${slug}/spec.md not found`); return 1; }
    const parsed = parseSpecAcceptance(readFileSync(specFile, "utf8"));
    const file = join(project, planPath(slug));
    if (!existsSync(file)) {
      // a skeleton the Builder completes: criteria from the spec, every category to decide, no invented case
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `${JSON.stringify({ schemaVersion: 1, slug, criteria: parsed.criteria, matrix: Object.fromEntries(CATEGORIES.map((c) => [c, { status: "APPLICABLE" }])), datasets: [], cases: [] }, null, 2)}\n`);
      console.log(`WROTE: ${planPath(slug)} (skeleton: the Builder adds the cases, datasets and N/A justifications)`);
    }
    const cfile = join(project, CONTRACT_PATH);
    if (!existsSync(cfile)) {
      // never created silently: a proposal the human reviews and renames (its creation forces the human gate)
      const proposal = join(project, PROPOSAL_PATH);
      if (!existsSync(proposal)) {
        mkdirSync(dirname(proposal), { recursive: true });
        writeFileSync(proposal, `${JSON.stringify(CONTRACT_PROPOSAL, null, 2)}\n`);
      }
      console.log(`BLOCKED: no ${CONTRACT_PATH}. Proposal: ${PROPOSAL_PATH} (schema: contracts/acceptance-validation-contract.schema.json of the platform).`);
      console.log(`  Fill the runner (fixed executable, argv, structured format), then move it to ${CONTRACT_PATH} for human review.`);
      return 1;
    }
    const vc = validateContract(readJson(cfile));
    const pv = validatePlan(readJson(file), { spec: parsed, runners: vc.runners, readFile: (rel) => (existsSync(join(project, rel)) ? readFileSync(join(project, rel)) : null) });
    const errors = [...vc.errors.map((e) => `contract: ${e}`), ...pv.errors.map((e) => `plan: ${e}`)];
    console.log(`PLAN: ${errors.length ? "BLOCKED" : "VALID"} (${parsed.criteria.length} criteria)`);
    for (const e of errors) console.log(`  ${e}`);
    return errors.length ? 1 : 0;
  }
  if (sub === "manual") {
    for (const rel of [planPath(slug), CONTRACT_PATH]) {
      if (!existsSync(join(project, rel))) { console.error(`FAIL: ${rel} not found: run \`sdd acceptance plan ${slug}\` first`); return 1; }
    }
    let plan;
    let contract;
    try {
      plan = readJson(join(project, planPath(slug)));
      contract = readJson(join(project, CONTRACT_PATH));
    } catch (error) {
      console.error(`FAIL: ${error.message}`);
      return 1;
    }
    const text = renderManual({ slug, plan, contract });
    const file = join(project, manualPath(slug));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
    const parity = checkParity({ manualText: readFileSync(file, "utf8"), plan, contract });
    console.log(`WROTE: ${manualPath(slug)}`);
    console.log(`PARITY: ${parity.status}`);
    for (const e of parity.errors) console.log(`  ${e}`);
    return parity.status === "PASS" ? 0 : 1;
  }
  if (!base) { console.error("FAIL: --base <ref> is required: acceptance is bound to the change against the branch it merges into"); return 1; }
  if (sub === "status") {
    const st = featureAcceptanceStatus(project, slug, { base });
    // a manual that drifted from the plan is a parity failure of the feature (002 RF-27)
    if (st.classification === "REQUIRED" && existsSync(join(project, manualPath(slug)))) {
      try {
        const parity = checkParity({ manualText: readFileSync(join(project, manualPath(slug)), "utf8"), plan: readJson(join(project, planPath(slug))), contract: readJson(join(project, CONTRACT_PATH)) });
        if (parity.status !== "PASS") { st.status = "BLOCKED"; st.reasons = [...(st.reasons ?? []), ...parity.errors.map((e) => `manual parity: ${e}`)]; st.blocking = true; }
      } catch { /* the plan/contract errors are already reported by the status */ }
    }
    if (st.classification === "REQUIRED") st.traceability = writeTraceability(project, slug, { status: st }).path;
    return printStatus(st, json);
  }
  if (sub === "run") {
    return runFeatureAcceptance(project, slug, { base }).then((st) => {
      if (st.classification === "REQUIRED") st.traceability = writeTraceability(project, slug, { status: st }).path;
      return printStatus(st, json);
    });
  }
  console.error("usage: sdd acceptance <plan|manual|run|status> <slug> [--base <ref>] [--json]");
  return 2;
}

/** `sdd validate --level full` errors for the feature's acceptance classification (003 RF-18). */
export function acceptanceClassificationErrors(project, slug) {
  const specFile = join(project, "specs", slug, "spec.md");
  if (!existsSync(specFile)) return [];
  let slugs = [];
  const cutoff = join(project, "acceptance", "legacy-cutoff.json");
  if (existsSync(cutoff)) {
    try { slugs = readJson(cutoff).slugs ?? []; } catch { return ["acceptance/legacy-cutoff.json is not valid JSON"]; }
  }
  const cls = classifyFeature({ slug, specText: readFileSync(specFile, "utf8"), legacySlugs: slugs });
  if (cls.kind === "MISSING") return cls.reasons.map((r) => `acceptance: ${r}`);
  return cls.kind === "LEGACY" ? [] : cls.reasons.map((r) => `acceptance: ${r}`);
}
