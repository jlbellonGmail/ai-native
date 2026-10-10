// Gap 7: guard-develop-branch.yml may be retired only when the PROTECTION CONTRACT is demonstrated (ruleset-guard.mjs).
// The contract is the one AI-Native already enforces on its own branches (runtime/gates/ruleset.mjs `verifyRuleset`,
// governance/rulesets/main.json): active + branch target + a PRESENT and EMPTY bypass list + deletion, non_fast_forward
// and pull_request. Anything not demonstrated keeps the guard (fail closed).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classicProtectionOk, fetchBranchProtected, protectsBranchFromRulesets, satisfiesProtectionContract, PROTECTION_RULES } from "./ruleset-guard.mjs";

const here = new URL(".", import.meta.url);
const RULES = PROTECTION_RULES.map((type) => ({ type }));
const ruleset = (over = {}) => ({ id: 7, enforcement: "active", target: "branch", bypass_actors: [], conditions: { ref_name: { include: ["refs/heads/develop"], exclude: [] } }, rules: RULES, ...over });
const effective = (over = {}) => RULES.map((r) => ({ ...r, ruleset_id: 7, ruleset_source_type: "Repository", ...over }));

/** A fake `gh api` keyed by endpoint suffix; anything unlisted fails like a 404. */
const gh = (table) => (args) => {
  const path = args[1];
  for (const [needle, answer] of Object.entries(table)) {
    if (path.endsWith(needle)) return answer instanceof Error ? { error: answer, status: null, stdout: "", stderr: String(answer) } : { status: 0, stdout: JSON.stringify(answer), stderr: "" };
  }
  return { status: 1, stdout: "", stderr: "gh: Not Found (HTTP 404)" };
};
const live = (table) => fetchBranchProtected({ repo: "o/r", branch: "develop", run: gh(table) });

test("the contract is exactly the AI-Native one (verifyRuleset): same three rules, derived not invented", () => {
  const main = JSON.parse(readFileSync(new URL("../../governance/rulesets/main.json", here), "utf8"));
  assert.deepEqual(main.bypass_actors, [], "the AI-Native policy is no bypass actors");
  const types = main.rules.map((r) => r.type);
  for (const t of PROTECTION_RULES) assert.ok(types.includes(t), `${t} is part of the AI-Native ruleset`);
  const src = readFileSync(new URL("../gates/ruleset.mjs", here), "utf8");
  for (const t of PROTECTION_RULES) assert.ok(src.includes(`"${t}"`), `verifyRuleset checks ${t}`);
  // required_approving_review_count is 0 in the contract (single-maintainer model, F2): it must NOT be demanded here
  const pr = main.rules.find((r) => r.type === "pull_request");
  assert.equal(pr.parameters.required_approving_review_count, 0);
  assert.equal(satisfiesProtectionContract([{ type: "deletion" }, { type: "non_fast_forward" }, { type: "pull_request", parameters: { required_approving_review_count: 0 } }]), true);
});

test("satisfiesProtectionContract: all three rules are needed; checks or reviews alone are not enough; garbage is false", () => {
  assert.equal(satisfiesProtectionContract(RULES), true);
  for (const t of PROTECTION_RULES) assert.equal(satisfiesProtectionContract(RULES.filter((r) => r.type !== t)), false, `without ${t}`);
  assert.equal(satisfiesProtectionContract([{ type: "required_status_checks", parameters: { required_status_checks: [{ context: "ci" }] } }]), false);
  assert.equal(satisfiesProtectionContract([]), false);
  for (const bad of [null, undefined, {}, "pull_request", { type: "pull_request" }, [null], [{}]]) assert.equal(satisfiesProtectionContract(bad), false);
});

test("saved ruleset: bypass empty / present / missing / null; disabled; evaluate; other target; valid", () => {
  const p = (rs) => protectsBranchFromRulesets([rs], "develop");
  assert.equal(p(ruleset()), true, "valid, no bypass actors");
  assert.equal(p(ruleset({ bypass_actors: [] })), true, "empty bypass list");
  assert.equal(p(ruleset({ bypass_actors: [{ actor_id: 5, actor_type: "RepositoryRole", bypass_mode: "always" }] })), false, "bypass present");
  assert.equal(p(ruleset({ bypass_actors: [{ actor_id: 1, actor_type: "Team", bypass_mode: "pull_request" }] })), false, "even a pull_request-mode bypass is a bypass");
  const noList = ruleset(); delete noList.bypass_actors;
  assert.equal(p(noList), false, "bypass list missing = UNKNOWN, not empty");
  assert.equal(p(ruleset({ bypass_actors: null })), false, "null = unknown");
  assert.equal(p(ruleset({ bypass_actors: "none" })), false);
  assert.equal(p(ruleset({ enforcement: "disabled" })), false);
  assert.equal(p(ruleset({ enforcement: "evaluate" })), false);
  assert.equal(p(ruleset({ target: "tag" })), false);
  const noTarget = ruleset(); delete noTarget.target;
  assert.equal(p(noTarget), false, "target missing = unknown");
  assert.equal(p(ruleset({ rules: RULES.filter((r) => r.type !== "non_fast_forward") })), false, "force-push would be allowed");
  assert.equal(p(ruleset({ rules: RULES.filter((r) => r.type !== "pull_request") })), false, "direct pushes would be allowed");
  assert.equal(p(ruleset({ rules: RULES.filter((r) => r.type !== "deletion") })), false);
});

