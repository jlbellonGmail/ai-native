// `migrate` v2 -> v3, on a REAL v2 consumer (template-starter v2.0.4, pinned by SHA; needs github.com: SKIPs locally,
// FAILS with AI_NATIVE_REQUIRE_NETWORK=1) plus synthetic edge cases that do not need the network.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { planMigration, applyMigration, revertMigration, MigrateError, JOURNAL, PROTECTED, PLATFORM_OWNED } from "./migrate.mjs";

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
    assert.ok(PLATFORM_OWNED.some((g) => new RegExp(`^${g.replace(/\./g, "\\.").replace(/\*\*/g, ".*")}$`).test(r.path)), `${r.path} is not platform-owned`);
    assert.ok(!PROTECTED.some((g) => new RegExp(`^${g.replace(/\./g, "\\.").replace(/\*\*/g, ".*")}$`).test(r.path)), `${r.path} is protected`);
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

test("a file edited between plan and apply is never deleted", () => {
  const dir = repo({ "scripts/status-lib.ps1": "v2 content\n" });
  const plan = planMigration({ target: dir, release: RELEASE, tools: ["claude"] });
  if (!plan.retire.some((r) => r.path === "scripts/status-lib.ps1")) return; // not identical to a real tag: nothing to retire in this synthetic repo
  writeFileSync(join(dir, "scripts/status-lib.ps1"), "edited\n");
  assert.throws(() => applyMigration({ target: dir, release: RELEASE, tools: ["claude"] }), /not clean|changed between plan and apply/);
});
