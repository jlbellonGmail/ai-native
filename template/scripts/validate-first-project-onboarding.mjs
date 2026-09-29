import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docPath = "docs/onboarding/FIRST-PROJECT.md";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(existsSync(path.join(root, docPath)), `missing ${docPath}`);

const doc = await readFile(path.join(root, docPath), "utf8");

for (const term of [
  "AI-NATIVE-HARDENING-V1.1/H7",
  "ai-knowledge/docs/playbooks/first-client-project-playbook.md",
  "create-ai-native-app",
  "controlled MVP or pilot",
  "HITL approver",
  "Inspector PASS",
  "agent must not mark HITL approved",
  "Target Repository Security Validation"
]) {
  assert(doc.includes(term), `onboarding doc missing ${term}`);
}

for (const task of ["H1", "H2", "H3", "H4", "H5", "H6", "H7"]) {
  assert(doc.includes(task), `onboarding doc missing ${task}`);
}

assert(!doc.includes("H8: CLOSED"), "onboarding doc must not close H8");

console.log("first project onboarding validation PASS");
