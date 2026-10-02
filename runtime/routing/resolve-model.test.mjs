import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadModels, resolveModel, resolveDynamicCandidate, readEvalSignal, recordRoutingDecision, RoutingBlockedError } from "./resolve-model.mjs";
import { readEvents, verifyChain } from "../circuit/events.mjs";

const models = loadModels();

test("explicit model+variant is resolved as-is and never falls back", () => {
  const result = resolveModel({ role: "analyst-agent", model: "opencode-go/kimi-k2.7-code", variant: "high", models, env: { AGENTIC_OPENCODE_GO_READY: "1" } });
  assert.equal(result.modelRef, "opencode-go/kimi-k2.7-code");
  assert.equal(result.modelSelectionOrigin, "explicit-parameter");
  assert.equal(result.variant, "high");
  assert.equal(result.fallbackApplied, false);
  assert.equal(result.role, "planner");
});

test("no explicit model uses the role default", () => {
  const result = resolveModel({ role: "reviewer", models, env: { AGENTIC_OPENCODE_GO_READY: "1" } });
  assert.equal(result.modelRef, "opencode-go/kimi-k2.7-code");
  assert.equal(result.variant, "high");
  assert.equal(result.modelSelectionOrigin, "role-default");
});

test("invalid explicit selections are rejected with an actionable message", () => {
  assert.throws(() => resolveModel({ role: "analyst-agent", model: "unknown-provider/model", variant: "high", models, env: {} }), /unknown or unauthorized provider/);
  assert.throws(() => resolveModel({ role: "analyst-agent", model: "opencode-go/no-such-model", variant: "high", models, env: {} }), /not authorized or does not exist/);
  assert.throws(() => resolveModel({ role: "analyst-agent", model: "opencode-go/kimi-k2.7-code", variant: "turbo", models, env: {} }), /invalid or unauthorized variant/);
});

test("no credentials anywhere and an explicit fallback still BLOCKS (safeguard: never a silent default)", () => {
  assert.throws(() => resolveModel({ role: "analyst-agent", explicitFallback: ["go"], models, env: {} }), RoutingBlockedError);
  try {
    resolveModel({ role: "analyst-agent", explicitFallback: ["go"], models, env: {} });
  } catch (error) {
    assert.match(error.message, /missing credentials/);
  }
});

test("a failed primary falls back to the next authorized, credentialed candidate", () => {
  const result = resolveModel({
    role: "builder-agent",
    failedModel: "opencode-go/kimi-k2.7-code",
    failureReason: "quota_exhausted",
    explicitFallback: ["go,zen"],
    models,
    env: { AGENTIC_OPENCODE_ZEN_READY: "1" },
  });
  assert.equal(result.modelRef, "opencode/kimi-k2.7-code");
  assert.equal(result.fallbackApplied, true);
  assert.equal(result.fallbackReason, "quota_exhausted");
});

test("a failed primary with no other authorized fallback BLOCKS instead of silently retrying the same model", () => {
  assert.throws(
    () =>
      resolveModel({
        role: "builder-agent",
        failedModel: "opencode-go/kimi-k2.7-code",
        failureReason: "quota_exhausted",
        explicitFallback: ["go"],
        models,
        env: { AGENTIC_OPENCODE_ZEN_READY: "1" },
      }),
    RoutingBlockedError,
  );
});

test("OpenRouter is only used when explicitly included in the fallback list, and never silently", () => {
  const result = resolveModel({
    role: "analyst-agent",
    failedModel: "opencode-go/kimi-k2.7-code",
    failureReason: "unavailable",
    explicitFallback: ["go,zen,openrouter-free"],
    models,
    env: { OPENROUTER_API_KEY: "test-key" },
  });
  assert.equal(result.provider, "openrouter");
  assert.equal(result.modelRef, "openrouter/qwen/qwen3-coder:free");
  assert.equal(result.fallbackApplied, true);
});

test("no model in the whole chain has credentials -> BLOCKED, not an arbitrary pick", () => {
  assert.throws(() => resolveModel({ role: "qa-agent", explicitFallback: ["go,zen"], models, env: {} }), RoutingBlockedError);
});

