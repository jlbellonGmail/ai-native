import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  currentBranch,
  headSha,
  workingTreeStatus,
  isAncestor,
  diffTreeNameOnly,
  worktreeList,
  getObservedCommit,
  GitError,
} from "./git.mjs";

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  }
  return result.stdout.trim();
}

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-git-test-"));
  git(dir, "init", "-q");
  git(dir, "config", "user.email", "tests@example.invalid");
  git(dir, "config", "user.name", "Tests");
  return dir;
}

function writeAndCommit(dir, file, content, message) {
  writeFileSync(join(dir, file), content, "utf8");
  git(dir, "add", file);
  git(dir, "commit", "-q", "-m", message);
  return headSha(dir);
}

test("currentBranch returns the checked-out branch name", () => {
  const dir = makeRepo();
  try {
    git(dir, "checkout", "-q", "-b", "develop");
    writeAndCommit(dir, "a.txt", "1\n", "init");
    assert.equal(currentBranch(dir), "develop");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("workingTreeStatus reports clean and dirty", () => {
  const dir = makeRepo();
  try {
    writeAndCommit(dir, "a.txt", "1\n", "init");
    assert.equal(workingTreeStatus(dir), "clean");
    writeFileSync(join(dir, "b.txt"), "dirty\n", "utf8");
    assert.equal(workingTreeStatus(dir), "dirty");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("isAncestor is true for an ancestor commit and false otherwise", () => {
  const dir = makeRepo();
  try {
    const a = writeAndCommit(dir, "a.txt", "1\n", "a");
    const b = writeAndCommit(dir, "a.txt", "2\n", "b");
    assert.equal(isAncestor(dir, a, b), true);
    assert.equal(isAncestor(dir, b, a), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("diffTreeNameOnly reports a root commit's files against the empty tree", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
    writeFileSync(join(dir, "b.txt"), "1\n", "utf8");
    git(dir, "add", ".");
    git(dir, "commit", "-q", "-m", "root");
    const root = headSha(dir);
    assert.deepEqual(diffTreeNameOnly(dir, root).sort(), ["a.txt", "b.txt"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("diffTreeNameOnly reports only the files a single non-root commit touches", () => {
  const dir = makeRepo();
  try {
    writeAndCommit(dir, "a.txt", "1\n", "root");
    const c2 = writeAndCommit(dir, "b.txt", "1\n", "add b");
    assert.deepEqual(diffTreeNameOnly(dir, c2), ["b.txt"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("worktreeList identifies the primary checkout and reports no linked worktrees by default", () => {
  const dir = makeRepo();
  try {
    writeAndCommit(dir, "a.txt", "1\n", "init");
    const trees = worktreeList(dir);
    assert.equal(trees.length, 1);
    assert.equal(trees[0].role, "primary");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("worktreeList reports a linked worktree with its branch", () => {
  const dir = makeRepo();
  try {
    git(dir, "checkout", "-q", "-b", "develop");
    writeAndCommit(dir, "a.txt", "1\n", "init");
    const linked = join(dir, "..", `${join(dir).split(/[\\/]/).pop()}-linked`);
    try {
      git(dir, "worktree", "add", "-q", "-b", "feature/x", linked, "develop");
      const trees = worktreeList(dir);
      assert.equal(trees.length, 2);
      const linkedEntry = trees.find((t) => t.role === "linked");
      assert.equal(linkedEntry.branch, "feature/x");
    } finally {
      rmSync(linked, { recursive: true, force: true });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- getObservedCommit: PAR-STATUS-SELF-STALE ---

test("getObservedCommit returns HEAD itself when HEAD is not ignore-only", () => {
  const dir = makeRepo();
  try {
    writeAndCommit(dir, "a.txt", "1\n", "root");
    const head = writeAndCommit(dir, "code.txt", "x\n", "real work");
    const result = getObservedCommit(dir, head);
    assert.equal(result.observedCommit, head);
    assert.deepEqual(result.skippedCommits, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("getObservedCommit skips a trailing run of STATUS.md-only commits", () => {
  const dir = makeRepo();
  try {
    const real = writeAndCommit(dir, "code.txt", "x\n", "real work");
    writeAndCommit(dir, "STATUS.md", "snapshot 1\n", "status");
    const head = writeAndCommit(dir, "STATUS.md", "snapshot 2\n", "status again");
    const result = getObservedCommit(dir, head);
    assert.equal(result.observedCommit, real);
    assert.equal(result.skippedCommits.length, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Regression test: the known bug in TEMPLATE v2.0.5's flat two-dot
// "status-only range" check (status-lib.ps1 Test-StatusOnlyRange /
// check-integrity.ps1 Test-StatusOnlyHeadAdvance). A commit that adds
// code.txt followed by a commit that removes code.txt again AND touches
// STATUS.md has a net two-dot diff of STATUS.md only -- the flat check
// would wrongly call that range "status-only", hiding the fact that a
// real, non-STATUS commit happened in between. getObservedCommit must not
// skip the final commit, because that commit's OWN diff (against its
// first parent) touches code.txt too.
test("getObservedCommit does not skip a commit whose own diff touches more than the ignored paths, even if the net range diff cancels out", () => {
  const dir = makeRepo();
  try {
    const root = writeAndCommit(dir, "a.txt", "1\n", "root");
    writeAndCommit(dir, "code.txt", "temporary\n", "adds code.txt (real work)");
    rmSync(join(dir, "code.txt"));
    writeFileSync(join(dir, "STATUS.md"), "snapshot\n", "utf8");
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", "removes code.txt, touches STATUS.md");
    const head = headSha(dir);

    const legacyFlatDiff = spawnSync("git", ["diff", "--name-only", `${root}..${head}`], {
      cwd: dir,
      encoding: "utf8",
    }).stdout.trim().split(/\r?\n/).filter(Boolean);
    assert.deepEqual(
      legacyFlatDiff,
      ["STATUS.md"],
      "sanity check: the legacy flat two-dot diff over the whole range nets out to STATUS.md only, hiding the intermediate code.txt commit",
    );

    const result = getObservedCommit(dir, head);
    assert.equal(result.observedCommit, head, "the commit itself touched code.txt, so it must not be treated as status-only");
    assert.deepEqual(result.skippedCommits, []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("getObservedCommit stops at the root commit when it is itself the only ignore-only commit", () => {
  const dir = makeRepo();
  try {
    const head = writeAndCommit(dir, "STATUS.md", "snapshot\n", "status only root");
    const result = getObservedCommit(dir, head);
    assert.equal(result.observedCommit, head);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("getObservedCommit treats an empty commit as real, not ignore-only", () => {
  const dir = makeRepo();
  try {
    const real = writeAndCommit(dir, "a.txt", "1\n", "root");
    git(dir, "commit", "-q", "--allow-empty", "-m", "empty");
    const head = headSha(dir);
    const result = getObservedCommit(dir, head);
    assert.equal(result.observedCommit, head);
    void real;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("GitError is thrown for a command run outside a git repository", () => {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-git-test-nonrepo-"));
  mkdirSync(join(dir, "sub"), { recursive: true });
  try {
    assert.throws(() => headSha(dir), GitError);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
