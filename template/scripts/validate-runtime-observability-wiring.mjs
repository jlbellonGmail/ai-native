import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const scaffoldRoot = path.join(root, "scaffolds", "ai-native-app", "files");
const requiredFiles = [
  "config/observability/runtime-observability.json",
  "docs/observability/runtime-observability.md",
  "services/infrastructure/observability/runtime-observability.mjs"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(base, relativePath) {
  return existsSync(path.join(base, relativePath));
}

async function readJson(base, relativePath) {
  return JSON.parse(await readFile(path.join(base, relativePath), "utf8"));
}

async function validateBase(base, label) {
  for (const file of requiredFiles) {
    assert(exists(base, file), `${label} missing observability file ${file}`);
  }

  const config = await readJson(base, "config/observability/runtime-observability.json");
  assert(config.enabled === false, `${label} observability must default disabled`);
  assert(config.mode === "noop", `${label} observability must default to noop`);
  assert(config.exports_remotely_by_default === false, `${label} must not export remotely by default`);
  assert(config.requires_endpoint === false, `${label} must not require endpoint`);
  assert(config.requires_token === false, `${label} must not require token`);
  assert(config.signals.traces.includes("runtime.agent_task"), `${label} missing runtime trace signal`);
  assert(config.signals.metrics.includes("ai_runtime_operation_total"), `${label} missing operation counter`);
  assert(config.signals.metrics.includes("ai_runtime_operation_duration_ms"), `${label} missing duration histogram`);

  const helper = await readFile(path.join(base, "services/infrastructure/observability/runtime-observability.mjs"), "utf8");
  assert(helper.includes("create_runtime_observability"), `${label} missing helper factory`);
  assert(helper.includes("with_operation"), `${label} missing operation wrapper`);
  assert(!helper.includes("http://") && !helper.includes("https://"), `${label} helper must not hardcode endpoint`);
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

const args = parseArgs(process.argv.slice(2));
await validateBase(scaffoldRoot, "scaffold");
if (args.target) {
  await validateBase(path.resolve(process.cwd(), args.target), "generated project");
}

console.log(args.target ? "generated runtime observability validation PASS" : "runtime observability scaffold validation PASS");
