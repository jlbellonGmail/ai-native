// v4.0.2: the acceptance guarantees the spec phase already promises (/sdd-spec writes acceptance criteria,
// /sdd-analyze checks that every requirement is covered by a task) become observable in `sdd validate`
// as WARN lines. They never change an exit code, `validateSpecFolder` or the review VALIDATION result.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { specWarnings, validateSpecFolder } from "./sdd-workflow.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "sdd-cli.mjs");
const PLAN = "# Plan\nx\n";
const task = (id, refs, box = " ") => `- [${box}] **${id}. Do ${id}.** ${refs}\n  - Done when: test passes.\n`;

function folder(files) {
  const dir = mkdtempSync(join(tmpdir(), "sdd-acc-"));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  return dir;
}

test("a spec with acceptance criteria and every requirement covered has no warnings", () => {
  const spec = "# 001\n## Requirements\n- RF-1. THE SYSTEM SHALL a.\n- RF-2. THE SYSTEM SHALL b.\n## Acceptance criteria\n- CA-1. a works (RF-1).\n- CA-2. b works (RF-2).\n";
  assert.deepEqual(specWarnings(folder({ "spec.md": spec, "plan.md": PLAN, "tasks.md": task("T1", "RF-1") + task("T2", "RF-2") })), []);
});

test("the Spanish heading counts as the acceptance criteria section, numbered or not", () => {
  for (const heading of ["## Criterios de aceptación", "### 7. Criterios de aceptacion", "## Acceptance Criteria (testable)"]) {
    const spec = `# 001\n- RF-1. THE SYSTEM SHALL a.\n${heading}\n- CA-1. a works.\n`;
    assert.deepEqual(specWarnings(folder({ "spec.md": spec, "plan.md": PLAN, "tasks.md": task("T1", "RF-1") })), [], heading);
  }
});

test("a spec without an acceptance criteria section is warned, never failed", () => {
  const dir = folder({ "spec.md": "# 001\n- RF-1. THE SYSTEM SHALL a.\n", "plan.md": PLAN, "tasks.md": task("T1", "RF-1") });
  const warnings = specWarnings(dir);
  assert.equal(warnings.length, 1, warnings.join("|"));
  assert.match(warnings[0], /no acceptance criteria section/);
  assert.deepEqual(validateSpecFolder(dir), [], "the structural check (and so the review VALIDATION) is unchanged");
});

test("a requirement no task cites is warned; ids defined under the acceptance criteria heading are criteria, not requirements", () => {
  const spec = "# 001\n- RF-1. THE SYSTEM SHALL a.\n- RF-2. THE SYSTEM SHALL b.\n- NFR-1. Fast.\n- NFR-2. Small.\n- HU-1. As a user.\n## Acceptance criteria\n- CA-1. a works.\n### Edge\n- CA-2. still a criterion.\n## Non-goals\n- RF-9. listed after the criteria section closed.\n";
  const warnings = specWarnings(folder({ "spec.md": spec, "plan.md": PLAN, "tasks.md": task("T1", "RF-1") + task("T2", "NFR-1") }));
  assert.deepEqual(warnings.map((w) => w.split(" ")[0]), ["RF-2", "NFR-2", "RF-9"], warnings.join("|"));
  assert.ok(warnings.every((w) => /not cited by any task/.test(w)));
  // a family no task ever cites (user stories HU-) is not the project's requirement convention: no warning for it
  assert.ok(!warnings.some((w) => w.startsWith("HU-")));
});

test("no tasks.md yet: only the acceptance section is checked; light needs nothing", () => {
  assert.deepEqual(specWarnings(folder({ "spec.md": "# 001\n- RF-1. THE SYSTEM SHALL a.\n## Acceptance criteria\n- CA-1. ok.\n" })), []);
  assert.deepEqual(specWarnings(folder({}), { level: "light" }), []);
  assert.deepEqual(specWarnings(folder({})), [], "a missing spec.md is an error of validateSpecFolder, not a warning");
});

