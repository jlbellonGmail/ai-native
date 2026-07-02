# Deprecated Content

The hidden `.ai` tool-context folder was moved here during structural
realignment because it is useful recovery material but not part of the active
knowledge product surface.

Do not use deprecated files as source-of-truth for benchmarks, datasets,
scoring, quality gates or registries.

## W8-T1 Legacy Inventory

W8-T1 records this deprecated tool-context surface as retained recovery
material. The inventory does not delete files, promote deprecated content, or
change active benchmark, dataset, scoring, quality gate, prompt registry, or
agent registry behavior.

Artifacts:

* `legacy-inventory.md` documents the inventory, ownership map, classification
  model, and guardrails for this repository.
* `legacy-inventory.contract.json` provides the machine-readable inventory used
  by `scripts/validate-legacy-inventory.mjs`.

The next eligible roadmap task remains W8-T2. W8-T2 is not opened or closed by
this inventory.

## W8-T2 Historical Archive

W8-T2 defines this deprecated tool-context surface as a retained in-place
historical archive. The archive policy does not delete files, move files,
promote deprecated context, or change active knowledge product behavior.

Artifacts:

* `historical-archive.md` documents the archive policy, retention model,
  archival contract, and continuity guardrails for this repository.
* `historical-archive.contract.json` provides the machine-readable archive
  policy used by `scripts/validate-historical-archive.mjs`.

The next eligible roadmap task is W8-T3. W8-T3 is not opened or closed by this
archive policy.

## W8-T3 Duplicate Detection

W8-T3 classifies duplicate and overlap patterns in this deprecated knowledge
tool-context surface without deleting, moving, or promoting archived files.

Artifacts:

* `duplicate-detection.md` documents duplication rules, classification report,
  and non-action guardrails for this repository.
* `duplicate-detection.contract.json` provides the machine-readable duplicate
  detection contract used by `scripts/validate-duplicate-detection.mjs`.

The next eligible roadmap task is W8-T4. W8-T4 is not opened or closed by this
duplicate detection report.

## W8-T4 Obsolete Artifacts

W8-T4 defines obsolete artifact policy, deprecation model, and lifecycle rules
for this deprecated knowledge surface. Obsolete artifacts remain retained in
place; no physical movement, deletion, or promotion is performed.

Artifacts:

* `obsolete-artifacts.md` documents the obsolete policy, deprecation model,
  lifecycle rules, and non-action guardrails for this repository.
* `obsolete-artifacts.contract.json` provides the machine-readable obsolete
  artifact contract used by `scripts/validate-obsolete-artifacts.mjs`.

The next eligible roadmap task is W8-T5. W8-T5 is not opened or closed by this
obsolete artifact policy.
