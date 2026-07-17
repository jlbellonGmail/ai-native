# P0-T2 - Audit-Safe Script Mode Spec

Related Governance Task: P0-T2 - Audit-Safe Script Mode
Related Roadmap: governance/roadmaps/AI-NATIVE-HARDENING-V1.1-ROADMAP.md
Status: SPEC_CLOSED_LOCALLY / HITL_REQUIRED
Owner: AI-NATIVE factory governance
Created: 2026-07-17
Updated: 2026-07-17

## Identity

ID: P0-T2

Name: Audit-Safe Script Mode

Logical owner: AI-NATIVE factory governance, with future implementation impact
expected in factory validation and package-script execution paths.

Preconditions:

* P0-T1 Governance Consistency is `APPROVED / FORMALLY_ACCEPTED`.
* `AI-NATIVE HARDENING-V1.1` remains `FORMALLY_CLOSED / HITL_APPROVED`.
* `ENTERPRISE-10-10-V1` remains closed and is not reopened.
* `ENTERPRISE-10-10-V2` remains not created.
* H9 remains not created and not opened.
* The first real application remains not started.
* All four repositories start from a clean working tree.

Relationship to readiness audit:

P0-T2 addresses a post-H8 readiness gap identified before the first controlled
real project: package-level scripts, lifecycle hooks and validators can produce
repository or runtime side effects during audits unless an explicit audit-safe
execution contract exists.

## Problem

The factory has strong governance, SDD artifacts and validators, but local
evidence shows that script execution is not uniformly classified by side-effect
risk before audits or validation runs.

Evidence used:

* `governance/SESSION-CONTEXT.md` records that P0-T1 did not execute
  package-level pnpm scripts and left P0-T2 as the next eligible task.
* `ai-template/package.json` defines `prepare`, which creates
  `.ai-runtime-data`, `logs` and `docs/incidents`.
* `ai-template/package.json` defines `setup`, which runs `pnpm install` and
  `pnpm run bootstrap`.
* `ai-template/scripts/bootstrap.ts` creates `.ai-runtime-data`.
* `scripts/verify-w1t1.mjs` runs `pnpm install`, `pnpm typecheck`,
  `pnpm test`, `pnpm build` and `pnpm lint` through shell execution.
* `ai-template/scripts/validate-testing-profiles.mjs` executes child Node
  scripts as part of validation, which is legitimate but must be classified.
* `ai-template/generators/create-ai-native-app.mjs` supports a `--dry-run`
  path and otherwise writes a generated project to a destination directory.
* `ai-knowledge` has no `package.json`; package-level script policy is not
  uniform across repositories.

Without P0-T2, an agent can accidentally treat a package-level validation as
read-only even when it may install dependencies, run lifecycle hooks, create
directories, update lockfiles, write logs, generate projects or leave a dirty
working tree.

## Desired Result

Audit-Safe Script Mode means that an audit or validation flow can inspect,
classify and, where authorized, execute scripts while preserving repository
state, deterministic evidence and explicit side-effect boundaries.

A command or flow operates audit-safe only when:

* its inputs and working directory are explicit;
* lifecycle hooks and transitive scripts are known or blocked;
* expected writes are declared before execution;
* unexpected working-tree mutations are detected;
* temporary files, caches, logs and generated artifacts are isolated or cleaned;
* dependency installation and lockfile mutation are blocked unless explicitly
  authorized;
* evidence records what ran, what was skipped and why;
* final repository state is checked and reported.

## Normative Definition

The future implementation MUST provide an Audit-Safe Script Mode contract that
classifies package-level and direct script execution before running them.

The future implementation MUST NOT execute install, setup, bootstrap, prepare,
preinstall, postinstall or equivalent lifecycle behavior during an audit unless
the command is explicitly allowlisted for that audit and its side effects are
declared.

The future implementation MUST distinguish direct, single-purpose validators
from package-level scripts that may trigger lifecycle hooks or recursive
package-manager behavior.

The future implementation MUST preserve a baseline of each affected repository
working tree before executing any authorized dynamic command.

The future implementation MUST classify final outcomes as `PASS`, `FAIL`,
`BLOCKED`, `NOT_RUN`, `NOT_APPLICABLE` or `CONTEXTUAL_NON_BLOCKING`.

The future implementation SHOULD prefer dry-run, parse-only, direct Node
validator and static inspection paths when they provide sufficient evidence.

