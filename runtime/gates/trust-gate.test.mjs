// M4.3: PAR-TRUSTED-CALLER (P44), PAR-CONTROL-PLANE-AS-DATA, PAR-CONFIG-FROM-BASE.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { classifyPaths, changedFiles, loadGateConfig, readFromCommit, ControlPlaneError } from "./control-plane.mjs";
import { findSpoofedCheckNames, checkCallerIntegrity } from "./trusted-caller.mjs";
import { evaluateTrustGate } from "./trust-gate.mjs";

const CALLER = ".github/workflows/trust-gate.yml";
const realConfig = JSON.parse(readFileSync(new URL("../../governance/gates/gates.json", import.meta.url), "utf8"));

function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}
function put(dir, rel, content) {
  mkdirSync(dirname(join(dir, rel)), { recursive: true });
  writeFileSync(join(dir, rel), content, "utf8");
}
function repoWithBase(files) {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-trust-"));
  git(dir, "init", "-q");
  git(dir, "config", "user.email", "t@example.invalid");
  git(dir, "config", "user.name", "T");
  for (const [p, c] of Object.entries(files)) put(dir, p, c);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "base");
  return dir;
}
function commitAll(dir, msg) {
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", msg);
  return git(dir, "rev-parse", "HEAD");
}
const baseFiles = { [CALLER]: "on: pull_request_target\n# ai-native/trust-gate\n", "governance/gates/gates.json": JSON.stringify(realConfig), "README.md": "x" };

test("classifyPaths: control-plane globs", () => {
  const { controlPlane, other } = classifyPaths([".github/workflows/ci.yml", "runtime/gates/a.mjs", "runtime/status/a.mjs", "AGENTS.md", "docs/a.md"], realConfig.controlPlane);
  assert.deepEqual(controlPlane, [".github/workflows/ci.yml", "runtime/gates/a.mjs", "AGENTS.md"]);
  assert.deepEqual(other, ["runtime/status/a.mjs", "docs/a.md"]);
});

test("PAR-CONFIG-FROM-BASE: config comes from base, a PR edit of gates.json is ignored", () => {
  const dir = repoWithBase(baseFiles);
  const base = git(dir, "rev-parse", "HEAD");
  const weakened = { ...realConfig, reservedCheckNames: [], controlPlane: [] };
  put(dir, "governance/gates/gates.json", JSON.stringify(weakened));
  const head = commitAll(dir, "weaken config");
  const cfg = loadGateConfig(dir, base);
  assert.deepEqual(cfg.reservedCheckNames, realConfig.reservedCheckNames);
  assert.deepEqual(loadGateConfig(dir, head).reservedCheckNames, []); // proves head differs; the gate never reads it
  const verdict = evaluateTrustGate({ config: cfg, changed: changedFiles(dir, base, head), baseWorkflows: { [CALLER]: baseFiles[CALLER] }, headWorkflows: { [CALLER]: baseFiles[CALLER] } });
  assert.equal(verdict.conclusion, "neutral");
  assert.ok(verdict.controlPlane.includes("governance/gates/gates.json"));
  rmSync(dir, { recursive: true, force: true });
});

test("loadGateConfig fails closed when config is missing or invalid at base", () => {
  const dir = repoWithBase({ "README.md": "x" });
  const base = git(dir, "rev-parse", "HEAD");
  assert.throws(() => loadGateConfig(dir, base), ControlPlaneError);
  put(dir, "governance/gates/gates.json", "{not json");
  const bad = commitAll(dir, "bad");
  assert.throws(() => loadGateConfig(dir, bad), /not valid JSON/);
  rmSync(dir, { recursive: true, force: true });
});

test("readFromCommit returns null for a path missing at that commit", () => {
  const dir = repoWithBase({ "a.txt": "1" });
  assert.equal(readFromCommit(dir, git(dir, "rev-parse", "HEAD"), "nope.txt"), null);
  rmSync(dir, { recursive: true, force: true });
});

test("PAR-TRUSTED-CALLER: PR job with a reserved check name is a hard failure", () => {
  const spoof = "jobs:\n  fake:\n    name: ai-native/trust-gate\n    steps:\n      - run: echo ok\n";
  const verdict = evaluateTrustGate({
    config: realConfig,
    changed: [".github/workflows/fake.yml"],
    baseWorkflows: { [CALLER]: baseFiles[CALLER] },
    headWorkflows: { [CALLER]: baseFiles[CALLER], ".github/workflows/fake.yml": spoof },
  });
  assert.equal(verdict.conclusion, "failure");
  assert.match(verdict.title, /SPOOFED_CHECK_NAME/);
});

test("PAR-TRUSTED-CALLER: spoof detection ignores quoting and case", () => {
  const f = findSpoofedCheckNames({ "w.yml": "name: 'AI-Native/Trust-Gate'" }, realConfig.reservedCheckNames, CALLER);
  assert.equal(f.length, 1);
});

test("PAR-TRUSTED-CALLER: deleting the caller fails; modifying it is flagged neutral, not silently trusted", () => {
  assert.equal(checkCallerIntegrity("a", null, CALLER)[0].code, "CALLER_REMOVED");
  assert.equal(checkCallerIntegrity(null, "a", CALLER)[0].code, "CALLER_MISSING_AT_BASE");
  assert.equal(checkCallerIntegrity("a", "a", CALLER).length, 0);
  const v = evaluateTrustGate({ config: realConfig, changed: [CALLER], baseWorkflows: { [CALLER]: "a" }, headWorkflows: { [CALLER]: "b" } });
  assert.equal(v.conclusion, "neutral");
  assert.equal(v.findings[0].code, "CALLER_MODIFIED");
  const removed = evaluateTrustGate({ config: realConfig, changed: [CALLER], baseWorkflows: { [CALLER]: "a" }, headWorkflows: {} });
  assert.equal(removed.conclusion, "failure");
});

test("PAR-CONTROL-PLANE-AS-DATA: untouched control plane passes; touching it requires human review", () => {
  const clean = evaluateTrustGate({ config: realConfig, changed: ["runtime/status/x.mjs"], baseWorkflows: { [CALLER]: "a" }, headWorkflows: { [CALLER]: "a" } });
  assert.equal(clean.conclusion, "success");
  const touched = evaluateTrustGate({ config: realConfig, changed: ["core/security-policy.json"], baseWorkflows: { [CALLER]: "a" }, headWorkflows: { [CALLER]: "a" } });
  assert.equal(touched.conclusion, "neutral");
  assert.deepEqual(touched.controlPlane, ["core/security-policy.json"]);
});

test("the real caller workflow is its own trusted baseline: pull_request_target, no head checkout, App source", () => {
  const text = readFileSync(new URL("../../.github/workflows/trust-gate.yml", import.meta.url), "utf8");
  assert.match(text, /pull_request_target:/);
  assert.match(text, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  assert.doesNotMatch(text, /ref: \$\{\{ github\.event\.pull_request\.head/);
  assert.match(text, /create-github-app-token@[0-9a-f]{40}/);
  assert.match(text, /secrets\.TRUST_APP_ID/);
});
