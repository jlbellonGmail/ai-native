import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { currentTreeSha, recordVerify, isVerifyStale, getLatestVerify, hasFreshPassingVerify } from "./verify.mjs";
import { readEvents } from "./events.mjs";

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-verify-test-"));
  git(dir, "init", "-q");
  git(dir, "config", "user.email", "tests@example.invalid");
  git(dir, "config", "user.name", "Tests");
  writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
  git(dir, "add", "a.txt");
  git(dir, "commit", "-q", "-m", "init");
  return dir;
}

function tmpLog() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-verify-events-"));
  return join(dir, "events.jsonl");
}

test("currentTreeSha returns HEAD's sha", () => {
  const dir = makeRepo();
  try {
    assert.equal(currentTreeSha(dir), git(dir, "rev-parse", "HEAD"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("recordVerify writes a treeSha-bound verify event", () => {
  const path = tmpLog();
  try {
    const sha = "a".repeat(40);
    const event = recordVerify(path, "02-item-a", { treeSha: sha, command: "npm test", status: "PASS", exitCode: 0 });
    assert.equal(event.treeSha, sha);
    assert.equal(readEvents(path).length, 1);
  } finally {
    rmSync(path, { force: true });
  }
});

test("isVerifyStale is false when the tree has not moved, true once it has (PAR-STALE-EVIDENCE)", () => {
  const event = { treeSha: "a".repeat(40) };
  assert.equal(isVerifyStale(event, "a".repeat(40)), false);
  assert.equal(isVerifyStale(event, "b".repeat(40)), true);
});

test("getLatestVerify returns the most recent verify event only", () => {
  const events = [
    { eventType: "verify", treeSha: "a".repeat(40), status: "FAIL" },
    { eventType: "transition", fromState: "VERIFIED", toState: "BUILDING" },
    { eventType: "verify", treeSha: "b".repeat(40), status: "PASS" },
  ];
  assert.equal(getLatestVerify(events).treeSha, "b".repeat(40));
});

test("hasFreshPassingVerify is true only for a PASS/PASS_WITH_WARNINGS verify bound to the current tree", () => {
  const sha = "a".repeat(40);
  const passing = [{ eventType: "verify", treeSha: sha, status: "PASS" }];
  assert.equal(hasFreshPassingVerify(passing, sha), true);

  const stale = [{ eventType: "verify", treeSha: sha, status: "PASS" }];
  assert.equal(hasFreshPassingVerify(stale, "b".repeat(40)), false, "stale: tree moved since the verify ran");

  const failing = [{ eventType: "verify", treeSha: sha, status: "FAIL" }];
  assert.equal(hasFreshPassingVerify(failing, sha), false);

  assert.equal(hasFreshPassingVerify([], sha), false, "no verify at all");
});
