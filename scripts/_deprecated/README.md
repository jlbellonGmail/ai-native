# Deprecated scripts

Moved here 2026-09-30 during M0.2 (governance reconciliation post-subtree consolidation).
None of these are invoked by CI, by `package.json`, or by any governed task, except
`verify-w1t1.mjs`, which `package.json`'s `w1t1:verify` script still points at here —
kept only as a stable, static command string for `scripts/validate-audit-safe-script-mode.mjs`'s
regression fixture (it verifies that a root-level package-managed script is correctly
classified as `PACKAGE_LEVEL` by `scripts/audit-safe-script-mode.mjs`; that fixture never
executes the script). Do not run any file in this directory.

See `governance/roadmaps/AI-NATIVE-V3-ROADMAP.md` (M0.2) for the reconciliation task and
`governance/adr/ADR-001-arquitectura-referencia-versionada.md` for the broader context.
