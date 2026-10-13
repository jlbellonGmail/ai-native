// The public command (`ai-native init`, runtime/cli/ai-native.mjs): release resolution, download, mandatory attestation, hand-over to the
// engine inside the verified bundle, offline from the cache. Network and `gh` are faked at the process boundary; everything after the
// hand-over (the real engine, real git, real files) runs for real. The critical test starts from a Git repository with NOTHING in it.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { main, latestStable, newestCached, unpack, verifyAttestation } from "./ai-native.mjs";
import { readTar, writeTar } from "../bootstrap/tar.mjs";
import { sha256, blobPath } from "../bootstrap/cache.mjs";
import { workingTreeRelease } from "../../evaluation/fixtures/working-tree-release.mjs";

const made = [];
after(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })));
const tmp = (p) => { const d = mkdtempSync(join(tmpdir(), `cli-${p}-`)); made.push(d); return d; };
const gitInit = () => { const d = tmp("repo"); execFileSync("git", ["init", "-q"], { cwd: d }); return d; };
const tree = (root) => readdirSync(root, { recursive: true }).map(String).filter((p) => p !== ".git" && !/^\.git[\\/]/.test(p)).sort();

const SLUG = "o/ai-native";
const rel = workingTreeRelease({ version: "v9.9.9" });
const API = `https://api.github.com/repos/${SLUG}/releases?per_page=100`;
const BUNDLE_URL = (v) => `https://github.com/${SLUG}/releases/download/${v}/ai-native-${v}.tar.gz`;
const revocations = join(tmp("rev"), "revocations-1.json");
writeFileSync(revocations, JSON.stringify({ schemaVersion: 1, n: 1, publishedAt: "2026-10-02T00:00:00Z", entries: [] }));

const releases = [
  { tag_name: "v9.9.9", draft: false, prerelease: false, immutable: true, assets: [{ name: "ai-native-v9.9.9.tar.gz", digest: rel.digest }] },
  { tag_name: "v10.0.0-rc.1", draft: false, prerelease: true, immutable: true, assets: [] },
  { tag_name: "v9.9.10", draft: true, prerelease: false, immutable: true, assets: [] },
  { tag_name: "v9.9.11", draft: false, prerelease: false, immutable: false, assets: [] },
  { tag_name: "v9.9.2", draft: false, prerelease: false, immutable: true, assets: [] },
];
const reply = (body, status = 200) => ({ ok: status < 300, status, json: async () => body, arrayBuffer: async () => { const b = Buffer.from(body); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); } });

/** A world: what GitHub serves, whether gh verifies, and a log of everything the command did. */
function world({ list = releases, bundles = { "v9.9.9": rel.bytes }, gh = "PASS", network = true } = {}) {
  const log = { fetched: [], gh: [], engine: [], engineOut: "" };
  const fetchImpl = async (url) => {
    log.fetched.push(url);
    if (!network) throw new Error("getaddrinfo ENOTFOUND github.com");
    if (url === API) return reply(list);
    const v = Object.keys(bundles).find((k) => BUNDLE_URL(k) === url);
    return v ? reply(bundles[v]) : reply("not found", 404);
  };
  const spawn = (cmd, args, opts) => {
    if (cmd === "gh") {
      log.gh.push(args);
      return gh === "PASS" ? { status: 0 } : gh === "MISSING" ? { error: new Error("spawn gh ENOENT") } : { status: 1, stderr: "verification failed: no matching attestations" };
    }
    if (cmd === process.execPath) {
      log.engine.push(args);
      const r = spawnSync(cmd, [...args, "--revocations", revocations], { ...opts, stdio: "pipe", encoding: "utf8" }); // published list stands in for the network
      log.engineOut = r.stdout + r.stderr;
      return r;
    }
    return spawnSync(cmd, args, opts);
  };
  const out = []; const err = [];
  const run = (argv, { cwd, cache, env = {} } = {}) => main(argv, { fetchImpl, spawn, cwd, env: { ...process.env, AI_NATIVE_CACHE: cache, GIT_TERMINAL_PROMPT: "0", ...env }, out: (m) => out.push(m), err: (m) => err.push(m), repo: SLUG });
  return { log, run, out, err };
}

