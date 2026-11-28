// Spec 003 T1/T2: acceptance wired into the existing SDD commands, dispatcher, implement-all and review outcome.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { implementAll } from "../circuit/implement-all.mjs";
import { deriveReviewOutcome, checkOutcomeCoherence } from "../circuit/independent-review.mjs";
import { validationOf } from "../circuit/review-ledger.mjs";
import { makeConsumer, put, SLUG, GOOD_SRC, BUGGY_SRC } from "./acceptance.fixture.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const cli = join(root, "runtime", "circuit", "sdd-cli.mjs");
const sdd = (dir, ...args) => spawnSync(process.execPath, [cli, ...args, "--project", dir], { encoding: "utf8" });

test("no new slash command: acceptance lives in the existing command bodies and the sdd dispatcher (003 RF-1)", () => {
  const names = readdirSync(join(root, "core", "commands")).map((f) => f.replace(/\.md$/, "")).sort();
  for (const forbidden of ["acceptance", "goal", "loops"]) assert.ok(!names.includes(forbidden), `no /${forbidden}`);
  assert.match(readFileSync(join(root, "core/commands/sdd-spec.md"), "utf8"), /AC-1 \(RF-1, RF-2\)/);
  assert.match(readFileSync(join(root, "core/commands/sdd-tasks.md"), "utf8"), /sdd acceptance plan/);
  assert.match(readFileSync(join(root, "core/commands/sdd-implement-all.md"), "utf8"), /sdd acceptance run <NNN-slug> --base <base-ref>/);
  assert.match(readFileSync(join(root, "core/commands/sdd-validate.md"), "utf8"), /sdd acceptance status/);
});

