// Every committed `*.test.mjs` must be run by a `node --test` step of some workflow.
// The CI test list is written by hand (platform audit F7); this validator makes
// a forgotten suite fail loudly instead of silently never running.
// Fixture projects under evaluation/fixtures/ are exercised by their own harness
// test (runtime/audit/fixtures.test.mjs) and are excluded.
import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXCLUDED = [/^evaluation\/fixtures\//, /^legacy\//, /^template\//, /^foundation\//, /^knowledge\//];

/** Test arguments of every `node --test ...` command in a workflow text. */
export function ciTestArgs(workflowText) {
  const args = [];
  for (const m of workflowText.matchAll(/node\s+--test\s+([^\r\n]+)/g)) args.push(...m[1].trim().split(/\s+/));
  return args;
}

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
  return new RegExp(`^${escaped}$`);
}

/** Returns the committed test files that no `node --test` argument covers. */
export function unlistedTests(files, args) {
  const matchers = args.map(globToRegExp);
  return files.filter((f) => /\.test\.mjs$/.test(f) && !EXCLUDED.some((re) => re.test(f)) && !matchers.some((re) => re.test(f)));
}

export function main() {
  const ls = spawnSync("git", ["ls-files", "*.test.mjs"], { cwd: root, encoding: "utf8" });
  if (ls.status !== 0) throw new Error(`git ls-files failed: ${ls.stderr}`);
  const files = ls.stdout.split("\n").filter(Boolean);
  const dir = join(root, ".github", "workflows");
  const args = readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)).flatMap((n) => ciTestArgs(readFileSync(join(dir, n), "utf8")));
  const missing = unlistedTests(files, args);
  if (missing.length) {
    console.error(`FAIL: ${missing.length} test file(s) are not run by any node --test step of a workflow:`);
    for (const f of missing) console.error(`  ${f}`);
    return 1;
  }
  console.log(`PASS: all ${files.length} committed *.test.mjs files are run by a workflow`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(main());
