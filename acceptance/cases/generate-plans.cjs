// Generator of the factory's own acceptance data for specs 001-003 (contract and plans). Run from the repository root:
//   node acceptance/cases/generate-plans.cjs .   (then review the diff; the generated JSON is what is committed)
const fs = require("fs");
const path = require("path");
const root = process.argv[2];
const put = (p, obj) => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), `${JSON.stringify(obj, null, 2)}\n`); };

const ENV = ["PATH", "PATHEXT", "SystemRoot", "ComSpec", "TEMP", "TMP", "TMPDIR", "HOME", "USERPROFILE"];
const runner = (id, file) => ({ id, executable: "node", argv: [file], cwd: ".", format: "tap13", timeoutMs: 900000, isolation: "restricted", env: ENV, configFiles: ["package.json"] });
put("acceptance/validation-contract.json", {
  schemaVersion: 1,
  minObservedCases: 1,
  runners: [
    runner("spec-001", "acceptance/cases/001-dependency-graph.cases.mjs"),
    runner("spec-002", "acceptance/cases/002-native-acceptance.cases.mjs"),
    runner("spec-003", "acceptance/cases/003-acceptance-integration.cases.mjs"),
  ],
  nonSutPaths: ["specs/**/*.md", "governance/execution/**", "governance/security/**", "governance/versioning/*.md", "knowledge/docs/**", "docs/**", "README.md"],
});

// every case imports the platform, so its inputs are the platform tree (conservative: any change makes it STALE)
const PLATFORM = ["runtime/", "contracts/", "core/commands/", ".github/workflows/", "governance/gates/", "evaluation/", "knowledge/sdd/templates/", "profiles/", "acceptance/cases/", "AGENTS.md"];
const SPECS = ["001-dependency-graph", "002-native-acceptance", "003-acceptance-integration"];
const others = (slug) => SPECS.filter((s) => s !== slug).map((s) => `specs/${s}/acceptance/plan.json`);

const CATS = ["positive", "negative", "boundary", "integration", "contract", "persistence", "cross-cutting"];
function plan(slug, runnerId, criteria, cases) {
  return {
    schemaVersion: 1,
    slug,
    criteria,
    matrix: Object.fromEntries(CATS.map((c) => [c, { status: "APPLICABLE" }])),
    datasets: [],
    cases: cases.map(([id, ac, category, expected, why]) => ({
      id, ac: [ac], category, runner: runnerId, sutPaths: [...PLATFORM, ...others(slug)], expected, mandatory: true, minTier: "restricted",
      why,
      realSystemUse: "exercised by the factory and by every adopted consumer through the same platform modules",
      intentionalErrors: expected === "reject" ? "the input is invalid or tampered on purpose" : "none",
      limitations: "disposable fixtures (temporary directories and git repositories); no network, no external service",
      restore: "each case removes its temporary directories",
      executionKind: "simulated",
    })),
  };
}

put("specs/001-dependency-graph/acceptance/plan.json", plan("001-dependency-graph", "spec-001",
  [{ id: "AC-1", requirements: ["RF-1", "RF-4", "RF-6"] }, { id: "AC-2", requirements: ["RF-2", "RF-3"] }, { id: "AC-3", requirements: ["RF-5", "RF-7", "RF-8", "RF-10", "RF-11"] }, { id: "AC-4", requirements: ["RF-9"] }],
  [
    ["G-01", "AC-1", "positive", "pass", "the Locales -> Regions -> Countries sample resolves with the expected order and closures"],
    ["G-02", "AC-1", "persistence", "pass", "equivalent input serializes to identical bytes (reproducible output)"],
    ["G-03", "AC-1", "boundary", "reject", "absent, future-schema or over-specified manifests are rejected"],
    ["G-04", "AC-2", "negative", "reject", "duplicate module ids are rejected"],
    ["G-05", "AC-2", "negative", "reject", "a dependency cycle is rejected and identified"],
    ["G-06", "AC-2", "contract", "reject", "a dependency on a contract the provider does not register is rejected"],
    ["G-07", "AC-3", "integration", "pass", "a valid declaration with immutable references selects the affected consumer"],
    ["G-08", "AC-3", "negative", "reject", "public contract bytes changed without a declaration are BLOCKED"],
    ["G-09", "AC-3", "contract", "reject", "tampered digests, mutable refs and forged owners are rejected"],
    ["G-10", "AC-4", "cross-cutting", "pass", "an internal-only change is classified internal against the inventory"],
    ["G-11", "AC-4", "boundary", "reject", "an unsafe changed path is BLOCKED, never classified"],
  ]));

