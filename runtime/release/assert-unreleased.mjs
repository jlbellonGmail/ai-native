#!/usr/bin/env node
// F-09 (M5.2 closure): `release.yml` must not publish twice for the same tag.
//   node runtime/release/assert-unreleased.mjs --tag vX.Y.Z --repo owner/name
// Incident (v3.0.0-rc.2): the tag push started two `Release` runs. The second `gh release create <tag> --draft` made an
// UNTAGGED DRAFT next to the already-published immutable release, and `gh release edit <tag> --draft=false` then edited the
// published one (a no-op), so the run ended green leaving a stray draft whose SBOM/SHA256SUMS differed. This guard runs
// BEFORE anything is attested or created and fails closed if ANY release (published or draft) already exists for the tag.
// It never deletes or edits a release: a leftover draft must be removed by a human, then the failed job re-run.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SAFE_TAG = /^v\d+\.\d+\.\d+(-(alpha|rc)\.\d+)?$/;
const SAFE_REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function parseReleaseLines(text) {
  return String(text).split("\n").map((l) => l.split("\t")).filter((p) => p.length === 3).map(([id, draft, tag]) => ({ id, draft: draft === "true", tag }));
}

const defaultGh = (args) => spawnSync("gh", args, { encoding: "utf8" });

export function assertUnreleased({ tag, repo, gh = defaultGh }) {
  if (!SAFE_TAG.test(tag ?? "")) return { ok: false, errors: [`refusing an unexpected tag: ${tag}`] };
  if (!SAFE_REPO.test(repo ?? "")) return { ok: false, errors: [`refusing an unexpected repository: ${repo}`] };
  const r = gh(["api", "--paginate", `repos/${repo}/releases`, "--jq", '.[] | "\\(.id)\\t\\(.draft)\\t\\(.tag_name)"']);
  if (r.status !== 0) return { ok: false, errors: [`cannot list releases of ${repo} (${String(r.stderr).trim().slice(0, 200)}); refusing to publish blind`] };
  const same = parseReleaseLines(r.stdout).filter((x) => x.tag === tag);
  const errors = same.map((x) => (x.draft
    ? `a DRAFT release (id ${x.id}) already exists for ${tag}: delete it (a human decision), then re-run the failed jobs`
    : `a release (id ${x.id}) is already published for ${tag}: releases are immutable, refusing to publish a second time`));
  return { ok: errors.length === 0, errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const argv = process.argv.slice(2);
  const value = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
  const r = assertUnreleased({ tag: value("--tag"), repo: value("--repo") });
  for (const e of r.errors) console.error(`::error::${e}`);
  console.log(r.ok ? `OK: no release exists yet for ${value("--tag")}` : "REFUSED");
  process.exit(r.ok ? 0 : 1);
}
