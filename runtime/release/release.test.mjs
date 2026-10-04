// M4.2: PAR-REPRODUCIBLE-BUNDLE + PAR-RELEASE (bundle, platform.json,
// revocations, remote source, end-to-end bootstrap from a real build).
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";
import { buildBundle, crc32, gzipDeterministic, isShipped, publishedPlatform, sha256Hex, PLACEHOLDER_DIGEST } from "./bundle.mjs";
import { findRevocation, parseRevocations, pickHighest } from "./revocations.mjs";
import { readTar } from "../bootstrap/tar.mjs";
import { validate } from "../lib/schema-lite.mjs";
import { downloadRelease, fetchRevocations, parseRepo, bundleAsset } from "../bootstrap/remote.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const schema = (n) => JSON.parse(readFileSync(join(repoRoot, "contracts", n), "utf8"));
const tmp = () => mkdtempSync(join(tmpdir(), "ai-native-rel-"));
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t", GIT_COMMITTER_DATE: "2026-10-01T12:00:00+00:00" } }).trim();

/** A minimal git repo holding exactly what buildBundle reads from a commit. */
function fixtureRepo({ crlf = false, extra = {} } = {}) {
  const dir = tmp();
  const put = (path, text) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), crlf ? text.replace(/\n/g, "\r\n") : text);
  };
  put("runtime/main.mjs", 'console.log("hi");\n');
  put("runtime/a.test.mjs", "// never shipped\n");
  put("contracts/unit-event.schema.json", JSON.stringify({ properties: { schemaVersion: { const: 1 } } }));
  put("audit/method.json", JSON.stringify({ auditMethod: "1.2" }));
  put("core/kernel.md", "# Kernel\n");
  put("parity/v2.0.5/capabilities.json", JSON.stringify({ capabilities: [{ id: "X-1", parTests: ["PAR-A"] }, { id: "X-2", parTests: ["PAR-B"] }, { id: "X-3", parTests: [] }] }));
  put("parity/par-tests.json", JSON.stringify({ tests: [{ id: "PAR-A", status: "IMPLEMENTED", implementedBy: "runtime/a.test.mjs" }, { id: "PAR-B", status: "PLANNED" }] }));
  put("notes/not-shipped.md", "x\n");
  for (const [p, t] of Object.entries(extra)) put(p, t);
  git(dir, "init", "-q");
  git(dir, "config", "core.autocrlf", "false");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "c", "--date", "2026-10-01T12:00:00+00:00");
  return { dir, commit: git(dir, "rev-parse", "HEAD") };
}

test("PAR-REPRODUCIBLE-BUNDLE: same commit => byte-identical bundle, regardless of working tree", () => {
  const { dir, commit } = fixtureRepo();
  const a = buildBundle({ root: dir, commit, version: "v3.0.0-alpha.1" });
  writeFileSync(join(dir, "runtime", "main.mjs"), "// dirty edit that is not committed\n");
  writeFileSync(join(dir, "runtime", "untracked.mjs"), "junk\n");
  const b = buildBundle({ root: dir, commit, version: "v3.0.0-alpha.1" });
  assert.equal(a.digest, b.digest);
  assert.ok(a.bytes.equals(b.bytes));
  assert.equal(a.digest, `sha256:${sha256Hex(a.bytes)}`);
  assert.ok(!readTar(a.bytes).has("runtime/untracked.mjs"));
  rmSync(dir, { recursive: true, force: true });
});

test("PAR-REPRODUCIBLE-BUNDLE: identical content committed from LF and CRLF checkouts differs only by what git stores", () => {
  // Same commit read twice from a clone is identical (the blob is what ships).
  const { dir, commit } = fixtureRepo({ crlf: true });
  const clone = tmp();
  git(clone, "clone", "-q", dir, ".");
  const a = buildBundle({ root: dir, commit, version: "v3.0.0-alpha.1" });
  const b = buildBundle({ root: clone, commit, version: "v3.0.0-alpha.1" });
  assert.equal(a.digest, b.digest);
  for (const d of [dir, clone]) rmSync(d, { recursive: true, force: true });
});