put("specs/002-native-acceptance/acceptance/plan.json", plan("002-native-acceptance", "spec-002",
  [
    { id: "AC-0", requirements: ["RF-1", "RF-2", "RF-3", "RF-4", "RF-5", "RF-6", "RF-7", "RF-8", "RF-9", "RF-10", "RF-11", "RF-12", "RF-13", "RF-14", "RF-15", "RF-16", "RF-17", "RF-18"] },
    { id: "AC-1", requirements: ["RF-19", "RF-20", "RF-21"] }, { id: "AC-2", requirements: ["RF-22"] }, { id: "AC-3", requirements: ["RF-23", "RF-24"] },
    { id: "AC-4", requirements: ["RF-25"] }, { id: "AC-5", requirements: ["RF-26", "RF-27"] }, { id: "AC-6", requirements: ["RF-28", "RF-29"] },
    { id: "AC-7", requirements: ["RF-30", "RF-31", "RF-32"] }, { id: "AC-8", requirements: ["RF-9", "RF-15", "RF-16", "RF-33"] }, { id: "AC-9", requirements: ["RF-31"] },
    { id: "AC-10", requirements: ["RF-30", "RF-34"] }, { id: "AC-11", requirements: ["RF-35"] },
  ],
  [
    ["A-01", "AC-0", "positive", "pass", "a governed contract runner executes shell-free and is labelled not isolated"],
    ["A-02", "AC-0", "negative", "reject", "shells, inline script and substitution are refused by the contract"],
    ["A-03", "AC-1", "positive", "pass", "a spec with criteria yields a valid plan"],
    ["A-04", "AC-1", "negative", "reject", "an AC without case, an empty applicable category and an unjustified N/A are BLOCKED"],
    ["A-05", "AC-2", "boundary", "pass", "a digested synthetic dataset is accepted"],
    ["A-06", "AC-2", "boundary", "reject", "a dataset whose bytes do not match its digest is BLOCKED"],
    ["A-07", "AC-3", "contract", "pass", "observed case IDs from TAP all passing give PASS"],
    ["A-08", "AC-3", "contract", "reject", "zero or skipped observed cases are BLOCKED whatever the exit code"],
    ["A-09", "AC-4", "cross-cutting", "pass", "identical BASE and candidate governance data produce no finding"],
    ["A-10", "AC-4", "cross-cutting", "reject", "lowering a mandatory case is a DOWNGRADE that forces the human gate"],
    ["A-11", "AC-5", "positive", "pass", "the rendered manual has parity with plan and contract"],
    ["A-12", "AC-5", "negative", "reject", "an edited manual fails parity"],
    ["A-13", "AC-6", "contract", "pass", "PASS and NOT_APPLICABLE are the only non-blocking statuses"],
    ["A-14", "AC-6", "contract", "reject", "BLOCKED, STALE and NOT_RUN map to ERROR and block"],
    ["A-15", "AC-7", "persistence", "pass", "the hash-chained ledger in the git dir verifies"],
    ["A-16", "AC-7", "persistence", "reject", "an edited ledger entry breaks the chain and is BLOCKED"],
    ["A-17", "AC-7", "negative", "reject", "a criterion with only passing cases is BLOCKED (RF-32)"],
    ["A-18", "AC-8", "boundary", "pass", "isolation tiers are ordered"],
    ["A-19", "AC-8", "boundary", "reject", "an unavailable tier or a run below the case minimum is BLOCKED without fallback"],
    ["A-20", "AC-9", "integration", "pass", "the trusted analyzer closes a feature from the CI raw output of the evaluated commit"],
    ["A-21", "AC-9", "integration", "reject", "a foreign workflow, another event or unanchored output never closes"],
    ["A-22", "AC-10", "cross-cutting", "pass", "a non-SUT path does not need case coverage"],
    ["A-23", "AC-10", "cross-cutting", "reject", "control-plane globs cannot join the non-SUT class; uncovered code is reported"],
    ["A-24", "AC-11", "integration", "reject", "a NOT_APPLICABLE category keeps the feature BLOCKED pending approval"],
    ["A-25", "AC-11", "integration", "pass", "only the human approval lookup clears the pending item"],
    ["A-26", "AC-0", "contract", "reject", "secret-like environment or unreadable configuration is BLOCKED; config changes change the fingerprint"],
    ["A-27", "AC-0", "integration", "reject", "a dependency edge without a consumer-owned mandatory case is BLOCKED"],
    ["A-28", "AC-0", "boundary", "reject", "a runner past its timeout is killed and BLOCKED"],
    ["A-29", "AC-3", "negative", "reject", "a failing observed case is FAIL and an unknown observed id is BLOCKED"],
    ["A-30", "AC-4", "cross-cutting", "reject", "a candidate rewriting the detector still gets the finding; other-SHA verdicts are BLOCKED"],
    ["A-31", "AC-11", "negative", "reject", "an approval is bound to the justification digest: a changed justification is pending again"],
  ]));

