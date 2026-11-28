// Manual acceptance procedure, rendered from the plan + contract (spec 002 RF-26,
// RF-27), runner/manual parity, and the traceability report (RF-28).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sha256, canonical } from "./evidence.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const TEMPLATE_PATH = join(here, "..", "..", "knowledge", "sdd", "templates", "acceptance-manual-template.md");

const quotePs = (a) => (/^[A-Za-z0-9_./:=@-]+$/.test(a) ? a : `'${a.replace(/'/g, "''")}'`);
const quoteSh = (a) => (/^[A-Za-z0-9_./:=@-]+$/.test(a) ? a : `'${a.replace(/'/g, "'\\''")}'`);

/** The exact command a human runs, per shell, from the contract's executable + argv. */
export function renderCommand(runner) {
  const exe = runner.executable;
  const ps = `& ${quotePs(exe)} ${runner.argv.map(quotePs).join(" ")}`.trim();
  const sh = `${quoteSh(exe)} ${runner.argv.map(quoteSh).join(" ")}`.trim();
  return { ps, sh, digest: sha256(canonical({ executable: exe, argv: runner.argv, cwd: runner.cwd })) };
}

const field = (label, text) => `- **${label}:** ${String(text).trim()}`;

export function renderManual({ slug, plan, contract, template = readFileSync(TEMPLATE_PATH, "utf8") }) {
  const runners = new Map(contract.runners.map((r) => [r.id, r]));
  const datasets = plan.datasets.length
    ? plan.datasets.map((d) => `- \`${d.id}\` (${d.kind}${d.kind === "file" ? `: \`${d.path}\`` : `: generator \`${d.generator}\`, seed ${d.seed}`}), SHA-256 \`${d.sha256}\`. Synthetic data only.`).join("\n")
    : "- No dataset: the cases use inline synthetic values.";
  const prerequisites = [...new Set(contract.runners.map((r) => `- \`${r.executable}\` available (runner \`${r.id}\`, isolation tier \`${r.isolation}\`${r.isolation === "restricted" ? ", not isolated" : ""}).`))].join("\n");
  const cases = plan.cases.map((k) => {
    const r = runners.get(k.runner);
    const cmd = r ? renderCommand(r) : { ps: "(runner missing)", sh: "(runner missing)", digest: "" };
    const v = `acceptance_${k.id.replace(/[^A-Za-z0-9]/g, "_")}_exit`;
    return [
      `### ${k.id}`,
      "",
      field("Validates", `${k.ac.join(", ")} (category ${k.category})`),
      field("Why it matters", k.why),
      field("Use in a real system", k.realSystemUse),
      field("Data", k.dataset ? `dataset \`${k.dataset}\`` : "inline synthetic values"),
      field("Expected result", k.expected === "reject" ? "the system REJECTS the input (the case reports ok when it does)" : "the system accepts the input and returns the expected value"),
      field("PASS means", "the runner line for this case is `ok`"),
      field("FAIL means", "the runner line for this case is `not ok`: the behavior does not meet the criterion"),
      field("Intentional errors", k.intentionalErrors),
      field("Limitations", k.limitations),
      field("Restore", k.restore),
      `- **What the command does:** runs runner \`${k.runner}\` (${r?.format ?? "?"}) from \`${r?.cwd ?? "?"}\`; it executes every case of that runner and reports each by ID.`,
      "",
      "PowerShell:",
      "",
      "```powershell",
      `${cmd.ps}; $${v} = $LASTEXITCODE; "exit=$${v}"`,
      "```",
      "",
      "POSIX sh:",
      "",
      "```sh",
      `${cmd.sh}; ${v}=$?; echo "exit=$${v}"`,
      "```",
      "",
      `<!-- case:${k.id} criteria:${k.ac.join(",")} expected:${k.expected} command-digest:${cmd.digest} -->`,
    ].join("\n");
  }).join("\n\n");
  const restore = [...new Set(plan.cases.map((k) => k.restore.trim()))].map((x) => `- ${x}`).join("\n");
  return template.replaceAll("{{slug}}", slug).replace("{{prerequisites}}", prerequisites).replace("{{datasets}}", datasets).replace("{{cases}}", cases).replace("{{restore}}", restore);
}

