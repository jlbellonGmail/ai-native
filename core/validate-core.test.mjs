import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(here);

function makeWorkRoot() {
  const workRoot = mkdtempSync(join(tmpdir(), "core-check-"));
  cpSync(here, join(workRoot, "core"), { recursive: true });
  cpSync(join(repoRoot, "mcp"), join(workRoot, "mcp"), { recursive: true });
  cpSync(join(repoRoot, "profiles"), join(workRoot, "profiles"), { recursive: true });
  cpSync(join(repoRoot, "contracts"), join(workRoot, "contracts"), { recursive: true });
  cpSync(join(repoRoot, "runtime"), join(workRoot, "runtime"), { recursive: true });
  cpSync(join(repoRoot, "evaluation", "compat"), join(workRoot, "evaluation", "compat"), { recursive: true });
  return workRoot;
}

test("core/validate-core.mjs passes against the real core/, mcp/ and profiles/ directories", () => {
  const out = execFileSync(process.execPath, [join(here, "validate-core.mjs")], { encoding: "utf8" });
  assert.match(out, /^core validation: PASS$/m);
});

test("regression: a kernel.md over the PAR-CONTEXT-BUDGET line ceiling is rejected", () => {
  const workRoot = makeWorkRoot();
  try {
    const kernelPath = join(workRoot, "core", "kernel.md");
    const bloated = Array.from({ length: 80 }, (_, i) => `line ${i}`).join("\n");
    writeFileSync(kernelPath, bloated);

    let threw = false;
    try {
      execFileSync(process.execPath, [join(workRoot, "core", "validate-core.mjs")], { encoding: "utf8" });
    } catch (error) {
      threw = true;
      assert.match(error.stdout, /PAR-CONTEXT-BUDGET/);
      assert.match(error.stdout, /ERROR/);
    }
    assert.ok(threw, "a kernel.md over budget must make validate-core.mjs exit non-zero");
  } finally {
    rmSync(workRoot, { recursive: true, force: true });
  }
});

test("regression: a profiles/*.json missing a required field is rejected (contracts/profile.schema.json)", () => {
  const workRoot = makeWorkRoot();
  try {
    const profilePath = join(workRoot, "profiles", "factory.json");
    const broken = JSON.parse(readFileSync(profilePath, "utf8"));
    delete broken.governance;
    writeFileSync(profilePath, JSON.stringify(broken, null, 2));

    let threw = false;
    try {
      execFileSync(process.execPath, [join(workRoot, "core", "validate-core.mjs")], { encoding: "utf8" });
    } catch (error) {
      threw = true;
      assert.match(error.stdout, /governance/);
      assert.match(error.stdout, /ERROR/);
    }
    assert.ok(threw, "a profile missing a required field must make validate-core.mjs exit non-zero");
  } finally {
    rmSync(workRoot, { recursive: true, force: true });
  }
});

test("regression: an mcp profile referencing an unregistered server is rejected", () => {
  const workRoot = makeWorkRoot();
  try {
    const profilePath = join(workRoot, "mcp", "profiles", "db-readonly.json");
    const broken = JSON.parse(readFileSync(profilePath, "utf8"));
    broken.servers = ["postgres-readonly"];
    writeFileSync(profilePath, JSON.stringify(broken, null, 2));

    let threw = false;
    try {
      execFileSync(process.execPath, [join(workRoot, "core", "validate-core.mjs")], { encoding: "utf8" });
    } catch (error) {
      threw = true;
      assert.match(error.stdout, /not registered in mcp\/catalog\.json/);
      assert.match(error.stdout, /ERROR/);
    }
    assert.ok(threw, "an mcp profile referencing an unknown server must make validate-core.mjs exit non-zero");
  } finally {
    rmSync(workRoot, { recursive: true, force: true });
  }
});

test("regression: independent review cannot be declared verified without evidence, and no runtime may be left undeclared", () => {
  for (const [label, mutate, expected] of [
    ["verified without evidence", (agents) => { agents.runtimes.opencode = { ...agents.runtimes.opencode, independentReview: "verified", evidence: "evaluation/compat/missing.md" }; }, /runtimes\.opencode is verified but its evidence/],
    ["undeclared runtime", (agents) => { delete agents.runtimes.codex; }, /runtimes\.codex is missing/],
    ["unknown support value", (agents) => { agents.runtimes.claude.independentReview = "yes"; }, /runtimes\.claude\.independentReview must be one of/],
  ]) {
    const workRoot = makeWorkRoot();
    try {
      const agentsPath = join(workRoot, "core", "agents.json");
      const agents = JSON.parse(readFileSync(agentsPath, "utf8"));
      mutate(agents);
      writeFileSync(agentsPath, JSON.stringify(agents, null, 2));
      let threw = false;
      try {
        execFileSync(process.execPath, [join(workRoot, "core", "validate-core.mjs")], { encoding: "utf8" });
      } catch (error) {
        threw = true;
        assert.match(error.stdout, expected, label);
      }
      assert.ok(threw, `${label} must make validate-core.mjs exit non-zero`);
    } finally {
      rmSync(workRoot, { recursive: true, force: true });
    }
  }
});
