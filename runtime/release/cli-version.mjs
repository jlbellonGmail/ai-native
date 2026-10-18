// The public CLI declares the tag that publishes it:  export const CLI_VERSION = "vX.Y.Z[-alpha.N|-rc.N]";  (runtime/cli/ai-native.mjs)
// One definition of that rule for the release build, `verify-release` and their tests. It accepts exactly the tags release.yml accepts
// (stable, -alpha.N, -rc.N), so the workflow, the build and the CLI cannot disagree about which versions exist. The CLI itself is a standalone
// file and keeps its own copy of DECLARATION; a test keeps the two equal.
export const TAG = /^v(\d+)\.(\d+)\.(\d+)(?:-(alpha|rc)\.(\d+))?$/;
export const DECLARATION = /^export const CLI_VERSION = "(v\d+\.\d+\.\d+(?:-(?:alpha|rc)\.\d+)?)";/m;

export const isTag = (tag) => TAG.test(tag ?? "");
export const isPrerelease = (tag) => isTag(tag) && /-/.test(tag);

/** The version a CLI source declares, or null (not declared, or not a valid tag). */
export const declaredCliVersion = (text) => DECLARATION.exec(text)?.[1] ?? null;

/** The CLI lifecycle (version, self-update, CLI revocations, the CLI <-> PLATFORM contract) exists from v3.3.0, and so does every prerelease of it. */
export function hasCliLifecycle(tag) {
  const m = TAG.exec(tag ?? "");
  if (!m) throw new Error(`not a release tag: ${tag}`);
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a > 3 || (a === 3 && b >= 3);
}

/** Throws unless `text` (the CLI source of the commit being released) declares exactly `tag`. Releases before the lifecycle are not held to it. */
export function assertCliDeclaresTag(text, tag) {
  if (!isTag(tag)) throw new Error(`not a release tag: ${tag}`);
  if (!hasCliLifecycle(tag)) return;
  const declared = declaredCliVersion(text);
  if (declared !== tag) throw new Error(`runtime/cli/ai-native.mjs declares CLI_VERSION ${declared ?? "(nothing valid)"}; this release is ${tag}. Set CLI_VERSION to the tag in the commit being released`);
}
