import { readFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(new URL("../templates/enterprise-10-10/template-manifest.json", import.meta.url), "utf8")
);
const structure = JSON.parse(
  await readFile(new URL("../manifests/enterprise-10-10-structure.json", import.meta.url), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(manifest.status === "PRODUCT_REPAIRED", "template manifest must be PRODUCT_REPAIRED");
assert(Array.isArray(manifest.templates) && manifest.templates.length === 3, "manifest must define three repair templates");
assert(structure.requiredDirectories.includes("scaffolds"), "structure manifest must include scaffolds");
assert(structure.scaffolds.some((scaffold) => scaffold.id === "ai-native-app"), "ai-native-app scaffold must be registered");

const repairedTasks = new Set(manifest.templates.flatMap((template) => template.repairs));
for (const task of ["W1-T7", "W2-T1", "W2-T8", "W3-T1", "W3-T7"]) {
  assert(repairedTasks.has(task), `manifest must include ${task}`);
}

for (const template of manifest.templates) {
  assert(template.id && template.targetRepo, "each template needs id and targetRepo");
  assert(Array.isArray(template.files) && template.files.length > 0, `template ${template.id} must list files`);
}

console.log("ENTERPRISE-10-10 ai-template validation PASS");
