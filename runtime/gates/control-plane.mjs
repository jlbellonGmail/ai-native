// M4.3 (PAR-CONTROL-PLANE-AS-DATA, PAR-CONFIG-FROM-BASE). The control plane
// (workflows, gate code and config, policy, contracts) is DATA while a PR is
// under evaluation: it is read from the trusted BASE commit with `git show`
// and never executed or sourced from the PR head. A PR that edits it does not
// change how that same PR is judged; it only gets flagged for human review.
import { spawnSync } from "node:child_process";

export class ControlPlaneError extends Error {}

export function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      out += ".*";
      i++;
      if (glob[i + 1] === "/") i++;
    } else if (c === "*") out += "[^/]*";
    else out += c.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${out}$`);
}

/** Splits paths into those matching any control-plane glob and the rest. */
export function classifyPaths(paths, patterns) {
  const res = patterns.map(globToRegExp);
  const controlPlane = [];
  const other = [];
  for (const p of paths) (res.some((re) => re.test(p)) ? controlPlane : other).push(p);
  return { controlPlane, other };
}

function git(cwd, args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new ControlPlaneError(`git ${args.join(" ")} failed to start: ${r.error.message}`);
  return r;
}

/** File content at `sha` (data only), or null when the path does not exist there. */
export function readFromCommit(cwd, sha, path) {
  const r = git(cwd, ["show", `${sha}:${path}`]);
  return r.status === 0 ? r.stdout : null;
}

export function listFilesAtCommit(cwd, sha, dir) {
  const r = git(cwd, ["ls-tree", "-r", "--name-only", sha, "--", dir]);
  if (r.status !== 0) return [];
  return r.stdout.split(/\r?\n/).filter(Boolean);
}

export function changedFiles(cwd, baseSha, headSha) {
  const r = git(cwd, ["diff", "--name-only", `${baseSha}...${headSha}`]);
  if (r.status !== 0) throw new ControlPlaneError(`cannot diff ${baseSha}...${headSha}: ${r.stderr.trim()}`);
  return r.stdout.split(/\r?\n/).filter(Boolean);
}

/** Loads gate config from the BASE commit. Fails closed if absent or invalid. */
export function loadGateConfig(cwd, baseSha, path = "governance/gates/gates.json") {
  const text = readFromCommit(cwd, baseSha, path);
  if (text === null) throw new ControlPlaneError(`gate config ${path} not found at base ${baseSha}`);
  let cfg;
  try {
    cfg = JSON.parse(text);
  } catch (e) {
    throw new ControlPlaneError(`gate config ${path} at base is not valid JSON: ${e.message}`);
  }
  for (const k of ["trustGate", "reservedCheckNames", "controlPlane", "worker", "governance"]) {
    if (cfg[k] === undefined) throw new ControlPlaneError(`gate config at base lacks '${k}'`);
  }
  return cfg;
}
