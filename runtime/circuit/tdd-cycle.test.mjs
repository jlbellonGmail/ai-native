// TDD evidence: a work unit whose test fails first for the right reason, then passes after the
// implementation, then stays green in the regression run. The recorded evidence is the command output.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// the outer runner marks its children; an inner run must report its own status
const { NODE_TEST_CONTEXT, ...env } = process.env;
const run = (dir) => spawnSync(process.execPath, ["--test", "slug.test.mjs"], { cwd: dir, encoding: "utf8", env });

test("TDD cycle: requirement -> test -> expected failure -> implementation -> PASS -> regression", () => {
  const dir = mkdtempSync(join(tmpdir(), "tdd-"));
  writeFileSync(join(dir, "slug.test.mjs"), [
    'import { test } from "node:test";',
    'import assert from "node:assert/strict";',
    'import { slug } from "./slug.mjs";',
    'test("RF-1 slug lowercases and joins words with dashes", () => { assert.equal(slug("Hello  World"), "hello-world"); });',
    'test("RF-2 slug drops punctuation", () => { assert.equal(slug("A, B!"), "a-b"); });',
  ].join("\n"));

  // RED: the stub exists so the failure is an assertion, not a missing file (the right reason)
  writeFileSync(join(dir, "slug.mjs"), "export const slug = () => '';\n");
  const red = run(dir);
  assert.notEqual(red.status, 0, "the test must fail before the implementation");
  assert.match(red.stdout, /RF-1 slug lowercases/);
  assert.match(red.stdout, /AssertionError|expected|actual/i);

  // GREEN: smallest implementation that makes the tests pass
  writeFileSync(join(dir, "slug.mjs"), "export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').join('-');\n");
  const green = run(dir);
  assert.equal(green.status, 0, green.stdout);

  // REFACTOR + regression: same behaviour, same tests
  writeFileSync(join(dir, "slug.mjs"), "const words = (s) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];\nexport const slug = (s) => words(s).join('-');\n");
  assert.equal(run(dir).status, 0);
});
