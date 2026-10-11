#!/usr/bin/env node
// Public SDD commands of a release (`ai-native run -- sdd <command>`), usable from a consumer project:
//   sdd validate <slug> [--level light|normal|full] [--json]   structural check of specs/<slug>/ (exit 1 on errors)
//   sdd status [<slug>] [--level L]                              STATE / PROGRESS / LAST COMPLETED / NEXT / BLOCKERS
//   sdd next <slug>                                              the next pending task of tasks.md
//   sdd mark <slug> <Tn> pending|done|blocked                    set one task state in tasks.md
//   sdd budget [--level L]                                       convergence budget (attempts per task) of a level
// The project is the working directory (or --project). Everything is derived from the artifacts; nothing is written
// except `mark`, which only flips one checkbox. These are thin wrappers over sdd-workflow.mjs / converge.mjs.
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { deriveSddStatus, formatSddStatus, loadWorkflow, parseTasks, persistTaskState, validateSpecFolder } from "./sdd-workflow.mjs";
import { convergenceBudgetFor } from "./converge.mjs";

const SLUG = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/;
const STATES = ["pending", "done", "blocked"];

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
  const flagged = new Set(["--project", "--level"].flatMap((n) => (argv.includes(n) ? [n, flag(n)] : [])));
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
    default:
      console.error("usage: sdd <validate <slug>|status [<slug>]|next <slug>|mark <slug> <Tn> <pending|done|blocked>|budget> [--level light|normal|full] [--project <dir>]");
      return 2;
  }
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) process.exit(main(process.argv.slice(2)));
