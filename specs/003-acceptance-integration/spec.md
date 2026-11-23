# Acceptance integration and compatibility

Status: draft
human_gate: required
autonomy: full

## Goal

Make Native Acceptance an automatic, mandatory phase of the existing SDD circuit
(no separate request from the developer), enforce it in feature closure, the
independent review and HITL, ship it through a consumer-compatible upgrade from
the v4.0.x line, and prove it end-to-end on an isolated consumer and on the GI
reference pilot before a draft PR. Base: AI-NATIVE v4.0.2.

## Requirements

RF-1. THE SYSTEM SHALL activate acceptance inside the existing SDD commands
without a parallel workflow or new slash command: `/sdd-spec` requires `AC-n`
criteria, `/sdd-tasks` emits the acceptance tasks, and `/sdd-implement-all`
runs a feature-level acceptance stage after its task loop and before its
review loop. Re-runs and
manual use go through the existing `sdd` dispatcher
(`ai-native sdd acceptance plan|run|manual|status <slug>`).

RF-2. WHEN a provider public contract changes, THE SYSTEM SHALL select affected
known consumers from the graph and run their required cross checks once each.

RF-3. IF mandatory acceptance is FAIL or BLOCKED, THEN quality consolidation
SHALL prevent acceptance approval while preserving existing technical, SDD,
review and HITL gates.

RF-4. THE SYSTEM SHALL support a controlled upgrade to v4.1.0 from exactly the
admitted releases v4.0.1, v4.0.2, v3.4.2 and v3.4.3 that preserves project-owned files, fails without
data loss, supports rollback and is idempotent.

RF-5. THE SYSTEM SHALL document architecture, manifest, command, evidence,
quality gates, migration, pilot limits and release handoff without claiming a
release.

RF-6. THE SYSTEM SHALL execute the GI reference pilot from an isolated copy,
with Locales and Regions public scenarios, compatible/incompatible provider data,
consumer impact, restoration, evidence and stale-evidence checks; unavailable
external requirements shall be reported BLOCKED.

RF-7. THE SYSTEM SHALL obtain an independent, runtime-attested review of the
final revision when the verified Claude capability is available; otherwise it
shall report REVIEW_PENDING and retain HITL.

RF-8. THE SYSTEM SHALL encode a version compatibility matrix from inspected v3
release artifacts, including lock schema identity, bootstrap protocol and upgrade
engine availability, rather than infer compatibility from a version prefix.

RF-9. THE SYSTEM SHALL admit v4.0.1, v4.0.2, v3.4.2 and v3.4.3 only when their
lock has schema version 1, the observed lock structure, bootstrap protocol 1 and
the `upgrade` capability; each admitted release shall have an individual
real-shape lock/protocol fixture, and the v3.4.x -> v4.1.0 path shall report
the MAJOR crossing explicitly.

RF-10. IF a source lock/version/protocol is absent, malformed, unknown, future,
or outside the admitted matrix, THEN THE SYSTEM SHALL reject it before any
consumer file, index or cache state is modified.

RF-11. WHEN upgrading a consumer from any admitted source release (RF-9), THE SYSTEM SHALL preserve
project-owned files byte-for-byte, preserve existing managed-file edits according
to the current keep-local policy, and report every preserved collision or drift.

RF-12. IF an upgrade write, adapter projection, verification or migration step
fails, THEN THE SYSTEM SHALL restore the pre-upgrade working tree/index state or
report `ROLLBACK_INCOMPLETE` with the exact remaining paths; it shall never
report READY after partial restoration.

RF-13. WHEN the same verified v4.1.0 bundle is applied twice to an unchanged
fixture of any admitted source release, THE SYSTEM SHALL produce the same managed state on the
second run without deleting project-owned files or creating duplicate artifacts.

RF-14. THE SYSTEM SHALL model the GI Regions -> Locales dependency as PostgreSQL
data consumption with foreign keys in the shared schema, not as an HTTP API
dependency.

RF-15. THE GI pilot SHALL verify persisted writes and public reads for Locales
and Regions against real disposable PostgreSQL, including FK integrity and
Regions resolution by `locale_id`.

RF-16. THE GI pilot SHALL exercise valid locale references, invalid/nonexistent
locale references rejected by referential integrity, and repeat the relevant
acceptance tests against the same deterministic fixture state.

RF-17. THE GI pilot SHALL label mock/fake/ASGI-only checks as simulated or
in-process and PostgreSQL-backed execution as real database integration; it
SHALL NOT describe the latter as HTTP-socket E2E unless a real socket is used.

