// referencesPath / commandIsOpaque (command-refs.mjs): the SUPPORTED SYNTAX is pinned here; everything else must keep the file.
import test from "node:test";
import assert from "node:assert/strict";
import { commandIsOpaque, referencesPath } from "./command-refs.mjs";

const F = "requirements-dev.txt";

test("supported syntax: every way of naming the file counts as a reference", () => {
  for (const cmd of [
    "pip install -r requirements-dev.txt",
    "pip install -r ./requirements-dev.txt",
    "pip install -rrequirements-dev.txt",
    "pip install -r  requirements-dev.txt",
    "pip install --requirement=requirements-dev.txt",
    "pip install --requirement requirements-dev.txt",
    "pip install -c requirements-dev.txt x",
    "pip install --constraint=requirements-dev.txt x",
    'pip install -r "requirements-dev.txt"',
    "pip install -r 'requirements-dev.txt'",
    "pip install . -r requirements-dev.txt && pytest",
    "(pip install -r requirements-dev.txt)",
    "pip install -r requirements-dev.txt;pytest",
    "pip install -r requirements-dev.txt|tee log",
    "pip install -r requirements-dev.txt>log",
    "pip install -r requirements-dev.txt>>log",
    "pip install -r requirements-dev.txt 2>&1",
    "cat <requirements-dev.txt",
    "pip install -r requirements-dev.txt # install dev deps",
    "# requirements-dev.txt is needed\npytest",
    "pip install -r requirements-dev.txt,requirements.txt",
    "pip install -r sub/requirements-dev.txt",
    "pip install -r ../requirements-dev.txt",
    "pip install -r ${ROOT}/requirements-dev.txt",
    "pip install -r REQUIREMENTS-DEV.TXT",
    "pip install -r Requirements-Dev.txt",
    "pip install -r requirements-dev.txt.",
    "pip install -r\trequirements-dev.txt",
    "pip install -r requirements-dev.txt\npytest",
  ]) assert.equal(referencesPath(cmd, F), true, JSON.stringify(cmd));
});

test("glob words that can match the file count as references (the base name or the whole path)", () => {
  for (const cmd of ["pip install -r requirements-*.txt", "pip install -r requirements-d?v.txt", "pip install -r req[a-z]*-dev.txt", "pip install -r *-dev.txt", "pip install -r ./requirements-*.txt"]) assert.equal(referencesPath(cmd, F), true, cmd);
  assert.equal(referencesPath("pytest tests/*.py", F), false, "a glob that cannot match the file");
  assert.equal(referencesPath("pytest -q scripts/*.py", "scripts/helper.py"), true, "path-wide glob");
});

test("a different file that merely contains the name is NOT a reference", () => {
  for (const cmd of ["pip install -r requirements-dev.txt.bak", "pip install -r my-requirements-dev.txt", "pip install -r requirements-dev.txt2", "pip install -r requirements-dev.txtx", "pip install -r _requirements-dev.txt", "pip install -r requirements-dev.txt.lock", "pip install ."]) assert.equal(referencesPath(cmd, F), false, cmd);
  assert.equal(referencesPath("pytest -q", "pytest.ini"), false, "pytest.ini is an implicit dependency: declared with requiredFiles, not guessed");
});

test("unsupported forms are opaque: every candidate is treated as referenced (kept)", () => {
  for (const cmd of ["pip install -r $FILE", "pip install -r ${FILE}", 'pip install -r "$REQS"', "pip install -r $1", "eval pip install -r x", "bash -c 'pip install -r x'", "sh -c 'pytest'", "zsh -lc pytest", "ls | xargs pip install -r", "pip install -r {requirements,constraints}.txt",
    // review: shell-valid spellings of the SAME name that the matcher cannot see must be opaque (=> kept), never "not referenced"
    'pip install -r requirements-"dev".txt', 'pip install -r r"equirements-dev.txt"', "pip install -r requirements-d''ev.txt", "pip install -r requirements-d\\ev.txt",
    "pip install -r $(printf requirements-d%s.txt ev)", "x=$(pip install -r requirements-dev.txt)", "`pip install -r requirements-dev.txt`", "pip install -r <(cat requirements-dev.txt)", "cat >(tee requirements-dev.txt)",
    "pip install -r sub\\requirements-dev.txt", "pip install -r requirements\\\n-dev.txt", "pip install \\\n  -r requirements-dev.txt",
  ]) {
    assert.equal(commandIsOpaque(cmd), true, `opaque: ${cmd}`);
    assert.equal(referencesPath(cmd, F), true, `kept: ${cmd}`);
    assert.equal(referencesPath(cmd, "anything/else.cfg"), true, `kept (any candidate): ${cmd}`);
  }
  for (const cmd of ["python -m pip install --quiet . -r requirements-dev.txt", "pytest -q", "pip install -r requirements.txt && pytest -q"]) assert.equal(commandIsOpaque(cmd), false, `analysable: ${cmd}`);
});

test("the shipped python profiles are analysable and keep exactly what they name", async () => {
  const { readFileSync } = await import("node:fs");
  for (const id of ["python-lib", "python-service", "python-app", "python-scripts"]) {
    const p = JSON.parse(readFileSync(new URL(`../../profiles/${id}.json`, import.meta.url), "utf8"));
    for (const field of ["productSetupCommand", "productTestCommand"]) assert.equal(commandIsOpaque(p[field]), false, `${id}.${field} must stay analysable`);
    assert.equal(referencesPath(p.productSetupCommand, F), true, `${id} installs requirements-dev.txt`);
  }
});

test("property: a literal mention is NEVER missed, whatever surrounds it (no false negative)", () => {
  let seed = 7;
  const rnd = (n) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed >>> 16) % n; };
  const before = ["", " ", "\t", "\n", "-r ", "-r", "--requirement=", "./", "sub/", "../", "(", "`", '"', "'", ">", "<", ">>", "=", ";", "&&", "|", "# ", "x=$(", "${R}/"];
  const after = ["", " ", "\t", "\n", ")", "`", '"', "'", ">", "<", ";", "&&", "|", ",", " # c", ".", " x"];
  for (let k = 0; k < 3000; k += 1) {
    const cmd = `pip install ${before[rnd(before.length)]}${F}${after[rnd(after.length)]}`;
    assert.equal(referencesPath(cmd, F), true, JSON.stringify(cmd));
  }
});

test("garbage input never throws and never retires: non-string or empty -> false", () => {
  for (const bad of [null, undefined, 3, {}, []]) assert.equal(referencesPath(bad, F), false);
  assert.equal(referencesPath("pip install -r x", ""), false);
  assert.equal(referencesPath("pip install -r x", null), false);
});
