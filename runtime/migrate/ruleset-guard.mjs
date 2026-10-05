// Ruleset impact of a migration (canary finding C-2). `migrate apply` retires platform-owned v2 workflows
// (e.g. `.github/workflows/ci.yml`). If the consumer's ruleset REQUIRES a check that only a retired workflow
// produced, that check never reports again and the migration PR is blocked forever, with no hint beforehand.
// `planMigration` calls `checkRulesetImpact` so the risk shows up BEFORE `apply`.
//
// Fail-closed and honest about its limits:
//   * it never edits a ruleset; it only reports, with a recommended action;
//   * a retired workflow it cannot read COMPLETELY (no jobs found, or lines at job-id indentation it did not
//     understand: quoted ids, anchors, odd indentation) is an error, not a pass;
//   * a required check no surviving workflow explains is reported (WILL_DISAPPEAR when a retired workflow produced it,
//     UNKNOWN_SOURCE otherwise: it may come from an external app), never as safe;
//   * when deciding that a check SURVIVES it is conservative: a surviving job named only by an expression (it could be
//     anything), a surviving workflow it cannot read, or one that never runs for a PR (schedule / workflow_dispatch /
//     workflow_call only) does NOT count as a keeper;
//   * the check-context derivation is a line-based reading of `jobs:` (names, matrix, reusable calls). It is a
//     heuristic for GitHub Actions' naming, not a YAML parser.
import { spawnSync } from "node:child_process";

export const CODES = {
  WILL_DISAPPEAR: "RULESET_REQUIRED_CHECK_WILL_DISAPPEAR",
  UNKNOWN_SOURCE: "RULESET_REQUIRED_CHECK_UNKNOWN_SOURCE",
  WORKFLOW_UNREADABLE: "RULESET_WORKFLOW_UNREADABLE",
  UNREADABLE: "RULESET_UNREADABLE",
  NOT_CHECKED: "RULESET_NOT_CHECKED",
};

/** Events whose workflows report checks on the head commit of a PR (`push` counts: same SHA). */
const REPORTING_EVENTS = ["pull_request", "pull_request_target", "push"];

