import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { inferProfile, offeredProfiles } from "./profile-infer.mjs";

const ALL = ["factory", "python-app", "python-lib", "python-scripts", "python-service", "static-site", "supabase-service", "testing"];
const made = [];
after(() => made.forEach((d) => rmSync(d, { recursive: true, force: true })));
function repo(files) {
  const d = mkdtempSync(join(tmpdir(), "infer-"));
  made.push(d);
  for (const [p, c] of Object.entries(files)) { mkdirSync(dirname(join(d, p)), { recursive: true }); writeFileSync(join(d, p), c); }
  return d;
}

test("no signal (empty, README only, docs text) yields no profile: it is asked for, never guessed", () => {
  assert.equal(inferProfile(repo({}), ALL).profile, null);
  assert.equal(inferProfile(repo({ "README.md": "# x" }), ALL).profile, null);
  assert.equal(inferProfile(repo({ "LICENSE": "x", ".gitignore": "x" }), ALL).profile, null);
});

test("Python signals map to the profile that matches how the project is built and deployed", () => {
  assert.equal(inferProfile(repo({ "pyproject.toml": '[project]\nname="x"\n' }), ALL).profile, "python-lib");
  assert.equal(inferProfile(repo({ "pyproject.toml": '[project]\ndependencies=["FastAPI>=0.1"]\n' }), ALL).profile, "python-service");
  assert.equal(inferProfile(repo({ "pyproject.toml": "[project]\n", "Dockerfile": "FROM x" }), ALL).profile, "python-service");
  assert.equal(inferProfile(repo({ "requirements.txt": "requests\n" }), ALL).profile, "python-app");
  assert.equal(inferProfile(repo({ "requirements.txt": "flask\n" }), ALL).profile, "python-service");
  assert.equal(inferProfile(repo({ "requirements-dev.txt": "pytest\n" }), ALL).profile, "python-scripts");
});

test("other stacks: Supabase, MkDocs", () => {
  assert.equal(inferProfile(repo({ "supabase/config.toml": "" }), ALL).profile, "supabase-service");
  assert.equal(inferProfile(repo({ "mkdocs.yml": "site_name: x" }), ALL).profile, "static-site");
});

test("only profiles the release ships can be inferred", () => {
  assert.equal(inferProfile(repo({ "pyproject.toml": "[project]\n" }), ["factory"]).profile, null);
});

test("the choices offered are ordered, never include the fixture profile, and include profiles added later", () => {
  assert.deepEqual(offeredProfiles(ALL), ["python-service", "python-lib", "python-app", "python-scripts", "static-site", "supabase-service", "factory"]);
  assert.deepEqual(offeredProfiles([...ALL, "go-service"]).slice(-1), ["go-service"]);
});
