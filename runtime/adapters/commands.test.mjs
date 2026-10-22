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
  assert.match(files[".claude/commands/sdd-implement-all.md"], /node \.ai-native\/ai-native\.mjs sdd next/);
  assert.doesNotMatch(files[".claude/commands/sdd-implement-all.md"].split("\n").filter((l) => !l.startsWith("<!-- GENERATED")).join("\n"), /runtime\/|contracts\//);
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

test("the review capability is projected per runtime: Claude says how to reach its isolated reviewer, the others fall back", () => {
  const files = buildCommandFiles(platform, { tools: ["claude", "opencode"] });
  for (const content of Object.values(files)) assert.doesNotMatch(content, /\{\{[A-Z_]+\}\}/, "no unfilled slot reaches a projection");
  for (const name of ["sdd-implement-all", "sdd-validate"]) {
    const claude = files[`.claude/commands/${name}.md`];
    assert.match(claude, /ToolSearch `select:Agent`/);
    assert.match(claude, /subagent_type: \\"reviewer\\"|subagent_type: "reviewer"/);
    assert.match(claude, /never `subagent_type: "fork"`/);
    // F6: the slash command itself is the user's request to delegate the review (Claude projection only)
    assert.match(claude, /The user running `\/sdd-implement-all <NNN-slug>` \(or `\/sdd-validate <NNN-slug>`\) is the user's explicit request that you, the Coordinator, invoke the `reviewer` agent/);
    const opencode = files[`.opencode/commands/${name}.md`];
    assert.match(opencode, /Independent review is UNAVAILABLE/);
    assert.match(opencode, /--kind self --verdict <verdict>/);
    assert.doesNotMatch(opencode, /ToolSearch|subagent_type|SubagentStop|`Agent` tool|\bfork\b/, "a Claude-specific detail never leaks into another runtime's projection");
  }
});

test("a defined reviewer is not the capability: OpenCode projects a reviewer agent and still declares independent review unavailable", () => {
  const root = mkdtempSync(join(tmpdir(), "cmd-cap-"));
  for (const dir of ["core", "contracts", "mcp", ".agents"]) cpSync(join(platform, dir), join(root, dir), { recursive: true });
  const files = buildToolFiles(root, { tools: ["claude", "opencode"], opencodeRolesDir: ".opencode/roles" });
  assert.ok(files[".opencode/roles/reviewer.md"] && JSON.parse(files["opencode.json"]).agent.reviewer, "the reviewer role is defined for OpenCode");
  assert.match(files[".opencode/commands/sdd-implement-all.md"], /Independent review is UNAVAILABLE/);
  // a runtime the platform knows nothing about gets the fail-closed note, never a claim of independence
  const agentsPath = join(root, "core", "agents.json");
  const agents = JSON.parse(readFileSync(agentsPath, "utf8"));
  delete agents.runtimes.claude;
  writeFileSync(agentsPath, JSON.stringify(agents));
  const unknown = buildCommandFiles(root, { tools: ["claude"] })[".claude/commands/sdd-implement-all.md"];
  assert.match(unknown, /no verified way for this runtime to run the Reviewer in a context isolated from this session/);
  assert.doesNotMatch(unknown, /select:Agent/);
});

test("the projected reviewer agent no longer points to a command that does not exist", () => {
  const files = buildToolFiles(platform, { tools: ["claude"] });
  assert.doesNotMatch(files[".claude/agents/reviewer.md"], /review run/);
  assert.match(files[".claude/agents/reviewer.md"], /REVIEW_NONCE/);
});

test("F3: Claude-specific review mechanics live only in the Claude projection; Codex and OpenCode stay UNAVAILABLE", () => {
  const files = buildToolFiles(platform, { tools: ["claude", "codex", "opencode"] });
  // the core sources the projections come from never name the Claude mechanics
  const core = ["core/commands/sdd-implement-all.md", "core/commands/sdd-validate.md", "core/roles/reviewer.md", "core/agents.json", "contracts/sdd-workflow.json"].map((p) => readFileSync(join(platform, p), "utf8")).join("\n");
  assert.doesNotMatch(core, /ToolSearch|subagent_type|SubagentSt(art|op)|select:Agent|\bfork\b|agent_transcript_path/);
  // Claude: the SubagentStop hook on the reviewer agent type hands the runtime's record to the receipt command (exec form)
  const settings = JSON.parse(files[".claude/settings.json"]);
  const [entry] = settings.hooks.SubagentStop;
  assert.equal(entry.matcher, "reviewer");
  assert.deepEqual(entry.hooks[0].args.slice(1), ["sdd", "review", "receipt", "claude"]);
  assert.equal(entry.hooks[0].command, "node");
  // Codex: no command surface, the README states the fallback; OpenCode commands state it too
  assert.match(files[".codex/README.md"], /Independent review is UNAVAILABLE/);
  assert.doesNotMatch(files[".codex/README.md"], /ToolSearch|subagent_type|SubagentStop/);
  assert.ok(!Object.keys(files).some((p) => p.startsWith(".codex/") && /settings|hook/i.test(p)), "no review hook is projected for Codex");
  assert.ok(!files["opencode.json"].includes("SubagentStop"));
});
