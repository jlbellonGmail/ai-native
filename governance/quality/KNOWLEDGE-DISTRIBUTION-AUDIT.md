# Knowledge distribution audit — shipping `knowledge/sdd` and shrinking the template

Baseline: `main` @ `f040d54` (merge of PR #93), release `v3.0.2`, `VERSION` `3.0.0-dev` by policy. Follows `CENTRALIZATION-CONSUMER-AUDIT.md`, which found the gap this change closes.

## 1. Distribution audit (what enters the release)

Mechanism: `runtime/release/bundle.mjs` (`INCLUDE_PREFIXES` / `EXCLUDE_PATTERNS`), one git commit -> deterministic tar -> content-addressed cache (`runtime/bootstrap/cache.mjs`, per-file hashes, verified before every use).

| Path | In release before | In release now | Why | Consumed by | Local copy removable |
|---|---|---|---|---|---|
| `runtime/ contracts/ core/ mcp/ profiles/ audit/` | yes | yes | executable platform | `ai-native run`, adapters, gates | n/a (never copied) |
| `.agents/skills/` | yes | yes | skill sources projected per tool | `consumer.mjs`, `skills.mjs` | n/a (generated) |
| `knowledge/sdd/` | **no** | **yes** (32 files, 65,258 B; `goals/` excluded) | the sdd skill and the AGENTS routers point into it; a pointer a consumer cannot resolve is dangling | `ai-native run -- knowledge <ref>` | yes: `docs/agents-contract-detail.md` and the 7 `.specify/templates/*` |
| rest of `knowledge/` (benchmarks, datasets, evaluation, registries…) | no | no | factory/evaluation material, not consumer-facing | factory CI | n/a |
| `foundation/` | no | no | factory-side validators and reference config; the runnable parts already live in `runtime/` and `core/` | factory CI | n/a |
| `template/` | no | no | scaffold/generator source, not a runtime dependency | `create-ai-native-app`, CI validators | n/a |

Release surface: 167 files / 754,669 B -> 201 files / 830,698 B (+10 %, all of it `knowledge/sdd` and the new resolver/contract). The digest changes by construction; `platform.json` and the lock schema are untouched.

## 2. Resolution, versioning, offline

* `runtime/consumer/knowledge.mjs`: lock -> digest -> `verifyRelease` (hash check; a tampered entry is evicted and reported) -> `knowledge/<package>/KNOWLEDGE.json` -> file. No absolute path, no tool-specific home. `ai-native run -- knowledge <ref>` is the agent-facing form; `--project <dir> --cache <dir>` resolves through a lock explicitly.
* Version contract: `contracts/knowledge-package.schema.json` + `knowledge/sdd/KNOWLEDGE.json` (`schemaVersion`, package `version`, `requires.workflowContract`, `requires.minPlatform`). Anything the resolver cannot honor is `INCOMPATIBLE_VERSION` with the reason; a release that lacks the package or a file is `MISSING_REFERENCE`; no lock is `NOT_ADOPTED`. There is no silent fallback to a stale or local copy.
* Offline: the cache is the offline store. After one `ai-native sync` the pinned release (including knowledge) is read locally and re-verified by hash; if the cache is empty the message says to sync. This replaces permanent duplication in the repo.
* Manifest: `ai-native.lock.json` already carries version + commit + digest; knowledge and foundation versions are those of the pinned release, so no second manifest or schema change was needed.
* Projections: each generated file is journaled with its SHA-256 (`.ai-native/adoption-journal.json`); the journal is the origin/hash record, so files stay free of in-band markers.

## 3. Template file by file (172 files after this change)

Question applied to each: why must it exist physically in every consumer?

| Group (files) | Decision | Reason / evidence |
|---|---|---|
| `templates/project` (12): `AGENTS.md`, `CLAUDE.md`, `OPENCLAW.md`, `.specify/memory/constitution.md`, `.agents/prompts/*` (2), `specs/README.md`, `docs/security/SECURITY-BOOTSTRAP.md`, `docs/testing/*`, `testing/*` (2), `scripts/validate-testing-profiles.mjs` | KEEP_LOCAL | tool entrypoints, the project's own constitution and security/testing bootstrap; each is edited by the project |
| `templates/project/docs/agents-contract-detail.md` (17.6 KB) | **REFERENCE (removed)** | now `ai-native run -- knowledge sdd/agents-contract-detail.md` |
| `templates/project/.specify/templates/*` (7, 8.6 KB) | **MOVE_TO_KNOWLEDGE (removed)** | byte-identical to the factory's; now `knowledge/sdd/feature-templates/`; a project overrides one by adding it under `.specify/templates/` |
| `templates/enterprise-10-10`, `templates/README.md` (3) | KEEP_LOCAL (factory) | structure manifest checked by `validate-enterprise-template` |
| `scaffolds/*` (23) | KEEP (generator payload) | the product skeleton `create-ai-native-app` materializes; edited by the product |
| `examples/*` (47), `validation/*` (23), `scripts/*` (18), `config/*` (12), `docs/*` (12), `manifests/*` (3), `generators/*` (3), `testing/*` (2), `.github/*` (1), root files (13) | KEEP (factory) | enterprise template reference and its 15 CI validators (`ci.yml`, "template/ validators"); never delivered by the consumer adapter. Removing them would break those validators without reducing any consumer footprint |

Finding worth recording: nothing in `runtime/` materializes `templates/project`; it is a reference payload. The consumer's physical set comes from `consumer.mjs` (generated projections) plus the lock.

## 4. `.specify`

| Part | Class | Decision |
|---|---|---|
| `memory/constitution.md` | D. project configuration | KEEP_LOCAL (the project's constitution; factory has its own) |
| `templates/*` (7) | B. reusable templates | moved to `knowledge/sdd/feature-templates/`, shipped; local override by file precedence |
| methodology | C. | already `knowledge/sdd/methodology/` |
| specs / feature state | A. real local data | `specs/` in the project, untouched |

## 5. Results (blob sizes from git, same method before and after)

| Metric | Before (`f040d54`) | After |
|---|---|---|
| `template/` files | 180 | 172 (−4.4 %) |
| `template/` bytes | 463,126 | 438,326 (−5.4 %) |
| `template/` lines | 15,387 | 13,613 (−11.5 %) |
| `templates/project` files / bytes | 20 / 62,203 | 12 / 37,403 (−40 % files, −39.9 % bytes) |
| project `AGENTS.md` | 145 lines / 10,350 B (~2,588 tokens) | 147 lines / 11,311 B (~2,828 tokens) |
| factory `AGENTS.md` | 190 lines / 14,035 B | 190 lines / 14,061 B |
| consumer managed files | 5 | 5 |
| generated projections (3 tools) | 46 files / 78,657 B | unchanged (required by the runtimes) |
| release bundle (cache) | 167 files / 754,669 B | 201 files / 830,698 B |

`AGENTS.md` of the project template grew by 961 B: it now names the central references and says how to locate ai-native (a four-line block). That is the intended trade: the always-on file gained a pointer, the repo lost 17.6 KB + 8.6 KB of copies. The router was not cut further because the previous review found rule loss at the margin and the reusable detail is already central.

## 6. Security

* `safeJoin` (`runtime/migrate/adopt.mjs`) now also checks the real path of the deepest existing ancestor, so a symlink or junction inside the project cannot redirect a generated write outside it (test: `knowledge.test.mjs`).
* The resolver validates the reference shape, rejects `..`, absolute paths and backslashes, and re-checks containment on the real path; the cache verifies every file by hash first.
* `allowed-tools` remains a pre-approval, not a sandbox (unchanged).
* Bundle: symlinks are never shipped (`bundle.mjs`), `goals/` and tests are excluded.

## 7. Inherited LOW items closed

`persistTaskState` is write-then-rename; `applyUpgrade` reports `REFRESHED` when only the journal changed (not `UP_TO_DATE`); the template pointer test now resolves central references through the real resolver and checks local ones exist.
