// v4.0.1: pre-tag readiness check (runtime/release/pretag.mjs) against real git fixtures. The gh side is a stub
// (CI runs and releases); git, tags, the "origin" remote and the audit reports are real.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pretag } from "./pretag.mjs";

const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", env }).trim();
const put = (dir, path, text) => {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), text);
};
const cli = (v) => `#!/usr/bin/env node\nexport const CLI_VERSION = "${v}"; // fixture\n`;
const method = JSON.stringify({ auditMethod: "1.2", profiles: { PLATFORM: "Activo", APPLICATION: "Activo", LIBRARY: "Activo", FACTORY: "Activo", TEMPLATE: "Activo" } });
const report = (target, score = 92) =>
  `---\ntargetRepo: o/r\ntargetCommit: ${target}\nplatform:\n  version: "fixture"\n  commit: ${target}\nauditMethod: "1.2"\nprofile: PLATFORM\ndate: "2026-11-02T00:00:00Z"\nscope: "fixture"\nscore: ${score}\nisMergeGate: false\n---\n# Report\n`;

/**
 * `work` (local `main`: an audited commit, then an .audit-only commit with its report) and `origin`, a separate repository
 * that only `git ls-remote --tags` reads. Nothing is pushed: tags "on origin" are created there directly (a push into a
 * repository under %TEMP% is the Windows host's known "Permission denied" flake).
 */
function fixture({ declares = "v9.9.1", score = 92 } = {}) {
  const base = mkdtempSync(join(tmpdir(), "ai-native-pretag-"));
  const origin = join(base, "origin");
  const dir = join(base, "work");
  git(base, "init", "-q", origin);
  git(origin, "commit", "-q", "--allow-empty", "-m", "origin");
  git(base, "init", "-q", dir);
  git(dir, "config", "core.autocrlf", "false");
  git(dir, "checkout", "-q", "-b", "main");
  put(dir, "runtime/cli/ai-native.mjs", cli(declares));
  put(dir, "audit/method.json", method);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "audited");
  const audited = git(dir, "rev-parse", "HEAD");
  put(dir, `.audit/reports/AUDIT-PLATFORM-${audited.slice(0, 7)}.md`, report(audited, score));
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "docs(audit): report");
  const candidate = git(dir, "rev-parse", "HEAD");
  git(dir, "remote", "add", "origin", origin);
  return { base, dir, origin, audited, candidate };
}
const commit = (dir, files, msg = "c") => {
  for (const [p, t] of Object.entries(files)) put(dir, p, t);
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", msg);
  return git(dir, "rev-parse", "HEAD");
};

/** gh stub: `releases` lines for the API listing, `green` successful CI runs; a `fail` set makes that command fail. */
function gh({ releases = "", green = 1, fail = [] } = {}) {
  const calls = [];
  const fn = (args) => {
    calls.push(args);
    const kind = args[0] === "api" ? "api" : args[0] === "run" ? "run" : "other";
    if (fail.includes(kind)) return { status: 1, stdout: "", stderr: `${kind} unavailable` };
    if (kind === "api") return { status: 0, stdout: releases, stderr: "" };
    if (kind === "run") return { status: 0, stdout: `${green}\n`, stderr: "" };
    return { status: 1, stdout: "", stderr: "unexpected" };
  };
  fn.calls = calls;
  return fn;
}
const run = (f, over = {}) => pretag({ root: f.dir, tag: "v9.9.1", candidate: f.candidate, repo: "o/r", mainRef: "main", gh: gh(), ...over });
const byName = (r) => Object.fromEntries(r.checks.map((c) => [c.name, c]));
const failing = (r) => r.checks.filter((c) => c.status === "FAIL").map((c) => c.name);

test("a candidate that passes every release.yml pre-build gate is READY", (t) => {
  const f = fixture();
  t.after(() => rmSync(f.base, { recursive: true, force: true }));
  const g = gh();
  const r = run(f, { gh: g });
  assert.deepEqual(failing(r), []);
  assert.equal(r.ready, true);
  assert.match(byName(r)["PLATFORM audit release-gate"].detail, new RegExp(`^PASS: AUDIT-PLATFORM-${f.audited.slice(0, 7)}\\.md score 92`));
  // the CI query is the one release.yml runs, scoped to the repository
  assert.ok(g.calls.some((a) => a.join(" ") === `run list --repo o/r --workflow ci.yml --commit ${f.candidate} --status success --json conclusion --jq length`));
});

test("the v4.0.0 incident: no current audit and a CLI that declares the previous release are both NOT READY", (t) => {
  const f = fixture({ declares: "v9.9.0" });
  t.after(() => rmSync(f.base, { recursive: true, force: true }));
  const changed = commit(f.dir, { "runtime/gates/new.mjs": "export {};\n" }, "feat: after the audit");
  const r = run(f, { candidate: changed });
  assert.equal(r.ready, false);
  assert.deepEqual(failing(r), ["CLI_VERSION declares the tag", "PLATFORM audit release-gate"]);
  const audit = byName(r)["PLATFORM audit release-gate"].detail;
  assert.match(audit, new RegExp(`no current valid PLATFORM audit report for ${changed}`));
  assert.match(audit, /plus 1 historical report\(s\) STALE for this candidate, expected/);
  assert.match(byName(r)["CLI_VERSION declares the tag"].detail, /declares CLI_VERSION v9\.9\.0; this release is v9\.9\.1/);
});

