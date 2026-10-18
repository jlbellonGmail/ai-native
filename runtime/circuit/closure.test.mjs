import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertPrMergedIntoBase, isRoadmapItemClosedOnce, areRoadmapItemsClosedOnce, interpretCiConclusion, recordTrace, NotMergedError } from "./closure.mjs";
import { readEvents } from "./events.mjs";

const MERGED_PR = { state: "MERGED", mergedAt: "2026-10-01T00:00:00Z", baseRefName: "main", headRefName: "feature/02-item-a", number: 9 };

test("assertPrMergedIntoBase passes for a real merge into the expected base/head", () => {
  assert.doesNotThrow(() => assertPrMergedIntoBase(MERGED_PR, { baseBranch: "main", branch: "feature/02-item-a" }));
});

test("assertPrMergedIntoBase throws when the PR is not MERGED", () => {
  assert.throws(() => assertPrMergedIntoBase({ ...MERGED_PR, state: "OPEN" }, { baseBranch: "main" }), NotMergedError);
});

test("assertPrMergedIntoBase throws when merged against the wrong base branch", () => {
  assert.throws(() => assertPrMergedIntoBase(MERGED_PR, { baseBranch: "develop" }), /not 'develop'/);
});

test("assertPrMergedIntoBase throws when mergedAt is missing despite state=MERGED", () => {
  assert.throws(() => assertPrMergedIntoBase({ ...MERGED_PR, mergedAt: null }, { baseBranch: "main" }), /did not return mergedAt/);
});

test("assertPrMergedIntoBase throws when the head branch does not match", () => {
  assert.throws(() => assertPrMergedIntoBase(MERGED_PR, { baseBranch: "main", branch: "feature/other" }), /PR head is/);
});

test("isRoadmapItemClosedOnce is true only for a clean [x] state", () => {
  assert.equal(isRoadmapItemClosedOnce("- [x] 02-item-a - A\n", "02-item-a"), true);
  assert.equal(isRoadmapItemClosedOnce("- [ ] 02-item-a - A\n", "02-item-a"), false);
});

test("areRoadmapItemsClosedOnce requires every item closed, atomically", () => {
  const content = "- [x] 02-item-a - A\n- [ ] 03-item-b - B\n";
  assert.equal(areRoadmapItemsClosedOnce(content, ["02-item-a", "03-item-b"]), false);
  assert.equal(areRoadmapItemsClosedOnce(content, ["02-item-a"]), true);
});

test("interpretCiConclusion: PENDING when not completed, PASS/FAIL once completed", () => {
  assert.equal(interpretCiConclusion(null), "PENDING");
  assert.equal(interpretCiConclusion({ status: "in_progress" }), "PENDING");
  assert.equal(interpretCiConclusion({ status: "completed", conclusion: "success" }), "PASS");
  assert.equal(interpretCiConclusion({ status: "completed", conclusion: "failure" }), "FAIL");
});

// --- PAR-TRACE ---

test("recordTrace binds the Work Unit to the merge commit and PR (PAR-TRACE)", () => {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-closure-trace-test-"));
  const path = join(dir, "events.jsonl");
  try {
    const event = recordTrace(path, "02-item-a", { commit: "a".repeat(40), prNumber: 9, prUrl: "https://example.invalid/pull/9" });
    assert.equal(event.eventType, "trace");
    assert.equal(readEvents(path).length, 1);
    assert.equal(event.prNumber, 9);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
