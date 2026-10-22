// F-17/F-19 (v3.1.1): a consumer reaches the release only through the projected launcher `.ai-native/ai-native.mjs`.
// Every command line the projected commands tell an agent to run is executed here against a real synced cache, so a
// command that depends on a private or non-existent path fails this test.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { applyConsumer, consumerFiles, LAUNCHER_PATH } from "./consumer.mjs";
import { detectDrift } from "../migrate/upgrade-delta.mjs";
import { writeTar } from "../bootstrap/tar.mjs";
import { sha256, releaseDir } from "../bootstrap/cache.mjs";
import { sync } from "../bootstrap/install.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PREFIXES = ["runtime", "contracts", "core", "mcp", "profiles", "audit", ".agents/skills", "knowledge/sdd"];
const TOOLS = ["claude", "opencode", "codex"];
const made = [];
const tmp = (p) => {
  made.push(mkdtempSync(join(tmpdir(), `launcher-${p}-`)));
  return made.at(-1);
};
after(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })));

function walk(dir, out = {}) {
  for (const name of readdirSync(join(REPO, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(REPO, rel)).isDirectory()) {
      if (name !== "node_modules" && name !== ".git") walk(rel, out);
    } else if (!name.endsWith(".test.mjs")) out[rel] = readFileSync(join(REPO, rel));
  }
  return out;
}

const git = (cwd, ...args) => {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};

let cache;
let digest;
let bundleFile;
before(() => {
  const files = { "platform.json": JSON.stringify({ schemaVersion: 1, version: "v3.1.1", commit: "c".repeat(40), digest: `sha256:${"0".repeat(64)}`, generatedAt: "2026-10-11T00:00:00Z", components: {}, capabilities: [] }) };
  for (const prefix of PREFIXES) Object.assign(files, walk(prefix));
  const bytes = writeTar(files);
  digest = `sha256:${sha256(bytes)}`;
  cache = tmp("cache");
  bundleFile = join(tmp("bundle"), "bundle.tar.gz");
  writeFileSync(bundleFile, bytes);
});

const SPEC = "# Descuentos\n\n- RF-1. THE SYSTEM SHALL apply 10% to gold customers.\n- RF-2. THE SYSTEM SHALL reject a negative subtotal.\n";
const TASKS = "- [ ] **T1. Gold discount.** RF-1\n  - Done when: node --test passes.\n- [ ] **T2. Negative subtotal.** RF-2\n  - Done when: node --test passes.\n";

/** A git project pinned to the bundle, synced, with the projections applied and committed as the base. */
function consumer({ allowNone = false } = {}) {
  const dir = tmp("proj");
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.email", "t@t");
  git(dir, "config", "user.name", "t");
  const lock = { schemaVersion: 1, platform: { repo: "github:o/ai-native", version: "v3.1.1", commit: "c".repeat(40), digest }, profiles: ["python-scripts"] };
  if (allowNone) lock.governance = { allowNone: true };
  writeFileSync(join(dir, "ai-native.lock.json"), JSON.stringify(lock));
  const synced = sync({ projectRoot: dir, cacheRoot: cache, fromFile: bundleFile });
  assert.equal(synced.status, "PASS", synced.errors?.join("; "));
  assert.equal(applyConsumer({ releaseRoot: releaseDir(cache, digest), projectRoot: dir, tools: TOOLS }).status, "APPLIED");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base");
  return dir;
}

const run = (dir, ...args) => spawnSync(process.execPath, [join(dir, LAUNCHER_PATH), ...args], { cwd: dir, encoding: "utf8", env: { ...process.env, AI_NATIVE_CACHE: cache } });

function addFeature(dir, { slug = "001-demo", tasks = TASKS, body = SPEC } = {}) {
  mkdirSync(join(dir, "specs", slug), { recursive: true });
  writeFileSync(join(dir, "specs", slug, "spec.md"), body);
  writeFileSync(join(dir, "specs", slug, "plan.md"), "# Plan\n\nPure function in src/domain.\n");
  writeFileSync(join(dir, "specs", slug, "tasks.md"), tasks);
}

test("the launcher is projected, deterministic, tool-independent and drift-checked", () => {
  const dir = consumer();
  const incoming = () => consumerFiles(releaseDir(cache, digest), { tools: TOOLS });
  assert.ok(Object.keys(consumerFiles(releaseDir(cache, digest), { tools: ["codex"] })).includes(LAUNCHER_PATH), "Codex-only consumers get it too");
  assert.deepEqual(detectDrift(dir, incoming()), { status: "CLEAN", edited: [], missing: [], outdated: [] });
  writeFileSync(join(dir, LAUNCHER_PATH), "process.exit(0)\n");
  assert.equal(detectDrift(dir, incoming()).status, "DRIFT");
});

