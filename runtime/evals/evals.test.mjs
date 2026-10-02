// M4.6 tests: PAR-EVAL-REAL (L1 executes real code, no hand-authored actual,
// L2 statistical rules, metricStatus) and PAR-OBSERVABILITY-CORRELATION.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSuite, runL1, runL2, datasetDigest, assertSuite, compare, EXECUTORS, HarnessError, writeResult } from "./harness.mjs";
import { buildTimeline } from "../observability/correlate.mjs";
import { appendEvent } from "../circuit/events.mjs";
import { createGateway } from "../mcp-gateway/gateway.mjs";
import { validate } from "../lib/schema-lite.mjs";

const COMMIT = "c".repeat(40);
const suite = loadSuite();
const clone = (o) => JSON.parse(JSON.stringify(o));

test("the shipped suite has the 10 legacy scenarios A-J and no hand-authored actual", () => {
  assert.deepEqual(suite.scenarios.map((s) => s.id.split("-")[0]), ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]);
  assert.ok(suite.scenarios.every((s) => !("actual" in s) && s.input && s.expected));
});

test("PAR-EVAL-REAL: L1 runs the real circuit code and all 10 scenarios pass at 100%", () => {
  const { scenarios, result } = runL1({ suite, commit: COMMIT });
  assert.deepEqual(scenarios.filter((s) => !s.passed), []);
  assert.equal(result.status, "PASS");
  assert.equal(result.metrics.score, 1);
  assert.equal(result.level, "L1");
  assert.equal(result.runs, 1);
  assert.equal(result.datasetDigest, datasetDigest(suite));
  assert.equal(result.platform.commit, COMMIT);
  assert.ok(scenarios.every((s) => s.actual && typeof s.actual === "object"), "actual is computed, present for every scenario");
});

test("PAR-EVAL-REAL: result validates against contracts/eval-result.schema.json and states every metric's status", () => {
  const { result } = runL1({ suite, commit: COMMIT });
  assert.equal(result.metrics.cost, null);
  assert.equal(result.metrics.metricStatus.cost, "NOT_AVAILABLE_FROM_TOOL", "null is never silent");
  assert.equal(result.metrics.metricStatus.score, "MEASURED");
  assert.equal(result.metrics.metricStatus.durationMs, "MEASURED");
  const schema = JSON.parse(readFileSync(new URL("../../contracts/eval-result.schema.json", import.meta.url), "utf8"));
  assert.deepEqual(validate(result, schema), []);
  const broken = clone(result);
  broken.runs = 0;
  assert.ok(validate(broken, schema).length > 0, "the schema check is real");
});

test("PAR-EVAL-REAL (anti D-4): a scenario with a hand-written actual is rejected", () => {
  const bad = clone(suite);
  bad.scenarios[0].actual = bad.scenarios[0].expected;
  assert.throws(() => assertSuite(bad), /hand-authored "actual"/);
  assert.throws(() => runL1({ suite: bad, commit: COMMIT }), HarnessError);
});

test("PAR-EVAL-REAL: changing an expected value makes that scenario (and the score) fail", () => {
  const tampered = clone(suite);
  tampered.scenarios.find((s) => s.id === "A-trivial").expected.depth = "FULL";
  const { scenarios, result } = runL1({ suite: tampered, commit: COMMIT });
  assert.deepEqual(scenarios.filter((s) => !s.passed).map((s) => s.id), ["A-trivial"]);
  assert.equal(result.metrics.score, 0.9);
  assert.equal(result.status, "FAIL");
  assert.notEqual(result.datasetDigest, datasetDigest(suite), "a different dataset has a different digest");
});

test("PAR-EVAL-REAL: if the production behavior changes, scenarios fail (mutation check on each executor kind)", () => {
  const mutated = {
    ...EXECUTORS,
    assess: (i) => ({ ...EXECUTORS.assess(i), depth: "LIGHT" }),
    converge: (i) => ({ ...EXECUTORS.converge(i), verdict: "CHANGES_REQUESTED", terminal: false, stepVerdicts: ["APPROVED"] }),
    "stale-verify": () => ({ stale: false, freshPassing: true }),
    evidence: () => ({ ok: true, missing: [] }),
    policy: () => ({ decision: "ALLOW" }),
  };
  const { scenarios } = runL1({ suite, commit: COMMIT, executors: mutated });
  const failed = new Set(scenarios.filter((s) => !s.passed).map((s) => s.id));
  for (const id of ["B-normal", "C-high-risk", "D-ambiguity", "E-technical-retry", "F-external-block", "G-no-progress", "H-stale-review", "I-insufficient-evidence", "J-out-of-scope"]) {
    assert.ok(failed.has(id), `${id} must fail when its production behavior is mutated`);
  }
});

