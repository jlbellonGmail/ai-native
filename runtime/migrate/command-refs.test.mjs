// referencesPath / commandIsOpaque (command-refs.mjs): the ANALYSABLE syntax is pinned here; everything else must be opaque
// (=> every candidate file is kept). The module works by ALLOWLIST, so these tests also pin the allowlist itself.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { commandIsOpaque, referencesPath } from "./command-refs.mjs";

const F = "requirements-dev.txt";

test("analysable syntax: every way of naming the file counts as a reference", () => {
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
    "python -m pip install --quiet . -r requirements-dev.txt",
    "python -m pip install -c requirements-dev.txt x",
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
    "pip install -r REQUIREMENTS-DEV.TXT",
    "pip install -r Requirements-Dev.txt",
    "pip install -r requirements-dev.txt.",
    "pip install -r\trequirements-dev.txt",
    "pip install -r requirements-dev.txt\npytest",
    "pip install -r requirements-dev.txt\r\npytest",
  ]) {
    assert.equal(commandIsOpaque(cmd), false, `analysable: ${JSON.stringify(cmd)}`);
    assert.equal(referencesPath(cmd, F), true, JSON.stringify(cmd));
  }
});

test("a directory argument references the files it contains; a lone `.` (project root) references nothing", () => {
  assert.equal(referencesPath("pytest tests", "tests/test_x.py"), true);
  assert.equal(referencesPath("pytest ./tests/", "tests/test_x.py"), true);
  assert.equal(referencesPath("pytest -q TESTS", "tests/sub/test_x.py"), true, "any depth, any case");
  assert.equal(referencesPath("python -m pytest scripts", "scripts/helper.py"), true);
  assert.equal(referencesPath("pytest tests", "tests2/x.py"), false, "a different directory");
  assert.equal(referencesPath("pytest -q tests", "src/app.py"), false);
  assert.equal(referencesPath("python -m pip install --quiet .", F), false, "`.` is the package root, not a platform-owned file");
});

test("a different file that merely contains the name is NOT a reference", () => {
  for (const cmd of ["pip install -r requirements-dev.txt.bak", "pip install -r my-requirements-dev.txt", "pip install -r requirements-dev.txt2", "pip install -r requirements-dev.txtx", "pip install -r _requirements-dev.txt", "pip install -r requirements-dev.txt.lock", "pip install ."]) assert.equal(referencesPath(cmd, F), false, cmd);
  assert.equal(referencesPath("pytest -q", "pytest.ini"), false, "pytest.ini is an implicit dependency: declared with requiredFiles, not guessed");
});

test("OPAQUE: shell-valid spellings and anything outside the allowlist keep EVERY candidate file", () => {
  const opaque = [
    // variable / cmd.exe / glob / escape characters: not in the alphabet
    "pip install -r $FILE", "pip install -r ${FILE}", 'pip install -r "$REQS"', "pip install -r $1", "pip install -r ${ROOT}/requirements-dev.txt",
    "pip install -r requirements-%X%.txt", "pip install -r requirements-d^ev.txt", "pip install -r %~dp0requirements-dev.txt", "pip install -r %CD%\\requirements-dev.txt",
    "pip install -r requirements-*.txt", "pip install -r requirements-d?v.txt", "pip install -r req[a-z]*-dev.txt", "pip install -r requirements-dev[!x]txt", "pip install -r requirements-d@(e)v.txt", "pip install -r requirements-+(dev).txt",
    "pip install -r {requirements,constraints}.txt", "pip install -r @responsefile", "pip install -r ~/requirements-dev.txt", "pip install -r !requirements-dev.txt",
    "pip install -r $'requirements-dev.txt'", 'pip install -r $"requirements-dev.txt"',
    "pip install -r requirements-d\\ev.txt", "pip install -r sub\\requirements-dev.txt", "pip install -r requirements\\\n-dev.txt", "pip install \\\n  -r requirements-dev.txt",
    "pip install -r $(printf requirements-d%s.txt ev)", "x=$(pip install -r requirements-dev.txt)", "`pip install -r requirements-dev.txt`", "pip install -r <(cat requirements-dev.txt)", "cat >(tee requirements-dev.txt)",
    "pip install -r requirements-dev.txt é", "pip install -r requirements-dev.txt ​",
    // quote splitting inside a word
    'pip install -r requirements-"dev".txt', 'pip install -r r"equirements-dev.txt"', "pip install -r requirements-d''ev.txt",
    // programs that run code or other commands
    "eval pip install -r x", "bash -c 'pip install -r x'", "sh -c 'pytest'", "zsh -lc pytest", "ls | xargs pip install -r",
    "python -c \"print('requirements-'+'dev.txt')\"", "python3 -c 'x'", "node -e 'x'", "pwsh -Command x", "powershell -NoProfile -Command x", "cmd /c x", "perl -e x",
    "make test", "tox", "npm run test", "poetry run pytest", "uv run pytest",
    "./run-tests.sh", "bash run.sh", "pwsh ./scripts/test.ps1", "run.bat", "python tools/check.py", "python -u check.py", "node scripts/run.mjs",
  ];
  for (const cmd of opaque) {
    assert.equal(commandIsOpaque(cmd), true, `opaque: ${JSON.stringify(cmd)}`);
    assert.equal(referencesPath(cmd, F), true, `kept: ${JSON.stringify(cmd)}`);
    assert.equal(referencesPath(cmd, "anything/else.cfg"), true, `kept (any candidate): ${JSON.stringify(cmd)}`);
  }
  for (const cmd of ["python -m pip install --quiet . -r requirements-dev.txt", "pytest -q", "python -m pytest -q", "pip install -r requirements.txt && pytest -q"]) assert.equal(commandIsOpaque(cmd), false, `analysable: ${cmd}`);
});

