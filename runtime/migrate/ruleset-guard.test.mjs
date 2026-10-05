// Canary finding C-2: a migration that retires a workflow whose check the consumer's ruleset REQUIRES must be
// reported by `plan`, before `apply`. Pure tests here; the real template-starter v2.0.4 case is in migrate-v2.test.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseJobs, contextsOfJob, checkRulesetImpact, requiredChecksFrom, fetchRequiredChecks, CODES } from "./ruleset-guard.mjs";
import { callerWorkflow, L3_CHECK, originRepo, resolveRequiredChecks } from "./migrate.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");

// shape of template-starter's v2 ci.yml (CRLF on purpose: a Windows checkout)
const V2_CI = ["name: CI", "on:", "  push:", "    branches: [main]", "  pull_request:", "", "jobs:", "  circuit-tests:", "    runs-on: ubuntu-latest", "    steps:", "      - run: echo a", "",
  "  product-tests:", "    runs-on: ubuntu-latest", "    steps:", "      - run: echo b", "", "  local-reconciler-tests:", "    strategy:", "      matrix:", "        os: [ubuntu-latest, windows-latest]", "    runs-on: ${{ matrix.os }}", "    steps:", "      - run: echo c", ""].join("\r\n");
const REQUIRED = ["circuit-tests", "product-tests", "local-reconciler-tests"].map((context) => ({ context, integrationId: 15368 }));
const caller = { path: ".github/workflows/ai-native.yml", text: callerWorkflow({ repo: "github:o/ai-native", commit: "a".repeat(40), baseBranch: "main" }) };

test("parseJobs reads job ids, names, matrix and reusable calls (CRLF included)", () => {
  const jobs = parseJobs(`${V2_CI}\r\n  named:\r\n    name: "Pretty name"\r\n    runs-on: x\r\n  callee:\r\n    uses: o/r/.github/workflows/w.yml@abc\r\n`);
  assert.deepEqual(jobs.map((j) => j.id), ["circuit-tests", "product-tests", "local-reconciler-tests", "named", "callee"]);
  assert.equal(jobs[2].matrix, true);
  assert.equal(jobs[3].name, "Pretty name");
  assert.equal(jobs[4].uses, "o/r/.github/workflows/w.yml@abc");
  assert.deepEqual(parseJobs("name: x\non: push\n"), []);
});

test("contexts: id, explicit name, matrix suffix, expression, reusable call", () => {
  const ok = (job, ctx) => contextsOfJob(job).some((c) => c.pattern.test(ctx));
  assert.ok(ok({ id: "a", name: null, uses: null, matrix: false }, "a"));
  assert.ok(!ok({ id: "a", name: null, uses: null, matrix: false }, "a (ubuntu-latest)"));
  assert.ok(ok({ id: "a", name: "Pretty", uses: null, matrix: false }, "Pretty"));
  assert.ok(!ok({ id: "a", name: "Pretty", uses: null, matrix: false }, "a"));
  assert.ok(ok({ id: "t", name: null, uses: null, matrix: true }, "t (windows-latest)"));
  assert.ok(ok({ id: "t", name: "Tests ${{ matrix.os }}", uses: null, matrix: true }, "Tests ubuntu-latest (3.12)"));
  assert.ok(ok({ id: "l3", name: null, uses: "o/r/.github/workflows/x.yml@abc", matrix: false }, "l3 / anything"));
});

test("the canary case: every required check came from the retired ci.yml -> all of them WILL_DISAPPEAR, the plan FAILS and names the action", () => {
  const r = checkRulesetImpact({ required: REQUIRED, retiring: [{ path: ".github/workflows/ci.yml", text: V2_CI }], surviving: [caller], proposed: [L3_CHECK] });
  assert.equal(r.status, "FAIL");
  assert.deepEqual(r.findings.map((f) => f.code), Array(3).fill(CODES.WILL_DISAPPEAR));
  assert.deepEqual(r.findings.map((f) => f.context), REQUIRED.map((c) => c.context));
  assert.match(r.findings[0].action, /replace 'circuit-tests' by 'l3 \/ l3-consumer'/);
  assert.match(r.findings[0].action, /do not add a fake job/);
  assert.deepEqual(r.proposed, [L3_CHECK]);
});

