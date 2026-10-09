// Image the Linux offline leg runs in (`docker run --network none`). It is only a network-isolated Node sandbox.
// Docker Hub's anonymous pull limit made `node:24-bookworm` fail the job (`toomanyrequests`, exit 125), so it comes from
// Docker's official mirror of the library images on ECR Public and is pinned by DIGEST. The digest is the SAME one Docker
// Hub serves for `node:24-bookworm` (index sha256:3d27e5c1... checked on both registries on 2026-10-09): same content,
// different registry. Bump both the tag and the digest together; offline-image.test.mjs rejects an unpinned reference.
export const OFFLINE_IMAGE = "public.ecr.aws/docker/library/node:24-bookworm@sha256:3d27e5c11e5786e309ec3e03f93ae536eb36e6e5eb3714d5eb3300a36157add0";
export const OFFLINE_IMAGE_PATTERN = /^public\.ecr\.aws\/docker\/library\/node:24-bookworm@sha256:[0-9a-f]{64}$/;
