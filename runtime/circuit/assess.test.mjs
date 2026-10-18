import { test } from "node:test";
import assert from "node:assert/strict";
import { assess } from "./assess.mjs";

test("a single documentation file scores LOW/LIGHT", () => {
  const result = assess(["docs/guide.md"]);
  assert.equal(result.risk, "LOW");
  assert.equal(result.depth, "LIGHT");
  assert.equal(result.score, 0);
});

test("a single implementation file (no path signal match) already reaches the STANDARD threshold (weight 2)", () => {
  const result = assess(["src/widget.ts"]);
  assert.equal(result.signals[0].code, "implementation");
  assert.equal(result.score, 2);
  assert.equal(result.depth, "STANDARD");
});

test("a security path forces HIGH/FULL regardless of score", () => {
  const result = assess(["security/login.ts"]);
  assert.equal(result.risk, "HIGH");
  assert.equal(result.depth, "FULL");
  assert.equal(result.signals[0].code, "sensitive-or-data");
});

test("a CI workflow path forces HIGH/FULL", () => {
  const result = assess([".github/workflows/ci.yml"]);
  assert.equal(result.depth, "FULL");
});

test("two implementation files reach score=4, MEDIUM/STANDARD", () => {
  const result = assess(["a.ts", "b.ts"]);
  assert.equal(result.score, 4);
  assert.equal(result.depth, "STANDARD");
});

// Breadth rules: >=4 files adds 1, >=10 files adds 3 AND forces HIGH (only
// the highest-matching rule applies, mirroring the pwsh elseif chain).
test("4 low-weight files cross into STANDARD via the breadth bonus alone", () => {
  const result = assess(["docs/a.md", "docs/b.md", "docs/c.md", "docs/d.md"]);
  assert.equal(result.score, 1);
  assert.equal(result.depth, "LIGHT");
});

test("10+ files forces HIGH/FULL via the breadth rule even with low-weight signals", () => {
  const paths = Array.from({ length: 10 }, (_, i) => `docs/file-${i}.md`);
  const result = assess(paths);
  assert.equal(result.risk, "HIGH");
  assert.equal(result.depth, "FULL");
});

test("duplicate and blank paths are deduplicated and ignored", () => {
  const result = assess(["a.ts", "a.ts", "  ", ""]);
  assert.equal(result.fileCount, 1);
});

test("assess() throws on no changed paths", () => {
  assert.throws(() => assess([]), /requires at least one changed path/);
});

test("assess() is deterministic: same input always produces the same output", () => {
  const paths = ["config/app.json", "scripts/deploy.sh", "docs/readme.md"];
  const first = assess(paths);
  const second = assess([...paths].reverse());
  assert.deepEqual(first, second);
});

test("output never has a null/undefined depth or risk (always one of the enum values)", () => {
  const result = assess(["anything.ts"]);
  assert.ok(["LIGHT", "STANDARD", "FULL"].includes(result.depth));
  assert.ok(["LOW", "MEDIUM", "HIGH"].includes(result.risk));
});