test("F-17 no projected command depends on a private release path, and every `node` call goes through the launcher", () => {
  const files = consumerFiles(releaseDir(cache, digest), { tools: ["claude", "opencode"] });
  const commands = Object.entries(files).filter(([p]) => /\/commands\/.+\.md$/.test(p));
  assert.ok(commands.length >= 11);
  for (const [path, content] of commands) {
    const text = content.toString().split("\n").filter((l) => !l.startsWith("<!-- GENERATED")).join("\n"); // the GENERATED marker is a label, not an instruction
    assert.doesNotMatch(text, /(?<![\w.-])(runtime|contracts|core|governance)\/[\w./-]+/, `${path} names a path that does not exist in a consumer`);
    for (const m of text.matchAll(/\bnode\s+(\S+)/g)) assert.equal(m[1], LAUNCHER_PATH, `${path}: node call outside the launcher (${m[0]})`);
  }
  for (const [path, content] of Object.entries(files).filter(([p]) => /SKILL\.md$|\/(agents|roles)\//.test(p))) {
    for (const m of content.toString().matchAll(/\bnode\s+(?!\.ai-native\/)(\S+)/g)) assert.fail(`${path}: node call outside the launcher (${m[0]})`);
  }
});

test("F-17 every command line the projected commands give an agent actually runs from a consumer", () => {
  const dir = consumer();
  addFeature(dir);
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "feature");
  const base = git(dir, "rev-list", "--max-parents=0", "HEAD");
  const calls = new Set();
  for (const [, content] of Object.entries(consumerFiles(releaseDir(cache, digest), { tools: ["claude"] })).filter(([p]) => /commands\/.+\.md$/.test(p))) {
    for (const m of content.toString().matchAll(/`node \.ai-native\/ai-native\.mjs ([^`]+)`/g)) calls.add(m[1]);
  }
  assert.ok(calls.size >= 7, [...calls].join("\n"));
  assert.ok(["sdd review begin", "sdd review record", "sdd review status"].every((c) => [...calls].some((call) => call.startsWith(c))), "the review loop is reachable from the commands");
  // a choice `a|b` takes its first option; the nonce is the one the preceding `review begin` printed
  let nonce = "<nonce>";
  for (const call of calls) {
    const argv = call.replace("done|blocked", "done").replaceAll("<NNN-slug>", "001-demo").replaceAll("<Tn>", "T1").replaceAll("<base-ref>", base).replaceAll("<level>", "normal")
      .replaceAll("<nonce>", nonce).replaceAll("<verdict>", "APPROVED").replaceAll("<runtime>", "claude").replaceAll("<n>", "0").replace(/\b([\w-]+)\|[\w|-]+/g, "$1")
      .replaceAll('"<test-command>"', "<test-command>").split(/\s+/).filter(Boolean).map((a) => (a === "<test-command>" ? "git --version" : a));
    const r = run(dir, ...argv);
    // fail-closed by design: no reviewer ran here, so the runtime left no evidence and an independent record is refused
    if (call.includes("--kind independent")) {
      assert.equal(r.status, 1, `${call} must be refused without runtime evidence`);
      assert.match(r.stderr, /not an independent review: no runtime receipt/);
      continue;
    }
    assert.equal(r.status, 0, `${call} -> exit ${r.status}\n${r.stdout}\n${r.stderr}`);
    nonce = /REVIEW_NONCE: (\w+)/.exec(r.stdout)?.[1] ?? nonce;
  }
});

test("F-17 sdd commands: validate reports duplicate ids with a line, next/mark drive tasks, bad input is rejected", () => {
  const dir = consumer();
  addFeature(dir, { tasks: "- [ ] **T1. a.** RF-1\n  - Done when: ok.\n- [ ] **T1. b.** RF-2\n  - Done when: ok.\n" });
  const bad = run(dir, "sdd", "validate", "001-demo");
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /tasks\.md:3: duplicate task id T1/);
  addFeature(dir);
  assert.equal(run(dir, "sdd", "validate", "001-demo").status, 0);
  assert.match(run(dir, "sdd", "next", "001-demo").stdout, /^T1\. Gold discount\r?\nDone when: node --test passes\./);
  assert.equal(run(dir, "sdd", "mark", "001-demo", "T1", "done").status, 0);
  assert.match(run(dir, "sdd", "next", "001-demo").stdout, /^T2\./);
  assert.match(run(dir, "sdd", "status", "001-demo").stdout, /PROGRESS: 1\/2 tasks/);
  assert.equal(run(dir, "sdd", "mark", "001-demo", "T9", "done").status, 1);
  assert.equal(run(dir, "sdd", "validate", "../x").status, 1);
  assert.equal(run(dir, "sdd", "validate", "001-demo", "--level", "huge").status, 1);
  assert.match(run(dir, "sdd", "budget", "--level", "light").stdout, /light \(LIGHT\): \d+ attempts/);
});

test("the launcher fails closed: no lock, or a release that is not in the cache", () => {
  assert.equal(run(tmp("empty"), "sdd", "budget").status, 1);
  const dir = consumer();
  const r = spawnSync(process.execPath, [join(dir, LAUNCHER_PATH), "sdd", "budget"], { cwd: dir, encoding: "utf8", env: { ...process.env, AI_NATIVE_CACHE: tmp("other-cache") } });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /not in the cache/);
});

// --- F-19: `none` is a published, explicit opt-in ---------------------------------------------------------------

function unit(dir, { gate = "none", paths = { "docs/note.md": "note\n" } } = {}) {
  mkdirSync(join(dir, "specs", "002-unit"), { recursive: true });
  writeFileSync(join(dir, "specs", "002-unit", "spec.md"), `# Unit\n\nhuman_gate: ${gate}\nautonomy: full\n`);
  for (const [p, c] of Object.entries(paths)) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), c);
  }
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "unit");
}
const gate = (dir, ...extra) => run(dir, "hitl", "--base", "HEAD~1", ...extra);

