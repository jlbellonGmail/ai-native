import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, execFileSync } from "node:child_process";
import { putRelease, sha256 } from "../bootstrap/cache.mjs";
import { isShipped } from "../release/bundle.mjs";
import { checkPackage, checkReference, locateRelease, resolveKnowledge } from "./knowledge.mjs";
import { applyConsumer, consumerFiles } from "../adapters/consumer.mjs";
import { detectDrift, applyUpgrade } from "../migrate/upgrade-delta.mjs";
import { safeJoin, AdoptError } from "../migrate/adopt.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
// the tracking check asks git about the consumer: a temp dir must not resolve to an unrelated repository above the OS temp dir
process.env.GIT_CEILING_DIRECTORIES = tmpdir();
const temps = [];
const tmp = (prefix) => {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
};
after(() => temps.forEach((d) => rmSync(d, { recursive: true, force: true })));

/** The shipped surface of the working tree, installed in a temporary content-addressed cache exactly as `sync` does. */
function shippedFiles(overrides = {}) {
  const files = new Map();
  for (const rel of execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: REPO, encoding: "utf8" }).split("\n").filter(Boolean)) {
    if (isShipped(rel)) files.set(rel, readFileSync(join(REPO, rel)));
  }
  for (const [rel, content] of Object.entries(overrides)) {
    if (content === null) files.delete(rel);
    else files.set(rel, Buffer.from(content));
  }
  return files;
}

function consumerWithCache({ version = "v3.1.0", overrides } = {}) {
  const cache = tmp("kn-cache-");
  const digest = `sha256:${sha256(Buffer.from(String(Math.random())))}`;
  putRelease(cache, digest, shippedFiles(overrides));
  const project = tmp("kn-project-");
  const lock = { schemaVersion: 1, platform: { repo: "github:o/ai-native", version, commit: "a".repeat(40), digest }, profiles: ["default"] };
  writeFileSync(join(project, "ai-native.lock.json"), JSON.stringify(lock));
  return { cache, project, digest };
}

test("knowledge/sdd ships; goals and the rest of knowledge/ do not", () => {
  assert.ok(isShipped("knowledge/sdd/methodology/levels.md") && isShipped("knowledge/sdd/KNOWLEDGE.json") && isShipped("knowledge/sdd/agents-contract-detail.md"));
  assert.ok(!isShipped("knowledge/sdd/goals/GI-BATCH-UPGRADE.goal.md") && !isShipped("knowledge/datasets/x.json") && !isShipped("knowledge/benchmarks/x.md"));
});

test("a consumer resolves central knowledge through its lock and the cache, with no local copy", () => {
  const { cache, project } = consumerWithCache();
  const located = locateRelease({ projectRoot: project, cacheRoot: cache });
  assert.equal(located.status, "OK");
  const out = resolveKnowledge({ releaseRoot: located.dir, ref: "sdd/methodology/levels.md", platformVersion: located.platformVersion });
  assert.equal(out.status, "OK");
  assert.equal(out.content, readFileSync(join(REPO, "knowledge/sdd/methodology/levels.md"), "utf8"));
  assert.equal(resolveKnowledge({ releaseRoot: located.dir, ref: "sdd/agents-contract-detail.md" }).status, "OK");
  assert.equal(checkReference({ projectRoot: project, cacheRoot: cache }).status, "OK");
});

test("CLI: `ai-native knowledge` from the release prints the file; --project resolves through the lock", () => {
  const { cache, project } = consumerWithCache();
  const cli = join(REPO, "runtime/consumer/knowledge.mjs");
  const viaRun = spawnSync(process.execPath, [join(REPO, "runtime/main.mjs"), "knowledge", "sdd/methodology/levels.md"], { encoding: "utf8", cwd: project });
  assert.equal(viaRun.status, 0, viaRun.stderr);
  assert.match(viaRun.stdout, /Work units/);
  const viaLock = spawnSync(process.execPath, [cli, "--project", project, "--cache", cache, "sdd/methodology/levels.md"], { encoding: "utf8" });
  assert.equal(viaLock.status, 0, viaLock.stderr);
  assert.equal(viaLock.stdout, viaRun.stdout);
});

