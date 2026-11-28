// Consumer L3 acceptance (spec 002 RF-25/RF-31/RF-35 in consumers; 003 plan "consumer CI acceptance closure job").
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { boundVerdict, consumerAcceptanceDecision } from "./acceptance-gate.mjs";
import { analyze } from "../acceptance/verdict.mjs";
import { closureRun } from "../acceptance/ci-closure.mjs";
import { makeConsumer, git, put, SLUG, GOOD_SRC } from "../acceptance/acceptance.fixture.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const HEAD = "a".repeat(40);
const v = (status, over = {}) => ({ schemaVersion: 1, headSha: HEAD, status, reasons: [], findings: [], ...over });
// the consumer's caller workflow (its own file, calling the reusable l3-consumer.yml) is the registered producer
const CALLER = ".github/workflows/l3.yml";
const CALLER_TEXT = "on: { pull_request: { branches: [main] } }\njobs:\n  l3:\n    permissions: { contents: read, actions: read }\n    uses: jlbellonGmail/ai-native/.github/workflows/l3-consumer.yml@0000000000000000000000000000000000000000\n";

test("decision: PASS passes; FAIL, BLOCKED, unknown, other SHA and no verdict never do", () => {
  assert.equal(consumerAcceptanceDecision({ verdict: v("PASS"), headSha: HEAD }).ok, true);
  for (const [verdict, status] of [[v("FAIL"), "FAIL"], [v("BLOCKED"), "BLOCKED"], [v("X"), "BLOCKED"], [v("PASS", { headSha: "b".repeat(40) }), "BLOCKED"], [null, "BLOCKED"], [v("PASS", { schemaVersion: 2 }), "BLOCKED"]]) {
    const d = consumerAcceptanceDecision({ verdict, headSha: HEAD, humanResult: "success", environment: "acceptance-human-review" });
    assert.equal(d.ok, false, JSON.stringify(verdict));
    assert.equal(d.status, status);
  }
});

const APPROVED = [{ state: "approved", environments: [{ name: "acceptance-human-review" }], user: { login: "maintainer", id: 9, type: "User" }, comment: "ok" }];
const human = { environment: "acceptance-human-review", humanResult: "success", approvals: APPROVED, reviewers: ["maintainer"], author: "contributor" };

test("decision: NEEDS_HUMAN needs a recorded approval of the consumer-owned Environment by a pinned human (third review R3)", () => {
  const n = v("NEEDS_HUMAN", { findings: [{ kind: "CONTRACT_CREATED", detail: "validation contract created" }] });
  assert.equal(consumerAcceptanceDecision({ verdict: n, headSha: HEAD }).status, "BLOCKED");
  assert.equal(consumerAcceptanceDecision({ verdict: n, headSha: HEAD, ...human, humanResult: "skipped" }).status, "NEEDS_HUMAN");
  assert.equal(consumerAcceptanceDecision({ verdict: n, headSha: HEAD, ...human, humanResult: "failure" }).ok, false);
  const ok = consumerAcceptanceDecision({ verdict: n, headSha: HEAD, ...human });
  assert.equal(ok.ok, true);
  assert.equal(ok.status, "APPROVED");
  assert.match(ok.lines.join("\n"), /CONTRACT_CREATED/);
  // a job "success" without an approval record (an auto-created Environment with no reviewers) never approves
  for (const [over, re] of [
    [{ approvals: [] }, /no approval record/],
    [{ approvals: null }, /no approval record/],
    [{ reviewers: [] }, /no pinned human reviewer/],
    [{ approvals: [{ ...APPROVED[0], user: { login: "someone-else", type: "User" } }] }, /not a pinned reviewer/],
    [{ approvals: [{ ...APPROVED[0], user: { login: "maintainer", type: "Bot" } }] }, /not a proven human user/],
    [{ approvals: [{ ...APPROVED[0], user: { login: "maintainer" } }] }, /not a proven human user \(type missing\)/],
    [{ author: "maintainer" }, /is the PR author/],
    [{ approvals: [{ ...APPROVED[0], environments: [{ name: "other" }] }] }, /no approval record/],
    [{ approvals: [{ ...APPROVED[0], state: "rejected" }] }, /no approval record/],
  ]) {
    const d = consumerAcceptanceDecision({ verdict: n, headSha: HEAD, ...human, ...over });
    assert.equal(d.ok, false, JSON.stringify(over));
    assert.match(d.title, re, JSON.stringify(over));
  }
});

