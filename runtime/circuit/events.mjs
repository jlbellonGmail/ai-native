// events.jsonl: the single, append-only source of truth for a Work Unit
// (M3.2). Consolidates and replaces TEMPLATE v2.0.5's 5 separate machine
// files (assess.jsonl, sdd.json, convergence.json, model-routing.jsonl,
// veredicto YAML files) behind one log, per contracts/unit-event.schema.json.
// unit.json / the current state are always derived by replaying this log
// (runtime/circuit/state-machine.mjs) -- never stored, which is what
// avoids the lost-update races a single mutable file would have between
// parallel Builder/Reviewer/Orchestrator writers (same reasoning as
// runtime/status's STATUS.md being a derived view, M3.1).
//
// Each event is chained by prevHash (sha256 of the previous line's exact
// bytes, or the literal "genesis" for the first event) for local
// tamper-evidence (P45) -- the strong guarantee is still the CI
// review-gate (M4.3), not this chain by itself.
import { createHash } from "node:crypto";
import { readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../lib/schema-lite.mjs";
import { readLinesIfExists } from "../lib/fs-safe.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const unitEventSchema = JSON.parse(readFileSync(join(here, "..", "..", "contracts", "unit-event.schema.json"), "utf8"));

export class EventChainError extends Error {}

function sha256(text) {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

/** Validates a candidate event object against contracts/unit-event.schema.json. */
export function validateEventShape(event) {
  const errors = validate(event, unitEventSchema);
  if (errors.length > 0) {
    throw new Error(`invalid unit-event: ${errors.join("; ")}`);
  }
}

/**
 * Appends one event to `path`, computing prevHash from the last line
 * currently on disk ("genesis" for an empty/missing log). Returns the
 * full event object (with schemaVersion/timestamp/prevHash filled in).
 */
export function appendEvent(path, unitId, eventType, fields, { now = () => new Date().toISOString() } = {}) {
  const lines = readLinesIfExists(path);
  const prevHash = lines.length > 0 ? sha256(lines[lines.length - 1]) : "genesis";
  const event = { schemaVersion: 1, eventType, unitId, timestamp: now(), prevHash, ...fields };
  validateEventShape(event);
  const line = JSON.stringify(event);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${line}\n`, "utf8");
  return event;
}

/**
 * Reads and parses every event in `path` (empty array if the file does
 * not exist yet -- a brand new Work Unit has no history). Does not
 * verify the hash chain; use verifyChain() for that.
 */
export function readEvents(path) {
  return readLinesIfExists(path)
    .map((line) => JSON.parse(line));
}

/**
 * Walks the log verifying each event's prevHash against the actual
 * sha256 of the previous line's bytes. Throws EventChainError at the
 * first break (tamper-evidence, P45) -- it does not try to recover or
 * continue past a broken link.
 */
export function verifyChain(path) {
  const rawLines = readLinesIfExists(path);
  if (rawLines.length === 0) return;
  let expectedPrev = "genesis";
  for (let i = 0; i < rawLines.length; i += 1) {
    const event = JSON.parse(rawLines[i]);
    if (event.prevHash !== expectedPrev) {
      throw new EventChainError(`events.jsonl chain broken at line ${i + 1} (unitId=${event.unitId}): expected prevHash '${expectedPrev}', got '${event.prevHash}'`);
    }
    expectedPrev = sha256(rawLines[i]);
  }
}
