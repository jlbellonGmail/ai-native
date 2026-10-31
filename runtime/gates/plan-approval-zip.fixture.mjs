// Test fixture (not a test, not shipped logic): builds zip archives byte by byte, with one override per field of the
// profile enforced by plan-approval-artifact.mjs, so every rejection can be tested on a archive that is valid in every
// OTHER respect. The CRC oracle is zlib.crc32, independent from the reader's own implementation.
import { crc32 as zlibCrc32, deflateRawSync } from "node:zlib";

export const ARTIFACT_NAME = "plan-approval-receipt.json";
export const MODE = { REG: 0o100644, SYMLINK: 0o120777, DIR: 0o040755, FIFO: 0o010644, CHR: 0o020644, BLK: 0o060644, SOCK: 0o140644, UNKNOWN_TYPE: 0o130644, NO_TYPE: 0o000644 };
export const unixAttrs = (mode) => ((mode << 16) | 0x20) >>> 0;
// Exactly what a real upload-artifact download carries (fetched with GET and dumped): made by 3/45, flags 8, deflate, 0o100644.
export const GITHUB_MADE_BY = 0x032d;

const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };

/** One entry: local header + data (+ descriptor) and its central header. `o` overrides any field. */
function entry(o, offset) {
  const name = Buffer.from(o.name ?? ARTIFACT_NAME, o.nameEncoding ?? "latin1");
  const data = o.data ?? Buffer.from('{"a":1}');
  const method = o.method ?? 8;
  const comp = o.comp ?? (method === 8 ? deflateRawSync(data) : data);
  const crc = o.crc ?? zlibCrc32(data);
  const cSize = o.cSize ?? comp.length;
  const uSize = o.uSize ?? data.length;
  const flags = o.flags ?? (method === 8 && o.descriptor !== false ? 8 : 0);
  const hasDescriptor = o.descriptorBytes ? true : (o.writeDescriptor ?? Boolean(flags & 8));
  const need = o.need ?? (method === 8 ? 20 : 10);
  const locName = o.locName === undefined ? name : Buffer.from(o.locName, "latin1");
  const locExtra = o.locExtra ?? Buffer.alloc(0);
  const cenExtra = o.cenExtra ?? Buffer.alloc(0);
  const cenComment = o.cenComment ?? Buffer.alloc(0);
  const zeroLoc = Boolean(flags & 8) && o.locValues !== "real";

  const loc = Buffer.concat([
    u32(0x04034b50), u16(o.locNeed ?? need), u16(o.locFlags ?? flags), u16(o.locMethod ?? method), u16(0), u16(0x5a21),
    u32(o.locCrc ?? (zeroLoc ? 0 : crc)), u32(o.locCSize ?? (zeroLoc ? 0 : cSize)), u32(o.locUSize ?? (zeroLoc ? 0 : uSize)),
    u16(locName.length), u16(locExtra.length), locName, locExtra,
  ]);
  let desc = Buffer.alloc(0);
  if (o.descriptorBytes) desc = o.descriptorBytes;
  else if (hasDescriptor) desc = Buffer.concat([...(o.descriptorSignature === false ? [] : [u32(o.descriptorSig ?? 0x08074b50)]), u32(o.descCrc ?? crc), u32(o.descCSize ?? cSize), u32(o.descUSize ?? uSize)]);
  const local = Buffer.concat([loc, comp, desc]);

  const attrs = o.ea ?? unixAttrs(o.mode ?? MODE.REG);
  const cen = Buffer.concat([
    u32(0x02014b50), u16(o.madeBy ?? GITHUB_MADE_BY), u16(need), u16(flags), u16(method), u16(0), u16(0x5a21),
    u32(crc), u32(cSize), u32(uSize), u16(name.length), u16(cenExtra.length), u16(cenComment.length),
    u16(o.diskStart ?? 0), u16(o.ia ?? 0), u32(attrs), u32(o.locOff ?? offset), name, cenExtra, cenComment,
  ]);
  return { local, cen };
}

/**
 * Archive layout: [prefix] entries... [gap] central directory [cdTail] EOCD [comment] [suffix]. Every EOCD field can be overridden.
 * `entries` (array of entry overrides) builds several entries; otherwise the top-level fields describe the only one.
 */
export function buildZip(o = {}) {
  const list = o.entries ?? [o];
  const prefix = o.prefix ?? Buffer.alloc(0);
  let offset = o.entryBase ?? 0;
  const locals = [], cens = [];
  for (const e of list) {
    const { local, cen } = entry({ ...e }, offset);
    locals.push(local); cens.push(cen);
    offset += local.length;
  }
  const gap = o.gap ?? Buffer.alloc(0);
  const localPart = Buffer.concat([prefix, ...locals, gap]);
  const cd = Buffer.concat(cens);
  const cdTail = o.cdTail ?? Buffer.alloc(0);
  const comment = o.comment ?? Buffer.alloc(0);
  const eocd = Buffer.concat([
    u32(0x06054b50), u16(o.disk ?? 0), u16(o.cdDisk ?? 0), u16(o.here ?? list.length), u16(o.total ?? list.length),
    u32(o.cdSize ?? cd.length + (o.cdSizeDelta ?? 0)), u32(o.cdOff ?? localPart.length), u16(o.commentLen ?? comment.length),
  ]);
  return Buffer.concat([localPart, cd, cdTail, eocd, comment, o.suffix ?? Buffer.alloc(0)]);
}

/** A zip64 end-of-central-directory locator is 20 bytes starting with this signature, directly before the EOCD. */
export function withZip64Locator(zip) {
  const eocd = zip.subarray(zip.length - 22), body = zip.subarray(0, zip.length - 22);
  const loc = Buffer.alloc(20);
  loc.writeUInt32LE(0x07064b50, 0);
  return Buffer.concat([body, loc, eocd]);
}

/** Byte offset of the central header / EOCD of a zip built by buildZip (single entry). */
export const cenOffset = (zip) => zip.readUInt32LE(zip.length - 22 + 16);
export const eocdOffset = (zip) => zip.length - 22;
