// v3.1.3 / N-02b: the persisted-state contract of the two journals.
//   adoption-journal.json  written by `consumer.mjs`; lists what the adoption created/adopted; its revert owns it
//   migration-journal.json written by `migrate apply`; lists what the migration created/retired; its revert owns it
// They are NOT redundant (each lists files the other does not) and neither may vanish on its own: a journal that a base
// branch had is persisted state, and a PR may drop it only together with the files it lists (the matching revert).
// Regression of the audit finding N-02b: both journals present, only the adoption journal deleted, L3 stayed green
// because "some journal exists" was a yes/no question instead of "is everything the base owned still owned".
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { applyConsumer } from "../adapters/consumer.mjs";
import { applyMigration, revertMigration } from "./migrate.mjs";
import { revertAdoption } from "./adopt.mjs";
import { detectDrift, planUpgrade, applyUpgrade } from "./upgrade-delta.mjs";
import { consumerFiles } from "../adapters/consumer.mjs";
import { checkTracking, checkPersistedState } from "./tracking.mjs";
import { readOwnership, JournalError, ADOPTION_JOURNAL, MIGRATION_JOURNAL } from "./journals.mjs";

const RELEASE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TOOLS = ["claude", "opencode", "codex"];
const RELEASE = { repo: "github:o/ai-native", version: "v3.1.3", commit: "a".repeat(40), digest: `sha256:${"1".repeat(64)}` };
const made = [];
after(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })));

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
const commitAll = (root, msg = "step") => {
  git(root, "add", "-A");
  git(root, "commit", "-q", "--allow-empty", "-m", msg);
};
/** the shape of gi-clinicadental: migrate apply wrote part of the projections, the adoption on top wrote the rest; both journals committed. Returns { root, base }. */
function both({ autocrlf = "false", migrateTools = ["codex"] } = {}) {
  const root = mkdtempSync(join(tmpdir(), "ai-native-journals-"));
  made.push(root);
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "t@example.invalid");
  git(root, "config", "user.name", "T");
  git(root, "config", "core.autocrlf", autocrlf);
  put(root, "README.md", "consumer\n");
  commitAll(root, "base");
  assert.equal(applyMigration({ target: root, release: RELEASE, tools: migrateTools, profile: "factory" }).status, "APPLIED");
  assert.equal(applyConsumer({ releaseRoot: RELEASE_ROOT, projectRoot: root, tools: TOOLS }).status, "APPLIED");
  commitAll(root, "adopt");
  return { root, base: git(root, "rev-parse", "HEAD") };
}
const drop = (root, ...rels) => {
  git(root, "rm", "-q", ...rels);
  git(root, "commit", "-q", "-m", `drop ${rels.join(" ")}`);
};
const state = (root, base) => checkPersistedState(root, { base });

test("CASE 1: both journals present and valid -> PASS (and they are not redundant)", () => {
  const { root, base } = both();
  assert.equal(checkTracking(root).status, "PASS");
  const s = state(root, base);
  assert.equal(s.status, "PASS", JSON.stringify(s));
  const own = readOwnership(root);
  assert.ok(own.hasAdoption && own.hasMigration);
  // each journal lists something the other does not: neither is derivable from the other
  assert.ok(Object.keys(own.migrationCreated).includes(".github/workflows/ai-native.yml") && !Object.keys({ ...own.created, ...own.adopted }).includes(".github/workflows/ai-native.yml"));
  assert.ok(Object.keys(own.created).length > 5, "the adoption journal owns files migrate apply did not write");
  assert.ok(Object.keys(own.migrationCreated).some((p) => p.startsWith(".codex/")) && !Object.keys(own.created).some((p) => p.startsWith(".codex/")));
});

