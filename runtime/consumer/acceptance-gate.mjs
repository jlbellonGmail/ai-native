#!/usr/bin/env node
// Consumer acceptance governance decision (spec 002 RF-25/RF-31/RF-35 in consumers, plan "RF-25 in consumers").
// Runs in the `acceptance-governance` job of the reusable l3-consumer.yml, from the platform commit pinned by the
// consumer's BASE lock (never from the PR). Input: the verdict JSON produced by runtime/acceptance/verdict.mjs in
// the `acceptance-analyze` job (candidate read as Git objects, no product test, no candidate code) and the result
// of the consumer-owned human Environment job. Output: exit 0 only for PASS, or NEEDS_HUMAN approved by that
// Environment; FAIL and BLOCKED never pass, and a consumer without a human Environment gets BLOCKED, not PASS.
//
// node runtime/consumer/acceptance-gate.mjs --verdict <file> --head <sha> --human <job result> --environment <name>
import { appendFileSync, closeSync, constants, fstatSync, openSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STATUSES = new Set(["PASS", "NEEDS_HUMAN", "FAIL", "BLOCKED"]);

/** @returns {{ ok: boolean, status: string, title: string, lines: string[] }} */
export function consumerAcceptanceDecision({ verdict, headSha, humanResult = "", environment = "" }) {
  const no = (status, title, lines = []) => ({ ok: false, status, title, lines });
  if (!verdict || typeof verdict !== "object" || Array.isArray(verdict) || verdict.schemaVersion !== 1) return no("BLOCKED", "no trusted acceptance verdict for this head SHA");
  if (!/^[0-9a-f]{40}$/.test(String(headSha)) || verdict.headSha !== headSha) return no("BLOCKED", "acceptance verdict is bound to another SHA");
  if (!STATUSES.has(verdict.status)) return no("BLOCKED", "acceptance verdict has an unknown status");
  const lines = [
    ...(Array.isArray(verdict.reasons) ? verdict.reasons : []).slice(0, 10).map((r) => `- ${String(r)}`),
    ...(Array.isArray(verdict.findings) ? verdict.findings : []).slice(0, 20).map((f) => `- finding ${f?.kind}${f?.slug ? ` (${f.slug})` : ""}: ${f?.detail}`),
  ];
  if (verdict.status === "PASS") return { ok: true, status: "PASS", title: "ACCEPTANCE_PASS", lines };
  if (verdict.status === "FAIL") return no("FAIL", "ACCEPTANCE_FAIL: a mandatory acceptance case failed", lines);
  if (verdict.status === "BLOCKED") return no("BLOCKED", "ACCEPTANCE_BLOCKED", lines);
  // NEEDS_HUMAN: only a consumer-owned human Environment approval of this run clears it
  if (!environment) return no("BLOCKED", "ACCEPTANCE_BLOCKED: governance findings need a human, and no consumer-owned human Environment is configured (input acceptance-environment)", lines);
  if (humanResult !== "success") return no("NEEDS_HUMAN", `ACCEPTANCE_NEEDS_HUMAN: pending the approval of Environment ${environment}`, lines);
  return { ok: true, status: "APPROVED", title: `ACCEPTANCE_APPROVED through Environment ${environment}`, lines };
}

function readBounded(file) {
  let fd;
  try { fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)); } catch { return null; }
  try {
    const st = fstatSync(fd);
    if (!st.isFile() || st.size > 1024 * 1024) return null;
    return JSON.parse(readFileSync(fd, "utf8"));
  } catch { return null; } finally { closeSync(fd); }
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  const a = process.argv.slice(2);
  const v = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] ?? "" : ""; };
  const d = consumerAcceptanceDecision({ verdict: v("--verdict") ? readBounded(resolve(v("--verdict"))) : null, headSha: v("--head"), humanResult: v("--human"), environment: v("--environment") });
  const text = [d.title, ...d.lines].join("\n");
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### acceptance governance\n\n${text}\n`);
  process.exit(d.ok ? 0 : 1);
}