The future implementation MAY execute controlled smoke validators that spawn
child scripts only when those child scripts are local, deterministic and have
documented side-effect expectations.

## Scope

In scope:

* Canonical definition of Audit-Safe Script Mode.
* Rules for package-level script execution during audits.
* Rules for lifecycle hooks, install commands, setup commands and recursive
  scripts.
* Working-tree baseline and mutation detection.
* Temporary file, log, cache and generated-artifact isolation requirements.
* Dependency installation and lockfile mutation policy.
* Input and output contract for future audit-safe execution.
* Expected result states and mandatory evidence.
* Acceptance, blocking and closure criteria for future P0-T2 implementation.
* Compatibility requirements for root/governance, `ai-foundation`,
  `ai-knowledge` and `ai-template`.

Out of scope:

* Implementing Audit-Safe Script Mode.
* Modifying product scripts.
* Changing `package.json`, lockfiles or dependencies.
* Executing package-level scripts as part of this specification task.
* Opening H9.
* Creating `ENTERPRISE-10-10-V2`.
* Starting the first real application.
* Reopening H1-H8.
* Reopening P0-T1.
* Declaring professional 10/10 readiness.
* Declaring production-critical readiness.
* Pushing to remotes or creating a PR.

## Consumers

Consumers:

* Factory agents that need to decide whether a validation command is safe to
  run during audits.
* Builder and Inspector roles during SDD execution.
* Governance closure flows that need evidence without hidden side effects.
* Future generated-project validation policy, only after explicit
  implementation work.

## Execution Modes

P0-T2 MUST define behavior, not prescribe a single mechanism prematurely.

The future implementation MAY use one or more of:

* an environment variable such as `AI_NATIVE_AUDIT_SAFE=1`;
* a wrapper command;
* a validation manifest;
* package-script allowlist metadata;
* direct command flags such as `--dry-run`;
* a static script classifier.

Regardless of mechanism, the observable behavior MUST include:

* normal mode: existing script behavior remains available outside audit-safe
  mode;
* audit-safe mode: risky lifecycle, install, setup, network, generated-output
  and working-tree mutation paths are blocked unless explicitly authorized;
* dry-run or inspect-only mode: available when a command can prove intent
  without writes.

## Functional Requirements

FR-001: The implementation MUST inventory relevant scripts for the selected
repository before execution, including direct scripts, package scripts,
lifecycle hooks and scripts that invoke other scripts.

FR-002: The implementation MUST classify each candidate command as one of:
`STATIC_ONLY`, `DIRECT_VALIDATOR`, `CONTROLLED_DYNAMIC`, `PACKAGE_LEVEL`,
`INSTALL_OR_LIFECYCLE`, `GENERATOR`, `NETWORK_OR_SECRET`, `DESTRUCTIVE` or
`UNKNOWN`.

FR-003: The implementation MUST block `UNKNOWN`, `DESTRUCTIVE`,
`NETWORK_OR_SECRET` and `INSTALL_OR_LIFECYCLE` commands in audit-safe mode
unless an explicit task-level approval and side-effect declaration exists.

FR-004: The implementation MUST allow static parsing of JSON, Markdown and
script metadata when no writes are required.

FR-005: The implementation MUST allow direct Node validators only when their
expected side effects are `none` or explicitly declared and isolated.

FR-006: The implementation MUST require a pre-run baseline containing branch,
HEAD, `git status --short`, `git diff --stat` and `git diff --check` for every
affected repository.

FR-007: The implementation MUST capture post-run branch, HEAD,
`git status --short`, `git diff --stat` and `git diff --check`.

FR-008: The implementation MUST fail or block closure when unexpected
working-tree mutations remain after cleanup.

FR-009: The implementation MUST record every skipped script with the reason it
was skipped.

FR-010: The implementation MUST record every executed command, working
directory, mode, exit code, relevant stdout/stderr summary and evidence path.

FR-011: The implementation MUST support repository-specific applicability:
root/governance has package scripts, `ai-foundation` has package scripts,
`ai-knowledge` currently has no `package.json`, and `ai-template` has package
scripts plus lifecycle and generator behavior.

FR-012: The implementation MUST expose result states that are machine-readable
and usable by governance evidence.

## Non-Functional Requirements

NFR-001: Audit-safe behavior MUST be deterministic for the same repository
state, command classification and inputs.

NFR-002: Audit-safe evidence MUST be reproducible enough for another agent to
rerun or inspect the same command decision.