test("CASE 2 / N02B_REPRODUCTION_TEST: deleting only the adoption journal while its files remain FAILS closed", () => {
  const { root, base } = both();
  const before = Object.keys(readOwnership(root).created);
  assert.ok(before.length > 5);
  drop(root, ADOPTION_JOURNAL);
  const own = readOwnership(root);
  assert.deepEqual([own.hasAdoption, own.hasMigration], [false, true]);
  assert.equal(checkTracking(root).status, "PASS", "the old question (\"is what is still journaled tracked?\") cannot see it: this is N-02b");
  const s = state(root, base);
  assert.equal(s.status, "FAIL", JSON.stringify(s));
  assert.ok(before.every((p) => s.lost.includes(p)), "every file the adoption journal owned is reported");
  assert.match(s.detail, /consumer\.mjs --revert/);
});

test("CASE 2b: when the migration journal still owns EVERY path of the adoption journal, deleting the latter loses nothing: PASS with that evidence", () => {
  const { root, base } = both({ migrateTools: TOOLS });
  const adoptionPaths = Object.keys({ ...readOwnership(root).created, ...readOwnership(root).adopted });
  const migrated = readOwnership(root).migrationCreated;
  assert.ok(adoptionPaths.length > 20 && adoptionPaths.every((p) => p in migrated), "fixture: the adoption journal is fully covered by the migration journal");
  drop(root, ADOPTION_JOURNAL);
  const s = state(root, base);
  assert.equal(s.status, "PASS", JSON.stringify(s));
  assert.equal(checkTracking(root).status, "PASS");
  assert.equal(readOwnership(root).hasAdoption, false);
});

test("CASE 3: deleting only the migration journal while its files remain FAILS closed", () => {
  const { root, base } = both();
  drop(root, MIGRATION_JOURNAL);
  const s = state(root, base);
  assert.equal(s.status, "FAIL", JSON.stringify(s));
  assert.ok(s.lost.includes(".github/workflows/ai-native.yml"), JSON.stringify(s.lost));
});

test("CASE 4: deleting both journals while the files remain FAILS closed", () => {
  const { root, base } = both();
  drop(root, ADOPTION_JOURNAL, MIGRATION_JOURNAL);
  const s = state(root, base);
  assert.equal(s.status, "FAIL", JSON.stringify(s));
  assert.ok(s.lost.length > 20);
});

test("CASE 4b: the real reverts (journal and its files go together) do not lose persisted state, in either order", () => {
  for (const order of ["adoption-first", "migration-first"]) {
    const { root, base } = both();
    if (order === "adoption-first") {
      assert.equal(revertAdoption(root).status, "REVERTED");
      commitAll(root, "revert adoption");
      const mid = state(root, base);
      assert.equal(mid.status, "PASS", `adoption reverted, migration journal still there: ${JSON.stringify(mid)}`);
      assert.equal(revertMigration({ target: root }).status, "REVERTED");
    } else {
      assert.equal(revertMigration({ target: root }).status, "REVERTED");
      commitAll(root, "revert migration");
      assert.equal(state(root, base).status, "PASS");
      assert.equal(revertAdoption(root).status, "REVERTED");
    }
    commitAll(root, "revert rest");
    const end = state(root, base);
    assert.equal(end.status, "PASS", JSON.stringify(end));
    assert.ok(!existsSync(join(root, ADOPTION_JOURNAL)) && !existsSync(join(root, MIGRATION_JOURNAL)));
  }
});

test("CASE 4c: no base (no history to compare) is NOT_APPLICABLE, never a pass of a missing journal", () => {
  const { root } = both();
  assert.equal(checkPersistedState(root, { base: null }).status, "NOT_APPLICABLE");
});

test("CASE 5 / JOURNAL_TRACKING_TEST: a journal on disk but not staged fails tracking (UNTRACKED), staged-but-uncommitted fails at HEAD", () => {
  const { root } = both();
  git(root, "rm", "-q", "--cached", ADOPTION_JOURNAL);
  let t = checkTracking(root);
  assert.equal(t.status, "FAIL");
  assert.ok(t.untracked.includes(ADOPTION_JOURNAL), JSON.stringify(t));
  git(root, "add", "-A");
  assert.equal(checkTracking(root).status, "PASS");
  git(root, "rm", "-q", "--cached", MIGRATION_JOURNAL);
  git(root, "commit", "-q", "-m", "migration journal left on disk only");
  t = checkTracking(root, { source: "head" });
  assert.equal(t.status, "FAIL");
  assert.ok(t.absent.includes(MIGRATION_JOURNAL) || t.untracked.includes(MIGRATION_JOURNAL), JSON.stringify(t));
});

