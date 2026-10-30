# Acceptance integration and compatibility

Status: draft
human_gate: required
autonomy: full

## Goal

Expose Native Acceptance through platform commands, consumer-compatible upgrade,
quality-gate integration and a reproducible GI reference pilot before independent
review and a draft PR.

## Requirements

RF-1. THE SYSTEM SHALL expose `/acceptance <feature-or-module>` through the
existing command catalog, adapters and runtime dispatcher without creating a
parallel workflow.

RF-2. WHEN a provider public contract changes, THE SYSTEM SHALL select affected
known consumers from the graph and run their required cross checks once each.

RF-3. IF mandatory acceptance is FAIL or BLOCKED, THEN quality consolidation
SHALL prevent acceptance approval while preserving existing technical, SDD,
review and HITL gates.

RF-4. THE SYSTEM SHALL support a controlled admitted-v3.x-to-v4 upgrade that
preserves project-owned files, fails without data loss, supports rollback and is
idempotent.

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

RF-9. THE SYSTEM SHALL admit v3.4.2 and v3.4.3 only when their lock has schema
version 1, the observed v3.4.x lock structure, bootstrap protocol 1 and the
`upgrade` capability; each admitted release shall have an individual real-shape
lock/protocol fixture.

RF-10. IF a source lock/version/protocol is absent, malformed, unknown, future,
or outside the admitted matrix, THEN THE SYSTEM SHALL reject it before any
consumer file, index or cache state is modified.

RF-11. WHEN upgrading an admitted v3.x consumer, THE SYSTEM SHALL preserve
project-owned files byte-for-byte, preserve existing managed-file edits according
to the current keep-local policy, and report every preserved collision or drift.

RF-12. IF an upgrade write, adapter projection, verification or migration step
fails, THEN THE SYSTEM SHALL restore the pre-upgrade working tree/index state or
report `ROLLBACK_INCOMPLETE` with the exact remaining paths; it shall never
report READY after partial restoration.

RF-13. WHEN the same verified v4 bundle is applied twice to an unchanged
admitted v3.x fixture, THE SYSTEM SHALL produce the same managed state on the
second run without deleting project-owned files or creating duplicate artifacts.

## Non-goals

Do not modify real GI repositories, merge branches, publish a release/tag,
weaken `develop` policy, or claim an OpenCode review is attested. This first v4
upgrade scope does not silently admit every structurally similar v3 release.

## Acceptance criteria

Command/adapters/dispatcher tests, explicit matrix fixtures, gate-negative tests
and an isolated real pilot meet their declared evidence states; a draft PR is
prepared only after final validation and review status are truthful.
