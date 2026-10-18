import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { startWorkUnit } from "./start-unit.mjs";
import { readClaims } from "./claims.mjs";

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function makeRepo(roadmapLines) {
  const base = mkdtempSync(join(tmpdir(), "ai-native-start-unit-test-"));
  const dir = join(base, "repo");
  mkdirSync(dir);
  git(dir, "init", "-q");
  git(dir, "checkout", "-q", "-b", "main");
  git(dir, "config", "user.email", "tests@example.invalid");
  git(dir, "config", "user.name", "Tests");
  writeFileSync(join(dir, "ROADMAP.md"), roadmapLines.join("\n") + "\n", "utf8");
  git(dir, "add", "ROADMAP.md");
  git(dir, "commit", "-q", "-m", "roadmap");
  return { base, dir };
}

test("startWorkUnit (Feature) creates a worktree, branch and run directory", () => {
  const { base, dir } = makeRepo(["- [ ] 02-item-a - Uno"]);
  try {
    const result = startWorkUnit(dir, { mode: "Feature", slug: "02-item-a" });
    assert.ok(existsSync(result.worktreeDir));
    assert.equal(git(dir, "rev-parse", "--verify", "--quiet", "feature/02-item-a") ? true : false, true);
    assert.ok(existsSync(join(result.worktreeDir, "runs", "02-item-a")));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("startWorkUnit rejects an item that is not Pending", () => {
  const { base, dir } = makeRepo(["- [x] 02-item-a - Uno"]);
  try {
    assert.throws(() => startWorkUnit(dir, { mode: "Feature", slug: "02-item-a" }), /not pending/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("startWorkUnit rejects an item missing from ROADMAP.md", () => {
  const { base, dir } = makeRepo(["- [ ] 02-item-a - Uno"]);
  try {
    assert.throws(() => startWorkUnit(dir, { mode: "Feature", slug: "09-no-existe" }), /does not exist in ROADMAP\.md/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("startWorkUnit (Milestone) requires non-empty items and rejects Feature-mode items", () => {
  const { base, dir } = makeRepo(["- [ ] 02-item-a - Uno"]);
  try {
    assert.throws(() => startWorkUnit(dir, { mode: "Milestone", slug: "my-milestone", items: [] }), /required in Mode=Milestone/);
    assert.throws(() => startWorkUnit(dir, { mode: "Feature", slug: "02-item-a", items: ["02-item-a"] }), /does not apply in Mode=Feature/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("startWorkUnit (Milestone) rejects duplicate items", () => {
  const { base, dir } = makeRepo(["- [ ] 02-item-a - Uno", "- [ ] 03-item-b - Dos"]);
  try {
    assert.throws(() => startWorkUnit(dir, { mode: "Milestone", slug: "my-milestone", items: ["02-item-a", "02-item-a"] }), /duplicate items/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("startWorkUnit (Milestone) happy path writes a schema-valid work-unit.json manifest", () => {
  const { base, dir } = makeRepo(["- [ ] 02-item-a - Uno", "- [ ] 03-item-b - Dos"]);
  try {
    const result = startWorkUnit(dir, { mode: "Milestone", slug: "my-milestone", items: ["02-item-a", "03-item-b"] });
    const manifest = JSON.parse(readFileSync(join(result.worktreeDir, "runs", "milestone-my-milestone", "work-unit.json"), "utf8"));
    assert.deepEqual(manifest, { schemaVersion: 1, mode: "milestone", slug: "my-milestone", items: ["02-item-a", "03-item-b"] });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

// --- PAR-IDEMPOTENCY ---

test("starting the same item twice fails the second time (already claimed), without a second worktree", () => {
  const { base, dir } = makeRepo(["- [ ] 02-item-a - Uno"]);
  try {
    startWorkUnit(dir, { mode: "Feature", slug: "02-item-a" });
    assert.throws(() => startWorkUnit(dir, { mode: "Feature", slug: "02-item-a" }), /already claimed|already exists/);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a failed worktree creation releases the claim, so a retry is not permanently blocked", () => {
  const { base, dir } = makeRepo(["- [ ] 02-item-a - Uno"]);
  try {
    // Force `git worktree add -b feature/02-item-a ...` to fail for a
    // reason that only surfaces inside git itself (branch already
    // exists), i.e. *after* the claim has already been taken.
    git(dir, "branch", "feature/02-item-a");

    assert.throws(() => startWorkUnit(dir, { mode: "Feature", slug: "02-item-a" }), /git worktree add.*failed/);
    assert.equal(readClaims(dir).length, 0, "the claim must be released when worktree creation fails");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
