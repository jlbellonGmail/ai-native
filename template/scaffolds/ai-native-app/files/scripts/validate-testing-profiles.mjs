import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredProfiles = ["contract-smoke", "coverage-smoke", "mutation-smoke", "load-smoke", "performance-smoke", "chaos-smoke"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(relativePath) {
  return existsSync(path.join(root, relativePath));
}

function parseArgs(argv) {
  const args = { profile: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--profile") {
      args.profile = argv[++index] ?? "";
    } else if (arg.startsWith("--profile=")) {
      args.profile = arg.slice("--profile=".length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

for (const file of [
  "testing/profiles/testing-profiles.json",
  "testing/smoke/testing-smoke.mjs",
  "docs/testing/executable-testing-profiles.md"
]) {
  assert(exists(file), `missing testing profile asset ${file}`);
}

const catalog = JSON.parse(await readFile(path.join(root, "testing/profiles/testing-profiles.json"), "utf8"));
assert(catalog.schemaVersion === "testing-profiles.v1", "testing profiles schema version mismatch");
assert(catalog.roadmapTask === "AI-NATIVE-HARDENING-V1.1/H4", "testing profiles must reference H4");
assert(catalog.safety.localOnly === true, "testing profiles must be local only");
assert(catalog.safety.requiresNetwork === false, "testing profiles must not require network");
assert(catalog.safety.requiresSecrets === false, "testing profiles must not require secrets");
assert(catalog.safety.mutatesExternalState === false, "testing profiles must not mutate external state");

const profileIds = catalog.profiles.map((profile) => profile.id);
for (const id of requiredProfiles) {
  assert(profileIds.includes(id), `missing required testing profile ${id}`);
}

for (const profile of catalog.profiles) {
  assert(profile.required === true, `${profile.id} must be required`);
  assert(profile.execution === "local", `${profile.id} must execute locally`);
  assert(profile.command === `npm run test:profiles -- --profile ${profile.id}`, `${profile.id} command mismatch`);
  assert(profile.evidence && profile.evidence.length > 0, `${profile.id} must describe evidence`);
}

if (args.profile) {
  assert(profileIds.includes(args.profile), `unknown testing profile ${args.profile}`);
}

const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
assert(packageJson.scripts["validate:testing-profiles"] === "node scripts/validate-testing-profiles.mjs", "missing validate:testing-profiles script");
assert(packageJson.scripts["test:profiles"] === "node testing/smoke/testing-smoke.mjs", "missing test:profiles script");
assert(packageJson.scripts.validate.includes("validate-testing-profiles.mjs"), "validate script must include testing profiles validator");

console.log(args.profile ? `testing profile validation PASS (${args.profile})` : "testing profiles validation PASS");
