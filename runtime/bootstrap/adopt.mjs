// `ai-native init` engine: turns a Git repository (empty or not) into a READY consumer in one pass, composing the existing
// primitives and nothing else: init (lock) -> sync (cache, digest vs lock) -> adapters (brownfield-safe adoption) -> verify.
// It runs from a release the public launcher (runtime/cli/ai-native.mjs) already verified (digest + sigstore attestation), or from
// the cache. Nothing is trusted because of where it came from: the bundle's sha256 must equal the digest the attestation vouched for
// (`attestationRecord`, or the record the cache keeps from the run that verified it); without one the run FAILS CLOSED.
// Fresh adoption is transactional: if any step fails, what this run wrote (lock, projections, journal) is removed.
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { init, sync, readLock, status as bootstrapStatus, doctor, LOCK_FILE } from "./install.mjs";
import { getBlob, hasBlob, putBlob, putRelease, sha256, verifyRelease, CacheCorruptError, CacheMissError } from "./cache.mjs";
import { readTar } from "./tar.mjs";
import { fetchRevocations } from "./remote.mjs";
import { inferProfile, offeredProfiles } from "./profile-infer.mjs";
import { consumerFiles, planConsumer, applyConsumer, LAUNCHER_PATH } from "../adapters/consumer.mjs";
import { ALL_TOOLS } from "../adapters/sync.mjs";
import { detectDrift } from "../migrate/upgrade-delta.mjs";
import { revertAdoption, JOURNAL_PATH } from "../migrate/adopt.mjs";
import { checkTracking, managedPaths, describe as describeTracking, remedy } from "../migrate/tracking.mjs";
import { checkReference } from "../consumer/knowledge.mjs";
import { callerFrom, negotiate } from "./compat.mjs";

const STABLE = /^v[0-9]+\.[0-9]+\.[0-9]+$/;
export const ATTESTATIONS_DIR = "attestations";

/** The cache keeps, per release, the proof that its sigstore attestation was verified when it entered. No record, no offline use. */
export const attestationPath = (cacheRoot, digest) => join(cacheRoot, ATTESTATIONS_DIR, `${digest.replace(/^sha256:/, "")}.json`);

export function readAttestation(cacheRoot, digest) {
  try {
    const record = JSON.parse(readFileSync(attestationPath(cacheRoot, digest), "utf8"));
    return record?.digest === digest && record.verifiedBy === "gh attestation verify" ? record : null;
  } catch {
    return null;
  }
}

