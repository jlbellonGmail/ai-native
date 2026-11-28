import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGraph } from "./graph.mjs";
import { crossObligations } from "./feature.mjs";
import { consolidate } from "./result.mjs";

const { graph } = buildGraph({
  schemaVersion: 1,
  modules: [
    { id: "locales", contracts: [{ id: "locales.db", path: "locales/schema.sql" }, { id: "locales.api", path: "locales/api.json" }] },
    { id: "regions", contracts: [{ id: "regions.db", path: "regions/schema.sql" }] },
    { id: "currency", contracts: [] },
  ],
  dependencies: [
    { consumer: "regions", provider: "locales", contract: "locales.db" },
    { consumer: "regions", provider: "locales", contract: "locales.api" },
  ],
});
const crossCase = (contract, consumer = "regions", over = {}) => ({ id: `x-${contract}-${consumer}`, mandatory: true, cross: { consumer, provider: "locales", contract }, ...over });

test("every dependency edge is a mandatory consumer-owned obligation (RF-2, RF-12)", () => {
  const r = crossObligations(graph, { moduleId: "regions", cases: [crossCase("locales.db"), crossCase("locales.api")] });
  assert.equal(r.status, "OK");
  assert.equal(r.obligations.length, 2);
  assert.ok(r.obligations.every((o) => o.consumer === "regions" && o.satisfied));
});

test("a dependency without a consumer-owned validation is BLOCKED (RF-13)", () => {
  const r = crossObligations(graph, { moduleId: "regions", cases: [crossCase("locales.db")] });
  assert.equal(r.status, "BLOCKED");
  assert.match(r.reasons.join(), /locales\/locales\.api has no consumer-owned mandatory validation/);
});

test("provider-owned acceptance cannot satisfy the consumer's obligation", () => {
  const r = crossObligations(graph, { moduleId: "regions", cases: [crossCase("locales.db", "locales"), crossCase("locales.api", "locales")] });
  assert.equal(r.status, "BLOCKED");
});

test("non-mandatory cross case does not count", () => {
  const r = crossObligations(graph, { moduleId: "regions", cases: [crossCase("locales.db", "regions", { mandatory: false }), crossCase("locales.api")] });
  assert.equal(r.status, "BLOCKED");
});

test("dependency-free module: cross is structurally NOT_APPLICABLE and non-blocking", () => {
  const r = crossObligations(graph, { moduleId: "currency", cases: [] });
  assert.equal(r.status, "NOT_APPLICABLE");
  assert.equal(consolidate([{ id: "module", status: "PASS" }, { id: "cross", status: r.status }]).status, "PASS");
});
