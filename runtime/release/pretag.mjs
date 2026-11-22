#!/usr/bin/env node
// Pre-tag readiness check (v4.0.1): run it BEFORE creating a release tag.
//   git fetch origin main --tags
//   node runtime/release/pretag.mjs --tag vX.Y.Z --candidate <40-hex sha> --repo owner/name
// Incident (v4.0.0): the tag was pushed on a commit that had no current PLATFORM audit report and still declared
// CLI_VERSION v3.4.3. `release.yml` refused it, as it must, but only after the tag existed, and a pushed tag is never
// moved or reused. This script answers the same questions BEFORE the tag exists, with the very rules release.yml
// applies: it imports them (cli-version.mjs, audit framework, assert-unreleased.mjs) instead of copying them, and it
// reads the audit reports and the CLI source from the CANDIDATE'S TREE, not from the working tree, because that is
// what the release job checks out. It adds no rule, relaxes none and has no override: it is an earlier view of the
// release gates, never a replacement for them (release.yml stays authoritative) and never a merge gate.
// Read-only: it runs `git` reads, `git ls-remote` and `gh` reads; it never fetches, tags, edits or publishes.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isTag, assertCliDeclaresTag } from "./cli-version.mjs";
import { assertUnreleased } from "./assert-unreleased.mjs";
import { evaluateReleaseGate } from "../audit/framework.mjs";

const SHA = /^[0-9a-f]{40}$/;
const SAFE_REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const MAIN = "origin/main"; // release.yml: `git fetch origin main` + `merge-base --is-ancestor "$GITHUB_SHA" origin/main`; not configurable
const REPORTS = ".audit/reports/";

