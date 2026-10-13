// `ai-native init` engine (runtime/bootstrap/adopt.mjs): from a Git repository to a READY consumer, with the supply-chain gates failing closed.
// Hermetic: a release bundle built from the working tree, injected revocations, no network, no gh.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { adopt, attestationPath, readAttestation } from "./adopt.mjs";
import { sha256, blobPath, releaseDir } from "./cache.mjs";
import { readLock } from "./install.mjs";
import { workingTreeRelease, record } from "../../evaluation/fixtures/working-tree-release.mjs";

const made = [];
after(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })));
const tmp = (p) => { const d = mkdtempSync(join(tmpdir(), `adopt-${p}-`)); made.push(d); return d; };
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" });
const repo = () => { const d = tmp("repo"); git(d, "init", "-q"); return d; };
const REPO = "github:o/ai-native";
const CLEAN = async () => ({ list: { entries: [] }, errors: [], warnings: [] });

const rel = workingTreeRelease();
const bundle = join(tmp("bundle"), "ai-native-v9.9.9.tar.gz");
writeFileSync(bundle, rel.bytes);

const run = (projectRoot, cacheRoot, extra = {}) => adopt({ projectRoot, cacheRoot, repo: REPO, bundleFile: bundle, attestationRecord: record(rel), version: "v9.9.9", profile: "python-service", fetchRevocationsImpl: CLEAN, ...extra });
const tree = (root) => readdirSync(root, { recursive: true }).map(String).filter((p) => p !== ".git" && !/^\.git[\\/]/.test(p)).sort();

test("EMPTY GIT REPO -> one call -> lock valid, supply chain verified, adapters projected, drift clean, READY", async () => {
  const project = repo();
  assert.deepEqual(tree(project), []);
  const r = await run(project, tmp("cache"));
  assert.equal(r.status, "PASS_WITH_WARNINGS", JSON.stringify(r.errors)); // the only warning: AGENTS.md is the project's own and is not there yet
  assert.deepEqual(r.warnings.map((w) => w.split(" ")[0]), ["AGENTS.md"]);
  assert.equal(r.state, "READY");
  assert.equal(r.version, "v9.9.9");
  assert.equal(r.drift, "CLEAN");
  assert.equal(r.attestation, "PASS");
  assert.equal(r.revocation, "CHECKED");
  assert.match(r.text, /^STATUS: READY\nAI-NATIVE: v9.9.9\nPROFILE: python-service \(chosen\)\nDRIFT: CLEAN\nATTESTATION: PASS/);
  const { lock, errors } = readLock(project);
  assert.deepEqual(errors, []);
  assert.equal(lock.platform.digest, rel.digest);
  assert.deepEqual(lock.profiles, ["python-service"]);
  for (const f of ["CLAUDE.md", ".mcp.json", "opencode.json", ".codex/config.toml", ".ai-native/ai-native.mjs", ".ai-native/adoption-journal.json"]) assert.ok(existsSync(join(project, f)), f);
  assert.match(git(project, "status", "--short"), /^A /m, "managed files are staged (a clean clone gets them)");
  assert.equal(git(project, "diff", "--name-only").trim(), "", "nothing left unstaged");
  assert.throws(() => git(project, "rev-parse", "--verify", "-q", "HEAD"), "init never commits");
});

test("repo with only a README and no signal: the profile is asked for (never guessed); no question available -> fail closed, nothing written", async () => {
  const project = repo();
  writeFileSync(join(project, "README.md"), "# x\n");
  const cache = tmp("cache");
  const closed = await run(project, cache, { profile: null });
  assert.equal(closed.status, "FAIL");
  assert.match(closed.errors[0], /PROFILE_REQUIRED.*ai-native init --profile <python-service\|python-lib/);
  assert.deepEqual(tree(project), ["README.md"]);
  let offered;
  const asked = await run(project, cache, { profile: null, ask: async (o) => { offered = o; return "python-lib"; } });
  assert.equal(asked.state, "READY");
  assert.ok(!offered.includes("testing"), "the fixture profile is never offered");
  assert.equal(readLock(project).lock.profiles[0], "python-lib");
});

test("the profile is detected from the repository when it can be", async () => {
  const project = repo();
  writeFileSync(join(project, "pyproject.toml"), '[project]\nname = "x"\ndependencies = ["fastapi"]\n');
  const r = await run(project, tmp("cache"), { profile: null });
  assert.equal(r.state, "READY");
  assert.equal(r.profile, "python-service");
  assert.match(r.how, /detected: pyproject\.toml/);
});

test("an unknown profile is rejected with the valid choices and nothing is written", async () => {
  const project = repo();
  const r = await run(project, tmp("cache"), { profile: "nope" });
  assert.equal(r.status, "FAIL");
  assert.match(r.errors[0], /unknown profile 'nope'; available: python-service, python-lib/);
  assert.deepEqual(tree(project), []);
});