const unquote = (s) => s.trim().replace(/\s+#.*$/, "").replace(/^(["'])(.*)\1$/, "$2");
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Jobs of a workflow file: [{ id, name, uses, matrix }]. Empty when no `jobs:` block can be read.
 * The array has an `unrecognized` property: lines at job-id indentation that were NOT understood (quoted ids, anchors,
 * odd indentation). A file with any of them is only PARTIALLY read, and callers must not trust the job list as complete.
 */
export function parseJobs(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const start = lines.findIndex((l) => /^jobs:\s*(#.*)?$/.test(l));
  const jobs = [];
  jobs.unrecognized = [];
  if (start < 0) return jobs;
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
    // anything else at (or shallower than) job-id indentation is a job we did not understand
    if (/^ {0,2}\S/.test(line)) { jobs.unrecognized.push(line.trim()); current = null; continue; }
    if (!current) continue;
    const name = /^ {4}name:\s*(.+)$/.exec(line);
    if (name) current.name = unquote(name[1]);
    const uses = /^ {4}uses:\s*(.+)$/.exec(line);
    if (uses) current.uses = unquote(uses[1]);
    if (/^ {6}matrix:/.test(line)) current.matrix = true;
  }
  return jobs;
}

/** Event names a workflow triggers on, or null when `on:` cannot be read. */
export function parseTriggers(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const i = lines.findIndex((l) => /^(on|"on"|'on'):/.test(l));
  if (i < 0) return null;
  const events = new Set();
  const first = lines[i].replace(/^(on|"on"|'on'):/, "").replace(/\s+#.*$/, "").trim();
  if (first) for (const w of first.match(/[a-z_]+/g) ?? []) events.add(w);
  for (let j = i + 1; j < lines.length; j += 1) {
    const line = lines[j];
    if (!line.trim() || /^\s*#/.test(line)) continue;
    if (!/^\s/.test(line)) break;
    const key = /^ {2}([a-z_]+):/.exec(line) ?? /^ {2}- *([a-z_]+)\s*$/.exec(line);
    if (key) events.add(key[1]);
  }
  return events.size ? events : null;
}

/** Check contexts a job reports, as a regular expression. `opaque` = a name made only of expressions (could be anything). */
export function contextsOfJob(job) {
  if (job.uses) return [{ pattern: new RegExp(`^${escapeRe(job.id)} / .+$`), source: `${job.id} / <reusable job>`, opaque: false }];
  const base = job.name ?? job.id;
  if (base.includes("${{")) {
    const opaque = base.replace(/\$\{\{.*?\}\}/g, "").replace(/[\s()]/g, "").length === 0;
    const re = base.split(/\$\{\{.*?\}\}/g).map(escapeRe).join(".*");
    return [{ pattern: new RegExp(`^${re}( \\(.*\\))?$`), source: `${base} (expression)`, opaque }];
  }
  if (job.matrix) return [{ pattern: new RegExp(`^${escapeRe(base)}( \\(.*\\))?$`), source: `${base} (matrix)`, opaque: false }];
  return [{ pattern: new RegExp(`^${escapeRe(base)}$`), source: base, opaque: false }];
}

/**
 * All the contexts a set of workflow files can report: { produced: [{ file, source, pattern, opaque }], unreadable, partial }.
 * `unreadable` = no jobs found; `partial` = some lines at job-id indentation were not understood.
 */
export function producedContexts(workflows) {
  const produced = [];
  const unreadable = [];
  const partial = [];
  for (const { path, text } of workflows) {
    const jobs = parseJobs(text);
    if (!jobs.length) unreadable.push(path);
    else if (jobs.unrecognized.length) partial.push({ path, lines: jobs.unrecognized });
    const triggers = parseTriggers(text);
    const reportsOnPr = triggers ? REPORTING_EVENTS.some((e) => triggers.has(e)) : false;
    for (const job of jobs) for (const c of contextsOfJob(job)) produced.push({ file: path, reportsOnPr, ...c });
  }
  return { produced, unreadable, partial };
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
  for (const { path, lines } of gone.partial) {
    findings.push({ severity: "error", code: CODES.WORKFLOW_UNREADABLE, workflow: path, detail: `the retired workflow ${path} was only partially read (not understood: ${lines.slice(0, 3).join(" | ")}); some of its jobs, and so some check contexts, are unknown`, action: "read the workflow by hand and compare ALL its jobs with the ruleset's required checks before applying" });
  }
  for (const path of [...stays.unreadable, ...stays.partial.map((p) => p.path)]) {
    findings.push({ severity: "warning", code: CODES.WORKFLOW_UNREADABLE, workflow: path, detail: `the surviving workflow ${path} could not be read completely; it is NOT counted as a source of any required check`, action: "if a required check really comes from it, the report may over-state what disappears" });
  }
  for (const { context } of required) {
    const keepers = stays.produced.filter((p) => p.reportsOnPr && !p.opaque && p.pattern.test(context));
    if (keepers.length) continue;
    const dying = gone.produced.filter((p) => p.pattern.test(context));
    if (dying.length) {
      findings.push({
        severity: "error", code: CODES.WILL_DISAPPEAR, context, workflow: dying[0].file,
        detail: `required check '${context}' is produced only by ${dying.map((d) => d.file).join(", ")}, which this migration retires: it will never report again and the PR cannot be merged`,
        action: `before merging, change the consumer's ruleset: replace '${context}' by ${proposed.length ? proposed.map((p) => `'${p}'`).join(", ") : "the check the v3 caller produces"} (do not add a fake job named '${context}'); apply with --accept-ruleset-change only once you decided`,
      });
    } else {
      findings.push({ severity: "warning", code: CODES.UNKNOWN_SOURCE, context, detail: `required check '${context}' is not produced by any workflow in the tree that reports on pull requests (an external app?); the migration cannot tell whether it keeps reporting`, action: "confirm its source in the ruleset before merging" });
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
