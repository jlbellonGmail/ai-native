// L3 consumer gate: real consumer repos bootstrapped from a REAL build of this commit.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runL3 } from "./l3.mjs";
import { applyConsumer } from "../adapters/consumer.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const cli = join(repoRoot, "runtime", "bootstrap", "cli.mjs");
const tmp = () => mkdtempSync(join(tmpdir(), "ai-native-l3-"));
const node = (args) => spawnSync(process.execPath, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8" }).trim();
const put = (root, rel, text) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text, "utf8");
};

const commit = git(repoRoot, "rev-parse", "HEAD");
const out = tmp();
const build = node([join(repoRoot, "runtime", "release", "build.mjs"), "--version", "v3.0.0-rc.1", "--out", out, "--commit", commit]);
assert.equal(build.status, 0, build.stderr);
const bundle = join(out, JSON.parse(build.stdout).bundle);
const cache = tmp();

function consumer() {
  const proj = tmp();
  git(proj, "init", "-q", "-b", "main");
  git(proj, "config", "user.email", "t@example.invalid");
  git(proj, "config", "user.name", "T");
  put(proj, "README.md", "consumer\n");
  const init = node([cli, "init", "--bundle", bundle, "--repo", "github:o/ai-native", "--profile", "factory", "--channel", "rc", "--project", proj, "--cache", cache, "--json"]);
  assert.equal(init.status, 0, init.stdout);
  const sync = node([cli, "sync", "--from-file", bundle, "--offline", "--project", proj, "--cache", cache, "--json"]);
  assert.equal(sync.status, 0, sync.stdout);
  git(proj, "add", "-A");
  git(proj, "commit", "-q", "-m", "base");
  return proj;
}
const ids = (r, status) => r.checks.filter((c) => c.status === status).map((c) => c.id);

test("L3 passes on a synced consumer with a docs-only change; depth is LIGHT", () => {
  const proj = consumer();
  const base = git(proj, "rev-parse", "HEAD");
  put(proj, "README.md", "consumer, edited\n");
  git(proj, "commit", "-qam", "docs");
  const r = runL3({ project: proj, cache, base });
  assert.equal(r.status, "PASS", JSON.stringify(r.checks));
  assert.equal(r.depth, "LIGHT");
  assert.deepEqual(ids(r, "FAIL"), []);
  assert.ok(ids(r, "NOT_APPLICABLE").includes("product"), "no productTestCommand is NOT_APPLICABLE, never a silent pass");
});

test("L3 fails closed: not adopted, and a cache that lacks the pinned release", () => {
  const empty = tmp();
  git(empty, "init", "-q", "-b", "main");
  assert.deepEqual(ids(runL3({ project: empty, cache }), "FAIL"), ["lock"]);
  const proj = consumer();
  assert.ok(ids(runL3({ project: proj, cache: tmp() }), "FAIL").includes("bootstrap"), "a cache that does not hold the pinned release is not READY");
});

test("L3 p45: a forged review in a touched events.jsonl fails the gate", () => {
  const proj = consumer();
  const base = git(proj, "rev-parse", "HEAD");
  const line = JSON.stringify({ schemaVersion: 1, eventType: "review", unitId: "x", timestamp: "2026-01-01T00:00:00.000Z", prevHash: "genesis", stage: "code", verdict: "approved", reviewInvocationId: "builder-wrote-this", nonce: "n", inputDigest: "sha256:" + "0".repeat(64) });
  put(proj, "runs/x/events.jsonl", `${line}\n`);
  git(proj, "add", "-A");
  git(proj, "commit", "-qm", "forged review");
  const r = runL3({ project: proj, cache, base });
  assert.equal(r.status, "FAIL");
  assert.ok(ids(r, "FAIL").includes("p45"));
  assert.match(r.checks.find((c) => c.id === "p45").detail, /REVIEW_ID_INVALID/);
});

