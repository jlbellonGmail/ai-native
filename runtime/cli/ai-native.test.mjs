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
  assert.equal(await w.run(["init"], { cwd: project, cache }), 0, w.log.engineOut + w.err.join("\n"));
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
  const w = world({ list: [{ tag_name: "v9.9.9", draft: false, prerelease: false, immutable: true, assets: [] }], bundles: { "v9.9.9": garbage } });
  const project = gitInit();
  assert.equal(await w.run(["init", "--profile", "python-service"], { cwd: project, cache: tmp("cache") }), 1);
  assert.match(w.err.join("\n"), /bundle rejected/);
  assert.deepEqual(w.log.engine, []);
  assert.deepEqual(tree(project), []);
});

test("a release that does not exist, an invalid --version, and an unknown option", async () => {
  const w = world();
  assert.equal(await w.run(["init", "--version", "v1.2.3", "--profile", "python-service"], { cwd: gitInit(), cache: tmp("c") }), 1);
  assert.match(w.err.join("\n"), /cannot download .*v1\.2\.3.*HTTP 404/);
  const w2 = world();
  assert.equal(await w2.run(["init", "--version", "latest"], { cwd: gitInit(), cache: tmp("c") }), 1);
  assert.match(w2.err.join("\n"), /invalid --version: latest/);
  assert.equal(await world().run(["init", "--yolo"], { cwd: gitInit(), cache: tmp("c") }), 1);
  assert.equal(await world().run(["frobnicate"], { cwd: gitInit(), cache: tmp("c") }), 1);
});

test("a release from before `ai-native init` existed is refused with the reason", async () => {
  const old = workingTreeRelease({ version: "v9.9.9", mutate: (f) => { delete f["runtime/bootstrap/adopt.mjs"]; return f; } });
  const w = world({ bundles: { "v9.9.9": old.bytes }, list: [{ tag_name: "v9.9.9", draft: false, prerelease: false, immutable: true, assets: [] }] });
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
  assert.match(w.log.engineOut, /STATUS: FAILED/);
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
