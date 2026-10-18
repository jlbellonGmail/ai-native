// P33 (M5): real audits of an APPLICATION fixture and a LIBRARY fixture.
// The reports in evaluation/fixtures/audit/reports/ were produced by an INDEPENDENT
// auditor invocation (claude -p, read access + `node --test` only) following
// audit/profiles/<P>.md and audit/method/QUALITY_SCORE.md. These tests do not re-run the
// auditor (a model call is not reproducible); they prove the evidence is bound to the exact
// fixture: the commit is reproducible, the fixture's own tests really pass, the report
// validates against the schema, certifies exactly that commit, and the release gate behaves
// correctly with it (accepts it only for the right profile, rejects stale and low-score cases).
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { materializeFixture, FIXTURES_ROOT, FIXTURE_KINDS } from "./fixtures.mjs";
import { validateReport, certifyExactCommit } from "./report.mjs";
import { evaluateReleaseGate } from "./framework.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const reportText = (kind) => readFileSync(join(FIXTURES_ROOT, "reports", `${kind}.md`), "utf8");
// a nested `node --test` inherits NODE_TEST_CONTEXT from the outer runner and prints nothing: drop it
const cleanEnv = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("NODE_TEST")));
const tests = (dir) => execFileSync(process.execPath, ["--test", "--test-reporter=spec"], { cwd: dir, encoding: "utf8", env: cleanEnv() });

for (const [kind, profile] of Object.entries(FIXTURE_KINDS)) {
  test(`${profile}: the fixture commit is reproducible and its own tests pass`, () => {
    const a = materializeFixture(kind);
    const b = materializeFixture(kind);
    assert.equal(a.commit, b.commit, "deterministic commit");
    const out = tests(a.dir);
    assert.match(out, /ℹ fail 0/);
    const passed = Number(/ℹ pass (\d+)/.exec(out)[1]);
    assert.ok(passed >= 3);
    assert.match(reportText(kind), new RegExp(`${passed} tests executed`), "the report states the number of tests the auditor ran");
  });

  test(`${profile}: the report is valid, bound to the exact fixture commit, and carries a real audit`, () => {
    const { dir, commit } = materializeFixture(kind);
    const { errors, report } = validateReport(reportText(kind));
    assert.deepEqual(errors, []);
    assert.equal(report.profile, profile);
    assert.equal(report.targetCommit, commit);
    assert.equal(report.isMergeGate, false);
    assert.equal(certifyExactCommit({ root: dir, report, candidate: commit }).status, "CURRENT");
    const text = reportText(kind);
    for (const section of ["## Resumen", "## Verificación ejecutada", "## Puntuación por criterio", "## Hallazgos", "## No verificado", "## Riesgos"]) assert.match(text, new RegExp(`^${section}`, "m"), section);
    for (const q of ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8"]) assert.match(text, new RegExp(`\\b${q}\\b`), q);
    assert.ok((text.match(/^\d+\. /gm) ?? []).length >= 5, "findings are listed with evidence, not an empty pass");
    assert.match(text, /NO VERIFICADO/, "what could not be verified is declared, not scored");
    assert.match(text, new RegExp(`^SCORE: ${report.score}$`, "m"), "front matter score equals the score the auditor wrote");
  });

  test(`${profile}: release gate accepts it only for ITS profile, and never above its real score`, () => {
    const { dir, commit } = materializeFixture(kind);
    const reports = [{ name: `${kind}.md`, text: reportText(kind) }];
    const base = { root: dir, reports, candidate: commit, profile };
    assert.equal(evaluateReleaseGate({ ...base, minScore: 70 }).status, "PASS");
    const strict = evaluateReleaseGate({ ...base }); // default threshold 90: this fixture honestly scores 72
    assert.equal(strict.status, "FAIL");
    assert.match(strict.errors.join(" "), /below the release threshold 90/);
    const other = profile === "APPLICATION" ? "LIBRARY" : "APPLICATION";
    assert.equal(evaluateReleaseGate({ ...base, profile: other, minScore: 0 }).status, "FAIL", "a report of another profile never satisfies the gate");
  });

  test(`${profile}: the audit is exact-commit: a change after the audit makes the report STALE`, () => {
    const { dir, commit } = materializeFixture(kind);
    writeFileSync(join(dir, "README.md"), `${readFileSync(join(dir, "README.md"), "utf8")}\nchanged after the audit\n`);
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", "commit", "-qam", "change"], { cwd: dir });
    const next = execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();
    const { report } = validateReport(reportText(kind));
    assert.equal(certifyExactCommit({ root: dir, report, candidate: next }).status, "STALE");
    assert.equal(evaluateReleaseGate({ root: dir, reports: [{ name: "r.md", text: reportText(kind) }], candidate: next, profile, minScore: 0 }).status, "FAIL");
    assert.equal(certifyExactCommit({ root: dir, report, candidate: commit }).status, "CURRENT");
  });
}

test("the two profiles used by P33 are Activo in the method and the reports use the shipped method version", () => {
  const method = JSON.parse(readFileSync(join(repoRoot, "audit", "method.json"), "utf8"));
  assert.equal(method.profiles.APPLICATION, "Activo");
  assert.equal(method.profiles.LIBRARY, "Activo");
  for (const kind of Object.keys(FIXTURE_KINDS)) assert.equal(validateReport(reportText(kind)).report.auditMethod, method.auditMethod);
});