test("release resolution: the highest STABLE, published, immutable release - never an rc, a draft or a mutable one", async () => {
  const r = await latestStable({ fetchImpl: async () => reply(releases), slug: SLUG, env: {} });
  assert.equal(r.version, "v9.9.9");
  await assert.rejects(latestStable({ fetchImpl: async () => reply([releases[1], releases[2], releases[3]]), slug: SLUG, env: {} }), /no stable, immutable release/);
  await assert.rejects(latestStable({ fetchImpl: async () => reply("x", 500), slug: SLUG, env: {} }), /cannot reach GitHub Releases \(HTTP 500\)/);
  const seen = [];
  await latestStable({ fetchImpl: async (u, o) => { seen.push(o.headers.authorization); return reply(releases); }, slug: SLUG, env: { GH_TOKEN: "t0k" } });
  assert.deepEqual(seen, ["Bearer t0k"]);
});

test("CRITICAL: EMPTY GIT REPO -> ONE public command -> adopted, lock valid, supply chain verified, adapters projected, drift clean, READY", async () => {
  const project = gitInit();
  assert.deepEqual(tree(project), []);
  const w = world();
  const code = await w.run(["init", "--profile", "python-service"], { cwd: project, cache: tmp("cache") });
  assert.equal(code, 0, w.log.engineOut + w.err.join("\n"));
  assert.match(w.log.engineOut, /^STATUS: READY\nAI-NATIVE: v9\.9\.9\nPROFILE: python-service \(chosen\)\nDRIFT: CLEAN\nATTESTATION: PASS\nREVOCATION: CHECKED\nLOCK: VALID/);
  // the attestation is demanded of the signer workflow of the official release, on the exact downloaded file
  assert.equal(w.log.gh.length, 1);
  assert.deepEqual(w.log.gh[0].slice(0, 2), ["attestation", "verify"]);
  assert.deepEqual(w.log.gh[0].slice(3), ["--repo", SLUG, "--signer-workflow", `${SLUG}/.github/workflows/release.yml`]);
  const lock = JSON.parse(readFileSync(join(project, "ai-native.lock.json"), "utf8"));
  assert.equal(lock.platform.digest, rel.digest);
  assert.equal(lock.platform.repo, `github:${SLUG}`);
  assert.equal(lock.platform.channel, "stable");
  for (const f of ["CLAUDE.md", ".mcp.json", "opencode.json", ".codex/config.toml", ".ai-native/ai-native.mjs"]) assert.ok(existsSync(join(project, f)), f);
  // and the consumer's own launcher now works from the cache the command filled
  const status = spawnSync(process.execPath, [join(project, ".ai-native", "ai-native.mjs"), "version"], { cwd: project, encoding: "utf8", env: { ...process.env, AI_NATIVE_CACHE: w.log.engine[0][w.log.engine[0].indexOf("--cache") + 1] } });
  assert.equal(status.stdout.split(String.fromCharCode(10))[0].trim(), `v9.9.9 ${"c".repeat(40)}`, status.stderr);
});

test("a second run on the adopted repository is idempotent, needs no download and changes nothing", async () => {
  const project = gitInit();
  const cache = tmp("cache");
  await world().run(["init", "--profile", "python-lib"], { cwd: project, cache });
  const snap = () => Object.fromEntries(tree(project).filter((p) => { try { readFileSync(join(project, p)); return true; } catch { return false; } }).map((p) => [p, sha256(readFileSync(join(project, p)))]));
  const before = snap();
  const w = world({ network: false });
  assert.equal(await w.run(["init", "--offline"], { cwd: project, cache }), 0, w.log.engineOut + w.err.join("\n"));
  assert.deepEqual(w.log.fetched, [], "the lock pins the release and the cache holds it with its attestation record: no network");
  assert.deepEqual(w.log.gh, []);
  assert.match(w.log.engineOut, /ADOPTION: ALREADY_ADOPTED/);
  assert.deepEqual(snap(), before);
});

