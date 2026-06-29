# Deprecated Content

Content moved here during the ENTERPRISE-10-10 template realignment.

Reasons:

* `.source-legacy-analysis/` is historical analysis, not active template product.
* `.cursor/` contains local worktree state.
* `package-lock.json` duplicated the active `pnpm-lock.yaml` package manager path.

Deprecated files are retained for recovery but must not be used by generators or
validation.

## W8-T1 Legacy Inventory

W8-T1 records this deprecated template surface as retained recovery material.
The inventory does not delete files, promote deprecated content, or change
active generators, scaffolds, manifests, package manager policy, or validation
behavior.

Artifacts:

* `legacy-inventory.md` documents the inventory, ownership map, classification
  model, and guardrails for this repository.
* `legacy-inventory.contract.json` provides the machine-readable inventory used
  by `scripts/validate-legacy-inventory.mjs`.

The next eligible roadmap task remains W8-T2. W8-T2 is not opened or closed by
this inventory.

## W8-T2 Historical Archive

W8-T2 defines this deprecated template surface as a retained in-place
historical archive. The archive policy does not delete files, move files,
promote deprecated state, or change active template product behavior.

Artifacts:

* `historical-archive.md` documents the archive policy, retention model,
  archival contract, and continuity guardrails for this repository.
* `historical-archive.contract.json` provides the machine-readable archive
  policy used by `scripts/validate-historical-archive.mjs`.

The next eligible roadmap task is W8-T3. W8-T3 is not opened or closed by this
archive policy.

## W8-T3 Duplicate Detection

W8-T3 classifies duplicate and overlap patterns in this deprecated template
surface without deleting, moving, or promoting archived files.

Artifacts:

* `duplicate-detection.md` documents duplication rules, classification report,
  and non-action guardrails for this repository.
* `duplicate-detection.contract.json` provides the machine-readable duplicate
  detection contract used by `scripts/validate-duplicate-detection.mjs`.

The next eligible roadmap task is W8-T4. W8-T4 is not opened or closed by this
duplicate detection report.
