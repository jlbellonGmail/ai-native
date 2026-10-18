// Constitution inheritance: the central constitution applies to every project as is.
// A project may keep a small extension with additions only; an override is rejected
// structurally (every line must be a `- [ADD] LOCAL-n: ...` rule), not by reading prose.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PLATFORM_ROOT = join(here, "..", "..");
export const loadExtensionPolicy = (root = PLATFORM_ROOT) => JSON.parse(readFileSync(join(root, "contracts", "constitution-extension.json"), "utf8"));

const FORBIDDEN_VERB = /\[(?:OVERRIDE|RELAX|REPLACE|DISABLE|WAIVE|SUPERSEDE|REMOVE)\b|\b(?:overrides?|relaxes|replaces|disables?|waives|waived|supersedes|supersede)\s*:/i;
const CENTRAL_REF = /\b(?:P(?:1[0-8]|[1-9])|principle\s+(?:1[0-8]|[1-9]))\b/i;

/** Errors for one extension text; [] means valid. An absent extension is valid (callers pass null). */
export function validateExtension(text, policy = loadExtensionPolicy()) {
  if (text === null) return [];
  const errors = [];
  if (Buffer.byteLength(text) > policy.maxBytes) errors.push(`extension exceeds ${policy.maxBytes} bytes: keep it small, move reusable rules to ai-native`);
  const rule = new RegExp(policy.ruleLine);
  let count = 0;
  const ids = new Set();
  text.split(/\r?\n/).forEach((line, i) => {
    const where = `line ${i + 1}`;
    if (FORBIDDEN_VERB.test(line)) errors.push(`${where}: overrides are not allowed, the central constitution wins (${line.trim().slice(0, 60)})`);
    if (/^\s*$/.test(line) || /^#{1,6}\s/.test(line)) return;
    if (!/^\s*-\s*\[/.test(line)) {
      errors.push(`${where}: only headings and "- [ADD] LOCAL-n: ..." rules are allowed (loose prose cannot be validated)`);
      return;
    }
    const m = rule.exec(line);
    if (!m) {
      errors.push(`${where}: a rule must match "- [ADD] LOCAL-n: <text>" (additions only)`);
      return;
    }
    count++;
    if (ids.has(m[1])) errors.push(`${where}: duplicate rule id ${m[1]}`);
    ids.add(m[1]);
    if (CENTRAL_REF.test(m[2])) errors.push(`${where}: ${m[1]} refers to a central principle; an addition must stand on its own`);
  });
  if (count > policy.maxRules) errors.push(`extension has ${count} rules, maximum is ${policy.maxRules}`);
  if (count === 0) errors.push("extension has no rules: delete the file, the central constitution already applies");
  return errors;
}

/** Validates the extension of a project (absent file = inheritance only = valid). */
export function validateProject(projectDir, policy = loadExtensionPolicy()) {
  const file = join(projectDir, policy.extensionPath);
  return validateExtension(existsSync(file) ? readFileSync(file, "utf8") : null, policy);
}

/** The central constitution still has the principles the policy protects. */
export function validateCentral(root = PLATFORM_ROOT, policy = loadExtensionPolicy(root)) {
  const text = readFileSync(join(root, policy.central), "utf8");
  const n = (text.match(/^\d+\. \*\*/gm) ?? []).length;
  return n === policy.centralPrinciples ? [] : [`${policy.central} has ${n} principles, the extension policy protects ${policy.centralPrinciples}`];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--project");
  const errors = i > 0 ? validateProject(process.argv[i + 1]) : validateCentral();
  for (const e of errors) console.error(`FAIL: ${e}`);
  console.log(errors.length ? `FAIL: ${errors.length} constitution error(s)` : "PASS: constitution inheritance consistent");
  process.exit(errors.length ? 1 : 0);
}
