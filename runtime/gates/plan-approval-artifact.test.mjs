// Plan Approval Receipt: the artifact archive reader. Every archive is generated in memory (no disk, no network).
// Each rejection is tested on an archive that is valid in every OTHER respect (buildZip overrides one field), so a
// passing test proves that exactly that check exists. Gates G1-G5 and G12 of the third remediation.
import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { crc32 as zlibCrc32, deflateRawSync } from "node:zlib";
import { ZIP_PROFILE, crc32, describeArchive, readSingleEntryZip } from "./plan-approval-artifact.mjs";
import { ARTIFACT_NAME, GITHUB_MADE_BY, MODE, buildZip, unixAttrs, withZip64Locator } from "./plan-approval-zip.fixture.mjs";

const DATA = Buffer.from('{"receipt":true}');
const ok = (o) => readSingleEntryZip(buildZip({ data: DATA, ...o }));
const rejects = (o, re, opts) => assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, ...o }), opts), re, JSON.stringify(Object.keys(o)));

test("crc32 equals zlib.crc32 (independent oracle) on empty, small and random inputs", () => {
  for (const b of [Buffer.alloc(0), Buffer.from("123456789"), DATA, randomBytes(1), randomBytes(1000), randomBytes(65537)]) assert.equal(crc32(b), zlibCrc32(b));
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
});

// ---------- the accepted profile
test("PROFILE: the exact layout of a real upload-artifact download is accepted (deflate + data descriptor, made by unix 0o100644)", () => {
  const r = ok({});
  assert.deepEqual(r.data, DATA);
  assert.equal(r.name, ARTIFACT_NAME);
  assert.equal(r.profile, ZIP_PROFILE);
  assert.equal(r.creatorSystem, 3);
  assert.equal(r.crc32, zlibCrc32(DATA));
});
test("PROFILE: stored entries (no descriptor) and NTFS/FAT-created regular files are accepted", () => {
  assert.deepEqual(ok({ method: 0 }).data, DATA);
  assert.deepEqual(ok({ method: 8, descriptor: false }).data, DATA);
  assert.equal(ok({ madeBy: (10 << 8) | 45, ea: 0x20 }).creatorSystem, 10);
  assert.equal(ok({ madeBy: (0 << 8) | 20, ea: 0x20 }).creatorSystem, 0);
  assert.equal(ok({ madeBy: (0 << 8) | 20, ea: 0x21 }).creatorSystem, 0); // read-only regular file
});
test("PROFILE: a regular file (G2) is accepted; local header values may be real instead of zero when a descriptor follows", () => {
  assert.deepEqual(ok({ mode: MODE.REG }).data, DATA);
  assert.deepEqual(ok({ locValues: "real" }).data, DATA);
  assert.deepEqual(ok({ mode: 0o100600 }).data, DATA);
});
test("PROFILE: a nested zip (EOCD signature inside the data) cannot confuse the reader: the end record is at a fixed position", () => {
  const nested = buildZip({ data: DATA });
  const outer = readSingleEntryZip(buildZip({ data: nested, method: 0 }));
  assert.deepEqual(outer.data, nested);
});
test("PROFILE: the generic zip behaviours that are NOT in the profile are rejected, not interpreted", () => {
  const good = buildZip({ data: DATA });
  assert.doesNotThrow(() => readSingleEntryZip(good));
  assert.throws(() => readSingleEntryZip(Buffer.from("PK\x05\x06" + "x".repeat(60))));
});

