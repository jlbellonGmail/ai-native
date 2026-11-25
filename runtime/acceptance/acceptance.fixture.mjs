// Disposable consumer fixture shared by acceptance tests and the end-to-end proof.
// A tiny product (src/slugify.mjs) with an optionally seeded real defect, a normal
// SDD feature spec, a generated acceptance plan and a validation contract.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import { CATEGORIES } from "./plan.mjs";

export const git = (dir, ...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
export const put = (dir, rel, text) => {
  mkdirSync(dirname(join(dir, rel)), { recursive: true });
  writeFileSync(join(dir, rel), text);
};

export const SLUG = "001-slugify";
export const GOOD_SRC = `export function slugify(s) {
  if (typeof s !== "string") throw new TypeError("string required");
  const out = s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!out) throw new RangeError("title has no letters or digits");
  return out;
}
`;
// the seeded real defect: leading/trailing separators are not trimmed
export const BUGGY_SRC = GOOD_SRC.replace('.replace(/^-+|-+$/g, "")', "");

export const SPEC = `# Slugify

Status: draft
human_gate: required

## Requirements

RF-1. THE SYSTEM SHALL convert a title into a lowercase URL slug.
RF-2. IF the input is not a string, THEN THE SYSTEM SHALL reject it.

## Acceptance criteria

- AC-1 (RF-1): a title becomes a trimmed lowercase slug with single dashes.
- AC-2 (RF-2): a non-string input is rejected.
`;

const CASE_DEFS = [
  ["positive", "AC-1", "slug-basic", "expected slug for a normal title", "pass"],
  ["negative", "AC-1", "slug-rejects-unsluggable", "a title with no letters or digits is rejected", "reject"],
  ["negative", "AC-2", "slug-rejects-non-string", "non-string input is rejected", "reject"],
  ["boundary", "AC-1", "slug-trims-edges", "leading and trailing separators are trimmed", "pass"],
  ["integration", "AC-1", "slug-integration", "slug usable as a path segment", "pass"],
  ["contract", "AC-2", "slug-contract-type-error", "rejection is a TypeError", "reject"],
  ["persistence", "AC-1", "slug-idempotent", "slug of a slug is unchanged (stored form is stable)", "pass"],
  ["cross-cutting", "AC-1", "slug-no-secrets", "no environment data leaks into the output", "pass"],
];

export function testScript({ naCategories = [] } = {}) {
  const keep = new Set(CASE_DEFS.filter(([cat]) => !naCategories.includes(cat)).map((d) => d[2]));
  return `import { slugify } from "../src/slugify.mjs";
const KEEP = ${JSON.stringify([...keep])};
const results = [];
const t = (id, fn) => { if (!KEEP.includes(id)) return; let ok = false; try { ok = fn(); } catch { ok = false; } results.push([id, ok]); };
t("slug-basic", () => slugify("Hello World") === "hello-world");
t("slug-rejects-unsluggable", () => { try { slugify("!!!"); return false; } catch (e) { return e instanceof RangeError; } });
t("slug-rejects-non-string", () => { try { slugify(42); return false; } catch { return true; } });
t("slug-trims-edges", () => slugify("  --Hello--  ") === "hello");
t("slug-integration", () => !slugify("A B/C").includes("/"));
t("slug-contract-type-error", () => { try { slugify(null); return false; } catch (e) { return e instanceof TypeError; } });
t("slug-idempotent", () => slugify(slugify("Hello  World!")) === slugify("Hello  World!"));
t("slug-no-secrets", () => !slugify(process.env.USERNAME ?? "x").includes("@"));
console.log("TAP version 13");
results.forEach(([id, ok], i) => console.log((ok ? "ok " : "not ok ") + (i + 1) + " - " + id));
console.log("1.." + results.length);
`;
}

export function buildPlan({ naCategories = [], dataset = null } = {}) {
  const matrix = {};
  for (const c of CATEGORIES) matrix[c] = naCategories.includes(c) ? { status: "NOT_APPLICABLE", justification: `category ${c} does not apply to a pure function`, cites: ["RF-1"] } : { status: "APPLICABLE" };
  const cases = CASE_DEFS.filter(([cat]) => !naCategories.includes(cat)).map(([category, ac, id, why, expected]) => ({
    id, ac: [ac], category, runner: "unit", sutPaths: ["src/slugify.mjs"], expected, mandatory: true, minTier: "restricted",
    why, realSystemUse: "called when a title is stored or linked", intentionalErrors: expected === "reject" ? "the input is invalid on purpose" : "none",
    limitations: "pure function, no I/O", restore: "nothing to restore", ...(dataset ? { dataset: dataset.id } : {}), executionKind: "simulated",
  }));
  return {
    schemaVersion: 1, slug: SLUG,
    criteria: [{ id: "AC-1", requirements: ["RF-1"] }, { id: "AC-2", requirements: ["RF-2"] }],
    matrix, datasets: dataset ? [dataset] : [], cases,
  };
}

export const CONTRACT = {
  schemaVersion: 1, minObservedCases: 1,
  runners: [{ id: "unit", executable: "node", argv: ["tests/slugify.acceptance.mjs"], cwd: ".", format: "tap13", timeoutMs: 30000, isolation: "restricted", env: ["SystemRoot", "USERNAME"] }],
  nonSutPaths: ["specs/**/*.md", "docs/**"],
};

export const sha = (s) => createHash("sha256").update(s).digest("hex");

/** Creates the consumer on `main` (product + defect optional) and a feature branch with the normal feature files. */
export function makeConsumer({ buggy = false, naCategories = [], contract = CONTRACT } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "ai-cons-"));
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.email", "t@example.invalid");
  git(dir, "config", "user.name", "t");
  put(dir, "README.md", "# consumer\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base");
  git(dir, "checkout", "-q", "-b", "feature/001-slugify");
  put(dir, "src/slugify.mjs", buggy ? BUGGY_SRC : GOOD_SRC);
  put(dir, `specs/${SLUG}/spec.md`, SPEC);
  put(dir, "tests/slugify.acceptance.mjs", testScript({ naCategories }));
  put(dir, `specs/${SLUG}/acceptance/plan.json`, JSON.stringify(buildPlan({ naCategories }), null, 2));
  put(dir, "acceptance/validation-contract.json", JSON.stringify(contract, null, 2));
  return dir;
}
