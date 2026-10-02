// Convergence (M3.2, CIR-13; PAR-CONV-SUCCESS, PAR-CONV-NO-PROGRESS,
// PAR-CONV-BUDGET-EXHAUSTED). Deterministic port of TEMPLATE v2.0.5's
// convergence.ps1: given the Reviewer's independent verdict and open
// findings, decides APPROVED / CHANGES_REQUESTED / BLOCKED /
// NEEDS_HUMAN_DECISION / FAILED_SAFELY and whether that is terminal.
// Budget comes from contracts/sdd-levels.json (LIGHT=2, STANDARD=4,
// FULL=6, PAR-CONTEXT-BUDGET's sibling for convergence), the same single
// source assess.mjs/contract.mjs read -- never re-declared here.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { appendEvent } from "./events.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const sddLevels = JSON.parse(readFileSync(join(here, "..", "..", "contracts", "sdd-levels.json"), "utf8"));

export function convergenceBudgetFor(depth) {
  const level = sddLevels.levels[depth];
  if (!level) throw new Error(`unknown SDD depth: ${depth}`);
  return level.convergenceBudget;
}

function findingsFingerprint(findings) {
  const open = findings
    .filter((f) => f.status === "OPEN")
    .map((f) => `${f.id ?? f.description}:${f.severity}:${f.description}`)
    .sort();
  return open.join("|");
}

/**
 * Pure decision function. `previous` (optional) is the prior converge
 * event: { findingsFingerprint, openFindings }. Mirrors convergence.ps1's
 * branch order exactly: technical failure > external block > material
 * human decision > approved > reviewer-blocked > no-progress-or-budget >
 * otherwise changes requested.
 */
export function decideConvergence({ depth, iteration = 1, reviewer, tests, previous = null, technicalFailure = false, maxIterations = null }) {
  const budget = maxIterations ?? convergenceBudgetFor(depth);
  const verdict = String(reviewer.verdict).toUpperCase();
  const findings = reviewer.findings ?? [];
  const open = findings.filter((f) => f.status === "OPEN");
  const resolved = findings.filter((f) => ["RESOLVED", "ACCEPTED", "RATIONALE"].includes(f.status));
  const testsGreen = Boolean(tests && (["green", "passed", "approved"].includes(tests.status) || tests.passed === true));
  const hasMaterialDecision = Boolean(reviewer.needsPlanner || reviewer.needsHumanDecision || reviewer.materialDecision);
  const externalBlock = Boolean(reviewer.blockedExternal || (reviewer.blocked && reviewer.blockReason === "external"));

  const fingerprint = findingsFingerprint(findings);
  const sameFindings = Boolean(previous && previous.findingsFingerprint === fingerprint && fingerprint !== "");
  const progress = !sameFindings || (previous && previous.openFindings > open.length) || Boolean(tests && tests.previouslyFailed && testsGreen);
  const noProgress = verdict === "CHANGES_REQUESTED" && !progress;

  let outcome;
  let terminal = false;
  let escalation = null;
  let nextAction = "";

  if (technicalFailure) {
    outcome = "FAILED_SAFELY";
    terminal = true;
    escalation = "technical_execution_failure";
  } else if (externalBlock) {
    outcome = "BLOCKED";
    terminal = true;
    escalation = "external_dependency";
  } else if (hasMaterialDecision) {
    outcome = "NEEDS_HUMAN_DECISION";
    terminal = true;
    escalation = reviewer.needsPlanner ? "planner_reentry_required" : "material_decision";
  } else if (verdict === "APPROVED" && open.length === 0 && testsGreen) {
    outcome = "APPROVED";
    terminal = true;
  } else if (verdict === "BLOCKED") {
    outcome = "BLOCKED";
    terminal = true;
    escalation = "reviewer_blocked";
  } else if (noProgress || iteration >= budget) {
    outcome = "FAILED_SAFELY";
    terminal = true;
    escalation = "convergence_stalled";
  } else {
    outcome = "CHANGES_REQUESTED";
    nextAction = "Builder must resolve OPEN findings and re-run tests and the Reviewer.";
  }

  return {
    iteration,
    depth,
    verdict: outcome,
    terminal,
    budget: { maxIterations: budget },
    findings: { open, resolved, openCount: open.length, resolvedCount: resolved.length, fingerprint },
    progress: Boolean(progress),
    noProgress,
    escalation,
    nextAction,
  };
}

/** Runs decideConvergence() and appends the resulting `converge` event. */
export function recordConvergence(logPath, unitId, input) {
  const decision = decideConvergence(input);
  return appendEvent(logPath, unitId, "converge", {
    iteration: decision.iteration,
    verdict: decision.verdict,
    terminal: decision.terminal,
    budget: decision.budget,
    findings: { openCount: decision.findings.openCount, fingerprint: decision.findings.fingerprint },
    ...(decision.escalation ? { escalation: decision.escalation } : {}),
  });
}
