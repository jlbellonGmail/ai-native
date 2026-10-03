// DoD metrics (plan SS27 / P20). The committed results come from evaluation/metrics/measure.mjs (a real run against
// template-starter v2.0.4). This test does not re-measure timings (machine dependent); it re-computes every
// DETERMINISTIC metric from the repo and checks the recorded results are honest about what was and was not met.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const results = JSON.parse(readFileSync(join(root, "evaluation/metrics/results.json"), "utf8"));
const m = results.metrics;

test("every metric of SS27 is recorded with value, target, method and an explicit met flag", () => {
  for (const id of ["managedFilesPerConsumer", "bytesCopiedPerConsumer", "bootstrapTimeWithCache", "bootstrapTimeWithoutCache", "networkCallsPerSessionWithCache", "filesChangedByBump", "contextAtReentryTokens", "capabilitiesCentralized", "validationTimeLightVsFull", "hitlPerUnit", "circuitsPerMilestone"]) {
    assert.ok(m[id], id);
    assert.ok("value" in m[id] && m[id].target && m[id].method && typeof m[id].met === "boolean", id);
  }
  assert.equal(results.summary.total, Object.keys(m).length);
  assert.equal(results.summary.met, Object.values(m).filter((x) => x.met).length);
});

test("the baseline is the real v2 consumer: template-starter v2.0.4, pinned", () => {
  assert.equal(results.baseline.commit, "9e7dfb5b82ca69a0dd878c719f5861816652780b");
  assert.equal(results.baseline.trackedFiles, 175);
  assert.ok(results.baseline.trackedBytes > 100_000);
});

test("deterministic metrics recompute from the repo and match the recorded values", () => {
  const caps = JSON.parse(readFileSync(join(root, "parity/v2.0.5/capabilities.json"), "utf8")).capabilities;
  const local = caps.filter((c) => c.classification === "LOCAL_BY_DESIGN").length;
  assert.equal(m.capabilitiesCentralized.value, Number((1 - local / caps.length).toFixed(4)));
  assert.ok(m.capabilitiesCentralized.value >= 0.9);
  const kernel = readFileSync(join(root, "core/kernel.md"), "utf8");
  const skills = readdirSync(join(root, ".agents/skills"), { withFileTypes: true }).filter((e) => e.isDirectory());
  const fm = skills.map((d) => /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(root, ".agents/skills", d.name, "SKILL.md"), "utf8").replace(/\r\n/g, "\n"))?.[1] ?? "").join("\n");
  // skills may have been added since the run: the recorded value must never be ABOVE what the repo gives today by more than the new skills add
  assert.equal(m.contextAtReentryTokens.value, Math.ceil((kernel.length + fm.length) / 4), "the recorded context figure is what the repo gives");
  assert.equal(m.contextAtReentryTokens.skills, skills.length, "no skill was added or removed since the measurement: re-run measure.mjs if this fails");
  assert.equal(m.filesChangedByBump.value, 2);
  assert.deepEqual(m.filesChangedByBump.files.sort(), [".github/workflows/ai-native.yml", "ai-native.lock.json"]);
  assert.equal(m.networkCallsPerSessionWithCache.value, 0);
});

test("the metric that is NOT a measurement is labelled PROXY_ONLY and reported as not met; nothing is tuned to pass", () => {
  assert.equal(m.validationTimeLightVsFull.status, "PROXY_ONLY");
  assert.equal(m.validationTimeLightVsFull.met, false);
  assert.deepEqual(results.summary.notMet, ["validationTimeLightVsFull"]);
  assert.deepEqual(results.summary.proxyOnly, ["validationTimeLightVsFull"]);
  assert.match(m.validationTimeLightVsFull.method, /NOT a time measurement/);
});

test("the figures that depend on a definition disclose the other reading instead of hiding it", () => {
  assert.ok(m.managedFilesPerConsumer.disclosure.totalGeneratedWithDerived > 12, "with derived adapter files the count is above target, and the record says so");
  assert.ok(m.bytesCopiedPerConsumer.reduction >= 0.9 && m.bytesCopiedPerConsumer.disclosure.withDerivedReduction >= 0.9);
  assert.match(m.contextAtReentryTokens.method, /NOT a tokenizer count/);
  assert.match(m.bootstrapTimeWithoutCache.disclosure.note, /excludes the network download/);
});

test("timings are sane (loose bounds only; they are machine dependent)", () => {
  assert.ok(m.bootstrapTimeWithCache.value > 0 && m.bootstrapTimeWithCache.value < 30000);
  assert.ok(m.bootstrapTimeWithoutCache.value > 0 && m.bootstrapTimeWithoutCache.value < 30000);
  assert.equal(m.bootstrapTimeWithCache.samples.length, 9);
});

test("hitlPerUnit and circuitsPerMilestone are DERIVED from the real policy/state machine and a real startWorkUnit, not asserted", () => {
  const policy = JSON.parse(readFileSync(join(root, "core/security-policy.json"), "utf8"));
  const mergers = Object.entries(policy.matrix).filter(([, caps]) => caps.MERGE === "allow").map(([role]) => role);
  assert.deepEqual(m.hitlPerUnit.detail.rolesWithMergeAllow, mergers);
  assert.deepEqual(mergers, ["human"]);
  const sm = JSON.parse(readFileSync(join(root, "contracts/state-machine.json"), "utf8"));
  assert.equal(m.hitlPerUnit.detail.transitionsIntoMerged.length, sm.transitions.filter((x) => x.to === "MERGED").length);
  assert.equal(m.hitlPerUnit.met, true);
  assert.deepEqual(m.circuitsPerMilestone.detail, { branches: 1, runDirs: 1, items: 3 });
  assert.match(m.circuitsPerMilestone.method, /executed for real/);
});

test("the measurement refuses failing commands: the script throws on a non-zero exit and records the network count as a lower bound", () => {
  const src = readFileSync(join(root, "evaluation/metrics/measure.mjs"), "utf8");
  assert.match(src, /measured command failed \(exit/);
  assert.match(src, /network-count run failed \(exit/);
  assert.match(m.networkCallsPerSessionWithCache.disclosure.limit, /LOWER BOUND/);
  assert.match(m.networkCallsPerSessionWithCache.method, /every run must exit 0/);
});
