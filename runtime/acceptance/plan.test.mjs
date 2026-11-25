import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePlan, scanSynthetic, sha256File, CATEGORIES } from "./plan.mjs";
import { parseTap13, parseJUnit, parseNodeTest, evaluateObserved, parseStructured } from "./results-parser.mjs";

const DATA = Buffer.from('{"rows":[{"email":"a@example.com"}]}');
const runners = new Map([["unit", { id: "unit", isolation: "restricted" }]]);
const spec = { criteria: [{ id: "AC-1", requirements: ["RF-1"] }] };
const kase = (over = {}) => ({ id: "c1", ac: ["AC-1"], category: "positive", dataset: "d1", runner: "unit", sutPaths: ["src/a.mjs"], expected: "pass", mandatory: true, minTier: "restricted", why: "w", realSystemUse: "u", intentionalErrors: "none", limitations: "l", restore: "none", ...over });
const na = (cat) => ({ status: "NOT_APPLICABLE", justification: "not relevant to this feature", cites: ["RF-1"] });
function plan(over = {}) {
  const matrix = Object.fromEntries(CATEGORIES.map((c) => [c, na(c)]));
  matrix.positive = { status: "APPLICABLE" };
  matrix.negative = { status: "APPLICABLE" };
  return {
    schemaVersion: 1, slug: "feat",
    criteria: [{ id: "AC-1", requirements: ["RF-1"] }],
    matrix,
    datasets: [{ id: "d1", kind: "file", path: "specs/feat/acceptance/d1.json", sha256: sha256File(DATA) }],
    cases: [kase(), kase({ id: "c2", category: "negative", expected: "reject" })],
    ...over,
  };
}
const ctx = { spec, runners, readFile: () => DATA };
const errs = (p, c = ctx) => validatePlan(p, c).errors.join("\n");

test("a complete plan validates", () => assert.deepEqual(validatePlan(plan(), ctx).errors, []));

test("AC without a case, and AC-spec mismatch, are BLOCKED", () => {
  const p = plan({ criteria: [{ id: "AC-1", requirements: ["RF-1"] }, { id: "AC-2", requirements: ["RF-2"] }] });
  const r = validatePlan(p, { ...ctx, spec: { criteria: p.criteria } });
  assert.equal(r.status, "BLOCKED");
  assert.match(r.errors.join(), /AC-2 has no mandatory case/);
  assert.match(errs(plan(), { ...ctx, spec: { criteria: [...spec.criteria, { id: "AC-9", requirements: ["RF-1"] }] } }), /spec criterion AC-9 is absent/);
});

test("applicability matrix: APPLICABLE needs a case, N/A needs justification + citation + no cases", () => {
  const p = plan();
  p.matrix.boundary = { status: "APPLICABLE" };
  assert.match(errs(p), /boundary is APPLICABLE without a case/);
  const q = plan();
  q.matrix.boundary = { status: "NOT_APPLICABLE", justification: "", cites: ["RF-1"] };
  assert.match(errs(q), /boundary NOT_APPLICABLE lacks a written justification/);
  const r = plan();
  r.matrix.boundary = { status: "NOT_APPLICABLE", justification: "long enough text", cites: ["RF-77"] };
  assert.match(errs(r), /must cite requirement/);
  const s = plan();
  s.matrix.positive = na("positive");
  assert.match(errs(s), /positive is NOT_APPLICABLE but has cases/);
  const t = plan();
  delete t.matrix.contract;
  assert.match(errs(t), /category contract is not declared/);
});

test("vacuous AC (no rejection / seeded failure) is BLOCKED", () => {
  const p = plan({ cases: [kase()] });
  p.matrix.negative = na("negative");
  assert.match(errs(p), /vacuously passing/);
  const ok = plan({ cases: [kase({ seededFailure: { runKey: "sha256:abc" } })] });
  ok.matrix.negative = na("negative");
  assert.deepEqual(validatePlan(ok, ctx).errors, []);
});