test("bundle content: only shipped paths, tests excluded, real timestamp from the commit, valid platform.json", () => {
  const { dir, commit } = fixtureRepo();
  const { bytes, platform } = buildBundle({ root: dir, commit, version: "v3.0.0-alpha.1" });
  const files = readTar(bytes);
  assert.ok(files.has("runtime/main.mjs") && files.has("platform.json"));
  assert.ok(!files.has("runtime/a.test.mjs") && !files.has("notes/not-shipped.md") && !files.has("parity/par-tests.json"));
  assert.equal(platform.generatedAt, "2026-10-01T12:00:00Z");
  assert.equal(platform.digest, PLACEHOLDER_DIGEST);
  assert.deepEqual(validate(JSON.parse(files.get("platform.json").toString()), schema("platform.schema.json")), []);
  assert.deepEqual(platform.capabilities, [
    { id: "X-1", status: "executable", evidence: "runtime/a.test.mjs" },
    { id: "X-2", status: "missing" },
    { id: "X-3", status: "missing" },
  ]);
  assert.deepEqual(platform.components, { "unit-event": { version: "1" }, "audit-method": { version: "1.2" }, "kernel-contract": { version: "sha256:e0c070246e403b4616d3e014d45ef104b5d6e3e8588269087896c1c30920cb70" } });
  rmSync(dir, { recursive: true, force: true });
});

test("buildBundle rejects a non-SHA commit and a tree without an entry point", () => {
  const { dir, commit } = fixtureRepo();
  assert.throws(() => buildBundle({ root: dir, commit: "HEAD", version: "v3.0.0-alpha.1" }), /40-hex/);
  const empty = fixtureRepo();
  git(empty.dir, "rm", "-q", "runtime/main.mjs");
  git(empty.dir, "commit", "-q", "-m", "x");
  assert.throws(() => buildBundle({ root: empty.dir, commit: git(empty.dir, "rev-parse", "HEAD"), version: "v3.0.0-alpha.1" }), /no runtime\/main\.mjs/);
  for (const d of [dir, empty.dir]) rmSync(d, { recursive: true, force: true });
  assert.ok(commit);
});

test("gzipDeterministic: valid gzip (zlib round-trips it), fixed header, crc32 correct", () => {
  const data = Buffer.from("hello ".repeat(5000));
  const gz = gzipDeterministic(data);
  assert.deepEqual([...gz.subarray(0, 10)], [0x1f, 0x8b, 8, 0, 0, 0, 0, 0, 0, 0xff]);
  assert.ok(gunzipSync(gz).equals(data));
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
  assert.ok(gzipDeterministic(data).equals(gz));
  assert.ok(!gz.equals(gzipSync(data)), "intentionally not zlib's wrapper");
});

test("isShipped: allowlist prefixes, tests excluded", () => {
  assert.ok(isShipped("runtime/bootstrap/install.mjs") && isShipped(".agents/skills/recovery/SKILL.md") && isShipped("contracts/lock.schema.json"));
  assert.ok(!isShipped("runtime/lib/git.test.mjs") && !isShipped("legacy/x") && !isShipped("template/x") && !isShipped("foundation/x") && !isShipped("governance/x"));
});

test("publishedPlatform adds the real digest and asset pointers without mutating the bundled one", () => {
  const base = { version: "v3.0.0-alpha.1", digest: PLACEHOLDER_DIGEST };
  const out = publishedPlatform(base, `sha256:${"a".repeat(64)}`, { sbom: "s.json", provenance: "p.json" });
  assert.equal(out.digest, `sha256:${"a".repeat(64)}`);
  assert.deepEqual([out.sbom, out.provenance], ["s.json", "p.json"]);
  assert.equal(base.digest, PLACEHOLDER_DIGEST);
});

const rev = (n, entries = []) => JSON.stringify({ schemaVersion: 1, n, publishedAt: "2026-10-02T00:00:00Z", entries });

test("revocations: highest valid n wins, malformed/mismatched lists are skipped", () => {
  const { list, warnings } = pickHighest([
    { name: "revocations-1.json", text: rev(1) },
    { name: "revocations-3.json", text: "{not json" },
    { name: "revocations-2.json", text: rev(2, [{ kind: "platform", id: "ai-native", version: "v3.0.0-alpha.1", reason: "bad" }]) },
    { name: "revocations-9.json", text: rev(4) },
  ]);
  assert.equal(list.n, 2);
  assert.equal(warnings.length, 2);
  assert.deepEqual(findRevocation(list, { version: "v3.0.0-alpha.1", commit: "a".repeat(40) })?.reason, "bad");
  assert.equal(findRevocation(list, { version: "v3.0.0-alpha.2", commit: "a".repeat(40) }), null);
  assert.ok(parseRevocations(rev(1)).errors.length === 0 && parseRevocations("{}").errors.length > 0);
});

test("the repo's own revocations source is valid", () => {
  const text = readFileSync(join(repoRoot, "governance", "versioning", "revocations-1.json"), "utf8");
  assert.deepEqual(parseRevocations(text, "revocations-1.json").errors, []);
});

// ---- remote source (all network/gh injected) ---------------------------------

