// Feature-level acceptance: the platform-owned stage (spec 002 RF-1..RF-6, RF-12,
// RF-13, RF-19..RF-21, RF-28..RF-35; spec 003 RF-18, RF-19). `runFeatureAcceptance`
// executes the contract's runners itself and writes the ledger; `featureAcceptanceStatus`
// derives the result from the runner-written ledger entries of the evaluated revision
// ONLY, never from a value supplied by an agent, a callback or a test double.
import { closeSync, existsSync, fstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { changeRevision } from "../circuit/review-ledger.mjs";
import { validateContract, TIER_RANK } from "./contract.mjs";
import { validatePlan, naItems } from "./plan.mjs";
import { classifyFeature } from "./spec-acceptance.mjs";
import { parseStructured, evaluateObserved } from "./results-parser.mjs";
import { runRunner, resolveExecutable } from "./runner.mjs";
import { appendEvidence, closureStatus, inputFingerprint, readLedger, sha256, canonical, uncoveredPaths, ledgerDir } from "./evidence.mjs";
import { consolidate, PENDING_REASONS, toResultStatus } from "./result.mjs";
import { buildGraph } from "./graph.mjs";
import { nonSutPlanErrors } from "./contract.mjs";
import { traceability } from "./manual.mjs";
import { acceptanceFindingsAgainstBase } from "../policy/hitl.mjs";

export const CONTRACT_PATH = "acceptance/validation-contract.json";
export const CUTOFF_PATH = "acceptance/legacy-cutoff.json";
export const DEFAULT_MANIFEST_PATH = "acceptance/dependency-manifest.json";
export const planPath = (slug) => `specs/${slug}/acceptance/plan.json`;
// findings that force the human gate but are not DOWNGRADEs (N/A has its own item; creation/modification are generic)
const NOT_DOWNGRADE = new Set(["CONTRACT_CREATED", "CONTRACT_MODIFIED", "NOT_APPLICABLE_DECLARED", "CUTOFF_CREATED"]);

const readText = (project, rel) => (existsSync(join(project, rel)) ? readFileSync(join(project, rel), "utf8") : null);
const readJson = (project, rel) => {
  const t = readText(project, rel);
  if (t === null) return { missing: true };
  try { return { value: JSON.parse(t) }; } catch { return { invalid: true }; }
};

/** SUT path digest: file bytes, or a directory's sorted file digests. null when unreadable. */
function digestPath(root, rel) {
  const abs = join(root, rel.replace(/\/$/, ""));
  try {
    // one descriptor: what is checked is what is hashed (no stat-then-read race)
    let fd;
    try { fd = openSync(abs, "r"); } catch { return null; }
    let st;
    try {
      st = fstatSync(fd);
      if (st.isFile()) return sha256(readFileSync(fd));
    } finally { closeSync(fd); }
    if (st.isDirectory()) {
      const parts = [];
      const walk = (dir, prefix) => {
        for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
          if (e.name === ".git" || e.name === "node_modules") continue;
          const p = prefix ? `${prefix}/${e.name}` : e.name;
          if (e.isDirectory()) walk(join(dir, e.name), p);
          else if (e.isFile()) parts.push(`${p}:${sha256(readFileSync(join(dir, e.name)))}`);
        }
      };
      walk(abs, "");
      return sha256(parts.join("\n"));
    }
  } catch { /* unreadable */ }
  return null;
}

