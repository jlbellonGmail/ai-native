import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCommandFiles, findObsoleteCommands, GENERATED_MARKER } from "./commands.mjs";
import { buildToolFiles, check, sync } from "./sync.mjs";

const platform = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NAMES = ["feature", "sdd-analyze", "sdd-change", "sdd-clarify", "sdd-implement-all", "sdd-implement", "sdd-plan", "sdd-spec", "sdd-status", "sdd-tasks", "sdd-validate"];

test("every canonical command is projected for Claude Code and OpenCode, and only for the selected tools", () => {
  const both = buildCommandFiles(platform, { tools: ["claude", "opencode"] });
  for (const name of NAMES) {
    assert.ok(both[`.claude/commands/${name}.md`], `claude ${name}`);
    assert.ok(both[`.opencode/commands/${name}.md`], `opencode ${name}`);
  }
  assert.equal(Object.keys(both).length, NAMES.length * 2);
  const claudeOnly = buildCommandFiles(platform, { tools: ["claude"] });
  assert.ok(Object.keys(claudeOnly).every((p) => p.startsWith(".claude/")));
  assert.deepEqual(buildCommandFiles(platform, { tools: ["codex"] }), {}, "codex has no command surface");
});

test("projection is deterministic and marks files as generated", () => {
  const a = buildCommandFiles(platform, { tools: ["claude", "opencode"] });
  const b = buildCommandFiles(platform, { tools: ["claude", "opencode"] });
  assert.deepEqual(a, b);
  for (const content of Object.values(a)) assert.ok(content.includes(GENERATED_MARKER));
});

test("permissions are never widened: read-only commands get a read-only allowlist and the plan agent", () => {
  const files = buildCommandFiles(platform, { tools: ["claude", "opencode"] });
  for (const name of ["sdd-validate", "sdd-analyze", "sdd-status"]) {
    assert.match(files[`.claude/commands/${name}.md`], /allowed-tools: Read, Grep, Glob/);
    assert.match(files[`.opencode/commands/${name}.md`], /agent: plan/);
  }
  assert.doesNotMatch(files[".claude/commands/sdd-implement.md"], /allowed-tools/);
  assert.match(files[".opencode/commands/sdd-implement.md"], /agent: build/);
  for (const content of Object.values(files)) assert.doesNotMatch(content, /bypassPermissions|dangerously|--no-verify/i);
});

test("projected commands use $ARGUMENTS and the canonical names only", () => {
  const files = buildCommandFiles(platform, { tools: ["claude"] });
  assert.match(files[".claude/commands/sdd-implement.md"], /\$ARGUMENTS/);
  assert.match(files[".claude/commands/sdd-implement-all.md"], /runtime\/circuit\/implement-all\.mjs/);
});

test("a root without a catalog projects nothing (older release / minimal fixture)", () => {
  const empty = mkdtempSync(join(tmpdir(), "cmd-empty-"));
  assert.deepEqual(buildCommandFiles(empty, { tools: ["claude", "opencode"] }), {});
});

test("buildToolFiles includes the commands; sync writes them and check detects drift and obsolete generated ones", () => {
  const root = mkdtempSync(join(tmpdir(), "cmd-sync-"));
  for (const dir of ["core", "contracts", "mcp", ".agents"]) cpSync(join(platform, dir), join(root, dir), { recursive: true });
  assert.ok(buildToolFiles(root, { tools: ["claude"] })[".claude/commands/feature.md"]);

  sync(root, { tools: ["claude", "opencode"] });
  assert.ok(existsSync(join(root, ".claude/commands/sdd-implement.md")));
  assert.deepEqual(check(root, { tools: ["claude", "opencode"] }), []);

  writeFileSync(join(root, ".claude/commands/sdd-implement.md"), "tampered");
  assert.ok(check(root, { tools: ["claude", "opencode"] }).some((p) => p.includes("divergent: .claude/commands/sdd-implement.md") || p.includes("outdated or divergent: .claude/commands/sdd-implement.md")));
  sync(root, { tools: ["claude", "opencode"] });

  // a generated command that left the catalog is obsolete; the user's own command is untouched
  writeFileSync(join(root, ".claude/commands/sdd-old.md"), `<!-- ${GENERATED_MARKER} -->\nold`);
  writeFileSync(join(root, ".claude/commands/mine.md"), "my own command");
  assert.deepEqual(findObsoleteCommands(root), [".claude/commands/sdd-old.md"]);
  assert.ok(check(root, { tools: ["claude", "opencode"] }).includes("obsolete generated command: .claude/commands/sdd-old.md"));
  sync(root, { tools: ["claude", "opencode"] });
  assert.ok(!existsSync(join(root, ".claude/commands/sdd-old.md")));
  assert.equal(readFileSync(join(root, ".claude/commands/mine.md"), "utf8"), "my own command");
});