test("L3 control-plane-sized change is assessed deeper than docs", () => {
  const proj = consumer();
  const base = git(proj, "rev-parse", "HEAD");
  put(proj, ".github/workflows/x.yml", "name: x\n");
  put(proj, "contracts/a.json", "{}\n");
  put(proj, "core/security-policy.json", "{}\n");
  git(proj, "add", "-A");
  git(proj, "commit", "-qm", "control plane");
  const r = runL3({ project: proj, cache, base });
  assert.notEqual(r.depth, "LIGHT");
  assert.match(r.checks.find((c) => c.id === "circuit").detail, /ASSESS\(3 changed path/);
});

test("L3 adoption: intact adopted files pass, an edited one warns (never fails)", () => {
  const proj = consumer();
  applyConsumer({ releaseRoot: repoRoot, projectRoot: proj, tools: ["claude"] });
  assert.equal(runL3({ project: proj, cache }).checks.find((c) => c.id === "adoption").status, "PASS");
  writeFileSync(join(proj, "CLAUDE.md"), `${readFileSync(join(proj, "CLAUDE.md"), "utf8")}\nlocal edit\n`);
  const r = runL3({ project: proj, cache });
  assert.equal(r.checks.find((c) => c.id === "adoption").status, "WARN");
  assert.equal(r.status, "PASS_WITH_WARNINGS");
});

test("L3 product tests: a declared command runs for real, and a failing one fails the gate", () => {
  const proj = consumer();
  const calls = [];
  const fake = (platformRoot, status) => ({ platformRoot, run: (cmd) => (calls.push(cmd), { status }) });
  const platformRoot = tmp();
  mkdirSync(join(platformRoot, "profiles"), { recursive: true });
  writeFileSync(join(platformRoot, "profiles", "factory.json"), JSON.stringify({ productTestCommand: "npm test" }));
  assert.equal(runL3({ project: proj, cache, ...fake(platformRoot, 0) }).checks.find((c) => c.id === "product").status, "PASS");
  assert.equal(runL3({ project: proj, cache, ...fake(platformRoot, 1) }).status, "FAIL");
  assert.deepEqual(calls, ["npm test", "npm test"]);
});

test("the CLI exits non-zero on FAIL and prints a status line", () => {
  const empty = tmp();
  git(empty, "init", "-q", "-b", "main");
  const r = node([join(repoRoot, "runtime", "consumer", "l3.mjs"), "--project", empty, "--cache", cache]);
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /FAIL/);
});

test("a PR gate fails closed when no base can be resolved (requireBase): circuit and p45 FAIL, never NOT_APPLICABLE", () => {
  const proj = consumer();
  const open = runL3({ project: proj, cache });
  assert.deepEqual(ids(open, "FAIL"), [], "without requireBase a missing base is NOT_APPLICABLE (local use)");
  const closed = runL3({ project: proj, cache, requireBase: true });
  assert.equal(closed.status, "FAIL");
  assert.deepEqual(ids(closed, "FAIL").sort(), ["circuit", "p45"]);
  const bad = runL3({ project: proj, cache, base: "refs/heads/does-not-exist", requireBase: true });
  assert.ok(ids(bad, "FAIL").includes("circuit"), "an unresolvable base is a FAIL too");
});

test("the real product-test path runs through the shell (no fake runner)", () => {
  const proj = consumer();
  const platformRoot = tmp();
  mkdirSync(join(platformRoot, "profiles"), { recursive: true });
  writeFileSync(join(platformRoot, "profiles", "factory.json"), JSON.stringify({ productTestCommand: `"${process.execPath}" -e "process.exit(0)"` }));
  assert.equal(runL3({ project: proj, cache, platformRoot }).checks.find((c) => c.id === "product").status, "PASS");
  writeFileSync(join(platformRoot, "profiles", "factory.json"), JSON.stringify({ productTestCommand: `"${process.execPath}" -e "process.exit(3)"` }));
  const failed = runL3({ project: proj, cache, platformRoot });
  assert.equal(failed.checks.find((c) => c.id === "product").status, "FAIL");
  assert.match(failed.checks.find((c) => c.id === "product").detail, /exit 3/);
});

test("l3-consumer.yml trust root: platform repo fixed, base lock first, history check, base required (P44)", () => {
  const yml = readFileSync(join(repoRoot, ".github", "workflows", "l3-consumer.yml"), "utf8").replaceAll("\r\n", "\n");
  assert.match(yml, /git -C consumer cat-file -e "origin\/\$BASE:ai-native\.lock\.json"/, "absence of the base lock is checked explicitly");
  assert.match(yml, /platform-repo:[\s\S]*default: "jlbellonGmail\/ai-native"/);
  assert.match(yml, /this gate only runs code from/, "a lock pointing to another repo fails");
  assert.match(yml, /git -C consumer show "origin\/\$BASE:ai-native\.lock\.json"/, "the trust root is the BASE lock when it exists");
  assert.match(yml, /merge-base --is-ancestor "\$COMMIT" "origin\/\$default"/, "the platform commit must be on the default branch");
  assert.match(yml, /--require-base/);
  assert.doesNotMatch(yml, /\|\| true/, "no step may swallow a failure");
  assert.match(yml, /persist-credentials: false/);
  assert.doesNotMatch(yml, /pull_request_target/);
  assert.match(yml, /permissions:\n  contents: read/);
});

