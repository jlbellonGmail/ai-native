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
