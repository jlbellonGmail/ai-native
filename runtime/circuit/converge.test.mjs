import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decideConvergence, convergenceBudgetFor, recordConvergence } from "./converge.mjs";
import { readEvents } from "./events.mjs";

test("convergenceBudgetFor matches contracts/sdd-levels.json: LIGHT=2, STANDARD=4, FULL=6", () => {
  assert.equal(convergenceBudgetFor("LIGHT"), 2);
  assert.equal(convergenceBudgetFor("STANDARD"), 4);
  assert.equal(convergenceBudgetFor("FULL"), 6);
});

test("APPROVED verdict with zero open findings and green tests is terminal APPROVED", () => {
  const result = decideConvergence({ depth: "LIGHT", iteration: 1, reviewer: { verdict: "APPROVED", findings: [] }, tests: { passed: true } });
  assert.equal(result.verdict, "APPROVED");
  assert.equal(result.terminal, true);
});

test("CHANGES_REQUESTED with real progress (fewer open findings than before) is non-terminal", () => {
  const result = decideConvergence({
    depth: "STANDARD",
    iteration: 2,
    reviewer: { verdict: "CHANGES_REQUESTED", findings: [{ id: "f1", severity: "minor", status: "OPEN", description: "x" }] },
    previous: { findingsFingerprint: "different", openFindings: 3 },
  });
  assert.equal(result.verdict, "CHANGES_REQUESTED");
  assert.equal(result.terminal, false);
  assert.equal(result.progress, true);
});

// Regression guard matching convergence.ps1's own semantics directly: a
// CHANGES_REQUESTED verdict whose open-findings fingerprint is identical
// to the previous iteration's is "no progress" and must fail safely
// rather than loop forever.
test("CHANGES_REQUESTED with the same findings fingerprint as before is no-progress -> FAILED_SAFELY (PAR-CONV-NO-PROGRESS)", () => {
  const findings = [{ id: "f1", severity: "major", status: "OPEN", description: "same issue" }];
  const fingerprint = "f1:major:same issue";
  const result = decideConvergence({
    depth: "STANDARD",
    iteration: 2,
    reviewer: { verdict: "CHANGES_REQUESTED", findings },
    previous: { findingsFingerprint: fingerprint, openFindings: 1 },
  });
  assert.equal(result.noProgress, true);
  assert.equal(result.verdict, "FAILED_SAFELY");
  assert.equal(result.escalation, "convergence_stalled");
  assert.equal(result.terminal, true);
});

test("reaching the iteration budget forces FAILED_SAFELY even with apparent progress (PAR-CONV-BUDGET-EXHAUSTED)", () => {
  const result = decideConvergence({
    depth: "LIGHT",
    iteration: 2,
    reviewer: { verdict: "CHANGES_REQUESTED", findings: [{ id: "f1", severity: "minor", status: "OPEN", description: "x" }] },
    previous: { findingsFingerprint: "something-else", openFindings: 5 },
  });
  assert.equal(result.verdict, "FAILED_SAFELY");
  assert.equal(result.escalation, "convergence_stalled");
});

test("a reviewer BLOCKED verdict is terminal BLOCKED with escalation=reviewer_blocked", () => {
  const result = decideConvergence({ depth: "LIGHT", reviewer: { verdict: "BLOCKED", findings: [] } });
  assert.equal(result.verdict, "BLOCKED");
  assert.equal(result.escalation, "reviewer_blocked");
  assert.equal(result.terminal, true);
});

test("an external block takes priority and is terminal BLOCKED/external_dependency", () => {
  const result = decideConvergence({ depth: "LIGHT", reviewer: { verdict: "CHANGES_REQUESTED", blockedExternal: true, findings: [] } });
  assert.equal(result.verdict, "BLOCKED");
  assert.equal(result.escalation, "external_dependency");
});

test("a material human decision escalates to NEEDS_HUMAN_DECISION, terminal", () => {
  const result = decideConvergence({ depth: "LIGHT", reviewer: { verdict: "CHANGES_REQUESTED", needsHumanDecision: true, findings: [] } });
  assert.equal(result.verdict, "NEEDS_HUMAN_DECISION");
  assert.equal(result.escalation, "material_decision");
});

test("needsPlanner escalates to NEEDS_HUMAN_DECISION with escalation=planner_reentry_required", () => {
  const result = decideConvergence({ depth: "LIGHT", reviewer: { verdict: "CHANGES_REQUESTED", needsPlanner: true, findings: [] } });
  assert.equal(result.escalation, "planner_reentry_required");
});

test("a technical execution failure takes priority over everything else, terminal FAILED_SAFELY", () => {
  const result = decideConvergence({ depth: "LIGHT", reviewer: { verdict: "APPROVED", findings: [] }, technicalFailure: true });
  assert.equal(result.verdict, "FAILED_SAFELY");
  assert.equal(result.escalation, "technical_execution_failure");
});

test("APPROVED verdict with still-open findings is not actually approved: CHANGES_REQUESTED continues", () => {
  const result = decideConvergence({
    depth: "STANDARD",
    iteration: 1,
    reviewer: { verdict: "APPROVED", findings: [{ id: "f1", severity: "minor", status: "OPEN", description: "x" }] },
  });
  assert.equal(result.verdict, "CHANGES_REQUESTED");
  assert.equal(result.terminal, false);
});

test("recordConvergence appends a schema-valid converge event", () => {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-converge-test-"));
  const path = join(dir, "events.jsonl");
  try {
    recordConvergence(path, "02-item-a", { depth: "LIGHT", iteration: 1, reviewer: { verdict: "APPROVED", findings: [] }, tests: { passed: true } });
    const events = readEvents(path);
    assert.equal(events.length, 1);
    assert.equal(events[0].verdict, "APPROVED");
    assert.equal(events[0].budget.maxIterations, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
