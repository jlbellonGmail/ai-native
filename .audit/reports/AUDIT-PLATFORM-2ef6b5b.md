---
targetRepo: jlbellonGmail/ai-native
targetCommit: 2ef6b5ba8a31c5871eb9a697c5af5f19122ffeb8
platform:
  version: "v3.3.0 candidate; unpublished"
  commit: "2ef6b5ba8a31c5871eb9a697c5af5f19122ffeb8"
auditMethod: "1.2"
profile: PLATFORM
date: "2026-10-16T15:07:52Z"
scope: "Independent PLATFORM 1.2 audit of the exact commit; release-gate not executed"
score: 98.25
isMergeGate: false
tool:
  name: OpenCode
  model: "GPT-6 Luna"
---

# AI-NATIVE PLATFORM Audit — `2ef6b5ba8a31c5871eb9a697c5af5f19122ffeb8`

## A. IDENTIFICATION

```text
Repository: jlbellonGmail/ai-native
Path: C:\Proyectos\ai-native
Branch: main
Commit: 2ef6b5ba8a31c5871eb9a697c5af5f19122ffeb8
Tag: None; v3.3.0 is not tagged or published
Latest published stable: v3.2.0
Date: 2026-10-16
Worktree: CLEAN at start and end
Profile: PLATFORM 1.2 (only profile applied)
QUALITY_SCORE: 1.1
AUDIT_RULES: 1.1
Audit method: 1.2
Environment: Windows (win32); Node v26.11.1; npm 11.13.0
Confidence: ALTA for the audited source commit; its future published v3.3.0 assets remain unverified
```

The requested normative documents were read completely and in the prescribed order. No other profile was applied. Previous audit scores, findings, and historical audit content were not used as evidence. No project files were changed by the auditor; this report records the independent assessment.

## B. EXECUTIVE VERDICT

```text
Score bruto: 98.25/100
Score final: 98.25/100
Quality Gate aplicado: Ninguno
Confianza: ALTA
Estado: APTO CON CORRECCIONES
Release decision: STOP
Consistencia metodológica: PASS
```

The score exceeds the requested 90-point threshold, but the live GitHub configuration permits administrators to bypass the required reviewer on the `ai-native-human-review` environment. The merge-gate treats successful completion of that environment job as explicit human review. This is a **MAJOR** governance defect, so the required zero-MAJOR release condition is not met.

There is also one **MINOR** supply-chain finding: the verified published SBOM has only a generic file metadata component and no component or dependency inventory. That finding does **not** independently block release under the requested threshold.

**Finding counts:** BLOCKER 0 · CRITICAL 0 · MAJOR 1 · MINOR 1.

## C. SCOPE AND LIMITATIONS

Inspected current source, contracts, tests, documentation, workflows, governance, local Git state, and verifiable GitHub configuration. Focus areas included lifecycle CLI, CLI↔PLATFORM protocol, legacy CLI v3.2.0, lock validation and legacy detach, upgrade, self-update, uninstall, revocations, anti-downgrade, offline behavior, Windows/Linux execution evidence, multi-repository pinning, release/build/distribution, supply chain, CI gates, and governance.

Executed targeted local suites and validators, a deterministic build of the audited commit, and the official published-release verifier against v3.2.0. Queried GitHub’s live ruleset, environments, actions settings, alerts, releases, and exact-SHA CI runs. Local test temporary paths were set to `C:\TEMP\ai-native-tests`; no host settings were changed.

Limitations:

- **v3.3.0 is not published.** Its exact release assets, SBOM, and attestations therefore cannot be externally verified. The audited commit did build deterministically, and the existing v3.2.0 published release was verified.
- The release-gate was **not run**, as explicitly instructed.
- Linux tests were not run locally; the exact-SHA Ubuntu CI jobs passed.
- GitHub environment secret values and their rotation state were not inspected. The environment configuration itself was queried.
- The legacy branch-protection endpoint returned 404 (“Branch not protected”). The active repository ruleset was separately verified; this 404 is not evidence that protection is absent.
- One attempted command, `node scripts/validate-readme-install.mjs`, failed because that executable does not exist. The actual test file was then run successfully; this was an auditor invocation error, not a project test failure.
- One live CodeQL alert is open. Direct workflow review found it concerns an expected untrusted checkout in a read-only reusable workflow; it is recorded as contextual and non-blocking, not as a scored finding.

