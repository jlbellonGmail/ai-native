#!/usr/bin/env node
// ai-native — the one public command.   ai-native init   (inside any Git repository, empty or not)
//
// This file is published as a release asset (ai-native-cli.mjs, sigstore-attested like every other asset) and is the ONLY code that
// runs before anything is verified, so it is deliberately small, dependency-free and does exactly this:
//   1. find the release (the one the lock pins; the latest STABLE + immutable one on GitHub Releases of the official repository for a new
//      repository, for `upgrade` and for `self-update`),
//   2. download it and require `gh attestation verify --signer-workflow <the release workflow>` to PASS (no flag turns this off),
//   3. check the CLI <-> PLATFORM contract (platform.json `bootstrap`) and the revocations of the release AND of this CLI,
//   4. unpack the bundle into a private temp directory and hand over to the engine INSIDE that verified bundle
//      (`runtime/bootstrap/cli.mjs adopt|upgrade|detach`): lock, cache, adapters, launcher, verification all live there, not here.
// A release already in the local cache, with the record of its verified attestation, is used with no network (--offline).
// It never evals or pipes remote content: the engine it starts is the bytes the attestation vouched for.
// It also manages itself on this machine: install, self-update (same checks, atomic, never a downgrade), uninstall.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

export const CLI_VERSION = "v3.4.3"; // the tag of the release that publishes this file, prereleases included (the release build refuses a mismatch)
export const CLI_PROTOCOL = 1; // launcher -> engine interface; platform.json `bootstrap.protocol` is what a release needs of it
export const CLI_CAPABILITIES = ["adopt", "upgrade", "detach"]; // what this CLI can do before trust exists; platform.json `bootstrap.requiredCapabilities`
export const OFFICIAL_REPO = "jlbellonGmail/ai-native";
const STABLE = /^v(\d+)\.(\d+)\.(\d+)$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const VERSION = /^v\d+\.\d+\.\d+(-(alpha|rc)\.\d+)?$/; // also what a lock may pin: repository content is never trusted to build a URL or a file name
const MARKER = /^export const CLI_VERSION = "(v\d+\.\d+\.\d+(?:-(?:alpha|rc)\.\d+)?)";/m; // = runtime/release/cli-version.mjs DECLARATION (a test keeps them equal)
const CLI_ASSET = "ai-native-cli.mjs";
const MAX_BYTES = 256 * 1024 * 1024;
const HELP = `ai-native — start a project with the AI-NATIVE platform

  ai-native install                 Put this command on your machine (~/.ai-native/bin), once. Never installs an older one over a newer one.
  ai-native init [--profile <id>] [--version vX.Y.Z (stable only)] [--offline] [--trust-repo owner/name] [--keep-existing] [--json]
                                    New repository: fetch the latest stable release, verify it (sha256 + sigstore attestation + revocations),
                                    write ai-native.lock.json, the tool adapters and .ai-native/ai-native.mjs, and check the result.
                                    Adopted repository: the lock decides; it only re-verifies. Safe to run again.
  ai-native upgrade [--to vX.Y.Z] [--offline] [--json]
                                    Move THIS repository to the latest stable release (or --to). Nothing ever upgrades by itself. Never a downgrade.
  ai-native detach [--keep-modified] [--offline]
                                    Take ai-native out of THIS repository: only what ai-native wrote, never your files. Works whatever release the
                                    repository is pinned to (even a revoked or older one); runs the newest verified release that ships it.
  ai-native self-update [--check]   Update this command (same verification as a release; atomic; never a downgrade). --check only reports.
  ai-native uninstall [--purge-cache]  Remove this command from this machine. Repositories are not touched.
  ai-native --version               CLI: vX.Y.Z   (inside an adopted repository: CLI: vX.Y.Z | PLATFORM: vA.B.C)

Needs: Node >= 20, git, and the GitHub CLI (gh), signed in, to verify releases.`;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const key = (tag) => { const m = /^v(\d+)\.(\d+)\.(\d+)(?:-(alpha|rc)\.(\d+))?$/.exec(tag); return [+m[1], +m[2], +m[3], m[4] === undefined ? 2 : m[4] === "rc" ? 1 : 0, +(m[5] ?? 0)]; };
/** Version order, never textual: alpha.N < rc.N < stable of the same X.Y.Z. */
export const cmp = (a, b) => { const [x, y] = [key(a), key(b)]; for (let i = 0; i < 5; i += 1) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
export const defaultCache = (env = process.env) => env.AI_NATIVE_CACHE || join(homedir(), ".ai-native", "cache");
const home = (env) => env.AI_NATIVE_HOME || join(homedir(), ".ai-native");

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
    throw new Fail(`cannot reach GitHub Releases (${error.message}). Offline? Nothing was changed. \`--offline\` uses a release this machine already verified.`);
  }
}

