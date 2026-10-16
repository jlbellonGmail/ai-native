// The lifecycle of the public command (v3.3.0): version, upgrade, detach, self-update, uninstall, the CLI <-> PLATFORM contract, several repositories
// and several machines. Network and `gh` are faked at the process boundary (as in ai-native.test.mjs); the engine inside the bundle, git and the files
// are real. The v3.2.0 CLI (evaluation/fixtures/cli) is run for real against the engine of this tree: it is the minimum supported CLI.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn as spawnAsync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, delimiter, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { main, declaredVersion, newestCachedWith, pathHint, CLI_VERSION } from "./ai-native.mjs";
import { upgrade } from "../bootstrap/upgrade.mjs";
import { detach } from "../bootstrap/detach.mjs";
import { putBlob, sha256 } from "../bootstrap/cache.mjs";
import { cmpAny } from "../bootstrap/semver.mjs";
import { callerFrom, negotiate } from "../bootstrap/compat.mjs";
import { REPO_ROOT, record, workingTreeRelease } from "../../evaluation/fixtures/working-tree-release.mjs";

const made = [];
after(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })));
const tmp = (p) => { const d = mkdtempSync(join(tmpdir(), `cli lc-${p}-`)); made.push(d); return d; }; // a space in every path on purpose
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" });
const gitInit = () => { const d = tmp("repo"); git(d, "init", "-q"); return d; };
const files = (root) => readdirSync(root, { recursive: true }).map(String).filter((p) => !/^\.git([\\/]|$)/.test(p)).sort();
const snap = (root) => Object.fromEntries(files(root).flatMap((p) => { try { return [[p, sha256(readFileSync(join(root, p)))]]; } catch { return []; } }));
const state = (root) => ({ files: snap(root), status: git(root, "status", "--porcelain", "-uall"), index: git(root, "ls-files", "-s") });

const SLUG = "o/ai-native";
const SIGNER = `${SLUG}/.github/workflows/release.yml`;
const API = `https://api.github.com/repos/${SLUG}/releases?per_page=100`;
const URL_OF = (v, name) => `https://github.com/${SLUG}/releases/download/${v}/${name}`;
const reply = (body, status = 200) => ({ ok: status < 300, status, json: async () => body, arrayBuffer: async () => { const b = Buffer.from(body); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); } });
const revocations = join(tmp("rev"), "revocations-1.json");
writeFileSync(revocations, JSON.stringify({ schemaVersion: 1, n: 1, publishedAt: "2026-10-02T00:00:00Z", entries: [] }));

const CLI_SOURCE = readFileSync(new URL("./ai-native.mjs", import.meta.url), "utf8");
const MARKER = `export const CLI_VERSION = "${CLI_VERSION}";`;
/** The CLI as another release would publish it: this program declaring `v`. */
const cliAsset = (v) => Buffer.from(CLI_SOURCE.replace(MARKER, `export const CLI_VERSION = "${v}";`));

/** A release of the fake GitHub: the bundle (launcher differs per version, so an upgrade has something to project), the CLI asset, extra assets. */
function release(version, { bootstrap, cli = true, assets = {} } = {}) {
  const commit = createHash("sha1").update(version).digest("hex");
  const rel = workingTreeRelease({
    version, commit, bootstrap,
    mutate: (f) => ({ ...f, "runtime/adapters/launcher.mjs": Buffer.concat([f["runtime/adapters/launcher.mjs"], Buffer.from(`\n// release ${version}\n`)]) }),
  });
  return { version, rel, commit, cli: cli ? cliAsset(version) : null, assets };
}
const R1 = release("v9.9.1");
const R2 = release("v9.9.2");
const R3 = release("v9.9.3");

/** What GitHub serves, whether gh verifies (and for which signer), and a log of everything the command did. */
function world({ releases, network = true, gh = {}, home, spawnHook = null } = {}) {
  const log = { fetched: [], gh: [], engine: [], engineOut: "", probes: 0 };
  const list = releases.map((r) => ({
    tag_name: r.version, draft: false, prerelease: false, immutable: true,
    assets: [
      { name: `ai-native-${r.version}.tar.gz`, digest: r.rel.digest },
      ...(r.cli ? [{ name: "ai-native-cli.mjs", digest: r.badDigest ?? `sha256:${sha256(r.cli)}` }] : []),
      ...Object.keys(r.assets).map((name) => ({ name })),
    ],
  }));
  const fetchImpl = async (url) => {
    log.fetched.push(url);
    if (!network) throw new Error("getaddrinfo ENOTFOUND github.com");
    if (url === API) return reply(list);
    for (const r of releases) {
      if (url === URL_OF(r.version, `ai-native-${r.version}.tar.gz`)) return reply(r.rel.bytes);
      if (r.cli && url === URL_OF(r.version, "ai-native-cli.mjs")) return reply(r.tampered ?? r.cli);
      for (const [name, body] of Object.entries(r.assets)) if (url === URL_OF(r.version, name)) return reply(body);
    }
    return reply("not found", 404);
  };
  const spawn = (cmd, args, opts) => {
    if (cmd === "gh") {
      log.gh.push(args);
      const file = basename(args[2]);
      const signer = args[args.indexOf("--signer-workflow") + 1];
      if (gh.missing) return { error: new Error("spawn gh ENOENT") };
      if (signer !== (gh.signer ?? SIGNER) || gh.failFor === file) return { status: 1, stderr: "verification failed: no matching attestations" };
      return { status: 0 };
    }
    if (cmd === process.execPath && /cli\.mjs$/.test(args[0]) && args[0].includes("bootstrap")) {
      log.engine.push(args);
      const r = spawnSync(cmd, [...args, "--revocations", revocations], { ...opts, stdio: "pipe", encoding: "utf8" });
      log.engineOut = r.stdout + r.stderr;
      return r;
    }
    if (cmd === process.execPath && args[1] === "version") { log.probes += 1; if (spawnHook) return spawnHook(log.probes, cmd, args, opts); }
    return spawnSync(cmd, args, opts);
  };
  const out = [];
  const err = [];
  const run = (argv, { cwd, cache = tmp("cache"), env = {}, rename, self } = {}) => main(argv, { fetchImpl, spawn, cwd, env: { ...process.env, AI_NATIVE_CACHE: cache, AI_NATIVE_HOME: home ?? tmp("home"), GIT_TERMINAL_PROMPT: "0", ...env }, out: (m) => out.push(m), err: (m) => err.push(m), repo: SLUG, ...(rename ? { rename } : {}), ...(self ? { self } : {}) });
  return { log, run, out, err, list };
}
const lockOf = (project) => JSON.parse(readFileSync(join(project, "ai-native.lock.json"), "utf8"));

/** A repository adopted at `r`, with its own cache. */
async function adopted(r, { profile = "python-service", cache = tmp("cache"), project = gitInit() } = {}) {
  const w = world({ releases: [r] });
  assert.equal(await w.run(["init", "--profile", profile], { cwd: project, cache }), 0, w.log.engineOut + w.err.join("\n"));
  return { project, cache };
}

// ---- version -----------------------------------------------------------------------------------------------------------------------------------

test("VERSION: outside a repository `CLI: vX`; inside an adopted one `CLI: vX | PLATFORM: vY` (the two versions are never confused)", async () => {
  const w = world({ releases: [R2] });
  const bare = tmp("bare");
  assert.equal(await w.run(["--version"], { cwd: bare }), 0);
  assert.equal(await w.run(["version"], { cwd: bare }), 0);
  assert.deepEqual(w.out, [`CLI: ${CLI_VERSION}`, `CLI: ${CLI_VERSION}`]);
  const { project } = await adopted(R2);
  w.out.length = 0;
  mkdirSync(join(project, "sub", "dir"), { recursive: true });
  await w.run(["--version"], { cwd: join(project, "sub", "dir") }); // found from any directory below the lock
  assert.equal(w.out[0], `CLI: ${CLI_VERSION} | PLATFORM: v9.9.2`);
  await w.run(["version", "--json"], { cwd: project });
  assert.deepEqual(JSON.parse(w.out[1]), { cli: CLI_VERSION, platform: "v9.9.2", protocol: 1, capabilities: ["adopt", "upgrade", "detach"] });
  writeFileSync(join(project, "ai-native.lock.json"), "{ nope");
  w.out.length = 0;
  await w.run(["version"], { cwd: project });
  assert.equal(w.out[0], `CLI: ${CLI_VERSION} | PLATFORM: unreadable`);
});

test("CLI_VERSION is a plain vX.Y.Z literal, the marker self-update and install read, and it is what the release build requires", () => {
  assert.match(CLI_VERSION, /^v\d+\.\d+\.\d+$/);
  assert.equal(declaredVersion(new URL("./ai-native.mjs", import.meta.url)), CLI_VERSION);
  assert.equal(declaredVersion(join(tmp("none"), "missing.mjs")), undefined);
  const legacy = join(tmp("legacy"), "old.mjs");
  writeFileSync(legacy, readFileSync(join(REPO_ROOT, "evaluation", "fixtures", "cli", "ai-native-v3.2.0.mjs")));
  assert.equal(declaredVersion(legacy), null, "a program from before versions existed is 'older than any version', not unknown-and-trusted");
});

// ---- init on an adopted repository: the lock rules ----------------------------------------------------------------------------------------------

