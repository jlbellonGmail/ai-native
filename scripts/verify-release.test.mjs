import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSums, expectedAssets, sha256, verifyRelease } from "./verify-release.mjs";

test("parseSums reads sha256sum output (text and binary markers, CRLF) and rejects a malformed line", () => {
  const h = "a".repeat(64);
  const g = "b".repeat(64);
  const m = parseSums(`${h}  one.tgz\r\n${g} *two.json\r\n\r\n`);
  assert.equal(m.get("one.tgz"), h);
  assert.equal(m.get("two.json"), g);
  assert.equal(m.size, 2);
  assert.throws(() => parseSums("not a checksum line"), /malformed SHA256SUMS line/);
  assert.throws(() => parseSums(`${"A".repeat(64)}  upper.txt`), /malformed/);
});

test("sha256 is the hex digest and expectedAssets names the release assets", () => {
  assert.equal(sha256(Buffer.from("abc")), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.deepEqual(expectedAssets("v3.0.0-rc.2"), ["ai-native-v3.0.0-rc.2.tar.gz", "ai-native-v3.0.0-rc.2.sbom.cdx.json", "ai-native-v3.0.0-rc.2.sigstore.json", "platform.json", "SHA256SUMS"]);
});

test("a malformed tag is a FAIL before anything is downloaded", () => {
  const r = verifyRelease({ tag: "3.0.0; rm -rf /" });
  assert.equal(r.length, 1);
  assert.equal(r[0].ok, false);
});
