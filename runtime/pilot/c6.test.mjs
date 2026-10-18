// C6 / P41: re-reads the REAL cross-repository workflow_call run recorded in evaluation/compat/c6-evidence.json
// from the GitHub API and checks it says what the evidence file claims. Needs github.com and an authenticated gh:
// runs in ci.yml / release.yml / pilot.yml; locally it SKIPs, and with AI_NATIVE_REQUIRE_NETWORK=1 it FAILS instead.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const evidence = JSON.parse(readFileSync(join(root, "evaluation", "compat", "c6-evidence.json"), "utf8"));
const strict = process.env.AI_NATIVE_REQUIRE_NETWORK === "1";

function api(path) {
  let last = "";
  // GitHub answers 5xx now and then: retry with backoff; only a persistent failure is a result
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const r = spawnSync("gh", ["api", path], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
    if (r.status === 0) return JSON.parse(r.stdout);
    last = (r.stderr || r.stdout).trim().split(/\r?\n/).pop();
    if (!/5\d\d|timeout|temporar|No server is currently available/i.test(last)) break;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, attempt * 8000);
  }
  throw new Error(`gh api ${path}: ${last}`);
}

let run = null;
let jobs = null;
let reason = null;
try {
  run = api(`repos/${evidence.caller.repo}/actions/runs/${evidence.caller.runId}`);
  jobs = api(`repos/${evidence.caller.repo}/actions/runs/${evidence.caller.runId}/jobs`).jobs;
} catch (error) {
  reason = error.message;
  if (strict) throw error;
}
const opts = { skip: run ? false : `GitHub API unavailable (${reason}); set AI_NATIVE_REQUIRE_NETWORK=1 to make this a failure` };

test("the evidence file is internally consistent (no network)", () => {
  assert.equal(evidence.id, "C6");
  assert.notEqual(evidence.caller.repo, evidence.callee.repo, "it is a CROSS-repository call");
  assert.match(evidence.callee.pinnedSha, /^[0-9a-f]{40}$/);
  assert.match(evidence.caller.headSha, /^[0-9a-f]{40}$/);
  assert.match(evidence.lockedRelease.digest, /^sha256:[0-9a-f]{64}$/);
  assert.ok(evidence.requiredSuccessfulSteps.some((s) => /attestation/.test(s)), "the attestation step is part of the claim");
});

test("the run exists in the caller repo, was a pull_request, used the recorded workflow and head, and succeeded", opts, () => {
  assert.equal(run.event, evidence.caller.event);
  assert.equal(run.path, evidence.caller.workflowPath);
  assert.equal(run.head_sha, evidence.caller.headSha);
  assert.equal(run.conclusion, evidence.expectedConclusion);
  assert.equal(run.repository.full_name, evidence.caller.repo);
});

test("the job is the REUSABLE workflow of ai-native and every claimed step succeeded (incl. sync with attestation and the L3 gate)", opts, () => {
  const job = jobs.find((j) => /^l3 \/ l3-consumer$/.test(j.name));
  assert.ok(job, `jobs: ${jobs.map((j) => j.name).join(", ")}`);
  assert.equal(job.conclusion, "success");
  const ok = new Set(job.steps.filter((s) => s.conclusion === "success").map((s) => s.name));
  for (const step of evidence.requiredSuccessfulSteps) assert.ok(ok.has(step), `step not successful: ${step}`);
});

test("the callee workflow at the pinned SHA is the file this repo ships, and the pin is on ai-native's history", opts, () => {
  const file = api(`repos/${evidence.callee.repo}/contents/${evidence.callee.workflow}?ref=${evidence.callee.pinnedSha}`);
  assert.equal(file.type, "file");
  const cmp = api(`repos/${evidence.callee.repo}/compare/${evidence.callee.pinnedSha}...main`);
  assert.ok(["ahead", "identical"].includes(cmp.status), `pinned SHA is not an ancestor of main (${cmp.status})`);
});

test("the two repositories are public, so a public consumer can call the reusable workflow (P41, D1)", opts, () => {
  assert.equal(api(`repos/${evidence.caller.repo}`).visibility, "public");
  assert.equal(api(`repos/${evidence.callee.repo}`).visibility, "public");
});
