#!/usr/bin/env node
// Consumer acceptance governance decision (spec 002 RF-25/RF-31/RF-35 in consumers, plan "RF-25 in consumers").
// Runs in the `acceptance-governance` job of the reusable l3-consumer.yml, from the platform commit pinned by the
// consumer's BASE lock (never from the PR). Inputs: the verdict JSON produced by runtime/acceptance/verdict.mjs in
// the `acceptance-analyze` job (candidate read as Git objects, no product test, no candidate code), the result of
// the consumer-owned human Environment job and the run's approval records from the API. Exit 0 only for PASS, or
// NEEDS_HUMAN approved in that Environment by a pinned human reviewer who is not the PR author; FAIL and BLOCKED
// never pass. A job result alone is not an approval: an Environment GitHub auto-creates without reviewers would
// "succeed" with no approval record, so the record is required (third review R3).
//
// node runtime/consumer/acceptance-gate.mjs --verdict <file> --head <sha> --human <job result> --environment <name>
//   --reviewers <login,login> --author <pr author> [--approvals <file with the run approvals JSON>]
import { appendFileSync, closeSync, constants, fstatSync, openSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STATUSES = new Set(["PASS", "NEEDS_HUMAN", "FAIL", "BLOCKED"]);
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

/** The approval of `environment` in this run by a pinned human reviewer other than the PR author. */
export function humanApproval({ approvals, environment, reviewers = [], author = "" }) {
  const pinned = reviewers.filter((r) => LOGIN.test(r));
  if (!pinned.length) return { ok: false, reason: "no pinned human reviewer configured (input acceptance-reviewers)" };
  const list = Array.isArray(approvals) ? approvals : [];
  const hit = list.find((a) => a?.state === "approved" && (a.environments ?? []).some((e) => e?.name === environment));
  if (!hit) return { ok: false, reason: `no approval record of Environment ${environment} in this run (an Environment without required reviewers approves nothing)` };
  const login = hit.user?.login;
  // fail closed: a record without a user type is not proven human (fourth review)
  if (hit.user?.type !== "User") return { ok: false, reason: `approver ${login} is not a proven human user (type ${hit.user?.type ?? "missing"})` };
  if (!pinned.includes(login)) return { ok: false, reason: `approver ${login} is not a pinned reviewer` };
  if (author && login === author) return { ok: false, reason: `approver ${login} is the PR author` };
  return { ok: true, record: { environment, reviewer: login, id: hit.user?.id ?? null, comment: String(hit.comment ?? "").slice(0, 200) } };
}

/** @returns {{ ok: boolean, status: string, title: string, lines: string[] }} */
export function consumerAcceptanceDecision({ verdict, headSha, humanResult = "", environment = "", approvals = null, reviewers = [], author = "" }) {
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
  // NEEDS_HUMAN: only a recorded approval of the consumer-owned Environment by a pinned human clears it
  if (!environment) return no("BLOCKED", "ACCEPTANCE_BLOCKED: governance findings need a human, and no consumer-owned human Environment is configured (input acceptance-environment)", lines);
  if (humanResult !== "success") return no("NEEDS_HUMAN", `ACCEPTANCE_NEEDS_HUMAN: pending the approval of Environment ${environment}`, lines);
  const a = humanApproval({ approvals, environment, reviewers, author });
  if (!a.ok) return no("BLOCKED", `ACCEPTANCE_BLOCKED: ${a.reason}`, lines);
  return { ok: true, status: "APPROVED", title: `ACCEPTANCE_APPROVED by ${a.record.reviewer} through Environment ${environment}`, lines: [...lines, `- approval: ${JSON.stringify(a.record)}`] };
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
  const d = consumerAcceptanceDecision({
    verdict: v("--verdict") ? readBounded(resolve(v("--verdict"))) : null,
    headSha: v("--head"), humanResult: v("--human"), environment: v("--environment"),
    approvals: v("--approvals") ? readBounded(resolve(v("--approvals"))) : null,
    reviewers: v("--reviewers").split(",").map((s) => s.trim()).filter(Boolean), author: v("--author"),
  });
  const text = [d.title, ...d.lines].join("\n");
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### acceptance governance\n\n${text}\n`);
  process.exit(d.ok ? 0 : 1);
}