## D. DETECTED CONTRACT

| ID | Capability / requirement | Classification | Source | State |
|---|---|---|---|---|
| D-01 | Consumers pin a PLATFORM release by lock, version, commit, and digest | OBLIGATORIO | `contracts/lock.schema.json`; `README.md` | VERIFICADO |
| D-02 | One machine CLI can serve repositories with independent PLATFORM pins | OBLIGATORIO | `README.md`; `runtime/cli/ai-native-lifecycle.test.mjs` | VERIFICADO |
| D-03 | Init, upgrade, detach, install, self-update, and uninstall follow distinct lifecycle rules | OBLIGATORIO | `README.md`; CLI and bootstrap source/tests | VERIFICADO |
| D-04 | CLI and PLATFORM negotiate a versioned bootstrap protocol; incompatible callers fail closed | OBLIGATORIO | `contracts/bootstrap-protocol.json`; `runtime/bootstrap/compat.mjs` | VERIFICADO |
| D-05 | Digest, attestation, release immutability, and revocations are checked before use | OBLIGATORIO | `runtime/cli/ai-native.mjs`; `runtime/bootstrap/remote.mjs`; release tests | VERIFICADO |
| D-06 | Offline operation uses previously verified local releases and discloses unchecked revocations | OBLIGATORIO | CLI/bootstrap source and lifecycle tests | VERIFICADO |
| D-07 | Malformed or schema-invalid locks fail closed without mutation; valid legacy lock-only repositories retain legacy detach behavior | OBLIGATORIO | `runtime/bootstrap/detach.mjs`; lifecycle regression tests | VERIFICADO |
| D-08 | Release bundles are deterministic and carry platform metadata, SBOM, checksums, provenance, and revocations | OBLIGATORIO | `runtime/release/build.mjs`; `.github/workflows/release.yml` | IMPLEMENTADO; published v3.2.0 verified; target artifact not yet published |
| D-09 | CI and repository rules protect integration; merges do not occur automatically | OBLIGATORIO | CI workflows, live ruleset, merge-gate source | PARCIAL: human-review environment bypass is enabled |
| D-10 | MCP and agent policy defaults deny unapproved capabilities | OBLIGATORIO | `core/security-policy.json`; `mcp/catalog.json`; core validator | VERIFICADO |

## E. SCORE MATRIX

| Area | Maximum | Obtained | State |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 12 | COMPLETO |
| Q2 Reutilización | 12 | 12 | COMPLETO |
| Q3 Arquitectura | 12 | 12 | COMPLETO |
| Q4 Documentación/DX | 12 | 12 | COMPLETO |
| Q5 Calidad/Tests | 16 | 16 | COMPLETO |
| Q6 Git/CI/CD/Release | 16 | 16 | COMPLETO |
| Q7 Seguridad | 12 | 11.25 | MENOR — F-002 |
| Q8 Automatización/Gobernanza | 8 | 7 | PARCIAL — F-001 |
| **TOTAL** | **100** | **98.25** | **STOP: one MAJOR finding** |

No N/A criteria. No Quality Score gate capped the score.

## F. DETAIL BY SUBCRITERION

