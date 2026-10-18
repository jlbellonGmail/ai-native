// Start a Work Unit: worktree + branch + run dir (+ manifest for
// Milestone) (M3.2, CIR-02; PAR-IDEMPOTENCY). Ported from TEMPLATE
// v2.0.5's start-work-unit.ps1, with claim detection replaced by the
// atomic registry in runtime/circuit/claims.mjs instead of an
// unlocked worktree/branch scan (PAR-PARALLEL-UNITS). Does not assume a
// hardcoded integration branch name ("develop" in TEMPLATE v2.0.5); the
// caller supplies `baseBranch` (ai-native's own factory profile uses
// "main", see profiles/factory.json#gitModel) and is expected to have
// already run runtime/lib/preflight.mjs against it -- this module does
// not duplicate that check.
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { assertValidSlug, getWorkUnitInfo, getItemState } from "./identity.mjs";
import { claimItems, releaseClaim } from "./claims.mjs";

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${(result.stderr || "").trim()}`);
  }
  return result.stdout.trim();
}

/**
 * Creates the worktree/branch/run-dir (+ manifest for Milestone) for a
 * new Work Unit, after validating every item is Pending in ROADMAP.md
 * and atomically claiming them (claims.mjs). Throws without creating
 * anything if any precondition fails -- a rejected start never leaves a
 * half-created worktree behind.
 */
export function startWorkUnit(root, { mode, slug, items = [], version = "", baseBranch = "HEAD", worktreesRoot = join(dirname(root), "worktrees") }) {
  assertValidSlug(mode, slug);
  const itemSlugs = mode === "Milestone" ? [...items] : [slug];
  if (mode === "Milestone" && itemSlugs.length === 0) {
    throw new Error("-Items is required in Mode=Milestone");
  }
  if (mode !== "Milestone" && items.length > 0) {
    throw new Error("items does not apply in Mode=Feature/Maintenance: the slug IS the only item");
  }
  const duplicates = [...new Set(itemSlugs.filter((item, i) => itemSlugs.indexOf(item) !== i))];
  if (duplicates.length > 0) {
    throw new Error(`duplicate items: ${duplicates.join(", ")}`);
  }

  if (mode !== "Maintenance") {
    const roadmap = readFileSync(join(root, "ROADMAP.md"), "utf8");
    for (const item of itemSlugs) {
      const state = getItemState(roadmap, item);
      if (state === "Missing") throw new Error(`item '${item}' does not exist in ROADMAP.md`);
      if (state === "Ambiguous") throw new Error(`item '${item}' appears more than once in ROADMAP.md`);
      if (state !== "Pending") throw new Error(`item '${item}' is not pending in ROADMAP.md (current state: ${state})`);
    }
  }

  const info = getWorkUnitInfo(mode, slug, { version });
  const worktreeName = (version ? `${version}-${slug}` : slug).replace(/-+$/, "");
  const worktreeDir = join(worktreesRoot, worktreeName);
  if (existsSync(worktreeDir)) {
    throw new Error(`a worktree directory already exists for '${slug}': ${worktreeDir}`);
  }

  // Atomic claim (PAR-PARALLEL-UNITS / PAR-IDEMPOTENCY): if this throws,
  // nothing below runs, so a race never leaves two worktrees claiming
  // the same ROADMAP.md item.
  claimItems(root, info.branch, info.branch, itemSlugs);
  try {
    git(root, ["worktree", "add", "-b", info.branch, worktreeDir, baseBranch]);
  } catch (error) {
    releaseClaim(root, info.branch);
    throw error;
  }

  if (mode === "Milestone") {
    const runDir = join(worktreeDir, info.runDir);
    mkdirSync(runDir, { recursive: true });
    const manifest = { schemaVersion: 1, mode: "milestone", slug, items: itemSlugs };
    writeFileSync(join(worktreeDir, info.manifestPath), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  } else {
    mkdirSync(join(worktreeDir, info.runDir), { recursive: true });
  }

  return { ...info, worktreeDir, items: itemSlugs };
}
