#!/usr/bin/env node
// M4.1 bootstrap CLI: node runtime/bootstrap/cli.mjs <command> [options]
//   init     --bundle <file> --repo github:o/r --profile <id>... [--mcp-profile <id>...] [--force]
//   sync     [--from-file <bundle>] [--revocations <file>] [--offline] [--require-attestation]
//            Without --from-file the pinned release is downloaded from the
//            lock's GitHub Releases (digest-checked against the lock before
//            caching; sigstore provenance via `gh attestation verify`).
//            Revocations come from the repo's releases unless --offline.
//   run      [-- <args for the release>]
//   rollback [--force]
//   status   [--offline] [--revocations <file>] [--check]   READY|NEEDS_SYNC|DEGRADED_READONLY|REVOKED|NOT_ADOPTED
//   doctor
// Common: --project <dir> (default cwd), --cache <dir> (default $AI_NATIVE_CACHE
// or ~/.ai-native/cache), --json.
import { readFileSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { init, sync, run, rollback, doctor, status as bootstrapStatus, readLock } from "./install.mjs";
import { defaultCacheRoot, verifyRelease } from "./cache.mjs";
import { downloadRelease, fetchRevocations } from "./remote.mjs";
import { renderOutput, exitCodeForReport, buildReport } from "../lib/json.mjs";

const argv = process.argv.slice(2);
const command = argv.shift();
const rest = argv.indexOf("--");
const passthrough = rest === -1 ? [] : argv.splice(rest).slice(1);

function flag(name) {
  return argv.includes(name);
}
function value(name) {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
}
function values(name) {
  return argv.flatMap((a, i) => (a === name ? [argv[i + 1]] : []));
}

const projectRoot = resolve(value("--project") ?? process.cwd());
const cacheRoot = resolve(value("--cache") ?? defaultCacheRoot());

let result;
try {
  switch (command) {
    case "init":
      result = init({ projectRoot, bundleFile: value("--bundle"), repo: value("--repo"), profiles: values("--profile"), mcpProfiles: values("--mcp-profile"), channel: value("--channel") ?? "stable", force: flag("--force") });
      break;
    case "sync":
      result = await syncCommand();
      break;
    case "run":
      result = run({ projectRoot, cacheRoot, args: passthrough });
      break;
    case "rollback":
      result = rollback({ projectRoot, cacheRoot, force: flag("--force") });
      break;
    case "status":
      result = statusCommand();
      break;
    case "doctor":
      result = doctor({ projectRoot, cacheRoot });
      break;
    default:
      result = { status: "ERROR", errors: [`unknown command: ${command ?? "(none)"}`], warnings: [] };
  }
} catch (error) {
  result = { status: "ERROR", errors: [error.message], warnings: [] };
}

function statusCommand() {
  const revFile = value("--revocations");
  if (revFile && !existsSync(revFile)) return { status: "ERROR", errors: [`--revocations not found: ${revFile}`], warnings: [] }; // never report READY on a typo
  const revocations = revFile ? JSON.parse(readFileSync(revFile, "utf8")) : null;
  const r = bootstrapStatus({ projectRoot, cacheRoot, revocations, offline: flag("--offline") });
  // exit code: only a state that forbids work is a failure; --check makes anything but READY non-zero
  const ok = r.state === "READY";
  return flag("--check") && !ok ? { ...r, status: "FAIL", errors: [`${r.state}: ${r.detail}`] } : r;
}

async function syncCommand() {
  const { lock, errors: lockErrors } = readLock(projectRoot);
  if (lockErrors.length) return { status: "ERROR", errors: lockErrors, warnings: [] };
  const requireAttestation = flag("--require-attestation");
  const offline = flag("--offline");
  const warnings = [];
  let revocations = null;
  const revFile = value("--revocations");
  if (revFile) {
    if (!existsSync(revFile)) return { status: "ERROR", errors: [`--revocations not found: ${revFile}`], warnings };
    revocations = JSON.parse(readFileSync(revFile, "utf8"));
  } else if (!offline) {
    const r = await fetchRevocations({ repo: lock.platform.repo, requireAttestation });
    if (r.errors.length) return { status: "ERROR", errors: r.errors, warnings: r.warnings };
    revocations = r.list;
    warnings.push(...r.warnings);
  }
  let fromFile = value("--from-file");
  if (!fromFile && !offline) {
    let cached = true;
    try {
      verifyRelease(cacheRoot, lock.platform.digest);
    } catch {
      cached = false;
    }
    if (!cached) {
      const d = await downloadRelease({ lock, requireAttestation });
      warnings.push(...d.warnings);
      if (d.errors.length) return { status: "ERROR", errors: d.errors, warnings };
      fromFile = join(mkdtempSync(join(tmpdir(), "ai-native-dl-")), "bundle.tar.gz");
      writeFileSync(fromFile, d.bytes);
    }
  }
  const r = sync({ projectRoot, cacheRoot, fromFile, revocations });
  return { ...r, warnings: [...warnings, ...r.warnings], status: r.status === "PASS" && warnings.length ? "PASS_WITH_WARNINGS" : r.status };
}

const { status, errors, warnings, ...data } = result;
const out = buildReport({ status, errors, warnings, data });
console.log(renderOutput(out, { json: flag("--json") }));
process.exit(exitCodeForReport(out, { strict: false }));