test("CASE 6 / JOURNAL_TRACKING_TEST: a journal hidden by .gitignore fails closed (IGNORED), in either journal", () => {
  for (const journal of [ADOPTION_JOURNAL, MIGRATION_JOURNAL]) {
    const { root } = both();
    git(root, "rm", "-q", "--cached", journal);
    put(root, ".gitignore", `${journal}\n`);
    commitAll(root, "ignore the journal");
    const t = checkTracking(root);
    assert.equal(t.status, "FAIL", journal);
    assert.ok(t.ignored.includes(journal), JSON.stringify(t));
  }
});

test("CASE 7 / JOURNAL_CONTRACT_TEST: a corrupt or malformed journal fails closed with a typed error, never a silent empty set", () => {
  const shapes = [
    [ADOPTION_JOURNAL, "{ not json"],
    [ADOPTION_JOURNAL, "[]"],
    [ADOPTION_JOURNAL, JSON.stringify({ schemaVersion: 1, created: [], adopted: {}, skipped: [] })],
    [ADOPTION_JOURNAL, JSON.stringify({ schemaVersion: 1, created: { "a.md": 5 }, adopted: {}, skipped: [] })],
    [ADOPTION_JOURNAL, JSON.stringify({ schemaVersion: 1, created: {}, adopted: {}, skipped: "x" })],
    [MIGRATION_JOURNAL, "{ not json"],
    [MIGRATION_JOURNAL, JSON.stringify({ created: {} })],
    [MIGRATION_JOURNAL, JSON.stringify({ created: [{ path: 3 }] })],
  ];
  for (const [journal, text] of shapes) {
    const { root, base } = both();
    put(root, journal, text);
    assert.throws(() => readOwnership(root), JournalError, `${journal} <- ${text}`);
    assert.throws(() => checkTracking(root), JournalError);
    const s = state(root, base);
    assert.equal(s.status, "FAIL", `${journal} <- ${text}: ${JSON.stringify(s)}`);
    assert.ok(s.corrupt.length > 0);
  }
});

test("CASE 7b: a corrupt journal on the BASE branch fails closed too", () => {
  const { root } = both();
  put(root, ADOPTION_JOURNAL, "{ not json");
  commitAll(root, "corrupt base");
  const badBase = git(root, "rev-parse", "HEAD");
  git(root, "rm", "-q", ADOPTION_JOURNAL);
  git(root, "commit", "-q", "-m", "delete corrupt");
  const s = state(root, badBase);
  assert.equal(s.status, "FAIL", JSON.stringify(s));
});

test("CASE 8: a journal that does not match the files (stale baseline) is reported as edited/outdated, not as a clean pass", () => {
  const { root } = both();
  const j = JSON.parse(readFileSync(join(root, ADOPTION_JOURNAL), "utf8"));
  const first = Object.keys(j.created)[0];
  j.created[first] = `sha256:${"0".repeat(64)}`; // the recorded baseline is not the file's
  put(root, ADOPTION_JOURNAL, `${JSON.stringify(j, null, 2)}\n`);
  commitAll(root, "stale hash");
  // ownership (paths) is intact, so the persisted state is: a hash that disagrees with the file is indistinguishable from a legitimate
  // local edit, which the platform deliberately keeps (WARN in L3, keepLocal in upgrade) instead of failing
  assert.equal(checkTracking(root).status, "PASS");
  // the stale record is surfaced, never trusted: the upgrade re-records it from the bytes it finds (the file equals the release)
  const incoming = consumerFiles(RELEASE_ROOT, { tools: TOOLS });
  assert.ok(planUpgrade(root, incoming).refresh.includes(first));
  applyUpgrade(root, incoming);
  assert.equal(JSON.parse(readFileSync(join(root, ADOPTION_JOURNAL), "utf8")).created[first] === `sha256:${"0".repeat(64)}`, false);
});

