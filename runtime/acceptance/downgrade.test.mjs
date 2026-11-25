import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { detectDowngrades, governanceVerdict } from "./downgrade.mjs";
import { CONTRACT, buildPlan, SPEC } from "./acceptance.fixture.mjs";

const clone = (x) => JSON.parse(JSON.stringify(x));
const base = () => ({ contract: clone(CONTRACT), plan: buildPlan(), specText: SPEC, cutoff: { slugs: ["000-old"] } });
const kinds = (b, c) => detectDowngrades(b, c).findings.map((f) => f.kind);

test("no change, no finding", () => {
  const r = detectDowngrades(base(), base());
  assert.deepEqual(r.findings, []);
  assert.equal(r.forcesHumanGate, false);
});

test("every DOWNGRADE kind is detected against BASE and forces the human gate", () => {
  const cases = [
    ["CASE_REMOVED_OR_RENAMED", (c) => { c.plan.cases[0].id = "renamed"; }],
    ["MANDATORY_LOWERED", (c) => { c.plan.cases[0].mandatory = false; }],
    ["AC_MAPPING_REMOVED", (c) => { c.plan.cases[0].ac = ["AC-2"]; }],
    ["AC_REMOVED", (c) => { c.specText = c.specText.replace(/- AC-2.*\n/, ""); }],
    ["RUNNER_EXECUTABLE_CHANGED", (c) => { c.contract.runners[0].executable = "tools/run.exe"; }],
    ["RUNNER_ARGV_CHANGED", (c) => { c.contract.runners[0].argv = ["other.mjs"]; }],
    ["RUNNER_FORMAT_CHANGED", (c) => { c.contract.runners[0].format = "junit"; }],
    ["RUNNER_CWD_CHANGED", (c) => { c.contract.runners[0].cwd = "sub"; }],
    ["COVERAGE_MINIMUM_LOWERED", (c) => { c.contract.minObservedCases = 0; }],
    ["ISOLATION_WEAKENED", (c, b) => { b.contract.runners[0].isolation = "node-permission"; }],
    ["NETWORK_WIDENED", (c, b) => { b.contract.runners[0].isolation = "container"; c.contract.runners[0].isolation = "container"; c.contract.runners[0].network = "loopback"; }],
    ["ENV_ALLOWLIST_WIDENED", (c) => { c.contract.runners[0].env.push("HOME"); }],
    ["TIMEOUT_LONGER", (c) => { c.contract.runners[0].timeoutMs = 999999; }],
    ["EXPECTED_RESULT_CHANGED", (c) => { c.plan.cases[1].expected = "pass"; }],
    ["DATASET_CHANGED", (c) => { c.plan.cases[0].dataset = "other"; }],
    ["MIN_TIER_LOWERED", (c, b) => { b.plan.cases[0].minTier = "container"; }],
    ["LEGACY_CUTOFF_ADDITION", (c) => { c.cutoff.slugs.push("001-slugify"); }],
    ["NON_SUT_CLASS_WIDENED", (c) => { c.contract.nonSutPaths.push("knowledge/**"); }],
    ["NOT_APPLICABLE_DECLARED", (c) => { c.plan.matrix.boundary = { status: "NOT_APPLICABLE", justification: "x".repeat(20), cites: ["RF-1"] }; }],
    ["RUNNER_REMOVED", (c) => { c.contract.runners[0].id = "renamed"; }],
  ];
  for (const [kind, mutate] of cases) {
    const b = base();
    const c = base();
    mutate(c, b);
    const r = detectDowngrades(b, c);
    assert.ok(r.findings.some((f) => f.kind === kind), `${kind} not detected: ${JSON.stringify(r.findings)}`);
    assert.equal(r.forcesHumanGate, true, kind);
  }
});

test("contract creation and N/A on a new REQUIRED feature are findings", () => {
  const c = base();
  c.plan = buildPlan({ naCategories: ["persistence"] });
  c.cutoff = null; // cutoff creation is its own finding (see the F4 test)
  assert.deepEqual(kinds({ contract: null, plan: null, specText: null, cutoff: null }, c), ["CONTRACT_CREATED", "NOT_APPLICABLE_DECLARED"]);
  const naSpec = { ...base(), specText: "# x\nacceptance: not-applicable\nacceptance-justification: RF-1\n" };
  assert.ok(kinds(base(), naSpec).includes("NOT_APPLICABLE_DECLARED"));
});

