import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkOutcomeCoherence, checkReviewEvidence, deriveReviewOutcome, executionAllowed, formatReviewOutcome, isReviewStale, loadRuntimeCapabilities, resolveReviewCapability } from "./independent-review.mjs";
import { implementAll } from "./implement-all.mjs";
import { runCoordinator } from "./coordinator.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
// the platform's verified runtimes (core/agents.json `runtimes` shape) and what the session observed
const RUNTIMES = { "test-runtime": { independentReview: "verified", evidence: "x", executions: { "delegated-fresh-context": "verified", "separate-process": "unavailable" } }, other: { independentReview: "unverified", evidence: null, executions: {} } };
const ISOLATED = { runtime: "test-runtime", agentDelegation: "available", contextIsolation: "available" };
const NO_SUBAGENTS = { runtime: "test-runtime", agentDelegation: "unavailable", contextIsolation: "unavailable" };
// a ReviewEvidence as a runtime adapter produces it (who, how, what it judged; never the reasoning)
const evidence = (reviewedRevision, over = {}) => ({ runtime: "test-runtime", agent: "reviewer", execution: "delegated-fresh-context", isolation: "fresh-context", reviewId: `review-${reviewedRevision}`, reviewedRevision, verdict: "APPROVED", attestation: { source: "runtime", adapter: "test-runtime", agentId: `agent-${reviewedRevision}` }, ...over });
const cap = (facts = ISOLATED) => resolveReviewCapability({ reviewerDefined: true, runtimes: RUNTIMES, ...facts });
const task = (id) => ({ id, title: id, state: "pending", requirements: [], doneWhen: "ok" });
const pass = () => ({ passed: true, output: "ok" });
const finding = (id, description = id) => ({ id, severity: "HIGH", description, status: "OPEN" });

// a Builder whose change is identified by `rev`; fixes move the change to a new revision
function unit({ review, selfReview = null, onFix = () => {} } = {}) {
  const calls = [];
  let rev = 1;
  const agents = {
    implement: async (t) => { calls.push(`implement:${t.id}`); },
    test: async () => pass(),
    accept: async () => ({ accepted: true }),
    fullSuite: async () => { calls.push("suite"); return pass(); },
    revision: async () => `rev-${rev}`,
    runtimes: RUNTIMES,
    fix: async (findings) => { calls.push(`fix:${findings.map((f) => f.id).join(",")}`); rev++; onFix(findings); },
    ...(review ? { review: async (i, ctx) => { calls.push(`review:${ctx.revision}`); return review(i, ctx); } } : {}),
    ...(selfReview ? { selfReview: async (i, ctx) => { calls.push(`self-review:${ctx.revision}`); return selfReview(i, ctx); } } : {}),
  };
  return { calls, agents, bump: () => rev++ };
}
const approveOn = (_i, { revision }) => ({ verdict: "APPROVED", findings: [], evidence: evidence(revision) });
const changesOn = (revision, findings, over = {}) => ({ verdict: "CHANGES_REQUESTED", findings, evidence: evidence(revision, { verdict: "CHANGES_REQUESTED" }), ...over });

test("CASE 1: with delegation and isolation the Reviewer runs, the review is independent and APPROVED keeps the policy gate", async () => {
  const { calls, agents } = unit({ review: approveOn });
  const run = await implementAll({ tasks: [task("T1")], level: "normal", capability: ISOLATED, humanGate: { ok: true, gate: "final-only" }, ...agents });
  assert.equal(run.status, "DONE");
  assert.deepEqual(calls, ["implement:T1", "suite", "review:rev-1"]);
  assert.equal(run.capability.independentReview, "available");
  assert.equal(run.reviews[0].kind, "independent");
  assert.equal(run.outcome.independentReview, "PASS");
  assert.equal(run.outcome.finalReviewStatus, "APPROVED");
  assert.equal(run.outcome.humanGate, "final-only", "an independent approval does not lift the policy gate either");
  assert.deepEqual(checkOutcomeCoherence(run.outcome), []);
});