test("reports and CLI are read from the candidate's tree, never from the working tree", (t) => {
  const f = fixture({ declares: "v9.9.0" });
  t.after(() => rmSync(f.base, { recursive: true, force: true }));
  const changed = commit(f.dir, { "runtime/x.mjs": "export {};\n" });
  // an uncommitted, otherwise valid report and CLI bump in the working tree must not count
  put(f.dir, `.audit/reports/AUDIT-PLATFORM-${changed.slice(0, 7)}.md`, report(changed));
  put(f.dir, "runtime/cli/ai-native.mjs", cli("v9.9.1"));
  const r = run(f, { candidate: changed });
  assert.deepEqual(failing(r), ["CLI_VERSION declares the tag", "PLATFORM audit release-gate"]);
});

test("a score below the threshold and its tolerance is NOT READY (the gate is reused, not relaxed)", (t) => {
  const f = fixture({ score: 87.5 });
  t.after(() => rmSync(f.base, { recursive: true, force: true }));
  const r = run(f);
  assert.deepEqual(failing(r), ["PLATFORM audit release-gate"]);
  assert.match(byName(r)["PLATFORM audit release-gate"].detail, /below the release threshold 90/);
});

test("a tag that already exists locally or on origin is never reused", (t) => {
  const f = fixture();
  t.after(() => rmSync(f.base, { recursive: true, force: true }));
  git(f.dir, "tag", "-a", "v9.9.1", "-m", "x", f.audited);
  assert.deepEqual(failing(run(f)), ["tag does not exist locally"]);
  git(f.origin, "tag", "v9.9.1");
  assert.deepEqual(failing(run(f)), ["tag does not exist locally", "tag does not exist on origin"]);
  git(f.dir, "tag", "-d", "v9.9.1");
  assert.deepEqual(failing(run(f)), ["tag does not exist on origin"]);
});

test("an existing release, a missing green CI run or a commit outside main are NOT READY", (t) => {
  const f = fixture();
  t.after(() => rmSync(f.base, { recursive: true, force: true }));
  assert.deepEqual(failing(run(f, { gh: gh({ releases: "12\tfalse\tv9.9.1\n" }) })), ["no release (published or draft) exists for the tag"]);
  assert.deepEqual(failing(run(f, { gh: gh({ releases: "13\ttrue\tv9.9.1\n" }) })), ["no release (published or draft) exists for the tag"]);
  assert.deepEqual(failing(run(f, { gh: gh({ green: 0 }) })), ["candidate has a successful ci.yml run"]);
  git(f.dir, "checkout", "-q", "-b", "feature");
  const side = commit(f.dir, { [`.audit/reports/README.md`]: "x\n" }, "docs(audit): side");
  git(f.dir, "checkout", "-q", "main");
  assert.deepEqual(failing(run(f, { candidate: side })), ["candidate is reachable from main"]);
});

test("a check that cannot be evaluated fails closed (gh or origin unavailable)", (t) => {
  const f = fixture();
  t.after(() => rmSync(f.base, { recursive: true, force: true }));
  assert.deepEqual(failing(run(f, { gh: gh({ fail: ["api", "run"] }) })), ["no release (published or draft) exists for the tag", "candidate has a successful ci.yml run"]);
  git(f.dir, "remote", "set-url", "origin", join(f.base, "missing"));
  assert.deepEqual(failing(run(f)), ["tag does not exist on origin"]);
});

test("alpha: a missing audit is reported, not blocking, exactly as in release.yml", (t) => {
  const f = fixture({ declares: "v9.9.1-alpha.1" });
  t.after(() => rmSync(f.base, { recursive: true, force: true }));
  const changed = commit(f.dir, { "runtime/x.mjs": "export {};\n" });
  const r = run(f, { tag: "v9.9.1-alpha.1", candidate: changed });
  assert.equal(r.ready, true);
  assert.equal(byName(r)["PLATFORM audit release-gate"].status, "WARN");
  // rc and stable: the same candidate is blocked
  const rc = run(f, { tag: "v9.9.1-rc.1", candidate: changed });
  assert.equal(byName(rc)["PLATFORM audit release-gate"].status, "FAIL");
});

test("malformed input stops before any git or gh call", () => {
  const g = gh();
  let gitCalls = 0;
  const r = pretag({ root: ".", tag: "4.0.1", candidate: "ced0969", repo: "o/r; rm", mainRef: "-x", gh: g, git: () => { gitCalls++; return { status: 0, stdout: "", stderr: "" }; } });
  assert.equal(r.ready, false);
  assert.deepEqual(failing(r), ["tag is a release tag release.yml accepts", "candidate is a full commit SHA", "repository is owner/name", "main ref is a plain ref name"]);
  assert.equal(gitCalls, 0);
  assert.equal(g.calls.length, 0);
});
