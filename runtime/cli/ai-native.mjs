#!/usr/bin/env node
// ai-native — the one public command.   ai-native init   (inside any Git repository, empty or not)
//
// This file is published as a release asset (ai-native-cli.mjs, sigstore-attested like every other asset) and is the ONLY code that
// runs before anything is verified, so it is deliberately small, dependency-free and does exactly this:
//   1. find the release (the one the lock pins, or the latest STABLE + immutable one on GitHub Releases of the official repository),
//   2. download its bundle and require `gh attestation verify --signer-workflow <the release workflow>` to PASS (no flag turns this off),
//   3. unpack it into a private temp directory and hand over to the engine INSIDE that verified bundle
//      (`runtime/bootstrap/cli.mjs adopt`), which does lock + cache + adapters + launcher + verification.
// A release already in the local cache, with the record of its verified attestation, is used with no network (--offline).
// It never evals or pipes remote content: the engine it starts is the bytes the attestation vouched for.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

export const OFFICIAL_REPO = "jlbellonGmail/ai-native";
const STABLE = /^v(\d+)\.(\d+)\.(\d+)$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const VERSION = /^v\d+\.\d+\.\d+(-(alpha|rc)\.\d+)?$/; // also what a lock may pin: repository content is never trusted to build a URL or a file name
const MAX_BYTES = 256 * 1024 * 1024;
const HELP = `ai-native — start a project with the AI-NATIVE platform

  ai-native init [--profile <id>] [--version vX.Y.Z (stable only)] [--offline] [--trust-repo owner/name] [--keep-existing] [--json]
      Run inside a Git repository (empty or not). Fetches the latest stable release, verifies it (sha256 + sigstore attestation +
      revocations), writes ai-native.lock.json, the tool adapters and .ai-native/ai-native.mjs, and checks the result.
      Run it again any time: on an adopted repository it only re-verifies.
  ai-native install      Put this command on your machine (~/.ai-native/bin) so \`ai-native\` works from any directory.
  ai-native version

Needs: Node >= 20, git, and the GitHub CLI (gh), signed in, to verify the release's attestation.`;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const semver = (tag) => STABLE.exec(tag).slice(1).map(Number);
const newer = (a, b) => { const [x, y] = [semver(a), semver(b)]; return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };
export const defaultCache = (env = process.env) => env.AI_NATIVE_CACHE || join(homedir(), ".ai-native", "cache");

class Fail extends Error {}

