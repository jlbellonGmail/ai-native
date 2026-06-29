# EVIDENCE

W8-T1 gate:

* root governance commit verified: `312c813`
* ai-foundation W8-T1 commit verified: `1c09bf1`
* ai-knowledge W8-T1 commit verified: `361d54d`
* ai-template W8-T1 commit verified: `dea11b6`
* Engram operational checkpoint `#63` verified.
* Engram push-attempt checkpoint `#64` direct search was policy-blocked and
  treated as `CONTEXTUAL_NON_BLOCKING` under the local Engram operating rule:
  git/governance local state remains source of truth when Engram fails.

Product commits:

* ai-foundation: `93ad4be`
* ai-knowledge: `1e35776`
* ai-template: `43b11c2`

Primary product artifacts:

* `ai-foundation/_deprecated/2026-06-11/historical-archive.md`
* `ai-foundation/_deprecated/2026-06-11/historical-archive.contract.json`
* `ai-knowledge/_deprecated/2026-06-11/historical-archive.md`
* `ai-knowledge/_deprecated/2026-06-11/historical-archive.contract.json`
* `ai-template/_deprecated/2026-06-11/historical-archive.md`
* `ai-template/_deprecated/2026-06-11/historical-archive.contract.json`

Validation artifacts:

* `ai-foundation/scripts/validate-historical-archive.mjs`
* `ai-knowledge/scripts/validate-historical-archive.mjs`
* `ai-template/scripts/validate-historical-archive.mjs`

Historical archive scope:

* archive policy defined per repo
* retention model documented per repo
* archival contract generated per repo
* archived material retained in place
* W8-T3 kept unopened and not closed

Non-goals preserved:

* no legacy deletion
* no legacy move
* no runtime operation or activation
* no workflow modification
* no pipeline modification
* no remote configuration modification
* no VERSION modification
* no W8-T3 opening
* no W8-T3 closure
* no W8+ future task closure

Previous push context:

* W6-T3 through W8-T1 pushes were `CONTEXTUAL_NON_BLOCKING` due external
  policy/unverified remote.
