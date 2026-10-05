// `migrate` v2 -> v3, on a REAL v2 consumer (template-starter v2.0.4, pinned by SHA; needs github.com: SKIPs locally,
// FAILS with AI_NATIVE_REQUIRE_NETWORK=1) plus synthetic edge cases that do not need the network.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { globToRegExp } from "../gates/control-plane.mjs";
import { planMigration, applyMigration, revertMigration, MigrateError, JOURNAL, PROTECTED, PLATFORM_OWNED } from "./migrate.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const RELEASE = { repo: "github:jlbellonGmail/ai-native", version: "v3.0.0-rc.1", commit: "99f23f440544bb22bac7179d34b7d5c4e6a1143e", digest: `sha256:${"2".repeat(64)}` };
const STARTER = "https://github.com/jlbellonGmail/template-starter.git";
const STARTER_V204 = "9e7dfb5b82ca69a0dd878c719f5861816652780b";
const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }).trim();
const base = mkdtempSync(join(tmpdir(), "ai-native-migv2-"));
after(() => rmSync(base, { recursive: true, force: true, maxRetries: 3 }));

let starter = null;
try {
  starter = join(base, "starter");
  execFileSync("git", ["clone", "-q", "--no-checkout", STARTER, starter], { stdio: "pipe" });
  git(starter, "checkout", "-q", "--detach", STARTER_V204);
} catch (error) {
  starter = null;
  if (process.env.AI_NATIVE_REQUIRE_NETWORK === "1") throw error;
}
const net = { skip: starter ? false : "github.com not reachable (set AI_NATIVE_REQUIRE_NETWORK=1 to make this a failure)", timeout: 280000 };
const status = (dir) => git(dir, "status", "--porcelain", "--untracked-files=all");

test("real starter v2.0.4: plan is read-only, classifies everything, retires only platform-owned IDENTICAL files", net, () => {
  const plan = planMigration({ target: starter, release: RELEASE });
  assert.equal(status(starter), "", "plan writes nothing");
  assert.equal(plan.counts.UNKNOWN, 0);
  assert.equal(plan.counts.IDENTICAL_TO_TEMPLATE + plan.counts.MODIFIED_FROM_TEMPLATE, 175);
  assert.ok(plan.retire.length > 50);
  for (const r of plan.retire) {
    assert.ok(PLATFORM_OWNED.some((g) => globToRegExp(g).test(r.path)), `${r.path} is not platform-owned`);
    assert.ok(!PROTECTED.some((g) => globToRegExp(g).test(r.path)), `${r.path} is protected`);
  }
  // protected and product-owned content is never in the retire list
  for (const never of ["ROADMAP.md", "STATUS.md", "README.md", "AGENTS.md", "docs/tecnica/arquitectura.md", ".audit/reports/README.md"]) assert.ok(!plan.retire.some((r) => r.path === never), never);
  // the v2 post-HITL gate (vulnerable in v2.0.5, identical here) is retired; the MODIFIED variant would be kept
  assert.ok(!plan.retire.some((r) => r.path === ".github/workflows/post-hitl-merge-gate.yml"), "it is MODIFIED in the starter, so it must be KEPT, never retired");
  assert.ok(plan.keptLocal.some((f) => f.path === ".github/workflows/post-hitl-merge-gate.yml"));
});

test("real starter v2.0.4: apply -> only the migration changes the tree -> revert gives a byte-identical clean tree", net, () => {
  const head = git(starter, "rev-parse", "HEAD");
  const applied = applyMigration({ target: starter, release: RELEASE });
  assert.equal(applied.status, "APPLIED", JSON.stringify(applied.plan?.unresolved));
  assert.ok(applied.removed.length > 50);
  assert.ok(existsSync(join(starter, "ai-native.lock.json")));
  assert.ok(existsSync(join(starter, ".github", "workflows", "ai-native.yml")));
  assert.match(readFileSync(join(starter, ".github", "workflows", "ai-native.yml"), "utf8"), new RegExp(`l3-consumer\\.yml@${RELEASE.commit}`));
  // nothing the user owns was touched
  for (const kept of ["ROADMAP.md", "STATUS.md", "README.md", "AGENTS.md", ".audit/reports/README.md"]) assert.ok(existsSync(join(starter, kept)), `${kept} must survive`);
  assert.equal(git(starter, "diff", "--name-only", "--", "ROADMAP.md", "STATUS.md", "README.md", "AGENTS.md"), "", "protected/product files are untouched");
  assert.ok(existsSync(join(starter, JOURNAL)));
  // a second apply is refused
  assert.throws(() => applyMigration({ target: starter, release: RELEASE }), /journal already exists|working tree is not clean/);

  const reverted = revertMigration({ target: starter });
  assert.equal(reverted.status, "REVERTED");
  assert.equal(status(starter), "", "revert leaves git status clean");
  assert.equal(git(starter, "rev-parse", "HEAD"), head);
  assert.equal(git(starter, "diff", "--stat", "HEAD"), "", "and the tree is byte-identical to the base");
});

