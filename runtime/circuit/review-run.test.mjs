import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createReviewRun, getLatestVerdict, readLatestVerdict, sha256Digest, ReviewerIndependenceError } from "./review-run.mjs";
import { readEvents } from "./events.mjs";

function tmpLog() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-review-test-"));
  return join(dir, "events.jsonl");
}

test("createReviewRun generates a reviewInvocationId distinct from the Builder's own id", () => {
  const path = tmpLog();
  try {
    const event = createReviewRun(path, "02-item-a", {
      stage: "spec",
      verdict: "approved",
      tool: "claude",
      content: "spec.md content",
      builderInvocationId: "builder-session-1",
    });
    assert.notEqual(event.reviewInvocationId, "builder-session-1");
    assert.match(event.reviewInvocationId, /^review-/);
  } finally {
    rmSync(path, { force: true });
  }
});

test("createReviewRun binds inputDigest to the exact content shown to the Reviewer", () => {
  const path = tmpLog();
  try {
    const event = createReviewRun(path, "02-item-a", { stage: "code", verdict: "approved", tool: "codex", content: "diff content A" });
    assert.equal(event.inputDigest, sha256Digest("diff content A"));
  } finally {
    rmSync(path, { force: true });
  }
});

test("createReviewRun throws ReviewerIndependenceError if reviewInvocationId were to collide with the Builder's own id", () => {
  const path = tmpLog();
  try {
    // toolSessionId equal to the Builder's own invocation id is the
    // concrete, checkable collision case (a real reviewInvocationId
    // collision can't happen since it's freshly random, but a tool
    // self-reporting the Builder's own session as the reviewer's is
    // exactly the independence violation this guards against).
    assert.throws(
      () =>
        createReviewRun(path, "02-item-a", {
          stage: "code",
          verdict: "approved",
          tool: "claude",
          content: "x",
          builderInvocationId: "builder-session-1",
          toolSessionId: "builder-session-1",
        }),
      ReviewerIndependenceError,
    );
    assert.deepEqual(readEvents(path), []);
  } finally {
    rmSync(path, { force: true });
  }
});

test("getLatestVerdict returns the chronologically last review event for a stage (PAR-VERDICT-COMPAT)", () => {
  const path = tmpLog();
  try {
    createReviewRun(path, "02-item-a", { stage: "code", verdict: "rejected", tool: "claude", content: "attempt 1" });
    createReviewRun(path, "02-item-a", { stage: "code", verdict: "approved", tool: "claude", content: "attempt 2" });
    const verdict = readLatestVerdict(path, "code");
    assert.equal(verdict.verdict, "approved");
    assert.equal(verdict.inputDigest, sha256Digest("attempt 2"));
  } finally {
    rmSync(path, { force: true });
  }
});

test("getLatestVerdict distinguishes spec-stage from code-stage reviews", () => {
  const events = [
    { eventType: "review", stage: "spec", verdict: "approved" },
    { eventType: "review", stage: "code", verdict: "rejected" },
  ];
  assert.equal(getLatestVerdict(events, "spec").verdict, "approved");
  assert.equal(getLatestVerdict(events, "code").verdict, "rejected");
});

test("getLatestVerdict returns null when there is no review for that stage yet", () => {
  assert.equal(getLatestVerdict([], "spec"), null);
});