function consumerPr({ buggy = false } = {}) {
  const dir = makeConsumer({ buggy });
  // the consumer's BASE already has the caller workflow and the feature's contract (so only real changes are findings)
  git(dir, "stash", "push", "-q", "-u");
  git(dir, "checkout", "-q", "main");
  put(dir, CALLER, CALLER_TEXT);
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "consumer CI");
  git(dir, "checkout", "-q", "feature/001-slugify");
  git(dir, "merge", "-q", "--no-edit", "main");
  git(dir, "stash", "pop", "-q");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "feature with acceptance");
  return dir;
}

async function l3(dir, base) {
  const head = git(dir, "rev-parse", "HEAD");
  const out = mkdtempSync(join(tmpdir(), "l3-closure-"));
  // job acceptance-closure: platform from the BASE lock, the consumer head checked out fresh, candidate tests run
  const r = await closureRun({ project: dir, base: "main", outDir: out, log: () => {} });
  // job acceptance-analyze: no product test, candidate as Git objects, verdict bound to this run and caller file
  const verdict = analyze({ repo: dir, base, head, closureDir: out, closureLog: r.anchors.join("\n"), closureWorkflow: CALLER, run: { path: CALLER, event: "pull_request", headSha: head, id: 7, attempt: 1 } });
  rmSync(out, { recursive: true, force: true });
  return { head, verdict };
}

