// Scripted E2E observations on the disposable consumer the Builder produced. Real platform commands only.
import { spawnSync, execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const C = process.argv[2];
const OUT = process.argv[3];
// usage: node v4.1.0-e2e-observe.mjs <consumer-dir> <log.json> <platform-root>
const PLATFORM = process.argv[4];
const SLUG = "001-word-count";
const log = [];
const ai = (...args) => {
  const r = spawnSync(process.execPath, [".ai-native/ai-native.mjs", ...args], { cwd: C, encoding: "utf8" });
  const text = `${r.stdout}${r.stderr}`.trim();
  log.push({ cmd: `node .ai-native/ai-native.mjs ${args.join(" ")}`, exit: r.status, out: text.split("\n").slice(0, 18).join("\n") });
  return { exit: r.status, text };
};
const git = (...a) => execFileSync("git", a, { cwd: C, encoding: "utf8" }).trim();
const note = (title) => log.push({ section: title });
const src = join(C, "src/word-count.mjs");
const GOOD = readFileSync(src, "utf8");

note("0. Revision under test");
log.push({ cmd: "git log --oneline -1", exit: 0, out: git("log", "--oneline", "-1") });

note("1. Acceptance of the Builder's revision (case PASS, feature BLOCKED by the pending N/A)");
ai("sdd", "acceptance", "run", SLUG, "--base", "main");

note("2. Seeded real defect: words split on a single space only");
writeFileSync(src, GOOD.replace("split(/\\s+/)", 'split(" ")'));
const failed = ai("sdd", "acceptance", "run", SLUG, "--base", "main");

note("3. FAIL prevents closing: the platform-owned stage of implement-all and the review status");
const { implementAll } = await import(pathToFileURL(join(PLATFORM, "runtime/circuit/implement-all.mjs")).href);
const tasks = [{ id: "T1", title: "x", state: "pending", requirements: ["RF-1"], doneWhen: "x" }];
const agents = { implement: async () => {}, test: async () => ({ passed: true }), accept: async () => ({ accepted: true }), fullSuite: async () => ({ passed: true }), selfReview: async () => ({ verdict: "APPROVED", findings: [] }), fix: async () => {} };
const runFail = await implementAll({ tasks, ...agents, feature: { project: C, slug: SLUG, base: "main" } });
log.push({ cmd: "implementAll({ feature }) with the defect", exit: null, out: `status=${runFail.status} acceptance=${runFail.acceptance.status} completed=${runFail.completed.join(",")} finalReviewStatus=${runFail.outcome?.finalReviewStatus}` });
ai("sdd", "review", "status", SLUG, "--base", "main");

note("4. Fix restores PASS for every case");
writeFileSync(src, GOOD);
ai("sdd", "acceptance", "run", SLUG, "--base", "main");
const runFixed = await implementAll({ tasks, ...agents, feature: { project: C, slug: SLUG, base: "main" } });
log.push({ cmd: "implementAll({ feature }) after the fix", exit: null, out: `status=${runFixed.status} acceptance=${runFixed.acceptance.status} pending=${(runFixed.acceptance.pending ?? []).join(",")} completed=${runFixed.completed.join(",")}` });

note("5. Trivial validation refused");
ai("sdd", "review", "validate", SLUG, "--base", "main", "--command", "node -e 0");
ai("sdd", "review", "status", SLUG, "--base", "main");
const contractFile = join(C, "acceptance/validation-contract.json");
const contractText = readFileSync(contractFile, "utf8");
const c = JSON.parse(contractText);
c.runners[0].argv = ["-e", "0"];
writeFileSync(contractFile, JSON.stringify(c, null, 2));
ai("sdd", "acceptance", "run", SLUG, "--base", "main");
writeFileSync(contractFile, contractText);

note("6. Silent DOWNGRADE against a BASE that already has the feature");
git("branch", "-f", "e2e-base", "HEAD");
const planFile = join(C, `specs/${SLUG}/acceptance/plan.json`);
const planText = readFileSync(planFile, "utf8");
const plan = JSON.parse(planText);
plan.cases = plan.cases.filter((k) => k.id !== "C-3");
writeFileSync(planFile, JSON.stringify(plan, null, 2));
ai("hitl", "--base", "e2e-base");
ai("sdd", "acceptance", "status", SLUG, "--base", "e2e-base");
git("-c", "user.email=e2e@example.invalid", "-c", "user.name=e2e", "commit", "-qam", "drop C-3 (silent downgrade attempt)");
const head = git("rev-parse", "HEAD");
const base = git("rev-parse", "e2e-base");
const v = spawnSync(process.execPath, [join(PLATFORM, "runtime/acceptance/verdict.mjs"), "--repo", C, "--base", base, "--head", head], { encoding: "utf8" });
log.push({ cmd: "node runtime/acceptance/verdict.mjs --base <e2e-base> --head <downgrade commit>", exit: v.status, out: v.stdout.trim().slice(0, 900) });
git("reset", "-q", "--hard", "e2e-base");
git("branch", "-D", "e2e-base");

note("7. Manual, evidence and traceability");
ai("sdd", "acceptance", "manual", SLUG);
const st = ai("sdd", "acceptance", "status", SLUG, "--base", "main", "--json");
const gitDir = execFileSync("git", ["rev-parse", "--git-common-dir"], { cwd: C, encoding: "utf8" }).trim();
const ledger = join(C, gitDir, "ai-native/acceptance", SLUG, "ledger.jsonl");
const trace = join(C, gitDir, "ai-native/acceptance", SLUG, "traceability.json");
const lines = readFileSync(ledger, "utf8").trim().split("\n");
const last = JSON.parse(lines.at(-1));
log.push({ cmd: "ledger (git common dir)", exit: null, out: `${lines.length} hash-chained entries; last: seq=${last.seq} scenario=${last.scenarioId} result=${last.result} sourceRevision=${last.sourceRevision} fingerprint=${last.inputFingerprint} kind=${last.executionKind} isolation=${last.isolation.tier}/isolated=${last.isolation.isolated}` });
const t = JSON.parse(readFileSync(trace, "utf8"));
log.push({ cmd: "traceability.json", exit: null, out: `complete=${t.complete} rows=${t.rows.length} gate=${JSON.stringify(t.gateDecision).slice(0, 300)}\nrow[0]=${JSON.stringify(t.rows[0]).slice(0, 500)}` });
const manual = readFileSync(join(C, `specs/${SLUG}/acceptance/MANUAL.md`), "utf8");
log.push({ cmd: "MANUAL.md", exit: null, out: `${manual.split("\n").length} lines; sections: ${[...manual.matchAll(/^##+ (.+)$/gm)].map((m) => m[1]).join(" | ")}` });

note("8. Independent review and HITL as the circuit reports them");
ai("hitl", "--base", "main");
ai("sdd", "review", "status", SLUG, "--base", "main");

writeFileSync(OUT, JSON.stringify(log, null, 2));
console.log(`observations: ${log.length}; seeded defect -> ${/ACCEPTANCE: FAIL/.test(failed.text) ? "FAIL" : "NOT FAIL"}`);