test("--offline: a release this machine already verified serves a brand-new repository; with an empty cache it fails closed", async () => {
  const cache = tmp("cache");
  await world().run(["init", "--profile", "python-service"], { cwd: gitInit(), cache });
  const fresh = gitInit();
  const w = world({ network: false });
  assert.equal(await w.run(["init", "--offline", "--profile", "python-service"], { cwd: fresh, cache }), 0, w.log.engineOut + w.err.join("\n"));
  assert.deepEqual(w.log.fetched, []);
  assert.match(w.log.engineOut, /STATUS: READY[\s\S]*ATTESTATION: PASS/);
  assert.equal(newestCached(cache, SLUG).version, "v9.9.9");
  const empty = gitInit();
  const w2 = world({ network: false });
  assert.equal(await w2.run(["init", "--offline", "--profile", "python-service"], { cwd: empty, cache: tmp("cache") }), 1);
  assert.match(w2.err.join("\n"), /OFFLINE: this machine has no verified release/);
  assert.deepEqual(tree(empty), []);
});

test("no network: fail closed, say how to proceed, write nothing", async () => {
  const project = gitInit();
  const w = world({ network: false });
  assert.equal(await w.run(["init", "--profile", "python-service"], { cwd: project, cache: tmp("cache") }), 1);
  assert.match(w.err.join("\n"), /STATUS: FAILED\nERROR: cannot reach GitHub Releases .*ENOTFOUND.*--offline/);
  assert.deepEqual(tree(project), []);
});

test("supply chain: attestation failing or `gh` missing stops the run BEFORE anything runs or is written; there is no flag around it", async () => {
  for (const gh of ["FAIL", "MISSING"]) {
    const project = gitInit();
    const w = world({ gh });
    assert.equal(await w.run(["init", "--profile", "python-service"], { cwd: project, cache: tmp("cache") }), 1, gh);
    assert.match(w.err.join("\n"), gh === "FAIL" ? /ATTESTATION_FAILED: verification failed/ : /ATTESTATION_UNAVAILABLE: the GitHub CLI \(gh\)/, gh);
    assert.deepEqual(w.log.engine, [], "the downloaded code is never executed");
    assert.deepEqual(tree(project), []);
  }
  assert.throws(() => verifyAttestation({ spawn: () => ({ status: 1, stderr: "nope" }), file: "f", slug: SLUG }), /ATTESTATION_FAILED: nope/);
  const errs = [];
  assert.equal(await main(["init", "--no-attest"], { cwd: gitInit(), out() {}, err: (m) => errs.push(m), spawn: spawnSync, fetchImpl: async () => reply(releases), env: {} }), 1);
  assert.match(errs.join(" "), /unknown option: --no-attest/);
});

test("supply chain: a bundle whose digest is not the one GitHub published for the release is refused before gh or the engine", async () => {
  const forged = Buffer.from(rel.bytes); forged[forged.length - 30] ^= 1;
  const project = gitInit();
  const w = world({ bundles: { "v9.9.9": forged } });
  assert.equal(await w.run(["init", "--profile", "python-service"], { cwd: project, cache: tmp("cache") }), 1);
  assert.match(w.err.join("\n"), /DIGEST_MISMATCH/);
  assert.deepEqual(w.log.gh, []);
  assert.deepEqual(tree(project), []);
});

