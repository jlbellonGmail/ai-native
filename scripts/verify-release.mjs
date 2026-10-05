// External verification of a published release, as a consumer would do it (no repo checkout is trusted:
// everything is downloaded from the public release). Used for rc.2 and v3.0.0.
//   node scripts/verify-release.mjs <tag> [--repo owner/name] [--expect-commit <40-hex>] [--revocations <file>]
// Checks: tag -> commit, release flags (not draft, immutable), assets present, SHA256SUMS, platform.json vs tarball digest,
// `gh attestation verify` of every asset (and offline with the sigstore bundle), a foreign repo is REJECTED, SBOM format,
// revocations equal to the repo's, and a real bootstrap init/sync/doctor/run/status in a temp project. Exit code != 0 on any FAIL.
// It never prints secrets and never writes outside a temp dir.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** `<sha256>  <name>` lines of a SHA256SUMS file -> Map(name -> hex). Throws on a malformed line. */
export function parseSums(text) {
  const out = new Map();
  for (const line of text.replace(/\r/g, "").split("\n")) {
    if (!line.trim()) continue;
    const m = /^([0-9a-f]{64}) [ *](\S+)$/.exec(line);
    if (!m) throw new Error(`malformed SHA256SUMS line: ${line}`);
    out.set(m[2], m[1]);
  }
  return out;
}

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** Assets every platform release must carry. */
export function expectedAssets(tag) {
  return [`ai-native-${tag}.tar.gz`, `ai-native-${tag}.sbom.cdx.json`, `ai-native-${tag}.sigstore.json`, "platform.json", "SHA256SUMS"];
}

const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, ...opts });
const gh = (args) => run("gh", args);

