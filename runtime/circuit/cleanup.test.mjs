import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { cleanupWorkUnit } from "./cleanup.mjs";

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function makeRepo() {
  const base = mkdtempSync(join(tmpdir(), "ai-native-cleanup-test-"));
  const dir = join(base, "repo");
  mkdirSync(dir);
  git(dir, "init", "-q");
  git(dir, "checkout", "-q", "-b", "main");
  git(dir, "config", "user.email", "tests@example.invalid");
  git(dir, "config", "user.name", "Tests");
  writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
  git(dir, "add", "a.txt");
  git(dir, "commit", "-q", "-m", "init");
  return { base, dir };
}

test("cleanupWorkUnit removes a real worktree and its branch, tolerating the known Windows residual-empty-directory timing quirk", () => {
  const { base, dir } = makeRepo();
  try {
    const worktreeDir = join(base, "worktrees", "02-item-a");
    git(dir, "worktree", "add", "-b", "feature/02-item-a", worktreeDir, "main");

    const result = cleanupWorkUnit(dir, { worktreeDir, branch: "feature/02-item-a" });
    // `git worktree remove` can report success while the OS has not
    // yet released its handles on the checked-out files (observed on
    // real Windows CI runners, presumably AV-scanner-held handles): the
    // directory, empty or still holding checked-out content, can
    // briefly survive. cleanup-work-unit.ps1's own classification
    // exists precisely to report that honestly (RESIDUAL_WINDOWS/
    // B or C) instead of lying about a clean CLOSED -- any of the three
    // is a legitimate outcome of a successful `git worktree remove`
    // call here; only WORKTREE_REGISTERED would mean git itself failed.
    assert.ok(
      ["A_NOT_EXISTS", "B_RESIDUAL_WINDOWS_EMPTY", "C_RESIDUAL_WINDOWS_CONTENT"].includes(result.classification),
      `unexpected classification: ${result.classification}`,
    );
    assert.equal(git(dir, "branch", "--list", "feature/02-item-a"), "");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("cleanupWorkUnit is a no-op success when there is nothing to clean up", () => {
  const { base, dir } = makeRepo();
  try {
    const worktreeDir = join(base, "worktrees", "never-existed");
    const result = cleanupWorkUnit(dir, { worktreeDir, branch: "feature/never-existed" });
    assert.equal(result.lifecycle, "CLOSED");
    assert.equal(result.classification, "A_NOT_EXISTS");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

// Windows worktree removal can leave a residual directory with content
// behind even after `git worktree remove` succeeds and the path is no
// longer git-registered. Simulated here directly (not registered, but
// still has files on disk) since a real filesystem lock can't be forced
// portably in a test.
test("cleanupWorkUnit reports C_RESIDUAL_WINDOWS_CONTENT and does not delete the content", () => {
  const { base, dir } = makeRepo();
  try {
    const worktreeDir = join(base, "worktrees", "residual");
    mkdirSync(worktreeDir, { recursive: true });
    writeFileSync(join(worktreeDir, "leftover.txt"), "do not delete me\n", "utf8");

    const result = cleanupWorkUnit(dir, { worktreeDir, branch: "feature/residual" });
    assert.equal(result.lifecycle, "RESIDUAL_WINDOWS");
    assert.equal(result.cleanup, "DEFERRED");
    assert.equal(result.classification, "C_RESIDUAL_WINDOWS_CONTENT");
    assert.ok(existsSync(join(worktreeDir, "leftover.txt")), "content must never be force-deleted");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("cleanupWorkUnit reports B_RESIDUAL_WINDOWS_EMPTY for an empty leftover directory", () => {
  const { base, dir } = makeRepo();
  try {
    const worktreeDir = join(base, "worktrees", "empty-residual");
    mkdirSync(worktreeDir, { recursive: true });

    const result = cleanupWorkUnit(dir, { worktreeDir, branch: "feature/empty-residual" });
    assert.equal(result.classification, "B_RESIDUAL_WINDOWS_EMPTY");
    assert.equal(result.lifecycle, "RESIDUAL_WINDOWS");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
