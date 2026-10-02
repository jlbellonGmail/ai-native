import { test } from "node:test";
import assert from "node:assert/strict";
import { buildClaudeBridge, buildClaudeMcpJson, buildClaudeAgentFile, CLAUDE_HOOK_PATH_RULE } from "./claude.mjs";

test("buildClaudeBridge is the @AGENTS.md bridge, nothing else", () => {
  assert.equal(buildClaudeBridge(), "@AGENTS.md\n");
});

test("CLAUDE_HOOK_PATH_RULE documents $CLAUDE_PROJECT_DIR (M2.3 finding #1)", () => {
  assert.equal(CLAUDE_HOOK_PATH_RULE, "$CLAUDE_PROJECT_DIR");
});

test("buildClaudeMcpJson is empty mcpServers for an empty catalog", () => {
  assert.equal(buildClaudeMcpJson({ servers: {} }), '{\n  "mcpServers": {}\n}\n');
});

test("buildClaudeMcpJson converts a local server, sorted by name", () => {
  const catalog = { servers: { zeta: { type: "local", command: "zeta-cmd" }, alpha: { type: "local", command: "alpha-cmd", args: ["--x"] } } };
  const result = JSON.parse(buildClaudeMcpJson(catalog));
  assert.deepEqual(Object.keys(result.mcpServers), ["alpha", "zeta"]);
  assert.deepEqual(result.mcpServers.alpha, { command: "alpha-cmd", args: ["--x"] });
});

test("buildClaudeMcpJson converts a remote server to type=http", () => {
  const catalog = { servers: { docs: { type: "remote", url: "https://example.invalid/mcp", headers: { "X-A": "1" } } } };
  const result = JSON.parse(buildClaudeMcpJson(catalog));
  assert.deepEqual(result.mcpServers.docs, { type: "http", url: "https://example.invalid/mcp", headers: { "X-A": "1" } });
});

test("buildClaudeMcpJson throws on an unsupported server type", () => {
  assert.throws(() => buildClaudeMcpJson({ servers: { x: { type: "weird" } } }), /unsupported MCP server type/);
});

test("buildClaudeAgentFile renders frontmatter + prompt body", () => {
  const role = { description: "A role.", claude: { tools: ["Read", "Bash"], model: "sonnet", effort: "high" } };
  const content = buildClaudeAgentFile("builder", role, "Prompt body.", "GENERATED notice");
  assert.match(content, /^---\nname: builder\n/);
  assert.match(content, /tools: Read, Bash/);
  assert.match(content, /<!-- GENERATED notice -->/);
  assert.match(content, /Prompt body\.\n$/);
});