test("CASE 2: without subagents the work continues to a self-review, never APPROVED, REVIEW_PENDING and human gate required", async () => {
  const reviewer = { called: 0 };
  const { calls, agents } = unit({ review: (...a) => { reviewer.called++; return approveOn(...a); }, selfReview: () => ({ verdict: "APPROVED", findings: [] }) });
  const run = await implementAll({ tasks: [task("T1"), task("T2")], level: "normal", capability: NO_SUBAGENTS, humanGate: { ok: true, gate: "none" }, ...agents });
  assert.equal(run.status, "REVIEW_PENDING");
  assert.equal(reviewer.called, 0, "the reviewer is never invoked in the author's context");
  assert.deepEqual(calls, ["implement:T1", "implement:T2", "suite", "self-review:rev-1"]);
  assert.deepEqual(
    { ...run.outcome, reasons: undefined },
    { implementation: "PASS", validation: "PASS", selfReview: "PASS", independentReview: "UNAVAILABLE", finalReviewStatus: "REVIEW_PENDING", humanGate: "required", reasons: undefined },
  );
  assert.match(run.outcome.reasons.join(";"), /agent delegation is unavailable/);
  assert.deepEqual(checkOutcomeCoherence(run.outcome), []);
  // the acceptance report of the real case (001-locales without capability)
  assert.match(formatReviewOutcome(run.outcome), /^IMPLEMENTATION: PASS\nVALIDATION: PASS\nSELF_REVIEW: PASS\nINDEPENDENT_REVIEW: UNAVAILABLE\nFINAL_REVIEW_STATUS: REVIEW_PENDING\nHUMAN_GATE: required/);
});

test("CASE 2 (no self-review either): technical validation still runs and the result is REVIEW_PENDING", async () => {
  const { calls, agents } = unit({ review: approveOn });
  const run = await implementAll({ tasks: [task("T1")], level: "light", ...agents });
  assert.equal(run.status, "REVIEW_PENDING");
  assert.deepEqual(calls, ["implement:T1", "suite"]);
  assert.equal(run.outcome.selfReview, "NOT_RUN");
  assert.equal(run.outcome.independentReview, "UNAVAILABLE");
});

test("CASE 3 / CASE 9: a defined reviewer is not a capability; every missing runtime fact keeps it unavailable", () => {
  const defined = resolveReviewCapability({ reviewerDefined: true, runtimes: RUNTIMES });
  assert.equal(defined.independentReview, "unavailable");
  assert.equal(defined.agentDelegation, "unknown");
  for (const facts of [
    { reviewerDefined: true, runtime: "test-runtime", agentDelegation: "unavailable", contextIsolation: "available" },
    { reviewerDefined: true, runtime: "test-runtime", agentDelegation: "available" },
    { reviewerDefined: true, runtime: "other", agentDelegation: "available", contextIsolation: "available" },
    { reviewerDefined: true, runtime: "made-up", agentDelegation: "available", contextIsolation: "available" },
    { reviewerDefined: true, runtime: "test-runtime", agentDelegation: "yes", contextIsolation: "available" },
    { reviewerDefined: false, ...ISOLATED },
  ]) {
    assert.equal(resolveReviewCapability({ ...facts, runtimes: RUNTIMES }).independentReview, "unavailable", JSON.stringify(facts));
  }
  assert.equal(cap().independentReview, "available");
  // support is never the caller's word: claiming it does not make an unverified runtime verified
  const claimed = resolveReviewCapability({ reviewerDefined: true, runtime: "other", support: "verified", agentDelegation: "available", contextIsolation: "available", runtimes: RUNTIMES });
  assert.equal(claimed.support, "unverified");
  assert.equal(claimed.independentReview, "unavailable");
});

