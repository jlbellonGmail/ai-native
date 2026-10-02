import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { inspectLifecycle, reconcile, buildReconcilerArgs } from "./reconcile.mjs";

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function commit(dir, file, content, message) {
  writeFileSync(join(dir, file), content, "utf8");
  git(dir, "add", file);
  git(dir, "commit", "-q", "-m", message);
  return git(dir, "rev-parse", "HEAD");
}

function makeRepoWithRemote() {
  const base = mkdtempSync(join(tmpdir(), "ai-native-reconcile-test-"));
  const remote = join(base, "origin.git");
  const dir = join(base, "repo");
  spawnSync("git", ["init", "--bare", "-q", remote]);
  mkdirSync(dir);
  git(dir, "init", "-q");
  git(dir, "checkout", "-q", "-b", "main");
  git(dir, "config", "user.email", "tests@example.invalid");
  git(dir, "config", "user.name", "Tests");
  git(dir, "remote", "add", "origin", remote);
  return { base, dir, remote };
}

test("inspectLifecycle is ACTIVE when there is no local work yet (head === baseCommit)", () => {
  const { base, dir } = makeRepoWithRemote();
  try {
    const base1 = commit(dir, "a.txt", "1\n", "init");
    git(dir, "push", "-u", "origin", "main");
    const result = inspectLifecycle(dir, { baseCommit: base1, headCommit: base1, originRef: "origin/main" });
    assert.equal(result.lifecycle, "ACTIVE");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("inspectLifecycle is RECONCILE_REQUIRED once local work exists and origin still contains the base", () => {
  const { base, dir } = makeRepoWithRemote();
  try {
    const base1 = commit(dir, "a.txt", "1\n", "init");
    git(dir, "push", "-u", "origin", "main");
    const head = commit(dir, "b.txt", "2\n", "local work");
    const result = inspectLifecycle(dir, { baseCommit: base1, headCommit: head, originRef: "origin/main" });
    assert.equal(result.lifecycle, "RECONCILE_REQUIRED");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("reconcile() is a no-op (ACTIVE, revalidated=true) when already based on current origin", () => {
  const { base, dir } = makeRepoWithRemote();
  try {
    commit(dir, "a.txt", "1\n", "init");
    git(dir, "push", "-u", "origin", "main");
    const result = reconcile(dir, { remoteBranch: "main" });
    assert.equal(result.lifecycle, "ACTIVE");
    assert.equal(result.revalidated, true);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("reconcile() merges a non-conflicting origin advance and marks prior evidence stale", () => {
  const { base, dir, remote } = makeRepoWithRemote();
  const clone = join(base, "clone");
  try {
    commit(dir, "a.txt", "1\n", "init");
    git(dir, "push", "-u", "origin", "main");
    git(dir, "worktree", "add", "-b", "feature/x", clone, "main");

    // Advance origin/main from a second independent checkout.
    git(dir, "checkout", "-q", "main");
    commit(dir, "other.txt", "upstream change\n", "upstream advance");
    git(dir, "push", "origin", "main");

    const result = reconcile(clone, { remoteBranch: "main" });
    assert.equal(result.lifecycle, "ACTIVE");
    assert.deepEqual(result.staleEvidence, ["ci", "review", "scoped-authorization"]);
    assert.equal(result.revalidated, false);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("reconcile() aborts cleanly and reports BLOCKED/SEMANTIC on a real conflict", () => {
  const { base, dir, remote } = makeRepoWithRemote();
  const clone = join(base, "clone");
  try {
    commit(dir, "shared.txt", "line1\n", "init");
    git(dir, "push", "-u", "origin", "main");
    git(dir, "worktree", "add", "-b", "feature/x", clone, "main");

    commit(clone, "shared.txt", "line1\nfeature change\n", "feature edits shared.txt");

    git(dir, "checkout", "-q", "main");
    commit(dir, "shared.txt", "line1\nupstream change\n", "upstream edits shared.txt");
    git(dir, "push", "origin", "main");

    const result = reconcile(clone, { remoteBranch: "main" });
    assert.equal(result.lifecycle, "BLOCKED");
    assert.equal(result.conflict, "SEMANTIC");

    const status = spawnSync("git", ["status", "--porcelain=v2"], { cwd: clone, encoding: "utf8" }).stdout;
    assert.ok(!status.includes("u "), "merge --abort must leave no unmerged entries");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

// --- PAR-RECONCILE-XPLAT ---

test("buildReconcilerArgs returns a plain argv array (not a shell string)", () => {
  const args = buildReconcilerArgs("/path/to/reconciler.mjs", { unitSlug: "02-item-a", branch: "feature/02-item-a", worktreeDir: "/tmp/wt" });
  assert.ok(Array.isArray(args));
  assert.deepEqual(args, ["/path/to/reconciler.mjs", "--slug", "02-item-a", "--branch", "feature/02-item-a", "--worktree-dir", "/tmp/wt", "--mode", "Feature"]);
});

test("buildReconcilerArgs values survive a real spawn round-trip unescaped, including spaces and apostrophes", () => {
  const trickySlug = `weird slug's with spaces`;
  const trickyWorktree = "/tmp/wt with space";
  const args = buildReconcilerArgs("echo.mjs", { unitSlug: trickySlug, branch: "feature/x", worktreeDir: trickyWorktree });

  const base = mkdtempSync(join(tmpdir(), "ai-native-reconcile-argv-"));
  const echoScriptPath = join(base, "echo-argv.mjs");
  try {
    writeFileSync(echoScriptPath, "console.log(JSON.stringify(process.argv.slice(2)));\n", "utf8");
    const result = spawnSync(process.execPath, [echoScriptPath, ...args.slice(1)], { encoding: "utf8" });
    const echoed = JSON.parse(result.stdout);
    assert.equal(echoed[1], trickySlug, "the slug with spaces/apostrophes must arrive byte-for-byte unescaped");
    assert.ok(echoed.includes(trickyWorktree));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