test("real starter v2.0.4: a user edit made after apply survives revert (PARTIAL), and the journal is kept", net, () => {
  applyMigration({ target: starter, release: RELEASE });
  writeFileSync(join(starter, "ai-native.lock.json"), `${readFileSync(join(starter, "ai-native.lock.json"), "utf8")}\n`);
  const r = revertMigration({ target: starter });
  assert.equal(r.status, "PARTIAL");
  assert.deepEqual(r.kept, ["ai-native.lock.json"]);
  assert.ok(existsSync(join(starter, JOURNAL)));
  // finish: restore the byte and revert for real, leaving the clone clean for later tests
  writeFileSync(join(starter, "ai-native.lock.json"), readFileSync(join(starter, "ai-native.lock.json"), "utf8").slice(0, -1));
  assert.equal(revertMigration({ target: starter }).status, "REVERTED");
  assert.equal(status(starter), "");
});

// ---------- synthetic cases (no network): they pin the safety rules independently of the starter
function repo(files) {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-migsyn-"));
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.email", "t@example.invalid");
  git(dir, "config", "user.name", "T");
  for (const [p, c] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), c);
  }
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "base");
  return dir;
}

test("a dirty tree and an empty/unknown repo are refused before anything is written", () => {
  const dir = repo({ "a.txt": "x\n" });
  writeFileSync(join(dir, "a.txt"), "changed\n");
  assert.throws(() => planMigration({ target: dir, release: RELEASE }), /not clean/);
  assert.throws(() => revertMigration({ target: repo({ "b.txt": "1" }) }), MigrateError);
});

test("a LOCAL v2-style file that a v3 file would overwrite is a collision that BLOCKS; --keep records the decision and leaves it alone", () => {
  const dir = repo({ "CLAUDE.md": "my own claude rules\n", "src/app.js": "1\n" });
  const plan = planMigration({ target: dir, release: RELEASE, tools: ["claude"] });
  assert.ok(plan.collisions.some((c) => c.path === "CLAUDE.md"), JSON.stringify(plan.collisions));
  assert.equal(plan.blocked, true);
  const blocked = applyMigration({ target: dir, release: RELEASE, tools: ["claude"] });
  assert.equal(blocked.status, "BLOCKED");
  assert.equal(status(dir), "", "blocked apply writes nothing");
  const kept = applyMigration({ target: dir, release: RELEASE, tools: ["claude"], keep: ["CLAUDE.md"] });
  assert.equal(kept.status, "APPLIED");
  assert.equal(readFileSync(join(dir, "CLAUDE.md"), "utf8"), "my own claude rules\n");
  assert.equal(revertMigration({ target: dir }).status, "REVERTED");
  assert.equal(status(dir), "");
  assert.equal(readFileSync(join(dir, "src", "app.js"), "utf8"), "1\n");
});

test("runs/, .audit/, ROADMAP.md, STATUS.md and docs/producto are never retired or touched, even when they look platform-owned", () => {
  const dir = repo({ "runs/v2.0.0/x/SUMMARY.md": "s\n", ".audit/reports/r.md": "r\n", "ROADMAP.md": "- [ ] a\n", "STATUS.md": "s\n", "docs/producto/contexto-producto.md": "p\n", "notes.md": "n\n" });
  const plan = planMigration({ target: dir, release: RELEASE, tools: ["claude"] });
  for (const p of ["runs/v2.0.0/x/SUMMARY.md", ".audit/reports/r.md", "ROADMAP.md", "STATUS.md", "docs/producto/contexto-producto.md"]) {
    assert.ok(!plan.retire.some((r) => r.path === p) && !plan.keptLocal.some((f) => f.path === p) && !plan.keptIdentical.some((f) => f.path === p), `${p} is out of scope for the migration`);
  }
});