| ID | Criterion | Max | Level | Earned | Evidence | Finding | Justification |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Purpose and scope | 3 | COMPLETO | 3 | `README.md` §§ Repository Structure, Requirements, Quick Start; `governance/versioning/VERSIONING-POLICY.md` | — | Purpose, consumer model, prerequisites, and platform versioning are identifiable. |
| Q1.2 | Promised capabilities present | 3 | COMPLETO | 3 | V03–V06; lifecycle CLI and bootstrap suites | — | Lifecycle, compatibility, pinning, and fail-closed behaviors were exercised. |
| Q1.3 | Documentation/configuration/implementation coherence | 3 | COMPLETO | 3 | `contracts/bootstrap-protocol.json`; `contracts/platform.schema.json`; V03, V09, V10 | — | Protocol contract, release manifest, source behavior, and tests agree. |
| Q1.4 | Mandatory requirements complete | 3 | COMPLETO | 3 | README lifecycle claims; V03–V10; F-001 is separately scored under Q8.3 | — | Required lifecycle operations exist; the governance enforcement gap is separately penalized. |
| Q2.1 | Reproducible initialization | 3 | COMPLETO | 3 | `scripts/verify-release.mjs`; V03, V09 | — | A published release was verified through real consumer bootstrap; tests also cover initialization. |
| Q2.2 | No accidental project-specific residue | 3 | COMPLETO | 3 | `runtime/release/bundle.mjs:20-31`; release tests | — | Release bundling uses an explicit allowlist and excludes tests and non-runtime areas. |
| Q2.3 | Configuration and customization | 3 | COMPLETO | 3 | `contracts/lock.schema.json`; `README.md` lifecycle and profile instructions | — | Profiles, repository trust override, and lock-controlled settings are explicit. |
| Q2.4 | Portability and extensibility | 3 | COMPLETO | 3 | `.github/workflows/ci.yml` Windows/Ubuntu matrix; V03, V04, V12 | — | Cross-platform execution is tested locally and by exact-SHA CI. |
| Q3.1 | Coherent structure | 3 | COMPLETO | 3 | `README.md` Repository Structure; platform source layout | — | Runtime, contracts, core, release, profiles, and governance have distinguishable roles. |
| Q3.2 | Separation of responsibilities | 3 | COMPLETO | 3 | `runtime/cli/ai-native.mjs`; `runtime/bootstrap/upgrade.mjs`; `runtime/bootstrap/detach.mjs` | — | Public trust/lifecycle CLI delegates repository operations to the verified release engine. |
| Q3.3 | Simplicity and justified duplication | 3 | COMPLETO | 3 | `package.json`; `pnpm-lock.yaml`; release bundle allowlist | — | Runtime dependencies are absent; duplicated bootstrap logic is needed for the pre-verification CLI boundary. |
| Q3.4 | Maintainability and evolution | 3 | COMPLETO | 3 | Test mapping validator; doc-drift validator; release/protocol tests | — | Compatibility and documentation checks provide ongoing regression coverage. |
| Q4.1 | Functional README | 3 | COMPLETO | 3 | `README.md` §§ New project, lifecycle, errors, requirements | — | Gives onboarding, the two version concepts, command behavior, and failure remedies. |
| Q4.2 | Reproducible installation/bootstrap | 3 | COMPLETO | 3 | `scripts/validate-readme-install.test.mjs`; V09 | — | Installation instructions are parsed and checked against the public CLI; published bootstrap passed. |
| Q4.3 | Common operations documented | 2 | COMPLETO | 2 | README lifecycle and Quick Start | — | Install, validate, test, release, upgrade, self-update, uninstall, and detach are documented. |
| Q4.4 | Contribution conventions | 2 | COMPLETO | 2 | `CONTRIBUTING.md:5-31` | — | Branch/PR, validation, documentation, and secret-handling expectations are specified. |
| Q4.5 | Examples and troubleshooting | 2 | COMPLETO | 2 | README install examples and fail-closed code table | — | Bash and PowerShell onboarding examples and actionable error codes are present. |
| Q5.1 | Automatic quality controls | 3 | COMPLETO | 3 | CI workflow; V07–V08; V12 | — | Validators, pinning checks, documentation drift, and security workflows are wired. |
| Q5.2 | Adequate test strategy | 3 | COMPLETO | 3 | 97 test files mapped by `scripts/validate-ci-tests-listed.mjs`; V03–V08 | — | Risk-based lifecycle, regression, contract, release, and governance tests are mapped to workflows. |
| Q5.3 | Tests executable and passing | 4 | COMPLETO | 4 | V03–V08, V10, V12 | — | Targeted local suites, release verification, validators, and exact-SHA CI passed. |
| Q5.4 | Critical regression protection | 3 | COMPLETO | 3 | `runtime/bootstrap/detach.mjs:20-31,105-128`; lifecycle tests; V02 | — | Malformed/schema-invalid and valid legacy lock behavior were directly retested. |
| Q5.5 | Automated quality gates | 3 | COMPLETO | 3 | Live GitHub ruleset; `.github/workflows/ci.yml`; V12–V13 | — | Required checks are configured server-side and all exact-SHA CI runs passed. |
| Q6.1 | Git strategy | 3 | COMPLETO | 3 | `CONTRIBUTING.md:5-11`; live main ruleset; V01, V17 | — | PR-based main integration and exact-head checks are configured. |
| Q6.2 | Branch/integration protection | 3 | COMPLETO | 3 | Live `ai-native-main` ruleset; V13 | — | Ruleset is active, has no bypass actors, and requires the CI and App-sourced checks. |
| Q6.3 | Reproducible/reliable CI | 3 | COMPLETO | 3 | `.github/workflows/ci.yml`; six exact-SHA workflow runs; V12 | — | CI, security, supply-chain, SBOM, and pilot runs completed successfully. |
| Q6.4 | Versioning and releases | 3 | COMPLETO | 3 | `runtime/release/build.mjs`; `.github/workflows/release.yml`; V09–V10 | — | Published v3.2.0 is immutable and verified; v3.3.0 remains an untagged candidate. |
| Q6.5 | Reproducible builds/artifacts | 2 | COMPLETO | 2 | `runtime/release/bundle.mjs`; V09 | — | Two builds from the exact commit produced byte-identical assets and bundle digest. |
| Q6.6 | Compatibility/migration/rollback | 2 | COMPLETO | 2 | Protocol contract; upgrade/downgrade tests; V02–V04, V11 | — | Legacy CLI compatibility, anti-downgrade, and repository-local pins are tested. |
| Q7.1 | Secret management | 3 | COMPLETO | 3 | Live repository security settings; workflow permissions; CI security runs | — | Secret scanning and push protection are enabled; no secret values were accessed. |
| Q7.2 | Dependency management | 2 | COMPLETO | 2 | `package.json`; `pnpm-lock.yaml`; live Dependabot alert count; V07 | — | No runtime package dependencies are declared; zero open Dependabot alerts; actions are SHA-pinned. |
| Q7.3 | CI/automation security | 2 | COMPLETO | 2 | Workflow permissions, `persist-credentials: false`, pin validator; live CodeQL alert review | — | Least-privilege and pinning controls are present. The open checkout alert is contextual, not an evidenced exploit. |
| Q7.4 | Secure defaults | 2 | COMPLETO | 2 | `core/security-policy.json:4-6,84-90`; `mcp/catalog.json`; core validator | — | Policy and MCP defaults are deny; catalog has no enabled servers. |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | V12; published v3.2.0 SBOM; `.github/workflows/release.yml:130-147` | F-002 | Digest, signatures, revocations, and SBOM asset verify, but the SBOM lacks useful product identity/inventory. |
| Q8.1 | Single source of truth | 2 | COMPLETO | 2 | Contracts, protocol contract, doc-drift validator | — | Contracts are canonical inputs and doc drift validation passed. |
| Q8.2 | Defined responsibilities and limits | 2 | COMPLETO | 2 | `core/security-policy.json`; `governance/security/HITL-MERGE-POLICY.md` | — | Roles and the single-maintainer limitation are explicitly described. |
| Q8.3 | Deterministic, fail-safe flows | 2 | PARCIAL | 1 | `.github/workflows/merge-gate.yml:73-121`; `runtime/gates/merge-gate.mjs:107-126`; live environment config | F-001 | Admin bypass on the required human-review environment defeats the intended explicit-review fail-safe. |
| Q8.4 | Traceability | 2 | COMPLETO | 2 | Exact-SHA checks, release commit/digest verification, hash-chain gate tests | — | Changes, checks, release identity, and review evidence are tied to exact commits. |

