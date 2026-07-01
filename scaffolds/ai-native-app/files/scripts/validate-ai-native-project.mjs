import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredDirectories = [
  "apps",
  "services/application",
  "services/domain",
  "services/infrastructure",
  "config/ai",
  "docs/sdd",
  "scripts",
  "validation"
];

const requiredFiles = [
  "README.md",
  "package.json",
  "ai-native.project.json",
  "config/ai/sdd-workflow.md",
  "docs/setup.md",
  "docs/sdd/README.md",
  "scripts/validate-ai-native-project.mjs",
  "validation/README.md"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(relativePath) {
  return existsSync(path.join(root, relativePath));
}

for (const dir of requiredDirectories) {
  assert(exists(dir), `missing required directory ${dir}`);
}

for (const file of requiredFiles) {
  assert(exists(file), `missing required file ${file}`);
}

const manifest = JSON.parse(await readFile(path.join(root, "ai-native.project.json"), "utf8"));
assert(manifest.generator === "create-ai-native-app", "manifest generator must be create-ai-native-app");
assert(manifest.generatorTask === "AI-NATIVE-HARDENING-V1.1/H2", "manifest must reference H2");
assert(Array.isArray(manifest.sdd?.flow), "manifest must define sdd.flow");
assert(manifest.sdd.flow.join(" -> ") === "Specify -> Plan -> Implement -> Verify", "manifest must reference canonical SDD flow");

console.log("generated AI-Native project validation PASS");
