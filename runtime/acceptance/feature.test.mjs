import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { featureAcceptanceStatus, runFeatureAcceptance } from "./feature.mjs";
import { makeConsumer, put, SLUG, GOOD_SRC, CONTRACT, buildPlan, SPEC } from "./acceptance.fixture.mjs";

const opts = { base: "main" };
const done = (dir) => rmSync(dir, { recursive: true, force: true });

test("normal feature: criteria detected, NOT_RUN before run, FAIL on a seeded defect, PASS after the fix", async () => {
  const dir = makeConsumer({ buggy: true });
  try {
    const before = featureAcceptanceStatus(dir, SLUG, opts);
    assert.equal(before.classification, "REQUIRED");
    assert.equal(before.status, "NOT_RUN", JSON.stringify(before.reasons));
    assert.equal(before.blocking, true);

    const failed = await runFeatureAcceptance(dir, SLUG, opts);
    assert.equal(failed.status, "FAIL", JSON.stringify(failed.reasons));
    assert.ok(failed.cases.some((c) => c.id === "slug-trims-edges" && c.status === "FAIL"), "the real defect is detected");
    assert.equal(failed.resultStatus, "FAIL");

    put(dir, "src/slugify.mjs", GOOD_SRC);
    // the fix moves the revision: the failing evidence no longer speaks for it
    const moved = featureAcceptanceStatus(dir, SLUG, opts);
    assert.equal(moved.status, "STALE");
    assert.equal(moved.blocking, true);
    const fixed = await runFeatureAcceptance(dir, SLUG, opts);
    assert.equal(fixed.status, "PASS", JSON.stringify(fixed.reasons));
    assert.equal(fixed.blocking, false);

    // any later change of a covered input is STALE, never a silent reuse
    put(dir, "src/slugify.mjs", GOOD_SRC + "// touched\n");
    const stale = featureAcceptanceStatus(dir, SLUG, opts);
    assert.notEqual(stale.status, "PASS");
    assert.equal(stale.blocking, true);
  } finally { done(dir); }
});

test("a trivial `node -e 0` validation is refused at the contract", async () => {
  const bad = { ...CONTRACT, runners: [{ ...CONTRACT.runners[0], argv: ["-e", "0"] }] };
  const dir = makeConsumer({ contract: bad });
  try {
    const r = await runFeatureAcceptance(dir, SLUG, opts);
    assert.equal(r.status, "BLOCKED");
    assert.match(r.reasons.join(), /inline script/);
  } finally { done(dir); }
});

test("a runner that observes zero cases is BLOCKED even with exit code 0", async () => {
  const dir = makeConsumer();
  try {
    put(dir, "tests/slugify.acceptance.mjs", 'console.log("TAP version 13\\n1..0");');
    const r = await runFeatureAcceptance(dir, SLUG, opts);
    assert.equal(r.status, "BLOCKED");
    assert.ok(r.cases.every((c) => c.status === "BLOCKED"));
  } finally { done(dir); }
});

test("a skipped or missing mandatory case is BLOCKED; an unknown observed id is BLOCKED", async () => {
  const dir = makeConsumer();
  try {
    put(dir, "tests/slugify.acceptance.mjs", 'console.log("TAP version 13\\nok 1 - slug-basic # SKIP x\\nok 2 - surprise\\n1..2");');
    const r = await runFeatureAcceptance(dir, SLUG, opts);
    assert.equal(r.status, "BLOCKED");
  } finally { done(dir); }
});

test("N/A category stays PENDING_APPROVAL: tasks may finish but acceptance is BLOCKED", async () => {
  const dir = makeConsumer({ naCategories: ["boundary", "persistence"] });
  try {
    const r = await runFeatureAcceptance(dir, SLUG, opts);
    assert.equal(r.status, "BLOCKED");
    assert.deepEqual(r.pending, ["NOT_APPLICABLE_PENDING_APPROVAL"]);
    assert.equal(r.cases.every((c) => c.status === "PASS"), true, "cases themselves pass: only the approval is missing");
    assert.equal(r.items.length, 2);
    // a human-only Environment approval (injected lookup) clears exactly the approved items
    const approved = featureAcceptanceStatus(dir, SLUG, { ...opts, approvals: () => true });
    assert.equal(approved.status, "PASS");
    const partial = featureAcceptanceStatus(dir, SLUG, { ...opts, approvals: (it) => it.id === "matrix:boundary" });
    assert.equal(partial.status, "BLOCKED");
  } finally { done(dir); }
});