## G. VERIFICATION LEDGER

| ID | Verification | Command / method | Result | State | Evidence |
|---|---|---|---|---|---|
| V01 | Initial audit identity/worktree | `git rev-parse HEAD`; `git status --porcelain=v1 --untracked-files=all` | Exact requested SHA; no status output | PASS | `HEAD=2ef6b5ba8a31c5871eb9a697c5af5f19122ffeb8`; clean |
| V02 | Lock safety retest: malformed JSON, schema-invalid locks, legacy lock without journal | `node --test --test-name-pattern='DETACH fails closed on malformed or schema-invalid locks\|DETACH of a legacy repository' runtime/cli/ai-native-lifecycle.test.mjs` | 4 tests passed, 0 failed | PASS | Tests snapshot files, lock bytes, index and status; valid legacy lock-only detach removes only the lock |
| V03 | Public CLI lifecycle | `node --test runtime/cli/ai-native-lifecycle.test.mjs runtime/cli/ai-native.test.mjs` | 64 passed, 0 failed | PASS | Upgrade, self-update, uninstall, detach, offline, revocations, downgrades, multi-repo |
| V04 | Bootstrap suite | PowerShell: enumerate `runtime\bootstrap\*.test.mjs`, then `node --test` on that list | 49 passed, 0 failed | PASS | Bootstrap, cache, rollback, adoption, fail-closed paths |
| V05 | Release, verifier, and action-pin suites | PowerShell: enumerate `runtime\release\*.test.mjs`, add `scripts/verify-release.test.mjs` and `scripts/validate-actions-pinned.test.mjs`, then `node --test` | 39 passed, 0 failed | PASS | Reproducible bundle, revocations, release verifier, action pins |
| V06 | Governance gate suite | PowerShell: enumerate `runtime\gates\*.test.mjs`, then `node --test` | 62 passed, 0 failed | PASS | Trusted checks, human review, supply chain, secret exposure, gate behavior |
| V07 | Platform validators | `node parity/validate-parity.mjs`; `node contracts/validate-contracts.mjs`; `node core/validate-core.mjs`; `node runtime/docs/validate-doc-drift.mjs`; `node scripts/validate-actions-pinned.mjs`; `node runtime/status/validate-integrity.mjs` | All passed; parity unmapped=0; 20 schemas and 7 data files checked | PASS | Direct executions |
| V08 | CI and integration validators | `node scripts/validate-ci-tests-listed.mjs`; `node runtime/adapters/validate-entrypoints.mjs`; `node runtime/gates/pr-gate.mjs --base origin/main`; `node runtime/audit/cli.mjs check` | All passed; 97 test files mapped | PASS | Product tests reported NOT_APPLICABLE for the tested lock |
| V09 | Consolidated-area validators | `node foundation/scripts/validate-enterprise-10-10.mjs`; `node knowledge/scripts/validate-enterprise-evaluation.mjs`; `node template/scripts/validate-structure.mjs`; `node template/scripts/validate-enterprise-template.mjs` | All passed | PASS | Direct executions |
| V10 | README onboarding test | `node --test scripts/validate-readme-install.test.mjs` | 7 passed, 0 failed | PASS | Bash and PowerShell examples parsed; CLI flags and signer command checked |
| V11 | Local release build reproducibility | Built `v3.3.0` twice with `--commit 2ef6b5ba8a31c5871eb9a697c5af5f19122ffeb8`, outputs under `C:\TEMP\ai-native-tests` | Same bundle digest `sha256:7469bb59558ea93713ca36f3551babf0c4fc402543938efbfb0cb1916bcaf794`; all 6 asset hashes identical | PASS | Bundle has 226 files |
| V12 | Published release verification | `node scripts/verify-release.mjs v3.2.0` | 24 checks passed, 0 failed | PASS | Tag, immutable release, assets, checksums, attestations, SBOM format, revocations, real bootstrap |
| V13 | Legacy CLI identity | Compared bytes from `git show v3.2.0:runtime/cli/ai-native.mjs` with `evaluation/fixtures/cli/ai-native-v3.2.0.mjs` | 21,063 bytes each; identical | PASS | The lifecycle suite also ran the real fixture against the current engine |
| V14 | GitHub exact-SHA workflows | `gh api repos/jlbellongmail/ai-native/actions/runs?head_sha=2ef6b5ba8a31c5871eb9a697c5af5f19122ffeb8&per_page=100` and check-runs API | 6 workflows and 11 check runs completed successfully | PASS | CI validators Ubuntu/Windows; online/offline pilot Ubuntu/Windows; CodeQL, supply chain, Trivy, SBOM |
| V15 | Live branch ruleset and environment settings | GitHub REST API: main ruleset details and environment endpoints | Main ruleset active/no bypass actors; `ai-native-human-review.can_admins_bypass=true` | VERIFICADO; F-001 | Required checks and reviewer config are described in F-001 |
| V16 | Live security/release settings | GitHub REST API for Actions permissions, Dependabot alerts, CodeQL alerts, releases | Default workflow permissions read; Dependabot alerts 0; one open CodeQL warning; secret scanning and push protection enabled | VERIFICADO | CodeQL alert #27 is contextual; exact details in C |
| V17 | Candidate publication status | `gh release view v3.3.0`; `gh api .../git/ref/tags/v3.3.0` | Release and tag not found | NO VERIFICADO | Candidate is not published; future assets cannot be verified |
| V18 | Auditor invocation error | `node scripts/validate-readme-install.mjs` | Exit 1: file not found; corrected by running V10 | FAIL — auditor invocation only | Not a project validation failure; actual test passed |
| V19 | Release-gate | Not executed, per explicit instruction | Not run | NO VERIFICADO | No release-gate command was invoked |
| V20 | Final repository integrity | `git rev-parse HEAD`; `git status --porcelain=v1 --untracked-files=all`; `git diff --check` | Exact SHA; clean; exit 0 | PASS | No repository files changed during the audit |