// ---------- G1 / G2: symlinks, directories and every non-regular type
test("G1 symlink: the exact Codex repro (entry marked as symlink, otherwise a valid archive) is REJECTED", () => {
  assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, mode: MODE.SYMLINK, ea: unixAttrs(MODE.SYMLINK) })), /not a regular file.*0o120000/);
  assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, ea: 0xa1ff0000 })), /not a regular file/); // 0777 symlink, no DOS bits
  assert.throws(() => readSingleEntryZip(buildZip({ data: Buffer.from("target.txt"), method: 0, mode: MODE.SYMLINK })), /not a regular file/);
  const a = describeArchive({ artifactId: 1, bytes: buildZip({ data: DATA, mode: MODE.SYMLINK }), entryName: ARTIFACT_NAME });
  assert.equal(a.receipt, null);
  assert.match(a.error, /not a regular file/);
});
test("G2 only regular files: directory, FIFO, char/block device, socket, unknown type and no type are rejected", () => {
  for (const [kind, mode] of Object.entries({ DIR: MODE.DIR, FIFO: MODE.FIFO, CHR: MODE.CHR, BLK: MODE.BLK, SOCK: MODE.SOCK, UNKNOWN_TYPE: MODE.UNKNOWN_TYPE, NO_TYPE: MODE.NO_TYPE })) {
    assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, mode })), /not a regular file/, kind);
  }
  rejects({ mode: 0o104755 }, /setuid/);
  rejects({ mode: 0o102755 }, /setuid\/setgid/);
  rejects({ mode: 0o101644 }, /setuid|sticky/);
});
test("G2 DOS-family directories, volume labels, reparse points and unix bits on a non-unix entry are rejected", () => {
  rejects({ madeBy: (0 << 8) | 20, ea: 0x10 }, /directory/);
  rejects({ madeBy: (10 << 8) | 45, ea: 0x30 }, /directory/);
  rejects({ madeBy: (10 << 8) | 45, ea: 0x08 }, /volume label/);
  rejects({ madeBy: (10 << 8) | 45, ea: 0x400 }, /DOS attributes/); // FILE_ATTRIBUTE_REPARSE_POINT
  rejects({ madeBy: (0 << 8) | 20, ea: ((MODE.SYMLINK << 16) | 0x20) >>> 0 }, /unix mode bits/);
  rejects({ ea: 0x10 | (MODE.REG << 16) }, /DOS attributes/); // directory bit on a unix regular file
});
test("G2 unknown creator systems and unknown internal attributes are rejected", () => {
  for (const host of [1, 2, 4, 5, 7, 14, 19, 255]) rejects({ madeBy: (host << 8) | 45 }, /unsupported creator system/);
  rejects({ ia: 2 }, /internal attributes/);
  rejects({ ia: 0x8000 }, /internal attributes/);
});
test("G2 directory entry as a name (trailing slash) is rejected by the name rule as well", () => {
  rejects({ name: "dir/", mode: MODE.DIR }, /entry name|not a regular file/);
  rejects({ name: "dir/" }, /entry name/);
});

// ---------- G3: header coherence
test("G3 local header name different from the central directory name is rejected (same length and different length)", () => {
  rejects({ locName: "other-receipt.json" }, /name differs/);
  rejects({ locName: "plan-approval-receipt.jsoX" }, /name differs/);
  rejects({ locName: "x" }, /name differs/);
});
test("G3 flags: differing flags, encryption, UTF-8 and unknown bits are rejected", () => {
  rejects({ flags: 8, locFlags: 0 }, /flags differ/);
  rejects({ flags: 0, locFlags: 8, descriptor: false }, /flags differ/);
  rejects({ flags: 1 }, /flags 0x1/);
  rejects({ flags: 0x9 }, /flags 0x9/);
  rejects({ flags: 0x800 }, /flags 0x800/);
  rejects({ flags: 0x2008 }, /flags 0x2008/);
  rejects({ flags: 0x40 }, /flags 0x40/);
});
test("G3 compression method: differing methods, unsupported methods and stored-with-descriptor are rejected", () => {
  rejects({ locMethod: 0 }, /method differs/);
  rejects({ method: 0, locMethod: 8 }, /method differs/);
  for (const m of [1, 6, 9, 12, 14, 93, 95, 99]) rejects({ method: m, comp: DATA, need: 20 }, /compression method/);
  rejects({ method: 0, flags: 8 }, /stored entries/);
  rejects({ method: 0, cSize: DATA.length + 1 }, /stored entries|fit exactly/);
});
test("G3 version needed to extract: differing and zip64 (45) are rejected", () => {
  rejects({ locNeed: 10 }, /version differs/);
  rejects({ need: 45, locNeed: 45 }, /version needed/);
  rejects({ need: 0, locNeed: 0 }, /version needed/);
});
test("G3 local crc/size values that contradict the central directory are rejected", () => {
  rejects({ locValues: "real", locCrc: 1 }, /local header crc/);
  rejects({ locValues: "real", locCSize: 1 }, /local header crc/);
  rejects({ locValues: "real", locUSize: 1 }, /local header crc/);
  rejects({ locCrc: 7 }, /local header crc/); // descriptor mode: zero or equal, anything else is a lie
  rejects({ descriptor: false, locCrc: 0 }, /local header crc/);
});
test("G3 EOCD and central header sanity: disk numbers, entry start disk, comments, extra fields", () => {
  rejects({ commentLen: 5 }, /comment/); // end record at the very end, announcing a comment that is not there
  rejects({ commentLen: 0xffff }, /comment|zip64/);
  rejects({ disk: 1 }, /multi-disk/);
  rejects({ cdDisk: 1 }, /multi-disk/);
  rejects({ diskStart: 1 }, /disk 0/);
  rejects({ comment: Buffer.from("hello") }, /end of central directory not found|comment/);
  rejects({ commentLen: 5, comment: Buffer.alloc(5) }, /end of central directory not found|comment/);
  rejects({ cenExtra: Buffer.from([0x55, 0x54, 0, 0]) }, /extra fields/);
  rejects({ cenComment: Buffer.from("c") }, /extra fields|entry comments/);
  rejects({ locExtra: Buffer.from([0x55, 0x54, 0, 0]) }, /local extra/);
});

