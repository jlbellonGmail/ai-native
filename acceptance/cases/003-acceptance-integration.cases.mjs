// Acceptance cases of spec 003 (acceptance integration). Plan: specs/003-acceptance-integration/acceptance/plan.json.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyFeature } from "../../runtime/acceptance/spec-acceptance.mjs";
import { runFeatureAcceptance, featureAcceptanceStatus, acceptancePacketLines } from "../../runtime/acceptance/feature.mjs";
import { impactSelection } from "../../runtime/acceptance/ci-closure.mjs";
import { acceptanceFindingsAgainstBase } from "../../runtime/policy/hitl.mjs";
import { deriveReviewOutcome } from "../../runtime/circuit/independent-review.mjs";
import { admitSource, loadUpgradeMatrix } from "../../runtime/bootstrap/upgrade-matrix.mjs";
import { sha256Hex } from "../../runtime/acceptance/impact.mjs";
import { makeConsumer, put, git, buildPlan, SLUG, GOOD_SRC } from "../../runtime/acceptance/acceptance.fixture.mjs";
import { runCases } from "./harness.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const fixtureLock = (tag) => JSON.parse(read(`evaluation/fixtures/upgrade-matrix/${tag}.json`)).lock;
const outcome = (acceptance, over = {}) => deriveReviewOutcome({ implementation: "PASS", validation: "PASS", independentReview: null, capability: { independentReview: "available" }, acceptance, ...over });
async function withConsumer(opts, fn) {
  const dir = makeConsumer(opts);
  try { return await fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}
const MANIFEST = { schemaVersion: 1, modules: [{ id: "locales", contracts: [{ id: "locales.api", path: "locales/contract.json" }] }, { id: "regions", contracts: [] }], dependencies: [{ consumer: "regions", provider: "locales", contract: "locales.api" }] };
function impactRepo(dir) {
  put(dir, "acceptance/dependency-manifest.json", JSON.stringify(MANIFEST));
  put(dir, "locales/contract.json", '{"v":1}');
  for (const [slug, moduleId] of [["010-regions-a", "regions"], ["011-regions-b", "regions"]]) put(dir, `specs/${slug}/acceptance/plan.json`, JSON.stringify({ ...buildPlan(), slug, moduleId }));
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base");
  git(dir, "branch", "-f", "main", "HEAD");
  return git(dir, "rev-parse", "HEAD");
}

await runCases([
  // AC-1: acceptance is wired into the existing SDD commands; no new slash command; classification per level
  ["I-01", () => {
    assert.match(read("core/commands/sdd-spec.md"), /AC-1 \(RF-1, RF-2\)/);
    assert.match(read("core/commands/sdd-tasks.md"), /the last task is always the acceptance task/);
    assert.match(read("core/commands/sdd-implement-all.md"), /sdd acceptance run <NNN-slug> --base <base-ref>/);
    assert.match(read("core/commands/sdd-validate.md"), /sdd acceptance status <NNN-slug>/);
    for (const forbidden of ["acceptance.md", "goal.md", "loops.md"]) assert.equal(existsSync(join(ROOT, "core/commands", forbidden)), false, forbidden);
  }],
  ["I-02", () => {
    const missing = classifyFeature({ slug: "x", specText: "# x\n\n## Requirements\n\nRF-1. THE SYSTEM SHALL x.\n" });
    assert.equal(missing.kind, "MISSING");
    assert.equal(missing.blocking, true);
    const na = classifyFeature({ slug: "x", specText: "# x\n\nacceptance: not-applicable\nacceptance-justification: documentation only (RF-1)\n\nRF-1. THE SYSTEM SHALL x.\n" });
    assert.equal(na.kind, "NOT_APPLICABLE");
    assert.equal(na.pendingApproval, true);
    assert.equal(classifyFeature({ slug: "x", specText: "- AC-1 (RF-1): y\n", legacySlugs: ["x"] }).kind, "LEGACY");
  }],
  // AC-2: FAIL/BLOCKED/STALE/NOT_RUN never DONE or APPROVED; only the runner-written ledger counts; the fix restores PASS
  ["I-03", () => {
    for (const a of ["FAIL", "BLOCKED", "STALE", "NOT_RUN"]) assert.notEqual(outcome(a).finalReviewStatus, "APPROVED", a);
    assert.notEqual(outcome("BLOCKED", { acceptancePending: true }).finalReviewStatus, "APPROVED");
  }],
  ["I-04", () => withConsumer({}, (dir) => {
    // nothing ran: whatever an agent claims, the status comes from the ledger only
    const s = featureAcceptanceStatus(dir, SLUG, { base: "main" });
    assert.equal(s.status, "NOT_RUN");
    assert.equal(s.blocking, true);
  })],
  ["I-05", () => withConsumer({ buggy: true }, async (dir) => {
    assert.equal((await runFeatureAcceptance(dir, SLUG, { base: "main" })).status, "FAIL");
    put(dir, "src/slugify.mjs", GOOD_SRC);
    assert.equal((await runFeatureAcceptance(dir, SLUG, { base: "main" })).status, "PASS");
  })],
  // AC-3: the review packet carries every acceptance element bound to the reviewed revision
  ["I-06", () => withConsumer({}, async (dir) => {
    const r = await runFeatureAcceptance(dir, SLUG, { base: "main" });
    const text = acceptancePacketLines(dir, SLUG, { base: "main", revision: r.revision }).join("\n");
    assert.match(text, /## Native Acceptance \(bound to this revision\)/);
    assert.match(text, /CLASSIFICATION: REQUIRED/);
    assert.match(text, /### Evidence summary \(runner-written ledger\)/);
    assert.match(text, /### Traceability: /);
  })],
  ["I-07", () => withConsumer({ naCategories: ["persistence"] }, async (dir) => {
    const r = await runFeatureAcceptance(dir, SLUG, { base: "main" });
    const text = acceptancePacketLines(dir, SLUG, { base: "main", revision: r.revision }).join("\n");
    assert.match(text, /PENDING_APPROVAL: NOT_APPLICABLE_PENDING_APPROVAL/);
    assert.match(text, /### DOWNGRADE \/ governance findings \(\d+\)/);
    assert.notEqual(outcome("BLOCKED", { acceptancePending: true }).finalReviewStatus, "APPROVED");
  })],
  // AC-4: on a disposable consumer the circuit detects a seeded defect, refuses trivial validation and silent DOWNGRADE
  ["I-08", () => withConsumer({ buggy: true }, async (dir) => {
    const failed = await runFeatureAcceptance(dir, SLUG, { base: "main" });
    assert.equal(failed.status, "FAIL");
    assert.ok(failed.cases.some((c) => c.status === "FAIL"));
  })],
  ["I-09", () => withConsumer({}, async (dir) => {
    // the feature exists at BASE; the candidate silently drops a mandatory case
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "feature");
    git(dir, "branch", "-f", "main", "HEAD");
    const plan = JSON.parse(readFileSync(join(dir, `specs/${SLUG}/acceptance/plan.json`), "utf8"));
    plan.cases = plan.cases.filter((k) => k.id !== "slug-trims-edges");
    put(dir, `specs/${SLUG}/acceptance/plan.json`, JSON.stringify(plan));
    const findings = acceptanceFindingsAgainstBase(dir, "main", [`specs/${SLUG}/acceptance/plan.json`]);
    assert.ok(findings.some((f) => f.kind === "CASE_REMOVED_OR_RENAMED" && f.detail === "slug-trims-edges"));
    // and a trivial runner never reaches the ledger as acceptance: the contract refuses it
    const contract = JSON.parse(readFileSync(join(dir, "acceptance/validation-contract.json"), "utf8"));
    contract.runners[0].argv = ["-e", "0"];
    put(dir, "acceptance/validation-contract.json", JSON.stringify(contract));
    const s = await runFeatureAcceptance(dir, SLUG, { base: "main" });
    assert.equal(s.status, "BLOCKED");
    assert.match(JSON.stringify(s.reasons), /not an allowed node flag/);
  })],
  // AC-5: the upgrade matrix admits exactly the four inspected releases and rejects everything else before writes
  ["I-10", () => {
    for (const tag of ["v4.0.1", "v4.0.2", "v3.4.2", "v3.4.3"]) assert.equal(admitSource({ lock: fixtureLock(tag), target: "v4.1.0" }).ok, true, tag);
    assert.match(admitSource({ lock: fixtureLock("v3.4.3"), target: "v4.1.0" }).warnings.join(), /MAJOR_CROSSING/);
    assert.deepEqual(loadUpgradeMatrix().admitted.map((r) => r.source).sort(), ["v3.4.2", "v3.4.3", "v4.0.1", "v4.0.2"]);
  }],
  ["I-11", () => {
    for (const tag of ["v4.0.0", "v3.4.1", "v3.2.0"]) assert.equal(admitSource({ lock: fixtureLock(tag), target: "v4.1.0" }).ok, false, tag);
    assert.equal(admitSource({ lock: null, target: "v4.1.0" }).ok, false);
    assert.equal(admitSource({ lock: { ...fixtureLock("v4.0.2"), schemaVersion: 2 }, target: "v4.1.0" }).ok, false);
  }],
  // AC-6: impact selection runs each affected consumer once; an undeclared public change is BLOCKED; no attested
  // reviewer means REVIEW_PENDING, never APPROVED
  ["I-12", () => withConsumer({}, (dir) => {
    const prev = impactRepo(dir);
    put(dir, "locales/contract.json", '{"v":2}');
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "provider change");
    const cand = git(dir, "rev-parse", "HEAD");
    put(dir, "acceptance/contract-changes.json", JSON.stringify({ changes: [{ providerId: "locales", contractId: "locales.api", previousRef: { commit: prev, path: "locales/contract.json", sha256: sha256Hex('{"v":1}') }, candidateRef: { commit: cand, path: "locales/contract.json", sha256: sha256Hex('{"v":2}') }, compatibility: "compatible" }] }));
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "declare");
    const r = impactSelection(dir, "main");
    assert.deepEqual(r.blocked, []);
    assert.deepEqual(r.slugs, ["010-regions-a", "011-regions-b"]);
  })],
  ["I-13", () => withConsumer({}, (dir) => {
    impactRepo(dir);
    put(dir, "locales/contract.json", '{"v":3}');
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "undeclared provider change");
    const r = impactSelection(dir, "main");
    assert.deepEqual(r.slugs, []);
    assert.match(r.blocked.join(), /without a valid declaration/);
  })],
  // the GI pilot definition the CI executes (RF-6, RF-14 to RF-17): valid plan and contract for its own spec, honest
  // evidence classes and plan cases equal to the pytest names (its PostgreSQL run is CI-only: acceptance-pilot.yml)
  ["I-15", async () => {
    const pilot = await import("../../evaluation/pilot-gi/pilot.mjs");
    const { validateContract } = await import("../../runtime/acceptance/contract.mjs");
    const { validatePlan } = await import("../../runtime/acceptance/plan.mjs");
    const { parseSpecAcceptance } = await import("../../runtime/acceptance/spec-acceptance.mjs");
    const vc = validateContract(pilot.overlayContract());
    assert.equal(vc.ok, true, vc.errors.join());
    const plan = pilot.overlayPlan();
    assert.deepEqual(validatePlan(plan, { spec: parseSpecAcceptance(read("evaluation/pilot-gi/overlay/spec.md")), runners: vc.runners }).errors, []);
    assert.deepEqual(pilot.labelErrors(plan), []);
    assert.deepEqual(pilot.definedTests(read(`evaluation/pilot-gi/overlay/${pilot.TEST_FILE}`)), plan.cases.map((k) => k.id).sort());
    assert.ok(plan.cases.some((k) => k.executionKind === "simulated") && plan.cases.some((k) => k.executionKind === "real-integration"));
    // a mislabelled case is caught
    assert.ok(pilot.labelErrors({ cases: [{ ...plan.cases[0], executionKind: "simulated" }] }).length > 0);
    assert.match(pilot.PG_IMAGE, /^postgres:16-alpine@sha256:[0-9a-f]{64}$/);
  }],
  // third review R6: AC-5 preservation, rollback and idempotence for every admitted source, through the real upgrade
  // engine (the lifecycle suite's per-source tests, run here and read from their TAP output)
  ["I-16", () => {
    const r = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "--test-name-pattern=v4\\.1\\.0: owned files preserved|v4\\.0\\.0 -> v4\\.1\\.0 is rejected", "runtime/cli/ai-native-lifecycle.test.mjs"], { cwd: ROOT, encoding: "utf8", timeout: 600000, maxBuffer: 32 * 1024 * 1024 });
    assert.equal(r.status, 0, String(r.stdout).slice(-800));
    for (const source of ["v4.0.1", "v4.0.2", "v3.4.2", "v3.4.3"]) assert.match(r.stdout, new RegExp(`^ok \\d+ - UPGRADE ${source.replaceAll(".", "\\.")} -> v4\\.1\\.0: owned files preserved, drift kept and reported, failure rolls back, second run idempotent`, "m"), source);
    assert.match(r.stdout, /^ok \d+ - UPGRADE v4\.0\.0 -> v4\.1\.0 is rejected before any file, index or cache write/m);
    assert.doesNotMatch(r.stdout, /^not ok /m);
  }],
  // RF-22 / AC-7 (audit F-006): `ai-native rollback` through the real bootstrap engine (the bootstrap suite's RF-22
  // tests, run here and read from their TAP output)
  ["I-17", () => {
    const r = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "--test-name-pattern=^RF-22: (rollback after an upgrade keeps|canonical\\(\\) of a lock|canonical\\(\\) keeps every property)", "runtime/bootstrap/bootstrap.test.mjs"], { cwd: ROOT, encoding: "utf8", timeout: 300000, maxBuffer: 32 * 1024 * 1024 });
    assert.equal(r.status, 0, String(r.stdout).slice(-800));
    assert.match(r.stdout, /^ok \d+ - RF-22: rollback after an upgrade keeps productDir, governance and every non-platform lock field$/m);
    assert.match(r.stdout, /^ok \d+ - RF-22: canonical\(\) of a lock without productDir\/governance is byte-identical to the previous serialization$/m);
    assert.match(r.stdout, /^ok \d+ - RF-22: canonical\(\) keeps every property contracts\/lock\.schema\.json admits, so a new schema field cannot be dropped silently$/m);
    assert.doesNotMatch(r.stdout, /^not ok /m);
  }],
  ["I-18", () => {
    const r = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "--test-name-pattern=^RF-22: rollback refuses a lock outside the schema", "runtime/bootstrap/bootstrap.test.mjs"], { cwd: ROOT, encoding: "utf8", timeout: 300000, maxBuffer: 32 * 1024 * 1024 });
    assert.equal(r.status, 0, String(r.stdout).slice(-800));
    assert.match(r.stdout, /^ok \d+ - RF-22: rollback refuses a lock outside the schema without touching the lock or the cache state$/m);
    assert.doesNotMatch(r.stdout, /^not ok /m);
  }],
  ["I-14", () => {
    const o = deriveReviewOutcome({ implementation: "PASS", validation: "PASS", independentReview: null, capability: { independentReview: "unavailable", reasons: ["no attested reviewer runtime"] }, acceptance: "PASS" });
    assert.equal(o.finalReviewStatus, "REVIEW_PENDING");
    assert.equal(o.humanGate, "required");
  }],
]);
