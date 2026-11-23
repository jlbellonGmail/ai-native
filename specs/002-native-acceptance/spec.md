# Native Acceptance

Status: draft
human_gate: required
autonomy: full

## Goal

Make acceptance a mandatory, automatic and verifiable phase of every SDD feature
that needs it: derive what must be validated from the spec's acceptance
criteria, generate the applicable cases, synthetic datasets, commands and a
human manual, execute them through a governed validation contract, and record
evidence that a fail-closed gate, the independent reviewer and the human can
trust. Module and consumer-owned cross acceptance use public interfaces and the
declared dependency graph (feature 001).

Base: AI-NATIVE v4.0.2 (`develop` `15548c1`). Reused, not duplicated: the
v4.0.2 `sdd validate` acceptance-heading and requirement-coverage warnings
(`runtime/circuit/sdd-workflow.mjs`), the review ledger and runtime-attested
independent review (`runtime/circuit/review-ledger.mjs`,
`independent-review.mjs`), HITL derivation (`runtime/policy/hitl.mjs`) and the
trusted-base control-plane loader (`runtime/gates/control-plane.mjs`).

## Definitions

* **acceptance criterion (AC)**: a stable `AC-n` item under the spec's
  acceptance heading, citing the requirement(s) it proves.
* **acceptance plan**: the per-feature, versioned artifact
  (`specs/<slug>/acceptance/plan.json`) listing every case with its AC,
  category, dataset, runner ID, SUT input paths, expected result, purpose
  ("why"), real-system use, intentional errors, limitations and restore steps,
  plus the applicability matrix.
* **applicability matrix**: for each category `positive`, `negative`,
  `boundary`, `integration`, `contract`, `persistence`, `cross-cutting`, either
  `APPLICABLE` with at least one case or `NOT_APPLICABLE` with a written
  justification.
* **validation contract**: the project-owned, versioned file
  (`acceptance/validation-contract.json`) that declares the authorized runners
  (ID, fixed executable, argv, cwd root, structured result format, timeout,
  isolation tier, environment allowlist) and the minimum observable coverage.
  The **acceptance registry** of earlier revisions of this spec is exactly the
  union of the contract's runners and the plan's cases; there is no third
  artifact.
* **evaluated revision**: the review-ledger revision of the change being closed
  or reviewed (`runtime/circuit/review-ledger.mjs`).
* **isolation tier**: `restricted` (shell-free spawn, argv/env/cwd/timeout/output
  bounds enforced by the runner; explicitly not a sandbox), `node-permission`
  (Node permission model flags for filesystem and child processes, verified
  from the spawned process arguments) or `container` (OCI container with
  `--network none` or a human-approved loopback service network).
* **trusted platform revision**: in this repository, the commit of the default
  branch `main` (protected by its ruleset and the merge gate) whose code and
  configuration run a governance check; in a consumer, the platform commit
  pinned by the lock on the consumer's BASE branch. Candidate code is never a
  trusted platform revision for its own change.
* **non-SUT path class**: the contract-declared, explicit list of
  specification, documentation and governance paths that are not inputs of the
  system under test (RF-34).
* **observed case**: a case ID read from the runner's structured result output
  (not from the exit code alone) with its own pass/fail/skip status.

## Requirements

RF-1. THE SYSTEM SHALL discover declared Module Acceptance scenarios for a
resolved module and execute only their registered commands.

RF-2. WHEN a module has declared dependencies, THE SYSTEM SHALL discover its
required Cross Acceptance obligations under the consumer and execute the
consumer-owned validations against the declared providers; each declared
dependency creates at least one mandatory validation obligation. A
dependency-free module shall be NOT_APPLICABLE for cross acceptance.

RF-3. IF a mandatory scenario is absent, empty, skipped, exits unsuccessfully or
cannot run, THEN THE SYSTEM SHALL consolidate FAIL or BLOCKED, never PASS.

RF-4. THE SYSTEM SHALL report PASS, FAIL, BLOCKED, STALE, NOT_RUN or
NOT_APPLICABLE per scenario and in a fail-closed consolidated result (RF-29).