test("L1: executor errors and unknown kinds are failures with a reason, never silent passes", () => {
  const { scenarios } = runL1({ suite, commit: COMMIT, executors: { ...EXECUTORS, assess: () => { throw new Error("boom"); }, policy: undefined } });
  assert.match(scenarios.find((s) => s.id === "A-trivial").failures[0], /executor threw: boom/);
  assert.match(scenarios.find((s) => s.id === "J-out-of-scope").failures[0], /no executor for kind policy/);
  assert.throws(() => runL1({ suite, commit: "abc" }), /40-hex/);
});

test("compare: exact keys, Include containment, null/array equality", () => {
  assert.deepEqual(compare({ a: 1, bInclude: ["x"] }, { a: 1, b: ["x", "y"] }), []);
  assert.equal(compare({ a: 1 }, { a: 2 }).length, 1);
  assert.equal(compare({ bInclude: ["z"] }, { b: ["x"] }).length, 1);
  assert.deepEqual(compare({ e: null }, { e: null }), []);
  assert.equal(compare({ e: null }, {}).length, 1);
});

test("L2: needs an injected agent, a model id and N>=3; reports variance and measured-vs-unavailable metrics", async () => {
  const model = { id: "model-x", version: "1" };
  await assert.rejects(runL2({ suite, commit: COMMIT, model }), /injected agent/);
  const perfect = async (s) => ({ actual: EXECUTORS[s.kind](s.input) });
  await assert.rejects(runL2({ suite, commit: COMMIT, agent: perfect }), /model\.id/);
  await assert.rejects(runL2({ suite, commit: COMMIT, agent: perfect, model, runs: 2 }), /runs >= 3/);
  const ok = await runL2({ suite, commit: COMMIT, agent: perfect, model, runs: 3 });
  assert.equal(ok.result.level, "L2");
  assert.equal(ok.result.runs, 3);
  assert.equal(ok.result.metrics.score, 1);
  assert.equal(ok.result.metrics.variance, 0);
  assert.equal(ok.result.metrics.metricStatus.variance, "MEASURED");
  assert.equal(ok.result.metrics.metricStatus.cost, "NOT_AVAILABLE_FROM_TOOL");
  assert.deepEqual(ok.result.model, model);
  let n = 0;
  const flaky = async (s) => ({ actual: n++ % 20 === 0 ? {} : EXECUTORS[s.kind](s.input), tokens: 10, cost: 0.5 });
  const noisy = await runL2({ suite, commit: COMMIT, agent: flaky, model, runs: 4 });
  assert.ok(noisy.result.metrics.variance > 0);
  assert.equal(noisy.result.metrics.metricStatus.cost, "MEASURED");
  assert.equal(noisy.result.metrics.contextTokens, 10 * 10 * 4);
  const bad = await runL2({ suite, commit: COMMIT, agent: async () => ({ actual: {} }), model, runs: 3 });
  assert.equal(bad.result.status, "FAIL");
  assert.equal(bad.result.metrics.score, 0);
});