test("no remote and a remote are both fine; the remote is reported", async () => {
  const bare = repo();
  assert.equal((await run(bare, tmp("cache"))).remote, null);
  const withRemote = repo();
  git(withRemote, "remote", "add", "origin", "https://github.com/o/gi-common-reference.git");
  assert.equal((await run(withRemote, tmp("cache"))).remote, "https://github.com/o/gi-common-reference.git");
});

test("a repository with commits is adopted too, and the second run is idempotent: ALREADY_ADOPTED, no byte changes", async () => {
  const project = repo();
  writeFileSync(join(project, "README.md"), "# x\n");
  git(project, "add", "."); git(project, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "init");
  const cache = tmp("cache");
  const first = await run(project, cache);
  assert.equal(first.adoption, "ADOPTED");
  const snapshot = () => Object.fromEntries(tree(project).filter((p) => existsSync(join(project, p)) && !readdirSafe(join(project, p))).map((p) => [p, sha256(readFileSync(join(project, p)))]));
  const before = snapshot();
  const conflict = await run(project, cache, { profile: "python-lib" }); // a contradicting --profile is an error, never silently ignored
  assert.equal(conflict.status, "FAIL");
  assert.match(conflict.errors[0], /PROFILE_CONFLICT: --profile python-lib contradicts the profile this repository is pinned to \(python-service\)/);
  const second = await run(project, cache, { profile: "python-service" }); // the same profile as the lock is accepted and revalidated
  assert.equal(second.state, "READY");
  assert.match(second.adoption, /^ALREADY_ADOPTED/);
  assert.equal(second.drift, "CLEAN");
  assert.deepEqual(snapshot(), before);
  assert.deepEqual(readLock(project).lock.profiles, ["python-service"]);
});
const readdirSafe = (p) => { try { return readdirSync(p).length >= 0; } catch { return false; } };

test("not a Git repository, or a subdirectory of one: refused with the remedy", async () => {
  const plain = tmp("plain");
  process.env.GIT_CEILING_DIRECTORIES = tmpdir(); // the machine running the tests may keep its home directory under Git
  try {
    assert.match((await run(plain, tmp("cache"))).errors[0], /not inside a Git repository: run `git init`/);
  } finally {
    delete process.env.GIT_CEILING_DIRECTORIES;
  }
  const project = repo();
  mkdirSync(join(project, "sub"));
  assert.match((await run(join(project, "sub"), tmp("cache"))).errors[0], /run it from the repository root/);
});

test("FAIL CLOSED without a verified attestation: no record, wrong record, and the cache is not a way around it", async () => {
  const project = repo();
  const cache = tmp("cache");
  const none = await run(project, cache, { attestationRecord: null });
  assert.match(none.errors[0], /ATTESTATION_NOT_VERIFIED/);
  const other = await run(project, cache, { attestationRecord: { ...record(rel), digest: `sha256:${"1".repeat(64)}` } });
  assert.match(other.errors[0], /attestation record is for sha256:1{64}, not for this bundle/);
  const forged = await run(project, cache, { attestationRecord: { ...record(rel), verifiedBy: "me" } });
  assert.match(forged.errors[0], /not produced by a verified `gh attestation verify`/);
  assert.equal(readAttestation(tmp("empty-cache"), rel.digest), null);
  const fresh = repo();
  const viaCache = await adopt({ projectRoot: fresh, cacheRoot: tmp("cache2"), repo: REPO, digest: rel.digest, profile: "python-service", fetchRevocationsImpl: CLEAN });
  assert.match(viaCache.errors[0], /no bundle/, "no bundle and nothing cached");
  assert.deepEqual(tree(project), []);
  assert.deepEqual(tree(fresh), []);
});

test("a corrupt bundle, a wrong digest and a wrong version stop before anything is written", async () => {
  const corrupt = join(tmp("bad"), "corrupt.tar.gz");
  const bytes = Buffer.from(rel.bytes);
  bytes[bytes.length - 20] ^= 0xff;
  writeFileSync(corrupt, bytes);
  for (const [name, extra, pattern] of [
    ["corrupt", { bundleFile: corrupt, attestationRecord: { ...record(rel), digest: `sha256:${sha256(bytes)}` } }, /^bundle rejected/],
    ["digest", { digest: `sha256:${"2".repeat(64)}` }, /does not match the expected digest/],
    ["version", { version: "v1.2.3" }, /platform\.json says v9\.9\.9, expected v1\.2\.3/],
  ]) {
    const project = repo();
    const r = await run(project, tmp("cache"), extra);
    assert.equal(r.status, "FAIL", name);
    assert.match(r.errors[0], pattern, name);
    assert.deepEqual(tree(project), [], name);
  }
});

