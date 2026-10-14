// N-16: one rule for "the CLI declares the tag that publishes it", shared by the release build, verify-release and these tests, and kept equal to
// what release.yml starts on and to what the standalone CLI parses. The end-to-end build for every tag is in release.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DECLARATION, TAG, assertCliDeclaresTag, declaredCliVersion, hasCliLifecycle, isPrerelease, isTag } from "./cli-version.mjs";
import { cmpAny, isAnyVersion } from "../bootstrap/semver.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const decl = (v) => `// header\nexport const CLI_VERSION = "${v}"; // note\n`;
const VALID = ["v3.3.0", "v3.3.1", "v3.3.1-rc.1", "v3.3.1-alpha.1", "v10.0.0", "v3.10.2-rc.12"];
const INVALID = ["v3.3", "3.3.1", "V3.3.1", "v3.3.1-beta.1", "v3.3.1-rc", "v3.3.1-rc.", "v3.3.1-rc.x", "v3.3.1+build.5", " v3.3.1", "v3.3.1 ", "v3.3.1-rc.1-x", "", "latest"];

test("every tag release.yml accepts is a valid CLI declaration, and a declaration must equal the tag exactly", () => {
  for (const tag of VALID) {
    assert.equal(isTag(tag), true, tag);
    assert.equal(declaredCliVersion(decl(tag)), tag);
    assert.doesNotThrow(() => assertCliDeclaresTag(decl(tag), tag), tag);
  }
  for (const [declares, tag] of [["v3.3.1", "v3.3.1-rc.1"], ["v3.3.1-rc.1", "v3.3.1"], ["v3.3.1-rc.1", "v3.3.1-rc.2"], ["v3.3.1-alpha.1", "v3.3.1-rc.1"], ["v3.3.0", "v3.3.1"]]) {
    assert.throws(() => assertCliDeclaresTag(decl(declares), tag), new RegExp(`declares CLI_VERSION ${declares.replaceAll(".", "\\.")}; this release is ${tag.replaceAll(".", "\\.")}`), `${declares} -> ${tag}`);
  }
});

test("anything that is not a tag release.yml accepts is rejected, as a tag and as a declaration", () => {
  for (const bad of INVALID) {
    assert.equal(isTag(bad), false, JSON.stringify(bad));
    assert.equal(declaredCliVersion(decl(bad)), null, JSON.stringify(bad));
    assert.throws(() => assertCliDeclaresTag(decl("v3.3.1"), bad), /not a release tag/, JSON.stringify(bad));
    assert.throws(() => hasCliLifecycle(bad), /not a release tag/);
    assert.equal(isAnyVersion(bad), false, JSON.stringify(bad));
  }
  // a declaration that is only a comment, or missing, is not a declaration; the first real one counts
  assert.equal(declaredCliVersion('// export const CLI_VERSION = "v3.3.1";\n'), null);
  assert.equal(declaredCliVersion("export const OTHER = 1;"), null);
  assert.throws(() => assertCliDeclaresTag("", "v3.3.1"), /declares CLI_VERSION \(nothing valid\)/);
  assert.equal(declaredCliVersion(`// export const CLI_VERSION = "v9.9.9";\n${decl("v3.3.1")}`), "v3.3.1", "a commented-out line cannot spoof the declaration");
});

test("the lifecycle starts at v3.3.0 and so do all of its prereleases; earlier releases are not held to it", () => {
  for (const tag of ["v3.3.0", "v3.3.0-rc.1", "v3.3.0-alpha.1", "v3.3.1", "v3.4.0-rc.2", "v4.0.0"]) assert.equal(hasCliLifecycle(tag), true, tag);
  for (const tag of ["v3.2.1", "v3.2.9", "v3.2.0-rc.1", "v3.0.0", "v2.9.9"]) {
    assert.equal(hasCliLifecycle(tag), false, tag);
    assert.doesNotThrow(() => assertCliDeclaresTag("export const CLI_VERSION = \"v0.0.1\";", tag), tag);
  }
  assert.deepEqual(["v3.3.1", "v3.3.1-rc.1", "v3.3.1-alpha.1"].map(isPrerelease), [false, true, true]);
});

test("workflow, build and CLI cannot disagree about which versions exist: release.yml's tag patterns, TAG, and the CLI's own marker accept the same set", () => {
  const workflow = readFileSync(join(root, ".github", "workflows", "release.yml"), "utf8").replace(/\r\n/g, "\n");
  const patterns = [...workflow.matchAll(/^\s+- "(v\[0-9\][^"]*)"$/gm)].map((m) => m[1]);
  assert.equal(patterns.length, 3, "release.yml starts on a stable tag, -alpha.N and -rc.N");
  const accepted = (tag) => patterns.some((pattern) => new RegExp(`^${pattern.replaceAll(".", "\\.")}$`).test(tag));
  for (const tag of [...VALID, ...INVALID]) assert.equal(accepted(tag), TAG.test(tag), `release.yml vs TAG for ${JSON.stringify(tag)}`);
  // the standalone CLI keeps its own copy of the declaration rule; it must be the same rule
  const cli = readFileSync(join(root, "runtime", "cli", "ai-native.mjs"), "utf8");
  const marker = /^const MARKER = \/(.+)\/m;/m.exec(cli);
  assert.ok(marker, "the CLI declares its MARKER");
  assert.equal(new RegExp(marker[1], "m").source, DECLARATION.source);
  // and the engine orders and validates versions with the same alphabet
  for (const tag of [...VALID, ...INVALID]) assert.equal(isAnyVersion(tag), TAG.test(tag), JSON.stringify(tag));
  assert.ok(cmpAny("v3.3.1-alpha.1", "v3.3.1-rc.1") < 0 && cmpAny("v3.3.1-rc.1", "v3.3.1") < 0 && cmpAny("v3.3.1", "v3.3.2-alpha.1") < 0);
});
