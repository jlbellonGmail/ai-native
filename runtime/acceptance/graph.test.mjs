import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateManifest } from "./manifest.mjs";
import { buildGraph } from "./graph.mjs";
import { analyzeImpact, gitRefResolver, sha256Hex, validateDeclaration } from "./impact.mjs";

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

test("valid Locales -> Regions -> Countries resolves reproducibly", () => {
  const a = buildGraph(manifest());
  assert.equal(a.ok, true);
  assert.deepEqual(a.graph.topologicalOrder, ["locales", "regions", "countries"]);
  assert.deepEqual(a.graph.transitiveConsumers("locales"), ["countries", "regions"]);
  assert.deepEqual(a.graph.transitiveProviders("countries"), ["locales", "regions"]);
  assert.deepEqual(a.graph.directConsumers("locales"), ["regions"]);
  const m2 = manifest();
  m2.modules.reverse();
  m2.dependencies.reverse();
  assert.equal(buildGraph(m2).graph.serialize(), a.graph.serialize());
});

test("duplicates, unknown refs, self dep, schema errors fail closed", () => {
  const dupMod = manifest();
  dupMod.modules.push({ id: "locales", contracts: [] });
  assert.match(validateManifest(dupMod).errors.join("\n"), /duplicate module id: locales/);
  const dupC = manifest();
  dupC.modules[0].contracts.push({ id: "locales.api", path: "locales/other.json" });
  assert.match(validateManifest(dupC).errors.join("\n"), /duplicate contract id/);
  const unk = manifest();
  unk.dependencies.push({ consumer: "regions", provider: "ghost", contract: "x" });
  assert.match(validateManifest(unk).errors.join("\n"), /unknown provider module: ghost/);
  const unkC = manifest();
  unkC.dependencies[0].contract = "nope";
  assert.match(validateManifest(unkC).errors.join("\n"), /unknown contract: locales\/nope/);
  const self = manifest();
  self.dependencies.push({ consumer: "locales", provider: "locales", contract: "locales.api" });
  assert.match(validateManifest(self).errors.join("\n"), /self dependency/);
  const esc = manifest();
  esc.modules[0].contracts[0].path = "../secret";
  assert.equal(validateManifest(esc).ok, false);
  const extra = manifest();
  extra.dependencies[0].guess = true;
  assert.equal(validateManifest(extra).ok, false);
  assert.equal(validateManifest(null).ok, false);
  const ambiguous = manifest();
  ambiguous.modules[1].contracts[0].path = "locales/contract.json";
  assert.match(validateManifest(ambiguous).errors.join("\n"), /ambiguous contract path/);
});

test("cycle is rejected and identified", () => {
  const m = manifest();
  m.dependencies.push({ consumer: "locales", provider: "countries", contract: "countries.api" });
  const r = buildGraph(m);
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /dependency cycle: .*locales.*countries|dependency cycle:/);
});

// --- change declarations against a real throwaway git repo -----------------
function repo() {
  const dir = mkdtempSync(join(tmpdir(), "ai-dg-"));
  const git = (...a) => execFileSync("git", a, { cwd: dir, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
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
  const c2 = git("rev-parse", "HEAD");
  return { dir, c1, c2, git };
}
const ref = (commit, content) => ({ commit, path: "locales/contract.json", sha256: sha256Hex(content) });

test("impact: internal, undeclared public change BLOCKED, valid declaration selects consumers", () => {
  const { dir, c1, c2 } = repo();
  try {
    const { graph } = buildGraph(manifest());
    const resolve = gitRefResolver(dir);
    const internal = analyzeImpact({ graph, changedPaths: ["locales/internal.py"], resolveRef: resolve });
    assert.equal(internal.classification, "internal");
    assert.deepEqual(internal.consumers, []);

    const blocked = analyzeImpact({ graph, changedPaths: ["locales/contract.json"], resolveRef: resolve });
    assert.equal(blocked.status, "BLOCKED");
    assert.match(blocked.errors[0], /without a valid declaration/);

    const decl = (compat) => ({ providerId: "locales", contractId: "locales.api", previousRef: ref(c1, '{"v":1}'), candidateRef: ref(c2, '{"v":2}'), compatibility: compat });
    const ok = analyzeImpact({ graph, changedPaths: ["locales/contract.json"], declarations: [decl("compatible")], resolveRef: resolve });
    assert.equal(ok.status, "OK");
    assert.deepEqual(ok.consumers, ["regions"]);
    assert.deepEqual(ok.impacts[0].requiredChecks, ["cross-regression"]);
    assert.deepEqual(ok.impacts[0].transitiveConsumers, ["countries"]);
    const unknown = analyzeImpact({ graph, changedPaths: ["locales/contract.json"], declarations: [decl("unknown")], resolveRef: resolve });
    const incompat = analyzeImpact({ graph, changedPaths: ["locales/contract.json"], declarations: [decl("incompatible")], resolveRef: resolve });
    assert.deepEqual(unknown.impacts[0].requiredChecks, incompat.impacts[0].requiredChecks);
    // de-duplicated and stable
    const twice = analyzeImpact({ graph, changedPaths: ["locales/contract.json", "locales/contract.json"], declarations: [decl("compatible"), decl("compatible")], resolveRef: resolve });
    assert.deepEqual(twice.consumers, ["regions"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("invalid / deceptive declarations are rejected", () => {
  const { dir, c1, c2 } = repo();
  try {
    const { graph } = buildGraph(manifest());
    const resolve = gitRefResolver(dir);
    const base = { providerId: "locales", contractId: "locales.api", previousRef: ref(c1, '{"v":1}'), candidateRef: ref(c2, '{"v":2}'), compatibility: "compatible" };
    const bad = (patch) => validateDeclaration(graph, { ...base, ...patch }, resolve);
    assert.equal(bad({}).ok, true);
    assert.match(bad({ providerId: "forged" }).errors.join(), /unknown provider owner/);
    assert.match(bad({ contractId: "regions.api" }).errors.join(), /outside the provider's public contract registry/);
    assert.match(bad({ compatibility: "maybe" }).errors.join(), /unrecognized compatibility/);
    assert.match(bad({ candidateRef: base.previousRef }).errors.join(), /identical/);
    assert.match(bad({ candidateRef: { ...base.candidateRef, commit: "main" } }).errors.join(), /immutable 40-hex/);
    assert.match(bad({ candidateRef: { ...base.candidateRef, sha256: undefined } }).errors.join(), /SHA-256/);
    assert.match(bad({ candidateRef: { ...base.candidateRef, sha256: sha256Hex("tampered") } }).errors.join(), /digest mismatch/);
    assert.match(bad({ candidateRef: { ...base.candidateRef, commit: "0".repeat(40) } }).errors.join(), /unavailable/);
    assert.match(bad({ previousRef: { ...base.previousRef, path: "other.json" } }).errors.join(), /path differs/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("diagnostics are bounded and never echo long raw input", () => {
  const m = manifest();
  m.dependencies.push({ consumer: "regions", provider: "x".repeat(60), contract: "locales.api" });
  const r = validateManifest(m);
  assert.ok(r.errors.every((e) => e.length < 200));
});
