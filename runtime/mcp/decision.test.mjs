import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateMcpCatalog, resolveMcpDecision } from "./decision.mjs";

function catalogWith(servers) {
  return validateMcpCatalog({ schemaVersion: 1, servers });
}

const READ_ONLY_DOCS = {
  type: "remote",
  capability: "docs",
  mode: "read-only",
  risk: "low",
  permissions: ["NETWORK_READ"],
  optional: true,
  load: "on-demand",
};

const WRITE_SERVER = {
  type: "remote",
  capability: "remote-write",
  mode: "write",
  risk: "high",
  permissions: ["EXTERNAL_WRITE", "SECRET_ACCESS"],
  requirements: { secretEnv: "MCP_TOKEN" },
  optional: false,
  load: "on-demand",
};

test("a server not present in the catalog falls back rather than erroring", () => {
  const catalog = catalogWith({});
  const result = resolveMcpDecision({ server: "docs", scope: "u1", role: "builder", catalog });
  assert.equal(result.decision, "FALLBACK");
  assert.equal(result.reason, "capability_not_configured");
});

test("NETWORK_READ (read-only server) is ALLOW for every role that has NETWORK_READ=allow", () => {
  const catalog = catalogWith({ docs: READ_ONLY_DOCS });
  for (const role of ["planner", "builder", "reviewer", "orchestrator"]) {
    const result = resolveMcpDecision({ server: "docs", scope: "u1", role, operation: "read", catalog });
    assert.equal(result.decision, "ALLOW", `role ${role}`);
  }
});

test("requesting 'read' against a write-mode server is DENY (operation_mismatch), not a crash", () => {
  const catalog = catalogWith({ writer: { ...WRITE_SERVER, requirements: undefined } });
  const result = resolveMcpDecision({ server: "writer", scope: "u1", role: "human", operation: "read", catalog, environment: {} });
  assert.equal(result.decision, "DENY");
  assert.equal(result.reason, "operation_mismatch");
});

test("builder EXTERNAL_WRITE without an authorization path is DENY (authorization_required), credential value never leaked", () => {
  const catalog = catalogWith({ writer: WRITE_SERVER });
  const result = resolveMcpDecision({ server: "writer", scope: "15-mcp-herramientas", role: "builder", operation: "write", catalog, environment: {} });
  assert.equal(result.decision, "DENY");
  assert.equal(result.reason, "authorization_required");
  assert.ok(!JSON.stringify(result).includes("MCP_TOKEN"));
});

test("reviewer EXTERNAL_WRITE is a straight DENY (matrix says deny, not step-up): no authorization can override it (bug 1 regression)", () => {
  const dir = mkdtempSync(join(tmpdir(), "mcp-decision-test-"));
  const authPath = join(dir, "authorization.md");
  writeFileSync(authPath, "decision: ALLOW\nscope: 15-mcp-herramientas\naction: write\n", "utf8");
  const catalog = catalogWith({ writer: WRITE_SERVER });
  const result = resolveMcpDecision({ server: "writer", scope: "15-mcp-herramientas", role: "reviewer", operation: "write", catalog, authorizationPath: authPath, environment: { MCP_TOKEN: "x" } });
  assert.equal(result.decision, "DENY");
  assert.equal(result.reason, "not_declared_by_profile");
});

test("builder EXTERNAL_WRITE with a valid 'decision: ALLOW' scoped authorization proceeds to ALLOW (bug 2 fix: no 'decision: MERGE' required)", () => {
  const dir = mkdtempSync(join(tmpdir(), "mcp-decision-test-"));
  const authPath = join(dir, "authorization.md");
  writeFileSync(authPath, "decision: ALLOW\nscope: 15-mcp-herramientas\naction: write\n", "utf8");
  const catalog = catalogWith({ writer: WRITE_SERVER });
  const result = resolveMcpDecision({ server: "writer", scope: "15-mcp-herramientas", role: "builder", operation: "write", catalog, authorizationPath: authPath, environment: { MCP_TOKEN: "x" } });
  assert.equal(result.decision, "ALLOW");
});

test("builder EXTERNAL_WRITE with a legacy-style 'decision: MERGE' authorization is rejected (bug 2 regression)", () => {
  const dir = mkdtempSync(join(tmpdir(), "mcp-decision-test-"));
  const authPath = join(dir, "authorization.md");
  writeFileSync(authPath, "decision: MERGE\nscope: 15-mcp-herramientas\naction: write\n", "utf8");
  const catalog = catalogWith({ writer: WRITE_SERVER });
  assert.throws(
    () => resolveMcpDecision({ server: "writer", scope: "15-mcp-herramientas", role: "builder", operation: "write", catalog, authorizationPath: authPath, environment: { MCP_TOKEN: "x" } }),
    /invalid authorization/,
  );
});

test("required secret missing on an optional server is FALLBACK; on a required server it is BLOCKED (actionable, not a crash)", () => {
  const optionalCatalog = catalogWith({ writer: { ...WRITE_SERVER, optional: true } });
  const dir = mkdtempSync(join(tmpdir(), "mcp-decision-test-"));
  const authPath = join(dir, "authorization.md");
  writeFileSync(authPath, "decision: ALLOW\nscope: s\naction: write\n", "utf8");
  const fallback = resolveMcpDecision({ server: "writer", scope: "s", role: "builder", operation: "write", catalog: optionalCatalog, authorizationPath: authPath, environment: {} });
  assert.equal(fallback.decision, "FALLBACK");
  assert.equal(fallback.reason, "secret_missing");

  const requiredCatalog = catalogWith({ writer: WRITE_SERVER });
  const blocked = resolveMcpDecision({ server: "writer", scope: "s", role: "builder", operation: "write", catalog: requiredCatalog, authorizationPath: authPath, environment: {} });
  assert.equal(blocked.decision, "BLOCKED");
  assert.equal(blocked.reason, "secret_missing");
});

test("validateMcpCatalog rejects an invalid catalog with an actionable message naming the field", () => {
  assert.throws(() => validateMcpCatalog({ schemaVersion: 1, servers: { bad: { mode: "read-only" } } }), /missing "type"/);
  assert.throws(() => validateMcpCatalog({ schemaVersion: 1, servers: { bad: { ...READ_ONLY_DOCS, load: "always" } } }), /load=on-demand/);
  assert.throws(() => validateMcpCatalog({ schemaVersion: 1, servers: { bad: { ...READ_ONLY_DOCS, mode: "execute" } } }), /unsupported mode/);
});

test("the real mcp/catalog.json loads and validates (currently empty: no servers registered yet, PAR-MCP-TRUST is M4.4)", async () => {
  const { loadMcpCatalog } = await import("./decision.mjs");
  const catalog = loadMcpCatalog();
  assert.equal(catalog.schemaVersion, 1);
  assert.deepEqual(catalog.servers, {});
});
