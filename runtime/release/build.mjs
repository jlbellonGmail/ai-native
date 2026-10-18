#!/usr/bin/env node
// M4.2: node runtime/release/build.mjs --version vX.Y.Z[-alpha.N] --out <dir> [--commit <sha>]
// Writes <out>/ai-native-<version>.tar.gz, <out>/platform.json (real digest),
// <out>/ai-native-cli.mjs (the public `ai-native` command, runtime/cli/ai-native.mjs at the commit),
// <out>/SHA256SUMS, <out>/revocations-<n>.json and <out>/cli-revocations-<n>.json (highest n of each series from
// governance/versioning/; the CLI series is its own asset so an engine of an earlier release never meets an entry it cannot parse). SBOM and attestation are produced by release.yml
// over exactly these bytes.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBundle, publishedPlatform, readShippedFiles, sha256Hex } from "./bundle.mjs";
import { CLI_REVOCATIONS_ASSET, REVOCATIONS_ASSET, pickHighest } from "./revocations.mjs";
import { headSha } from "../lib/git.mjs";
import { assertCliDeclaresTag } from "./cli-version.mjs";

const CLI_ASSET = "ai-native-cli.mjs";
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const value = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);

const version = value("--version");
if (!version || !/^v[0-9]+\.[0-9]+\.[0-9]+(-(alpha|rc)\.[0-9]+)?$/.test(version)) {
  console.error("usage: build.mjs --version vX.Y.Z[-alpha.N|-rc.N] --out <dir> [--commit <sha>]");
  process.exit(2);
}
const out = resolve(value("--out") ?? "dist");
const commit = value("--commit") ?? headSha(root);

const { bytes, digest, platform, fileCount } = buildBundle({ root, commit, version });
mkdirSync(out, { recursive: true });
const bundleName = `ai-native-${version}.tar.gz`;
writeFileSync(join(out, bundleName), bytes);

const published = publishedPlatform(platform, digest, {
  sbom: `ai-native-${version}.sbom.cdx.json`,
  provenance: `ai-native-${version}.sigstore.json`,
});
writeFileSync(join(out, "platform.json"), `${JSON.stringify(published, null, 2)}\n`);

const revDir = join(root, "governance", "versioning");
const revFiles = readdirSync(revDir).filter((n) => REVOCATIONS_ASSET.test(n));
const picked = pickHighest(revFiles.map((name) => ({ name, text: readFileSync(join(revDir, name), "utf8") })));
if (!picked.list || picked.warnings.length) {
  console.error(`invalid revocations source: ${picked.warnings.join("; ") || "none found"}`);
  process.exit(1);
}
const revName = `revocations-${picked.list.n}.json`;
writeFileSync(join(out, revName), readFileSync(join(revDir, revName)));

// the public command: the one file that runs before anything is verified, so it is a release asset like the rest (attested by release.yml)
const cli = readShippedFiles(root, commit)["runtime/cli/ai-native.mjs"];
if (!cli) {
  console.error("runtime/cli/ai-native.mjs is not part of this commit");
  process.exit(1);
}
// the CLI declares the tag that publishes it (from v3.3.0, prereleases included): self-update, install and `--version` all read that one literal
try {
  assertCliDeclaresTag(cli.toString("utf8"), version);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
writeFileSync(join(out, CLI_ASSET), cli);

// the CLI revocations: same workflow, same attestation, same trust root; entries are kind "cli" only (and none in the platform list)
const cliRevFiles = readdirSync(revDir).filter((n) => CLI_REVOCATIONS_ASSET.test(n));
const cliPicked = pickHighest(cliRevFiles.map((name) => ({ name, text: readFileSync(join(revDir, name), "utf8") })), CLI_REVOCATIONS_ASSET);
if (!cliPicked.list || cliPicked.warnings.length || cliPicked.list.entries.some((e) => e.kind !== "cli") || picked.list.entries.some((e) => e.kind === "cli")) {
  console.error(`invalid CLI revocations source: ${cliPicked.warnings.join("; ") || "none found, or entries of the wrong kind"}`);
  process.exit(1);
}
const cliRevName = `cli-revocations-${cliPicked.list.n}.json`;
writeFileSync(join(out, cliRevName), readFileSync(join(revDir, cliRevName)));

const sums = [bundleName, "platform.json", revName, cliRevName, CLI_ASSET].map((n) => `${sha256Hex(readFileSync(join(out, n)))}  ${n}`);
writeFileSync(join(out, "SHA256SUMS"), `${sums.join("\n")}\n`);
console.log(JSON.stringify({ version, commit, digest, bundle: bundleName, files: fileCount, revocations: revName }, null, 2));
