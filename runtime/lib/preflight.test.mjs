import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { checkPreflight } from "./preflight.mjs";
import { RESULT_STATUS } from "./result.mjs";

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-preflight-test-"));
  git(dir, "init", "-q");
  git(dir, "config", "user.email", "tests@example.invalid");
  git(dir, "config", "user.name", "Tests");
  writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
  git(dir, "add", "a.txt");
  git(dir, "commit", "-q", "-m", "init");
  return dir;
}

const FACTORY_PROFILE = { gitModel: { integrationBranch: "main", branchNamePattern: "^(feature|chore|docs)/" } };

test("checkPreflight passes on a branch matching the profile's branchNamePattern", () => {
  const dir = makeRepo();
  try {
    git(dir, "checkout", "-q", "-b", "feature/m3-1-status-integrity");
    const result = checkPreflight(dir, FACTORY_PROFILE);
    assert.equal(result.status, RESULT_STATUS.PASS);
    assert.deepEqual(result.errors, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkPreflight passes on the integration branch itself", () => {
  const dir = makeRepo();
  try {
    git(dir, "branch", "-q", "-m", "main");
    const result = checkPreflight(dir, FACTORY_PROFILE);
    assert.equal(result.status, RESULT_STATUS.PASS);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkPreflight fails on a branch that matches neither the integration branch nor the pattern", () => {
  const dir = makeRepo();
  try {
    git(dir, "checkout", "-q", "-b", "random-wip");
    const result = checkPreflight(dir, FACTORY_PROFILE);
    assert.equal(result.status, RESULT_STATUS.FAIL);
    assert.equal(result.errors.length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkPreflight falls back to the default branch pattern when the profile omits one", () => {
  const dir = makeRepo();
  try {
    git(dir, "checkout", "-q", "-b", "milestone/m3");
    const result = checkPreflight(dir, { gitModel: { integrationBranch: "main" } });
    assert.equal(result.status, RESULT_STATUS.PASS);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkPreflight warns (does not fail) on detached HEAD", () => {
  const dir = makeRepo();
  try {
    git(dir, "checkout", "-q", "HEAD~0");
    const result = checkPreflight(dir, FACTORY_PROFILE);
    assert.equal(result.status, RESULT_STATUS.PASS_WITH_WARNINGS);
    assert.deepEqual(result.errors, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkPreflight reports workingTree dirty/clean", () => {
  const dir = makeRepo();
  try {
    git(dir, "checkout", "-q", "-b", "feature/x");
    assert.equal(checkPreflight(dir, FACTORY_PROFILE).workingTree, "clean");
    writeFileSync(join(dir, "b.txt"), "x\n", "utf8");
    assert.equal(checkPreflight(dir, FACTORY_PROFILE).workingTree, "dirty");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
