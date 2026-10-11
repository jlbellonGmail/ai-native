// SDD workflow layer: the executable side of contracts/sdd-workflow.json.
// Pure, dependency-free and read-only. It does not replace ASSESS (assess.mjs)
// or the state machine; it adds the conceptual model on top of them:
//   - validateWorkflow: the contract is consistent with core/, sdd-levels.json
//     and the command bodies (no duplicate canonical sources, no retired names)
//   - selectLevel / classifyWorkUnit: level by risk/scope/reversibility/..., not
//     by file count alone; Task/Feature/Milestone routing for /feature
//   - parseTasks / validateSpecFolder / deriveSddStatus: tasks.md states,
//     artifact consistency and the next command for guided mode
import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const PLATFORM_ROOT = join(here, "..", "..");

export function loadWorkflow(root = PLATFORM_ROOT) {
  return JSON.parse(readFileSync(join(root, "contracts", "sdd-workflow.json"), "utf8"));
}

const readJson = (root, rel) => JSON.parse(readFileSync(join(root, rel), "utf8"));

/** Errors (strings) when the contract disagrees with the rest of the platform. */
export function validateWorkflow(workflow = loadWorkflow(), root = PLATFORM_ROOT) {
  const errors = [];
  const agents = readJson(root, "core/agents.json");
  const sddLevels = readJson(root, "contracts/sdd-levels.json");

  const dupes = (items, label) => {
    const seen = new Set();
    for (const id of items) {
      if (seen.has(id)) errors.push(`duplicate ${label}: ${id}`);
      seen.add(id);
    }
  };
  dupes(workflow.roles.map((r) => r.id), "role");
  dupes(workflow.commands.map((c) => c.name), "command");
  dupes(workflow.workUnits.map((w) => w.id), "work unit");

  for (const role of workflow.roles) {
    if (role.runtimeRole !== null && !agents.roles[role.runtimeRole]) {
      errors.push(`role ${role.id}: runtimeRole '${role.runtimeRole}' is not in core/agents.json`);
    }
  }
  // every spawnable runtime role must be reachable from exactly one conceptual role (no hidden duplicate roles)
  for (const runtime of Object.keys(agents.roles)) {
    const owners = workflow.roles.filter((r) => r.runtimeRole === runtime);
    if (owners.length !== 1) errors.push(`runtime role '${runtime}' is mapped by ${owners.length} conceptual roles (expected 1)`);
  }
  const roleIds = new Set(workflow.roles.map((r) => r.id));
  for (const level of workflow.levels) {
    if (!sddLevels.levels[level.circuitLevel]) errors.push(`level ${level.id}: '${level.circuitLevel}' is not in contracts/sdd-levels.json`);
  }
  for (const unit of workflow.workUnits) {
    if (!workflow.levels.some((l) => l.id === unit.defaultLevel)) errors.push(`work unit ${unit.id}: unknown defaultLevel ${unit.defaultLevel}`);
    for (const inner of unit.contains ?? []) {
      if (!workflow.workUnits.some((w) => w.id === inner)) errors.push(`work unit ${unit.id}: contains unknown '${inner}'`);
    }
  }
  const retired = new Set(workflow.retiredNames);
  for (const command of workflow.commands) {
    if (!roleIds.has(command.role)) errors.push(`command ${command.name}: unknown role '${command.role}'`);
    if (retired.has(command.name)) errors.push(`command ${command.name}: is a retired name`);
    if (command.readOnly && command.mutatesCode) errors.push(`command ${command.name}: cannot be both readOnly and mutatesCode`);
    const writer = workflow.roles.find((r) => r.id === command.role);
    if (command.mutatesCode && writer && writer.writes !== "code-and-tests" && writer.writes !== "state-only") {
      errors.push(`command ${command.name}: role '${command.role}' is not allowed to write code`);
    }
    if (command.mutatesCode && writer?.writes === "state-only" && !command.orchestrates) {
      errors.push(`command ${command.name}: only an orchestrating command may mutate code through a coordinator`);
    }
    if (!existsSync(join(root, command.body))) errors.push(`command ${command.name}: body ${command.body} does not exist`);
    else {
      const body = readFileSync(join(root, command.body), "utf8");
      if (!body.includes("$ARGUMENTS")) errors.push(`command ${command.name}: body does not use $ARGUMENTS`);
      for (const name of retired) {
        if (new RegExp(`(^|[^a-z-])/?${name}([^a-z-]|$)`).test(body)) errors.push(`command ${command.name}: body mentions retired name ${name}`);
      }
    }
  }
  // bodies on disk must be declared (orphan command bodies are dead code)
  const declared = new Set(workflow.commands.map((c) => c.body));
  const bodiesDir = join(root, "core", "commands");
  if (existsSync(bodiesDir)) {
    for (const file of readdirSync(bodiesDir)) {
      if (file.endsWith(".md") && !declared.has(`core/commands/${file}`)) errors.push(`orphan command body: core/commands/${file}`);
    }
  }
  return errors;
}

