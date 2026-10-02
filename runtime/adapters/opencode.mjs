// OpenCode adapter (M3.3, AGT-04; PAR-ADAPTERS). Derives opencode.json
// from core/agents.json + mcp/catalog.json. Ported from
// sync-agentic-adapters.ps1's ConvertTo-OpenCodeConfig/
// ConvertTo-OpenCodeMcpServers.
//
// Legacy's ConvertTo-CanonicalJson existed only to work around
// ConvertTo-Json formatting inconsistently between PowerShell Desktop
// (5.1) and Core (7.x) -- a pwsh-specific problem. Node's
// JSON.stringify has no such split; sorting object keys before
// construction is enough to make this deterministic, no custom
// serializer needed.
//
// Entrada concreta de M2.3 (evaluation/compat/findings.md, #4): OpenCode
// confirmed `permission.bash` actually blocks (unlike Codex's sandbox on
// Windows) -- `permission` is carried through from core/agents.json's
// `opencode.permission` block exactly as declared, as the real
// enforcement primitive for this tool.
//
// `plugin` (a candidate hook-equivalent per findings.md #c4-hooks) is
// deliberately NOT generated: C2/C3 remain open per the M2.3 spike, and
// this adapter does not invent configuration for unverified behavior.
function sortedMcpServers(mcpCatalog) {
  return Object.entries(mcpCatalog.servers ?? {}).sort(([a], [b]) => a.localeCompare(b));
}

export function buildOpenCodeMcpServers(mcpCatalog) {
  const servers = {};
  for (const [name, server] of sortedMcpServers(mcpCatalog)) {
    if (server.type === "remote") {
      servers[name] = {
        type: "remote",
        url: server.url,
        ...(server.headers ? { headers: server.headers } : {}),
        ...(server.oauth != null ? { oauth: server.oauth } : {}),
      };
    } else if (server.type === "local") {
      servers[name] = {
        type: "local",
        command: [server.command, ...(server.args ?? [])],
        ...(server.cwd ? { cwd: server.cwd } : {}),
        ...(server.env ? { environment: server.env } : {}),
      };
    } else {
      throw new Error(`unsupported MCP server type for '${name}': ${server.type}`);
    }
  }
  return servers;
}

export function buildOpenCodeConfig(agents, mcpCatalog) {
  const roleNames = Object.keys(agents.roles).sort();
  const agent = {};
  for (const name of roleNames) {
    const role = agents.roles[name];
    agent[name] = {
      description: role.description,
      mode: role.opencode.mode,
      model: role.opencode.model,
      prompt: `{file:./${role.prompt}}`,
      reasoningEffort: role.opencode.reasoningEffort,
      permission: role.opencode.permission,
    };
  }
  const firstRole = agents.roles[roleNames[0]];
  const config = {
    $schema: "https://opencode.ai/config.json",
    instructions: agents.opencodeInstructions ?? [],
    model: firstRole.opencode.model,
    agent,
    mcp: { servers: buildOpenCodeMcpServers(mcpCatalog) },
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}
