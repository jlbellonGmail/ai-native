# Contributing

This repository is proprietary (see `LICENSE`); contributions are made by the maintainer and by agents working under the operating contract in `AGENTS.md`. The rules below apply to both.

## Ground rules

- Read `AGENTS.md` first, then `governance/SESSION-CONTEXT.md` (current state) and `governance/roadmaps/AI-NATIVE-V3-ROADMAP.md`. Task state comes from governance, not from chat memory.
- One task per change. Work on a branch, open a PR; never push to `main` (the ruleset rejects it).
- Commit messages are conventional and describe the change (`fix(security): ...`, `docs(governance): ...`). No `wip:` commits.
- A change to behaviour-bearing files must touch documentation or governance in the same PR (`docs-gate`).
- The merge is done by a human with their own session. Agents never merge, and never use the owner's personal token to do so (`governance/security/HITL-MERGE-POLICY.md`).

## Before opening a PR

```bash
node --test runtime/<area>/*.test.mjs        # the areas you touched
node scripts/validate-ci-tests-listed.mjs    # every *.test.mjs must be run by a workflow
node scripts/validate-actions-pinned.mjs     # actions pinned by full SHA
node parity/validate-parity.mjs              # parity must stay complete
node runtime/docs/validate-doc-drift.mjs     # docs must not drift from the code
```

CI runs the full set on Linux and Windows; it must be green on the exact head SHA.

## Control-plane changes

Anything under `.github/workflows/`, `governance/gates/`, `governance/rulesets/` or `runtime/gates/` is control plane. These PRs are expected to stop at `trust-gate = neutral` until a human approves the `ai-native-human-review` Environment. Do not work around it: gates are never weakened to make a PR pass, and `neutral` is never treated as PASS.

## Secrets

Never put credentials in the repository, in a PR, or in a workflow that a branch can edit. App credentials belong only in the protected Environments (`governance/security/SECRETS-BOUNDARY.md`).

## Legacy material

`_deprecated/` directories (when present) are frozen history, not instructions. Do not extend them. The former `legacy/` tree was retired in v3.0.2; see `parity/v2.0.5/legacy-import-manifest.json`.

## Reporting security problems

Privately, as described in `SECURITY.md`.
