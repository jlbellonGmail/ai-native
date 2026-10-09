#!/usr/bin/env node
// `migrate` v2 -> v3 (plan SS18; PAR-MIGRATE-CLASSIFY, PAR-BROWNFIELD-SAFETY, PAR-MIGRATION-REVERT).
//   plan    read-only. Classifies every file with the Hash DB (parity/migrate-inventory.mjs) and says what would happen.
//   apply   writes the migration into the working tree for ONE reviewable PR: retires platform-owned files that are
//           byte-identical to a TEMPLATE tag, adds ai-native.lock.json + the v3 adapter files + the L3 caller workflow.
//           It never deletes a MODIFIED or LOCAL file, never touches runs/, .audit/, ROADMAP.md, STATUS.md or product-owned
//           files, never runs `git clean` and never rewrites history. A v3 file that would overwrite a user's file is a
//           collision that BLOCKS unless the user decided `keep` for it.
//   revert  restores exactly what apply removed (from the base commit recorded in the journal) and removes exactly what
//           apply created, if the user has not edited it since; a missing journal is an error.
//   node runtime/migrate/migrate.mjs plan|apply|revert --target <dir> [--repo github:o/r --version vX --commit <sha> --digest sha256:.. --profile <id>]
//        [--tool claude|codex|opencode]... [--base-branch main] [--keep <path>]... [--json]
//   bump    node runtime/migrate/migrate.mjs bump --target <dir> --version vX --commit <sha> --digest sha256:.. [--repo github:o/r] [--caller-sha <sha>] [--dry-run]
//           changes ONLY ai-native.lock.json and the SHA pin of the L3 caller (PAR-BUMP-FOOTPRINT); a prerelease needs platform.channel "rc" first.
//        ruleset guard (plan|apply): the consumer's required checks come from --ruleset-file <json> (API output or a saved ruleset),
//        --consumer-repo owner/name (read with `gh`), or the target's `origin` remote; --skip-ruleset-check records that it was NOT checked;
//        with none of them the command fails closed (RULESET_UNREADABLE). `apply` refuses RULESET_REQUIRED_CHECK_WILL_DISAPPEAR
//        unless --accept-ruleset-change. Nothing here ever edits a ruleset.
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { constants, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { consumerFiles } from "../adapters/consumer.mjs";
import { canonical, readLock, LOCK_FILE } from "../bootstrap/install.mjs";
import { globToRegExp } from "../gates/control-plane.mjs";
import { buildReport, renderOutput, exitCodeForReport } from "../lib/json.mjs";
import { statusFromCounts } from "../lib/result.mjs";
import { validate } from "../lib/schema-lite.mjs";
import { planBump, applyBump } from "./bump.mjs";
import { checkRulesetImpact, fetchRequiredChecks, fetchBranchProtected, protectsBranch, requiredChecksFrom, CODES as RULESET_CODES } from "./ruleset-guard.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PLATFORM_ROOT = join(here, "..", "..");
export const JOURNAL = ".ai-native/migration-journal.json";
export const CALLER = ".github/workflows/ai-native.yml";
export class MigrateError extends Error {}
/** The check the v3 caller (`CALLER`, job `l3`) reports from the reusable `l3-consumer.yml` job; consistency is tested. */
export const L3_CHECK = "l3 / l3-consumer";
const lockSchema = JSON.parse(readFileSync(join(PLATFORM_ROOT, "contracts", "lock.schema.json"), "utf8"));

/** Never touched, whatever their classification (plan SS18: "Conserva runs/, .audit/, ROADMAP.md y STATUS.md"). */
export const PROTECTED = ["runs/**", ".audit/**", "ROADMAP.md", "STATUS.md", "docs/producto/**", ".git/**", ".ai-native/**"];
/** Files the v2 TEMPLATE shipped AND the platform now provides. Only these may be retired, and only when IDENTICAL. */
export const PLATFORM_OWNED = [
  "scripts/**", "tests/**", ".agentic/**", ".agents/**", ".claude/**", ".codex/**", ".opencode/**", "evals/**",
  "CLAUDE.md", "CONSTITUTION.md", ".mcp.json", "opencode.json", "pytest.ini", "requirements-dev.txt",
  ".github/workflows/ci.yml", ".github/workflows/guard-develop-branch.yml",
  ".github/workflows/post-hitl-merge-gate.yml", ".github/workflows/post-merge-close-feature.yml",
];
/** Retired only once the replacement protection is verified (gap 7: "NO PROTECTION GAP"); see `developProtected` in planMigration. */
export const PROTECTION_GUARDS = [".github/workflows/guard-develop-branch.yml"];
const matcher = (globs) => { const res = globs.map(globToRegExp); return (p) => res.some((re) => re.test(p)); };
const isProtected = matcher(PROTECTED);
const isPlatformOwned = matcher(PLATFORM_OWNED);
const sha = (buf) => `sha256:${createHash("sha256").update(buf).digest("hex")}`;
// The Hash DB and the inventory hash TEXT files with CRLF normalised to LF (a checkout's autocrlf must not make a
// file look "modified"; parity/migrate-inventory.mjs). Anything compared against an inventory hash must do the same.
const isBinary = (buf) => buf.subarray(0, 8000).includes(0);
const normalizedSha = (buf) => sha(isBinary(buf) ? buf : Buffer.from(buf.toString("utf8").replaceAll("\r\n", "\n")));
const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }).trim();

