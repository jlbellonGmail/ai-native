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

RF-4. THE SYSTEM SHALL support a controlled v3.x-to-v4 upgrade that preserves
project-owned files, fails without data loss, supports rollback and is idempotent.

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

## Non-goals

Do not modify real GI repositories, merge branches, publish a release/tag,
weaken `develop` policy or claim an OpenCode review is attested.

## Acceptance criteria

Command/adapters/dispatcher tests, upgrade fixtures, gate-negative tests and an
isolated real pilot meet their declared evidence states; a draft PR is prepared
only after final validation and review status are truthful.