export async function listReleases({ fetchImpl, slug, env }) {
  const headers = { accept: "application/vnd.github+json", "user-agent": "ai-native-cli" };
  const token = env.GH_TOKEN || env.GITHUB_TOKEN;
  if (token) headers.authorization = `Bearer ${token}`;
  try {
    const res = await fetchImpl(`https://api.github.com/repos/${slug}/releases?per_page=100`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    throw new Fail(`cannot reach GitHub Releases (${error.message}). Offline? \`ai-native init --offline\` uses a release this machine already verified.`);
  }
}

/** A release this command may install on its own: published (not a draft), stable (not a prerelease, plain vX.Y.Z) and affirmed immutable by GitHub. */
const selectable = (r) => Boolean(r) && r.draft === false && r.prerelease === false && STABLE.test(r.tag_name ?? "") && r.immutable === true;

/** The release the person asked for with --version: it must be exactly that tag, selectable, and publish a valid sha256 for its bundle. Returns that digest. */
export function assertPublishable(release, version, slug) {
  const why = (m) => new Fail(`RELEASE_REJECTED: ${version} of ${slug} ${m}`);
  if (!release) throw why("is not among the published releases");
  if (release.tag_name !== version) throw why(`is inconsistent (the API returned ${release.tag_name})`);
  if (release.draft !== false) throw why("is a draft");
  if (release.prerelease !== false) throw why("is a prerelease; only stable releases can be installed by this command");
  if (!STABLE.test(version)) throw why("is not a stable vX.Y.Z version");
  if (release.immutable !== true) throw why("is not an immutable release");
  const asset = (release.assets ?? []).find((a) => a.name === `ai-native-${version}.tar.gz`);
  if (!asset) throw why("has no bundle asset");
  if (!DIGEST.test(asset.digest ?? "")) throw why("publishes no valid sha256 digest for its bundle");
  return asset.digest;
}

/** Highest SemVer among selectable releases (see `selectable`). */
export function pickLatest(list, slug) {
  const ok = list.filter((r) => selectable(r)).sort((a, b) => newer(b.tag_name, a.tag_name));
  if (!ok.length) throw new Fail(`no stable, immutable release found for ${slug}`);
  return ok[0];
}

export async function latestStable({ fetchImpl, slug, env }) {
  const release = pickLatest(await listReleases({ fetchImpl, slug, env }), slug);
  return { version: release.tag_name, release };
}

/** The attestation record the cache keeps for a release, or null. It must name this digest and this source and say it came from `gh attestation verify`. */
export function readRecord(cacheRoot, hex, { digest, slug }) {
  try {
    const r = JSON.parse(readFileSync(join(cacheRoot, "attestations", `${hex}.json`), "utf8"));
    return r.digest === digest && r.repo === slug && r.verifiedBy === "gh attestation verify" && VERSION.test(r.version ?? "") ? r : null;
  } catch {
    return null;
  }
}

/** The release must not be on the published revocations list (highest n, attested). Information that exists but cannot be read fails closed. */
async function assertNotRevoked({ list, slug, version, fetchImpl, spawn, tmp }) {
  const assets = new Map();
  for (const r of list) {
    for (const a of r.assets ?? []) {
      const m = /^revocations-(\d+)\.json$/.exec(a.name ?? "");
      if (m && !assets.has(a.name) && STABLE.test(r.tag_name ?? "")) assets.set(a.name, { n: Number(m[1]), url: `https://github.com/${slug}/releases/download/${r.tag_name}/${a.name}` });
    }
  }
  const top = [...assets.entries()].sort((a, b) => b[1].n - a[1].n)[0];
  if (!top) return;
  let bytes;
  try {
    bytes = await download(fetchImpl, top[1].url, 1024 * 1024);
  } catch (error) {
    throw new Fail(`REVOCATION_UNKNOWN: ${top[0]} could not be read (${error.message}); use --offline to run without that information`);
  }
  const dir = mkdtempSync(join(tmpdir(), "ai-native-rev-"));
  tmp.push(dir);
  const file = join(dir, top[0]);
  writeFileSync(file, bytes);
  verifyAttestation({ spawn, file, slug });
  let entries;
  try {
    entries = JSON.parse(bytes.toString("utf8")).entries;
    if (!Array.isArray(entries)) throw new Error("no entries");
  } catch (error) {
    throw new Fail(`REVOCATION_UNKNOWN: ${top[0]} is not a valid list (${error.message})`);
  }
  const hit = entries.find((e) => e && e.kind === "platform" && e.version === version);
  if (hit) throw new Fail(`REVOKED: ${version} is revoked (${hit.severity ?? "high"}): ${hit.reason}`);
}

/** The record of a release of `slug` at exactly `version` that this machine verified and still holds, or null. */
export function cachedByVersion(cacheRoot, slug, version) {
  const dir = join(cacheRoot, "attestations");
  if (!existsSync(dir)) return null;
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    const hex = name.slice(0, -5);
    const r = readRecord(cacheRoot, hex, { digest: `sha256:${hex}`, slug });
    if (r && r.version === version && existsSync(join(cacheRoot, "blobs", "sha256", hex))) return r;
  }
  return null;
}

/** Highest stable release that this machine already verified and still holds (for --offline). */
export function newestCached(cacheRoot, slug) {
  const dir = join(cacheRoot, "attestations");
  if (!existsSync(dir)) return null;
  const found = [];
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    try {
      const r = JSON.parse(readFileSync(join(dir, name), "utf8"));
      if (r.repo === slug && STABLE.test(r.version) && r.digest === `sha256:${name.slice(0, -5)}` && r.verifiedBy === "gh attestation verify" && existsSync(join(cacheRoot, "blobs", "sha256", name.slice(0, -5)))) found.push(r);
    } catch { /* an unreadable record is not a verification */ }
  }
  return found.sort((a, b) => newer(b.version, a.version))[0] ?? null;
}

