#!/usr/bin/env node
// M5.2: REAL L2 run (model-involving, N>=3) of the circuit-behavior suite with Claude Code as the agent.
//   node evaluation/m52/run-l2.mjs --out <result.json> [--runs 3] [--model <id>] [--scenario <id>]...
// The agent (`claude -p`) runs with cwd = a fresh consumer fixture and READ-ONLY access (Read/Grep/Glob, plan mode)
// to a copy of the platform source (core/, contracts/, runtime/{circuit,policy,lib}) WITHOUT evaluation/ and WITHOUT
// *.test.mjs: it must derive each answer from the platform's own code and rules, never from the expected values.
// The agent is told only the KEYS of the expected object. Nothing here simulates an agent: every number comes from
// real `claude -p` invocations (session ids and per-call cost are kept in the evidence).
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSuite, runL2, writeResult, DEFAULT_SUITE } from "../../runtime/evals/harness.mjs";
import { headSha } from "../../runtime/lib/git.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const value = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const values = (n) => argv.flatMap((a, i) => (a === n ? [argv[i + 1]] : []));
const out = value("--out");
if (!out) throw new Error("usage: run-l2.mjs --out <result.json> [--runs 3] [--model <id>] [--scenario <id>]...");
const runs = Number(value("--runs") ?? 3);
const only = values("--scenario");
const modelArg = value("--model");

const view = mkdtempSync(join(tmpdir(), "ai-native-l2-view-"));
for (const dir of ["core", "contracts", "runtime/circuit", "runtime/policy", "runtime/lib"]) {
  cpSync(join(repoRoot, dir), join(view, dir), { recursive: true, filter: (src) => !/\.test\.mjs$/.test(src) && !/[\\/]fixtures?([\\/]|$)/.test(src) });
}
const fixture = mkdtempSync(join(tmpdir(), "ai-native-l2-fixture-"));
writeFileSync(join(fixture, "AGENTS.md"), "# L2 fixture\n\nYou evaluate AI-Native platform behavior. The platform source is read-only at the directory given in the prompt. Answer ONLY with one JSON object.\n");

const suite = loadSuite(DEFAULT_SUITE);
if (only.length) suite.scenarios = suite.scenarios.filter((s) => only.includes(s.id));
const calls = [];
let modelSeen = null;

function agent(scenario) {
  const keys = [...new Set(Object.keys(scenario.expected).map((k) => (k.endsWith("Include") ? k.slice(0, -"Include".length) : k)))];
  const prompt = [
    "You are evaluating the behavior of the AI-Native platform for ONE scenario.",
    `Platform source (read-only, use Read/Grep/Glob; do not run commands): ${view}`,
    "Derive the answer from the platform's own code and rules: runtime/circuit/*.mjs (assess, converge, verify, ready...), runtime/policy/*.mjs, core/*.",
    `Question: ${scenario.question}`,
    `Scenario kind: ${scenario.kind}`,
    `Input (JSON): ${JSON.stringify(scenario.input)}`,
    `Reply with ONLY one JSON object (no prose, no code fence) with exactly these keys: ${JSON.stringify(keys)}. Use arrays for list-valued keys (e.g. requiredReviews, requiredArtifacts, missing) and booleans/strings as the platform would return them.`,
  ].join("\n");
  const args = ["-p", prompt, "--output-format", "json", "--permission-mode", "plan", "--add-dir", view, "--allowedTools", "Read", "Grep", "Glob"];
  if (modelArg) args.push("--model", modelArg);
  const started = Date.now();
  const r = spawnSync("claude", args, { cwd: fixture, encoding: "utf8", input: "", timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
  let parsed = null;
  try { parsed = JSON.parse(r.stdout); } catch { /* handled below */ }
  const record = { scenario: scenario.id, status: r.status, ms: Date.now() - started, sessionId: parsed?.session_id ?? null, isError: parsed?.is_error ?? true };
  if (!parsed || parsed.is_error) { calls.push({ ...record, error: (r.stderr || r.stdout || "").slice(0, 300) }); return { actual: {} }; }
  modelSeen ??= Object.keys(parsed.modelUsage ?? {})[0] ?? null;
  const text = String(parsed.result ?? "");
  let actual = {};
  const m = text.match(/\{[\s\S]*\}/);
  try { actual = m ? JSON.parse(m[0]) : {}; } catch { actual = {}; }
  const tokens = (parsed.usage?.input_tokens ?? 0) + (parsed.usage?.cache_read_input_tokens ?? 0) + (parsed.usage?.cache_creation_input_tokens ?? 0) + (parsed.usage?.output_tokens ?? 0);
  calls.push({ ...record, answer: actual, cost: parsed.total_cost_usd ?? null, tokens });
  return { actual, tokens, cost: parsed.total_cost_usd ?? 0 };
}

const version = spawnSync("claude", ["--version"], { encoding: "utf8" }).stdout.trim();
const probe = spawnSync("claude", ["-p", "Reply with only the word OK", "--output-format", "json"], { cwd: fixture, encoding: "utf8", input: "" });
let modelId = modelArg;
try { modelId ??= Object.keys(JSON.parse(probe.stdout).modelUsage ?? {})[0]; } catch { /* keep null */ }
if (!modelId) throw new Error("could not identify the model of the real agent (claude -p probe failed)");

const commit = headSha(repoRoot);
const { perRun, result } = await runL2({ suite, commit, agent, model: { id: modelId }, tool: { name: "claude-code", version: version.replace(/\s*\(.*$/, "") }, runs });
writeResult(resolve(out), result);
const detail = resolve(out).replace(/\.json$/, ".calls.json");
writeFileSync(detail, `${JSON.stringify({ commit, tool: `claude-code ${version}`, model: modelId, modelSeen, fixture: "temp consumer fixture (AGENTS.md only)", platformView: "core, contracts, runtime/{circuit,policy,lib} without tests/fixtures/evaluation", perRun, calls }, null, 2)}\n`);
rmSync(view, { recursive: true, force: true });
rmSync(fixture, { recursive: true, force: true });
console.log(JSON.stringify({ status: result.status, score: result.metrics.score, variance: result.metrics.variance, perRun, model: modelId, commit, cost: result.metrics.cost }, null, 2));
process.exit(result.status === "PASS" ? 0 : 1);
