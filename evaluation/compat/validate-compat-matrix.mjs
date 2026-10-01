#!/usr/bin/env node
// M2.3: structural validator for evaluation/compat/compat-matrix.json.
// Does NOT re-invoke claude/codex/opencode (those calls are real, cost
// money, and are not deterministic — see README.md's "por que esto no
// corre en pr-gate"). This only checks that every recorded finding has
// real evidence or an explicit, documented fallback: no silent gaps.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { statusFromCounts, exitCodeFor, formatLine } from "../../runtime/lib/result.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const errors = [];
const warnings = [];
function fail(msg) {
  errors.push(msg);
}

const VALID_STATUSES = new Set(["CONFIRMED", "PARTIAL", "NOT_AVAILABLE_FROM_TOOL"]);

let matrix;
try {
  matrix = JSON.parse(readFileSync(join(here, "compat-matrix.json"), "utf8"));
} catch (error) {
  fail(`compat-matrix.json: invalid JSON (${error.message})`);
}

const findings = existsSync(join(here, "findings.md")) ? readFileSync(join(here, "findings.md"), "utf8") : "";
if (!findings) fail("findings.md is missing");

if (matrix) {
  if (matrix.schemaVersion !== 1) fail(`compat-matrix.json: unexpected schemaVersion ${matrix.schemaVersion}`);
  if (!Array.isArray(matrix.checks) || matrix.checks.length === 0) fail("compat-matrix.json: checks[] must be a non-empty array");

  for (const [i, check] of (matrix.checks || []).entries()) {
    const label = `checks[${i}] (${check.id}/${check.tool}/${check.capability})`;
    for (const field of ["id", "tool", "capability", "status", "notes"]) {
      if (!(field in check) || check[field] === undefined) fail(`${label}: missing "${field}"`);
    }
    if (check.status && !VALID_STATUSES.has(check.status)) {
      fail(`${label}: status "${check.status}" is not one of ${[...VALID_STATUSES].join(", ")}`);
    }
    if (check.status === "CONFIRMED" || check.status === "PARTIAL") {
      if (!check.evidence) {
        fail(`${label}: status ${check.status} requires non-null "evidence"`);
      } else {
        const [file, anchor] = check.evidence.split("#");
        if (!existsSync(join(here, "..", "..", file))) {
          fail(`${label}: evidence file "${file}" does not exist`);
        } else if (anchor) {
          // Loose check: every hyphen-separated word of the anchor must appear
          // somewhere in a heading line of findings.md. Not a real markdown
          // slugifier (accents/punctuation make exact slugs unreliable to
          // reconstruct) — a soft signal, not a hard guarantee of the link.
          const headingLines = findings.toLowerCase().split("\n").filter((l) => /^#+\s/.test(l));
          const words = anchor.split("-");
          const matches = headingLines.some((line) => words.every((w) => line.includes(w)));
          if (!matches) {
            fail(`${label}: evidence anchor "${anchor}" has no matching heading in findings.md`);
          }
        }
      }
    }
    if (check.status === "NOT_AVAILABLE_FROM_TOOL") {
      if (check.evidence) warnings.push(`${label}: NOT_AVAILABLE_FROM_TOOL normally has evidence: null (found "${check.evidence}")`);
      if (!check.notes || check.notes.length < 20 || !/fallback/i.test(check.notes)) {
        fail(`${label}: NOT_AVAILABLE_FROM_TOOL requires a documented fallback in "notes"`);
      }
    }
  }
}

// --- fixtures/{claude,codex,opencode} each have at least an AGENTS.md ---
const TOOLS = ["claude", "codex", "opencode"];
for (const tool of TOOLS) {
  const dir = join(here, "fixtures", tool);
  if (!existsSync(dir)) {
    fail(`fixtures/${tool}/ is missing`);
    continue;
  }
  if (!existsSync(join(dir, "AGENTS.md"))) fail(`fixtures/${tool}/AGENTS.md is missing`);
}

// --- every check's "tool" is one of the known tools (or "platform") ---
const KNOWN_TOOLS = new Set([...TOOLS, "platform"]);
for (const check of matrix?.checks || []) {
  if (check.tool && !KNOWN_TOOLS.has(check.tool)) fail(`checks: unknown tool "${check.tool}"`);
}

const status = statusFromCounts({ errors: errors.length, warnings: warnings.length });
console.log(`compat-matrix validation: ${formatLine(status, { errors: errors.length, warnings: warnings.length })}`);
console.log(`  checks: ${matrix?.checks?.length ?? 0}`);
console.log(`  fixtures checked: ${TOOLS.length}`);
for (const w of warnings) console.log(`  WARNING: ${w}`);
for (const e of errors) console.log(`  ERROR: ${e}`);

process.exit(exitCodeFor(status, { strict: true }));
