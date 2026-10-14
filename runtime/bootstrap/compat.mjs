// CLI <-> PLATFORM compatibility, decided by the ENGINE of a release (the code the attestation vouched for). The public CLI
// (runtime/cli/ai-native.mjs) enforces the same contract before it hands over; this module is what protects a CLI that cannot be
// patched any more: a v3.2.0 CLI sends no version at all, and is recognized by that.
//   platform.bootstrap = { protocol, minCliVersion, requiredCapabilities }   (contracts/bootstrap-protocol.json, published in platform.json)
//   caller             = { version, protocol, capabilities }                  (what the CLI says about itself; --cli-version/--cli-protocol/--cli-capabilities)
import { cmpVersions } from "./semver.mjs";

/** What a CLI that sends nothing is: the v3.2.0 launcher, the last one that could not say who it is. */
export const LEGACY_CALLER = Object.freeze({ version: "v3.2.0", protocol: 1, capabilities: Object.freeze(["adopt"]), legacy: true });
/** What a release that predates the contract (no `bootstrap` in platform.json) asks of its caller. */
export const DEFAULT_BOOTSTRAP = Object.freeze({ protocol: 1, minCliVersion: "v3.2.0", requiredCapabilities: Object.freeze(["adopt"]) });

const STABLE = /^v\d+\.\d+\.\d+$/;

export function callerFrom({ version = null, protocol = null, capabilities = null } = {}) {
  if (version === null && protocol === null && capabilities === null) return { ...LEGACY_CALLER, capabilities: [...LEGACY_CALLER.capabilities] };
  if (!STABLE.test(version ?? "")) return { error: `invalid --cli-version: ${version}` };
  const p = Number(protocol);
  if (!Number.isInteger(p) || p < 1) return { error: `invalid --cli-protocol: ${protocol}` };
  return { version, protocol: p, capabilities: String(capabilities ?? "").split(",").filter(Boolean), legacy: false };
}

const remedy = (caller) => caller.legacy
  ? "This CLI (v3.2.0 or older) cannot update itself. Update it once by hand: download ai-native-cli.mjs from the latest release, verify it with `gh attestation verify`, and run `node ai-native-cli.mjs install`. After that, `ai-native self-update` keeps it current."
  : "Run `ai-native self-update`.";

/** @returns {{ok: boolean, errors: string[], warnings: string[]}} FAIL CLOSED: an unmet requirement is never a partial run. */
export function negotiate({ platform, caller }) {
  const need = platform.bootstrap ?? DEFAULT_BOOTSTRAP;
  const errors = [];
  const warnings = [];
  const label = caller.legacy ? `${caller.version} (legacy: it identified itself as nothing)` : caller.version;
  if (caller.protocol < need.protocol) errors.push(`INCOMPATIBLE_CLI: ${platform.version} speaks bootstrap protocol ${need.protocol}, this CLI ${label} speaks ${caller.protocol}.`);
  if (cmpVersions(caller.version, need.minCliVersion) < 0) errors.push(`INCOMPATIBLE_CLI: ${platform.version} needs CLI >= ${need.minCliVersion}, this is ${label}.`);
  const missing = need.requiredCapabilities.filter((c) => !caller.capabilities.includes(c));
  if (missing.length) errors.push(`INCOMPATIBLE_CLI: ${platform.version} needs CLI capabilities [${missing.join(", ")}] that this CLI ${label} does not offer.`);
  if (errors.length) errors.push(remedy(caller));
  else if (caller.legacy) warnings.push(`LEGACY_CLI: this CLI cannot update itself or upgrade/detach a repository. ${remedy(caller)}`);
  return { ok: !errors.length, errors, warnings };
}
