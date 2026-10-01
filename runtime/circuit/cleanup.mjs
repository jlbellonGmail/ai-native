// Work unit worktree/branch cleanup (M3.2, CIR-21; PAR-CLEANUP). Ported
// from TEMPLATE v2.0.5's cleanup-work-unit.ps1, including its Windows
// residual-worktree classification: a removed worktree sometimes leaves
// an empty (file-locked) directory behind on Windows, which must be
// reported, not silently treated as success, and content must never be
// force-deleted.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { worktreeList } from "../lib/git.mjs";

function git(cwd, args) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

/**
 * Removes the worktree and local branch for a finished Work Unit.
 * Returns a classification object; never throws for the expected
 * "residual on Windows" cases (lifecycle=RESIDUAL_WINDOWS), only for a
 * genuinely unexpected git error (classification=WORKTREE_REGISTERED,
 * cleanup=ERROR, lifecycle=RESIDUAL_WINDOWS, but the message carries the
 * real git stderr).
 */
export function cleanupWorkUnit(root, { worktreeDir, branch }) {
  const path = resolve(worktreeDir);
  const registered = worktreeList(root).some((t) => resolve(t.path) === path);

  if (registered) {
    const removal = git(root, ["worktree", "remove", path]);
    if (removal.status !== 0) {
      return {
        lifecycle: "RESIDUAL_WINDOWS",
        cleanup: "ERROR",
        classification: "WORKTREE_REGISTERED",
        path,
        message: (removal.stderr || "").trim() || "git worktree remove failed",
      };
    }
  }

  git(root, ["worktree", "prune"]);

  let classification = "A_NOT_EXISTS";
  let ok = true;
  if (existsSync(path)) {
    const entries = readdirSync(path);
    if (entries.length === 0) {
      classification = "B_RESIDUAL_WINDOWS_EMPTY";
      ok = false;
    } else {
      classification = "C_RESIDUAL_WINDOWS_CONTENT";
      ok = false;
    }
  }

  const branchExists = git(root, ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]).status === 0;
  if (branchExists) {
    git(root, ["branch", "-d", branch]);
  }

  return {
    lifecycle: ok ? "CLOSED" : "RESIDUAL_WINDOWS",
    cleanup: ok ? "CLEAN" : "DEFERRED",
    classification,
    path,
    message: ok ? "unit closed and artifacts cleaned" : "residual registered; content not deleted",
  };
}
