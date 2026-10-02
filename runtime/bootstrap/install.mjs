// Bootstrap/sync/rollback/doctor/init/run (M4.1). A consumer repo holds
// only `ai-native.lock.json` (PAR-REFERENCE-BASED-CAPABILITIES,
// PAR-MINIMAL-CONSUMER-FOOTPRINT): capabilities are referenced by digest
// and materialized in the content-addressed cache (cache.mjs), never
// copied into the consumer. Nothing here touches the network: a release
// reaches the cache via `--from-file` (offline install) or already sits
// there; fetching released bundles is M4.2's job, not simulated here.
import {
  existsSync, readFileSync, writeFileSync, renameSync, mkdirSync, openSync, closeSync, unlinkSync, readdirSync, statSync,
} from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { validate } from "../lib/schema-lite.mjs";
import { RESULT_STATUS, statusFromCounts } from "../lib/result.mjs";
import { readTar, BundleFormatError } from "./tar.mjs";
import {
  sha256, putBlob, getBlob, hasBlob, putRelease, verifyRelease, releaseDir, sweepStaging,
  CacheCorruptError, CacheMissError,
} from "./cache.mjs";

export const LOCK_FILE = "ai-native.lock.json";
const here = dirname(fileURLToPath(import.meta.url));
const schema = (name) => JSON.parse(readFileSync(join(here, "..", "..", "contracts", name), "utf8"));

export function readLock(projectRoot) {
  const path = join(projectRoot, LOCK_FILE);
  if (!existsSync(path)) return { errors: [`${LOCK_FILE} not found`] };
  let lock;
  try {
    lock = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return { errors: [`${LOCK_FILE} is not valid JSON: ${error.message}`] };
  }
  const errors = validate(lock, schema("lock.schema.json"));
  return errors.length ? { errors: errors.map((e) => `${LOCK_FILE}: ${e}`) } : { lock, errors: [] };
}

function canonical(lock) {
  const order = ["schemaVersion", "platform", "profiles", "mcpProfiles", "packs", "overrides"];
  const p = lock.platform;
  const out = {};
  for (const key of order) {
    if (lock[key] === undefined) continue;
    out[key] = key === "platform"
      ? Object.fromEntries(["repo", "version", "commit", "digest", "channel"].filter((k) => p[k] !== undefined).map((k) => [k, p[k]]))
      : lock[key];
  }
  return `${JSON.stringify(out, null, 2)}\n`;
}

function writeAtomic(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
}

function statePath(cacheRoot, projectRoot) {
  return join(cacheRoot, "state", `${sha256(resolve(projectRoot)).slice(0, 16)}.json`);
}

function readState(cacheRoot, projectRoot) {
  const path = statePath(cacheRoot, projectRoot);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { active: null, history: [] };
}

function withLock(cacheRoot, projectRoot, fn, { retries = 200, delayMs = 10 } = {}) {
  const lockFile = `${statePath(cacheRoot, projectRoot)}.lock`;
  mkdirSync(dirname(lockFile), { recursive: true });
  let fd = null;
  for (let i = 0; i <= retries; i += 1) {
    try {
      fd = openSync(lockFile, "wx");
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delayMs);
    }
  }
  if (fd === null) throw new Error(`could not acquire state lock: ${lockFile}`);
  try {
    return fn();
  } finally {
    closeSync(fd);
    unlinkSync(lockFile);
  }
}

const report = (errors, warnings = [], data = {}) => ({
  status: statusFromCounts({ errors: errors.length, warnings: warnings.length }),
  errors,
  warnings,
  ...data,
});

function platformJson(files) {
  const raw = files.get("platform.json");
  if (!raw) return { errors: ["bundle has no platform.json"] };
  let data;
  try {
    data = JSON.parse(raw.toString("utf8"));
  } catch (error) {
    return { errors: [`platform.json is not valid JSON: ${error.message}`] };
  }
  const errors = validate(data, schema("platform.schema.json")).map((e) => `platform.json: ${e}`);
  return errors.length ? { errors } : { platform: data, errors: [] };
}

function isRevoked(revocations, platform) {
  return (revocations?.entries ?? []).find(
    (e) => e.kind === "platform" && e.version === platform.version && (!e.commit || e.commit === platform.commit),
  );
}

/**
 * Brings the release pinned by the lock into the cache (verified) and
 * marks it active for this project. Order matters: the digest is
 * compared to the lock BEFORE anything is extracted or cached.
 */