test("consumer PR end to end: a seeded defect FAILs, the fix passes the closure, governance findings wait for the human", async () => {
  const dir = consumerPr({ buggy: true });
  try {
    const base = git(dir, "rev-parse", "main");
    const failed = await l3(dir, base);
    assert.equal(failed.verdict.closure.features[0].status, "FAIL", JSON.stringify(failed.verdict.closure));
    assert.equal(consumerAcceptanceDecision({ verdict: failed.verdict, headSha: failed.head, environment: "acceptance-human-review", humanResult: "success" }).ok, false);

    put(dir, "src/slugify.mjs", GOOD_SRC);
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "fix");
    const fixed = await l3(dir, base);
    assert.equal(fixed.verdict.closure.features[0].status, "PASS", JSON.stringify(fixed.verdict.closure));
    // the contract is new in this PR: a governance finding the consumer's human decides
    assert.equal(fixed.verdict.status, "NEEDS_HUMAN");
    assert.equal(consumerAcceptanceDecision({ verdict: fixed.verdict, headSha: fixed.head }).ok, false);
    assert.equal(consumerAcceptanceDecision({ verdict: fixed.verdict, headSha: fixed.head, ...human }).ok, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("consumer PR that edits its own caller workflow: CLOSURE_PRODUCER_CHANGED, never PASS; only a pinned human clears it", async () => {
  const dir = consumerPr();
  try {
    const base = git(dir, "rev-parse", "main");
    put(dir, CALLER, `${CALLER_TEXT}# a candidate edit of the caller workflow\n`);
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "edit the caller");
    const { head, verdict } = await l3(dir, base);
    assert.equal(verdict.status, "NEEDS_HUMAN");
    assert.ok(verdict.findings.some((f) => f.kind === "CLOSURE_PRODUCER_CHANGED" && /^\.github\/workflows\/l3\.yml differs from BASE/.test(f.detail)), JSON.stringify(verdict.findings));
    assert.equal(consumerAcceptanceDecision({ verdict, headSha: head, environment: "acceptance-human-review", humanResult: "success" }).ok, false);
    assert.equal(consumerAcceptanceDecision({ verdict, headSha: head, ...human }).ok, true);
    assert.equal(readFileSync(join(dir, CALLER), "utf8").includes("candidate edit"), true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// CodeQL #58 review: the l3 and acceptance-closure jobs run candidate code in the same run as the decision, so
// candidate code can upload an artifact named acceptance-verdict before acceptance-analyze does. The decision trusts
// the artifact only when its bytes hash to the analyze job's output.
test("decision: a verdict artifact is trusted only if it hashes to the acceptance-analyze output (forged PASS is BLOCKED)", () => {
  const real = Buffer.from(JSON.stringify(v("FAIL")));
  const forged = Buffer.from(JSON.stringify(v("PASS")));
  const digest = createHash("sha256").update(real).digest("hex");
  const decide = (bytes, sha) => { const b = boundVerdict(bytes, sha); return consumerAcceptanceDecision({ verdict: b.verdict, verdictError: b.error, headSha: HEAD }); };
  const swapped = decide(forged, digest);
  assert.equal(swapped.ok, false);
  assert.equal(swapped.status, "BLOCKED");
  assert.match(swapped.title, /is not the one the acceptance-analyze job produced/);
  for (const sha of ["", undefined, "abc", digest.toUpperCase()]) {
    const d = decide(forged, sha);
    assert.equal(d.status, "BLOCKED", String(sha));
    assert.match(d.title, /no verdict digest/);
  }
  assert.match(decide(null, digest).title, /no acceptance verdict artifact/);
  assert.equal(decide(real, digest).status, "FAIL", "the bound verdict decides as before");
  const pass = Buffer.from(JSON.stringify(v("PASS")));
  assert.equal(decide(pass, createHash("sha256").update(pass).digest("hex")).ok, true);
});

test("CLI: a forged verdict file with the analyze digest of another verdict exits 1 BLOCKED; no --verdict-sha256 exits 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "acc-gate-"));
  try {
    const file = join(dir, "verdict.json");
    const pass = JSON.stringify(v("PASS"));
    writeFileSync(file, pass);
    const cli = (extra) => spawnSync(process.execPath, [join(repoRoot, "runtime", "consumer", "acceptance-gate.mjs"), "--verdict", file, "--head", HEAD, ...extra], { encoding: "utf8", env: { ...process.env, GITHUB_STEP_SUMMARY: "" } });
    const other = createHash("sha256").update(JSON.stringify(v("FAIL"))).digest("hex");
    for (const extra of [["--verdict-sha256", other], []]) {
      const r = cli(extra);
      assert.equal(r.status, 1, r.stdout + r.stderr);
      assert.match(r.stdout, /ACCEPTANCE_BLOCKED/);
    }
    const ok = cli(["--verdict-sha256", createHash("sha256").update(pass).digest("hex")]);
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.match(ok.stdout, /ACCEPTANCE_PASS/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("l3-consumer.yml binds the verdict artifact to the acceptance-analyze digest output", () => {
  const yml = readFileSync(join(repoRoot, ".github", "workflows", "l3-consumer.yml"), "utf8").replaceAll("\r\n", "\n");
  const analyze = yml.slice(yml.indexOf("\n  acceptance-analyze:\n"), yml.indexOf("\n  acceptance-human:\n"));
  const governance = yml.slice(yml.indexOf("\n  acceptance-governance:\n"));
  assert.match(analyze, /\n      verdict_sha256: \$\{\{ steps\.verdict\.outputs\.verdict_sha256 \}\}\n/);
  // the digest is taken after the fallback rewrite, i.e. of the exact file that is uploaded
  const fallback = analyze.indexOf("analyzer produced no verdict");
  const hashed = analyze.indexOf('echo "verdict_sha256=$(sha256sum verdict.json | cut -d\' \' -f1)" >> "$GITHUB_OUTPUT"');
  assert.ok(fallback > 0 && hashed > fallback, "verdict_sha256 is computed from the final verdict.json");
  assert.ok(analyze.indexOf("path: verdict.json") > hashed, "and before it is uploaded");
  assert.match(governance, /VERDICT_SHA256: \$\{\{ needs\.acceptance-analyze\.outputs\.verdict_sha256 \}\}/);
  assert.match(governance, /acceptance-gate\.mjs --verdict acceptance-verdict\/verdict\.json --verdict-sha256 "\$VERDICT_SHA256" /);
});