RF-18. THE SYSTEM SHALL classify each feature as acceptance REQUIRED when its
spec declares acceptance criteria, or NOT_APPLICABLE only through an explicit
`acceptance: not-applicable` declaration with a justification citing its
requirements, which forces `human_gate: required` and is pending approval
under 002 RF-35. A feature not listed in the
legacy cutoff recorded by the upgrade (the feature slugs existing at upgrade
time) and having neither SHALL be BLOCKED at closure and review regardless of
level; `sdd validate` at level `full` SHALL fail for it, while level `normal`
keeps the v4.0.2 warning and exit code. Legacy features keep v4.0.2 behavior
until a human removes them from the cutoff. Adding a slug to the cutoff after
the upgrade is a DOWNGRADE (002 RF-25). In this factory repository the cutoff
is every `specs/` slug present at the v4.1.0 merge base except 001, 002 and
003.

RF-19. IF mandatory acceptance is not PASS at the evaluated revision (FAIL,
BLOCKED, STALE or NOT_RUN), THEN `/sdd-implement-all` SHALL NOT return DONE,
the review-ledger validation SHALL NOT be PASS and the review outcome SHALL NOT
be APPROVED; a free-text `--command` validation run SHALL NOT count toward
acceptance. When the only obstacle is a pending N/A or DOWNGRADE approval (002
RF-35), the result is the existing `NEEDS_HUMAN_DECISION` in `implement-all`,
the review outcome and the Coordinator. Feature acceptance runs once per feature after the task loop and
before the review loop. The stage SHALL be a platform-owned step that invokes
the 002 runner itself and reads the result from the acceptance ledger; it
SHALL NOT be an injectable callback or agent hook, and `/sdd-implement-all`,
`validationOf` and `deriveReviewOutcome` SHALL derive acceptance status from
the runner-written ledger entry for the evaluated revision (local) or from the
trusted CI verdict (merge, 002 RF-31), never from a return value supplied by an
agent, a callback or a test double. A stage result without such an entry SHALL
be BLOCKED. Correcting the defect and re-running SHALL be able to restore PASS.

RF-20. THE SYSTEM SHALL include in the independent review packet the acceptance
plan, applicability matrix and N/A justifications, DOWNGRADE findings,
evidence summary and traceability report, bound to the reviewed revision.

RF-21. THE SYSTEM SHALL prove the circuit end-to-end on an isolated, disposable
consumer created from the candidate bundle: a normal feature run with no
acceptance-specific instructions shall show criteria detection, generated
applicable cases and datasets, automatic execution, detection of a seeded real
defect, closure blocked by FAIL, PASS after the fix, the rendered manual,
verifiable evidence, independent review and HITL request; a substituted trivial
validation (`node -e 0`) and a silent DOWNGRADE attempt shall both be refused.

## Non-goals

Do not modify real GI repositories, merge branches, publish a release/tag,
weaken `develop` policy, change audit weights/thresholds, add `/acceptance`,
`/goal` or `/loops` slash commands, or claim an OpenCode review is attested.
The upgrade scope does not silently admit every structurally similar release.

## Acceptance criteria

Command/adapters/dispatcher tests, explicit matrix fixtures, gate-negative tests
and an isolated real pilot meet their declared evidence states. The pilot proves
database persistence/read, FK integrity, `locale_id` resolution, valid/invalid
references and repeatability, with simulated and PostgreSQL integration evidence
clearly separated. A draft PR is prepared only after final validation and review
status are truthful.

- AC-1 (RF-1, RF-18): command-catalog, projection and dispatcher tests show the
  acceptance phase wired into existing commands with no new slash command, and
  the REQUIRED / NOT_APPLICABLE / missing classification per level.
- AC-2 (RF-3, RF-19): FAIL, BLOCKED, STALE and NOT_RUN acceptance each prevent
  DONE and APPROVED; a `--command "node -e 0"` run does not count; an injected
  stage, callback or agent returning PASS without a runner-written ledger entry
  for the evaluated revision is BLOCKED.
- AC-3 (RF-20): the review packet of a fixture feature contains every
  acceptance element bound to the reviewed revision.
- AC-4 (RF-21): the end-to-end consumer evidence shows all ten observations and
  both refused bypass attempts.
- AC-5 (RF-4, RF-8 to RF-13): individual fixtures for v4.0.1, v4.0.2, v3.4.2
  and v3.4.3 each prove admission, preservation, rollback and idempotence;
  v4.0.0, v3.4.1 and unknown/malformed sources are rejected before writes; the
  v3.4.x paths report the MAJOR crossing.
- AC-6 (RF-2, RF-5, RF-6, RF-7, RF-14 to RF-17): impact selection runs each
  affected consumer once; the docs make no release claim; the GI pilot proves
  the PostgreSQL/FK behaviors with simulated and real evidence separated; the
  final review is attested or REVIEW_PENDING.
