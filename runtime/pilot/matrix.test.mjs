// M5.2: deterministic matrix, run on windows-latest and ubuntu-latest by ci.yml.
// Online is covered by pilot.yml against the real published release; here the
// network is never touched: `--offline` / `--from-file` only. Covers bootstrap,
// states (READY / NEEDS_SYNC / DEGRADED_READONLY / REVOKED), offline WITH cache,
// offline WITHOUT cache, bump (2-file footprint), and rollback, using two REAL
// builds of this commit (different versions => different digests).
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyBump } from "../migrate/bump.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const cli = join(repoRoot, "runtime", "bootstrap", "cli.mjs");
const tmp = () => mkdtempSync(join(tmpdir(), "ai-native-matrix-"));
const node = (args) => spawnSync(process.execPath, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();

function build(version) {
  const out = tmp();
  const r = node([join(repoRoot, "runtime", "release", "build.mjs"), "--version", version, "--out", out, "--commit", commit]);
  assert.equal(r.status, 0, r.stderr);
  const summary = JSON.parse(r.stdout);
  const published = JSON.parse(readFileSync(join(out, "platform.json"), "utf8"));
  return { version, bundle: join(out, summary.bundle), digest: summary.digest, commit: published.commit ?? commit };
}
const A = build("v3.0.0-alpha.1");
const B = build("v3.0.0-rc.1");

function project() {
  const proj = tmp();
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: proj });
  execFileSync("git", ["config", "user.email", "t@example.invalid"], { cwd: proj });
  execFileSync("git", ["config", "user.name", "T"], { cwd: proj });
  return proj;
}
const c = (proj, cache, ...args) => node([cli, ...args, "--project", proj, "--cache", cache, "--json"]);
const state = (proj, cache, ...extra) => JSON.parse(c(proj, cache, "status", ...extra).stdout).state;
const lockOf = (proj) => JSON.parse(readFileSync(join(proj, "ai-native.lock.json"), "utf8"));
const initLock = (proj, cache, rel) => {
  const r = c(proj, cache, "init", "--bundle", rel.bundle, "--repo", "github:o/ai-native", "--profile", "factory", "--channel", "rc");
  assert.equal(r.status, 0, r.stdout + r.stderr);
};

test("states: NOT_ADOPTED -> NEEDS_SYNC -> READY, and a missing cache offline is DEGRADED_READONLY", () => {
  const proj = project();
  const cache = tmp();
  assert.equal(state(proj, cache), "NOT_ADOPTED");
  initLock(proj, cache, A);
  assert.equal(state(proj, cache), "NEEDS_SYNC");
  assert.equal(state(proj, cache, "--offline"), "DEGRADED_READONLY"); // offline WITHOUT cache
  assert.equal(c(proj, cache, "status", "--offline", "--check").status !== 0, true, "--check fails when not READY");
  const sync = c(proj, cache, "sync", "--from-file", A.bundle, "--offline");
  assert.equal(sync.status, 0, sync.stdout + sync.stderr);
  assert.equal(state(proj, cache), "READY");
  assert.equal(c(proj, cache, "status", "--check").status, 0);
});

test("offline WITH cache: sync --offline needs no bundle and no network; run executes the cached release", () => {
  const proj = project();
  const cache = tmp();
  initLock(proj, cache, A);
  assert.equal(c(proj, cache, "sync", "--from-file", A.bundle, "--offline").status, 0);
  const again = c(proj, cache, "sync", "--offline");
  assert.equal(again.status, 0, again.stdout + again.stderr);
  const version = node([cli, "run", "--project", proj, "--cache", cache, "--", "version"]);
  assert.match(version.stdout, /^v3\.0\.0-alpha\.1 /);
});

test("offline WITHOUT cache: sync fails explicitly, the lock and the project stay untouched", () => {
  const proj = project();
  const cache = tmp();
  initLock(proj, cache, A);
  const before = readFileSync(join(proj, "ai-native.lock.json"), "utf8");
  const r = c(proj, cache, "sync", "--offline");
  assert.notEqual(r.status, 0);
  assert.equal(readFileSync(join(proj, "ai-native.lock.json"), "utf8"), before);
  assert.equal(existsSync(join(cache, "releases")), false, "nothing was cached");
  assert.equal(execFileSync("git", ["status", "--porcelain"], { cwd: proj, encoding: "utf8" }).trim(), "?? ai-native.lock.json");
});

test("bump A -> B changes only the lock; sync B; then rollback restores A from the cache alone", () => {
  const proj = project();
  const cache = tmp();
  initLock(proj, cache, A);
  c(proj, cache, "sync", "--from-file", A.bundle, "--offline");
  execFileSync("git", ["add", "-A"], { cwd: proj });
  execFileSync("git", ["commit", "-q", "-m", "adopt"], { cwd: proj });

  const out = applyBump({ projectRoot: proj, release: { version: B.version, commit: B.commit, digest: B.digest } });
  assert.deepEqual(out.changed, ["ai-native.lock.json"]);
  assert.equal(execFileSync("git", ["diff", "--name-only"], { cwd: proj, encoding: "utf8" }).trim(), "ai-native.lock.json");
  assert.equal(lockOf(proj).platform.version, B.version);
  assert.equal(state(proj, cache), "NEEDS_SYNC"); // lock moved, cache has only A

  assert.equal(c(proj, cache, "sync", "--from-file", B.bundle, "--offline").status !== 1, true);
  assert.equal(state(proj, cache), "READY");
  assert.match(node([cli, "run", "--project", proj, "--cache", cache, "--", "version"]).stdout, /^v3\.0\.0-rc\.1 /);

  const back = c(proj, cache, "rollback");
  assert.equal(back.status, 0, back.stdout + back.stderr);
  assert.equal(lockOf(proj).platform.version, A.version);
  assert.equal(lockOf(proj).platform.digest, A.digest);
  assert.equal(state(proj, cache), "READY");
  assert.equal(execFileSync("git", ["status", "--porcelain"], { cwd: proj, encoding: "utf8" }).trim(), "", "rollback leaves the repo exactly as adopted");
});

test("REVOKED: a revoked version is reported by status and refused by sync, with nothing cached", () => {
  const proj = project();
  const cache = tmp();
  initLock(proj, cache, B);
  const rev = join(tmp(), "rev.json");
  writeFileSync(rev, JSON.stringify({ schemaVersion: 1, n: 1, publishedAt: "2026-10-03T00:00:00Z", entries: [{ kind: "platform", id: "ai-native", version: B.version, reason: "test", severity: "high" }] }));
  assert.equal(state(proj, cache, "--revocations", rev), "REVOKED");
  const s = c(proj, cache, "sync", "--from-file", B.bundle, "--revocations", rev);
  assert.notEqual(s.status, 0);
  assert.match(s.stdout, /revoked/);
  assert.equal(existsSync(join(cache, "blobs")), false);
});

test("the release entry point exposes status", () => {
  const proj = project();
  const cache = tmp();
  initLock(proj, cache, A);
  c(proj, cache, "sync", "--from-file", A.bundle, "--offline");
  const r = node([cli, "run", "--project", proj, "--cache", cache, "--", "status", "--project", proj, "--cache", cache, "--json"]);
  assert.match(r.stdout, /"state":\s*"READY"/);
  rmSync(proj, { recursive: true, force: true });
});

