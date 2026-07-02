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
  "config/observability",
  "docs/sdd",
  "docs/observability",
  "scripts",
  "validation"
];

const requiredFiles = [
  "README.md",
  "package.json",
  "ai-native.project.json",
  "config/ai/sdd-workflow.md",
  "config/observability/runtime-observability.json",
  "docs/setup.md",
  "docs/sdd/README.md",
  "docs/observability/runtime-observability.md",
  "scripts/validate-ai-native-project.mjs",
  "services/infrastructure/observability/runtime-observability.mjs",
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
assert(manifest.observability?.task === "AI-NATIVE-HARDENING-V1.1/H3", "manifest must reference H3 observability");
assert(manifest.observability.defaultMode === "noop", "observability default mode must be noop");

const observabilityConfig = JSON.parse(await readFile(path.join(root, "config/observability/runtime-observability.json"), "utf8"));
assert(observabilityConfig.enabled === false, "observability must default disabled");
assert(observabilityConfig.mode === "noop", "observability config mode must be noop");
assert(observabilityConfig.exports_remotely_by_default === false, "observability must not export remotely by default");

console.log("generated AI-Native project validation PASS");