NFR-003: Audit-safe checks MUST minimize network, dependency, environment and
machine-local assumptions.

NFR-004: The implementation MUST be conservative when command safety cannot be
proven.

NFR-005: The implementation MUST avoid broad rewrites and preserve existing
normal-mode developer workflows unless explicitly changed by a future task.

NFR-006: The implementation SHOULD use stable, parseable evidence formats when
recording command decisions.

## Security Requirements

SEC-001: Audit-safe mode MUST NOT expose secrets, print secret values or require
secret-bearing environment variables for audit-only validation.

SEC-002: Audit-safe mode MUST treat network access as blocked by default unless
the current task explicitly authorizes it.

SEC-003: Audit-safe mode MUST treat dependency installation, lifecycle hooks and
postinstall behavior as supply-chain risk surfaces.

SEC-004: Audit-safe mode MUST NOT weaken existing validators, security checks or
governance gates to obtain a pass.

SEC-005: Audit-safe mode MUST NOT execute shell scripts or package-manager
commands found through transitive invocation without classification.

## Reproducibility Requirements

REP-001: Evidence MUST include repository path, branch, HEAD and command input.

REP-002: Evidence MUST distinguish static inspection from dynamic execution.

REP-003: Evidence MUST identify any environment variable or flag used to enable
audit-safe behavior.

REP-004: Evidence MUST record whether dependencies were assumed present,
installed, skipped or blocked.

REP-005: Evidence MUST record if CRLF/LF warnings are present and whether
`git diff --check` remains clean.

## Determinism Requirements

DET-001: Static classification MUST produce the same output for the same file
contents.

DET-002: Dynamic validators allowed in audit-safe mode MUST have stable expected
outputs or explicitly documented nondeterminism.

DET-003: Generated paths, temporary paths and cache paths MUST be deterministic
or recorded in evidence.

DET-004: The implementation MUST NOT rely on chat history or external memory to
decide command safety.

## Side-Effect Isolation Requirements

ISO-001: Expected writes MUST be declared before execution.

ISO-002: Temporary files MUST be written under an explicit task-owned directory,
preferably outside product repositories when possible.

ISO-003: Logs, caches and runtime data MUST be either isolated, ignored by git
with justification, or cleaned before closure.

ISO-004: Generated projects MUST be created only in explicitly provided
temporary destinations and MUST be cleaned or reported as retained evidence.

ISO-005: Persistent processes MUST NOT be left running after audit-safe
execution.

ISO-006: Writes outside the selected repository or task-owned temp directory
MUST be blocked unless explicitly authorized.

## Working Tree Requirements

WT-001: Audit-safe execution MUST start from a known working-tree baseline.

WT-002: If the baseline is dirty, the implementation MUST classify it as
preexisting and stop unless the current task explicitly authorizes proceeding.

WT-003: Expected mutations MUST be declared before execution and verified after
execution.

WT-004: Unexpected mutations MUST produce `FAIL` or `BLOCKED` and MUST NOT be
hidden by automatic restore.

WT-005: Cleanup MAY restore task-owned temporary artifacts, but MUST NOT delete
unrelated user changes.

WT-006: Final evidence MUST include `git status --short`, `git diff --stat` and
`git diff --check` for affected repositories.

## Temporary Files, Logs, Caches And Artifacts

TMP-001: `.ai-runtime-data`, `logs`, `docs/incidents`, generated project
directories and package-manager caches are side-effect surfaces.

TMP-002: Audit-safe mode MUST declare whether these paths are read, written,
ignored, cleaned or blocked.

TMP-003: Evidence artifacts MUST be written only to governance/spec evidence
locations or task-owned temporary paths.

TMP-004: Cleanup failures MUST be reported as `FAIL` or
`CONTEXTUAL_NON_BLOCKING` with justification.

## Dependency And Installation Policy

DEP-001: `pnpm install`, `npm install`, setup scripts and package-manager
commands that can mutate dependencies or lockfiles MUST be blocked in
audit-safe mode by default.

DEP-002: Lockfile generation or mutation MUST be treated as a repository
mutation requiring explicit task authorization.

DEP-003: Existing installed dependencies MAY be used for direct validators only
when no install or lifecycle command is triggered.

DEP-004: Missing dependencies SHOULD produce `BLOCKED` or `NOT_RUN` rather than
triggering an implicit install.