test("a release that predates `ai-native init` is refused", async () => {
  const old = workingTreeRelease({ mutate: (f) => { delete f["runtime/bootstrap/adopt.mjs"]; return f; } });
  const file = join(tmp("old"), "old.tar.gz");
  writeFileSync(file, old.bytes);
  const r = await run(repo(), tmp("cache"), { bundleFile: file, attestationRecord: record(old) });
  assert.match(r.errors[0], /predates `ai-native init`/);
});

test("revocations: a revoked release, an unreadable list (fail closed) and --offline (said, not hidden)", async () => {
  const revoked = await run(repo(), tmp("c"), { fetchRevocationsImpl: async () => ({ list: { entries: [{ kind: "platform", version: "v9.9.9", severity: "high", reason: "bad" }] }, errors: [], warnings: [] }) });
  assert.match(revoked.errors[0], /v9\.9\.9 is revoked \(high\): bad/);
  const unknown = await run(repo(), tmp("c"), { fetchRevocationsImpl: async () => ({ list: null, unavailable: true, errors: [], warnings: ["HTTP 500"] }) });
  assert.match(unknown.errors[0], /REVOCATION_UNKNOWN/);
  const offline = await run(repo(), tmp("c"), { offline: true });
  assert.equal(offline.state, "READY");
  assert.equal(offline.revocation, "NOT_CHECKED");
  assert.ok(offline.warnings.some((w) => /revocation status NOT checked/.test(w)));
});

test("cache: a release verified once serves the next repository with no bundle; a tampered cache entry is healed from the digest-checked blob, a tampered blob fails closed", async () => {
  const cache = tmp("cache");
  assert.equal((await run(repo(), cache)).state, "READY");
  assert.ok(existsSync(attestationPath(cache, rel.digest)));
  const viaCache = (project) => adopt({ projectRoot: project, cacheRoot: cache, repo: REPO, digest: rel.digest, profile: "python-service", offline: true, fetchRevocationsImpl: CLEAN });
  const second = repo();
  const ok = await viaCache(second);
  assert.equal(ok.state, "READY");
  assert.equal(ok.attestation, "PASS");
  // tamper with a file of the cached release
  writeFileSync(join(releaseDir(cache, rel.digest), "runtime", "main.mjs"), "process.exit(0)\n");
  const healed = await viaCache(repo());
  assert.equal(healed.state, "READY");
  assert.notEqual(readFileSync(join(releaseDir(cache, rel.digest), "runtime", "main.mjs"), "utf8"), "process.exit(0)\n");
  // tamper with the blob itself
  writeFileSync(blobPath(cache, rel.digest), "garbage");
  const third = repo();
  const bad = await viaCache(third);
  assert.equal(bad.status, "FAIL");
  assert.deepEqual(tree(third), []);
});

test("existing files that differ block the adoption (nothing written); --keep-existing leaves them as they are", async () => {
  const project = repo();
  writeFileSync(join(project, "CLAUDE.md"), "my own\n");
  const cache = tmp("cache");
  const blocked = await run(project, cache);
  assert.match(blocked.errors[0], /existing files would be overwritten: CLAUDE\.md.*--keep-existing/);
  assert.deepEqual(tree(project), ["CLAUDE.md"]);
  const kept = await run(project, cache, { keepExisting: true });
  assert.equal(kept.state, "READY", JSON.stringify(kept.errors));
  assert.equal(readFileSync(join(project, "CLAUDE.md"), "utf8"), "my own\n");
});

test("a .gitignore that hides the managed files rolls the whole adoption back: lock, projections and journal are gone", async () => {
  const project = repo();
  writeFileSync(join(project, ".gitignore"), ".ai-native/\n");
  const r = await run(project, tmp("cache"));
  assert.equal(r.status, "FAIL");
  assert.match(r.errors[0], /IGNORED_REQUIRED_FILE/);
  assert.match(r.adoption, /ROLLED_BACK/);
  assert.deepEqual(tree(project), [".gitignore"]);
  assert.equal(git(project, "status", "--short", "--untracked-files=all").trim().split("\n").filter((l) => !l.endsWith(".gitignore")).length, 0);
});

test("an existing lock that is not valid is reported, not overwritten", async () => {
  const project = repo();
  writeFileSync(join(project, "ai-native.lock.json"), "{ nope");
  const r = await run(project, tmp("cache"));
  assert.equal(r.status, "FAIL");
  assert.match(r.errors[0], /not valid JSON/);
  assert.equal(readFileSync(join(project, "ai-native.lock.json"), "utf8"), "{ nope");
});

