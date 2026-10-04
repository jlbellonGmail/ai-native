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

test("allowed: BASE-file events and GITHUB_TOKEN anywhere", () => {
  assert.equal(flagged(wf("  pull_request_target:\n    branches: [main]")), false);
  assert.equal(flagged(wf("  workflow_call:")), false);
  assert.equal(flagged(wf("  pull_request:", "          T: ${{ secrets.GITHUB_TOKEN }}")), false);
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
  assert.equal(flagged(L("name: Detect secrets in the tree", "on: push", "jobs:", "  a:", "    runs-on: x", "    steps:", "      - run: echo hi")), true, "a display name that says secrets is REPORTED (cannot be told from code without a YAML parser): reword it");
  assert.equal(flagged(L("name: x", "on: {", "  pull_request_target: {},", "  workflow_call: {}", "}", ...JOB)), false, "multi-line flow of base-file events");
});

test("bypasses found by the independent review: a `name:` key under env:/with:, an inline `#` inside quotes, and `release`", () => {
  // `name:` as an env/with KEY must still be scanned (only a plain display name is skipped)
  assert.equal(flagged(L("name: x", "on: push", "jobs:", "  a:", "    runs-on: x", "    steps:", "      - env:", "          name: ${{ secrets.TRUST_APP_PRIVATE_KEY }}", "        run: echo $name | base64")), true, "env name:");
  assert.equal(flagged(L("name: x", "on: push", "jobs:", "  a:", "    runs-on: x", "    steps:", `      - uses: o/r@${sha40}`, "        with:", "          name: ${{ secrets.K }}")), true, "with name:");
  // an inline `#` (inside a quoted string / shell text) must not hide what follows
  assert.equal(flagged(L("name: x", "on: push", "jobs:", "  a:", "    runs-on: x", "    steps:", "      - run: echo \" #\"; echo ${{ secrets.K }} | base64")), true, "# inside quotes");
  assert.equal(flagged(L("name: x", "on: push", "jobs:", "  a:", "    runs-on: x", "    steps:", "      - run: echo 'a # b' ${{ secrets.K }}")), true, "# inside single quotes");
  // `release` runs the file at the TAGGED commit, so it is not a base-file event
  assert.equal(flagged(L("name: x", "on:", "  release:", "    types: [published]", ...JOB)), true, "release");
  // plain display names stay allowed
  assert.equal(flagged(L("name: no credentials here", "on: push", "jobs:", "  a:", "    name: still none", "    runs-on: x", "    steps:", "      - name: handle them safely", "        run: echo hi")), false);
});

test("supply-chain.mjs reports each exposure exactly once (the old duplicate detector is gone)", () => {
  const f = checkWorkflow("w.yml", L("name: x", "on: push", "permissions:", "  contents: read", ...JOB));
  assert.equal(f.filter((x) => x.code === "SECRETS_IN_PR_EVENT").length, secretReferences(L(...JOB)).length);
});

test("no comment is trusted: a `#` line inside a block scalar is DATA that GitHub still expands, and a comment mention is reported", () => {
  const blockScalar = L("name: x", "on: pull_request", "jobs:", "  a:", "    runs-on: x", "    steps:", "      - env:", "          X: |", "            #${{ secrets.TRUST_APP_PRIVATE_KEY }}", '        run: echo "$X" | base64');
  assert.equal(flagged(blockScalar), true, "# line inside a block scalar");
  assert.equal(flagged(L("name: x", "on: push", "jobs:", "  a:", "    runs-on: x", "    steps:", "      - uses: actions/github-script@" + sha40, "        with:", "          script: |", "            # ${{ secrets.K }}", "            core.info('x')")), true, "github-script block");
  assert.equal(flagged(L("# the old version used secrets.K from a push workflow", "name: x", "on: push", "jobs: {}")), true, "a comment mention is reported: over-reporting is the safe side");
  assert.equal(flagged(L("# the old version used secrets.K from a push workflow", "name: x", "on: pull_request_target", "jobs: {}")), false, "...but is fine behind a base-file event");
});

test("a multi-line expression whose middle line starts with `name:` cannot hide a reference (round-5 bypass)", () => {
  const w = L("name: x", "on: push", "jobs:", "  a:", "    runs-on: x", "    steps:", "      - run: |", "          echo ${{ format('{0}', 'a", "          name: ', secrets.TRUST_APP_PRIVATE_KEY) }}");
  assert.equal(flagged(w), true);
});