DEP-005: `pnpm-workspace.yaml` build approvals, such as the existing
`ai-foundation` `allowBuilds.sharp`, MUST be considered supply-chain evidence,
not blanket permission to run lifecycle scripts during audits.

## Package-Level Script Policy

Package-level scripts are scripts executed through a package manager such as
`pnpm run`, `npm run`, `pnpm install`, `npm test`, `npm build` or equivalent.

Policy:

* Direct parse commands such as JSON parsing MAY run when they do not invoke
  package-manager lifecycle behavior.
* Direct Node validators MAY run when inspected or already known to be local
  and when working-tree baseline and post-checks are captured.
* Package-level aggregate scripts MAY run only when their transitive command
  graph is classified and allowed.
* `prepare`, `preinstall`, `install`, `postinstall`, `setup`, `bootstrap` and
  equivalent lifecycle hooks MUST be blocked by default in audit-safe mode.
* Recursive scripts, including package scripts that invoke other package
  scripts, MUST be expanded or blocked.
* Scripts that create directories, write files, install dependencies, start
  servers, access network, require secrets or generate projects MUST be
  classified as dynamic and require explicit side-effect handling.
* Running from workspace root MUST NOT imply permission to execute scripts in
  nested product repositories.
* Running from an individual package MUST NOT imply permission to execute root
  or workspace scripts.

Compatibility notes from local evidence:

* `ai-template` has legitimate validators, but also `prepare`, `setup` and
  `bootstrap` side effects.
* `ai-template` generator writes only when not in `--dry-run`; audit-safe mode
  SHOULD prefer dry-run unless generated output is explicitly part of the task.
* `ai-foundation` has validation scripts and a historical pnpm setup, but no
  lifecycle hooks were found in `package.json`.
* `ai-knowledge` currently has no `package.json`, so package-level scripts are
  not applicable there unless added later.
* root/governance has package scripts and a historical verifier that runs
  `pnpm install`; this MUST be treated as unsafe for audit-safe mode unless
  explicitly authorized.

## Commands That Modify Repositories

Commands that may modify repositories include, but are not limited to:

* dependency installation;
* lockfile generation;
* formatter or fixer commands;
* generators without dry-run;
* bootstrap scripts;
* prepare or postinstall hooks;
* scripts that write governance or roadmap files;
* cleanup commands that delete tracked or untracked paths.

Audit-safe mode MUST either block these commands or require explicit expected
mutation declarations and final diff evidence.

## Restoration And Cleanup

REST-001: Audit-safe mode MUST NOT silently restore tracked files to hide
unexpected changes.

REST-002: If cleanup is needed, the evidence MUST state what was cleaned and
why it was safe.

REST-003: Cleanup MUST be limited to task-owned temp paths or explicitly
declared expected artifacts.

REST-004: If cleanup cannot safely complete, closure MUST remain blocked or
contextual with explicit risk acceptance.

## Execution Contract

Inputs:

* repository path;
* command or script name;
* invocation mode: `static`, `dry-run`, `direct-validator`,
  `package-level`, `generator` or `blocked`;
* allowed side effects;
* expected temporary paths;
* expected output evidence paths;
* task ID and governance reference.

Preconditions:

* governance confirms the current task;
* repository baseline is captured;
* command classification is complete;
* lifecycle and transitive scripts are known or blocked;
* no unexplained dirty working tree exists.

Observable steps:

1. Inspect command metadata.
2. Classify risk.
3. Capture baseline.
4. Execute only if allowed.
5. Capture output and exit code.
6. Capture final git state.
7. Compare expected and actual side effects.
8. Produce machine-readable and human-readable evidence.

Outputs:

* result state;
* executed/skipped command list;
* side-effect classification;
* baseline and final git state;
* cleanup status;
* evidence paths;
* residual risks.

Expected result states:

* `PASS`: command ran or static validation completed with expected state.
* `FAIL`: command ran and failed, or unexpected mutation occurred.
* `BLOCKED`: command was not safe or prerequisites were missing.
* `NOT_RUN`: command was relevant but intentionally not executed.
* `NOT_APPLICABLE`: command does not apply to the repository or task.
* `CONTEXTUAL_NON_BLOCKING`: issue exists but closure policy allows it with
  explicit explanation.

Interruption behavior:

* On interruption, recovery MUST start with git status, command evidence and
  task-owned temp paths.
* Any partial side effects MUST be reported.
* No automatic continuation may assume cleanup succeeded without evidence.

## Required Evidence

Minimum evidence:

