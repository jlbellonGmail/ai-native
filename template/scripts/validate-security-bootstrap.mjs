import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const docs = [
  "docs/security/SECURITY-BOOTSTRAP.md",
  "scaffolds/ai-native-app/files/docs/security/SECURITY-BOOTSTRAP.md",
  "templates/project/docs/security/SECURITY-BOOTSTRAP.md"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(relativePath) {
  return existsSync(path.join(root, relativePath));
}

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

for (const doc of docs) {
  assert(exists(doc), `missing ${doc}`);
  const text = await readText(doc);
  assert(text.includes("AI-NATIVE-HARDENING-V1.1/H6"), `${doc} must reference H6`);
  assert(text.includes("Dependency Review"), `${doc} must cover Dependency Review`);
  assert(text.includes("Dependabot"), `${doc} must cover Dependabot`);
  assert(text.includes("SBOM"), `${doc} must cover SBOM`);
  assert(text.includes("attestation"), `${doc} must cover attestations`);
  assert(text.includes("CONTEXTUAL_NON_BLOCKING"), `${doc} must document contextual limitations`);
  assert(text.includes("does not prove remote"), `${doc} must reject remote PASS from local validation`);
}

const contract = await readJson("generators/create-ai-native-app/create-ai-native-app.contract.json");
assert(contract.generatedProject.requiredDirectories.includes("docs/security"), "contract must require docs/security");
assert(
  contract.generatedProject.requiredFiles.includes("docs/security/SECURITY-BOOTSTRAP.md"),
  "contract must require security bootstrap doc"
);

const manifest = await readJson("scaffolds/ai-native-app/files/ai-native.project.json");
assert(manifest.securityValidation?.task === "AI-NATIVE-HARDENING-V1.1/H6", "manifest must reference H6 security validation");
assert(manifest.securityValidation.remoteControlsRequireTargetEvidence === true, "manifest must require target remote evidence");

console.log("security bootstrap validation PASS");