/** Strict ustar reader: regular files only, no absolute / `..` / backslash / duplicate paths. Same rules as runtime/bootstrap/tar.mjs (a test keeps them equal). */
export function unpack(gz) {
  let buf;
  try {
    buf = gunzipSync(gz);
  } catch (error) {
    throw new Fail(`bundle rejected: ${error.message}`);
  }
  const files = new Map();
  for (let off = 0; off + 512 <= buf.length;) {
    const h = buf.subarray(off, off + 512);
    if (h.every((b) => b === 0)) break;
    const str = (a, n) => { const s = h.subarray(a, a + n); const z = s.indexOf(0); return s.subarray(0, z === -1 ? n : z).toString("utf8"); };
    let sum = 0;
    for (let i = 0; i < 512; i += 1) sum += i >= 148 && i < 156 ? 32 : h[i];
    if (sum !== parseInt(str(148, 8).trim() || "0", 8)) throw new Fail("bundle rejected: tar header checksum mismatch");
    const name = (str(345, 155) ? `${str(345, 155)}/` : "") + str(0, 100);
    const size = parseInt(str(124, 12).trim() || "0", 8);
    const type = String.fromCharCode(h[156] || 48);
    off += 512;
    if (type !== "5") {
      if (type !== "0") throw new Fail(`bundle rejected: unsupported entry type '${type}' for ${name}`);
      if (!name || /[\0\\]/.test(name) || name.startsWith("/") || /^[A-Za-z]:/.test(name) || name.split("/").some((s) => s === ".." || s === "." || s === "")) throw new Fail(`bundle rejected: unsafe entry path ${JSON.stringify(name)}`);
      if (files.has(name) || off + size > buf.length) throw new Fail(`bundle rejected: duplicate or truncated entry ${name}`);
      files.set(name, buf.subarray(off, off + size));
    }
    off += Math.ceil(size / 512) * 512;
  }
  if (!files.size) throw new Fail("bundle rejected: empty archive");
  return files;
}

