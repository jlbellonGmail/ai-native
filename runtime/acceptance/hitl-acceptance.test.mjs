import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { checkHumanGate } from "../policy/hitl.mjs";
import { makeConsumer, git, put, SLUG } from "./fixture.mjs";

const changed = (dir) => [...new Set([...git(dir, "diff", "--name-only", "main").split("\n"), ...git(dir, "ls-files", "--others", "--exclude-standard").split("\n")].filter(Boolean))];

test("a silent DOWNGRADE forces human_gate required even when the spec declares none (002 RF-25, AC-4)", () => {
  const dir = makeConsumer();
  try {
    // BASE carries the feature, its plan and contract
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "feature");
    git(dir, "branch", "-f", "main", "HEAD");
    // candidate: drop a case and lower a mandatory flag, and ask for no human gate
    const planFile = join(dir, `specs/${SLUG}/acceptance/plan.json`);
    const plan = JSON.parse(readFileSync(planFile, "utf8"));
    plan.cases = plan.cases.filter((c) => c.id !== "slug-trims-edges");
    put(dir, `specs/${SLUG}/acceptance/plan.json`, JSON.stringify(plan, null, 2));
    put(dir, `specs/${SLUG}/spec.md`, readFileSync(join(dir, `specs/${SLUG}/spec.md`), "utf8").replace("human_gate: required", "human_gate: none\nautonomy: full"));
    const r = checkHumanGate({ project: dir, changedPaths: changed(dir), base: "main", allowNone: true, controlPlanePatterns: [] });
    const unit = r.units.find((u) => u.unit === `specs/${SLUG}/spec.md`);
    assert.equal(unit.gate, "required");
    assert.ok(unit.reasons.some((x) => /acceptanceGovernance/.test(x)));
    assert.ok(unit.reasons.some((x) => /CASE_REMOVED_OR_RENAMED slug-trims-edges/.test(x)), JSON.stringify(unit.reasons));
    assert.ok(unit.acceptanceFindings.length >= 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("no acceptance governance change: the gate is not forced by acceptance", () => {
  const dir = makeConsumer();
  try {
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "feature");
    git(dir, "branch", "-f", "main", "HEAD");
    put(dir, "src/slugify.mjs", readFileSync(join(dir, "src/slugify.mjs"), "utf8") + "// refactor\n");
    const r = checkHumanGate({ project: dir, changedPaths: changed(dir), base: "main", controlPlanePatterns: [] });
    assert.ok(r.units.every((u) => !(u.reasons ?? []).some((x) => /acceptance governance/.test(x))));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("creating the validation contract is a finding (requires the human gate)", () => {
  const dir = makeConsumer();
  try {
    const r = checkHumanGate({ project: dir, changedPaths: changed(dir), base: "main", controlPlanePatterns: [] });
    assert.ok(r.units.some((u) => (u.acceptanceFindings ?? []).some((f) => f.kind === "CONTRACT_CREATED")));
    assert.ok(r.units.every((u) => u.gate === "required"));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
