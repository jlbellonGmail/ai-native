import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getEvidenceContract, checkRequiredArtifacts, checkSummaryContract, parseLegacyVerdictArtifact, assertLegacyVerdictApproved } from "./contract.mjs";

test("getEvidenceContract mirrors contracts/sdd-levels.json for every depth", () => {
  assert.deepEqual(getEvidenceContract("LIGHT").requiredArtifacts, ["SUMMARY.md"]);
  assert.deepEqual(getEvidenceContract("STANDARD").requiredArtifacts, ["SUMMARY.md", "spec.md"]);
  assert.deepEqual(getEvidenceContract("FULL").requiredArtifacts, ["SUMMARY.md", "spec.md", "plan.md", "tasks.md", "decision.md"]);
  assert.equal(getEvidenceContract("FULL").convergenceBudget, 6);
});

test("getEvidenceContract throws on an unknown depth (no silent default)", () => {
  assert.throws(() => getEvidenceContract("MEDIUM"), /unknown SDD depth/);
});

function tmpDir() {
  return mkdtempSync(join(tmpdir(), "ai-native-contract-test-"));
}

test("checkRequiredArtifacts reports every missing artifact for the depth, not just the first", () => {
  const dir = tmpDir();
  try {
    const result = checkRequiredArtifacts(dir, "FULL");
    assert.equal(result.ok, false);
    assert.deepEqual(result.missing.sort(), ["SUMMARY.md", "decision.md", "plan.md", "spec.md", "tasks.md"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkRequiredArtifacts passes once every required artifact exists and is non-empty", () => {
  const dir = tmpDir();
  try {
    writeFileSync(join(dir, "SUMMARY.md"), "content\n", "utf8");
    const result = checkRequiredArtifacts(dir, "LIGHT");
    assert.equal(result.ok, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkRequiredArtifacts treats an empty file the same as a missing one", () => {
  const dir = tmpDir();
  try {
    writeFileSync(join(dir, "SUMMARY.md"), "", "utf8");
    assert.equal(checkRequiredArtifacts(dir, "LIGHT").ok, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const FULL_SUMMARY = [
  "## Objetivo", "x", "## Resultado", "x", "## Cambios principales", "x", "## Validación", "x",
  "## Decisiones", "x", "## Incidencias", "x", "## Detalle", "x",
  "Estado: DONE", "Versión: v1", "Tipo: Feature", "SDD: STANDARD", "PR: #1", "Merge: abc1234",
].join("\n");

test("checkSummaryContract passes for a complete 7-section/6-field SUMMARY.md", () => {
  assert.deepEqual(checkSummaryContract(FULL_SUMMARY, "STANDARD"), { ok: true, missingSections: [], missingFields: [], usedLightIntent: false });
});

test("checkSummaryContract reports a missing section by name", () => {
  const broken = FULL_SUMMARY.replace("## Incidencias\nx\n", "");
  const result = checkSummaryContract(broken, "STANDARD");
  assert.equal(result.ok, false);
  assert.deepEqual(result.missingSections, ["Incidencias"]);
});

test("checkSummaryContract reports a missing field by name", () => {
  const broken = FULL_SUMMARY.replace("Merge: abc1234", "");
  const result = checkSummaryContract(broken, "STANDARD");
  assert.equal(result.missingFields, result.missingFields); // sanity
  assert.ok(result.missingFields.includes("Merge"));
});

test("checkSummaryContract accepts LIGHT's compact Intent section in place of the full 7 sections", () => {
  const lightSummary = ["## Intent", "x", "Estado: DONE", "Versión: v1", "Tipo: Feature", "SDD: LIGHT", "PR: #1", "Merge: abc1234"].join("\n");
  const result = checkSummaryContract(lightSummary, "LIGHT");
  assert.equal(result.ok, true);
  assert.equal(result.usedLightIntent, true);
});

test("checkSummaryContract at STANDARD/FULL does not accept the LIGHT Intent shortcut", () => {
  const lightSummary = ["## Intent", "x", "Estado: DONE", "Versión: v1", "Tipo: Feature", "SDD: STANDARD", "PR: #1", "Merge: abc1234"].join("\n");
  const result = checkSummaryContract(lightSummary, "STANDARD");
  assert.equal(result.ok, false);
});

// --- legacy verdict artifact compatibility (PAR-VERDICT-COMPAT) ---

function approvedArtifact(name, attempt, status = "approved") {
  return { name, content: `# ${name}\n\n\`\`\`yaml\nstatus: ${status}\nattempt: ${attempt}\n\`\`\`\n` };
}

test("parseLegacyVerdictArtifact selects the highest REAL integer attempt, not lexicographic order", () => {
  const entries = [approvedArtifact("audit-2.md", 2), approvedArtifact("audit-10.md", 10, "rejected")];
  const result = parseLegacyVerdictArtifact(entries, "audit");
  assert.equal(result.attempt, 10, "audit-10 must win over audit-2, lexicographic order would pick audit-2");
  assert.equal(result.status, "rejected");
});

test("parseLegacyVerdictArtifact throws when no matching file exists", () => {
  assert.throws(() => parseLegacyVerdictArtifact([], "audit"), /missing at least one/);
});

test("parseLegacyVerdictArtifact throws on a missing yaml fenced block", () => {
  const entries = [{ name: "audit-1.md", content: "# no yaml here" }];
  assert.throws(() => parseLegacyVerdictArtifact(entries, "audit"), /no valid.*yaml/);
});

test("parseLegacyVerdictArtifact's status check is case-sensitive: 'Approved' is invalid, not accepted", () => {
  const entries = [approvedArtifact("audit-1.md", 1, "Approved")];
  assert.throws(() => parseLegacyVerdictArtifact(entries, "audit"), /missing or invalid status/);
});

test("parseLegacyVerdictArtifact throws when attempt does not match the filename's number", () => {
  const entries = [{ name: "audit-3.md", content: "```yaml\nstatus: approved\nattempt: 1\n```\n" }];
  assert.throws(() => parseLegacyVerdictArtifact(entries, "audit"), /does not match the filename/);
});

test("assertLegacyVerdictApproved throws when the latest attempt is rejected, even if an earlier one was approved", () => {
  const entries = [approvedArtifact("code-review-1.md", 1, "approved"), approvedArtifact("code-review-2.md", 2, "rejected")];
  assert.throws(() => assertLegacyVerdictApproved(entries, "code-review", "code review"), /not approved/);
});

test("assertLegacyVerdictApproved passes when the latest (highest-numbered) attempt is approved", () => {
  const entries = [approvedArtifact("code-review-1.md", 1, "rejected"), approvedArtifact("code-review-2.md", 2, "approved")];
  assert.doesNotThrow(() => assertLegacyVerdictApproved(entries, "code-review", "code review"));
});