test("F-19 default: `none` is refused when the repository did not opt in", () => {
  const dir = consumer();
  unit(dir);
  const r = gate(dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /risk low, human_gate required \(human_gate none is not allowed by this repository's policy/);
});

test("F-19 published opt-in (lock governance.allowNone): low risk -> none; high risk, control plane and release still force required", () => {
  const dir = consumer({ allowNone: true });
  unit(dir);
  assert.match(gate(dir).stdout, /^PASS specs\/002-unit\/spec\.md: risk low, human_gate none/);
  assert.match(gate(dir, "--environment", "release").stdout, /risk low, human_gate required \(release keeps the human gate required/);
  assert.match(gate(dir, "--environment", "production").stdout, /human_gate required/);

  const high = consumer({ allowNone: true });
  unit(high, { paths: { "migrations/001.sql": "DROP TABLE users;\n", "src/payments/charge.js": "export const c = 1;\n", ".env.example": "KEY=1\n" } });
  const h = gate(high);
  assert.equal(h.status, 1);
  assert.match(h.stdout, /risk high, human_gate required \(human_gate none is not allowed for high risk/);

  const cp = consumer({ allowNone: true });
  unit(cp, { paths: { ".github/workflows/ci.yml": "name: ci\n" } });
  const c = gate(cp);
  assert.equal(c.status, 1);
  assert.match(c.stdout, /human_gate required/);
});

test("F-19 a PR cannot grant itself `none`: the policy is read from the lock on the BASE ref", () => {
  const dir = consumer();
  const lockPath = join(dir, "ai-native.lock.json");
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  lock.governance = { allowNone: true };
  writeFileSync(lockPath, JSON.stringify(lock));
  unit(dir);
  const r = gate(dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /human_gate none is not allowed by this repository's policy/);
});

test("F-19 hitl judges the real change: uncommitted and new files count, so unfinished work cannot get a lighter gate", () => {
  const dir = consumer({ allowNone: true });
  unit(dir);
  assert.match(gate(dir).stdout, /risk low, human_gate none/);
  // same committed state, but an uncommitted migration and a new untracked secret file are in the working tree
  mkdirSync(join(dir, "migrations"), { recursive: true });
  writeFileSync(join(dir, "migrations", "009.sql"), "DROP TABLE users;\n");
  writeFileSync(join(dir, ".env.production"), "KEY=1\n");
  const r = gate(dir);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /risk high, human_gate required \(human_gate none is not allowed for high risk/);
  // an empty diff against HEAD cannot be assessed: never `none`
  const empty = consumer({ allowNone: true });
  assert.match(run(empty, "hitl", "--base", "HEAD").stdout, /human_gate final-only/);
});

test("F-20 sdd mark never follows a symlink planted at the temp path, and leaves no temp files behind", async () => {
  const { symlinkSync, existsSync, readdirSync: ls } = await import("node:fs");
  const dir = consumer();
  addFeature(dir);
  const outside = join(tmp("outside"), "victim.txt");
  writeFileSync(outside, "untouched\n");
  const tasksPath = join(dir, "specs", "001-demo", "tasks.md");
  // works without symlink permission: the old fixed temp name must not be used at all
  const legacyTmp = join(dir, "specs", "001-demo", "tasks.md.tmp");
  writeFileSync(legacyTmp, "preexisting\n");
  assert.equal(run(dir, "sdd", "mark", "001-demo", "T1", "pending").status, 0);
  assert.equal(readFileSync(legacyTmp, "utf8"), "preexisting\n");
  rmSync(legacyTmp);
  for (const name of ["tasks.md.tmp", `tasks.md.${process.pid}.tmp`]) {
    try {
      symlinkSync(outside, join(dir, "specs", "001-demo", name));
    } catch {
      return; // symlinks not permitted on this machine (Windows without developer mode): nothing to plant
    }
  }
  assert.equal(run(dir, "sdd", "mark", "001-demo", "T1", "done").status, 0);
  assert.equal(readFileSync(outside, "utf8"), "untouched\n");
  assert.match(readFileSync(tasksPath, "utf8"), /^- \[x\] \*\*T1\./);
  assert.deepEqual(ls(join(dir, "specs", "001-demo")).filter((n) => /\.tmp$/.test(n) && !/^tasks\.md\.(\d+\.)?tmp$/.test(n)), []);
  assert.ok(existsSync(outside));
});