/** A release this command may install on its own: published (not a draft), stable (not a prerelease, plain vX.Y.Z) and affirmed immutable by GitHub. */
const selectable = (r) => Boolean(r) && r.draft === false && r.prerelease === false && STABLE.test(r.tag_name ?? "") && r.immutable === true;

/** The release the person asked for with --version / --to: it must be exactly that tag, selectable, and publish a valid sha256 for `assetName`. Returns that digest. */
export function assertPublishable(release, version, slug, assetName = `ai-native-${version}.tar.gz`) {
  const why = (m) => new Fail(`RELEASE_REJECTED: ${version} of ${slug} ${m}`);
  if (!release) throw why("is not among the published releases");
  if (release.tag_name !== version) throw why(`is inconsistent (the API returned ${release.tag_name})`);
  if (release.draft !== false) throw why("is a draft");
  if (release.prerelease !== false) throw why("is a prerelease; only stable releases can be installed by this command");
  if (!STABLE.test(version)) throw why("is not a stable vX.Y.Z version");
  if (release.immutable !== true) throw why("is not an immutable release");
  const asset = (release.assets ?? []).find((a) => a.name === assetName);
  if (!asset) throw why(`has no ${assetName === CLI_ASSET ? "CLI" : "bundle"} asset`);
  if (!DIGEST.test(asset.digest ?? "")) throw why(`publishes no valid sha256 digest for ${assetName === CLI_ASSET ? "the CLI" : "its bundle"}`);
  return asset.digest;
}

