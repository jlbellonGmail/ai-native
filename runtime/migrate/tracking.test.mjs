// v3.1.2: a managed file must be part of the state a clean clone gets, not just of the working tree that ran the
// adoption. Regression of the gi-clinicadental escape: `.codex/.gitignore` ignored two projected files, `git add -A`
// skipped them, and every gate looked at the working tree (or only warned).
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { applyConsumer, planConsumer, consumerFiles } from "../adapters/consumer.mjs";
import { applyMigration, revertMigration, planMigration, JOURNAL as MIGRATION_JOURNAL } from "./migrate.mjs";
import { revertAdoption } from "./adopt.mjs";
import { detectDrift, planUpgrade } from "./upgrade-delta.mjs";
import { checkTracking } from "./tracking.mjs";

const RELEASE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TOOLS = ["claude", "opencode", "codex"];
const RELEASE = { repo: "github:o/ai-native", version: "v3.1.2", commit: "a".repeat(40), digest: `sha256:${"1".repeat(64)}` };
const TARGET = ".codex/builder.config.toml";
const made = [];
after(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })));

// Windows (antivirus / indexer) intermittently denies git writing a loose object in a fresh temp repo: retry only that, a few times
const git = (cwd, ...a) => {
  for (let attempt = 1; ; attempt++) {
    try {
      return execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    } catch (error) {
      if (attempt >= 4 || !/Permission denied/.test(String(error.stderr))) throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200 * attempt);
    }
  }
};
const put = (root, rel, text) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
};
function repo({ autocrlf = "false", files = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), "ai-native-tracking-"));
  made.push(root);
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "t@example.invalid");
  git(root, "config", "user.name", "T");
  git(root, "config", "core.autocrlf", autocrlf);
  put(root, "README.md", "consumer\n");
  for (const [rel, text] of Object.entries(files)) put(root, rel, text);
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "base");
  return root;
}
const commitAll = (root) => {
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "adopt");
};
/** The `.gitignore` shape of gi-clinicadental: an allowlist under .codex/ that does not know the two projected files. */
const CODEX_ALLOWLIST = "*\n!.gitignore\n!README.md\n!config.toml\n!*-agent.config.toml\n!planner.config.toml\n";
const adopt = (root) => applyConsumer({ releaseRoot: RELEASE_ROOT, projectRoot: root, tools: TOOLS });

test("CASE 1: a projected file ignored by .gitignore is IGNORED and the check fails closed", () => {
  const root = repo({ files: { ".codex/.gitignore": CODEX_ALLOWLIST } });
  assert.equal(adopt(root).status, "APPLIED");
  assert.ok(existsSync(join(root, TARGET)), "the working tree has the file (this is why a working-tree check passes)");
  commitAll(root); // git add -A silently skips it
  assert.equal(git(root, "ls-files", TARGET), "");
  assert.equal(detectDrift(root, consumerFiles(RELEASE_ROOT, { tools: TOOLS })).status, "CLEAN", "the old drift only reads the working tree");
  const t = checkTracking(root);
  assert.equal(t.status, "FAIL");
  assert.ok(t.ignored.includes(TARGET) && t.ignored.includes(".codex/reviewer.config.toml"), JSON.stringify(t));
  assert.deepEqual(t.untracked, []);
});

test("CASE 1b: once .gitignore has the exception, the same adoption passes", () => {
  const root = repo({ files: { ".codex/.gitignore": `${CODEX_ALLOWLIST}!builder.config.toml\n!reviewer.config.toml\n` } });
  adopt(root);
  commitAll(root);
  const t = checkTracking(root);
  assert.equal(t.status, "PASS", JSON.stringify(t));
  assert.equal(git(root, "ls-files", TARGET), TARGET);
});

test("CASE 2: files written by migrate apply but never staged are UNTRACKED, and the migration journal alone covers them", () => {
  const root = repo();
  const r = applyMigration({ target: root, release: RELEASE, tools: TOOLS, profile: "factory" });
  assert.equal(r.status, "APPLIED");
  assert.ok(!existsSync(join(root, ".ai-native/adoption-journal.json")), "migrate apply writes no adoption journal: only the migration journal covers its files");
  const t = checkTracking(root);
  assert.equal(t.status, "FAIL");
  assert.ok(t.untracked.includes(TARGET), JSON.stringify(t));
  assert.ok(t.untracked.includes("ai-native.lock.json"));
  assert.ok(t.untracked.includes(MIGRATION_JOURNAL));
  commitAll(root);
  assert.equal(checkTracking(root).status, "PASS");
});

