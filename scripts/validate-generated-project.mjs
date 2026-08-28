import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = path.join(root, "generators", "create-ai-native-app", "create-ai-native-app.contract.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(base, relativePath) {
  return existsSync(path.join(base, relativePath));
}

function parseArgs(argv) {
  const args = { target: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--target") {
      args.target = argv[++index] ?? "";
    } else if (arg.startsWith("--target=")) {
      args.target = arg.slice("--target=".length);
    } else if (!arg.startsWith("-") && !args.target) {
      args.target = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

async function loadContract() {
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  assert(contract.id === "create-ai-native-app", "contract id must be create-ai-native-app");
  assert(contract.task === "H2", "contract task must be H2");
  assert(contract.entrypoint === "generators/create-ai-native-app.mjs", "contract entrypoint mismatch");
  assert(contract.scaffold === "scaffolds/ai-native-app/files", "contract scaffold mismatch");
  assert(contract.generatedProject.requiredSddFlow.join(" -> ") === "Specify -> Plan -> Implement -> Verify", "contract SDD flow mismatch");
  return contract;
}

function validateGeneratorAssets(contract) {
  assert(exists(root, contract.entrypoint), `missing generator entrypoint ${contract.entrypoint}`);
  assert(exists(root, contract.scaffold), `missing scaffold ${contract.scaffold}`);
  assert(exists(root, "docs/setup/PROJECT_BOOTSTRAP.md"), "missing bootstrap documentation");

  for (const file of contract.generatedProject.requiredFiles) {
    assert(exists(root, path.join(contract.scaffold, file)), `scaffold missing generated file ${file}`);
  }
}

async function validateGeneratedProject(target, contract) {
  const resolvedTarget = path.resolve(process.cwd(), target);
  assert(existsSync(resolvedTarget), `target does not exist: ${resolvedTarget}`);

  for (const dir of contract.generatedProject.requiredDirectories) {
    assert(exists(resolvedTarget, dir), `generated project missing directory ${dir}`);
  }

  for (const file of contract.generatedProject.requiredFiles) {
    assert(exists(resolvedTarget, file), `generated project missing file ${file}`);
  }

  const manifest = JSON.parse(await readFile(path.join(resolvedTarget, "ai-native.project.json"), "utf8"));
  assert(manifest.generator === "create-ai-native-app", "generated manifest generator mismatch");
  assert(manifest.generatorTask === "AI-NATIVE-HARDENING-V1.1/H2", "generated manifest task mismatch");
  assert(manifest.sdd.flow.join(" -> ") === "Specify -> Plan -> Implement -> Verify", "generated manifest SDD flow mismatch");
  assert(manifest.observability?.task === "AI-NATIVE-HARDENING-V1.1/H3", "generated manifest observability task mismatch");
  assert(manifest.observability.defaultMode === "noop", "generated manifest observability default mismatch");
  assert(manifest.testingProfiles?.task === "AI-NATIVE-HARDENING-V1.1/H4", "generated manifest testing profiles task mismatch");
  assert(manifest.testingProfiles.defaultExecution === "local", "generated testing profiles default mismatch");
  assert(manifest.securityValidation?.task === "AI-NATIVE-HARDENING-V1.1/H6", "generated manifest security validation task mismatch");
  assert(manifest.securityValidation.remoteControlsRequireTargetEvidence === true, "generated security validation must require target evidence");
  assert(manifest.securityValidation.localValidationIsRemotePass === false, "generated security validation must not mark remote PASS locally");

  for (const file of [
    "testing/profiles/testing-profiles.json",
    "testing/smoke/testing-smoke.mjs",
    "docs/testing/executable-testing-profiles.md",
    "docs/security/SECURITY-BOOTSTRAP.md",
    "scripts/validate-testing-profiles.mjs"
  ]) {
    assert(exists(resolvedTarget, file), `generated project missing H4 testing profile file ${file}`);
  }

  const testingProfiles = JSON.parse(await readFile(path.join(resolvedTarget, "testing/profiles/testing-profiles.json"), "utf8"));
  assert(testingProfiles.roadmapTask === "AI-NATIVE-HARDENING-V1.1/H4", "generated testing profiles task mismatch");
  assert(testingProfiles.safety.localOnly === true, "generated testing profiles must be local only");

  const securityBootstrap = await readFile(path.join(resolvedTarget, "docs/security/SECURITY-BOOTSTRAP.md"), "utf8");
  assert(securityBootstrap.includes("AI-NATIVE-HARDENING-V1.1/H6"), "generated security bootstrap task mismatch");
  assert(securityBootstrap.includes("does not prove remote"), "generated security bootstrap must reject remote PASS from local validation");
}

const args = parseArgs(process.argv.slice(2));
const contract = await loadContract();
validateGeneratorAssets(contract);
if (args.target) {
  await validateGeneratedProject(args.target, contract);
}

console.log(args.target ? "generated project validation PASS" : "create-ai-native-app generator validation PASS");
