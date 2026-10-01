import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendEvent, readEvents, verifyChain, validateEventShape, EventChainError } from "./events.mjs";

function tmpLog() {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-events-test-"));
  return join(dir, "events.jsonl");
}

test("appendEvent on an empty/missing log chains from genesis", () => {
  const path = tmpLog();
  try {
    const event = appendEvent(path, "02-item-a", "assess", {
      signals: [{ code: "implementation", level: "medium", weight: 2 }],
      score: 2,
      risk: "MEDIUM",
      depth: "STANDARD",
      deterministic: true,
    });
    assert.equal(event.prevHash, "genesis");
    assert.equal(event.unitId, "02-item-a");
  } finally {
    rmSync(path, { force: true });
  }
});

test("appendEvent chains the second event off the sha256 of the first line", () => {
  const path = tmpLog();
  try {
    appendEvent(path, "02-item-a", "transition", { fromState: "NEW", toState: "ASSESSED" });
    const second = appendEvent(path, "02-item-a", "transition", { fromState: "ASSESSED", toState: "SPECIFIED" });
    assert.notEqual(second.prevHash, "genesis");
    assert.match(second.prevHash, /^sha256:[0-9a-f]{64}$/);
  } finally {
    rmSync(path, { force: true });
  }
});

test("readEvents returns [] for a log that does not exist yet", () => {
  const path = join(tmpdir(), `does-not-exist-${Date.now()}.jsonl`);
  assert.deepEqual(readEvents(path), []);
});

test("readEvents round-trips every appended event in order", () => {
  const path = tmpLog();
  try {
    appendEvent(path, "02-item-a", "transition", { fromState: "NEW", toState: "ASSESSED" });
    appendEvent(path, "02-item-a", "transition", { fromState: "ASSESSED", toState: "SPECIFIED" });
    const events = readEvents(path);
    assert.equal(events.length, 2);
    assert.equal(events[1].toState, "SPECIFIED");
  } finally {
    rmSync(path, { force: true });
  }
});

test("verifyChain passes for an untampered log", () => {
  const path = tmpLog();
  try {
    appendEvent(path, "02-item-a", "transition", { fromState: "NEW", toState: "ASSESSED" });
    appendEvent(path, "02-item-a", "transition", { fromState: "ASSESSED", toState: "SPECIFIED" });
    assert.doesNotThrow(() => verifyChain(path));
  } finally {
    rmSync(path, { force: true });
  }
});

test("verifyChain throws EventChainError when a line is tampered with (P45 tamper-evidence)", () => {
  const path = tmpLog();
  try {
    appendEvent(path, "02-item-a", "transition", { fromState: "NEW", toState: "ASSESSED" });
    appendEvent(path, "02-item-a", "transition", { fromState: "ASSESSED", toState: "SPECIFIED" });
    const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
    const tampered = JSON.parse(lines[0]);
    tampered.toState = "BUILDING"; // rewrite history
    lines[0] = JSON.stringify(tampered);
    writeFileSync(path, `${lines.join("\n")}\n`, "utf8");
    assert.throws(() => verifyChain(path), EventChainError);
  } finally {
    rmSync(path, { force: true });
  }
});

test("validateEventShape rejects an event missing required fields for its eventType", () => {
  assert.throws(() => validateEventShape({ schemaVersion: 1, eventType: "verify", unitId: "x", timestamp: new Date().toISOString(), prevHash: "genesis" }), /invalid unit-event/);
});

test("validateEventShape accepts a well-formed verify event", () => {
  assert.doesNotThrow(() =>
    validateEventShape({
      schemaVersion: 1,
      eventType: "verify",
      unitId: "x",
      timestamp: new Date().toISOString(),
      prevHash: "genesis",
      treeSha: "a".repeat(40),
      status: "PASS",
      exitCode: 0,
    }),
  );
});

test("appendEvent refuses to write an event that fails shape validation", () => {
  const path = tmpLog();
  try {
    assert.throws(() => appendEvent(path, "x", "verify", { status: "PASS" }), /invalid unit-event/);
    assert.deepEqual(readEvents(path), []);
  } finally {
    rmSync(path, { force: true });
  }
});