test("an uncovered changed path is BLOCKED; a declared non-SUT path is not", async () => {
  const dir = makeConsumer();
  try {
    await runFeatureAcceptance(dir, SLUG, opts);
    put(dir, "docs/guide.md", "documentation only\n");
    assert.equal(featureAcceptanceStatus(dir, SLUG, opts).cases.some((c) => c.id.startsWith("path:")), false);
    put(dir, "src/other.mjs", "export const x = 1;\n");
    const s = featureAcceptanceStatus(dir, SLUG, opts);
    assert.ok(s.cases.some((c) => c.id === "path:src/other.mjs" && c.status === "BLOCKED"));
    assert.equal(s.blocking, true);
  } finally { done(dir); }
});

test("classification: missing criteria BLOCKED, legacy keeps v4.0.2 behavior, explicit N/A is pending approval", () => {
  const dir = makeConsumer();
  try {
    put(dir, `specs/${SLUG}/spec.md`, "# S\n\n## Requirements\n\nRF-1. x\n");
    const missing = featureAcceptanceStatus(dir, SLUG, opts);
    assert.equal(missing.classification, "MISSING");
    assert.equal(missing.status, "BLOCKED");
    const legacy = featureAcceptanceStatus(dir, SLUG, { ...opts, legacySlugs: [SLUG] });
    assert.equal(legacy.classification, "LEGACY");
    assert.equal(legacy.blocking, false);
    put(dir, `specs/${SLUG}/spec.md`, "# S\n\n## Requirements\n\nRF-1. x\n\nacceptance: not-applicable\nacceptance-justification: docs-only change, see RF-1\n");
    const na = featureAcceptanceStatus(dir, SLUG, opts);
    assert.equal(na.classification, "NOT_APPLICABLE");
    assert.equal(na.status, "BLOCKED");
    assert.deepEqual(na.pending, ["NOT_APPLICABLE_PENDING_APPROVAL"]);
    put(dir, `specs/${SLUG}/spec.md`, "# S\n\nacceptance: not-applicable\n");
    assert.equal(featureAcceptanceStatus(dir, SLUG, opts).status, "BLOCKED");
    assert.equal(SPEC.includes("AC-1"), true);
  } finally { done(dir); }
});

test("missing contract or plan is BLOCKED with an actionable diagnostic", () => {
  const dir = makeConsumer();
  try {
    put(dir, "acceptance/validation-contract.json", "{ not json");
    assert.match(featureAcceptanceStatus(dir, SLUG, opts).reasons.join(), /not valid JSON/);
    rmSync(`${dir}/acceptance/validation-contract.json`);
    assert.match(featureAcceptanceStatus(dir, SLUG, opts).reasons.join(), /no validation contract/);
    assert.ok(buildPlan().cases.length === 8);
  } finally { done(dir); }
});

test("a DOWNGRADE against BASE keeps acceptance BLOCKED as DOWNGRADE_PENDING_APPROVAL until approved (002 RF-35)", async () => {
  const { git } = await import("./acceptance.fixture.mjs");
  const { readFileSync } = await import("node:fs");
  const dir = makeConsumer();
  try {
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "feature with acceptance");
    git(dir, "branch", "-f", "main", "HEAD");
    const contract = JSON.parse(readFileSync(`${dir}/acceptance/validation-contract.json`, "utf8"));
    contract.runners[0].timeoutMs = 600000; // a longer timeout is a DOWNGRADE
    put(dir, "acceptance/validation-contract.json", JSON.stringify(contract, null, 2));
    const r = await runFeatureAcceptance(dir, SLUG, opts);
    assert.equal(r.status, "BLOCKED");
    assert.deepEqual(r.pending, ["DOWNGRADE_PENDING_APPROVAL"]);
    assert.ok(r.items.some((i) => i.kind === "DOWNGRADE" && /TIMEOUT_LONGER/.test(i.id)));
    assert.equal(featureAcceptanceStatus(dir, SLUG, { ...opts, approvals: (i) => i.kind === "DOWNGRADE" }).status, "PASS");
  } finally { done(dir); }
});

