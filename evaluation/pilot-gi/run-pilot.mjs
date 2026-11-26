#!/usr/bin/env node
// Executes the GI reference pilot (spec 003 RF-6, RF-14 to RF-17; T5) on a DISPOSABLE copy of gi-common-reference
// prepared by .github/workflows/acceptance-pilot.yml (clone at the pinned SHA, origin removed, venv from GI's own
// constraints, pinned PostgreSQL image). The overlay feature is committed only inside that copy. The platform's
// own acceptance stage runs twice (two independent pytest sessions, each with a fresh PostgreSQL container); the
// pilot passes only if both runs PASS with identical per-case results and the evidence classes are honest.
//
// node evaluation/pilot-gi/run-pilot.mjs --gi <copy> --sha <pinned sha> --image <pinned image> --out <evidence.json>
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { runFeatureAcceptance } from "../../runtime/acceptance/feature.mjs";
import { validateContract } from "../../runtime/acceptance/contract.mjs";
import { GI_SHA, PG_IMAGE, SLUG, overlayFiles, overlayPlan, overlayContract, labelErrors } from "./pilot.mjs";

const a = process.argv.slice(2);
const v = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
const gi = resolve(v("--gi") ?? "");
const out = resolve(v("--out") ?? "pilot-evidence.json");
const git = (...args) => execFileSync("git", args, { cwd: gi, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const fail = (msg, evidence = {}) => { writeFileSync(out, `${JSON.stringify({ status: "BLOCKED", reason: msg, ...evidence }, null, 2)}\n`); console.error(`PILOT: BLOCKED: ${msg}`); process.exit(1); };
const log = (s) => console.log(`${new Date().toISOString()} ${s}`);

// 1. the copy is the pinned source, detached from any remote (it can never push)
if (!existsSync(join(gi, ".git"))) fail("no disposable GI copy");
const head = git("rev-parse", "HEAD");
if (head !== GI_SHA || v("--sha") !== GI_SHA) fail(`GI copy is at ${head}, the pinned source is ${GI_SHA}`);
if (git("remote")) fail("the disposable copy still has a remote: refusing to work in it");
if (v("--image") !== PG_IMAGE) fail("the PostgreSQL image is not the pinned digest");
const untrackedBefore = git("status", "--porcelain", "--untracked-files=all");
if (untrackedBefore) fail(`the copy is not clean before the overlay (environment artifacts must be ignored):\n${untrackedBefore.slice(0, 2000)}`);

// 2. overlay feature committed on a branch of the copy; `main` is the pinned source (the BASE)
const plan = overlayPlan();
const contract = overlayContract();
const vc = validateContract(contract);
if (!vc.ok) fail(`overlay contract invalid: ${vc.errors.join("; ")}`);
const labels = labelErrors(plan);
if (labels.length) fail(`evidence classes are not honest: ${labels.join("; ")}`);
if (existsSync(join(gi, "acceptance", "validation-contract.json"))) fail("the GI copy already has a validation contract: the pilot would overwrite it");
git("config", "user.email", "pilot@example.invalid");
git("config", "user.name", "ai-native acceptance pilot");
git("branch", "-f", "main", "HEAD");
git("checkout", "-q", "-b", "pilot/acceptance");
const files = { ...overlayFiles(), [`specs/${SLUG}/acceptance/plan.json`]: `${JSON.stringify(plan, null, 2)}\n`, "acceptance/validation-contract.json": `${JSON.stringify(contract, null, 2)}\n` };
for (const [p, text] of Object.entries(files)) { mkdirSync(dirname(join(gi, p)), { recursive: true }); writeFileSync(join(gi, p), text); }
git("add", "-A");
git("commit", "-qm", "ai-native v4.1.0 acceptance pilot overlay (disposable copy only)");
log(`overlay committed in the disposable copy: ${git("rev-parse", "HEAD")} on top of ${GI_SHA}`);

// 3. two independent runs of the platform-owned stage (each: new pytest session, new PostgreSQL container)
const runs = [];
for (const n of [1, 2]) {
  log(`run ${n}: platform acceptance stage (real PostgreSQL)`);
  const r = await runFeatureAcceptance(gi, SLUG, { base: "main" });
  runs.push({ run: n, status: r.status, revision: r.revision, reasons: (r.reasons ?? []).slice(0, 10), cases: (r.cases ?? []).map((c) => ({ id: c.id, status: c.status })).sort((x, y) => (x.id < y.id ? -1 : 1)) });
  log(`run ${n}: ACCEPTANCE ${r.status}`);
  for (const c of runs.at(-1).cases) console.log(`  ${c.status.padEnd(8)} ${c.id}`);
  for (const reason of runs.at(-1).reasons) console.log(`  reason: ${reason}`);
  if (r.status === "BLOCKED" && n === 1) diagnose();
}

/** Diagnostic only (never evidence): the same command outside the governed runner, output tails printed. */
function diagnose() {
  const runner = contract.runners[0];
  const env = Object.fromEntries(runner.env.filter((k) => process.env[k] !== undefined).map((k) => [k, process.env[k]]));
  const d = spawnSync(join(gi, runner.executable), runner.argv, { cwd: gi, env, encoding: "utf8", timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
  console.log(`DIAGNOSTIC (not evidence): exit ${d.status} signal ${d.signal} error ${d.error?.code ?? "none"}`);
  console.log(`--- stdout tail\n${String(d.stdout ?? "").slice(-3000)}\n--- stderr tail\n${String(d.stderr ?? "").slice(-3000)}\n---`);
}
const same = JSON.stringify(runs[0].cases) === JSON.stringify(runs[1].cases) && runs[0].revision === runs[1].revision;
let imageDigest = null;
try { imageDigest = execFileSync("docker", ["image", "inspect", "postgres:16-alpine", "--format", "{{json .RepoDigests}}"], { encoding: "utf8" }).trim(); } catch { imageDigest = null; }
const pinnedOk = Boolean(imageDigest && imageDigest.includes(PG_IMAGE.split("@")[1]));
const evidence = {
  schemaVersion: 1,
  source: { repo: "jlbellonGmail/gi-common-reference", sha: GI_SHA, copy: "disposable clone, origin removed, overlay committed only in the copy" },
  postgres: { image: PG_IMAGE, observedRepoDigests: imageDigest, pinned: pinnedOk },
  runner: { tier: "restricted", isolated: false, note: "the pilot proves database behavior; its runner tier is labelled not isolated" },
  classes: {
    "real-integration": plan.cases.filter((k) => k.executionKind === "real-integration").map((k) => k.id),
    simulated: plan.cases.filter((k) => k.executionKind === "simulated").map((k) => k.id),
    httpSocketE2E: [],
    note: "API checks use FastAPI TestClient in-process against real PostgreSQL; none is HTTP-socket end-to-end",
  },
  runs,
  repeatable: same,
};
const ok = runs.every((r) => r.status === "PASS") && same && pinnedOk;
evidence.status = ok ? "PASS" : runs.some((r) => r.status === "FAIL") ? "FAIL" : "BLOCKED";
writeFileSync(out, `${JSON.stringify(evidence, null, 2)}\n`);
const summary = `PILOT: ${evidence.status} (runs ${runs.map((r) => r.status).join(", ")}; repeatable ${same}; image pinned ${pinnedOk})`;
console.log(summary);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### GI reference pilot\n\n${summary}\n`);
process.exit(ok ? 0 : 1);
