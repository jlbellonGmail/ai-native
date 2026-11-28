// Evidence: input fingerprint, append-only hash-chained ledger, staleness and
// changed-path coverage (spec 002 RF-5, RF-6, RF-7, RF-11, RF-17, RF-18,
// RF-28, RF-30, RF-31). Local evidence is circuit evidence only; merge closure
// needs the trusted CI verdict (RF-31, pending mechanism).
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { inNonSutClass, globToRegExp } from "./contract.mjs";

export const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const SECRET_NAME = /(SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|CREDENTIAL|API_?KEY)/i;

/** Canonical JSON: recursively sorted keys, arrays in given order. */
export function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
}

/**
 * Input fingerprint (RF-11): only scenario-relevant, declared inputs. sourceRevision,
 * timestamps, report paths and captured output are NOT part of it.
 * @returns {{ ok:true, fingerprint } | { ok:false, status:"BLOCKED", reasons }}
 */
export function inputFingerprint({ schemaVersion = 1, moduleId = null, scenarioId, providerIds = [], consumerIds = [], contractRefs = [], manifestDigest = null, runnerDigest, caseDigest, executableDigest, argv, inputDigests = {}, executionKind, environment, envDeclared = [], envValues = {}, configDigests = {} }) {
  const reasons = [];
  // RF-17/18: environment variables are fingerprinted by NAME; a value only when the name is non-secret AND explicitly allowed
  const envEntries = {};
  for (const name of [...envDeclared].sort()) {
    if (SECRET_NAME.test(name)) { reasons.push(`environment dependency ${name} is secret-like and cannot be fingerprinted without exposing it`); continue; }
    envEntries[name] = Object.hasOwn(envValues, name) ? `value:${sha256(String(envValues[name]))}` : "name-only";
  }
  for (const [name, d] of Object.entries(configDigests)) if (typeof d !== "string" || !/^[0-9a-f]{64}$/.test(d)) reasons.push(`critical configuration ${name} cannot be read or verified`);
  for (const [p, d] of Object.entries(inputDigests)) if (typeof d !== "string" || !/^[0-9a-f]{64}$/.test(d)) reasons.push(`declared input ${p} is unreadable`);
  if (reasons.length) return { ok: false, status: "BLOCKED", reasons: reasons.sort() };
  const body = { schemaVersion, moduleId, scenarioId, providerIds: [...providerIds].sort(), consumerIds: [...consumerIds].sort(), contractRefs, manifestDigest, runnerDigest, caseDigest, executableDigest, argv, inputDigests, executionKind, environment: { ...environment, env: envEntries }, configDigests };
  return { ok: true, fingerprint: `sha256:${sha256(canonical(body))}` };
}

/** A fingerprint that differs makes evidence STALE; never a silent reuse (RF-6). */
export const freshness = (recorded, current) => (recorded === current ? "CURRENT" : "STALE");

// ---- ledger ------------------------------------------------------------------
export function gitCommonDir(project) {
  return resolve(project, execFileSync("git", ["rev-parse", "--git-common-dir"], { cwd: project, encoding: "utf8" }).trim());
}
export const ledgerDir = (project, slug) => join(gitCommonDir(project), "ai-native", "acceptance", slug);
const ledgerFile = (project, slug) => join(ledgerDir(project, slug), "ledger.jsonl");
const entryHash = (e) => sha256(canonical({ ...e, hash: undefined }));
const GENESIS = "0".repeat(64);

/** Reads and verifies the chain. @returns {{ ok, entries, errors }} an unverifiable chain is BLOCKED. */
export function readLedger(project, slug) {
  const file = ledgerFile(project, slug);
  if (!existsSync(file)) return { ok: true, entries: [], errors: [] };
  const entries = [];
  const errors = [];
  let prev = GENESIS;
  const lines = readFileSync(file, "utf8").split("\n");
  if (lines.at(-1) !== "") errors.push("ledger is truncated (no terminating newline)");
  lines.filter((l) => l.trim()).forEach((l, i) => {
    let e;
    try { e = JSON.parse(l); } catch { errors.push(`ledger line ${i + 1}: invalid JSON`); return; }
    if (e.seq !== i) errors.push(`ledger line ${i + 1}: sequence broken`);
    if (e.prev !== prev) errors.push(`ledger line ${i + 1}: chain broken`);
    if (e.hash !== entryHash(e)) errors.push(`ledger line ${i + 1}: digest mismatch (edited)`);
    prev = e.hash;
    entries.push(e);
  });
  return { ok: errors.length === 0, entries, errors };
}

/** Appends one platform-runner entry. Only the platform runner calls this (RF-31). */
export function appendEvidence(project, slug, record) {
  const cur = readLedger(project, slug);
  if (!cur.ok) throw new Error(`acceptance ledger does not verify: ${cur.errors[0]}`);
  const dir = ledgerDir(project, slug);
  mkdirSync(dir, { recursive: true });
  const base = { schemaVersion: 1, seq: cur.entries.length, prev: cur.entries.at(-1)?.hash ?? GENESIS, ...record };
  const entry = { ...base, hash: entryHash(base) };
  appendFileSync(ledgerFile(project, slug), `${JSON.stringify(entry)}\n`);
  return entry;
}