test("supply chain: a corrupt bundle that even passes attestation is rejected by the strict reader", async () => {
  const garbage = gzipSync(Buffer.from("this is not a tar"));
  const w = world({ list: [{ tag_name: "v9.9.9", draft: false, prerelease: false, immutable: true, assets: [{ name: "ai-native-v9.9.9.tar.gz", digest: `sha256:${sha256(garbage)}` }] }], bundles: { "v9.9.9": garbage } });
  const project = gitInit();
  assert.equal(await w.run(["init", "--profile", "python-service"], { cwd: project, cache: tmp("cache") }), 1);
  assert.match(w.err.join("\n"), /bundle rejected/);
  assert.deepEqual(w.log.engine, []);
  assert.deepEqual(tree(project), []);
});

test("a release that does not exist, an invalid --version, and an unknown option", async () => {
  const w = world();
  assert.equal(await w.run(["init", "--version", "v1.2.3", "--profile", "python-service"], { cwd: gitInit(), cache: tmp("c") }), 1);
  assert.match(w.err.join("\n"), /RELEASE_REJECTED: v1\.2\.3 of o\/ai-native is not among the published releases/);
  const w2 = world();
  assert.equal(await w2.run(["init", "--version", "latest"], { cwd: gitInit(), cache: tmp("c") }), 1);
  assert.match(w2.err.join("\n"), /invalid --version: latest/);
  assert.equal(await world().run(["init", "--yolo"], { cwd: gitInit(), cache: tmp("c") }), 1);
  assert.equal(await world().run(["frobnicate"], { cwd: gitInit(), cache: tmp("c") }), 1);
});

test("a release from before `ai-native init` existed is refused with the reason", async () => {
  const old = workingTreeRelease({ version: "v9.9.9", mutate: (f) => { delete f["runtime/bootstrap/adopt.mjs"]; return f; } });
  const w = world({ bundles: { "v9.9.9": old.bytes }, list: [{ tag_name: "v9.9.9", draft: false, prerelease: false, immutable: true, assets: [{ name: "ai-native-v9.9.9.tar.gz", digest: old.digest }] }] });
  const project = gitInit();
  assert.equal(await w.run(["init", "--profile", "python-service"], { cwd: project, cache: tmp("c") }), 1);
  assert.match(w.err.join("\n"), /predates `ai-native init`/);
  assert.deepEqual(tree(project), []);
});

test("cache tampering: a damaged blob in the cache is not trusted; the run fails closed", async () => {
  const cache = tmp("cache");
  await world().run(["init", "--profile", "python-service"], { cwd: gitInit(), cache });
  writeFileSync(blobPath(cache, rel.digest), "garbage");
  const project = gitInit();
  const w = world({ network: false });
  assert.equal(await w.run(["init", "--offline", "--profile", "python-service"], { cwd: project, cache }), 1);
  assert.match(w.err.join(" "), /CACHE_CORRUPT/);
  assert.deepEqual(tree(project), []);
});

test("an attestation record planted in the cache without the release does not make a release usable", async () => {
  const cache = tmp("cache");
  mkdirSync(join(cache, "attestations"), { recursive: true });
  const hex = rel.digest.slice(7);
  writeFileSync(join(cache, "attestations", `${hex}.json`), JSON.stringify({ digest: rel.digest, repo: SLUG, version: "v9.9.9", verifiedBy: "gh attestation verify" }));
  assert.equal(newestCached(cache, SLUG), null, "no release directory next to the record");
});

test("not inside a Git repository: refused with the remedy", async () => {
  const w = world();
  process.env.GIT_CEILING_DIRECTORIES = tmpdir();
  try {
    assert.equal(await w.run(["init"], { cwd: tmp("plain"), cache: tmp("c") }), 1);
  } finally {
    delete process.env.GIT_CEILING_DIRECTORIES;
  }
  assert.match(w.err.join("\n"), /not inside a Git repository: run `git init`/);
});