test("CASE 3: an injected reviewer without the runtime capability is never called and never yields DONE", async () => {
  const { calls, agents } = unit({ review: approveOn });
  for (const capability of [null, NO_SUBAGENTS, { runtime: "other", agentDelegation: "available", contextIsolation: "available" }, { runtime: "other", support: "verified", agentDelegation: "available", contextIsolation: "available" }]) {
    calls.length = 0;
    const run = await implementAll({ tasks: [task("T1")], level: "light", capability, ...agents });
    assert.equal(run.status, "REVIEW_PENDING", JSON.stringify(capability));
    assert.ok(!calls.some((c) => c.startsWith("review:")));
  }
});

test("CASE 4: findings are fixed, revalidated and a NEW independent review judges the new revision", async () => {
  const { calls, agents } = unit({
    review: (i, { revision }) => (i === 1
      ? changesOn(revision, [finding("F1", "missing edge case")])
      : { verdict: "APPROVED", findings: [{ ...finding("F1", "missing edge case"), status: "RESOLVED" }], evidence: evidence(revision) }),
  });
  const run = await implementAll({ tasks: [task("T1")], level: "normal", capability: ISOLATED, ...agents });
  assert.equal(run.status, "DONE");
  assert.deepEqual(calls, ["implement:T1", "suite", "review:rev-1", "fix:F1", "suite", "review:rev-2"]);
  assert.deepEqual(run.reviews.map((r) => [r.iteration, r.reviewedRevision, r.verdict]), [[1, "rev-1", "CHANGES_REQUESTED"], [2, "rev-2", "APPROVED"]]);
  assert.equal(run.reviews[0].evidence.reviewId === run.reviews[1].evidence.reviewId, false, "each round is a new review");
});

test("CASE 4: the new review can find a regression the fix introduced; it is fixed too before approval", async () => {
  const { calls, agents } = unit({
    review: (i, { revision }) => ({
      1: changesOn(revision, [finding("F1")]),
      2: changesOn(revision, [{ ...finding("F1"), status: "RESOLVED" }, finding("F2", "regression from the F1 fix")]),
      3: { verdict: "APPROVED", findings: [], evidence: evidence(revision) },
    })[i],
  });
  const run = await implementAll({ tasks: [task("T1")], level: "normal", capability: ISOLATED, ...agents });
  assert.equal(run.status, "DONE");
  assert.ok(calls.includes("fix:F2"));
  assert.equal(run.outcome.finalReviewStatus, "APPROVED");
});

test("CASE 5: a finding that needs a domain decision is escalated with its exact cause, never guessed", async () => {
  const fixes = [];
  const { agents } = unit({
    review: (_i, { revision }) => changesOn(revision, [finding("F1", "RF-8 precedence undefined")], { needsHumanDecision: true, reason: "RF-8: the spec does not say which registry snapshot wins" }),
    onFix: (f) => fixes.push(f),
  });
  const run = await implementAll({ tasks: [task("T1")], level: "normal", capability: ISOLATED, ...agents });
  assert.equal(run.status, "NEEDS_HUMAN_DECISION");
  assert.equal(fixes.length, 0, "the Coordinator does not try to fix a domain decision");
  assert.equal(run.cause, "RF-8: the spec does not say which registry snapshot wins");
  assert.deepEqual(run.findings.map((f) => f.id), ["F1"]);
  assert.equal(run.reviews.length, 1);
  assert.equal(run.reviews[0].evidence.reviewedRevision, "rev-1", "the evidence is kept");
  assert.equal(run.outcome.finalReviewStatus, "NEEDS_HUMAN_DECISION");
  assert.equal(run.outcome.humanGate, "required");
});