RF-5. THE SYSTEM SHALL write bounded, reproducible evidence linked to module,
feature, scenario, contract/provider/consumer IDs, input digests, sourceRevision,
environment, timestamp, execution kind and result.

RF-6. WHEN a relevant manifest, contract, fixture, command, code input or declared
environment identity changes, THE SYSTEM SHALL mark prior evidence stale rather
than use it as PASS. A change outside the selected module scenario inputs shall
not invalidate its evidence.

RF-7. THE SYSTEM SHALL distinguish real execution from mock/simulated execution
in result metadata.

RF-8. THE SYSTEM SHALL execute a scenario only through a validation-contract
runner entry with a
fixed executable identity, argument vector and working-directory root; shell
interpretation, inline script text, command substitution and environment-derived
executables shall be rejected.

RF-9. THE SYSTEM SHALL enforce at every tier a finite per-scenario timeout, a
minimal allowlisted environment and bounded stdout/stderr capture; at the
`node-permission` and `container` tiers it SHALL also enforce a filesystem
boundary that permits only declared read inputs and a runner-owned output
directory, and SHALL exclude the git common directory from the scenario.

RF-10. IF a command requests an undeclared argument, executable, environment
variable, path escape, forbidden shell feature or exceeds its timeout, THEN THE
SYSTEM SHALL report BLOCKED with a safe diagnostic and shall not execute a
fallback command.

RF-11. THE SYSTEM SHALL store sourceRevision as report provenance outside the
acceptance input fingerprint. The input fingerprint shall contain only declared
scenario-relevant inputs, and a changed sourceRevision alone shall not alter it.

RF-12. THE SYSTEM SHALL derive a required Cross Acceptance obligation for every
dependency edge and assign ownership to the consuming module; provider-owned
acceptance cannot satisfy the consumer's obligation.

RF-13. IF any declared dependency lacks a contract-registered mandatory
validation, or a
mandatory validation is missing, skipped, unexecutable or lacks required
isolation, THEN THE SYSTEM SHALL report BLOCKED and SHALL NOT consolidate PASS.

RF-14. THE SYSTEM SHALL distinguish a restricted command execution profile from
an isolated sandbox. `spawn` without shell is command-injection defense only and
SHALL NOT be represented as filesystem, network or process isolation.

RF-15. THE SYSTEM SHALL require each runner to declare an isolation tier and
SHALL record in evidence only the controls that tier actually enforces on the
current host: `restricted` is reported as not isolated; `node-permission`
reports filesystem/child-process limits only when the Node runtime supports and
received the flags; `container` reports network/filesystem limits from the
container configuration it launched. A tier that grants network or loopback
service access SHALL require a human-approved contract entry.

RF-16. IF the host/runtime cannot provide the declared tier (unsupported Node
permission model, no container runtime, failed container start), THEN THE
SYSTEM SHALL report BLOCKED before executing the scenario and SHALL NOT fall back
to a weaker tier.

RF-17. THE SYSTEM SHALL fingerprint declared non-secret configuration inputs
and relevant environment-variable names plus their non-secret values when
explicitly allowed. Secret values SHALL never be stored, logged or hashed
directly; a critical secret-dependent configuration that cannot be verified
without exposing or recoverably hashing its value SHALL cause BLOCKED.

RF-18. IF a critical configuration input or environment dependency cannot be
read, classified as secret/non-secret, or verified against the declared
configuration contract, THEN THE SYSTEM SHALL report BLOCKED rather than claim
fresh evidence or PASS.

RF-19. WHEN a feature spec declares acceptance criteria, THE SYSTEM SHALL
derive the feature's acceptance obligations from them without a separate user
request: every `AC-n` SHALL map to at least one mandatory case, and every requirement
cited by an AC SHALL be reachable from a case.

RF-20. THE SYSTEM SHALL require an applicability matrix covering the seven
categories; a `NOT_APPLICABLE` entry SHALL carry a justification that cites
the requirement(s) or AC(s) that make it inapplicable, and an `APPLICABLE`
category without a case SHALL be BLOCKED. Cases SHALL NOT be
generated for categories declared not applicable.