## H. FINDINGS

| ID | Type | Severity | Finding | Evidence | Criterion | Points lost |
|---|---|---|---|---|---|---:|
| F-001 | RIESGO / INCOMPLETO | **MAJOR** | Required human-review environment permits administrator bypass | Live environment API; `.github/workflows/merge-gate.yml:73-121`; `runtime/gates/merge-gate.mjs:107-126` | Q8.3 | 1.00 |
| F-002 | INCOMPLETO | **MINOR** | Published SBOM does not meaningfully identify the platform or inventory components | V12; direct v3.2.0 SBOM inspection; `.github/workflows/release.yml:130-147` | Q7.5 | 0.75 |

### F-001 — Required human-review environment permits administrator bypass

**Description:** The merge-gate’s control-plane flow places the `human-review` job behind the `ai-native-human-review` environment, then sets `HUMAN_REVIEWED=true` in the finalizer after that job succeeds. The live GitHub environment API reports `can_admins_bypass: true`; its required reviewer is the repository owner. The finalizer trusts the job completion and does not independently verify an approval event.

**Impact:** A repository administrator can bypass the environment’s required reviewer. The finalizer can then treat the job as human-reviewed and accept a neutral trust-gate result for a control-plane change. The main ruleset still requires PR and App-sourced checks; this finding is specifically about bypassing the human-review gate. GitHub’s environment documentation describes administrator bypass as configurable and provides an option to disallow it.