// ---------- G4: duplicates, extra and hidden entries
test("G4 duplicate entries (same name twice) and additional entries (other name) are rejected", () => {
  const e = { data: DATA };
  assert.throws(() => readSingleEntryZip(buildZip({ entries: [e, e] })), /exactly one entry, found 2/);
  assert.throws(() => readSingleEntryZip(buildZip({ entries: [e, { ...e, name: "second.json" }] })), /exactly one entry, found 2/);
  assert.throws(() => readSingleEntryZip(buildZip({ entries: [e, { ...e, name: "second.json" }, { ...e, name: "third.json" }] })), /exactly one entry/);
  assert.throws(() => readSingleEntryZip(buildZip({ entries: [e, { ...e, name: "second.json" }], here: 1, total: 1 })), /central directory|more than the single|end-of-central/);
  assert.throws(() => readSingleEntryZip(buildZip({ entries: [e], total: 2, here: 2 })), /exactly one entry, found 2/);
  assert.throws(() => readSingleEntryZip(buildZip({ entries: [e, e], here: 1, total: 2 })), /exactly one entry/);
  assert.throws(() => readSingleEntryZip(buildZip({ entries: [e], total: 0, here: 0 })), /exactly one entry, found 0/);
});
test("G4 hidden entry: the second entry's data/central record is concealed from the counters", () => {
  const second = buildZip({ data: Buffer.from("hidden"), name: "hidden.json" });
  // (a) a hidden local record between the data and the central directory
  assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, gap: second.subarray(0, 60) })), /fit exactly|hidden/);
  // (b) a hidden central record after the real one, not counted by EOCD (cdSize covers only the real one)
  assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, cdTail: second.subarray(second.length - 22 - 46 - 11, second.length - 22) })), /end-of-central|hidden/);
  // (c) cdSize inflated to cover the hidden record: the single declared entry no longer fills the directory
  assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, cdTail: Buffer.alloc(46 + 6), cdSizeDelta: 46 + 6 })), /more than the single/);
  // (d) another complete archive appended after the end record, or a prefix before the first header
  assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, suffix: second })), /end of central directory not found|end-of-central|hidden/);
  assert.throws(() => readSingleEntryZip(Buffer.concat([second, buildZip({ data: DATA })])), /end of central|hidden|offset 0|exactly/);
  assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, prefix: Buffer.from("MZ stub") })), /offset 0|does not fit|exactly|malformed/);
  assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, prefix: Buffer.from("MZ stub"), entryBase: 7 })), /offset 0/);
});