/** owner/name of a GitHub remote URL (https, ssh or scp form), or null. */
export function githubSlug(url) {
  const m = /^(?:https:\/\/(?:[^@/]+@)?github\.com\/|ssh:\/\/git@github\.com\/|git@github\.com:)([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?\/?$/.exec(String(url ?? "").trim());
  return m ? m[1] : null;
}

const defaultGit = (root) => (args) => spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const defaultGh = (args) => spawnSync("gh", args, { encoding: "utf8" });
const firstLine = (s) => String(s ?? "").trim().split("\n")[0].slice(0, 200);

/** The .audit/reports/*.md texts of `sha`'s tree (what the release job sees after checking out the tag). */
function reportsAt(git, sha) {
  // no .audit/reports/ in the tree = no reports (the gate then fails); any other git failure is an error, not "none"
  if (git(["cat-file", "-e", `${sha}:${REPORTS.slice(0, -1)}`]).status !== 0) return [];
  const ls = git(["ls-tree", "-z", "--name-only", `${sha}:${REPORTS}`]);
  if (ls.status !== 0) throw new Error(`cannot list ${REPORTS} at ${sha}: ${firstLine(ls.stderr)}`);
  return ls.stdout.split("\0").filter((n) => n.endsWith(".md") && n !== "README.md").map((name) => {
    const r = git(["show", `${sha}:${REPORTS}${name}`]);
    if (r.status !== 0) throw new Error(`cannot read ${REPORTS}${name} at ${sha}`);
    return { name, text: r.stdout };
  });
}

/** Profile states as the candidate declares them (audit/method.json; `audit check` keeps them equal to the profile files). */
function profilesAt(git, sha) {
  const r = git(["show", `${sha}:audit/method.json`]);
  if (r.status !== 0) throw new Error(`cannot read audit/method.json at ${sha}`);
  return JSON.parse(r.stdout).profiles ?? {};
}

/**
 * @returns {{ready: boolean, checks: {name: string, status: "PASS"|"FAIL"|"WARN", detail: string}[]}}
 * A check that cannot be evaluated (git or gh failing, no network) is FAIL: blind is not ready.
 */
export function pretag({ root, tag, candidate, repo, git = defaultGit(root), gh = defaultGh }) {
  const checks = [];
  const add = (name, ok, detail, { warnOnly = false } = {}) => checks.push({ name, status: ok ? "PASS" : warnOnly ? "WARN" : "FAIL", detail });
  const done = () => ({ ready: checks.every((c) => c.status !== "FAIL"), checks });

  add("tag is a release tag release.yml accepts", isTag(tag), String(tag));
  add("candidate is a full commit SHA", SHA.test(candidate ?? ""), String(candidate));
  add("repository is owner/name", SAFE_REPO.test(repo ?? ""), String(repo));
  if (checks.some((c) => c.status === "FAIL")) return done();
  const exists = git(["cat-file", "-e", `${candidate}^{commit}`]);
  add("candidate commit exists locally", exists.status === 0, exists.status === 0 ? candidate : "unknown commit (git fetch first)");
  if (exists.status !== 0) return done();
  // The GitHub queries use --repo and the tag check uses origin: both must be the same repository. The URL is the one
  // `git ls-remote origin` really contacts (url.*.insteadOf applied), not the raw remote.origin.url.
  const url = git(["ls-remote", "--get-url", "origin"]);
  const slug = url.status === 0 ? githubSlug(url.stdout) : null;
  add("origin is the repository given in --repo", slug !== null && slug.toLowerCase() === repo.toLowerCase(), slug ? `origin is ${slug}` : "origin is not a GitHub repository URL");

  // A tag is pushed once and never moved, deleted or reused.
  const local = git(["rev-parse", "-q", "--verify", `refs/tags/${tag}`]);
  add("tag does not exist locally", local.status === 1, local.status === 0 ? `already points to ${firstLine(local.stdout)}` : local.status === 1 ? "free" : `git failed: ${firstLine(local.stderr)}`);
  const remote = git(["ls-remote", "--tags", "origin", `refs/tags/${tag}`]);
  if (remote.status !== 0) add("tag does not exist on origin", false, `cannot list origin tags: ${firstLine(remote.stderr)}`);
  else add("tag does not exist on origin", remote.stdout.trim() === "", remote.stdout.trim() ? `already on origin: ${firstLine(remote.stdout)}` : "free");
  const unreleased = assertUnreleased({ tag, repo, gh });
  add("no release (published or draft) exists for the tag", unreleased.ok, unreleased.ok ? "none" : unreleased.errors.join("; "));

  // Build job, step "Tag commit must be reachable from main".
  const anc = git(["merge-base", "--is-ancestor", candidate, MAIN]);
  add(`candidate is reachable from ${MAIN}`, anc.status === 0, anc.status === 0 ? "yes" : anc.status === 1 ? `not an ancestor of ${MAIN} (merge first, then git fetch origin main)` : `git failed: ${firstLine(anc.stderr)}`);

  // Build job, step "Tag commit must have a green CI run" (same query).
  const ci = gh(["run", "list", "--repo", repo, "--workflow", "ci.yml", "--commit", candidate, "--status", "success", "--json", "conclusion", "--jq", "length"]);
  const green = ci.status === 0 ? Number(String(ci.stdout).trim()) : NaN;
  add("candidate has a successful ci.yml run", green >= 1, ci.status !== 0 ? `cannot query CI: ${firstLine(ci.stderr)}` : `${Number.isNaN(green) ? 0 : green} successful run(s)`);

  // Build step "Build bundle": runtime/release/build.mjs refuses a CLI that does not declare the tag.
  const cli = git(["show", `${candidate}:runtime/cli/ai-native.mjs`]);
  if (cli.status !== 0) add("CLI_VERSION declares the tag", false, "runtime/cli/ai-native.mjs missing at the candidate");
  else {
    try {
      assertCliDeclaresTag(cli.stdout, tag);
      add("CLI_VERSION declares the tag", true, tag);
    } catch (error) {
      add("CLI_VERSION declares the tag", false, error.message);
    }
  }

  // Build step "Audit release-gate (PLATFORM profile)": mandatory for rc and stable, reported for alpha (release.yml).
  try {
    const gate = evaluateReleaseGate({ root, reports: reportsAt(git, candidate), candidate, profile: "PLATFORM", profiles: profilesAt(git, candidate) });
    const current = gate.errors.filter((e) => !/: STALE \(/.test(e));
    const stale = gate.errors.length - current.length + gate.warnings.filter((w) => /^ignored report .*: STALE \(/.test(w)).length;
    const detail = gate.status === "FAIL"
      ? `${current.join("; ")}${stale ? ` (plus ${stale} historical report(s) STALE for this candidate, expected)` : ""}`
      : `${gate.status}: ${gate.report} score ${gate.score}${stale ? `; ${stale} historical report(s) STALE, expected` : ""}`;
    add("PLATFORM audit release-gate", gate.status !== "FAIL", detail, { warnOnly: tag.includes("-alpha.") });
  } catch (error) {
    add("PLATFORM audit release-gate", false, error.message, { warnOnly: tag.includes("-alpha.") });
  }
  return done();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2);
  const value = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
  const r = pretag({ root: process.cwd(), tag: value("--tag"), candidate: value("--candidate"), repo: value("--repo") });
  for (const c of r.checks) console.log(`${c.status.padEnd(4)} ${c.name}: ${c.detail}`);
  console.log(r.ready ? `READY: ${value("--tag")} may be created on ${value("--candidate")}` : "NOT READY: do not create the tag");
  process.exit(r.ready ? 0 : 1);
}
