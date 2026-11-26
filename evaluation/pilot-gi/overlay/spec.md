# Acceptance pilot: Locales and Regions on PostgreSQL

Status: pilot overlay of AI-NATIVE v4.1.0 (spec 003 RF-6, RF-14 to RF-17).
It is written only into a disposable copy of `gi-common-reference` at a pinned
SHA by `evaluation/pilot-gi/run-pilot.mjs`; it is never committed to, pushed
to or published in any GI repository.

## Goal

Prove Native Acceptance on the GI reference catalog: Regions consumes Locales
through the shared PostgreSQL schema (foreign keys), not through HTTP.

## Requirements

RF-1. THE SYSTEM SHALL persist incorporated Locales and Regions snapshots and
serve them through the public read interface.

RF-2. THE SYSTEM SHALL model Regions -> Locales as same-database foreign keys;
a nonexistent locale reference SHALL be rejected by referential integrity and
leave the database unchanged.

RF-3. THE SYSTEM SHALL resolve Regions names by `locale_id` and reject an
unknown `locale_id` distinctly from an unknown entity.

RF-4. THE SYSTEM SHALL reach the same state for the same inputs on freshly
reset databases, and a resubmitted snapshot SHALL change nothing.

RF-5. THE SYSTEM SHALL keep simulated checks (no database) and in-process API
checks (FastAPI TestClient, no socket) labelled apart from real PostgreSQL
integration; no check is HTTP-socket end-to-end.

## Acceptance criteria

- AC-1 (RF-1): Locales and Regions written to a real disposable PostgreSQL are
  read back through the public API; a rejected snapshot leaves the state
  identical.
- AC-2 (RF-2): the region-locale foreign key points to the locale identity; a
  nonexistent locale reference is rejected and nothing is written.
- AC-3 (RF-3): region names resolve by `locale_id`; an unknown `locale_id` is
  422 `unknown_locale`, an unknown region is 404.
- AC-4 (RF-4): two fresh databases reach the same normalized state and row
  counts; resubmitting a snapshot is a no-op.
- AC-5 (RF-5): simulated and in-process checks are labelled as such; the API
  answers without opening a network socket.
