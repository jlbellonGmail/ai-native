#!/usr/bin/env node
// Explicit, networked refresh of the offline-leg image pin (never run by CI):
//   node evaluation/m52/update-offline-image.mjs <major>-<variant>      e.g. 24-bookworm
// Fetches that tag's index manifest from the ECR Public mirror, checks the registry's own Docker-Content-Digest against the
// sha256 of the bytes it received, then rewrites offline-image.index.json and the OFFLINE_IMAGE constant together. Review the
// diff and run `node --test evaluation/m52/offline-image.test.mjs` before committing.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const tag = process.argv[2];
if (!/^\d+-[a-z]+$/.test(tag ?? "")) throw new Error("usage: update-offline-image.mjs <major>-<variant>   (e.g. 24-bookworm)");
const REGISTRY = "https://public.ecr.aws";
const repo = "docker/library/node";
const tokenResponse = await fetch(`${REGISTRY}/token/?service=public.ecr.aws&scope=repository:${repo}:pull`);
const { token } = await tokenResponse.json();
const response = await fetch(`${REGISTRY}/v2/${repo}/manifests/${tag}`, { headers: { authorization: `Bearer ${token}`, accept: "application/vnd.oci.image.index.v1+json" } });
if (!response.ok) throw new Error(`manifest ${tag}: HTTP ${response.status}`);
const body = Buffer.from(await response.arrayBuffer());
const digest = createHash("sha256").update(body).digest("hex");
// the digest the registry itself declares comes from a HEAD request (the GET body carries no such header on ECR)
const head = await fetch(`${REGISTRY}/v2/${repo}/manifests/${tag}`, { method: "HEAD", headers: { authorization: `Bearer ${token}`, accept: "application/vnd.oci.image.index.v1+json" } });
const served = head.headers.get("docker-content-digest");
if (served !== `sha256:${digest}`) throw new Error(`registry says ${served} but the body hashes to sha256:${digest}`);
const index = JSON.parse(body.toString("utf8"));
if (index.mediaType !== "application/vnd.oci.image.index.v1+json") throw new Error(`unexpected mediaType ${index.mediaType}`);

writeFileSync(new URL("./offline-image.index.json", import.meta.url), body);
const file = new URL("./offline-image.mjs", import.meta.url);
const text = readFileSync(file, "utf8");
const next = text.replace(/export const OFFLINE_IMAGE = "[^"]*";/, `export const OFFLINE_IMAGE = "public.ecr.aws/${repo}:${tag}@sha256:${digest}";`);
if (next === text && !text.includes(digest)) throw new Error("could not rewrite OFFLINE_IMAGE");
writeFileSync(file, next);
console.log(`pinned ${tag} -> sha256:${digest}`);