test("allowlist property: ANY character outside the alphabet makes a command opaque, wherever it sits", () => {
  const inside = new Set([..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 \t\r\n_.-/=:,;&|<>#\"'()"]);
  let checked = 0;
  for (let code = 1; code < 0x250; code += 1) {
    const ch = String.fromCharCode(code);
    if (inside.has(ch)) continue;
    for (const cmd of [`pip install -r requirements-dev.txt${ch}`, `${ch}pip install -r requirements-dev.txt`, `pip install -r requirements${ch}dev.txt`]) {
      assert.equal(commandIsOpaque(cmd), true, `U+${code.toString(16)} in ${JSON.stringify(cmd)}`);
      checked += 1;
    }
  }
  assert.ok(checked > 1000, `checked ${checked}`);
});

test("the shipped python profiles are analysable, keep what they name and nothing else is made opaque by accident", () => {
  for (const id of ["python-lib", "python-service", "python-app", "python-scripts"]) {
    const p = JSON.parse(readFileSync(new URL(`../../profiles/${id}.json`, import.meta.url), "utf8"));
    for (const field of ["productSetupCommand", "productTestCommand"]) assert.equal(commandIsOpaque(p[field]), false, `${id}.${field} must stay analysable`);
    assert.equal(referencesPath(p.productSetupCommand, F), true, `${id} installs requirements-dev.txt`);
  }
  for (const id of ["factory", "testing", "static-site", "supabase-service"]) {
    const p = JSON.parse(readFileSync(new URL(`../../profiles/${id}.json`, import.meta.url), "utf8"));
    for (const field of ["productSetupCommand", "productTestCommand"]) if (typeof p[field] === "string") assert.equal(typeof commandIsOpaque(p[field]), "boolean", `${id}.${field}`);
  }
});

test("property: a literal mention in the analysable alphabet is NEVER missed, whatever surrounds it (no false negative)", () => {
  let seed = 7;
  const rnd = (n) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return (seed >>> 16) % n; };
  const before = ["", " ", "\t", "\n", "-r ", "-r", "--requirement=", "./", "sub/", "../", "(", '"', "'", ">", "<", ">>", "=", ";", "&&", "|", "# "];
  const after = ["", " ", "\t", "\n", ")", '"', "'", ">", "<", ";", "&&", "|", ",", " # c", ".", " x"];
  for (let k = 0; k < 3000; k += 1) {
    const cmd = `pip install ${before[rnd(before.length)]}${F}${after[rnd(after.length)]}`;
    assert.equal(referencesPath(cmd, F), true, JSON.stringify(cmd));
  }
});

test("garbage input never throws and never retires: non-string or empty -> false", () => {
  for (const bad of [null, undefined, 3, {}, []]) assert.equal(referencesPath(bad, F), false);
  assert.equal(commandIsOpaque(null), false);
  assert.equal(referencesPath("pip install -r x", ""), false);
  assert.equal(referencesPath("pip install -r x", null), false);
});
