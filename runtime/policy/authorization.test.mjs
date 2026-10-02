import { test } from "node:test";
import assert from "node:assert/strict";
import { assertScopedAuthorization, AuthorizationError } from "./authorization.mjs";

const VALID_MERGE_DOC = "decision: MERGE\nscope: 16-seguridad-profesional\naction: MERGE\nbranch: feature/v2.0.0-16-seguridad-profesional\nbase: develop\n";

test("accepts a document whose decision/scope/action/branch/base all match what the caller expects", () => {
  assert.equal(
    assertScopedAuthorization(VALID_MERGE_DOC, {
      expectedDecision: "MERGE",
      expectedScope: "16-seguridad-profesional",
      expectedAction: "MERGE",
      expectedBranch: "feature/v2.0.0-16-seguridad-profesional",
      expectedBase: "develop",
    }),
    true,
  );
});

test("rejects a document scoped to a different unit, even with a valid decision token", () => {
  const doc = "decision: MERGE\nscope: other-unit\naction: MERGE\nbranch: feature/other\nbase: develop\n";
  assert.throws(
    () => assertScopedAuthorization(doc, { expectedDecision: "MERGE", expectedScope: "16-seguridad-profesional", expectedAction: "MERGE" }),
    AuthorizationError,
  );
});

test("B14 fix: a caller can require 'ALLOW' instead of the legacy hardcoded 'decision: MERGE' for a non-merge, MCP-style grant", () => {
  const doc = "decision: ALLOW\nscope: 15-mcp-herramientas\naction: write\n";
  assert.equal(assertScopedAuthorization(doc, { expectedDecision: "ALLOW", expectedScope: "15-mcp-herramientas", expectedAction: "write" }), true);
});

test("B14 fix: a document that only says 'decision: MERGE' does NOT satisfy a caller that requires 'ALLOW'", () => {
  const doc = "decision: MERGE\nscope: 15-mcp-herramientas\naction: write\n";
  assert.throws(() => assertScopedAuthorization(doc, { expectedDecision: "ALLOW", expectedScope: "15-mcp-herramientas", expectedAction: "write" }), AuthorizationError);
});

test("rejects a document carrying a secret-like key, even when every other field matches", () => {
  const doc = `${VALID_MERGE_DOC}token: abc123\n`;
  assert.throws(
    () => assertScopedAuthorization(doc, { expectedDecision: "MERGE", expectedScope: "16-seguridad-profesional", expectedAction: "MERGE", expectedBranch: "feature/v2.0.0-16-seguridad-profesional", expectedBase: "develop" }),
    /secrets/,
  );
});

test("requires expectedDecision and expectedScope to be supplied explicitly (no implicit default)", () => {
  assert.throws(() => assertScopedAuthorization(VALID_MERGE_DOC, { expectedScope: "x" }), /expectedDecision/);
  assert.throws(() => assertScopedAuthorization(VALID_MERGE_DOC, { expectedDecision: "MERGE" }), /expectedScope/);
});
