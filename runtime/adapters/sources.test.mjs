import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAgents, loadMcpCatalog, loadRolePrompt, checkEntryPoints, MissingCanonicalSourceError } from "./sources.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

test("loadAgents reads the real core/agents.json", () => {
  const agents = loadAgents(repoRoot);
  assert.ok(agents.roles.builder);
});

test("loadMcpCatalog reads the real mcp/catalog.json", () => {
  const catalog = loadMcpCatalog(repoRoot);
  assert.equal(catalog.schemaVersion, 1);
});

test("loadRolePrompt reads the real builder prompt", () => {
  const agents = loadAgents(repoRoot);
  const prompt = loadRolePrompt(repoRoot, agents.roles.builder);
  assert.ok(prompt.length > 0);
});

test("checkEntryPoints against the real repo finds no problems", () => {
  assert.deepEqual(checkEntryPoints(repoRoot), []);
});

test("loadAgents throws MissingCanonicalSourceError when core/agents.json does not exist", () => {
  const root = mkdtempSync(join(tmpdir(), "ai-native-sources-test-"));
  try {
    assert.throws(() => loadAgents(root), MissingCanonicalSourceError);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("checkEntryPoints reports a missing role prompt instead of throwing", () => {
  const root = mkdtempSync(join(tmpdir(), "ai-native-sources-test-"));
  try {
    mkdirSync(join(root, "core"), { recursive: true });
    mkdirSync(join(root, "mcp"), { recursive: true });
    writeFileSync(
      join(root, "core", "agents.json"),
      JSON.stringify({
        roles: {
          builder: { prompt: "core/roles/builder.md", claude: {}, codex: {}, opencode: {} },
        },
      }),
      "utf8",
    );
    writeFileSync(join(root, "mcp", "catalog.json"), JSON.stringify({ schemaVersion: 1, servers: {} }), "utf8");
    const problems = checkEntryPoints(root);
    assert.ok(problems.some((p) => p.includes("missing canonical prompt")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("checkEntryPoints reports a role missing a tool routing block", () => {
  const root = mkdtempSync(join(tmpdir(), "ai-native-sources-test-"));
  try {
    mkdirSync(join(root, "core", "roles"), { recursive: true });
    mkdirSync(join(root, "mcp"), { recursive: true });
    writeFileSync(join(root, "core", "roles", "builder.md"), "prompt body\n", "utf8");
    writeFileSync(
      join(root, "core", "agents.json"),
      JSON.stringify({
        roles: {
          builder: { prompt: "core/roles/builder.md", claude: {}, codex: {} },
        },
      }),
      "utf8",
    );
    writeFileSync(join(root, "mcp", "catalog.json"), JSON.stringify({ schemaVersion: 1, servers: {} }), "utf8");
    const problems = checkEntryPoints(root);
    assert.ok(problems.some((p) => p.includes("missing 'opencode' routing block")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
