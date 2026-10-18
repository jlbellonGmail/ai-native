import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdtempSync, cpSync, readFileSync as readFileSyncFs, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));

test("contracts/validate-contracts.mjs passes against the real contracts/ directory", () => {
  const out = execFileSync(process.execPath, [join(here, "validate-contracts.mjs")], { encoding: "utf8" });
  assert.match(out, /^contracts validation: PASS$/m);
});

test("sdd-levels.json satisfies its own schema's required fields per level", () => {
  const data = JSON.parse(readFileSyncFs(join(here, "sdd-levels.json"), "utf8"));
  for (const level of ["LIGHT", "STANDARD", "FULL"]) {
    assert.ok(data.levels[level], `${level} must be defined`);
    assert.ok(Array.isArray(data.levels[level].requiredArtifacts) && data.levels[level].requiredArtifacts.length > 0);
    assert.ok([2, 4, 6].includes(data.levels[level].convergenceBudget));
  }
  assert.equal(data.levels.LIGHT.convergenceBudget, 2);
  assert.equal(data.levels.STANDARD.convergenceBudget, 4);
  assert.equal(data.levels.FULL.convergenceBudget, 6);
});

test("regression: the structural checker rejects a sdd-levels.json with a wrong-type convergenceBudget", () => {
  // This test imports the checker's internals indirectly by running the CLI
  // against a broken copy, to prove it actually catches real errors (not
  // just happening to pass on well-formed input).
  const workRoot = mkdtempSync(join(tmpdir(), "contracts-check-"));
  const work = join(workRoot, "contracts");
  try {
    cpSync(here, work, { recursive: true });
    cpSync(join(here, "..", "runtime"), join(workRoot, "runtime"), { recursive: true });
    const brokenPath = join(work, "sdd-levels.json");
    const broken = JSON.parse(readFileSyncFs(brokenPath, "utf8"));
    broken.levels.LIGHT.convergenceBudget = "two"; // wrong type AND not in the enum
    writeFileSync(brokenPath, JSON.stringify(broken, null, 2));

    let threw = false;
    try {
      execFileSync(process.execPath, [join(work, "validate-contracts.mjs")], { encoding: "utf8" });
    } catch (error) {
      threw = true;
      assert.match(error.stdout, /convergenceBudget/);
      assert.match(error.stdout, /ERROR/);
    }
    assert.ok(threw, "a broken sdd-levels.json must make validate-contracts.mjs exit non-zero");
  } finally {
    rmSync(workRoot, { recursive: true, force: true });
  }
});
