// 003 RF-2 / AC-6: a provider public-contract change selects its known consumers' features, each once.
import { test } from "node:test";
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { impactSelection } from "./ci-closure.mjs";
import { makeConsumer, git, put, buildPlan, SLUG } from "./acceptance.fixture.mjs";
import { sha256Hex } from "./impact.mjs";

const MANIFEST = {
  schemaVersion: 1,
  modules: [
    { id: "locales", contracts: [{ id: "locales.api", path: "locales/contract.json" }] },
    { id: "regions", contracts: [] },
    { id: "currency", contracts: [] },
  ],
  dependencies: [{ consumer: "regions", provider: "locales", contract: "locales.api" }],
};

function repo() {
  const dir = makeConsumer();
  put(dir, "acceptance/dependency-manifest.json", JSON.stringify(MANIFEST));
  put(dir, "locales/contract.json", '{"v":1}');
  // two consumer-side features of `regions`, one unrelated feature of `currency`
  for (const [slug, moduleId] of [["010-regions-a", "regions"], ["011-regions-b", "regions"], ["012-currency", "currency"]]) {
    put(dir, `specs/${slug}/acceptance/plan.json`, JSON.stringify({ ...buildPlan(), slug, moduleId }));
  }
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base");
  git(dir, "branch", "-f", "main", "HEAD");
  return dir;
}

test("a declared provider contract change selects each affected consumer feature once; unrelated ones are not run", () => {
  const dir = repo();
  try {
    const prev = git(dir, "rev-parse", "HEAD");
    put(dir, "locales/contract.json", '{"v":2}');
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "provider change");
    const cand = git(dir, "rev-parse", "HEAD");
    put(dir, "acceptance/contract-changes.json", JSON.stringify({ changes: [{ providerId: "locales", contractId: "locales.api", previousRef: { commit: prev, path: "locales/contract.json", sha256: sha256Hex('{"v":1}') }, candidateRef: { commit: cand, path: "locales/contract.json", sha256: sha256Hex('{"v":2}') }, compatibility: "incompatible" }] }));
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "declare");
    const r = impactSelection(dir, "main");
    assert.deepEqual(r.blocked, []);
    assert.deepEqual(r.slugs, ["010-regions-a", "011-regions-b"]);
    assert.deepEqual(r.consumers, ["regions"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("an undeclared public contract change is BLOCKED, never silently skipped; no manifest selects nothing", () => {
  const dir = repo();
  try {
    put(dir, "locales/contract.json", '{"v":3}');
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "undeclared provider change");
    const r = impactSelection(dir, "main");
    assert.equal(r.slugs.length, 0);
    assert.match(r.blocked.join(), /without a valid declaration/);
    // deleting the manifest in the candidate never drops the BASE obligation (independent re-review N1)
    rmSync(`${dir}/acceptance/dependency-manifest.json`);
    assert.match(impactSelection(dir, "main").blocked.join(), /BASE graph: public contract changed without a valid declaration/);
    assert.equal(SLUG.length > 0, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("no manifest at BASE nor at the head selects nothing", () => {
  const dir = makeConsumer();
  try {
    git(dir, "branch", "-f", "main", "HEAD");
    put(dir, "locales/contract.json", '{"v":1}');
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "unrelated");
    assert.deepEqual(impactSelection(dir, "main"), { slugs: [], blocked: [] });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("the trusted analyzer keeps BASE obligations when the candidate deletes the manifest or an edge (re-review N1)", async () => {
  const { analyze } = await import("./verdict.mjs");
  for (const edit of ["delete", "edge"]) {
    const dir = repo();
    try {
      const base = git(dir, "rev-parse", "HEAD");
      put(dir, "locales/contract.json", '{"v":5}');
      if (edit === "delete") rmSync(`${dir}/acceptance/dependency-manifest.json`);
      else put(dir, "acceptance/dependency-manifest.json", JSON.stringify({ ...MANIFEST, dependencies: [] }));
      git(dir, "add", "-A");
      git(dir, "commit", "-qm", `undeclared provider change + manifest ${edit}`);
      const v = analyze({ repo: dir, base, head: git(dir, "rev-parse", "HEAD") });
      assert.equal(v.status, "BLOCKED", edit);
      assert.match(v.reasons.join(), /impact \(BASE graph\): public contract changed without a valid declaration/, edit);
      const kind = edit === "delete" ? "MANIFEST_REMOVED" : "DEPENDENCY_REMOVED";
      assert.ok(v.findings.some((f) => f.kind === kind), `${edit}: ${JSON.stringify(v.findings)}`);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
});

test("the trusted analyzer requires a closure for every affected consumer feature (003 RF-2 + 002 RF-31)", async () => {
  const { analyze } = await import("./verdict.mjs");
  const dir = repo();
  try {
    const base = git(dir, "rev-parse", "HEAD");
    put(dir, "locales/contract.json", '{"v":4}');
    git(dir, "add", "-A");
    git(dir, "commit", "-qm", "undeclared provider change");
    const v = analyze({ repo: dir, base, head: git(dir, "rev-parse", "HEAD") });
    assert.equal(v.status, "BLOCKED");
    assert.match(v.reasons.join(), /impact \(BASE graph\): public contract changed without a valid declaration/);
    assert.match(v.reasons.join(), /impact \(head graph\): public contract changed without a valid declaration/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
