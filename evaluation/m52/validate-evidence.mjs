#!/usr/bin/env node
// M5.2: validates the closure matrix and the evidence files it cites. Dependency-free, offline, cheap (no CLI is launched).
//   node evaluation/m52/validate-evidence.mjs [--verdict]
// A PASS in the matrix must cite files that exist; the evidence files must be internally consistent (a result cannot say
// PASS while one of its cases failed; an isolation claim needs its network proof; an L2 result needs N>=3, a model, and
// real session ids). It does not re-run anything: it refuses evidence that could not have come from a real run.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const defaultRoot = join(here, "..", "..");
const BLOCKING = new Set(["MISSING", "NOT_RUN", "BLOCKED"]);

export function checkMatrix(matrix, root = defaultRoot) {
  const errors = [];
  const allowed = new Set(matrix.allowedStatuses ?? []);
  const seen = new Set();
  for (const r of matrix.rows ?? []) {
    if (seen.has(r.id)) errors.push(`duplicate row id ${r.id}`);
    seen.add(r.id);
    if (!allowed.has(r.status)) errors.push(`${r.id}: status ${r.status} is not allowed`);
    for (const k of ["criterion", "run"]) if (!r[k]) errors.push(`${r.id}: ${k} is required`);
    if (typeof r.mandatory !== "boolean") errors.push(`${r.id}: mandatory must be a boolean`);
    if (!Array.isArray(r.evidence) || r.evidence.length === 0) errors.push(`${r.id}: evidence is required`);
    for (const e of r.evidence ?? []) if (!existsSync(join(root, e))) errors.push(`${r.id}: evidence ${e} does not exist`);
    if (r.status === "NOT_AVAILABLE_FROM_TOOL" && !r.note) errors.push(`${r.id}: NOT_AVAILABLE_FROM_TOOL needs a note explaining what could not be observed`);
  }
  return errors;
}

export function closureVerdict(matrix) {
  const blocking = (matrix.rows ?? []).filter((r) => r.mandatory && BLOCKING.has(r.status)).map((r) => r.id);
  return { status: blocking.length ? "OPEN" : "COMPLETED", blocking };
}

export function checkL2(result, detail) {
  const errors = [];
  if (result.level !== "L2") errors.push("level must be L2");
  if (!(result.runs >= 3)) errors.push("L2 needs runs >= 3");
  if (!result.model?.id) errors.push("L2 needs model.id");
  if (!result.tool?.name) errors.push("L2 needs the tool that ran the agent");
  if (!/^[0-9a-f]{40}$/.test(result.platform?.commit ?? "")) errors.push("L2 needs the 40-hex platform commit");
  if (result.status === "PASS" && !(result.metrics?.score >= result.threshold)) errors.push("status PASS but score is below the threshold");
  const calls = detail?.calls ?? [];
  const perScenario = new Map();
  for (const c of calls) perScenario.set(c.scenario, (perScenario.get(c.scenario) ?? 0) + 1);
  if (perScenario.size === 0 || [...perScenario.values()].some((n) => n !== result.runs)) errors.push("calls: every scenario must appear exactly runs times");
  if (detail?.perRun?.length !== result.runs) errors.push("perRun length differs from runs");
  if (calls.some((c) => !c.sessionId)) errors.push("every call must carry its real session id");
  if (calls.some((c) => c.isError)) errors.push("calls with isError cannot back a PASS");
  return errors;
}

export function checkOffline(e) {
  const errors = [];
  const bad = (e.cases ?? []).filter((c) => !c.ok).map((c) => c.id);
  if (e.status === "PASS" && bad.length) errors.push(`status PASS but failing cases: ${bad.join(", ")}`);
  if (e.status === "FAIL" && !bad.length) errors.push("status FAIL but no failing case");
  if (e.totals?.cases !== (e.cases ?? []).length || e.totals?.ok !== (e.cases ?? []).filter((c) => c.ok).length) errors.push("totals differ from the cases");
  if (!(e.cases ?? []).some((c) => c.id === "net-proof" && c.ok)) errors.push("missing a passing net-proof case (the network must be shown to be unavailable)");
  for (const id of ["with-cache/sync", "no-cache/sync", "no-network/status-check"]) if (!(e.cases ?? []).some((c) => c.id === id)) errors.push(`missing case ${id}`);
  if (e.mode === "guard" && (e.cases ?? []).filter((c) => c.id.startsWith("with-cache/")).some((c) => c.networkAttempts !== 0)) errors.push("guard mode: a cached case attempted network access");
  if (!/^[0-9a-f]{40}$/.test(e.release?.commit ?? "")) errors.push("release.commit must be a 40-hex SHA");
  return errors;
}

export function checkRealCli(e) {
  const errors = [];
  for (const t of e.tools ?? []) {
    const states = t.cases.map((c) => c.status);
    if (t.status === "PASS" && states.some((s) => s !== "PASS")) errors.push(`${t.tool}: status PASS but a case is not PASS`);
    if (t.status === "FAIL" && !states.includes("FAIL")) errors.push(`${t.tool}: status FAIL but no case failed`);
    for (const c of t.cases) if (c.status === "PASS" && c.id !== "generated-config" && !c.answer) errors.push(`${t.tool}/${c.id}: PASS without the tool's answer`);
  }
  if (e.os === "linux") {
    if (!e.host?.distribution) errors.push("a Linux run must record the distribution");
    for (const t of e.tools ?? []) if (!t.binary?.native) errors.push(`${t.tool}: a Linux run must use a native binary, got ${t.binary?.realPath ?? t.binary?.path ?? "none"} [${t.binary?.kind ?? ""}]`);
  }
  if (!["claude-code", "codex-cli", "opencode"].every((n) => (e.tools ?? []).some((t) => t.tool === n))) errors.push("the three tools must be present");
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const load = (p) => JSON.parse(readFileSync(join(defaultRoot, p), "utf8"));
  const errors = [
    ...checkMatrix(load("evaluation/m52/m52-matrix.json")),
    ...checkL2(load("evaluation/m52/evidence/l2-claude-code.json"), load("evaluation/m52/evidence/l2-claude-code.calls.json")).map((e) => `l2: ${e}`),
    ...["offline-docker-rc2", "offline-guard-rc2"].flatMap((f) => checkOffline(load(`evaluation/m52/evidence/${f}.json`)).map((e) => `${f}: ${e}`)),
    ...["real-cli-checkout", "real-cli-rc2-published"].flatMap((f) => checkRealCli(load(`evaluation/m52/evidence/${f}.json`)).map((e) => `${f}: ${e}`)),
  ];
  for (const e of errors) console.error(`ERROR ${e}`);
  const v = closureVerdict(load("evaluation/m52/m52-matrix.json"));
  console.log(errors.length ? `FAIL (${errors.length} errors)` : "PASS: matrix and evidence are consistent");
  if (process.argv.includes("--verdict")) console.log(`M5.2 closure: ${v.status}${v.blocking.length ? ` (blocking: ${v.blocking.join(", ")})` : ""}`);
  process.exit(errors.length ? 1 : 0);
}
