// MCP gateway (M4.4, AGT-08; PAR-MCP-TRUST, PAR-STEP-UP). Every MCP call
// goes through `gateway.call`; nothing else in the platform reaches a
// server. Order of checks, each fail-closed (default deny):
//   1. the server is listed in the ACTIVE MCP profile (mcp/profiles/<id>.json;
//      `none` lists nothing) and registered in mcp/catalog.json;
//   2. the operation is in that server's declared `permissions` allowlist;
//   3. role x capability policy (runtime/mcp/decision.mjs ->
//      runtime/policy): DENY is terminal, `step-up` needs a grant bound to
//      this exact server+operation+arguments (stepup.mjs);
//   4. only then is the injected transport invoked, with a timeout and
//      ONLY the secret env var the catalog entry names;
//   5. the result is treated as untrusted data (sanitize.mjs) and the
//      call is recorded -- decision, server, operation, scope, args
//      digest, result summary, never secret values -- in a hash-chained
//      JSONL audit (tamper-evident locally; M4.3 is the server-side
//      boundary).
// The transport is injected: this module speaks no wire protocol and
// registers no server. mcp/catalog.json stays empty until a server has a
// real id, allowlist and risk class (plan SS 11); fixtures are used in tests.
import { createHash } from "node:crypto";
import { readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveMcpDecision, loadMcpCatalog } from "../mcp/decision.mjs";
import { sanitizeOutput } from "./sanitize.mjs";
import { argsDigest, createApprovalStore, StepUpError } from "./stepup.mjs";
import { readTextIfExists, readLinesIfExists } from "../lib/fs-safe.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const profilesDir = join(here, "..", "..", "mcp", "profiles");
const ID_RE = /^[a-z][a-z0-9-]*$/;

export function loadMcpProfile(id, dir = profilesDir) {
  if (typeof id !== "string" || !ID_RE.test(id)) throw new Error(`invalid MCP profile id: ${JSON.stringify(id)}`);
  const path = join(dir, `${id}.json`);
  const text = readTextIfExists(path);
  if (text === null) throw new Error(`MCP profile does not exist: ${id}`);
  const profile = JSON.parse(text);
  if (profile.schemaVersion !== 1 || profile.id !== id || !Array.isArray(profile.servers)) {
    throw new Error(`invalid MCP profile: ${id}`);
  }
  return profile;
}

function sha(text) {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

function appendAudit(path, record) {
  if (!path) return;
  mkdirSync(dirname(path), { recursive: true });
  let prevHash = "genesis";
  const lines = readLinesIfExists(path);
  if (lines.length) prevHash = sha(lines[lines.length - 1]);
  appendFileSync(path, `${JSON.stringify({ schemaVersion: 1, timestamp: new Date().toISOString(), prevHash, ...record })}\n`);
}

export function verifyAuditChain(path) {
  const lines = readLinesIfExists(path);
  if (lines.length === 0) return { ok: true, entries: 0 };
  let prev = "genesis";
  for (let i = 0; i < lines.length; i += 1) {
    if (JSON.parse(lines[i]).prevHash !== prev) return { ok: false, entries: lines.length, brokenAt: i };
    prev = sha(lines[i]);
  }
  return { ok: true, entries: lines.length };
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`MCP call timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * @param {object} o
 * @param {string} o.profile   active MCP profile id (default "none")
 * @param {string} o.role      planner|builder|reviewer
 * @param {(req) => Promise<unknown>} o.invoke  transport; receives {server, operation, args, env}
 * @param {(summary) => Promise<boolean>} [o.confirm] interactive human confirmation for step-up
 * @param {string} [o.unitId] Work Unit id recorded in every audit entry (observability correlation)
 */
export function createGateway({
  profile = "none", role, invoke, confirm, catalog = loadMcpCatalog(), profileDir = profilesDir,
  environment = process.env, auditPath = "", timeoutMs = 30_000, approvals = createApprovalStore(), unitId = null,
}) {
  const active = loadMcpProfile(profile, profileDir);

  async function call({ server, operation = "read", args = {}, scope = "", grant = null }) {
    // unitId correlates this record with the Work Unit's events.jsonl (M4.6).
    const base = { ...(unitId ? { unitId } : {}), profile, role, server, operation, scope, argsDigest: argsDigest(args) };
    const refuse = (decision, reason) => {
      appendAudit(auditPath, { ...base, decision, reason });
      return { decision, reason, server };
    };

    if (!active.servers.includes(server)) return refuse("DENY", "server_not_in_profile");
    const entry = catalog.servers[server];
    if (!entry) return refuse("DENY", "server_not_registered");
    if (!Array.isArray(entry.permissions) || !entry.permissions.includes(operation)) {
      return refuse("DENY", "operation_not_allowlisted");
    }

    const secretEnv = entry.requirements?.secretEnv;
    let decision = resolveMcpDecision({ server, scope, role, operation, catalog, environment, approved: false });
    if (decision.decision === "DENY" && decision.reason === "authorization_required") {
      // step-up: need a grant bound to exactly this call.
      let granted = grant;
      if (!granted) {
        try {
          granted = await approvals.request({ server, operation, scope, args, confirm });
        } catch (error) {
          if (error instanceof StepUpError) return refuse("DENY", `step_up_${error.message.replace(/\W+/g, "_").toLowerCase()}`);
          throw error;
        }
      }
      try {
        approvals.consume(granted, { server, operation, scope, args });
      } catch (error) {
        if (error instanceof StepUpError) return refuse("DENY", `step_up_${error.message.replace(/\W+/g, "_").toLowerCase()}`);
        throw error;
      }
      decision = resolveMcpDecision({ server, scope, role, operation, catalog, environment, approved: true });
    }
    if (decision.decision !== "ALLOW") return refuse(decision.decision, decision.reason);

    // Only the one declared secret leaves the gateway, and only to the transport.
    const env = secretEnv ? { [secretEnv]: environment[secretEnv] } : {};
    const secrets = secretEnv ? [environment[secretEnv]] : [];
    let raw;
    try {
      raw = await withTimeout(Promise.resolve(invoke({ server, operation, args, env })), timeoutMs);
    } catch (error) {
      appendAudit(auditPath, { ...base, decision: "ALLOW", reason: "scoped_capability", outcome: "error", error: String(error.message).slice(0, 200) });
      return { decision: "ERROR", reason: "transport_error", server, error: String(error.message).slice(0, 200) };
    }
    const output = sanitizeOutput(raw, { secrets });
    appendAudit(auditPath, {
      ...base, decision: "ALLOW", reason: "scoped_capability", outcome: "ok",
      result: { bytes: Buffer.byteLength(output.content), truncated: output.truncated, injectionSuspected: output.injectionSuspected, findings: output.findings },
    });
    return { decision: "ALLOW", reason: "scoped_capability", server, output };
  }

  return { call, approvals };
}
