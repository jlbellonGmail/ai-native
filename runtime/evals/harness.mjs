// Evaluation harness L1/L2 (M4.6, EVL-01; PAR-EVAL-REAL). TEMPLATE
// v2.0.5's agentic-evals.ps1 never evaluated anything: each scenario
// carried a hand-written `actual` equal to `expected` (D-4), so the
// "passRate: 1" it reported was true by construction. Here:
//   - the dataset carries only `input` + `expected`; a scenario that
//     carries `actual` is rejected outright;
//   - L1 (deterministic, no model, runs=1) EXECUTES the real circuit code
//     (assess, convergence, verify, evidence contract, policy engine) and
//     computes `actual` from it; if the code changes behavior, scenarios
//     fail (mutation tests prove it);
//   - L2 (model-involving) takes an injected `agent` and enforces the
//     statistical rules of eval-result.schema.json: N>=3 runs, model
//     identified, variance reported. No agent runner is shipped, and no
//     model is ever called by this module: an L2 result only exists when
//     the caller supplies a real agent;
//   - every metric states MEASURED or NOT_AVAILABLE_FROM_TOOL; a missing
//     metric is never a silent null;
//   - results are validated against contracts/eval-result.schema.json and
//     carry datasetDigest + platform commit, so a result can't be mistaken
//     for evidence about a different dataset or commit.
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../lib/schema-lite.mjs";
import { assess } from "../circuit/assess.mjs";
import { decideConvergence } from "../circuit/converge.mjs";
import { isVerifyStale, hasFreshPassingVerify } from "../circuit/verify.mjs";
import { checkRequiredArtifacts, getEvidenceContract } from "../circuit/contract.mjs";
import { resolvePolicyDecision } from "../policy/policy.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const evalSchema = JSON.parse(readFileSync(join(root, "contracts", "eval-result.schema.json"), "utf8"));
export const DEFAULT_SUITE = join(root, "evaluation", "scenarios", "scenarios.json");
export const RUNNER_VERSION = "1.0.0";
export const MIN_STOCHASTIC_RUNS = 3;

export class HarnessError extends Error {}

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
}

export function datasetDigest(suite) {
  return `sha256:${createHash("sha256").update(canonical(suite.scenarios)).digest("hex")}`;
}

export function loadSuite(path = DEFAULT_SUITE) {
  const suite = JSON.parse(readFileSync(path, "utf8"));
  assertSuite(suite);
  return suite;
}

export function assertSuite(suite) {
  if (suite?.schemaVersion !== 1 || !Array.isArray(suite.scenarios) || suite.scenarios.length === 0) throw new HarnessError("invalid suite: schemaVersion/scenarios");
  const seen = new Set();
  for (const s of suite.scenarios) {
    if (!s.id || seen.has(s.id)) throw new HarnessError(`invalid suite: missing or duplicate scenario id ${s.id}`);
    seen.add(s.id);
    if ("actual" in s) throw new HarnessError(`scenario ${s.id} carries a hand-authored "actual" (D-4): actual must be computed by the harness`);
    if (!s.expected || typeof s.expected !== "object") throw new HarnessError(`scenario ${s.id} has no expected`);
  }
}