/** Highest SemVer among selectable releases (see `selectable`). */
export function pickLatest(list, slug) {
  const ok = list.filter((r) => selectable(r)).sort((a, b) => cmp(b.tag_name, a.tag_name));
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

/** The highest attested `<prefix>-<n>.json` among the releases, as its entries (or null if none is published). Information that exists but cannot be read fails closed. */
async function revocationEntries({ list, slug, prefix, fetchImpl, spawn, tmp }) {
  const re = new RegExp(`^${prefix}-(\\d+)\\.json$`);
  const assets = new Map();
  for (const r of list) {
    for (const a of r.assets ?? []) {
      const m = re.exec(a.name ?? "");
      if (m && !assets.has(a.name) && STABLE.test(r.tag_name ?? "")) assets.set(a.name, { n: Number(m[1]), url: `https://github.com/${slug}/releases/download/${r.tag_name}/${a.name}` });
    }
  }
  const top = [...assets.entries()].sort((a, b) => b[1].n - a[1].n)[0];
  if (!top) return null;
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
  try {
    const entries = JSON.parse(bytes.toString("utf8")).entries;
    if (!Array.isArray(entries)) throw new Error("no entries");
    return entries;
  } catch (error) {
    throw new Fail(`REVOCATION_UNKNOWN: ${top[0]} is not a valid list (${error.message})`);
  }
}

/**
 * Neither the release (`revocations-<n>.json`, kind platform) nor this CLI (`cli-revocations-<n>.json`, kind cli) may be revoked. The CLI list is its own
 * asset series of the same release workflow, so a PLATFORM engine from before it existed never meets an entry it cannot read. Same trust root, same attestation.
 */
async function assertNotRevoked({ list, slug, version = null, cli = CLI_VERSION, fetchImpl, spawn, tmp }) {
  if (version) {
    const hit = (await revocationEntries({ list, slug, prefix: "revocations", fetchImpl, spawn, tmp }))?.find((e) => e && e.kind === "platform" && e.version === version);
    if (hit) throw new Fail(`REVOKED: ${version} is revoked (${hit.severity ?? "high"}): ${hit.reason}`);
  }
  if (cli) {
    const hit = (await revocationEntries({ list, slug, prefix: "cli-revocations", fetchImpl, spawn, tmp }))?.find((e) => e && e.kind === "cli" && e.version === cli);
    if (hit) throw new Fail(`CLI_REVOKED: this ai-native CLI (${cli}) is revoked (${hit.severity ?? "high"}): ${hit.reason}. Update it with \`ai-native self-update\`; if that cannot be trusted, follow the external recovery in governance/security/CLI-RECOVERY.md`);
  }
}

const DETACH_ENGINE = "runtime/bootstrap/detach.mjs";

/**
 * `detach` needs no release of its own: what ai-native wrote is listed in the repository's journal. So it never reads the lock and never depends on the
 * pin: it runs the engine of the newest VERIFIED release that ships it. Online that is the latest stable release that is not revoked (the revocation of
 * the release being REMOVED is no reason to keep it); offline it is the newest such release already in the cache. Nothing usable = fail closed.
 */
async function chooseDetachEngine({ o, repo, fetchImpl, spawn, env, tmp }) {
  if (o.offline) {
    const found = newestCachedWith(o.cache, repo, DETACH_ENGINE);
    if (!found) throw new Fail("OFFLINE: no release this machine has verified ships `ai-native detach`; run it once with network access. Nothing was changed");
    return { version: found.version, digest: found.digest };
  }
  const list = await listReleases({ fetchImpl, slug: repo, env });
  await assertNotRevoked({ list, slug: repo, version: null, fetchImpl, spawn, tmp }); // this CLI itself must not be revoked
  const entries = (await revocationEntries({ list, slug: repo, prefix: "revocations", fetchImpl, spawn, tmp })) ?? [];
  const revoked = new Set(entries.filter((e) => e && e.kind === "platform").map((e) => e.version));
  const usable = list.filter(selectable).filter((r) => !revoked.has(r.tag_name)).sort((a, b) => cmp(b.tag_name, a.tag_name));
  if (!usable.length) throw new Fail(`REVOKED: no stable release of ${repo} is available to run \`ai-native detach\` (all are revoked or none is published). Nothing was changed`);
  return { version: usable[0].tag_name, digest: assertPublishable(usable[0], usable[0].tag_name, repo) };
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

/** Every stable release this machine verified and still holds (record + blob), newest first. */
function verifiedReleases(cacheRoot, slug) {
  const dir = join(cacheRoot, "attestations");
  if (!existsSync(dir)) return [];
  const found = [];
  for (const name of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    try {
      const r = JSON.parse(readFileSync(join(dir, name), "utf8"));
      if (r.repo === slug && STABLE.test(r.version) && r.digest === `sha256:${name.slice(0, -5)}` && r.verifiedBy === "gh attestation verify" && existsSync(join(cacheRoot, "blobs", "sha256", name.slice(0, -5)))) found.push(r);
    } catch { /* an unreadable record is not a verification */ }
  }
  return found.sort((a, b) => cmp(b.version, a.version));
}

/** Highest stable release that this machine already verified and still holds (for --offline). */
export function newestCached(cacheRoot, slug) {
  return verifiedReleases(cacheRoot, slug)[0] ?? null;
}

/** The newest verified release held in the cache whose bundle (digest re-checked) contains `file`. */
export function newestCachedWith(cacheRoot, slug, file) {
  for (const r of verifiedReleases(cacheRoot, slug)) {
    try {
      const bytes = readFileSync(join(cacheRoot, "blobs", "sha256", r.digest.slice(7)));
      if (`sha256:${sha256(bytes)}` === r.digest && unpack(bytes).has(file)) return r;
    } catch { /* a damaged blob is not an engine */ }
  }
  return null;
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

/** The CLI <-> PLATFORM contract: a release says what it needs of the CLI (platform.json `bootstrap`); one that predates it needs what v3.2.0 offered. Unmet = FAIL CLOSED. */
export function assertCompatible(platform) {
  const need = platform.bootstrap ?? { protocol: 1, minCliVersion: "v3.2.0", requiredCapabilities: ["adopt"] };
  if (!Number.isInteger(need.protocol) || !STABLE.test(need.minCliVersion ?? "") || !Array.isArray(need.requiredCapabilities)) throw new Fail(`INCOMPATIBLE_CLI: ${platform.version} publishes a bootstrap contract this CLI cannot read; run \`ai-native self-update\``);
  const missing = need.requiredCapabilities.filter((c) => !CLI_CAPABILITIES.includes(c));
  const problems = [];
  if (need.protocol > CLI_PROTOCOL) problems.push(`speaks bootstrap protocol ${need.protocol} (this CLI: ${CLI_PROTOCOL})`);
  if (cmp(CLI_VERSION, need.minCliVersion) < 0) problems.push(`needs CLI >= ${need.minCliVersion} (this CLI: ${CLI_VERSION})`);
  if (missing.length) problems.push(`needs capabilities [${missing.join(", ")}] this CLI does not offer`);
  if (problems.length) throw new Fail(`INCOMPATIBLE_CLI: ${platform.version} ${problems.join("; ")}. Run \`ai-native self-update\`; nothing was changed`);
}

const FLAGS = {
  init: ["--offline", "--keep-existing", "--json", "--profile", "--version", "--trust-repo"],
  upgrade: ["--offline", "--json", "--to", "--trust-repo"],
  detach: ["--offline", "--json", "--keep-modified"],
  "self-update": ["--check"],
  uninstall: ["--purge-cache"],
  install: [],
};
const WITH_VALUE = new Set(["--profile", "--version", "--trust-repo", "--to"]);

function engineArgs(o, extra) {
  const a = [o.command, "--project", o.project, "--cache", o.cache, "--repo", `github:${o.slug}`, ...extra, "--cli-version", CLI_VERSION, "--cli-protocol", String(CLI_PROTOCOL), "--cli-capabilities", CLI_CAPABILITIES.join(",")];
  if (o.command === "init") { a[0] = "adopt"; for (const [flag, v] of [["--profile", o.profile], ["--version", o.version]]) if (v) a.push(flag, v); }
  for (const [flag, on] of [["--offline", o.offline], ["--keep-existing", o.keepExisting], ["--keep-modified", o.keepModified], ["--json", o.json]]) if (on) a.push(flag);
  return a;
}

function parse(argv) {
  const command = argv[0];
  const o = { command, offline: false, keepExisting: false, keepModified: false, json: false, check: false, purgeCache: false };
  const camel = (f) => f.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase());
  for (let i = 1; i < argv.length; i += 1) {
    const a = argv[i];
    if (!FLAGS[command].includes(a)) throw new Fail(`unknown option: ${a}`);
    if (WITH_VALUE.has(a)) {
      if (!argv[i + 1] || argv[i + 1].startsWith("--")) throw new Fail(`${a} needs a value`);
      o[camel(a)] = argv[++i];
    } else o[camel(a)] = true;
  }
  if (o.version && !STABLE.test(o.version)) throw new Fail(`invalid --version: ${o.version} (only stable releases, vX.Y.Z, can be selected)`);
  if (o.to && !STABLE.test(o.to)) throw new Fail(`invalid --to: ${o.to} (only stable releases, vX.Y.Z, can be selected)`);
  if (o.trustRepo && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(o.trustRepo)) throw new Fail(`invalid --trust-repo: ${o.trustRepo}`);
  return o;
}

/** The lock above `start`, if any, and the platform it pins (never trusted to build a URL: see `pinnedOf`). */
function findLock(start) {
  for (let dir = resolve(start); ; dir = dirname(dir)) {
    if (existsSync(join(dir, "ai-native.lock.json"))) return join(dir, "ai-native.lock.json");
    if (dirname(dir) === dir) return null;
  }
}

function versionLine(cwd, json) {
  let platform = null;
  const lock = findLock(cwd);
  if (lock) {
    try { platform = JSON.parse(readFileSync(lock, "utf8")).platform.version; } catch { platform = "unreadable"; }
    if (typeof platform !== "string" || !(VERSION.test(platform) || platform === "unreadable")) platform = "unreadable";
  }
  if (json) return JSON.stringify({ cli: CLI_VERSION, platform, protocol: CLI_PROTOCOL, capabilities: CLI_CAPABILITIES });
  return `CLI: ${CLI_VERSION}${platform ? ` | PLATFORM: ${platform}` : ""}`;
}

/** The pin of an adopted repository, or an explanation. The lock is repository content: nothing in it is used until it has this shape. */
function pinnedOf(lockFile, repo, o) {
  let pinned;
  try {
    const lock = JSON.parse(readFileSync(lockFile, "utf8"));
    const p = lock.platform;
    pinned = { profiles: Array.isArray(lock.profiles) ? lock.profiles : [], version: p.version, digest: p.digest, slug: /^github:([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)$/.exec(p.repo)?.[1] };
    if (!pinned.slug || !DIGEST.test(pinned.digest) || !VERSION.test(pinned.version)) throw new Error("incomplete or malformed platform");
  } catch (error) {
    throw new Fail(`ai-native.lock.json is not usable (${error.message}); fix or remove it`);
  }
  // The lock cannot choose whom this command trusts. Another source needs the person's explicit word.
  if (pinned.slug !== repo && o.trustRepo !== pinned.slug) throw new Fail(`TRUST_ROOT: this repository is pinned to releases of ${pinned.slug}, but this command trusts only ${repo}. If you trust ${pinned.slug}, say so: ai-native ${o.command} --trust-repo ${pinned.slug}`);
  return pinned;
}

/** One path for the cache and the network: the engine always starts from a bundle whose sha256 was just checked and whose attestation is on record. */
async function obtainBundle({ o, digest, fetchImpl, spawn, tmp, engineFile }) {
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
    if (o.offline) throw new Fail(`OFFLINE: ${o.version} is not in the cache with a verified attestation; run \`ai-native ${o.command}\` once with network access`);
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
  if (!files.has(engineFile)) throw new Fail(`${o.version} predates \`ai-native ${o.command}\` (it ships no engine for it): ${o.command === "upgrade" ? "pick a newer release" : o.adopted ? "this repository is pinned to it; run `ai-native upgrade` first" : o.command === "detach" ? "no newer release ships it yet" : "use a newer release"}`);
  assertCompatible(platform);
  const engine = join(work, "release");
  for (const [path, content] of files) {
    mkdirSync(dirname(join(engine, path)), { recursive: true });
    writeFileSync(join(engine, path), content);
  }
  const recordFile = join(work, "attestation.json");
  writeFileSync(recordFile, JSON.stringify(record));
  return { engine, args: ["--bundle", bundle, "--attestation-record", recordFile] };
}

/** Hands over to the engine inside the verified bundle. */
function launch({ o, engine, args, spawn, env }) {
  const run = spawn(process.execPath, [join(engine, "runtime", "bootstrap", "cli.mjs"), ...engineArgs(o, args)], { stdio: "inherit", env });
  return run.status ?? 1;
}

/** deps: fetchImpl, spawn, env, cwd, out, err, rename. Returns the exit code. */
export async function main(argv, { fetchImpl = fetch, spawn = spawnSync, env = process.env, cwd = process.cwd(), out = console.log, err = console.error, repo = OFFICIAL_REPO, self = fileURLToPath(import.meta.url), rename = renameSync } = {}) {
  const command = argv[0];
  if (!command || command === "help" || command === "--help" || command === "-h") { out(HELP); return command ? 0 : 2; }
  if (command === "version" || command === "--version") { out(versionLine(cwd, argv.includes("--json"))); return 0; }
  const tmp = [];
  try {
    if (!Object.hasOwn(FLAGS, command)) throw new Fail(`unknown command: ${command}; try \`ai-native help\``);
    const o = parse(argv);
    if (command === "install") return install({ self, env, out, spawn, rename });
    if (command === "uninstall") return uninstall({ env, out, o });
    if (command === "self-update") return await selfUpdate({ o, fetchImpl, spawn, env, out, tmp, repo, rename });
    const top = spawn("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" });
    if (top.error || top.status !== 0) throw new Fail("not inside a Git repository: run `git init` (or clone your repository) first");
    o.project = resolve(top.stdout.trim());
    o.cache = resolve(defaultCache(env));
    o.slug = repo;
    const lockFile = join(o.project, "ai-native.lock.json");
    o.adopted = existsSync(lockFile);

    if (command === "detach" && !o.adopted) {
      if (existsSync(join(o.project, ".ai-native", "adoption-journal.json"))) throw new Fail("ADOPTION_INCONSISTENT: .ai-native/adoption-journal.json without ai-native.lock.json; restore the lock from Git history, then run detach again. Nothing was removed");
      out("STATUS: NOT_ADOPTED\nDETACH: nothing to remove: this repository is not adopted");
      return 0;
    }
    if (command === "upgrade" && !o.adopted) throw new Fail("NOT_ADOPTED: this repository has no ai-native.lock.json; run `ai-native init` first");

    if (command === "detach") {
      const chosen = await chooseDetachEngine({ o, repo, fetchImpl, spawn, env, tmp });
      o.version = chosen.version;
      const { engine, args } = await obtainBundle({ o, digest: chosen.digest, fetchImpl, spawn, tmp, engineFile: DETACH_ENGINE });
      return launch({ o, engine, args, spawn, env });
    }

    // already adopted: the lock decides which release (init); a new repository: --version, or the latest stable; upgrade: the lock is the pin, the target is chosen
    let digest = null;
    let pinned = null;
    if (o.adopted) {
      pinned = pinnedOf(lockFile, repo, o);
      if (command === "init") {
        if (o.version && o.version !== pinned.version) throw new Fail(`--version ${o.version} conflicts with the release this repository is pinned to (${pinned.version}); \`ai-native upgrade --to ${o.version}\` moves it, explicitly`);
        if (o.profile && !pinned.profiles.includes(o.profile)) throw new Fail(`PROFILE_CONFLICT: --profile ${o.profile} contradicts the profile this repository is pinned to (${pinned.profiles.join(", ") || "none"}); the profile is changed in ai-native.lock.json, not by this command`);
      }
      o.slug = pinned.slug;
      if (command !== "upgrade") { o.version = pinned.version; digest = pinned.digest; } // init: the lock decides
    } else if (o.trustRepo) throw new Fail("--trust-repo only applies to a repository that is already pinned to another source");

    const uptodate = () => { out(`STATUS: UP_TO_DATE\nAI-NATIVE: ${pinned.version}\nUPGRADE: already on ${pinned.version}; nothing changed`); return 0; };
    if (!o.offline) {
      const list = await listReleases({ fetchImpl, slug: o.slug, env });
      if (command === "upgrade") {
        const release = o.to ? list.find((r) => r.tag_name === o.to) ?? null : pickLatest(list, o.slug);
        o.version = o.to ?? release.tag_name;
        digest = assertPublishable(release, o.version, o.slug);
        const order = cmp(o.version, pinned.version);
        if (order < 0) throw new Fail(`DOWNGRADE_REFUSED: this repository is pinned to ${pinned.version}; ${o.version} is older. \`ai-native upgrade\` only moves forward`);
        if (order === 0 && digest !== pinned.digest) throw new Fail(`DIGEST_MISMATCH: ${o.version} is published as ${digest} but this repository pins ${pinned.digest}`);
        if (order === 0) return uptodate();
      } else if (!digest && !o.version) {
        o.version = pickLatest(list, o.slug).tag_name;
        digest = assertPublishable(list.find((r) => r.tag_name === o.version), o.version, o.slug);
      } else if (!digest) digest = assertPublishable(list.find((r) => r.tag_name === o.version) ?? null, o.version, o.slug);
      await assertNotRevoked({ list, slug: o.slug, version: o.version, fetchImpl, spawn, tmp });
    } else if (command === "upgrade") {
      const c = o.to ? cachedByVersion(o.cache, o.slug, o.to) : newestCached(o.cache, o.slug);
      if (!c) throw new Fail(`OFFLINE: this machine has no verified ${o.to ?? "release"} in its cache; run \`ai-native upgrade\` with network access. Nothing was changed`);
      const order = cmp(c.version, pinned.version);
      if (order < 0 && o.to) throw new Fail(`DOWNGRADE_REFUSED: this repository is pinned to ${pinned.version}; ${c.version} is older. \`ai-native upgrade\` only moves forward`);
      if (order <= 0) return uptodate();
      o.version = c.version;
      digest = c.digest;
    } else if (!digest) {
      const c = o.version ? cachedByVersion(o.cache, o.slug, o.version) : newestCached(o.cache, o.slug);
      if (!c) throw new Fail(`OFFLINE: this machine has no verified ${o.version ?? "release"} in its cache; run \`ai-native init\` once with network access`);
      o.version = c.version;
      digest = c.digest;
    }

    const { engine, args } = await obtainBundle({ o, digest, fetchImpl, spawn, tmp, engineFile: command === "upgrade" ? "runtime/bootstrap/upgrade.mjs" : "runtime/bootstrap/adopt.mjs" });
    return launch({ o, engine, args, spawn, env });
  } catch (error) {
    if (!(error instanceof Fail)) throw error;
    err(`STATUS: FAILED\nERROR: ${error.message}`);
    return 1;
  } finally {
    for (const dir of tmp) rmSync(dir, { recursive: true, force: true });
  }
}

// ---- this machine: install, self-update, uninstall ---------------------------------------------------------------------------------------------

/** The version an installed (or downloaded) copy of this program declares: undefined = no such file, null = a program from before versions existed (v3.2.0). */
export function declaredVersion(file) {
  if (!existsSync(file)) return undefined;
  try { return MARKER.exec(readFileSync(file, "utf8"))?.[1] ?? null; } catch { return null; }
}
/** >0 when `a` is newer than `b`; a program from before versions existed (null) is older than any version. */
const newerThan = (a, b) => (b ? cmp(a, b) : 1);

/** POSIX single-quoting: nothing inside is special to sh (`$`, backtick, `"`, `\`), and a `'` is closed, escaped and reopened. */
const shq = (text) => `'${text.split("'").join("'\\''")}'`;
/** PowerShell single-quoting: a `'` is doubled. */
const psq = (text) => `'${text.split("'").join("''")}'`;

const SHIMS = (script) => ({
  "ai-native": [`#!/bin/sh\nexec node ${shq(script.split("\\").join("/"))} "$@"\n`, 0o755],
  // the batch shim embeds NO path: cmd.exe reads the file in the OEM code page (850, 437...) while the path is Unicode, so a profile such as C:\Users\José
  // would be corrupted. `%~dp0` is the directory of the shim itself, resolved by cmd.exe in its own encoding; both files always live in `bin`
  "ai-native.cmd": [`@echo off\r\nnode "%~dp0${basename(script)}" %*\r\n`, 0o644],
});

/** Writes `text` next to `file` and renames it over: a reader sees the old file or the new one, never half of it. Retries the brief locks Windows antivirus/indexers take. */
function replaceFile(rename, file, bytes, mode = 0o644) {
  const staged = `${file}.new`;
  writeFileSync(staged, bytes, { mode });
  for (let attempt = 0; ; attempt += 1) {
    try { rename(staged, file); return; } catch (error) {
      if (attempt >= 4 || !["EPERM", "EBUSY", "EACCES"].includes(error.code)) { rmSync(staged, { force: true }); throw error; }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100 * (attempt + 1));
    }
  }
}

/** Stage -> prove the new program starts as `expected` -> atomic replace (previous kept as .prev) -> prove again, else put the previous one back. */
function replaceInstalled({ bin, bytes, expected, spawn, env, rename }) {
  const script = join(bin, "ai-native.mjs");
  const staged = join(bin, "ai-native.next.mjs"); // .mjs: it is executed to prove it starts
  const prev = `${script}.prev`;
  mkdirSync(bin, { recursive: true });
  const probe = (file) => {
    const r = spawn(process.execPath, [file, "version", "--json"], { encoding: "utf8", env });
    try { return r.status === 0 ? JSON.parse(r.stdout).cli : null; } catch { return null; }
  };
  writeFileSync(staged, bytes);
  if (probe(staged) !== expected) { rmSync(staged, { force: true }); throw new Fail(`UPDATE_REJECTED: the new CLI does not start as ${expected}; the installed one was not touched`); }
  rmSync(staged, { force: true });
  const had = existsSync(script);
  if (had) copyFileSync(script, prev);
  try {
    replaceFile(rename, script, bytes);
  } catch (error) {
    throw new Fail(`UPDATE_FAILED: could not replace ${script} (${error.code ?? error.message}); the installed CLI is unchanged and works`);
  }
  if (probe(script) !== expected) {
    if (had) replaceFile(renameSync, script, readFileSync(prev)); else rmSync(script, { force: true });
    throw new Fail(`UPDATE_FAILED: the replaced CLI did not start as ${expected}; ${had ? "the previous one was put back" : "it was removed"}`);
  }
}

function writeShims(bin, script, rename) {
  for (const [name, [text, mode]] of Object.entries(SHIMS(script))) {
    const file = join(bin, name);
    if (!existsSync(file) || readFileSync(file, "utf8") !== text) replaceFile(rename, file, text, mode);
  }
}

const onPath = (dir, env) => (env.PATH ?? env.Path ?? "").split(delimiter).some((p) => p && (process.platform === "win32" ? p.toLowerCase() === dir.toLowerCase() : p === dir));

/** The one line that puts `bin` on the PATH of a person. It quotes the path for the shell it is typed into: nothing in a directory name can break or inject. */
export function pathHint(bin, env, platform = process.platform) {
  if (onPath(bin, env)) return `${bin} is already on your PATH`;
  if (platform !== "win32") return `Add it to your PATH (once):  export PATH=${shq(bin)}:"$PATH"`;
  // the USER path only (never the process or machine one, which would copy the Machine PATH into the User PATH), and only if the entry is not there yet
  const dir = psq(bin);
  return `Add it to your PATH (once, safe to repeat):  $u=[Environment]::GetEnvironmentVariable('Path','User'); if (($u -split ';') -notcontains ${dir}) { [Environment]::SetEnvironmentVariable('Path', ((@($u,${dir}) | Where-Object { $_ }) -join ';'), 'User') }`;
}

/** Install this file as the machine's command. Safe to repeat; replaces an older install atomically; refuses to put an older CLI over a newer one. */
function install({ self, env, out, spawn, rename }) {
  const bin = join(home(env), "bin");
  const script = join(bin, "ai-native.mjs");
  const installed = declaredVersion(script);
  const bytes = readFileSync(self);
  const mine = declaredVersion(self) ?? CLI_VERSION; // the file being installed (this very program, unless a caller says otherwise)
  if (resolve(self) !== resolve(script)) {
    if (installed && newerThan(installed, mine) > 0) throw new Fail(`INSTALL_DOWNGRADE_REFUSED: ${installed} is installed and this file is ${mine}. Use \`ai-native self-update\` to move forward; downgrading is not supported`);
    if (installed === undefined || !readFileSync(script).equals(bytes)) replaceInstalled({ bin, bytes, expected: mine, spawn, env, rename });
  }
  writeShims(bin, script, rename);
  out(installed === undefined ? `Installed ai-native CLI ${mine} in ${bin}` : installed === mine ? `ai-native CLI ${mine} is installed in ${bin}` : `Updated ai-native CLI ${installed ?? "(older)"} -> ${mine} in ${bin}`);
  out(pathHint(bin, env));
  return 0;
}

/** Report or perform the update of the INSTALLED command: the same verification as any release, atomic, and never a downgrade. */
async function selfUpdate({ o, fetchImpl, spawn, env, out, tmp, repo, rename }) {
  const bin = join(home(env), "bin");
  const script = join(bin, "ai-native.mjs");
  const current = declaredVersion(script);
  if (current === undefined) throw new Fail(`NOT_INSTALLED: no ai-native CLI in ${bin}; install it first with \`node ai-native-cli.mjs install\``);
  const list = await listReleases({ fetchImpl, slug: repo, env });
  const release = pickLatest(list, repo);
  const target = release.tag_name;
  const order = newerThan(target, current);
  if (order <= 0) { out(`CLI: ${current ?? "(older)"} is up to date${order < 0 ? ` (newer than the latest published ${target}; no downgrade)` : ""}`); return 0; }
  const digest = assertPublishable(release, target, repo, CLI_ASSET);
  await assertNotRevoked({ list, slug: repo, cli: target, fetchImpl, spawn, tmp });
  if (o.check) { out(`CLI: ${current ?? "(older)"} | latest: ${target} (update available: run \`ai-native self-update\`)`); return 0; }
  const bytes = await download(fetchImpl, `https://github.com/${repo}/releases/download/${target}/${CLI_ASSET}`);
  if (`sha256:${sha256(bytes)}` !== digest) throw new Fail(`DIGEST_MISMATCH: ${CLI_ASSET} is sha256:${sha256(bytes)}, expected ${digest}`);
  const dir = mkdtempSync(join(tmpdir(), "ai-native-cli-"));
  tmp.push(dir);
  const file = join(dir, CLI_ASSET);
  writeFileSync(file, bytes);
  verifyAttestation({ spawn, file, slug: repo });
  if (MARKER.exec(bytes.toString("utf8"))?.[1] !== target) throw new Fail(`RELEASE_REJECTED: ${CLI_ASSET} of ${target} does not declare ${target}`);
  replaceInstalled({ bin, bytes, expected: target, spawn, env, rename });
  writeShims(bin, script, rename);
  out(`Updated ai-native CLI ${current ?? "(older)"} -> ${target} (previous kept as ${script}.prev)`);
  return 0;
}

/** Remove this command from the machine: its program and shims. Not PATH, not the repositories, and the release cache only with --purge-cache. Safe to repeat. */
function uninstall({ env, out, o }) {
  const bin = join(home(env), "bin");
  const removed = [];
  for (const name of ["ai-native.mjs", "ai-native", "ai-native.cmd", "ai-native.mjs.prev", "ai-native.mjs.new", "ai-native.next.mjs", "ai-native.cmd.new", "ai-native.new"]) {
    const file = join(bin, name);
    if (existsSync(file)) { rmSync(file, { force: true }); removed.push(name); }
  }
  if (existsSync(bin) && !readdirSync(bin).length) rmdirSync(bin);
  const cache = defaultCache(env);
  // only something that is recognizably an ai-native cache is ever deleted, whatever AI_NATIVE_CACHE points at
  if (o.purgeCache && existsSync(cache) && (existsSync(join(cache, "blobs")) || existsSync(join(cache, "attestations")))) { rmSync(cache, { recursive: true, force: true }); removed.push(`cache ${cache}`); }
  try { if (existsSync(home(env)) && !readdirSync(home(env)).length) rmdirSync(home(env)); } catch { /* not empty or not ours to remove */ }
  out(removed.length ? `Removed ai-native from this machine: ${removed.join(", ")}` : `ai-native is not installed in ${bin}; nothing to do`);
  out(`Repositories were not touched. Your PATH was not changed${onPath(bin, env) ? `: remove ${bin} from it if you added it` : ""}.${o.purgeCache ? "" : ` The release cache (${cache}) was kept; --purge-cache deletes it.`}`);
  return 0;
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) process.exit(await main(process.argv.slice(2)));
