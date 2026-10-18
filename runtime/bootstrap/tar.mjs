// Minimal deterministic ustar reader/writer (M4.1). The release bundle
// (M4.2) is a .tar / .tar.gz; node has no built-in tar, and a bundle is
// untrusted input until its digest is verified, so this reader accepts
// only regular files and rejects everything that could escape the
// extraction root (PAR-CACHE-TRAVERSAL): absolute paths, `..` segments,
// backslashes, NUL, symlinks/hardlinks/devices, duplicate paths.
import { gunzipSync } from "node:zlib";

const BLOCK = 512;

export class BundleFormatError extends Error {}

export function safeEntryPath(name) {
  if (typeof name !== "string" || name === "") throw new BundleFormatError("empty entry path");
  if (name.includes("\0") || name.includes("\\")) throw new BundleFormatError(`illegal character in entry path: ${JSON.stringify(name)}`);
  if (name.startsWith("/") || /^[A-Za-z]:/.test(name)) throw new BundleFormatError(`absolute entry path: ${name}`);
  const segments = name.split("/");
  if (segments.some((s) => s === ".." || s === "." || s === "")) throw new BundleFormatError(`unsafe entry path: ${name}`);
  return name;
}

function readString(buf, offset, length) {
  const slice = buf.subarray(offset, offset + length);
  const end = slice.indexOf(0);
  return slice.subarray(0, end === -1 ? length : end).toString("utf8");
}

/** @returns {Map<string, Buffer>} path -> content, in archive order. */
export function readTar(input) {
  let buf = Buffer.from(input);
  if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) buf = gunzipSync(buf);
  const files = new Map();
  let offset = 0;
  while (offset + BLOCK <= buf.length) {
    const header = buf.subarray(offset, offset + BLOCK);
    if (header.every((b) => b === 0)) break;
    const checksum = parseInt(readString(header, 148, 8).trim() || "0", 8);
    let sum = 0;
    for (let i = 0; i < BLOCK; i += 1) sum += i >= 148 && i < 156 ? 32 : header[i];
    if (sum !== checksum) throw new BundleFormatError("tar header checksum mismatch");
    const prefix = readString(header, 345, 155);
    const name = (prefix ? `${prefix}/` : "") + readString(header, 0, 100);
    const size = parseInt(readString(header, 124, 12).trim() || "0", 8);
    const type = String.fromCharCode(header[156] || 48);
    offset += BLOCK;
    if (type === "5") continue; // directories carry no content
    if (type !== "0") throw new BundleFormatError(`unsupported entry type '${type}' for ${name}`);
    safeEntryPath(name);
    if (files.has(name)) throw new BundleFormatError(`duplicate entry: ${name}`);
    if (offset + size > buf.length) throw new BundleFormatError(`truncated entry: ${name}`);
    files.set(name, Buffer.from(buf.subarray(offset, offset + size)));
    offset += Math.ceil(size / BLOCK) * BLOCK;
  }
  return files;
}

function writeField(header, value, offset, length) {
  header.write(value, offset, length, "utf8");
}

/** Deterministic: sorted paths, fixed mtime/uid/gid/mode, no extra fields. */
export function writeTar(files) {
  const entries = Object.entries(files).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const chunks = [];
  for (const [name, content] of entries) {
    const data = Buffer.from(content);
    if (Buffer.byteLength(name) > 100) throw new BundleFormatError(`path too long for ustar writer: ${name}`);
    const header = Buffer.alloc(BLOCK);
    writeField(header, name, 0, 100);
    writeField(header, "0000644\0", 100, 8);
    writeField(header, "0000000\0", 108, 8);
    writeField(header, "0000000\0", 116, 8);
    writeField(header, `${data.length.toString(8).padStart(11, "0")}\0`, 124, 12);
    writeField(header, "00000000000\0", 136, 12);
    writeField(header, "        ", 148, 8);
    header[156] = 48;
    writeField(header, "ustar\0", 257, 6);
    writeField(header, "00", 263, 2);
    let sum = 0;
    for (const b of header) sum += b;
    writeField(header, `${sum.toString(8).padStart(6, "0")}\0 `, 148, 8);
    chunks.push(header, data, Buffer.alloc((BLOCK - (data.length % BLOCK)) % BLOCK));
  }
  chunks.push(Buffer.alloc(BLOCK * 2));
  return Buffer.concat(chunks);
}