test("live: ruleset valid with an EMPTY bypass list is protected", () => {
  const r = live({ "/rules/branches/develop": effective(), "/rulesets/7": ruleset() });
  assert.equal(r.protected, true, JSON.stringify(r));
});

test("live: bypass present -> NOT protected; the reason names the bypass", () => {
  const r = live({ "/rules/branches/develop": effective(), "/rulesets/7": ruleset({ bypass_actors: [{ actor_id: 5, actor_type: "RepositoryRole", bypass_mode: "always" }] }) });
  assert.equal(r.protected, false);
  assert.match(r.reason, /bypass actors/);
});

test("live: bypass UNKNOWN (definition unreadable, list not exposed, organisation ruleset) -> NOT protected, never assumed empty", () => {
  const noList = ruleset(); delete noList.bypass_actors; // a token without admin rights gets the ruleset without the list
  for (const [name, table] of [
    ["definition returns 404", { "/rules/branches/develop": effective() }],
    ["definition has no bypass_actors field", { "/rules/branches/develop": effective(), "/rulesets/7": noList }],
    ["definition is not JSON", { "/rules/branches/develop": effective(), "/rulesets/7": new Error("boom") }],
    ["organisation ruleset", { "/rules/branches/develop": effective({ ruleset_source_type: "Organization" }), "/rulesets/7": ruleset() }],
    ["rule without ruleset_id", { "/rules/branches/develop": RULES }],
  ]) {
    const r = live(table);
    assert.equal(r.protected, false, name);
    assert.match(r.reason ?? "", /UNKNOWN|lack|no ruleset|could not/i, name);
  }
});

test("live: effective rules incomplete, ruleset disabled, no ruleset -> NOT protected", () => {
  assert.equal(live({ "/rules/branches/develop": effective().slice(0, 2), "/rulesets/7": ruleset() }).protected, false, "rules missing pull_request");
  assert.equal(live({ "/rules/branches/develop": effective(), "/rulesets/7": ruleset({ enforcement: "disabled" }) }).protected, false, "disabled");
  assert.equal(live({ "/rules/branches/develop": [] }).protected, false, "no ruleset applies");
});

test("live: when several rulesets contribute rules, EVERY one needs an empty bypass list", () => {
  const two = [...effective().slice(0, 2), { type: "pull_request", ruleset_id: 9, ruleset_source_type: "Repository" }];
  const good = { "/rules/branches/develop": two, "/rulesets/7": ruleset(), "/rulesets/9": ruleset({ id: 9 }) };
  assert.equal(live(good).protected, true);
  assert.equal(live({ ...good, "/rulesets/9": ruleset({ id: 9, bypass_actors: [{ actor_id: 1, actor_type: "Team", bypass_mode: "always" }] }) }).protected, false);
});

test("live: classic branch protection counts only when it equals the contract (reviews + no force-push + no deletion + admins enforced)", () => {
  const classic = { required_pull_request_reviews: { required_approving_review_count: 0 }, allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false }, enforce_admins: { enabled: true } };
  assert.equal(classicProtectionOk(classic), true);
  assert.equal(classicProtectionOk({ ...classic, enforce_admins: { enabled: false } }), false, "admins can bypass");
  assert.equal(classicProtectionOk({ ...classic, allow_force_pushes: { enabled: true } }), false);
  assert.equal(classicProtectionOk({ ...classic, allow_deletions: { enabled: true } }), false);
  const noReviews = { ...classic }; delete noReviews.required_pull_request_reviews;
  assert.equal(classicProtectionOk(noReviews), false);
  assert.equal(classicProtectionOk({ required_status_checks: { contexts: ["ci"] } }), false, "required checks alone do not stop a direct push");
  assert.equal(classicProtectionOk(null), false);
  assert.equal(live({ "/rules/branches/develop": [], "/branches/develop/protection": classic }).protected, true);
  assert.equal(live({ "/rules/branches/develop": [], "/branches/develop/protection": { ...classic, enforce_admins: { enabled: false } } }).protected, false);
});

test("live: gh failures are errors (the CLI then keeps the guard); invalid repo names are refused", () => {
  assert.ok(fetchBranchProtected({ repo: "o/r", branch: "develop", run: () => ({ status: 1, stdout: "", stderr: "HTTP 403" }) }).error);
  assert.ok(fetchBranchProtected({ repo: "o/r", branch: "develop", run: () => ({ status: 0, stdout: "not json", stderr: "" }) }).error);
  assert.ok(fetchBranchProtected({ repo: "../x", branch: "develop", run: () => ({ status: 0, stdout: "[]", stderr: "" }) }).error);
});