test("metricStatus.cost is always the explicit NOT_AVAILABLE_FROM_TOOL string, never a silent null (AGT-06 regression guard)", () => {
  const result = resolveModel({ role: "reviewer", models, env: { AGENTIC_OPENCODE_GO_READY: "1" } });
  assert.equal(result.metricStatus.cost, "NOT_AVAILABLE_FROM_TOOL");
  assert.notEqual(result.metricStatus.cost, null);
});

test("dynamic capability routing: deterministic tie-break by alias when scores are equal", () => {
  const fixtureModels = {
    providers: { p: { credentialEnv: [], models: ["m"] } },
    validVariants: ["high", "medium"],
    routing: {
      defaultSdd: "STANDARD",
      depthWeights: { STANDARD: { quality: 1, cost: 1, latency: 1 } },
      roleCapabilities: { builder: ["coding"] },
      implementations: [
        { alias: "zeta", provider: "p", model: "m", capabilities: ["coding"], quality: 1, cost: 0, latency: 0, context: 1000, availabilityEnv: [], securityProfiles: ["STANDARD"] },
        { alias: "alpha", provider: "p", model: "m", capabilities: ["coding"], quality: 1, cost: 0, latency: 0, context: 1000, availabilityEnv: [], securityProfiles: ["STANDARD"] },
      ],
    },
    roles: { builder: { default: { model: "p/m", variant: "high" }, fallback: [] } },
  };
  const item = resolveDynamicCandidate({ routing: fixtureModels.routing, role: "builder", requiredCapabilities: ["coding"], depth: "STANDARD", securityProfile: "STANDARD", models: fixtureModels, env: {}, allowMissingCredentials: true });
  assert.equal(item.alias, "alpha");
});

test("dynamic capability routing BLOCKS (RoutingBlockedError) when nothing satisfies the required capability", () => {
  const fixtureModels = {
    providers: { p: { credentialEnv: [], models: ["m"] } },
    routing: {
      depthWeights: { STANDARD: { quality: 1, cost: 1, latency: 1 } },
      roleCapabilities: { builder: ["coding"] },
      implementations: [{ alias: "only", provider: "p", model: "m", capabilities: ["other-thing"], quality: 1, cost: 0, latency: 0, context: 1000, availabilityEnv: [], securityProfiles: ["STANDARD"] }],
    },
  };
  assert.throws(
    () => resolveDynamicCandidate({ routing: fixtureModels.routing, role: "builder", requiredCapabilities: ["coding"], depth: "STANDARD", securityProfile: "STANDARD", models: fixtureModels, env: {}, allowMissingCredentials: true }),
    RoutingBlockedError,
  );
});

test("readEvalSignal: no path -> null; missing file or no passRate -> usable:false, never invents a result", () => {
  assert.equal(readEvalSignal(""), null);
  const dir = mkdtempSync(join(tmpdir(), "eval-signal-test-"));
  const missing = join(dir, "does-not-exist.jsonl");
  assert.equal(readEvalSignal(missing).usable, false);

  const noPassRate = join(dir, "no-pass-rate.jsonl");
  writeFileSync(noPassRate, `${JSON.stringify({ something: "else" })}\n`, "utf8");
  assert.equal(readEvalSignal(noPassRate).usable, false);
});

test("readEvalSignal: a real passRate summary is read as a relative, auditable signal", () => {
  const dir = mkdtempSync(join(tmpdir(), "eval-signal-test-"));
  const path = join(dir, "summary.jsonl");
  writeFileSync(path, `${JSON.stringify({ passRate: 0.92 })}\n`, "utf8");
  const signal = readEvalSignal(path);
  assert.equal(signal.usable, true);
  assert.equal(signal.passRate, 0.92);
});

test("recordRoutingDecision appends a schema-valid, hash-chained 'routing' event to the Work Unit's events.jsonl (PAR-ROUTING-EVIDENCE)", () => {
  const dir = mkdtempSync(join(tmpdir(), "routing-evidence-test-"));
  const eventsPath = join(dir, "events.jsonl");
  const result = resolveModel({ role: "reviewer", models, env: { AGENTIC_OPENCODE_GO_READY: "1" } });
  const event = recordRoutingDecision(eventsPath, "07-example-unit", result);
  assert.equal(event.eventType, "routing");
  assert.equal(event.role, "reviewer");
  assert.equal(event.metricStatus.cost, "NOT_AVAILABLE_FROM_TOOL");
  verifyChain(eventsPath);
  assert.equal(readEvents(eventsPath).length, 1);
});
