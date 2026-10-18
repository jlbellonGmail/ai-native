// `ai-native upgrade` engine: moves an ADOPTED repository to another release, explicitly. The launcher (runtime/cli/ai-native.mjs) resolved the
// target, checked immutability and sha256, verified the sigstore attestation and revocations, and handed over this engine FROM the target bundle.
// Nothing here chooses a release: the lock is the pin, and it only changes when this command is run.
//   plan   target release -> compatibility (CLI <-> PLATFORM) -> no downgrade -> not revoked
//   apply  lock (+ the pinned caller workflow) -> managed projections as a minimal delta (edited files are kept, never overwritten) -> sync -> stage
//   verify status + drift + tracking + doctor; any failure puts back EXACTLY what was there before (proved against `git status` and the index)
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { LOCK_FILE, readLock, sync } from "./install.mjs";
import { sha256, verifyRelease } from "./cache.mjs";
import { readTar } from "./tar.mjs";
import { fetchRevocations } from "./remote.mjs";
import { callerFrom, negotiate } from "./compat.mjs";
import { cmpAny } from "./semver.mjs";
import { ALL_TOOLS } from "../adapters/sync.mjs";
import { consumerFiles, applyConsumer } from "../adapters/consumer.mjs";
import { applyUpgrade } from "../migrate/upgrade-delta.mjs";
import { JOURNAL_PATH, safeJoin } from "../migrate/adopt.mjs";
import { CALLER_WORKFLOW, planBump } from "../migrate/bump.mjs";
import { managedPaths } from "../migrate/tracking.mjs";
import { ensureInCache, fail, gitSnapshot, readAttestation, renderText, repoFacts, restoreGit, stage, verify, writeAttestation } from "./adopt.mjs";

const slugOf = (repo) => repo.replace(/^github:/, "");

/** True when the pinned caller workflow exists and has a SHA-pinned `uses:` of this release's repository (never another action's pin). */
function callerPinFor(projectRoot, repo) {
  const file = join(projectRoot, CALLER_WORKFLOW);
  if (!existsSync(file)) return false;
  return [...readFileSync(file, "utf8").matchAll(/uses:\s*([^\s@]+)@[0-9a-f]{40}/g)].some((m) => m[1].startsWith(`${slugOf(repo)}/`));
}

/**
 * @param {object} o
 * @param {string} o.bundleFile verified bundle of the TARGET release (from the launcher)
 * @param {object} [o.attestationRecord] proof the launcher produced for exactly this bundle (or the one the cache keeps)
 */