/** Repository files named in a runner's argv (the acceptance test scripts): case inputs and covered paths. */
export function runnerInputPaths(project, runner) {
  if (!runner) return [];
  const cwd = runner.cwd === "." ? "" : `${runner.cwd.replace(/\/$/, "")}/`;
  return runner.argv
    .filter((a) => !a.startsWith("-") && /[./]/.test(a))
    .map((a) => `${cwd}${a}`.replace(/^\.\//, ""))
    .filter((p) => { try { return statSync(join(project, p)).isFile() || statSync(join(project, p)).isDirectory(); } catch { return false; } })
    .sort();
}

const environmentIdentity = () => ({ platform: process.platform, arch: process.arch, runtime: process.version });

/** RF-12: every dependency edge of the module is a mandatory consumer-owned obligation. */
export function crossObligations(graph, plan) {
  const moduleId = plan.moduleId ?? null;
  if (!moduleId || !graph) return { status: "NOT_APPLICABLE", reasons: ["no module / no manifest: cross acceptance is not applicable"], obligations: [] };
  const edges = graph.edgesOf(moduleId);
  if (!edges.length) return { status: "NOT_APPLICABLE", reasons: ["dependency-free module: cross acceptance is structurally not applicable"], obligations: [] };
  const obligations = edges.map((e) => {
    const cases = plan.cases.filter((c) => c.mandatory && c.cross && c.cross.consumer === moduleId && c.cross.provider === e.provider && c.cross.contract === e.contract);
    return { consumer: moduleId, provider: e.provider, contract: e.contract, cases: cases.map((c) => c.id), satisfied: cases.length > 0 };
  });
  const missing = obligations.filter((o) => !o.satisfied);
  return { status: missing.length ? "BLOCKED" : "OK", reasons: missing.map((o) => `dependency ${o.provider}/${o.contract} has no consumer-owned mandatory validation`), obligations };
}

function load(project, slug, { legacySlugs }) {
  const specText = readText(project, `specs/${slug}/spec.md`);
  const cutoff = readJson(project, CUTOFF_PATH);
  const cutoffSlugs = legacySlugs ?? (cutoff.value?.slugs ?? []);
  const cls = classifyFeature({ slug, specText, legacySlugs: cutoffSlugs });
  return { specText, cls };
}

/** Everything needed to judge a REQUIRED feature, or a BLOCKED reason. */
function prepare(project, slug, cls, { base }) {
  const contractR = readJson(project, CONTRACT_PATH);
  if (contractR.missing) return { blocked: [`no validation contract at ${CONTRACT_PATH}: create one (acceptance proposal) and have a human review it`] };
  if (contractR.invalid) return { blocked: [`${CONTRACT_PATH} is not valid JSON`] };
  const vc = validateContract(contractR.value);
  if (!vc.ok) return { blocked: vc.errors.map((e) => `validation contract: ${e}`) };
  const planR = readJson(project, planPath(slug));
  if (planR.missing) return { blocked: [`no acceptance plan at ${planPath(slug)}: the Builder must generate it (sdd acceptance plan ${slug})`] };
  if (planR.invalid) return { blocked: [`${planPath(slug)} is not valid JSON`] };
  const plan = planR.value;
  const pv = validatePlan(plan, {
    spec: cls.parsed,
    runners: vc.runners,
    readFile: (rel) => (existsSync(join(project, rel)) ? readFileSync(join(project, rel)) : null),
  });
  const blocked = pv.ok ? [] : pv.errors.map((e) => `plan: ${e}`);
  blocked.push(...nonSutPlanErrors({ contract: contractR.value, plan, contractPath: CONTRACT_PATH, planPaths: [planPath(slug)] }).map((e) => `contract: ${e}`));
  let graph = null;
  const mp = plan.manifest ?? DEFAULT_MANIFEST_PATH;
  if (plan.moduleId) {
    const man = readJson(project, mp);
    if (man.missing || man.invalid) blocked.push(`dependency manifest ${mp} is missing or invalid`);
    else {
      const g = buildGraph(man.value);
      if (!g.ok) blocked.push(...g.errors.map((e) => `manifest: ${e}`));
      else if (!g.graph.modules.includes(plan.moduleId)) blocked.push(`module ${plan.moduleId} is not in the manifest`);
      else graph = g.graph;
    }
  }
  return { contract: contractR.value, runners: vc.runners, plan, graph, blocked };
}

function caseFingerprint(project, p, k) {
  const runner = p.runners.get(k.runner);
  const exe = runner ? resolveExecutable(runner.executable, project) : null;
  const inputDigests = {};
  for (const s of k.sutPaths) inputDigests[s] = digestPath(project, s);
  for (const a of runnerInputPaths(project, runner)) inputDigests[`runner:${a}`] = digestPath(project, a);
  const ds = k.dataset ? p.plan.datasets.find((d) => d.id === k.dataset) : null;
  if (ds) inputDigests[`dataset:${ds.id}`] = ds.sha256;
  const edge = k.cross ? [k.cross.provider] : [];
  return inputFingerprint({
    scenarioId: k.id,
    moduleId: p.plan.moduleId ?? null,
    providerIds: edge,
    consumerIds: k.cross ? [k.cross.consumer] : [],
    runnerDigest: sha256(canonical(runner ?? {})),
    caseDigest: sha256(canonical(k)),
    executableDigest: exe ? sha256(readFileSync(exe)) : "0".repeat(64),
    argv: runner?.argv ?? [],
    inputDigests,
    executionKind: k.executionKind ?? "agent",
    environment: environmentIdentity(),
    envDeclared: runner?.env ?? [],
    manifestDigest: p.graph ? sha256(p.graph.serialize()) : null,
  });
}

/**
 * Status of the feature at its evaluated revision, from the ledger only.
 * @param {(item)=>boolean} approvals  human-only Environment approval lookup (pending mechanism: default none)
 */
export function featureAcceptanceStatus(project, slug, { base, approvals = () => false, legacySlugs } = {}) {
  const { cls } = load(project, slug, { legacySlugs });
  const out = (status, reasons, extra = {}) => ({ slug, classification: cls.kind, status, reasons, resultStatus: toResultStatus(status), blocking: status !== "PASS" && status !== "NOT_APPLICABLE", ...extra });
  if (cls.kind === "LEGACY") {
    // 003 RF-18 / 002 RF-35: a slug added to the cutoff after the upgrade is a DOWNGRADE, pending until approved
    let findings = [];
    try {
      findings = acceptanceFindingsAgainstBase(project, base, changeRevision(project, base).paths).filter((f) => f.kind === "LEGACY_CUTOFF_ADDITION" && f.detail === slug);
    } catch {
      return out("BLOCKED", ["the BASE comparison for the legacy cutoff could not run"]);
    }
    const items = findings.map((f) => ({ kind: "DOWNGRADE", id: `${f.kind}:${f.detail}`, justificationDigest: sha256(canonical(f)) }));
    if (items.some((it) => !approvals(it))) return out("BLOCKED", [PENDING_REASONS.DOWNGRADE], { pending: [PENDING_REASONS.DOWNGRADE], items, humanGate: "required" });
    return out("NOT_APPLICABLE", ["legacy feature: v4.0.2 behavior retained until a human removes it from the cutoff"], { legacy: true });
  }
  if (cls.kind === "MISSING") return out("BLOCKED", cls.reasons);
  if (cls.kind === "NOT_APPLICABLE") {
    const item = { kind: "NOT_APPLICABLE", id: "feature", justificationDigest: sha256(cls.parsed.notApplicable.justification) };
    if (cls.blocking) return out("BLOCKED", cls.reasons);
    if (approvals(item)) return out("NOT_APPLICABLE", ["feature declared not applicable; approved by the human Environment gate"]);
    return out("BLOCKED", [PENDING_REASONS.NA], { pending: [PENDING_REASONS.NA], items: [item], humanGate: "required" });
  }
  const change = changeRevision(project, base);
  const p = prepare(project, slug, cls, { base });
  if (p.blocked?.length && !p.plan) return out("BLOCKED", p.blocked, { revision: change.revision });
  if (p.blocked.length) return out("BLOCKED", p.blocked, { revision: change.revision });

  const results = [];
  const items = naItems(p.plan);
  const pending = [];
  for (const it of items) if (!approvals(it)) pending.push(PENDING_REASONS.NA);
  // 002 RF-35: every DOWNGRADE against BASE is pending until the human Environment approval for this head
  let downgrades = [];
  try {
    downgrades = acceptanceFindingsAgainstBase(project, base, change.paths).filter((f) => (!f.slug || f.slug === slug) && !NOT_DOWNGRADE.has(f.kind));
  } catch {
    return out("BLOCKED", ["the BASE comparison for acceptance DOWNGRADEs could not run"], { revision: change.revision });
  }
  for (const f of downgrades) {
    const it = { kind: "DOWNGRADE", id: `${f.kind}:${f.detail}`, justificationDigest: sha256(canonical(f)) };
    items.push(it);
    if (!approvals(it)) pending.push(PENDING_REASONS.DOWNGRADE);
  }
  const cross = crossObligations(p.graph, p.plan);
  if (cross.status === "BLOCKED") return out("BLOCKED", cross.reasons, { revision: change.revision, cross });
  const led = readLedger(project, slug);
  if (!led.ok) return out("BLOCKED", led.errors, { revision: change.revision });
  // 002 RF-32: an AC without a rejection-expecting case relies on a seeded-failure run, which must be a runner-written
  // FAIL of one of its cases in the ledger (any revision): a `seededFailure` field alone is only the Builder's claim
  for (const c of p.plan.criteria) {
    const cases = p.plan.cases.filter((k) => k.ac.includes(c.id));
    if (cases.some((k) => k.expected === "reject")) continue;
    const ids = new Set(cases.map((k) => k.id));
    if (!led.entries.some((e) => ids.has(e.scenarioId) && e.result === "FAIL")) results.push({ id: `seeded-failure:${c.id}`, status: "BLOCKED", reason: `${c.id} has no rejection-expecting case and no recorded seeded-failure run in the ledger` });
  }
  for (const k of p.plan.cases.filter((c) => c.mandatory)) {
    const fp = caseFingerprint(project, p, k);
    if (!fp.ok) { results.push({ id: k.id, status: "BLOCKED", reason: fp.reasons[0] }); continue; }
    const c = closureStatus(project, slug, { scenarioId: k.id, evaluatedRevision: change.revision, currentFingerprint: fp.fingerprint });
    results.push({ id: k.id, status: c.status, reason: c.reasons[0], entry: c.entry });
  }
  const runnerPaths = [...new Set(p.plan.cases.flatMap((k) => runnerInputPaths(project, p.runners.get(k.runner))))];
  const unc = uncoveredPaths({ changedPaths: change.paths.filter((x) => !isGovernanceArtifact(x, slug)), cases: [...p.plan.cases, { sutPaths: runnerPaths }], contract: p.contract });
  for (const u of unc) results.push({ id: `path:${u}`, status: "BLOCKED", reason: "changed path is covered by no case input and is not in the non-SUT class" });
  const c = consolidate(results, { pending });
  return {
    slug, classification: "REQUIRED", status: c.status, reasons: c.reasons, pending: c.pending, resultStatus: c.resultStatus, blocking: c.blocking,
    revision: change.revision, cases: results.map(({ id, status, reason }) => ({ id, status, reason })), cross, items: pending.length ? items : [],
  };
}

// acceptance governance artifacts judged by their own validators, never by SUT coverage
const isGovernanceArtifact = (p, slug) =>
  p === CONTRACT_PATH || p === CUTOFF_PATH || p === DEFAULT_MANIFEST_PATH || p.startsWith(`specs/${slug}/acceptance/`) || p === `specs/${slug}/reviews.jsonl`;

/** Platform-owned execution: runs every contract runner used by the plan, writes ledger entries. Then reads status back. */
// `rawDir`: where the CI closure job keeps each runner's raw structured output (002 RF-31); the trusted analyzer
// derives the result from those bytes, never from this process's own conclusion.
export async function runFeatureAcceptance(project, slug, { base, approvals = () => false, legacySlugs, run = runRunner, rawDir = null } = {}) {
  const { cls } = load(project, slug, { legacySlugs });
  if (cls.kind !== "REQUIRED") return featureAcceptanceStatus(project, slug, { base, approvals, legacySlugs });
  const p = prepare(project, slug, cls, { base });
  if (p.blocked.length) return featureAcceptanceStatus(project, slug, { base, approvals, legacySlugs });
  const before = changeRevision(project, base);
  const cross = crossObligations(p.graph, p.plan);
  if (cross.status === "BLOCKED") return featureAcceptanceStatus(project, slug, { base, approvals, legacySlugs });
  const mandatory = p.plan.cases.filter((c) => c.mandatory);
  for (const runnerId of [...new Set(mandatory.map((c) => c.runner))].sort()) {
    const cases = mandatory.filter((c) => c.runner === runnerId);
    const runner = p.runners.get(runnerId);
    const minTier = cases.map((c) => c.minTier).sort((a, b) => TIER_RANK[b] - TIER_RANK[a])[0];
    // runner-owned output, outside the repository and the git common dir (002 RF-9)
    const outDir = mkdtempSync(join(tmpdir(), `ai-acc-${runnerId}-`));
    const r = await run({ root: project, runner, outDir, minTier });
    if (rawDir) {
      mkdirSync(rawDir, { recursive: true });
      writeFileSync(join(rawDir, `${runnerId}.out`), r.stdout ?? "");
      writeFileSync(join(rawDir, `${runnerId}.json`), `${JSON.stringify({ runnerId, status: r.status, exitCode: r.exitCode ?? null, tier: r.tier ?? runner.isolation, isolated: Boolean(r.isolated), reasons: r.reasons ?? [], outputDigest: r.stdout ? `sha256:${sha256(r.stdout)}` : null })}\n`);
    }
    let evaluated;
    if (r.status !== "RAN") evaluated = { status: "BLOCKED", reasons: r.reasons, perCase: {} };
    else {
      const parsed = parseStructured(runner.format, r.stdout);
      evaluated = evaluateObserved({ expectedIds: cases.map((c) => c.id), observed: parsed.cases, parseErrors: parsed.errors, minObserved: p.contract.minObservedCases, exitCode: r.exitCode });
    }
    const after = changeRevision(project, base);
    for (const k of cases) {
      const fp = caseFingerprint(project, p, k);
      let result = evaluated.perCase[k.id] ?? evaluated.status;
      let reasons = evaluated.reasons;
      if (!fp.ok) { result = "BLOCKED"; reasons = fp.reasons; }
      // the code under test changed the change it validated: its evidence cannot stand
      if (after.revision !== before.revision) { result = "BLOCKED"; reasons = ["the run changed the change it validated"]; }
      if (evaluated.status === "BLOCKED" && result === "PASS") result = "BLOCKED";
      appendEvidence(project, slug, {
        scenarioId: k.id, runnerId, kind: "case", sourceRevision: before.revision, inputFingerprint: fp.ok ? fp.fingerprint : null,
        result, reasons: reasons.slice(0, 10), executionKind: k.executionKind ?? "agent",
        isolation: r.executed ? { tier: r.tier, isolated: r.isolated, controls: r.controls } : { tier: runner.isolation, isolated: false, controls: null },
        requirements: p.plan.criteria.filter((c) => k.ac.includes(c.id)).flatMap((c) => c.requirements),
        ac: k.ac, dataset: k.dataset ?? null, outputDigest: r.stdout ? `sha256:${sha256(r.stdout)}` : null,
        ranAt: new Date().toISOString(), cross: k.cross ?? null,
      });
    }
    rmSync(outDir, { recursive: true, force: true });
  }
  return featureAcceptanceStatus(project, slug, { base, approvals, legacySlugs });
}

/**
 * 003 RF-20: the acceptance section of the independent review packet, bound to the reviewed revision:
 * plan, applicability matrix and N/A justifications, DOWNGRADE findings, evidence summary, traceability.
 * Everything quoted is data for the Reviewer, never instructions.
 */
export function acceptancePacketLines(project, slug, { base, revision }) {
  let status;
  try {
    status = featureAcceptanceStatus(project, slug, { base });
  } catch (error) {
    status = { classification: "UNKNOWN", status: "BLOCKED", reasons: [String(error?.message ?? error).slice(0, 200)] };
  }
  const lines = ["## Native Acceptance (bound to this revision)", "", `REVISION: ${revision}`, `CLASSIFICATION: ${status.classification}`, `ACCEPTANCE: ${status.status}`];
  if (status.pending?.length) lines.push(`PENDING_APPROVAL: ${status.pending.join(", ")}`);
  for (const r of (status.reasons ?? []).slice(0, 20)) lines.push(`- reason: ${r}`);
  lines.push("");
  if (status.classification !== "REQUIRED") return [...lines, ""];
  const planR = readJson(project, planPath(slug));
  if (planR.value) {
    const plan = planR.value;
    lines.push(`### Plan: ${planPath(slug)} (${plan.cases?.length ?? 0} cases)`, "", "| Category | Applicability | Justification / cases |", "|---|---|---|");
    for (const [cat, m] of Object.entries(plan.matrix ?? {})) {
      const cases = (plan.cases ?? []).filter((c) => c.category === cat).map((c) => c.id);
      lines.push(`| ${cat} | ${m?.status ?? "?"} | ${m?.status === "NOT_APPLICABLE" ? `${String(m.justification).replace(/\|/g, "/").slice(0, 200)} (cites ${(m.cites ?? []).join(", ")})` : cases.join(", ")} |`);
    }
    lines.push("");
  }
  // DOWNGRADE findings: the same BASE-vs-candidate data diff the human gate uses (early feedback, not the trusted verdict)
  let findings = [];
  try {
    const paths = changeRevision(project, base).paths;
    findings = acceptanceFindingsAgainstBase(project, base, paths).filter((f) => !f.slug || f.slug === slug);
  } catch { findings = [{ kind: "UNEVALUATED", detail: "the BASE comparison could not run" }]; }
  lines.push(`### DOWNGRADE / governance findings (${findings.length})`, "", ...(findings.length ? findings.map((f) => `- ${f.kind}: ${f.detail}`) : ["- none"]), "");
  lines.push("### Evidence summary (runner-written ledger)", "", ...((status.cases ?? []).map((c) => `- ${c.id}: ${c.status}${c.reason ? ` (${String(c.reason).slice(0, 160)})` : ""}`)), "");
  const trace = writeTraceability(project, slug, { status });
  lines.push(`### Traceability: ${trace.path} (complete: ${trace.report.complete})`, "", "The report is a derived rendering of the plan and the ledger: it is never read as evidence or approval.", "");
  return lines;
}

/** RF-28: writes the traceability report into the platform's git-dir state (a rendering, never evidence). */
export function writeTraceability(project, slug, { status, approvals = [] } = {}) {
  const planR = readJson(project, planPath(slug));
  const led = readLedger(project, slug);
  const report = traceability({ slug, plan: planR.value ?? { criteria: [], cases: [] }, entries: led.entries, status, revision: status.revision, approvals });
  const dir = ledgerDir(project, slug);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, "traceability.json");
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
  return { path, report };
}
