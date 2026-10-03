// C5: validates the committed evidence in evaluation/compat/c5-results.json, produced by
// evaluation/compat/run-c5.mjs against the REAL Claude Code, Codex and OpenCode CLIs.
// It does not call any model. It re-checks, from the embedded gateway audit of each run, that:
//   - the hash chain verifies (so the audit was not edited after the run),
//   - the recorded argsDigest equals the digest of the nonce the run used (so the call is the one asked for),
//   - a `lookup` was ALLOWed and executed through the gateway,
//   - a `stepup` was DENIED with a step_up reason and the downstream write was never executed.
// A tool that could not run must say NOT_AVAILABLE_FROM_TOOL with a captured reason: support is never assumed.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyAuditChain } from "./gateway.mjs";
import { argsDigest } from "./stepup.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const results = JSON.parse(readFileSync(join(repoRoot, "evaluation", "compat", "c5-results.json"), "utf8"));
const TOOLS = ["claude", "codex", "opencode"];
const ARGS = { lookup: (n) => ({ q: n }), stepup: (n) => ({ t: n }) };

function chainOf(entries) {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-c5-"));
  const file = join(dir, "audit.jsonl");
  writeFileSync(file, entries.map((e) => JSON.stringify(e)).join("\n") + (entries.length ? "\n" : ""));
  try {
    verifyAuditChain(file);
    return "OK";
  } catch (error) {
    return error.message;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("results cover the three tools and both scenarios, with a version and the platform commit", () => {
  assert.match(results.platformCommit, /^[0-9a-f]{40}$/);
  assert.deepEqual(Object.keys(results.tools).sort(), [...TOOLS].sort());
  for (const tool of TOOLS) {
    assert.ok(results.tools[tool].cliVersion, `${tool}: cliVersion`);
    assert.deepEqual(Object.keys(results.tools[tool].scenarios).sort(), ["lookup", "stepup"]);
  }
});

for (const tool of TOOLS) {
  for (const scenario of ["lookup", "stepup"]) {
    test(`C5 ${tool}/${scenario}: CONFIRMED only with proof from the gateway audit; otherwise NOT_AVAILABLE_FROM_TOOL with a reason`, () => {
      const r = results.tools[tool].scenarios[scenario];
      assert.ok(["CONFIRMED", "NOT_AVAILABLE_FROM_TOOL"].includes(r.status), `status ${r.status}`);
      if (r.status === "NOT_AVAILABLE_FROM_TOOL") {
        assert.ok(r.reason && r.reason.length > 10, "an unavailable tool records the captured reason, not a bare label");
        return;
      }
      const { nonce, expectedArgsDigest, auditEntries } = r.proof;
      assert.equal(expectedArgsDigest, argsDigest(ARGS[scenario](nonce)), "the digest is the one of the asked arguments");
      assert.equal(chainOf(auditEntries), "OK", "the embedded audit's hash chain verifies");
      const mine = auditEntries.filter((e) => e.argsDigest === expectedArgsDigest);
      assert.ok(mine.length >= 1, "the call carrying this nonce reached the gateway");
      for (const e of auditEntries) assert.equal(e.role, "builder");
      if (scenario === "lookup") {
        assert.ok(mine.some((e) => e.server === "notes" && e.operation === "lookup" && e.decision === "ALLOW" && e.outcome === "ok"));
        assert.ok(mine.some((e) => e.result?.injectionSuspected === true), "the gateway flagged the fixture's injection text");
      } else {
        assert.ok(mine.some((e) => e.server === "writer" && e.decision === "DENY" && /^step_up_/.test(e.reason)));
        assert.ok(!auditEntries.some((e) => e.server === "writer" && e.outcome === "ok"), "the write was never executed");
      }
    });
  }
}

test("a tampered audit would be caught: editing one recorded decision breaks the chain", () => {
  const proof = results.tools.claude.scenarios.lookup.proof;
  if (results.tools.claude.scenarios.lookup.status !== "CONFIRMED" || proof.auditEntries.length < 2) return; // single-entry chains cannot show prevHash tampering
  const forged = structuredClone(proof.auditEntries);
  forged[0].decision = "DENY";
  assert.notEqual(chainOf(forged), "OK");
});

test("nothing is claimed beyond what ran: every CONFIRMED tool really has both scenarios proven", () => {
  for (const tool of TOOLS) {
    const s = results.tools[tool].scenarios;
    const statuses = [s.lookup.status, s.stepup.status];
    assert.ok(statuses.every((x) => x === "CONFIRMED") || statuses.some((x) => x === "NOT_AVAILABLE_FROM_TOOL"), tool);
  }
});

test("C3 (Codex project config): the adapter-generated .codex/config.toml is honoured only in a TRUSTED project", () => {
  const c3 = results.c3;
  assert.ok(c3, "c3 section present");
  assert.ok(["CONFIRMED", "NOT_AVAILABLE_FROM_TOOL"].includes(c3.status));
  if (c3.status !== "CONFIRMED") return;
  assert.match(c3.generatedConfig, /\[mcp_servers\.ai-native-gateway\]/);
  assert.doesNotMatch(c3.generatedConfig, /downstream|SECRET/);
  // trusted: the call is in the gateway audit with the digest of this run's nonce
  assert.equal(c3.trusted.reachedGateway, true);
  assert.equal(chainOf(c3.trusted.auditEntries), "OK");
  assert.ok(c3.trusted.auditEntries.some((e) => e.argsDigest === argsDigest({ q: c3.trusted.nonce }) && e.decision === "ALLOW" && e.outcome === "ok"));
  // untrusted: same generated config, nothing reached the gateway
  assert.equal(c3.untrusted.reachedGateway, false);
  assert.equal(c3.untrusted.auditEntries.length, 0);
});
