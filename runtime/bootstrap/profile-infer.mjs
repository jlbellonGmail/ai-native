// Profile selection for `ai-native init` (a consumer never has to know profile ids). Read-only: looks at what the repository
// already holds and proposes a profile with the reason. A repository with no signal (empty, README only) yields `profile: null`:
// the caller asks (interactive) or fails closed listing the choices; nothing is guessed.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SERVICE = /\b(fastapi|uvicorn|starlette|flask|django|gunicorn|aiohttp|celery)\b/i;
const readSafe = (path) => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
};

/** Profiles a person can choose from, in the order they are offered. `testing` is a fixture profile and is never offered. */
const OFFER_ORDER = ["python-service", "python-lib", "python-app", "python-scripts", "static-site", "supabase-service", "factory"];
export function offeredProfiles(available) {
  const known = OFFER_ORDER.filter((id) => available.includes(id));
  return [...known, ...available.filter((id) => id !== "testing" && !known.includes(id)).sort()];
}

/**
 * @param {string} root project root
 * @param {string[]} available profile ids shipped by the release
 * @returns {{profile: string|null, reason: string}}
 */
export function inferProfile(root, available) {
  const has = (rel) => existsSync(join(root, rel));
  const pick = (id, reason) => (available.includes(id) ? { profile: id, reason } : null);
  if (has("supabase/config.toml") || has("supabase/migrations")) {
    const r = pick("supabase-service", "supabase/ directory");
    if (r) return r;
  }
  const deployable = has("Dockerfile") || has("openapi.yaml") || has("docker-compose.yml");
  const pyproject = ["pyproject.toml", "setup.py", "setup.cfg"].find(has);
  if (pyproject) {
    const service = deployable || SERVICE.test(readSafe(join(root, pyproject))) || SERVICE.test(readSafe(join(root, "requirements.txt")));
    const r = service ? pick("python-service", `${pyproject} with service markers`) : pick("python-lib", `${pyproject} (installable package)`);
    if (r) return r;
  }
  if (has("requirements.txt")) {
    const service = deployable || SERVICE.test(readSafe(join(root, "requirements.txt")));
    const r = service ? pick("python-service", "requirements.txt with service markers") : pick("python-app", "requirements.txt (no installable package)");
    if (r) return r;
  }
  if (has("requirements-dev.txt")) {
    const r = pick("python-scripts", "requirements-dev.txt only");
    if (r) return r;
  }
  if (has("mkdocs.yml")) {
    const r = pick("static-site", "mkdocs.yml");
    if (r) return r;
  }
  return { profile: null, reason: "no project files to infer a profile from" };
}
