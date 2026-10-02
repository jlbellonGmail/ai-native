// M4.5 tests: PAR-AUDIT-METHOD (framework structure, profiles, not a merge
// gate) and PAR-AUDIT-VALIDITY (report front matter, exact-commit
// certification against real git fixtures, release gate with tolerance).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseFrontMatter, validateReport, certifyExactCommit } from "./report.mjs";
import { checkAuditFramework, evaluateReleaseGate, PROFILES } from "./framework.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}
function repo() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-audit-"));
  git(dir, "init", "-q");
  git(dir, "config", "user.email", "t@example.invalid");
  git(dir, "config", "user.name", "T");
  return dir;
}
function commit(dir, files, msg = "c") {
  for (const [p, c] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    if (c === null) rmSync(join(dir, p));
    else writeFileSync(join(dir, p), c);
  }
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", msg);
  return git(dir, "rev-parse", "HEAD");
}
const clean = (...d) => d.forEach((x) => rmSync(x, { recursive: true, force: true }));

function reportText(over = {}) {
  const f = {
    targetRepo: "github:o/r", targetCommit: "a".repeat(40), auditMethod: "1.2", profile: "FACTORY",
    date: "2026-10-02T10:00:00Z", scope: "full", score: 95, ...over,
  };
  return `---\ntargetRepo: ${f.targetRepo}\ntargetCommit: ${f.targetCommit}\nplatform:\n  version: v3.0.0-alpha.1\n  commit: ${"b".repeat(40)}\nauditMethod: "${f.auditMethod}"\nprofile: ${f.profile}\npacks: [a, b]\ndate: ${f.date}\nscope: ${f.scope}\nscore: ${f.score}\n${f.extra ?? ""}---\n# Report\n`;
}

// ---- PAR-AUDIT-METHOD ----

test("this repo's audit framework is structurally valid with all five profiles Activo", () => {
  const r = checkAuditFramework(repoRoot);
  assert.deepEqual(r.errors, []);
  assert.equal(r.auditMethod, "1.2");
  assert.deepEqual(Object.keys(r.profiles).sort(), [...PROFILES].sort());
  assert.ok(Object.values(r.profiles).every((s) => s === "Activo"));
});

function frameworkCopy() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-fw-"));
  cpSync(join(repoRoot, "audit"), join(dir, "audit"), { recursive: true });
  return dir;
}

test("framework check fails on: missing profile, state mismatch, wrong order, second runs/, merge-gate framing", () => {
  const d = frameworkCopy();
  try {
    rmSync(join(d, "audit", "profiles", "LIBRARY.md"));
    assert.ok(checkAuditFramework(d).errors.some((e) => e.includes("LIBRARY.md missing")));
    const p = join(d, "audit", "profiles", "FACTORY.md");
    writeFileSync(p, readFileSync(p, "utf8").replace("**Estado:** Activo", "**Estado:** NO IMPLEMENTADO"));
    assert.ok(checkAuditFramework(d).errors.some((e) => e.includes("method.json says Activo but the profile file says")));
    const prompt = join(d, "audit", "method", "AUDIT_PROMPT.md");
    const orig = readFileSync(prompt, "utf8");
    writeFileSync(prompt, orig.replace("1. audit/README.md\n2. audit/method/QUALITY_SCORE.md\n3. audit/method/AUDIT_RULES.md", "1. audit/README.md\n2. audit/method/AUDIT_RULES.md\n3. audit/method/QUALITY_SCORE.md"));
    assert.ok(checkAuditFramework(d).errors.some((e) => e.includes("in that order")));
    writeFileSync(prompt, `${orig}\nreviewer-agent decides the merge`);
    assert.ok(checkAuditFramework(d).errors.some((e) => e.includes("reviewer/merge gate")));
    mkdirSync(join(d, "audit", "runs"));
    assert.ok(checkAuditFramework(d).errors.some((e) => e.includes("second runs/")));
  } finally { clean(d); }
});

test("a non-Activo profile cannot be used by the release gate", () => {
  const r = evaluateReleaseGate({ root: repoRoot, reports: [], candidate: "a".repeat(40), profile: "APPLICATION", profiles: { APPLICATION: "NO IMPLEMENTADO" } });
  assert.equal(r.status, "FAIL");
  assert.match(r.errors[0], /must not be used to score/);
  assert.equal(evaluateReleaseGate({ root: repoRoot, reports: [], candidate: "a".repeat(40), profile: "NOPE" }).status, "FAIL");
});

// ---- PAR-AUDIT-VALIDITY ----