test("the stub's tar reader accepts exactly what runtime/bootstrap/tar.mjs accepts, and refuses what it refuses", () => {
  const files = unpack(rel.bytes);
  const reference = readTar(rel.bytes);
  assert.deepEqual([...files.keys()], [...reference.keys()]);
  for (const [k, v] of reference) assert.ok(files.get(k).equals(v), k);
  for (const bad of ["../x", "/abs", "a/../b", "a\\b", "C:/x", "a//b"]) {
    const tarGz = gzipSync(Buffer.from(writeTar({ ok: "1" })));
    assert.ok(unpack(tarGz).has("ok"));
    // header names are written verbatim by hand: the shared writer refuses them, so patch the header of a valid archive
    const raw = Buffer.from(writeTar({ "aaaa": "1" }));
    raw.write(bad.padEnd(100, "\0"), 0, "latin1");
    let sum = 0;
    for (let i = 0; i < 512; i += 1) sum += i >= 148 && i < 156 ? 32 : raw[i];
    raw.write(`${sum.toString(8).padStart(6, "0")}\0 `, 148, "latin1");
    assert.throws(() => unpack(gzipSync(raw)), /unsafe entry path|bundle rejected/, bad);
    assert.throws(() => readTar(gzipSync(raw)), undefined, bad);
  }
});

