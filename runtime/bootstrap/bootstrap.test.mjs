// M4.1 tests: PAR-CACHE-*, PAR-REFERENCE-BASED-CAPABILITIES,
// PAR-MINIMAL-CONSUMER-FOOTPRINT, PAR-ROLLBACK-*, PAR-REPRODUCIBLE-INIT, PAR-DOCTOR.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, existsSync, utimesSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { writeTar, readTar, BundleFormatError } from "./tar.mjs";
import {
  sha256, putBlob, getBlob, putRelease, verifyRelease, releaseDir, blobPath, sweepStaging,
  CacheCorruptError,
} from "./cache.mjs";
import { sync, rollback, init, doctor, run, readLock, LOCK_FILE } from "./install.mjs";

const COMMIT_A = "a".repeat(40);
const COMMIT_B = "b".repeat(40);

function tmp(prefix) {
  return mkdtempSync(join(tmpdir(), `ai-native-boot-${prefix}-`));
}
function cleanup(...dirs) {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
}

function platformJson(version, commit, unitEvent = "1") {
  return JSON.stringify({
    schemaVersion: 1,
    version,
    commit,
    digest: `sha256:${"0".repeat(64)}`,
    generatedAt: "2026-10-02T00:00:00Z",
    components: { "unit-event": { version: unitEvent } },
    capabilities: [],
  });
}

function makeBundle(dir, name, version, commit, extra = {}, unitEvent = "1") {
  const files = {
    "platform.json": platformJson(version, commit, unitEvent),
    "runtime/main.mjs": `console.log("ran ${version}");`,
    "runtime/bootstrap/install.mjs": `// ${version}`,
    ...extra,
  };
  const bytes = writeTar(files);
  const file = join(dir, name);
  writeFileSync(file, bytes);
  return { file, bytes, digest: `sha256:${sha256(bytes)}` };
}

function writeLock(project, version, commit, digest) {
  writeFileSync(
    join(project, LOCK_FILE),
    JSON.stringify({ schemaVersion: 1, platform: { repo: "github:o/ai-native", version, commit, digest }, profiles: ["factory"] }),
  );
}

function env() {
  const project = tmp("proj");
  const cache = tmp("cache");
  const assets = tmp("assets");
  return { project, cache, assets, done: () => cleanup(project, cache, assets) };
}

test("sync --from-file installs, activates and rejects a digest that does not match the lock", () => {
  const e = env();
  try {
    const good = makeBundle(e.assets, "a.tar", "v3.0.0-alpha.1", COMMIT_A);
    const other = makeBundle(e.assets, "b.tar", "v3.0.0-alpha.2", COMMIT_B);
    writeLock(e.project, "v3.0.0-alpha.1", COMMIT_A, good.digest);
    const bad = sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: other.file });
    assert.equal(bad.status, "FAIL");
    assert.match(bad.errors[0], /does not match lock/);
    assert.equal(existsSync(join(e.cache, "blobs")), false, "nothing cached on digest mismatch");
    const ok = sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: good.file });
    assert.equal(ok.status, "PASS");
    assert.equal(ok.cacheHit, false);
    assert.equal(readFileSync(join(releaseDir(e.cache, good.digest), "runtime", "main.mjs"), "utf8"), 'console.log("ran v3.0.0-alpha.1");');
  } finally { e.done(); }
});

test("PAR-CACHE-HIT-FAST-PATH: a second sync needs no bundle file and reads no blob", () => {
  const e = env();
  try {
    const b = makeBundle(e.assets, "a.tar", "v3.0.0-alpha.1", COMMIT_A);
    writeLock(e.project, "v3.0.0-alpha.1", COMMIT_A, b.digest);
    sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: b.file });
    rmSync(b.file);
    rmSync(blobPath(e.cache, b.digest));
    const again = sync({ projectRoot: e.project, cacheRoot: e.cache });
    assert.equal(again.status, "PASS");
    assert.equal(again.cacheHit, true);
    assert.equal(again.changed, false);
  } finally { e.done(); }
});