/**
 * The status of a scenario for closure: the latest ledger entry for it must
 * carry the evaluated sourceRevision (RF-30); another revision is STALE, none is
 * NOT_RUN, a broken chain is BLOCKED. A worktree report is never consulted.
 */
export function closureStatus(project, slug, { scenarioId, evaluatedRevision, currentFingerprint = null }) {
  const led = readLedger(project, slug);
  if (!led.ok) return { status: "BLOCKED", reasons: led.errors };
  const mine = led.entries.filter((e) => e.scenarioId === scenarioId);
  if (!mine.length) return { status: "NOT_RUN", reasons: [`no ledger entry for ${scenarioId}`] };
  const atRev = mine.filter((e) => e.sourceRevision === evaluatedRevision);
  if (!atRev.length) return { status: "STALE", reasons: [`latest evidence is for another revision`], entry: mine.at(-1) };
  const e = atRev.at(-1);
  if (currentFingerprint && e.inputFingerprint !== currentFingerprint) return { status: "STALE", reasons: ["input fingerprint changed"], entry: e };
  return { status: e.result, reasons: e.reasons ?? [], entry: e };
}

/**
 * Cross-acceptance reuse (RF-30): limited to obligations of consumers NOT affected by the change,
 * and only when the fingerprint is byte-identical. Never used for feature closure of the evaluated revision.
 */
export function reusableForUnaffected(entry, currentFingerprint, { affected }) {
  return !affected && entry?.result === "PASS" && entry.inputFingerprint === currentFingerprint;
}

/** RF-30/RF-34: every changed feature path must be a case input, or in the validated non-SUT class. */
/** Is `path` one of `sutPaths` (file, directory prefix or glob)? */
export function coveredBy(sutPaths, path) {
  return (sutPaths ?? []).some((g) => {
    if (typeof g !== "string" || !g) return false;
    if (globToRegExp(g.endsWith("/") ? `${g}**` : g).test(path)) return true;
    return !/[*?]/.test(g) && path.startsWith(g.endsWith("/") ? g : `${g}/`);
  });
}

/**
 * Features whose acceptance a change touches although it edits no file under `specs/<slug>/` (review finding:
 * a code-only change selected nothing and passed): every plan, at BASE or at the head, whose cases declare a
 * changed path among their inputs. BASE plans count so a candidate cannot dodge selection by editing its plan.
 * @param plans [{ slug, plan }] (both revisions; duplicates allowed)
 */
export function featuresCoveringChanges(plans, changedPaths) {
  const out = new Set();
  for (const { slug, plan, contract } of plans) {
    const sut = planInputs(plan, contract);
    if (changedPaths.some((p) => coveredBy(sut, p))) out.add(slug);
  }
  return [...out].sort();
}

/**
 * Every repository input of a plan's cases: their SUT paths plus, for the runners they use, the argv paths (the
 * test scripts) and the declared configuration files (fourth review: a rewritten test script or a changed config
 * file must re-select the feature, as they already count as case inputs for the fingerprint).
 */
export function planInputs(plan, contract) {
  const cases = Array.isArray(plan?.cases) ? plan.cases : [];
  const inputs = cases.flatMap((k) => (Array.isArray(k?.sutPaths) ? k.sutPaths : []));
  const used = new Set(cases.map((k) => k?.runner));
  for (const r of Array.isArray(contract?.runners) ? contract.runners : []) {
    if (!used.has(r?.id)) continue;
    const cwd = typeof r.cwd === "string" && r.cwd !== "." ? `${r.cwd.replace(/\/$/, "")}/` : "";
    for (const a of Array.isArray(r.argv) ? r.argv : []) if (typeof a === "string" && !a.startsWith("-") && /[./]/.test(a) && !a.includes("{resultFile}")) inputs.push(`${cwd}${a}`.replace(/^\.\//, ""));
    for (const c of Array.isArray(r.configFiles) ? r.configFiles : []) if (typeof c === "string") inputs.push(c);
  }
  return inputs;
}

export function uncoveredPaths({ changedPaths, cases, contract, ledgerPaths = [] }) {
  const patterns = cases.flatMap((c) => c.sutPaths).map((g) => globToRegExp(g.endsWith("/") ? `${g}**` : g));
  const dirPrefixes = cases.flatMap((c) => c.sutPaths).filter((p) => !/[*?]/.test(p)).map((p) => (p.endsWith("/") ? p : `${p}/`));
  return changedPaths
    .filter((p) => !ledgerPaths.includes(p))
    .filter((p) => !patterns.some((re) => re.test(p)) && !dirPrefixes.some((d) => p.startsWith(d)))
    .filter((p) => !inNonSutClass(contract, p))
    .sort();
}
