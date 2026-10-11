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

test("prototype keys and unknown unit keys fail closed instead of throwing", () => {
  for (const risk of ["toString", "constructor", "__proto__"]) assert.equal(resolveHumanGate({ risk }).ok, false, risk);
  assert.match(resolveHumanGate({ risk: "low", prodution: true }).reasons[0], /unknown work unit key/);
});

test("the shipped policy is internally consistent", () => {
  const p = loadHitlPolicy();
  for (const rule of Object.values(p.risks)) assert.ok(rule.allowed.includes(rule.default) && rule.default !== "none");
  assert.deepEqual(p.risks.high.allowed, ["required"]);
});

import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { deriveHumanGate, readDeclaration, checkHumanGate, allowNoneFor } from "./hitl.mjs";

const NONE = { humanGate: "none", autonomy: "full" };

test("risk is derived from the changed paths, not declared: docs are low, scripts/data/workflows are high", () => {
  assert.equal(deriveHumanGate({ changedPaths: ["docs/guide.md"], declared: NONE, allowNone: true }).gate, "none");
  for (const p of ["scripts/deploy.sh", "src/data/schema.sql", ".github/workflows/x.yml", "src/auth/login.js"]) {
    const r = deriveHumanGate({ changedPaths: ["docs/guide.md", p], declared: NONE, allowNone: true });
    assert.equal(r.ok, false, p);
    assert.equal(r.risk, "high");
  }
});

test("none needs the repository policy: allowNone defaults to off", () => {
  const r = deriveHumanGate({ changedPaths: ["docs/a.md"], declared: NONE });
  assert.equal(r.ok, false);
  assert.match(r.reasons[0], /repository's policy/);
});

test("an unassessable change (no paths) is never low: none is refused, default is final-only", () => {
  assert.equal(deriveHumanGate({ changedPaths: [], declared: NONE, allowNone: true }).ok, false);
  assert.equal(deriveHumanGate({ changedPaths: [] }).gate, "final-only");
});

test("control plane paths (from the base gate config), release and production keep the gate required", () => {
  const cp = deriveHumanGate({ changedPaths: ["docs/a.md", "contracts/x.json"], declared: NONE, allowNone: true, controlPlanePatterns: ["contracts/**"] });
  assert.equal(cp.gate, "required");
  for (const environment of ["release", "production"]) assert.equal(deriveHumanGate({ changedPaths: ["docs/a.md"], declared: NONE, allowNone: true, environment }).gate, "required");
  assert.equal(deriveHumanGate({ changedPaths: ["docs/a.md"], environment: "staging" }).ok, false);
});

test("the declaration is read from spec.md lines and a missing one is the default", () => {
  assert.deepEqual(readDeclaration("# S\nhuman_gate: none\n- autonomy: Full\n"), { humanGate: "none", autonomy: "full" });
  assert.deepEqual(readDeclaration("# nothing"), {});
});

test("checkHumanGate evaluates each changed spec against facts of the whole change", () => {
  const dir = mkdtempSync(join(tmpdir(), "hitl-"));
  mkdirSync(join(dir, "specs", "001-a"), { recursive: true });
  mkdirSync(join(dir, "specs", "002-b"), { recursive: true });
  writeFileSync(join(dir, "specs", "001-a", "spec.md"), "human_gate: none\nautonomy: full\n");
  writeFileSync(join(dir, "specs", "002-b", "spec.md"), "human_gate: final-only\n");
  const ok = checkHumanGate({ project: dir, changedPaths: ["specs/001-a/spec.md", "specs/002-b/spec.md"], allowNone: true, controlPlanePatterns: [] });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.units.map((u) => u.gate), ["none", "final-only"]);
  const bad = checkHumanGate({ project: dir, changedPaths: ["specs/001-a/spec.md", "scripts/run.sh"], allowNone: true, controlPlanePatterns: [] });
  assert.equal(bad.ok, false);
  assert.equal(checkHumanGate({ project: dir, changedPaths: ["specs/001-a/spec.md"], allowNone: false, controlPlanePatterns: [] }).ok, false);
});

test("allowNone comes from the pinned profile; the shipped profiles do not grant it", () => {
  assert.equal(allowNoneFor("factory"), false);
  assert.equal(allowNoneFor("python-service"), false);
  assert.equal(allowNoneFor("does-not-exist"), false);
});

test("CLI derives from git and takes no risk flags: a high-risk diff with none fails, a docs diff passes", () => {
  const dir = mkdtempSync(join(tmpdir(), "hitl-cli-"));
  const { NODE_TEST_CONTEXT, ...env } = process.env;
  const git = (...a) => spawnSync("git", a, { cwd: dir, encoding: "utf8", env });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@e.invalid"); git("config", "user.name", "t"); git("config", "commit.gpgsign", "false");
  mkdirSync(join(dir, "governance", "gates"), { recursive: true });
  writeFileSync(join(dir, "governance", "gates", "gates.json"), JSON.stringify({ trustGate: {}, reservedCheckNames: [], controlPlane: ["contracts/**"], worker: {}, governance: {} }));
  writeFileSync(join(dir, "README.md"), "x");
  git("add", "-A"); git("commit", "-q", "-m", "base");
  mkdirSync(join(dir, "specs", "001-a"), { recursive: true });
  writeFileSync(join(dir, "specs", "001-a", "spec.md"), "human_gate: none\nautonomy: full\n");
  git("add", "-A"); git("commit", "-q", "-m", "spec");
  const run = (...a) => spawnSync(process.execPath, [new URL("./hitl.mjs", import.meta.url).pathname.replace(/^\/(\w:)/, "$1"), "--project", dir, ...a], { encoding: "utf8", env });
  assert.equal(run().status, 1, "--base is mandatory");
  const r = run("--base", "HEAD~1");
  assert.equal(r.status, 1, "factory profile does not allow none");
  assert.match(r.stdout, /repository's policy/);
});
