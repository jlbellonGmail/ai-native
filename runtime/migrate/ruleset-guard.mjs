// Ruleset impact of a migration (canary finding C-2). `migrate apply` retires platform-owned v2 workflows
// (e.g. `.github/workflows/ci.yml`). If the consumer's ruleset REQUIRES a check that only a retired workflow
// produced, that check never reports again and the migration PR is blocked forever, with no hint beforehand.
// `planMigration` calls `checkRulesetImpact` so the risk shows up BEFORE `apply`.
//
// Fail-closed and honest about its limits:
//   * it never edits a ruleset; it only reports, with a recommended action;
//   * a retired workflow it cannot read (no jobs found) is an error, not a pass;
//   * a required check no workflow in the tree explains is reported as unknown (it may come from an external
//     app), never as safe;
//   * the check-context derivation is a line-based reading of `jobs:` (names, matrix, reusable calls). It is
//     a heuristic for GitHub Actions' naming, not a YAML parser: a matrix or an expression in `name:` is matched
//     as a pattern and reported as such.
import { spawnSync } from "node:child_process";

export const CODES = {
  WILL_DISAPPEAR: "RULESET_REQUIRED_CHECK_WILL_DISAPPEAR",
  UNKNOWN_SOURCE: "RULESET_REQUIRED_CHECK_UNKNOWN_SOURCE",
  WORKFLOW_UNREADABLE: "RULESET_WORKFLOW_UNREADABLE",
  UNREADABLE: "RULESET_UNREADABLE",
  NOT_CHECKED: "RULESET_NOT_CHECKED",
};

