import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyze, CLOSURE_WORKFLOW } from "./verdict.mjs";
import { closureRun } from "./ci-closure.mjs";
import { makeConsumer, git, put, SLUG, GOOD_SRC } from "./acceptance.fixture.mjs";

const commitAll = (dir, msg) => { git(dir, "add", "-A"); git(dir, "commit", "-qm", msg); return git(dir, "rev-parse", "HEAD"); };
const runOf = (head, over = {}) => ({ path: CLOSURE_WORKFLOW, event: "pull_request", headSha: head, id: 1, attempt: 1, ...over });

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
    assert.ok(v.findings.some((f) => f.kind === "MANDATORY_LOWERED"));
    assert.equal(v.headSha, head);
    // a changed feature without the CI closure artifact of this head is never PASS (002 RF-31)
    assert.equal(v.status, "BLOCKED");
    assert.match(v.reasons.join(), /no CI closure artifact/);
    // the working tree is irrelevant: only the head SHA's objects are read
    put(dir, `specs/${SLUG}/acceptance/plan.json`, "{ broken");
    assert.ok(analyze({ repo: dir, base, head }).findings.some((f) => f.kind === "MANDATORY_LOWERED"));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("no governance change and no feature change is PASS; malformed SHAs and invalid candidate data are BLOCKED", () => {
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

test("002 RF-31: the closure is derived by trusted code from the CI raw output; FAIL, tampering and a foreign run never pass", async () => {
  const dir = makeConsumer({ buggy: true });
  const out = mkdtempSync(join(tmpdir(), "closure-"));
  try {
    const base = git(dir, "rev-parse", "main");
    const head = commitAll(dir, "feature with a seeded defect");
    await closureRun({ project: dir, base: "main", outDir: out });
    const failed = analyze({ repo: dir, base, head, closureDir: out, run: runOf(head) });
    assert.equal(failed.closure.features[0].status, "FAIL");
    assert.equal(failed.status, "FAIL");

    put(dir, "src/slugify.mjs", GOOD_SRC);
    const fixedHead = commitAll(dir, "fix");
    const out2 = mkdtempSync(join(tmpdir(), "closure-"));
    await closureRun({ project: dir, base: "main", outDir: out2 });
    const ok = analyze({ repo: dir, base, head: fixedHead, closureDir: out2, run: runOf(fixedHead) });
    assert.equal(ok.closure.features[0].status, "PASS", JSON.stringify(ok.closure));
    // a new contract is a governance finding: the human still decides, the closure itself passed
    assert.equal(ok.status, "NEEDS_HUMAN");

    // another workflow, another event or another SHA is never the producing run
    for (const run of [runOf(fixedHead, { path: ".github/workflows/evil.yml" }), runOf(fixedHead, { event: "push" }), runOf(head)]) {
      assert.equal(analyze({ repo: dir, base, head: fixedHead, closureDir: out2, run }).status, "BLOCKED");
    }
    // raw output edited after the run (digest mismatch) or a forged all-ok TAP with the wrong digest: BLOCKED
    const rawFile = join(out2, SLUG, "unit.out");
    writeFileSync(rawFile, readFileSync(rawFile, "utf8").replace("not ok", "ok"));
    writeFileSync(rawFile, `${readFileSync(rawFile, "utf8")}\n`);
    assert.equal(analyze({ repo: dir, base, head: fixedHead, closureDir: out2, run: runOf(fixedHead) }).status, "BLOCKED");
    rmSync(out2, { recursive: true, force: true });
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test("independent re-review N5: candidate-changed closure producer, a forged tier or an invalid plan never close acceptance", async () => {
  const dir = makeConsumer();
  const out = mkdtempSync(join(tmpdir(), "closure-"));
  try {
    const base = git(dir, "rev-parse", "main");
    const head = commitAll(dir, "feature");
    await closureRun({ project: dir, base: "main", outDir: out });
    assert.equal(analyze({ repo: dir, base, head, closureDir: out, run: runOf(head) }).closure.features[0].status, "PASS");

    // the recorded tier is metadata written by the candidate job: it must equal the contract's tier
    const metaFile = join(out, SLUG, "unit.json");
    const meta = JSON.parse(readFileSync(metaFile, "utf8"));
    writeFileSync(metaFile, JSON.stringify({ ...meta, tier: "container" }));
    const forged = analyze({ repo: dir, base, head, closureDir: out, run: runOf(head) });
    assert.equal(forged.closure.features[0].status, "BLOCKED");
    assert.match(JSON.stringify(forged.closure), /recorded isolation tier differs/);
    writeFileSync(metaFile, JSON.stringify(meta));

    // the plan is re-judged by the analyzer: dropping a criterion the spec declares is BLOCKED with the old artifact
    const planFile = join(dir, `specs/${SLUG}/acceptance/plan.json`);
    const plan = JSON.parse(readFileSync(planFile, "utf8"));
    plan.criteria = plan.criteria.slice(1);
    put(dir, `specs/${SLUG}/acceptance/plan.json`, JSON.stringify(plan));
    const badPlan = commitAll(dir, "plan drops a criterion");
    const judged = analyze({ repo: dir, base, head: badPlan, closureDir: out, run: runOf(badPlan) });
    assert.equal(judged.status, "BLOCKED");
    assert.match(JSON.stringify(judged.closure), /plan: /);

    // a candidate that changes the closure producer (ci-closure.mjs or its imports, or ci.yml) cannot close
    git(dir, "reset", "-q", "--hard", head);
    put(dir, "runtime/acceptance/ci-closure.mjs", "// candidate producer that writes an all-pass artifact\n");
    const evil = commitAll(dir, "rewrite the producer");
    const v = analyze({ repo: dir, base, head: evil, closureDir: out, run: runOf(evil) });
    assert.equal(v.status, "BLOCKED");
    assert.match(v.reasons.join(), /closure producer differs from BASE \(runtime\/acceptance\/ci-closure\.mjs/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test("002 RF-32 at merge: a criterion with only passing cases is BLOCKED by the trusted closure (seeded-failure history is not verifiable)", async () => {
  const dir = makeConsumer();
  const out = mkdtempSync(join(tmpdir(), "closure-"));
  try {
    const base = git(dir, "rev-parse", "main");
    // AC-2's rejection cases now claim a seeded-failure run instead: valid locally, not at merge
    const planFile = join(dir, `specs/${SLUG}/acceptance/plan.json`);
    const plan = JSON.parse(readFileSync(planFile, "utf8"));
    for (const k of plan.cases) if (k.ac.includes("AC-2")) { k.expected = "pass"; k.seededFailure = { note: "run recorded locally" }; }
    put(dir, `specs/${SLUG}/acceptance/plan.json`, JSON.stringify(plan));
    const head = commitAll(dir, "AC-2 without a rejection-expecting case");
    await closureRun({ project: dir, base: "main", outDir: out });
    const v = analyze({ repo: dir, base, head, closureDir: out, run: runOf(head) });
    assert.equal(v.closure.features[0].status, "BLOCKED");
    assert.match(JSON.stringify(v.closure), /RF-32: AC-2 has no rejection-expecting mandatory case/);
    assert.doesNotMatch(JSON.stringify(v.closure), /RF-32: AC-1/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});