test("datasets: digest, seed, committed file, synthetic content", () => {
  assert.match(errs(plan(), { ...ctx, readFile: () => Buffer.from("other") }), /digest mismatch/);
  assert.match(errs(plan(), { ...ctx, readFile: () => null }), /committed file is missing/);
  const gen = plan({ datasets: [{ id: "d1", kind: "generator", generator: "tools/gen.mjs", sha256: sha256File(DATA) }] });
  assert.match(errs(gen), /fixed integer seed/);
  const seeded = plan({ datasets: [{ id: "d1", kind: "generator", generator: "tools/gen.mjs", seed: 7, sha256: sha256File(DATA) }] });
  assert.match(errs(seeded, { ...ctx, generate: () => Buffer.from("different") }), /digest mismatch/);
  assert.deepEqual(validatePlan(seeded, { ...ctx, generate: () => DATA }).errors, []);
  const bad = Buffer.from("password=hunter2hunter2 and bob@gmail.com");
  const p = plan({ datasets: [{ id: "d1", kind: "file", path: "specs/feat/acceptance/d1.json", sha256: sha256File(bad) }] });
  const e = errs(p, { ...ctx, readFile: () => bad });
  assert.match(e, /credential assignment/);
  assert.match(e, /real-looking e-mail/);
  assert.ok(!e.includes("hunter2"), "never echoes the value");
  assert.deepEqual(scanSynthetic("a@example.com 123"), []);
});

test("unknown runner / dataset, empty rationale, schema violations", () => {
  assert.match(errs(plan({ cases: [kase({ runner: "ghost" }), kase({ id: "c2", category: "negative", expected: "reject" })] })), /runner 'ghost'/);
  assert.match(errs(plan({ cases: [kase({ dataset: "zzz" }), kase({ id: "c2", category: "negative", expected: "reject" })] })), /unknown dataset zzz/);
  assert.match(errs(plan({ cases: [kase({ why: " " }), kase({ id: "c2", category: "negative", expected: "reject" })] })), /why must not be empty/);
  assert.equal(validatePlan({ schemaVersion: 1 }, ctx).status, "BLOCKED");
  assert.match(errs(plan({ cases: [kase({ sutPaths: [] }), kase({ id: "c2", category: "negative", expected: "reject" })] })), /no SUT input path/);
});

// --- parsers / observed-case enforcement -------------------------------------
const TAP = "TAP version 13\nok 1 - c1\nnot ok 2 - c2\nok 3 - c3 # SKIP no\n1..3\n";
test("TAP 13 / JUnit / node-test observed cases", () => {
  const t = parseTap13(TAP).cases;
  assert.deepEqual([t.get("c1").status, t.get("c2").status, t.get("c3").status], ["pass", "fail", "skip"]);
  const j = parseJUnit('<testsuites><testsuite><testcase name="a"/><testcase name="b"><failure/></testcase><testcase name="c"><skipped/></testcase></testsuite></testsuites>').cases;
  assert.deepEqual([j.get("a").status, j.get("b").status, j.get("c").status], ["pass", "fail", "skip"]);
  const n = parseNodeTest("▶ suite\n  ✔ x (1.2ms)\n  ✖ y (0.5ms)\n  ﹣ z # SKIP\n▶ suite (3ms)\nℹ tests 3\nℹ pass 1\n").cases;
  assert.deepEqual([n.get("x").status, n.get("y").status, n.get("z").status], ["pass", "fail", "skip"]);
  assert.ok(parseStructured("tap13", "garbage").errors.length);
  assert.ok(parseStructured("junit", "").errors.length);
});

test("RF-24: zero, missing, skipped, unknown are BLOCKED whatever the exit code; fail is FAIL; all pass is PASS", () => {
  const ev = (out, expectedIds, exitCode = 0) => {
    const p = parseTap13(out);
    return evaluateObserved({ expectedIds, observed: p.cases, parseErrors: p.errors, exitCode });
  };
  assert.equal(ev("TAP version 13\n1..0\n", ["c1"]).status, "BLOCKED"); // node -e 0 shaped output
  assert.equal(ev("", ["c1"]).status, "BLOCKED");
  assert.equal(ev("TAP version 13\nok 1 - c1\n", ["c1", "c2"]).status, "BLOCKED");
  assert.equal(ev("TAP version 13\nok 1 - c1\nok 2 - c2 # SKIP\n", ["c1", "c2"]).status, "BLOCKED");
  assert.equal(ev("TAP version 13\nok 1 - c1\nok 2 - surprise\n", ["c1"]).status, "BLOCKED");
  assert.equal(ev("TAP version 13\nok 1 - c1\nnot ok 2 - c2\n", ["c1", "c2"], 1).status, "FAIL");
  assert.equal(ev("TAP version 13\nok 1 - c1\nok 2 - c2\n", ["c1", "c2"]).status, "PASS");
  assert.equal(ev("TAP version 13\nok 1 - c1\n", ["c1"], 3).status, "FAIL");
  assert.equal(evaluateObserved({ expectedIds: ["a", "b"], observed: new Map([["a", { status: "pass" }], ["b", { status: "pass" }]]), minObserved: 3 }).status, "BLOCKED");
});
