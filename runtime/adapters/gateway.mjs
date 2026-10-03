// C5 (plan SS11): a tool must reach MCP servers ONLY through the gateway. The adapters used to publish every
// server of mcp/catalog.json straight into the tool's config (.mcp.json, .codex/config.toml, opencode.json), which
// bypasses profile, allowlist, role x capability policy, step-up, output sanitization and the audit (M4.4). This
// module replaces that catalog, for the three adapters, with ONE governed server entry:
//   ai-native-gateway -> node <gateway script> --profile <id> --role <role>
// Every operation of every server of the ACTIVE profile is then a tool `<server>__<operation>` (server.mjs).
// With profile `none` (the default), or a profile that lists no registered server, nothing is emitted: the tool
// gets no MCP at all (default deny), which is also what an empty catalog gave before.
import { loadMcpProfile } from "../mcp-gateway/gateway.mjs";
import { join } from "node:path";

export const GATEWAY_SERVER_NAME = "ai-native-gateway";
export const DEFAULT_GATEWAY_SCRIPT = "runtime/mcp-gateway/server.mjs";
/** Relative to the project the tool runs in: every governed call is recorded in a hash-chained audit by default. */
export const DEFAULT_AUDIT_PATH = ".ai-native/mcp-audit.jsonl";

/**
 * @param {object} o
 * @param {object} o.catalog       mcp/catalog.json
 * @param {string} o.root          where mcp/profiles/ lives (the platform release root)
 * @param {string} [o.profile]     active MCP profile id (default "none")
 * @param {string} [o.role]        role the gateway applies the policy for (default "builder")
 * @param {string} [o.audit]       audit file the gateway writes (default .ai-native/mcp-audit.jsonl)
 * @param {string} [o.script]      gateway script path as the TOOL will see it (relative for the platform repo,
 *                                 absolute with forward slashes for a consumer running a cached release)
 */
export function governedCatalog({ catalog, root, profile = "none", role = "builder", script = DEFAULT_GATEWAY_SCRIPT, audit = DEFAULT_AUDIT_PATH }) {
  // `none` means "no MCP" by definition and needs no file; any OTHER profile id must exist (fail closed on a typo)
  if (profile === "none") return { ...catalog, servers: {} };
  const active = loadMcpProfile(profile, join(root, "mcp", "profiles"));
  const exposed = active.servers.filter((s) => catalog.servers?.[s]);
  if (!exposed.length) return { ...catalog, servers: {} };
  return {
    ...catalog,
    servers: {
      [GATEWAY_SERVER_NAME]: {
        type: "local",
        command: "node",
        args: [script, "--profile", profile, "--role", role, "--audit", audit],
        // The gateway is the control. Codex otherwise refuses every MCP call in non-interactive mode
        // ("MCP tool call requires approval, but approval policy is never"); pre-approving THIS server is safe because
        // the gateway denies by default and never auto-approves a step-up.
        approvalMode: "approve",
      },
    },
  };
}