test("PAR-CACHE-CORRUPT: a corrupted blob/release is evicted, never returned, and re-installable", () => {
  const e = env();
  try {
    const b = makeBundle(e.assets, "a.tar", "v3.0.0-alpha.1", COMMIT_A);
    writeLock(e.project, "v3.0.0-alpha.1", COMMIT_A, b.digest);
    sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: b.file });
    writeFileSync(blobPath(e.cache, b.digest), "tampered");
    assert.throws(() => getBlob(e.cache, b.digest), CacheCorruptError);
    assert.equal(existsSync(blobPath(e.cache, b.digest)), false);
    writeFileSync(join(releaseDir(e.cache, b.digest), "runtime", "main.mjs"), "evil()");
    assert.throws(() => verifyRelease(e.cache, b.digest), CacheCorruptError);
    assert.equal(existsSync(releaseDir(e.cache, b.digest)), false);
    const heal = sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: b.file });
    assert.equal(heal.status, "PASS");
    verifyRelease(e.cache, b.digest);
  } finally { e.done(); }
});

test("PAR-CACHE-CORRUPT: an extra file planted in a release is detected", () => {
  const e = env();
  try {
    const b = makeBundle(e.assets, "a.tar", "v3.0.0-alpha.1", COMMIT_A);
    writeLock(e.project, "v3.0.0-alpha.1", COMMIT_A, b.digest);
    sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: b.file });
    writeFileSync(join(releaseDir(e.cache, b.digest), "runtime", "planted.mjs"), "x");
    assert.throws(() => verifyRelease(e.cache, b.digest), /unexpected=\[runtime\/planted.mjs\]/);
  } finally { e.done(); }
});

test("PAR-CACHE-PARTIAL: debris in tmp/ is never an entry; stale debris is swept", () => {
  const e = env();
  try {
    const digest = `sha256:${sha256("x")}`;
    mkdirSync(join(e.cache, "tmp", "123-abc"), { recursive: true });
    writeFileSync(join(e.cache, "tmp", "123-abc", "half"), "par");
    assert.equal(existsSync(blobPath(e.cache, digest)), false);
    assert.equal(existsSync(releaseDir(e.cache, digest)), false);
    assert.equal(sweepStaging(e.cache), 0, "fresh staging is left alone (may be a live writer)");
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000);
    utimesSync(join(e.cache, "tmp", "123-abc"), old, old);
    assert.equal(sweepStaging(e.cache), 1);
    assert.deepEqual(readdirSync(join(e.cache, "tmp")), []);
  } finally { e.done(); }
});

test("PAR-CACHE-CONCURRENT: parallel installers of the same bundle all succeed with one intact entry", async () => {
  const e = env();
  try {
    const b = makeBundle(e.assets, "a.tar", "v3.0.0-alpha.1", COMMIT_A);
    writeLock(e.project, "v3.0.0-alpha.1", COMMIT_A, b.digest);
    const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));
    const runOne = () => new Promise((resolve) => {
      const p = spawn(process.execPath, [cli, "sync", "--project", e.project, "--cache", e.cache, "--from-file", b.file, "--json"], { stdio: "pipe" });
      let out = "";
      p.stdout.on("data", (d) => { out += d; });
      p.on("close", (code) => resolve({ code, out }));
    });
    const results = await Promise.all(Array.from({ length: 6 }, runOne));
    for (const r of results) assert.equal(r.code, 0, r.out);
    verifyRelease(e.cache, b.digest);
    assert.deepEqual(readdirSync(join(e.cache, "releases")), [b.digest.slice(7)]);
  } finally { e.done(); }
});

