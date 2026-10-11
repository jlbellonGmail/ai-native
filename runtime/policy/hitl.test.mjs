import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveHumanGate, assertHumanGate, loadHitlPolicy } from "./hitl.mjs";

test("low risk with explicit none + autonomy full completes without a human", () => {
  assert.deepEqual(resolveHumanGate({ risk: "low", humanGate: "none", autonomy: "full" }), { ok: true, gate: "none", reasons: [] });
});

test("none is never a default: an unspecified gate resolves to the risk default", () => {
  assert.equal(resolveHumanGate({ risk: "low" }).gate, "final-only");
  assert.equal(resolveHumanGate({ risk: "high" }).gate, "required");
});

test("high risk with none fails explicitly", () => {
  const r = resolveHumanGate({ risk: "high", humanGate: "none", autonomy: "full" });
  assert.equal(r.ok, false);
  assert.match(r.reasons[0], /not allowed for high risk/);
  assert.throws(() => assertHumanGate({ risk: "high", humanGate: "none", autonomy: "full" }), /not allowed for high risk/);
});

test("medium risk cannot skip the human entirely", () => {
  assert.equal(resolveHumanGate({ risk: "medium", humanGate: "none", autonomy: "full" }).ok, false);
  assert.equal(resolveHumanGate({ risk: "medium", humanGate: "final-only" }).gate, "final-only");
});

test("none without autonomy: full is rejected (no hidden bypass)", () => {
  assert.equal(resolveHumanGate({ risk: "low", humanGate: "none", autonomy: "guided" }).ok, false);
  assert.equal(resolveHumanGate({ risk: "low", humanGate: "none" }).ok, false);
});

test("control plane, release, production and security keep the gate required even for low risk", () => {
  for (const flag of ["controlPlane", "release", "production", "security"]) {
    const r = resolveHumanGate({ risk: "low", humanGate: "none", autonomy: "full", [flag]: true });
    assert.equal(r.ok, true);
    assert.equal(r.gate, "required", flag);
    assert.match(r.reasons[0], /external protection wins/);
  }
});

test("unknown risk or gate fails closed", () => {
  assert.equal(resolveHumanGate({ risk: "nope" }).gate, "required");
  assert.equal(resolveHumanGate({ risk: "low", humanGate: "maybe" }).ok, false);
});

test("the shipped policy is internally consistent", () => {
  const p = loadHitlPolicy();
  for (const rule of Object.values(p.risks)) assert.ok(rule.allowed.includes(rule.default) && rule.default !== "none");
  assert.deepEqual(p.risks.high.allowed, ["required"]);
});
