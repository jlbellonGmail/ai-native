// DOWNGRADE detector (spec 002 RF-25, RF-34, RF-35; 003 RF-18). Pure data diff of
// BASE vs candidate validation contract, plan, spec acceptance section and legacy
// cutoff. Candidate input is DATA only: this module never imports or executes it.
//
// Trust boundary (stated, not simulated): the verdict this detector produces is
// trustworthy only when it runs from the trusted platform revision (`main`) in the
// `workflow_run` verdict path. Until that path, its required check and human/agent
// identity separation exist, `governanceVerdict` reports RF-25 BLOCKED.
import { parseSpecAcceptance } from "./spec-acceptance.mjs";
import { TIER_RANK, globToRegExp } from "./contract.mjs";
import { CATEGORIES } from "./plan.mjs";
import { canonical, sha256 } from "./evidence.mjs";

const byId = (xs = []) => new Map(xs.map((x) => [x.id, x]));
const eq = (a, b) => canonical(a ?? null) === canonical(b ?? null);

/** Does glob `wide` cover strictly more than `narrow`? Conservative: any new or changed entry is a widening. */
function widenedNonSut(baseList = [], candList = []) {
  const out = [];
  for (const g of candList) {
    if (baseList.includes(g)) continue;
    const coveredByBase = baseList.some((b) => !/[*?]/.test(g) && globToRegExp(b).test(g));
    if (!coveredByBase) out.push(g);
  }
  return out;
}

const validManifest = (m) => m && !m.__invalid && Array.isArray(m.modules) && Array.isArray(m.dependencies);

/** BASE vs candidate dependency manifest: every removed module, public contract (or moved path) and edge. */
export function manifestDowngrades(base, cand) {
  const out = [];
  if (!validManifest(base)) return out;
  if (cand === null || cand === undefined) return [{ kind: "MANIFEST_REMOVED", detail: "dependency manifest removed" }];
  if (!validManifest(cand)) return [{ kind: "MANIFEST_INVALID", detail: "candidate dependency manifest is not a valid manifest" }];
  const cm = new Map(cand.modules.map((m) => [m.id, m]));
  for (const m of base.modules) {
    const c = cm.get(m.id);
    if (!c) { out.push({ kind: "MODULE_REMOVED", detail: m.id }); continue; }
    const cc = new Map((c.contracts ?? []).map((k) => [k.id, k.path]));
    for (const k of m.contracts ?? []) {
      if (!cc.has(k.id)) out.push({ kind: "PUBLIC_CONTRACT_REMOVED", detail: `${m.id}/${k.id}` });
      else if (cc.get(k.id) !== k.path) out.push({ kind: "PUBLIC_CONTRACT_PATH_CHANGED", detail: `${m.id}/${k.id}` });
    }
  }
  const edge = (d) => `${d.consumer}->${d.provider}:${d.contract}`;
  const ce = new Set(cand.dependencies.map(edge));
  for (const d of base.dependencies) if (!ce.has(edge(d))) out.push({ kind: "DEPENDENCY_REMOVED", detail: edge(d) });
  return out;
}

/**
 * @param base  { contract, plan, specText, cutoff, manifest, specSlugs, establishedSlugs } (any may be null: absent at BASE)
 * @param cand  { contract, plan, specText, cutoff }
 * @returns {{ findings: {kind, detail}[], forcesHumanGate: boolean }}
 */
