// M4.2 deterministic release bundle (PAR-REPRODUCIBLE-BUNDLE).
//
// The bundle is a function of ONE git commit: files come from that commit's
// blobs (never the working tree, so Windows CRLF checkouts, untracked junk and
// local edits cannot leak in), entries are sorted, tar metadata is fixed
// (runtime/bootstrap/tar.mjs) and the gzip wrapper is written by hand:
//   - fixed header (mtime 0, OS=255 "unknown"), so it does not depend on the
//     platform that built it;
//   - deflate level 0 (stored blocks): the byte stream does not depend on the
//     zlib build/CPU-optimisations of the machine, which `level >= 1` does.
// The price is size (uncompressed), which for a runtime of this scale is
// irrelevant next to being able to say "same commit => same digest".
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { deflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { writeTar } from "../bootstrap/tar.mjs";

/** Paths shipped in a release. Tests are not runtime. */
export const INCLUDE_PREFIXES = ["runtime/", "contracts/", "core/", "mcp/", "profiles/", "audit/", ".agents/skills/"];
export const EXCLUDE_PATTERNS = [/\.test\.(mjs|ps1)$/];
/** The real digest cannot live inside the bytes it digests; the published platform.json carries it. */
export const PLACEHOLDER_DIGEST = `sha256:${"0".repeat(64)}`;
export const ENTRY_POINT = "runtime/main.mjs";

export function isShipped(path) {
  return INCLUDE_PREFIXES.some((p) => path.startsWith(p)) && !EXCLUDE_PATTERNS.some((re) => re.test(path));
}

const git = (cwd, args, input) => {
  const r = spawnSync("git", args, { cwd, input, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr?.toString().trim()}`);
  return r.stdout;
};

/** @returns {Record<string, Buffer>} shipped path -> blob content at `commit`. */
export function readShippedFiles(root, commit) {
  const entries = git(root, ["ls-tree", "-r", "-z", commit]).toString("utf8").split("\0").filter(Boolean);
  const wanted = [];
  for (const e of entries) {
    const tab = e.indexOf("\t");
    const [mode, type, sha] = e.slice(0, tab).split(" ");
    const path = e.slice(tab + 1);
    if (type !== "blob" || mode === "120000" || !isShipped(path)) continue; // symlinks are never shipped
    wanted.push({ path, sha });
  }
  const out = git(root, ["cat-file", "--batch"], wanted.map((w) => `${w.sha}\n`).join(""));
  const files = {};
  let offset = 0;
  for (const w of wanted) {
    const nl = out.indexOf(0x0a, offset);
    const [sha, , size] = out.subarray(offset, nl).toString("utf8").split(" ");
    if (sha !== w.sha) throw new Error(`git cat-file out of sync at ${w.path}`);
    const n = Number(size);
    files[w.path] = Buffer.from(out.subarray(nl + 1, nl + 1 + n));
    offset = nl + 1 + n + 1;
  }
  return files;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Platform-independent gzip: fixed header, stored deflate blocks. */
export function gzipDeterministic(data) {
  const header = Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0, 0, 0, 0, 0x00, 0xff]);
  const body = deflateRawSync(data, { level: 0 });
  const trailer = Buffer.alloc(8);
  trailer.writeUInt32LE(crc32(data), 0);
  trailer.writeUInt32LE(data.length >>> 0, 4);
  return Buffer.concat([header, body, trailer]);
}

export const sha256Hex = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** ISO-8601 UTC of the commit (deterministic, unlike "now"). */
export function commitTimestamp(root, commit) {
  const iso = git(root, ["show", "-s", "--format=%cI", commit]).toString("utf8").trim();
  return new Date(iso).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function show(root, commit, path) {
  return git(root, ["show", `${commit}:${path}`]).toString("utf8");
}

export function componentVersions(root, commit) {
  const unitEvent = JSON.parse(show(root, commit, "contracts/unit-event.schema.json")).properties.schemaVersion.const;
  const audit = JSON.parse(show(root, commit, "audit/method.json")).auditMethod;
  return { "unit-event": { version: String(unitEvent) }, "audit-method": { version: String(audit) } };
}

/**
 * A capability is "executable" only if every parity test that proves it is
 * IMPLEMENTED (P25). Anything else is reported "missing", never optimistic.
 */
export function capabilities(root, commit) {
  const caps = JSON.parse(show(root, commit, "parity/v2.0.5/capabilities.json")).capabilities;
  const tests = new Map(JSON.parse(show(root, commit, "parity/par-tests.json")).tests.map((t) => [t.id, t]));
  return caps
    .map((c) => {
      const proofs = c.parTests.map((id) => tests.get(id));
      const ok = proofs.length > 0 && proofs.every((t) => t?.status === "IMPLEMENTED");
      const evidence = ok ? proofs.find((t) => t.implementedBy)?.implementedBy : undefined;
      return { id: c.id, status: ok ? "executable" : "missing", ...(evidence ? { evidence } : {}) };
    })
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** Builds the release bundle for `commit` (all inputs read from that commit). */
export function buildBundle({ root, commit, version }) {
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error("commit must be a full 40-hex SHA");
  const files = readShippedFiles(root, commit);
  if (!files[ENTRY_POINT]) throw new Error(`release has no ${ENTRY_POINT}`);
  const platform = {
    schemaVersion: 1,
    version,
    commit,
    digest: PLACEHOLDER_DIGEST,
    generatedAt: commitTimestamp(root, commit),
    components: componentVersions(root, commit),
    capabilities: capabilities(root, commit),
  };
  const entries = { ...files, "platform.json": `${JSON.stringify(platform, null, 2)}\n` };
  const bytes = gzipDeterministic(writeTar(entries));
  return { bytes, digest: `sha256:${sha256Hex(bytes)}`, platform, fileCount: Object.keys(entries).length };
}

/** The published platform.json: same content, real digest + asset pointers. */
export function publishedPlatform(platform, digest, { sbom, provenance } = {}) {
  return { ...platform, digest, ...(sbom ? { sbom } : {}), ...(provenance ? { provenance } : {}) };
}
