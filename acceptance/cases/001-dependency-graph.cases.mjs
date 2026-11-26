// Acceptance cases of spec 001 (dependency graph). Plan: specs/001-dependency-graph/acceptance/plan.json.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateManifest } from "../../runtime/acceptance/manifest.mjs";
import { buildGraph } from "../../runtime/acceptance/graph.mjs";
import { analyzeImpact, gitRefResolver, sha256Hex, validateDeclaration } from "../../runtime/acceptance/impact.mjs";
import { runCases } from "./harness.mjs";

const manifest = () => ({
  schemaVersion: 1,
  modules: [
    { id: "locales", contracts: [{ id: "locales.api", path: "locales/contract.json" }] },
    { id: "regions", contracts: [{ id: "regions.api", path: "regions/contract.json" }] },
    { id: "countries", contracts: [{ id: "countries.api", path: "countries/contract.json" }] },
  ],
  dependencies: [
    { consumer: "regions", provider: "locales", contract: "locales.api" },
    { consumer: "countries", provider: "regions", contract: "regions.api" },
  ],
});

// a real throwaway git repository with two revisions of the provider contract
function withRepo(fn) {
  const dir = mkdtempSync(join(tmpdir(), "acc001-"));
  const git = (...a) => execFileSync("git", a, { cwd: dir, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  try {
    git("init", "-q");
    git("config", "user.email", "t@example.invalid");
    git("config", "user.name", "t");
    mkdirSync(join(dir, "locales"));
    writeFileSync(join(dir, "locales/contract.json"), '{"v":1}');
    git("add", "-A");
    git("commit", "-qm", "c1");
    const c1 = git("rev-parse", "HEAD");
    writeFileSync(join(dir, "locales/contract.json"), '{"v":2}');
    git("commit", "-qam", "c2");
    return fn({ dir, c1, c2: git("rev-parse", "HEAD") });
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
const ref = (commit, content) => ({ commit, path: "locales/contract.json", sha256: sha256Hex(content) });
const declaration = (c1, c2, over = {}) => ({ providerId: "locales", contractId: "locales.api", previousRef: ref(c1, '{"v":1}'), candidateRef: ref(c2, '{"v":2}'), compatibility: "incompatible", ...over });

await runCases([
  // AC-1: valid Locales -> Regions -> Countries resolves; identical input, identical output
  ["G-01", () => {
    const r = buildGraph(manifest());
    assert.equal(r.ok, true);
    assert.deepEqual(r.graph.topologicalOrder, ["locales", "regions", "countries"]);
    assert.deepEqual(r.graph.transitiveConsumers("locales"), ["countries", "regions"]);
    assert.deepEqual(r.graph.transitiveProviders("countries"), ["locales", "regions"]);
  }],
  ["G-02", () => {
    const a = buildGraph(manifest()).graph.serialize();
    const m = manifest();
    m.modules.reverse();
    m.dependencies.reverse();
    assert.equal(buildGraph(m).graph.serialize(), a);
    assert.equal(buildGraph(manifest()).graph.serialize(), a);
  }],
  ["G-03", () => {
    for (const bad of [null, { schemaVersion: 2, modules: [], dependencies: [] }, { ...manifest(), extra: true }]) assert.equal(validateManifest(bad).ok, false);
  }],
  // AC-2: duplicates, unknown references, cycles and contract mismatches fail closed
  ["G-04", () => {
    const m = manifest();
    m.modules.push({ id: "locales", contracts: [] });
    assert.match(validateManifest(m).errors.join("\n"), /duplicate module id: locales/);
  }],
  ["G-05", () => {
    const m = manifest();
    m.dependencies.push({ consumer: "locales", provider: "countries", contract: "countries.api" });
    const r = buildGraph(m);
    assert.equal(r.ok, false);
    assert.match(r.errors.join("\n"), /dependency cycle/);
  }],
  ["G-06", () => {
    const m = manifest();
    m.dependencies[0].contract = "nope";
    assert.match(validateManifest(m).errors.join("\n"), /unknown contract: locales\/nope/);
  }],
  // AC-3: public change declarations resolve impact; undeclared or deceptive ones fail closed
  ["G-07", () => withRepo(({ dir, c1, c2 }) => {
    const { graph } = buildGraph(manifest());
    const r = analyzeImpact({ graph, changedPaths: ["locales/contract.json"], declarations: [declaration(c1, c2)], resolveRef: gitRefResolver(dir) });
    assert.equal(r.status, "OK");
    assert.deepEqual(r.consumers, ["regions"]);
    assert.deepEqual(r.impacts[0].requiredChecks, ["cross-compatibility", "cross-regression"]);
  })],
  ["G-08", () => withRepo(({ dir }) => {
    const { graph } = buildGraph(manifest());
    const r = analyzeImpact({ graph, changedPaths: ["locales/contract.json"], resolveRef: gitRefResolver(dir) });
    assert.equal(r.status, "BLOCKED");
    assert.match(r.errors.join(), /without a valid declaration/);
  })],
  ["G-09", () => withRepo(({ dir, c1, c2 }) => {
    const { graph } = buildGraph(manifest());
    const resolve = gitRefResolver(dir);
    const d = declaration(c1, c2);
    assert.match(validateDeclaration(graph, { ...d, candidateRef: { ...d.candidateRef, sha256: sha256Hex("tampered") } }, resolve).errors.join(), /digest mismatch/);
    assert.match(validateDeclaration(graph, { ...d, candidateRef: { ...d.candidateRef, commit: "main" } }, resolve).errors.join(), /immutable 40-hex/);
    assert.match(validateDeclaration(graph, { ...d, providerId: "forged" }, resolve).errors.join(), /unknown provider owner/);
  })],
  // AC-4: internal-only changes are proven against the declared inventory
  ["G-10", () => {
    const { graph } = buildGraph(manifest());
    const r = analyzeImpact({ graph, changedPaths: ["locales/internal.py", "regions/service.py"], resolveRef: () => ({ ok: true }) });
    assert.equal(r.classification, "internal");
    assert.deepEqual(r.consumers, []);
  }],
  ["G-11", () => {
    const { graph } = buildGraph(manifest());
    const r = analyzeImpact({ graph, changedPaths: ["../outside/contract.json"], resolveRef: () => ({ ok: true }) });
    assert.equal(r.status, "BLOCKED");
    assert.equal(r.classification, "blocked");
  }],
]);
