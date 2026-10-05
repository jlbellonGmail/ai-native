#!/usr/bin/env node
// F-05: hermetic local test runner.
//   node scripts/test-hermetic.mjs [--concurrency <n>] [--] [<test files...>]
// Runs `node --test` over every committed *.test.mjs outside legacy/ (CI's list), with the git environment isolated:
//   GIT_CEILING_DIRECTORIES includes the OS temp root, so a temp dir that was never `git init`ed does NOT resolve to an
//   ancestor repository (e.g. a user HOME that is itself a git repo, as found in the platform audit). Repos the tests
//   create inside the temp root are found normally. The user's repository is never read or modified by this runner.
//   GIT_CONFIG_NOSYSTEM / GIT_TERMINAL_PROMPT=0 keep system config and prompts out of the tests.
// It prints a one-line summary (total/pass/fail, duration, platform, concurrency) for the evidence.
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { delimiter } from "node:path";
import { fileURLToPath } from "node:url";

export function hermeticEnv(env, tempRoot = tmpdir()) {
  const out = { ...env, GIT_CONFIG_NOSYSTEM: "1", GIT_TERMINAL_PROMPT: "0" };
  const current = (env.GIT_CEILING_DIRECTORIES ?? "").split(delimiter).filter(Boolean);
  if (!current.includes(tempRoot)) current.push(tempRoot);
  out.GIT_CEILING_DIRECTORIES = current.join(delimiter);
  return out;
}

export function testFiles(tracked) {
  return tracked.filter((f) => /\.test\.mjs$/.test(f) && !f.startsWith("legacy/"));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2);
  const ci = argv.indexOf("--concurrency");
  const concurrency = ci === -1 ? null : argv.splice(ci, 2)[1];
  const explicit = argv.filter((a) => a !== "--");
  const files = explicit.length ? explicit : testFiles(spawnSync("git", ["ls-files"], { encoding: "utf8" }).stdout.split("\n").filter(Boolean));
  const args = ["--test", ...(concurrency ? [`--test-concurrency=${concurrency}`] : []), ...files];
  const started = Date.now();
  const r = spawnSync(process.execPath, args, { env: hermeticEnv(process.env), encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });
  const text = `${r.stdout}${r.stderr}`.replace(/\x1b\[[0-9;]*m/g, "");
  const n = (k) => Number((text.match(new RegExp(`^ℹ ${k} (\\d+)`, "m")) ?? [])[1] ?? NaN);
  process.stdout.write(text.split("\n").filter((l) => /^(✖|ℹ (tests|pass|fail|cancelled|skipped))/.test(l)).join("\n") + "\n");
  console.log(JSON.stringify({ tests: n("tests"), pass: n("pass"), fail: n("fail"), files: files.length, durationSec: Math.round((Date.now() - started) / 1000), platform: process.platform, node: process.version, concurrency: concurrency ?? "default", ceiling: hermeticEnv({}).GIT_CEILING_DIRECTORIES }));
  process.exit(r.status ?? 1);
}
