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
const TOOLS = ["claude", "codex", "opencode"].filter((t) => (!want.length && true) || want.includes(t));
// No shell: on Windows a shell concatenates args WITHOUT quoting and breaks prompts. npm .cmd shims are resolved to
// the real executable (an .exe, or node + a .js entry) so every argument reaches the CLI intact.
function resolveExe(name) {
  if (process.platform !== "win32") return [name];
  const where = spawnSync("where", [name], { encoding: "utf8" }).stdout.split(/\r?\n/).filter(Boolean);
  const exe = where.find((p) => p.toLowerCase().endsWith(".exe"));
  if (exe) return [exe];
  const cmd = where.find((p) => p.toLowerCase().endsWith(".cmd"));
  if (!cmd) return [name];
  const line = readFileSync(cmd, "utf8").split(/\r?\n/).reverse().find((l) => /%dp0%/.test(l) && /\.(exe|js)"/.test(l));
  const target = line && /"%dp0%[\/]*([^"]+\.(?:exe|js))"/.exec(line)?.[1];
  if (!target) return [name];
  const full = join(dirname(cmd), target);
  return full.endsWith(".js") ? [process.execPath, full] : [full];
}
const sh = (cmd, args, opts = {}) => {
  const [exe, ...pre] = resolveExe(cmd);
  return spawnSync(exe, [...pre, ...args], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, ...opts });
};

const gatewayArgs = (audit) => [
  `${R}/runtime/mcp-gateway/server.mjs`, "--profile", "evidence", "--role", "builder",
  "--catalog", `${R}/evaluation/fixtures/mcp/catalog.json`, "--profile-dir", `${R}/evaluation/fixtures/mcp/profiles`,
  "--downstream", `${R}/evaluation/fixtures/mcp/downstream.mjs`, "--audit", audit.replace(/\\/g, "/"),
];

const SCENARIOS = {
  lookup: {
    tool: "notes__lookup",
    prompt: (nonce, name) => `Call the MCP tool notes__lookup of the MCP server named ${name} with the argument object {"q":"${nonce}"}. Then reply with one line: the first line of the tool result.`,
    args: (nonce) => ({ q: nonce }),
  },
  stepup: {
    tool: "writer__insert",
    prompt: (nonce, name) => `Call the MCP tool writer__insert of the MCP server named ${name} with the argument object {"t":"${nonce}"}. Then reply with one line: the exact text the tool returned.`,
    args: (nonce) => ({ t: nonce }),
  },
};