/** RF-27: manual case IDs, criteria, expected results and command digests must match plan + contract. */
export function checkParity({ manualText, plan, contract }) {
  const runners = new Map(contract.runners.map((r) => [r.id, r]));
  const errors = [];
  const marks = new Map([...manualText.matchAll(/<!-- case:(\S+) criteria:(\S+) expected:(\S+) command-digest:([0-9a-f]*) -->/g)].map((m) => [m[1], { ac: m[2], expected: m[3], digest: m[4] }]));
  for (const k of plan.cases) {
    const m = marks.get(k.id);
    if (!m) { errors.push(`manual lacks case ${k.id}`); continue; }
    if (m.ac !== k.ac.join(",")) errors.push(`manual criteria of ${k.id} differ from the plan`);
    if (m.expected !== k.expected) errors.push(`manual expected result of ${k.id} differs from the plan`);
    const r = runners.get(k.runner);
    if (!r || m.digest !== renderCommand(r).digest) errors.push(`manual command of ${k.id} differs from the contract runner`);
    // the displayed command lines must be the rendered ones (tampering with the text is divergence)
    if (r) {
      const { ps, sh } = renderCommand(r);
      const section = manualText.split(`### ${k.id}\n`)[1]?.split("\n### ")[0] ?? "";
      if (!section.includes(ps) || !section.includes(sh)) errors.push(`manual command text of ${k.id} was edited`);
    }
  }
  for (const id of marks.keys()) if (!plan.cases.some((k) => k.id === id)) errors.push(`manual has case ${id} that the plan does not`);
  return { status: errors.length ? "BLOCKED" : "PASS", errors };
}

/** RF-27: a human run is optional, recorded as `manual`, never presented as agent-executed. */
export function manualRunRecord({ operator, date, sourceRevision, results }) {
  if (!operator || !date || !sourceRevision || !results || typeof results !== "object") throw new Error("a manual run needs operator, date, sourceRevision and per-case results");
  return { executionKind: "manual", operator, date, sourceRevision, results, gateInput: false };
}

/**
 * RF-28 traceability: requirement -> AC -> case -> dataset -> execution -> evidence -> result -> gate decision.
 * Built from the plan and the runner-written ledger entries; a derived rendering, never read as evidence.
 */
export function traceability({ slug, plan, entries, status, revision, manualRuns = [], approvals = [] }) {
  const latest = new Map();
  for (const e of entries) if (e.sourceRevision === revision) latest.set(e.scenarioId, e);
  const rows = [];
  for (const c of plan.criteria) {
    for (const req of c.requirements) {
      for (const k of plan.cases.filter((x) => x.ac.includes(c.id))) {
        const e = latest.get(k.id);
        rows.push({
          requirement: req, criterion: c.id, case: k.id, category: k.category, dataset: k.dataset ?? null,
          execution: e ? { runnerId: e.runnerId, executionKind: e.executionKind, isolation: e.isolation?.tier ?? null, isolated: Boolean(e.isolation?.isolated), ranAt: e.ranAt } : null,
          evidence: e ? { ledgerSeq: e.seq, hash: e.hash, sourceRevision: e.sourceRevision, inputFingerprint: e.inputFingerprint } : null,
          result: e ? e.result : "NOT_RUN",
        });
      }
    }
  }
  const missing = rows.filter((r) => !r.evidence || !r.evidence.sourceRevision || !r.evidence.inputFingerprint || !r.execution?.executionKind);
  return {
    schemaVersion: 1, slug, revision, rows, complete: missing.length === 0,
    gateDecision: { status: status.status, blocking: status.blocking, pending: status.pending ?? [], reasons: status.reasons ?? [] },
    manualRuns, approvals,
  };
}