test("a file edited and committed after the plan is MODIFIED at apply time: it is never retired and survives apply and revert", net, () => {
  const plan = planMigration({ target: starter, release: RELEASE });
  const victim = plan.retire.at(-1).path;
  const edited = `${readFileSync(join(starter, victim), "utf8")}\nedited after the plan\n`;
  writeFileSync(join(starter, victim), edited);
  git(starter, "add", "-A");
  git(starter, "-c", "user.name=t", "-c", "user.email=t@example.invalid", "commit", "-q", "-m", "edit after plan");
  const replan = planMigration({ target: starter, release: RELEASE });
  assert.ok(!replan.retire.some((r) => r.path === victim), "a modified file is never retired");
  assert.equal(applyMigration({ target: starter, release: RELEASE }).status, "APPLIED");
  assert.equal(readFileSync(join(starter, victim), "utf8"), edited, "the user's edit survived apply");
  assert.equal(revertMigration({ target: starter }).status, "REVERTED");
  assert.equal(readFileSync(join(starter, victim), "utf8"), edited, "and revert");
  git(starter, "reset", "-q", "--hard", STARTER_V204);
  assert.equal(status(starter), "");
});

test("a failure DURING apply (after deletions started) rolls back through the journal that was written first", net, () => {
  const boom = new Error("injected failure after the retire phase");
  assert.throws(() => applyMigration({ target: starter, release: RELEASE, hooks: { afterRetire: () => { throw boom; } } }), /injected failure/);
  assert.ok(!existsSync(join(starter, JOURNAL)), "a clean rollback removes its journal");
  assert.equal(status(starter), "", "the tree is exactly as before the apply: no deletions, no v3 files");
});

test("apply is all-or-nothing on a bad release: a lock that does not validate leaves the tree untouched", () => {
  const dir = repo({ "scripts/a.ps1": "x\n", "notes.md": "n\n" });
  const before = git(dir, "status", "--porcelain", "--untracked-files=all");
  assert.throws(() => applyMigration({ target: dir, release: { ...RELEASE, commit: "not-a-sha" }, tools: ["claude"] }), /does not validate/, "rejected by the lock validation, before any mutation");
  assert.equal(git(dir, "status", "--porcelain", "--untracked-files=all"), before);
  assert.equal(existsSync(join(dir, JOURNAL)), false);
});

test("revert never overwrites a file the user created at a retired path after apply", net, () => {
  const applied = applyMigration({ target: starter, release: RELEASE });
  assert.equal(applied.status, "APPLIED");
  const retired = applied.removed.find((p) => !applied.written.includes(p));
  assert.ok(retired, "a retired path that no v3 file replaced");
  mkdirSync(dirname(join(starter, retired)), { recursive: true });
  writeFileSync(join(starter, retired), "the user created this after the migration\n");
  const r = revertMigration({ target: starter });
  assert.equal(r.status, "PARTIAL");
  assert.ok(r.kept.includes(retired));
  assert.equal(readFileSync(join(starter, retired), "utf8"), "the user created this after the migration\n", "not overwritten by the v2 content");
  rmSync(join(starter, retired));
  assert.equal(revertMigration({ target: starter }).status, "REVERTED");
  git(starter, "reset", "-q", "--hard", STARTER_V204);
  assert.equal(status(starter), "");
});


test("a tampered journal cannot make revert touch anything outside the repository", () => {
  const dir = repo({ "a.txt": "1\n" });
  mkdirSync(join(dir, ".ai-native"), { recursive: true });
  const outside = join(dirname(dir), "outside-victim.txt");
  writeFileSync(outside, "do not delete\n");
  writeFileSync(join(dir, JOURNAL), JSON.stringify({ schemaVersion: 1, baseCommit: "HEAD", retired: [], created: [{ path: "../outside-victim.txt", sha256: "sha256:x" }] }));
  assert.throws(() => revertMigration({ target: dir }), /escapes the repository/);
  assert.equal(readFileSync(outside, "utf8"), "do not delete\n");
  writeFileSync(join(dir, JOURNAL), JSON.stringify({ schemaVersion: 1, baseCommit: "HEAD", retired: [{ path: "C:/Windows/win.ini", sha256: "x" }], created: [] }));
  assert.throws(() => revertMigration({ target: dir }), /escapes the repository/);
});