test("front matter parses scalars, nested maps and inline lists; validateReport enforces the schema", () => {
  const { data } = parseFrontMatter(reportText());
  assert.equal(data.score, 95);
  assert.deepEqual(data.packs, ["a", "b"]);
  assert.equal(data.platform.version, "v3.0.0-alpha.1");
  assert.deepEqual(validateReport(reportText()).errors, []);
  assert.ok(validateReport("# no front matter").errors[0].includes("no front matter"));
  assert.ok(validateReport(reportText({ targetCommit: "abc123" })).errors.some((e) => e.includes("targetCommit")));
  assert.ok(validateReport(reportText({ score: 120 })).errors.some((e) => e.includes("score")));
  assert.ok(validateReport(reportText({ profile: "OTHER" })).errors.some((e) => e.includes("profile")));
  assert.ok(validateReport(reportText({ extra: "isMergeGate: true\n" })).errors.some((e) => e.includes("isMergeGate")));
  assert.deepEqual(validateReport(reportText({ extra: "isMergeGate: false\n" })).errors, []);
  assert.ok(validateReport(reportText({ date: "not-a-date" })).errors.some((e) => e.includes("date")));
  const missing = reportText().replace(/targetCommit:.*\n/, "");
  assert.ok(validateReport(missing).errors.some((e) => e.includes("targetCommit")));
});

test("exact-commit certification on a real repo: same commit, audit-only descendant, code change, unrelated", () => {
  const d = repo();
  try {
    const audited = commit(d, { "src.js": "1", "STATUS.md": "s0" });
    const same = certifyExactCommit({ root: d, report: { targetCommit: audited }, candidate: audited });
    assert.equal(same.status, "CURRENT");
    const withReport = commit(d, { ".audit/reports/AUDIT-1.md": "r", "STATUS.md": "s1" });
    assert.equal(certifyExactCommit({ root: d, report: { targetCommit: audited }, candidate: withReport }).status, "CURRENT");
    const changed = commit(d, { "src.js": "2" });
    const stale = certifyExactCommit({ root: d, report: { targetCommit: audited }, candidate: changed });
    assert.equal(stale.status, "STALE");
    assert.deepEqual(stale.changed, ["src.js"]);
    // net-diff semantics: code changed then reverted nets to audit-only -> CURRENT again
    const reverted = commit(d, { "src.js": "1" });
    assert.equal(certifyExactCommit({ root: d, report: { targetCommit: audited }, candidate: reverted }).status, "CURRENT");
    // a code change hidden between two audit-only commits still shows
    const hidden = commit(d, { "src.js": "3", ".audit/reports/AUDIT-2.md": "r2" });
    assert.equal(certifyExactCommit({ root: d, report: { targetCommit: audited }, candidate: hidden }).status, "STALE");
    // the audited commit is not an ancestor of the candidate
    git(d, "checkout", "-q", "--orphan", "other");
    const other = commit(d, { "x": "1" });
    assert.equal(certifyExactCommit({ root: d, report: { targetCommit: audited }, candidate: other }).status, "STALE");
  } finally { clean(d); }
});

test("certification rejects unknown/short commits as INVALID, never as current", () => {
  const d = repo();
  try {
    const c = commit(d, { a: "1" });
    assert.equal(certifyExactCommit({ root: d, report: { targetCommit: "f".repeat(40) }, candidate: c }).status, "INVALID");
    assert.equal(certifyExactCommit({ root: d, report: { targetCommit: c }, candidate: "f".repeat(40) }).status, "INVALID");
    assert.equal(certifyExactCommit({ root: d, report: { targetCommit: c }, candidate: c.slice(0, 7) }).status, "INVALID");
  } finally { clean(d); }
});

test("release gate on a real repo: current report passes, tolerance warns, low score and stale fail", () => {
  const d = repo();
  try {
    const audited = commit(d, { "src.js": "1" });
    const rep = (name, over) => ({ name, text: reportText({ targetCommit: audited, ...over }) });
    const gate = (reports, candidate = audited, extra = {}) => evaluateReleaseGate({ root: d, reports, candidate, profile: "FACTORY", ...extra });
    assert.equal(gate([rep("a.md", { score: 95 })]).status, "PASS");
    const tol = gate([rep("a.md", { score: 89 })]);
    assert.equal(tol.status, "PASS_WITH_WARNINGS");
    assert.match(tol.warnings[0], /within the 2-point tolerance/);
    assert.equal(gate([rep("a.md", { score: 80 })]).status, "FAIL");
    assert.equal(gate([]).status, "FAIL", "no report is a FAIL, never a pass");
    assert.equal(gate([rep("wrongprofile.md", { profile: "LIBRARY" })]).status, "FAIL");
    assert.equal(gate([rep("a.md", { extra: "isMergeGate: true\n" })]).status, "FAIL");
    const next = commit(d, { "src.js": "2" });
    const staleRun = gate([rep("a.md", { score: 99 })], next);
    assert.equal(staleRun.status, "FAIL");
    assert.match(staleRun.errors.join(" "), /STALE/);
    const best = gate([rep("low.md", { score: 91 }), rep("high.md", { score: 97 }), { name: "bad.md", text: "garbage" }]);
    assert.equal(best.status, "PASS_WITH_WARNINGS");
    assert.equal(best.report, "high.md");
    assert.ok(best.warnings.some((w) => w.includes("bad.md")));
  } finally { clean(d); }
});
