// Acceptance cases of spec 002 (Native Acceptance). Plan: specs/002-native-acceptance/acceptance/plan.json.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateContract, nonSutPathErrors, inNonSutClass } from "../../runtime/acceptance/contract.mjs";
import { validatePlan, sha256File, CATEGORIES } from "../../runtime/acceptance/plan.mjs";
import { parseStructured, evaluateObserved } from "../../runtime/acceptance/results-parser.mjs";
import { consolidate, toResultStatus, isBlocking } from "../../runtime/acceptance/result.mjs";
import { runRunner, tierSatisfies, describeIsolation } from "../../runtime/acceptance/runner.mjs";
import { appendEvidence, readLedger, ledgerDir, uncoveredPaths } from "../../runtime/acceptance/evidence.mjs";
import { detectDowngrades } from "../../runtime/acceptance/downgrade.mjs";
import { renderManual, checkParity } from "../../runtime/acceptance/manual.mjs";
import { parseSpecAcceptance } from "../../runtime/acceptance/spec-acceptance.mjs";
import { runFeatureAcceptance, featureAcceptanceStatus } from "../../runtime/acceptance/feature.mjs";
import { analyze, CLOSURE_WORKFLOW } from "../../runtime/acceptance/verdict.mjs";
import { closureRun } from "../../runtime/acceptance/ci-closure.mjs";
import { makeConsumer, buildPlan, CONTRACT, SPEC, SLUG, git } from "../../runtime/acceptance/acceptance.fixture.mjs";
import { runCases } from "./harness.mjs";

const RUNNER = { id: "r", executable: "node", argv: ["t/ok.mjs"], cwd: ".", format: "tap13", timeoutMs: 20000, isolation: "restricted", env: ["SystemRoot"] };
const runners = validateContract(CONTRACT).runners;
const spec = parseSpecAcceptance(SPEC);
const DATA = Buffer.from('{"rows":[{"email":"a@example.com"}]}');
const dataset = { id: "d1", kind: "file", path: "specs/feat/acceptance/d1.json", sha256: sha256File(DATA) };

function withRoot(fn) {
  const root = mkdtempSync(join(tmpdir(), "acc002-"));
  try {
    mkdirSync(join(root, ".git"));
    mkdirSync(join(root, "t"));
    writeFileSync(join(root, "t/ok.mjs"), 'console.log("TAP version 13\\nok 1 - c1\\n1..1");');
    return fn(root);
  } finally { rmSync(root, { recursive: true, force: true }); }
}
async function withRootAsync(fn) {
  const root = mkdtempSync(join(tmpdir(), "acc002-"));
  const out = mkdtempSync(join(tmpdir(), "acc002-out-"));
  try {
    mkdirSync(join(root, ".git"));
    mkdirSync(join(root, "t"));
    writeFileSync(join(root, "t/ok.mjs"), 'console.log("TAP version 13\\nok 1 - c1\\n1..1");');
    return await fn(root, out);
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(out, { recursive: true, force: true }); }
}
function withGitDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "acc002-git-"));
  try { execFileSync("git", ["init", "-q"], { cwd: dir }); return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}
const rec = (over = {}) => ({ scenarioId: "s1", sourceRevision: "sha256:rev1", inputFingerprint: "sha256:fp1", result: "PASS", executionKind: "agent", reasons: [], ...over });
const commitAll = (dir, msg) => { git(dir, "add", "-A"); git(dir, "commit", "-qm", msg); return git(dir, "rev-parse", "HEAD"); };

