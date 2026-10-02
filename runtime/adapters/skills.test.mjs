import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSkillsRegistry, selectSkills, canonicalFilesFor, materialize, check } from "./skills.mjs";

function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), "ai-native-skills-test-"));
  const skillsRoot = join(root, ".agents", "skills");
  mkdirSync(join(skillsRoot, "alpha"), { recursive: true });
  writeFileSync(join(skillsRoot, "alpha", "SKILL.md"), "alpha content\n", "utf8");
  mkdirSync(join(skillsRoot, "beta"), { recursive: true });
  writeFileSync(join(skillsRoot, "beta", "SKILL.md"), "beta content\n", "utf8");
  writeFileSync(
    join(skillsRoot, "registry.json"),
    JSON.stringify({
      schemaVersion: 1,
      skills: [
        { id: "alpha", profiles: ["factory"], roles: ["builder"], levels: ["*"] },
        { id: "beta", profiles: ["*"], roles: ["*"], levels: ["FULL"] },
      ],
    }),
    "utf8",
  );
  return root;
}

test("loadSkillsRegistry reads a real registry.json", () => {
  const root = makeFixture();
  try {
    const registry = loadSkillsRegistry(root);
    assert.equal(registry.skills.length, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("loadSkillsRegistry returns an empty registry when the file does not exist", () => {
  const root = mkdtempSync(join(tmpdir(), "ai-native-skills-test-empty-"));
  try {
    assert.deepEqual(loadSkillsRegistry(root), { schemaVersion: 1, skills: [] });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("selectSkills with no context returns every registered skill id", () => {
  const root = makeFixture();
  try {
    const registry = loadSkillsRegistry(root);
    assert.deepEqual(selectSkills(registry).sort(), ["alpha", "beta"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("selectSkills filters by profile/role/level, honoring '*' wildcards", () => {
  const root = makeFixture();
  try {
    const registry = loadSkillsRegistry(root);
    assert.deepEqual(selectSkills(registry, { profile: "factory", role: "builder", level: "LIGHT" }), ["alpha"]);
    assert.deepEqual(selectSkills(registry, { profile: "python-lib", role: "reviewer", level: "FULL" }), ["beta"]);
    assert.deepEqual(selectSkills(registry, { profile: "python-lib", role: "reviewer", level: "LIGHT" }), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("canonicalFilesFor lists only the files for the given skills, sorted", () => {
  const root = makeFixture();
  try {
    assert.deepEqual(canonicalFilesFor(root, ["beta"]), ["beta/SKILL.md"]);
    assert.deepEqual(canonicalFilesFor(root, ["alpha", "beta"]), ["alpha/SKILL.md", "beta/SKILL.md"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("materialize copies the selected skills' files into both .claude/skills and .opencode/skills", () => {
  const root = makeFixture();
  try {
    materialize(root, ["alpha"]);
    assert.equal(readFileSync(join(root, ".claude", "skills", "alpha", "SKILL.md"), "utf8"), "alpha content\n");
    assert.equal(readFileSync(join(root, ".opencode", "skills", "alpha", "SKILL.md"), "utf8"), "alpha content\n");
    assert.equal(existsSync(join(root, ".claude", "skills", "beta")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// Regression test: TEMPLATE v2.0.5's -AutoFix only ever touched
// `.claude/skills`, never `.opencode/skills`, even though both are
// real mirror targets Sync-Skills itself checks.
test("materialize keeps both mirror targets in sync, not just .claude", () => {
  const root = makeFixture();
  try {
    materialize(root, ["alpha", "beta"]);
    for (const target of [".claude", ".opencode"]) {
      assert.equal(readFileSync(join(root, target, "skills", "beta", "SKILL.md"), "utf8"), "beta content\n");
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("materialize is lazy: re-materializing a narrower selection prunes files for skills no longer selected", () => {
  const root = makeFixture();
  try {
    materialize(root, ["alpha", "beta"]);
    assert.ok(existsSync(join(root, ".claude", "skills", "beta", "SKILL.md")));
    materialize(root, ["alpha"]);
    assert.equal(existsSync(join(root, ".claude", "skills", "beta", "SKILL.md")), false);
    assert.ok(existsSync(join(root, ".claude", "skills", "alpha", "SKILL.md")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("check() reports a missing file for both targets when nothing has been materialized yet", () => {
  const root = makeFixture();
  try {
    const problems = check(root, ["alpha"]);
    assert.equal(problems.length, 2);
    assert.ok(problems.every((p) => p.startsWith("missing: ")));
    assert.ok(problems.some((p) => p.includes(".claude/skills/alpha/SKILL.md")));
    assert.ok(problems.some((p) => p.includes(".opencode/skills/alpha/SKILL.md")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("check() passes once materialize() has run for the same selection", () => {
  const root = makeFixture();
  try {
    materialize(root, ["alpha", "beta"]);
    assert.deepEqual(check(root, ["alpha", "beta"]), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("check() flags a target file that drifted from the canonical source as divergent", () => {
  const root = makeFixture();
  try {
    materialize(root, ["alpha"]);
    writeFileSync(join(root, ".claude", "skills", "alpha", "SKILL.md"), "tampered\n", "utf8");
    const problems = check(root, ["alpha"]);
    assert.ok(problems.some((p) => p.includes("divergent") && p.includes(".claude/skills/alpha/SKILL.md")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("check() flags a file left over from a skill no longer in the current selection as unexpected", () => {
  const root = makeFixture();
  try {
    materialize(root, ["alpha", "beta"]);
    const problems = check(root, ["alpha"]);
    assert.ok(problems.some((p) => p.includes("unexpected") && p.includes("beta/SKILL.md")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