export function writeAttestation(cacheRoot, record) {
  const path = attestationPath(cacheRoot, record.digest);
  mkdirSync(join(cacheRoot, ATTESTATIONS_DIR), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(record, null, 2)}\n`);
  renameSync(tmp, path);
}

const git = (cwd, args) => spawnSync("git", args, { cwd, encoding: "utf8" });
const same = (a, b) => {
  const [x, y] = [realpathSync.native(a), realpathSync.native(b)];
  return process.platform === "win32" ? x.toLowerCase() === y.toLowerCase() : x === y;
};

/** What the repository is, before anything is written. */
export function repoFacts(projectRoot) {
  const top = git(projectRoot, ["rev-parse", "--show-toplevel"]);
  if (top.error) return { errors: [`git could not run: ${top.error.message}`] };
  if (top.status !== 0) return { errors: ["not inside a Git repository: run `git init` (or clone your repository) first"] };
  if (!same(top.stdout.trim(), projectRoot)) return { errors: [`run it from the repository root: ${top.stdout.trim()}`] };
  const head = git(projectRoot, ["rev-parse", "--verify", "-q", "HEAD"]);
  const remote = git(projectRoot, ["remote", "get-url", "origin"]);
  return { errors: [], commits: head.status === 0, remote: remote.status === 0 ? remote.stdout.trim() : null };
}

export function stage(projectRoot, paths) {
  if (!paths.length) return;
  // Windows: antivirus / indexers briefly lock freshly written objects ("unable to write file .git/objects/..: Permission denied"); git add is idempotent, so retry
  let r;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    r = spawnSync("git", ["add", "--", ...paths], { cwd: projectRoot, encoding: "utf8" });
    if (r.status === 0) return;
    if (!/Permission denied|index\.lock|failed to insert into database/i.test(r.stderr ?? "")) break;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200 * (attempt + 1));
  }
  throw new Error(`git add failed: ${(r.stderr || r.error?.message || "").split("\n").filter((l) => l && !l.startsWith("warning:")).join("; ")}`);
}

function bundleBytes({ bundleFile, digest, cacheRoot }) {
  if (bundleFile) {
    if (!existsSync(bundleFile)) throw new Error(`bundle not found: ${bundleFile}`);
    return readFileSync(bundleFile);
  }
  if (digest && hasBlob(cacheRoot, digest)) return getBlob(cacheRoot, digest);
  throw new Error("no bundle: the release is not in the cache and none was provided (a network is needed once; `ai-native init` fetches it)");
}

async function choose({ explicit, root, available, ask }) {
  const offered = offeredProfiles(available);
  if (explicit) {
    return available.includes(explicit) ? { profile: explicit, how: "chosen" } : { error: `unknown profile '${explicit}'; available: ${offered.join(", ")}` };
  }
  const inferred = inferProfile(root, available);
  if (inferred.profile) return { profile: inferred.profile, how: `detected: ${inferred.reason}` };
  if (!ask) return { error: `PROFILE_REQUIRED: ${inferred.reason}. Say what this project is: ai-native init --profile <${offered.join("|")}>` };
  const profile = await ask(offered);
  return offered.includes(profile) ? { profile, how: "chosen" } : { error: `unknown profile '${profile}'; available: ${offered.join(", ")}` };
}

export const fail = (errors, warnings = [], data = {}) => ({ status: "FAIL", errors, warnings, ...data, text: renderText({ status: "FAILED", errors, warnings, ...data }) });

export function renderText(r) {
  const lines = [`STATUS: ${r.state ?? r.status}`];
  if (r.version) lines.push(`AI-NATIVE: ${r.version}`);
  if (r.profile) lines.push(`PROFILE: ${r.profile}${r.how ? ` (${r.how})` : ""}`);
  if (r.drift) lines.push(`DRIFT: ${r.drift}`);
  if (r.attestation) lines.push(`ATTESTATION: ${r.attestation}`);
  if (r.revocation) lines.push(`REVOCATION: ${r.revocation}`);
  if (r.upgrade) lines.push(`UPGRADE: ${r.upgrade}`);
  if (r.detach) lines.push(`DETACH: ${r.detach}`);
  if (r.lock) lines.push(`LOCK: ${r.lock}`);
  if (r.adapters) lines.push(`ADAPTERS: ${r.adapters}`);
  if (r.launcher) lines.push(`LAUNCHER: ${r.launcher}`);
  if (r.adoption) lines.push(`ADOPTION: ${r.adoption}`);
  if (r.staged !== undefined) lines.push(`STAGED: ${r.staged} file(s), not committed`);
  for (const w of r.warnings ?? []) lines.push(`WARNING: ${w}`);
  for (const e of r.errors ?? []) lines.push(`ERROR: ${e}`);
  if (r.next) lines.push(`NEXT: ${r.next}`);
  return lines.join("\n");
}

/** Verification shared by a fresh adoption and a re-run on an adopted repo: lock, release integrity, projections vs release, tracking. */
export function verify({ projectRoot, cacheRoot, selection, revocations, offline, tolerateEdits = false }) {
  const { lock, errors: lockErrors } = readLock(projectRoot);
  if (lockErrors.length) return { errors: lockErrors };
  const errors = [];
  const warnings = [];
  const st = bootstrapStatus({ projectRoot, cacheRoot, revocations, offline });
  if (st.state !== "READY") errors.push(`${st.state}: ${st.detail}`);
  let releaseRoot;
  try {
    releaseRoot = verifyRelease(cacheRoot, lock.platform.digest);
  } catch (error) {
    if (!(error instanceof CacheMissError) && !(error instanceof CacheCorruptError)) throw error;
    return { errors: [...errors, error.message] };
  }
  const reference = checkReference({ projectRoot, cacheRoot });
  const drift = detectDrift(projectRoot, consumerFiles(releaseRoot, selection), { reference });
  // an upgrade keeps what the person changed (never overwrites it): that is reported, and it is what keeps DRIFT from being CLEAN
  if (drift.status === "DRIFT") (tolerateEdits ? warnings : errors).push(`projections diverge from the release: edited=[${drift.edited.join(", ")}] missing=[${drift.missing.join(", ")}]`);
  else if (drift.status === "MISSING_REFERENCE" || drift.status === "INCOMPATIBLE_VERSION") errors.push(`${drift.status}: ${drift.reference}`);
  let driftState = drift.status;
  const tracking = checkTracking(projectRoot, { source: "index" });
  if (tracking.status === "FAIL") {
    errors.push(`MANAGED_FILE_NOT_REPRODUCIBLE: ${describeTracking(tracking)}. ${remedy(tracking)}`);
    if (driftState === "CLEAN" || driftState === "OUTDATED") driftState = "DRIFT";
  }
  const dr = doctor({ projectRoot, cacheRoot });
  if (dr.status === "FAIL" || dr.errors.length) errors.push(...dr.errors);
  return { errors, warnings, lock, drift: driftState, revocation: st.revocation ?? "NOT_CHECKED", releaseRoot, files: Object.keys(consumerFiles(releaseRoot, selection)) };
}

/**
 * @param {object} o
 * @param {string} o.projectRoot repository root
 * @param {string} o.cacheRoot
 * @param {string} o.repo `github:<owner>/<repo>` the release belongs to (ignored when the repo is already adopted: the lock decides)
 * @param {string} [o.bundleFile] verified bundle (from the launcher) | {o.digest} release already in the cache
 * @param {object} [o.attestationRecord] proof the launcher produced for exactly this bundle
 * @param {string} [o.version] version the launcher resolved; the bundle's platform.json must say the same
 * @param {string} [o.profile] explicit profile | else detected | else {o.ask}(offered) | else fail closed
 * @param {boolean} [o.offline] no network: revocations are NOT checked (and said so)
 * @param {boolean} [o.keepExisting] leave files that already exist and differ untouched instead of stopping
 */
export async function adopt({ projectRoot, cacheRoot, repo, bundleFile = null, digest = null, attestationRecord = null, version = null, profile = null, offline = false, keepExisting = false, caller = callerFrom(), ask = null, fetchRevocationsImpl = fetchRevocations, afterStage = null }) {
  projectRoot = resolve(projectRoot);
  const facts = repoFacts(projectRoot);
  if (facts.errors.length) return fail(facts.errors);
  const warnings = [];
  const selection = { tools: ALL_TOOLS, mcpProfile: "none" };
  const adopted = existsSync(join(projectRoot, LOCK_FILE));
  let lock = null;
  if (adopted) {
    const r = readLock(projectRoot);
    if (r.errors.length) return fail(r.errors);
    lock = r.lock;
    if (profile && !lock.profiles.includes(profile)) return fail([`PROFILE_CONFLICT: --profile ${profile} contradicts the profile this repository is pinned to (${lock.profiles.join(", ")}); the profile is changed in ${LOCK_FILE}, not by this command`]);
    repo = lock.platform.repo;
    digest = lock.platform.digest;
  }
  if (!repo) return fail(["no repository to take the release from"]);

  let bytes;
  try {
    bytes = bundleBytes({ bundleFile, digest, cacheRoot });
  } catch (error) {
    return fail([error.message]);
  }
  const actual = `sha256:${sha256(bytes)}`;
  if (digest && actual !== digest) return fail([`bundle digest ${actual} does not match ${adopted ? "lock.platform.digest" : "the expected digest"} ${digest}`]);
  digest = actual;

  // supply chain: the bytes about to be installed are exactly the bytes whose sigstore attestation was verified
  if (attestationRecord && attestationRecord.verifiedBy !== "gh attestation verify") return fail(["attestation record was not produced by a verified `gh attestation verify`"]);
  if (attestationRecord && attestationRecord.digest !== digest) return fail([`attestation record is for ${attestationRecord.digest}, not for this bundle (${digest})`]);
  const record = attestationRecord ?? readAttestation(cacheRoot, digest);
  if (!record) return fail([`ATTESTATION_NOT_VERIFIED: no verified sigstore attestation for ${digest}; \`ai-native init\` verifies it online (it needs the network and an authenticated \`gh\` once per release)`]);

  let files;
  try {
    files = readTar(bytes);
  } catch (error) {
    return fail([`bundle rejected: ${error.message}`]); // truncated or corrupt gzip, bad tar header, unsafe path: all the same answer
  }
  let platform;
  try {
    platform = JSON.parse(files.get("platform.json")?.toString("utf8") ?? "");
  } catch {
    return fail(["bundle has no valid platform.json"]);
  }
  if (version && platform.version !== version) return fail([`bundle platform.json says ${platform.version}, expected ${version}`]);
  if (adopted && (platform.version !== lock.platform.version || platform.commit !== lock.platform.commit)) return fail([`bundle ${platform.version}@${platform.commit} does not match the lock (${lock.platform.version}@${lock.platform.commit})`]);
  if (!files.has("runtime/bootstrap/adopt.mjs")) return fail(["this release predates `ai-native init`"]);
  if (caller.error) return fail([caller.error]);
  const deal = negotiate({ platform, caller });
  if (!deal.ok) return fail(deal.errors);
  warnings.push(...deal.warnings);

  // revocations: fail closed unless the caller declares --offline
  let revocations = null;
  if (!offline) {
    const rv = await fetchRevocationsImpl({ repo, requireAttestation: true });
    if (rv.errors.length) return fail(rv.errors, rv.warnings);
    if (rv.unavailable) return fail(["REVOCATION_UNKNOWN: the revocations list could not be read; use --offline to run without that information"], rv.warnings);
    revocations = rv.list;
    warnings.push(...rv.warnings);
  } else warnings.push("offline: revocation status NOT checked");
  const revoked = (revocations?.entries ?? []).find((e) => e.kind === "platform" && e.version === platform.version && (!e.commit || e.commit === platform.commit));
  if (revoked) return fail([`platform ${revoked.version} is revoked (${revoked.severity ?? "high"}): ${revoked.reason}`]);

  // from here the cache is written (content-addressed, digest-checked by `sync`); the project is written only on a fresh adoption
  const bundleOnDisk = bundleFile ?? join(mkdtempSync(join(tmpdir(), "ai-native-bundle-")), "bundle.tar.gz");
  if (!bundleFile) writeFileSync(bundleOnDisk, bytes);
  let chosen = { profile: lock?.profiles?.[0], how: "from the lock" };
  if (!adopted) {
    const available = [...files.keys()].filter((p) => /^profiles\/[^/]+\.json$/.test(p)).map((p) => p.slice(9, -5));
    chosen = await choose({ explicit: profile, root: projectRoot, available, ask });
    if (chosen.error) return fail([chosen.error]);
    const profileDef = JSON.parse(files.get(`profiles/${chosen.profile}.json`).toString("utf8"));
    selection.tools = (profileDef.tools ?? ALL_TOOLS).filter((t) => ALL_TOOLS.includes(t));
  } else if (lock.profiles?.[0] && files.has(`profiles/${lock.profiles[0]}.json`)) {
    selection.tools = (JSON.parse(files.get(`profiles/${lock.profiles[0]}.json`).toString("utf8")).tools ?? ALL_TOOLS).filter((t) => ALL_TOOLS.includes(t));
  }

  const base = { version: platform.version, profile: chosen.profile, how: adopted ? undefined : chosen.how, attestation: "PASS", revocation: revocations ? "CHECKED" : "NOT_CHECKED" };
  let wrote = false;
  const before = gitSnapshot(projectRoot); // the observable state before this run touched anything: rollback restores exactly this and proves it
  try {
    if (adopted) {
      const synced = sync({ projectRoot, cacheRoot, fromFile: bundleOnDisk, revocations });
      if (synced.errors.length) return fail(synced.errors, warnings, base);
    } else {
      ensureInCache(cacheRoot, digest, bytes, files);
      // the release is in the cache now: plan against it BEFORE touching the project
      const releaseRoot = verifyRelease(cacheRoot, digest);
      const plan = planConsumer({ releaseRoot, projectRoot, ...selection });
      const collisions = plan.collisions.filter((c) => !c.identical).map((c) => c.path);
      if (collisions.length && !keepExisting) return fail([`existing files would be overwritten: ${collisions.join(", ")}. Re-run with --keep-existing to leave them as they are`], warnings, base);
      const channel = STABLE.test(platform.version) ? "stable" : platform.version.includes("-rc.") ? "rc" : "alpha";
      const made = init({ projectRoot, bundleFile: bundleOnDisk, repo, profiles: [chosen.profile], channel });
      if (made.errors.length) return fail(made.errors, warnings, base);
      wrote = true;
      // the cache's per-project state (active release) is written by `sync`, which re-checks the digest against the new lock
      const s2 = sync({ projectRoot, cacheRoot, fromFile: bundleOnDisk, revocations });
      if (s2.errors.length) throw new Error(s2.errors.join("; "));
      const applied = applyConsumer({ releaseRoot, projectRoot, skip: keepExisting ? collisions : [], ...selection });
      if (applied.status === "BLOCKED") throw new Error(`collisions with existing files: ${applied.collisions.join(", ")}`);
      const hidden = checkTracking(projectRoot, { onlyIgnored: true });
      if (hidden.status === "FAIL") throw new Error(`IGNORED_REQUIRED_FILE: hidden by a .gitignore rule, so it would not reach a clean clone: ${hidden.ignored.join(", ")}. ${remedy(hidden)}`);
      stage(projectRoot, Object.keys(managedPaths(projectRoot)));
      if (afterStage) afterStage(); // test seam: a failure after the index was written
    }
    writeAttestation(cacheRoot, { ...record, schemaVersion: 1 });
    const v = verify({ projectRoot, cacheRoot, selection, revocations, offline });
    if (v.errors.length) {
      if (!adopted) throw new Error(v.errors.join("; "));
      return fail(v.errors, warnings, { ...base, drift: v.drift, lock: "VALID" });
    }
    const staged = adopted ? undefined : Object.keys(managedPaths(projectRoot)).length;
    if (!existsSync(join(projectRoot, "AGENTS.md"))) warnings.push("AGENTS.md is project-owned and was not found: add your own (the projected CLAUDE.md points at it)");
    const out = {
      ...base, state: "READY", status: warnings.length ? "PASS_WITH_WARNINGS" : "PASS", errors: [], warnings, lock: "VALID", drift: v.drift,
      adapters: `${selection.tools.join(", ")} (${v.files.length} projected file(s))`, launcher: existsSync(join(projectRoot, LAUNCHER_PATH)) ? LAUNCHER_PATH : "MISSING",
      adoption: adopted ? "ALREADY_ADOPTED (no file changed)" : facts.commits ? "ADOPTED" : "ADOPTED (repository has no commits yet)", staged,
      next: adopted ? undefined : "review with `git status`, then commit (nothing was committed for you)", digest, remote: facts.remote,
    };
    return { ...out, text: renderText(out) };
  } catch (error) {
    const left = wrote ? rollbackFresh(projectRoot, before) : [];
    const adoption = !wrote ? undefined : left.length ? `ROLLBACK_INCOMPLETE (differs from before: ${left.slice(0, 8).join(", ")}${left.length > 8 ? `, +${left.length - 8} more` : ""})` : "ROLLED_BACK (verified: `git status` and the index are identical to before)";
    return fail([error.message], warnings, { ...base, adoption });
  }
}

