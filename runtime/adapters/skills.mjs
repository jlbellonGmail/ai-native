// Lazy skill materialization (M3.3, AGT-05; PAR-SKILLS-LAZY). Ported
// from TEMPLATE v2.0.5's sync-agentic-adapters.ps1 Sync-Skills, which
// unconditionally mirrored every canonical skill to every tool target.
// This module instead selects, per (profile, role, level), only the
// skills `.agents/skills/registry.json` declares applicable
// (contracts/skills-registry.schema.json) -- fewer files materialized
// per context, consistent with AGENTS.md's token-discipline principle.
//
// Known bugs in the legacy -AutoFix path this design avoids by
// construction (found reading sync-agentic-adapters.ps1, M3.3):
//   - "Skill mirror divergente" fix built `$source` by prefixing
//     `.agents/skills/` onto the already-target-relative `$relativePath`
//     (e.g. `.claude/skills/ping/SKILL.md`), producing a path under
//     `.agents/skills/.claude/skills/...` that never exists -- the `if
//     (Test-Path ...)` guard then silently did nothing.
//   - Only `.claude/skills` was ever touched; `.opencode/skills`
//     divergence was never auto-fixed even when detected.
//   - The "Falta mirror generado de skill" (missing, not divergent) and
//     "Adaptador generado obsoleto" problem strings had no case at all
//     in the Auto-Fix switch -- they fell through to a no-op default.
// None of that string-matching/re-derivation exists here: materialize()
// always writes the exact expected bytes it already computed, the same
// function check() compares against, for both targets at once.
import { readFileSync, readdirSync, existsSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { join, relative, dirname } from "node:path";

export const SKILL_TARGETS = [".claude/skills", ".opencode/skills"];
const CANONICAL_ROOT = ".agents/skills";

export function loadSkillsRegistry(root) {
  const path = join(root, CANONICAL_ROOT, "registry.json");
  if (!existsSync(path)) return { schemaVersion: 1, skills: [] };
  return JSON.parse(readFileSync(path, "utf8"));
}

function matches(declared, value) {
  return declared.includes("*") || declared.includes(value);
}

/**
 * Skill ids applicable to the given (profile, role, level). With no
 * context given (any of the three omitted), returns every registered
 * skill id -- the full set `--check`/CI validates against.
 */
export function selectSkills(registry, { profile, role, level } = {}) {
  return registry.skills
    .filter((entry) => (profile ? matches(entry.profiles, profile) : true))
    .filter((entry) => (role ? matches(entry.roles, role) : true))
    .filter((entry) => (level ? matches(entry.levels, level) : true))
    .map((entry) => entry.id);
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full));
    } else if (entry.name !== ".gitkeep" && entry.name !== "registry.json") {
      out.push(full);
    }
  }
  return out;
}

/**
 * Files (relative to .agents/skills/) belonging to `skillIds`, in
 * deterministic order.
 */
export function canonicalFilesFor(root, skillIds) {
  const canonicalRoot = join(root, CANONICAL_ROOT);
  const files = [];
  for (const id of skillIds) {
    for (const full of listFiles(join(canonicalRoot, id))) {
      files.push(relative(canonicalRoot, full).replace(/\\/g, "/"));
    }
  }
  return files.sort();
}

/**
 * Writes every selected skill's files into both SKILL_TARGETS,
 * removing target files for skills NOT selected this time (lazy: a
 * target only ever holds the current selection, not an ever-growing
 * union of every selection ever materialized).
 */
export function materialize(root, skillIds) {
  const canonicalRoot = join(root, CANONICAL_ROOT);
  const relativeFiles = canonicalFilesFor(root, skillIds);
  for (const targetRelative of SKILL_TARGETS) {
    const targetRoot = join(root, targetRelative);
    for (const existing of listFiles(targetRoot)) {
      const rel = relative(targetRoot, existing).replace(/\\/g, "/");
      if (!relativeFiles.includes(rel)) {
        rmSync(existing, { force: true });
      }
    }
    for (const rel of relativeFiles) {
      const source = join(canonicalRoot, rel);
      const target = join(targetRoot, rel);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(source, target);
    }
  }
}

/** Problems with the current on-disk mirrors vs. the expected selection
 * (missing, divergent, or an extra file outside the current selection),
 * for both targets. Empty array means the mirrors are exactly right. */
export function check(root, skillIds) {
  const canonicalRoot = join(root, CANONICAL_ROOT);
  const relativeFiles = canonicalFilesFor(root, skillIds);
  const problems = [];
  for (const targetRelative of SKILL_TARGETS) {
    const targetRoot = join(root, targetRelative);
    const expected = new Set(relativeFiles);
    for (const existing of listFiles(targetRoot)) {
      const rel = relative(targetRoot, existing).replace(/\\/g, "/");
      if (!expected.has(rel)) {
        problems.push(`unexpected (not in current selection): ${targetRelative}/${rel}`);
      }
    }
    for (const rel of relativeFiles) {
      const target = join(targetRoot, rel);
      if (!existsSync(target)) {
        problems.push(`missing: ${targetRelative}/${rel}`);
        continue;
      }
      const sourceBytes = readFileSync(join(canonicalRoot, rel));
      const targetBytes = readFileSync(target);
      if (!sourceBytes.equals(targetBytes)) {
        problems.push(`divergent: ${targetRelative}/${rel}`);
      }
    }
  }
  return problems;
}
