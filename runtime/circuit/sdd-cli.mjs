#!/usr/bin/env node
// Public SDD commands of a release (`ai-native run -- sdd <command>`), usable from a consumer project:
//   sdd validate <slug> [--level light|normal|full] [--json]   structural check of specs/<slug>/ (exit 1 on errors)
//   sdd status [<slug>] [--level L]                              STATE / PROGRESS / LAST COMPLETED / NEXT / BLOCKERS
//   sdd next <slug>                                              the next pending task of tasks.md
//   sdd mark <slug> <Tn> pending|done|blocked                    set one task state in tasks.md
//   sdd budget [--level L]                                       convergence budget (attempts per task) of a level
//   sdd review begin <slug> --base <ref>                         bind a review to the current change: nonce, revision, packet, delegation prompt
//   sdd review validate <slug> --base <ref> --command "<cmd>"    run one validation command, record its exit code on this revision
//   sdd review record <slug> --base <ref> --nonce <n> --kind independent [--findings <n>] [--tests "<summary>"]
//   sdd review record <slug> --base <ref> --nonce <n> --kind self --verdict <V> [--runtime <id>] [--findings <n>]
//   sdd review status <slug> --base <ref> [--json]               separated results; APPROVED only with an attested independent PASS
//   sdd review receipt <runtime>                                 RUNTIME HOOK ONLY (stdin: the runtime's record of a finished reviewer)
// An independent review takes its verdict, revision, agent and execution from the runtime receipt its adapter
// verifies (runtime/adapters/review-evidence.mjs); `--execution`, `--agent`, `--validation` and friends are refused.
// The project is the working directory (or --project). Everything is derived from the artifacts; nothing is written
// except `mark`, which only flips one checkbox, `review record`, which appends one line to specs/<slug>/reviews.jsonl,
// and the platform's review state in the git dir (`begin`, `validate`, `receipt`).
// These are thin wrappers over sdd-workflow.mjs / converge.mjs / review-ledger.mjs.
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveSddStatus, formatSddStatus, loadWorkflow, parseTasks, persistTaskState, validateSpecFolder } from "./sdd-workflow.mjs";
import { convergenceBudgetFor } from "./converge.mjs";
import { formatReviewOutcome } from "./independent-review.mjs";
import { beginReview, captureReceipt, recordReview, reviewStatus, runValidation } from "./review-ledger.mjs";
import { REVIEW_ATTESTERS } from "../adapters/review-evidence.mjs";
import { checkChangeAgainstBase } from "../policy/hitl.mjs";

const SLUG = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/;
const STATES = ["pending", "done", "blocked"];
const VALUE_FLAGS = ["--project", "--level", "--base", "--nonce", "--kind", "--verdict", "--runtime", "--findings", "--tests", "--environment", "--command"];
// declarations that once claimed what only runtime evidence can show: refused, never silently ignored
const TRUST_FLAGS = ["--agent", "--execution", "--validation", "--inheritsBuilderContext", "--invocation", "--isolation"];
const GATE_RANK = { none: 0, "final-only": 1, required: 2 };

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

/** specs/<slug> inside the project; the slug is a single path segment and the real path must stay under specs/. */
function specDir(project, slug) {
  if (!slug || !SLUG.test(slug)) fail(`invalid spec slug ${JSON.stringify(slug)} (expected NNN-slug)`);
  const root = join(project, "specs");
  const dir = join(root, slug);
  if (existsSync(dir) && !realpathSync(dir).startsWith(realpathSync(root) + sep)) fail(`specs/${slug} resolves outside specs/`);
  return dir;
}

function levelArg(value) {
  const workflow = loadWorkflow();
  const level = value ?? "normal";
  if (!workflow.levels.some((l) => l.id === level)) fail(`unknown level ${JSON.stringify(level)} (${workflow.levels.map((l) => l.id).join("|")})`);
  return level;
}

