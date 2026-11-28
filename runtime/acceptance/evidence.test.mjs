import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inputFingerprint, freshness, appendEvidence, readLedger, closureStatus, ledgerDir, reusableForUnaffected, uncoveredPaths, canonical, sha256 } from "./evidence.mjs";

const D = (s) => sha256(s);
const base = (over = {}) => ({ scenarioId: "s1", moduleId: "regions", runnerDigest: D("r"), caseDigest: D("c"), executableDigest: D("e"), argv: ["a.mjs"], inputDigests: { "src/a.mjs": D("a") }, executionKind: "agent", environment: { platform: "win32", arch: "x64", runtime: "v26" }, ...over });
const fp = (over) => inputFingerprint(base(over));

test("fingerprint: key order, sourceRevision and unrelated data do not matter; relevant inputs do (RF-6, RF-11)", () => {
  const a = fp();
  assert.equal(a.ok, true);
  assert.equal(fp({ inputDigests: { "src/a.mjs": D("a") } }).fingerprint, a.fingerprint);
  assert.equal(canonical({ b: 1, a: [2, { d: 1, c: 2 }] }), canonical({ a: [2, { c: 2, d: 1 }], b: 1 }));
  assert.notEqual(fp({ inputDigests: { "src/a.mjs": D("changed") } }).fingerprint, a.fingerprint);
  assert.notEqual(fp({ argv: ["b.mjs"] }).fingerprint, a.fingerprint);
  assert.notEqual(fp({ environment: { platform: "linux", arch: "x64", runtime: "v26" } }).fingerprint, a.fingerprint);
  assert.equal(freshness(a.fingerprint, a.fingerprint), "CURRENT");
  assert.equal(freshness(a.fingerprint, fp({ argv: ["z"] }).fingerprint), "STALE");
});

test("environment/config: non-secret value changes invalidate; secrets never hashed and BLOCK", () => {
  const withEnv = (v) => fp({ envDeclared: ["LOCALE"], envValues: { LOCALE: v } });
  assert.notEqual(withEnv("es").fingerprint, withEnv("en").fingerprint);
  const nameOnly = fp({ envDeclared: ["LOCALE"] });
  assert.equal(nameOnly.ok, true);
  const secret = fp({ envDeclared: ["DB_PASSWORD"], envValues: { DB_PASSWORD: "hunter2" } });
  assert.equal(secret.ok, false);
  assert.equal(secret.status, "BLOCKED");
  assert.ok(!JSON.stringify(secret).includes("hunter2"));
  assert.equal(fp({ configDigests: { cfg: null } }).status, "BLOCKED");
  assert.equal(fp({ inputDigests: { "src/a.mjs": undefined } }).status, "BLOCKED");
  assert.ok(!JSON.stringify(withEnv("es")).includes('"es"'), "values are hashed, never stored");
});

function repo() {
  const dir = mkdtempSync(join(tmpdir(), "ai-ev-"));
  execFileSync("git", ["init", "-q"], { cwd: dir });
  return dir;
}
const rec = (over = {}) => ({ scenarioId: "s1", sourceRevision: "sha256:rev1", inputFingerprint: "sha256:fp1", result: "PASS", executionKind: "agent", reasons: [], ...over });

test("ledger: append-only chain verifies; edit, truncation, reorder are BLOCKED (RF-31)", () => {
  const dir = repo();
  try {
    appendEvidence(dir, "f", rec());
    appendEvidence(dir, "f", rec({ scenarioId: "s2" }));
    assert.equal(readLedger(dir, "f").ok, true);
    const file = join(ledgerDir(dir, "f"), "ledger.jsonl");
    const good = readFileSync(file, "utf8");
    // edit a result
    writeFileSync(file, good.replace('"result":"PASS"', '"result":"PASS" ').replace("sha256:rev1", "sha256:revX"));
    assert.equal(readLedger(dir, "f").ok, false);
    // truncate the tail
    writeFileSync(file, good.slice(0, good.length - 10));
    assert.equal(readLedger(dir, "f").ok, false);
    // drop first line
    writeFileSync(file, good.split("\n").slice(1).join("\n"));
    assert.equal(readLedger(dir, "f").ok, false);
    assert.throws(() => appendEvidence(dir, "f", rec()), /does not verify/);
    writeFileSync(file, good);
    assert.equal(readLedger(dir, "f").ok, true);
    // the ledger lives in the git common dir, never in the worktree
    assert.ok(file.includes(".git"));
    assert.equal(existsSync(join(dir, "acceptance")), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("closure: only evidence at the evaluated revision counts; hand-written worktree report is ignored", () => {
  const dir = repo();
  try {
    assert.equal(closureStatus(dir, "f", { scenarioId: "s1", evaluatedRevision: "sha256:rev1" }).status, "NOT_RUN");
    appendEvidence(dir, "f", rec());
    assert.equal(closureStatus(dir, "f", { scenarioId: "s1", evaluatedRevision: "sha256:rev1" }).status, "PASS");
    // another revision's entry never closes (replay)
    assert.equal(closureStatus(dir, "f", { scenarioId: "s1", evaluatedRevision: "sha256:rev2" }).status, "STALE");
    // fingerprint drift is STALE
    assert.equal(closureStatus(dir, "f", { scenarioId: "s1", evaluatedRevision: "sha256:rev1", currentFingerprint: "sha256:other" }).status, "STALE");
    // a forged worktree report changes nothing
    writeFileSync(join(dir, "acceptance-report.json"), JSON.stringify({ result: "PASS" }));
    assert.equal(closureStatus(dir, "f", { scenarioId: "s9", evaluatedRevision: "sha256:rev1" }).status, "NOT_RUN");
    appendEvidence(dir, "f", rec({ scenarioId: "s3", result: "FAIL" }));
    assert.equal(closureStatus(dir, "f", { scenarioId: "s3", evaluatedRevision: "sha256:rev1" }).status, "FAIL");
    // broken chain => BLOCKED
    const file = join(ledgerDir(dir, "f"), "ledger.jsonl");
    writeFileSync(file, readFileSync(file, "utf8").replace("sha256:rev1", "sha256:forge"));
    assert.equal(closureStatus(dir, "f", { scenarioId: "s1", evaluatedRevision: "sha256:forge" }).status, "BLOCKED");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("reuse limited to unaffected consumers with identical fingerprint", () => {
  const e = rec();
  assert.equal(reusableForUnaffected(e, "sha256:fp1", { affected: false }), true);
  assert.equal(reusableForUnaffected(e, "sha256:fp1", { affected: true }), false);
  assert.equal(reusableForUnaffected(e, "sha256:fp2", { affected: false }), false);
  assert.equal(reusableForUnaffected(rec({ result: "FAIL" }), "sha256:fp1", { affected: false }), false);
});

test("changed paths outside every case input are BLOCKED unless in the non-SUT class", () => {
  const cases = [{ sutPaths: ["src/a.mjs", "lib/"] }];
  const contract = { nonSutPaths: ["docs/**"] };
  assert.deepEqual(uncoveredPaths({ changedPaths: ["src/a.mjs", "lib/x/y.mjs", "docs/g.md"], cases, contract }), []);
  assert.deepEqual(uncoveredPaths({ changedPaths: ["src/b.mjs", "docs/g.md", "README.txt"], cases, contract }), ["README.txt", "src/b.mjs"]);
  assert.deepEqual(uncoveredPaths({ changedPaths: ["specs/f/reviews.jsonl"], cases, contract, ledgerPaths: ["specs/f/reviews.jsonl"] }), []);
});
