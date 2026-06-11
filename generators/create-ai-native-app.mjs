import { readFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(new URL("../manifests/enterprise-10-10-structure.json", import.meta.url), "utf8")
);

console.log(JSON.stringify({
  scaffold: manifest.scaffolds[0].id,
  requiredDirectories: manifest.requiredDirectories,
  validation: manifest.validation
}, null, 2));