function inventory(target) {
  const r = spawnSync(process.execPath, [join(PLATFORM_ROOT, "parity", "migrate-inventory.mjs"), "--target", target, "--json"], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0 && !r.stdout) throw new MigrateError(`inventory failed: ${r.stderr}`);
  const report = JSON.parse(r.stdout);
  if (report.counts.UNKNOWN > 0) throw new MigrateError(`${report.counts.UNKNOWN} file(s) are UNKNOWN: a human must classify them before migrating`);
  return report;
}

export function callerWorkflow({ repo, commit, baseBranch }) {
  const slug = repo.replace(/^github:/, "");
  return `name: ai-native

# Generated by \`ai-native migrate\`. Calls the platform's reusable L3 consumer gate, pinned by full SHA.
on:
  pull_request:
    branches: [${baseBranch}]

permissions:
  contents: read

jobs:
  l3:
    permissions:
      contents: read
    uses: ${slug}/.github/workflows/l3-consumer.yml@${commit}
`;
}

/** Pure given the inventory: what would happen. Throws on a dirty tree or in-flight v2 units. */
/**
 * `requiredChecks` ([{context}]) are the status checks the consumer's ruleset requires; when given, the plan reports every one
 * that would stop reporting because its workflow is retired (RULESET_REQUIRED_CHECK_WILL_DISAPPEAR). undefined = not checked.
 */
