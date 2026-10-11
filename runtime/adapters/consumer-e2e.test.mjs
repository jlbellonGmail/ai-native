import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyConsumer, consumerFiles } from "./consumer.mjs";
import { detectDrift, applyUpgrade, planUpgrade } from "../migrate/upgrade-delta.mjs";
import { loadWorkflow } from "../circuit/sdd-workflow.mjs";

const RELEASE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TOOLS = ["claude", "opencode", "codex"];

const made = [];
after(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })));

function consumer() {
  const root = mkdtempSync(join(tmpdir(), "consumer-e2e-"));
  made.push(root);
  assert.equal(applyConsumer({ releaseRoot: RELEASE, projectRoot: root, tools: TOOLS }).status, "APPLIED");
  return root;
}
const incoming = () => consumerFiles(RELEASE, { tools: TOOLS });

test("a fresh consumer resolves every SDD command, the sdd skill and the roles from the release, with no drift", () => {
  const root = consumer();
  const names = loadWorkflow().commands.map((c) => c.name);
  for (const tool of [".claude", ".opencode"]) {
    assert.deepEqual(readdirSync(join(root, tool, "commands")).map((f) => f.replace(/\.md$/, "")).sort(), [...names].sort());
  }
  assert.ok(existsSync(join(root, ".claude/skills/sdd/SKILL.md")));
  assert.ok(existsSync(join(root, ".opencode/skills/sdd/SKILL.md")));
  for (const role of ["planner", "builder", "reviewer"]) assert.ok(existsSync(join(root, ".claude/agents", `${role}.md`)), role);
  assert.deepEqual(detectDrift(root, incoming()), { status: "CLEAN", edited: [], missing: [], outdated: [] });
});

test("Codex has no per-project command surface: it is reached through AGENTS.md routing, nothing is projected for it", () => {
  const files = Object.keys(consumerFiles(RELEASE, { tools: ["codex"] }));
  assert.ok(files.every((p) => p.startsWith(".codex/")), files.join(", "));
  assert.ok(!files.some((p) => /commands\//.test(p)));
});

test("hand-editing or deleting a projection is reported as drift; the canonical source stays in the release", () => {
  const root = consumer();
  writeFileSync(join(root, ".claude/commands/feature.md"), "my own feature command\n");
  rmSync(join(root, ".opencode/commands/sdd-plan.md"));
  const drift = detectDrift(root, incoming());
  assert.equal(drift.status, "DRIFT");
  assert.deepEqual(drift.edited, [".claude/commands/feature.md"]);
  assert.deepEqual(drift.missing, [".opencode/commands/sdd-plan.md"]);
  // local override precedence: an upgrade never overwrites the edited projection
  applyUpgrade(root, incoming());
  assert.equal(readFileSync(join(root, ".claude/commands/feature.md"), "utf8"), "my own feature command\n");
});

test("a newer release is OUTDATED (not DRIFT) and a delta upgrade regenerates only what changed", () => {
  const root = consumer();
  const next = { ...incoming(), ".claude/commands/feature.md": "new canonical body\n" };
  const drift = detectDrift(root, next);
  assert.equal(drift.status, "OUTDATED");
  assert.deepEqual(drift.outdated, [".claude/commands/feature.md"]);
  assert.equal(planUpgrade(root, next).summary.update, 1);
  applyUpgrade(root, next);
  assert.equal(detectDrift(root, next).status, "CLEAN");
});

test("every pointer in the project template AGENTS.md resolves: local path, or `ai-native run -- knowledge <ref>` shipped in the release", async () => {
  const { resolveKnowledge } = await import("../consumer/knowledge.mjs");
  const agents = readFileSync(join(RELEASE, "template/templates/project/AGENTS.md"), "utf8");
  const centralRefs = [...agents.matchAll(/ai-native run -- knowledge ([A-Za-z0-9_./-]+)/g)].map((m) => m[1]);
  assert.ok(centralRefs.length > 0, "the router points at central knowledge");
  for (const ref of centralRefs) assert.equal(resolveKnowledge({ releaseRoot: RELEASE, ref }).status, "OK", ref);
  // any other repo-relative file the router names must exist in the template itself (no dangling local pointer)
  const local = [...agents.matchAll(/`((?:docs|specs|\.specify|\.agents|scripts|testing)\/[A-Za-z0-9_./-]+\.[a-z]+)`/g)].map((m) => m[1]);
  const dangling = local.filter((r) => !existsSync(join(RELEASE, "template/templates/project", r)));
  assert.deepEqual(dangling, []);
});

test("--drift is read-only and refuses to be combined with --upgrade", async () => {
  const { spawnSync } = await import("node:child_process");
  const root = consumer();
  rmSync(join(root, ".claude/commands/feature.md"));
  const run = (...a) => spawnSync(process.execPath, [join(RELEASE, "runtime/adapters/consumer.mjs"), "--project", root, ...a], { encoding: "utf8" });
  assert.notEqual(run("--drift").status, 0);
  assert.notEqual(run("--drift", "--upgrade").status, 0);
  assert.ok(!existsSync(join(root, ".claude/commands/feature.md")), "a deleted projection is reported, not resurrected");
});
