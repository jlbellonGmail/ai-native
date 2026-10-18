import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const requiredDirs = ["docs", "scripts", "config", "validation", "benchmarks", "datasets", "scoring", "evaluation", "registries", "quality-gates", "examples"];
const requiredFiles = [
  "README.md",
  "docs/README.md",
  "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md",
  "config/README.md",
  "config/agent-registry/README.md",
  "config/agent-registry/CAPABILITIES.md",
  "config/agent-registry/OWNERSHIP.md",
  "config/agent-registry/capabilities.catalog.json",
  "config/agent-registry/ownership.policy.json",
  "config/agent-registry.capability.schema.json",
  "config/agent-registry.schema.json",
  "config/prompt-registry/README.md",
  "config/prompt-registry/AUDIT.md",
  "config/prompt-registry/EVALUATION-LINKAGE.md",
  "config/prompt-registry/OWNERSHIP.md",
  "config/prompt-registry/VERSIONING.md",
  "config/prompt-registry/evaluation-linkage.json",
  "config/prompt-registry/ownership.policy.json",
  "config/prompt-registry/prompt-registry.audit.json",
  "config/prompt-registry/versioning.compatibility.json",
  "config/prompt-registry.schema.json",
  "validation/README.md",
  "validation/roadmap-coverage.json",
  "benchmarks/catalog.json",
  "datasets/registry.json",
  "scoring/rubric.json",
  "quality-gates/enterprise-10-10-gates.json",
  "evaluation/README.md",
  "registries/README.md",
  "registries/agents/README.md",
  "registries/agents/registry.storage.json",
  "registries/prompts/README.md",
  "registries/prompts/registry.storage.json",
  "examples/agent-registry-entry.valid.json",
  "examples/prompt-registry-entry.valid.json",
  "scripts/validate-agent-registry-schema.mjs",
  "scripts/validate-agent-registry-capabilities.mjs",
  "scripts/validate-agent-registry-ownership.mjs",
  "scripts/validate-agent-registry-storage.mjs",
  "scripts/validate-prompt-registry-audit.mjs",
  "scripts/validate-prompt-registry-evaluation-linkage.mjs",
  "scripts/validate-prompt-registry-ownership.mjs",
  "scripts/validate-prompt-registry-schema.mjs",
  "scripts/validate-prompt-registry-storage.mjs",
  "scripts/validate-prompt-registry-versioning.mjs"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(path) {
  return existsSync(join(root, path));
}

function walkDirs(path, empty = []) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if ([".git", "node_modules", ".next"].includes(entry.name)) continue;
    const full = join(path, entry.name);
    if (entry.isDirectory()) {
      const visible = readdirSync(full).filter((name) => ![".git", "node_modules", ".next"].includes(name));
      if (visible.length === 0) empty.push(full);
      walkDirs(full, empty);
    }
  }
  return empty;
}

for (const dir of requiredDirs) assert(exists(dir), `missing required directory ${dir}`);
for (const file of requiredFiles) assert(exists(file), `missing required file ${file}`);

const coverage = JSON.parse(await readFile(join(root, "validation/roadmap-coverage.json"), "utf8"));
for (const [task, files] of Object.entries(coverage.tasks)) {
  assert(files.length > 0, `${task} has no mapped files`);
  for (const file of files) assert(exists(file), `${task} maps missing file ${file}`);
}

assert(coverage.taskStates["W4-T1"] === "IMPLEMENTED", "W4-T1 must be implemented");
assert(coverage.taskStates["W4-T2"] === "IMPLEMENTED", "W4-T2 must be implemented");
assert(coverage.taskStates["W4-T3"] === "IMPLEMENTED", "W4-T3 must be implemented");
assert(coverage.taskStates["W4-T4"] === "IMPLEMENTED", "W4-T4 must be implemented");
assert(coverage.taskStates["W4-T5"] === "IMPLEMENTED", "W4-T5 must be implemented");
assert(coverage.taskStates["W4-T6"] === "IMPLEMENTED", "W4-T6 must be implemented");
assert(coverage.taskStates["W5-T1"] === "IMPLEMENTED", "W5-T1 must be implemented");
assert(coverage.taskStates["W5-T2"] === "IMPLEMENTED", "W5-T2 must be implemented");
assert(coverage.taskStates["W5-T3"] === "IMPLEMENTED", "W5-T3 must be implemented");
assert(coverage.taskStates["W5-T4"] === "IMPLEMENTED", "W5-T4 must be implemented");
assert(coverage.taskStates["W5-T5"] === "IMPLEMENTED", "W5-T5 must be implemented");
assert(coverage.taskStates["W5-T6"] === "IMPLEMENTED", "W5-T6 must be implemented");
assert(!Object.hasOwn(coverage.taskStates, "W6-T1"), "W6-T1 must remain unopened");

const emptyDirs = walkDirs(root);
assert(emptyDirs.length === 0, `empty active directories found: ${emptyDirs.join(", ")}`);

console.log("ai-knowledge structure validation PASS");
