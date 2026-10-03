// Audit H1 (CRITICAL): secrets may only reach workflows that GitHub runs from the DEFAULT branch's file.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { triggerNames, secretReferences, checkSecretExposure } from "./secret-exposure.mjs";
import { checkWorkflow } from "./supply-chain.mjs";

const root = new URL("../../", import.meta.url);
const wf = (on, secret = "          K: ${{ secrets.TRUST_APP_PRIVATE_KEY }}") => `name: x\non:\n${on}\npermissions:\n  contents: read\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps:\n      - env:\n${secret}\n        run: echo hi\n`;
const flagged = (text) => checkSecretExposure("w.yml", text).length > 0;

test("triggerNames reads every YAML shape of `on:` and ignores event options", () => {
  assert.deepEqual(triggerNames("on: push\njobs: {}\n"), ["push"]);
  assert.deepEqual(triggerNames("on: [push, pull_request]\njobs: {}\n"), ["push", "pull_request"]);
  assert.deepEqual(triggerNames("on:\n  push:\n    branches: [main]\n  pull_request_review:\n    types: [submitted]\njobs: {}\n").sort(), ["pull_request_review", "push"]);
  assert.deepEqual(triggerNames("on: { push: { branches: [main] }, workflow_dispatch: {} }\njobs: {}\n").sort(), ["push", "workflow_dispatch"]);
  assert.deepEqual(triggerNames('"on":\n  "pull_request":\n    branches: [main]\njobs: {}\n'), ["pull_request"]);
  assert.deepEqual(triggerNames("on:\n  - push\n  - pull_request\njobs: {}\n").sort(), ["pull_request", "push"]);
  assert.deepEqual(triggerNames("on:\n  # comment\n  push: # trailing\njobs: {}\n"), ["push"]);
});

test("a secret is flagged from EVERY event that runs the branch's own file: pull_request, pull_request_review, push, workflow_dispatch, schedule", () => {
  for (const on of ["  pull_request:\n    branches: [main]", "  pull_request_review:\n    types: [submitted]", "  push:\n    branches: [main]", "  workflow_dispatch:", "  schedule:\n    - cron: '0 0 * * *'"]) {
    assert.equal(flagged(wf(on)), true, on);
  }
});

test("the false negatives of the first version are closed: scalar and list `on:`, flow mapping, quoted keys, mixed events", () => {
  assert.equal(flagged(wf("  pull_request").replace("on:\n  pull_request\n", "on: pull_request\n")), true, "scalar");
  assert.equal(flagged("name: x\non: [pull_request, workflow_call]\njobs:\n  a:\n    runs-on: x\n    steps:\n      - run: echo ${{ secrets.K }}\n"), true, "list");
  assert.equal(flagged("name: x\non: { pull_request: { branches: [main] } }\njobs:\n  a:\n    runs-on: x\n    steps:\n      - run: echo ${{ secrets.K }}\n"), true, "flow mapping");
  assert.equal(flagged('name: x\non:\n  "pull_request":\n    branches: [main]\njobs:\n  a:\n    runs-on: x\n    steps:\n      - run: echo ${{ secrets.K }}\n'), true, "quoted");
  assert.equal(flagged(wf("  pull_request_target:\n  push:\n    branches: [main]")), true, "one safe event does not excuse an unsafe one");
});

test("every way of naming a secret counts: secrets.X, secrets['X'], toJSON(secrets), secrets: inherit", () => {
  assert.deepEqual(secretReferences("run: echo ${{ secrets.A }} ${{ secrets['B'] }} ${{ toJSON(secrets) }}\nsecrets: inherit\n").sort(), ["secrets.A", "secrets: inherit", "secrets[B]".replace("B", "'B'"), "toJSON(secrets)", "secrets (bare context)"].sort()); // toJSON(secrets) also names the bare context: reported twice on purpose
  assert.equal(flagged("name: x\non: push\njobs:\n  a:\n    uses: o/r/.github/workflows/w.yml@" + "a".repeat(40) + "\n    secrets: inherit\n"), true);
  assert.equal(flagged("name: x\non: push\njobs:\n  a:\n    runs-on: x\n    steps:\n      - run: echo ${{ toJSON(secrets) }}\n"), true);
  assert.equal(flagged("name: x\non: push\njobs:\n  a:\n    runs-on: x\n    steps:\n      - run: echo ${{ secrets['K'] }}\n"), true);
});