test("PAR-CACHE-TRAVERSAL: hostile archive entries and digests are rejected", () => {
  for (const name of ["../evil", "/abs", "a/../../b", "a\\b", "C:/x", "a//b"]) {
    const bytes = writeTar({ "platform.json": "{}", [name]: "x" });
    assert.throws(() => readTar(bytes), BundleFormatError, name);
  }
  const root = tmp("trav");
  try {
    assert.throws(() => putRelease(root, `sha256:${"1".repeat(64)}`, new Map([["../../escape", Buffer.from("x")]])), BundleFormatError);
    assert.throws(() => blobPath(root, "sha256:../../etc/passwd"), /invalid digest/);
    assert.equal(existsSync(join(root, "..", "escape")), false);
  } finally { cleanup(root); }
  const sym = Buffer.from(writeTar({ f: "x" }));
  sym[156] = "2".charCodeAt(0);
  let sum = 0;
  for (let i = 0; i < 512; i += 1) sum += i >= 148 && i < 156 ? 32 : sym[i];
  sym.write(`${sum.toString(8).padStart(6, "0")}\0 `, 148, 8);
  assert.throws(() => readTar(sym), /unsupported entry type/);
});

test("tar: gzip input is accepted and tar output is deterministic", () => {
  const files = { b: "2", a: "1" };
  assert.deepEqual(writeTar(files), writeTar({ a: "1", b: "2" }));
  assert.deepEqual([...readTar(gzipSync(writeTar(files))).keys()], ["a", "b"]);
});

test("sync rejects a bundle whose platform.json disagrees with the lock", () => {
  const e = env();
  try {
    const b = makeBundle(e.assets, "a.tar", "v3.0.0-alpha.1", COMMIT_A);
    writeLock(e.project, "v3.0.0-alpha.1", COMMIT_B, b.digest);
    const r = sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: b.file });
    assert.equal(r.status, "FAIL");
    assert.match(r.errors[0], /does not match the lock/);
  } finally { e.done(); }
});

test("sync blocks a revoked platform version before touching the cache", () => {
  const e = env();
  try {
    const b = makeBundle(e.assets, "a.tar", "v3.0.0-alpha.1", COMMIT_A);
    writeLock(e.project, "v3.0.0-alpha.1", COMMIT_A, b.digest);
    const revocations = { entries: [{ kind: "platform", id: "ai-native", version: "v3.0.0-alpha.1", reason: "cve", severity: "critical" }] };
    const r = sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: b.file, revocations });
    assert.equal(r.status, "FAIL");
    assert.match(r.errors[0], /revoked \(critical\)/);
    assert.equal(existsSync(join(e.cache, "blobs")), false);
  } finally { e.done(); }
});

test("sync without a cached release or --from-file fails explicitly (no network source yet)", () => {
  const e = env();
  try {
    writeLock(e.project, "v3.0.0-alpha.1", COMMIT_A, `sha256:${"3".repeat(64)}`);
    const r = sync({ projectRoot: e.project, cacheRoot: e.cache });
    assert.equal(r.status, "FAIL");
    assert.match(r.errors[0], /not in the cache/);
  } finally { e.done(); }
});

test("PAR-REFERENCE-BASED-CAPABILITIES / PAR-MINIMAL-CONSUMER-FOOTPRINT: the consumer keeps only the lock", () => {
  const e = env();
  try {
    const b = makeBundle(e.assets, "a.tar", "v3.0.0-alpha.1", COMMIT_A);
    const r = init({ projectRoot: e.project, bundleFile: b.file, repo: "github:o/ai-native", profiles: ["factory"] });
    assert.equal(r.status, "PASS");
    sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: b.file });
    assert.deepEqual(readdirSync(e.project), [LOCK_FILE]);
    assert.equal(readLock(e.project).lock.platform.digest, b.digest);
  } finally { e.done(); }
});

