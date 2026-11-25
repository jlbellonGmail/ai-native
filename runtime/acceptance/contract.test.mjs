import { test } from "node:test";
import assert from "node:assert/strict";
import { validateContract, nonSutPathErrors, nonSutPlanErrors, inNonSutClass } from "./contract.mjs";
import { consolidate, toResultStatus, isBlocking } from "./result.mjs";

const runner = (over = {}) => ({ id: "unit", executable: "node", argv: ["--test", "tests/"], cwd: ".", format: "node-test", timeoutMs: 60000, isolation: "restricted", env: ["PATH"], ...over });
const contract = (over = {}) => ({ schemaVersion: 1, minObservedCases: 1, runners: [runner()], ...over });

test("a well formed contract validates; no command strings exist", () => {
  assert.equal(validateContract(contract()).ok, true);
  assert.equal(validateContract(contract({ runners: [{ ...runner(), command: "npm test" }] })).ok, false);
});

test("shell, inline script, substitution and path escape are rejected", () => {
  const bad = (r) => validateContract(contract({ runners: [runner(r)] }));
  assert.match(bad({ executable: "bash", argv: ["-c", "x"] }).errors.join(), /not an allowed identity|is a shell/);
  assert.match(bad({ executable: "powershell.exe" }).errors.join(), /shell/);
  assert.match(bad({ argv: ["-e", "0"] }).errors.join(), /inline script/);
  assert.match(bad({ argv: ["--eval", "0"] }).errors.join(), /inline script/);
  assert.match(bad({ argv: ["$(whoami)"] }).errors.join(), /substitution/);
  assert.match(bad({ argv: ["../outside"] }).errors.join(), /path escape/);
  assert.match(bad({ executable: "$NODE" }).errors.join(), /schema/);
  assert.match(bad({ cwd: "../x" }).errors.join(), /schema|escapes/);
  assert.match(bad({ env: ["API_TOKEN"] }).errors.join(), /secret-like/);
  // independent review F1/F5/F11: every spelling of inline code, preloads and permission switches is refused
  for (const a of ["--eval=console.log(1)", "-pe", "--print=1", "--import=data:text/javascript,1", "-r", "--require=./x.cjs", "--allow-fs-read=*", "--allow-child-process", "--allow-addons", "--inspect", "--env-file=.env", "--experimental-loader=x", "--input-type=module"]) {
    assert.ok(bad({ argv: [a, "tests/x.mjs"] }).errors.length > 0, a);
  }
  assert.equal(bad({ argv: ["--test", "--test-reporter=tap", "tests/x.mjs"] }).errors.length, 0);
  assert.match(bad({ executable: "python" }).errors.join(), /not an allowed host identity/);
  assert.match(bad({ executable: "pytest" }).errors.join(), /not an allowed host identity/);
  assert.match(bad({ executable: "tools/sh" }).errors.join(), /is a shell/);
});

test("network and container rules", () => {
  const img = "reg/x@sha256:" + "a".repeat(64);
  assert.match(validateContract(contract({ runners: [runner({ isolation: "container", image: "x:latest" })] })).errors.join(), /pinned by digest/);
  assert.equal(validateContract(contract({ runners: [runner({ isolation: "container", image: img })] })).ok, true);
  // loopback is refused outright: never mapped to host networking, never cleared by an agent-written field
  assert.match(validateContract(contract({ runners: [runner({ isolation: "container", image: img, network: "loopback", networkApproval: "REVIEW-1" })] })).errors.join(), /not supported.*never host networking/);
  assert.match(validateContract(contract({ runners: [runner({ network: "none" })] })).errors.join(), /container tier/);
  assert.match(validateContract(contract({ runners: [runner(), runner()] })).errors.join(), /duplicate runner id/);
});

test("non-SUT class: wildcards, source roots and control-plane are rejected (RF-34)", () => {
  for (const g of ["**", "*", "src/**", "runtime/**", ".github/**", "governance/**", "governance/gates/gates.json", "knowledge/**", "knowledge/sdd/templates/x.md", "contracts/**", "a/b.md"]) {
    assert.ok(nonSutPathErrors([g]).length > 0, `should reject ${g}`);
  }
  for (const g of ["docs/**", "specs/001/**/notes.md", "README.md", "governance/execution/**"]) assert.deepEqual(nonSutPathErrors([g]), [], g);
  const c = contract({ nonSutPaths: ["docs/**"] });
  assert.equal(inNonSutClass(c, "docs/guide/a.md"), true);
  assert.equal(inNonSutClass(c, "src/a.py"), false);
});

test("non-SUT class may not swallow SUT inputs, datasets, plans or the contract", () => {
  const plan = { cases: [{ sutPaths: ["docs/api/openapi.json"] }], datasets: [{ path: "specs/f/acceptance/data.json" }] };
  assert.match(nonSutPlanErrors({ contract: contract({ nonSutPaths: ["docs/**"] }), plan }).join(), /docs\/api\/openapi\.json/);
  assert.match(nonSutPlanErrors({ contract: contract({ nonSutPaths: ["specs/**"] }), plan }).join(), /plan|specs\/f/);
  assert.deepEqual(nonSutPlanErrors({ contract: contract({ nonSutPaths: ["docs/guide/**"] }), plan }), []);
});

test("result mapping (RF-29) and fail-closed consolidation", () => {
  assert.deepEqual(["PASS", "FAIL", "BLOCKED", "STALE", "NOT_RUN", "NOT_APPLICABLE", "bogus"].map(toResultStatus), ["PASS", "FAIL", "ERROR", "ERROR", "ERROR", "NOT_APPLICABLE", "ERROR"]);
  for (const s of ["BLOCKED", "STALE", "NOT_RUN", "FAIL"]) assert.equal(isBlocking(s), true);
  assert.equal(isBlocking("PASS"), false);
  assert.equal(consolidate([]).status, "BLOCKED");
  assert.equal(consolidate([{ id: "a", status: "PASS" }]).status, "PASS");
  assert.equal(consolidate([{ id: "a", status: "PASS" }, { id: "b", status: "STALE" }]).status, "STALE");
  assert.equal(consolidate([{ id: "a", status: "PASS" }, { id: "b", status: "NOT_RUN" }]).status, "NOT_RUN");
  assert.equal(consolidate([{ id: "a", status: "BLOCKED" }, { id: "b", status: "FAIL" }]).status, "FAIL");
  assert.equal(consolidate([{ id: "a", status: "PASS" }, { id: "b", status: "NOT_APPLICABLE" }]).status, "PASS");
  assert.equal(consolidate([{ id: "a", status: "NOT_APPLICABLE" }]).status, "BLOCKED");
  assert.equal(consolidate([{ id: "a", status: "weird" }]).status, "BLOCKED");
  const pend = consolidate([{ id: "a", status: "PASS" }], { pending: ["NOT_APPLICABLE_PENDING_APPROVAL"] });
  assert.equal(pend.status, "BLOCKED");
  assert.deepEqual(pend.pending, ["NOT_APPLICABLE_PENDING_APPROVAL"]);
  assert.equal(pend.resultStatus, "ERROR");
});
