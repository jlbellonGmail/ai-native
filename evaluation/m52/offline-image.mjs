// Image the Linux offline leg runs in (`docker run --network none`). It is only a network-isolated Node sandbox.
// Docker Hub's anonymous pull limit made `node:24-bookworm` fail the job (`toomanyrequests`, exit 125), so it comes from
// Docker's official mirror of the library images on ECR Public and is pinned by DIGEST (the tag is documentation; a digest
// reference is what the runtime resolves).
//
// The pin is checked WITHOUT any network (offline-image.test.mjs): `offline-image.index.json` is the exact index manifest the
// registry served, its sha256 must equal the digest below (a manifest's digest IS the sha256 of its bytes), and its own
// annotations must say Node <major> on <variant> as the tag claims. Changing tag or digest without refreshing that file fails CI.
// To bump (explicit, needs network, never run by CI):  node evaluation/m52/update-offline-image.mjs <tag>
export const OFFLINE_IMAGE = "public.ecr.aws/docker/library/node:24-bookworm@sha256:3d27e5c11e5786e309ec3e03f93ae536eb36e6e5eb3714d5eb3300a36157add0";
export const OFFLINE_IMAGE_PATTERN = /^public\.ecr\.aws\/docker\/library\/node:(\d+)-([a-z]+)@sha256:([0-9a-f]{64})$/;