// ---------- path traversal and names
test("G4 absolute paths, path traversal, separators and hostile names are rejected", () => {
  const names = ["../plan-approval-receipt.json", "..", "...", "..\\x", "a/b.json", "/etc/passwd", "/plan-approval-receipt.json", "C:\\x.json", "C:x.json", "a\\b.json", "dir/../x.json", "./x.json", ".", "", "x\u0000.json", "x y.json", "x\n.json", "caf\u00e9.json", "%2e%2e", "con:", "a:b", "x*.json", "x".repeat(256)];
  for (const name of names) assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, name })), /entry name|name length|name differs/, JSON.stringify(name));
  assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, name: "caf\u00e9.json", nameEncoding: "utf8" })), /entry name/); // UTF-8 bytes, names are ASCII only
  assert.deepEqual(readSingleEntryZip(buildZip({ data: DATA, name: "a-b_c.1.json" })).data, DATA);
});
test("G4 a name that differs from the expected one is rejected by describeArchive (and the receipt is not parsed)", () => {
  const a = describeArchive({ artifactId: 1, bytes: buildZip({ data: Buffer.from("{}"), name: "other.json" }), entryName: ARTIFACT_NAME });
  assert.equal(a.receipt, null);
  assert.match(a.error, /expected 'plan-approval-receipt.json'/);
});

// ---------- G5: CRC, sizes, limits, bombs
test("G5 CRC: wrong central CRC, tampered data with a consistent descriptor, and tampered stored data are rejected", () => {
  rejects({ crc: zlibCrc32(DATA) ^ 1 }, /CRC-32 mismatch|descriptor/);
  rejects({ crc: 0, descCrc: 0, locCrc: 0 }, /CRC-32 mismatch/);
  rejects({ descCrc: zlibCrc32(DATA) ^ 1 }, /descriptor differs/);
  rejects({ locValues: "real", crc: zlibCrc32(DATA) ^ 1, descriptor: false }, /CRC-32 mismatch/);
  const tampered = Buffer.from(DATA); tampered[3] ^= 0xff;
  rejects({ method: 0, comp: tampered, crc: zlibCrc32(DATA) }, /CRC-32 mismatch/);
  const other = Buffer.from('{"receipt":fals!}');
  rejects({ comp: deflateRawSync(other), uSize: DATA.length, cSize: deflateRawSync(other).length }, /CRC-32 mismatch|size mismatch|larger than/);
});
test("G5 sizes: wrong compressed or uncompressed size (central, local, descriptor) are rejected", () => {
  rejects({ uSize: DATA.length + 1 }, /size mismatch|descriptor|inflate|unexpected|ratio/);
  rejects({ uSize: DATA.length - 1 }, /too large|buffer|size mismatch|inflate/i);
  rejects({ cSize: deflateRawSync(DATA).length + 1 }, /fit exactly|descriptor/);
  rejects({ cSize: deflateRawSync(DATA).length - 1 }, /fit exactly|descriptor|unexpected end/);
  rejects({ descCSize: 3 }, /descriptor differs/);
  rejects({ descUSize: 3 }, /descriptor differs/);
  rejects({ locValues: "real", locUSize: DATA.length + 1 }, /local header crc/);
  rejects({ uSize: 0 }, /empty entry/);
  rejects({ data: Buffer.alloc(0), comp: Buffer.alloc(0) }, /empty entry|ratio/);
});
test("G5 size limit: declared above the limit, archive above the limit, tiny custom limits", () => {
  rejects({ data: Buffer.alloc(2000, 7) }, /too large/, { maxBytes: 100 });
  rejects({ uSize: 5 * 1024 * 1024 }, /too large/);
  const big = randomBytes(1024 * 1024 + 10); // incompressible and above the 1 MiB entry limit
  assert.throws(() => readSingleEntryZip(buildZip({ data: big, method: 0 })), /too large|archive too large/);
  assert.throws(() => readSingleEntryZip(buildZip({ data: randomBytes(2 * 1024 * 1024 + 64), method: 0 })), /archive too large/);
  assert.deepEqual(readSingleEntryZip(buildZip({ data: randomBytes(900 * 1024), method: 0 })).data.length, 900 * 1024); // inside the limits
  assert.deepEqual(readSingleEntryZip(buildZip({ data: DATA }), { maxBytes: DATA.length }).data, DATA);
});
test("G5 zip bomb: a highly compressible entry (ratio above the limit) and a lying uncompressed size are rejected", () => {
  const zeros = Buffer.alloc(1024 * 1024, 0); // 1 MiB of zeros deflates to ~1 KiB
  assert.ok(deflateRawSync(zeros).length * 50 < zeros.length, "fixture is a real bomb");
  rejects({ data: zeros }, /compression ratio/);
  rejects({ data: Buffer.alloc(100 * 1024, 0x41) }, /compression ratio/);
  // the central directory under-declares: the stream would inflate to more than the recorded size
  const real = Buffer.alloc(900 * 1024, 0x41);
  const comp = deflateRawSync(real);
  rejects({ data: real, comp, cSize: comp.length, uSize: 20000 }, /too large|buffer|ratio/i);
  // 1-byte-per-1000 declared but real data is small: size mismatch
  rejects({ data: DATA, uSize: 1000, cSize: deflateRawSync(DATA).length }, /ratio|size mismatch|descriptor/);
  assert.deepEqual(ok({ data: Buffer.from(JSON.stringify({ pad: "x".repeat(800) })) }).data.length, JSON.stringify({ pad: "x".repeat(800) }).length);
});
test("G5 the deflate stream must end exactly at the recorded size (trailing garbage inside the entry) and be complete", () => {
  const comp = deflateRawSync(DATA);
  const padded = Buffer.concat([comp, Buffer.from("TRAIL")]);
  rejects({ comp: padded, cSize: padded.length, descCSize: padded.length }, /does not end at the recorded/);
  const cut = comp.subarray(0, comp.length - 2);
  rejects({ comp: cut, cSize: cut.length, descCSize: cut.length }, /unexpected end|inflate|Z_BUF/i);
  rejects({ comp: Buffer.from("not deflate data at all!"), cSize: 24, descCSize: 24 }, /invalid|inflate|Z_DATA|unexpected/i);
});