test("the governance verdict is BLOCKED until the trusted path exists; other-SHA or missing verdict BLOCKED", () => {
  const { findings } = detectDowngrades(base(), base());
  assert.equal(governanceVerdict({ findings }).status, "BLOCKED");
  assert.equal(governanceVerdict({ findings, trusted: { authenticated: true, headSha: "a", expectedHeadSha: "b", verdictJson: { status: "PASS" } } }).status, "BLOCKED");
  assert.equal(governanceVerdict({ findings, trusted: { authenticated: false, headSha: "a", expectedHeadSha: "a", verdictJson: { status: "PASS" } } }).status, "BLOCKED");
  assert.equal(governanceVerdict({ findings, trusted: { authenticated: true, headSha: "a", expectedHeadSha: "a", verdictJson: { status: "PASS" } } }).status, "PASS");
});

test("the detector reads candidate data only: it imports no candidate module and spawns nothing", () => {
  const src = readFileSync(fileURLToPath(new URL("./downgrade.mjs", import.meta.url)), "utf8");
  assert.doesNotMatch(src, /child_process|import\(|eval\(|new Function/);
});

test("independent review F4: deleting the plan or the spec, and a cutoff created with new slugs, are findings", () => {
  const noPlan = { ...base(), plan: null };
  assert.ok(kinds(base(), noPlan).includes("PLAN_REMOVED"));
  assert.ok(kinds(base(), noPlan).includes("CASE_REMOVED_OR_RENAMED"));
  const noSpec = { ...base(), specText: null };
  assert.ok(kinds(base(), noSpec).filter((k) => k === "AC_REMOVED").length === 2);
  const b = { ...base(), cutoff: null, specSlugs: ["000-old"] };
  const created = kinds(b, { ...base(), cutoff: { slugs: ["000-old", "010-new"] } });
  assert.ok(created.includes("CUTOFF_CREATED"));
  assert.deepEqual(detectDowngrades(b, { ...base(), cutoff: { slugs: ["000-old", "010-new"] } }).findings.filter((f) => f.kind === "LEGACY_CUTOFF_ADDITION").map((f) => f.detail), ["010-new"]);
  assert.ok(kinds(base(), { ...base(), plan: { __invalid: true } }).includes("PLAN_INVALID"));
});

test("independent re-review N1/N4: manifest weakening and a new cutoff over an established feature are DOWNGRADEs", () => {
  const M = { schemaVersion: 1, modules: [{ id: "p", contracts: [{ id: "p.api", path: "p/api.json" }] }, { id: "c", contracts: [] }], dependencies: [{ consumer: "c", provider: "p", contract: "p.api" }] };
  const kinds = (b, c) => detectDowngrades({ manifest: b }, { manifest: c }).findings.map((f) => f.kind);
  assert.deepEqual(kinds(M, M), []);
  assert.deepEqual(kinds(null, M), []);
  assert.deepEqual(kinds(M, null), ["MANIFEST_REMOVED"]);
  assert.deepEqual(kinds(M, { __invalid: true }), ["GOVERNANCE_DATA_INVALID", "MANIFEST_INVALID"]);
  assert.deepEqual(kinds(M, { ...M, dependencies: [] }), ["DEPENDENCY_REMOVED"]);
  assert.ok(kinds(M, { ...M, modules: [{ id: "p", contracts: [] }, { id: "c", contracts: [] }] }).includes("PUBLIC_CONTRACT_REMOVED"));
  assert.ok(kinds(M, { ...M, modules: [{ id: "p", contracts: [{ id: "p.api", path: "p/other.json" }] }, { id: "c", contracts: [] }] }).includes("PUBLIC_CONTRACT_PATH_CHANGED"));
  assert.ok(kinds(M, { ...M, modules: [M.modules[0]] }).includes("MODULE_REMOVED"));
  const cut = detectDowngrades({ cutoff: null, specSlugs: ["001-old", "002-req"], establishedSlugs: ["002-req"] }, { cutoff: { slugs: ["001-old", "002-req"] } }).findings;
  assert.ok(cut.some((f) => f.kind === "LEGACY_CUTOFF_ADDITION" && f.detail === "002-req"));
  assert.ok(!cut.some((f) => f.kind === "LEGACY_CUTOFF_ADDITION" && f.detail === "001-old"));
});
