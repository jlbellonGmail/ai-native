import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { OFFLINE_IMAGE, OFFLINE_IMAGE_PATTERN } from "./offline-image.mjs";

test("the offline leg image is Node 24 / bookworm, from the ECR Public mirror, pinned by digest", () => {
  assert.match(OFFLINE_IMAGE, OFFLINE_IMAGE_PATTERN);
});

test("offline-real.mjs takes its default image from offline-image.mjs and has no unpinned or Docker Hub literal", () => {
  const src = readFileSync(new URL("./offline-real.mjs", import.meta.url), "utf8");
  assert.match(src, /import \{ OFFLINE_IMAGE \} from "\.\/offline-image\.mjs"/);
  assert.match(src, /value\("--image"\) \?\? OFFLINE_IMAGE/);
  assert.doesNotMatch(src, /"node:24-bookworm"/);
});