async function download(fetchImpl, url, limit = MAX_BYTES) {
  let res;
  try {
    res = await fetchImpl(url, { redirect: "follow", headers: { "user-agent": "ai-native-cli" } });
  } catch (error) {
    throw new Fail(`cannot download ${url}: ${error.message}`);
  }
  if (!res.ok) throw new Fail(`cannot download ${url}: HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > limit) throw new Fail(`${url}: response exceeds ${limit} bytes`);
  return bytes;
}

/** Attestation is mandatory and has no bypass: missing `gh`, a failed verification or a different signer workflow all stop the run. */
export function verifyAttestation({ spawn, file, slug }) {
  const r = spawn("gh", ["attestation", "verify", file, "--repo", slug, "--signer-workflow", `${slug}/.github/workflows/release.yml`], { encoding: "utf8" });
  if (r.error) throw new Fail(`ATTESTATION_UNAVAILABLE: the GitHub CLI (gh) is needed to verify the release (${r.error.message}). Install it from https://cli.github.com and run \`gh auth login\`.`);
  if (r.status !== 0) throw new Fail(`ATTESTATION_FAILED: ${(r.stderr || r.stdout || "").trim().split("\n").pop()}`);
}

function engineArgs(opts, extra) {
  const a = ["adopt", "--project", opts.project, "--cache", opts.cache, "--repo", `github:${opts.slug}`, ...extra];
  for (const [flag, v] of [["--profile", opts.profile], ["--version", opts.version]]) if (v) a.push(flag, v);
  for (const [flag, on] of [["--offline", opts.offline], ["--keep-existing", opts.keepExisting], ["--json", opts.json]]) if (on) a.push(flag);
  return a;
}

function parse(argv) {
  const o = { command: argv[0], offline: false, keepExisting: false, json: false };
  for (let i = 1; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--offline") o.offline = true;
    else if (a === "--keep-existing") o.keepExisting = true;
    else if (a === "--json") o.json = true;
    else if (a === "--profile" || a === "--version" || a === "--trust-repo") {
      if (!argv[i + 1] || argv[i + 1].startsWith("--")) throw new Fail(`${a} needs a value`);
      o[a === "--trust-repo" ? "trustRepo" : a.slice(2)] = argv[++i];
    } else throw new Fail(`unknown option: ${a}`);
  }
  if (o.version && !STABLE.test(o.version)) throw new Fail(`invalid --version: ${o.version} (only stable releases, vX.Y.Z, can be selected)`);
  if (o.trustRepo && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(o.trustRepo)) throw new Fail(`invalid --trust-repo: ${o.trustRepo}`);
  return o;
}

/** deps: fetchImpl, spawn, env, cwd, out, err. Returns the exit code. */
export async function main(argv, { fetchImpl = fetch, spawn = spawnSync, env = process.env, cwd = process.cwd(), out = console.log, err = console.error, repo = OFFICIAL_REPO, self = fileURLToPath(import.meta.url) } = {}) {
  const command = argv[0];
  if (!command || command === "help" || command === "--help" || command === "-h") { out(HELP); return command ? 0 : 2; }
  if (command === "version" || command === "--version") { out(`ai-native cli (${repo})`); return 0; }
  const tmp = [];
  try {
    if (command === "install") return install({ self, env, out });
    if (command !== "init") throw new Fail(`unknown command: ${command}; try \`ai-native help\``);
    const o = parse(argv);
    const top = spawn("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" });
    if (top.error || top.status !== 0) throw new Fail("not inside a Git repository: run `git init` (or clone your repository) first");
    o.project = resolve(top.stdout.trim());
    o.cache = resolve(defaultCache(env));
    o.slug = repo;

    // already adopted: the lock decides which release; a new repository: --version, or the latest stable
    let digest = null;
    const lockFile = join(o.project, "ai-native.lock.json");
    if (existsSync(lockFile)) {
      let pinned;
      try {
        const p = JSON.parse(readFileSync(lockFile, "utf8")).platform;
        const profiles = JSON.parse(readFileSync(lockFile, "utf8")).profiles;
        pinned = { profiles: Array.isArray(profiles) ? profiles : [], version: p.version, digest: p.digest, slug: /^github:([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)$/.exec(p.repo)?.[1] };
        if (!pinned.slug || !DIGEST.test(pinned.digest) || !VERSION.test(pinned.version)) throw new Error("incomplete or malformed platform");
      } catch (error) {
        throw new Fail(`ai-native.lock.json is not usable (${error.message}); fix or remove it`);
      }
      // The lock is repository content: it cannot choose whom this command trusts. Another source needs the person's explicit word.
      if (pinned.slug !== repo && o.trustRepo !== pinned.slug) throw new Fail(`TRUST_ROOT: this repository is pinned to releases of ${pinned.slug}, but this command trusts only ${repo}. If you trust ${pinned.slug}, say so: ai-native init --trust-repo ${pinned.slug}`);
      if (o.version && o.version !== pinned.version) throw new Fail(`--version ${o.version} conflicts with the release this repository is pinned to (${pinned.version}); bump the lock instead`);
      if (o.profile && !pinned.profiles.includes(o.profile)) throw new Fail(`PROFILE_CONFLICT: --profile ${o.profile} contradicts the profile this repository is pinned to (${pinned.profiles.join(", ") || "none"}); the profile is changed in ai-native.lock.json, not by this command`);
      o.version = pinned.version;
      digest = pinned.digest;
      o.slug = pinned.slug;
    } else if (o.trustRepo) throw new Fail("--trust-repo only applies to a repository that is already pinned to another source");

    let release = null;
    if (!o.offline) {
      const list = await listReleases({ fetchImpl, slug: o.slug, env });
      if (!digest && !o.version) {
        release = pickLatest(list, o.slug);
        o.version = release.tag_name;
      } else if (!digest) release = list.find((r) => r.tag_name === o.version) ?? null;
      if (!digest) digest = assertPublishable(release, o.version, o.slug);
      await assertNotRevoked({ list, slug: o.slug, version: o.version, fetchImpl, spawn, tmp });
    } else if (!digest) {
      const c = o.version ? cachedByVersion(o.cache, o.slug, o.version) : newestCached(o.cache, o.slug);
      if (!c) throw new Fail(`OFFLINE: this machine has no verified ${o.version ?? "release"} in its cache; run \`ai-native init\` once with network access`);
      o.version = c.version;
      digest = c.digest;
    }

    // One path for the cache and the network: the engine always starts from a bundle whose sha256 was just checked and whose attestation is
    // on record, unpacked into a private temp directory. The cache's own unpacked copy of a release is never executed from here.
    const work = mkdtempSync(join(tmpdir(), "ai-native-init-"));
    tmp.push(work);
    const name = `ai-native-${o.version}.tar.gz`;
    const bundle = join(work, name);
    const hex = digest?.replace(/^sha256:/, "");
    let record = hex ? readRecord(o.cache, hex, { digest, slug: o.slug }) : null;
    const blob = hex ? join(o.cache, "blobs", "sha256", hex) : null;
    let bytes = null;
    if (record && existsSync(blob)) {
      bytes = readFileSync(blob);
      if (`sha256:${sha256(bytes)}` !== digest) throw new Fail(`CACHE_CORRUPT: the cached bundle for ${o.version} does not match its digest; remove ${blob} and run again with network access`);
    }
    if (!bytes) {
      if (o.offline) throw new Fail(`OFFLINE: ${o.version} is not in the cache with a verified attestation; run \`ai-native init\` once with network access`);
      bytes = await download(fetchImpl, `https://github.com/${o.slug}/releases/download/${o.version}/${name}`);
      const actual = `sha256:${sha256(bytes)}`;
      if (digest && actual !== digest) throw new Fail(`DIGEST_MISMATCH: ${name} is ${actual}, expected ${digest}`);
      writeFileSync(bundle, bytes);
      verifyAttestation({ spawn, file: bundle, slug: o.slug });
      record = { digest: actual, repo: o.slug, version: o.version, verifiedBy: "gh attestation verify", signerWorkflow: `${o.slug}/.github/workflows/release.yml`, verifiedAt: new Date().toISOString() };
    } else writeFileSync(bundle, bytes);
    const files = unpack(bytes);
    const platform = JSON.parse(files.get("platform.json")?.toString("utf8") ?? "{}");
    if (platform.version !== o.version) throw new Fail(`bundle says ${platform.version}, release is ${o.version}`);
    if (!files.has("runtime/bootstrap/adopt.mjs")) throw new Fail(`${o.version} predates \`ai-native init\` (it ships no engine for it): ${existsSync(lockFile) ? "this repository is pinned to it; bump the lock to a newer release first" : "use a newer release"}`);
    const engine = join(work, "release");
    for (const [path, content] of files) {
      mkdirSync(dirname(join(engine, path)), { recursive: true });
      writeFileSync(join(engine, path), content);
    }
    const recordFile = join(work, "attestation.json");
    writeFileSync(recordFile, JSON.stringify(record));
    const extra = ["--bundle", bundle, "--attestation-record", recordFile];
    const run = spawn(process.execPath, [join(engine, "runtime", "bootstrap", "cli.mjs"), ...engineArgs(o, extra)], { stdio: "inherit", env });
    return run.status ?? 1;
  } catch (error) {
    if (!(error instanceof Fail)) throw error;
    err(`STATUS: FAILED\nERROR: ${error.message}`);
    return 1;
  } finally {
    for (const dir of tmp) rmSync(dir, { recursive: true, force: true });
  }
}

/** Copy this file to ~/.ai-native/bin and write the `ai-native` / `ai-native.cmd` shims. Does not edit PATH: it says what to add. */
function install({ self, env, out }) {
  const bin = join(env.AI_NATIVE_HOME || join(homedir(), ".ai-native"), "bin");
  mkdirSync(bin, { recursive: true });
  const script = join(bin, "ai-native.mjs");
  if (resolve(self) !== resolve(script)) copyFileSync(self, script);
  writeFileSync(join(bin, "ai-native"), `#!/bin/sh\nexec node "${script.split("\\").join("/")}" "$@"\n`, { mode: 0o755 });
  writeFileSync(join(bin, "ai-native.cmd"), `@echo off\r\nnode "${script}" %*\r\n`);
  out(`Installed ai-native in ${bin}`);
  out(process.platform === "win32" ? `Add it to your PATH (once):  [Environment]::SetEnvironmentVariable('Path', $env:Path + ';${bin}', 'User')` : `Add it to your PATH (once):  export PATH="${bin}:$PATH"`);
  return 0;
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) process.exit(await main(process.argv.slice(2)));
