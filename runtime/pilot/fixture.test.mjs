// M5.2: from-scratch consumer fixture, end to end, per tool, offline.
// Builds the release from this commit, bootstraps an EMPTY consumer from the
// lock alone (init -> sync --from-file -> run adapters), checks each tool's
// files, brownfield collision handling, revert, offline re-sync and doctor.
// Scope (explicit): this validates the files the platform derives for claude /
// codex / opencode STRUCTURALLY. It does not launch the three CLIs (they need
// credentials); real-tool compatibility stays C1-C4 (M2.3) and C5/C6 (PLANNED).
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const tmp = () => mkdtempSync(join(tmpdir(), "ai-native-pilot-"));
const node = (args, opts = {}) => spawnSync(process.execPath, args, { encoding: "utf8", ...opts });
const cli = join(repoRoot, "runtime", "bootstrap", "cli.mjs");

function listAll(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === ".git" ? [] : listAll(join(dir, e.name), base)) : [join(dir, e.name).slice(base.length + 1).replace(/\\/g, "/")]));
}

// One real build for the whole file (HEAD of this checkout).
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim();
const out = tmp();
const build = node([join(repoRoot, "runtime", "release", "build.mjs"), "--version", "v3.0.0-rc.1", "--out", out, "--commit", commit]);
assert.equal(build.status, 0, build.stderr);
const summary = JSON.parse(build.stdout);
const bundle = join(out, summary.bundle);
const cache = tmp();

function newConsumer() {
  const proj = tmp();
  execFileSync("git", ["init", "-q"], { cwd: proj });
  const init = node([cli, "init", "--bundle", bundle, "--repo", "github:o/ai-native", "--profile", "factory", "--channel", "rc", "--project", proj, "--cache", cache, "--json"]);
  assert.equal(init.status, 0, init.stdout + init.stderr);
  const sync = node([cli, "sync", "--from-file", bundle, "--offline", "--project", proj, "--cache", cache, "--json"]);
  assert.equal(sync.status, 0, sync.stdout + sync.stderr);
  return proj;
}
const adapters = (proj, ...args) => node([cli, "run", "--project", proj, "--cache", cache, "--", "adapters", "--json", ...args]);

test("from scratch: lock only -> sync -> adapters for all 3 tools; files are well-formed", () => {
  const proj = newConsumer();
  assert.deepEqual(listAll(proj), ["ai-native.lock.json"]);
  const r = adapters(proj);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const files = listAll(proj);
  for (const f of ["CLAUDE.md", ".mcp.json", ".codex/config.toml", ".codex/README.md", "opencode.json"]) assert.ok(files.includes(f), `missing ${f}`);
  assert.ok(files.some((f) => f.startsWith(".claude/agents/")));
  assert.ok(files.some((f) => f.startsWith(".claude/skills/") && f.endsWith("SKILL.md")));
  assert.ok(files.some((f) => f.startsWith(".opencode/skills/") && f.endsWith("SKILL.md")));
  JSON.parse(readFileSync(join(proj, ".mcp.json"), "utf8"));
  JSON.parse(readFileSync(join(proj, "opencode.json"), "utf8"));
  assert.match(readFileSync(join(proj, ".codex", "config.toml"), "utf8"), /^\s*\[|^\s*\w+\s*=/m);
  assert.match(readFileSync(join(proj, "CLAUDE.md"), "utf8"), /AGENTS\.md/);
  assert.ok(existsSync(join(proj, ".ai-native", "adoption-journal.json")));
});

for (const tool of ["claude", "codex", "opencode"]) {
  test(`matrix: only the ${tool} files are produced when --tool ${tool}`, () => {
    const proj = newConsumer();
    const r = adapters(proj, "--tool", tool);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const files = listAll(proj).filter((f) => f !== "ai-native.lock.json" && !f.startsWith(".ai-native/"));
    assert.ok(files.length > 0);
    const owns = { claude: (f) => f === "CLAUDE.md" || f === ".mcp.json" || f.startsWith(".claude/"), codex: (f) => f.startsWith(".codex/"), opencode: (f) => f === "opencode.json" || f.startsWith(".opencode/") };
    assert.deepEqual(files.filter((f) => !owns[tool](f)), [], `${tool} run produced files belonging to other tools`);
  });
}

test("brownfield: a pre-existing CLAUDE.md blocks, --skip keeps it, revert restores the pre-adoption tree", () => {
  const proj = newConsumer();
  writeFileSync(join(proj, "CLAUDE.md"), "MY OWN CLAUDE.md");
  const blocked = adapters(proj);
  assert.notEqual(blocked.status, 0);
  assert.match(blocked.stdout, /CLAUDE\.md/);
  assert.deepEqual(listAll(proj).sort(), ["CLAUDE.md", "ai-native.lock.json"]);
  const ok = adapters(proj, "--skip", "CLAUDE.md");
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.equal(readFileSync(join(proj, "CLAUDE.md"), "utf8"), "MY OWN CLAUDE.md");
  const again = adapters(proj);
  assert.notEqual(again.status, 0); // already adopted: must revert first
  const rev = adapters(proj, "--revert");
  assert.equal(rev.status, 0, rev.stdout + rev.stderr);
  assert.deepEqual(listAll(proj).sort(), ["CLAUDE.md", "ai-native.lock.json"]);
  assert.equal(readFileSync(join(proj, "CLAUDE.md"), "utf8"), "MY OWN CLAUDE.md");
});

test("offline: a second sync is served from the content-addressed cache; doctor passes; version matches the lock", () => {
  const proj = newConsumer();
  const again = node([cli, "sync", "--offline", "--project", proj, "--cache", cache, "--json"]);
  assert.equal(again.status, 0, again.stdout + again.stderr);
  const doctor = node([cli, "doctor", "--project", proj, "--cache", cache, "--json"]);
  assert.equal(doctor.status, 0, doctor.stdout);
  const version = node([cli, "run", "--project", proj, "--cache", cache, "--", "version"]);
  assert.match(version.stdout, /^v3\.0\.0-rc\.1 [0-9a-f]{40}/);
});

test("plan is read-only", () => {
  const proj = newConsumer();
  const r = adapters(proj, "--plan");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(listAll(proj), ["ai-native.lock.json"]);
  // `run` prints the release report and then its own; read the plan from the first
  const create = r.stdout.match(/"create":s*[([^]]*)]/);
  assert.ok(create && create[1].split(",").length > 5, r.stdout);
});

