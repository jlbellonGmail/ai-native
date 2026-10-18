import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { getVersion, parseRoadmapEntries, getActiveUnits, buildSnapshot } from "./snapshot.mjs";

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-snapshot-test-"));
  git(dir, "init", "-q");
  git(dir, "checkout", "-q", "-b", "develop");
  git(dir, "config", "user.email", "tests@example.invalid");
  git(dir, "config", "user.name", "Tests");
  return dir;
}

function commitAll(dir, message) {
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", message);
}

// --- getVersion ---

test("getVersion is not hardcoded: explicit VERSION file wins over ROADMAP.md declaration", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "ROADMAP.md"), "## v2.7.3 — Roadmap activo\n", "utf8");
    commitAll(dir, "roadmap");
    assert.deepEqual(getVersion(dir, "develop"), { value: "v2.7.3", source: "ROADMAP.md", confidence: "declared" });

    writeFileSync(join(dir, "VERSION"), "v9.1.4\n", "utf8");
    commitAll(dir, "version file");
    assert.equal(getVersion(dir, "develop").value, "v9.1.4");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("getVersion returns unknown (null), never a guessed value, when nothing resolves", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
    commitAll(dir, "init");
    const version = getVersion(dir, "develop");
    assert.equal(version.value, null);
    assert.equal(version.confidence, "unknown");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- parseRoadmapEntries ---

test("parseRoadmapEntries reads pending/ready/done markers", () => {
  const text = "- [ ] 01-pending - A\n- [-] 02-ready - B\n- [x] 03-done - C\n";
  assert.deepEqual(parseRoadmapEntries(text), [
    { slug: "01-pending", state: "pending" },
    { slug: "02-ready", state: "ready" },
    { slug: "03-done", state: "done" },
  ]);
});

// Regression test: TEMPLATE v2.0.5's roadmap-slug matching (status-lib.ps1
// Get-StatusUnitFromTree) was hardcoded to two-digit slugs
// (`\d{2}-[a-z0-9-]+`). ai-native's own roadmap
// (governance/roadmaps/AI-NATIVE-V3-ROADMAP.md) uses slugs like `M3.1` --
// a straight port of the old regex would find zero roadmap entries here
// and therefore report zero active units even with a real feature
// worktree checked out. parseRoadmapEntries must not depend on the slug
// shape.
test("parseRoadmapEntries matches ai-native's own M-dot-number roadmap slugs, not just TEMPLATE's two-digit slugs", () => {
  const text = "- [ ] M3.1 — STATUS/integrity.\n- [ ] W5-T3 — Agent capabilities catalog.\n";
  assert.deepEqual(parseRoadmapEntries(text), [
    { slug: "M3.1", state: "pending" },
    { slug: "W5-T3", state: "pending" },
  ]);
});

// --- getActiveUnits ---

test("getActiveUnits returns [] when there is no linked worktree", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "ROADMAP.md"), "- [ ] M3.1 — demo\n", "utf8");
    commitAll(dir, "roadmap");
    assert.deepEqual(getActiveUnits(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("getActiveUnits reports a linked worktree whose branch resolves to a pending M-dot-number roadmap slug", () => {
  const dir = makeRepo();
  const linked = `${dir}-linked`;
  try {
    writeFileSync(join(dir, "ROADMAP.md"), "- [ ] M3.1 — STATUS/integrity.\n", "utf8");
    commitAll(dir, "roadmap");
    git(dir, "worktree", "add", "-q", "-b", "feature/m3-1-status-integrity", linked, "develop");

    const units = getActiveUnits(dir);
    assert.equal(units.length, 1);
    assert.equal(units[0].unitId, "M3.1");
    assert.equal(units[0].mode, "Feature");
    assert.equal(units[0].state, "pending");
    assert.equal(units[0].lifecycle, "ACTIVE");
    assert.equal(units[0].source, "git-worktree");
  } finally {
    rmSync(linked, { recursive: true, force: true });
    rmSync(dir, { recursive: true, force: true });
  }
});

test("getActiveUnits excludes a worktree whose roadmap entry is already done", () => {
  const dir = makeRepo();
  const linked = `${dir}-linked`;
  try {
    writeFileSync(join(dir, "ROADMAP.md"), "- [x] M2.3 — done already.\n", "utf8");
    commitAll(dir, "roadmap");
    git(dir, "worktree", "add", "-q", "-b", "feature/m2-3-compat-spike", linked, "develop");
    assert.deepEqual(getActiveUnits(dir), []);
  } finally {
    rmSync(linked, { recursive: true, force: true });
    rmSync(dir, { recursive: true, force: true });
  }
});

test("getActiveUnits does not create units from historical runs/ directories, only from real worktrees", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "ROADMAP.md"), "- [ ] M3.1 — demo\n", "utf8");
    mkdirSync(join(dir, "runs", "v2.0.0", "01-demo"), { recursive: true });
    commitAll(dir, "roadmap + historical run dir");
    assert.deepEqual(getActiveUnits(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- buildSnapshot ---

test("buildSnapshot is a pure function of current repo state: no snapshot file is read back", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
    commitAll(dir, "init");
    const snapshot = buildSnapshot(dir);
    assert.equal(snapshot.branch, "develop");
    assert.equal(snapshot.head, git(dir, "rev-parse", "HEAD"));
    assert.equal(snapshot.observedCommit, snapshot.head);
    assert.equal(snapshot.workingTree, "clean");
    assert.deepEqual(snapshot.activeUnits, []);
    assert.equal(typeof snapshot.generatedAt, "string");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("buildSnapshot's observedCommit tolerates a trailing STATUS.md-only commit", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
    commitAll(dir, "real work");
    const realHead = git(dir, "rev-parse", "HEAD");
    writeFileSync(join(dir, "STATUS.md"), "snapshot\n", "utf8");
    commitAll(dir, "status refresh");
    const snapshot = buildSnapshot(dir);
    assert.equal(snapshot.observedCommit, realHead);
    assert.equal(snapshot.statusOnlyCommitsSkipped, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
