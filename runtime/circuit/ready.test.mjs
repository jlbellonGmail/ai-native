import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertEvidenceReady, markReadyForPr, NotReadyError } from "./ready.mjs";

const SUMMARY = ["## Objetivo", "x", "## Resultado", "x", "## Cambios principales", "x", "## Validación", "x",
  "## Decisiones", "x", "## Incidencias", "x", "## Detalle", "x",
  "Estado: DONE", "Versión: v1", "Tipo: Feature", "SDD: LIGHT", "PR: #1", "Merge: abc1234"].join("\n");

function tmpDir() {
  return mkdtempSync(join(tmpdir(), "ai-native-ready-test-"));
}

test("assertEvidenceReady throws listing every missing artifact and review at once", () => {
  const dir = tmpDir();
  try {
    assert.throws(() => assertEvidenceReady(dir, "LIGHT", []), (error) => {
      assert.ok(error instanceof NotReadyError);
      assert.match(error.message, /missing required artifact/);
      assert.match(error.message, /required review 'code' is not approved/);
      return true;
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("assertEvidenceReady passes once artifacts, SUMMARY contract and required reviews are all satisfied", () => {
  const dir = tmpDir();
  try {
    writeFileSync(join(dir, "SUMMARY.md"), SUMMARY, "utf8");
    const events = [{ eventType: "review", stage: "code", verdict: "approved" }];
    assert.doesNotThrow(() => assertEvidenceReady(dir, "LIGHT", events));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("assertEvidenceReady at STANDARD also requires the spec review approved", () => {
  const dir = tmpDir();
  try {
    writeFileSync(join(dir, "SUMMARY.md"), SUMMARY, "utf8");
    writeFileSync(join(dir, "spec.md"), "content\n", "utf8");
    const events = [{ eventType: "review", stage: "code", verdict: "approved" }];
    assert.throws(() => assertEvidenceReady(dir, "STANDARD", events), /required review 'spec' is not approved/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("assertEvidenceReady rejects a rejected latest code review even with everything else satisfied", () => {
  const dir = tmpDir();
  try {
    writeFileSync(join(dir, "SUMMARY.md"), SUMMARY, "utf8");
    const events = [
      { eventType: "review", stage: "code", verdict: "approved" },
      { eventType: "review", stage: "code", verdict: "rejected" },
    ];
    assert.throws(() => assertEvidenceReady(dir, "LIGHT", events), /required review 'code' is not approved \(latest: rejected\)/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("markReadyForPr marks the item [x] directly (no persisted [-] step)", () => {
  const content = "- [ ] 02-item-a - Title\n";
  assert.equal(markReadyForPr(content, ["02-item-a"]), "- [x] 02-item-a - Title\n");
});

test("markReadyForPr throws without mutating if the item is not Pending", () => {
  const content = "- [x] 02-item-a - Title\n";
  assert.throws(() => markReadyForPr(content, ["02-item-a"]));
});
