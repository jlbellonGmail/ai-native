#!/usr/bin/env node
// L3 consumer gate (M5; plan SS13.2 "L3 consumidor": deterministic, PASS required for the
// merge of a bump/migration PR). Runs the checks a CONSUMER repo needs, from the platform
// code that is pinned by its lock:
//   lock         ai-native.lock.json valid                         (else NOT_ADOPTED -> FAIL)
//   bootstrap    status READY for the pinned release (sync done by the caller, offline here)
//   integrity    STATUS/git integrity of the consumer (NOT_APPLICABLE if it keeps no STATUS.md)
//   circuit      deterministic dry-run: ASSESS over the PR's changed paths -> depth
//   p45          touched runs/**/events.jsonl: chain, append-only vs base, runtime-made review ids,
//                review-gate for the strictest depth
//   adoption     if an adoption journal exists, every journaled file still matches its hash
//   product      the profile's productTestCommand if set, else NOT_APPLICABLE (never a silent pass)
// Read-only except for running the product test command the consumer itself declares.
//   node runtime/consumer/l3.mjs --project <dir> --cache <dir> [--base <ref>] [--require-base] [--json] [--out <file>]
// --require-base is what the PR workflow passes: with no resolvable base the circuit and p45 checks FAIL
// instead of degrading to NOT_APPLICABLE (a gate must not fail open when its context is missing).
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readLock, status as bootstrapStatus } from "../bootstrap/install.mjs";
import { checkIntegrity } from "../status/integrity.mjs";
import { assess } from "../circuit/assess.mjs";
import { changedFiles, readFromCommit } from "../gates/control-plane.mjs";
import { checkReviewIndependence } from "../gates/reviewer-independence.mjs";
import { JOURNAL_PATH } from "../migrate/adopt.mjs";
import { statusFromCounts, exitCodeFor, formatLine } from "../lib/result.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PLATFORM_ROOT = join(here, "..", "..");
const sha = (buf) => `sha256:${createHash("sha256").update(buf).digest("hex")}`;

function check(id, status, detail = "", extra = {}) {
  return { id, status, detail, ...extra };
}

export function runL3({ project, cache, base = null, requireBase = false, platformRoot = PLATFORM_ROOT, run = spawnSync }) {
  const checks = [];
  const { lock, errors: lockErrors } = readLock(project);
  if (lockErrors.length) {
    checks.push(check("lock", "FAIL", lockErrors.join("; ")));
    return finish(checks, {});
  }
  checks.push(check("lock", "PASS", `${lock.platform.version} ${lock.platform.commit.slice(0, 7)}`));

  const boot = bootstrapStatus({ projectRoot: project, cacheRoot: cache, offline: true });
  checks.push(boot.state === "READY" ? check("bootstrap", "PASS", `READY ${boot.detail}`) : check("bootstrap", "FAIL", `${boot.state}: ${boot.detail}`));

  const integrity = checkIntegrity(project);
  checks.push(
    integrity.status === "NOT_APPLICABLE"
      ? check("integrity", "NOT_APPLICABLE", "no STATUS.md in this consumer")
      : check("integrity", integrity.status === "FAIL" ? "FAIL" : "PASS", [...integrity.errors, ...integrity.warnings].join("; ")),
  );

  let changed = [];
  let depth = null;
  if (!base && requireBase) checks.push(check("circuit", "FAIL", "a base ref is required (PR gate) and none was resolved: the change cannot be assessed"));
  if (base) {
    try {
      changed = changedFiles(project, base, "HEAD");
    } catch (error) {
      checks.push(check("circuit", "FAIL", `cannot diff against base '${base}': ${error.message}`));
    }
  }
  if (!checks.some((c) => c.id === "circuit")) {
    if (changed.length) {
      const a = assess(changed);
      depth = a.depth;
      checks.push(check("circuit", "PASS", `ASSESS(${changed.length} changed path(s)) -> ${a.depth} (score ${a.score}, risk ${a.risk})`, { depth: a.depth }));
    } else {
      checks.push(check("circuit", "NOT_APPLICABLE", base ? "no changes against base" : "no --base given"));
    }
  }

  if (base) {
    const findings = checkReviewIndependence(changed, (p) => readFromCommit(project, base, p), (p) => readFromCommit(project, "HEAD", p));
    checks.push(findings.length ? check("p45", "FAIL", findings.map((f) => `[${f.code}] ${f.path}`).join("; ")) : check("p45", changed.some((p) => /^runs\/.+\/events\.jsonl$/.test(p)) ? "PASS" : "NOT_APPLICABLE", "events.jsonl review-gate"));
  } else {
    checks.push(requireBase ? check("p45", "FAIL", "a base ref is required (PR gate): events.jsonl cannot be checked against base") : check("p45", "NOT_APPLICABLE", "no --base given"));
  }

  const journalPath = join(project, JOURNAL_PATH);
  if (existsSync(journalPath)) {
    const journal = JSON.parse(readFileSync(journalPath, "utf8"));
    const drift = Object.entries(journal.created).filter(([rel, hash]) => !existsSync(join(project, rel)) || sha(readFileSync(join(project, rel))) !== hash).map(([rel]) => rel);
    checks.push(drift.length ? check("adoption", "WARN", `${drift.length} adopted file(s) changed or missing since adoption: ${drift.slice(0, 5).join(", ")}`) : check("adoption", "PASS", `${Object.keys(journal.created).length} adopted file(s) intact`));
  } else {
    checks.push(check("adoption", "NOT_APPLICABLE", "no adoption journal"));
  }

  // the profile (hence the product test command) is the BASE lock's when the base has one: a PR must not
  // switch itself to a profile with no test command to turn `product` into NOT_APPLICABLE
  const baseLockText = base ? readFromCommit(project, base, "ai-native.lock.json") : null;
  let profileLock = lock;
  if (baseLockText !== null) {
    try {
      profileLock = JSON.parse(baseLockText);
    } catch {
      checks.push(check("product", "FAIL", "the lock on the base branch is not valid JSON"));
    }
  }
  if (!checks.some((c) => c.id === "product")) checks.push(productTests({ project, lock: profileLock, platformRoot, run }));
  return finish(checks, { depth, changed: changed.length });
}

