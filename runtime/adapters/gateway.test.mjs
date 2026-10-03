// C5: tools reach MCP only through the gateway. The adapters must never publish catalog servers directly.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { governedCatalog, GATEWAY_SERVER_NAME } from "./gateway.mjs";
import { buildClaudeMcpJson } from "./claude.mjs";
import { buildCodexConfigToml } from "./codex.mjs";
import { buildOpenCodeConfig } from "./opencode.mjs";

const catalog = {
  schemaVersion: 1,
  servers: {
    notes: { type: "local", command: "node", args: ["downstream.mjs"], env: { SECRET: "x" }, permissions: ["lookup"] },
    remote: { type: "remote", url: "https://example.invalid/mcp", permissions: ["q"] },
  },
};
function root(profiles) {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-gwa-"));
  mkdirSync(join(dir, "mcp", "profiles"), { recursive: true });
  for (const [id, servers] of Object.entries(profiles)) writeFileSync(join(dir, "mcp", "profiles", `${id}.json`), JSON.stringify({ schemaVersion: 1, id, description: "t", servers }));
  return dir;
}
const AGENTS = { roles: { reviewer: { description: "r", prompt: "p.md", claude: { tools: [], model: "m", effort: "e" }, codex: { model: "gpt", model_reasoning_effort: "high" }, opencode: { mode: "subagent", model: "o", reasoningEffort: "high", permission: {} } } } };

test("profile none (the default) exposes no MCP at all, even with a populated catalog and no profile file", () => {
  assert.deepEqual(governedCatalog({ catalog, root: "/nonexistent" }).servers, {});
});

test("an active profile with registered servers yields exactly ONE governed server: the gateway", () => {
  const dir = root({ work: ["notes", "remote"] });
  const g = governedCatalog({ catalog, root: dir, profile: "work", script: "C:/rel/runtime/mcp-gateway/server.mjs" });
  assert.deepEqual(Object.keys(g.servers), [GATEWAY_SERVER_NAME]);
  assert.deepEqual(g.servers[GATEWAY_SERVER_NAME].args, ["C:/rel/runtime/mcp-gateway/server.mjs", "--profile", "work", "--role", "builder", "--audit", ".ai-native/mcp-audit.jsonl"]);
  assert.ok(g.servers[GATEWAY_SERVER_NAME].args.includes("--audit"), "the gateway of a generated config always audits");
  rmSync(dir, { recursive: true, force: true });
});

test("a profile that lists only unregistered servers exposes nothing; a profile that does not exist fails closed", () => {
  const dir = root({ ghosts: ["not-in-catalog"] });
  assert.deepEqual(governedCatalog({ catalog, root: dir, profile: "ghosts" }).servers, {});
  assert.throws(() => governedCatalog({ catalog, root: dir, profile: "typo" }), /does not exist/);
  rmSync(dir, { recursive: true, force: true });
});

test("none of the three tool configs ever contains a downstream server, its command, its env or its URL", () => {
  const dir = root({ work: ["notes", "remote"] });
  const g = governedCatalog({ catalog, root: dir, profile: "work" });
  const claude = buildClaudeMcpJson(g);
  const codex = buildCodexConfigToml(AGENTS, g);
  const opencode = JSON.stringify(buildOpenCodeConfig(AGENTS, g));
  for (const text of [claude, codex, opencode]) {
    assert.ok(text.includes(GATEWAY_SERVER_NAME), "the gateway is present");
    for (const leak of ["downstream.mjs", "SECRET", "example.invalid", '"notes"', "[mcp_servers.notes]", "[mcp_servers.remote]"]) assert.equal(text.includes(leak), false, `${leak} leaked`);
  }
  rmSync(dir, { recursive: true, force: true });
});

test("codex pre-approves ONLY the gateway server (the gateway is the control); claude and opencode use their native shapes", () => {
  const dir = root({ work: ["notes"] });
  const g = governedCatalog({ catalog, root: dir, profile: "work" });
  assert.match(buildCodexConfigToml(AGENTS, g), /\[mcp_servers\.ai-native-gateway\]\ncommand = "node"\nargs = \[[^\]]*\]\ndefault_tools_approval_mode = "approve"/);
  assert.deepEqual(Object.keys(JSON.parse(buildClaudeMcpJson(g)).mcpServers), [GATEWAY_SERVER_NAME]);
  // OpenCode reads mcp.<name>; mcp.servers.<name> is NOT loaded (verified against the real CLI)
  const oc = JSON.parse(buildOpenCodeConfig(AGENTS, g));
  assert.deepEqual(Object.keys(oc.mcp), [GATEWAY_SERVER_NAME]);
  assert.equal("servers" in oc.mcp, false);
  assert.equal(oc.mcp[GATEWAY_SERVER_NAME].type, "local");
  rmSync(dir, { recursive: true, force: true });
});

test("an empty catalog still produces empty configs in all three tools (no behaviour change for the repo today)", () => {
  assert.equal(buildClaudeMcpJson({ servers: {} }), '{\n  "mcpServers": {}\n}\n');
  assert.deepEqual(JSON.parse(buildOpenCodeConfig(AGENTS, { servers: {} })).mcp, {});
});
