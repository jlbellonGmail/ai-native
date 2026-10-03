#!/usr/bin/env node
// C5 evidence runner (plan SS15.4: "gateway MCP en las 3 herramientas: tools con namespace por servidor,
// step-up"). Drives the REAL Claude Code, Codex and OpenCode CLIs against runtime/mcp-gateway/server.mjs
// and writes evaluation/compat/c5-results.json. NOT run in CI (needs each tool's credentials and a model
// call); the committed result is validated by runtime/mcp-gateway/c5.test.mjs.
//
// Ground truth is NOT what the model says: it is the gateway's own hash-chained audit file. Per tool:
//   lookup   notes__lookup with a nonce  -> an ALLOW entry whose argsDigest is the digest of {q: nonce}
//   stepup   writer__insert              -> a DENY step_up_* entry and NO successful invocation
// A tool that cannot run (no credentials, no model, no MCP support) is recorded NOT_AVAILABLE_FROM_TOOL
// with the captured stderr; support is never assumed.
//   node evaluation/compat/run-c5.mjs [--tool claude|codex|opencode]...
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { argsDigest } from "../../runtime/mcp-gateway/stepup.mjs";
import { verifyAuditChain } from "../../runtime/mcp-gateway/gateway.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const R = repoRoot.replace(/\\/g, "/");
const OUT = join(repoRoot, "evaluation", "compat", "c5-results.json");
const argv = process.argv.slice(2);
const want = argv.flatMap((a, i) => (a === "--tool" ? [argv[i + 1]] : []));
const TOOLS = ["claude", "codex", "opencode"].filter((t) => !want.length || want.includes(t));
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", shell: process.platform === "win32" && !cmd.endsWith(".exe"), maxBuffer: 32 * 1024 * 1024, ...opts });

const gatewayArgs = (audit) => [
  `${R}/runtime/mcp-gateway/server.mjs`, "--profile", "evidence", "--role", "builder",
  "--catalog", `${R}/evaluation/fixtures/mcp/catalog.json`, "--profile-dir", `${R}/evaluation/fixtures/mcp/profiles`,
  "--downstream", `${R}/evaluation/fixtures/mcp/downstream.mjs`, "--audit", audit.replace(/\\/g, "/"),
];

const SCENARIOS = {
  lookup: {
    tool: "notes__lookup",
    prompt: (nonce) => `Call the MCP tool notes__lookup of the MCP server named gw with the argument object {"q":"${nonce}"}. Then reply with one line: the first line of the tool result.`,
    args: (nonce) => ({ q: nonce }),
  },
  stepup: {
    tool: "writer__insert",
    prompt: (nonce) => `Call the MCP tool writer__insert of the MCP server named gw with the argument object {"t":"${nonce}"}. Then reply with one line: the exact text the tool returned.`,
    args: (nonce) => ({ t: nonce }),
  },
};

function command(tool, { dir, audit, prompt }) {
  if (tool === "claude") {
    const cfg = join(dir, "mcp.json");
    writeFileSync(cfg, JSON.stringify({ mcpServers: { gw: { command: "node", args: gatewayArgs(audit) } } }));
    return ["claude", ["-p", prompt, "--mcp-config", cfg, "--strict-mcp-config", "--allowedTools", "mcp__gw__notes__lookup,mcp__gw__writer__insert", "--model", "claude-haiku-4-5-20251001"]];
  }
  if (tool === "codex") {
    // Codex refuses every MCP tool call in non-interactive mode unless the server is pre-approved
    // (`MCP tool call requires approval, but approval policy is never`). With default_tools_approval_mode=approve
    // the gateway is the ONLY control, which is exactly the design: it decides, not the tool.
    return ["codex", ["exec", "--skip-git-repo-check", "--sandbox", "read-only", "-c", 'approval_policy="never"', "-c", 'mcp_servers.gw.command="node"', "-c", `mcp_servers.gw.args=${JSON.stringify(gatewayArgs(audit))}`, "-c", 'mcp_servers.gw.default_tools_approval_mode="approve"', prompt]];
  }
  writeFileSync(join(dir, "opencode.json"), JSON.stringify({ $schema: "https://opencode.ai/config.json", mcp: { gw: { type: "local", enabled: true, command: ["node", ...gatewayArgs(audit)] } }, permission: { gw_notes__lookup: "allow", gw_writer__insert: "allow" } }));
  return ["opencode", ["run", prompt]];
}

