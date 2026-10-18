import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOpenCodeConfig, buildOpenCodeMcpServers } from "./opencode.mjs";

const AGENTS = {
  opencodeInstructions: ["AGENTS.md"],
  roles: {
    builder: { description: "Builds.", prompt: "core/roles/builder.md", opencode: { mode: "subagent", model: "opencode-go/kimi", reasoningEffort: "high", permission: { edit: "allow", bash: "allow" } } },
    reviewer: { description: "Reviews.", prompt: "core/roles/reviewer.md", opencode: { mode: "subagent", model: "opencode-go/kimi", reasoningEffort: "high", permission: { edit: "deny", bash: "deny" } } },
  },
};

test("buildOpenCodeConfig renders agents sorted by role name with permission carried through verbatim", () => {
  const config = JSON.parse(buildOpenCodeConfig(AGENTS, { servers: {} }));
  assert.deepEqual(Object.keys(config.agent), ["builder", "reviewer"]);
  assert.deepEqual(config.agent.builder.permission, { edit: "allow", bash: "allow" });
  assert.equal(config.agent.reviewer.permission.bash, "deny");
});

test("buildOpenCodeConfig does not generate a speculative 'plugin' field (C2/C3 remain open)", () => {
  const config = JSON.parse(buildOpenCodeConfig(AGENTS, { servers: {} }));
  assert.equal("plugin" in config, false);
});

test("buildOpenCodeConfig points the prompt at the canonical core/roles/*.md file", () => {
  const config = JSON.parse(buildOpenCodeConfig(AGENTS, { servers: {} }));
  assert.equal(config.agent.builder.prompt, "{file:./core/roles/builder.md}");
});

test("buildOpenCodeMcpServers converts a local server into a command array", () => {
  const servers = buildOpenCodeMcpServers({ servers: { local1: { type: "local", command: "node", args: ["server.js"], cwd: "." } } });
  assert.deepEqual(servers.local1, { type: "local", command: ["node", "server.js"], cwd: "." });
});

test("buildOpenCodeMcpServers converts a remote server with oauth", () => {
  const servers = buildOpenCodeMcpServers({ servers: { remote1: { type: "remote", url: "https://example.invalid", oauth: { clientId: "x" } } } });
  assert.deepEqual(servers.remote1, { type: "remote", url: "https://example.invalid", oauth: { clientId: "x" } });
});

test("buildOpenCodeMcpServers throws on an unsupported server type", () => {
  assert.throws(() => buildOpenCodeMcpServers({ servers: { x: { type: "weird" } } }), /unsupported MCP server type/);
});

test("buildOpenCodeConfig with rolesDir (consumer mode) points each prompt at <rolesDir>/<role>.md, not at core/roles", () => {
  const config = JSON.parse(buildOpenCodeConfig(AGENTS, { servers: {} }, { rolesDir: ".opencode/roles" }));
  assert.equal(config.agent.builder.prompt, "{file:./.opencode/roles/builder.md}");
  assert.equal(config.agent.reviewer.prompt, "{file:./.opencode/roles/reviewer.md}");
  assert.doesNotMatch(JSON.stringify(config), /core\/roles/);
});
