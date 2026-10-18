// Parallel-unit claims registry (M3.2, CIR-24; PAR-PARALLEL-UNITS,
// PAR-IDEMPOTENCY). TEMPLATE v2.0.5's start-work-unit.ps1 detected
// collisions by scanning `git worktree list` and existing branches
// ad-hoc, on every call, with no lock -- two `unit start` invocations
// racing for the same ROADMAP.md item could both pass that scan before
// either created its branch. This registry adds a single JSON file
// (`circuit-claims.json`) in the git common dir (shared by every
// worktree of the same repo, runtime/lib/git.mjs#gitCommonDir) plus an
// exclusive-create lock file around every read-modify-write, so a claim
// is atomic across worktrees/processes instead of best-effort.
import { isLockContention } from "../lib/lock.mjs";
import { writeFileSync, openSync, closeSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { gitCommonDir } from "../lib/git.mjs";
import { readTextIfExists } from "../lib/fs-safe.mjs";

export class ClaimLockContentionError extends Error {}
export class ClaimConflictError extends Error {}

function registryPath(root) {
  return join(gitCommonDir(root), "circuit-claims.json");
}

function lockPath(root) {
  return join(gitCommonDir(root), "circuit-claims.lock");
}

/**
 * Acquires an exclusive lock (atomic O_CREAT|O_EXCL), runs `fn(claims)`
 * with the current registry, writes back whatever `fn` returns, then
 * releases the lock. Fails fast (ClaimLockContentionError) after
 * `retries` short attempts rather than blocking indefinitely -- a
 * genuinely stuck lock (crashed process) must surface as an error, not
 * a silent hang.
 */
export function withClaimsLock(root, fn, { retries = 20, retryDelayMs = 10 } = {}) {
  const lock = lockPath(root);
  let fd = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      fd = openSync(lock, "wx");
      break;
    } catch (error) {
      if (!isLockContention(error)) throw error;
      if (attempt === retries) {
        throw new ClaimLockContentionError(`could not acquire claims lock at ${lock} after ${retries} attempts`);
      }
      busyWait(retryDelayMs);
    }
  }
  try {
    const path = registryPath(root);
    const text = readTextIfExists(path);
    const claims = text === null ? { schemaVersion: 1, claims: [] } : JSON.parse(text);
    const updated = fn(claims);
    writeFileSync(path, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
    return updated;
  } finally {
    closeSync(fd);
    unlinkSync(lock);
  }
}

function busyWait(ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    // Synchronous short spin: Node has no sync sleep primitive, and this
    // lock is held for a few JSON read/write calls at most.
  }
}

/** Read-only snapshot of current claims (no lock: for inspection only). */
export function readClaims(root) {
  const path = registryPath(root);
  const text = readTextIfExists(path);
  return text === null ? [] : JSON.parse(text).claims;
}

/**
 * Atomically checks that none of `items` is already claimed by another
 * unit, then records a new claim for `unitId`/`branch` covering all of
 * them. Throws ClaimConflictError (and records nothing) on any overlap.
 */
export function claimItems(root, unitId, branch, items, lockOptions = {}) {
  return withClaimsLock(
    root,
    (registry) => {
      const conflicts = [];
      for (const claim of registry.claims) {
        for (const item of items) {
          if (claim.items.includes(item)) {
            conflicts.push(`'${item}' is already claimed by '${claim.unitId}' (${claim.branch})`);
          }
        }
      }
      if (conflicts.length > 0) {
        throw new ClaimConflictError(conflicts.join("; "));
      }
      registry.claims.push({ unitId, branch, items, claimedAt: new Date().toISOString() });
      return registry;
    },
    lockOptions,
  );
}

/** Releases the claim for `unitId` (close/cleanup). No-op if absent. */
export function releaseClaim(root, unitId) {
  return withClaimsLock(root, (registry) => {
    registry.claims = registry.claims.filter((c) => c.unitId !== unitId);
    return registry;
  });
}
