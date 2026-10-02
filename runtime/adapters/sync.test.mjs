import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildToolFiles, findObsoleteAdapters, sync, check, LEGACY_PATHS } from "./sync.mjs";

function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), "ai-native-sync-test-"));
  mkdirSync(join(root, "core", "roles"), { recursive: true });
  mkdirSync(join(root, "mcp"), { recursive: true });
  mkdirSync(join(root, ".agents", "skills", "demo"), { recursive: true });

  writeFileSync(join(root, "core", "roles", "builder.md"), "Builder prompt.\n", "utf8");
  writeFileSync(join(root, "core", "roles", "reviewer.md"), "Reviewer prompt.\n", "utf8");
  writeFileSync(
    join(root, "core", "agents.json"),
    JSON.stringify({
      generatedNotice: "GENERATED notice",
      opencodeInstructions: ["AGENTS.md"],
      roles: {
        builder: {
          description: "Builds.",
          prompt: "core/roles/builder.md",
          claude: { tools: ["Read", "Write"], model: "sonnet", effort: "high" },
          codex: { model: "gpt-5.5", model_reasoning_effort: "high" },
          opencode: { mode: "subagent", model: "opencode-go/kimi", reasoningEffort: "high", permission: { edit: "allow", bash: "allow" } },
        },
        reviewer: {
          description: "Reviews.",
          prompt: "core/roles/reviewer.md",
          claude: { tools: ["Read"], model: "sonnet", effort: "high" },
          codex: { model: "gpt-5.5", model_reasoning_effort: "high" },
          opencode: { mode: "subagent", model: "opencode-go/kimi", reasoningEffort: "high", permission: { edit: "deny", bash: "deny" } },
        },
      },
    }),
    "utf8",
  );
  writeFileSync(join(root, "mcp", "catalog.json"), JSON.stringify({ schemaVersion: 1, servers: {} }), "utf8");
  writeFileSync(join(root, ".agents", "skills", "demo", "SKILL.md"), "demo skill\n", "utf8");
  writeFileSync(
    join(root, ".agents", "skills", "registry.json"),
    JSON.stringify({ schemaVersion: 1, skills: [{ id: "demo", profiles: ["*"], roles: ["*"], levels: ["*"] }] }),
    "utf8",
  );
  return root;
}

test("buildToolFiles produces CLAUDE.md, .mcp.json, .codex/*, opencode.json and per-role files", () => {
  const root = makeFixture();
  try {
    const files = buildToolFiles(root);
    assert.ok(files["CLAUDE.md"]);
    assert.ok(files[".mcp.json"]);
    assert.ok(files[".codex/config.toml"]);
    assert.ok(files[".codex/README.md"]);
    assert.ok(files["opencode.json"]);
    assert.ok(files[".claude/agents/builder.md"]);
    assert.ok(files[".codex/builder.config.toml"]);
    assert.ok(files[".claude/agents/reviewer.md"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("buildToolFiles filters by the given tools list", () => {
  const root = makeFixture();
  try {
    const files = buildToolFiles(root, { tools: ["codex"] });
    assert.ok(files[".codex/config.toml"]);
    assert.equal(files["CLAUDE.md"], undefined);
    assert.equal(files["opencode.json"], undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("sync() then check() against the same fixture reports zero problems", () => {
  const root = makeFixture();
  try {
    sync(root, {});
    assert.deepEqual(check(root, {}), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("sync() is idempotent: running it twice produces byte-identical output", () => {
  const root = makeFixture();
  try {
    sync(root, {});
    const first = readFileSync(join(root, "opencode.json"), "utf8");
    sync(root, {});
    const second = readFileSync(join(root, "opencode.json"), "utf8");
    assert.equal(first, second);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("check() reports a missing generated adapter before sync() has ever run", () => {
  const root = makeFixture();
  try {
    const problems = check(root, {});
    assert.ok(problems.some((p) => p.includes("missing generated adapter: CLAUDE.md")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("check() reports a hand-edited adapter as outdated or divergent", () => {
  const root = makeFixture();
  try {
    sync(root, {});
    writeFileSync(join(root, "CLAUDE.md"), "hand-edited\n", "utf8");
    const problems = check(root, {});
    assert.ok(problems.some((p) => p.includes("generated adapter outdated or divergent: CLAUDE.md")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// --- legacy cleanup ---

test("sync() removes legacy TEMPLATE v2.0.5 adapter files", () => {
  const root = makeFixture();
  try {
    const legacyRel = LEGACY_PATHS[0];
    mkdirSync(join(root, legacyRel, ".."), { recursive: true });
    writeFileSync(join(root, legacyRel), "legacy content\n", "utf8");
    sync(root, {});
    assert.equal(existsSync(join(root, legacyRel)), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("check() flags a legacy adapter file still present", () => {
  const root = makeFixture();
  try {
    sync(root, {});
    const legacyRel = LEGACY_PATHS[0];
    mkdirSync(join(root, legacyRel, ".."), { recursive: true });
    writeFileSync(join(root, legacyRel), "legacy content\n", "utf8");
    const problems = check(root, {});
    assert.ok(problems.some((p) => p.includes(`legacy non-canonical adapter present: ${legacyRel}`)));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// --- obsolete adapter pruning ---

test("findObsoleteAdapters identifies a generated file for a role no longer in core/agents.json", () => {
  const root = makeFixture();
  try {
    sync(root, {});
    mkdirSync(join(root, ".claude", "agents"), { recursive: true });
    writeFileSync(join(root, ".claude", "agents", "ghost-role.md"), "stale\n", "utf8");
    const agents = JSON.parse(readFileSync(join(root, "core", "agents.json"), "utf8"));
    const obsolete = findObsoleteAdapters(root, agents);
    assert.deepEqual(obsolete, [".claude/agents/ghost-role.md"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("sync() prunes an obsolete role adapter automatically", () => {
  const root = makeFixture();
  try {
    sync(root, {});
    writeFileSync(join(root, ".claude", "agents", "ghost-role.md"), "stale\n", "utf8");
    writeFileSync(join(root, ".codex", "ghost-role.config.toml"), "stale\n", "utf8");
    sync(root, {});
    assert.equal(existsSync(join(root, ".claude", "agents", "ghost-role.md")), false);
    assert.equal(existsSync(join(root, ".codex", "ghost-role.config.toml")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// --- skills (lazy materialization wired through sync/check) ---

test("sync() materializes the registered skill and check() sees it as in sync", () => {
  const root = makeFixture();
  try {
    sync(root, {});
    assert.ok(existsSync(join(root, ".claude", "skills", "demo", "SKILL.md")));
    assert.ok(existsSync(join(root, ".opencode", "skills", "demo", "SKILL.md")));
    assert.deepEqual(check(root, {}), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
