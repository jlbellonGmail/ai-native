// Shared canonical-source loader for runtime/adapters/* (M3.3). Every
// per-tool generator reads from exactly these files -- core/agents.json
// is explicit that adapters, not hand edits, own the derived files
// ("Adapters per tool (runtime/adapters, M3.3) derive .claude/, .codex/,
// .opencode/ from this file").
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export class MissingCanonicalSourceError extends Error {}

function readJson(path) {
  if (!existsSync(path)) {
    throw new MissingCanonicalSourceError(`missing canonical source: ${path}`);
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

export function loadAgents(root) {
  return readJson(join(root, "core", "agents.json"));
}

export function loadMcpCatalog(root) {
  return readJson(join(root, "mcp", "catalog.json"));
}

export function loadRolePrompt(root, role) {
  const path = join(root, role.prompt);
  if (!existsSync(path)) {
    throw new MissingCanonicalSourceError(`missing canonical prompt for role: ${role.prompt}`);
  }
  return readFileSync(path, "utf8").trimEnd();
}

/**
 * "Check de puntos de entrada" (M3.3): every canonical source an
 * adapter would need actually exists and is internally consistent,
 * checked up front so generation fails fast and explicitly instead of
 * partway through with a half-written output set. Returns a list of
 * problems (empty = ok); never throws for an expected, reportable gap.
 */
export function checkEntryPoints(root) {
  const problems = [];
  let agents;
  try {
    agents = loadAgents(root);
  } catch (error) {
    return [error.message];
  }
  try {
    loadMcpCatalog(root);
  } catch (error) {
    problems.push(error.message);
  }
  for (const [name, role] of Object.entries(agents.roles ?? {})) {
    try {
      loadRolePrompt(root, role);
    } catch {
      problems.push(`role '${name}': missing canonical prompt at ${role.prompt}`);
    }
    for (const tool of ["claude", "codex", "opencode"]) {
      if (!role[tool]) {
        problems.push(`role '${name}': missing '${tool}' routing block in core/agents.json`);
      }
    }
  }
  return problems;
}