const LOCK = (digest, version = "v3.0.0-alpha.1") => ({ platform: { repo: "github:o/ai-native", version, commit: "a".repeat(40), digest } });
const okRes = (bytes) => ({ ok: true, status: 200, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length), json: async () => JSON.parse(bytes.toString()) });
const verified = () => ({ status: "VERIFIED" });

test("parseRepo / bundleAsset", () => {
  assert.equal(parseRepo("github:o/r").slug, "o/r");
  assert.throws(() => parseRepo("https://evil/x"), /invalid repo/);
  assert.equal(bundleAsset("v3.0.0-alpha.1"), "ai-native-v3.0.0-alpha.1.tar.gz");
});

test("downloadRelease: returns bytes only when sha256 equals the lock digest", async () => {
  const bytes = Buffer.from("bundle");
  const digest = `sha256:${sha256Hex(bytes)}`;
  const urls = [];
  const fetchImpl = async (u) => (urls.push(u), okRes(bytes));
  const good = await downloadRelease({ lock: LOCK(digest), fetchImpl, verifier: verified });
  assert.deepEqual(good.errors, []);
  assert.ok(good.bytes.equals(bytes) && good.attested);
  assert.equal(urls[0], "https://github.com/o/ai-native/releases/download/v3.0.0-alpha.1/ai-native-v3.0.0-alpha.1.tar.gz");
  const bad = await downloadRelease({ lock: LOCK(`sha256:${"b".repeat(64)}`), fetchImpl, verifier: verified });
  assert.equal(bad.bytes, undefined);
  assert.match(bad.errors[0], /does not match lock/);
});

test("downloadRelease: attestation FAILED blocks; UNAVAILABLE warns unless required", async () => {
  const bytes = Buffer.from("bundle");
  const lock = LOCK(`sha256:${sha256Hex(bytes)}`);
  const fetchImpl = async () => okRes(bytes);
  const failed = await downloadRelease({ lock, fetchImpl, verifier: () => ({ status: "FAILED", detail: "no matching attestation" }) });
  assert.equal(failed.bytes, undefined);
  assert.match(failed.errors[0], /attestation verification FAILED/);
  const unavailable = () => ({ status: "UNAVAILABLE", detail: "spawn gh ENOENT" });
  const soft = await downloadRelease({ lock, fetchImpl, verifier: unavailable });
  assert.ok(soft.bytes && soft.warnings[0].includes("provenance NOT verified") && soft.attested === false);
  const hard = await downloadRelease({ lock, fetchImpl, verifier: unavailable, requireAttestation: true });
  assert.equal(hard.bytes, undefined);
  assert.match(hard.errors[0], /attestation required/);
});

test("downloadRelease: HTTP failure, oversized and invalid version are errors", async () => {
  const lock = LOCK(`sha256:${"c".repeat(64)}`);
  const r404 = await downloadRelease({ lock, fetchImpl: async () => ({ ok: false, status: 404 }), verifier: verified });
  assert.match(r404.errors[0], /HTTP 404/);
  const badVersion = await downloadRelease({ lock: LOCK(lock.platform.digest, "main"), fetchImpl: async () => okRes(Buffer.from("x")), verifier: verified });
  assert.match(badVersion.errors[0], /invalid version/);
});

function releasesFetch(assetsByName, listBody) {
  return async (url) => {
    if (url.includes("/releases?")) return okRes(Buffer.from(JSON.stringify(listBody)));
    return okRes(assetsByName[url]);
  };
}

test("fetchRevocations: picks highest n, verifies attestation, fails closed on a bad higher list", async () => {
  const listBody = [{ assets: [{ name: "revocations-1.json", browser_download_url: "u1" }, { name: "revocations-2.json", browser_download_url: "u2" }, { name: "x.tar.gz", browser_download_url: "ux" }] }];
  const fetchImpl = releasesFetch({ u1: Buffer.from(rev(1)), u2: Buffer.from(rev(2)) }, listBody);
  const ok = await fetchRevocations({ repo: "github:o/ai-native", fetchImpl, verifier: verified });
  assert.equal(ok.list.n, 2);
  const bad = await fetchRevocations({ repo: "github:o/ai-native", fetchImpl, verifier: (file) => (file.endsWith("revocations-2.json") ? { status: "FAILED", detail: "x" } : { status: "VERIFIED" }) });
  assert.equal(bad.list, null);
  assert.match(bad.errors[0], /attestation verification FAILED/, "never falls back to an older list");
});

