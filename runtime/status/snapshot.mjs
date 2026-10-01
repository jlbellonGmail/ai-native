// Derived STATUS view (M3.1, PAR-STATUS-DERIVED / PAR-STATUS-ACTIVE-UNITS /
// PAR-STATUS-SELF-STALE). Ported from TEMPLATE v2.0.5's status-lib.ps1
// Get-StatusSnapshot. "Derived" means every field here is computed fresh
// from git/gh/the filesystem on each call -- nothing is read back from a
// previously written snapshot file, so there is no hand-maintained state
// to drift out of sync.
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import * as git from "../lib/git.mjs";

function readFileIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

/** Ported from Get-StatusVersion: explicit file(s) > branch name > ROADMAP.md
 * declared heading > latest git tag > unknown. Never hardcoded/guessed. */
export function getVersion(root, branch) {
  for (const name of ["VERSION", "version.txt", ".version"]) {
    const raw = readFileIfExists(join(root, name));
    if (raw === null) continue;
    const match = raw.trim().match(/^v?(\d+\.\d+\.\d+)$/);
    if (match) return { value: `v${match[1]}`, source: name, confidence: "explicit" };
  }
  const packageJson = readFileIfExists(join(root, "package.json"));
  if (packageJson) {
    const match = packageJson.match(/"version"\s*:\s*"(\d+\.\d+\.\d+)"/);
    if (match) return { value: `v${match[1]}`, source: "package.json", confidence: "explicit" };
  }
  const pyproject = readFileIfExists(join(root, "pyproject.toml"));
  if (pyproject) {
    const match = pyproject.match(/^version\s*=\s*["'](\d+\.\d+\.\d+)["']/m);
    if (match) return { value: `v${match[1]}`, source: "pyproject.toml", confidence: "explicit" };
  }
  if (branch) {
    const match = branch.match(/(?:^|\/)(?:feature|milestone|maintenance)\/(v\d+\.\d+\.\d+)-/i);
    if (match) return { value: match[1], source: "branch", confidence: "explicit" };
  }
  const roadmap = readFileIfExists(join(root, "ROADMAP.md"));
  if (roadmap) {
    const versions = [...roadmap.matchAll(/^##\s+(v\d+\.\d+\.\d+).*Roadmap activo/gim)].map((m) => m[1]);
    if (versions.length > 0) {
      const best = versions.sort((a, b) => compareSemver(b, a))[0];
      return { value: best, source: "ROADMAP.md", confidence: "declared" };
    }
  }
  const tags = git.tagsSortedDesc(root).filter((t) => /^v\d+\.\d+\.\d+$/.test(t));
  if (tags.length > 0) return { value: tags[0], source: "git tag", confidence: "release-fallback" };
  return { value: null, source: null, confidence: "unknown" };
}

function compareSemver(a, b) {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Parses `- [ ] <slug> ...` / `- [-] ...` / `- [x] ...` roadmap entries.
 * Deliberately format-agnostic about the slug shape: TEMPLATE v2.0.5 used
 * two-digit slugs (`02-item-a`); ai-native's own roadmap uses milestone
 * slugs like `M3.1` or `W5-T3`. A regex hardcoded to the former would
 * silently find zero entries (and therefore zero active units) against
 * this repo's own roadmap. */
export function parseRoadmapEntries(text) {
  const entries = [];
  const re = /^- \[([ x-])\]\s+([A-Za-z0-9][A-Za-z0-9.\-]*)/gm;
  let match;
  while ((match = re.exec(text)) !== null) {
    const [, marker, slug] = match;
    const state = marker === " " ? "pending" : marker === "-" ? "ready" : "done";
    entries.push({ slug, state });
  }
  return entries;
}

/** Ported from Get-StatusUnitFromTree, generalized to match roadmap slugs
 * of any shape (see parseRoadmapEntries) rather than TEMPLATE v2.0.5's
 * hardcoded two-digit pattern. A linked worktree only becomes an
 * activeUnit when its branch resolves to a roadmap entry that is not
 * `done`; a historical/closed entry (or no match at all) never does. */
export function getActiveUnits(root, { roadmapPath = "ROADMAP.md" } = {}) {
  const roadmapText = readFileIfExists(join(root, roadmapPath)) ?? "";
  const entries = parseRoadmapEntries(roadmapText);
  const trees = git.worktreeList(root).filter((t) => t.role === "linked");

  const units = [];
  for (const tree of trees) {
    if (!tree.branch) continue;
    const branchMatch = tree.branch.match(/^(feature|milestone)\/(.+)$/);
    if (!branchMatch) continue;
    const [, kind, rest] = branchMatch;
    const branchSlug = normalizeSlug(rest);
    const entry = entries.find((e) => {
      const entrySlug = normalizeSlug(e.slug);
      return branchSlug === entrySlug || branchSlug.endsWith(`-${entrySlug}`) || branchSlug.startsWith(`${entrySlug}-`);
    });
    if (!entry || entry.state === "done") continue;
    units.push({
      unitId: entry.slug,
      mode: kind === "feature" ? "Feature" : "Milestone",
      branch: tree.branch,
      worktree: tree.path,
      head: tree.head,
      state: entry.state,
      lifecycle: entry.state === "ready" ? "PR_OPEN_OR_READY" : "ACTIVE",
      source: "git-worktree",
    });
  }
  return units;
}

const GH_TIMEOUT_MS = 10000;

function runGh(args, { timeoutMs = GH_TIMEOUT_MS } = {}) {
  let result;
  try {
    result = spawnSync("gh", args, { encoding: "utf8", timeout: timeoutMs });
  } catch (error) {
    return { available: false, value: null, error: error.message };
  }
  if (result.error) return { available: false, value: null, error: result.error.message };
  if (result.status !== 0) return { available: false, value: null, error: (result.stderr || "").trim() };
  try {
    return { available: true, value: JSON.parse(result.stdout), error: null };
  } catch {
    return { available: false, value: null, error: "invalid JSON response" };
  }
}

function isGhInstalled() {
  try {
    return spawnSync("gh", ["--version"], { encoding: "utf8" }).status === 0;
  } catch {
    return false;
  }
}

/**
 * Builds the full derived STATUS snapshot for `root`. PAR-STATUS-DERIVED:
 * every field is computed here, never read back from a prior snapshot.
 * PAR-STATUS-SELF-STALE: `observedCommit` is the first-parent, non-STATUS
 * commit (see runtime/lib/git.mjs#getObservedCommit) -- callers comparing
 * "is this still the same state" should compare against observedCommit,
 * not raw `head`, so a STATUS-only commit never looks like drift.
 */
export function buildSnapshot(root, { ignorePaths = ["STATUS.md"], roadmapPath = "ROADMAP.md" } = {}) {
  const branch = git.currentBranch(root);
  const head = git.headSha(root);
  const { observedCommit, skippedCommits } = git.getObservedCommit(root, head, { ignorePaths });
  const worktrees = git.worktreeList(root);
  const activeUnits = getActiveUnits(root, { roadmapPath });
  const version = getVersion(root, branch);
  const remote = git.remoteUrl(root);
  const workingTree = git.workingTreeStatus(root);
  const remoteState = git.upstreamDivergence(root);
  const latestTag = git.tagsSortedDesc(root).find((t) => /^v\d+\.\d+\.\d+$/.test(t)) ?? null;

  const ghInstalled = isGhInstalled();
  let pullRequest = null;
  let ci = null;
  let ciAvailable = false;
  let ciReason = "gh not installed";
  let latestRelease = null;
  let githubReason = ghInstalled ? null : "gh not installed";

  if (ghInstalled) {
    const prInfo = runGh(["pr", "list", "--head", branch ?? "", "--state", "open", "--json", "number,title,url,headRefOid,baseRefName", "--limit", "10"]);
    githubReason = prInfo.available ? null : prInfo.error;
    if (prInfo.available) {
      const match = prInfo.value.find((pr) => pr.headRefOid === head);
      pullRequest = match ?? null;
    }

    const ciInfo = runGh(["run", "list", "--branch", branch ?? "", "--commit", head, "--limit", "20", "--json", "name,status,conclusion,headSha,url,workflowName,createdAt"]);
    ciAvailable = ciInfo.available;
    ciReason = ciInfo.available ? null : ciInfo.error;
    if (ciInfo.available) {
      const ciRuns = ciInfo.value.filter((r) => r.headSha === head && r.workflowName === "CI");
      ci = ciRuns.length > 0 ? ciRuns.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] : null;
      if (!ci) ciReason = "NOT_RUN_FOR_HEAD";
    }

    const relInfo = runGh(["release", "list", "--limit", "20", "--json", "tagName,name,publishedAt,isDraft,isPrerelease"]);
    if (relInfo.available) {
      const published = relInfo.value.filter((r) => !r.isDraft && !r.isPrerelease && r.publishedAt);
      latestRelease = published.length > 0 ? published.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))[0] : null;
    }
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    branch,
    head,
    observedCommit,
    statusOnlyCommitsSkipped: skippedCommits.length,
    version,
    remote,
    remoteState,
    workingTree,
    worktrees,
    activeUnits,
    pullRequest,
    ci,
    ciAvailable,
    ciReason,
    latestRelease,
    latestTag,
    githubAvailable: ghInstalled,
    githubReason,
  };
}