test("INIT: an adopted repository is NEVER moved by a newer release: init respects the lock exactly, as many times as you like", async () => {
  const { project, cache } = await adopted(R1);
  const before = state(project);
  const w = world({ releases: [R1, R2, R3] });
  for (let i = 0; i < 2; i += 1) assert.equal(await w.run(["init"], { cwd: project, cache }), 0, w.log.engineOut + w.err.join("\n"));
  assert.equal(lockOf(project).platform.version, "v9.9.1");
  assert.deepEqual(state(project), before);
  assert.ok(!w.log.fetched.some((u) => u.endsWith(".tar.gz")), "no bundle of v9.9.2 or v9.9.3 was even downloaded");
  assert.match(w.log.engineOut, /ADOPTION: ALREADY_ADOPTED/);
  assert.notEqual(await w.run(["init", "--version", "v9.9.3"], { cwd: project, cache }), 0);
  assert.match(w.err.join("\n"), /conflicts with the release this repository is pinned to \(v9\.9\.1\).*ai-native upgrade --to v9\.9\.3/);
});

// ---- upgrade -----------------------------------------------------------------------------------------------------------------------------------

test("UPGRADE: `ai-native upgrade` moves the lock (commit and digest resolved by the command), the pinned workflow and the projections; nothing else", async () => {
  const { project, cache } = await adopted(R1);
  mkdirSync(join(project, ".github", "workflows"), { recursive: true });
  const other = "b".repeat(40);
  const workflow = `jobs:\n  a:\n    uses: actions/checkout@${other}\n  l3:\n    uses: ${SLUG}/.github/workflows/l3-consumer.yml@${R1.commit}\n`;
  writeFileSync(join(project, ".github", "workflows", "ai-native.yml"), workflow);
  writeFileSync(join(project, "app.py"), "print('mine')\n");
  const w = world({ releases: [R1, R2] });
  assert.equal(await w.run(["upgrade"], { cwd: project, cache }), 0, w.log.engineOut + w.err.join("\n"));
  assert.match(w.log.engineOut, /^STATUS: READY\nAI-NATIVE: v9\.9\.2\nPROFILE: python-service\nDRIFT: CLEAN\nATTESTATION: PASS\nREVOCATION: CHECKED\nUPGRADE: v9\.9\.1 -> v9\.9\.2 \(lock and caller workflow pin\)/);
  const lock = lockOf(project);
  assert.equal(lock.platform.version, "v9.9.2");
  assert.equal(lock.platform.commit, R2.commit);
  assert.equal(lock.platform.digest, R2.rel.digest);
  assert.deepEqual(lock.profiles, ["python-service"], "the profile is the repository's own");
  assert.equal(readFileSync(join(project, ".github", "workflows", "ai-native.yml"), "utf8"), workflow.replace(R1.commit, R2.commit), "only the pin of THIS release's repository moved, never another action's");
  assert.match(readFileSync(join(project, ".ai-native", "ai-native.mjs"), "utf8"), /release v9\.9\.2/, "the managed projection came from the new release");
  assert.equal(readFileSync(join(project, "app.py"), "utf8"), "print('mine')\n");
  assert.deepEqual(w.log.gh.map((a) => basename(a[2])).sort(), ["ai-native-v9.9.2.tar.gz"], "the target bundle was attested (the empty revocations list has no asset to attest)");
  // the consumer's own launcher and a second `init` both work on the upgraded repository, and nothing was committed
  const launcher = spawnSync(process.execPath, [join(project, ".ai-native", "ai-native.mjs"), "version"], { cwd: project, encoding: "utf8", env: { ...process.env, AI_NATIVE_CACHE: cache } });
  assert.equal(launcher.stdout.split("\n")[0].trim(), `v9.9.2 ${R2.commit}`, launcher.stderr);
  assert.equal(await world({ releases: [R1, R2] }).run(["init", "--offline"], { cwd: project, cache }), 0);
  assert.match(git(project, "status", "--porcelain"), /^A  ai-native\.lock\.json$/m, "staged, not committed");
  // and now it is up to date
  const again = world({ releases: [R1, R2] });
  assert.equal(await again.run(["upgrade"], { cwd: project, cache }), 0);
  assert.match(again.out.join("\n"), /STATUS: UP_TO_DATE\nAI-NATIVE: v9\.9\.2/);
  assert.deepEqual(again.log.gh, []);
});

test("UPGRADE: it picks the highest SemVer (v9.10.0 > v9.9.3), only stable and immutable, and --to selects exactly that release", async () => {
  const R10 = release("v9.10.0");
  const { project, cache } = await adopted(R1);
  const w = world({ releases: [R3, R10, R1] });
  assert.equal(await w.run(["upgrade"], { cwd: project, cache }), 0, w.log.engineOut + w.err.join("\n"));
  assert.equal(lockOf(project).platform.version, "v9.10.0");
  const { project: p2, cache: c2 } = await adopted(R1);
  const w2 = world({ releases: [R3, R10, R1] });
  assert.equal(await w2.run(["upgrade", "--to", "v9.9.3"], { cwd: p2, cache: c2 }), 0, w2.log.engineOut);
  assert.equal(lockOf(p2).platform.version, "v9.9.3");
  assert.equal(cmpAny("v9.10.0", "v9.9.3") > 0, true);
  assert.equal(cmpAny("v3.3.0-rc.2", "v3.3.0") < 0 && cmpAny("v3.3.0-rc.1", "v3.3.0-rc.2") < 0 && cmpAny("v3.3.0-alpha.9", "v3.3.0-rc.1") < 0, true);
  const w3 = world({ releases: [R1] });
  assert.notEqual(await w3.run(["upgrade", "--to", "v9.9.7"], { cwd: (await adopted(R1)).project }), 0);
  assert.match(w3.err.join("\n"), /RELEASE_REJECTED: v9\.9\.7 .*is not among the published releases/);
});

test("UPGRADE keeps what you changed: an edited managed file stays as you left it, is reported, and the upgrade still succeeds", async () => {
  const { project, cache } = await adopted(R1);
  const edited = readFileSync(join(project, "CLAUDE.md"), "utf8") + "\nMy own rule.\n";
  writeFileSync(join(project, "CLAUDE.md"), edited);
  const w = world({ releases: [R1, R2] });
  assert.equal(await w.run(["upgrade"], { cwd: project, cache }), 0, w.log.engineOut + w.err.join("\n"));
  assert.equal(readFileSync(join(project, "CLAUDE.md"), "utf8"), edited);
  assert.match(w.log.engineOut, /WARNING: kept your version of CLAUDE\.md \(edited locally\)/);
  assert.match(w.log.engineOut, /UPGRADE: v9\.9\.1 -> v9\.9\.2/);
  assert.equal(lockOf(project).platform.version, "v9.9.2");
});