export function productTests({ project, lock, platformRoot, run }) {
  const profileId = lock.profiles?.[0];
  if (!profileId) return check("product", "FAIL", "lock declares no profile");
  const profilePath = join(platformRoot, "profiles", `${profileId}.json`);
  if (!existsSync(profilePath)) return check("product", "FAIL", `profile '${profileId}' not found in the pinned platform`);
  const profile = JSON.parse(readFileSync(profilePath, "utf8"));
  const command = profile.productTestCommand;
  if (!command) return check("product", "NOT_APPLICABLE", "profile declares no productTestCommand");
  // monorepo/subdir: the directory comes from the lock (base branch, schema-validated), never from the consumer PR
  let cwd = project;
  if (lock.productDir !== undefined) {
    if (typeof lock.productDir !== "string") return check("product", "FAIL", "productDir must be a string");
    cwd = resolve(project, lock.productDir);
    const rel = relative(project, cwd);
    if (!/^[A-Za-z0-9_][A-Za-z0-9_.\/-]*$/.test(lock.productDir) || rel.startsWith("..") || isAbsolute(rel) || !existsSync(cwd)) return check("product", "FAIL", `productDir '${lock.productDir}' is invalid or missing`);
  }
  // The setup command comes from the pinned platform profile (like the test command), never from the consumer PR.
  if (profile.productSetupCommand) {
    const s = run(profile.productSetupCommand, { cwd, shell: true, encoding: "utf8", timeout: 10 * 60 * 1000, maxBuffer: 32 * 1024 * 1024 });
    if (s.status !== 0) return check("product", "FAIL", `setup \`${profile.productSetupCommand}\` exit ${s.status ?? s.signal}: dependencies could not be installed, tests not run`);
  }
  const r = run(command, { cwd, shell: true, encoding: "utf8", timeout: 10 * 60 * 1000, maxBuffer: 32 * 1024 * 1024 });
  return r.status === 0 ? check("product", "PASS", `\`${command}\` exit 0`) : check("product", "FAIL", `\`${command}\` exit ${r.status ?? r.signal}`);
}

function finish(checks, data) {
  const errors = checks.filter((c) => c.status === "FAIL").length;
  const warnings = checks.filter((c) => c.status === "WARN").length;
  return { status: statusFromCounts({ errors, warnings }), checks, ...data };
}

function main() {
  const argv = process.argv.slice(2);
  const value = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
  const project = resolve(value("--project") ?? process.cwd());
  const cacheArg = value("--cache") ?? process.env.AI_NATIVE_CACHE;
  if (!cacheArg) {
    console.error("l3: --cache <dir> (or AI_NATIVE_CACHE) is required");
    process.exit(2);
  }
  const cache = resolve(cacheArg);
  const report = runL3({ project, cache, base: value("--base"), requireBase: argv.includes("--require-base") });
  const out = value("--out");
  if (out) writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  if (argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else {
    for (const c of report.checks) console.log(`${c.status.padEnd(14)} ${c.id.padEnd(10)} ${c.detail}`);
    console.log(formatLine(report.status, { errors: report.checks.filter((c) => c.status === "FAIL").length, warnings: report.checks.filter((c) => c.status === "WARN").length }));
  }
  process.exitCode = exitCodeFor(report.status);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