test("YAML double-quoted escapes that GitHub decodes before evaluating an expression cannot hide a reference (round-6 bypass)", () => {
  const BS = String.fromCharCode(92);
  const head = ["name: x", "on: push", "jobs:", "  a:", "    runs-on: x", "    steps:"];
  assert.equal(flagged(L(...head, `      - run: "echo \${{ ${BS}x73ecrets.TRUST_APP_PRIVATE_KEY }} | base64"`)), true, "hex escape");
  assert.equal(flagged(L(...head, `      - run: "echo \${{ ${BS}u0073ecrets.K }}"`)), true, "unicode escape");
  assert.equal(flagged(L(...head, `      - run: "\${{ sec${BS}`, "          rets.K }}\"")), true, "line continuation inside a double-quoted scalar");
  assert.equal(flagged(L(...head, `      - run: "se${BS}`, `          cr${BS}`, '          ets"')), true, "multi-line continuation");
  // a shell line continuation inside a `run: |` block (balanced quotes) is NOT an escape
  // the rule is STATELESS: any trailing backslash in a branch-file workflow is a finding, including a shell continuation (rewrite it)
  assert.equal(flagged(L(...head, "      - run: |", `          gh release create "$V" ${BS}`, `            --title "t" ${BS}`, "            dist/a.tgz")), true, "shell continuation is reported too");
  // round-7 bypass: a quote in a comment used to desynchronise the open/closed guess
  assert.equal(flagged(L('# "', ...head, '      - run: "echo ${{', `          se${BS}`, '          crets.TRUST_APP_PRIVATE_KEY }}" | base64')), true, "desynchronised quote parity");
  assert.equal(flagged(L(...head, "      - run: echo hi", "      - run: echo ok")), false, "no backslash, no secret: nothing to report");
  // (round 8) the escape rule is UNCONDITIONAL: even behind a base-file event an escape is reported, because it could be hiding an event key
  assert.equal(flagged(L("name: x", "on: pull_request_target", "jobs:", "  a:", "    runs-on: x", "    steps:", `      - run: "echo \${{ ${BS}x73ecrets.K }}"`)), true);
});

test("round-8 bypass: an escaped event KEY (\"pus\\x68\":) cannot make a push workflow look base-file-only; any escape is a finding", () => {
  const BS = String.fromCharCode(92);
  const w = L("name: x", "on:", "  pull_request_target:", `  "pus${BS}x68":`, "jobs:", "  a:", "    runs-on: x", "    steps:", "      - run: echo ${{ secrets.TRUST_APP_PRIVATE_KEY }}");
  assert.equal(flagged(w), true);
  // even with a clean-looking base-file-only trigger set, an escape anywhere is reported
  assert.equal(flagged(L("name: x", "on: pull_request_target", "jobs:", "  a:", "    runs-on: x", "    steps:", `      - run: "echo ${BS}x41"`)), true);
  // and a workflow with no escape and only base-file events is still fine
  assert.equal(flagged(L("name: x", "on: pull_request_target", ...JOB)), false);
});

test("round-9 bypass: a quoted `#` inside a flow-style `on:` cannot cut the event list; unbalanced or commented flow is unreadable (fail closed)", () => {
  const job = ["jobs:", "  a:", "    runs-on: x", "    steps:", "      - run: echo ${{ secrets.TRUST_APP_PRIVATE_KEY }}"];
  assert.equal(flagged(L("name: x", 'on: { pull_request_target: { branches: ["a #"] }, push: {} }', ...job)), true, "mapping with a quoted #");
  assert.equal(flagged(L("name: x", 'on: [pull_request_target, "x #", push]', ...job)), true, "list with a quoted #");
  assert.equal(flagged(L("name: x", "on: { pull_request_target: {}, push: {}", ...job)), true, "never-closing flow");
  assert.deepEqual(triggerNames(L('on: { pull_request_target: { branches: ["a #"] }, push: {} }', "jobs: {}")), [], "unreadable, not silently truncated");
  // plain flow collections and trailing comments on block/scalar forms still parse
  assert.deepEqual(triggerNames(L("on: { pull_request_target: {}, workflow_call: {} }", "jobs: {}")).sort(), ["pull_request_target", "workflow_call"]);
  assert.deepEqual(triggerNames(L("on: push # trailing comment", "jobs: {}")), ["push"]);
  assert.deepEqual(triggerNames(L("on:", "  push: # c", "    branches: [main]", "jobs: {}")), ["push"]);
});

test("round-10 bypass: an event key with an anchor, tag or explicit-key marker is not silently dropped: the trigger set becomes unreadable (fail closed)", () => {
  const job = ["jobs:", "  a:", "    runs-on: x", "    steps:", "      - run: echo ${{ secrets.TRUST_APP_PRIVATE_KEY }}"];
  for (const key of ["  &a push:", "  !!str push:", "  ? push", "  *alias:"]) {
    assert.equal(flagged(L("name: x", "on:", "  pull_request_target:", key, ...job)), true, key);
    assert.deepEqual(triggerNames(L("on:", "  pull_request_target:", key, "jobs: {}")), [], key);
  }
  // ordinary block keys, quoted keys and list items still read normally
  assert.deepEqual(triggerNames(L("on:", "  pull_request_target:", '  "workflow_call":', "jobs: {}")).sort(), ["pull_request_target", "workflow_call"]);
  assert.equal(flagged(L("name: x", "on:", "  pull_request_target:", "    branches: [main]", ...job)), false);
});
