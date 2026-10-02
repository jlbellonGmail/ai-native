#!/usr/bin/env node
// M4.2: node runtime/release/build.mjs --version vX.Y.Z[-alpha.N] --out <dir> [--commit <sha>]
// Writes <out>/ai-native-<version>.tar.gz, <out>/platform.json (real digest),
// <out>/SHA256SUMS and <out>/revocations-<n>.json (highest n from
// governance/versioning/). SBOM and attestation are produced by release.yml
// over exactly these bytes.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBundle, publishedPlatform, sha256Hex } from "./bundle.mjs";
import { REVOCATIONS_ASSET, pickHighest } from "./revocations.mjs";
import { headSha } from "../lib/git.mjs";

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

const sums = [bundleName, "platform.json", revName].map((n) => `${sha256Hex(readFileSync(join(out, n)))}  ${n}`);
writeFileSync(join(out, "SHA256SUMS"), `${sums.join("\n")}\n`);
console.log(JSON.stringify({ version, commit, digest, bundle: bundleName, files: fileCount, revocations: revName }, null, 2));
