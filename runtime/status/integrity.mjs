// STATUS/git integrity check (M3.1, PAR-INTEGRITY-IN-CI / P37). Ported
// from the STATUS/git portion of TEMPLATE v2.0.5's check-integrity.ps1:
// does a STATUS.md AUTO block (if present) still describe reality, using
// the same first-parent observedCommit tolerance as runtime/status/
// snapshot.mjs (PAR-STATUS-SELF-STALE) instead of check-integrity.ps1's
// own separate, slightly different Test-StatusOnlyHeadAdvance
// implementation -- that duplication (two different "is this range
// status-only" checks across status-lib.ps1 and check-integrity.ps1) is
// one of the defects this module removes by delegating to a single
// shared primitive (runtime/lib/git.mjs#getObservedCommit).
//
// check-integrity.ps1 also cross-checks ROADMAP.md against runs/vX.Y.Z/
// work-unit evidence (SUMMARY.md, PR/Merge trailers, reachability of the
// recorded merge SHA). That part is PAR-RUNS (STA-02, M3.2): it depends on
// the runs/ layout this repo has not built yet, and is deliberately out
// of scope here -- see checkIntegrity()'s `deferred` field, which is
// never silently dropped.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as git from "../lib/git.mjs";
import { buildSnapshot } from "./snapshot.mjs";

function readFileIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

function extractAutoBlock(content) {
  const beginCount = (content.match(/<!-- STATUS:AUTO:BEGIN -->/g) || []).length;
  const endCount = (content.match(/<!-- STATUS:AUTO:END -->/g) || []).length;
  if (beginCount !== 1 || endCount !== 1) {
    return { ok: false, block: null };
  }
  const match = content.match(/<!-- STATUS:AUTO:BEGIN -->[\s\S]*?<!-- STATUS:AUTO:END -->/);
  return { ok: true, block: match ? match[0] : null };
}

function field(block, name) {
  const match = block.match(new RegExp(`^- (?:${name}): (.*)$`, "m"));
  return match ? match[1].trim() : null;
}

/**
 * Checks that STATUS.md's AUTO block (when present) is coherent with the
 * live, derived snapshot. Returns NOT_APPLICABLE-shaped info (no
 * errors/warnings) when there is no STATUS.md at all -- a repo is not
 * required to carry one. `deferred` always lists the known-incomplete
 * parts (ROADMAP<->runs/SHA cross-check, PAR-RUNS/M3.2) so this never
 * silently claims more coverage than it has.
 */
export function checkIntegrity(root, { statusPath = "STATUS.md", ignorePaths = ["STATUS.md"] } = {}) {
  const errors = [];
  const warnings = [];
  const deferred = ["PAR-RUNS (ROADMAP.md <-> runs/vX.Y.Z/<unit>/SUMMARY.md cross-check): M3.2, not yet built in this repo"];

  const snapshot = buildSnapshot(root, { ignorePaths });
  const statusContent = readFileIfExists(join(root, statusPath));

  if (statusContent === null) {
    return { status: "NOT_APPLICABLE", errors, warnings, deferred, snapshot, statusFile: null };
  }

  const { ok, block } = extractAutoBlock(statusContent);
  if (!ok) {
    errors.push(`${statusPath}: invalid STATUS:AUTO markers (expected exactly one BEGIN and one END)`);
    return { status: "FAIL", errors, warnings, deferred, snapshot, statusFile: statusPath };
  }

  const recordedBranch = field(block, "Rama|Branch");
  const recordedHead = field(block, "HEAD");

  if (!snapshot.branch) {
    // Detached HEAD (every CI pull_request checkout, a tag, a bisect): there is no current branch to compare the
    // recorded one with, so that comparison is skipped rather than reported as a mismatch against 'null'.
    warnings.push(`${statusPath}: detached HEAD, recorded branch '${recordedBranch}' not compared`);
  } else if (recordedBranch !== null && recordedBranch !== snapshot.branch) {
    errors.push(`${statusPath}: recorded branch '${recordedBranch}' does not match actual branch '${snapshot.branch}'`);
  }

  if (recordedHead && /^[0-9a-f]{7,40}$/i.test(recordedHead) && recordedHead !== snapshot.head) {
    // Tolerated iff recordedHead sits anywhere on the first-parent chain
    // between HEAD and observedCommit (inclusive): that whole chain is,
    // by construction, nothing but STATUS.md-only commits plus
    // observedCommit itself (PAR-STATUS-SELF-STALE). Anything else is a
    // real, non-STATUS advance and must warn.
    const { observedCommit, skippedCommits } = git.getObservedCommit(root, snapshot.head, { ignorePaths });
    const toleratedChain = new Set([observedCommit, ...skippedCommits]);
    if (!toleratedChain.has(recordedHead)) {
      warnings.push(`${statusPath}: STATUS:AUTO HEAD '${recordedHead}' is stale relative to observedCommit '${observedCommit}'`);
    }
  }

  const statusOnly = {
    errors: errors.length,
    warnings: warnings.length,
  };
  const status = statusOnly.errors > 0 ? "FAIL" : statusOnly.warnings > 0 ? "PASS_WITH_WARNINGS" : "PASS";
  return { status, errors, warnings, deferred, snapshot, statusFile: statusPath };
}
