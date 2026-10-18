// `unit ready` (M3.2, CIR-15; PAR-READY). Validates the evidence
// contract and required reviews for a Work Unit's current depth, then
// produces the ROADMAP.md mutation that marks its item(s) done -- in v3
// this straight `[ ]` -> `[x]` edit (contracts/roadmap.md,
// PAR-CLOSURE-BY-MERGE) IS what "ready for PR" means: there is no
// separate `[-]` step and no later close-feature.ps1-equivalent mutation
// after merge. The caller commits this content as part of the same PR
// that implements the unit.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getEvidenceContract, checkRequiredArtifacts, checkSummaryContract } from "./contract.mjs";
import { getLatestVerdict } from "./review-run.mjs";
import { markItemsDone } from "./identity.mjs";

export class NotReadyError extends Error {}

/**
 * Throws NotReadyError listing every unmet condition (not just the
 * first) when `runDir`/`events` do not yet satisfy `depth`'s evidence
 * contract: required artifacts present and non-empty, SUMMARY.md's
 * section/field contract, and every requiredReviews stage's latest
 * verdict approved.
 */
export function assertEvidenceReady(runDir, depth, events = []) {
  const problems = [];
  const contract = getEvidenceContract(depth);

  const artifacts = checkRequiredArtifacts(runDir, depth);
  if (!artifacts.ok) {
    problems.push(`missing required artifact(s): ${artifacts.missing.join(", ")}`);
  }

  const summaryPath = join(runDir, "SUMMARY.md");
  try {
    const summary = checkSummaryContract(readFileSync(summaryPath, "utf8"), depth);
    if (!summary.ok) {
      const parts = [...summary.missingSections.map((s) => `section '${s}'`), ...summary.missingFields.map((f) => `field '${f}'`)];
      problems.push(`SUMMARY.md incomplete: missing ${parts.join(", ")}`);
    }
  } catch {
    // Already reported via checkRequiredArtifacts (SUMMARY.md is always
    // required); avoid a duplicate ENOENT-flavoured message here.
  }

  for (const stage of contract.requiredReviews) {
    const verdict = getLatestVerdict(events, stage);
    if (!verdict || verdict.verdict !== "approved") {
      problems.push(`required review '${stage}' is not approved (latest: ${verdict ? verdict.verdict : "none"})`);
    }
  }

  if (problems.length > 0) {
    throw new NotReadyError(problems.join("; "));
  }
}

/**
 * Pure: returns ROADMAP.md content with `items` marked `[x]`. Throws
 * (via identity.mjs#markItemsDone) instead of partially editing if any
 * item is not Pending. Does not call assertEvidenceReady itself -- the
 * caller runs both and decides ordering/error aggregation.
 */
export function markReadyForPr(roadmapContent, items) {
  return markItemsDone(roadmapContent, items);
}