/** Same two writes `sync` does after checking the digest; both are content-addressed and re-verified on every read. */
export function ensureInCache(cacheRoot, digest, bytes, files) {
  try {
    verifyRelease(cacheRoot, digest);
    return;
  } catch (error) {
    if (!(error instanceof CacheMissError) && !(error instanceof CacheCorruptError)) throw error;
  }
  putBlob(cacheRoot, bytes);
  putRelease(cacheRoot, digest, files);
}

const gitOut = (root, args) => spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });

/** Index entries (mode, blob, stage, path) and `git status` of the working tree, as they are right now. */
export function gitSnapshot(root) {
  const idx = gitOut(root, ["ls-files", "-s", "-z"]);
  const st = gitOut(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  const entries = new Map();
  for (const e of (idx.status === 0 ? idx.stdout : "").split("\0").filter(Boolean)) {
    const tab = e.indexOf("\t");
    const [mode, oid, stage] = e.slice(0, tab).split(" ");
    if (stage === "0") entries.set(e.slice(tab + 1), { mode, oid });
  }
  return { entries, index: idx.status === 0 ? idx.stdout : null, status: st.status === 0 ? st.stdout : null };
}

/**
 * Undo what this run wrote and PROVE it. Every path ai-native manages is put back in the index exactly as it was (same mode and blob,
 * or absent); the adoption is reverted from its journal (files the user changed since are kept by revert itself); the lock is removed.
 * Then `git status` and the index are compared with the snapshot taken before the run. Returns the differences; empty means identical,
 * so a clean rollback is never claimed that was not demonstrated.
 */
function rollbackFresh(projectRoot, before) {
  const ours = Object.keys(managedPaths(projectRoot));
  if (existsSync(join(projectRoot, JOURNAL_PATH))) {
    try {
      revertAdoption(projectRoot);
    } catch {
      // revert reports what it kept; the comparison below says what differs
    }
  }
  rmSync(join(projectRoot, LOCK_FILE), { force: true });
  return restoreGit(projectRoot, before, [...ours, LOCK_FILE]);
}

/** Puts `paths` back in the index exactly as `before` had them (same mode and blob, or absent), then compares `git status` and the index with it. Returns the differences. */
export function restoreGit(projectRoot, before, paths) {
  for (const p of new Set(paths)) {
    const was = before.entries.get(p);
    if (was) gitOut(projectRoot, ["update-index", "--add", "--cacheinfo", `${was.mode},${was.oid},${p}`]);
    else gitOut(projectRoot, ["rm", "--cached", "-q", "--ignore-unmatch", "--", p]);
  }
  const after = gitSnapshot(projectRoot);
  if (before.index === null || before.status === null || after.index === null || after.status === null) return ["git state could not be read"];
  const lines = (z) => new Set(z.split("\0").filter(Boolean));
  const diff = (a, b) => [...a].filter((x) => !b.has(x));
  const [sa, sb, ia, ib] = [lines(before.status), lines(after.status), lines(before.index), lines(after.index)];
  const differing = [...diff(sa, sb), ...diff(sb, sa), ...diff(ia, ib), ...diff(ib, ia)].map((l) => l.replace(/^[0-7]{6} [0-9a-f]+ \d\t/, "index: "));
  return [...new Set(differing)].sort();
}