export async function upgrade({ projectRoot, cacheRoot, bundleFile, attestationRecord = null, offline = false, caller = callerFrom(), fetchRevocationsImpl = fetchRevocations, afterWrite = null }) {
  projectRoot = resolve(projectRoot);
  const facts = repoFacts(projectRoot);
  if (facts.errors.length) return fail(facts.errors);
  if (!existsSync(join(projectRoot, LOCK_FILE))) return fail(["NOT_ADOPTED: this repository has no ai-native.lock.json; run `ai-native init` first"]);
  const { lock, errors: lockErrors } = readLock(projectRoot);
  if (lockErrors.length) return fail(lockErrors);
  if (!bundleFile || !existsSync(bundleFile)) return fail(["no bundle: `ai-native upgrade` hands the verified target release to this engine"]);

  const bytes = readFileSync(bundleFile);
  const digest = `sha256:${sha256(bytes)}`;
  if (attestationRecord && (attestationRecord.verifiedBy !== "gh attestation verify" || attestationRecord.digest !== digest)) return fail([`attestation record is not a verified one for this bundle (${digest})`]);
  const record = attestationRecord ?? readAttestation(cacheRoot, digest);
  if (!record) return fail([`ATTESTATION_NOT_VERIFIED: no verified sigstore attestation for ${digest}`]);
  let files;
  let platform;
  try {
    files = readTar(bytes);
    platform = JSON.parse(files.get("platform.json")?.toString("utf8") ?? "");
  } catch (error) {
    return fail([`bundle rejected: ${error.message}`]);
  }
  if (!files.has("runtime/bootstrap/upgrade.mjs")) return fail([`${platform.version} predates \`ai-native upgrade\``]);
  if (caller.error) return fail([caller.error]);
  const deal = negotiate({ platform, caller });
  if (!deal.ok) return fail(deal.errors);
  const warnings = [...deal.warnings];

  const from = lock.platform.version;
  const base = { version: from, profile: lock.profiles[0], attestation: "PASS" };
  const order = cmpAny(platform.version, from);
  if (order < 0) return fail([`DOWNGRADE_REFUSED: this repository is pinned to ${from}; ${platform.version} is older. \`ai-native upgrade\` only moves forward`], warnings, base);
  if (order === 0 && digest === lock.platform.digest) {
    const out = { ...base, state: "UP_TO_DATE", status: "PASS", errors: [], warnings, upgrade: `already on ${from}; nothing changed` };
    return { ...out, text: renderText(out) };
  }
  if (order === 0) return fail([`${platform.version} is already pinned with another digest (${lock.platform.digest}); refusing to swap the bytes of a release`], warnings, base);
  if (/-(alpha|rc)\./.test(platform.version) && (lock.platform.channel ?? "stable") === "stable") return fail([`${platform.version} is a prerelease; this repository follows the stable channel`], warnings, base);

  let revocations = null;
  if (!offline) {
    const rv = await fetchRevocationsImpl({ repo: lock.platform.repo, requireAttestation: true });
    if (rv.errors.length) return fail(rv.errors, rv.warnings);
    if (rv.unavailable) return fail(["REVOCATION_UNKNOWN: the revocations list could not be read; use --offline to run without that information"], rv.warnings);
    revocations = rv.list;
    warnings.push(...rv.warnings);
  } else warnings.push("offline: revocation status NOT checked");
  const revoked = (revocations?.entries ?? []).find((e) => e.kind === "platform" && e.version === platform.version && (!e.commit || e.commit === platform.commit));
  if (revoked) return fail([`platform ${revoked.version} is revoked (${revoked.severity ?? "high"}): ${revoked.reason}`], warnings, base);

  // the profile (so the tools projected) is the repository's own, from its lock; a target that no longer ships it is a refusal, not a guess
  const profile = lock.profiles[0];
  const profileFile = files.get(`profiles/${profile}.json`);
  if (profile && !profileFile) return fail([`${platform.version} has no profile '${profile}', which this repository is pinned to`], warnings, base);
  const selection = { tools: ALL_TOOLS, mcpProfile: "none" };
  if (profileFile) selection.tools = (JSON.parse(profileFile.toString("utf8")).tools ?? ALL_TOOLS).filter((t) => ALL_TOOLS.includes(t));

  // everything this run may touch is saved first: a failure anywhere restores it byte for byte
  const before = gitSnapshot(projectRoot);
  const saved = new Map();
  const touched = new Set([LOCK_FILE, JOURNAL_PATH, CALLER_WORKFLOW]);
  const withJournal = existsSync(join(projectRoot, JOURNAL_PATH));
  try {
    ensureInCache(cacheRoot, digest, bytes, files);
    const releaseRoot = verifyRelease(cacheRoot, digest);
    const incoming = consumerFiles(releaseRoot, selection);
    for (const rel of [...Object.keys(incoming), ...Object.keys(managedPaths(projectRoot))]) touched.add(rel);
    for (const rel of touched) saved.set(rel, existsSync(join(projectRoot, rel)) ? readFileSync(join(projectRoot, rel)) : null);

    const next = planBump({ projectRoot, release: { version: platform.version, commit: platform.commit, digest, repo: lock.platform.repo }, callerSha: callerPinFor(projectRoot, lock.platform.repo) ? platform.commit : null });
    for (const [rel, content] of Object.entries(next.files)) writeFileSync(join(projectRoot, rel), content, "utf8");
    const synced = sync({ projectRoot, cacheRoot, fromFile: bundleFile, revocations });
    if (synced.errors.length) throw new Error(synced.errors.join("; "));
    let delta;
    if (withJournal) delta = applyUpgrade(projectRoot, incoming);
    else {
      // a lock without an adoption journal (pinned before `init` existed): the projections are adopted now, brownfield-safe
      const applied = applyConsumer({ releaseRoot, projectRoot, skip: Object.keys(incoming).filter((rel) => existsSync(safeJoin(projectRoot, rel))), ...selection });
      delta = { add: applied.written ?? [], update: [], remove: [], keepLocal: [], collisions: applied.skipped ?? [] };
    }
    if (afterWrite) afterWrite(); // test seam: a failure after the project was written
    stage(projectRoot, [...Object.keys(managedPaths(projectRoot)), ...Object.keys(next.files)]);
    writeAttestation(cacheRoot, { ...record, schemaVersion: 1 });
    const v = verify({ projectRoot, cacheRoot, selection, revocations, offline, tolerateEdits: true });
    if (v.errors.length) throw new Error(v.errors.join("; "));
    warnings.push(...v.warnings);
    for (const k of delta.keepLocal ?? []) warnings.push(`kept your version of ${k.path} (${k.reason}); it differs from ${platform.version}`);
    for (const rel of delta.collisions ?? []) warnings.push(`${rel} already exists and is not ai-native's; left as it is`);
    const out = {
      ...base, version: platform.version, state: "READY", status: warnings.length ? "PASS_WITH_WARNINGS" : "PASS", errors: [], warnings, lock: "VALID", drift: v.drift, revocation: v.revocation,
      adapters: `${selection.tools.join(", ")} (${v.files.length} projected file(s); +${delta.add.length} ~${delta.update.length} -${delta.remove.length})`,
      upgrade: `${from} -> ${platform.version}${next.files[CALLER_WORKFLOW] ? " (lock and caller workflow pin)" : " (lock)"}`,
      next: "review with `git status` and `git diff --staged`, then commit (nothing was committed for you)", digest,
    };
    return { ...out, text: renderText(out) };
  } catch (error) {
    for (const [rel, content] of saved) {
      const f = join(projectRoot, rel);
      if (content === null) rmSync(f, { force: true });
      else { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, content); }
    }
    const left = restoreGit(projectRoot, before, [...touched]);
    const rolled = left.length ? `ROLLBACK_INCOMPLETE (differs from before: ${left.slice(0, 8).join(", ")})` : "ROLLED_BACK (verified: `git status` and the index are identical to before)";
    return fail([error.message], warnings, { ...base, adoption: rolled });
  }
}