test("the apply-time hash guard: a retire target whose bytes differ from the plan aborts BEFORE any deletion and leaves no journal", () => {
  const dir = repo({ "scripts/status-lib.ps1": "x\n", "keep.md": "k\n" });
  const before = git(dir, "status", "--porcelain", "--untracked-files=all");
  const stale = (plan) => ({ ...plan, retire: [{ path: "scripts/status-lib.ps1", sha256: `sha256:${"0".repeat(64)}` }], blocked: false, unresolved: [] });
  assert.throws(() => applyMigration({ target: dir, release: RELEASE, tools: ["claude"], hooks: { planOverride: stale } }), /changed between plan and apply; nothing was modified/);
  assert.equal(git(dir, "status", "--porcelain", "--untracked-files=all"), before, "nothing deleted, nothing created");
  assert.equal(existsSync(join(dir, JOURNAL)), false);
  assert.equal(readFileSync(join(dir, "scripts/status-lib.ps1"), "utf8"), "x\n");
});

test("a bad release is rejected by the LOCK validation specifically (not by an unrelated step)", () => {
  const dir = repo({ "notes.md": "n\n" });
  assert.throws(() => applyMigration({ target: dir, release: { ...RELEASE, commit: "not-a-sha" }, tools: ["claude"] }), /does not validate/);
  assert.equal(git(dir, "status", "--porcelain", "--untracked-files=all"), "");
});

test("real starter v2.0.4 + its real ruleset: the 3 required checks WILL_DISAPPEAR (C-2); apply is refused until accepted; the L3 check is proposed", net, () => {
  // required checks of ruleset template-starter-main (24421920), as the API returns them
  const required = ["circuit-tests", "product-tests", "local-reconciler-tests"].map((context) => ({ context, integrationId: 15368 }));
  const plan = planMigration({ target: starter, release: RELEASE, tools: ["claude"], requiredChecks: required });
  assert.equal(plan.rulesetCheck.status, "FAIL");
  assert.deepEqual(plan.rulesetCheck.findings.map((f) => f.code), Array(3).fill("RULESET_REQUIRED_CHECK_WILL_DISAPPEAR"));
  assert.deepEqual(plan.rulesetCheck.proposed, ["l3 / l3-consumer"]);
  assert.equal(status(starter), "", "plan is read-only");
  const refused = applyMigration({ target: starter, release: RELEASE, tools: ["claude"], requiredChecks: required });
  assert.equal(refused.status, "BLOCKED");
  assert.equal(refused.reason, "ruleset");
  assert.equal(status(starter), "", "a refused apply writes nothing");
  assert.equal(planMigration({ target: starter, release: RELEASE, tools: ["claude"] }).rulesetCheck.status, "NOT_CHECKED", "library callers that pass nothing are not checked");
  const accepted = applyMigration({ target: starter, release: RELEASE, tools: ["claude"], requiredChecks: required, acceptRulesetChange: true });
  assert.equal(accepted.status, "APPLIED");
  assert.equal(revertMigration({ target: starter }).status, "REVERTED");
  assert.equal(status(starter), "");
});

test("CLI on the real starter: apply with --accept-ruleset-change exits 0 and reports the accepted findings as warnings; without it, it is refused", net, () => {
  const rsFile = join(base, "required.json");
  writeFileSync(rsFile, JSON.stringify([{ type: "required_status_checks", parameters: { required_status_checks: ["circuit-tests", "product-tests", "local-reconciler-tests"].map((context) => ({ context, integration_id: 15368 })) } }]));
  const cli = (...extra) => spawnSync(process.execPath, [join(here, "migrate.mjs"), "apply", "--target", starter, "--repo", RELEASE.repo, "--version", RELEASE.version, "--commit", RELEASE.commit, "--digest", RELEASE.digest, "--tool", "claude", "--ruleset-file", rsFile, "--json", ...extra], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const refused = cli();
  assert.notEqual(refused.status, 0);
  assert.match(refused.stdout, /RULESET_REQUIRED_CHECK_WILL_DISAPPEAR/);
  assert.equal(status(starter), "", "a refused apply writes nothing");
  const accepted = cli("--accept-ruleset-change");
  assert.equal(accepted.status, 0, accepted.stdout.slice(0, 600));
  assert.match(accepted.stdout, /ACCEPTED with --accept-ruleset-change/);
  assert.equal(revertMigration({ target: starter }).status, "REVERTED");
  assert.equal(status(starter), "");
});
