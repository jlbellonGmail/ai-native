import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { analyze } from "./verdict.mjs";
import { makeConsumer, git, put, SLUG } from "./fixture.mjs";

const commitAll = (dir, msg) => { git(dir, "add", "-A"); git(dir, "commit", "-qm", msg); return git(dir, "rev-parse", "HEAD"); };

test("analyze reads the candidate as Git objects; a candidate that rewrites the detector still gets the trusted verdict", () => {
  const dir = makeConsumer();
  try {
    const base = commitAll(dir, "feature with acceptance");
    // candidate: weaken the plan AND ship a "detector" that would always pass if it were executed
    const plan = JSON.parse(readFileSync(join(dir, `specs/${SLUG}/acceptance/plan.json`), "utf8"));
    plan.cases[0].mandatory = false;
    put(dir, `specs/${SLUG}/acceptance/plan.json`, JSON.stringify(plan));
    put(dir, "runtime/acceptance/downgrade.mjs", "export const detectDowngrades = () => ({ findings: [] });\n");
    put(dir, "runtime/policy/hitl.mjs", "export const x = 1;\n");
    put(dir, ".github/workflows/acceptance-governance.yml", "on: push\n");
    const head = commitAll(dir, "silent downgrade");
    const v = analyze({ repo: dir, base, head });
    assert.equal(v.status, "NEEDS_HUMAN");
    assert.ok(v.findings.some((f) => f.kind === "MANDATORY_LOWERED"));
    assert.equal(v.headSha, head);
    // the working tree is irrelevant: only the head SHA's objects are read
    put(dir, `specs/${SLUG}/acceptance/plan.json`, "{ broken");
    assert.equal(analyze({ repo: dir, base, head }).status, "NEEDS_HUMAN");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("no governance change is PASS; malformed SHAs and invalid candidate data are BLOCKED", () => {
  const dir = makeConsumer();
  try {
    const base = commitAll(dir, "base feature");
    put(dir, "src/slugify.mjs", `${readFileSync(join(dir, "src/slugify.mjs"), "utf8")}// refactor\n`);
    const head = commitAll(dir, "refactor");
    assert.equal(analyze({ repo: dir, base, head }).status, "PASS");
    assert.equal(analyze({ repo: dir, base: "main", head }).status, "BLOCKED");
    put(dir, "acceptance/validation-contract.json", "{ not json");
    const bad = commitAll(dir, "broken contract");
    assert.equal(analyze({ repo: dir, base, head: bad }).status, "BLOCKED");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
