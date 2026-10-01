// Work Unit identity: Feature / Milestone / Maintenance (M3.2, CIR-01,
// CIR-22; PAR-WU-FEATURE, PAR-WU-MILESTONE, PAR-MAINTENANCE) and the
// ROADMAP.md contract it resolves against (STA-01, PAR-ROADMAP; see
// contracts/roadmap.md, the prose contract this module implements).
// Ported from TEMPLATE v2.0.5's workunit-lib.ps1.
//
// contracts/roadmap.md note carried forward unchanged: v3 does not
// persist a `[-]` "ready" ROADMAP state. An item is Pending (`[ ]` or the
// read-compat alias `[~]`) until the PR that marks it `[x]` merges
// (PAR-CLOSURE-BY-MERGE) -- so the state set here is Pending/Done/
// Missing/Ambiguous, one fewer than TEMPLATE v2.0.5's Pending/Ready/Done.

export const FEATURE_SLUG_PATTERN = /^[0-9]{2}-[a-z0-9]+(-[a-z0-9]+)*$/;
export const MAINTENANCE_SLUG_PATTERN = /^T[0-9]{2}-[a-z0-9]+(-[a-z0-9]+)*$/;
export const MILESTONE_SLUG_PATTERN = /^(?!\d{2}-)[a-z0-9]+(-[a-z0-9]+)*$/;

const AUXILIARY_MAINTENANCE_PATTERN = /(status|docs?|housekeeping|cleanup|close|reconcile|sync|sincron|lifecycle)/i;

function slugPatternFor(mode) {
  if (mode === "Feature") return FEATURE_SLUG_PATTERN;
  if (mode === "Maintenance") return MAINTENANCE_SLUG_PATTERN;
  if (mode === "Milestone") return MILESTONE_SLUG_PATTERN;
  throw new Error(`unknown mode: ${mode}`);
}

/** Validates a slug against its mode's identity pattern (contracts/roadmap.md). */
export function assertValidSlug(mode, slug) {
  if (!slugPatternFor(mode).test(slug)) {
    throw new Error(`invalid ${mode} slug '${slug}': does not match ${slugPatternFor(mode)}`);
  }
}

/** branch / runDir for a Work Unit, given mode/slug/version. */
export function getWorkUnitInfo(mode, slug, { version = "" } = {}) {
  assertValidSlug(mode, slug);
  const versionPrefix = version ? `${version}-` : "";
  const runPrefix = version ? `runs/${version}` : "runs";
  if (mode === "Milestone") {
    return {
      mode,
      slug,
      branch: `milestone/${versionPrefix}${slug}`,
      runDir: version ? `${runPrefix}/milestone-${slug}` : `runs/milestone-${slug}`,
      manifestPath: version ? `${runPrefix}/milestone-${slug}/work-unit.json` : `runs/milestone-${slug}/work-unit.json`,
    };
  }
  const kind = mode === "Maintenance" ? "maintenance" : "feature";
  return {
    mode,
    slug,
    branch: `${kind}/${versionPrefix}${slug}`,
    runDir: `${runPrefix}/${slug}`,
    manifestPath: null,
  };
}

// --- ROADMAP.md item state (STA-01, PAR-ROADMAP) ---

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Pending/Done/Missing/Ambiguous for a single ROADMAP.md item slug.
 * `[ ]` and `[~]` both count as Pending (`[~]` is a read-only compat
 * alias, contracts/roadmap.md); `[x]` is Done. Multiple exact matches is
 * Ambiguous, zero is Missing -- the caller decides whether that is fatal.
 */
export function getItemState(content, slug) {
  const escaped = escapeRegExp(slug);
  const pendingCount = (content.match(new RegExp(`^- \\[[ ~]\\] ${escaped}(?=\\s|$).*$`, "gm")) || []).length;
  const doneCount = (content.match(new RegExp(`^- \\[x\\] ${escaped}(?=\\s|$).*$`, "gm")) || []).length;
  const total = pendingCount + doneCount;
  if (total === 0) return "Missing";
  if (total > 1) return "Ambiguous";
  return pendingCount === 1 ? "Pending" : "Done";
}

/**
 * Transactional, read-only precondition check: every item in `items`
 * must be in one of `fromStates`, or nothing is considered valid to
 * mutate (the caller performs the actual mutation only after this
 * doesn't throw, so a partial mutation never happens).
 */