function command(tool, { dir, audit, prompt, name }) {
  if (tool === "claude") {
    const cfg = join(dir, "mcp.json");
    writeFileSync(cfg, JSON.stringify({ mcpServers: { [name]: { command: "node", args: gatewayArgs(audit) } } }));
    return ["claude", ["-p", prompt, "--mcp-config", cfg, "--strict-mcp-config", "--allowedTools", `mcp__${name}__notes__lookup,mcp__${name}__writer__insert`, "--model", "claude-haiku-4-5-20251001"]];
  }
  if (tool === "codex") {
    // Codex refuses every MCP tool call in non-interactive mode unless the server is pre-approved
    // (`MCP tool call requires approval, but approval policy is never`). With default_tools_approval_mode=approve
    // the gateway is the ONLY control, which is exactly the design: it decides, not the tool.
    return ["codex", ["exec", "--skip-git-repo-check", "--sandbox", "read-only", "-c", 'approval_policy="never"', "-c", `mcp_servers.${name}.command="node"`, "-c", `mcp_servers.${name}.args=${JSON.stringify(gatewayArgs(audit))}`, "-c", `mcp_servers.${name}.default_tools_approval_mode="approve"`, prompt]];
  }
  writeFileSync(join(dir, "opencode.json"), JSON.stringify({ $schema: "https://opencode.ai/config.json", mcp: { [name]: { type: "local", enabled: true, command: ["node", ...gatewayArgs(audit)] } }, permission: { [`${name}_notes__lookup`]: "allow", [`${name}_writer__insert`]: "allow" } }));
  // --standalone: a private server per run. The default background service is shared and long-lived: it keeps MCP
  // servers by name from earlier runs and does not load a new project's config (found while building this runner)
  return ["opencode", ["run", "--standalone", prompt]];
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
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const dir = mkdtempSync(join(tmpdir(), `ai-native-c5-${tool}-`));
    mkdirSync(dir, { recursive: true });
    sh("git", ["init", "-q"], { cwd: dir });
    const audit = join(dir, "audit.jsonl");
    const nonce = `c5-${tool}-${scenarioName}-${Math.random().toString(36).slice(2, 8)}`;
    // OpenCode runs as a service and keeps MCP servers alive BY NAME across runs and projects, ignoring a new
    // project config for an existing name (found while building this runner). A unique name per attempt forces a
    // fresh gateway process with this attempt's audit path.
    const name = `gw${Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(2, 8)}`;
    const hint = tool === "opencode" ? ` In OpenCode, MCP tools are reached through the execute tool as tools.<server>.<tool>. Use ONLY the server named ${name} (other servers in the list are stale and must be ignored): run exactly await tools.${name}.${SCENARIOS[scenarioName].tool}(${JSON.stringify(SCENARIOS[scenarioName].args(nonce))}).` : "";
    const [cmd, args] = command(tool, { dir, audit, name, prompt: SCENARIOS[scenarioName].prompt(nonce, name) + hint });
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


// ---- C3 (Codex project config): the adapter-generated .codex/config.toml is read from a TRUSTED PROJECT.
// Two runs with the SAME generated config and nothing on the command line: untrusted project -> the gateway tool is
// unavailable; trusted project (a temporary CODEX_HOME that only carries the credential) -> the call reaches the
// gateway. The user's own ~/.codex/config.toml is never touched.
async function runC3() {
  const { homedir } = await import("node:os");
  const { governedCatalog } = await import("../../runtime/adapters/gateway.mjs");
  const { buildCodexConfigToml } = await import("../../runtime/adapters/codex.mjs");
  const { loadAgents } = await import("../../runtime/adapters/sources.mjs");
  const base = mkdtempSync(join(tmpdir(), "ai-native-c3-"));
  const proj = join(base, "proj");
  mkdirSync(join(proj, ".codex"), { recursive: true });
  sh("git", ["init", "-q"], { cwd: proj });
  const fxRoot = join(base, "fxroot");
  mkdirSync(join(fxRoot, "mcp"), { recursive: true });
  for (const f of ["evidence.json", "none.json"]) {
    mkdirSync(join(fxRoot, "mcp", "profiles"), { recursive: true });
    writeFileSync(join(fxRoot, "mcp", "profiles", f), readFileSync(join(repoRoot, "evaluation", "fixtures", "mcp", "profiles", f)));
  }
  const audit = join(proj, "audit.jsonl").split("\\").join("/");
  const catalog = JSON.parse(readFileSync(join(repoRoot, "evaluation", "fixtures", "mcp", "catalog.json"), "utf8"));
  const g = governedCatalog({ catalog, root: fxRoot, profile: "evidence", script: `${R}/runtime/mcp-gateway/server.mjs`, audit });
  g.servers["ai-native-gateway"].args.push("--catalog", `${R}/evaluation/fixtures/mcp/catalog.json`, "--profile-dir", `${R}/evaluation/fixtures/mcp/profiles`, "--downstream", `${R}/evaluation/fixtures/mcp/downstream.mjs`);
  const toml = buildCodexConfigToml(loadAgents(repoRoot), g);
  writeFileSync(join(proj, ".codex", "config.toml"), toml);
  const home = join(base, "home");
  mkdirSync(home);
  const auth = join(homedir(), ".codex", "auth.json");
  if (existsSync(auth)) writeFileSync(join(home, "auth.json"), readFileSync(auth));
  const key = proj.toLowerCase();
  const homeToml = (trusted) => `approval_policy = "never"\n${trusted ? `\n[projects.'${key}']\ntrust_level = "trusted"\n` : ""}`;
  const one = (trusted) => {
    writeFileSync(join(home, "config.toml"), homeToml(trusted));
    rmSync(audit, { force: true });
    const nonce = `c3-${trusted ? "trusted" : "untrusted"}-${Math.random().toString(36).slice(2, 8)}`;
    const r = sh("codex", ["exec", "--skip-git-repo-check", "--sandbox", "read-only", `Call the MCP tool notes__lookup (it belongs to the MCP server ai-native-gateway) with the argument object {"q":"${nonce}"}. Do not list resources. Then reply with one line: the first line of the tool result.`], { cwd: proj, timeout: 5 * 60 * 1000, input: "", env: { ...process.env, CODEX_HOME: home } });
    let entries = [];
    try { entries = readAudit(audit); } catch { entries = []; }
    const hit = entries.some((e) => e.server === "notes" && e.operation === "lookup" && e.decision === "ALLOW" && e.outcome === "ok" && e.argsDigest === argsDigest({ q: nonce }));
    return { trusted, nonce, reachedGateway: hit, auditEntries: entries, stdoutTail: String(r.stdout ?? "").trim().split(/\r?\n/).slice(-2).join(" | ").slice(0, 300) };
  };
  const trusted = one(true);
  const untrusted = one(false);
  const ok = trusted.reachedGateway && !untrusted.reachedGateway;
  const out = { status: ok ? "CONFIRMED" : "NOT_AVAILABLE_FROM_TOOL", generatedConfig: toml.split("\n").filter((l) => !l.startsWith("args")).join("\n"), trusted, untrusted };
  rmSync(base, { recursive: true, force: true });
  return out;
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
if (want.includes("c3") || !want.length) {
  console.error("== c3 (codex project config)");
  results.c3 = await runC3();
  console.error(`   c3=${results.c3.status}`);
}
writeFileSync(OUT, `${JSON.stringify(results, null, 2)}\n`);
console.error(`wrote ${OUT}`);
