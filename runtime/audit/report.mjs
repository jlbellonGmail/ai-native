// .audit reports and exact-commit certification (M4.5, AUD-04;
// PAR-AUDIT-VALIDITY). Rule from the architecture decision: an audit of
// commit X is NOT a permanent certification of the repository. A report
// is accepted as current evidence only when:
//   1. its front matter validates against contracts/audit-report.schema.json
//      (targetCommit is mandatory and a full 40-hex SHA);
//   2. targetCommit exists in the repository being certified;
//   3. the candidate commit IS targetCommit, or is a descendant whose NET
//      difference from targetCommit touches only `.audit/**` and
//      `STATUS.md` (flat tree diff on purpose: an intermediate commit that
//      changed code and a later one that reverted it nets to nothing, and
//      a code change hidden between two audit-only commits still shows).
// Anything else -> the report is STALE and never satisfies a gate.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../lib/schema-lite.mjs";
import { isAncestor, diffNameOnly, GitError } from "../lib/git.mjs";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const reportSchema = JSON.parse(readFileSync(join(here, "..", "..", "contracts", "audit-report.schema.json"), "utf8"));

export const ALLOWED_AFTER_AUDIT = [/^\.audit\//, /^STATUS\.md$/];

function scalar(raw) {
  const v = raw.trim();
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.startsWith("[") && v.endsWith("]")) {
    return v.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  }
  return v.replace(/^["']|["']$/g, "");
}

/**
 * Parses the YAML subset report front matter uses: `key: scalar`,
 * one-level nested maps (`platform:` / `tool:` with indented children),
 * inline lists. Returns {data, body} or {error}.
 */
export function parseFrontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { error: "report has no front matter (--- block) at the top" };
  const data = {};
  let current = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const nested = /^[ \t]+([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (nested) {
      if (!current) return { error: `indented key without a parent: ${line.trim()}` };
      data[current][nested[1]] = scalar(nested[2]);
      continue;
    }
    const top = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!top) return { error: `unparseable front matter line: ${line.trim()}` };
    if (top[2] === "") {
      data[top[1]] = {};
      current = top[1];
    } else {
      data[top[1]] = scalar(top[2]);
      current = null;
    }
  }
  return { data, body: m[2] };
}

export function validateReport(text) {
  const parsed = parseFrontMatter(text);
  if (parsed.error) return { errors: [parsed.error] };
  const errors = validate(parsed.data, reportSchema).map((e) => `front matter: ${e}`);
  if (typeof parsed.data.date === "string" && Number.isNaN(Date.parse(parsed.data.date))) errors.push("front matter: date is not a valid date-time");
  return { errors, report: errors.length ? null : parsed.data };
}

function commitExists(root, sha) {
  return spawnSync("git", ["cat-file", "-e", `${sha}^{commit}`], { cwd: root }).status === 0;
}

/**
 * @returns {{status: "CURRENT"|"STALE"|"INVALID", reason: string, changed?: string[]}}
 */
export function certifyExactCommit({ root, report, candidate }) {
  if (!/^[0-9a-f]{40}$/.test(candidate ?? "")) return { status: "INVALID", reason: "candidate must be a full 40-hex commit SHA" };
  const target = report.targetCommit;
  if (!commitExists(root, target)) return { status: "INVALID", reason: `targetCommit ${target} does not exist in this repository` };
  if (!commitExists(root, candidate)) return { status: "INVALID", reason: `candidate ${candidate} does not exist in this repository` };
  if (target === candidate) return { status: "CURRENT", reason: "audited commit is the candidate" };
  if (!isAncestor(root, target, candidate)) return { status: "STALE", reason: "targetCommit is not an ancestor of the candidate" };
  let changed;
  try {
    changed = diffNameOnly(root, target, candidate);
  } catch (error) {
    if (error instanceof GitError) return { status: "INVALID", reason: error.message };
    throw error;
  }
  const outside = changed.filter((f) => !ALLOWED_AFTER_AUDIT.some((re) => re.test(f)));
  if (outside.length) return { status: "STALE", reason: `candidate differs from the audited commit outside .audit/** and STATUS.md: ${outside.slice(0, 5).join(", ")}`, changed: outside };
  return { status: "CURRENT", reason: "only .audit/** and STATUS.md changed since the audited commit", changed };
}
