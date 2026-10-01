// Dependency-free git primitives shared by runtime/status/* and any future
// validator that needs real git state instead of re-implementing its own
// spawnSync/parsing (M3.1, PAR-STATUS-DERIVED / PAR-STATUS-SELF-STALE /
// PAR-INTEGRITY-IN-CI). Ported from TEMPLATE v2.0.5's status-lib.ps1 and
// check-integrity.ps1, which each had their own slightly different
// "is this range status-only" implementation (status-lib.ps1's
// Test-StatusOnlyRange: flat `git diff --name-only A..B`; check-integrity
// .ps1's Test-StatusOnlyHeadAdvance: merge-base --is-ancestor + flat diff).
// That duplication is itself a defect: a flat two-dot diff only looks at
// the net tree difference between the two endpoints, so any pair of
// commits whose combined changes cancel out (e.g. a file added by one
// commit and removed by a later one) is misclassified as "status-only"
// even when a real, non-STATUS commit happened in between. getObservedCommit
// below replaces both with a single first-parent, per-commit walk: a
// commit only counts as "status-only" when its OWN diff against its first
// parent touches nothing but the ignored paths.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

export class GitError extends Error {}

function run(cwd, args, { allowFailure = false, timeoutMs = 10000 } = {}) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", timeout: timeoutMs });
  if (result.error) {
    throw new GitError(`git ${args.join(" ")} failed to start: ${result.error.message}`);
  }
  if (result.signal) {
    throw new GitError(`git ${args.join(" ")} was killed by signal ${result.signal} (timeout=${timeoutMs}ms)`);
  }
  if (result.status !== 0 && !allowFailure) {
    throw new GitError(`git ${args.join(" ")} exited ${result.status}: ${(result.stderr || "").trim()}`);
  }
  return { code: result.status, stdout: (result.stdout || "").trim(), stderr: (result.stderr || "").trim() };
}

function lines(text) {
  return text ? text.split(/\r?\n/).filter((l) => l.length > 0) : [];
}

export function gitRoot(cwd) {
  return run(cwd, ["rev-parse", "--show-toplevel"]).stdout;
}

/** The real git-dir shared by every worktree of this repository (not the
 * per-worktree .git file) -- the right place for state that must be
 * visible to every worktree of the same repo (M3.2, PAR-PARALLEL-UNITS). */
export function gitCommonDir(cwd) {
  const raw = run(cwd, ["rev-parse", "--git-common-dir"]).stdout;
  return resolve(cwd, raw);
}

/** null when HEAD is detached (git branch --show-current prints nothing). */
export function currentBranch(cwd) {
  const branch = run(cwd, ["branch", "--show-current"]).stdout;
  return branch || null;
}

export function headSha(cwd) {
  return run(cwd, ["rev-parse", "HEAD"]).stdout;
}

export function workingTreeStatus(cwd) {
  return run(cwd, ["status", "--porcelain"]).stdout ? "dirty" : "clean";
}

export function isAncestor(cwd, ancestor, descendant) {
  return run(cwd, ["merge-base", "--is-ancestor", ancestor, descendant], { allowFailure: true }).code === 0;
}

/** Flat two-dot diff. Kept for callers that explicitly want the net range
 * diff (e.g. reporting), not for status-only classification (see module
 * header: use getObservedCommit for that). */
export function diffNameOnly(cwd, from, to) {
  return lines(run(cwd, ["diff", "--name-only", `${from}..${to}`]).stdout);
}

/** First parent of `sha`, or null for a root commit (no parents). */
export function firstParentOf(cwd, sha) {
  const parents = run(cwd, ["rev-list", "--parents", "-n", "1", sha]).stdout.split(/\s+/).filter(Boolean);
  return parents.length > 1 ? parents[1] : null;
}

/** Files changed by this single commit relative to its first parent (or
 * relative to the empty tree, for a root commit). Deliberately ignores any
 * second/third parent of a merge commit: only the first-parent lineage is
 * "the" history this repo's STATUS/integrity model walks. */
export function diffTreeNameOnly(cwd, sha) {
  const parent = firstParentOf(cwd, sha);
  if (parent === null) {
    return lines(run(cwd, ["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", sha]).stdout);
  }
  return lines(run(cwd, ["diff", "--name-only", parent, sha]).stdout);
}

export function worktreeList(cwd) {
  const raw = run(cwd, ["worktree", "list", "--porcelain"]).stdout;
  const primary = resolve(gitRoot(cwd));
  const items = [];
  let path = null;
  let branch = null;
  let head = null;
  const flush = () => {
    if (path === null) return;
    items.push({ path, branch, head, role: resolve(path) === primary ? "primary" : "linked" });
    path = null;
    branch = null;
    head = null;
  };
  for (const line of raw.split(/\r?\n/)) {
    if (line.startsWith("worktree ")) {
      flush();
      path = line.slice("worktree ".length).trim();
    } else if (line.startsWith("HEAD ")) {
      head = line.slice("HEAD ".length).trim();
    } else if (line.startsWith("branch ")) {
      branch = line.slice("branch ".length).trim().replace(/^refs\/heads\//, "");
    } else if (line.trim() === "") {
      flush();
    }
  }
  flush();
  return items;
}

export function remoteUrl(cwd, name = "origin") {
  const result = run(cwd, ["remote", "get-url", name], { allowFailure: true });
  return result.code === 0 ? result.stdout : null;
}

export function tagsSortedDesc(cwd) {
  return lines(run(cwd, ["tag", "--sort=-version:refname"]).stdout);
}

export function upstreamDivergence(cwd) {
  const upstream = run(cwd, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"], { allowFailure: true });
  if (upstream.code !== 0 || !upstream.stdout) return null;
  const counts = run(cwd, ["rev-list", "--left-right", "--count", "HEAD...@{upstream}"], { allowFailure: true });
  if (counts.code !== 0) return null;
  return { upstream: upstream.stdout, divergence: counts.stdout };
}

const DEFAULT_MAX_FIRST_PARENT_DEPTH = 500;

/**
 * Walks the first-parent chain backwards from `head`, skipping commits
 * whose own diff touches nothing but `ignorePaths` (default: STATUS.md),
 * and returns the first commit that is NOT ignore-only -- the
 * "observedCommit" (PAR-STATUS-SELF-STALE). If every commit back to the
 * root is ignore-only, the root commit is returned (there is nothing else
 * to observe). An empty-diff commit (no files changed at all) is treated
 * as real, not ignore-only: an unknown/empty diff must never be skipped
 * silently.
 */
export function getObservedCommit(cwd, head, { ignorePaths = ["STATUS.md"], maxDepth = DEFAULT_MAX_FIRST_PARENT_DEPTH } = {}) {
  const ignoreSet = new Set(ignorePaths);
  let current = head;
  const skippedCommits = [];
  for (let depth = 0; depth < maxDepth; depth += 1) {
    const changed = diffTreeNameOnly(cwd, current);
    const isIgnoreOnly = changed.length > 0 && changed.every((f) => ignoreSet.has(f));
    if (!isIgnoreOnly) {
      return { observedCommit: current, headCommit: head, skippedCommits };
    }
    const parent = firstParentOf(cwd, current);
    if (parent === null) {
      return { observedCommit: current, headCommit: head, skippedCommits };
    }
    skippedCommits.push(current);
    current = parent;
  }
  throw new GitError(`getObservedCommit: exceeded maxDepth=${maxDepth} walking first-parent history from ${head}`);
}