test("CASE 9 / MIGRATE_JOURNAL_ROUNDTRIP_TEST: apply -> adopt -> revert -> apply keeps the contract at every step", () => {
  const { root, base } = both();
  assert.equal(state(root, base).status, "PASS");
  assert.equal(revertAdoption(root).status, "REVERTED");
  commitAll(root, "revert adoption");
  assert.equal(applyConsumer({ releaseRoot: RELEASE_ROOT, projectRoot: root, tools: TOOLS }).status, "APPLIED");
  commitAll(root, "adopt again");
  assert.equal(state(root, base).status, "PASS");
  assert.equal(checkTracking(root).status, "PASS");
  assert.equal(revertAdoption(root).status, "REVERTED");
  assert.equal(revertMigration({ target: root }).status, "REVERTED");
  commitAll(root, "revert all");
  assert.equal(state(root, base).status, "PASS");
  assert.equal(git(root, "ls-files", "ai-native.lock.json"), "");
});

test("CASE 10: --upgrade keeps persisted state: it only ever grows what the base owned, and the files it removes leave the tree", () => {
  const { root, base } = both();
  const files = consumerFiles(RELEASE_ROOT, { tools: TOOLS });
  // a release that no longer ships one projection and ships a new one
  const gone = Object.keys(readOwnership(root).created).find((p) => p.startsWith(".opencode/skills/"));
  const next = { ...files };
  delete next[gone];
  next[".claude/commands/brand-new.md"] = "new\n";
  const plan = planUpgrade(root, next);
  assert.ok(plan.remove.includes(gone) && plan.add.includes(".claude/commands/brand-new.md"), JSON.stringify(plan.summary));
  applyUpgrade(root, next);
  commitAll(root, "upgrade");
  const s = state(root, base);
  assert.equal(s.status, "PASS", JSON.stringify(s));
  assert.ok(!existsSync(join(root, gone)));
  assert.equal(checkTracking(root).status, "PASS");
});

test("CASE 10b: an upgrade that keeps an edited obsolete file still owns it (it stays journaled)", () => {
  const { root, base } = both();
  const files = consumerFiles(RELEASE_ROOT, { tools: TOOLS });
  const gone = Object.keys(readOwnership(root).created).find((p) => p.startsWith(".opencode/skills/"));
  put(root, gone, "edited by the project\n");
  commitAll(root, "local edit");
  const next = { ...files };
  delete next[gone];
  applyUpgrade(root, next);
  commitAll(root, "upgrade");
  assert.ok(existsSync(join(root, gone)), "an edited file is never removed");
  const s = state(root, base);
  assert.equal(s.status, "PASS", JSON.stringify(s));
});

test("CASE 11 / JOURNAL_CLEAN_CLONE_TEST: a clean clone receives exactly the persisted state, and the verdicts agree with the worktree", () => {
  const { root, base } = both();
  const clone = mkdtempSync(join(tmpdir(), "ai-native-journals-clone-"));
  made.push(clone);
  git(clone, "clone", "-q", root, ".");
  assert.deepEqual(git(clone, "ls-files").split("\n"), git(root, "ls-files").split("\n"));
  for (const j of [ADOPTION_JOURNAL, MIGRATION_JOURNAL]) assert.equal(readFileSync(join(clone, j), "utf8").replace(/\r\n/g, "\n"), readFileSync(join(root, j), "utf8").replace(/\r\n/g, "\n"));
  assert.equal(checkTracking(clone, { source: "head" }).status, "PASS");
  assert.equal(state(clone, base).status, "PASS");
  // the hiding PR is rejected identically in the clone
  drop(root, ADOPTION_JOURNAL);
  const hidden = mkdtempSync(join(tmpdir(), "ai-native-journals-clone-"));
  made.push(hidden);
  git(hidden, "clone", "-q", root, ".");
  assert.equal(state(hidden, base).status, "FAIL");
  assert.equal(state(root, base).status, "FAIL");
});

