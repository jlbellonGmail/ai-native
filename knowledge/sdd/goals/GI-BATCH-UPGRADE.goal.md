# Goal template — batch upgrade of the GI repositories (delta only)

Usable only after the target platform release is published and verified. Replace `<TARGET>` with that release tag. Do not run it before; no GI repository is touched by the change that introduced this file.

```text
Repos: gi-platform-*, gi-common-*, gi-vertical-*   (discover with: gh repo list <owner> --json name | filter by prefix)
Goal: bring every repo to ai-native <TARGET> applying ONLY the delta, then tests, parity/integrity, PR. Never merge.
```

## Audited starting state (read-only, 8 repos)

All GI repositories found are generation-1: no `ai-native.lock.json`, no SDD commands, no `sdd` skill. Each carries hand-maintained `.agentic/roles`, `.claude/agents`, `.codex`/`.opencode` role copies and (5 repos) `docs/*/sdd-adaptativo.md`. The first run is therefore an adoption (`consumer.mjs --project . --plan`, review collisions, `--skip` for the repo's own files), not a pure upgrade; later runs are `--upgrade`. Legacy role/skill copies are retired only through the journal or an explicit `keepLocal` review, never silently. Pin first (`ai-native init`/`sync`, so the release and its `knowledge/sdd` are in the cache), then adopt, then verify with `consumer.mjs --project . --drift --cache <cache>`; the expected result is `CLEAN`. `MISSING_REFERENCE` means sync is missing; `INCOMPATIBLE_VERSION` means the pin is older than `minPlatform` in `knowledge/sdd/KNOWLEDGE.json`. Central knowledge is read with `ai-native run -- knowledge <ref>`; no methodology is copied into the repo. Starting-state details: `governance/quality/CENTRALIZATION-CONSUMER-AUDIT.md`; distribution and template decisions: `governance/quality/KNOWLEDGE-DISTRIBUTION-AUDIT.md`.

## Per repository (autonomous, no questions)

1. Preconditions: clean tree, default branch up to date, no open upgrade PR. If any fails: record `SKIPPED(reason)` and continue with the next repo.
2. Branch `chore/ai-native-<TARGET>` (the repo's branch pattern governs).
3. Pin: bump `ai-native.lock.json` to `<TARGET>` with the platform bump (`runtime/migrate/bump.mjs`; footprint is the lock and the caller workflow only).
4. Delta preview, read-only: `node <release>/runtime/adapters/consumer.mjs --project . --upgrade --plan --json`. Expect only `add`/`update`/`remove` of generated files. Read `keepLocal` and `collisions`: they are local customizations and are never overwritten; list them in the PR body.
5. Apply the delta: same command without `--plan`. Re-run with `--plan`: it must report `UP_TO_DATE` (idempotence).
6. Validate with the repo's own commands (tests, lint, `ai-native doctor`, `status --check`, the repo's parity/integrity checks). A failure that exists on the default branch is recorded as pre-existing and is not attributed to the upgrade.
7. Commit in the repo's convention, push, open the PR. Body: from/to release, delta summary (counts and bytes), preserved local files, validation results, rollback (`consumer.mjs --revert` or revert the PR).
8. Wait for CI; fix only what the upgrade caused; repeat. Stop at `READY_FOR_HUMAN_MERGE`.

## Output

One table: repo, PR, delta (add/update/remove/preserved), validations, CI, status. Repos with an empty delta need no PR.

## Hard limits

Never merge, never force-push, never overwrite a locally edited file, never touch a repo whose tree is dirty, never change a ruleset, never copy the whole template. If the delta contains anything beyond generated adapter files, skills, commands and the lock, stop on that repo and report.

## Additions for the release that follows the professional evolution

* The 8 repositories are first generation: the first operation is ADOPT (`consumer.mjs --project . --plan`), never UPGRADE. Later runs are `--upgrade`.
* Adopt per repo, in this order and without copying knowledge: pin the lock (`ai-native init`/`sync`), minimal router (`AGENTS.md`), generated projections (commands, `sdd` skill, Coordinator and role adapters), then SDD (`/feature`, `/sdd-*`).
* Constitution: delete a repo's full constitution copy when it only repeats ai-native; keep only real local rules as `- [ADD] LOCAL-n: ...` lines in `.specify/memory/constitution.md` and run `node <release>/runtime/policy/constitution-extension.mjs --project .` (an override fails).
* Architecture: where the repo has a domain, declare `architecture.json` (layers, modules, public contracts; `contracts/architecture.schema.json`) and run `node <release>/runtime/policy/architecture.mjs --project .`. gi-platform-*, gi-common-* and gi-vertical-* are separate modules that talk through contracts only; report any private import between them as a finding, do not refactor inside the adoption PR.
* Human gate: default `final-only`; `human_gate: none` only for low-risk units (`methodology/autonomy.md`).