RF-21. THE SYSTEM SHALL let the Builder generate the acceptance plan, cases,
datasets, commands and manual as ordinary reviewable artifacts; generated
content is untrusted until it passes the deterministic plan validator, executes
through the validation contract and is seen by the independent reviewer. No LLM
judgement decides a gate result.

RF-22. THE SYSTEM SHALL require every dataset to be synthetic and reproducible:
a committed file with a SHA-256 digest, or a declared generator with a fixed
seed whose output digest is recorded. Secret values and detectable real
personal data SHALL be rejected by the plan validator; the rest is a review
obligation.

RF-23. THE SYSTEM SHALL execute acceptance only through a project validation
contract that is versioned, schema-validated and lists authorized runners; a
runner SHALL produce structured results (TAP 13, JUnit XML or the Node test
runner reporter) from which observed case IDs are parsed.

RF-24. IF a run produces zero observed cases, omits a registered mandatory
case, reports a mandatory case as skipped/todo, or its observed IDs cannot be
matched to the plan, THEN THE SYSTEM SHALL report BLOCKED regardless of exit
code. A command such as `node -e 0`, `true` or `exit 0` therefore cannot yield
PASS; an explicit denylist of no-op commands is kept only as defense in depth.

RF-25. THE SYSTEM SHALL evaluate acceptance governance only with code and
configuration of the trusted platform revision, comparing the BASE and
candidate validation contract, plan and spec acceptance section. The candidate
SHALL be read only as data (Git objects or API contents of the exact head SHA,
size-bounded, parsed as JSON/Markdown, never executed, imported, installed or
checked out into the working tree of the trusted code); the job that reads
candidate data SHALL hold no secret and only read permissions; the verdict
SHALL be published by a separate step under an identity the candidate cannot
use, bound to the head SHA; and a candidate change to the detector, its
workflow, `runtime/policy/hitl.mjs` or the gates configuration SHALL NOT change
the verdict on that same change. A missing, failed, unauthenticated or
other-SHA verdict SHALL be BLOCKED. The `ci.yml` HITL derivation, which runs
candidate code, is early feedback only and never this verdict. It SHALL force
`human_gate: required` when the change creates or modifies the validation
contract, declares any `NOT_APPLICABLE` category or feature on an acceptance
REQUIRED feature, or contains a DOWNGRADE: a removed or renamed case, a lowered
mandatory flag, a removed AC or AC mapping, a changed runner executable, argv,
format or cwd, a lowered coverage minimum, a weaker isolation tier, a widened
network or environment allowlist, a longer timeout, or a changed expected result
or dataset of an existing case, an addition to the consumer's legacy
acceptance cutoff (feature 003 RF-18), or an addition to or widening of the
non-SUT path class (RF-34). Every such finding SHALL be listed in the review
packet and the evidence, and SHALL be approved only through a human-only GitHub
Environment approval bound to the head SHA, given by the pinned human reviewer
from an identity the agents cannot use, never by the Builder, the reviewer
agent, the requesting App or a file the agent can write. Until that trusted
verdict path, its required check on every protected target branch and the
human/agent identity separation exist, RF-25 SHALL be reported BLOCKED, never
as satisfied by the `ci.yml` derivation.

RF-26. THE SYSTEM SHALL render a manual acceptance procedure from the same
acceptance plan: glossary and naming, prerequisites, environment setup, dataset
reference, and for each case what it validates, why it matters, what each
command does, how it is used in a real system, the data it needs, the expected
result, the meaning of PASS/FAIL, which errors are intentional, its limitations
and how to restore the environment. Each command SHALL capture its own exit
status explicitly for every supported shell.

RF-27. THE SYSTEM SHALL keep the autonomous runner and the manual procedure in
parity: the manual's commands are rendered from the contract's executable and
argv, and case IDs, criteria, expected results and a digest of each rendered
command SHALL match the plan and contract; any divergence SHALL be BLOCKED. The
agent run is the gate input. A human run is optional, recorded with operator,
date, sourceRevision and per-case result, labelled `manual`, attached to the
final HITL record, and never presented as agent-executed.

RF-28. THE SYSTEM SHALL produce a traceability report linking requirement ->
acceptance criterion -> case -> dataset -> execution -> evidence -> result ->
gate decision, where every evidence record carries the evaluated
`sourceRevision`, its input fingerprint (RF-11) and the execution kind
(`agent`, `manual`, `simulated`, `real-integration`).

