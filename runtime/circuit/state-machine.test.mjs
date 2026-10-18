import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deriveState, isValidTransition, assertValidTransition, transition, canEnterSpecified, availableTransitions, InvalidTransitionError } from "./state-machine.mjs";
import { readEvents } from "./events.mjs";

function tmpLog() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-sm-test-"));
  return join(dir, "events.jsonl");
}

test("deriveState is NEW with no events", () => {
  assert.equal(deriveState([]), "NEW");
});

test("deriveState follows the last transition event's toState", () => {
  const events = [
    { eventType: "transition", fromState: "NEW", toState: "ASSESSED" },
    { eventType: "transition", fromState: "ASSESSED", toState: "SPECIFIED" },
  ];
  assert.equal(deriveState(events), "SPECIFIED");
});

test("deriveState ignores non-transition events", () => {
  const events = [{ eventType: "transition", fromState: "NEW", toState: "ASSESSED" }, { eventType: "assess", score: 1 }];
  assert.equal(deriveState(events), "ASSESSED");
});

test("isValidTransition matches contracts/state-machine.json's real table", () => {
  assert.equal(isValidTransition("NEW", "ASSESSED"), true);
  assert.equal(isValidTransition("NEW", "BUILDING"), false);
});

// CIR-12: the return transitions (Reviewer/QA/CR/NO MERGE -> Builder)
// must exist in the shared table, not be re-invented by this runtime.
test("the known return transitions (CIR-12) exist in contracts/state-machine.json", () => {
  assert.equal(isValidTransition("SPEC_REVIEWED", "SPECIFIED"), true, "spec review rejected -> back to SPECIFIED");
  assert.equal(isValidTransition("VERIFIED", "BUILDING"), true, "verify FAIL -> back to BUILDING");
  assert.equal(isValidTransition("CODE_REVIEWED", "BUILDING"), true, "code review rejected -> back to BUILDING");
  assert.equal(isValidTransition("AWAITING_HITL", "BUILDING"), true, "NO MERGE -> back to BUILDING");
  assert.equal(isValidTransition("CI_PENDING", "BUILDING"), true, "pr-gate fails -> back to BUILDING");
});

test("assertValidTransition throws InvalidTransitionError for an illegal move", () => {
  assert.throws(() => assertValidTransition("NEW", "MERGED"), InvalidTransitionError);
});

test("availableTransitions lists every legal next state from BUILT", () => {
  assert.deepEqual(availableTransitions("BUILT"), ["VERIFIED"]);
});

test("transition() appends a transition event and advances deriveState", () => {
  const path = tmpLog();
  try {
    transition(path, "02-item-a", [], "ASSESSED");
    const events = readEvents(path);
    assert.equal(deriveState(events), "ASSESSED");
  } finally {
    rmSync(path, { force: true });
  }
});

test("transition() throws and writes nothing for an illegal transition", () => {
  const path = tmpLog();
  try {
    assert.throws(() => transition(path, "02-item-a", [], "MERGED"), InvalidTransitionError);
    assert.deepEqual(readEvents(path), []);
  } finally {
    rmSync(path, { force: true });
  }
});

// --- CIR-08 / PAR-CLARIFY ---

test("canEnterSpecified is true with no open questions", () => {
  assert.equal(canEnterSpecified([]), true);
  assert.equal(canEnterSpecified(undefined), true);
});

test("canEnterSpecified is false with unresolved open questions", () => {
  assert.equal(canEnterSpecified(["what auth model?"]), false);
});

test("transition() to SPECIFIED with open questions throws (PAR-CLARIFY) instead of silently entering", () => {
  const path = tmpLog();
  try {
    const events = [{ eventType: "transition", fromState: "NEW", toState: "ASSESSED" }];
    assert.throws(
      () => transition(path, "02-item-a", events, "SPECIFIED", { openQuestions: ["what auth model?"] }),
      InvalidTransitionError,
    );
    assert.deepEqual(readEvents(path), []);
  } finally {
    rmSync(path, { force: true });
  }
});

test("transition() to SPECIFIED succeeds once open questions are resolved", () => {
  const path = tmpLog();
  try {
    const events = [{ eventType: "transition", fromState: "NEW", toState: "ASSESSED" }];
    transition(path, "02-item-a", events, "SPECIFIED", { openQuestions: [] });
    assert.equal(deriveState(readEvents(path)), "SPECIFIED");
  } finally {
    rmSync(path, { force: true });
  }
});