test("PAR-REPRODUCIBLE-INIT: same inputs give a byte-identical lock; existing lock needs --force", () => {
  const e = env();
  const p2 = tmp("proj2");
  try {
    const b = makeBundle(e.assets, "a.tar", "v3.0.0-alpha.1", COMMIT_A);
    const args = { bundleFile: b.file, repo: "github:o/ai-native", profiles: ["factory", "testing"], mcpProfiles: ["none"] };
    init({ projectRoot: e.project, ...args });
    init({ projectRoot: p2, ...args });
    assert.equal(readFileSync(join(e.project, LOCK_FILE), "utf8"), readFileSync(join(p2, LOCK_FILE), "utf8"));
    assert.equal(init({ projectRoot: e.project, ...args }).status, "FAIL");
    assert.equal(init({ projectRoot: e.project, ...args, force: true }).status, "PASS");
    assert.equal(init({ projectRoot: p2, ...args, bundleFile: join(e.assets, "missing.tar"), force: true }).status, "FAIL");
  } finally { e.done(); cleanup(p2); }
});

test("PAR-ROLLBACK-OFFLINE: rollback re-pins the lock to the previous release using only the cache", () => {
  const e = env();
  try {
    const v1 = makeBundle(e.assets, "1.tar", "v3.0.0-alpha.1", COMMIT_A);
    const v2 = makeBundle(e.assets, "2.tar", "v3.0.0-alpha.2", COMMIT_B);
    writeLock(e.project, "v3.0.0-alpha.1", COMMIT_A, v1.digest);
    sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: v1.file });
    writeLock(e.project, "v3.0.0-alpha.2", COMMIT_B, v2.digest);
    const upgrade = sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: v2.file });
    assert.equal(upgrade.changed, true);
    rmSync(e.assets, { recursive: true, force: true });
    const r = rollback({ projectRoot: e.project, cacheRoot: e.cache });
    assert.equal(r.status, "PASS", JSON.stringify(r.errors));
    const lock = readLock(e.project).lock;
    assert.equal(lock.platform.version, "v3.0.0-alpha.1");
    assert.equal(lock.platform.commit, COMMIT_A);
    assert.equal(lock.platform.digest, v1.digest);
    assert.equal(lock.profiles[0], "factory", "non-platform lock fields are preserved");
    assert.equal(rollback({ projectRoot: e.project, cacheRoot: e.cache }).status, "FAIL", "nothing older to go back to");
  } finally { e.done(); }
});

test("PAR-ROLLBACK-WITH-NEWER-ARTIFACTS: refuses over artifacts newer than the target reads, unless forced", () => {
  const e = env();
  try {
    const v1 = makeBundle(e.assets, "1.tar", "v3.0.0-alpha.1", COMMIT_A, {}, "1");
    const v2 = makeBundle(e.assets, "2.tar", "v3.0.0-alpha.2", COMMIT_B, {}, "2");
    writeLock(e.project, "v3.0.0-alpha.1", COMMIT_A, v1.digest);
    sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: v1.file });
    writeLock(e.project, "v3.0.0-alpha.2", COMMIT_B, v2.digest);
    sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: v2.file });
    mkdirSync(join(e.project, "runs", "u1"), { recursive: true });
    writeFileSync(join(e.project, "runs", "u1", "events.jsonl"), `${JSON.stringify({ schemaVersion: 2 })}\n`);
    const refused = rollback({ projectRoot: e.project, cacheRoot: e.cache });
    assert.equal(refused.status, "FAIL");
    assert.match(refused.errors[0], /runs\/u1\/events.jsonl/);
    assert.equal(readLock(e.project).lock.platform.version, "v3.0.0-alpha.2", "lock untouched on refusal");
    const forced = rollback({ projectRoot: e.project, cacheRoot: e.cache, force: true });
    assert.equal(forced.status, "PASS_WITH_WARNINGS");
  } finally { e.done(); }
});