**Root cause:** `ROOT-001` — the environment allows administrator bypass while the gate equates successful environment-job completion with explicit human approval.

**Minimal correction:** Disable “Allow administrators to bypass configured protection rules” for `ai-native-human-review`, retaining its required reviewer and main-branch policy.

**Closure verification:** Read the environment configuration and confirm `can_admins_bypass=false`; exercise a control-plane PR and confirm its merge-gate remains pending until the configured reviewer explicitly approves that run. Do not accept an admin bypass as approval.

**Points recoverable:** +1.00 in Q8.3.

### F-002 — Published SBOM lacks useful platform identity/inventory

**Description:** The published v3.2.0 SBOM verifies as CycloneDX 1.7 but has no `components` or `dependencies` entries and its metadata component is a generic file named `sbom-src`. The release workflow checks CycloneDX format but accepts an absent/empty component list. The root package manifest declares no runtime dependencies, so an empty dependency graph may be accurate; the SBOM still does not identify the platform release/commit as its root component.

**Impact:** A downstream consumer cannot reliably associate this SBOM with the platform version or commit, and cannot distinguish “no dependencies” from an inventory that does not describe the product. The release digest and attestations do verify separately.

**Root cause:** `ROOT-002` — SBOM generation uses the extraction directory as the scan target without validating product identity in the resulting SBOM.

**Minimal correction:** Add an identified platform root component with release version and commit, and validate that identity against `platform.json`. An explicitly empty dependency list is acceptable if accurate.

**Closure verification:** Build and publish the candidate through the normal release workflow; inspect the generated CycloneDX identity and dependency inventory, then rerun `scripts/verify-release.mjs` and verify the asset attestation.

**Points recoverable:** +0.75 in Q7.5. This MINOR finding is not independently release-blocking under the requested threshold.

### Contextual security signal, not a scored finding

GitHub reports one open CodeQL alert (`actions/untrusted-checkout/medium`, warning) at `.github/workflows/l3-consumer.yml:116`. The workflow checks out consumer PR code for its L3 gate, but uses `contents: read`, disables persisted checkout credentials, and checks out the trusted platform commit from the default branch after ancestry validation. The alert is verified as open; exploitation is **not verified**. The workflow’s read-only design makes this contextual and non-blocking, with no score deduction.

