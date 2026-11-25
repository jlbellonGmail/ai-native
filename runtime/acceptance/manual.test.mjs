import { test } from "node:test";
import assert from "node:assert/strict";
import { renderManual, checkParity, renderCommand, traceability, manualRunRecord } from "./manual.mjs";
import { buildPlan, CONTRACT, SLUG } from "./acceptance.fixture.mjs";

const plan = buildPlan();
const manual = () => renderManual({ slug: SLUG, plan, contract: CONTRACT });

test("the manual has every required field per case and per-shell exit capture (RF-26)", () => {
  const m = manual();
  for (const h of ["Glossary and naming", "Prerequisites", "Environment setup", "Datasets", "Restore the environment", "Run log"]) assert.match(m, new RegExp(h));
  for (const k of plan.cases) {
    const sec = m.split(`### ${k.id}\n`)[1].split("\n### ")[0];
    for (const f of ["Validates", "Why it matters", "Use in a real system", "Data", "Expected result", "PASS means", "FAIL means", "Intentional errors", "Limitations", "Restore", "What the command does"]) assert.match(sec, new RegExp(`\\*\\*${f}`), `${k.id}: ${f}`);
    assert.match(sec, /\$LASTEXITCODE; "exit=\$acceptance_/);
    assert.match(sec, /=\$\?; echo "exit=\$acceptance_/);
  }
  assert.match(m, /not isolated/);
});

test("parity passes on the rendered manual and fails on any divergence (RF-27)", () => {
  assert.equal(checkParity({ manualText: manual(), plan, contract: CONTRACT }).status, "PASS");
  const edited = manual().replace("tests/slugify.acceptance.mjs; $", "tests/other.mjs; $");
  assert.equal(checkParity({ manualText: edited, plan, contract: CONTRACT }).status, "BLOCKED");
  const changedRunner = { ...CONTRACT, runners: [{ ...CONTRACT.runners[0], argv: ["tests/other.mjs"] }] };
  assert.equal(checkParity({ manualText: manual(), plan, contract: changedRunner }).status, "BLOCKED");
  const p2 = buildPlan();
  p2.cases[0].expected = "reject";
  assert.match(checkParity({ manualText: manual(), plan: p2, contract: CONTRACT }).errors.join(), /expected result/);
  const p3 = buildPlan();
  p3.cases.pop();
  assert.match(checkParity({ manualText: manual(), plan: p3, contract: CONTRACT }).errors.join(), /that the plan does not/);
  assert.match(renderCommand(CONTRACT.runners[0]).digest, /^[0-9a-f]{64}$/);
});

test("manual runs are labelled manual and never the gate input", () => {
  const r = manualRunRecord({ operator: "human", date: "2026-11-25", sourceRevision: "sha256:x", results: { "slug-basic": "PASS" } });
  assert.equal(r.executionKind, "manual");
  assert.equal(r.gateInput, false);
  assert.throws(() => manualRunRecord({ operator: "h" }));
});

test("traceability links requirement -> AC -> case -> dataset -> execution -> evidence -> result -> gate (RF-28)", () => {
  const entries = plan.cases.map((k, i) => ({ seq: i, hash: `h${i}`, scenarioId: k.id, runnerId: "unit", sourceRevision: "sha256:r", inputFingerprint: `sha256:f${i}`, result: "PASS", executionKind: "simulated", isolation: { tier: "restricted", isolated: false }, ranAt: "t" }));
  const t = traceability({ slug: SLUG, plan, entries, status: { status: "PASS", blocking: false }, revision: "sha256:r" });
  assert.equal(t.complete, true);
  assert.ok(t.rows.every((r) => r.evidence.sourceRevision && r.evidence.inputFingerprint && r.execution.executionKind));
  assert.deepEqual([...new Set(t.rows.map((r) => r.requirement))].sort(), ["RF-1", "RF-2"]);
  const other = traceability({ slug: SLUG, plan, entries, status: { status: "STALE", blocking: true }, revision: "sha256:other" });
  assert.equal(other.complete, false);
  assert.ok(other.rows.every((r) => r.result === "NOT_RUN"));
  assert.equal(other.gateDecision.blocking, true);
});