export function sync({ projectRoot, cacheRoot, fromFile = null, revocations = null }) {
  const { lock, errors: lockErrors } = readLock(projectRoot);
  if (lockErrors.length) return report(lockErrors);
  const { digest } = lock.platform;
  const warnings = [];
  const revoked = isRevoked(revocations, lock.platform);
  if (revoked) return report([`platform ${revoked.version} is revoked (${revoked.severity ?? "high"}): ${revoked.reason}`]);

  let cacheHit = false;
  try {
    verifyRelease(cacheRoot, digest);
    cacheHit = true; // fast path: no bundle read, no extraction, no network
  } catch (error) {
    if (error instanceof CacheCorruptError) warnings.push(`cache entry was corrupt and evicted: ${error.message}`);
    else if (!(error instanceof CacheMissError)) throw error;
  }

  if (!cacheHit) {
    let bytes;
    if (fromFile) {
      if (!existsSync(fromFile)) return report([`--from-file not found: ${fromFile}`]);
      bytes = readFileSync(fromFile);
      if (`sha256:${sha256(bytes)}` !== digest) {
        return report([`bundle digest sha256:${sha256(bytes)} does not match lock.platform.digest ${digest}`]);
      }
    } else if (hasBlob(cacheRoot, digest)) {
      try {
        bytes = getBlob(cacheRoot, digest);
      } catch (error) {
        if (error instanceof CacheCorruptError) return report([error.message]);
        throw error;
      }
    } else {
      return report([`release ${digest} is not in the cache and there is no network source yet; run with --from-file <bundle>`]);
    }
    let files;
    try {
      files = readTar(bytes);
    } catch (error) {
      if (error instanceof BundleFormatError || error.code === "Z_DATA_ERROR") return report([`bundle rejected: ${error.message}`]);
      throw error;
    }
    const { platform, errors } = platformJson(files);
    if (errors.length) return report(errors);
    if (platform.version !== lock.platform.version || platform.commit !== lock.platform.commit) {
      return report([`bundle platform.json (${platform.version}@${platform.commit}) does not match the lock (${lock.platform.version}@${lock.platform.commit})`]);
    }
    putBlob(cacheRoot, bytes);
    putRelease(cacheRoot, digest, files);
  }

  return withLock(cacheRoot, projectRoot, () => {
    const state = readState(cacheRoot, projectRoot);
    const previous = state.active;
    const changed = previous !== digest;
    if (changed) {
      state.history = [...state.history.filter((d) => d !== digest), digest].slice(-10);
      state.active = digest;
      writeAtomic(statePath(cacheRoot, projectRoot), JSON.stringify(state, null, 2));
    }
    // The code running this sync came from the previously active release;
    // if the new release ships different bootstrap code, the caller must
    // re-exec before trusting anything else this process computes.
    const hashOf = (d) => {
      const file = join(releaseDir(cacheRoot, d), "runtime", "bootstrap", "install.mjs");
      return existsSync(file) ? sha256(readFileSync(file)) : null;
    };
    const restartRequired = Boolean(changed && previous && existsSync(releaseDir(cacheRoot, previous)) && hashOf(previous) !== hashOf(digest));
    if (restartRequired) warnings.push("RESTART_REQUIRED: the new release changes the bootstrap itself; re-run the command");
    return report([], warnings, { digest, cacheHit, changed, restartRequired });
  });
}

function newerArtifacts(projectRoot, maxSchemaVersion) {
  const runs = join(projectRoot, "runs");
  const newer = [];
  if (!existsSync(runs)) return newer;
  for (const unit of readdirSync(runs)) {
    const file = join(runs, unit, "events.jsonl");
    if (!existsSync(file) || !statSync(file).isFile()) continue;
    for (const line of readFileSync(file, "utf8").split("\n").filter(Boolean)) {
      try {
        if (JSON.parse(line).schemaVersion > maxSchemaVersion) {
          newer.push(`runs/${unit}/events.jsonl`);
          break;
        }
      } catch {
        // a malformed line is the integrity check's concern, not rollback's
      }
    }
  }
  return newer;
}

/**
 * Re-pins the lock to the previously active release using ONLY the cache
 * (PAR-ROLLBACK-OFFLINE). Refuses when local artifacts were written with
 * a newer schema than the target can read (PAR-ROLLBACK-WITH-NEWER-
 * ARTIFACTS) unless `force`.
 */
