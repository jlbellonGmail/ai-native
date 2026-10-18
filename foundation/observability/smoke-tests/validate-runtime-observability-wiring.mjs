import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const requiredFiles = [
  "observability/runtime-wiring.md",
  "observability/runtime-wiring/runtime-observability.contract.json",
  "observability/runtime-wiring/runtime-observability.ts",
  "observability/opentelemetry-example/runtime-observability-example.ts",
  "runtime/core/runtime.ts"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(relativePath) {
  return existsSync(path.join(root, relativePath));
}

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

for (const file of requiredFiles) {
  assert(exists(file), `missing required H3 file ${file}`);
}

const contract = JSON.parse(await read("observability/runtime-wiring/runtime-observability.contract.json"));
assert(contract.id === "runtime-observability-wiring", "contract id mismatch");
assert(contract.task === "H3", "contract task must be H3");
assert(contract.status === "IMPLEMENTED", "contract status must be IMPLEMENTED");
assert(contract.runtimeDefault.enabled === false, "runtime default must be disabled");
assert(contract.runtimeDefault.mode === "noop", "runtime default mode must be noop");
assert(contract.runtimeDefault.requiresEndpoint === false, "runtime default must not require endpoint");
assert(contract.runtimeDefault.requiresToken === false, "runtime default must not require token");
assert(contract.runtimeDefault.exportsRemotelyByDefault === false, "runtime default must not export remotely");

for (const signal of ["traces", "metrics", "logs"]) {
  assert(Array.isArray(contract.signals[signal]) && contract.signals[signal].length > 0, `missing ${signal} signals`);
}

for (const record of ["obs-001-request-success", "obs-002-tool-latency", "obs-008-incident-retention"]) {
  assert(contract.bindings.enterpriseObservabilityRecords.includes(record), `missing enterprise binding ${record}`);
}

const wiringSource = await read("observability/runtime-wiring/runtime-observability.ts");
assert(wiringSource.includes("runtimeObservabilityConfigFromEnv"), "runtime wiring must expose env config");
assert(wiringSource.includes("AI_NATIVE_OBSERVABILITY_ENABLED"), "runtime wiring must use explicit env toggle");
assert(wiringSource.includes("ai_runtime_operation_total"), "runtime wiring must define operation counter");
assert(wiringSource.includes("ai_runtime_operation_duration_ms"), "runtime wiring must define duration histogram");

const runtimeSource = await read("runtime/core/runtime.ts");
assert(runtimeSource.includes("createRuntimeObservability"), "AIRuntime must create runtime observability");
assert(runtimeSource.includes("runtime.agent_task"), "AIRuntime must wrap agent task operation");

const serialized = JSON.stringify(contract);
assert(!serialized.includes("http://"), "contract must not hardcode http endpoint");
assert(!serialized.includes("https://"), "contract must not hardcode https endpoint");
assert(!serialized.includes("Bearer "), "contract must not include bearer token material");
assert(!serialized.includes("sk-"), "contract must not include API key material");

console.log("runtime observability wiring validation PASS");