test("CASE 11b: CRLF checkout (core.autocrlf) is not a difference", () => {
  const { root, base } = both({ autocrlf: "true" });
  assert.equal(state(root, base).status, "PASS");
  assert.equal(checkTracking(root).status, "PASS");
});

test("CASE 12: files the project owns (never journaled, or skipped) never produce a finding", () => {
  const { root, base } = both();
  put(root, "src/app.js", "x\n");
  put(root, "docs/notes.md", "n\n");
  put(root, ".gitignore", "build/\nnode_modules/\n");
  put(root, "build/out.bin", "ignored\n");
  commitAll(root, "project work");
  rmSync(join(root, "src"), { recursive: true });
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "delete project code");
  const s = state(root, base);
  assert.equal(s.status, "PASS", JSON.stringify(s));
  assert.deepEqual(s.lost, []);
});

test("a path that leaves the project in the BASE journal is reported, never probed", () => {
  const { root } = both();
  const j = JSON.parse(readFileSync(join(root, ADOPTION_JOURNAL), "utf8"));
  j.created["../outside.txt"] = `sha256:${"0".repeat(64)}`;
  put(root, ADOPTION_JOURNAL, JSON.stringify(j));
  commitAll(root, "evil base");
  const evil = git(root, "rev-parse", "HEAD");
  const s = state(root, evil);
  assert.ok(s.status === "PASS" || s.status === "FAIL");
  assert.ok(!s.lost.includes("../outside.txt"));
});

// audit N-05: `consumer.mjs --revert` keeps the `adopted` files (they were the project's) and removes the journal
function adoptedRepo() {
  const root = mkdtempSync(join(tmpdir(), "ai-native-journals-"));
  made.push(root);
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "t@example.invalid");
  git(root, "config", "user.name", "T");
  put(root, "README.md", "consumer\n");
  put(root, "CLAUDE.md", consumerFiles(RELEASE_ROOT, { tools: TOOLS })["CLAUDE.md"]); // pre-existing and identical -> `adopted`
  commitAll(root, "base");
  assert.equal(applyConsumer({ releaseRoot: RELEASE_ROOT, projectRoot: root, tools: TOOLS }).status, "APPLIED");
  commitAll(root, "adopt");
  assert.ok("CLAUDE.md" in readOwnership(root).adopted && Object.keys(readOwnership(root).created).length > 5);
  return { root, base: git(root, "rev-parse", "HEAD") };
}

test("N-05: a real consumer --revert with an `adopted` file left behind is NOT a loss; deleting only the journal still is", () => {
  const { root, base } = adoptedRepo();
  assert.equal(revertAdoption(root).status, "REVERTED");
  assert.ok(existsSync(join(root, "CLAUDE.md")), "revert keeps the file the project already had");
  commitAll(root, "revert");
  const s = state(root, base);
  assert.equal(s.status, "PASS", JSON.stringify(s));
  const other = adoptedRepo();
  drop(other.root, ADOPTION_JOURNAL);
  const d = state(other.root, other.base);
  assert.equal(d.status, "FAIL", JSON.stringify(d));
  assert.ok(d.lost.includes("CLAUDE.md"), "with the created files still there, the adopted file is owed too");
});

test("N-06: an unreadable base fails closed, and a journal that is a directory is a JournalError", () => {
  const { root } = both();
  for (const bad of ["0".repeat(40), "no-such-branch", "--help"]) {
    const s = state(root, bad);
    assert.equal(s.status, "FAIL", bad);
    assert.match(s.detail, /cannot be read/);
  }
  rmSync(join(root, MIGRATION_JOURNAL));
  mkdirSync(join(root, MIGRATION_JOURNAL));
  assert.throws(() => readOwnership(root), JournalError);
});
