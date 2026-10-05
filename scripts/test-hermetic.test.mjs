import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hermeticEnv, testFiles } from "./test-hermetic.mjs";

const git = (cwd, env, ...args) => spawnSync("git", args, { cwd, env, encoding: "utf8" });

// F-05: an ancestor git repository (a user HOME that is a repo) makes every temp dir that was never `git init`ed
// resolve to THAT repository, so concurrent tests cross-contaminate. Simulate it: fake HOME is a repo, the temp root lives under it.
function fakeHome() {
  const home = realpathSync(mkdtempSync(join(tmpdir(), "hermetic-home-")));
  assert.equal(git(home, process.env, "init", "-q", ".").status, 0);
  const tmp = join(home, "AppData", "Temp");
  mkdirSync(join(tmp, "child"), { recursive: true });
  return { home, tmp, child: join(tmp, "child") };
}

test("WITHOUT the ceiling a temp dir under a repo HOME resolves to the HOME repository (the F-05 hazard)", () => {
  const { home, child } = fakeHome();
  try {
    const env = { ...process.env };
    delete env.GIT_CEILING_DIRECTORIES;
    const r = git(child, env, "rev-parse", "--show-toplevel");
    assert.equal(r.status, 0, "precondition: the hazard must be reproducible");
    assert.equal(realpathSync(r.stdout.trim()), home);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("hermeticEnv sets GIT_CEILING_DIRECTORIES so the same temp dir is NOT inside any repository", () => {
  const { home, tmp, child } = fakeHome();
  try {
    const env = hermeticEnv({ ...process.env }, tmp);
    const r = git(child, env, "rev-parse", "--show-toplevel");
    assert.notEqual(r.status, 0, `expected "not a git repository", got toplevel ${r.stdout}`);
    // a repo created INSIDE the temp root still works (tests init their own repos there)
    assert.equal(git(child, env, "init", "-q", ".").status, 0);
    assert.equal(realpathSync(git(child, env, "rev-parse", "--show-toplevel").stdout.trim()), realpathSync(child));
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("hermeticEnv keeps an existing ceiling list and does not duplicate the temp root", () => {
  const sep = process.platform === "win32" ? ";" : ":";
  const once = hermeticEnv({ GIT_CEILING_DIRECTORIES: `/opt/x${sep}/opt/y` }, "/tmp/t");
  assert.equal(once.GIT_CEILING_DIRECTORIES, `/opt/x${sep}/opt/y${sep}/tmp/t`);
  const twice = hermeticEnv(once, "/tmp/t");
  assert.equal(twice.GIT_CEILING_DIRECTORIES, once.GIT_CEILING_DIRECTORIES);
});

test("hermeticEnv also isolates from the user's global/system git config", () => {
  const env = hermeticEnv({ HOME: "/home/u" }, "/tmp/t");
  assert.equal(env.GIT_CONFIG_NOSYSTEM, "1");
  assert.equal(env.GIT_TERMINAL_PROMPT, "0");
});

test("testFiles excludes legacy/ and lists only *.test.mjs", () => {
  const files = testFiles(["a/b.test.mjs", "legacy/x/y.test.mjs", "README.md", "c.test.mjs"]);
  assert.deepEqual(files, ["a/b.test.mjs", "c.test.mjs"]);
});