test("CASE 6: an approval becomes stale when the change moves afterwards; a new review is required", async () => {
  let moved = false;
  const box = {};
  const { calls, agents, bump } = unit({ review: (i, ctx) => { if (!moved) { moved = true; box.bump(); } return approveOn(i, ctx); } });
  box.bump = bump;
  const run = await implementAll({ tasks: [task("T1")], level: "normal", capability: ISOLATED, ...agents });
  assert.equal(run.status, "DONE");
  assert.deepEqual(calls, ["implement:T1", "suite", "review:rev-1", "suite", "review:rev-2"]);
  assert.ok(run.evidence.some((e) => e.step === "review-stale" && e.reviewedRevision === "rev-1" && e.currentRevision === "rev-2"));

  // the same rule on a persisted review
  const record = { verdict: "APPROVED", reviewedRevision: "rev-1", evidence: evidence("rev-1") };
  assert.equal(isReviewStale(record, "rev-1"), false);
  assert.equal(isReviewStale(record, "rev-2"), true);
  const stale = deriveReviewOutcome({ implementation: "PASS", validation: "PASS", independentReview: record, capability: cap(), currentRevision: "rev-2", policyGate: "final-only", runtimes: RUNTIMES });
  assert.equal(stale.independentReview, "STALE");
  assert.equal(stale.finalReviewStatus, "REVIEW_PENDING");
  assert.equal(stale.humanGate, "required");
});

test("CASE 6: a change that keeps moving after every approval ends REVIEW_PENDING at the budget, not DONE", async () => {
  const box = {};
  const { agents, bump } = unit({ review: (i, ctx) => { box.bump(); return approveOn(i, ctx); } });
  box.bump = bump;
  const run = await implementAll({ tasks: [task("T1")], level: "light", capability: ISOLATED, ...agents });
  assert.equal(run.status, "REVIEW_PENDING");
  assert.equal(run.outcome.independentReview, "STALE");
});