test("a required check a surviving workflow also produces is not reported; a check the L3 caller produces is satisfied", () => {
  const keep = { path: ".github/workflows/other.yml", text: "jobs:\n  circuit-tests:\n    runs-on: x\n" };
  const r = checkRulesetImpact({ required: [...REQUIRED, { context: L3_CHECK }], retiring: [{ path: ".github/workflows/ci.yml", text: V2_CI }], surviving: [keep, caller], proposed: [L3_CHECK] });
  assert.deepEqual(r.findings.map((f) => f.context), ["product-tests", "local-reconciler-tests"]);
  assert.deepEqual(r.proposed, [], "already required: nothing to propose");
});

test("a required check no workflow explains is UNKNOWN_SOURCE (warning), never safe; a retired workflow we cannot read is an ERROR", () => {
  const unk = checkRulesetImpact({ required: [{ context: "codecov/patch" }], retiring: [], surviving: [caller] });
  assert.equal(unk.status, "PASS");
  assert.equal(unk.findings[0].code, CODES.UNKNOWN_SOURCE);
  assert.equal(unk.findings[0].severity, "warning");
  const bad = checkRulesetImpact({ required: [], retiring: [{ path: ".github/workflows/ci.yml", text: "not: a workflow" }], surviving: [] });
  assert.equal(bad.status, "FAIL");
  assert.equal(bad.findings[0].code, CODES.WORKFLOW_UNREADABLE);
});

test("requiredChecksFrom accepts the rules/branches response, a ruleset object, a ruleset list and classic protection", () => {
  const rule = { type: "required_status_checks", parameters: { required_status_checks: [{ context: "a", integration_id: 1 }, { context: "b" }] } };
  const want = [{ context: "a", integrationId: 1 }, { context: "b", integrationId: null }];
  assert.deepEqual(requiredChecksFrom([{ type: "pull_request" }, rule]), want);
  assert.deepEqual(requiredChecksFrom({ id: 1, rules: [rule] }), want);
  assert.deepEqual(requiredChecksFrom([{ rules: [rule] }, { rules: [] }]), want);
  assert.deepEqual(requiredChecksFrom({ strict: true, contexts: ["a", "b"] }).map((c) => c.context), ["a", "b"]);
  assert.deepEqual(requiredChecksFrom({ nothing: true }), []);
});

test("fetchRequiredChecks: reads rules, tolerates 'no classic protection', and FAILS CLOSED on any other error", () => {
  const rule = [{ type: "required_status_checks", parameters: { required_status_checks: [{ context: "x" }] } }];
  const calls = [];
  const run = (answers) => (args) => { calls.push(args[1]); return answers.shift(); };
  const ok = fetchRequiredChecks({ repo: "o/r", branch: "main", run: run([{ status: 0, stdout: JSON.stringify(rule) }, { status: 1, stderr: "gh: Branch not protected (HTTP 404)" }]) });
  assert.deepEqual(ok.required.map((c) => c.context), ["x"]);
  assert.match(calls[0], /repos\/o\/r\/rules\/branches\/main/);
  const classic = fetchRequiredChecks({ repo: "o/r", branch: "main", run: run([{ status: 0, stdout: "[]" }, { status: 0, stdout: JSON.stringify({ contexts: ["legacy"] }) }]) });
  assert.deepEqual(classic.required.map((c) => c.context), ["legacy"]);
  assert.match(fetchRequiredChecks({ repo: "o/r", branch: "main", run: run([{ status: 1, stderr: "HTTP 403" }]) }).error, /could not read the rules/);
  assert.match(fetchRequiredChecks({ repo: "o/r", branch: "main", run: run([{ status: 0, stdout: "[]" }, { status: 1, stderr: "HTTP 500" }]) }).error, /could not read the branch protection/);
  assert.match(fetchRequiredChecks({ repo: "o/r", branch: "main", run: run([{ status: 0, stdout: "not json" }]) }).error, /unreadable/);
  assert.match(fetchRequiredChecks({ repo: "../etc", branch: "main" }).error, /invalid consumer repo/);
});