export function verifyRelease({ tag, repo = "jlbellonGmail/ai-native", expectCommit = null, revocationsFile = join(root, "governance", "versioning", "revocations-1.json") }) {
  const checks = [];
  const add = (name, ok, detail = "") => checks.push({ name, ok, detail });
  if (!/^v\d+\.\d+\.\d+(-(alpha|rc)\.\d+)?$/.test(tag)) return [{ name: "tag format", ok: false, detail: tag }];
  const dir = mkdtempSync(join(tmpdir(), "ai-native-verify-"));
  try {
    const ref = gh(["api", `repos/${repo}/git/ref/tags/${tag}`, "--jq", ".object"]);
    let commit = null;
    if (ref.status === 0) {
      const obj = JSON.parse(ref.stdout);
      commit = obj.sha;
      if (obj.type === "tag") commit = JSON.parse(gh(["api", `repos/${repo}/git/tags/${obj.sha}`, "--jq", ".object"]).stdout).sha;
    }
    add("tag resolves to a commit", /^[0-9a-f]{40}$/.test(commit ?? ""), commit ?? "not found");
    if (expectCommit) add("tag commit equals the expected commit", commit === expectCommit, `${commit} vs ${expectCommit}`);
    const rel = gh(["release", "view", tag, "--repo", repo, "--json", "isDraft,isPrerelease,isImmutable,assets"]);
    let info = {};
    try { info = JSON.parse(rel.stdout); } catch { /* reported below */ }
    add("release exists, is published and immutable", rel.status === 0 && info.isDraft === false && info.isImmutable === true, `draft=${info.isDraft} immutable=${info.isImmutable} prerelease=${info.isPrerelease}`);
    const names = (info.assets ?? []).map((a) => a.name);
    const missing = expectedAssets(tag).filter((n) => !names.includes(n));
    add("required assets present", missing.length === 0, missing.length ? `missing: ${missing.join(", ")}` : names.join(", "));
    const dl = gh(["release", "download", tag, "--repo", repo, "--dir", dir]);
    add("assets download without authentication assumptions", dl.status === 0, dl.stderr.trim().split("\n")[0]);
    if (dl.status !== 0) return checks;

    // checksums
    const sums = parseSums(readFileSync(join(dir, "SHA256SUMS"), "utf8"));
    const bad = [...sums].filter(([n, h]) => { try { return sha256(readFileSync(join(dir, n))) !== h; } catch { return true; } });
    add("SHA256SUMS matches every listed file", sums.size > 0 && bad.length === 0, bad.length ? `mismatch: ${bad.map(([n]) => n).join(", ")}` : `${sums.size} files`);
    const tarName = `ai-native-${tag}.tar.gz`;
    const tarSha = sha256(readFileSync(join(dir, tarName)));
    const platform = JSON.parse(readFileSync(join(dir, "platform.json"), "utf8"));
    add("platform.json digest equals the tarball sha256", platform.digest === `sha256:${tarSha}`, `${platform.digest} vs sha256:${tarSha}`);
    add("platform.json version and commit equal the tag", platform.version === tag && platform.commit === commit, `${platform.version}@${platform.commit}`);

    // provenance
    for (const a of readdirSync(dir).filter((n) => n !== "SHA256SUMS" && !n.endsWith(".sigstore.json"))) {
      const r = gh(["attestation", "verify", join(dir, a), "--repo", repo]);
      add(`attestation: ${a}`, r.status === 0, r.status === 0 ? "" : r.stderr.trim().split("\n")[0]);
    }
    const off = gh(["attestation", "verify", join(dir, tarName), "--repo", repo, "--bundle", join(dir, `ai-native-${tag}.sigstore.json`)]);
    add("attestation verifies offline with the sigstore bundle", off.status === 0);
    const foreign = gh(["attestation", "verify", join(dir, tarName), "--repo", "jlbellonGmail/template"]);
    add("attestation of a FOREIGN repo is rejected", foreign.status !== 0);

    // SBOM and revocations
    const sbom = JSON.parse(readFileSync(join(dir, `ai-native-${tag}.sbom.cdx.json`), "utf8"));
    add("SBOM is CycloneDX", sbom.bomFormat === "CycloneDX" && !!sbom.specVersion, `${sbom.bomFormat} ${sbom.specVersion}, ${(sbom.components ?? []).length} components`);
    const revName = readdirSync(dir).find((n) => /^revocations-\d+\.json$/.test(n));
    if (revName) {
      const here = readFileSync(revocationsFile, "utf8").replace(/\r\n/g, "\n");
      add("revocations asset equals the repository's list", readFileSync(join(dir, revName), "utf8").replace(/\r\n/g, "\n") === here, revName);
      const list = JSON.parse(readFileSync(join(dir, revName), "utf8"));
      const revoked = (list.entries ?? []).some((e) => e.kind === "platform" && (e.version === tag || e.commit === commit));
      add("this release is not revoked", !revoked);
    } else add("revocations asset present", false, "no revocations-N.json asset");

    // real consumer: init -> sync (downloads from the public release) -> doctor -> run -> status
    const project = join(dir, "consumer");
    const cache = join(dir, "cache");
    mkdirSync(project);
    const cli = join(root, "runtime", "bootstrap", "cli.mjs");
    const step = (name, args) => { const r = run(process.execPath, [cli, ...args, "--project", project, "--cache", cache]); add(`bootstrap ${name}`, r.status === 0, r.status === 0 ? "" : (r.stdout + r.stderr).trim().split("\n").slice(-2).join(" | ")); return r; };
    step("init", ["init", "--bundle", join(dir, tarName), "--repo", `github:${repo}`, "--profile", "factory"]);
    step("sync --require-attestation (public download)", ["sync", "--require-attestation"]);
    step("doctor", ["doctor"]);
    const v = run(process.execPath, [cli, "run", "--project", project, "--cache", cache, "--", "version"]);
    add("bootstrap run version prints the tag and commit", v.status === 0 && v.stdout.includes(tag) && v.stdout.includes(commit ?? "?"), v.stdout.trim().split("\n")[0]);
    const st = run(process.execPath, [cli, "status", "--check", "--json", "--project", project, "--cache", cache]);
    let stj = {};
    try { stj = JSON.parse(st.stdout); } catch { /* reported */ }
    add("status --check is READY with revocation CHECKED", st.status === 0 && stj.state === "READY" && stj.revocation === "CHECKED", `${stj.state} revocation=${stj.revocation}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return checks;
}

function main() {
  const argv = process.argv.slice(2);
  const tag = argv[0];
  const value = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : undefined);
  if (!tag || tag.startsWith("--")) { console.error("usage: node scripts/verify-release.mjs <tag> [--repo owner/name] [--expect-commit <sha>]"); return 2; }
  const checks = verifyRelease({ tag, repo: value("--repo"), expectCommit: value("--expect-commit") });
  for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.detail ? `  [${c.detail}]` : ""}`);
  const failed = checks.filter((c) => !c.ok).length;
  console.log(failed ? `FAIL (${failed} of ${checks.length} checks)` : `PASS (${checks.length} checks)`);
  return failed ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(main());