test("the product-test profile comes from the BASE lock: a PR cannot switch to a profile without a command", () => {
  const proj = consumer(); // base lock: profile "factory"
  const base = git(proj, "rev-parse", "HEAD");
  const platformRoot = tmp();
  mkdirSync(join(platformRoot, "profiles"), { recursive: true });
  writeFileSync(join(platformRoot, "profiles", "factory.json"), JSON.stringify({ productTestCommand: `"${process.execPath}" -e "process.exit(5)"` }));
  writeFileSync(join(platformRoot, "profiles", "static-site.json"), JSON.stringify({ productTestCommand: null }));
  const lock = JSON.parse(readFileSync(join(proj, "ai-native.lock.json"), "utf8"));
  lock.profiles = ["static-site"];
  writeFileSync(join(proj, "ai-native.lock.json"), JSON.stringify(lock, null, 2));
  git(proj, "commit", "-qam", "switch profile");
  const r = runL3({ project: proj, cache, base, platformRoot });
  assert.equal(r.checks.find((c) => c.id === "product").status, "FAIL", "judged by the base profile (factory), whose command fails");
  assert.match(r.checks.find((c) => c.id === "product").detail, /exit 5/);
});

test("L3 product tests: the profile's productSetupCommand runs first; a failing setup fails closed and the tests do not run", () => {
  const proj = consumer();
  const platformRoot = tmp();
  mkdirSync(join(platformRoot, "profiles"), { recursive: true });
  const marker = join(proj, "setup-ran.txt");
  const node = `"${process.execPath}"`;
  const setup = `${node} -e "require('fs').writeFileSync(process.argv[1],'x')" "${marker.replaceAll("\\", "/")}"`;
  writeFileSync(join(platformRoot, "profiles", "factory.json"), JSON.stringify({ productSetupCommand: setup, productTestCommand: `${node} -e "process.exit(require('fs').existsSync(process.argv[1])?0:9)" "${marker.replaceAll("\\", "/")}"` }));
  const ok = runL3({ project: proj, cache, platformRoot }).checks.find((c) => c.id === "product");
  assert.equal(ok.status, "PASS", "the tests only pass if the setup ran before them");
  writeFileSync(join(platformRoot, "profiles", "factory.json"), JSON.stringify({ productSetupCommand: `${node} -e "process.exit(4)"`, productTestCommand: `${node} -e "process.exit(0)"` }));
  const bad = runL3({ project: proj, cache, platformRoot }).checks.find((c) => c.id === "product");
  assert.equal(bad.status, "FAIL");
  assert.match(bad.detail, /setup .* exit 4.*tests not run/);
});