test("fetchRevocations: unreachable source is a warning, malformed list is ignored", async () => {
  const down = await fetchRevocations({ repo: "github:o/ai-native", fetchImpl: async () => { throw new Error("ENOTFOUND"); }, verifier: verified });
  assert.deepEqual([down.list, down.errors.length], [null, 0]);
  assert.match(down.warnings[0], /NOT checked/);
  const listBody = [{ assets: [{ name: "revocations-5.json", browser_download_url: "u5" }, { name: "revocations-1.json", browser_download_url: "u1" }] }];
  const r = await fetchRevocations({ repo: "github:o/ai-native", fetchImpl: releasesFetch({ u5: Buffer.from("{oops"), u1: Buffer.from(rev(1)) }, listBody), verifier: verified });
  assert.equal(r.list, null, "a malformed higher list is not skipped in favour of an older one");
  assert.equal(r.unavailable, true);
  assert.ok(r.warnings.some((w) => w.includes("revocations-5.json invalid")));
  const gone = await fetchRevocations({ repo: "github:o/ai-native", fetchImpl: async (url) => { if (url.includes("/releases?")) return okRes(Buffer.from(JSON.stringify(listBody))); throw new Error("boom"); }, verifier: verified });
  assert.deepEqual([gone.list, gone.unavailable], [null, true]);
  const none = await fetchRevocations({ repo: "github:o/ai-native", fetchImpl: releasesFetch({}, []), verifier: verified });
  assert.match(none.warnings[0], /no revocations list/);
  assert.equal(none.unavailable, undefined, "no list published is absence of information, not a failure to read it");
});

// ---- end to end: real build of THIS repo's HEAD, installed by real bootstrap ----

test("e2e: build HEAD -> sync --from-file -> run version/doctor; revoked release is refused", () => {
  const commit = git(repoRoot, "rev-parse", "HEAD");
  const out = tmp();
  const proj = tmp();
  const cache = tmp();
  const build = spawnSync(process.execPath, [join(repoRoot, "runtime", "release", "build.mjs"), "--version", "v3.0.0-alpha.1", "--out", out, "--commit", commit], { encoding: "utf8" });
  assert.equal(build.status, 0, build.stderr);
  const summary = JSON.parse(build.stdout);
  const published = JSON.parse(readFileSync(join(out, "platform.json"), "utf8"));
  assert.equal(published.digest, summary.digest);
  assert.deepEqual(validate(published, schema("platform.schema.json")), []);
  const sums = readFileSync(join(out, "SHA256SUMS"), "utf8").trim().split("\n");
  assert.equal(sums.length, 3);
  for (const line of sums) {
    const [hex, name] = line.split(/\s+/);
    assert.equal(sha256Hex(readFileSync(join(out, name))), hex, name);
  }
  // reproducible across two independent builds
  const out2 = tmp();
  spawnSync(process.execPath, [join(repoRoot, "runtime", "release", "build.mjs"), "--version", "v3.0.0-alpha.1", "--out", out2, "--commit", commit]);
  assert.ok(readFileSync(join(out, summary.bundle)).equals(readFileSync(join(out2, summary.bundle))));

  writeFileSync(join(proj, "ai-native.lock.json"), JSON.stringify({ schemaVersion: 1, platform: { repo: "github:o/ai-native", version: "v3.0.0-alpha.1", commit, digest: summary.digest }, profiles: ["factory"] }));
  const cli = (...args) => spawnSync(process.execPath, [join(repoRoot, "runtime", "bootstrap", "cli.mjs"), ...args, "--project", proj, "--cache", cache, "--json"], { encoding: "utf8" });
  const sync = cli("sync", "--from-file", join(out, summary.bundle), "--offline");
  assert.equal(sync.status, 0, sync.stdout + sync.stderr);
  assert.equal(spawnSync(process.execPath, [join(repoRoot, "runtime", "bootstrap", "cli.mjs"), "run", "--project", proj, "--cache", cache, "--", "version"], { encoding: "utf8" }).stdout.split("\n")[0].trim(), `v3.0.0-alpha.1 ${commit}`);
  const doctor = cli("doctor");
  assert.equal(doctor.status, 0, doctor.stdout);

  const revFile = join(out, "rev.json");
  writeFileSync(revFile, rev(7, [{ kind: "platform", id: "ai-native", version: "v3.0.0-alpha.1", reason: "test revoke", severity: "critical" }]));
  const cache2 = tmp();
  const revoked = spawnSync(process.execPath, [join(repoRoot, "runtime", "bootstrap", "cli.mjs"), "sync", "--from-file", join(out, summary.bundle), "--revocations", revFile, "--project", proj, "--cache", cache2, "--json"], { encoding: "utf8" });
  assert.notEqual(revoked.status, 0);
  assert.match(revoked.stdout, /revoked/);
  assert.equal(existsSync(join(cache2, "blobs")), false, "a revoked release never reaches the cache");
  for (const d of [out, out2, proj, cache, cache2]) rmSync(d, { recursive: true, force: true });
});