export function main(argv, cwd = process.cwd()) {
  const flag = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const project = resolve(flag("--project") ?? cwd);
  const flagged = new Set(VALUE_FLAGS.flatMap((n) => (argv.includes(n) ? [n, flag(n)] : [])));
  const [command, ...positional] = argv.filter((a) => !a.startsWith("--") && !flagged.has(a));

  switch (command) {
    case "validate": {
      const slug = positional[0];
      const dir = specDir(project, slug);
      if (!existsSync(dir)) fail(`specs/${slug} does not exist`);
      const level = levelArg(flag("--level"));
      const errors = validateSpecFolder(dir, { level });
      if (argv.includes("--json")) console.log(JSON.stringify({ slug, level, ok: errors.length === 0, errors }, null, 2));
      else if (errors.length) errors.forEach((e) => console.error(`FAIL: ${e}`));
      else console.log(`PASS: specs/${slug} is structurally valid at level ${level}`);
      return errors.length ? 1 : 0;
    }
    case "status": {
      const level = levelArg(flag("--level"));
      const slugs = positional[0] ? [positional[0]] : existsSync(join(project, "specs")) ? readdirSync(join(project, "specs"), { withFileTypes: true }).filter((e) => e.isDirectory() && SLUG.test(e.name)).map((e) => e.name) : [];
      if (!slugs.length) {
        console.log("no specs/ folders: start with /feature \"<goal>\"");
        return 0;
      }
      for (const slug of slugs) {
        if (slugs.length > 1) console.log(`# ${slug}`);
        console.log(formatSddStatus(deriveSddStatus(specDir(project, slug), slug, { level })));
      }
      return 0;
    }
    case "next": {
      const dir = specDir(project, positional[0]);
      const tasksPath = join(dir, "tasks.md");
      if (!existsSync(tasksPath)) fail(`specs/${positional[0]}/tasks.md does not exist`);
      const tasks = parseTasks(readFileSync(tasksPath, "utf8"));
      if (tasks.some((t) => t.invalid)) fail("tasks.md has invalid task lines: run `sdd validate` first");
      const blocked = tasks.find((t) => t.state === "blocked");
      if (blocked) {
        console.log(`BLOCKED ${blocked.id}. ${blocked.title}`);
        return 1;
      }
      const next = tasks.find((t) => t.state === "pending");
      console.log(next ? `${next.id}. ${next.title}${next.doneWhen ? `\nDone when: ${next.doneWhen}` : ""}` : "none pending");
      return 0;
    }
    case "mark": {
      const [slug, id, state] = positional;
      const dir = specDir(project, slug);
      if (!STATES.includes(state)) fail(`state must be one of ${STATES.join("|")}`);
      if (!id || !/^T\d+$/.test(id)) fail(`invalid task id ${JSON.stringify(id)} (expected T<number>)`);
      try {
        persistTaskState(join(dir, "tasks.md"), id, state);
      } catch (error) {
        fail(error.message);
      }
      console.log(`PASS: ${id} -> ${state}`);
      return 0;
    }
    case "budget": {
      const workflow = loadWorkflow();
      const level = levelArg(flag("--level"));
      const depth = workflow.levels.find((l) => l.id === level).circuitLevel;
      console.log(`${level} (${depth}): ${convergenceBudgetFor(depth)} attempts per task`);
      return 0;
    }
    case "review": {
      const [sub, slug] = positional;
      if (sub === "receipt") {
        // called by a runtime hook: never blocks the runtime (always exit 0); nothing here is trusted until verified
        try {
          const captured = captureReceipt(project, slug, readFileSync(0, "utf8"), { attesters: REVIEW_ATTESTERS });
          console.error(`ai-native: review receipt stored for ${captured.slug} (${captured.nonce})`);
        } catch (error) {
          console.error(`ai-native: no review receipt: ${error.message}`);
        }
        return 0;
      }
      const declared = TRUST_FLAGS.filter((f) => argv.some((a) => a === f || a.startsWith(`${f}=`)));
      if (declared.length) fail(`${declared.join(", ")}: not accepted. Agent, execution, isolation and validation come from runtime evidence and from \`sdd review validate\`, never from a declaration`);
      // `--flag=value` would be read as no flag at all: refused, never silently ignored
      const inline = argv.filter((a) => /^--[\w-]+=/.test(a));
      if (inline.length) fail(`${inline.join(", ")}: write \`--flag value\`, not \`--flag=value\``);
      const dir = specDir(project, slug);
      if (!existsSync(dir)) fail(`specs/${slug} does not exist`);
      const base = flag("--base");
      if (!base) fail("--base <ref> is required: a review is bound to the change against the branch it merges into");
      try {
        if (sub === "begin") {
          const started = beginReview(project, slug, { base });
          console.log([`REVIEW_NONCE: ${started.nonce}`, `REVISION: ${started.revision}`, `PACKET: ${started.packet}`, `CHANGED_PATHS: ${started.paths}`, `DELEGATION_PROMPT: ${started.prompt}`].join("\n"));
          return 0;
        }
        if (sub === "validate") {
          const run = runValidation(project, slug, { base, command: flag("--command") });
          const ok = run.exitCode === 0 && run.revisionAfter === run.revision;
          console.log([`VALIDATION_RUN: ${ok ? "PASS" : "FAIL"} (exit ${run.exitCode}) ${run.command}`, `REVISION: ${run.revision}`, ...(run.revisionAfter === run.revision ? [] : ["the command changed the change it validated: run it again on the new revision"])].join("\n"));
          if (!ok) console.log(run.outputTail);
          return ok ? 0 : 1;
        }
        if (sub === "record") {
          const record = recordReview(project, slug, {
            base, nonce: flag("--nonce"), kind: flag("--kind"), verdict: flag("--verdict") ?? null, runtime: flag("--runtime") ?? null,
            findings: flag("--findings") ?? 0, tests: flag("--tests") ?? null, attesters: REVIEW_ATTESTERS,
          });
          console.log(`PASS: recorded ${record.kind} review ${record.verdict} of ${record.reviewedRevision} in specs/${slug}/reviews.jsonl${record.evidence ? ` (runtime evidence: ${record.evidence.runtime}/${record.evidence.agent}, ${record.evidence.execution})` : ""}`);
          return 0;
        }
        if (sub === "status") {
          // the gate a human must pass comes from the same rule as `hitl`; only an independent approval can show a lighter one
          const units = checkChangeAgainstBase({ project, base, environment: flag("--environment") ?? "development" }).units;
          const policyGate = units.every((u) => u.ok) ? units.map((u) => u.gate).sort((a, b) => GATE_RANK[b] - GATE_RANK[a])[0] : "required";
          const status = reviewStatus(project, slug, { base, policyGate, attesters: REVIEW_ATTESTERS });
          const { last } = status;
          const lastLine = last
            ? `${last.kind} ${last.verdict}${last.evidence ? ` attested by ${last.evidence.runtime}/${last.evidence.agent} (${last.evidence.execution})` : ""} on ${last.reviewedRevision === status.revision ? "this revision" : "an older revision (stale)"}`
            : "none";
          if (argv.includes("--json")) console.log(JSON.stringify(status, null, 2));
          else {
            console.log([
              formatReviewOutcome(status.outcome),
              `REVISION: ${status.revision}`,
              // what an approval covers: the change against this base, as the caller chose it
              `BASE: ${status.base.ref} (merge-base ${status.base.sha.slice(0, 12)}, ${status.base.paths} changed paths)`,
              `VALIDATION_RUNS: ${status.validation.runs.length ? status.validation.runs.map((r) => `${r.exitCode === 0 ? "PASS" : "FAIL"} ${r.command}`).join("; ") : "none on this revision"}`,
              `LAST_REVIEW: ${lastLine}`,
              ...(status.unattested.length ? [`UNATTESTED_RECORDS: ${status.unattested.length} (ignored for approval)`] : []),
            ].join("\n"));
          }
          if (status.coherence.length) fail(`incoherent review state: ${status.coherence.join("; ")}`);
          return 0;
        }
      } catch (error) {
        fail(error.message);
      }
      fail("usage: sdd review <begin|validate|record|status> <slug> --base <ref> ... | sdd review receipt <runtime>");
      return 2;
    }
    default:
      console.error("usage: sdd <validate <slug>|status [<slug>]|next <slug>|mark <slug> <Tn> <pending|done|blocked>|budget|review <begin|validate|record|status> <slug> --base <ref>> [--level light|normal|full] [--project <dir>]");
      return 2;
  }
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) process.exit(main(process.argv.slice(2)));