test("python profiles declare a setup command and l3-consumer.yml sets up a pinned Python (clean-runner product tests)", () => {
  for (const id of ["python-lib", "python-service"]) {
    const p = JSON.parse(readFileSync(join(repoRoot, "profiles", `${id}.json`), "utf8"));
    assert.equal(p.productTestCommand, "pytest -q");
    assert.match(p.productSetupCommand, /pip install/);
  }
  const yml = readFileSync(join(repoRoot, ".github", "workflows", "l3-consumer.yml"), "utf8").replaceAll("\r\n", "\n");
  assert.match(yml, /uses: actions\/setup-python@[0-9a-f]{40} # v/);
  assert.ok(yml.indexOf("Set up Python") < yml.indexOf("name: L3 consumer gate"), "Python is set up before the gate runs");
});

test("gap 2: python profiles for app/service, scripts-only and package root: only the package-root profile installs `.`; none needs a placeholder package", () => {
  const read = (id) => JSON.parse(readFileSync(join(repoRoot, "profiles", `${id}.json`), "utf8"));
  for (const id of ["python-lib", "python-service", "python-app", "python-scripts"]) assert.equal(read(id).productTestCommand, "pytest -q", id);
  for (const id of ["python-app", "python-scripts"]) {
    assert.doesNotMatch(read(id).productSetupCommand, /pip install\s+(--quiet\s+)?\./, `${id} must not assume an installable root package`);
    assert.match(read(id).productSetupCommand, /-r requirements-dev\.txt/, id);
  }
  assert.match(read("python-app").productSetupCommand, /-r requirements\.txt/);
  assert.doesNotMatch(read("python-scripts").productSetupCommand, /-r requirements\.txt/);
  assert.match(read("python-lib").productSetupCommand, /pip install --quiet \./);
});

test("gap 2: monorepo/subdir: setup and tests run in the lock's productDir; traversal, absolute paths and a missing dir fail closed", () => {
  const platformRoot = tmp();
  mkdirSync(join(platformRoot, "profiles"), { recursive: true });
  const nodeBin = `"${process.execPath}"`;
  const proj = consumer();
  put(proj, "services/api/marker.txt", "here\n");
  writeFileSync(join(platformRoot, "profiles", "factory.json"), JSON.stringify({ productTestCommand: `${nodeBin} -e "process.exit(require('fs').existsSync('marker.txt')?0:9)"` }));
  const setDir = (dir) => {
    const lock = JSON.parse(readFileSync(join(proj, "ai-native.lock.json"), "utf8"));
    if (dir === undefined) delete lock.productDir; else lock.productDir = dir;
    writeFileSync(join(proj, "ai-native.lock.json"), JSON.stringify(lock, null, 2));
    git(proj, "commit", "-qam", `productDir ${dir}`);
    return runL3({ project: proj, cache, platformRoot });
  };
  const product = (r) => r.checks.find((c) => c.id === "product");
  assert.equal(product(setDir(undefined)).status, "FAIL", "root has no marker.txt");
  assert.equal(product(setDir("services/api")).status, "PASS");
  // an invalid dir is stopped by the lock check (schema) or, failing that, by the product step itself: never run
  for (const bad of ["../x", "/etc", "services/nope"]) {
    const r = setDir(bad);
    assert.equal(r.status, "FAIL", bad);
    assert.notEqual(product(r)?.status, "PASS", bad);
  }
});

test("gap 6: the lock schema accepts productDir only as a safe relative path", async () => {
  const { validate } = await import("../lib/schema-lite.mjs");
  const schema = JSON.parse(readFileSync(join(repoRoot, "contracts", "lock.schema.json"), "utf8"));
  const lock = JSON.parse(readFileSync(join(repoRoot, "evaluation", "fixtures", "migrate", "lock-sample.json"), "utf8"));
  assert.deepEqual(validate({ ...lock }, schema), []);
  assert.deepEqual(validate({ ...lock, productDir: "services/api" }, schema), []);
  for (const bad of ["../x", "/abs", "a/../b/", "C:/x", ""]) assert.notDeepEqual(validate({ ...lock, productDir: bad }, schema), [], bad);
});

test("gap 2 (productDir at run time): a non-string, traversing, absolute or missing productDir fails closed and runs nothing; a valid one runs there", async () => {
  const { productTests } = await import("./l3.mjs");
  const platformRoot = tmp();
  mkdirSync(join(platformRoot, "profiles"), { recursive: true });
  const nodeBin = `"${process.execPath}"`;
  writeFileSync(join(platformRoot, "profiles", "factory.json"), JSON.stringify({ productTestCommand: `${nodeBin} -e "process.exit(require('fs').existsSync('marker.txt')?0:9)"` }));
  const project = tmp();
  put(project, "sub/marker.txt", "x\n");
  const ran = [];
  const run = (cmd, opts) => { ran.push(opts.cwd); return spawnSync(cmd, { ...opts, shell: true }); };
  const go = (productDir) => productTests({ project, lock: { profiles: ["factory"], productDir }, platformRoot, run });
  for (const bad of [42, null, ["sub"], "../x", "/etc", "C:/x", "sub/../../x", "nope"]) {
    assert.equal(go(bad).status, "FAIL", JSON.stringify(bad));
  }
  assert.deepEqual(ran, [], "nothing was executed for an invalid productDir");
  assert.equal(go("sub").status, "PASS");
  assert.equal(ran.length, 1);
  assert.equal(go(undefined).status, "FAIL", "root has no marker.txt");
});