RF-29. THE SYSTEM SHALL report acceptance results through an explicit contract
whose statuses are PASS, FAIL, BLOCKED, STALE, NOT_RUN and NOT_APPLICABLE, and
SHALL map them fail-closed onto the existing `runtime/lib/result.mjs` statuses
without changing that enum's existing meanings, using exactly this mapping:
PASS -> PASS; FAIL -> FAIL; BLOCKED, STALE and NOT_RUN -> ERROR;
NOT_APPLICABLE approved under RF-25, or structural under RF-2 (a
dependency-free module's cross acceptance) -> NOT_APPLICABLE (report-only). STALE is reported as such but
is never a passing state: every gate treats STALE, NOT_RUN and BLOCKED as
blocking and FAIL as failing; only those two NOT_APPLICABLE kinds and PASS are non-blocking.

RF-30. THE SYSTEM SHALL accept, for feature closure and review approval, only
evidence whose `sourceRevision` equals the evaluated revision. Fingerprint-based
reuse (RF-6, RF-11) SHALL be limited to cross-acceptance obligations of
consumers not affected by the change and to impact selection; each case's input
set SHALL include its declared SUT paths, and a changed path of the feature not
covered by any case's inputs and not in the non-SUT path class (RF-34) SHALL be
BLOCKED.

RF-31. THE SYSTEM SHALL write local acceptance evidence only from the platform
runner into the append-only ledger under `<git-common-dir>/ai-native/acceptance/`,
as the review ledger does for validation runs; worktree reports are renderings
and are never read as evidence, and an entry whose digest chain does not verify
SHALL be BLOCKED. Because code under test may share the runner's OS rights, the
local ledger is circuit evidence only: the evidence that closes a REQUIRED
feature for merge SHALL come from CI on the evaluated commit, with the trusted
platform revision's runner in a fresh checkout, where the cases execute at the
`container` tier (or `node-permission` when the code under test cannot write
outside its output directory) and a separate job, in which no code under test
runs and which follows the RF-25 provenance rules, verifies that the producing
run used a registered workflow file, the expected event and the evaluated head
SHA, then derives and publishes the result from the raw structured-output
artifact read as size-bounded data, bound to that commit and run ID.

RF-32. THE SYSTEM SHALL require, for each AC, at least one case whose expected
result is a rejection/failure, or a recorded seeded-failure run that shows the
case can fail; an AC with only vacuously passing cases SHALL be BLOCKED.

RF-33. THE SYSTEM SHALL require every mandatory case to declare a minimum
isolation tier; running it at a lower tier SHALL be BLOCKED and lowering the
declared minimum is a DOWNGRADE (RF-25).

RF-34. THE SYSTEM SHALL let the validation contract declare a non-SUT path
class as explicit globs rooted under `specs/`, `docs/`, `governance/` or
`knowledge/`, or as single named Markdown files, excluding control-plane paths
(`governance/gates/`, `governance/rulesets/` and any other control-plane glob)
and the manual renderer's template inputs (`knowledge/sdd/templates/`). A changed path in that class
SHALL NOT trigger the RF-30 uncovered-path BLOCKED. The plan validator SHALL
reject an entry that matches every path or a whole top-level directory outside
those roots (for example `**`, `*`, `src/**`), or that matches any declared SUT
input path, runner executable or argv path, dataset, the validation contract,
an acceptance plan, a control-plane path, a manual template input or a path
under `.github/`, `runtime/`, `contracts/`, `core/` or `profiles/`. A path outside the class and outside every case's
inputs stays BLOCKED; there is no global permission.

RF-35. THE SYSTEM SHALL treat every `NOT_APPLICABLE` category or feature
declaration (RF-20, 003 RF-18), and every DOWNGRADE (RF-25), as
`PENDING_APPROVAL` until approved. A pending item is reported in the feature
status, the review packet and the traceability report; it does not by itself
block `DONE` or `REVIEW_PENDING`, but it SHALL block merge closure and SHALL
keep the review outcome from being presented as approved for merge. Approval is
valid only as the RF-25 human-only Environment approval for the exact head SHA
whose plan contains that item, and it binds the item's justification digest;
any later change to the item, its justification or the plan's applicability
matrix returns it to `PENDING_APPROVAL`. The Builder, the reviewer agent and
any App SHALL NOT approve it, and no file in the repository records it as
approved. The trusted verdict path SHALL preserve the approval evidence (run
ID, Environment, reviewer login and ID, approval time, head SHA and the item's
justification digest) in the published check output and in the merge-closure
traceability report (a derived rendering, never read as approval); those copies are evidence for audit, and every gate
re-reads the approval from GitHub instead of trusting them.

## Non-goals

No unregistered shell command runs, arbitrary arguments, inherited secret-rich
environments, treating spawn-without-shell as a sandbox, storing or hashing
secret values, LLM judgement as a gate decision, exit code alone as proof that
tests ran, empty test directories, claim that fakes are external integration,
real/personal data in datasets, a new slash command, or any modification of
GI-COMMON-REFERENCE (its M-01..M-13 manual is only a learning input).

## Acceptance criteria

Fixture scenarios prove module PASS, consumer-owned cross PASS, missing/empty
mandatory scenario BLOCKED, command failure FAIL, dependency-free cross
NOT_APPLICABLE, per-dependency consumer-owned obligations and missing-test
BLOCKED, restricted-versus-isolated execution reporting, inability-to-isolate
BLOCKED, relevant configuration/environment staleness, secret-safe fingerprint
handling, critical-configuration BLOCKED, and unrelated-revision retention.

- AC-0 (RF-1 to RF-18): the fixture scenarios of the paragraph above, each as a
  named test with the stated status.
- AC-1 (RF-19, RF-20, RF-21): a fixture spec with criteria produces a valid
  plan; an AC without a case, an applicable category without a case and an
  unjustified N/A are BLOCKED.
- AC-2 (RF-22): undigested, unseeded or digest-mismatched datasets are BLOCKED.
- AC-3 (RF-23, RF-24): `node -e 0`, a runner with zero observed cases, a skipped
  mandatory case and an unknown observed ID are BLOCKED; a real failing case is
  FAIL; all mandatory cases passing is PASS.
- AC-4 (RF-25): each DOWNGRADE kind is detected against the BASE plan/contract,
  forces `human_gate: required` and appears in the review packet; a candidate
  that edits the detector, its workflow, `hitl.mjs` or the gates configuration
  still receives the trusted revision's verdict; a missing or other-SHA verdict
  is BLOCKED; the candidate is never executed by the verdict job.
- AC-5 (RF-26, RF-27): the rendered manual contains every required field per
  case and the parity check fails on any runner/manual divergence.
- AC-6 (RF-28, RF-29): the traceability report is complete for a fixture
  feature and every record carries sourceRevision, fingerprint and kind;
  STALE, NOT_RUN and BLOCKED all block.
- AC-7 (RF-30, RF-31, RF-32): evidence from another revision does not close a
  feature; an uncovered changed path is BLOCKED; a hand-written worktree report
  or a broken ledger chain is BLOCKED; an AC without a failing-capable case is
  BLOCKED.
- AC-8 (RF-9, RF-15, RF-16, RF-33): each tier reports only enforced controls; an
  unavailable tier or a run below a case's minimum tier is BLOCKED without
  fallback; the git common directory is unreachable at the higher tiers.
- AC-9 (RF-31): a ledger entry or result file written by code under test does
  not close a feature; only the result derived by the separate CI job from the
  raw output of the evaluated commit does.
- AC-10 (RF-30, RF-34): a change only to a declared non-SUT path closes; an
  undeclared changed path is BLOCKED; `**`, a whole source root, a SUT input or
  a contract/plan path in the class is rejected; widening the class is a
  DOWNGRADE.
- AC-11 (RF-35): a pending N/A or DOWNGRADE is reported and allows `DONE` and
  `REVIEW_PENDING`, blocks merge closure, is cleared only by the Environment
  approval for the exact head SHA, and returns to pending after its
  justification changes; the traceability report carries the approval
  evidence, and a hand-edited copy does not clear a pending item.