* instruction gate result;
* governance task eligibility;
* repository baseline;
* script inventory and classification;
* package-level and lifecycle hook inventory;
* executed command list;
* skipped command list with reasons;
* side-effect declaration;
* final repository state;
* cleanup result;
* validation result states;
* Inspector result;
* no-push confirmation.

## Validation Expectations

Future implementation validation MUST include:

* static parse of any machine-readable contract;
* static classification tests for package scripts and direct validators;
* audit-safe dry-run path for generator-like commands;
* blocked execution tests for `prepare`, `preinstall`, `install`,
  `postinstall`, `setup` and `bootstrap` where present;
* detection of working-tree mutations;
* idempotence/repeatability checks for classification output;
* `git diff --check`;
* final working-tree cleanliness checks;
* negative checks that H9 is not opened, `ENTERPRISE-10-10-V2` is not created
  and no first real application is started.

This specification task validates only the specification and contract. It does
not validate an implementation that does not yet exist.

## Acceptance Criteria

AC-001: A future agent can identify which scripts are safe, blocked or require
explicit authorization during audits.

AC-002: The specification defines canonical Audit-Safe Script Mode behavior
without requiring a premature implementation mechanism.

AC-003: Package-level scripts, lifecycle hooks and transitive scripts have a
verifiable policy.

AC-004: Working-tree baseline, mutation detection and cleanup requirements are
explicit.

AC-005: Dependency installation, lockfile mutation, temp files, logs, caches,
generated artifacts, network access and persistent processes are covered.

AC-006: Input/output contract and result states are defined.

AC-007: Validation expectations are concrete and do not require unavailable
tools without future task justification.

AC-008: P0-T1, H1-H8, `ENTERPRISE-10-10-V1`, `ENTERPRISE-10-10-V2`, H9 and the
first real application states are preserved.

## Blocking Criteria

Future P0-T2 implementation MUST block if:

* governance does not confirm P0-T2 or the implementation task;
* the working tree has unexplained preexisting changes;
* command classification is incomplete;
* a lifecycle or install command must run without explicit approval;
* expected side effects cannot be bounded;
* dependency installation or lockfile mutation is required but not authorized;
* H9, `ENTERPRISE-10-10-V2` or the first real application would need to open;
* implementation would require weakening validators or bypassing security
  controls;
* final working-tree state cannot be verified.

## Closure Criteria

P0-T2 implementation may close locally only when:

* Audit-Safe Script Mode behavior is implemented according to this spec;
* script classification evidence exists;
* lifecycle and package-level blocking behavior is validated;
* working-tree mutation detection is validated;
* validations pass or residual risks are explicitly classified;
* Inspector emits PASS or approved contextual findings;
* commits are local and auditable;
* no push is performed unless separately authorized;
* HITL remains required until explicitly approved.

This specification task may close locally when this spec, plan, task checklist,
verification evidence, inspector review and contract are versioned and validated.

## Known Risks

* A future implementation may over-block legitimate validators and slow audit
  workflows.
* A future implementation may under-classify aggregate package scripts that
  execute nested commands.
* Windows LF/CRLF metadata can create noisy status signals; audit-safe evidence
  must distinguish warnings from material diffs.
* Existing installed dependencies can mask unsafe install assumptions.
* Generated project smoke tests can be valuable but must use isolated temp
  destinations.

## Repository Compatibility

root/governance:

* Must support static governance/spec validation and direct Node parse checks.
* Must treat historical `pnpm install` verifier paths as unsafe in audit-safe
  mode unless explicitly authorized.

`ai-foundation`:

* Must support direct validators such as target-repo-security and structure
  checks when classified.
* Must treat package-manager install/build behavior as dynamic.

`ai-knowledge`:

* Currently has no `package.json`; package-level script policy is
  `NOT_APPLICABLE` until such a file exists.
* Direct Node validators remain classifiable command surfaces.

`ai-template`:

* Must classify validators, generator dry-run, generator write mode,
  `prepare`, `setup`, `bootstrap`, tests and aggregate validation separately.
* Must not treat `prepare` as safe because it creates runtime/log/incident
  directories.

## Boundaries Against Future Tasks

P0-T2 does not implement generated project onboarding, H9, V2, a first real
application, production-critical deployment or a full sandbox runner unless a
future governance task explicitly authorizes that scope.

After HITL approval of this specification, the next execution may implement
P0-T2 - Audit-Safe Script Mode using this contract as the source of intent.
