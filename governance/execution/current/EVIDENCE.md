# EVIDENCE

Product commits:

* ai-foundation: `1c09bf1`
* ai-knowledge: `361d54d`
* ai-template: `dea11b6`

Primary product artifacts:

* `ai-foundation/_deprecated/2026-06-11/legacy-inventory.md`
* `ai-foundation/_deprecated/2026-06-11/legacy-inventory.contract.json`
* `ai-knowledge/_deprecated/2026-06-11/legacy-inventory.md`
* `ai-knowledge/_deprecated/2026-06-11/legacy-inventory.contract.json`
* `ai-template/_deprecated/2026-06-11/legacy-inventory.md`
* `ai-template/_deprecated/2026-06-11/legacy-inventory.contract.json`

Validation artifacts:

* `ai-foundation/scripts/validate-legacy-inventory.mjs`
* `ai-knowledge/scripts/validate-legacy-inventory.mjs`
* `ai-template/scripts/validate-legacy-inventory.mjs`

Legacy inventory scope:

* inventory defined for deprecated surfaces in all three product repos
* ownership map documented per repo
* classification model documented per repo
* machine-readable artifact generated per repo
* W8-T2 kept unopened and not closed

Non-goals preserved:

* no legacy deletion
* no legacy move
* no runtime operation or activation
* no workflow modification
* no pipeline modification
* no remote configuration modification
* no VERSION modification
* no W8-T2 opening
* no W8-T2 closure
* no W8+ future task closure

Previous push context:

* W6-T3 through W7-T7 pushes were `CONTEXTUAL_NON_BLOCKING` due external
  policy/unverified remote.

Engram pre-task context:

* `engram stats` and `engram context ai-native` completed.
* `engram context ai-native` recovered W7-T7 operational and push-attempt
  checkpoints in recent observations.
* Exact W7-T7 push-attempt search recovered checkpoint `#61`.
* One W7-T7 operational search was policy-blocked and one W7-T6 exact search
  returned no memories; both were treated as `CONTEXTUAL_NON_BLOCKING` because
  git/governance local state remained the source of truth.