test("L3_CHECK is exactly what the generated caller and the reusable l3-consumer.yml report", () => {
  const callerJobs = parseJobs(caller.text);
  assert.equal(callerJobs.length, 1);
  const reusable = parseJobs(readFileSync(join(root, ".github", "workflows", "l3-consumer.yml"), "utf8"));
  assert.equal(reusable.length, 1);
  assert.equal(L3_CHECK, `${callerJobs[0].id} / ${reusable[0].name ?? reusable[0].id}`);
});

test("resolveRequiredChecks: file, skip and 'no source' (fail closed), independent of the cwd", () => {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-rg-"));
  try {
    const file = join(dir, "rs.json");
    writeFileSync(file, JSON.stringify([{ type: "required_status_checks", parameters: { required_status_checks: [{ context: "c" }] } }]));
    assert.deepEqual(resolveRequiredChecks({ target: dir, baseBranch: "main", rulesetFile: file }).requiredChecks.map((c) => c.context), ["c"]);
    assert.equal(resolveRequiredChecks({ target: dir, baseBranch: "main", skip: true }).notChecked, true);
    assert.match(resolveRequiredChecks({ target: dir, baseBranch: "main" }).error, /RULESET_UNREADABLE: no ruleset source/);
    writeFileSync(file, "{ nope");
    assert.match(resolveRequiredChecks({ target: dir, baseBranch: "main", rulesetFile: file }).error, /RULESET_UNREADABLE/);
    assert.equal(originRepo(dir), null);
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dir });
    execFileSync("git", ["remote", "add", "origin", "https://github.com/jlbellonGmail/template-starter.git"], { cwd: dir });
    assert.equal(originRepo(dir), "jlbellonGmail/template-starter");
    execFileSync("git", ["remote", "set-url", "origin", "git@github.com:o/r.git"], { cwd: dir });
    assert.equal(originRepo(dir), "o/r");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI: plan with no ruleset source fails closed; --skip-ruleset-check records NOT_CHECKED; works from any cwd", () => {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-rgcli-"));
  const git = (...a) => execFileSync("git", a, { cwd: dir, encoding: "utf8" });
  try {
    git("init", "-q", "-b", "main");
    git("config", "user.email", "t@example.invalid");
    git("config", "user.name", "T");
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(join(dir, "src", "app.js"), "1\n");
    git("add", "-A");
    git("commit", "-q", "-m", "base");
    const base = ["plan", "--target", dir, "--repo", "github:o/ai-native", "--version", "v3.0.0-rc.1", "--commit", "a".repeat(40), "--digest", `sha256:${"1".repeat(64)}`, "--tool", "claude", "--json"];
    const run = (extra) => spawnSync(process.execPath, [join(here, "migrate.mjs"), ...base, ...extra], { cwd: tmpdir(), encoding: "utf8" });
    const closed = run([]);
    assert.notEqual(closed.status, 0);
    assert.match(closed.stdout, /RULESET_UNREADABLE/);
    const skipped = run(["--skip-ruleset-check"]);
    assert.equal(skipped.status, 0, skipped.stdout);
    assert.match(skipped.stdout, /RULESET_NOT_CHECKED/);
    const file = join(dir, "..", `rs-${process.pid}.json`);
    writeFileSync(file, JSON.stringify([{ type: "required_status_checks", parameters: { required_status_checks: [{ context: "external/check" }] } }]));
    try {
      const withFile = run(["--ruleset-file", file]);
      assert.equal(withFile.status, 0, withFile.stdout);
      assert.match(withFile.stdout, /RULESET_REQUIRED_CHECK_UNKNOWN_SOURCE/);
      assert.match(withFile.stdout, /l3 \/ l3-consumer/);
    } finally {
      rmSync(file, { force: true });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
