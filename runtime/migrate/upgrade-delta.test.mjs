import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyAdoption } from "./adopt.mjs";
import { planUpgrade, applyUpgrade } from "./upgrade-delta.mjs";

const V1 = { "CLAUDE.md": "@AGENTS.md\n", ".claude/commands/a.md": "A v1\n", ".claude/commands/b.md": "B v1\n", ".claude/commands/gone.md": "G v1\n" };
const V2 = { "CLAUDE.md": "@AGENTS.md\n", ".claude/commands/a.md": "A v2\n", ".claude/commands/b.md": "B v1\n", ".claude/commands/c.md": "C v2\n" };

function adopted(files = V1) {
  const root = mkdtempSync(join(tmpdir(), "upgrade-"));
  assert.equal(applyAdoption(root, files).status, "APPLIED");
  return root;
}

test("delta is exactly add/update/remove; unchanged files are not rewritten", () => {
  const root = adopted();
  const plan = planUpgrade(root, V2);
  assert.deepEqual(plan.add, [".claude/commands/c.md"]);
  assert.deepEqual(plan.update, [".claude/commands/a.md"]);
  assert.deepEqual(plan.remove, [".claude/commands/gone.md"]);
  assert.deepEqual(plan.unchanged, [".claude/commands/b.md", "CLAUDE.md"]);
  assert.equal(plan.summary.bytesWritten, "A v2\n".length + "C v2\n".length);
  // planning is read-only
  assert.equal(readFileSync(join(root, ".claude/commands/a.md"), "utf8"), "A v1\n");
});

test("apply writes only the delta, updates the journal and is idempotent", () => {
  const root = adopted();
  const out = applyUpgrade(root, V2);
  assert.equal(out.status, "UPGRADED");
  assert.equal(readFileSync(join(root, ".claude/commands/a.md"), "utf8"), "A v2\n");
  assert.ok(existsSync(join(root, ".claude/commands/c.md")));
  assert.ok(!existsSync(join(root, ".claude/commands/gone.md")));
  const again = applyUpgrade(root, V2);
  assert.equal(again.status, "UP_TO_DATE");
  assert.equal(again.summary.bytesWritten, 0);
});

test("local customizations are preserved and reported, never overwritten or removed", () => {
  const root = adopted();
  writeFileSync(join(root, ".claude/commands/a.md"), "my edit\n");
  writeFileSync(join(root, ".claude/commands/gone.md"), "my edit of an obsolete file\n");
  const out = applyUpgrade(root, V2);
  assert.equal(readFileSync(join(root, ".claude/commands/a.md"), "utf8"), "my edit\n");
  assert.ok(existsSync(join(root, ".claude/commands/gone.md")));
  assert.deepEqual(out.keepLocal.map((k) => k.reason).sort(), ["edited locally", "obsolete but edited locally"]);
  // once the user's edit equals the target there is nothing left to say
  writeFileSync(join(root, ".claude/commands/a.md"), "A v2\n");
  assert.ok(planUpgrade(root, V2).unchanged.includes(".claude/commands/a.md"));
});

test("files the journal does not know are collisions and stay untouched; user-deleted files are not resurrected", () => {
  const root = adopted();
  mkdirSync(join(root, ".claude/commands"), { recursive: true });
  writeFileSync(join(root, ".claude/commands/c.md"), "the user's own c\n");
  rmSync(join(root, ".claude/commands/b.md"));
  const plan = planUpgrade(root, V2);
  assert.deepEqual(plan.collisions, [".claude/commands/c.md"]);
  assert.deepEqual(plan.keepLocal, [{ path: ".claude/commands/b.md", reason: "deleted locally" }]);
  applyUpgrade(root, V2);
  assert.equal(readFileSync(join(root, ".claude/commands/c.md"), "utf8"), "the user's own c\n");
  assert.ok(!existsSync(join(root, ".claude/commands/b.md")));
});

test("paths skipped at adoption stay skipped", () => {
  const root = mkdtempSync(join(tmpdir(), "upgrade-skip-"));
  mkdirSync(join(root, ".claude/commands"), { recursive: true });
  writeFileSync(join(root, ".claude/commands/a.md"), "mine\n");
  applyAdoption(root, V1, { resolve: { ".claude/commands/a.md": "skip" } });
  const plan = planUpgrade(root, V2);
  assert.deepEqual(plan.keepSkipped, [".claude/commands/a.md"]);
  assert.ok(!plan.update.includes(".claude/commands/a.md"));
});

test("no journal means nothing to upgrade, and unsafe paths are rejected", () => {
  const empty = mkdtempSync(join(tmpdir(), "upgrade-none-"));
  assert.throws(() => planUpgrade(empty, V2), /no adoption journal/);
  const root = adopted();
  assert.throws(() => planUpgrade(root, { "../escape.md": "x" }), /unsafe path/);
});

test("real release: a consumer adopted before the SDD surface gets only additive files, then is up to date", async () => {
  const { consumerFiles } = await import("../adapters/consumer.mjs");
  const { dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const platform = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const full = consumerFiles(platform, { tools: ["claude", "opencode"] });
  const before = Object.fromEntries(Object.entries(full).filter(([p]) => !/\/commands\/|\/skills\/sdd\/|task-execution\/references\//.test(p)));
  const root = adopted(before);
  const plan = planUpgrade(root, full);
  assert.deepEqual([plan.update, plan.remove, plan.collisions, plan.keepLocal], [[], [], [], []]);
  assert.ok(plan.add.length >= 22 && plan.add.every((p) => /\/commands\/|\/skills\/sdd\/|task-execution\/references\//.test(p)));
  assert.equal(applyUpgrade(root, full).status, "UPGRADED");
  assert.equal(applyUpgrade(root, full).status, "UP_TO_DATE");
});

test("a file the user made equal to the target is tracked again, so the next release can update it", () => {
  const root = adopted();
  writeFileSync(join(root, ".claude/commands/a.md"), "A v2\n");
  assert.deepEqual(planUpgrade(root, V2).refresh, [".claude/commands/a.md"]);
  applyUpgrade(root, V2);
  const V3 = { ...V2, ".claude/commands/a.md": "A v3\n" };
  assert.deepEqual(planUpgrade(root, V3).update, [".claude/commands/a.md"]);
  assert.ok(!existsSync(join(root, ".ai-native/adoption-journal.json.tmp")), "no temp journal is left behind");
});

test("a refresh-only run reports REFRESHED (journal rewritten, no project file written), then UP_TO_DATE", () => {
  const root = adopted(V2);
  const V3 = { ...V2, ".claude/commands/a.md": "A v3\n" };
  writeFileSync(join(root, ".claude/commands/a.md"), "A v3\n"); // the user already converged on the next release
  const first = applyUpgrade(root, V3);
  assert.equal(first.status, "REFRESHED");
  assert.equal(first.summary.bytesWritten, 0);
  assert.equal(applyUpgrade(root, V3).status, "UP_TO_DATE");
});