test("CASE 2b: migrate refuses to write a file the repo ignores (before touching anything) and reverts cleanly after the fix", () => {
  const root = repo({ files: { ".codex/.gitignore": CODEX_ALLOWLIST } });
  const planned = planMigration({ target: root, release: RELEASE, tools: TOOLS });
  assert.ok(planned.ignored.includes(TARGET), JSON.stringify(planned.ignored));
  const r = applyMigration({ target: root, release: RELEASE, tools: TOOLS });
  assert.equal(r.status, "BLOCKED");
  assert.equal(r.reason, "ignored");
  assert.ok(!existsSync(join(root, "ai-native.lock.json")), "nothing was written");
  assert.equal(git(root, "status", "--porcelain"), "");
  put(root, ".codex/.gitignore", `${CODEX_ALLOWLIST}!builder.config.toml\n!reviewer.config.toml\n`);
  git(root, "commit", "-qam", "allow projected files");
  assert.equal(applyMigration({ target: root, release: RELEASE, tools: TOOLS }).status, "APPLIED");
  commitAll(root);
  assert.equal(checkTracking(root).status, "PASS");
  // round trip: revert removes exactly what apply created
  assert.equal(revertMigration({ target: root }).status, "REVERTED");
  assert.ok(!existsSync(join(root, TARGET)) && !existsSync(join(root, MIGRATION_JOURNAL)));
});

test("CASE 3: tracked, byte-identical managed files pass and the clean clone agrees", () => {
  const root = repo();
  adopt(root);
  commitAll(root);
  const t = checkTracking(root);
  assert.equal(t.status, "PASS", JSON.stringify(t));
  assert.ok(t.managed > 20);
  assert.deepEqual([t.ignored, t.untracked, t.absent, t.divergent], [[], [], [], []]);
});

test("CASE 4: a file the project deliberately keeps (skipped, even if ignored) is not managed and does not fail", () => {
  const root = repo({ files: { ".codex/.gitignore": CODEX_ALLOWLIST, [TARGET]: "mine = true\n" } });
  git(root, "add", "-f", ".");
  git(root, "commit", "-qm", "own builder config");
  git(root, "rm", "-q", "--cached", TARGET);
  git(root, "commit", "-qm", "untrack (ignored by rule)");
  assert.equal(git(root, "ls-files", TARGET), "");
  assert.equal(adopt(root).status, "BLOCKED", "the differing file is a collision");
  const r = applyConsumer({ releaseRoot: RELEASE_ROOT, projectRoot: root, tools: TOOLS, skip: [TARGET] });
  assert.equal(r.status, "APPLIED");
  assert.ok(r.skipped.includes(TARGET));
  commitAll(root);
  const t = checkTracking(root);
  assert.equal(t.status, "FAIL", "the OTHER ignored projected file (reviewer.config.toml) still fails");
  assert.deepEqual(t.ignored, [".codex/reviewer.config.toml"]);
  assert.ok(!t.ignored.includes(TARGET));
});

test("CASE 5: an optional, unmanaged ignored file is not a false positive", () => {
  const root = repo({ files: { ".gitignore": "node_modules/\ndist/\n*.log\n" } });
  adopt(root);
  put(root, "node_modules/x/index.js", "x");
  put(root, "dist/app.js", "x");
  put(root, "debug.log", "x");
  commitAll(root);
  assert.equal(checkTracking(root).status, "PASS");
});

test("CASE 6: the clean clone of the committed state gets exactly the verdict the working tree got (good and bad)", () => {
  const good = repo();
  adopt(good);
  commitAll(good);
  const bad = repo({ files: { ".codex/.gitignore": CODEX_ALLOWLIST } });
  adopt(bad);
  commitAll(bad);
  for (const [root, expected] of [[good, "PASS"], [bad, "FAIL"]]) {
    const clone = mkdtempSync(join(tmpdir(), "ai-native-clone-"));
    made.push(clone);
    git(clone, "clone", "-q", root, ".");
    const here = checkTracking(root);
    const there = checkTracking(clone);
    assert.equal(here.status, expected);
    assert.equal(there.status, expected, "VALIDATED_WORKTREE == REPRODUCIBLE_CLEAN_CLONE");
    if (expected === "FAIL") assert.ok(there.absent.includes(TARGET), "in the clone the ignored file is simply absent");
    else assert.equal(planUpgrade(clone, consumerFiles(RELEASE_ROOT, { tools: TOOLS })).summary.add, 0);
  }
});

test("CASE 6b: a managed file edited after staging differs from what a clean clone gets (UNSTAGED) and fails", () => {
  const root = repo();
  adopt(root);
  commitAll(root);
  put(root, ".claude/commands/feature.md", "edited after the commit\n");
  const t = checkTracking(root);
  assert.equal(t.status, "FAIL");
  assert.deepEqual(t.divergent, [".claude/commands/feature.md"]);
  assert.equal(checkTracking(root, { source: "head" }).status, "FAIL");
});

test("CRLF: a checkout with core.autocrlf=true (worktree CRLF, index LF) is the same state; a real edit is not", () => {
  const root = repo({ autocrlf: "true" });
  adopt(root);
  commitAll(root);
  const file = join(root, ".claude/commands/feature.md");
  writeFileSync(file, readFileSync(file, "utf8").replaceAll("\r\n", "\n").replaceAll("\n", "\r\n"));
  assert.equal(checkTracking(root).status, "PASS", "line endings alone are not a difference");
  writeFileSync(file, `${readFileSync(file, "utf8")}extra\r\n`);
  assert.equal(checkTracking(root).status, "FAIL");
});