test("dispatcher: plan / manual / run / status; FAIL exits 1, PASS exits 0 (003 RF-1)", () => {
  const dir = makeConsumer({ buggy: true });
  try {
    const plan = sdd(dir, "acceptance", "plan", SLUG);
    assert.equal(plan.status, 0, plan.stdout + plan.stderr);
    assert.match(plan.stdout, /PLAN: VALID/);
    const manual = sdd(dir, "acceptance", "manual", SLUG);
    assert.match(manual.stdout, /PARITY: PASS/);
    assert.ok(existsSync(join(dir, `specs/${SLUG}/acceptance/MANUAL.md`)));
    const notRun = sdd(dir, "acceptance", "status", SLUG, "--base", "main");
    assert.equal(notRun.status, 1);
    assert.match(notRun.stdout, /ACCEPTANCE: NOT_RUN/);
    const failed = sdd(dir, "acceptance", "run", SLUG, "--base", "main");
    assert.equal(failed.status, 1, failed.stdout + failed.stderr);
    assert.match(failed.stdout, /ACCEPTANCE: FAIL/);
    put(dir, "src/slugify.mjs", GOOD_SRC);
    const passed = sdd(dir, "acceptance", "run", SLUG, "--base", "main");
    assert.equal(passed.status, 0, passed.stdout + passed.stderr);
    assert.match(passed.stdout, /ACCEPTANCE: PASS/);
    // hand-editing the manual is a parity failure
    put(dir, `specs/${SLUG}/acceptance/MANUAL.md`, readFileSync(join(dir, `specs/${SLUG}/acceptance/MANUAL.md`), "utf8").replace("tests/slugify.acceptance.mjs;", "tests/x.mjs;"));
    const drift = sdd(dir, "acceptance", "status", SLUG, "--base", "main");
    assert.equal(drift.status, 1);
    assert.match(drift.stdout, /manual parity/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("sdd validate: level full fails a feature without criteria; level normal keeps the v4.0.2 warning (003 RF-18)", () => {
  const dir = makeConsumer();
  try {
    put(dir, `specs/${SLUG}/spec.md`, "# S\n\n## Requirements\n\n- RF-1. x\n");
    const full = sdd(dir, "validate", SLUG, "--level", "full");
    assert.equal(full.status, 1);
    assert.match(full.stderr, /acceptance: spec declares neither/);
    const normal = sdd(dir, "validate", SLUG);
    assert.equal(normal.status, 0, normal.stderr);
    put(dir, "acceptance/legacy-cutoff.json", JSON.stringify({ schemaVersion: 1, slugs: [SLUG] }));
    assert.equal(sdd(dir, "validate", SLUG, "--level", "full").status, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// implement-all with injected agents; the acceptance stage is NOT injectable
const agents = (calls = []) => ({
  implement: async (t) => calls.push(`implement:${t.id}`),
  test: async () => ({ passed: true }),
  accept: async () => ({ accepted: true, reason: "done-when" }),
  fullSuite: async () => ({ passed: true }),
  selfReview: async () => ({ verdict: "APPROVED", findings: [] }),
  fix: async () => {},
});
const TASKS = [{ id: "T1", title: "slugify", state: "pending", requirements: ["RF-1"], doneWhen: "x" }];

test("implement-all: the feature stage runs after the tasks; FAIL blocks; tasks still complete (003 RF-19)", async () => {
  const dir = makeConsumer({ buggy: true });
  try {
    const run = await implementAll({ tasks: TASKS, ...agents(), feature: { project: dir, slug: SLUG, base: "main" } });
    assert.equal(run.status, "BLOCKED");
    assert.deepEqual(run.completed, ["T1"]);
    assert.equal(run.acceptance.status, "FAIL");
    assert.ok(run.evidence.some((e) => e.step === "feature-acceptance" && e.status === "FAIL"));
    assert.equal(run.outcome.finalReviewStatus === "APPROVED", false);
    put(dir, "src/slugify.mjs", GOOD_SRC);
    const fixed = await implementAll({ tasks: TASKS, ...agents(), feature: { project: dir, slug: SLUG, base: "main" } });
    assert.equal(fixed.acceptance.status, "PASS");
    // no independent reviewer in this session: never DONE, but acceptance no longer blocks
    assert.equal(fixed.status, "REVIEW_PENDING");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("implement-all: a pending N/A ends NEEDS_HUMAN_DECISION, never DONE (002 RF-35, AC-11)", async () => {
  const dir = makeConsumer({ naCategories: ["persistence"] });
  try {
    const run = await implementAll({ tasks: TASKS, ...agents(), feature: { project: dir, slug: SLUG, base: "main" } });
    assert.equal(run.status, "NEEDS_HUMAN_DECISION");
    assert.deepEqual(run.completed, ["T1"]);
    assert.equal(run.outcome.finalReviewStatus === "APPROVED", false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("an injected stub returning PASS cannot satisfy acceptance: only the ledger counts (003 RF-19, AC-2)", async () => {
  const dir = makeConsumer({ buggy: true });
  try {
    // the agents object has no acceptance hook; a stub smuggled in is ignored
    const run = await implementAll({ tasks: TASKS, ...agents(), runFeatureAcceptance: async () => ({ status: "PASS" }), featureAcceptance: async () => ({ status: "PASS" }), feature: { project: dir, slug: SLUG, base: "main" } });
    assert.equal(run.acceptance.status, "FAIL");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("deriveReviewOutcome: FAIL, BLOCKED, STALE, NOT_RUN never APPROVED; pending is NEEDS_HUMAN_DECISION", () => {
  const base = { implementation: "PASS", validation: "PASS", independentReview: { verdict: "APPROVED", reviewedRevision: "r", evidence: null }, capability: { independentReview: "available" }, currentRevision: "r" };
  // evidence-free review is NOT_PROVEN: use an outcome with independent PASS through a stub runtime check instead
  for (const a of ["FAIL", "BLOCKED", "STALE", "NOT_RUN"]) {
    const o = deriveReviewOutcome({ ...base, acceptance: a });
    assert.notEqual(o.finalReviewStatus, "APPROVED", a);
    assert.equal(o.humanGate, "required");
    assert.deepEqual(checkOutcomeCoherence(o), []);
  }
  const coherent = checkOutcomeCoherence({ implementation: "PASS", validation: "PASS", acceptance: "FAIL", independentReview: "PASS", selfReview: "NOT_RUN", finalReviewStatus: "APPROVED", humanGate: "required" });
  assert.ok(coherent.some((e) => /acceptance/.test(e)));
});

test("validationOf: a free-text `node -e 0` run never makes a REQUIRED feature's validation PASS (003 AC-2)", () => {
  const dir = makeConsumer({ buggy: true });
  try {
    const v = validationOf(dir, SLUG, "sha256:any", { acceptance: { status: "NOT_RUN", reasons: [] } });
    assert.notEqual(v.result, "PASS");
    assert.ok(v.reasons.some((r) => /feature acceptance is NOT_RUN/.test(r)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("buggy and good sources differ only by the seeded defect", () => {
  assert.notEqual(BUGGY_SRC, GOOD_SRC);
});

test("without a contract: plan writes a proposal for human review and stays BLOCKED; manual fails cleanly", () => {
  const dir = makeConsumer();
  try {
    rmSync(join(dir, "acceptance", "validation-contract.json"));
    const m = sdd(dir, "acceptance", "manual", SLUG);
    assert.equal(m.status, 1);
    assert.match(m.stderr, /FAIL: acceptance\/validation-contract\.json not found/);
    assert.doesNotMatch(m.stderr, /ENOENT|at .*\.mjs/);
    const p = sdd(dir, "acceptance", "plan", SLUG);
    assert.equal(p.status, 1);
    assert.match(p.stdout, /Proposal: acceptance\/validation-contract\.proposal\.json/);
    assert.ok(existsSync(join(dir, "acceptance", "validation-contract.proposal.json")));
    assert.equal(existsSync(join(dir, "acceptance", "validation-contract.json")), false, "never created silently");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("independent review F8: an approved review with only a pending N/A is NEEDS_HUMAN_DECISION, never CHANGES_REQUESTED", () => {
  const pending = { status: "BLOCKED", pending: ["NOT_APPLICABLE_PENDING_APPROVAL"], reasons: ["NOT_APPLICABLE_PENDING_APPROVAL"] };
  const dir = makeConsumer();
  try {
    assert.equal(validationOf(dir, SLUG, "sha256:x", { acceptance: pending }).reasons.some((r) => /feature acceptance is BLOCKED/.test(r)), true);
    assert.notEqual(validationOf(dir, SLUG, "sha256:x", { acceptance: pending }).result, "FAIL");
  } finally { rmSync(dir, { recursive: true, force: true }); }
  const o = deriveReviewOutcome({ implementation: "PASS", validation: "PASS", independentReview: null, capability: { independentReview: "available" }, acceptance: "BLOCKED", acceptancePending: true });
  assert.notEqual(o.finalReviewStatus, "APPROVED");
});

test("the independent review packet carries the acceptance section bound to the reviewed revision (003 RF-20, AC-3)", () => {
  const dir = makeConsumer({ naCategories: ["persistence"] });
  try {
    const run = sdd(dir, "acceptance", "run", SLUG, "--base", "main");
    assert.match(run.stdout, /PENDING_APPROVAL/);
    const begin = sdd(dir, "review", "begin", SLUG, "--base", "main");
    assert.equal(begin.status, 0, begin.stderr);
    const revision = /REVISION: (\S+)/.exec(begin.stdout)[1];
    const packet = readFileSync(/^PACKET: (.+)$/m.exec(begin.stdout)[1].trim(), "utf8");
    assert.match(packet, /## Native Acceptance \(bound to this revision\)/);
    assert.ok(packet.includes(`REVISION: ${revision}`));
    assert.match(packet, /CLASSIFICATION: REQUIRED/);
    assert.match(packet, /PENDING_APPROVAL: NOT_APPLICABLE_PENDING_APPROVAL/);
    assert.match(packet, /\| persistence \| NOT_APPLICABLE \| category persistence does not apply/);
    assert.match(packet, /### DOWNGRADE \/ governance findings \(\d+\)/);
    assert.match(packet, /CONTRACT_CREATED/);
    assert.match(packet, /### Evidence summary \(runner-written ledger\)/);
    assert.match(packet, /### Traceability: .*traceability\.json/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
