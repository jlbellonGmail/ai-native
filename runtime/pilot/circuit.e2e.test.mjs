// M5.2: the full circuit on a from-scratch repo, for every SDD level and both
// Work Unit modes, through the real runtime modules (no mocks): start unit ->
// ASSESS (depth chosen by the changed paths, never forced) -> state machine ->
// evidence contract -> runtime-created review runs (P45) -> verify (tree SHA)
// -> converge -> ready -> trace -> STATUS/ROADMAP/runs -> review-gate in CI.
// The runtime has no circuit CLI in this release (modules only); this test is
// the end-to-end proof that the modules compose, not a CLI test.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { startWorkUnit } from "../circuit/start-unit.mjs";
import { assess } from "../circuit/assess.mjs";
import { appendEvent, readEvents, verifyChain } from "../circuit/events.mjs";
import { transition, deriveState } from "../circuit/state-machine.mjs";
import { getEvidenceContract } from "../circuit/contract.mjs";
import { assertEvidenceReady, markReadyForPr, NotReadyError } from "../circuit/ready.mjs";
import { createReviewRun } from "../circuit/review-run.mjs";
import { recordVerify, currentTreeSha, hasFreshPassingVerify } from "../circuit/verify.mjs";
import { recordConvergence } from "../circuit/converge.mjs";
import { recordTrace } from "../circuit/closure.mjs";
import { getWorkUnitInfo } from "../circuit/identity.mjs";
import { buildSnapshot } from "../status/snapshot.mjs";
import { checkEventLog, checkReviewGate } from "../gates/reviewer-independence.mjs";

const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();
const put = (root, rel, text) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text, "utf8");
};

function scratchRepo(roadmapItems) {
  const base = mkdtempSync(join(tmpdir(), "ai-native-circuit-"));
  const root = join(base, "repo");
  mkdirSync(root);
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.email", "t@example.invalid");
  git(root, "config", "user.name", "T");
  put(root, "ROADMAP.md", `# Roadmap\n\n${roadmapItems.map((i) => `- [ ] ${i} — item`).join("\n")}\n`);
  put(root, "README.md", "scratch\n");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "init");
  return { base, root };
}

const SUMMARY = (depth, mode) => `# Summary\n\nEstado: Done\nVersión: v0\nTipo: ${mode}\nSDD: ${depth}\nPR: n/a\nMerge: pending\n\n## Objetivo\n\nx\n\n## Resultado\n\nx\n\n## Cambios principales\n\nx\n\n## Validación\n\nx\n\n## Decisiones\n\nx\n\n## Incidencias\n\nx\n\n## Detalle\n\nx\n`;

// paths chosen so that the deterministic ASSESS lands on each level
const SCENARIOS = [
  { depth: "LIGHT", paths: ["README.md"] },
  { depth: "STANDARD", paths: ["runtime/a.mjs", "runtime/b.mjs", "core/x.md"] },
  { depth: "FULL", paths: [".github/workflows/x.yml", "contracts/a.json", "core/security-policy.json"] },
];
const MODES = [
  { mode: "Feature", slug: "01-login", items: [], roadmap: ["01-login"] },
  { mode: "Milestone", slug: "pilot", items: ["01-a", "02-b"], roadmap: ["01-a", "02-b"] },
];

function drive({ mode, slug, items, roadmap }, { depth, paths }) {
  const { base, root } = scratchRepo(roadmap);
  const worktreesRoot = join(base, "worktrees");
  const result = startWorkUnit(root, { mode, slug, items, baseBranch: "main", worktreesRoot });
  const info = getWorkUnitInfo(mode, slug);
  const worktree = result?.worktreeDir ?? join(worktreesRoot, slug);
  const runDir = join(worktree, info.runDir);
  const log = join(runDir, "events.jsonl");
  const unitId = slug;
  const step = (to) => transition(log, unitId, readEvents(log), to);

  // ASSESS is deterministic and decides the depth
  const a = assess(paths);
  assert.equal(a.depth, depth, `ASSESS(${paths.join(",")}) chose ${a.depth}`);
  appendEvent(log, unitId, "assess", { signals: a.signals, score: a.score, risk: a.risk, depth: a.depth, deterministic: true });
  step("ASSESSED");
  const contract = getEvidenceContract(depth);

  // not ready before the evidence exists (fail-closed)
  assert.throws(() => assertEvidenceReady(runDir, depth, readEvents(log)), NotReadyError);

  const builder = "builder-session-1";
  step("SPECIFIED");
  if (contract.requiredReviews.includes("spec")) {
    createReviewRun(log, unitId, { stage: "spec", verdict: "approved", tool: "claude", content: "spec.md", builderInvocationId: builder });
  }
  step("SPEC_REVIEWED");
  step("PLANNED");
  step("BUILDING");
  for (const f of contract.requiredArtifacts.filter((n) => n !== "SUMMARY.md")) put(worktree, `${info.runDir}/${f}`, `# ${f}\n\ncontent\n`);
  put(worktree, `${info.runDir}/SUMMARY.md`, SUMMARY(depth, mode));
  put(worktree, "feature.txt", "work\n");
  git(worktree, "add", "-A");
  git(worktree, "commit", "-q", "-m", `work ${depth}`);
  step("BUILT");

  recordVerify(log, unitId, { treeSha: currentTreeSha(worktree), command: "node --test", status: "PASS", exitCode: 0, testingProfile: "smoke" });
  assert.ok(hasFreshPassingVerify(readEvents(log), currentTreeSha(worktree)));
  step("VERIFIED");

  createReviewRun(log, unitId, { stage: "code", verdict: "approved", tool: "claude", content: "diff", builderInvocationId: builder });
  step("CODE_REVIEWED");
  recordConvergence(log, unitId, { depth, iteration: 1, reviewer: { verdict: "APPROVED", findings: [] }, tests: { status: "green" } });
  step("GATES_PASSED");

  assertEvidenceReady(runDir, depth, readEvents(log));
  const done = markReadyForPr(readFileSync(join(worktree, "ROADMAP.md"), "utf8"), mode === "Milestone" ? items : [slug]);
  writeFileSync(join(worktree, "ROADMAP.md"), done);
  step("READY_FOR_PR");
  step("PR_OPEN");
  step("CI_PENDING");
  step("AWAITING_HITL");
  recordTrace(log, unitId, { commit: git(worktree, "rev-parse", "HEAD"), prNumber: 1, prUrl: "https://example.invalid/pr/1" });

  verifyChain(log);
  return { base, root, worktree, runDir, log, events: readEvents(log), depth };
}