test("`install` puts the command on the machine: a copy and shims for sh and cmd, no PATH edits", async () => {
  const home = tmp("home");
  const out = [];
  assert.equal(await main(["install"], { env: { ...process.env, AI_NATIVE_HOME: home }, out: (m) => out.push(m), err() {} }), 0);
  const bin = join(home, "bin");
  assert.deepEqual(readdirSync(bin).sort(), ["ai-native", "ai-native.cmd", "ai-native.mjs"]);
  assert.match(readFileSync(join(bin, "ai-native"), "utf8"), /^#!\/bin\/sh\nexec node ".*ai-native\.mjs" "\$@"\n$/);
  assert.match(readFileSync(join(bin, "ai-native.cmd"), "utf8"), /^@echo off\r\nnode ".*ai-native\.mjs" %\*\r\n$/);
  assert.match(out.join("\n"), /Add it to your PATH/);
  // the installed copy is the same program
  const v = spawnSync(process.execPath, [join(bin, "ai-native.mjs"), "version"], { encoding: "utf8" });
  assert.match(v.stdout, /^ai-native cli \(/);
});

test("a lock is repository content: a malformed pinned version or repo never reaches a URL or a file name", async () => {
  for (const platform of [
    { repo: `github:${SLUG}`, version: "v1.0.0/../../x", digest: `sha256:${"a".repeat(64)}` },
    { repo: `github:${SLUG}`, version: "v1.0.0", digest: "sha256:short" },
    { repo: "https://evil.example/x", version: "v1.0.0", digest: `sha256:${"a".repeat(64)}` },
  ]) {
    const project = gitInit();
    writeFileSync(join(project, "ai-native.lock.json"), JSON.stringify({ schemaVersion: 1, platform, profiles: ["factory"] }));
    const w = world();
    assert.equal(await w.run(["init"], { cwd: project, cache: tmp("c") }), 1);
    assert.match(w.err.join("\n"), /ai-native\.lock\.json is not usable/);
    assert.deepEqual(w.log.fetched, []);
    assert.deepEqual(w.log.gh, []);
  }
});

// ---- independent audit of 41dd2a8 (AUDIT-PLATFORM-41dd2a8.md): P-01, P-03, P-05/P-06, P-07, P-09 ----

const withLock = (project, platform) => writeFileSync(join(project, "ai-native.lock.json"), JSON.stringify({ schemaVersion: 1, platform, profiles: ["factory"] }));
const revBody = (entries) => JSON.stringify({ schemaVersion: 1, n: 1, publishedAt: "2026-10-02T00:00:00Z", entries });

/** A world whose latest release also publishes revocations-1.json; `body === null` makes that download fail. */
function worldWithRevocations(body, { gh = "PASS" } = {}) {
  const list = [{ ...releases[0], assets: [...releases[0].assets, { name: "revocations-1.json" }] }, ...releases.slice(1)];
  const url = `https://github.com/${SLUG}/releases/download/v9.9.9/revocations-1.json`;
  const log = { fetched: [], gh: [], engine: [], engineOut: "" };
  const out = []; const err = [];
  const fetchImpl = async (u) => {
    log.fetched.push(u);
    if (u === API) return reply(list);
    if (u === url) return body === null ? reply("nope", 500) : reply(body);
    if (u === BUNDLE_URL("v9.9.9")) return reply(rel.bytes);
    return reply("not found", 404);
  };
  const spawn = (cmd, args, opts) => {
    if (cmd === "gh") { log.gh.push(args); return gh === "PASS" ? { status: 0 } : { status: 1, stderr: "verification failed" }; }
    if (cmd === process.execPath) {
      log.engine.push(args);
      const r = spawnSync(cmd, [...args, "--revocations", revocations], { ...opts, stdio: "pipe", encoding: "utf8" });
      log.engineOut = r.stdout + r.stderr;
      return r;
    }
    return spawnSync(cmd, args, opts);
  };
  const run = (argv, { cwd, cache } = {}) => main(argv, { fetchImpl, spawn, cwd, env: { ...process.env, AI_NATIVE_CACHE: cache, GIT_TERMINAL_PROMPT: "0" }, out: (m) => out.push(m), err: (m) => err.push(m), repo: SLUG });
  return { log, run, out, err };
}

test("P-01: the lock cannot choose the trust root; another source needs the person's explicit --trust-repo", async () => {
  const project = gitInit();
  withLock(project, { repo: "github:evil/ai-native", version: "v1.0.0", commit: "a".repeat(40), digest: `sha256:${"a".repeat(64)}` });
  const w = world();
  assert.equal(await w.run(["init"], { cwd: project, cache: tmp("c") }), 1);
  assert.match(w.err.join(" "), /TRUST_ROOT: .*pinned to releases of evil\/ai-native.*trusts only o\/ai-native.*--trust-repo evil\/ai-native/);
  assert.deepEqual(w.log.fetched, [], "nothing is fetched from the other source");
  assert.deepEqual(w.log.gh, []);
  // with the explicit word it asks THAT source (and fails here because the fake world has no such release)
  const w2 = world();
  assert.equal(await w2.run(["init", "--trust-repo", "evil/ai-native"], { cwd: project, cache: tmp("c") }), 1);
  assert.ok(w2.log.fetched.some((u) => u.includes("/repos/evil/ai-native/")));
  // --trust-repo means nothing without a lock that names it
  assert.equal(await world().run(["init", "--trust-repo", "evil/ai-native"], { cwd: gitInit(), cache: tmp("c") }), 1);
});

test("P-03: the launcher checks the attested revocations list before running any engine", async () => {
  const project = gitInit();
  const w = worldWithRevocations(revBody([{ kind: "platform", id: "ai-native", version: "v9.9.9", reason: "bad build", severity: "critical" }]));
  assert.equal(await w.run(["init", "--profile", "python-service"], { cwd: project, cache: tmp("c") }), 1);
  assert.match(w.err.join(" "), /REVOKED: v9\.9\.9 is revoked \(critical\): bad build/);
  assert.deepEqual(w.log.engine, [], "a revoked release's engine never runs");
  assert.deepEqual(tree(project), []);
  // a list that exists but cannot be read is not "not revoked"
  const unreadable = worldWithRevocations(null);
  assert.equal(await unreadable.run(["init", "--profile", "python-service"], { cwd: gitInit(), cache: tmp("c") }), 1);
  assert.match(unreadable.err.join(" "), /REVOCATION_UNKNOWN/);
  // a list whose attestation fails is not used
  const forged = worldWithRevocations(revBody([]), { gh: "FAIL" });
  assert.equal(await forged.run(["init", "--profile", "python-service"], { cwd: gitInit(), cache: tmp("c") }), 1);
  assert.match(forged.err.join(" "), /ATTESTATION_FAILED/);
  // a clean list lets it through, and both the list and the bundle were attested
  const clean = worldWithRevocations(revBody([]));
  assert.equal(await clean.run(["init", "--profile", "python-service"], { cwd: gitInit(), cache: tmp("c") }), 0, clean.log.engineOut);
  assert.equal(clean.log.gh.length, 2);
});

test("P-05/P-06: the cached unpacked release is never executed; the record must name this digest AND this source", async () => {
  const cache = tmp("cache");
  await world().run(["init", "--profile", "python-service"], { cwd: gitInit(), cache });
  const hex = rel.digest.slice(7);
  // malicious code planted in the cache's unpacked release changes nothing: that copy is not what runs
  writeFileSync(join(cache, "releases", hex, "runtime", "bootstrap", "cli.mjs"), "require('node:fs').writeFileSync(process.env.PWNED_FILE, 'x'); process.exit(0)\n");
  const pwned = join(tmp("pwn"), "pwned");
  const w = world({ network: false });
  assert.equal(await w.run(["init", "--offline", "--profile", "python-service"], { cwd: gitInit(), cache, env: { PWNED_FILE: pwned } }), 0, w.log.engineOut + w.err.join(" "));
  assert.equal(existsSync(pwned), false);
  // a record for another source, or an empty one, is not a verification
  for (const rec of [{}, { digest: rel.digest, repo: "evil/ai-native", version: "v9.9.9", verifiedBy: "gh attestation verify" }]) {
    writeFileSync(join(cache, "attestations", `${hex}.json`), JSON.stringify(rec));
    const w2 = world({ network: false });
    assert.equal(await w2.run(["init", "--offline", "--profile", "python-service"], { cwd: gitInit(), cache }), 1);
    assert.match(w2.err.join(" "), /OFFLINE/);
  }
});

test("P-07: --version cannot contradict the pinned release; P-09: a malformed digest from the API is not used", async () => {
  const project = gitInit();
  withLock(project, { repo: `github:${SLUG}`, version: "v9.9.9", commit: "c".repeat(40), digest: rel.digest });
  const w = world();
  assert.equal(await w.run(["init", "--version", "v9.9.8"], { cwd: project, cache: tmp("c") }), 1);
  assert.match(w.err.join(" "), /--version v9\.9\.8 conflicts with the release this repository is pinned to \(v9\.9\.9\)/);
  const bad = world({ list: [{ ...releases[0], assets: [{ name: "ai-native-v9.9.9.tar.gz", digest: "sha256:../../etc" }] }] });
  assert.equal(await bad.run(["init", "--profile", "python-service"], { cwd: gitInit(), cache: tmp("c") }), 1);
  assert.match(bad.err.join(" "), /RELEASE_REJECTED: v9\.9\.9 .*publishes no valid sha256 digest/);
});

// ---- final hardening: the --version and --profile contracts (N-09, P-07) ----

const releaseWith = (over = {}) => ({ ...releases[0], ...over });

test("N-09: --version selects only a stable, published, immutable release with a valid published digest; everything else is rejected fail-closed", async () => {
  const cases = [
    ["prerelease tag", ["--version", "v9.9.9-rc.1"], releases, /invalid --version: v9\.9\.9-rc\.1 \(only stable releases/],
    ["prerelease flag on a stable-looking tag", ["--version", "v9.9.9"], [releaseWith({ prerelease: true })], /RELEASE_REJECTED: v9\.9\.9 .*is a prerelease/],
    ["immutable:false", ["--version", "v9.9.9"], [releaseWith({ immutable: false })], /is not an immutable release/],
    ["immutable absent from the metadata", ["--version", "v9.9.9"], [(({ immutable, ...rest }) => rest)(releases[0])], /is not an immutable release/],
    ["draft", ["--version", "v9.9.9"], [releaseWith({ draft: true })], /is a draft/],
    ["not published at all", ["--version", "v9.9.8"], releases, /is not among the published releases/],
    ["no bundle asset", ["--version", "v9.9.9"], [releaseWith({ assets: [] })], /has no bundle asset/],
    ["digest absent", ["--version", "v9.9.9"], [releaseWith({ assets: [{ name: "ai-native-v9.9.9.tar.gz" }] })], /publishes no valid sha256 digest/],
    ["digest malformed", ["--version", "v9.9.9"], [releaseWith({ assets: [{ name: "ai-native-v9.9.9.tar.gz", digest: "md5:abc" }] })], /publishes no valid sha256 digest/],
  ];
  for (const [label, argv, list, pattern] of cases) {
    const project = gitInit();
    const w = world({ list });
    assert.equal(await w.run(["init", ...argv, "--profile", "python-service"], { cwd: project, cache: tmp("c") }), 1, label);
    assert.match(w.err.join(" "), pattern, label);
    assert.deepEqual(w.log.gh, [], `${label}: nothing is attested or executed`);
    assert.deepEqual(w.log.engine, [], label);
    assert.deepEqual(tree(project), [], label);
  }
  // the same version, valid, is accepted (and its digest is the published one, enforced against the download)
  const project = gitInit();
  const ok = world();
  assert.equal(await ok.run(["init", "--version", "v9.9.9", "--profile", "python-service"], { cwd: project, cache: tmp("c") }), 0, ok.log.engineOut + ok.err.join(" "));
  const mismatch = world({ bundles: { "v9.9.9": Buffer.concat([rel.bytes, Buffer.from([0])]) } });
  assert.equal(await mismatch.run(["init", "--version", "v9.9.9", "--profile", "python-service"], { cwd: gitInit(), cache: tmp("c") }), 1);
  assert.match(mismatch.err.join(" "), /DIGEST_MISMATCH/);
});

test("N-09: the latest-release path applies the same rule (immutable must be affirmed, a digest must be published)", async () => {
  for (const list of [[releaseWith({ immutable: false })], [(({ immutable, ...rest }) => rest)(releases[0])], [releaseWith({ assets: [] })]]) {
    const w = world({ list });
    assert.equal(await w.run(["init", "--profile", "python-service"], { cwd: gitInit(), cache: tmp("c") }), 1);
    assert.match(w.err.join(" "), /no stable, immutable release found|RELEASE_REJECTED/);
  }
});

test("N-09: offline, --version needs exactly that release verified in the cache", async () => {
  const cache = tmp("cache");
  await world().run(["init", "--profile", "python-service"], { cwd: gitInit(), cache });
  const w = world({ network: false });
  assert.equal(await w.run(["init", "--offline", "--version", "v9.9.9", "--profile", "python-service"], { cwd: gitInit(), cache }), 0, w.log.engineOut + w.err.join(" "));
  const other = world({ network: false });
  assert.equal(await other.run(["init", "--offline", "--version", "v9.9.8", "--profile", "python-service"], { cwd: gitInit(), cache }), 1);
  assert.match(other.err.join(" "), /OFFLINE: this machine has no verified v9\.9\.8 in its cache/);
});

test("P-07: with a lock, --profile is never ignored: a contradiction fails clearly, a match is accepted", async () => {
  const cache = tmp("cache");
  const project = gitInit();
  await world().run(["init", "--profile", "python-service"], { cwd: project, cache });
  const clash = world({ network: false });
  assert.equal(await clash.run(["init", "--offline", "--profile", "python-lib"], { cwd: project, cache }), 1);
  assert.match(clash.err.join(" "), /PROFILE_CONFLICT: --profile python-lib contradicts the profile this repository is pinned to \(python-service\)/);
  assert.deepEqual(clash.log.engine, []);
  const same = world({ network: false });
  assert.equal(await same.run(["init", "--offline", "--profile", "python-service"], { cwd: project, cache }), 0, same.log.engineOut + same.err.join(" "));
});
