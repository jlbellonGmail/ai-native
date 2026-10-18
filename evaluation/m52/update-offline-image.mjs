#!/usr/bin/env node
// Explicit, networked helper to refresh the offline-leg image pin (never run by CI). It WRITES NOTHING: network data is never
// saved to disk by this script (code scanning rule js/http-to-file-access), so a human redirects stdout and edits one constant:
//
//   node evaluation/m52/update-offline-image.mjs 24-bookworm > evaluation/m52/offline-image.index.json
//   # then set OFFLINE_IMAGE in evaluation/m52/offline-image.mjs to the line printed on stderr
//   node --test evaluation/m52/offline-image.test.mjs
//
// stdout = the exact index manifest bytes the registry served for that tag (ECR Public mirror of the official Docker image).
// Before printing, the sha256 of those bytes is checked against the Docker-Content-Digest the registry itself declares
// (HEAD request); a mismatch prints nothing and exits 1. offline-image.test.mjs then proves tag, digest and file agree.
import { createHash } from "node:crypto";

const tag = process.argv[2];
if (!/^\d+-[a-z]+$/.test(tag ?? "")) {
  console.error("usage: update-offline-image.mjs <major>-<variant>   (e.g. 24-bookworm)");
  process.exit(2);
}
const REGISTRY = "https://public.ecr.aws";
const repo = "docker/library/node";
const tokenResponse = await fetch(`${REGISTRY}/token/?service=public.ecr.aws&scope=repository:${repo}:pull`);
const { token } = await tokenResponse.json();
const headers = { authorization: `Bearer ${token}`, accept: "application/vnd.oci.image.index.v1+json" };
const url = `${REGISTRY}/v2/${repo}/manifests/${tag}`;
const response = await fetch(url, { headers });
if (!response.ok) {
  console.error(`manifest ${tag}: HTTP ${response.status}`);
  process.exit(1);
}
const body = Buffer.from(await response.arrayBuffer());
const digest = createHash("sha256").update(body).digest("hex");
// the digest the registry itself declares comes from a HEAD request (the GET body carries no such header on ECR)
const declared = (await fetch(url, { method: "HEAD", headers })).headers.get("docker-content-digest");
if (declared !== `sha256:${digest}`) {
  console.error(`registry declares ${declared} but the body hashes to sha256:${digest}: nothing printed`);
  process.exit(1);
}
console.error(`OFFLINE_IMAGE = "public.ecr.aws/${repo}:${tag}@sha256:${digest}"`);
process.stdout.write(body);
