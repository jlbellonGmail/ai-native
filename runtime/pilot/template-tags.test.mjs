// M5.3: migration fixtures for every TEMPLATE tag v2.0.0 .. v2.0.5, taken from the
// public repo jlbellonGmail/template and pinned by commit SHA (a moved tag cannot
// change the fixture). For each tag: the read-only inventory classifies every
// file as IDENTICAL (the Hash DB was built from these same tags), adopting the
// ai-native adapters is BLOCKED by real collisions without touching anything,
// --skip adopts only additions, and revert leaves `git status` clean. Plus one
// variant with a modified and a local file (MODIFIED / LOCAL are detected).
// v2.0.6 does not exist (M0.0b); template-starter v2.0.4 is migration.test.mjs.
// Network: needs github.com; locally it SKIPs, in CI (AI_NATIVE_REQUIRE_NETWORK=1)
// a failed clone is a FAILURE.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TEMPLATE = "https://github.com/jlbellonGmail/template.git";
const TAGS = {
  "v2.0.0": "f5d4b6cc029c34c0d0c05831bfd28134276fa167",
  "v2.0.1": "fa8aade44fe808635e01916da7347b1d1837da7a",
  "v2.0.2": "ad32d39c334f5d2abd5804a32b46314c9b8873f3",
  "v2.0.3": "73f88f499d17265e75f0160d5c5e0f2780189ee9",
  "v2.0.4": "f2a7a247f5c3408a4a1ef234a80e069fe40b9b3e",
  "v2.0.5": "92a797c29750d5c9f64cccf8896f58e6827445cf",
};
const node = (args) => spawnSync(process.execPath, args, { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 }).trim();

const base = mkdtempSync(join(tmpdir(), "ai-native-template-"));
const clone = join(base, "t");
let cloned = true;
try {
  execFileSync("git", ["clone", "-q", "--no-checkout", "--filter=blob:none", TEMPLATE, clone], { stdio: "pipe" });
} catch (error) {
  if (process.env.AI_NATIVE_REQUIRE_NETWORK === "1") throw error;
  cloned = false;
}
const opts = { skip: cloned ? false : "github.com not reachable (set AI_NATIVE_REQUIRE_NETWORK=1 to make this a failure)", timeout: 280000 };

function fixture(tag, name = tag) {
  const dir = join(base, name);
  git(clone, "worktree", "add", "-q", "--detach", dir, TAGS[tag]);
  return dir;
}
const inventory = (dir) => JSON.parse(node([join(repoRoot, "parity", "migrate-inventory.mjs"), "--target", dir, "--json"]).stdout);
const adapters = (dir, ...extra) => node([join(repoRoot, "runtime", "adapters", "consumer.mjs"), "--project", dir, "--json", ...extra]);

for (const tag of Object.keys(TAGS)) {
  test(`template ${tag}: pinned, inventory is 100% IDENTICAL, adoption is blocked by collisions, skip adds only, revert is clean`, opts, () => {
    const dir = fixture(tag);
    assert.equal(git(dir, "rev-parse", "HEAD"), TAGS[tag]);

    const inv = inventory(dir);
    assert.equal(inv.counts.UNKNOWN, 0);
    assert.equal(inv.counts.MODIFIED_FROM_TEMPLATE + inv.counts.LOCAL + inv.counts.DUPLICATED_CAPABILITY, 0, JSON.stringify(inv.counts));
    assert.equal(inv.counts.IDENTICAL_TO_TEMPLATE, inv.totalFiles);
    assert.ok(inv.totalFiles > 500, `${tag}: ${inv.totalFiles} files`);
    assert.equal(git(dir, "status", "--porcelain").trim(), "");

    const plan = JSON.parse(adapters(dir, "--plan").stdout).adoption;
    const colliding = plan.collisions.filter((c) => !c.identical).map((c) => c.path);
    const blocked = adapters(dir);
    if (colliding.length) {
      assert.notEqual(blocked.status, 0, `${tag}: expected BLOCKED by ${colliding.join(",")}`);
      assert.equal(git(dir, "status", "--porcelain").trim(), "", "blocked adoption must write nothing");
    }
    const skips = colliding.flatMap((p) => ["--skip", p]);
    const applied = adapters(dir, ...skips);
    assert.equal(applied.status, 0, applied.stdout + applied.stderr);
    const changed = git(dir, "status", "--porcelain", "--untracked-files=all").split("\n").filter(Boolean);
    assert.ok(changed.length > 0);
    assert.ok(changed.every((l) => l.startsWith("??")), `${tag}: adoption modified tracked v2 files:\n${changed.join("\n")}`);
    const reverted = adapters(dir, "--revert");
    assert.equal(reverted.status, 0, reverted.stdout + reverted.stderr);
    assert.equal(git(dir, "status", "--porcelain", "--untracked-files=all").trim(), "", `${tag}: revert must leave the tree clean`);
  });
}

test("template v2.0.3 with local edits: MODIFIED and LOCAL are detected and nothing is classified UNKNOWN", opts, () => {
  const dir = fixture("v2.0.3", "v2.0.3-edited");
  const readme = join(dir, "README.md");
  writeFileSync(readme, `${execFileSync("git", ["show", "HEAD:README.md"], { cwd: dir, encoding: "utf8" })}\nlocal edit\n`);
  mkdirSync(join(dir, "docs", "local"), { recursive: true });
  writeFileSync(join(dir, "docs", "local", "mine.md"), "only mine\n");
  const inv = inventory(dir);
  assert.equal(inv.counts.MODIFIED_FROM_TEMPLATE, 1);
  assert.ok(inv.counts.LOCAL + inv.counts.DUPLICATED_CAPABILITY >= 1);
  assert.equal(inv.counts.UNKNOWN, 0);
  const row = inv.files.find((f) => f.path === "README.md");
  assert.match(row.classification, /^MODIFIED_FROM_TEMPLATE/);
  // the migration never touches the user's edit
  const before = execFileSync("git", ["diff", "--", "README.md"], { cwd: dir, encoding: "utf8" });
  const applied = adapters(dir, ...JSON.parse(adapters(dir, "--plan").stdout).adoption.collisions.filter((c) => !c.identical).flatMap((c) => ["--skip", c.path]));
  assert.equal(applied.status, 0, applied.stdout);
  assert.equal(execFileSync("git", ["diff", "--", "README.md"], { cwd: dir, encoding: "utf8" }), before);
  assert.equal(adapters(dir, "--revert").status, 0);
  assert.equal(execFileSync("git", ["diff", "--", "README.md"], { cwd: dir, encoding: "utf8" }), before, "the local edit survives adoption and revert");
});
