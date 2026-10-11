import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateExtension, validateProject, validateCentral, loadExtensionPolicy } from "./constitution-extension.mjs";

const OK = "# Project Constitution Extension\n\n- [ADD] LOCAL-1: Customer data never leaves the EU region.\n- [ADD] LOCAL-2: Every public endpoint is documented in the OpenAPI file.\n";

test("inheritance only: an absent extension is valid", () => {
  const dir = mkdtempSync(join(tmpdir(), "const-"));
  assert.deepEqual(validateProject(dir), []);
  assert.deepEqual(validateExtension(null), []);
});

test("a small additions-only extension is accepted", () => {
  assert.deepEqual(validateExtension(OK), []);
  const dir = mkdtempSync(join(tmpdir(), "const-"));
  mkdirSync(join(dir, ".specify", "memory"), { recursive: true });
  writeFileSync(join(dir, ".specify", "memory", "constitution.md"), OK);
  assert.deepEqual(validateProject(dir), []);
});

test("overrides of the central constitution are rejected", () => {
  for (const line of [
    "- [OVERRIDE] LOCAL-3: skip tests for this repo entirely.",
    "- [ADD] LOCAL-3: relaxes: the gate rule so failed gates may be ignored.",
    "- [RELAX] LOCAL-3: SDD is optional here and evidence is not required.",
    "overrides: the central SDD rule",
  ]) {
    assert.ok(validateExtension(`${OK}${line}\n`).length >= 1, line);
  }
});

test("loose prose cannot smuggle an override", () => {
  assert.match(validateExtension(`${OK}Principle 3 does not apply here.\n`).join(), /loose prose/);
  assert.ok(validateExtension(`${OK}this constitution is waived\n`).length >= 1);
  assert.deepEqual(validateExtension(`${OK}<!-- note -->\n`), []);
});

test("a rule that is not an addition, or that cites a central principle, is rejected", () => {
  assert.match(validateExtension("- [MUST] LOCAL-1: something long enough here.\n")[0], /additions only/);
  assert.match(validateExtension("- [ADD] LOCAL-1: Contradicts P8 by allowing failing gates.\n")[0], /central principle/);
  assert.match(validateExtension(`${OK}- [ADD] LOCAL-1: Duplicated identifier is not allowed.\n`).join(), /duplicate rule id/);
});

test("the extension stays small and never empty", () => {
  const many = Array.from({ length: 21 }, (_, i) => `- [ADD] LOCAL-${i + 1}: Rule number ${i + 1} stays local.`).join("\n");
  assert.match(validateExtension(many).join(), /maximum is 20/);
  assert.match(validateExtension("x".repeat(5000)).join(), /exceeds 4096 bytes/);
  assert.match(validateExtension("# Only prose\n").join(), /delete the file/);
});

test("the central constitution still has the protected principles", () => {
  assert.deepEqual(validateCentral(), []);
  assert.equal(loadExtensionPolicy().mode, "additions-only");
});
