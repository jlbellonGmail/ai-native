# Deprecated Content

Content in this folder was moved out of the active product surface during the
ENTERPRISE-10-10 structural realignment on 2026-06-11.

Reasons:

* hidden `.ai-*` folders duplicated active `runtime/`, `roles/` or
  `observability/` product folders
* local tool rules were not part of the clean foundation product surface
* ambiguous legacy material is recoverable here instead of being deleted

Do not consume files from this folder in runtime code.

## W8-T1 Legacy Inventory

W8-T1 records this deprecated surface as retained legacy material. The
inventory is descriptive only: no file is deleted, restored, or promoted to the
active product surface.

Artifacts:

* `legacy-inventory.md` documents the inventory, ownership map, classification
  model, and guardrails for this repository.
* `legacy-inventory.contract.json` provides the machine-readable inventory used
  by `scripts/validate-legacy-inventory.mjs`.

The next eligible roadmap task remains W8-T2. W8-T2 is not opened or closed by
this inventory.

## W8-T2 Historical Archive

W8-T2 defines this deprecated surface as a retained in-place historical archive.
The archive policy does not delete files, move files, activate legacy runtime
paths, or change active product behavior.

Artifacts:

* `historical-archive.md` documents the archive policy, retention model,
  archival contract, and continuity guardrails for this repository.
* `historical-archive.contract.json` provides the machine-readable archive
  policy used by `scripts/validate-historical-archive.mjs`.

The next eligible roadmap task is W8-T3. W8-T3 is not opened or closed by this
archive policy.

## W8-T3 Duplicate Detection

W8-T3 classifies duplicate and overlap patterns in this deprecated foundation
surface without deleting, moving, or promoting archived files.

Artifacts:

* `duplicate-detection.md` documents duplication rules, classification report,
  and non-action guardrails for this repository.
* `duplicate-detection.contract.json` provides the machine-readable duplicate
  detection contract used by `scripts/validate-duplicate-detection.mjs`.

The next eligible roadmap task is W8-T4. W8-T4 is not opened or closed by this
duplicate detection report.

## W8-T4 Obsolete Artifacts

W8-T4 defines obsolete artifact policy, deprecation model, and lifecycle rules
for this deprecated foundation surface. Obsolete artifacts remain retained in
place; no runtime deletion, physical movement, or promotion is performed.

Artifacts:

* `obsolete-artifacts.md` documents the obsolete policy, deprecation model,
  lifecycle rules, and non-action guardrails for this repository.
* `obsolete-artifacts.contract.json` provides the machine-readable obsolete
  artifact contract used by `scripts/validate-obsolete-artifacts.mjs`.

The next eligible roadmap task is W8-T5. W8-T5 is not opened or closed by this
obsolete artifact policy.
