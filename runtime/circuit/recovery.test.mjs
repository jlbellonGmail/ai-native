import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyRecoveryState, RECOVERY_STATES } from "./recovery.mjs";

test("NOT_STARTED: no branch, no commits, nothing in ROADMAP.md yet", () => {
  assert.equal(classifyRecoveryState({ branchExists: false, hasCommits: false, roadmapState: "Missing" }), "NOT_STARTED");
});

test("IN_PROGRESS_UNCOMMITTED: a branch exists with uncommitted local edits, no commits yet", () => {
  assert.equal(
    classifyRecoveryState({ branchExists: true, workingTree: "dirty", hasCommits: false, roadmapState: "Pending" }),
    "IN_PROGRESS_UNCOMMITTED",
  );
});

test("IMPLEMENTED_UNVALIDATED: commits exist but no passing verify yet", () => {
  assert.equal(
    classifyRecoveryState({ branchExists: true, hasCommits: true, hasPassingVerify: false, workingTree: "clean", roadmapState: "Pending" }),
    "IMPLEMENTED_UNVALIDATED",
  );
});

test("VALIDATED_UNCOMMITTED: commits pass verify but there are further uncommitted edits", () => {
  assert.equal(
    classifyRecoveryState({ branchExists: true, hasCommits: true, hasPassingVerify: true, workingTree: "dirty", roadmapState: "Pending" }),
    "VALIDATED_UNCOMMITTED",
  );
});

test("COMMITTED_UNGOVERNED: everything committed and passing, but no PR/governance step yet", () => {
  assert.equal(
    classifyRecoveryState({ branchExists: true, hasCommits: true, hasPassingVerify: true, workingTree: "clean", roadmapState: "Pending", prState: null }),
    "COMMITTED_UNGOVERNED",
  );
});

test("CLOSED_LOCALLY_HUMAN_APPROVAL_REQUIRED: a PR is open, awaiting the single HITL (merge, not just review approval)", () => {
  assert.equal(
    classifyRecoveryState({ branchExists: true, hasCommits: true, hasPassingVerify: true, roadmapState: "Pending", prState: "OPEN" }),
    "CLOSED_LOCALLY_HUMAN_APPROVAL_REQUIRED",
  );
});

test("FORMALLY_CLOSED: the PR merged and ROADMAP.md shows the item Done", () => {
  assert.equal(classifyRecoveryState({ roadmapState: "Done", prState: "MERGED" }), "FORMALLY_CLOSED");
});

test("INCONSISTENT_STATE: ROADMAP.md shows Done but the PR never merged", () => {
  assert.equal(classifyRecoveryState({ roadmapState: "Done", prState: "OPEN" }), "INCONSISTENT_STATE");
});

test("INCONSISTENT_STATE: the PR merged but ROADMAP.md was never updated to Done", () => {
  assert.equal(classifyRecoveryState({ roadmapState: "Pending", prState: "MERGED" }), "INCONSISTENT_STATE");
});

test("INCONSISTENT_STATE: a duplicated ROADMAP.md entry never resolves to a confident state", () => {
  assert.equal(classifyRecoveryState({ roadmapState: "Ambiguous" }), "INCONSISTENT_STATE");
});

test("classifyRecoveryState never returns a state outside the declared vocabulary", () => {
  const cases = [
    {},
    { branchExists: true, hasCommits: true, hasPassingVerify: true, prState: "MERGED", roadmapState: "Done" },
    { prState: "OPEN", roadmapState: "Pending" },
  ];
  for (const input of cases) {
    assert.ok(RECOVERY_STATES.includes(classifyRecoveryState(input)));
  }
});
