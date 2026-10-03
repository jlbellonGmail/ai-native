// P29 (M5): "verify rechaza un attestation ajeno" with the REAL `gh attestation verify` and a REAL
// published artifact: the v3.0.0-alpha.1 bundle, attested by jlbellonGmail/ai-native. For any other
// expected repo that attestation is foreign and must be rejected, fail-closed, before the bytes are
// used. Control cases prove the failure is the attestation and not the environment.
// Needs github.com and an authenticated `gh` (GH_TOKEN): runs in pilot.yml; locally it SKIPs, and with
// AI_NATIVE_REQUIRE_NETWORK=1 any setup failure is a FAILURE, never a silent skip.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { downloadRelease, ghAttestationVerifier } from "../bootstrap/remote.mjs";

const VERSION = "v3.0.0-alpha.1";
const REPO = "jlbellonGmail/ai-native";
const DIGEST = "sha256:207bb0d71d76de479b722b106bd1c127ec31c9a8f36285f79578aa047db067a0";
const ASSET = `ai-native-${VERSION}.tar.gz`;
const strict = process.env.AI_NATIVE_REQUIRE_NETWORK === "1";

const dir = mkdtempSync(join(tmpdir(), "ai-native-att-"));
const file = join(dir, ASSET);
let bytes = null;
let reason = null;
try {
  // `gh` writes the artifact itself (like a consumer's tooling would); we only read it back to serve it to downloadRelease
  // GitHub answers 5xx now and then: retry with backoff, never treat infrastructure noise as a result
  let dl;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    dl = spawnSync("gh", ["release", "download", VERSION, "--repo", REPO, "--pattern", ASSET, "--dir", dir, "--clobber"], { encoding: "utf8" });
    if (dl.status === 0 || !/5\d\d|timeout|temporar/i.test(`${dl.stderr}${dl.stdout}`)) break;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 5000);
  }
  if (dl.status !== 0) throw new Error(`gh release download failed: ${(dl.stderr || dl.stdout).trim().split(/\r?\n/).pop()}`);
  bytes = readFileSync(file);
  if (`sha256:${createHash("sha256").update(bytes).digest("hex")}` !== DIGEST) throw new Error("downloaded bundle does not match the published digest");
} catch (error) {
  reason = error.message;
  if (strict) throw error;
}
const opts = { skip: bytes ? false : `prerequisites unavailable (${reason}); set AI_NATIVE_REQUIRE_NETWORK=1 to make this a failure` };

const verify = ghAttestationVerifier();
const fakeFetch = async () => ({ ok: true, arrayBuffer: async () => bytes });
const lockFor = (repo) => ({ platform: { repo: `github:${repo}`, version: VERSION, commit: "9e155b4b77ef4331dae2926e9053abb792733e8d", digest: DIGEST } });

test("control: the artifact verifies against the repo that attested it", opts, () => {
  assert.deepEqual(verify(file, REPO), { status: "VERIFIED" });
});

for (const foreign of ["jlbellonGmail/template", "jlbellonGmail/template-starter", "cli/cli"]) {
  test(`a foreign repo (${foreign}) is rejected: the attestation belongs to ${REPO}`, opts, () => {
    const r = verify(file, foreign);
    assert.equal(r.status, "FAILED", JSON.stringify(r));
    // it is the attestation that is rejected, not an auth/network problem (the control above proves gh works)
    assert.match(r.detail ?? "", /404|no attestation|attestation|verif/i);
    assert.doesNotMatch(r.detail ?? "", /authenticat|login|token|rate limit|could not resolve/i);
  });
}

test("downloadRelease is fail-closed: right digest, foreign attestation -> error and NO bytes returned", opts, async () => {
  const bad = await downloadRelease({ lock: lockFor("jlbellonGmail/template"), fetchImpl: fakeFetch, requireAttestation: true });
  assert.equal(bad.bytes, undefined, "bytes must never be returned when the attestation fails");
  assert.match(bad.errors.join(" "), /attestation verification FAILED/);
  assert.equal(bad.attested, false);
  // same with requireAttestation off: a FAILED attestation always blocks (only 'unavailable' degrades to a warning)
  const soft = await downloadRelease({ lock: lockFor("jlbellonGmail/template"), fetchImpl: fakeFetch, requireAttestation: false });
  assert.equal(soft.bytes, undefined);
  assert.match(soft.errors.join(" "), /FAILED/);
});

test("downloadRelease control: the same bytes with the right repo are returned and attested", opts, async () => {
  const good = await downloadRelease({ lock: lockFor(REPO), fetchImpl: fakeFetch, requireAttestation: true });
  assert.deepEqual(good.errors, []);
  assert.equal(good.attested, true);
  assert.ok(good.bytes.equals(bytes));
});

test("downloadRelease: tampered bytes are rejected by the digest before any attestation check", opts, async () => {
  const evil = Buffer.concat([bytes, Buffer.from("x")]);
  const r = await downloadRelease({ lock: lockFor(REPO), fetchImpl: async () => ({ ok: true, arrayBuffer: async () => evil }), requireAttestation: true });
  assert.equal(r.bytes, undefined);
  assert.match(r.errors.join(" "), /does not match lock\.platform\.digest/);
});

test("cleanup", opts, () => {
  rmSync(dir, { recursive: true, force: true });
});