export function planMigration({ target, release, profile = "factory", tools = ["claude", "codex", "opencode"], baseBranch = "main", keep = [], releaseRoot = PLATFORM_ROOT, requiredChecks = undefined, developProtected = undefined }) {
  const root = resolve(target);
  if (git(root, "status", "--porcelain")) throw new MigrateError("working tree is not clean: commit or stash first (no migration over uncommitted changes)");
  const inv = inventory(root);
  if (inv.preflight.inFlightRoadmapItems?.length) throw new MigrateError(`in-flight v2 units block the migration: ${inv.preflight.inFlightRoadmapItems.join(", ")}`);
  const byPath = new Map(inv.files.map((f) => [f.path, f]));
  const retire = [];
  const keptIdentical = [];
  const keptLocal = [];
  for (const f of inv.files) {
    if (isProtected(f.path)) continue;
    if (f.classification === "IDENTICAL_TO_TEMPLATE") (isPlatformOwned(f.path) ? retire : keptIdentical).push({ path: f.path, sha256: `sha256:${f.sha256}` });
    else keptLocal.push({ path: f.path, classification: f.classification });
  }
  // gap 1: a platform-owned file the ACTIVE PROFILE still needs (e.g. the python profiles' `-r requirements-dev.txt`) is never
  // retired; the rule is central and declarative (it reads the profile's own commands), not a per-consumer patch.
  const commands = profileCommands(releaseRoot, profile);
  const keptByProfile = [];
  const keptNoGuard = [];
  for (const r of [...retire]) {
    const need = commands.find((c) => referencesPath(c.command, r.path));
    const unprotected = PROTECTION_GUARDS.includes(r.path) && developProtected !== true;
    if (!need && !unprotected) continue;
    retire.splice(retire.indexOf(r), 1);
    keptIdentical.push(r);
    if (need) keptByProfile.push({ path: r.path, reason: `profile '${profile}' ${need.field} references it` });
    // gap 7: the reactive v2 guard is the ONLY protection of `develop` until a ruleset is verified; keep it by default (fail-safe)
    else keptNoGuard.push({ path: r.path, reason: "no verified ruleset protects the branch this guard covers (NO PROTECTION GAP)" });
  }
  const retiring = new Set(retire.map((r) => r.path));
  const lockText = canonical({ schemaVersion: 1, platform: { repo: release.repo, version: release.version, commit: release.commit, digest: release.digest, channel: /-(alpha|rc)\./.test(release.version) ? "rc" : "stable" }, profiles: [profile], mcpProfiles: [], packs: [], overrides: {} });
  const add = { [LOCK_FILE]: lockText, [CALLER]: callerWorkflow({ repo: release.repo, commit: release.commit, baseBranch }) };
  for (const [p, c] of Object.entries(consumerFiles(releaseRoot, { tools }))) add[p] = c;
  const create = [];
  const replace = [];
  const collisions = [];
  for (const p of Object.keys(add).sort()) {
    const existing = byPath.get(p);
    if (!existing) { if (existsSync(join(root, p))) collisions.push({ path: p, reason: "exists but is untracked/ignored by the inventory" }); else create.push(p); continue; }
    if (retiring.has(p)) replace.push(p);
    else if (normalizedSha(Buffer.from(add[p])) === `sha256:${existing.sha256}`) continue; // already what v3 would write
    else collisions.push({ path: p, reason: `${existing.classification} v2 file (yours or product-owned)` });
  }
  const unresolved = collisions.filter((c) => !keep.includes(c.path));
  const rulesetCheck = rulesetImpact({ root, requiredChecks, retire, add });
  return { root, counts: inv.counts, retire, keptIdentical, keptByProfile, keptNoGuard, keptLocal, create, replace, collisions, unresolved, kept: collisions.filter((c) => keep.includes(c.path)), add, blocked: unresolved.length > 0, rulesetCheck };
}

/** [{field, command}] the profile runs in the consumer (setup/test); [] when the profile is unknown or declares none. */
function profileCommands(releaseRoot, profile) {
  if (!/^[a-z][a-z0-9-]*$/.test(profile)) return [];
  const text = readOrNull(join(releaseRoot, "profiles", `${profile}.json`));
  if (text === null) return [];
  const p = JSON.parse(text.toString("utf8"));
  return ["productSetupCommand", "productTestCommand"].filter((f) => typeof p[f] === "string").map((field) => ({ field, command: p[field] }));
}
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const referencesPath = (command, path) => new RegExp(`(^|[\\s"'=])${escapeRe(path)}($|[\\s"';&|])`).test(command);

const WORKFLOW = /^\.github\/workflows\/[^/]+\.ya?ml$/;

function rulesetImpact({ root, requiredChecks, retire, add }) {
  if (requiredChecks === undefined) return { status: "NOT_CHECKED", findings: [], proposed: [], required: [] };
  const retiringPaths = new Set(retire.map((r) => r.path).filter((p) => WORKFLOW.test(p)));
  const retiring = [...retiringPaths].map((path) => ({ path, text: readOrNull(join(root, path))?.toString("utf8") ?? "" }));
  const surviving = [];
  const dir = join(root, ".github", "workflows");
  if (existsSync(dir)) {
    for (const name of readdirSync(dir)) {
      const path = `.github/workflows/${name}`;
      if (WORKFLOW.test(path) && !retiringPaths.has(path) && !(path in add)) surviving.push({ path, text: readFileSync(join(dir, name), "utf8") });
    }
  }
  for (const [path, text] of Object.entries(add)) if (WORKFLOW.test(path)) surviving.push({ path, text });
  return checkRulesetImpact({ required: requiredChecks, retiring, surviving, proposed: [L3_CHECK] });
}

