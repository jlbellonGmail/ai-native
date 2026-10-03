// M5 prerequisite (PAR-BUMP-FOOTPRINT, DIS-02 "PR de bump (2 archivos)").
// A routine platform bump may change ONLY the lock and the pinned caller
// workflow reference. Anything else in the target is refused, so a bump PR is
// reviewable at a glance and cannot smuggle other edits (the anti-drift role
// of upgrade-template-consumer.ps1, without copying files).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readLock, LOCK_FILE } from "../bootstrap/install.mjs";
import { validate } from "../lib/schema-lite.mjs";

export const CALLER_WORKFLOW = ".github/workflows/ai-native.yml";
export const BUMP_ALLOWED_PATHS = Object.freeze([LOCK_FILE, CALLER_WORKFLOW]);
export class BumpError extends Error {}

const lockSchema = JSON.parse(readFileSync(new URL("../../contracts/lock.schema.json", import.meta.url), "utf8"));
const SHA_REF = /(uses:\s*[^\s@]+@)[0-9a-f]{40}/;

/** Throws unless every path is one of the two allowed bump files. */
export function assertBumpFootprint(paths) {
  const extra = paths.filter((p) => !BUMP_ALLOWED_PATHS.includes(p.replace(/\\/g, "/")));
  if (extra.length) throw new BumpError(`bump may only change ${BUMP_ALLOWED_PATHS.join(" and ")}; refused: ${extra.join(", ")}`);
  if (paths.length > 2) throw new BumpError(`bump footprint is at most 2 files, got ${paths.length}`);
}

/**
 * Pure plan: returns { files: { path: newContent } } without touching disk.
 * `release` = { version, commit, digest, repo? } of the target platform.
 */
export function planBump({ projectRoot, release, callerSha = null }) {
  const { lock, errors } = readLock(projectRoot);
  if (errors.length) throw new BumpError(errors.join("; "));
  if (lock.platform.version === release.version && lock.platform.digest === release.digest) throw new BumpError(`already pinned to ${release.version}`);
  const next = { ...lock, platform: { ...lock.platform, version: release.version, commit: release.commit, digest: release.digest, ...(release.repo ? { repo: release.repo } : {}), channel: /-rc\./.test(release.version) ? "rc" : "stable" } };
  const verrors = validate(next, lockSchema);
  if (verrors.length) throw new BumpError(`target release does not produce a valid lock: ${verrors.join("; ")}`);
  const files = { [LOCK_FILE]: `${JSON.stringify(next, null, 2)}\n` };
  const callerPath = join(projectRoot, CALLER_WORKFLOW);
  if (callerSha && existsSync(callerPath)) {
    const text = readFileSync(callerPath, "utf8");
    if (!SHA_REF.test(text)) throw new BumpError(`${CALLER_WORKFLOW} has no SHA-pinned 'uses:' to update`);
    const updated = text.replace(SHA_REF, `$1${callerSha}`);
    if (updated !== text) files[CALLER_WORKFLOW] = updated;
  }
  assertBumpFootprint(Object.keys(files));
  return { files, from: lock.platform.version, to: release.version };
}

export function applyBump(args) {
  const plan = planBump(args);
  for (const [rel, content] of Object.entries(plan.files)) writeFileSync(join(args.projectRoot, rel), content, "utf8");
  return { changed: Object.keys(plan.files), from: plan.from, to: plan.to };
}
