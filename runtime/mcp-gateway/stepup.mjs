// Step-up approval (M4.4, PAR-STEP-UP). core/security-policy.json marks
// EXTERNAL_WRITE / SECRET_ACCESS / DESTRUCTIVE as `step-up` for the
// builder: a human must approve THAT operation, with THOSE arguments.
// An approval is a grant bound to (server, operation, scope, sha256 of
// the canonical arguments), with an expiry, consumable exactly once.
// Changing any argument after approval, replaying it, or presenting it
// late invalidates it.
//
// Where the approval comes from is the trust-critical part: grants are
// only ever created by `requestStepUp`, which asks the injected
// `confirm` callback -- in the CLI an interactive prompt on the real
// terminal, refused when there is no TTY (an agent piping "yes" into
// stdin is not a human at a terminal). Grants live in memory in the
// gateway process: there is deliberately no grant FILE an agent could
// write. Honest limit: if the agent shares the human's terminal
// session/process it can still drive that prompt; the server-side gates
// (M4.3) remain the boundary for repository writes.
import { createHash, randomBytes } from "node:crypto";

export class StepUpError extends Error {}

export function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
}

export function argsDigest(args) {
  return `sha256:${createHash("sha256").update(canonicalJson(args ?? {})).digest("hex")}`;
}

export function createApprovalStore({ now = () => Date.now(), ttlMs = 5 * 60 * 1000 } = {}) {
  const grants = new Map();

  return {
    /**
     * Asks a human (via `confirm`) to approve one concrete call. Returns a
     * grant id, or throws StepUpError when refused/unavailable.
     */
    async request({ server, operation, scope, args, confirm }) {
      if (typeof confirm !== "function") throw new StepUpError("no interactive confirmation channel available");
      const digest = argsDigest(args);
      const summary = { server, operation, scope, argsDigest: digest, args };
      const approved = await confirm(summary);
      if (approved !== true) throw new StepUpError("step-up approval denied");
      const id = randomBytes(16).toString("hex");
      grants.set(id, { server, operation, scope, argsDigest: digest, expiresAt: now() + ttlMs, used: false });
      return id;
    },

    /** Consumes the grant iff it matches this exact call; one use only. */
    consume(id, { server, operation, scope, args }) {
      const grant = grants.get(id);
      if (!grant) throw new StepUpError("unknown step-up grant");
      if (grant.used) throw new StepUpError("step-up grant already used");
      if (now() > grant.expiresAt) {
        grants.delete(id);
        throw new StepUpError("step-up grant expired");
      }
      if (grant.server !== server || grant.operation !== operation || grant.scope !== scope) {
        throw new StepUpError("step-up grant is bound to a different server/operation/scope");
      }
      if (grant.argsDigest !== argsDigest(args)) {
        throw new StepUpError("step-up grant is bound to different arguments");
      }
      grant.used = true;
      return true;
    },
  };
}
