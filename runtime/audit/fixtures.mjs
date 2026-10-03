// P33 (M5): audit fixtures. `evaluation/fixtures/audit/<kind>/` holds the files of a small
// real project; this materializes it as a git repo whose single commit is DETERMINISTIC
// (fixed author, committer and dates, LF line endings, no hooks/gpg), so the commit SHA a
// report certifies (`targetCommit`) is reproducible on any machine and the exact-commit
// rule of runtime/audit/report.mjs can be checked for real.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const FIXTURES_ROOT = join(here, "..", "..", "evaluation", "fixtures", "audit");
export const FIXTURE_KINDS = Object.freeze({ application: "APPLICATION", library: "LIBRARY" });
const FIXED_DATE = "2026-10-03T12:00:00+00:00";

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)]));
}

/** Creates the fixture repo in a fresh temp dir (or `into`) and returns { dir, commit }. */
export function materializeFixture(kind, { into = null } = {}) {
  if (!(kind in FIXTURE_KINDS)) throw new Error(`unknown fixture kind '${kind}'`);
  const src = join(FIXTURES_ROOT, kind);
  const dir = into ?? join(mkdtempSync(join(tmpdir(), `ai-native-audit-${kind}-`)), kind);
  mkdirSync(dir, { recursive: true });
  for (const file of listFiles(src).sort()) {
    const target = join(dir, relative(src, file));
    mkdirSync(dirname(target), { recursive: true });
    // LF only: the SHA must not depend on the checkout's autocrlf
    writeFileSync(target, readFileSync(file, "utf8").replace(/\r\n/g, "\n"));
  }
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "fixture",
    GIT_AUTHOR_EMAIL: "fixture@example.invalid",
    GIT_COMMITTER_NAME: "fixture",
    GIT_COMMITTER_EMAIL: "fixture@example.invalid",
    GIT_AUTHOR_DATE: FIXED_DATE,
    GIT_COMMITTER_DATE: FIXED_DATE,
  };
  const noHooks = mkdtempSync(join(tmpdir(), "ai-native-nohooks-")); // an empty dir: portable "no hooks" (no /dev/null on Windows)
  const git = (...args) => execFileSync("git", ["-c", "core.autocrlf=false", "-c", "commit.gpgsign=false", "-c", `core.hooksPath=${noHooks}`, ...args], { cwd: dir, env, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  git("add", "-A");
  git("commit", "-q", "-m", `fixture: ${kind}`);
  return { dir, commit: git("rev-parse", "HEAD") };
}
