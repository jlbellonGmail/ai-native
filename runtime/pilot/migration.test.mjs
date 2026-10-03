// M5.3 (parcial): migration fixture from a REAL v2 consumer -- template-starter
// at tag v2.0.4, pinned by commit SHA and cloned read-only. Proves, on real v2
// content: the inventory is read-only and classifies every file; adopting
// ai-native adapters collides with real v2 files and is BLOCKED without touching
// anything; --skip adopts only what does not collide; revert restores the exact
// pre-adoption tree (git sees no change).
// Not covered (declared in the roadmap): v2.0.0..v2.0.5 `template` tag trees
// (only in the maintainer's local `template` checkout, not reproducible in CI)
// and v2.0.6 (does not exist: M0.0b is blocked on A2).
// Network: needs github.com. Without it the tests SKIP locally; in CI
// (AI_NATIVE_REQUIRE_NETWORK=1) a failed clone is a FAILURE, never a silent skip.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const STARTER = "https://github.com/jlbellonGmail/template-starter.git";
const STARTER_V204 = "9e7dfb5b82ca69a0dd878c719f5861816652780b";
const node = (args) => spawnSync(process.execPath, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

function cloneStarter() {
  const dir = join(mkdtempSync(join(tmpdir(), "ai-native-starter-")), "starter");
  try {
    execFileSync("git", ["clone", "-q", "--no-checkout", STARTER, dir], { stdio: "pipe" });
    git(dir, "checkout", "-q", "--detach", STARTER_V204);
    return dir;
  } catch (error) {
    if (process.env.AI_NATIVE_REQUIRE_NETWORK === "1") throw error;
    return null;
  }
}

const starter = cloneStarter();
const opts = { skip: starter ? false : "github.com not reachable (set AI_NATIVE_REQUIRE_NETWORK=1 to make this a failure)" };

test("fixture is the pinned real starter v2.0.4 and starts clean", opts, () => {
  assert.equal(git(starter, "rev-parse", "HEAD").trim(), STARTER_V204);
  assert.equal(git(starter, "status", "--porcelain").trim(), "");
});

test("inventory (read-only) classifies every file of the real v2.0.4 consumer and writes nothing", opts, () => {
  const r = node([join(repoRoot, "parity", "migrate-inventory.mjs"), "--target", starter, "--json"]);
  assert.equal(r.status, 0, r.stderr);
  const report = JSON.parse(r.stdout);
  const counts = report.counts;
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), report.totalFiles);
  assert.equal(counts.UNKNOWN, 0);
  assert.equal(counts.IDENTICAL_TO_TEMPLATE + counts.MODIFIED_FROM_TEMPLATE + counts.LOCAL + counts.DUPLICATED_CAPABILITY, Object.values(counts).reduce((a, b) => a + b, 0));
  assert.ok(counts.IDENTICAL_TO_TEMPLATE > 100, JSON.stringify(counts));
  assert.equal(git(starter, "status", "--porcelain").trim(), "");
});

const adapters = (extra) => node([join(repoRoot, "runtime", "adapters", "consumer.mjs"), "--project", starter, "--json", ...extra]);

test("adopting ai-native into the real v2 consumer: plan lists real collisions and writes nothing", opts, () => {
  const plan = JSON.parse(adapters(["--plan"]).stdout);
  const colliding = plan.adoption.collisions.filter((c) => !c.identical).map((c) => c.path);
  assert.ok(colliding.includes("CLAUDE.md") || colliding.some((p) => p.startsWith(".claude/agents/")), colliding.join(","));
  assert.ok(colliding.length > 0);
  assert.equal(git(starter, "status", "--porcelain").trim(), "");
});

test("apply is BLOCKED by the collisions and leaves the v2 tree untouched", opts, () => {
  const r = adapters([]);
  assert.notEqual(r.status, 0);
  assert.equal(git(starter, "status", "--porcelain").trim(), "");
});

test("--skip of every collision adopts only the non-colliding files; revert restores the exact tree", opts, () => {
  const plan = JSON.parse(adapters(["--plan"]).stdout);
  const skips = plan.adoption.collisions.filter((c) => !c.identical).flatMap((c) => ["--skip", c.path]);
  const applied = adapters(skips);
  assert.equal(applied.status, 0, applied.stdout + applied.stderr);
  const touched = git(starter, "status", "--porcelain", "--untracked-files=all").trim().split("\n").filter(Boolean);
  assert.ok(touched.every((l) => l.startsWith("??")), `adoption modified tracked v2 files:\n${touched.join("\n")}`); // only additions
  assert.ok(touched.length > 0);
  const reverted = adapters(["--revert"]);
  assert.equal(reverted.status, 0, reverted.stdout + reverted.stderr);
  assert.equal(git(starter, "status", "--porcelain", "--untracked-files=all").trim(), "");
});
