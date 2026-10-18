import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredProfiles = ["contract-smoke", "coverage-smoke", "mutation-smoke", "load-smoke", "performance-smoke", "chaos-smoke"];

const catalogs = [
  {
    label: "factory",
    path: "testing/profiles/testing-profiles.json",
    smoke: "testing/smoke/testing-smoke.mjs",
    docs: "validation/testing-profiles.md"
  },
  {
    label: "scaffold",
    path: "scaffolds/ai-native-app/files/testing/profiles/testing-profiles.json",
    smoke: "scaffolds/ai-native-app/files/testing/smoke/testing-smoke.mjs",
    docs: "scaffolds/ai-native-app/files/docs/testing/executable-testing-profiles.md",
    validator: "scaffolds/ai-native-app/files/scripts/validate-testing-profiles.mjs"
  },
  {
    label: "project template",
    path: "templates/project/testing/profiles/testing-profiles.json",
    smoke: "templates/project/testing/smoke/testing-smoke.mjs",
    docs: "templates/project/docs/testing/executable-testing-profiles.md",
    validator: "templates/project/scripts/validate-testing-profiles.mjs"
  }
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(relativePath) {
  return existsSync(path.join(root, relativePath));
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

function validateCatalog(label, catalog) {
  assert(catalog.schemaVersion === "testing-profiles.v1", `${label} schema version mismatch`);
  assert(catalog.roadmapTask === "AI-NATIVE-HARDENING-V1.1/H4", `${label} must reference H4`);
  assert(catalog.safety.localOnly === true, `${label} must be local only`);
  assert(catalog.safety.requiresNetwork === false, `${label} must not require network`);
  assert(catalog.safety.requiresSecrets === false, `${label} must not require secrets`);
  assert(catalog.safety.mutatesExternalState === false, `${label} must not mutate external state`);

  const profileIds = catalog.profiles.map((profile) => profile.id);
  assert(JSON.stringify(profileIds) === JSON.stringify(requiredProfiles), `${label} profile order or IDs mismatch`);

  for (const profile of catalog.profiles) {
    assert(profile.required === true, `${label} ${profile.id} must be required`);
    assert(profile.execution === "local", `${label} ${profile.id} must execute locally`);
    assert(profile.command === `npm run test:profiles -- --profile ${profile.id}`, `${label} ${profile.id} command mismatch`);
    assert(profile.evidence.length > 0, `${label} ${profile.id} must describe evidence`);
  }

  const matrixIds = catalog.matrix.map((entry) => entry.profile);
  assert(JSON.stringify(matrixIds) === JSON.stringify(requiredProfiles), `${label} matrix IDs mismatch`);
}

async function runNode(relativePath, args = []) {
  const { stdout, stderr } = await execFileAsync(process.execPath, [path.join(root, relativePath), ...args], {
    cwd: root,
    windowsHide: true
  });
  return `${stdout}${stderr}`;
}

const loadedCatalogs = [];
for (const item of catalogs) {
  for (const requiredFile of [item.path, item.smoke, item.docs, item.validator].filter(Boolean)) {
    assert(exists(requiredFile), `${item.label} missing H4 file ${requiredFile}`);
  }

  const catalog = await readJson(item.path);
  validateCatalog(item.label, catalog);
  loadedCatalogs.push(catalog);
}

const canonicalCommands = loadedCatalogs[0].profiles.map((profile) => profile.command);
for (const catalog of loadedCatalogs.slice(1)) {
  assert(
    JSON.stringify(catalog.profiles.map((profile) => profile.command)) === JSON.stringify(canonicalCommands),
    "testing profile commands must match across factory, scaffold and project template"
  );
}

const packageJson = await readJson("package.json");
assert(packageJson.scripts["validate:testing-profiles"] === "node scripts/validate-testing-profiles.mjs", "missing validate:testing-profiles script");
assert(packageJson.scripts.validate.includes("validate-testing-profiles.mjs"), "validate script must include H4 validator");

for (const smoke of [
  "testing/smoke/testing-smoke.mjs",
  "scaffolds/ai-native-app/files/testing/smoke/testing-smoke.mjs",
  "templates/project/testing/smoke/testing-smoke.mjs"
]) {
  const output = await runNode(smoke);
  assert(output.includes("executable testing profiles smoke PASS"), `${smoke} did not report smoke PASS`);
}

const scaffoldValidator = await runNode("scaffolds/ai-native-app/files/scripts/validate-testing-profiles.mjs");
assert(scaffoldValidator.includes("testing profiles validation PASS"), "generated project testing validator did not pass");

const projectTemplateValidator = await runNode("templates/project/scripts/validate-testing-profiles.mjs");
assert(projectTemplateValidator.includes("testing profiles validation PASS"), "project template testing validator did not pass");

console.log("executable testing profiles validation PASS");
