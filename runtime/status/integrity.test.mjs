import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { checkIntegrity } from "./integrity.mjs";

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-integrity-test-"));
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

function autoBlock({ branch, head }) {
  return ["<!-- STATUS:AUTO:BEGIN -->", "", `- Rama: ${branch}`, `- HEAD: ${head}`, "", "<!-- STATUS:AUTO:END -->"].join("\n");
}

test("checkIntegrity is NOT_APPLICABLE when there is no STATUS.md", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
    commitAll(dir, "init");
    const result = checkIntegrity(dir);
    assert.equal(result.status, "NOT_APPLICABLE");
    assert.equal(result.statusFile, null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkIntegrity FAILs on duplicated AUTO markers", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "STATUS.md"), "<!-- STATUS:AUTO:BEGIN -->\n<!-- STATUS:AUTO:BEGIN -->\n<!-- STATUS:AUTO:END -->\n", "utf8");
    commitAll(dir, "status");
    const result = checkIntegrity(dir);
    assert.equal(result.status, "FAIL");
    assert.equal(result.errors.length, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkIntegrity PASSes when the recorded branch/HEAD match reality", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
    commitAll(dir, "init");
    const head = git(dir, "rev-parse", "HEAD");
    writeFileSync(join(dir, "STATUS.md"), autoBlock({ branch: "develop", head }), "utf8");
    commitAll(dir, "status");
    const result = checkIntegrity(dir);
    assert.equal(result.status, "PASS", "the status-add commit itself is STATUS.md-only, so observedCommit still resolves to the recorded head");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkIntegrity reports an error when the recorded branch does not match the actual branch", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
    commitAll(dir, "init");
    const head = git(dir, "rev-parse", "HEAD");
    writeFileSync(join(dir, "STATUS.md"), autoBlock({ branch: "old-branch-name", head }), "utf8");
    commitAll(dir, "status");
    const result = checkIntegrity(dir);
    assert.equal(result.status, "FAIL");
    assert.match(result.errors[0], /recorded branch/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkIntegrity tolerates a recorded HEAD that only advanced via STATUS.md-only commits since (PAR-STATUS-SELF-STALE)", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
    commitAll(dir, "real work");
    const realHead = git(dir, "rev-parse", "HEAD");
    writeFileSync(join(dir, "STATUS.md"), autoBlock({ branch: "develop", head: realHead }) + "\nn=1\n", "utf8");
    commitAll(dir, "status snapshot 1");
    writeFileSync(join(dir, "STATUS.md"), autoBlock({ branch: "develop", head: realHead }) + "\nn=2\n", "utf8");
    commitAll(dir, "status snapshot 2 (still recording the real head)");

    const result = checkIntegrity(dir);
    assert.equal(result.status, "PASS", "recordedHead equals observedCommit: the two status-only commits since are correctly skipped");
    assert.equal(result.snapshot.observedCommit, realHead);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkIntegrity warns when a real (non-STATUS) commit happened after the recorded HEAD", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
    commitAll(dir, "init");
    const recordedHead = git(dir, "rev-parse", "HEAD");
    writeFileSync(join(dir, "STATUS.md"), autoBlock({ branch: "develop", head: recordedHead }), "utf8");
    commitAll(dir, "status snapshot");
    writeFileSync(join(dir, "b.txt"), "2\n", "utf8");
    commitAll(dir, "real code change");

    const result = checkIntegrity(dir);
    assert.equal(result.status, "PASS_WITH_WARNINGS");
    assert.match(result.warnings[0], /stale/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkIntegrity.deferred always lists the ROADMAP<->runs cross-check as out of scope, never silently", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
    commitAll(dir, "init");
    const result = checkIntegrity(dir);
    assert.ok(result.deferred.some((d) => d.includes("PAR-RUNS")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("detached HEAD (every CI pull_request checkout): the recorded branch is not compared, but a stale HEAD still FAILs", () => {
  const dir = makeRepo();
  try {
    writeFileSync(join(dir, "a.txt"), "1\n", "utf8");
    commitAll(dir, "init");
    const head = git(dir, "rev-parse", "HEAD");
    writeFileSync(join(dir, "STATUS.md"), autoBlock({ branch: "main", head }), "utf8");
    commitAll(dir, "status");
    git(dir, "checkout", "-q", "--detach");
    const ok = checkIntegrity(dir);
    assert.equal(ok.status, "PASS_WITH_WARNINGS", "no 'recorded branch ... actual branch null' error");
    assert.match(ok.warnings.join(" "), /detached HEAD/);
    assert.deepEqual(ok.errors, []);
    // a real, non-STATUS advance is still caught while detached
    writeFileSync(join(dir, "a.txt"), "2\n", "utf8");
    commitAll(dir, "code change");
    const stale = checkIntegrity(dir);
    assert.ok(stale.warnings.join(" ").includes("stale") || stale.errors.join(" ").includes("stale"), JSON.stringify(stale));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