const unquote = (s) => s.trim().replace(/\s+#.*$/, "").replace(/^(["'])(.*)\1$/, "$2");
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Jobs of a workflow file: [{ id, name, uses, matrix }]. Empty when no `jobs:` block can be read. */
export function parseJobs(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const start = lines.findIndex((l) => /^jobs:\s*(#.*)?$/.test(l));
  if (start < 0) return [];
  const jobs = [];
  let current = null;
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim() || /^\s*#/.test(line)) continue;
    if (!/^\s/.test(line)) break; // next top-level key: the jobs block is over
    const id = /^ {2}([A-Za-z_][\w-]*):\s*(#.*)?$/.exec(line);
    if (id) {
      current = { id: id[1], name: null, uses: null, matrix: false };
      jobs.push(current);
      continue;
    }
    if (!current) continue;
    const name = /^ {4}name:\s*(.+)$/.exec(line);
    if (name) current.name = unquote(name[1]);
    const uses = /^ {4}uses:\s*(.+)$/.exec(line);
    if (uses) current.uses = unquote(uses[1]);
    if (/^ {6}matrix:/.test(line)) current.matrix = true;
  }
  return jobs;
}

/** Check contexts a job reports, as a literal or a regular expression. */
export function contextsOfJob(job) {
  if (job.uses) return [{ pattern: new RegExp(`^${escapeRe(job.id)} / .+$`), source: `${job.id} / <reusable job>` }];
  const base = job.name ?? job.id;
  if (base.includes("${{")) {
    const re = base.split(/\$\{\{.*?\}\}/g).map(escapeRe).join(".*");
    return [{ pattern: new RegExp(`^${re}( \\(.*\\))?$`), source: `${base} (expression)` }];
  }
  if (job.matrix) return [{ pattern: new RegExp(`^${escapeRe(base)}( \\(.*\\))?$`), source: `${base} (matrix)` }];
  return [{ pattern: new RegExp(`^${escapeRe(base)}$`), source: base }];
}

/** All the contexts a set of workflow files can report: [{ file, source, pattern }]. */
export function producedContexts(workflows) {
  const out = [];
  const unreadable = [];
  for (const { path, text } of workflows) {
    const jobs = parseJobs(text);
    if (!jobs.length) { unreadable.push(path); continue; }
    for (const job of jobs) for (const c of contextsOfJob(job)) out.push({ file: path, ...c });
  }
  return { produced: out, unreadable };
}

/**
 * @param {object} o
 * @param {Array<{context: string, integrationId?: number}>} o.required  required status checks of the consumer's ruleset
 * @param {Array<{path: string, text: string}>} o.retiring               workflows the migration deletes
 * @param {Array<{path: string, text: string}>} o.surviving              workflows that stay (kept or new, incl. the L3 caller)
 * @param {string[]} [o.proposed]                                        canonical checks the migration introduces
 */
export function checkRulesetImpact({ required, retiring, surviving, proposed = [] }) {
  const findings = [];
  const gone = producedContexts(retiring);
  const stays = producedContexts(surviving);
  for (const path of gone.unreadable) {
    findings.push({ severity: "error", code: CODES.WORKFLOW_UNREADABLE, workflow: path, detail: `could not read the jobs of the retired workflow ${path}; its check contexts are unknown`, action: "read the workflow by hand and compare its jobs with the ruleset's required checks before applying" });
  }
  for (const { context } of required) {
    const keepers = stays.produced.filter((p) => p.pattern.test(context));
    if (keepers.length) continue;
    const dying = gone.produced.filter((p) => p.pattern.test(context));
    if (dying.length) {
      findings.push({
        severity: "error", code: CODES.WILL_DISAPPEAR, context, workflow: dying[0].file,
        detail: `required check '${context}' is produced only by ${dying.map((d) => d.file).join(", ")}, which this migration retires: it will never report again and the PR cannot be merged`,
        action: `before merging, change the consumer's ruleset: replace '${context}' by ${proposed.length ? proposed.map((p) => `'${p}'`).join(", ") : "the check the v3 caller produces"} (do not add a fake job named '${context}'); apply with --accept-ruleset-change only once you decided`,
      });
    } else {
      findings.push({ severity: "warning", code: CODES.UNKNOWN_SOURCE, context, detail: `required check '${context}' is not produced by any workflow in the tree (an external app?); the migration cannot tell whether it keeps reporting`, action: "confirm its source in the ruleset before merging" });
    }
  }
  const requiredNames = new Set(required.map((r) => r.context));
  const toPropose = proposed.filter((p) => !requiredNames.has(p));
  return { status: findings.some((f) => f.severity === "error") ? "FAIL" : "PASS", findings, proposed: toPropose, required: required.map((r) => r.context) };
}

/** Normalises what the GitHub API or a saved file returns into [{context, integrationId}]. */
export function requiredChecksFrom(payload) {
  const rules = [];
  const visit = (x) => {
    if (Array.isArray(x)) x.forEach(visit);
    else if (x && typeof x === "object") {
      if (x.type === "required_status_checks") rules.push(x);
      else if (Array.isArray(x.rules)) x.rules.forEach(visit);
      else if (Array.isArray(x.required_status_checks)) rules.push({ parameters: x });
      else if (Array.isArray(x.contexts)) rules.push({ parameters: { required_status_checks: x.contexts.map((context) => ({ context })) } });
    }
  };
  visit(payload);
  const out = [];
  for (const r of rules) {
    for (const c of r.parameters?.required_status_checks ?? []) out.push({ context: c.context, integrationId: c.integration_id ?? c.app_id ?? null });
  }
  return out;
}

const gh = (args) => spawnSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/** Live read of the checks required on `branch`. Returns {required} or {error}. `run` is injectable for tests. */
export function fetchRequiredChecks({ repo, branch, run = gh }) {
  // owner: GitHub login charset; name: no "." / ".." (they would walk the API path)
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]*)\/(?!\.{1,2}$)[\w.-]+$/.test(repo ?? "")) return { error: `invalid consumer repo '${repo}' (expected owner/name)` };
  const rules = run(["api", `repos/${repo}/rules/branches/${encodeURIComponent(branch)}`]);
  if (rules.error || rules.status !== 0) return { error: `could not read the rules of ${repo}@${branch}: ${(rules.stderr || rules.error?.message || "gh failed").trim().split("\n")[0]}` };
  let required;
  try {
    required = requiredChecksFrom(JSON.parse(rules.stdout));
  } catch {
    return { error: `unreadable ruleset response for ${repo}@${branch}` };
  }
  // classic branch protection can also require checks; 404 means there is none
  const classic = run(["api", `repos/${repo}/branches/${encodeURIComponent(branch)}/protection/required_status_checks`]);
  if (!classic.error && classic.status === 0) {
    try {
      required.push(...requiredChecksFrom(JSON.parse(classic.stdout)));
    } catch {
      return { error: `unreadable branch-protection response for ${repo}@${branch}` };
    }
  } else if (!/404|Not Found|not protected/i.test(`${classic.stderr ?? ""}${classic.stdout ?? ""}`)) {
    return { error: `could not read the branch protection of ${repo}@${branch}: ${(classic.stderr || classic.error?.message || "gh failed").trim().split("\n")[0]}` };
  }
  return { required };
}
