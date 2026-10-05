import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendEvent } from "../circuit/events.mjs";
import { buildTimeline } from "./correlate.mjs";

const sha = (t) => `sha256:${createHash("sha256").update(t, "utf8").digest("hex")}`;
const UNIT = "02-item-a";
const COMMIT = "a".repeat(40);

function workspace() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-correlate-test-"));
  return { dir, events: join(dir, "events.jsonl"), audit: join(dir, "audit.jsonl"), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

// Two chained transitions with controlled timestamps.
function seedEvents(path, times = ["2026-10-01T10:00:00.000Z", "2026-10-01T10:05:00.000Z"]) {
  appendEvent(path, UNIT, "transition", { fromState: "NEW", toState: "ASSESSED" }, { now: () => times[0] });
  appendEvent(path, UNIT, "transition", { fromState: "ASSESSED", toState: "SPECIFIED" }, { now: () => times[1] });
}

// Gateway audit lines chained exactly as the gateway writes them (prevHash = sha of the previous line).
function seedAudit(path, records) {
  let prev = "genesis";
  for (const r of records) {
    const line = JSON.stringify({ schemaVersion: 1, prevHash: prev, ...r });
    appendFileSync(path, `${line}\n`);
    prev = sha(line);
  }
}

const call = (unitId, timestamp, extra = {}) => ({ timestamp, unitId, decision: "ALLOW", server: "docs", operation: "search", ...extra });

const evalResult = (commit, extra = {}) => ({ level: "L1", suite: "core", suiteVersion: "1", datasetDigest: sha("d"), status: "PASS", metrics: { score: 1 }, platform: { commit }, ...extra });

test("joins circuit events, gateway calls and evals of one unit into a single time-ordered timeline", () => {
  const w = workspace();
  try {
    seedEvents(w.events);
    seedAudit(w.audit, [call(UNIT, "2026-10-01T10:02:00.000Z", { decision: "DENY", reason: "not allowed" })]);
    const { errors, warnings, timeline } = buildTimeline({
      unitId: UNIT,
      eventsPath: w.events,
      gatewayAuditPaths: [w.audit],
      evalResults: [{ result: evalResult(COMMIT), at: "2026-10-01T10:03:00.000Z" }],
      platformCommit: COMMIT,
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(warnings, []);
    assert.deepEqual(timeline.map((e) => e.source), ["circuit", "mcp-gateway", "eval", "circuit"]);
    assert.equal(timeline[1].detail, "DENY docs/search (not allowed)");
    assert.equal(timeline[0].detail, "ASSESSED");
    assert.match(timeline[0].ref, /^sha256:[0-9a-f]{64}$/);
  } finally {
    w.cleanup();
  }
});

test("a tampered events.jsonl yields an error and NO timeline", () => {
  const w = workspace();
  try {
    seedEvents(w.events);
    const lines = readFileSync(w.events, "utf8").split("\n").filter(Boolean);
    lines[0] = lines[0].replace("ASSESSED", "VERIFIED");
    writeFileSync(w.events, `${lines.join("\n")}\n`);
    const out = buildTimeline({ unitId: UNIT, eventsPath: w.events });
    assert.equal(out.errors.length, 1);
    assert.deepEqual(out.timeline, []);
  } finally {
    w.cleanup();
  }
});

test("a broken gateway audit chain refuses the whole timeline", () => {
  const w = workspace();
  try {
    seedEvents(w.events);
    seedAudit(w.audit, [call(UNIT, "2026-10-01T10:01:00.000Z"), call(UNIT, "2026-10-01T10:02:00.000Z")]);
    const lines = readFileSync(w.audit, "utf8").split("\n").filter(Boolean);
    lines[0] = lines[0].replace("search", "write");
    writeFileSync(w.audit, `${lines.join("\n")}\n`);
    const out = buildTimeline({ unitId: UNIT, eventsPath: w.events, gatewayAuditPaths: [w.audit] });
    assert.match(out.errors[0], /gateway audit .* chain broken at entry 2/);
    assert.deepEqual(out.timeline, []);
  } finally {
    w.cleanup();
  }
});

test("a shared gateway audit skips other units, and calls without unitId are reported, never guessed", () => {
  const w = workspace();
  try {
    seedEvents(w.events);
    seedAudit(w.audit, [call("03-other", "2026-10-01T10:01:00.000Z"), call(undefined, "2026-10-01T10:02:00.000Z"), call(UNIT, "2026-10-01T10:03:00.000Z")]);
    const { errors, warnings, timeline } = buildTimeline({ unitId: UNIT, eventsPath: w.events, gatewayAuditPaths: [w.audit] });
    assert.deepEqual(errors, []);
    assert.equal(timeline.filter((e) => e.source === "mcp-gateway").length, 1);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /entry 2 has no unitId; not joined/);
  } finally {
    w.cleanup();
  }
});

test("an eval about another platform commit is not joined as evidence", () => {
  const w = workspace();
  try {
    seedEvents(w.events);
    const { errors, warnings, timeline } = buildTimeline({
      unitId: UNIT,
      eventsPath: w.events,
      evalResults: [{ result: evalResult("b".repeat(40)) }],
      platformCommit: COMMIT,
    });
    assert.deepEqual(errors, []);
    assert.equal(timeline.some((e) => e.source === "eval"), false);
    assert.match(warnings[0], /not joined/);
  } finally {
    w.cleanup();
  }
});

test("an undated eval is listed after every dated entry", () => {
  const w = workspace();
  try {
    seedEvents(w.events);
    const { timeline } = buildTimeline({ unitId: UNIT, eventsPath: w.events, evalResults: [{ result: evalResult(COMMIT), evidencePath: "evidence/e.json" }] });
    assert.equal(timeline.at(-1).source, "eval");
    assert.equal(timeline.at(-1).ref, "evidence/e.json");
  } finally {
    w.cleanup();
  }
});

test("a foreign unit inside the unit's own events.jsonl and a backwards timestamp are correlation errors", () => {
  const w = workspace();
  try {
    appendEvent(w.events, UNIT, "transition", { fromState: "NEW", toState: "ASSESSED" }, { now: () => "2026-10-01T10:05:00.000Z" });
    appendEvent(w.events, "99-intruder", "transition", { fromState: "ASSESSED", toState: "SPECIFIED" }, { now: () => "2026-10-01T10:00:00.000Z" });
    const { errors } = buildTimeline({ unitId: UNIT, eventsPath: w.events });
    assert.ok(errors.some((e) => /names unit 99-intruder, expected 02-item-a/.test(e)));
    assert.ok(errors.some((e) => /timestamp goes backwards at entry 2/.test(e)));
  } finally {
    w.cleanup();
  }
});

test("a missing events.jsonl is an explicit error, not an empty success", () => {
  const w = workspace();
  try {
    const { errors, timeline } = buildTimeline({ unitId: UNIT, eventsPath: join(w.dir, "absent.jsonl") });
    assert.match(errors[0], /no events for unit 02-item-a/);
    assert.deepEqual(timeline, []);
  } finally {
    w.cleanup();
  }
});
