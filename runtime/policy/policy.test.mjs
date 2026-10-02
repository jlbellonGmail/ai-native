import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSecurityPolicy, resolvePolicyDecision, scopeMatches } from "./policy.mjs";

test("loads the real core/security-policy.json and it is fail-closed by default", () => {
  const policy = loadSecurityPolicy();
  assert.equal(policy.defaultDecision, "deny");
  assert.equal(policy.sameAcrossSddLevels, true);
});

test("'allow' resolves to ALLOW for all roles that declare it (e.g. READ)", () => {
  for (const role of ["planner", "builder", "reviewer", "orchestrator", "human"]) {
    const decision = resolvePolicyDecision({ role, capability: "READ" });
    assert.equal(decision.decision, "ALLOW");
  }
});

test("'deny' resolves to DENY (planner cannot EXECUTE)", () => {
  const decision = resolvePolicyDecision({ role: "planner", capability: "EXECUTE" });
  assert.equal(decision.decision, "DENY");
});

test("unknown role is DENY, fail-closed, never throws past the policy boundary", () => {
  const decision = resolvePolicyDecision({ role: "attacker", capability: "READ" });
  assert.equal(decision.decision, "DENY");
  assert.match(decision.reason, /unknown role/);
});

test("'n/a' (human/EXECUTE) resolves to DENY, not a crash", () => {
  const decision = resolvePolicyDecision({ role: "human", capability: "EXECUTE" });
  assert.equal(decision.decision, "DENY");
});

test("'approves-step-up' (human/EXTERNAL_WRITE) resolves to ALLOW: the human grants step-up, is not gated by it", () => {
  const decision = resolvePolicyDecision({ role: "human", capability: "EXTERNAL_WRITE" });
  assert.equal(decision.decision, "ALLOW");
});

test("'step-up' (builder/EXTERNAL_WRITE) resolves to GATE, not a silent ALLOW or DENY", () => {
  const decision = resolvePolicyDecision({ role: "builder", capability: "EXTERNAL_WRITE" });
  assert.equal(decision.decision, "GATE");
  assert.match(decision.reason, /step-up/);
});

test("'scoped:worktree' (builder/MODIFY_LOCAL) is ALLOW only when the supplied scope matches exactly", () => {
  assert.equal(resolvePolicyDecision({ role: "builder", capability: "MODIFY_LOCAL", scope: "worktree" }).decision, "ALLOW");
  assert.equal(resolvePolicyDecision({ role: "builder", capability: "MODIFY_LOCAL", scope: "other" }).decision, "DENY");
  assert.equal(resolvePolicyDecision({ role: "builder", capability: "MODIFY_LOCAL" }).decision, "DENY");
});

test("'scoped:runs/<unit>/{spec,plan,tasks,decision}' (planner/MODIFY_LOCAL) matches the unit placeholder and brace alternation", () => {
  const allowed = resolvePolicyDecision({ role: "planner", capability: "MODIFY_LOCAL", scope: "runs/07-example/plan", unitId: "07-example" });
  assert.equal(allowed.decision, "ALLOW");
  const wrongUnit = resolvePolicyDecision({ role: "planner", capability: "MODIFY_LOCAL", scope: "runs/other-unit/plan", unitId: "07-example" });
  assert.equal(wrongUnit.decision, "DENY");
  const wrongLeaf = resolvePolicyDecision({ role: "planner", capability: "MODIFY_LOCAL", scope: "runs/07-example/not-a-leaf", unitId: "07-example" });
  assert.equal(wrongLeaf.decision, "DENY");
});

test("unknown capability throws rather than silently resolving (fail-closed on malformed input)", () => {
  assert.throws(() => resolvePolicyDecision({ role: "builder", capability: "NOT_A_REAL_CAPABILITY" }), /unknown capability/);
});

test("scopeMatches: abstract labels require exact match, path patterns support <unit> and {a,b}", () => {
  assert.equal(scopeMatches("worktree", "worktree"), true);
  assert.equal(scopeMatches("worktree", "worktree-ish"), false);
  assert.equal(scopeMatches("runs/<unit>/{spec,plan}", "runs/u1/spec", { unitId: "u1" }), true);
  assert.equal(scopeMatches("runs/<unit>/{spec,plan}", "runs/u1/tasks", { unitId: "u1" }), false);
  assert.equal(scopeMatches("worktree", ""), false);
});

test("a hand-authored malformed policy fails loudly instead of degrading into an open-by-default policy", () => {
  const dir = mkdtempSync(join(tmpdir(), "policy-test-"));
  const badPath = join(dir, "bad-security-policy.json");
  writeFileSync(badPath, JSON.stringify({ schemaVersion: 1, defaultDecision: "allow", roles: [], matrix: {} }), "utf8");
  assert.throws(() => loadSecurityPolicy(badPath), /defaultDecision must be "deny"/);
});