// ---------- ZIP64, descriptor, truncation, overlap
test("G5 ZIP64 is not supported: sentinels, locator, extra field, version, 64-bit entry counts", () => {
  rejects({ here: 0xffff, total: 0xffff }, /zip64/);
  rejects({ cdSize: 0xffffffff }, /zip64/);
  rejects({ cdOff: 0xffffffff }, /zip64/);
  rejects({ cSize: 0xffffffff }, /zip64/);
  rejects({ uSize: 0xffffffff }, /zip64/);
  rejects({ locOff: 0xffffffff }, /zip64/);
  rejects({ cenExtra: Buffer.from([0x01, 0x00, 0x00, 0x00]) }, /extra fields/);
  rejects({ locExtra: Buffer.from([0x01, 0x00, 0x00, 0x00]) }, /local extra/);
  rejects({ need: 45, locNeed: 45 }, /version needed/);
  assert.throws(() => readSingleEntryZip(withZip64Locator(buildZip({ data: DATA }))), /zip64/);
});
test("G5 data descriptor: missing, wrong signature, no-signature form, truncated, extra bytes, present without flag, absent with flag", () => {
  rejects({ descriptorSignature: false }, /fit exactly|descriptor signature/);
  rejects({ descriptorSig: 0x08074b51 }, /descriptor signature/);
  rejects({ descriptorSig: 0 }, /descriptor signature/);
  rejects({ writeDescriptor: false }, /fit exactly|descriptor/);
  rejects({ descriptorBytes: Buffer.alloc(8) }, /fit exactly/);
  rejects({ descriptorBytes: Buffer.alloc(24) }, /fit exactly/);
  rejects({ descriptor: false, writeDescriptor: true }, /fit exactly/);
  const sig = Buffer.alloc(16); sig.writeUInt32LE(0x08074b50, 0);
  rejects({ descriptorBytes: sig }, /descriptor differs/);
});
test("G5 truncated archives: every possible truncation point of a valid archive is rejected", () => {
  for (const o of [{}, { method: 0 }, { descriptor: false }]) {
    const zip = buildZip({ data: DATA, ...o });
    assert.doesNotThrow(() => readSingleEntryZip(zip));
    for (let n = 0; n < zip.length; n++) assert.throws(() => readSingleEntryZip(zip.subarray(0, n)), Error, `truncated at ${n}/${zip.length}`);
  }
});
test("G5 single-byte corruption: flipping any byte of a valid archive is either rejected or yields identical data", () => {
  const zip = buildZip({ data: DATA });
  let rejected = 0;
  for (let i = 0; i < zip.length; i++) {
    const m = Buffer.from(zip); m[i] ^= 0x01;
    try {
      const r = readSingleEntryZip(m);
      // fields that carry no meaning in the profile (DOS time/date) may change without changing what is read
      assert.deepEqual(r.data, DATA, `byte ${i}`);
      assert.equal(r.name, ARTIFACT_NAME);
    } catch { rejected++; }
  }
  assert.ok(rejected > zip.length * 0.8, `only ${rejected}/${zip.length} corruptions were detected`);
});
test("G5 overlapping data: entry data over the central directory, entry offset inside the data, two headers over the same data", () => {
  // data claims more bytes than there are before the central directory (overlaps the directory)
  const comp = deflateRawSync(DATA);
  rejects({ cSize: comp.length + 40, descCSize: comp.length + 40 }, /fit exactly|descriptor/);
  // the central directory points into the middle of the entry
  rejects({ locOff: 10 }, /offset 0/);
  rejects({ locOff: 4 }, /offset 0/);
  // central directory placed inside the data region (cdOff too small)
  assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, cdOff: 20 })), /end-of-central|hidden|overlap/);
  assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, cdOff: 0 })), /end-of-central|hidden|overlap/);
  // two directory records over the very same local entry
  const e = { data: DATA };
  assert.throws(() => readSingleEntryZip(buildZip({ entries: [e, { ...e, locOff: 0 }] })), /exactly one entry/);
  // gap of zero padding between the data and the directory
  assert.throws(() => readSingleEntryZip(buildZip({ data: DATA, gap: Buffer.alloc(4) })), /fit exactly/);
});
test("G5 not a zip at all: strings, empty, short, random, text with an EOCD-like signature", () => {
  for (const bad of ["a string", null, undefined, 42, {}, [], new Uint8Array(100)]) assert.throws(() => readSingleEntryZip(bad), /not a zip/);
  assert.throws(() => readSingleEntryZip(Buffer.alloc(0)), /not a zip/);
  assert.throws(() => readSingleEntryZip(Buffer.alloc(3)), /not a zip/);
  assert.throws(() => readSingleEntryZip(Buffer.from("not a zip file at all, definitely, but long enough to pass the length check ok")), /too short|end of central directory/);
  assert.throws(() => readSingleEntryZip(Buffer.from("not a zip file at all, definitely, but long enough to pass the length check ok. ".repeat(3))), /end of central directory/);
  assert.throws(() => readSingleEntryZip(randomBytes(4096)), Error);
  assert.throws(() => readSingleEntryZip(Buffer.alloc(200)), /end of central directory/);
});