/** Real executors: each calls the production code for its scenario kind. */
export const EXECUTORS = {
  assess({ changedPaths }) {
    const r = assess(changedPaths);
    const contract = getEvidenceContract(r.depth);
    return { depth: r.depth, risk: r.risk, score: r.score, requiredReviews: contract.requiredReviews, requiredArtifacts: contract.requiredArtifacts };
  },
  converge({ steps }) {
    let previous = null;
    const verdicts = [];
    let last;
    for (const step of steps) {
      last = decideConvergence({ ...step, previous });
      verdicts.push(last.verdict);
      previous = { findingsFingerprint: last.findings.fingerprint, openFindings: last.findings.openCount };
    }
    return { stepVerdicts: verdicts, terminal: last.terminal, verdict: last.verdict, escalation: last.escalation, noProgress: last.noProgress, progress: last.progress };
  },
  "stale-verify"({ verifyTreeSha, currentTreeSha }) {
    const event = { eventType: "verify", treeSha: verifyTreeSha, status: "PASS", exitCode: 0 };
    return { stale: isVerifyStale(event, currentTreeSha), freshPassing: hasFreshPassingVerify([event], currentTreeSha) };
  },
  evidence({ depth, present }) {
    const dir = mkdtempSync(join(tmpdir(), "ai-native-eval-"));
    try {
      for (const name of present) writeFileSync(join(dir, name), "content");
      const r = checkRequiredArtifacts(dir, depth);
      return { ok: r.ok, missing: r.missing };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
  policy({ role, capability, scope }) {
    return { decision: resolvePolicyDecision({ role, capability, scope }).decision };
  },
};

/** expected is satisfied when every key matches; `<key>Include` keys check array containment against `<key>`. */
export function compare(expected, actual) {
  const failures = [];
  for (const [key, want] of Object.entries(expected)) {
    if (key.endsWith("Include")) {
      const field = key.slice(0, -"Include".length);
      const have = actual[field] ?? [];
      const arr = Array.isArray(have) ? have : [];
      const missing = want.filter((w) => !arr.includes(w));
      if (missing.length) failures.push(`${field} is missing ${JSON.stringify(missing)} (actual ${JSON.stringify(have)})`);
    } else if (!(key in actual)) {
      failures.push(`${key}: expected ${canonical(want)}, but the executor did not produce it`); // absent is never equal to null
    } else if (canonical(actual[key]) !== canonical(want)) {
      failures.push(`${key}: expected ${canonical(want)}, actual ${canonical(actual[key])}`);
    }
  }
  return failures;
}

function platformIdentity(commit) {
  const version = readFileSync(join(root, "VERSION"), "utf8").trim();
  return { version: version.startsWith("v") ? version : `v${version}`, commit };
}

function buildResult({ level, suite, commit, runs, score, variance, durationMs, status, threshold, extra = {} }) {
  const result = {
    schemaVersion: 1,
    level,
    suite: suite.suite,
    suiteVersion: suite.suiteVersion,
    datasetDigest: datasetDigest(suite),
    platform: platformIdentity(commit),
    runs,
    metrics: {
      score,
      variance,
      cost: null,
      contextTokens: null,
      durationMs,
      metricStatus: {
        score: "MEASURED",
        variance: variance === null ? "NOT_AVAILABLE_FROM_TOOL" : "MEASURED",
        cost: "NOT_AVAILABLE_FROM_TOOL",
        contextTokens: "NOT_AVAILABLE_FROM_TOOL",
        durationMs: "MEASURED",
      },
    },
    threshold,
    status,
    runnerVersion: RUNNER_VERSION,
    ...extra,
  };
  const errors = validate(result, evalSchema);
  if (errors.length) throw new HarnessError(`harness produced an invalid eval-result: ${errors.join("; ")}`);
  return result;
}

const statusFor = (score, threshold) => (score >= threshold ? "PASS" : "FAIL");

/** L1: deterministic, executes real code, runs=1. */
export function runL1({ suite, commit, threshold = 1, executors = EXECUTORS, now = Date.now }) {
  assertSuite(suite);
  if (!/^[0-9a-f]{40}$/.test(commit ?? "")) throw new HarnessError("runL1 requires the 40-hex platform commit being evaluated");
  const started = now();
  const scenarios = suite.scenarios.map((s) => {
    const executor = executors[s.kind];
    if (!executor) return { id: s.id, passed: false, failures: [`no executor for kind ${s.kind}`] };
    let actual;
    try {
      actual = executor(s.input ?? {});
    } catch (error) {
      return { id: s.id, passed: false, failures: [`executor threw: ${error.message}`] };
    }
    const failures = compare(s.expected, actual);
    return { id: s.id, passed: failures.length === 0, failures, actual };
  });
  const score = scenarios.filter((s) => s.passed).length / scenarios.length;
  return { scenarios, result: buildResult({ level: "L1", suite, commit, runs: 1, score, variance: null, durationMs: Math.max(0, now() - started), status: statusFor(score, threshold), threshold }) };
}

/**
 * L2: model-involving. `agent(scenario)` -> actual object (and may return
 * `{ actual, tokens, cost }`). Requires a model identity and N>=3 runs.
 */
export async function runL2({ suite, commit, agent, model, tool = null, runs = MIN_STOCHASTIC_RUNS, threshold = 0.8, now = Date.now }) {
  assertSuite(suite);
  if (typeof agent !== "function") throw new HarnessError("runL2 requires an injected agent function (no agent runner is bundled)");
  if (!model?.id) throw new HarnessError("runL2 requires model.id: a result must identify the model it measured");
  if (!Number.isInteger(runs) || runs < MIN_STOCHASTIC_RUNS) throw new HarnessError(`runL2 requires runs >= ${MIN_STOCHASTIC_RUNS} for a stochastic suite`);
  if (!/^[0-9a-f]{40}$/.test(commit ?? "")) throw new HarnessError("runL2 requires the 40-hex platform commit being evaluated");
  const started = now();
  const perRun = [];
  let tokens = 0;
  let cost = 0;
  let tokenSeen = false;
  let costSeen = false;
  for (let r = 0; r < runs; r += 1) {
    let passed = 0;
    for (const s of suite.scenarios) {
      const out = await agent(s);
      const actual = out && typeof out === "object" && "actual" in out ? out.actual : out;
      if (out?.tokens != null) { tokens += out.tokens; tokenSeen = true; }
      if (out?.cost != null) { cost += out.cost; costSeen = true; }
      if (compare(s.expected, actual ?? {}).length === 0) passed += 1;
    }
    perRun.push(passed / suite.scenarios.length);
  }
  const mean = perRun.reduce((a, b) => a + b, 0) / runs;
  const variance = perRun.reduce((a, b) => a + (b - mean) ** 2, 0) / runs;
  const result = buildResult({
    level: "L2", suite, commit, runs, score: mean, variance, durationMs: Math.max(0, now() - started), status: statusFor(mean, threshold), threshold,
    extra: { model: { id: model.id, ...(model.version ? { version: model.version } : {}) }, ...(tool ? { tool } : {}) },
  });
  result.metrics.cost = costSeen ? cost : null;
  result.metrics.contextTokens = tokenSeen ? tokens : null;
  result.metrics.metricStatus.cost = costSeen ? "MEASURED" : "NOT_AVAILABLE_FROM_TOOL";
  result.metrics.metricStatus.contextTokens = tokenSeen ? "MEASURED" : "NOT_AVAILABLE_FROM_TOOL";
  const errors = validate(result, evalSchema);
  if (errors.length) throw new HarnessError(`harness produced an invalid eval-result: ${errors.join("; ")}`);
  return { perRun, result };
}

export function writeResult(path, result) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`);
}
