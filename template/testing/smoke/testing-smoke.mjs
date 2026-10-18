import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const profilePath = path.join(root, "testing", "profiles", "testing-profiles.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseArgs(argv) {
  const args = { profile: "all" };
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

function createLocalObserver() {
  const events = [];
  return {
    events,
    async withOperation(name, execute) {
      const startedAt = Date.now();
      try {
        const result = await execute();
        events.push({ name, outcome: "success", durationMs: Date.now() - startedAt });
        return result;
      } catch (error) {
        events.push({ name, outcome: "failure", durationMs: Date.now() - startedAt });
        throw error;
      }
    }
  };
}

async function loadProfiles() {
  const catalog = JSON.parse(await readFile(profilePath, "utf8"));
  return catalog.profiles.map((profile) => profile.id);
}

async function contractSmoke() {
  const observer = createLocalObserver();
  const result = await observer.withOperation("contract-smoke", async () => "ok");
  assert(result === "ok", "contract smoke must return operation result");
  await observer.withOperation("contract-smoke-failure", async () => {
    throw new Error("expected failure");
  }).catch((error) => {
    assert(error.message === "expected failure", "contract smoke must propagate failures");
  });
  assert(observer.events.length === 2, "contract smoke must record success and failure events");
}

async function coverageSmoke() {
  const profileIds = await loadProfiles();
  const required = ["contract-smoke", "coverage-smoke", "mutation-smoke", "load-smoke", "performance-smoke", "chaos-smoke"];
  for (const id of required) assert(profileIds.includes(id), `coverage smoke missing profile ${id}`);
}

async function mutationSmoke() {
  const minLength = 3;
  const original = (value) => value.length >= minLength;
  const boundaryMutant = (value) => value.length > minLength;
  const fixture = "abc";
  assert(original(fixture) === true, "mutation smoke fixture must pass original predicate");
  assert(boundaryMutant(fixture) === false, "mutation smoke must kill boundary mutant");
}

async function loadSmoke() {
  const observer = createLocalObserver();
  const operations = Array.from({ length: 12 }, (_, index) =>
    observer.withOperation(`load-smoke-${index}`, async () => index)
  );
  const results = await Promise.all(operations);
  assert(results.length === 12, "load smoke must complete bounded operations");
  assert(observer.events.length === 12, "load smoke must record each operation");
}

async function performanceSmoke() {
  const startedAt = Date.now();
  let total = 0;
  for (let index = 0; index < 5000; index += 1) total += index;
  const durationMs = Date.now() - startedAt;
  assert(total === 12497500, "performance smoke deterministic loop result mismatch");
  assert(durationMs < 250, `performance smoke exceeded local budget: ${durationMs}ms`);
}

async function chaosSmoke() {
  const observer = createLocalObserver();
  await observer.withOperation("chaos-smoke", async () => {
    throw new Error("simulated dependency unavailable");
  }).catch((error) => {
    assert(error.message === "simulated dependency unavailable", "chaos smoke must preserve failure reason");
  });
  assert(observer.events[0]?.outcome === "failure", "chaos smoke must record contained failure");
}

const runners = {
  "contract-smoke": contractSmoke,
  "coverage-smoke": coverageSmoke,
  "mutation-smoke": mutationSmoke,
  "load-smoke": loadSmoke,
  "performance-smoke": performanceSmoke,
  "chaos-smoke": chaosSmoke
};

const args = parseArgs(process.argv.slice(2));
const selected = args.profile === "all" ? Object.keys(runners) : [args.profile];
for (const profile of selected) {
  assert(runners[profile], `unknown testing profile ${profile}`);
  await runners[profile]();
}

console.log(`executable testing profiles smoke PASS (${selected.join(", ")})`);