test("CASE 7: no path merges, pushes, publishes or simulates the human approval", async () => {
  const sources = ["runtime/circuit/implement-all.mjs", "runtime/circuit/coordinator.mjs", "runtime/circuit/independent-review.mjs", "runtime/circuit/sdd-cli.mjs"].map((p) => readFileSync(join(root, p), "utf8"));
  for (const source of sources) {
    assert.doesNotMatch(source, /["'`](git\s+)?(push|merge)["'` ]|gh\s+pr\s+(merge|create)|spawnSync\(\s*["']gh["']/);
    assert.doesNotMatch(source, /humanApproved|approvedBy|MERGED|RELEASED/);
  }
  for (const name of ["sdd-implement-all", "sdd-validate"]) {
    const body = readFileSync(join(root, "core", "commands", `${name}.md`), "utf8");
    assert.doesNotMatch(body, /`git (push|merge)|gh pr merge|--admin/);
    assert.match(body, /[Nn]ever merge/);
  }
  // every outcome that is not an independent approval keeps the human gate required, whatever the policy said
  for (const independentReview of [null, { verdict: "CHANGES_REQUESTED", reviewedRevision: "r", evidence: evidence("r", { verdict: "CHANGES_REQUESTED" }) }, { verdict: "APPROVED", reviewedRevision: "old", evidence: evidence("old") }]) {
    const outcome = deriveReviewOutcome({ implementation: "PASS", validation: "PASS", independentReview, capability: cap(), currentRevision: "r", policyGate: "none", runtimes: RUNTIMES });
    assert.equal(outcome.humanGate, "required");
  }
});

test("CASE 8: incoherent states are rejected (APPROVED without an independent PASS, or a lighter gate without approval)", () => {
  const base = { implementation: "PASS", validation: "PASS", selfReview: "PASS", humanGate: "required", reasons: [] };
  assert.match(checkOutcomeCoherence({ ...base, independentReview: "UNAVAILABLE", finalReviewStatus: "APPROVED" }).join(";"), /APPROVED requires an independent review PASS, got UNAVAILABLE/);
  assert.match(checkOutcomeCoherence({ ...base, independentReview: "NOT_PROVEN", finalReviewStatus: "APPROVED" }).join(";"), /got NOT_PROVEN/);
  assert.match(checkOutcomeCoherence({ ...base, independentReview: "PASS", validation: "FAIL", finalReviewStatus: "APPROVED" }).join(";"), /validation PASS/);
  assert.match(checkOutcomeCoherence({ ...base, independentReview: "UNAVAILABLE", finalReviewStatus: "REVIEW_PENDING", humanGate: "none" }).join(";"), /must keep human_gate required/);
  assert.deepEqual(checkOutcomeCoherence({ ...base, independentReview: "PASS", finalReviewStatus: "APPROVED", humanGate: "final-only" }), []);
  // the deriver can never produce the incoherent state, whatever the self-review and validation say
  const outcome = deriveReviewOutcome({ implementation: "PASS", validation: "PASS", selfReview: { verdict: "APPROVED" }, capability: resolveReviewCapability({ reviewerDefined: true, runtimes: RUNTIMES }), policyGate: "none", runtimes: RUNTIMES });
  assert.equal(outcome.finalReviewStatus, "REVIEW_PENDING");
  assert.deepEqual(checkOutcomeCoherence(outcome), []);
});

test("CASE 10 / F1: evidence proves independence only when every fact is the runtime's, for this review and this revision", async () => {
  const ok = { runtimes: RUNTIMES, reviewId: "review-r", revision: "r", builderInvocationId: "builder-1" };
  assert.deepEqual(checkReviewEvidence(evidence("r"), ok), []);
  for (const [label, bad, expected] of [
    ["no evidence at all", undefined, /no runtime evidence/],
    ["independent declared by the caller, no attestation", { ...evidence("r"), attestation: undefined }, /not attested by the runtime adapter/],
    ["attested by another adapter than the runtime it names", evidence("r", { attestation: { source: "runtime", adapter: "other" } }), /not attested by the runtime adapter/],
    ["caller-sourced attestation", evidence("r", { attestation: { source: "caller", adapter: "test-runtime" } }), /not attested/],
    ["runtime the platform never verified", evidence("r", { runtime: "other", attestation: { source: "runtime", adapter: "other" } }), /unverified for runtime 'other'/],
    ["runtime nobody knows", evidence("r", { runtime: "claude-ish", attestation: { source: "runtime", adapter: "claude-ish" } }), /unknown for runtime 'claude-ish'/],
    ["same-context execution", evidence("r", { execution: "same-context" }), /not isolated/],
    ["execution class not verified for the runtime", evidence("r", { execution: "separate-process", isolation: "separate-process" }), /'separate-process' is not verified for runtime 'test-runtime'/],
    ["agent that is not the reviewer", evidence("r", { agent: "builder" }), /not by the 'reviewer' agent/],
    ["isolation that keeps the Builder's context", evidence("r", { isolation: "forked-context" }), /does not withhold/],
    ["the Builder's own invocation", evidence("r", { attestation: { source: "runtime", adapter: "test-runtime", agentId: "builder-1" } }), /Builder's own/],
    ["evidence of another review", evidence("r", { reviewId: "review-other" }), /answers another review/],
    ["evidence of another revision", evidence("r", { reviewedRevision: "other" }), /reviewed another revision/],
    ["a field missing", evidence("r", { verdict: undefined }), /lacks 'verdict'/],
  ]) {
    assert.match(checkReviewEvidence(bad, ok).join(";"), expected, label);
  }
  assert.match(checkReviewEvidence(evidence("r"), { ...ok, verdict: "CHANGES_REQUESTED" }).join(";"), /declared verdict CHANGES_REQUESTED is not the reviewer's/);

  for (const bad of [{}, { evidence: evidence("rev-1", { execution: "same-context" }) }, { evidence: evidence("rev-1", { attestation: { source: "runtime", adapter: "test-runtime", agentId: "builder-1" } }) }, { evidence: evidence("rev-1", { attestation: undefined }) }]) {
    const { agents } = unit({ review: () => ({ verdict: "APPROVED", findings: [], ...bad }) });
    const run = await implementAll({ tasks: [task("T1")], level: "normal", capability: ISOLATED, builderInvocationId: "builder-1", ...agents });
    assert.equal(run.status, "REVIEW_PENDING", JSON.stringify(bad));
    assert.equal(run.outcome.independentReview, "NOT_PROVEN");
    assert.equal(run.outcome.humanGate, "required");
  }
});

test("F5: execution classes are allowlisted per runtime; the platform verified Claude only for a fresh-context delegation", () => {
  const platform = loadRuntimeCapabilities(root);
  assert.equal(executionAllowed(platform, "claude", "delegated-fresh-context"), true);
  assert.equal(executionAllowed(platform, "claude", "separate-process"), false);
  for (const runtime of ["codex", "opencode"]) {
    for (const execution of ["delegated-fresh-context", "separate-process"]) assert.equal(executionAllowed(platform, runtime, execution), false, `${runtime}/${execution}`);
    assert.notEqual(platform[runtime].independentReview, "verified", runtime);
  }
  const claude = (over) => ({ ...evidence("r"), runtime: "claude", attestation: { source: "runtime", adapter: "claude", agentId: "a" }, ...over });
  assert.deepEqual(checkReviewEvidence(claude(), { runtimes: platform, revision: "r" }), []);
  assert.match(checkReviewEvidence(claude({ execution: "separate-process", isolation: "separate-process" }), { runtimes: platform, revision: "r" }).join(";"), /not verified for runtime 'claude'/);
  for (const runtime of ["codex", "opencode"]) {
    assert.match(checkReviewEvidence({ ...claude(), runtime, attestation: { source: "runtime", adapter: runtime } }, { runtimes: platform }).join(";"), new RegExp(`unverified for runtime '${runtime}'`));
  }
});

test("F2: an adverse review of the same revision withdraws an earlier approval, whoever wrote it, until the change moves", () => {
  const approved = { kind: "independent", verdict: "APPROVED", reviewedRevision: "r", evidence: evidence("r") };
  const base = { implementation: "PASS", validation: "PASS", independentReview: approved, capability: cap(), currentRevision: "r", policyGate: "final-only", runtimes: RUNTIMES };
  assert.equal(deriveReviewOutcome(base).finalReviewStatus, "APPROVED");
  for (const adverse of ["CHANGES_REQUESTED", "BLOCKED", "NEEDS_HUMAN_DECISION"]) {
    const withSelf = deriveReviewOutcome({ ...base, selfReview: { kind: "self", verdict: adverse, reviewedRevision: "r" } });
    assert.equal(withSelf.finalReviewStatus, adverse, `self ${adverse}`);
    assert.equal(withSelf.humanGate, "required");
    assert.match(withSelf.reasons.join(";"), /withdraws the approval/);
    const withOther = deriveReviewOutcome({ ...base, otherReviews: [approved, { kind: "independent", verdict: adverse, reviewedRevision: "r" }] });
    assert.equal(withOther.finalReviewStatus, adverse, `other ${adverse}`);
    assert.deepEqual(checkOutcomeCoherence(withSelf), []);
  }
  // fix -> validation -> new independent review: the adverse review of the old revision no longer stands
  const fixed = deriveReviewOutcome({ ...base, currentRevision: "r2", independentReview: { ...approved, reviewedRevision: "r2", evidence: evidence("r2") }, selfReview: { kind: "self", verdict: "CHANGES_REQUESTED", reviewedRevision: "r" } });
  assert.equal(fixed.finalReviewStatus, "APPROVED");
  assert.equal(fixed.selfReview, "STALE");
});

test("validation evidence: an approval covers only the validation runs its Reviewer was shown", () => {
  const approved = { verdict: "APPROVED", reviewedRevision: "r", evidence: evidence("r") };
  const outcome = deriveReviewOutcome({ implementation: "PASS", validation: "PASS", validationReviewed: false, independentReview: approved, capability: cap(), currentRevision: "r", policyGate: "final-only", runtimes: RUNTIMES });
  assert.equal(outcome.finalReviewStatus, "REVIEW_PENDING");
  assert.equal(outcome.humanGate, "required");
  assert.match(outcome.reasons.join(";"), /never saw them/);
  for (const validation of ["NOT_RUN", "FAIL"]) {
    assert.notEqual(deriveReviewOutcome({ implementation: "PASS", validation, independentReview: approved, capability: cap(), currentRevision: "r", runtimes: RUNTIMES }).finalReviewStatus, "APPROVED", validation);
  }
});

test("CASE 11: a Reviewer that keeps returning findings stops at the level budget: non-convergence, human gate required", async () => {
  let n = 0;
  const { calls, agents } = unit({ review: (_i, { revision }) => changesOn(revision, [finding(`F${++n}`)]) });
  const run = await implementAll({ tasks: [task("T1")], level: "normal", capability: ISOLATED, ...agents });
  assert.equal(run.status, "BLOCKED");
  assert.equal(run.reason, "convergence_stalled");
  assert.equal(run.nonConvergence, true);
  assert.equal(calls.filter((c) => c.startsWith("review:")).length, 4, "normal budget: 4 review rounds");
  assert.equal(calls.filter((c) => c.startsWith("fix:")).length, 3);
  assert.equal(run.outcome.finalReviewStatus, "CHANGES_REQUESTED");
  assert.equal(run.outcome.humanGate, "required");
});

test("coordinator: without the capability the unit ends REVIEW_PENDING with the gate required, even where `none` was allowed", async () => {
  const trace = [];
  const agents = {
    planner: {},
    implementer: { implement: async (t) => { trace.push(`implement:${t.id}`); }, fix: async () => {}, selfReview: async () => { trace.push("self-review"); return { verdict: "APPROVED", findings: [] }; } },
    verify: { test: async () => pass(), accept: async () => ({ accepted: true }), fullSuite: async () => pass(), revision: async () => "rev-1", changedPaths: async () => ["docs/guide.md"] },
    reviewer: { review: async () => { trace.push("review"); return { verdict: "APPROVED", findings: [] }; }, validate: async () => { trace.push("validate"); return { verdict: "APPROVED" }; } },
  };
  const out = await runCoordinator({ goal: "fix typo", signals: { scope: 1, changedPaths: ["docs/guide.md"] }, agents, policy: { declared: { humanGate: "none", autonomy: "full" }, allowNone: true }, capability: NO_SUBAGENTS, runtimes: RUNTIMES });
  assert.equal(out.status, "REVIEW_PENDING");
  assert.equal(out.gate.gate, "required");
  assert.equal(out.outcome.independentReview, "UNAVAILABLE");
  assert.deepEqual(trace, ["implement:T1", "self-review"], "neither the reviewer nor the final validation run in the author's context");
});

test("coordinator: a final validation that approves without isolation evidence does not make the unit ready", async () => {
  const agents = {
    planner: {},
    implementer: { implement: async () => {}, fix: async () => {} },
    verify: { test: async () => pass(), accept: async () => ({ accepted: true }), fullSuite: async () => pass(), revision: async () => "rev-1" },
    reviewer: { review: async (_i, ctx) => approveOn(_i, ctx), validate: async () => ({ verdict: "APPROVED" }) },
  };
  const out = await runCoordinator({ goal: "g", signals: { scope: 1 }, agents, capability: ISOLATED, runtimes: RUNTIMES });
  assert.match(out.reason, /final validation not independent: no runtime evidence/, "the unit reached the final validation: only its missing evidence stops it");
  assert.equal(out.status, "REVIEW_PENDING");
  assert.equal(out.gate.gate, "required");
});

test("CASE 9: a runtime that reports full capability but no reviewer to call never reaches DONE", async () => {
  const { calls, agents } = unit();
  const run = await implementAll({ tasks: [task("T1")], level: "normal", capability: ISOLATED, humanGate: { ok: true, gate: "none" }, ...agents });
  assert.equal(run.status, "REVIEW_PENDING");
  assert.equal(run.capability.independentReview, "unavailable");
  assert.match(run.capability.reasons.join(";"), /no reviewer role is defined/);
  assert.deepEqual(calls, ["implement:T1", "suite"]);
  assert.equal(run.outcome.humanGate, "required");
});
