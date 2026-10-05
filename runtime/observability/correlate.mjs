// Observability correlation (M4.6; PAR-OBSERVABILITY-CORRELATION). The
// platform leaves three kinds of evidence about one Work Unit in three
// places: the unit's `events.jsonl` (circuit), the MCP gateway audit
// (what crossed the trust boundary) and eval results (what was measured).
// Looking at one of them alone can't answer "what happened in unit X, in
// what order, on which commit?". This module joins them on `unitId` into
// one ordered timeline, and refuses to join sources it cannot trust:
//   - every hash-chained source must verify (a broken chain => error, the
//     timeline is NOT built from a tampered log);
//   - the unit's own events.jsonl must name only that unit (a foreign
//     event in it is a correlation error); gateway audit files may be
//     shared across units, so other units' calls are skipped and calls
//     with no unitId are reported as not joinable, never guessed;
//   - timestamps must be non-decreasing within each chained source;
//   - an eval result is only joined when it names the unit's platform
//     commit (a result about another commit is not evidence for this one).
// Read-only. It produces a view, never a new source of truth (same
// principle as the derived STATUS view and the derived unit state).
import { readLinesIfExists } from "../lib/fs-safe.mjs";
import { createHash } from "node:crypto";
import { readEvents, verifyChain, EventChainError } from "../circuit/events.mjs";
import { verifyAuditChain } from "../mcp-gateway/gateway.mjs";

const sha = (text) => `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;

function readJsonl(path) {
  return readLinesIfExists(path).map((l) => JSON.parse(l));
}

function checkMonotonic(records, label, errors) {
  for (let i = 1; i < records.length; i += 1) {
    if (Date.parse(records[i].timestamp) < Date.parse(records[i - 1].timestamp)) {
      errors.push(`${label}: timestamp goes backwards at entry ${i + 1}`);
      return;
    }
  }
}

/**
 * @param {object} o
 * @param {string} o.unitId
 * @param {string} o.eventsPath          runs/<unit>/events.jsonl
 * @param {string[]} [o.gatewayAuditPaths]
 * @param {Array<{result: object, evidencePath?: string, at?: string}>} [o.evalResults]  `at` (ISO time) places the eval in the timeline; without it the eval is listed last
 * @param {string} [o.platformCommit]    commit evals must name to be joined
 */
export function buildTimeline({ unitId, eventsPath, gatewayAuditPaths = [], evalResults = [], platformCommit = null }) {
  const errors = [];
  const warnings = [];
  const entries = [];

  try {
    verifyChain(eventsPath);
  } catch (error) {
    if (error instanceof EventChainError) return { errors: [error.message], warnings, timeline: [] };
    throw error;
  }
  const events = readEvents(eventsPath);
  if (events.length === 0) errors.push(`no events for unit ${unitId} at ${eventsPath}`);
  checkMonotonic(events, "events.jsonl", errors);
  events.forEach((e, i) => {
    if (e.unitId !== unitId) errors.push(`events.jsonl entry ${i + 1} names unit ${e.unitId}, expected ${unitId}`);
    entries.push({ source: "circuit", at: e.timestamp, type: e.eventType, detail: e.toState ?? e.verdict ?? e.depth ?? e.status ?? null, ref: sha(JSON.stringify(e)), order: i });
  });

  for (const path of gatewayAuditPaths) {
    const chain = verifyAuditChain(path);
    if (!chain.ok) return { errors: [`gateway audit ${path} chain broken at entry ${chain.brokenAt + 1}`], warnings, timeline: [] };
    const records = readJsonl(path);
    checkMonotonic(records, `gateway audit ${path}`, errors);
    records.forEach((r, i) => {
      if (!r.unitId) { warnings.push(`gateway audit ${path} entry ${i + 1} has no unitId; not joined`); return; }
      if (r.unitId !== unitId) return; // a shared audit file legitimately holds other units' calls
      entries.push({ source: "mcp-gateway", at: r.timestamp, type: "mcp-call", detail: `${r.decision} ${r.server}/${r.operation}${r.reason ? ` (${r.reason})` : ""}`, ref: sha(JSON.stringify(r)), order: i });
    });
  }

  for (const { result, evidencePath, at = null } of evalResults) {
    if (platformCommit && result.platform?.commit !== platformCommit) {
      warnings.push(`eval ${result.suite} (${result.level}) is about commit ${result.platform?.commit}, not ${platformCommit}; not joined`);
      continue;
    }
    entries.push({ source: "eval", at, type: `eval-${result.level}`, detail: `${result.suite}@${result.suiteVersion} ${result.status} score=${result.metrics?.score}`, ref: evidencePath ?? result.datasetDigest, order: 0 });
  }

  const dated = entries.filter((e) => e.at).sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || a.order - b.order);
  const undated = entries.filter((e) => !e.at);
  return { errors, warnings, timeline: [...dated, ...undated] };
}