for (const m of MODES) {
  for (const s of SCENARIOS) {
    test(`circuit e2e: ${m.mode} / ${s.depth}`, () => {
      const u = drive(m, s);
      assert.equal(deriveState(u.events), "AWAITING_HITL");
      // review-gate (P45) accepts the legitimate unit and the log passes every CI check
      const text = readFileSync(u.log, "utf8");
      assert.deepEqual(checkEventLog("runs/x/events.jsonl", null, text), []);
      // required reviews match the level (spec review only for STANDARD/FULL)
      const stages = u.events.filter((e) => e.eventType === "review").map((e) => e.stage);
      assert.deepEqual(stages, getEvidenceContract(s.depth).requiredReviews);
      // every review was created by the runtime and bound to its input
      for (const e of u.events.filter((x) => x.eventType === "review")) {
        assert.match(e.reviewInvocationId, /^review-[0-9a-f]{32}$/);
        assert.match(e.inputDigest, /^sha256:/);
      }
      // ROADMAP closed in the PR branch, STATUS snapshot derived from git, runs/ present
      assert.match(readFileSync(join(u.worktree, "ROADMAP.md"), "utf8"), /- \[x\]/);
      assert.ok(existsSync(join(u.runDir, "SUMMARY.md")));
      const snap = buildSnapshot(u.worktree);
      assert.ok(snap.branch);
      // the exact same unit, with its code review removed, is blocked by the review-gate
      const noCode = u.events.filter((e) => !(e.eventType === "review" && e.stage === "code"));
      assert.ok(checkReviewGate("p", noCode).some((f) => f.code === "REVIEW_GATE_MISSING"));
      // ... and with a rejected code review
      const rejected = u.events.map((e) => (e.eventType === "review" && e.stage === "code" ? { ...e, verdict: "rejected" } : e));
      assert.ok(checkReviewGate("p", rejected).some((f) => f.code === "REVIEW_GATE_NOT_APPROVED"));
    });
  }
}

test("review-gate does not block a unit that has not reached a post-review state", () => {
  const events = [{ eventType: "assess", depth: "FULL" }, { eventType: "transition", toState: "BUILDING" }];
  assert.deepEqual(checkReviewGate("p", events), []);
});

test("a Builder cannot reach the post-review states with a forged reviewInvocationId (CI catches it)", () => {
  const u = drive(MODES[0], SCENARIOS[1]);
  const tampered = readFileSync(u.log, "utf8").replace(/review-[0-9a-f]{32}/, "builder-wrote-this");
  const codes = checkEventLog("runs/x/events.jsonl", null, tampered).map((f) => f.code);
  assert.ok(codes.includes("CHAIN_BROKEN") || codes.includes("REVIEW_ID_INVALID"), codes.join(","));
});

test("review-gate fails closed: no assess, and a depth downgrade, on a post-review unit", () => {
  const post = [{ eventType: "transition", toState: "GATES_PASSED" }];
  assert.ok(checkReviewGate("p", post).some((f) => f.code === "REVIEW_GATE_NO_ASSESS"));
  const approved = (stage) => ({ eventType: "review", stage, verdict: "approved" });
  // FULL assessed first, then a Builder appends a LIGHT assess and only a code review exists
  const downgraded = [
    { eventType: "assess", depth: "FULL" },
    { eventType: "assess", depth: "LIGHT" },
    approved("code"),
    { eventType: "transition", toState: "GATES_PASSED" },
  ];
  const codes = checkReviewGate("p", downgraded).map((f) => f.code);
  assert.ok(codes.includes("REVIEW_GATE_DEPTH_DOWNGRADE"));
  assert.ok(codes.includes("REVIEW_GATE_MISSING"), "the spec review of the strictest depth is still required");
  // the same unit, honestly assessed once and fully reviewed, passes
  const honest = [{ eventType: "assess", depth: "FULL" }, approved("spec"), approved("code"), { eventType: "transition", toState: "GATES_PASSED" }];
  assert.deepEqual(checkReviewGate("p", honest), []);
});
