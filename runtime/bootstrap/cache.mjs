// Content-addressed cache (M4.1). Layout under the cache root:
//   blobs/sha256/<hex>          raw bundle bytes, name == sha256(content)
//   releases/<hex>/             extracted release + `.manifest.json`
//   tmp/                        staging; never read as an entry
//   state/<projectKey>.json     activation history (rollback)
//
// Properties, each backed by a PAR-CACHE-* test:
//   - verify before use: every read re-hashes (corrupt blob or release
//     file -> CacheCorruptError, entry evicted; never returned).
//   - atomic publish: content is staged in tmp/ then renamed into place,
//     so a crash/kill leaves either nothing or a complete entry
//     (PAR-CACHE-PARTIAL); stale tmp/ debris is swept, never trusted.
//   - concurrent writers converge: the destination name is the content
//     hash, so two writers produce byte-identical results and a lost
//     rename race is a success, not an error (PAR-CACHE-CONCURRENT).
//   - digests are validated against a strict pattern before they touch a
//     path, and extraction targets are re-checked to stay under the
//     root (PAR-CACHE-TRAVERSAL).
import { createHash, randomBytes } from "node:crypto";
import {
  existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync, readdirSync, statSync,
} from "node:fs";
import { join, resolve, sep, dirname } from "node:path";
import { homedir } from "node:os";
import { safeEntryPath } from "./tar.mjs";

export class CacheCorruptError extends Error {}
export class CacheMissError extends Error {}

const DIGEST_RE = /^sha256:([0-9a-f]{64})$/;
const MANIFEST = ".manifest.json";

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function defaultCacheRoot(env = process.env) {
  return env.AI_NATIVE_CACHE || join(homedir(), ".ai-native", "cache");
}

export function hexOf(digest) {
  const m = DIGEST_RE.exec(digest);
  if (!m) throw new Error(`invalid digest: ${JSON.stringify(digest)}`);
  return m[1];
}

function stage(root) {
  const dir = join(root, "tmp");
  mkdirSync(dir, { recursive: true });
  return join(dir, `${process.pid}-${randomBytes(6).toString("hex")}`);
}

function underRoot(root, target) {
  const base = resolve(root) + sep;
  if (!resolve(target).startsWith(base)) throw new Error(`path escapes cache root: ${target}`);
  return target;
}

export function blobPath(root, digest) {
  return underRoot(root, join(root, "blobs", "sha256", hexOf(digest)));
}

export function releaseDir(root, digest) {
  return underRoot(root, join(root, "releases", hexOf(digest)));
}

function publish(from, to) {
  mkdirSync(dirname(to), { recursive: true });
  try {
    renameSync(from, to);
  } catch (error) {
    // Lost a race to an identical writer (content-addressed => identical).
    if (existsSync(to)) rmSync(from, { recursive: true, force: true });
    else throw error;
  }
}

/** Stores bytes under their own digest; returns the `sha256:` digest. */
export function putBlob(root, bytes) {
  const digest = `sha256:${sha256(bytes)}`;
  const dest = blobPath(root, digest);
  if (existsSync(dest)) return digest;
  const tmp = stage(root);
  writeFileSync(tmp, bytes);
  publish(tmp, dest);
  return digest;
}

/** Returns verified bytes; evicts and throws on corruption. */
export function getBlob(root, digest) {
  const path = blobPath(root, digest);
  if (!existsSync(path)) throw new CacheMissError(`not in cache: ${digest}`);
  const bytes = readFileSync(path);
  if (`sha256:${sha256(bytes)}` !== digest) {
    rmSync(path, { force: true });
    throw new CacheCorruptError(`blob does not match its digest (evicted): ${digest}`);
  }
  return bytes;
}

export function hasBlob(root, digest) {
  return existsSync(blobPath(root, digest));
}

/**
 * Extracts `files` (Map path -> Buffer, already traversal-checked by
 * readTar but re-checked here, since this is the write boundary) into
 * releases/<digest>/ atomically, with a manifest of per-file hashes.
 */
export function putRelease(root, digest, files) {
  const dest = releaseDir(root, digest);
  if (existsSync(dest)) return dest;
  const tmp = stage(root);
  const manifest = {};
  for (const [name, content] of files) {
    safeEntryPath(name);
    const target = underRoot(tmp, join(tmp, ...name.split("/")));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
    manifest[name] = sha256(content);
  }
  writeFileSync(join(tmp, MANIFEST), JSON.stringify(manifest, null, 2));
  publish(tmp, dest);
  return dest;
}

/** Hash-checks every file of an extracted release against its manifest. */
export function verifyRelease(root, digest) {
  const dir = releaseDir(root, digest);
  const manifestPath = join(dir, MANIFEST);
  if (!existsSync(manifestPath)) throw new CacheMissError(`release not in cache: ${digest}`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const bad = [];
  for (const [name, hash] of Object.entries(manifest)) {
    const file = join(dir, ...name.split("/"));
    if (!existsSync(file) || sha256(readFileSync(file)) !== hash) bad.push(name);
  }
  const known = new Set(Object.keys(manifest));
  const extra = listFiles(dir, dir).filter((p) => p !== MANIFEST && !known.has(p));
  if (bad.length || extra.length) {
    rmSync(dir, { recursive: true, force: true });
    throw new CacheCorruptError(
      `release ${digest} failed verification (evicted): modified/missing=[${bad}] unexpected=[${extra}]`,
    );
  }
  return dir;
}

function listFiles(dir, base, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, base, out);
    else out.push(full.slice(base.length + 1).split(sep).join("/"));
  }
  return out;
}

export function listReleases(root) {
  const dir = join(root, "releases");
  return existsSync(dir) ? readdirSync(dir).filter((n) => /^[0-9a-f]{64}$/.test(n)).map((h) => `sha256:${h}`) : [];
}

/** Removes tmp/ entries older than `maxAgeMs` (crashed writers). */
export function sweepStaging(root, maxAgeMs = 60 * 60 * 1000, now = Date.now()) {
  const dir = join(root, "tmp");
  if (!existsSync(dir)) return 0;
  let removed = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (now - statSync(path).mtimeMs >= maxAgeMs) {
      rmSync(path, { recursive: true, force: true });
      removed += 1;
    }
  }
  return removed;
}