export function applyMigration(args) {
  const planned = planMigration(args);
  const plan = args.hooks?.planOverride ? args.hooks.planOverride(planned) : planned; // test seam: simulate a plan that went stale
  const root = plan.root;
  if (existsSync(join(root, JOURNAL))) throw new MigrateError("a migration journal already exists; revert it first");
  if (plan.blocked) return { status: "BLOCKED", plan, written: [], removed: [] };
  // a migration that would leave the consumer's PRs permanently unmergeable is refused until a human decides (--accept-ruleset-change)
  if (plan.rulesetCheck?.status === "FAIL" && !args.acceptRulesetChange) return { status: "BLOCKED", reason: "ruleset", plan, written: [], removed: [] };
  const baseCommit = git(root, "rev-parse", "HEAD");
  // 0) the lock we are about to write must validate: a bad release (e.g. a malformed commit) aborts with the tree untouched
  const lockErrors = validate(JSON.parse(plan.add[LOCK_FILE]), lockSchema);
  if (lockErrors.length) throw new MigrateError(`the generated ${LOCK_FILE} does not validate: ${lockErrors.join("; ")}`);
  // 1) VERIFY every file we are about to delete, before touching anything: a mismatch aborts with the tree unchanged
  for (const r of plan.retire) {
    const full = join(root, r.path);
    if (readOrNull(full) === null || normalizedSha(readOrNull(full)) !== r.sha256) throw new MigrateError(`'${r.path}' changed between plan and apply; nothing was modified`);
  }
  for (const p of [...plan.create, ...plan.replace]) {
    if (existsSync(join(root, p)) && !plan.replace.includes(p)) throw new MigrateError(`'${p}' appeared between plan and apply; nothing was modified`);
  }
  // files a v3 file REPLACES existed in v2: remember their v2 hash so revert can put them back from the base commit
  const replacedV2 = plan.replace.map((p) => ({ path: p, sha256: plan.retire.find((r) => r.path === p).sha256 }));
  const created = [...plan.create, ...plan.replace].map((p) => ({ path: p, sha256: sha(Buffer.from(plan.add[p])) }));
  // 2) the journal is written BEFORE the first mutation, so an interruption at any point is recoverable with `revert`
  const journal = { schemaVersion: 1, baseCommit, platform: args.release, retired: plan.retire, replaced: replacedV2, created, kept: plan.kept, keptIdentical: plan.keptIdentical.length, keptLocal: plan.keptLocal.length };
  mkdirSync(join(root, ".ai-native"), { recursive: true });
  writeFileSync(join(root, JOURNAL), `${JSON.stringify(journal, null, 2)}
`, { flag: "wx" });
  // 3) mutate
  const removed = [];
  try {
    for (const r of plan.retire) {
      rmSync(join(root, r.path));
      removed.push(r);
    }
    args.hooks?.afterRetire?.(); // test seam: lets a test make the write phase fail after deletions started
    for (const c of created) {
      const full = join(root, c.path);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, plan.add[c.path], { flag: "wx" });
    }
    const { errors } = readLock(root);
    if (errors.length) throw new MigrateError(`generated lock is invalid: ${errors.join("; ")}`);
  } catch (error) {
    // best effort: put everything back through the journal we already wrote
    try { revertMigration({ target: root }); } catch { /* the journal stays so the user can run `revert` */ }
    throw error;
  }
  return { status: "APPLIED", plan, written: created.map((c) => c.path), removed: removed.map((r) => r.path), baseCommit };
}

