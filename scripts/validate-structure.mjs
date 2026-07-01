import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const requiredDirs = ["docs", "scripts", "config", "validation", "scaffolds", "templates", "manifests", "examples", "generators"];
const requiredFiles = [
  "README.md",
  "docs/README.md",
  "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md",
  "config/README.md",
  "validation/README.md",
  "validation/roadmap-coverage.json",
  "validation/strategy.md",
  "scaffolds/README.md",
  "scaffolds/ai-native-app/README.md",
  "scaffolds/ai-native-app/files/README.md",
  "templates/README.md",
  "manifests/enterprise-10-10-structure.json",
  "examples/README.md",
  "generators/README.md",
  "generators/create-ai-native-app.mjs",
  "generators/create-ai-native-app/create-ai-native-app.contract.json",
  "docs/setup/PROJECT_BOOTSTRAP.md",
  "scripts/validate-create-ai-native-app.mjs",
  "scripts/validate-generated-project.mjs"
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

const emptyDirs = walkDirs(root).filter((dir) => !dir.includes("_deprecated"));
assert(emptyDirs.length === 0, `empty active directories found: ${emptyDirs.join(", ")}`);

console.log("ai-template structure validation PASS");