test("allowed: BASE-file events, GITHUB_TOKEN anywhere, and a mention in a comment", () => {
  assert.equal(flagged(wf("  pull_request_target:\n    branches: [main]")), false);
  assert.equal(flagged(wf("  workflow_call:")), false);
  assert.equal(flagged(wf("  pull_request:", "          T: ${{ secrets.GITHUB_TOKEN }}")), false);
  assert.equal(flagged("# uses secrets.TRUST_APP_PRIVATE_KEY only from pull_request_target\nname: x\non: push\njobs: {}\n"), false);
  assert.equal(flagged(wf("  push:", "          T: ${{ github.token }}")), false);
});

test("checkWorkflow reports it as SECRETS_IN_PR_EVENT (what pr-gate and security-scan fail on)", () => {
  const f = checkWorkflow("w.yml", wf("  push:\n    branches: ['**']"));
  assert.ok(f.some((x) => x.code === "SECRETS_IN_PR_EVENT" && /TRUST_APP_PRIVATE_KEY/.test(x.detail)));
});

test("the merge-gate.yml that shipped in M4.3 (pull_request_review + the App key) is detected (vendored fixture: CI checks out with fetch-depth 1)", () => {
  const shipped = readFileSync(new URL("./fixtures/merge-gate.m4-3-shipped.yml", import.meta.url), "utf8");
  assert.deepEqual(triggerNames(shipped).sort(), ["pull_request_review", "pull_request_target"]);
  assert.ok(checkWorkflow("merge-gate.yml", shipped).some((f) => f.code === "SECRETS_IN_PR_EVENT" && /TRUST_APP_PRIVATE_KEY/.test(f.detail)));
});

test("this repository's own workflows conform: secrets only behind pull_request_target / workflow_call", () => {
  const dir = new URL(".github/workflows/", root);
  const withSecrets = [];
  for (const n of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
    const text = readFileSync(new URL(n, dir), "utf8");
    assert.deepEqual(checkSecretExposure(n, text), [], n);
    if (secretReferences(text).length) withSecrets.push(n);
  }
  assert.deepEqual(withSecrets.sort(), ["merge-gate.yml", "trust-gate.yml"], "exactly the two gate workflows hold the App credentials");
});

const L = (...lines) => `${lines.join("\n")}\n`;
const JOB = ["jobs:", "  a:", "    runs-on: x", "    steps:", "      - run: echo ${{ SECRETS.TRUST_APP_PRIVATE_KEY }}"];
const sha40 = "a".repeat(40);

test("multi-line flow `on:`, an empty/unreadable `on:`, mixed case and `secrets: inherit` variants all fail closed", () => {
  assert.equal(flagged(L("name: x", "on: [", "  push,", "  pull_request", "]", ...JOB)), true, "multi-line flow list");
  assert.equal(flagged(L("name: x", "on: {", "  push: {},", "  pull_request: {}", "}", ...JOB)), true, "multi-line flow mapping");
  assert.deepEqual(triggerNames(L("on: {", "  push: {},", "  pull_request: {}", "}", "jobs: {}")).sort(), ["pull_request", "push"]);
  assert.deepEqual(triggerNames(L("on: [", "  workflow_call,", "  pull_request_target", "]", "jobs: {}")).sort(), ["pull_request_target", "workflow_call"]);
  assert.equal(flagged(L("name: x", ...JOB)), true, "no `on:` at all: triggers unknown -> fail closed");
  assert.equal(flagged(L("name: x", "on:", ...JOB)), true, "empty `on:`");
  assert.equal(flagged(L("name: x", "on: push", ...JOB)), true, "SECRETS in capitals (expression contexts are case-insensitive)");
  for (const inherit of ["    secrets: inherit # all of them", '    secrets: "inherit"', "    secrets: 'inherit'"]) {
    assert.equal(flagged(L("name: x", "on: push", "jobs:", "  a:", `    uses: o/r/.github/workflows/w.yml@${sha40}`, inherit)), true, inherit);
  }
  const step = (expr) => L("name: x", "on: push", "jobs:", "  a:", "    runs-on: x", "    steps:", `      - run: echo ${expr}`);
  assert.equal(flagged(step("${{ format('{0}', secrets) }}")), true, "bare context in format()");
  assert.equal(flagged(step("${{ join(secrets, ',') }}")), true, "bare context in join()");
  assert.equal(flagged(L("name: x", "on: push", "jobs:", "  a:", `    uses: o/r/.github/workflows/w.yml@${sha40}`, "    secrets:", "      K: ${{ secrets.K }}")), true, "secrets: mapping");
  // and it still allows what must be allowed
  assert.equal(flagged(L("name: Detect secrets in the tree", "on: push", "jobs:", "  a:", "    name: scan for secrets", "    runs-on: x", "    steps:", "      - run: echo hi")), false, "a display name that says 'secrets' is not a reference");
  assert.equal(flagged(L("name: x", "on: {", "  pull_request_target: {},", "  workflow_call: {}", "}", ...JOB)), false, "multi-line flow of base-file events");
});