put("specs/003-acceptance-integration/acceptance/plan.json", plan("003-acceptance-integration", "spec-003",
  [
    { id: "AC-1", requirements: ["RF-1", "RF-18"] }, { id: "AC-2", requirements: ["RF-3", "RF-19"] }, { id: "AC-3", requirements: ["RF-20"] }, { id: "AC-4", requirements: ["RF-21"] },
    { id: "AC-5", requirements: ["RF-4", "RF-8", "RF-9", "RF-10", "RF-11", "RF-12", "RF-13"] },
    { id: "AC-6", requirements: ["RF-2", "RF-5", "RF-6", "RF-7", "RF-14", "RF-15", "RF-16", "RF-17"] },
  ],
  [
    ["I-01", "AC-1", "positive", "pass", "the acceptance phase is in the existing SDD command bodies; no new slash command"],
    ["I-02", "AC-1", "negative", "reject", "a feature with neither criteria nor N/A is MISSING and blocks; N/A is pending; legacy keeps v4.0.2"],
    ["I-03", "AC-2", "negative", "reject", "FAIL, BLOCKED, STALE and NOT_RUN acceptance are never APPROVED"],
    ["I-04", "AC-2", "contract", "reject", "without a runner-written ledger entry the status is NOT_RUN and blocks"],
    ["I-05", "AC-2", "persistence", "pass", "fixing the defect and re-running restores PASS"],
    ["I-06", "AC-3", "integration", "pass", "the review packet carries the acceptance section bound to the revision"],
    ["I-07", "AC-3", "negative", "reject", "a pending item is in the packet and the review is not approvable"],
    ["I-08", "AC-4", "integration", "reject", "a seeded real defect is detected as FAIL on a disposable consumer"],
    ["I-09", "AC-4", "negative", "reject", "a silent DOWNGRADE is a finding and a trivial runner is refused"],
    ["I-10", "AC-5", "boundary", "pass", "exactly the four inspected releases are admitted; v3.4.x reports the MAJOR crossing"],
    ["I-11", "AC-5", "boundary", "reject", "v4.0.0, v3.4.1, absent and malformed sources are rejected"],
    ["I-12", "AC-6", "cross-cutting", "pass", "impact selection runs each affected consumer feature once"],
    ["I-13", "AC-6", "cross-cutting", "reject", "an undeclared provider contract change is BLOCKED"],
    ["I-14", "AC-6", "contract", "reject", "without an attested reviewer the final review is REVIEW_PENDING"],
    ["I-15", "AC-6", "integration", "pass", "the GI pilot definition run by CI is valid, honestly labelled and matches its tests"],
    ["I-16", "AC-5", "persistence", "pass", "every admitted source preserves owned files, keeps drift, rolls back on failure and is idempotent"],
  ]));
console.log("generated");