test("P-02: a failure AFTER the index was written unstages exactly what this run staged, keeps what was tracked before, and says the truth", async () => {
  const project = repo();
  mkdirSync(join(project, ".ai-native"));
  writeFileSync(join(project, ".ai-native", "keep.txt"), "mine\n");
  writeFileSync(join(project, "README.md"), "# x\n");
  git(project, "add", ".ai-native/keep.txt", "README.md");
  const before = git(project, "ls-files").trim();
  const r = await run(project, tmp("cache"), { afterStage: () => { throw new Error("boom after staging"); } });
  assert.equal(r.status, "FAIL");
  assert.match(r.errors[0], /boom after staging/);
  assert.match(r.adoption, /^ROLLED_BACK/);
  assert.equal(git(project, "ls-files").trim(), before, "the index is exactly what it was");
  assert.equal(readFileSync(join(project, ".ai-native", "keep.txt"), "utf8"), "mine\n");
  assert.deepEqual(tree(project), [".ai-native", ".ai-native/keep.txt", "README.md"].map((p) => p.split("/").join(process.platform === "win32" ? "\\" : "/")).sort());
  assert.equal(existsSync(join(project, "ai-native.lock.json")), false);
});

test("N-10: managed file, versioned and deleted from the working tree before init -> failure after staging -> `git status --porcelain` is byte-identical and the message says so", async () => {
  const project = repo();
  writeFileSync(join(project, ".mcp.json"), "{}\n"); // a path ai-native manages, owned by the user and committed
  writeFileSync(join(project, "README.md"), "# x\n");
  git(project, "add", ".");
  git(project, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "base");
  rmSync(join(project, ".mcp.json")); // staged? no: a plain working-tree deletion (" D")
  writeFileSync(join(project, "README.md"), "# edited\n"); // plus an unstaged modification (" M")
  const status = () => execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: project, encoding: "utf8" });
  const index = () => git(project, "ls-files", "-s");
  const [statusBefore, indexBefore] = [status(), index()];
  assert.match(statusBefore, / D \.mcp\.json/);
  const r = await run(project, tmp("cache"), { afterStage: () => { throw new Error("boom after staging"); } });
  assert.equal(r.status, "FAIL");
  assert.match(r.adoption, /^ROLLED_BACK \(verified: `git status` and the index are identical to before\)$/);
  assert.equal(status(), statusBefore, "git status --porcelain is byte-identical");
  assert.equal(index(), indexBefore, "the index (mode, blob, stage, path) is identical");
  assert.equal(readFileSync(join(project, "README.md"), "utf8"), "# edited\n");
  assert.equal(existsSync(join(project, "ai-native.lock.json")), false);
});

test("N-10: a staged deletion and a staged modification of managed paths come back exactly as they were", async () => {
  const project = repo();
  writeFileSync(join(project, ".mcp.json"), "{}\n");
  writeFileSync(join(project, "opencode.json"), "{}\n");
  git(project, "add", ".");
  git(project, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "base");
  git(project, "rm", "-q", ".mcp.json"); // staged deletion ("D ")
  writeFileSync(join(project, "opencode.json"), "{\"mine\":true}\n");
  git(project, "add", "opencode.json"); // staged modification ("M ")
  const status = () => execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: project, encoding: "utf8" });
  const [statusBefore, indexBefore] = [status(), git(project, "ls-files", "-s")];
  // opencode.json differs from what ai-native would write -> a collision: keep it, the rest is adopted, then the run fails after staging
  const r = await run(project, tmp("cache"), { keepExisting: true, afterStage: () => { throw new Error("boom after staging"); } });
  assert.match(r.adoption, /^ROLLED_BACK \(verified/);
  assert.equal(status(), statusBefore);
  assert.equal(git(project, "ls-files", "-s"), indexBefore);
  assert.equal(readFileSync(join(project, "opencode.json"), "utf8"), "{\"mine\":true}\n");
});

test("N-10: when the previous state cannot be demonstrated, the report says ROLLBACK_INCOMPLETE and names what differs - never ROLLED_BACK", async () => {
  const project = repo();
  const r = await run(project, tmp("cache"), { afterStage: () => { writeFileSync(join(project, "stray.txt"), "appeared during the run\n"); throw new Error("boom"); } });
  assert.equal(r.status, "FAIL");
  assert.match(r.adoption, /^ROLLBACK_INCOMPLETE \(differs from before: .*stray\.txt/);
  assert.doesNotMatch(r.adoption, /ROLLED_BACK/);
});

test("P-07: a --profile that contradicts the lock fails clearly; one that matches is accepted (engine, direct call)", async () => {
  const project = repo();
  const cache = tmp("cache");
  assert.equal((await run(project, cache)).state, "READY");
  const clash = await run(project, cache, { profile: "static-site" });
  assert.match(clash.errors[0], /PROFILE_CONFLICT/);
  assert.equal((await run(project, cache, { profile: "python-service" })).state, "READY");
});
