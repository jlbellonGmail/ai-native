// M4.2 remote release source for bootstrap. Network and `gh` are injected so
// every path is testable offline; the defaults talk to GitHub Releases of the
// repo pinned in the lock (`github:<owner>/<repo>`), which is public (D1).
//
// Trust model: the lock's digest is the root of trust. A downloaded bundle is
// hashed and compared to it BEFORE it reaches the cache (install.sync does that
// again for --from-file). Attestation (sigstore provenance via `gh attestation
// verify`) proves WHO built it; when `gh` is unavailable that is reported as a
// warning, or an error with `requireAttestation`.
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sha256 } from "./cache.mjs";
import { REVOCATIONS_ASSET, parseRevocations } from "../release/revocations.mjs";

const REPO = /^github:([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/;
const VERSION = /^v[0-9]+\.[0-9]+\.[0-9]+(-(alpha|rc)\.[0-9]+)?$/;
export const MAX_BUNDLE_BYTES = 256 * 1024 * 1024;

export function parseRepo(repo) {
  const m = REPO.exec(repo ?? "");
  if (!m) throw new Error(`invalid repo reference: ${repo}`);
  return { owner: m[1], name: m[2], slug: `${m[1]}/${m[2]}` };
}

export const bundleAsset = (version) => `ai-native-${version}.tar.gz`;

async function getBytes(fetchImpl, url, limit = MAX_BUNDLE_BYTES) {
  const res = await fetchImpl(url, { redirect: "follow", headers: { "user-agent": "ai-native-bootstrap" } });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > limit) throw new Error(`GET ${url}: response exceeds ${limit} bytes`);
  return bytes;
}

/** Default attestation verifier: `gh attestation verify <file> --repo owner/repo`. */
export function ghAttestationVerifier(spawn = spawnSync) {
  return (file, slug) => {
    const r = spawn("gh", ["attestation", "verify", file, "--repo", slug], { encoding: "utf8" });
    if (r.error) return { status: "UNAVAILABLE", detail: r.error.message };
    return r.status === 0 ? { status: "VERIFIED" } : { status: "FAILED", detail: (r.stderr || r.stdout || "").trim().split("\n").pop() };
  };
}

function checkAttestation(verifier, bytes, name, slug, requireAttestation, errors, warnings) {
  const dir = mkdtempSync(join(tmpdir(), "ai-native-att-"));
  const file = join(dir, name);
  writeFileSync(file, bytes);
  const r = verifier(file, slug);
  if (r.status === "VERIFIED") return true;
  if (r.status === "FAILED") errors.push(`attestation verification FAILED for ${name}: ${r.detail ?? ""}`);
  else if (requireAttestation) errors.push(`attestation required but cannot be verified for ${name}: ${r.detail ?? "gh not available"}`);
  else warnings.push(`provenance NOT verified for ${name} (${r.detail ?? "gh not available"}); only the lock digest vouches for it`);
  return false;
}

/**
 * Downloads the release pinned by the lock. Never returns bytes whose sha256
 * differs from `lock.platform.digest`.
 * @returns {Promise<{bytes?: Buffer, errors: string[], warnings: string[], attested: boolean}>}
 */
export async function downloadRelease({ lock, fetchImpl = fetch, verifier = ghAttestationVerifier(), requireAttestation = false }) {
  const errors = [];
  const warnings = [];
  const { version, digest, repo } = lock.platform;
  if (!VERSION.test(version)) return { errors: [`invalid version in lock: ${version}`], warnings, attested: false };
  const { slug } = parseRepo(repo);
  const name = bundleAsset(version);
  let bytes;
  try {
    bytes = await getBytes(fetchImpl, `https://github.com/${slug}/releases/download/${version}/${name}`);
  } catch (error) {
    return { errors: [`cannot download ${name}: ${error.message}`], warnings, attested: false };
  }
  const actual = `sha256:${sha256(bytes)}`;
  if (actual !== digest) return { errors: [`downloaded ${name} digest ${actual} does not match lock.platform.digest ${digest}`], warnings, attested: false };
  const attested = checkAttestation(verifier, bytes, name, slug, requireAttestation, errors, warnings);
  return errors.length ? { errors, warnings, attested } : { bytes, errors, warnings, attested };
}

/**
 * Highest valid revocations-<n>.json among the repo's releases. An offline or
 * unreachable source is a warning (reads must keep working); a list that
 * fails attestation (when verifiable) is never used.
 * @returns {Promise<{list: object|null, errors: string[], warnings: string[]}>}
 */
export async function fetchRevocations({ repo, fetchImpl = fetch, verifier = ghAttestationVerifier(), requireAttestation = false }) {
  const errors = [];
  const warnings = [];
  const { slug } = parseRepo(repo);
  let releases;
  try {
    const res = await fetchImpl(`https://api.github.com/repos/${slug}/releases?per_page=100`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "ai-native-bootstrap" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    releases = await res.json();
  } catch (error) {
    return { list: null, errors, warnings: [`revocations unavailable (${error.message}); revocation status NOT checked`] };
  }
  const assets = new Map();
  for (const release of releases) {
    for (const a of release.assets ?? []) {
      const m = REVOCATIONS_ASSET.exec(a.name);
      if (m && !assets.has(a.name)) assets.set(a.name, { n: Number(m[1]), url: a.browser_download_url });
    }
  }
  const ordered = [...assets.entries()].sort((a, b) => b[1].n - a[1].n);
  for (const [name, { url }] of ordered) {
    let bytes;
    try {
      bytes = await getBytes(fetchImpl, url, 1024 * 1024);
    } catch (error) {
      warnings.push(`ignored ${name}: ${error.message}`);
      continue;
    }
    const { list, errors: shape } = parseRevocations(bytes.toString("utf8"), name);
    if (shape.length) {
      warnings.push(`ignored ${name}: ${shape[0]}`);
      continue;
    }
    // Fail closed: a higher-n list that cannot be vouched for is never skipped
    // in favour of an older one (that would let an attacker "un-revoke").
    checkAttestation(verifier, bytes, name, slug, requireAttestation, errors, warnings);
    return errors.length ? { list: null, errors, warnings } : { list, errors, warnings };
  }
  if (!ordered.length) warnings.push("no revocations list is published yet; revocation status NOT checked");
  return { list: null, errors, warnings };
}