// --- level and work-unit selection -----------------------------------------

const DIMENSIONS = ["risk", "scope", "irreversibility", "impact", "complexity", "criticality", "uncertainty"];
const FORCE_FULL = ["security", "migration", "breakingChange", "architecture"];

/**
 * signals: each dimension 0 (none) .. 2 (high); booleans security, migration,
 * breakingChange, architecture force FULL. Returns { level, score, reasons }.
 * Deterministic. File count is deliberately NOT an input.
 */
export function selectLevel(signals = {}) {
  const reasons = [];
  for (const key of FORCE_FULL) {
    if (signals[key]) reasons.push(`${key} forces full`);
  }
  if (reasons.length) return { level: "full", score: null, reasons };
  let score = 0;
  for (const key of DIMENSIONS) {
    const value = signals[key] ?? 0;
    if (!Number.isInteger(value) || value < 0 || value > 2) throw new Error(`signal ${key} must be an integer 0..2, got ${value}`);
    score += value;
    if (value === 2) reasons.push(`${key} is high`);
  }
  if (DIMENSIONS.some((key) => signals[key] === 2 && ["risk", "irreversibility", "criticality"].includes(key))) {
    return { level: "full", score, reasons };
  }
  const level = score <= 3 ? "light" : score <= 7 ? "normal" : "full";
  return { level, score, reasons };
}

/**
 * Work unit for /feature: Milestone when several independent capabilities,
 * Feature when it adds a functional capability or needs a design decision,
 * otherwise Task. Never forced to Feature by the command name.
 */
export function classifyWorkUnit({ capabilities = 1, newCapability = false, needsDesign = false, ...signals } = {}) {
  const { level, score, reasons } = selectLevel(signals);
  let workUnit;
  if (capabilities > 1) workUnit = "milestone";
  else if (newCapability || needsDesign) workUnit = "feature";
  else workUnit = "task";
  // a Task never needs the spec/plan/tasks trio; a heavy Task is promoted rather than inflated
  const finalWorkUnit = workUnit === "task" && level === "full" ? "feature" : workUnit;
  const finalLevel = finalWorkUnit === "feature" && level === "light" ? "normal" : level;
  return { workUnit: finalWorkUnit, level: workUnit === "milestone" ? "full" : finalLevel, score, reasons };
}

// --- tasks.md ---------------------------------------------------------------

const TASK_LINE = /^- \[([ x!])\] \*\*(T\d+)\.\s*(.+?)\.?\*\*\s*(.*)$/;
const STATE = { " ": "pending", x: "done", "!": "blocked" };

/** Parses tasks.md into [{ id, title, state, requirements, doneWhen }]. Unparsable "- [" lines become { invalid }. */
export function parseTasks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tasks = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/^- \[/.test(line)) continue;
    const match = TASK_LINE.exec(line);
    if (!match) {
      tasks.push({ invalid: line.trim(), line: i + 1 });
      continue;
    }
    const doneWhen = /^\s+- (?:Done when|Hecho cuando):\s*(.+)$/.exec(lines[i + 1] ?? "");
    tasks.push({
      id: match[2],
      title: match[3],
      state: STATE[match[1]],
      requirements: match[4].split(/[,\s]+/).filter((token) => /^[A-Z]+-\d+$/.test(token)),
      doneWhen: doneWhen ? doneWhen[1].trim() : "",
      line: i + 1,
    });
  }
  return tasks;
}

const REQUIREMENT_DEF = /^\s*[-*]?\s*\**([A-Z]+-\d+)\**[.:]/gm;
export const requirementIds = (specMarkdown) => [...specMarkdown.matchAll(REQUIREMENT_DEF)].map((m) => m[1]);

const read = (dir, file) => (existsSync(join(dir, file)) ? readFileSync(join(dir, file), "utf8") : null);

