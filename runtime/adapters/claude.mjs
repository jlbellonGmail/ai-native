// Claude Code adapter (M3.3, AGT-04; PAR-ADAPTERS). Derives CLAUDE.md,
// .mcp.json and .claude/agents/<role>.md from core/agents.json +
// mcp/catalog.json. Ported from sync-agentic-adapters.ps1's
// ConvertTo-ClaudeAgent/ConvertTo-ClaudeMcpJson.
//
// Entrada concreta de M2.3 (evaluation/compat/findings.md, #1): any hook
// generated for Claude must use `$CLAUDE_PROJECT_DIR`, never a bare
// relative path -- a relative path confirmed to fail silently in
// non-interactive `-p` mode. No hook file is generated here yet (no
// canonical hook source exists in core/ as of M3.3); this constant
// documents the rule so a future hook generator does not have to
// rediscover it.
export const CLAUDE_HOOK_PATH_RULE = "$CLAUDE_PROJECT_DIR";

export function buildClaudeBridge() {
  return "@AGENTS.md\n";
}

function sortedMcpServers(mcpCatalog) {
  return Object.entries(mcpCatalog.servers ?? {}).sort(([a], [b]) => a.localeCompare(b));
}

export function buildClaudeMcpJson(mcpCatalog) {
  const mcpServers = {};
  for (const [name, server] of sortedMcpServers(mcpCatalog)) {
    if (server.type === "remote") {
      mcpServers[name] = { type: "http", url: server.url, ...(server.headers ? { headers: server.headers } : {}) };
    } else if (server.type === "local") {
      mcpServers[name] = {
        command: server.command,
        ...(server.args ? { args: server.args } : {}),
        ...(server.env ? { env: server.env } : {}),
      };
    } else {
      throw new Error(`unsupported MCP server type for '${name}': ${server.type}`);
    }
  }
  return `${JSON.stringify({ mcpServers }, null, 2)}\n`;
}

// A JSON string is a valid YAML double-quoted scalar (as in commands.mjs), on one line and exact; JSON leaves raw the
// characters YAML 1.1 reads as line breaks or rejects as non-printable (DEL, C1, U+2028/2029), so they are escaped too
const yamlQuoted = (text) => JSON.stringify(text).replace(/[\u007f-\u009f\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);

export function buildClaudeAgentFile(name, role, prompt, notice) {
  const tools = (role.claude.tools ?? []).join(", ");
  return `---
name: ${name}
description: ${yamlQuoted(role.description)}
tools: ${tools}
model: ${role.claude.model}
effort: ${role.claude.effort}
---

<!-- ${notice} -->

${prompt}
`;
}