await runCases([
  // AC-0: governed validation contract and runner (shell-free, minimal env, labelled tiers)
  ["A-01", () => withRootAsync(async (root, out) => {
    assert.equal(validateContract(CONTRACT).ok, true);
    const r = await runRunner({ root, runner: RUNNER, outDir: out });
    assert.equal(r.status, "RAN");
    assert.equal(r.controls.shell, false);
    assert.equal(describeIsolation(r).label, "restricted (not isolated)");
  })],
  ["A-02", () => {
    const bad = (over) => validateContract({ ...CONTRACT, runners: [{ ...CONTRACT.runners[0], ...over }] }).errors.join();
    assert.match(bad({ executable: "bash", argv: ["-c", "x"] }), /shell/);
    assert.match(bad({ argv: ["-e", "0"] }), /inline script/);
    assert.match(bad({ argv: ["--eval=1"] }), /inline script/);
    assert.match(bad({ argv: ["$(whoami)"] }), /substitution/);
  }],
  // AC-1: a spec with criteria yields a valid plan; gaps are BLOCKED
  ["A-03", () => assert.deepEqual(validatePlan(buildPlan(), { spec, runners }).errors, [])],
  ["A-04", () => {
    const p = buildPlan();
    const noCase = { ...p, cases: p.cases.filter((k) => !k.ac.includes("AC-2")) };
    assert.match(validatePlan(noCase, { spec, runners }).errors.join(), /AC-2/);
    const emptyCat = { ...p, cases: p.cases.filter((k) => k.category !== "boundary") };
    assert.match(validatePlan(emptyCat, { spec, runners }).errors.join(), /boundary is APPLICABLE without a case/);
    const unjust = { ...p, cases: p.cases.filter((k) => k.category !== "boundary"), matrix: { ...p.matrix, boundary: { status: "NOT_APPLICABLE", justification: "", cites: [] } } };
    assert.match(validatePlan(unjust, { spec, runners }).errors.join(), /lacks a written justification/);
  }],
  // AC-2: datasets are digested; a mismatch is BLOCKED
  ["A-05", () => assert.deepEqual(validatePlan(buildPlan({ dataset }), { spec, runners, readFile: () => DATA }).errors, [])],
  ["A-06", () => {
    const r = validatePlan(buildPlan({ dataset }), { spec, runners, readFile: () => Buffer.from("tampered") });
    assert.equal(r.ok, false);
    assert.match(r.errors.join(), /d1/);
  }],
  // AC-3: only observed case IDs count; zero, missing or skipped is BLOCKED whatever the exit code
  ["A-07", () => {
    const parsed = parseStructured("tap13", "TAP version 13\nok 1 - c1\nok 2 - c2\n1..2\n");
    assert.equal(evaluateObserved({ expectedIds: ["c1", "c2"], observed: parsed.cases, parseErrors: parsed.errors, minObserved: 1, exitCode: 0 }).status, "PASS");
  }],
  ["A-08", () => {
    const zero = parseStructured("tap13", "TAP version 13\n1..0\n");
    assert.equal(evaluateObserved({ expectedIds: ["c1"], observed: zero.cases, parseErrors: zero.errors, minObserved: 1, exitCode: 0 }).status, "BLOCKED");
    const skipped = parseStructured("tap13", "TAP version 13\nok 1 - c1 # SKIP\n1..1\n");
    assert.equal(evaluateObserved({ expectedIds: ["c1"], observed: skipped.cases, parseErrors: skipped.errors, minObserved: 1, exitCode: 0 }).status, "BLOCKED");
  }],
  // AC-4: BASE vs candidate governance data; a DOWNGRADE forces the human gate
  ["A-09", () => {
    const d = detectDowngrades({ contract: CONTRACT, plan: buildPlan(), specText: SPEC, cutoff: null }, { contract: CONTRACT, plan: buildPlan(), specText: SPEC, cutoff: null });
    assert.deepEqual(d.findings, []);
    assert.equal(d.forcesHumanGate, false);
  }],
  ["A-10", () => {
    const cand = buildPlan();
    cand.cases[0].mandatory = false;
    const d = detectDowngrades({ contract: CONTRACT, plan: buildPlan(), specText: SPEC, cutoff: null }, { contract: CONTRACT, plan: cand, specText: SPEC, cutoff: null });
    assert.ok(d.findings.some((f) => f.kind === "MANDATORY_LOWERED"));
    assert.equal(d.forcesHumanGate, true);
  }],
  // AC-5: the manual is rendered from plan + contract and checked for parity
  ["A-11", () => {
    const plan = buildPlan();
    assert.equal(checkParity({ manualText: renderManual({ slug: SLUG, plan, contract: CONTRACT }), plan, contract: CONTRACT }).status, "PASS");
  }],
  ["A-12", () => {
    const plan = buildPlan();
    const m = renderManual({ slug: SLUG, plan, contract: CONTRACT });
    const edited = m.replace(plan.cases[0].id, "renamed-case");
    assert.equal(checkParity({ manualText: edited, plan, contract: CONTRACT }).status, "BLOCKED");
  }],
  // AC-6: six statuses mapped fail closed; only PASS and NOT_APPLICABLE are non-blocking
  ["A-13", () => {
    assert.equal(toResultStatus("PASS"), "PASS");
    assert.equal(consolidate([{ id: "a", status: "PASS" }, { id: "b", status: "NOT_APPLICABLE" }]).status, "PASS");
    assert.equal(isBlocking("NOT_APPLICABLE"), false);
  }],
  ["A-14", () => {
    for (const s of ["BLOCKED", "STALE", "NOT_RUN"]) { assert.equal(toResultStatus(s), "ERROR", s); assert.equal(isBlocking(s), true, s); }
    assert.equal(toResultStatus("FAIL"), "FAIL");
    assert.notEqual(consolidate([{ id: "a", status: "PASS" }, { id: "b", status: "STALE" }]).status, "PASS");
  }],
  // AC-7: append-only ledger in the git dir; tampering is BLOCKED; vacuous criteria are BLOCKED
  ["A-15", () => withGitDir((dir) => {
    appendEvidence(dir, "f", rec());
    appendEvidence(dir, "f", rec({ scenarioId: "s2" }));
    const l = readLedger(dir, "f");
    assert.equal(l.ok, true);
    assert.equal(l.entries.length, 2);
  })],
  ["A-16", () => withGitDir((dir) => {
    appendEvidence(dir, "f", rec());
    appendEvidence(dir, "f", rec({ scenarioId: "s2" }));
    const file = join(ledgerDir(dir, "f"), "ledger.jsonl");
    writeFileSync(file, readFileSync(file, "utf8").replace('"result":"PASS"', '"result":"FAIL"'));
    assert.equal(readLedger(dir, "f").ok, false);
  })],
  ["A-17", () => {
    const p = buildPlan();
    for (const k of p.cases) if (k.ac.includes("AC-2")) k.expected = "pass";
    assert.match(validatePlan(p, { spec, runners }).errors.join(), /AC-2 has only vacuously passing cases/);
  }],
  // AC-8: tiers are enforced; an unavailable tier is BLOCKED without fallback
  ["A-18", () => {
    assert.equal(tierSatisfies("container", "restricted"), true);
    assert.equal(tierSatisfies("restricted", "container"), false);
  }],
  ["A-19", () => withRootAsync(async (root, out) => {
    const c = await runRunner({ root, runner: { ...RUNNER, isolation: "container", image: `x@sha256:${"a".repeat(64)}` }, outDir: out, probe: () => ({ available: false, reason: "no container runtime is available" }) });
    assert.equal(c.status, "BLOCKED");
    assert.match(c.reasons[0], /no fallback/);
    const low = await runRunner({ root, runner: RUNNER, outDir: out, minTier: "container" });
    assert.equal(low.status, "BLOCKED");
  })],
  // AC-9: the merge closure is derived by trusted code from the CI raw output of the evaluated commit
  ["A-20", async () => {
    const dir = makeConsumer();
    const out = mkdtempSync(join(tmpdir(), "acc002-closure-"));
    try {
      const base = git(dir, "rev-parse", "main");
      const head = commitAll(dir, "feature");
      const r = await closureRun({ project: dir, base: "main", outDir: out, log: () => {} });
      const v = analyze({ repo: dir, base, head, closureDir: out, closureLog: r.anchors.join("\n"), run: { path: CLOSURE_WORKFLOW, event: "pull_request", headSha: head, id: 1, attempt: 1 } });
      assert.equal(v.closure.features[0].status, "PASS", JSON.stringify(v.closure));
    } finally { rmSync(dir, { recursive: true, force: true }); rmSync(out, { recursive: true, force: true }); }
  }],
  ["A-21", async () => {
    const dir = makeConsumer();
    const out = mkdtempSync(join(tmpdir(), "acc002-closure-"));
    try {
      const base = git(dir, "rev-parse", "main");
      const head = commitAll(dir, "feature");
      const r = await closureRun({ project: dir, base: "main", outDir: out, log: () => {} });
      const at = (run, closureLog = r.anchors.join("\n")) => analyze({ repo: dir, base, head, closureDir: out, closureLog, run }).closure.status;
      assert.equal(at({ path: CLOSURE_WORKFLOW, event: "push", headSha: head, id: 1 }), "BLOCKED");
      assert.equal(at({ path: ".github/workflows/other.yml", event: "pull_request", headSha: head, id: 1 }), "BLOCKED");
      assert.equal(at({ path: CLOSURE_WORKFLOW, event: "pull_request", headSha: head, id: 1 }, ""), "BLOCKED");
    } finally { rmSync(dir, { recursive: true, force: true }); rmSync(out, { recursive: true, force: true }); }
  }],
  // AC-10: the non-SUT class is explicit, rooted and never covers control-plane paths
  ["A-22", () => {
    assert.equal(inNonSutClass(CONTRACT, "docs/guide.md"), true);
    assert.deepEqual(uncoveredPaths({ changedPaths: ["docs/guide.md", "src/slugify.mjs"], cases: [{ sutPaths: ["src/slugify.mjs"] }], contract: CONTRACT }), []);
  }],
  ["A-23", () => {
    assert.ok(nonSutPathErrors(["governance/gates/**"]).length > 0);
    assert.ok(nonSutPathErrors([".github/**"]).length > 0);
    assert.ok(nonSutPathErrors(["runtime/**"]).length > 0);
    assert.deepEqual(uncoveredPaths({ changedPaths: ["runtime/x.mjs"], cases: [{ sutPaths: ["src/slugify.mjs"] }], contract: CONTRACT }), ["runtime/x.mjs"]);
  }],
  // AC-11: N/A and DOWNGRADE stay PENDING_APPROVAL; only the human approval lookup clears them
  ["A-24", async () => {
    const dir = makeConsumer({ naCategories: ["persistence"] });
    try {
      const r = await runFeatureAcceptance(dir, SLUG, { base: "main" });
      assert.equal(r.status, "BLOCKED");
      assert.deepEqual(r.pending, ["NOT_APPLICABLE_PENDING_APPROVAL"]);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }],
  ["A-25", async () => {
    const dir = makeConsumer({ naCategories: ["persistence"] });
    try {
      await runFeatureAcceptance(dir, SLUG, { base: "main" });
      assert.equal(featureAcceptanceStatus(dir, SLUG, { base: "main", approvals: () => true }).status, "PASS");
      assert.equal(CATEGORIES.length, 7);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }],
]);