test("UPGRADE failure leaves the repository exactly as it was (files, index, status), and says so", async () => {
  const { project, cache } = await adopted(R1);
  mkdirSync(join(project, ".github", "workflows"), { recursive: true });
  writeFileSync(join(project, ".github", "workflows", "ai-native.yml"), `uses: ${SLUG}/.github/workflows/l3-consumer.yml@${R1.commit}\n`);
  git(project, "add", ".github");
  const before = state(project);
  const lockBefore = readFileSync(join(project, "ai-native.lock.json"), "utf8");
  const bundle = join(tmp("bundle"), "b.tar.gz");
  writeFileSync(bundle, R2.rel.bytes);
  const r = await upgrade({ projectRoot: project, cacheRoot: cache, bundleFile: bundle, attestationRecord: record(R2.rel, SLUG), offline: true, afterWrite: () => { throw new Error("boom after the project was written"); } });
  assert.equal(r.status, "FAIL");
  assert.match(r.errors.join(), /boom after the project was written/);
  assert.match(r.text, /ADOPTION: ROLLED_BACK \(verified/);
  assert.deepEqual(state(project), before);
  assert.equal(readFileSync(join(project, "ai-native.lock.json"), "utf8"), lockBefore);
});

test("UPGRADE never goes backwards: --to an older release, or an older bundle handed to the engine, is refused", async () => {
  const { project, cache } = await adopted(R2);
  const before = state(project);
  const w = world({ releases: [R1, R2] });
  assert.equal(await w.run(["upgrade", "--to", "v9.9.1"], { cwd: project, cache }), 1);
  assert.match(w.err.join("\n"), /DOWNGRADE_REFUSED: this repository is pinned to v9\.9\.2; v9\.9\.1 is older/);
  assert.ok(!w.log.fetched.some((u) => u.endsWith(".tar.gz")));
  const bundle = join(tmp("bundle"), "b.tar.gz");
  writeFileSync(bundle, R1.rel.bytes); // the engine does not rely on the launcher having checked
  const r = await upgrade({ projectRoot: project, cacheRoot: cache, bundleFile: bundle, attestationRecord: record(R1.rel, SLUG), offline: true });
  assert.match(r.errors.join(), /DOWNGRADE_REFUSED/);
  assert.deepEqual(state(project), before);
});

test("UPGRADE: not adopted -> NOT_ADOPTED; offline needs the release verified in the cache and never changes anything otherwise", async () => {
  const bare = gitInit();
  const w = world({ releases: [R2] });
  assert.equal(await w.run(["upgrade"], { cwd: bare }), 1);
  assert.match(w.err.join("\n"), /NOT_ADOPTED/);
  assert.deepEqual(files(bare), []);

  const { project, cache } = await adopted(R1); // this machine only ever held v9.9.1
  const before = state(project);
  const off = world({ releases: [R2], network: false });
  assert.equal(await off.run(["upgrade"], { cwd: project, cache }), 1);
  assert.match(off.err.join("\n"), /cannot reach GitHub Releases/);
  assert.equal(await off.run(["upgrade", "--offline"], { cwd: project, cache }), 0, "nothing newer is known offline: up to date, not an error");
  assert.match(off.out.join("\n"), /UP_TO_DATE/);
  assert.equal(await off.run(["upgrade", "--offline", "--to", "v9.9.2"], { cwd: project, cache }), 1);
  assert.match(off.err.join("\n"), /OFFLINE: this machine has no verified v9\.9\.2 in its cache.*Nothing was changed/);
  assert.deepEqual(state(project), before);

  await adopted(R2, { cache }); // another repository brings v9.9.2 into this machine's cache, verified
  assert.equal(await off.run(["upgrade", "--offline"], { cwd: project, cache }), 0, off.log.engineOut + off.err.join("\n"));
  assert.equal(lockOf(project).platform.version, "v9.9.2");
  assert.match(off.log.engineOut, /WARNING: offline: revocation status NOT checked/);
});

test("UPGRADE: a lock without an adoption journal (pinned before `init` existed) is adopted brownfield-safe, keeping files that already exist", async () => {
  const { project, cache } = await adopted(R1);
  rmSync(join(project, ".ai-native", "adoption-journal.json"));
  const w = world({ releases: [R1, R2] });
  assert.equal(await w.run(["upgrade"], { cwd: project, cache }), 0, w.log.engineOut + w.err.join("\n"));
  assert.match(w.log.engineOut, /WARNING: \.ai-native\/ai-native\.mjs already exists and is not ai-native's; left as it is/);
  assert.ok(existsSync(join(project, ".ai-native", "adoption-journal.json")));
  assert.equal(lockOf(project).platform.version, "v9.9.2");
});

test("UPGRADE: a revoked target, a bad digest and a failed attestation stop it before the repository is touched", async () => {
  const { project, cache } = await adopted(R1);
  const before = state(project);
  const list = { schemaVersion: 1, n: 2, publishedAt: "2026-10-14T00:00:00Z", entries: [{ kind: "platform", id: "ai-native", version: "v9.9.2", reason: "test", severity: "high" }] };
  const rev = release("v9.9.2", { assets: { "revocations-2.json": JSON.stringify(list) } });
  rev.rel = R2.rel;
  const w = world({ releases: [R1, rev] });
  assert.equal(await w.run(["upgrade"], { cwd: project, cache }), 1);
  assert.match(w.err.join("\n"), /REVOKED: v9\.9\.2 is revoked \(high\): test/);
  const bad = world({ releases: [R1, R2], gh: { failFor: "ai-native-v9.9.2.tar.gz" } });
  assert.equal(await bad.run(["upgrade"], { cwd: project, cache }), 1);
  assert.match(bad.err.join("\n"), /ATTESTATION_FAILED/);
  assert.equal(bad.log.engine.length, 0);
  assert.deepEqual(state(project), before);
});

// ---- CLI <-> PLATFORM compatibility ------------------------------------------------------------------------------------------------------------

test("COMPAT matrix (new CLI): N->N, N->N+1 compatible, a release that predates the contract, and every way a release can need a newer CLI FAILS CLOSED", async () => {
  const cases = [
    ["same contract", undefined, true],
    ["predates the contract (no bootstrap field)", null, true],
    ["asks only for what this CLI is", { protocol: 1, minCliVersion: CLI_VERSION, requiredCapabilities: ["adopt", "upgrade", "detach"] }, true],
    ["needs a newer CLI version", { protocol: 1, minCliVersion: "v99.0.0", requiredCapabilities: ["adopt"] }, false],
    ["speaks a newer bootstrap protocol", { protocol: 2, minCliVersion: "v3.2.0", requiredCapabilities: ["adopt"] }, false],
    ["needs a capability this CLI lacks", { protocol: 1, minCliVersion: "v3.2.0", requiredCapabilities: ["adopt", "teleport"] }, false],
    ["publishes a contract this CLI cannot read", { protocol: "x", minCliVersion: "latest", requiredCapabilities: "all" }, false],
  ];
  for (const [name, bootstrap, ok] of cases) {
    const r = release("v9.9.5", { bootstrap });
    const project = gitInit();
    const w = world({ releases: [r] });
    const code = await w.run(["init", "--profile", "python-service"], { cwd: project });
    if (ok) assert.equal(code, 0, `${name}: ${w.log.engineOut}${w.err.join("\n")}`);
    else {
      assert.equal(code, 1, name);
      assert.match(w.err.join("\n"), /INCOMPATIBLE_CLI: .*self-update/, name);
      assert.equal(w.log.engine.length, 0, `${name}: the engine of an incompatible release never runs`);
      assert.deepEqual(files(project), [], `${name}: nothing was written`);
    }
  }
});

test("DETACH of a legacy repository fails closed on a parseable lock that violates the lock schema", async () => {
  const project = await legacyRepo();
  const lockPath = join(project, "ai-native.lock.json");
  const invalid = '{"schemaVersion":1,"platform":{},"profiles":["factory"]}\n';
  writeFileSync(lockPath, invalid);
  const before = state(project);
  const w = world({ releases: [R2] });

  assert.equal(await w.run(["detach"], { cwd: project, cache: tmp("cache") }), 1, w.log.engineOut + w.err.join("\n"));
  assert.match(w.err.join("\n") + w.log.engineOut, /ADOPTION_INCONSISTENT/);
  assert.equal(readFileSync(lockPath, "utf8"), invalid, "an untrusted lock remains byte-identical");
  assert.deepEqual(state(project), before, "files, index and status remain unchanged");
});

test("COMPAT matrix (minimum supported CLI): the REAL v3.2.0 CLI against the engine of this tree - init works, it is recognized as legacy, and an incompatible release fails closed", async () => {
  const legacy = await import(pathToFileURL(join(REPO_ROOT, "evaluation", "fixtures", "cli", "ai-native-v3.2.0.mjs")).href);
  const run = async (r, project) => {
    const w = world({ releases: [r] });
    const code = await legacy.main(["init", "--profile", "python-service"], {
      fetchImpl: async (url) => (url === API ? reply(w.list) : url === URL_OF(r.version, `ai-native-${r.version}.tar.gz`) ? reply(r.rel.bytes) : reply("nf", 404)),
      spawn: (cmd, args, opts) => (cmd === "gh" ? { status: 0 } : cmd === process.execPath ? (() => { const x = spawnSync(cmd, [...args, "--revocations", revocations], { ...opts, stdio: "pipe", encoding: "utf8" }); w.log.engineOut = x.stdout + x.stderr; w.log.engine.push(args); return x; })() : spawnSync(cmd, args, opts)),
      env: { ...process.env, AI_NATIVE_CACHE: tmp("cache") }, cwd: project, out() {}, err: (m) => w.err.push(m), repo: SLUG,
    });
    return { code, w };
  };
  const ok = await run(R2, gitInit());
  assert.equal(ok.code, 0, ok.w.log.engineOut + ok.w.err.join("\n"));
  assert.ok(!ok.w.log.engine[0].includes("--cli-version"), "the v3.2.0 CLI identifies itself as nothing");
  assert.match(ok.w.log.engineOut, /STATUS: READY[\s\S]*WARNING: LEGACY_CLI: .*update it once by hand.*ai-native self-update/i);
  const bare = gitInit();
  const refused = await run(release("v9.9.6", { bootstrap: { protocol: 1, minCliVersion: "v99.0.0", requiredCapabilities: ["adopt"] } }), bare);
  assert.equal(refused.code, 1);
  assert.match(refused.w.log.engineOut, /INCOMPATIBLE_CLI: v9\.9\.6 needs CLI >= v99\.0\.0, this is v3\.2\.0 \(legacy/);
  assert.match(refused.w.log.engineOut, /cannot update itself\. Update it once by hand/);
  assert.deepEqual(files(bare), [], "FAIL CLOSED: the incompatible release wrote nothing");
});

test("COMPAT contract: platform.json carries the contract of this tree, the engine negotiates it, a legacy caller is exactly [adopt] at v3.2.0", () => {
  const contract = JSON.parse(readFileSync(join(REPO_ROOT, "contracts", "bootstrap-protocol.json"), "utf8"));
  const platform = JSON.parse(R2.rel.bytes && Buffer.from(gunzipFile(R2.rel.bytes, "platform.json")));
  assert.deepEqual(platform.bootstrap, { protocol: contract.protocol, minCliVersion: contract.minCliVersion, requiredCapabilities: contract.requiredCapabilities });
  assert.equal(contract.minCliVersion, "v3.2.0", "v3.3.0 keeps serving the CLIs people already have");
  const caller = callerFrom();
  assert.deepEqual([caller.version, caller.protocol, caller.capabilities, caller.legacy], ["v3.2.0", 1, ["adopt"], true]);
  assert.equal(callerFrom({ version: "3.3", protocol: "1", capabilities: "adopt" }).error.includes("--cli-version"), true);
  assert.equal(negotiate({ platform, caller: callerFrom({ version: CLI_VERSION, protocol: "1", capabilities: "adopt,upgrade,detach" }) }).ok, true);
  assert.equal(negotiate({ platform: { version: "v9.9.9", bootstrap: { ...platform.bootstrap, requiredCapabilities: ["adopt", "upgrade"] } }, caller }).ok, false, "a legacy CLI has no `upgrade` capability");
});

// ---- self-update -------------------------------------------------------------------------------------------------------------------------------

/** A machine with an installed CLI declaring `v` (installed through `install`, like a person would). */
async function machine(v = "v3.3.0") {
  const home = tmp("home");
  const from = join(tmp("dl"), "ai-native-cli.mjs");
  writeFileSync(from, cliAsset(v));
  const code = await main(["install"], { env: { ...process.env, AI_NATIVE_HOME: home }, self: from, out() {}, err() {} });
  assert.equal(code, 0);
  const bin = join(home, "bin");
  return { home, bin, script: join(bin, "ai-native.mjs"), version: () => declaredVersion(join(bin, "ai-native.mjs")), shims: () => readdirSync(bin).sort() };
}
const works = (script, expected) => { const r = spawnSync(process.execPath, [script, "version", "--json"], { encoding: "utf8" }); return r.status === 0 && JSON.parse(r.stdout).cli === expected; };

test("SELF-UPDATE --check only reports; the update replaces the installed CLI atomically, keeps the previous one, the shims and a working command", async () => {
  const m = await machine("v3.3.0");
  const R = release("v9.9.9");
  const w = world({ releases: [R], home: m.home });
  assert.equal(await w.run(["self-update", "--check"], {}), 0);
  assert.match(w.out[0], /^CLI: v3\.3\.0 \| latest: v9\.9\.9 \(update available/);
  assert.equal(m.version(), "v3.3.0");
  assert.deepEqual(w.log.gh, [], "--check downloads and installs nothing");

  assert.equal(await w.run(["self-update"], {}), 0, w.err.join("\n"));
  assert.equal(m.version(), "v9.9.9");
  assert.ok(works(m.script, "v9.9.9"));
  assert.ok(readFileSync(`${m.script}.prev`).equals(cliAsset("v3.3.0")), "the previous CLI is kept, byte for byte, for recovery");
  assert.deepEqual(m.shims(), ["ai-native", "ai-native.cmd", "ai-native.mjs", "ai-native.mjs.prev"]);
  assert.match(readFileSync(join(m.bin, "ai-native.cmd"), "utf8"), /^@echo off\r\nnode "%~dp0ai-native.mjs" %\*\r\n$/);
  // the attestation was demanded of the signer workflow, on the downloaded CLI file
  assert.deepEqual(w.log.gh.map((a) => [basename(a[2]), a[a.indexOf("--signer-workflow") + 1]]), [["ai-native-cli.mjs", SIGNER]]);
  // and the shim itself runs the new CLI (the user's way in)
  const shim = process.platform === "win32" ? spawnSync("cmd.exe", ["/c", join(m.bin, "ai-native.cmd"), "--version"], { encoding: "utf8" }) : spawnSync("sh", [join(m.bin, "ai-native"), "--version"], { encoding: "utf8" });
  assert.equal(shim.stdout.trim(), "CLI: v9.9.9", shim.stderr);
  const again = world({ releases: [R], home: m.home });
  assert.equal(await again.run(["self-update"], {}), 0);
  assert.match(again.out[0], /CLI: v9\.9\.9 is up to date/);
  assert.deepEqual(again.log.gh, []);
});

test("SELF-UPDATE refuses what it cannot vouch for and leaves the installed CLI exactly as it was: wrong digest, failed attestation, wrong signer, missing gh, lying asset, broken asset", async () => {
  const m = await machine("v3.3.0");
  const old = readFileSync(m.script);
  const check = async (name, w, pattern) => {
    assert.equal(await w.run(["self-update"], {}), 1, name);
    assert.match(w.err.join("\n"), pattern, name);
    assert.ok(readFileSync(m.script).equals(old), `${name}: the installed CLI is untouched`);
    assert.ok(works(m.script, "v3.3.0"), name);
    assert.deepEqual(m.shims().filter((n) => n !== "ai-native.mjs.prev"), ["ai-native", "ai-native.cmd", "ai-native.mjs"], `${name}: no staging leftovers`);
  };
  await check("digest", world({ releases: [{ ...release("v9.9.9"), badDigest: `sha256:${"1".repeat(64)}` }], home: m.home }), /DIGEST_MISMATCH/);
  await check("attestation", world({ releases: [release("v9.9.9")], home: m.home, gh: { failFor: "ai-native-cli.mjs" } }), /ATTESTATION_FAILED/);
  await check("signer", world({ releases: [release("v9.9.9")], home: m.home, gh: { signer: "evil/ai-native/.github/workflows/release.yml" } }), /ATTESTATION_FAILED/);
  await check("no gh", world({ releases: [release("v9.9.9")], home: m.home, gh: { missing: true } }), /ATTESTATION_UNAVAILABLE/);
  const liar = release("v9.9.9");
  liar.cli = cliAsset("v9.9.8"); // an asset of v9.9.9 that declares another version
  await check("declared version", world({ releases: [liar], home: m.home }), /does not declare v9\.9\.9/);
  const broken = release("v9.9.9");
  broken.cli = Buffer.from(`throw new Error("broken");\n${CLI_SOURCE.replace(MARKER, 'export const CLI_VERSION = "v9.9.9";')}`);
  await check("does not start", world({ releases: [broken], home: m.home }), /UPDATE_REJECTED: the new CLI does not start as v9\.9\.9/);
  await check("offline", world({ releases: [release("v9.9.9")], home: m.home, network: false }), /cannot reach GitHub Releases.*Nothing was changed/);
});

test("SELF-UPDATE: a revoked CLI release is refused; a revoked CLI is told to update; init with a revoked CLI stops before any engine runs", async () => {
  const m = await machine("v3.3.0");
  const revList = (versions) => JSON.stringify({ schemaVersion: 1, n: 1, publishedAt: "2026-10-14T00:00:00Z", entries: versions.map((version) => ({ kind: "cli", id: "ai-native-cli", version, reason: "compromised build", severity: "critical" })) });
  const old = readFileSync(m.script);
  const target = release("v9.9.9", { assets: { "cli-revocations-1.json": revList(["v9.9.9"]) } });
  const w = world({ releases: [target], home: m.home });
  assert.equal(await w.run(["self-update"], {}), 1);
  assert.match(w.err.join("\n"), /CLI_REVOKED: this ai-native CLI \(v9\.9\.9\) is revoked \(critical\): compromised build/);
  assert.ok(readFileSync(m.script).equals(old));
  assert.deepEqual(w.log.gh.map((a) => basename(a[2])), ["cli-revocations-1.json"], "the revocation list itself is attested; the revoked CLI was never even downloaded");

  // this machine's own CLI is revoked: any command that would trust it stops, and the remedy is named
  const mine = release("v9.9.2", { assets: { "cli-revocations-1.json": revList([CLI_VERSION]) } });
  const project = gitInit();
  const w2 = world({ releases: [mine], home: m.home });
  assert.equal(await w2.run(["init", "--profile", "python-service"], { cwd: project }), 1);
  assert.match(w2.err.join("\n"), /CLI_REVOKED: this ai-native CLI \(v3\.3\.0\) is revoked.*self-update.*CLI-RECOVERY\.md/);
  assert.equal(w2.log.engine.length, 0);
  assert.deepEqual(files(project), []);
  // ... but the recovery commands still run
  assert.equal(await w2.run(["--version"], {}), 0);
  assert.equal(await w2.run(["uninstall"], {}), 0);
});

test("SELF-UPDATE never downgrades: an older latest release changes nothing, `install` will not put an older CLI over a newer one, a newer one replaces an older one", async () => {
  const m = await machine("v9.9.9");
  const w = world({ releases: [release("v9.9.5")], home: m.home });
  assert.equal(await w.run(["self-update"], {}), 0);
  assert.match(w.out[0], /CLI: v9\.9\.9 is up to date \(newer than the latest published v9\.9\.5; no downgrade\)/);
  assert.equal(m.version(), "v9.9.9");
  assert.deepEqual(w.log.gh, []);
  const err = [];
  assert.equal(await main(["install"], { env: { ...process.env, AI_NATIVE_HOME: m.home }, out() {}, err: (e) => err.push(e) }), 1); // this tree's CLI is v3.3.0
  assert.match(err.join("\n"), /INSTALL_DOWNGRADE_REFUSED: v9\.9\.9 is installed and this file is v3\.3\.0/);
  assert.equal(m.version(), "v9.9.9");
  // the one historical exception: a v3.2.0 CLI (no marker) is updated by hand with `install` of the attested asset
  const legacy = tmp("legacy-home");
  mkdirSync(join(legacy, "bin"), { recursive: true });
  writeFileSync(join(legacy, "bin", "ai-native.mjs"), readFileSync(join(REPO_ROOT, "evaluation", "fixtures", "cli", "ai-native-v3.2.0.mjs")));
  const out = [];
  assert.equal(await main(["install"], { env: { ...process.env, AI_NATIVE_HOME: legacy }, out: (o) => out.push(o), err() {} }), 0);
  assert.match(out[0], /Updated ai-native CLI \(older\) -> v3\.3\.0/);
  assert.equal(declaredVersion(join(legacy, "bin", "ai-native.mjs")), CLI_VERSION);
});

test("SELF-UPDATE failure while replacing: the previous CLI keeps working (rename fails; replaced CLI fails to start and is rolled back)", async () => {
  const m = await machine("v3.3.0");
  const old = readFileSync(m.script);
  const R = release("v9.9.9");
  const w = world({ releases: [R], home: m.home });
  const failing = (from, to) => { if (to.endsWith("ai-native.mjs")) throw Object.assign(new Error("disk full"), { code: "ENOSPC" }); return renameSync(from, to); };
  assert.equal(await w.run(["self-update"], { rename: failing }), 1);
  assert.match(w.err.join("\n"), /UPDATE_FAILED: could not replace .*ai-native\.mjs \(ENOSPC\); the installed CLI is unchanged and works/);
  assert.ok(readFileSync(m.script).equals(old));
  assert.ok(works(m.script, "v3.3.0"));
  assert.ok(!existsSync(`${m.script}.new`));

  // probe #1 proves the staged file, probe #2 the replaced one: make the second fail
  const w2 = world({ releases: [R], home: m.home, spawnHook: (n, cmd, args, opts) => (n === 2 ? { status: 1, stdout: "" } : spawnSync(cmd, args, opts)) });
  assert.equal(await w2.run(["self-update"], {}), 1);
  assert.match(w2.err.join("\n"), /UPDATE_FAILED: the replaced CLI did not start as v9\.9\.9; the previous one was put back/);
  assert.ok(readFileSync(m.script).equals(old));
  assert.ok(works(m.script, "v3.3.0"));
});

test("WINDOWS/LINUX: the installed CLI can be replaced while a Node process has it loaded, and the shims survive", async () => {
  const m = await machine("v3.3.0");
  const holder = spawnAsync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(m.script).href)}); setTimeout(() => {}, 4000); console.log("loaded");`], { stdio: ["ignore", "pipe", "inherit"] });
  await new Promise((resolve) => holder.stdout.once("data", resolve));
  try {
    const w = world({ releases: [release("v9.9.9")], home: m.home });
    assert.equal(await w.run(["self-update"], {}), 0, w.err.join("\n"));
    assert.equal(m.version(), "v9.9.9");
    assert.ok(works(m.script, "v9.9.9"));
  } finally {
    holder.kill();
  }
});

// ---- install / uninstall -----------------------------------------------------------------------------------------------------------------------

test("INSTALL is idempotent, writes shims that quote paths with spaces, never touches PATH, and its PATH hint cannot duplicate or copy the Machine PATH", async () => {
  const home = tmp("home");
  const env = { ...process.env, AI_NATIVE_HOME: home };
  const out = [];
  assert.equal(await main(["install"], { env, out: (o) => out.push(o), err() {} }), 0);
  assert.match(out[0], /^Installed ai-native CLI v3\.3\.0 in /);
  const snapshot = snap(join(home, "bin"));
  out.length = 0;
  assert.equal(await main(["install"], { env, out: (o) => out.push(o), err() {} }), 0);
  assert.match(out[0], /^ai-native CLI v3\.3\.0 is installed in /);
  assert.deepEqual(snap(join(home, "bin")), snapshot, "a second install changes nothing");
  assert.deepEqual(readdirSync(join(home, "bin")).sort(), ["ai-native", "ai-native.cmd", "ai-native.mjs"]);
  const bin = join(home, "bin");
  assert.ok(bin.includes(" "), "the test home has a space in its path");
  const hint = out[1];
  if (process.platform === "win32") {
    assert.doesNotMatch(hint, /\$env:Path/i, "never the process PATH (it holds the Machine PATH too)");
    assert.match(hint, /GetEnvironmentVariable\('Path','User'\)/);
    assert.match(hint, /-notcontains/, "idempotent: an entry already there is not added twice");
  } else assert.match(hint, /export PATH=/);
  const onPath = await main(["install"], { env: { ...env, PATH: `${bin}${delimiter}${process.env.PATH}` }, out: (o) => out.push(o), err() {} });
  assert.equal(onPath, 0);
  assert.match(out.at(-1), /is already on your PATH/);
  // the shim runs with spaces in the path
  const shim = process.platform === "win32" ? spawnSync("cmd.exe", ["/c", `"${join(bin, "ai-native.cmd")}"`, "--version"], { encoding: "utf8", windowsVerbatimArguments: true }) : spawnSync("sh", [join(bin, "ai-native"), "--version"], { encoding: "utf8" });
  assert.equal(shim.stdout.trim(), `CLI: ${CLI_VERSION}`, shim.stderr);
  assert.notEqual(spawnSync(process.execPath, [join(bin, "ai-native.mjs"), "install", "--nope"], { encoding: "utf8", env }).status, 0);
  if (process.platform !== "win32") assert.equal(readFileSync(join(bin, "ai-native")).length > 0 && (require_mode(join(bin, "ai-native")) & 0o111) !== 0, true, "the Unix shim is executable");
});
const require_mode = (f) => readdirSync(join(f, "..")) && statMode(f);
import { statSync } from "node:fs";
const statMode = (f) => statSync(f).mode;

test("UNINSTALL removes the program and both shims, leaves repositories, PATH and the cache alone, and is safe to repeat", async () => {
  const m = await machine("v3.3.0");
  const { project, cache } = await adopted(R2);
  const before = state(project);
  const env = { ...process.env, AI_NATIVE_HOME: m.home, AI_NATIVE_CACHE: cache, PATH: process.env.PATH };
  const out = [];
  assert.equal(await main(["uninstall"], { env, out: (o) => out.push(o), err() {} }), 0);
  assert.match(out[0], /Removed ai-native from this machine: ai-native\.mjs, ai-native, ai-native\.cmd/);
  assert.ok(!existsSync(m.bin), "no program, no shims, and the empty bin directory is gone");
  assert.deepEqual(state(project), before, "repositories are intact");
  assert.ok(existsSync(join(cache, "blobs")), "the release cache is data that stays unless --purge-cache");
  assert.equal(env.PATH, process.env.PATH);
  out.length = 0;
  assert.equal(await main(["uninstall"], { env, out: (o) => out.push(o), err() {} }), 0);
  assert.match(out[0], /is not installed in .*nothing to do/);
  // the launcher of the repository still runs from the cache with no global CLI
  const launcher = spawnSync(process.execPath, [join(project, ".ai-native", "ai-native.mjs"), "version"], { cwd: project, encoding: "utf8", env });
  assert.equal(launcher.stdout.split("\n")[0].trim(), `v9.9.2 ${R2.commit}`, launcher.stderr);
});

test("UNINSTALL --purge-cache deletes only something that is recognizably an ai-native cache; other files in bin are never removed", async () => {
  const m = await machine("v3.3.0");
  writeFileSync(join(m.bin, "other-tool.cmd"), "echo mine");
  const stranger = tmp("stranger");
  writeFileSync(join(stranger, "precious.txt"), "keep");
  const env = { ...process.env, AI_NATIVE_HOME: m.home, AI_NATIVE_CACHE: stranger };
  assert.equal(await main(["uninstall", "--purge-cache"], { env, out() {}, err() {} }), 0);
  assert.ok(existsSync(join(stranger, "precious.txt")), "AI_NATIVE_CACHE pointing at a non-cache directory is never deleted");
  assert.deepEqual(readdirSync(m.bin), ["other-tool.cmd"], "only ai-native's own files are removed, and the directory stays because it is not empty");
  const { cache } = await adopted(R1);
  assert.equal(await main(["uninstall", "--purge-cache"], { env: { ...process.env, AI_NATIVE_HOME: m.home, AI_NATIVE_CACHE: cache }, out() {}, err() {} }), 0);
  assert.ok(!existsSync(cache));
});

// ---- detach ------------------------------------------------------------------------------------------------------------------------------------

test("DETACH removes only what ai-native wrote (projections, launcher, journal, lock), never user code, and the repo is a normal one afterwards; repeating is safe", async () => {
  const project = gitInit();
  writeFileSync(join(project, "app.py"), "print('business code')\n");
  mkdirSync(join(project, "src"), { recursive: true });
  writeFileSync(join(project, "src", "core.py"), "x = 1\n");
  git(project, "add", ".");
  git(project, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "business");
  const { cache } = await adopted(R2, { project });
  const userFiles = { "app.py": readFileSync(join(project, "app.py"), "utf8"), "src/core.py": readFileSync(join(project, "src", "core.py"), "utf8") };
  const w = world({ releases: [R2] });
  assert.equal(await w.run(["detach"], { cwd: project, cache }), 0, w.log.engineOut + w.err.join("\n"));
  assert.match(w.log.engineOut, /^STATUS: NOT_ADOPTED\nDETACH: DETACHED \(\d+ managed file\(s\), the journal and the lock removed/);
  assert.deepEqual(files(project).filter((p) => !p.endsWith(".git")), ["app.py", "src", join("src", "core.py")].sort(), "everything ai-native wrote is gone, nothing else");
  assert.equal(readFileSync(join(project, "app.py"), "utf8"), userFiles["app.py"]);
  assert.equal(readFileSync(join(project, "src", "core.py"), "utf8"), userFiles["src/core.py"]);
  assert.equal(git(project, "status", "--porcelain", "-uall"), "", "a normal repository: nothing staged, nothing untracked");
  const again = world({ releases: [R2], network: false });
  assert.equal(await again.run(["detach"], { cwd: project, cache }), 0);
  assert.match(again.out.join("\n"), /STATUS: NOT_ADOPTED\nDETACH: nothing to remove: this repository is not adopted/);
  assert.deepEqual(again.log.fetched, [], "nothing to detach needs no network");
  // and it can be adopted again
  assert.equal(await world({ releases: [R2] }).run(["init", "--profile", "python-service"], { cwd: project, cache }), 0);
});

test("DETACH fails closed on a managed file you edited, naming it and changing nothing; --keep-modified leaves exactly that file in place", async () => {
  const { project, cache } = await adopted(R2);
  const edited = readFileSync(join(project, "CLAUDE.md"), "utf8") + "\nMy own instructions.\n";
  writeFileSync(join(project, "CLAUDE.md"), edited);
  const before = state(project);
  const w = world({ releases: [R2] });
  assert.equal(await w.run(["detach"], { cwd: project, cache }), 1);
  assert.match(w.log.engineOut, /DETACH_BLOCKED: 1 managed file\(s\) were edited since ai-native wrote them.*: CLAUDE\.md\. Nothing was removed.*--keep-modified/);
  assert.deepEqual(state(project), before, "nothing at all changed");

  const w2 = world({ releases: [R2] });
  assert.equal(await w2.run(["detach", "--keep-modified"], { cwd: project, cache }), 0, w2.log.engineOut);
  assert.match(w2.log.engineOut, /WARNING: kept your edited file\(s\), now ordinary project files: CLAUDE\.md/);
  assert.deepEqual(files(project), ["CLAUDE.md"], "only the file you edited remains");
  assert.equal(readFileSync(join(project, "CLAUDE.md"), "utf8"), edited);
  assert.ok(!existsSync(join(project, "ai-native.lock.json")));
});

test("DETACH leaves files that already existed (identical to the release), the caller workflow and a v2 migration alone, and an orphan journal is refused", async () => {
  const project = gitInit();
  const preexisting = readFileSync(join(REPO_ROOT, "runtime", "adapters", "launcher.mjs"));
  mkdirSync(join(project, ".ai-native"), { recursive: true });
  writeFileSync(join(project, ".ai-native", "ai-native.mjs"), Buffer.concat([preexisting, Buffer.from("\n// release v9.9.2\n")])); // identical to what R2 would project
  const { cache } = await adopted(R2, { project });
  mkdirSync(join(project, ".github", "workflows"), { recursive: true });
  writeFileSync(join(project, ".github", "workflows", "ai-native.yml"), "name: mine\n");
  const w = world({ releases: [R2] });
  assert.equal(await w.run(["detach"], { cwd: project, cache }), 0, w.log.engineOut + w.err.join("\n"));
  assert.match(w.log.engineOut, /WARNING: kept 1 file\(s\) that existed before ai-native and are identical to what it projects: \.ai-native\/ai-native\.mjs/);
  assert.match(w.log.engineOut, /WARNING: \.github\/workflows\/ai-native\.yml is not tracked by the adoption journal and was left as it is/);
  assert.ok(existsSync(join(project, ".ai-native", "ai-native.mjs")) && existsSync(join(project, ".github", "workflows", "ai-native.yml")));

  const orphan = gitInit();
  mkdirSync(join(orphan, ".ai-native"), { recursive: true });
  writeFileSync(join(orphan, ".ai-native", "adoption-journal.json"), JSON.stringify({ schemaVersion: 1, created: {}, adopted: {}, skipped: [] }));
  const w2 = world({ releases: [R2] });
  assert.equal(await w2.run(["detach"], { cwd: orphan }), 1);
  assert.match(w2.err.join("\n"), /ADOPTION_INCONSISTENT/);
  assert.equal(detach({ projectRoot: orphan }).status, "FAIL");
});

// ---- several repositories, several machines ----------------------------------------------------------------------------------------------------

test("MULTI-REPO: one CLI and one cache serve repositories pinned to v9.9.1, v9.9.2 and v9.9.3 at once; each keeps its own lock and its own launcher", async () => {
  const cache = tmp("cache");
  const repos = {};
  for (const [r, repo] of [[R1, gitInit()], [R2, gitInit()], [R3, gitInit()]]) {
    const w = world({ releases: [R1, R2, R3] });
    assert.equal(await w.run(["init", "--profile", "python-service", "--version", r.version], { cwd: repo, cache }), 0, w.log.engineOut + w.err.join("\n"));
    repos[r.version] = repo;
  }
  const all = world({ releases: [R1, R2, R3] });
  for (const [version, repo] of Object.entries(repos)) {
    assert.equal(await all.run(["init"], { cwd: repo, cache }), 0, `${version}: ${all.log.engineOut}`);
    assert.equal(lockOf(repo).platform.version, version, "init never moves a repository to the latest");
    all.out.length = 0;
    await all.run(["--version"], { cwd: repo });
    assert.equal(all.out[0], `CLI: ${CLI_VERSION} | PLATFORM: ${version}`);
    const launcher = spawnSync(process.execPath, [join(repo, ".ai-native", "ai-native.mjs"), "version"], { cwd: repo, encoding: "utf8", env: { ...process.env, AI_NATIVE_CACHE: cache } });
    assert.match(launcher.stdout.split("\n")[0], new RegExp(`^${version.replaceAll(".", "\\.")} `), launcher.stderr);
  }
  // upgrading one of them leaves the other two where they are
  assert.equal(await all.run(["upgrade", "--to", "v9.9.2"], { cwd: repos["v9.9.1"], cache }), 0, all.log.engineOut);
  assert.deepEqual(Object.fromEntries(Object.entries(repos).map(([v, repo]) => [v, lockOf(repo).platform.version])), { "v9.9.1": "v9.9.2", "v9.9.2": "v9.9.2", "v9.9.3": "v9.9.3" });
});

test("MULTI-MACHINE: the platform of a repository comes from its lock in Git, not from the machine - a clone on another machine (empty cache) gets the pinned release, not the latest", async () => {
  const { project } = await adopted(R1);
  git(project, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "adopt");
  const clone = join(tmp("clone"), "r");
  git(project, "clone", "-q", project, clone);
  const machineB = tmp("cache"); // another PC: nothing cached, a newer release exists
  const w = world({ releases: [R1, R2, R3] });
  assert.equal(await w.run(["init"], { cwd: clone, cache: machineB }), 0, w.log.engineOut + w.err.join("\n"));
  assert.equal(lockOf(clone).platform.version, "v9.9.1");
  assert.deepEqual(w.log.fetched.filter((u) => u.endsWith(".tar.gz")), [URL_OF("v9.9.1", "ai-native-v9.9.1.tar.gz")], "only the pinned release was fetched");
  assert.match(w.log.engineOut, /DRIFT: CLEAN/);
  assert.equal(git(clone, "status", "--porcelain"), "");
});
function gunzipFile(gz, name) {
  const { gunzipSync } = awaitedZlib;
  const buf = gunzipSync(gz);
  for (let off = 0; off + 512 <= buf.length;) {
    const h = buf.subarray(off, off + 512);
    if (h.every((b) => b === 0)) break;
    const n = h.subarray(0, 100).toString("utf8").replace(/\0.*$/s, "");
    const size = parseInt(h.subarray(124, 136).toString("utf8").replace(/\0.*$/s, "").trim() || "0", 8);
    if (n === name) return buf.subarray(off + 512, off + 512 + size);
    off += 512 + Math.ceil(size / 512) * 512;
  }
  throw new Error(`${name} not in bundle`);
}
import * as awaitedZlib from "node:zlib";

// ---- detach does not depend on the pin (N-17) --------------------------------------------------------------------------------------------------

/** Rewrites the lock so the repository is pinned to `pin` (a release that does not exist in the test's GitHub). */
const repin = (project, pin) => {
  const file = join(project, "ai-native.lock.json");
  const lock = JSON.parse(readFileSync(file, "utf8"));
  lock.platform = { ...lock.platform, version: pin, commit: "e".repeat(40), digest: `sha256:${"e".repeat(64)}` };
  writeFileSync(file, `${JSON.stringify(lock, null, 2)}\n`);
};
const platformRevocations = (n, versions) => JSON.stringify({ schemaVersion: 1, n, publishedAt: "2026-10-14T00:00:00Z", entries: versions.map((version) => ({ kind: "platform", id: "ai-native", version, reason: "audit", severity: "high" })) });
const bundleFetches = (w) => w.log.fetched.filter((u) => u.endsWith(".tar.gz"));
const BUNDLE = (v) => URL_OF(v, `ai-native-${v}.tar.gz`);

test("DETACH works whatever release the repository is pinned to: v3.1.3, v3.2.0 and v3.3.0 pins, none of which exists where the command runs", async () => {
  for (const pin of ["v3.1.3", "v3.2.0", "v3.3.0"]) {
    const { project } = await adopted(R2);
    repin(project, pin);
    const w = world({ releases: [R2] });
    assert.equal(await w.run(["detach"], { cwd: project, cache: tmp("cache") }), 0, `${pin}: ${w.log.engineOut}${w.err.join("\n")}`); // an empty cache: another machine, online
    assert.match(w.log.engineOut, /DETACH: DETACHED/, pin);
    assert.deepEqual(bundleFetches(w), [BUNDLE("v9.9.2")], `${pin}: only the release that runs the engine was fetched, never the pin`);
    assert.deepEqual(files(project), [], `${pin}: everything ai-native wrote is gone`);
    assert.equal(git(project, "status", "--porcelain", "-uall"), "", pin);
  }
  // and `--trust-repo` no longer exists for it: the lock is not read, so there is no trust to extend
  const { project } = await adopted(R2);
  const w = world({ releases: [R2] });
  assert.equal(await w.run(["detach", "--trust-repo", "a/b"], { cwd: project }), 1);
  assert.match(w.err.join("\n"), /unknown option: --trust-repo/);
});

test("DETACH fails closed on malformed or schema-invalid locks but ignores a valid foreign-repo pin", async () => {
  for (const invalid of ["{ nope", '{"schemaVersion":1,"platform":{},"profiles":["factory"]}']) {
    const { project } = await adopted(R2);
    const lockPath = join(project, "ai-native.lock.json");
    writeFileSync(lockPath, invalid);
    const before = state(project);
    const w = world({ releases: [R2] });
    assert.equal(await w.run(["detach"], { cwd: project, cache: tmp("cache") }), 1, w.log.engineOut + w.err.join("\n"));
    assert.match(w.err.join("\n") + w.log.engineOut, /ADOPTION_INCONSISTENT/);
    assert.equal(readFileSync(lockPath, "utf8"), invalid, "an invalid lock remains byte-identical");
    assert.deepEqual(state(project), before, "the adopted repository is unchanged");
  }

  const { project: p2 } = await adopted(R2);
  const lock = JSON.parse(readFileSync(join(p2, "ai-native.lock.json"), "utf8"));
  lock.platform.repo = "github:evil/ai-native";
  writeFileSync(join(p2, "ai-native.lock.json"), JSON.stringify(lock));
  const w2 = world({ releases: [R2] });
  assert.equal(await w2.run(["detach"], { cwd: p2, cache: tmp("cache") }), 0, w2.log.engineOut + w2.err.join("\n"));
  assert.ok(w2.log.fetched.every((u) => !u.includes("evil/")), "the engine always comes from the official repository");
  assert.deepEqual(files(p2), []);
});

test("DETACH with a REVOKED pin: it still runs, with the newest release that is not revoked; if the latest is revoked it falls back; if every one is revoked it fails closed", async () => {
  // the pinned release (v9.9.2) is revoked: the removal must not depend on it
  const R3rev = release("v9.9.3", { assets: { "revocations-2.json": platformRevocations(2, ["v9.9.2"]) } });
  const { project } = await adopted(R2);
  const w = world({ releases: [R2, R3rev] });
  assert.equal(await w.run(["detach"], { cwd: project, cache: tmp("cache") }), 0, w.log.engineOut + w.err.join("\n"));
  assert.deepEqual(bundleFetches(w), [BUNDLE("v9.9.3")], "the engine is the newest release that is not revoked");
  assert.ok(w.log.gh.some((a) => a[2].endsWith("revocations-2.json")), "the revocations list itself was attested");
  assert.deepEqual(files(project), []);

  // the LATEST release is revoked: its code is not run; the next one is
  const R2x = release("v9.9.2", { assets: { "revocations-2.json": platformRevocations(2, ["v9.9.3"]) } });
  const { project: p2 } = await adopted(R2x);
  const w2 = world({ releases: [R2x, R3] });
  assert.equal(await w2.run(["detach"], { cwd: p2, cache: tmp("cache") }), 0, w2.log.engineOut + w2.err.join("\n"));
  assert.deepEqual(bundleFetches(w2), [BUNDLE("v9.9.2")], "the revoked latest release was never downloaded");

  // every release is revoked: nothing trustworthy can run the removal -> fail closed, nothing changes
  const R3all = release("v9.9.3", { assets: { "revocations-2.json": platformRevocations(2, ["v9.9.2", "v9.9.3"]) } });
  const { project: p3 } = await adopted(R2);
  const before = state(p3);
  const w3 = world({ releases: [R2, R3all] });
  assert.equal(await w3.run(["detach"], { cwd: p3, cache: tmp("cache") }), 1);
  assert.match(w3.err.join("\n"), /REVOKED: no stable release of o\/ai-native is available to run `ai-native detach`.*Nothing was changed/);
  assert.equal(w3.log.engine.length, 0);
  assert.deepEqual(state(p3), before);
});

test("DETACH offline: it uses the newest release this machine verified AND that ships it, warns that revocations were not checked; an empty cache or no network fails closed and changes nothing", async () => {
  const { project, cache } = await adopted(R2);
  const off = world({ releases: [R2], network: false });
  assert.equal(await off.run(["detach", "--offline"], { cwd: project, cache }), 0, off.log.engineOut + off.err.join("\n"));
  assert.deepEqual(off.log.fetched, [], "offline means no network at all");
  assert.match(off.log.engineOut, /WARNING: offline: revocation status of the release that ran this command NOT checked/);
  assert.deepEqual(files(project), []);

  const { project: p2 } = await adopted(R2);
  const before = state(p2);
  const w = world({ releases: [R2], network: false });
  assert.equal(await w.run(["detach", "--offline"], { cwd: p2, cache: tmp("cache") }), 1);
  assert.match(w.err.join("\n"), /OFFLINE: no release this machine has verified ships `ai-native detach`.*Nothing was changed/);
  assert.equal(await w.run(["detach"], { cwd: p2, cache: tmp("cache") }), 1, "online with no network: the same fail-closed refusal");
  assert.match(w.err.join("\n"), /cannot reach GitHub Releases.*Nothing was changed/);
  assert.equal(w.log.engine.length, 0);
  assert.deepEqual(state(p2), before);

  // the cache holds a NEWER verified release that does not ship `detach` (a v3.2.0-like one): it is skipped, not trusted to do it
  const cache2 = tmp("cache");
  const { project: p3 } = await adopted(R2, { cache: cache2 });
  const old = workingTreeRelease({ version: "v9.9.8", mutate: (f) => Object.fromEntries(Object.entries(f).filter(([path]) => path !== "runtime/bootstrap/detach.mjs")) });
  putBlob(cache2, old.bytes);
  const hex = sha256(old.bytes);
  mkdirSync(join(cache2, "attestations"), { recursive: true });
  writeFileSync(join(cache2, "attestations", `${hex}.json`), JSON.stringify({ digest: `sha256:${hex}`, repo: SLUG, version: "v9.9.8", verifiedBy: "gh attestation verify" }));
  assert.equal(newestCachedWith(cache2, SLUG, "runtime/bootstrap/adopt.mjs").version, "v9.9.8");
  assert.equal(newestCachedWith(cache2, SLUG, "runtime/bootstrap/detach.mjs").version, "v9.9.2", "the newest release WITH the engine, not just the newest");
  const w3 = world({ releases: [R2], network: false });
  assert.equal(await w3.run(["detach", "--offline"], { cwd: p3, cache: cache2 }), 0, w3.log.engineOut + w3.err.join("\n"));
  assert.deepEqual(files(p3), []);
});

test("DETACH with this CLI revoked is refused online before any engine runs, and still refuses to touch an edited managed file", async () => {
  const entries = [{ kind: "cli", id: "ai-native-cli", version: CLI_VERSION, reason: "compromised build", severity: "critical" }];
  const mine = release("v9.9.2", { assets: { "cli-revocations-1.json": JSON.stringify({ schemaVersion: 1, n: 1, publishedAt: "2026-10-14T00:00:00Z", entries }) } });
  const { project } = await adopted(R2);
  const before = state(project);
  const w = world({ releases: [mine] });
  assert.equal(await w.run(["detach"], { cwd: project, cache: tmp("cache") }), 1);
  assert.match(w.err.join("\n"), /CLI_REVOKED/);
  assert.equal(w.log.engine.length, 0);
  assert.deepEqual(state(project), before);
});

// ---- prereleases (N-16) ------------------------------------------------------------------------------------------------------------------------

test("A CLI built from a prerelease tag is a first-class CLI: it declares it, orders below its stable release, and install, self-update and the engine agree", async () => {
  const m = await machine("v9.9.9-rc.1");
  assert.equal(declaredVersion(m.script), "v9.9.9-rc.1");
  const shown = spawnSync(process.execPath, [m.script, "--version"], { encoding: "utf8" });
  assert.equal(shown.stdout.trim(), "CLI: v9.9.9-rc.1");
  assert.equal(JSON.parse(spawnSync(process.execPath, [m.script, "version", "--json"], { encoding: "utf8" }).stdout).cli, "v9.9.9-rc.1");

  // the stable release of the same X.Y.Z is newer than its rc: self-update moves rc -> stable, and only forward
  const w = world({ releases: [release("v9.9.9")], home: m.home });
  assert.equal(await w.run(["self-update"], {}), 0, w.err.join("\n"));
  assert.equal(m.version(), "v9.9.9");
  const again = world({ releases: [release("v9.9.9")], home: m.home });
  await again.run(["self-update"], {});
  assert.match(again.out[0], /CLI: v9\.9\.9 is up to date/);

  // install never puts an older CLI over a newer one: alpha < rc < stable
  const put = async (version, home) => {
    const file = join(tmp("dl"), "ai-native-cli.mjs");
    writeFileSync(file, cliAsset(version));
    const err = [];
    const code = await main(["install"], { env: { ...process.env, AI_NATIVE_HOME: home }, self: file, out() {}, err: (e) => err.push(e) });
    return { code, err: err.join("\n") };
  };
  const refused = await put("v9.9.9-rc.1", m.home); // over the installed stable v9.9.9
  assert.equal(refused.code, 1);
  assert.match(refused.err, /INSTALL_DOWNGRADE_REFUSED: v9\.9\.9 is installed and this file is v9\.9\.9-rc\.1/);
  assert.equal(m.version(), "v9.9.9");
  const home = tmp("home");
  assert.equal((await put("v9.9.9-rc.2", home)).code, 0);
  assert.equal((await put("v9.9.9-alpha.5", home)).code, 1, "alpha is older than rc");
  assert.equal((await put("v9.9.9-rc.10", home)).code, 0, "rc.10 is newer than rc.2 (numeric, not textual)");
  assert.equal(declaredVersion(join(home, "bin", "ai-native.mjs")), "v9.9.9-rc.10");
});

test("The engine accepts a prerelease CLI as the caller and compares it by SemVer: an rc is below its own stable release", () => {
  const rc = callerFrom({ version: "v9.9.9-rc.1", protocol: "1", capabilities: "adopt,upgrade,detach" });
  assert.equal(rc.error, undefined);
  assert.equal(rc.legacy, false);
  const need = (minCliVersion) => ({ version: "v9.9.10", bootstrap: { protocol: 1, minCliVersion, requiredCapabilities: ["adopt"] } });
  assert.equal(negotiate({ platform: need("v9.9.8"), caller: rc }).ok, true);
  assert.equal(negotiate({ platform: need("v9.9.9"), caller: rc }).ok, false, "v9.9.9-rc.1 < v9.9.9");
  assert.match(negotiate({ platform: need("v9.9.9"), caller: rc }).errors.join(), /needs CLI >= v9\.9\.9, this is v9\.9\.9-rc\.1/);
  for (const bad of ["v9.9.9-beta.1", "v9.9", "9.9.9", "v9.9.9-rc"]) assert.match(callerFrom({ version: bad, protocol: "1", capabilities: "adopt" }).error, /invalid --cli-version/, bad);
});

// ---- install quotes what it embeds (N-18) ------------------------------------------------------------------------------------------------------

test("INSTALL quotes everything it embeds: an apostrophe, %, $, a backtick and spaces in the home path cannot break the shims, and the PATH lines parse in their shells", async () => {
  const home = join(tmp("home"), "O'Brien 100% $USER `x`");
  const out = [];
  assert.equal(await main(["install"], { env: { ...process.env, AI_NATIVE_HOME: home, PATH: process.env.PATH }, out: (o) => out.push(o), err() {} }), 0);
  const bin = join(home, "bin");
  const sh = readFileSync(join(bin, "ai-native"), "utf8");
  const cmd = readFileSync(join(bin, "ai-native.cmd"), "utf8");
  assert.match(sh, /^#!\/bin\/sh\nexec node '.*' "\$@"\n$/, "single quotes: nothing inside is special to sh");
  assert.ok(sh.includes("O'\\''Brien"), "the apostrophe is closed, escaped and reopened");
  assert.equal(cmd, "@echo off\r\nnode \"%~dp0ai-native.mjs\" %*\r\n", "the batch shim embeds no path at all: nothing in the home directory can break it");
  // the shim runs from that path, in the shell it was written for
  const shim = process.platform === "win32"
    ? spawnSync("cmd.exe", ["/c", `"${join(bin, "ai-native.cmd")}"`, "--version"], { encoding: "utf8", windowsVerbatimArguments: true })
    : spawnSync("sh", [join(bin, "ai-native"), "--version"], { encoding: "utf8" });
  assert.equal(shim.stdout.trim(), `CLI: ${CLI_VERSION}`, shim.stderr);

  // the PATH lines, for both shells, whatever the platform running this test
  const plain = { PATH: "" };
  const win = pathHint(bin, plain, "win32");
  const code = win.replace(/^Add it to your PATH \(once, safe to repeat\):\s*/, "");
  assert.ok(code.includes(`'${bin.replaceAll("'", "''")}'`), "a PowerShell single-quoted string with the apostrophe doubled");
  assert.doesNotMatch(win, /\$env:Path/i, "never the process PATH (it holds the Machine PATH too)");
  for (const exe of ["pwsh", "powershell"]) {
    if (spawnSync(exe, ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.Major"], { encoding: "utf8" }).status !== 0) continue;
    // parse only: running it would edit the User PATH of the machine running the test
    const r = spawnSync(exe, ["-NoProfile", "-Command", "try { [void][scriptblock]::Create($env:HINT); 'PARSE_OK' } catch { 'PARSE_FAIL ' + $_.Exception.Message }"], { encoding: "utf8", env: { ...process.env, HINT: code } });
    assert.equal(r.stdout.trim(), "PARSE_OK", `${exe}: ${r.stdout}${r.stderr}`);
  }
  const posix = pathHint(bin, plain, "linux");
  assert.match(posix, /^Add it to your PATH \(once\):  export PATH='.*':"\$PATH"$/);
  if (spawnSync("sh", ["-c", "true"]).status === 0) {
    const r = spawnSync("sh", ["-c", 'eval "$HINT" && printf "%s" "$PATH"'], { encoding: "utf8", env: { ...process.env, HINT: posix.replace(/^Add it to your PATH \(once\):\s*/, "") } });
    assert.ok(r.stdout.startsWith(`${bin}:`), `the line puts exactly the directory first on PATH: ${r.stdout.slice(0, 120)} ${r.stderr}`);
  }
});

// ---- N-18 (non-ASCII profile) and N-21 (legacy consumers without a journal) -----------------------------------------------------------------

test("INSTALL works under a home with non-ASCII characters, % and spaces: the shim does not embed the path (cmd.exe reads it in the OEM code page)", async () => {
  for (const name of ["José Muñoz", "’curly‘ q", "50% done (x) a&b", "日本語"]) {
    const home = join(tmp("home"), name);
    assert.equal(await main(["install"], { env: { ...process.env, AI_NATIVE_HOME: home, PATH: process.env.PATH }, out() {}, err() {} }), 0, name);
    const bin = join(home, "bin");
    const cmd = readFileSync(join(bin, "ai-native.cmd"));
    assert.ok(cmd.every((b) => b < 128), `${name}: the batch file is pure ASCII`);
    const shim = process.platform === "win32"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", `""${join(bin, "ai-native.cmd")}" --version"`], { encoding: "utf8", windowsVerbatimArguments: true })
      : spawnSync("sh", [join(bin, "ai-native"), "--version"], { encoding: "utf8" });
    assert.equal(shim.stdout.trim(), `CLI: ${CLI_VERSION}`, `${name}: ${shim.stderr}`);
  }
});

/** A repository the way the bootstrap of v3.1.x left it: the lock, and nothing else ai-native wrote (no adoption journal). */
async function legacyRepo(extra = {}) {
  const { project: source } = await adopted(R2);
  const project = gitInit();
  writeFileSync(join(project, "ai-native.lock.json"), readFileSync(join(source, "ai-native.lock.json")));
  for (const [rel, content] of Object.entries(extra)) {
    mkdirSync(dirname(join(project, rel)), { recursive: true });
    writeFileSync(join(project, rel), content);
  }
  git(project, "add", "-A");
  return project;
}

test("DETACH of a legacy repository (lock, no journal, as v3.1.x left it) removes the lock and nothing else, and says so", async () => {
  const project = await legacyRepo({ "src/app.py": "print('mine')\n", "README.md": "# mine\n" });
  const w = world({ releases: [R2] });
  assert.equal(await w.run(["detach"], { cwd: project, cache: tmp("cache") }), 0, w.log.engineOut + w.err.join("\n"));
  assert.match(w.log.engineOut, /DETACH: DETACHED \(the lock removed/);
  assert.match(w.log.engineOut, /WARNING: legacy repository: it has no adoption journal/);
  assert.deepEqual(files(project).map((p) => p.replaceAll("\\", "/")), ["README.md", "src", "src/app.py"], "your files are untouched");
  assert.equal(readFileSync(join(project, "src/app.py"), "utf8"), "print('mine')\n");
  assert.doesNotMatch(git(project, "ls-files"), /ai-native\.lock\.json/, "the removal is staged");
});

test("DETACH of a legacy repository never deletes a file it cannot prove is ai-native's: projections already present are listed and left; .ai-native/ or an unreadable lock fail closed", async () => {
  // a file ai-native could project, present without any journal: kept, and named
  const p1 = await legacyRepo({ "CLAUDE.md": "mine\n" });
  const w1 = world({ releases: [R2] });
  assert.equal(await w1.run(["detach"], { cwd: p1, cache: tmp("cache") }), 0, w1.log.engineOut + w1.err.join("\n"));
  assert.equal(readFileSync(join(p1, "CLAUDE.md"), "utf8"), "mine\n");
  assert.match(w1.log.engineOut, /left as they are, because no journal says they are ai-native's.*CLAUDE\.md/);

  // the launcher directory exists but the journal does not: ownership is unknown -> refuse, change nothing, point to upgrade
  const p2 = await legacyRepo({ ".ai-native/ai-native.mjs": "// launcher\n" });
  const before = state(p2);
  const w2 = world({ releases: [R2] });
  assert.equal(await w2.run(["detach"], { cwd: p2, cache: tmp("cache") }), 1);
  assert.match(w2.err.join("\n") + w2.log.engineOut, /ADOPTION_INCONSISTENT[^\n]*\.ai-native\/ exists[^\n]*Nothing was removed[^\n]*ai-native upgrade/);
  assert.deepEqual(state(p2), before);

  // a lock that is not an ai-native lock (or is not even JSON) is not removed
  for (const bad of ["{ nope", "[]", '{"schemaVersion":1}']) {
    const p3 = await legacyRepo();
    writeFileSync(join(p3, "ai-native.lock.json"), bad);
    const b3 = state(p3);
    const w3 = world({ releases: [R2] });
    assert.equal(await w3.run(["detach"], { cwd: p3, cache: tmp("cache") }), 1, bad);
    assert.match(w3.err.join("\n") + w3.log.engineOut, /ADOPTION_INCONSISTENT/, bad);
    assert.deepEqual(state(p3), b3, bad);
  }
});
