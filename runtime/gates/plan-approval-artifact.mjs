// Plan Approval Receipt: byte-level handling of the downloaded artifact archive. Pure, no I/O, no dependencies.
// Layer 2 of 4 (1 authenticated download = plan-approval.mjs, 2 bytes = here, 3 content = validateReceipt,
// 4 run provenance = verifyReceiptProvenance). Nothing in the archive is executed or written to disk: the entry is
// inflated in memory, bounded by the declared size.
//
// No third-party zip library: the receipt archive is a closed, tiny format (what actions/upload-artifact produces for
// ONE file), and a general-purpose reader would have to be restricted to this profile anyway. Every field that a
// general reader would "interpret" (symlinks, directories, extra fields, zip64, multiple entries, comments, gaps) is
// instead REJECTED, so there is nothing to interpret. Anything outside ZIP_PROFILE throws (callers turn it into BLOCKED).
import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";

export const sha256OfBytes = (bytes) => createHash("sha256").update(bytes).digest("hex");

/**
 * The ONE archive layout that is accepted. Derived from a real GET of an upload-artifact download (see
 * governance/security/PLAN-APPROVAL-RECEIPT.md); every point below is enforced and has a test.
 *
 *   [local header | name][deflate or stored data][data descriptor, only if flag bit 3][central header | name][EOCD]
 *   - contiguous and exact: no prefix, no gap, no overlap, no trailing byte, no archive comment, no extra fields
 *   - EXACTLY one entry; EOCD is the last 22 bytes; no zip64 (no locator, no 0xFFFF/0xFFFFFFFF sentinel, no extra)
 *   - flags 0x0000 or 0x0008 only (no encryption, no UTF-8 flag, no strong crypto), identical in both headers
 *   - method 8 (deflate) or 0 (stored; then no descriptor), identical in both headers
 *   - local header values (name, flags, method, version, crc, sizes) agree with the central header; with bit 3 the
 *     local crc/sizes are zero or equal, and the descriptor (signature form, 16 bytes) agrees with the central header
 *   - REGULAR FILE only: creator system FAT(0), Unix(3) or NTFS(10). Unix: S_IFREG, no setuid/setgid/sticky; DOS family:
 *     no directory/volume/reparse attribute and no Unix bits. Symlink, directory, FIFO, device, socket and every
 *     unknown type are rejected
 *   - name: ASCII [A-Za-z0-9_.-]+, no path separators, not "." / ".." / "..*", at most 255 bytes
 *   - 1 <= size <= maxBytes (1 MiB), archive <= maxArchiveBytes (2 MiB), compression ratio <= MAX_RATIO
 *   - CRC-32 of the inflated bytes equals the recorded one; the deflate stream ends exactly at the recorded size and
 *     inflates to exactly the recorded size
 */
export const ZIP_PROFILE = "plan-approval-zip-v1";

const EOCD = 0x06054b50;
const ZIP64_LOCATOR = 0x07064b50;
const CEN = 0x02014b50;
const LOC = 0x04034b50;
const DESC = 0x08074b50;
const MAX_ENTRY_BYTES = 1024 * 1024;
const MAX_ARCHIVE_BYTES = 2 * 1024 * 1024;
const MAX_RATIO = 50;
const MAX_NAME_BYTES = 255;
const HOST_FAT = 0, HOST_UNIX = 3, HOST_NTFS = 10;
const S_IFMT = 0o170000, S_IFREG = 0o100000;

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

/** CRC-32 (IEEE), table based: zlib.crc32 only exists from Node 20.15 / 22.2 and the repository supports >=20. */
export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const fail = (msg) => { throw new Error(`zip: ${msg}`); };

/** The external attributes must describe a regular file, whatever system created the archive. */
function checkFileKind(madeBy, ea, internal) {
  const host = madeBy >>> 8;
  if (internal & ~1) fail(`unknown internal attributes 0x${internal.toString(16)}`);
  const dos = ea & 0xffff, high = ea >>> 16;
  if (host === HOST_UNIX) {
    const type = high & S_IFMT;
    if (type !== S_IFREG) fail(`entry is not a regular file (unix file type 0o${type.toString(8)}): symlinks, directories, FIFOs, devices and sockets are rejected`);
    if (high & 0o7000) fail("entry has setuid/setgid/sticky bits");
    if (dos & ~0x27) fail(`unexpected DOS attributes 0x${dos.toString(16)} on a unix entry`);
    return host;
  }
  if (host === HOST_FAT || host === HOST_NTFS) {
    if (dos & 0x10) fail("entry is a directory (DOS attribute)");
    if (dos & 0x08) fail("entry is a volume label (DOS attribute)");
    if (dos & ~0x27) fail(`DOS attributes 0x${dos.toString(16)} are not those of a regular file (reparse point, device, ...)`);
    if (high) fail("unix mode bits on a non-unix entry");
    return host;
  }
  return fail(`unsupported creator system ${host}`);
}