test("sdd validate prints WARN lines and keeps exit 0; --json carries them; a FAIL stays a FAIL", () => {
  const project = mkdtempSync(join(tmpdir(), "sdd-acc-cli-"));
  const dir = join(project, "specs", "001-demo");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "spec.md"), "# 001\n- RF-1. THE SYSTEM SHALL a.\n- RF-2. THE SYSTEM SHALL b.\n");
  writeFileSync(join(dir, "plan.md"), PLAN);
  writeFileSync(join(dir, "tasks.md"), task("T1", "RF-1", "x"));
  const run = (...args) => spawnSync(process.execPath, [CLI, ...args, "--project", project], { encoding: "utf8" });
  const text = run("validate", "001-demo");
  assert.equal(text.status, 0, text.stderr);
  assert.match(text.stdout, /^PASS: specs\/001-demo is structurally valid at level normal$/m);
  assert.match(text.stdout, /^WARN: spec\.md has no acceptance criteria section/m);
  assert.match(text.stdout, /^WARN: RF-2 is not cited by any task/m);
  const json = JSON.parse(run("validate", "001-demo", "--json").stdout);
  assert.equal(json.ok, true);
  assert.deepEqual(json.errors, []);
  assert.equal(json.warnings.length, 2);
  writeFileSync(join(dir, "tasks.md"), "- [ ] **T1. Bad.** RF-9\n  - Done when: x.\n");
  const failed = run("validate", "001-demo");
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /^FAIL: .*cites RF-9/m);
});

test("review findings: tasks that cite nothing, an uncited RNF family and only-invalid task lines still warn", () => {
  const spec = "# 001\n- RF-1. a.\n- RF-2. b.\n- RNF-1. fast.\n## Acceptance criteria\n- CA-1. ok.\n";
  const none = specWarnings(folder({ "spec.md": spec, "plan.md": PLAN, "tasks.md": "- [ ] **T1. Do it.**\n  - Done when: ok.\n" }));
  assert.deepEqual(none.map((w) => w.split(" ")[0]), ["RF-1", "RF-2", "RNF-1"], none.join("|"));
  const onlyRf = specWarnings(folder({ "spec.md": spec, "plan.md": PLAN, "tasks.md": task("T1", "RF-1, RF-2") }));
  assert.deepEqual(onlyRf.map((w) => w.split(" ")[0]), ["RNF-1"], onlyRf.join("|"));
  const invalid = specWarnings(folder({ "spec.md": spec, "plan.md": PLAN, "tasks.md": "- [?] broken RF-1\n" }));
  assert.deepEqual(invalid.map((w) => w.split(" ")[0]), ["RF-1", "RF-2", "RNF-1"], invalid.join("|"));
});

test("review findings: fenced code, CRLF and heading variants do not distort the acceptance section", () => {
  const fenced = "# 001\n- RF-1. a.\n## Acceptance criteria\n```sh\n# run the suite\n```\n- CA-2. still a criterion.\n";
  assert.deepEqual(specWarnings(folder({ "spec.md": fenced, "plan.md": PLAN, "tasks.md": task("T1", "RF-1, CA-1") })), [], "CA-2 stays a criterion");
  const crlf = "# 001\r\n- RF-1. a.\r\n## Acceptance criteria\r\n- CA-1. ok.\r\n";
  assert.deepEqual(specWarnings(folder({ "spec.md": crlf, "plan.md": PLAN, "tasks.md": task("T1", "RF-1") })), []);
  for (const heading of ["## 7.1 Acceptance criteria", "## **Acceptance criteria**", "  ## Acceptance criteria", "## Criterios de aceptación"]) {
    const spec = `# 001\n- RF-1. a.\n${heading}\n- CA-1. ok.\n`;
    assert.deepEqual(specWarnings(folder({ "spec.md": spec, "plan.md": PLAN, "tasks.md": task("T1", "RF-1") })), [], JSON.stringify(heading));
  }
});

test("sdd validate --level light reports no warnings", () => {
  const project = mkdtempSync(join(tmpdir(), "sdd-acc-light-"));
  mkdirSync(join(project, "specs", "001-demo"), { recursive: true });
  const r = spawnSync(process.execPath, [CLI, "validate", "001-demo", "--level", "light", "--json", "--project", project], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).warnings, []);
});
