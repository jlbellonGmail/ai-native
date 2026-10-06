import { test } from "node:test";
import assert from "node:assert/strict";
import { checkMatrix, checkL2, checkOffline, checkRealCli, closureVerdict } from "./validate-evidence.mjs";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const load = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const matrix = () => load("evaluation/m52/m52-matrix.json");
const row = (over) => ({ id: "x", criterion: "c", mandatory: true, status: "PASS", evidence: ["evaluation/m52/m52-matrix.json"], run: "r", note: "", ...over });

test("the committed matrix and every committed evidence file are consistent", () => {
  assert.deepEqual(checkMatrix(matrix(), root), []);
  assert.deepEqual(checkL2(load("evaluation/m52/evidence/l2-claude-code.json"), load("evaluation/m52/evidence/l2-claude-code.calls.json")), []);
  for (const f of ["offline-docker-rc2", "offline-guard-rc2"]) assert.deepEqual(checkOffline(load(`evaluation/m52/evidence/${f}.json`)), [], f);
  for (const f of ["real-cli-checkout", "real-cli-rc2-published"]) assert.deepEqual(checkRealCli(load(`evaluation/m52/evidence/${f}.json`)), [], f);
});

test("a PASS row must cite evidence that exists; unknown statuses and missing fields are rejected", () => {
  const m = { rows: [row({ evidence: ["evaluation/m52/does-not-exist.json"] }), row({ id: "y", status: "MOSTLY_PASS" }), row({ id: "z", run: "" })], allowedStatuses: ["PASS", "MISSING"] };
  const errors = checkMatrix(m, root).join("\n");
  assert.match(errors, /x: evidence .* does not exist/);
  assert.match(errors, /y: status MOSTLY_PASS is not allowed/);
  assert.match(errors, /z: run is required/);
});

test("a duplicate row id is rejected", () => {
  assert.match(checkMatrix({ rows: [row(), row()], allowedStatuses: ["PASS"] }, root).join("\n"), /duplicate row id x/);
});

test("closureVerdict: COMPLETED only when no mandatory row is MISSING/NOT_RUN/BLOCKED; optional rows may stay NOT_AVAILABLE_FROM_TOOL", () => {
  const ok = { rows: [row(), row({ id: "o", mandatory: false, status: "NOT_AVAILABLE_FROM_TOOL" })] };
  assert.equal(closureVerdict(ok).status, "COMPLETED");
  for (const bad of ["MISSING", "NOT_RUN", "BLOCKED"]) {
    const v = closureVerdict({ rows: [row(), row({ id: "m", status: bad })] });
    assert.equal(v.status, "OPEN", bad);
    assert.deepEqual(v.blocking, ["m"]);
  }
});

test("the L2 check refuses a simulated or under-powered result", () => {
  const good = load("evaluation/m52/evidence/l2-claude-code.json");
  const calls = load("evaluation/m52/evidence/l2-claude-code.calls.json");
  assert.match(checkL2({ ...good, runs: 2 }, calls).join("\n"), /runs >= 3/);
  assert.match(checkL2({ ...good, model: undefined }, calls).join("\n"), /model\.id/);
  assert.match(checkL2(good, { ...calls, calls: calls.calls.slice(0, 5) }).join("\n"), /calls/);
  assert.match(checkL2(good, { ...calls, calls: calls.calls.map((c) => ({ ...c, sessionId: null })) }).join("\n"), /session/);
});

test("the offline check refuses a PASS that hides a failed case, or an isolation claim without the network proof", () => {
  const good = load("evaluation/m52/evidence/offline-docker-rc2.json");
  assert.match(checkOffline({ ...good, cases: good.cases.map((c, i) => (i === 3 ? { ...c, ok: false } : c)) }).join("\n"), /status PASS but/);
  assert.match(checkOffline({ ...good, cases: good.cases.filter((c) => c.id !== "net-proof") }).join("\n"), /net-proof/);
});

test("the real-CLI check never accepts PASS for a tool whose case is NOT_AVAILABLE_FROM_TOOL", () => {
  const good = load("evaluation/m52/evidence/real-cli-checkout.json");
  const bad = { ...good, tools: good.tools.map((t) => (t.tool === "codex-cli" ? { ...t, status: "PASS" } : t)) };
  assert.match(checkRealCli(bad).join("\n"), /codex-cli: status PASS but a case is not PASS/);
});

test("a Linux real-CLI run must record its distribution and use native binaries (a Windows binary leaked by WSL interop is refused)", () => {
  const base = load("evaluation/m52/evidence/real-cli-checkout.json");
  const linux = { ...base, os: "linux", host: { os: "linux", distribution: "Ubuntu 24.04", wsl: true }, tools: base.tools.map((t) => ({ ...t, binary: { path: "/home/u/.local/npm/bin/x", realPath: "/home/u/.local/npm/x", kind: "ELF 64-bit", native: true } })) };
  assert.deepEqual(checkRealCli(linux), []);
  const leaked = { ...linux, tools: linux.tools.map((t, i) => (i === 0 ? { ...t, binary: { path: "/mnt/c/x/claude", realPath: "/mnt/c/x/claude.exe", kind: "PE32+", native: false } } : t)) };
  assert.match(checkRealCli(leaked).join("\n"), /native binary/);
  assert.match(checkRealCli({ ...linux, host: { os: "linux" } }).join("\n"), /distribution/);
});
