// Read-only git preflight check (M3.1, PAR-PREFLIGHT / GOV-08: "Politica
// Git (develop/main, nombres de rama, sin tags de agente)"). Scope is
// deliberately narrow: does the current branch respect the active
// profile's gitModel (contracts/profile.schema.json)? It does not create
// branches/worktrees (that is start-work-unit's job, PAR-WU-FEATURE /
// PAR-WU-MILESTONE, M3.2) and it does not enforce anything on the server
// side (branch protection / trust-gate is M4.3, PAR-BRANCH-PROTECTION).
import { currentBranch, workingTreeStatus } from "./git.mjs";
import { statusFromCounts } from "./result.mjs";

const DEFAULT_BRANCH_PATTERN = "^(feature|milestone|maintenance)/";

export function checkPreflight(cwd, profile = {}) {
  const errors = [];
  const warnings = [];

  const integrationBranch = profile?.gitModel?.integrationBranch ?? "main";
  const patternSource = profile?.gitModel?.branchNamePattern ?? DEFAULT_BRANCH_PATTERN;
  const pattern = new RegExp(patternSource);

  const branch = currentBranch(cwd);
  if (branch === null) {
    warnings.push("detached HEAD: branch name policy cannot be checked");
  } else if (branch !== integrationBranch && !pattern.test(branch)) {
    errors.push(
      `branch '${branch}' matches neither the integration branch '${integrationBranch}' nor gitModel.branchNamePattern (${patternSource})`,
    );
  }

  const workingTree = workingTreeStatus(cwd);

  const status = statusFromCounts({ errors: errors.length, warnings: warnings.length });
  return { status, errors, warnings, branch, integrationBranch, workingTree };
}