test("writeResult persists a validated result as JSON", () => {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-evalout-"));
  try {
    const { result } = runL1({ suite, commit: COMMIT });
    writeResult(join(dir, "nested", "r.json"), result);
    assert.deepEqual(JSON.parse(readFileSync(join(dir, "nested", "r.json"), "utf8")), result);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---- PAR-OBSERVABILITY-CORRELATION ----

async function observabilityFixture() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-obs-"));
  const eventsPath = join(dir, "runs", "u1", "events.jsonl");
  const auditPath = join(dir, "audit.jsonl");
  mkdirSync(join(dir, "profiles"));
  writeFileSync(join(dir, "profiles", "work.json"), JSON.stringify({ schemaVersion: 1, id: "work", servers: ["db"] }));
  const catalog = { schemaVersion: 1, servers: { db: { type: "local", capability: "x", mode: "read-only", risk: "low", permissions: ["query"], optional: false, load: "on-demand" } } };
  const t = (n) => () => `2026-10-02T10:00:0${n}.000Z`;
  appendEvent(eventsPath, "u1", "transition", { fromState: "NEW", toState: "SPECIFIED" }, { now: t(1) });
  const mk = (unitId) => createGateway({ profile: "work", role: "builder", invoke: async () => "ok", catalog, profileDir: join(dir, "profiles"), auditPath, environment: {}, unitId });
  await mk("u1").call({ server: "db", operation: "query" });
  await mk("other").call({ server: "db", operation: "query" });
  await mk(null).call({ server: "db", operation: "query" });
  appendEvent(eventsPath, "u1", "transition", { fromState: "SPECIFIED", toState: "IN_PROGRESS" });
  return { dir, eventsPath, auditPath, done: () => rmSync(dir, { recursive: true, force: true }) };
}

test("PAR-OBSERVABILITY-CORRELATION: joins circuit events, gateway calls and evals for one unit, in time order", async () => {
  const f = await observabilityFixture();
  try {
    const { result } = runL1({ suite, commit: COMMIT });
    const r = buildTimeline({ unitId: "u1", eventsPath: f.eventsPath, gatewayAuditPaths: [f.auditPath], evalResults: [{ result, at: "2026-10-02T10:00:02.000Z", evidencePath: "evals/l1.json" }], platformCommit: COMMIT });
    assert.deepEqual(r.errors, []);
    const sources = r.timeline.map((e) => e.source);
    assert.equal(sources.filter((s) => s === "circuit").length, 2);
    assert.equal(sources.filter((s) => s === "mcp-gateway").length, 1, "only this unit's gateway call; other unit's skipped");
    assert.equal(sources.filter((s) => s === "eval").length, 1);
    const times = r.timeline.map((e) => Date.parse(e.at));
    assert.deepEqual(times, [...times].sort((a, b) => a - b));
    assert.ok(r.warnings.some((w) => w.includes("has no unitId; not joined")), "calls without a unitId are reported, never guessed");
    assert.equal(r.timeline.find((e) => e.source === "mcp-gateway").detail, "ALLOW db/query (scoped_capability)");
  } finally { f.done(); }
});

test("correlation refuses tampered sources and foreign evidence", async () => {
  const f = await observabilityFixture();
  try {
    const { result } = runL1({ suite, commit: COMMIT });
    const other = runL1({ suite, commit: "d".repeat(40) }).result;
    const stale = buildTimeline({ unitId: "u1", eventsPath: f.eventsPath, evalResults: [{ result: other, at: "2026-10-02T10:00:02.000Z" }], platformCommit: COMMIT });
    assert.equal(stale.timeline.filter((e) => e.source === "eval").length, 0);
    assert.ok(stale.warnings.some((w) => w.includes("not joined")));
    const wrongUnit = buildTimeline({ unitId: "u2", eventsPath: f.eventsPath });
    assert.ok(wrongUnit.errors.some((e) => e.includes("names unit u1, expected u2")));
    const lines = readFileSync(f.auditPath, "utf8").trim().split("\n");
    writeFileSync(f.auditPath, `${lines[0].replace("ALLOW", "DENY")}\n${lines.slice(1).join("\n")}\n`);
    const tampered = buildTimeline({ unitId: "u1", eventsPath: f.eventsPath, gatewayAuditPaths: [f.auditPath] });
    assert.deepEqual(tampered.timeline, []);
    assert.match(tampered.errors[0], /chain broken/);
    const evLines = readFileSync(f.eventsPath, "utf8").trim().split("\n");
    writeFileSync(f.eventsPath, `${evLines[0].replace("SPECIFIED", "MERGED")}\n${evLines[1]}\n`);
    const evTampered = buildTimeline({ unitId: "u1", eventsPath: f.eventsPath });
    assert.deepEqual(evTampered.timeline, []);
    assert.match(evTampered.errors[0], /chain broken/);
    assert.ok(buildTimeline({ unitId: "u1", eventsPath: join(f.dir, "nope.jsonl") }).errors[0].includes("no events"));
    void result;
  } finally { f.done(); }
});