export function assertItemsTransition(content, items, fromStates, toStateLabel) {
  if (items.length === 0) {
    throw new Error("assertItemsTransition requires at least one item");
  }
  const problems = [];
  for (const item of items) {
    const actual = getItemState(content, item);
    if (!fromStates.includes(actual)) {
      problems.push(`${item} -> current state: ${actual} (expected one of: ${fromStates.join(", ")})`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`Invalid ROADMAP.md transition to ${toStateLabel}. No item was modified.\n${problems.join("\n")}`);
  }
}

/**
 * `[ ]`/`[~]` -> `[x]` for every item in `items` (PAR-CLOSURE-BY-MERGE:
 * this is the only ROADMAP.md mutation v3 performs; there is no
 * intermediate persisted "ready" state). Pure: returns the new content,
 * does not write any file. Throws (via assertItemsTransition) instead of
 * producing a partial edit.
 */
export function markItemsDone(content, items) {
  assertItemsTransition(content, items, ["Pending"], "Done");
  let updated = content;
  for (const item of items) {
    const escaped = escapeRegExp(item);
    updated = updated.replace(new RegExp(`^- \\[[ ~]\\] (${escaped}(?=\\s|$).*)$`, "m"), "- [x] $1");
  }
  return updated;
}

// --- Maintenance scope resolution (CIR-22, PAR-MAINTENANCE) ---

/**
 * Resolves a `maintenance/<slug>` branch to either the single canonical
 * TNN ROADMAP.md item it corrects, or an allowlisted auxiliary purpose
 * (status/docs/housekeeping/cleanup/close/reconcile/sync/lifecycle).
 * Zero or multiple canonical candidates with a non-allowlisted purpose
 * fails safely (NEEDS_HUMAN_DECISION) instead of guessing.
 */
export function resolveMaintenanceScope(branch, roadmapContent) {
  const match = branch.match(/^maintenance\/(?:v\d+\.\d+\.\d+-)?(T\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (!match) {
    throw new Error(`cannot resolve canonical unit: invalid Maintenance branch '${branch}'`);
  }
  const branchSlug = match[1];
  const unitNumber = branchSlug.match(/^T\d{2}/)[0];
  const candidates = [
    ...new Set(
      [...roadmapContent.matchAll(/^-\s+\[[ x~]\]\s+(T\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*)\b/gm)]
        .map((m) => m[1])
        .filter((id) => id.startsWith(`${unitNumber}-`)),
    ),
  ];

  if (candidates.length === 1) {
    return { scope: "canonical-unit", canonicalSlug: candidates[0], branch, branchSlug, unitNumber, closeRoadmap: true, reason: "canonical unit registered in ROADMAP.md" };
  }
  if (candidates.length > 1) {
    throw new Error(`ambiguous identity for branch '${branch}': ${candidates.join(", ")}`);
  }
  if (AUXILIARY_MAINTENANCE_PATTERN.test(branchSlug)) {
    return { scope: "auxiliary", canonicalSlug: null, branch, branchSlug, unitNumber, closeRoadmap: false, reason: "no canonical unit associated" };
  }
  throw new Error(
    `ambiguous intent for maintenance '${branch}': no canonical unit ${unitNumber} in ROADMAP.md and the purpose is not allowlisted. FAILED_SAFELY / NEEDS_HUMAN_DECISION.`,
  );
}

// --- Milestone task DAG (CIR-23, PAR-TASK-DAG) ---

export class TaskDagError extends Error {}

/**
 * Validates a Milestone manifest's optional `tasks[]` DAG
 * (contracts/work-unit-manifest.schema.json): every `items` entry must
 * appear in exactly one task, every `dependsOn` must reference a real
 * task id, and the graph must be acyclic. Returns a topological order
 * (an order where every task comes after everything it depends on) when
 * valid; throws TaskDagError otherwise.
 */
export function validateTaskDag(items, tasks) {
  if (!tasks || tasks.length === 0) {
    return items; // no explicit order declared: any order is valid.
  }
  const taskIds = new Set(tasks.map((t) => t.id));
  for (const task of tasks) {
    for (const dep of task.dependsOn) {
      if (!taskIds.has(dep)) {
        throw new TaskDagError(`task '${task.id}' depends on unknown task '${dep}'`);
      }
    }
  }

  const itemCoverage = new Map();
  for (const task of tasks) {
    if (!items.includes(task.id)) {
      throw new TaskDagError(`task '${task.id}' does not correspond to any item in the manifest`);
    }
    itemCoverage.set(task.id, (itemCoverage.get(task.id) ?? 0) + 1);
  }
  for (const item of items) {
    const count = itemCoverage.get(item) ?? 0;
    if (count === 0) throw new TaskDagError(`item '${item}' has no corresponding task in the DAG`);
    if (count > 1) throw new TaskDagError(`item '${item}' appears in more than one task`);
  }

  const visiting = new Set();
  const visited = new Set();
  const order = [];
  const byId = new Map(tasks.map((t) => [t.id, t]));

  function visit(id, path) {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      throw new TaskDagError(`cycle detected in task DAG: ${[...path, id].join(" -> ")}`);
    }
    visiting.add(id);
    for (const dep of byId.get(id).dependsOn) {
      visit(dep, [...path, id]);
    }
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  }
  for (const task of tasks) visit(task.id, []);
  return order;
}
