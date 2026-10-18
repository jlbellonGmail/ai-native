import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Template root (parent of scripts/), independent of the caller's cwd
const root = fileURLToPath(new URL("..", import.meta.url));

const manifest = JSON.parse(
  await readFile(join(root, "templates/enterprise-10-10/template-manifest.json"), "utf8")
);
const structure = JSON.parse(
  await readFile(join(root, "manifests/enterprise-10-10-structure.json"), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(manifest.status === "PRODUCT_REPAIRED", "template manifest must be PRODUCT_REPAIRED");
assert(Array.isArray(manifest.templates) && manifest.templates.length === 3, "manifest must define three repair templates");
assert(structure.requiredDirectories.includes("scaffolds"), "structure manifest must include scaffolds");
assert(structure.scaffolds.some((scaffold) => scaffold.id === "ai-native-app"), "ai-native-app scaffold must be registered");
assert(structure.generators.some((generator) => generator.id === "create-ai-native-app"), "create-ai-native-app generator must be registered");

const repairedTasks = new Set(manifest.templates.flatMap((template) => template.repairs));
for (const task of ["W1-T7", "W2-T1", "W2-T8", "W3-T1", "W3-T7"]) {
  assert(repairedTasks.has(task), "manifest must include " + task);
}

for (const template of manifest.templates) {
  assert(template.id && template.targetRepo, "each template needs id and targetRepo");
  assert(Array.isArray(template.files) && template.files.length > 0, "template " + template.id + " must list files");

  // Validate each repair is a valid task ID format (e.g., W1-T7, W2-T1)
  const taskPattern = /^W\d+-T\d+$/;
  for (const repair of template.repairs) {
    assert(taskPattern.test(repair), "invalid repair task format: " + repair);
  }
}

// Validate template-to-repo mappings are consistent
  // Note: multiple templates can target the same repo (e.g., observability + security)
  const validTemplateIds = new Set();
  for (const template of manifest.templates) {
    validTemplateIds.add(template.id);
  }
  assert(validTemplateIds.size === manifest.templates.length, "duplicate template IDs in manifest");

// Validate that all target repos have corresponding foundation/knowledge files
  for (const template of manifest.templates) {
    for (const file of template.files) {
      // foundation/ and knowledge/ are sibling areas under the consolidated
      // ai-native repo (git subtree since PR #2, 2026-09-29), not inside template/.
      const fullPath = join(root, "..", template.targetRepo, file);
      assert(existsSync(fullPath), "template " + template.id + " references file " + file + " not found in " + template.targetRepo);
    }
  }

console.log("ENTERPRISE-10-10 template validation PASS");
console.log("Template-to-repo mappings validated");