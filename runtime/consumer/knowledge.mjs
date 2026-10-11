#!/usr/bin/env node
// Deterministic resolver for the knowledge a release ships (knowledge/sdd/).
// A consumer never keeps a copy: AGENTS.md, the sdd skill and the commands name a
// reference such as `sdd/methodology/levels.md`, and this resolves it from the
// release pinned by ai-native.lock.json (verified against the content-addressed
// cache, so it works offline). Portable: no absolute path, no tool-specific home.
//   ai-native run -- knowledge <ref>          print the file (the release runs itself)
//   node runtime/consumer/knowledge.mjs --project <dir> [--cache <dir>] <ref>   resolve through the lock
// Outcomes are explicit, never a silent best effort:
//   OK | NOT_ADOPTED | MISSING_REFERENCE | INCOMPATIBLE_VERSION
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { readLock } from "../bootstrap/install.mjs";
import { CacheCorruptError, CacheMissError, defaultCacheRoot, verifyRelease } from "../bootstrap/cache.mjs";

export const KNOWLEDGE_STATUS = Object.freeze(["OK", "NOT_ADOPTED", "MISSING_REFERENCE", "INCOMPATIBLE_VERSION"]);
export const SUPPORTED_SCHEMA = 1;
const REF_RE = /^[a-z][a-z0-9-]*\/[A-Za-z0-9_][A-Za-z0-9_./-]*$/;
const semver = (v) => v.split(".").map(Number);
const atLeast = (have, want) => {
  const [a, b] = [semver(have), semver(want)];
  for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};
const result = (status, detail, extra = {}) => ({ status, detail, ...extra });

/** Lock -> verified release directory in the cache. Hash-checks every file (CacheCorruptError evicts). */
export function locateRelease({ projectRoot, cacheRoot = defaultCacheRoot() }) {
  const { lock, errors } = readLock(projectRoot);
  if (errors.length) return result("NOT_ADOPTED", errors.join("; "));
  try {
    return result("OK", lock.platform.version, { dir: verifyRelease(cacheRoot, lock.platform.digest), platformVersion: lock.platform.version.replace(/^v/, "").replace(/-.*$/, "") });
  } catch (error) {
    if (error instanceof CacheMissError || error instanceof CacheCorruptError) return result("MISSING_REFERENCE", `${error.message}; run \`ai-native sync\` (needs the network once, then works offline)`);
    throw error;
  }
}

/** Package descriptor compatibility against this release (and the pinned platform version when known). */
export function checkPackage(releaseRoot, pkg = "sdd", { platformVersion } = {}) {
  const descriptor = join(releaseRoot, "knowledge", pkg, "KNOWLEDGE.json");
  if (!existsSync(descriptor)) return result("MISSING_REFERENCE", `knowledge package '${pkg}' is not in this release`);
  let meta;
  try {
    meta = JSON.parse(readFileSync(descriptor, "utf8"));
  } catch (error) {
    return result("INCOMPATIBLE_VERSION", `knowledge/${pkg}/KNOWLEDGE.json is not valid JSON (${error.message})`);
  }
  if (meta.schemaVersion !== SUPPORTED_SCHEMA) return result("INCOMPATIBLE_VERSION", `knowledge/${pkg} schemaVersion ${meta.schemaVersion} is not supported (this resolver reads ${SUPPORTED_SCHEMA}); update the resolver (bump the lock)`);
  const workflow = join(releaseRoot, "contracts", "sdd-workflow.json");
  const have = existsSync(workflow) ? JSON.parse(readFileSync(workflow, "utf8")).schemaVersion : undefined;
  if (have !== meta.requires?.workflowContract) return result("INCOMPATIBLE_VERSION", `knowledge/${pkg} needs workflow contract ${meta.requires?.workflowContract}, the release has ${have}`);
  if (platformVersion && !atLeast(platformVersion, meta.requires.minPlatform)) return result("INCOMPATIBLE_VERSION", `knowledge/${pkg} needs platform >= ${meta.requires.minPlatform}, the lock pins ${platformVersion}`);
  return result("OK", `${pkg}@${meta.version}`, { meta });
}

/** Resolves the pinned release and checks every knowledge package it ships against the resolver and the pinned platform version. */
export function checkReference({ projectRoot, cacheRoot = defaultCacheRoot(), packages = ["sdd"] }) {
  const located = locateRelease({ projectRoot, cacheRoot: cacheRoot ?? defaultCacheRoot() });
  if (located.status !== "OK") return located;
  for (const pkg of packages) {
    const checked = checkPackage(located.dir, pkg, { platformVersion: located.platformVersion });
    if (checked.status !== "OK") return checked;
  }
  return result("OK", located.detail);
}

/** ref: `<package>/<path inside knowledge/<package>>`. Returns the file content or an explicit failure. */
export function resolveKnowledge({ releaseRoot, ref, platformVersion }) {
  if (typeof ref !== "string" || !REF_RE.test(ref) || ref.split("/").includes("..")) return result("MISSING_REFERENCE", `invalid knowledge reference '${ref}'`);
  const pkg = ref.split("/")[0];
  const compat = checkPackage(releaseRoot, pkg, { platformVersion });
  if (compat.status !== "OK") return compat;
  const base = join(releaseRoot, "knowledge");
  const target = resolve(base, ref);
  if (!existsSync(target)) return result("MISSING_REFERENCE", `knowledge/${ref} is not in this release`);
  // symlinks are never shipped, but the boundary is enforced on the real path anyway
  const real = realpathSync(target);
  const rel = relative(realpathSync(base), real);
  if (rel.startsWith("..") || rel.split(sep).includes("..")) return result("MISSING_REFERENCE", `knowledge/${ref} resolves outside the release`);
  return result("OK", compat.detail, { path: real, content: readFileSync(real, "utf8") });
}

function main() {
  const argv = process.argv.slice(2);
  const value = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : undefined);
  const flagValues = new Set([value("--project"), value("--cache")].filter(Boolean));
  const ref = argv.find((a) => !a.startsWith("--") && !flagValues.has(a)) ?? "sdd/README.md";
  const here = dirname(fileURLToPath(import.meta.url));
  let releaseRoot = resolve(here, "..", "..");
  let platformVersion;
  if (value("--project")) {
    const located = locateRelease({ projectRoot: resolve(value("--project")), cacheRoot: value("--cache") ?? defaultCacheRoot() });
    if (located.status !== "OK") return finish(located);
    ({ dir: releaseRoot, platformVersion } = located);
  } else {
    const { lock } = readLock(process.cwd());
    if (lock) platformVersion = lock.platform.version.replace(/^v/, "").replace(/-.*$/, "");
  }
  return finish(resolveKnowledge({ releaseRoot, ref, platformVersion }));
}

function finish(outcome) {
  if (outcome.status === "OK") {
    process.stdout.write(outcome.content);
    process.exit(0);
  }
  console.error(`${outcome.status}: ${outcome.detail}`);
  process.exit(1);
}

const isMain = process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);
if (isMain) main();