## I. ROOT CAUSES

| ID | Root cause | Related finding | Impact |
|---|---|---|---|
| ROOT-001 | Environment allows admin bypass; gate trusts job completion as human approval | F-001 | Control-plane human-review requirement is bypassable |
| ROOT-002 | SBOM output identity is not validated against release metadata | F-002 | SBOM has limited downstream inventory value |

## J. WHAT IS UNNECESSARY

No specific element was verified as unnecessary. No deletion or simplification is recommended.

## K. WHAT IS MISSING

### REQUIRED TO REACH 100/100

- **F-001:** Disable administrator bypass on the human-review environment and verify explicit reviewer enforcement.
- **F-002:** Identify the platform root component in the SBOM and validate its version/commit.

### OPTIONAL IMPROVEMENTS

- Triage and document the open CodeQL alert’s read-only context. This is not a scored defect based on the evidence reviewed and is not release-blocking.

## L. NOT VERIFIED

| Item | Reason | Scoring impact / follow-up |
|---|---|---|
| Published v3.3.0 assets, SBOM, checksums, and attestations | No v3.3.0 tag or release exists | Not a failure of the unpublished source commit. Verify after publication; no claim is made about those future assets. |
| Release-gate for this audit | Explicitly prohibited from execution | Not scored as a failure; remains a required later process step outside this audit. |
| GitHub environment secret values/rotation | Values are not exposed by the read-only configuration queries used | No claim about secret values or rotation; workflow scoping and repository settings were inspected. |
| `prevent_self_review` environment setting | API response returned null/no positive setting | No claim that self-review is prevented. The directly verified admin-bypass setting is sufficient for F-001. |
| Local Linux execution | Audit host is Windows | Exact-SHA Ubuntu CI passed; local CLI/bootstrap/release suites ran on Windows. |
| CodeQL alert exploitability | Alert is open, but current workflow uses read-only permissions and unpersisted credentials | Contextual, non-blocking; no score impact. |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS — none open
G2 CRITICAL: PASS — none open
G3 ESSENTIAL VERIFICATION: PASS — executed essential suites and exact-SHA CI passed
```

No Quality Score global cap applies. The separate requested release threshold fails because F-001 is MAJOR.

## N. MATHEMATICAL PATH TO 100

```text
Score actual: 98.25/100

F-001 → +1.00 (Q8.3: 1/2 to 2/2)
F-002 → +0.75 (Q7.5: 2.25/3 to 3/3)

Puntos obtenidos + recuperables obligatorios:
98.25 + 1.75 = 100.00

Puntos aplicables: 100
Score bruto esperado tras correcciones: 100/100
```

There are no N/A criteria. The score path is mathematically complete. It does not certify future v3.3.0 published assets.

## O. REMEDIATION PLAN

| Priority | Finding | Files/config | Exact change | Reason/risk | Recoverable | Verification |
|---|---|---|---|---|---:|---|
| 1. MAJOR | F-001 | GitHub `ai-native-human-review` environment | Disable administrator bypass; retain required reviewer and main-branch policy | Prevents a successful finalizer from representing an admin bypass as explicit approval | +1.00 | Verify live setting is false; control-plane PR stays pending until reviewer approval |
| 2. MINOR | F-002 | `.github/workflows/release.yml` and its SBOM validation | Add a platform root component with version/commit and validate against `platform.json` | Makes the SBOM identifiable and useful to consumers | +0.75 | Publish/test the asset, validate SBOM identity, checksums, and attestation |

The MINOR item is not a release blocker under the requested policy. F-001 is the reason for STOP.

## P. SECOND PASS FOR 100

```text
N/A — provisional score is below 100; mandatory second pass does not apply.
```

## Q. FINAL CERTIFICATION

**Can this exact commit be considered ready for a PLATFORM release under PLATFORM 1.2?**

```text
NO — STOP
```

The score is 98.25/100, but F-001 is one open MAJOR finding, violating the required zero-MAJOR release condition. F-002 is MINOR and does not independently block release. This audit applies only PLATFORM 1.2; it does not assess or certify the TEMPLATE profile.
