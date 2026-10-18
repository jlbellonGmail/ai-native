// Work unit reconciliation (M3.2, CIR-19, CIR-20; PAR-RECONCILE-XPLAT,
// PAR-STATE-MACHINE). Ported from TEMPLATE v2.0.5's unit-lifecycle.ps1
// (inspect/reconcile actions). TEMPLATE v2.0.5's local-feature-reconcile
// .ps1 spawned a detached background pwsh process and had to hand-escape
// its own arguments differently for cmd.exe vs POSIX shells
// (Convert-ToPowerShellLiteral / Convert-ToStartProcessArgument). Node's
// spawn/spawnSync take an argument *array*, not a shell string, so that
// whole class of quoting bug does not exist here by construction --
// buildReconcilerArgs()'s test is the regression guard that this stays
// true for values containing spaces/quotes.
import { spawnSync } from "node:child_process";
import { isAncestor } from "../lib/git.mjs";

export class ReconcileConflictError extends Error {}

function git(cwd, args) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

/**
 * Read-only: does this unit need to merge `originRef` in? Ported
 * verbatim from unit-lifecycle.ps1's "inspect" action: RECONCILE_REQUIRED
 * when `originRef` still contains `baseCommit` (the branch point is
 * still reachable, i.e. no history rewrite) AND real work has happened
 * since (`headCommit` != `baseCommit`) -- otherwise ACTIVE.
 */
export function inspectLifecycle(root, { baseCommit, headCommit, originRef }) {
  const baseReachableFromOrigin = isAncestor(root, baseCommit, originRef);
  if (baseReachableFromOrigin && headCommit !== baseCommit) {
    return { lifecycle: "RECONCILE_REQUIRED", message: "origin advanced since this unit's base; local work exists" };
  }
  return { lifecycle: "ACTIVE", message: "unit isolated and registered" };
}

/**
 * Fetches `remoteBranch` and, if HEAD is not already based on it, merges
 * it in (`git merge --no-edit`). On conflict, aborts the merge (never
 * leaves a half-merged tree) and returns BLOCKED/SEMANTIC -- a semantic
 * conflict is a human decision, not something this runtime resolves. A
 * successful merge marks prior ci/review evidence stale: it was recorded
 * against a tree that no longer exists once new commits are mixed in.
 */
export function reconcile(root, { remote = "origin", remoteBranch }) {
  const fetch = git(root, ["fetch", remote, remoteBranch, "--prune"]);
  if (fetch.status !== 0) {
    throw new Error(`git fetch ${remote} ${remoteBranch} failed: ${(fetch.stderr || "").trim()}`);
  }
  const originRef = `${remote}/${remoteBranch}`;
  const alreadyBased = isAncestor(root, originRef, "HEAD");
  if (alreadyBased) {
    return { lifecycle: "ACTIVE", message: "already based on current origin", staleEvidence: [], revalidated: true };
  }

  const merge = git(root, ["merge", "--no-edit", originRef]);
  if (merge.status !== 0) {
    git(root, ["merge", "--abort"]);
    return { lifecycle: "BLOCKED", conflict: "SEMANTIC", message: "reconciliation requires a human decision" };
  }
  return { lifecycle: "ACTIVE", staleEvidence: ["ci", "review", "scoped-authorization"], revalidated: false, message: "reconciled; previous evidence is stale" };
}

// --- PAR-RECONCILE-XPLAT: safe argument construction ---

/**
 * Builds the argument array for a background reconciler invocation.
 * Returned as a plain array (never a shell command string) -- the
 * caller passes this straight to child_process.spawn/spawnSync, which
 * is what makes special characters in `unitSlug` safe on every platform
 * without any manual quoting logic.
 */
export function buildReconcilerArgs(scriptPath, { unitSlug, branch, worktreeDir, mode = "Feature", version = "" }) {
  const args = [scriptPath, "--slug", unitSlug, "--branch", branch, "--worktree-dir", worktreeDir, "--mode", mode];
  if (version) args.push("--version", version);
  return args;
}
