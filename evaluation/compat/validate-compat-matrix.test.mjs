import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(dirname(here));

function makeWorkRoot() {
  const workRoot = mkdtempSync(join(tmpdir(), "compat-check-"));
  cpSync(here, join(workRoot, "evaluation", "compat"), { recursive: true });
  cpSync(join(repoRoot, "runtime"), join(workRoot, "runtime"), { recursive: true });
  return workRoot;
}

test("evaluation/compat/validate-compat-matrix.mjs passes against the real compat-matrix.json", () => {
  const out = execFileSync(process.execPath, [join(here, "validate-compat-matrix.mjs")], { encoding: "utf8" });
  assert.match(out, /^compat-matrix validation: PASS$/m);
});

test("regression: a CONFIRMED check with no evidence is rejected", () => {
  const workRoot = makeWorkRoot();
  try {
    const matrixPath = join(workRoot, "evaluation", "compat", "compat-matrix.json");
    const data = JSON.parse(readFileSync(matrixPath, "utf8"));
    data.checks[0].status = "CONFIRMED";
    data.checks[0].evidence = null;
    writeFileSync(matrixPath, JSON.stringify(data, null, 2));

    let threw = false;
    try {
      execFileSync(process.execPath, [join(workRoot, "evaluation", "compat", "validate-compat-matrix.mjs")], { encoding: "utf8" });
    } catch (error) {
      threw = true;
      assert.match(error.stdout, /requires non-null "evidence"/);
    }
    assert.ok(threw, "a CONFIRMED check without evidence must make the validator exit non-zero");
  } finally {
    rmSync(workRoot, { recursive: true, force: true });
  }
});

test("regression: a NOT_AVAILABLE_FROM_TOOL check with no documented fallback is rejected", () => {
  const workRoot = makeWorkRoot();
  try {
    const matrixPath = join(workRoot, "evaluation", "compat", "compat-matrix.json");
    const data = JSON.parse(readFileSync(matrixPath, "utf8"));
    const target = data.checks.find((c) => c.status === "NOT_AVAILABLE_FROM_TOOL");
    target.notes = "short";
    writeFileSync(matrixPath, JSON.stringify(data, null, 2));

    let threw = false;
    try {
      execFileSync(process.execPath, [join(workRoot, "evaluation", "compat", "validate-compat-matrix.mjs")], { encoding: "utf8" });
    } catch (error) {
      threw = true;
      assert.match(error.stdout, /requires a documented fallback/);
    }
    assert.ok(threw, "a NOT_AVAILABLE_FROM_TOOL check without a fallback must make the validator exit non-zero");
  } finally {
    rmSync(workRoot, { recursive: true, force: true });
  }
});