test("missing release, missing file and traversal are explicit", () => {
  const { cache, project } = consumerWithCache();
  const empty = tmp("kn-empty-");
  assert.equal(locateRelease({ projectRoot: project, cacheRoot: empty }).status, "MISSING_REFERENCE");
  assert.match(locateRelease({ projectRoot: project, cacheRoot: empty }).detail, /ai-native sync/);
  assert.equal(locateRelease({ projectRoot: tmp("kn-noadopt-"), cacheRoot: cache }).status, "NOT_ADOPTED");
  const { dir } = locateRelease({ projectRoot: project, cacheRoot: cache });
  assert.equal(resolveKnowledge({ releaseRoot: dir, ref: "sdd/nope.md" }).status, "MISSING_REFERENCE");
  for (const ref of ["sdd/../../etc/passwd", "../x/y.md", "/etc/passwd", "sdd/..", "sdd\\..\\x"]) {
    assert.equal(resolveKnowledge({ releaseRoot: dir, ref }).status, "MISSING_REFERENCE", ref);
  }
});

test("a tampered cache is refused, not read", () => {
  const { cache, project } = consumerWithCache();
  const { dir } = locateRelease({ projectRoot: project, cacheRoot: cache });
  writeFileSync(join(dir, "knowledge/sdd/methodology/levels.md"), "poisoned");
  assert.equal(locateRelease({ projectRoot: project, cacheRoot: cache }).status, "MISSING_REFERENCE");
});

test("incompatible versions are explicit: unsupported schema, wrong workflow contract, bad JSON, platform too old", () => {
  const meta = JSON.parse(readFileSync(join(REPO, "knowledge/sdd/KNOWLEDGE.json"), "utf8"));
  const put = (m) => ({ "knowledge/sdd/KNOWLEDGE.json": JSON.stringify(m) });
  for (const [name, overrides] of [
    ["schema", put({ ...meta, schemaVersion: 2 })],
    ["workflow", put({ ...meta, requires: { ...meta.requires, workflowContract: 9 } })],
    ["not json", { "knowledge/sdd/KNOWLEDGE.json": "{" }],
  ]) {
    const { cache, project } = consumerWithCache({ overrides });
    assert.equal(checkReference({ projectRoot: project, cacheRoot: cache }).status, "INCOMPATIBLE_VERSION", name);
  }
  const old = consumerWithCache({ version: "v3.0.2" });
  const r = checkReference({ projectRoot: old.project, cacheRoot: old.cache });
  assert.equal(r.status, "INCOMPATIBLE_VERSION");
  assert.match(r.detail, /platform >= 3\.1\.0/);
  assert.equal(checkPackage(REPO, "ghost").status, "MISSING_REFERENCE");
});

test("drift statuses: CLEAN, DRIFT, MISSING_REFERENCE, INCOMPATIBLE_VERSION; restoring the canonical bytes returns to CLEAN", () => {
  const { cache, project } = consumerWithCache();
  const tools = ["claude", "opencode"];
  const incoming = consumerFiles(REPO, { tools });
  assert.equal(applyConsumer({ releaseRoot: REPO, projectRoot: project, tools }).status, "APPLIED");
  const reference = () => checkReference({ projectRoot: project, cacheRoot: cache });
  assert.equal(detectDrift(project, incoming, { reference: reference() }).status, "CLEAN");
  const file = join(project, ".claude/commands/feature.md");
  const canonical = readFileSync(file, "utf8");
  writeFileSync(file, `${canonical}\nlocal edit\n`);
  assert.equal(detectDrift(project, incoming, { reference: reference() }).status, "DRIFT");
  // the upgrade preserves a deliberate local customization instead of overwriting it
  assert.equal(applyUpgrade(project, incoming).keepLocal[0].path, ".claude/commands/feature.md");
  writeFileSync(file, canonical);
  assert.equal(detectDrift(project, incoming, { reference: reference() }).status, "CLEAN");
  const gone = locateRelease({ projectRoot: project, cacheRoot: tmp("kn-e-") });
  assert.equal(detectDrift(project, incoming, { reference: gone }).status, "MISSING_REFERENCE");
  assert.equal(detectDrift(project, incoming, { reference: { status: "INCOMPATIBLE_VERSION", detail: "x" } }).status, "INCOMPATIBLE_VERSION");
});

test("E2E knowledge: with no local methodology copy the sdd skill points at the resolver and every phase resolves", () => {
  const { cache, project } = consumerWithCache();
  applyConsumer({ releaseRoot: REPO, projectRoot: project, tools: ["claude", "opencode"] });
  const skill = readFileSync(join(project, ".claude/skills/sdd/SKILL.md"), "utf8");
  assert.match(skill, /ai-native run -- knowledge sdd\/methodology/);
  const { dir } = locateRelease({ projectRoot: project, cacheRoot: cache });
  const phases = ["levels", "specification", "clarify", "planning", "tasks", "implementation", "validation", "review", "change-management", "modes"];
  for (const phase of phases) assert.equal(resolveKnowledge({ releaseRoot: dir, ref: `sdd/methodology/${phase}.md` }).status, "OK", phase);
});

