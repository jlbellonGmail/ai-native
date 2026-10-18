import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, closeSync, openSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { claimItems, releaseClaim, readClaims, ClaimConflictError, ClaimLockContentionError } from "./claims.mjs";
import { gitCommonDir } from "../lib/git.mjs";

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-claims-test-"));
  git(dir, "init", "-q");
  git(dir, "config", "user.email", "tests@example.invalid");
  git(dir, "config", "user.name", "Tests");
  return dir;
}

test("claimItems records a new claim and readClaims reports it", () => {
  const dir = makeRepo();
  try {
    claimItems(dir, "milestone/m1", "milestone/m1", ["02-item-a", "03-item-b"]);
    const claims = readClaims(dir);
    assert.equal(claims.length, 1);
    assert.deepEqual(claims[0].items, ["02-item-a", "03-item-b"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("claimItems throws ClaimConflictError when an item is already claimed, and records nothing", () => {
  const dir = makeRepo();
  try {
    claimItems(dir, "feature/02-item-a", "feature/02-item-a", ["02-item-a"]);
    assert.throws(() => claimItems(dir, "milestone/m1", "milestone/m1", ["02-item-a", "03-item-b"]), ClaimConflictError);
    assert.equal(readClaims(dir).length, 1, "the conflicting claim must not be partially recorded");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("releaseClaim removes a unit's claim; its items become claimable again", () => {
  const dir = makeRepo();
  try {
    claimItems(dir, "feature/02-item-a", "feature/02-item-a", ["02-item-a"]);
    releaseClaim(dir, "feature/02-item-a");
    assert.equal(readClaims(dir).length, 0);
    assert.doesNotThrow(() => claimItems(dir, "feature/02-item-a-retry", "feature/02-item-a-retry", ["02-item-a"]));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a pre-existing lock file causes claimItems to fail fast with ClaimLockContentionError, not hang", () => {
  const dir = makeRepo();
  const lock = join(gitCommonDir(dir), "circuit-claims.lock");
  closeSync(openSync(lock, "w"));
  try {
    assert.throws(() => claimItems(dir, "feature/x", "feature/x", ["x"], { retries: 3, retryDelayMs: 5 }), ClaimLockContentionError);
  } finally {
    unlinkSync(lock);
    rmSync(dir, { recursive: true, force: true });
  }
});

test("claims claimed by two different units with disjoint items both succeed", () => {
  const dir = makeRepo();
  try {
    claimItems(dir, "feature/02-item-a", "feature/02-item-a", ["02-item-a"]);
    claimItems(dir, "feature/03-item-b", "feature/03-item-b", ["03-item-b"]);
    assert.equal(readClaims(dir).length, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