export function detectDowngrades(base, cand) {
  const f = [];
  const add = (kind, detail) => f.push({ kind, detail });

  // validation contract creation / modification
  if (!base.contract && cand.contract) add("CONTRACT_CREATED", "validation contract created");
  else if (base.contract && !cand.contract) add("CONTRACT_REMOVED", "validation contract removed");
  else if (base.contract && cand.contract && !eq(base.contract, cand.contract)) add("CONTRACT_MODIFIED", "validation contract modified");
  if (base.contract && cand.contract) {
    const br = byId(base.contract.runners);
    const cr = byId(cand.contract.runners);
    for (const [id, b] of br) {
      const c = cr.get(id);
      if (!c) { add("RUNNER_REMOVED", id); continue; }
      if (b.executable !== c.executable) add("RUNNER_EXECUTABLE_CHANGED", id);
      if (!eq(b.argv, c.argv)) add("RUNNER_ARGV_CHANGED", id);
      if (b.format !== c.format) add("RUNNER_FORMAT_CHANGED", id);
      if (b.cwd !== c.cwd) add("RUNNER_CWD_CHANGED", id);
      if (TIER_RANK[c.isolation] < TIER_RANK[b.isolation]) add("ISOLATION_WEAKENED", id);
      if (c.timeoutMs > b.timeoutMs) add("TIMEOUT_LONGER", id);
      if ((c.env ?? []).some((n) => !(b.env ?? []).includes(n))) add("ENV_ALLOWLIST_WIDENED", id);
      if ((b.network ?? "none") === "none" && (c.network ?? "none") !== "none") add("NETWORK_WIDENED", id);
      // RF-17/RF-18: dropping a fingerprinted configuration input lets evidence survive a config change
      for (const cf of b.configFiles ?? []) if (!(c.configFiles ?? []).includes(cf)) add("CONFIG_INPUT_REMOVED", `${id}:${cf}`);
      for (const n of b.envValues ?? []) if (!(c.envValues ?? []).includes(n)) add("CONFIG_INPUT_REMOVED", `${id}:env:${n}`);
    }
    if (cand.contract.minObservedCases < base.contract.minObservedCases) add("COVERAGE_MINIMUM_LOWERED", `${base.contract.minObservedCases} -> ${cand.contract.minObservedCases}`);
    for (const g of widenedNonSut(base.contract.nonSutPaths, cand.contract.nonSutPaths)) add("NON_SUT_CLASS_WIDENED", g);
  }
  // a newly created contract (its non-SUT class included) is the CONTRACT_CREATED finding: human gate, not a DOWNGRADE of a BASE

  // plan
  if (base.plan && cand.plan) {
    const bc = byId(base.plan.cases);
    const cc = byId(cand.plan.cases);
    for (const [id, b] of bc) {
      const c = cc.get(id);
      if (!c) { add("CASE_REMOVED_OR_RENAMED", id); continue; }
      if (b.mandatory && !c.mandatory) add("MANDATORY_LOWERED", id);
      if (b.expected !== c.expected) add("EXPECTED_RESULT_CHANGED", id);
      if ((b.dataset ?? null) !== (c.dataset ?? null)) add("DATASET_CHANGED", id);
      if (TIER_RANK[c.minTier] < TIER_RANK[b.minTier]) add("MIN_TIER_LOWERED", id);
      if (!eq([...b.ac].sort(), [...c.ac].sort()) && b.ac.some((a) => !c.ac.includes(a))) add("AC_MAPPING_REMOVED", id);
    }
    const bd = byId(base.plan.datasets);
    for (const [id, d] of byId(cand.plan.datasets)) if (bd.has(id) && bd.get(id).sha256 !== d.sha256) add("DATASET_CHANGED", `dataset ${id}`);
    for (const cat of CATEGORIES) {
      const b = base.plan.matrix?.[cat];
      const c = cand.plan.matrix?.[cat];
      if (c?.status === "NOT_APPLICABLE" && (b?.status !== "NOT_APPLICABLE" || !eq(b, c))) add("NOT_APPLICABLE_DECLARED", cat);
    }
  } else if (cand.plan) {
    for (const cat of CATEGORIES) if (cand.plan.matrix?.[cat]?.status === "NOT_APPLICABLE") add("NOT_APPLICABLE_DECLARED", cat);
  } else if (base.plan && !cand.plan) {
    // deleting the plan removes every case at once (independent review F4)
    add("PLAN_REMOVED", "acceptance plan removed");
    for (const k of base.plan.cases ?? []) add("CASE_REMOVED_OR_RENAMED", k.id);
  }
  if (cand.plan?.__invalid) add("PLAN_INVALID", "candidate acceptance plan is not valid JSON");

  // spec acceptance section
  const bs = base.specText ? parseSpecAcceptance(base.specText) : null;
  const cs = cand.specText ? parseSpecAcceptance(cand.specText) : null;
  if (bs) {
    // a removed spec, or a removed acceptance section, removes its criteria
    const cIds = new Set((cs?.criteria ?? []).map((c) => c.id));
    for (const c of bs.criteria) if (!cIds.has(c.id)) add("AC_REMOVED", c.id);
    if (cs?.notApplicable && !bs.notApplicable) add("NOT_APPLICABLE_DECLARED", "feature");
  } else if (cs?.notApplicable) add("NOT_APPLICABLE_DECLARED", "feature");

  // legacy cutoff additions after the upgrade
  const bSlugs = new Set(base.cutoff?.slugs ?? []);
  if (base.cutoff) {
    for (const s of cand.cutoff?.slugs ?? []) if (!bSlugs.has(s)) add("LEGACY_CUTOFF_ADDITION", s);
  } else if (cand.cutoff) {
    // a cutoff created by this change may only list features that already existed at BASE (the upgrade writer's rule)
    // and never one whose acceptance was already established at BASE (independent re-review N4)
    add("CUTOFF_CREATED", "legacy acceptance cutoff created");
    const existed = new Set(base.specSlugs ?? []);
    const established = new Set(base.establishedSlugs ?? []);
    for (const s of cand.cutoff.slugs ?? []) if (!existed.has(s) || established.has(s)) add("LEGACY_CUTOFF_ADDITION", s);
  }
  if (cand.cutoff?.__invalid || cand.contract?.__invalid || cand.manifest?.__invalid) add("GOVERNANCE_DATA_INVALID", "candidate acceptance governance data is not valid JSON");

  // dependency manifest (003 RF-2): removing modules, public contracts or edges removes cross-feature obligations
  // (independent re-review N1); only a BASE manifest can be weakened, a new one only adds obligations
  for (const m of manifestDowngrades(base.manifest, cand.manifest)) add(m.kind, m.detail);

  const findings = f.sort((a, b) => (a.kind + a.detail < b.kind + b.detail ? -1 : 1));
  return { findings, forcesHumanGate: findings.length > 0, digest: sha256(canonical(findings)) };
}

/**
 * The governance verdict as it can honestly be stated in this repository today.
 * The trusted path is a pending mechanism (002 plan, "Trusted verdict path"), so
 * any approval-dependent outcome is BLOCKED, never PASS from candidate-run code.
 *
 * @param trusted  { verdictJson, headSha, expectedHeadSha, authenticated } from the trusted check, or null
 */
export function governanceVerdict({ findings, trusted = null }) {
  if (!trusted) return { status: "BLOCKED", reasons: ["RF-25: the trusted verdict path (workflow_run analyze/publish on main, required check, human/agent identity separation) does not exist yet: governance cannot be satisfied by candidate-run code"], findings };
  if (!trusted.authenticated) return { status: "BLOCKED", reasons: ["verdict is not authenticated"], findings };
  if (!trusted.headSha || trusted.headSha !== trusted.expectedHeadSha) return { status: "BLOCKED", reasons: ["verdict is bound to another SHA"], findings };
  if (trusted.verdictJson?.status !== "PASS") return { status: "BLOCKED", reasons: trusted.verdictJson?.reasons ?? ["trusted verdict is not PASS"], findings };
  return { status: "PASS", reasons: [], findings };
}