/**
 * Reads an archive that must follow ZIP_PROFILE. Throws on any irregularity (callers turn that into BLOCKED).
 * Returns { name, data, crc32, method, compressedSize, uncompressedSize, creatorSystem, profile }.
 */
export function readSingleEntryZip(buf, { maxBytes = MAX_ENTRY_BYTES, maxArchiveBytes = MAX_ARCHIVE_BYTES } = {}) {
  if (!Buffer.isBuffer(buf)) fail("not a zip archive");
  if (buf.length < 22 + 30 + 46) fail("not a zip archive (too short)");
  if (buf.length > maxArchiveBytes) fail("archive too large");

  // --- end of central directory: fixed position (no comment is accepted), so no signature search can be fooled
  const e = buf.length - 22;
  if (buf.readUInt32LE(e) !== EOCD) fail("end of central directory not found at the end of the archive (comment, trailing data or not a zip)");
  if (buf.readUInt16LE(e + 20) !== 0) fail("archive comment is not accepted");
  if (e >= 20 && buf.readUInt32LE(e - 20) === ZIP64_LOCATOR) fail("zip64 is not accepted");
  const disk = buf.readUInt16LE(e + 4), cdDisk = buf.readUInt16LE(e + 6), here = buf.readUInt16LE(e + 8), total = buf.readUInt16LE(e + 10);
  const cdSize = buf.readUInt32LE(e + 12), cdOff = buf.readUInt32LE(e + 16);
  if (here === 0xffff || total === 0xffff || cdSize === 0xffffffff || cdOff === 0xffffffff) fail("zip64 is not accepted");
  if (disk !== 0 || cdDisk !== 0) fail("multi-disk archives are not accepted");
  if (here !== 1 || total !== 1) fail(`expected exactly one entry, found ${total}`);
  if (cdOff + cdSize !== e) fail("central directory does not end exactly at the end-of-central-directory record (gap, overlap or hidden data)");
  if (cdSize < 46 || buf.readUInt32LE(cdOff) !== CEN) fail("malformed central directory");

  // --- central header
  const madeBy = buf.readUInt16LE(cdOff + 4), need = buf.readUInt16LE(cdOff + 6), flags = buf.readUInt16LE(cdOff + 8), method = buf.readUInt16LE(cdOff + 10);
  const crc = buf.readUInt32LE(cdOff + 16), cSize = buf.readUInt32LE(cdOff + 20), uSize = buf.readUInt32LE(cdOff + 24);
  const nameLen = buf.readUInt16LE(cdOff + 28), extraLen = buf.readUInt16LE(cdOff + 30), commentLen = buf.readUInt16LE(cdOff + 32);
  const diskStart = buf.readUInt16LE(cdOff + 34), internal = buf.readUInt16LE(cdOff + 36), ea = buf.readUInt32LE(cdOff + 38), locOff = buf.readUInt32LE(cdOff + 42);
  if (extraLen !== 0 || commentLen !== 0) fail("extra fields and entry comments are not accepted (zip64 and other extensions live there)");
  if (cdSize !== 46 + nameLen) fail("central directory holds more than the single declared entry");
  if (diskStart !== 0) fail("entry does not start on disk 0");
  if (cSize === 0xffffffff || uSize === 0xffffffff || locOff === 0xffffffff) fail("zip64 is not accepted");
  if (need < 10 || need > 20) fail(`unsupported version needed to extract ${need} (zip64 needs 45)`);
  if (flags !== 0 && flags !== 0x8) fail(`unsupported general purpose flags 0x${flags.toString(16)} (encryption, UTF-8 names, patched data, ... are rejected)`);
  if (method !== 0 && method !== 8) fail(`unsupported compression method ${method}`);
  if (method === 0 && (flags !== 0 || cSize !== uSize)) fail("stored entries must have no data descriptor and equal sizes");
  const creatorSystem = checkFileKind(madeBy, ea, internal);
  if (locOff !== 0) fail("entry does not start at offset 0 (prefixed data, gap or overlap)");

  // --- name (central), strictly the same bytes as the local one
  if (nameLen < 1 || nameLen > MAX_NAME_BYTES) fail("unacceptable entry name length");
  const nameBytes = buf.subarray(cdOff + 46, cdOff + 46 + nameLen);
  const name = nameBytes.toString("latin1");
  if (!/^[A-Za-z0-9_.-]+$/.test(name) || name.startsWith("..") || name === ".") fail(`unacceptable entry name '${name.replace(/[^\x20-\x7e]/g, "?")}'`);

  // --- sizes
  if (uSize < 1) fail("empty entry");
  if (uSize > maxBytes) fail("entry too large");
  if (method === 8 && (cSize < 1 || uSize > cSize * MAX_RATIO)) fail("suspicious compression ratio");

  // --- local header
  if (buf.readUInt32LE(0) !== LOC) fail("malformed local header");
  const lNeed = buf.readUInt16LE(4), lFlags = buf.readUInt16LE(6), lMethod = buf.readUInt16LE(8);
  const lCrc = buf.readUInt32LE(14), lC = buf.readUInt32LE(18), lU = buf.readUInt32LE(22), lNameLen = buf.readUInt16LE(26), lExtra = buf.readUInt16LE(28);
  if (lNameLen !== nameLen || !buf.subarray(30, 30 + lNameLen).equals(nameBytes)) fail("local header name differs from the central directory name");
  if (lExtra !== 0) fail("local extra fields are not accepted");
  if (lFlags !== flags) fail("local header flags differ from the central directory");
  if (lMethod !== method) fail("local header compression method differs from the central directory");
  if (lNeed !== need) fail("local header version differs from the central directory");
  const descriptor = flags & 0x8 ? 16 : 0;
  const zeroed = lCrc === 0 && lC === 0 && lU === 0, same = lCrc === crc && lC === cSize && lU === uSize;
  if (descriptor ? !(zeroed || same) : !same) fail("local header crc/sizes differ from the central directory");

  // --- layout: LOC | data | descriptor | CD | EOCD, no gap and no overlap
  const start = 30 + nameLen;
  if (start + cSize + descriptor !== cdOff) fail("entry data does not fit exactly between the local header and the central directory (truncated, overlapping or hidden data)");
  if (descriptor) {
    const d = start + cSize;
    if (buf.readUInt32LE(d) !== DESC) fail("data descriptor signature missing or invalid");
    if (buf.readUInt32LE(d + 4) !== crc || buf.readUInt32LE(d + 8) !== cSize || buf.readUInt32LE(d + 12) !== uSize) fail("data descriptor differs from the central directory");
  }

  // --- data, in memory, bounded by the declared size
  const raw = buf.subarray(start, start + cSize);
  let data;
  if (method === 0) data = Buffer.from(raw);
  else {
    const out = inflateRawSync(raw, { info: true, maxOutputLength: uSize });
    if (out.engine.bytesWritten !== cSize) fail("deflate stream does not end at the recorded compressed size");
    data = out.buffer;
  }
  if (data.length !== uSize) fail("uncompressed size mismatch");
  if (crc32(data) !== crc) fail("CRC-32 mismatch");
  return { name, data, crc32: crc, method, compressedSize: cSize, uncompressedSize: uSize, creatorSystem, profile: ZIP_PROFILE };
}

/**
 * Archive evidence for verifyReceiptProvenance: the digest is computed over the bytes actually downloaded and the
 * receipt is parsed from the single entry. Never throws: failures are carried in `error` and end up as BLOCKED.
 */
export function describeArchive({ artifactId, bytes, entryName }) {
  const base = { artifactId, sizeBytes: Buffer.isBuffer(bytes) ? bytes.length : null, sha256: Buffer.isBuffer(bytes) ? sha256OfBytes(bytes) : null, receipt: null, error: null };
  if (!Buffer.isBuffer(bytes)) return { ...base, error: "no bytes were downloaded" };
  try {
    const { name, data } = readSingleEntryZip(bytes);
    if (name !== entryName) throw new Error(`entry is '${name}', expected '${entryName}'`);
    const parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(data));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("receipt is not a JSON object");
    return { ...base, receipt: parsed };
  } catch (e) {
    return { ...base, error: e.message };
  }
}