test("E2E knowledge: capability routing reaches the consumer skill and every role, and names no provider", () => {
  const { project } = consumerWithCache();
  applyConsumer({ releaseRoot: REPO, projectRoot: project, tools: ["claude", "opencode"] });
  const skill = readFileSync(join(project, ".claude/skills/sdd/SKILL.md"), "utf8");
  const section = skill.split("## Capability routing")[1]?.split("\n## ")[0];
  assert.ok(section, "the sdd skill carries the capability routing section");
  // the policy decides when and which kind of capability, never which provider, MCP, skill or agent
  assert.doesNotMatch(section, /context7|supabase|github|figma|playwright|devtools|claude|codex|opencode|\bmcp\b|systematic-debugging|frontend-design/i);
  for (const role of ["planner", "builder", "reviewer"]) assert.match(readFileSync(join(project, `.claude/agents/${role}.md`), "utf8"), /Capability routing/, role);
});

test("safeJoin refuses a symlinked directory that points outside the project", (t) => {
  const root = tmp("kn-sym-");
  const outside = tmp("kn-out-");
  try {
    symlinkSync(outside, join(root, "link"), "junction");
  } catch {
    return t.skip("symlinks not permitted on this host");
  }
  assert.throws(() => safeJoin(root, "link/evil.md"), AdoptError);
  mkdirSync(join(root, "real"));
  assert.equal(safeJoin(root, "real/ok.md"), join(root, "real", "ok.md"));
});

test("E2E upgrade: a consumer pinned to a release without knowledge/sdd is MISSING_REFERENCE; bumping the lock + delta upgrade makes it CLEAN", () => {
  const strip = {};
  for (const rel of shippedFiles().keys()) if (rel.startsWith("knowledge/sdd/")) strip[rel] = null;
  const old = consumerWithCache({ version: "v3.0.2", overrides: strip });
  const cli = (...args) => spawnSync(process.execPath, [join(REPO, "runtime/adapters/consumer.mjs"), "--project", old.project, "--cache", old.cache, "--tool", "claude", ...args], { encoding: "utf8" });
  // first release the consumer ever sees: adopt, then the pinned (old) release cannot serve knowledge
  assert.equal(cli().status, 0);
  const before = cli("--drift");
  assert.notEqual(before.status, 0);
  assert.match(before.stdout + before.stderr, /MISSING_REFERENCE/);
  // bump the lock to a release that ships the package (a lock bump is the only routine change) and resolve again
  const fresh = consumerWithCache({ version: "v3.1.0" });
  writeFileSync(join(old.project, "ai-native.lock.json"), readFileSync(join(fresh.project, "ai-native.lock.json")));
  const after = spawnSync(process.execPath, [join(REPO, "runtime/adapters/consumer.mjs"), "--project", old.project, "--cache", fresh.cache, "--tool", "claude", "--drift", "--json"], { encoding: "utf8" });
  assert.equal(after.status, 0, after.stdout + after.stderr);
  assert.equal(JSON.parse(after.stdout).adoption.status, "CLEAN");
});

test("a directory reference and a prerelease pin are explicit, and an invalid lock is surfaced by --drift", () => {
  const { cache, project } = consumerWithCache();
  const { dir } = locateRelease({ projectRoot: project, cacheRoot: cache });
  assert.equal(resolveKnowledge({ releaseRoot: dir, ref: "sdd/methodology" }).status, "MISSING_REFERENCE");
  const rc = consumerWithCache({ version: "v3.1.0-rc.1" });
  assert.equal(checkReference({ projectRoot: rc.project, cacheRoot: rc.cache }).status, "INCOMPATIBLE_VERSION");
  applyConsumer({ releaseRoot: REPO, projectRoot: project, tools: ["claude"] });
  writeFileSync(join(project, "ai-native.lock.json"), "{ not json");
  const drift = spawnSync(process.execPath, [join(REPO, "runtime/adapters/consumer.mjs"), "--project", project, "--cache", cache, "--tool", "claude", "--drift"], { encoding: "utf8" });
  assert.notEqual(drift.status, 0);
  assert.match(drift.stdout + drift.stderr, /cannot check references/);
});