/** Errors for one specs/NNN-slug folder at a level (`light` needs nothing). */
export function validateSpecFolder(dir, { level = "normal" } = {}) {
  const errors = [];
  const spec = read(dir, "spec.md");
  const plan = read(dir, "plan.md");
  const tasks = read(dir, "tasks.md");
  if (level === "light") return errors;
  if (spec === null) errors.push("missing spec.md");
  if (plan !== null && spec === null) errors.push("plan.md exists without spec.md");
  if (tasks !== null && plan === null) errors.push("tasks.md exists without plan.md");
  if (level === "full" && spec !== null && /\[NEEDS CLARIFICATION\]/.test(spec)) errors.push("spec.md has open [NEEDS CLARIFICATION] markers");
  if (tasks !== null) {
    const parsed = parseTasks(tasks);
    const known = spec ? new Set(requirementIds(spec)) : null;
    const seen = new Set();
    for (const task of parsed) {
      if (task.invalid) {
        errors.push(`tasks.md:${task.line}: invalid task line (states are [ ], [x], [!])`);
        continue;
      }
      if (seen.has(task.id)) errors.push(`tasks.md:${task.line}: duplicate task id ${task.id}`);
      seen.add(task.id);
      if (!task.doneWhen) errors.push(`tasks.md:${task.line}: ${task.id} has no "Done when" criterion`);
      if (known && known.size) {
        for (const ref of task.requirements) {
          if (!known.has(ref)) errors.push(`tasks.md:${task.line}: ${task.id} cites ${ref}, which is not defined in spec.md`);
        }
      }
    }
    if (parsed.filter((t) => !t.invalid).length === 0) errors.push("tasks.md has no tasks");
  }
  return errors;
}

/**
 * Phase and next command from the artifacts only. `level` light has no folder:
 * the answer is the Task flow. Returns { phase, next, tasks: { done, pending, blocked, total }, errors }.
 */
export function deriveSddStatus(dir, slug = "NNN-slug", { level = "normal" } = {}) {
  const errors = validateSpecFolder(dir, { level });
  const spec = read(dir, "spec.md");
  const plan = read(dir, "plan.md");
  const tasksMd = read(dir, "tasks.md");
  const counts = { done: 0, pending: 0, blocked: 0, total: 0 };
  const result = (phase, next) => ({ phase, next, tasks: counts, errors });
  // a light Task has no spec folder: the answer is the Task flow, never /sdd-spec
  if (level === "light") return result("implement", "Task flow: state objective, scope and acceptance, implement with a sufficient test, record evidence");
  if (spec === null) return result("specify", `/sdd-spec ${slug} "<idea>"`);
  if (/\[NEEDS CLARIFICATION\]/.test(spec)) return result("clarify", `/sdd-clarify ${slug}`);
  if (plan === null) return result("plan", `/sdd-plan ${slug}`);
  if (tasksMd === null) return result("tasks", `/sdd-tasks ${slug}`);
  const tasks = parseTasks(tasksMd).filter((t) => !t.invalid);
  for (const task of tasks) {
    counts[task.state]++;
    counts.total++;
  }
  const blocked = tasks.find((t) => t.state === "blocked");
  if (blocked) return result("implement", `unblock ${blocked.id}, then /sdd-implement ${slug} ${blocked.id}`);
  const pending = tasks.find((t) => t.state === "pending");
  if (pending) return result("implement", `/sdd-implement ${slug} ${pending.id} (or /sdd-implement-all ${slug})`);
  return result(counts.total === 0 ? "tasks" : "validate", counts.total === 0 ? `/sdd-tasks ${slug}` : `/sdd-validate ${slug}`);
}

/** tasks.md with the checkbox of `id` set to `state` (pending|done|blocked); throws when the task does not exist. */
export function markTaskState(markdown, id, state) {
  const box = { pending: " ", done: "x", blocked: "!" }[state];
  if (box === undefined) throw new Error(`invalid task state: ${state}`);
  let found = false;
  const out = markdown.split(/(\r?\n)/).map((line) => {
    const match = TASK_LINE.exec(line);
    if (!match || match[2] !== id) return line;
    found = true;
    return line.replace(/^- \[[ x!]\]/, `- [${box}]`);
  });
  if (!found) throw new Error(`task not found: ${id}`);
  return out.join("");
}

/** Writes the new state of `id` into the tasks.md at `tasksPath` (atomic enough for a single writer: read, replace, write). */
export function persistTaskState(tasksPath, id, state) {
  // write-then-rename: an interrupted write never leaves a truncated tasks.md
  const next = markTaskState(readFileSync(tasksPath, "utf8"), id, state);
  writeFileSync(`${tasksPath}.tmp`, next);
  renameSync(`${tasksPath}.tmp`, tasksPath);
}