test("RESTART_REQUIRED: a release that changes the bootstrap code is flagged; one that does not is not", () => {
  const e = env();
  try {
    const v1 = makeBundle(e.assets, "1.tar", "v3.0.0-alpha.1", COMMIT_A);
    const v2 = makeBundle(e.assets, "2.tar", "v3.0.0-alpha.2", COMMIT_B);
    const v3 = makeBundle(e.assets, "3.tar", "v3.0.0-alpha.3", "c".repeat(40), { "runtime/bootstrap/install.mjs": `// ${"v3.0.0-alpha.2"}` });
    writeLock(e.project, "v3.0.0-alpha.1", COMMIT_A, v1.digest);
    assert.equal(sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: v1.file }).restartRequired, false, "first install: nothing to restart");
    writeLock(e.project, "v3.0.0-alpha.2", COMMIT_B, v2.digest);
    const changed = sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: v2.file });
    assert.equal(changed.restartRequired, true);
    assert.equal(changed.status, "PASS_WITH_WARNINGS");
    assert.match(changed.warnings[0], /^RESTART_REQUIRED/);
    writeLock(e.project, "v3.0.0-alpha.3", "c".repeat(40), v3.digest);
    assert.equal(sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: v3.file }).restartRequired, false, "identical bootstrap code");
  } finally { e.done(); }
});

test("PAR-CACHE-VERIFY-BEFORE-EXEC: run executes a verified release and refuses a tampered one", () => {
  const e = env();
  try {
    const b = makeBundle(e.assets, "a.tar", "v3.0.0-alpha.1", COMMIT_A);
    writeLock(e.project, "v3.0.0-alpha.1", COMMIT_A, b.digest);
    sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: b.file });
    const calls = [];
    const fake = (...a) => { calls.push(a); return { status: 0 }; };
    assert.equal(run({ projectRoot: e.project, cacheRoot: e.cache, spawn: fake, args: ["x"] }).status, "PASS");
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0][1].slice(1), ["x"]);
    writeFileSync(join(releaseDir(e.cache, b.digest), "runtime", "main.mjs"), "evil()");
    const refused = run({ projectRoot: e.project, cacheRoot: e.cache, spawn: fake });
    assert.equal(refused.status, "FAIL");
    assert.match(refused.errors[0], /refusing to execute/);
    assert.equal(calls.length, 1, "the tampered release was never spawned");
  } finally { e.done(); }
});

test("PAR-DOCTOR: reports node/git/lock/active/cache and flags each broken state", () => {
  const e = env();
  try {
    assert.equal(doctor({ projectRoot: e.project, cacheRoot: e.cache }).status, "FAIL", "no lock");
    const b = makeBundle(e.assets, "a.tar", "v3.0.0-alpha.1", COMMIT_A);
    writeLock(e.project, "v3.0.0-alpha.1", COMMIT_A, b.digest);
    const unsynced = doctor({ projectRoot: e.project, cacheRoot: e.cache });
    assert.equal(unsynced.status, "FAIL");
    assert.ok(unsynced.errors.some((m) => m.startsWith("active release")));
    sync({ projectRoot: e.project, cacheRoot: e.cache, fromFile: b.file });
    const healthy = doctor({ projectRoot: e.project, cacheRoot: e.cache });
    assert.equal(healthy.status, "PASS", JSON.stringify(healthy.errors));
    assert.equal(doctor({ projectRoot: e.project, cacheRoot: e.cache, nodeVersion: "18.0.0" }).status, "FAIL");
    writeFileSync(join(releaseDir(e.cache, b.digest), "platform.json"), "{}");
    const corrupt = doctor({ projectRoot: e.project, cacheRoot: e.cache });
    assert.equal(corrupt.status, "FAIL");
    assert.ok(corrupt.errors.some((m) => m.startsWith("cache integrity")));
  } finally { e.done(); }
});

test("putBlob is idempotent and content-addressed", () => {
  const root = tmp("blob");
  try {
    const d1 = putBlob(root, Buffer.from("hello"));
    const d2 = putBlob(root, Buffer.from("hello"));
    assert.equal(d1, d2);
    assert.equal(d1, `sha256:${sha256("hello")}`);
    assert.equal(getBlob(root, d1).toString(), "hello");
  } finally { cleanup(root); }
});