test("source=head judges the commit, not the index: staged-but-uncommitted managed files fail", () => {
  const root = repo();
  adopt(root);
  git(root, "add", "-A");
  assert.equal(checkTracking(root).status, "PASS");
  const t = checkTracking(root, { source: "head" });
  assert.equal(t.status, "FAIL");
  assert.ok(t.untracked.includes(TARGET), "staged but not in any commit: a clone of HEAD does not have it");
});

test("a directory that is not a git repository is NOT_APPLICABLE, never a silent PASS of a repo", () => {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-nogit-"));
  made.push(dir);
  adopt(dir);
  // the temp dir may itself sit inside some unrelated repository (a home directory that is a repo): stop git from looking up
  const ceiling = process.env.GIT_CEILING_DIRECTORIES;
  process.env.GIT_CEILING_DIRECTORIES = dirname(dir);
  let t;
  try { t = checkTracking(dir); } finally { if (ceiling === undefined) delete process.env.GIT_CEILING_DIRECTORIES; else process.env.GIT_CEILING_DIRECTORIES = ceiling; }
  assert.equal(t.status, "NOT_APPLICABLE");
  assert.match(t.detail, /not a git repository/);
});

test("adoption keeps covering a file that was already there and identical (e.g. written by migrate apply): `adopted`, not `skipped`", () => {
  const root = repo();
  const files = consumerFiles(RELEASE_ROOT, { tools: TOOLS });
  for (const rel of [TARGET, ".mcp.json"]) put(root, rel, files[rel]);
  const r = adopt(root);
  assert.equal(r.status, "APPLIED");
  const journal = JSON.parse(readFileSync(join(root, ".ai-native/adoption-journal.json"), "utf8"));
  assert.deepEqual(Object.keys(journal.adopted).sort(), [TARGET, ".mcp.json"].sort());
  assert.deepEqual(journal.skipped, []);
  assert.ok(!(TARGET in journal.created));
  // an identical pre-existing file is not removed by revert (it was not ours to delete)
  revertAdoption(root);
  assert.ok(existsSync(join(root, TARGET)));
  // and a previous release's pristine file would be updated by --upgrade because it is covered
  const again = repo();
  put(again, TARGET, files[TARGET]);
  adopt(again);
  const plan = planUpgrade(again, { ...files, [TARGET]: "new release content\n" });
  assert.deepEqual(plan.update, [TARGET]);
});

test("legacy journals (identical files recorded as `skipped` after migrate apply) are healed from the migration journal", () => {
  const root = repo();
  const files = consumerFiles(RELEASE_ROOT, { tools: TOOLS });
  applyMigration({ target: root, release: RELEASE, tools: TOOLS });
  // what the v3.1.1 adoption wrote: every migrate-created projection as `skipped`, none as created
  const legacy = { schemaVersion: 1, created: {}, skipped: Object.keys(files).sort() };
  put(root, ".ai-native/adoption-journal.json", `${JSON.stringify(legacy, null, 2)}\n`);
  const plan = planUpgrade(root, { ...files, [TARGET]: "new release content\n" });
  assert.deepEqual(plan.update, [TARGET], "a pristine legacy-skipped file is upgradable");
  // a legacy-skipped file the project edited stays the project's: still preserved, never drift
  put(root, ".mcp.json", "{ \"mine\": true }\n");
  const edited = planUpgrade(root, files);
  assert.ok(edited.keepSkipped.includes(".mcp.json"));
  assert.equal(detectDrift(root, files).status, "CLEAN");
});

test("consumer.mjs --drift fails closed on the escape (CLEAN projections, but not reproducible) and passes once fixed; apply says so immediately", () => {
  const cli = join(RELEASE_ROOT, "runtime", "adapters", "consumer.mjs");
  const run = (root, ...args) => {
    try {
      return { code: 0, out: execFileSync(process.execPath, [cli, "--project", root, "--tool", "claude", "--tool", "opencode", "--tool", "codex", "--json", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) };
    } catch (error) {
      return { code: error.status, out: String(error.stdout) };
    }
  };
  const root = repo({ files: { ".codex/.gitignore": CODEX_ALLOWLIST } });
  const applied = run(root);
  assert.equal(applied.code, 1, "apply reports the ignored file right away");
  assert.match(applied.out, /IGNORED_REQUIRED_FILE/);
  commitAll(root);
  const drift = run(root, "--drift");
  assert.equal(drift.code, 1);
  assert.match(drift.out, /MANAGED_FILE_NOT_REPRODUCIBLE/);
  assert.match(drift.out, /\.codex\/builder\.config\.toml/);
  assert.match(JSON.parse(drift.out).adoption.status, /DRIFT/);
  put(root, ".codex/.gitignore", `${CODEX_ALLOWLIST}!builder.config.toml\n!reviewer.config.toml\n`);
  commitAll(root);
  const fixed = run(root, "--drift");
  assert.equal(fixed.code, 0, fixed.out);
  assert.equal(JSON.parse(fixed.out).adoption.status, "CLEAN");
  assert.equal(JSON.parse(fixed.out).adoption.tracking.status, "PASS");
});
