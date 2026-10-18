// M3.5: tests for doc-drift.mjs (PAR-DOC-DRIFT, PAR-CANONICAL-SOURCE).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { checkDocDrift, checkCanonicalSource } from "./doc-drift.mjs";

function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), "doc-drift-"));
  const base = {
    "parity/par-tests.json": JSON.stringify({ tests: [{ id: "PAR-REAL" }] }),
    ".agents/skills/registry.json": JSON.stringify({ schemaVersion: 1, skills: [] }),
  };
  for (const [path, content] of Object.entries({ ...base, ...files })) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}
const skill = (name) => `---\nname: ${name}\ndescription: d\n---\n# t\n`;

test("doc referencing existing path, PAR id and script passes", () => {
  const root = fixture({
    "AGENTS.md": "See `core/kernel.md`, PAR-REAL and `node runtime/x.mjs`.",
    "core/kernel.md": "k",
    "runtime/x.mjs": "",
  });
  try {
    assert.deepEqual(checkDocDrift(root).errors, []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("missing path, unregistered PAR id and missing script are each flagged", () => {
  const root = fixture({ "AGENTS.md": "`core/gone.md` PAR-FAKE `node runtime/gone.mjs`" });
  try {
    const errors = checkDocDrift(root).errors;
    assert.equal(errors.length, 3);
    assert.ok(errors.some((e) => e.startsWith("DRIFT-PATH") && e.includes("core/gone.md")));
    assert.ok(errors.some((e) => e.startsWith("DRIFT-PAR") && e.includes("PAR-FAKE")));
    assert.ok(errors.some((e) => e.startsWith("DRIFT-CMD") && e.includes("runtime/gone.mjs")));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("extensionless module reference resolves to .mjs; globs and placeholders are skipped", () => {
  const root = fixture({
    "AGENTS.md": "runtime/circuit/assess and runtime/**/x and core/<name>.md",
    "runtime/circuit/assess.mjs": "",
  });
  try {
    assert.deepEqual(checkDocDrift(root).errors, []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("non-listed docs are not checked", () => {
  const root = fixture({ "docs/x.md": "core/gone.md" });
  try {
    assert.deepEqual(checkDocDrift(root).errors, []);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("registry/dir/frontmatter mismatches are flagged", () => {
  const root = fixture({
    ".agents/skills/registry.json": JSON.stringify({ schemaVersion: 1, skills: [{ id: "a" }, { id: "b" }] }),
    ".agents/skills/a/SKILL.md": skill("wrong"),
    ".agents/skills/orphan/SKILL.md": skill("orphan"),
  });
  try {
    const errors = checkCanonicalSource(root).errors;
    assert.ok(errors.some((e) => e.includes("frontmatter name is wrong")));
    assert.ok(errors.some((e) => e.includes("registry id b has no")));
    assert.ok(errors.some((e) => e.includes("orphan/ is not declared")));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("a project-*/factory-* copy of a canonical skill is flagged as duplicate", () => {
  const root = fixture({
    ".agents/skills/registry.json": JSON.stringify({ schemaVersion: 1, skills: [{ id: "recovery" }] }),
    ".agents/skills/recovery/SKILL.md": skill("recovery"),
    "template/p/.agents/skills/project-recovery/SKILL.md": skill("project-recovery"),
  });
  try {
    const errors = checkCanonicalSource(root).errors;
    assert.equal(errors.length, 1);
    assert.match(errors[0], /CANONICAL-DUPLICATE: template\/p\//);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("this repository's own docs and skills have no drift", () => {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  assert.deepEqual(checkDocDrift(repoRoot).errors, []);
  assert.deepEqual(checkCanonicalSource(repoRoot).errors, []);
});

test("DRIFT-SCRIPT: a doc that tells the reader to run a .ps1 that does not exist is drift (the v2 `bootstrap.ps1` that the node CLI replaced)", async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { execFileSync } = await import("node:child_process");
  const dir = mkdtempSync(join(tmpdir(), "ai-native-drift-"));
  mkdirSync(join(dir, "core"), { recursive: true });
  mkdirSync(join(dir, "parity"), { recursive: true });
  writeFileSync(join(dir, "parity", "par-tests.json"), JSON.stringify({ tests: [] }));
  writeFileSync(join(dir, "core", "kernel.md"), "Run `bootstrap.ps1 sync` and `scripts/real.ps1`.\n");
  mkdirSync(join(dir, "scripts"), { recursive: true });
  writeFileSync(join(dir, "scripts", "real.ps1"), "x\n");
  execFileSync("git", ["init", "-q"], { cwd: dir });
  execFileSync("git", ["add", "-A"], { cwd: dir });
  const { checkDocDrift } = await import("./doc-drift.mjs");
  const errors = checkDocDrift(dir).errors;
  assert.ok(errors.some((e) => /DRIFT-SCRIPT/.test(e) && /bootstrap\.ps1/.test(e)), errors.join("\n"));
  assert.ok(!errors.some((e) => /real\.ps1/.test(e)), "an existing script is not drift");
  rmSync(dir, { recursive: true, force: true });
});

test("the repo's own authoritative docs reference no missing .ps1 script", () => {
  assert.deepEqual(checkDocDrift(join(dirname(fileURLToPath(import.meta.url)), "..", "..")).errors.filter((e) => /DRIFT-SCRIPT/.test(e)), []);
});