// ---------- describeArchive keeps carrying failures instead of throwing
test("describeArchive: digest of the bytes, parsed receipt on success, error text (and no receipt) on every kind of failure", () => {
  const good = buildZip({ data: Buffer.from('{"x":1}'), name: ARTIFACT_NAME });
  const ok1 = describeArchive({ artifactId: 9, bytes: good, entryName: ARTIFACT_NAME });
  assert.equal(ok1.error, null);
  assert.deepEqual(ok1.receipt, { x: 1 });
  assert.equal(ok1.sizeBytes, good.length);
  assert.match(ok1.sha256, /^[0-9a-f]{64}$/);
  for (const data of [Buffer.from("[1]"), Buffer.from("null"), Buffer.from("42"), Buffer.from("not json"), Buffer.from([0xff, 0xfe, 0x7b, 0x7d])]) {
    const r = describeArchive({ artifactId: 9, bytes: buildZip({ data, name: ARTIFACT_NAME }), entryName: ARTIFACT_NAME });
    assert.equal(r.receipt, null);
    assert.ok(r.error);
  }
  assert.match(describeArchive({ artifactId: 1, bytes: "text", entryName: ARTIFACT_NAME }).error, /no bytes/);
  assert.equal(describeArchive({ artifactId: 1, bytes: Buffer.from("garbage garbage garbage"), entryName: ARTIFACT_NAME }).receipt, null);
});

test("fixture sanity: the default archive is bit-for-bit what a real GitHub download looks like", () => {
  const zip = buildZip({ data: DATA });
  const cen = zip.readUInt32LE(zip.length - 22 + 16);
  assert.equal(zip.readUInt16LE(cen + 4), GITHUB_MADE_BY);
  assert.equal(zip.readUInt16LE(cen + 8), 8); // flags: data descriptor
  assert.equal(zip.readUInt32LE(cen + 38), unixAttrs(MODE.REG));
  assert.equal((unixAttrs(MODE.REG) >>> 16).toString(8), "100644");
});