test("independent review F2/F3: the cutoff wins over AC lines, and a slug added to it is DOWNGRADE_PENDING_APPROVAL", async () => {
  const { git } = await import("./acceptance.fixture.mjs");
  const dir = makeConsumer();
  try {
    put(dir, "acceptance/legacy-cutoff.json", JSON.stringify({ schemaVersion: 1, slugs: [] }));
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "feature + empty cutoff");
    git(dir, "branch", "-f", "main", "HEAD");
    // F3: a legacy spec written from the v4.0.2 template has AC-n lines and must stay LEGACY (not REQUIRED/BLOCKED)
    assert.equal(featureAcceptanceStatus(dir, SLUG, { ...opts, legacySlugs: [SLUG] }).classification, "LEGACY");
    // F2: adding the feature to the cutoff after the upgrade is a DOWNGRADE, never a silent exemption
    put(dir, "acceptance/legacy-cutoff.json", JSON.stringify({ schemaVersion: 1, slugs: [SLUG] }));
    const s = featureAcceptanceStatus(dir, SLUG, opts);
    assert.equal(s.classification, "LEGACY");
    assert.equal(s.status, "BLOCKED");
    assert.deepEqual(s.pending, ["DOWNGRADE_PENDING_APPROVAL"]);
    assert.equal(s.blocking, true);
    assert.equal(featureAcceptanceStatus(dir, SLUG, { ...opts, approvals: () => true }).status, "NOT_APPLICABLE");
  } finally { done(dir); }
});

test("independent review F9: a seededFailure claim without a recorded FAIL in the ledger is BLOCKED", async () => {
  const { readFileSync } = await import("node:fs");
  const dir = makeConsumer();
  try {
    const plan = JSON.parse(readFileSync(`${dir}/specs/${SLUG}/acceptance/plan.json`, "utf8"));
    // make AC-2 rely on a seeded-failure claim only: its cases no longer expect a rejection
    for (const k of plan.cases) if (k.ac.includes("AC-2")) { k.expected = "pass"; k.seededFailure = { claimed: true }; }
    put(dir, `specs/${SLUG}/acceptance/plan.json`, JSON.stringify(plan, null, 2));
    const r = await runFeatureAcceptance(dir, SLUG, opts);
    assert.equal(r.status, "BLOCKED");
    assert.ok(r.cases.some((c) => c.id === "seeded-failure:AC-2" && c.status === "BLOCKED"), JSON.stringify(r.cases));
  } finally { done(dir); }
});

test("002 RF-17/RF-18: declared configuration files and allowed env values are fingerprinted; unreadable config is BLOCKED", async () => {
  const contract = { ...CONTRACT, runners: [{ ...CONTRACT.runners[0], configFiles: ["acceptance/runner-config.json"], env: [...CONTRACT.runners[0].env, "ACCEPTANCE_LOCALE"], envValues: ["ACCEPTANCE_LOCALE"] }] };
  const dir = makeConsumer({ contract });
  const saved = process.env.ACCEPTANCE_LOCALE;
  try {
    process.env.ACCEPTANCE_LOCALE = "es-AR";
    put(dir, "acceptance/runner-config.json", '{"mode":"strict"}');
    const ran = await runFeatureAcceptance(dir, SLUG, opts);
    assert.equal(ran.status, "PASS", JSON.stringify(ran.reasons));
    // a configuration change makes the evidence stale (never silently reused)
    put(dir, "acceptance/runner-config.json", '{"mode":"lenient"}');
    assert.equal(featureAcceptanceStatus(dir, SLUG, opts).status, "STALE");
    put(dir, "acceptance/runner-config.json", '{"mode":"strict"}');
    assert.equal(featureAcceptanceStatus(dir, SLUG, opts).status, "PASS");
    // so does a change of an allowed non-secret env value
    process.env.ACCEPTANCE_LOCALE = "en-US";
    assert.equal(featureAcceptanceStatus(dir, SLUG, opts).status, "STALE");
    process.env.ACCEPTANCE_LOCALE = "es-AR";
    // an unreadable critical configuration input is BLOCKED, not fresh and not PASS
    rmSync(join(dir, "acceptance/runner-config.json"));
    const missing = featureAcceptanceStatus(dir, SLUG, opts);
    assert.equal(missing.status, "BLOCKED");
    assert.match(JSON.stringify(missing), /critical configuration acceptance\/runner-config.json cannot be read/);
  } finally {
    if (saved === undefined) delete process.env.ACCEPTANCE_LOCALE; else process.env.ACCEPTANCE_LOCALE = saved;
    done(dir);
  }
});
