import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { OFFLINE_IMAGE, OFFLINE_IMAGE_PATTERN } from "./offline-image.mjs";

const bytes = readFileSync(new URL("./offline-image.index.json", import.meta.url));
const [, major, variant, digest] = OFFLINE_IMAGE_PATTERN.exec(OFFLINE_IMAGE) ?? [];

test("the offline leg image is Node <major> / <variant> from the ECR Public mirror, pinned by digest", () => {
  assert.match(OFFLINE_IMAGE, OFFLINE_IMAGE_PATTERN);
  assert.equal(major, "24", "same Node major as the platform (engines / CI)");
  assert.equal(variant, "bookworm", "Debian bookworm family, as before");
});

test("tag/digest consistency, offline: the stored index hashes to the pinned digest (a manifest digest IS the sha256 of its bytes)", () => {
  assert.equal(createHash("sha256").update(bytes).digest("hex"), digest, "offline-image.index.json is not the manifest the digest names: refresh it with update-offline-image.mjs");
});

test("the pinned index really is Node <major> on <variant> for the platforms the runners use", () => {
  const index = JSON.parse(bytes.toString("utf8"));
  assert.equal(index.mediaType, "application/vnd.oci.image.index.v1+json");
  for (const arch of ["amd64", "arm64"]) {
    const m = index.manifests.find((x) => x.platform?.os === "linux" && x.platform?.architecture === arch);
    assert.ok(m, `linux/${arch} is in the index`);
    assert.match(m.digest, /^sha256:[0-9a-f]{64}$/);
    const a = m.annotations ?? {};
    assert.equal(a["org.opencontainers.image.version"], major, `linux/${arch}: Node major`);
    assert.match(a["org.opencontainers.image.base.name"] ?? "", new RegExp(`:${variant}$`), `linux/${arch}: base image is ${variant}`);
    assert.ok((a["org.opencontainers.image.source"] ?? "").endsWith(`:${major}/${variant}`), `linux/${arch}: built from docker-node ${major}/${variant}`);
    assert.match(a["org.opencontainers.image.source"], /^https:\/\/github\.com\/nodejs\/docker-node\.git#/, "official docker-node sources");
  }
});

test("offline-real.mjs takes its default image from offline-image.mjs and has no unpinned or Docker Hub literal", () => {
  const src = readFileSync(new URL("./offline-real.mjs", import.meta.url), "utf8");
  assert.match(src, /import \{ OFFLINE_IMAGE \} from "\.\/offline-image\.mjs"/);
  assert.match(src, /value\("--image"\) \?\? OFFLINE_IMAGE/);
  assert.doesNotMatch(src, /"node:24-bookworm"/);
});

test("the updater verifies digest == sha256(body) against the registry and never writes network data to disk (js/http-to-file-access)", () => {
  const src = readFileSync(new URL("./update-offline-image.mjs", import.meta.url), "utf8");
  assert.match(src, /docker-content-digest/i);
  assert.match(src, /createHash\("sha256"\)/);
  assert.doesNotMatch(src, /writeFile|appendFile|createWriteStream|copyFile/, "no file writes: stdout only");
});