function readAudit(path) {
  if (!existsSync(path)) return [];
  verifyAuditChain(path);
  return readFileSync(path, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

function judge(scenarioName, entries, nonce) {
  const s = SCENARIOS[scenarioName];
  const [server, operation] = s.tool.split("__");
  const digest = argsDigest(s.args(nonce));
  const mine = entries.filter((e) => e.server === server && e.operation === operation && e.argsDigest === digest);
  if (scenarioName === "lookup") return mine.some((e) => e.decision === "ALLOW" && e.outcome === "ok") ? "CONFIRMED" : "NOT_OBSERVED";
  const denied = mine.some((e) => e.decision === "DENY" && /^step_up_/.test(e.reason));
  const executed = entries.some((e) => e.server === server && e.outcome === "ok");
  return denied && !executed ? "CONFIRMED" : "NOT_OBSERVED";
}

function runScenario(tool, scenarioName) {
  const attempts = [];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const dir = mkdtempSync(join(tmpdir(), `ai-native-c5-${tool}-`));
    mkdirSync(dir, { recursive: true });
    sh("git", ["init", "-q"], { cwd: dir });
    const audit = join(dir, "audit.jsonl");
    const nonce = `c5-${tool}-${scenarioName}-${Math.random().toString(36).slice(2, 8)}`;
    const [cmd, args] = command(tool, { dir, audit, prompt: SCENARIOS[scenarioName].prompt(nonce) });
    const r = sh(cmd, args, { cwd: dir, timeout: 5 * 60 * 1000, input: "" });
    let entries = [];
    let chain = "OK";
    try {
      entries = readAudit(audit);
    } catch (error) {
      chain = `BROKEN: ${error.message}`;
    }
    const status = chain === "OK" ? judge(scenarioName, entries, nonce) : "NOT_OBSERVED";
    attempts.push({ attempt, exitCode: r.status, nonce, status, auditChain: chain, auditEntries: entries, stderrTail: String(r.stderr ?? "").trim().split(/\r?\n/).slice(-3).join(" | ").slice(0, 400), stdoutTail: String(r.stdout ?? "").trim().split(/\r?\n/).slice(-3).join(" | ").slice(0, 400) });
    rmSync(dir, { recursive: true, force: true });
    if (status === "CONFIRMED") break;
  }
  const last = attempts.at(-1);
  const ok = last.status === "CONFIRMED";
  return {
    status: ok ? "CONFIRMED" : "NOT_AVAILABLE_FROM_TOOL",
    ...(ok ? {} : { reason: `no audit entry proved the call after ${attempts.length} attempt(s): ${last.stderrTail || last.stdoutTail || "no output"}` }),
    attempts: attempts.length,
    proof: { nonce: last.nonce, expectedArgsDigest: argsDigest(SCENARIOS[scenarioName].args(last.nonce)), auditChain: last.auditChain, auditEntries: last.auditEntries },
  };
}

const version = (cmd) => String(sh(cmd, ["--version"]).stdout ?? "").trim().split(/\r?\n/)[0];
const platformCommit = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
const results = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { schemaVersion: 1, tools: {} };
results.generatedAt = new Date().toISOString();
results.platformCommit = platformCommit;
results.method = "real CLI -> runtime/mcp-gateway/server.mjs (stdio) -> gateway.call; ground truth = the gateway's hash-chained audit, never the model's text";
results.platform = `${process.platform} node ${process.version}`;
for (const tool of TOOLS) {
  console.error(`== ${tool}`);
  results.tools[tool] = { cliVersion: version(tool), scenarios: { lookup: runScenario(tool, "lookup"), stepup: runScenario(tool, "stepup") } };
  console.error(`   lookup=${results.tools[tool].scenarios.lookup.status} stepup=${results.tools[tool].scenarios.stepup.status}`);
}
writeFileSync(OUT, `${JSON.stringify(results, null, 2)}\n`);
console.error(`wrote ${OUT}`);