export function rollback({ projectRoot, cacheRoot, force = false }) {
  const { lock, errors: lockErrors } = readLock(projectRoot);
  if (lockErrors.length) return report(lockErrors);
  return withLock(cacheRoot, projectRoot, () => {
    const state = readState(cacheRoot, projectRoot);
    const idx = state.history.lastIndexOf(state.active);
    const target = idx > 0 ? state.history[idx - 1] : null;
    if (!target) return report(["no previous release to roll back to"]);
    let dir;
    try {
      dir = verifyRelease(cacheRoot, target);
    } catch (error) {
      if (error instanceof CacheMissError || error instanceof CacheCorruptError) return report([`previous release ${target} is not usable from the cache: ${error.message}`]);
      throw error;
    }
    const { platform, errors } = platformJson(new Map([["platform.json", readFileSync(join(dir, "platform.json"))]]));
    if (errors.length) return report(errors);
    const warnings = [];
    const supported = parseInt(platform.components?.["unit-event"]?.version ?? "", 10);
    if (Number.isNaN(supported)) {
      warnings.push("target platform.json does not declare components.unit-event.version; artifact compatibility was not checked");
    } else {
      const newer = newerArtifacts(projectRoot, supported);
      if (newer.length && !force) {
        return report([`local artifacts use a newer schema than ${platform.version} supports: ${newer.join(", ")} (use --force to override)`]);
      }
      if (newer.length) warnings.push(`forced rollback over newer artifacts: ${newer.join(", ")}`);
    }
    const next = { ...lock, platform: { ...lock.platform, version: platform.version, commit: platform.commit, digest: target } };
    writeAtomic(join(projectRoot, LOCK_FILE), canonical(next));
    state.history = state.history.slice(0, idx); // ends with `target`
    state.active = target;
    writeAtomic(statePath(cacheRoot, projectRoot), JSON.stringify(state, null, 2));
    return report([], warnings, { digest: target, version: platform.version });
  });
}

/** Deterministic: same bundle + same inputs => byte-identical lock. */
export function init({ projectRoot, bundleFile, repo, profiles, mcpProfiles = [], channel = "stable", force = false }) {
  const lockPath = join(projectRoot, LOCK_FILE);
  if (existsSync(lockPath) && !force) return report([`${LOCK_FILE} already exists (use --force)`]);
  if (!existsSync(bundleFile)) return report([`bundle not found: ${bundleFile}`]);
  const bytes = readFileSync(bundleFile);
  let files;
  try {
    files = readTar(bytes);
  } catch (error) {
    if (error instanceof BundleFormatError || error.code === "Z_DATA_ERROR") return report([`bundle rejected: ${error.message}`]);
    throw error;
  }
  const { platform, errors } = platformJson(files);
  if (errors.length) return report(errors);
  const lock = {
    schemaVersion: 1,
    platform: { repo, version: platform.version, commit: platform.commit, digest: `sha256:${sha256(bytes)}`, channel },
    profiles: [...profiles],
    mcpProfiles: [...mcpProfiles],
    packs: [],
    overrides: {},
  };
  const schemaErrors = validate(lock, schema("lock.schema.json"));
  if (schemaErrors.length) return report(schemaErrors);
  writeAtomic(lockPath, canonical(lock));
  return report([], [], { lock: LOCK_FILE });
}

export function doctor({ projectRoot, cacheRoot, nodeVersion = process.versions.node }) {
  const errors = [];
  const warnings = [];
  const checks = [];
  const check = (name, ok, detail) => {
    checks.push({ name, ok, detail });
    if (!ok) errors.push(`${name}: ${detail}`);
  };
  check("node", parseInt(nodeVersion, 10) >= 20, `node ${nodeVersion} (>= 20 required)`);
  const git = spawnSync("git", ["--version"], { encoding: "utf8" });
  check("git", git.status === 0, git.status === 0 ? git.stdout.trim() : "git not found on PATH");
  const { lock, errors: lockErrors } = readLock(projectRoot);
  check("lock", lockErrors.length === 0, lockErrors.join("; ") || "valid");
  if (lock) {
    const state = readState(cacheRoot, projectRoot);
    check("active release", state.active === lock.platform.digest, state.active ? `active ${state.active} != lock ${lock.platform.digest}; run sync` : "never synced; run sync");
    try {
      verifyRelease(cacheRoot, lock.platform.digest);
      check("cache integrity", true, "release verified");
    } catch (error) {
      check("cache integrity", false, error.message);
    }
  }
  const swept = sweepStaging(cacheRoot);
  if (swept) warnings.push(`${swept} stale staging entr${swept === 1 ? "y" : "ies"} from crashed writers swept`);
  return report(errors, warnings, { checks });
}

/** Verify-before-exec (PAR-CACHE-VERIFY-BEFORE-EXEC): never runs an unverified release. */
export function run({ projectRoot, cacheRoot, args = [], spawn = spawnSync }) {
  const { lock, errors } = readLock(projectRoot);
  if (errors.length) return report(errors);
  let dir;
  try {
    dir = verifyRelease(cacheRoot, lock.platform.digest);
  } catch (error) {
    if (error instanceof CacheMissError || error instanceof CacheCorruptError) return report([`refusing to execute: ${error.message}`]);
    throw error;
  }
  const entry = join(dir, "runtime", "main.mjs");
  if (!existsSync(entry)) return report([`release has no runtime/main.mjs entry point`]);
  const result = spawn(process.execPath, [entry, ...args], { cwd: projectRoot, stdio: "inherit" });
  return report(result.status === 0 ? [] : [`release exited with code ${result.status}`], [], { exitCode: result.status });
}

export { RESULT_STATUS };
