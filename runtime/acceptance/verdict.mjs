// `analyze` step of the trusted acceptance-governance verdict path (spec 002 RF-25, RF-31; plan "Trusted verdict path").
// Runs from the TRUSTED platform checkout (main) and reads the candidate ONLY as Git objects of the exact head SHA:
// size-bounded, parsed as JSON/Markdown, never executed, imported, installed or checked out. It holds no secret and
// writes one schema-checked verdict JSON; a separate `publish` job (not here) posts it under the trust App identity.
//
// node runtime/acceptance/verdict.mjs --repo <dir> --base <sha> --head <sha> [--closure <artifact dir>] [--run <json>] --out <file>
import { execFileSync } from "node:child_process";
import { closeSync, existsSync, fstatSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { detectDowngrades } from "./downgrade.mjs";
import { canonical, sha256 } from "./evidence.mjs";
import { validateContract } from "./contract.mjs";
import { classifyFeature } from "./spec-acceptance.mjs";
import { parseStructured, evaluateObserved } from "./results-parser.mjs";
import { consolidate } from "./result.mjs";

const MAX_BYTES = 1024 * 1024;
const MAX_RAW = 8 * 1024 * 1024;
const SHA = /^[0-9a-f]{40}$/;
const SLUG = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/;
const RUNNER_ID = /^[a-z][a-z0-9-]{0,62}$/;
const CONTRACT = "acceptance/validation-contract.json";
const CUTOFF = "acceptance/legacy-cutoff.json";
// the only producing workflow whose artifact the closure accepts (002 RF-31)
export const CLOSURE_WORKFLOW = ".github/workflows/ci.yml";

function gitBlob(repo, sha, path) {
  try {
    const size = Number(execFileSync("git", ["cat-file", "-s", `${sha}:${path}`], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim());
    if (!Number.isFinite(size) || size > MAX_BYTES) return { tooLarge: true };
    return { text: execFileSync("git", ["cat-file", "blob", `${sha}:${path}`], { cwd: repo, encoding: "utf8", maxBuffer: MAX_BYTES + 1024, stdio: ["ignore", "pipe", "ignore"] }) };
  } catch {
    return { absent: true };
  }
}
const asJson = (b) => (b.text === undefined ? null : (() => { try { return JSON.parse(b.text); } catch { return { __invalid: true }; } })());
// one descriptor: the file that is size-checked is the file that is read (no check-then-read race)
const readBounded = (file, max) => {
  let fd;
  try { fd = openSync(file, "r"); } catch { return null; }
  try {
    const st = fstatSync(fd);
    if (!st.isFile() || st.size > max) return null;
    return readFileSync(fd, "utf8");
  } catch { return null; } finally { closeSync(fd); }
};

/**
 * 002 RF-31: the closure result of each changed REQUIRED feature, derived HERE (trusted code) from the raw
 * structured output the CI job produced, matched against the candidate plan and contract read as Git objects.
 * `run` = the producing run as read from the GitHub API by the workflow: { path, event, headSha, id, attempt }.
 */
export function deriveClosure({ repo, head, slugs, closureDir, run }) {
  const reasons = [];
  if (!run || run.path !== CLOSURE_WORKFLOW || run.event !== "pull_request" || run.headSha !== head) {
    return { status: "BLOCKED", reasons: ["the producing run is not the registered CI workflow for this pull_request head SHA"], features: [] };
  }
  const read = (p) => gitBlob(repo, head, p);
  const contract = asJson(read(CONTRACT));
  const cutoff = asJson(read(CUTOFF));
  const features = [];
  for (const slug of slugs) {
    if (!SLUG.test(slug)) { reasons.push("invalid feature slug"); continue; }
    const spec = read(`specs/${slug}/spec.md`);
    const cls = classifyFeature({ slug, specText: spec.text ?? "", legacySlugs: Array.isArray(cutoff?.slugs) ? cutoff.slugs : [] });
    if (cls.kind !== "REQUIRED") { features.push({ slug, classification: cls.kind, status: cls.kind === "LEGACY" ? "NOT_APPLICABLE" : "BLOCKED", reasons: cls.reasons }); continue; }
    const plan = asJson(read(`specs/${slug}/acceptance/plan.json`));
    const vc = contract && !contract.__invalid ? validateContract(contract) : { ok: false, errors: ["no valid validation contract at the head SHA"], runners: new Map() };
    if (!plan || plan.__invalid || !vc.ok) { features.push({ slug, classification: "REQUIRED", status: "BLOCKED", reasons: [...vc.errors.slice(0, 5), ...(!plan || plan.__invalid ? ["no valid acceptance plan at the head SHA"] : [])] }); continue; }
    const mandatory = (plan.cases ?? []).filter((c) => c.mandatory);
    const results = [];
    for (const runnerId of [...new Set(mandatory.map((c) => c.runner))].sort()) {
      const ids = mandatory.filter((c) => c.runner === runnerId).map((c) => c.id);
      const runner = vc.runners.get(runnerId);
      const meta = RUNNER_ID.test(runnerId) ? readBounded(join(closureDir, slug, `${runnerId}.json`), MAX_BYTES) : null;
      const raw = RUNNER_ID.test(runnerId) ? readBounded(join(closureDir, slug, `${runnerId}.out`), MAX_RAW) : null;
      let m = null;
      try { m = meta === null ? null : JSON.parse(meta); } catch { m = null; }
      if (!runner || m === null || raw === null) { for (const id of ids) results.push({ id, status: "BLOCKED", reason: "no raw structured output for this runner in the CI artifact" }); continue; }
      if (m.outputDigest !== (raw ? `sha256:${sha256(raw)}` : null)) { for (const id of ids) results.push({ id, status: "BLOCKED", reason: "raw output does not match its recorded digest" }); continue; }
      if (m.status !== "RAN") { for (const id of ids) results.push({ id, status: "BLOCKED", reason: `runner did not run: ${(m.reasons ?? [])[0] ?? m.status}` }); continue; }
      const parsed = parseStructured(runner.format, raw);
      const ev = evaluateObserved({ expectedIds: ids, observed: parsed.cases, parseErrors: parsed.errors, minObserved: contract.minObservedCases, exitCode: Number.isInteger(m.exitCode) ? m.exitCode : 1 });
      for (const id of ids) results.push({ id, status: ev.perCase[id] ?? ev.status, reason: ev.reasons[0] });
    }
    const c = consolidate(results);
    features.push({ slug, classification: "REQUIRED", status: c.status, reasons: c.reasons.slice(0, 10) });
  }
  const worst = features.some((f) => f.status === "FAIL") ? "FAIL" : features.some((f) => f.status !== "PASS" && f.status !== "NOT_APPLICABLE") ? "BLOCKED" : "PASS";
  return { status: reasons.length ? "BLOCKED" : worst, reasons, features, runId: run.id, runAttempt: run.attempt ?? null };
}

/** @returns verdict { schemaVersion, headSha, baseSha, status: PASS|NEEDS_HUMAN|BLOCKED|FAIL, findings, reasons, closure } */
export function analyze({ repo, base, head, closureDir = null, run = null }) {
  const reasons = [];
  if (!SHA.test(String(base)) || !SHA.test(String(head))) return { schemaVersion: 1, headSha: head ?? null, baseSha: base ?? null, status: "BLOCKED", findings: [], reasons: ["base and head must be full commit SHAs"] };
  const changed = execFileSync("git", ["diff", "--name-only", "--no-renames", base, head], { cwd: repo, encoding: "utf8" }).split("\n").filter(Boolean);
  const slugs = [...new Set(changed.map((p) => /^specs\/([^/]+)\/(spec\.md|acceptance\/plan\.json)$/.exec(p)?.[1]).filter(Boolean))].sort();
  const featureSlugs = [...new Set(changed.map((p) => /^specs\/([^/]+)\//.exec(p)?.[1]).filter(Boolean))].sort();
  const read = (sha, p) => gitBlob(repo, sha, p);
  const findings = [];
  const specSlugs = (sha) => { try { return execFileSync("git", ["ls-tree", "-d", "--name-only", `${sha}:specs`], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").filter(Boolean).map((p) => p.replace(/^specs\//, "")); } catch { return []; } };
  const shared = (sha) => ({ contract: asJson(read(sha, CONTRACT)), cutoff: asJson(read(sha, CUTOFF)), specSlugs: specSlugs(sha) });
  for (const p of [CONTRACT, CUTOFF]) if (read(head, p).tooLarge) reasons.push(`${p} exceeds the size bound`);
  const b0 = shared(base);
  const h0 = shared(head);
  if (h0.contract?.__invalid || h0.cutoff?.__invalid) reasons.push("candidate acceptance governance data is not valid JSON");
  findings.push(...detectDowngrades({ ...b0, plan: null, specText: null }, { ...h0, plan: null, specText: null }).findings);
  for (const slug of slugs) {
    const pb = read(base, `specs/${slug}/acceptance/plan.json`);
    const ph = read(head, `specs/${slug}/acceptance/plan.json`);
    const sb = read(base, `specs/${slug}/spec.md`);
    const sh = read(head, `specs/${slug}/spec.md`);
    if (ph.tooLarge || sh.tooLarge) { reasons.push(`specs/${slug} acceptance data exceeds the size bound`); continue; }
    if (asJson(ph)?.__invalid) reasons.push(`specs/${slug}/acceptance/plan.json is not valid JSON`);
    const own = detectDowngrades({ contract: null, cutoff: null, plan: asJson(pb), specText: sb.text ?? null }, { contract: null, cutoff: null, plan: asJson(ph), specText: sh.text ?? null }).findings;
    findings.push(...own.map((f) => ({ ...f, slug })));
  }
  // merge closure: without the CI artifact of this exact head, a changed feature's acceptance is BLOCKED (RF-31)
  const closure = closureDir && existsSync(closureDir)
    ? deriveClosure({ repo, head, slugs: featureSlugs, closureDir, run })
    : { status: featureSlugs.length ? "BLOCKED" : "PASS", reasons: featureSlugs.length ? ["no CI closure artifact for this head SHA"] : [], features: [] };
  let status;
  if (reasons.length || closure.status === "BLOCKED") status = "BLOCKED";
  else if (closure.status === "FAIL") status = "FAIL";
  else status = findings.length ? "NEEDS_HUMAN" : "PASS";
  return { schemaVersion: 1, headSha: head, baseSha: base, status, findings, reasons: [...reasons, ...closure.reasons], closure, digest: sha256(canonical({ findings, closure: closure.features })) };
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  const a = process.argv.slice(2);
  const v = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  let run = null;
  try { run = v("--run") ? JSON.parse(v("--run")) : null; } catch { run = null; }
  const verdict = analyze({ repo: resolve(v("--repo") ?? "."), base: v("--base"), head: v("--head"), closureDir: v("--closure") ? resolve(v("--closure")) : null, run });
  const text = `${JSON.stringify(verdict, null, 2)}\n`;
  if (v("--out")) writeFileSync(v("--out"), text); else process.stdout.write(text);
  process.exit(verdict.status === "BLOCKED" ? 1 : 0);
}