/**
 * A journal path is untrusted input and must be a plain relative path inside the repository, judged the same on
 * every OS: a Windows path ("C:/x", "\\host\share", "C:x") is absolute even when this process runs on Linux, where
 * path.isAbsolute() would say otherwise.
 */
export function assertSafeRelative(root, rel) {
  const s = String(rel ?? "");
  const bad = !s || s.includes("\0") || isAbsolute(s) || /^[A-Za-z]:/.test(s) || /^[\/]/.test(s) || s.split(/[\/]/).includes("..");
  if (bad || relative(root, resolve(root, s)).startsWith("..")) throw new MigrateError(`journal path escapes the repository: '${s}'`);
}

export function revertMigration({ target }) {
  const root = resolve(target);
  const jp = join(root, JOURNAL);
  const journalText = readOrNull(jp);
  if (journalText === null) throw new MigrateError("no migration journal; nothing to revert");
  const j = JSON.parse(journalText.toString("utf8"));
  // the journal lives in the repo, so it is untrusted input: every path must stay inside the root and be relative
  for (const entry of [...(j.created ?? []), ...(j.retired ?? [])]) assertSafeRelative(root, entry?.path);
  // A partial revert must be resumable: what an earlier run already undid is recorded in the journal and is never
  // re-judged (a restored v2 file legitimately no longer matches the v3 hash it was replaced by).
  const doneCreated = new Set(j.revertedCreated ?? []);
  const doneRestored = new Set(j.revertedRestored ?? []);
  const kept = [];
  const removed = [];
  for (const c of j.created) {
    if (doneCreated.has(c.path)) continue;
    const full = join(root, c.path);
    const current = readOrNull(full);
    if (current === null) { doneCreated.add(c.path); continue; }
    // the journal hash is of the bytes apply wrote (LF); a checkout with autocrlf rewrites line endings, which is
    // not a user edit, so compare the line-ending-normalised hash too (a real edit still differs either way)
    if (sha(current) !== c.sha256 && normalizedSha(current) !== c.sha256) { kept.push(c.path); continue; }
    rmSync(full);
    removed.push(c.path);
    doneCreated.add(c.path);
  }
  const restored = [];
  // `retired` holds every v2 file apply deleted, INCLUDING the ones a v3 file then took the place of (`replaced`)
  for (const r of j.retired) {
    if (doneRestored.has(r.path)) continue;
    // a retired file whose v3 replacement the user edited stays as the user's file: do not overwrite it with the v2 one
    if (kept.includes(r.path)) continue;
    // never overwrite a file that is there now: apply deleted it (or replaced it with a v3 file, removed above), so
    // anything present is something the user created afterwards
    // Extract the base-commit version with git into a scratch work tree (own index: the repo's index and tree are not
    // touched, autocrlf is honoured), then publish it with an EXCLUSIVE copy: if the user put a file there, it is kept.
    const scratch = mkdtempSync(join(tmpdir(), "ai-native-restore-"));
    try {
      const env = { ...process.env, GIT_INDEX_FILE: join(scratch, "index") };
      execFileSync("git", ["read-tree", j.baseCommit], { cwd: root, env });
      mkdirSync(join(scratch, "wt"), { recursive: true });
      execFileSync("git", ["--git-dir", join(root, ".git"), "--work-tree", join(scratch, "wt"), "checkout-index", "-f", "--", r.path], { cwd: scratch, env });
      const extracted = join(scratch, "wt", r.path);
      if (normalizedSha(readFileSync(extracted)) !== r.sha256) throw new MigrateError(`'${r.path}' at the base commit does not match the journal hash`);
      const target = join(root, r.path);
      mkdirSync(dirname(target), { recursive: true });
      try {
        copyFileSync(extracted, target, constants.COPYFILE_EXCL);
      } catch (error) {
        if (error.code === "EEXIST") { kept.push(r.path); continue; }
        throw error;
      }
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
    restored.push(r.path);
    doneRestored.add(r.path);
  }
  for (const p of removed) pruneEmpty(root, p);
  if (kept.length) {
    writeFileSync(jp, `${JSON.stringify({ ...j, revertedCreated: [...doneCreated], revertedRestored: [...doneRestored] }, null, 2)}
`);
  } else {
    rmSync(jp);
    pruneEmpty(root, JOURNAL);
  }
  return { status: kept.length ? "PARTIAL" : "REVERTED", removed, restored, kept };
}

/** Reads a file or returns null when it does not exist: no existsSync-then-read race. */
function readOrNull(path) {
  try {
    return readFileSync(path);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function pruneEmpty(root, rel) {
  let dir = dirname(join(root, rel));
  while (dir.length > root.length) {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch (error) {
      if (error.code === "ENOENT") { dir = dirname(dir); continue; } // already gone: keep walking up
      throw error;
    }
    if (entries.length) return;
    rmSync(dir, { recursive: true });
    dir = dirname(dir);
  }
}

/** owner/name of the target's `origin` when it is a github.com remote, else null. */
export function originRepo(target) {
  try {
    const url = git(resolve(target), "remote", "get-url", "origin");
    const m = /github\.com[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/.exec(url);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** Where the consumer's required checks come from. Returns {requiredChecks} | {notChecked} | {error}. */
export function resolveRequiredChecks({ target, baseBranch, rulesetFile, consumerRepo, skip }) {
  if (skip) return { notChecked: true };
  if (rulesetFile) {
    try {
      return { requiredChecks: requiredChecksFrom(JSON.parse(readFileSync(resolve(rulesetFile), "utf8"))) };
    } catch (error) {
      return { error: `${RULESET_CODES.UNREADABLE}: --ruleset-file ${rulesetFile}: ${error.message}` };
    }
  }
  const repo = consumerRepo ?? originRepo(target);
  if (!repo) return { error: `${RULESET_CODES.UNREADABLE}: no ruleset source (pass --ruleset-file, --consumer-repo owner/name, or --skip-ruleset-check to record that it was not checked)` };
  const r = fetchRequiredChecks({ repo, branch: baseBranch });
  return r.error ? { error: `${RULESET_CODES.UNREADABLE}: ${r.error}` } : { requiredChecks: r.required };
}

/** gap 7: true ONLY when a ruleset/branch protection on the develop branch is verified; anything unreadable is false (fail-safe). */
export function resolveDevelopProtected({ target, developBranch, file, consumerRepo, skip }) {
  if (file) {
    try { return protectsBranch(JSON.parse(readFileSync(resolve(file), "utf8"))); } catch { return false; }
  }
  if (skip) return false;
  const repo = consumerRepo ?? originRepo(target);
  return repo ? fetchBranchProtected({ repo, branch: developBranch }).protected === true : false;
}

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv.shift();
  const values = (n) => argv.flatMap((a, i) => (a === n ? [argv[i + 1]] : []));
  const value = (n) => values(n)[0];
  const target = value("--target") ?? process.cwd();
  const errors = [];
  const warnings = [];
  let data = {};
  try {
    const release = { repo: value("--repo"), version: value("--version"), commit: value("--commit"), digest: value("--digest") };
    const common = { target, release, profile: value("--profile") ?? "factory", tools: values("--tool").length ? values("--tool") : undefined, baseBranch: value("--base-branch") ?? "main", keep: values("--keep") };
    let rulesetNote = null;
    if (cmd === "revert") data = revertMigration({ target });
    else if (cmd === "plan" || cmd === "apply") {
      for (const k of ["repo", "version", "commit", "digest"]) if (!release[k]) throw new MigrateError(`--${k} is required`);
      const src = resolveRequiredChecks({ target, baseBranch: common.baseBranch, rulesetFile: value("--ruleset-file"), consumerRepo: value("--consumer-repo"), skip: argv.includes("--skip-ruleset-check") });
      if (src.error) throw new MigrateError(src.error);
      if (src.notChecked) rulesetNote = `${RULESET_CODES.NOT_CHECKED}: --skip-ruleset-check; required checks that a retired workflow produced will NOT be reported`;
      const developProtected = resolveDevelopProtected({ target, developBranch: value("--develop-branch") ?? "develop", file: value("--develop-ruleset-file"), consumerRepo: value("--consumer-repo"), skip: argv.includes("--skip-ruleset-check") });
      if (!developProtected) warnings.push("NO_PROTECTION_GAP: a verified ruleset on the develop branch was not found, so the v2 guard-develop-branch.yml is KEPT (pass --develop-ruleset-file or --consumer-repo once the ruleset exists)");
      common.developProtected = developProtected;
      const r = cmd === "plan" ? planMigration({ ...common, requiredChecks: src.requiredChecks }) : applyMigration({ ...common, requiredChecks: src.requiredChecks, acceptRulesetChange: argv.includes("--accept-ruleset-change") });
      const p = r.plan ?? r;
      data = { mode: cmd, ...(r.status ? { result: r.status } : {}), counts: p.counts, retire: p.retire.length, replace: p.replace, create: p.create, keptIdentical: p.keptIdentical.length, keptLocal: p.keptLocal.length, collisions: p.collisions, unresolved: p.unresolved.map((c) => c.path) };
      data.rulesetCheck = p.rulesetCheck;
      if (rulesetNote) warnings.push(rulesetNote);
      const accepted = cmd === "apply" && r.status !== "BLOCKED" && argv.includes("--accept-ruleset-change");
      for (const f of p.rulesetCheck?.findings ?? []) {
        const line = `${f.code}: ${f.detail}. Action: ${f.action}`;
        // an apply the human explicitly accepted already happened: report the findings as warnings so the exit code says APPLIED, not failure
        if (f.severity === "error" && !accepted) errors.push(line); else warnings.push(accepted && f.severity === "error" ? `${line} [ACCEPTED with --accept-ruleset-change]` : line);
      }
      if (p.rulesetCheck?.status === "FAIL" && cmd === "apply" && r.status === "BLOCKED" && r.reason === "ruleset") errors.push("apply refused: fix the ruleset plan above or pass --accept-ruleset-change to proceed knowingly");
      if (p.rulesetCheck?.proposed?.length) warnings.push(`add ${p.rulesetCheck.proposed.map((c) => `'${c}'`).join(", ")} as a required check once the v3 caller is on the default branch (the migration never edits a ruleset)`);
      if (r.status === "BLOCKED" && r.reason !== "ruleset" || (cmd === "plan" && p.blocked)) errors.push(`collisions need a decision (--keep <path>): ${p.unresolved.map((c) => c.path).join(", ")}`);
    } else if (cmd === "bump") {
      for (const k of ["version", "commit", "digest"]) if (!release[k]) throw new MigrateError(`--${k} is required`);
      const callerSha = value("--caller-sha") ?? release.commit;
      if (!/^[0-9a-f]{40}$/.test(callerSha)) throw new MigrateError("--caller-sha (default: --commit) must be a full 40-hex SHA");
      if (!existsSync(join(resolve(target), CALLER))) warnings.push(`${CALLER} not found: only the lock is bumped; the L3 caller pin is NOT updated`);
      const args = { projectRoot: resolve(target), release: { version: release.version, commit: release.commit, digest: release.digest, ...(release.repo ? { repo: release.repo } : {}) }, callerSha };
      const planned = planBump(args);
      data = argv.includes("--dry-run") ? { mode: "bump", dryRun: true, from: planned.from, to: planned.to, changed: Object.keys(planned.files) } : { mode: "bump", ...applyBump(args) };
    } else throw new MigrateError("usage: migrate plan|apply|revert|bump --target <dir> ...");
  } catch (error) {
    errors.push(error.message);
  }
  if (data.status === "PARTIAL") warnings.push(`kept user-modified files: ${data.kept.join(", ")}`);
  const report = buildReport({ status: statusFromCounts({ errors: errors.length, warnings: warnings.length }), errors, warnings, data: { migration: data } });
  console.log(renderOutput(report, { json: argv.includes("--json") }));
  process.exitCode = exitCodeForReport(report);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
