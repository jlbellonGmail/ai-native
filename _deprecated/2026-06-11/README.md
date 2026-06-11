# Deprecated Content

Content moved here during the ENTERPRISE-10-10 template realignment.

Reasons:

* `.source-legacy-analysis/` is historical analysis, not active template product.
* `.cursor/` contains local worktree state.
* `package-lock.json` duplicated the active `pnpm-lock.yaml` package manager path.

Deprecated files are retained for recovery but must not be used by generators or
validation.
