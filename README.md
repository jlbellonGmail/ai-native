# AI-Native Factory

The AI-Native Factory is a comprehensive ecosystem for building, maintaining, and
evolving AI-native applications with governance, standards, and reusable assets.

Since 2026-09-29 (PR #2), `foundation/`, `knowledge/` and `template/` are consolidated
inside this single repository via `git subtree` (full history preserved). They are no
longer separate Git repositories. `ai-native` is evolving from that consolidated state
toward a versioned-reference platform (see `governance/adr/ADR-001-arquitectura-referencia-versionada.md`
and `governance/roadmaps/AI-NATIVE-V3-ROADMAP.md`).

## New project

```bash
git clone <your-repo>      # or: git init
cd <your-repo>
ai-native init
```

That is all. `ai-native init` downloads the latest stable release, verifies it (sha256, sigstore attestation, revocations), writes
`ai-native.lock.json`, the Claude / Codex / OpenCode files and `.ai-native/ai-native.mjs`, stages them and checks the result:

```text
STATUS: READY
AI-NATIVE: vX.Y.Z
PROFILE: python-service (detected: pyproject.toml)
DRIFT: CLEAN
ATTESTATION: PASS
```

It works on an empty repository, on one with only a README, and on an existing project. It asks what kind of project it is only when the repository
gives no hint (`--profile <id>` skips the question). It commits nothing: review with `git status`, then commit. Run it again at any time: on an adopted
repository it only re-verifies. If it cannot verify the release it stops and leaves your repository untouched.

**Once per machine** — put the command on your PATH (needs Node >= 20, git and the GitHub CLI `gh`, signed in). The file is attested; verify it before
running it:

```bash
dl=~/.ai-native/dl
gh release download --repo jlbellonGmail/ai-native --pattern ai-native-cli.mjs --dir "$dl" --clobber \
  && gh attestation verify "$dl/ai-native-cli.mjs" --repo jlbellonGmail/ai-native --signer-workflow jlbellonGmail/ai-native/.github/workflows/release.yml \
  && node "$dl/ai-native-cli.mjs" install
```

```powershell
$dl = Join-Path $HOME ".ai-native/dl"
gh release download --repo jlbellonGmail/ai-native --pattern ai-native-cli.mjs --dir $dl --clobber
if ($?) { gh attestation verify (Join-Path $dl "ai-native-cli.mjs") --repo jlbellonGmail/ai-native --signer-workflow jlbellonGmail/ai-native/.github/workflows/release.yml }
if ($?) { node (Join-Path $dl "ai-native-cli.mjs") install }
```

`install` prints the one line that adds `~/.ai-native/bin` to your PATH. Without installing, running the downloaded `ai-native-cli.mjs` with `node` and the argument `init` does the same. Offline later:
`ai-native init --offline` uses a release this machine already verified. How it is built and why it is safe: `governance/versioning/V3.2.0-RELEASE.md`.

## The `ai-native` command: install, update, remove

Two different things have a version, and `ai-native --version` shows both: the **CLI** is the command installed on a machine; the **PLATFORM** is the
release of ai-native a repository is pinned to by its `ai-native.lock.json`. Each repository keeps its own PLATFORM; one CLI serves them all.

```text
INSTALL ONCE PER MACHINE        ai-native install            (the verified download above; Node >= 20, git, gh)
NEW REPOSITORY                  ai-native init               latest stable PLATFORM; on an adopted repository it only re-verifies
UPGRADE A REPOSITORY            ai-native upgrade            to the latest stable PLATFORM, or: ai-native upgrade --to vX.Y.Z
UPDATE THE CLI                  ai-native self-update        or: ai-native self-update --check   (only reports)
SHOW VERSIONS                   ai-native --version          CLI: v3.3.0 | PLATFORM: v3.2.0   (PLATFORM only inside an adopted repository)
REMOVE THE CLI FROM A MACHINE   ai-native uninstall          repositories are not touched; --purge-cache also deletes the release cache
REMOVE AI-NATIVE FROM A REPO    ai-native detach             only what ai-native wrote; --keep-modified keeps files you edited; any pinned release
```

- **A new release never changes a repository.** The lock decides. A repository moves only when someone runs `ai-native upgrade` (it resolves commit
  and digest itself, verifies the release like `init` does, updates the lock, the pinned workflow and the managed files, keeps files you edited, never
  goes backwards, and puts everything back if any step fails). Review with `git diff --staged` and commit.
- **When a new release comes out**: repositories — nothing, until you choose to `upgrade`; new repositories use it automatically; the CLI — `ai-native
  self-update` when you want its new commands. A release that needs a newer CLI than yours refuses to run (`INCOMPATIBLE_CLI`) and says so; it never
  half-works. The contract is `contracts/bootstrap-protocol.json`, published in each release's `platform.json` as `bootstrap`.
- **`self-update`** verifies the new CLI like a release (published sha256, sigstore attestation by the release workflow, revocations), refuses a
  downgrade, starts the new CLI before trusting it, replaces the old one atomically and keeps it as `ai-native.mjs.prev`. If anything fails, your
  current `ai-native` still works. Offline it changes nothing. `install` never puts an older CLI over a newer one.
- **If you installed v3.2.0** (the only version without `self-update`) update it once by hand: repeat the verified download in "New project" and run
  `node <the downloaded file> install`; that replaces it. From then on `ai-native self-update` is all you need. Until you do, a v3.2.0 CLI keeps working with
  every release that does not require more of it, and warns (`LEGACY_CLI`) when it is the reason something cannot be done.
- **Offline**: a repository already adopted keeps working (its launcher runs from the local cache), `init --offline` and `upgrade --offline` use only
  releases this machine already verified, and anything that needs the network fails closed without changing anything.
- **`detach` does not depend on the release a repository is pinned to**: what ai-native wrote is listed in the repository's own journal, so a repository
  pinned to an old, unavailable or even revoked release can still be detached. It runs the engine of the newest verified release that ships it (the latest
  stable one that is not revoked; with `--offline`, the newest one already in the cache) and fails closed, changing nothing, if there is none.
  A repository left by the bootstrap of v3.1.x or earlier has the lock and no adoption journal: `detach` then removes **only the lock** (the one file ai-native
  is known to have written there) and lists, without touching them, any file it could have projected. If `.ai-native/` exists without its journal, or the lock is
  not readable, it refuses and changes nothing: run `ai-native upgrade` (it records what is ai-native's without overwriting anything) and then `detach`.
- **Compromised or revoked CLI**: `self-update` is for a CLI you can still trust. If your installed command may be compromised, do not run it to repair
  itself: `governance/security/CLI-RECOVERY.md`.

## When something stops: the fail-closed codes

Every refusal prints `STATUS: FAILED` and one `ERROR:` line starting with a code. Nothing is written when a command fails (an interrupted `init`/`upgrade`
is rolled back and the rollback is proved against `git status`). The CLI never publishes a prerelease to you: it selects stable, immutable releases only.

| Code | Meaning | What to do |
|---|---|---|
| `OFFLINE` | The release needed is not in this machine's cache with a verified attestation. | Run the command once with network access. |
| `REVOKED` | The release is on the published revocations list. | Pick another release; `detach` is not affected by the pinned release being revoked. |
| `REVOCATION_UNKNOWN` | The revocations list exists but could not be read or is invalid. | Retry with network; `--offline` runs without that information and says so. |
| `CLI_REVOKED` | This installed CLI version is revoked. | `ai-native self-update`; if you cannot trust the installed command: `governance/security/CLI-RECOVERY.md`. |
| `INCOMPATIBLE_CLI` | The release needs a newer CLI (protocol, version or capability). | `ai-native self-update`. Nothing was changed. |
| `LEGACY_CLI` | Warning: a v3.2.0 CLI cannot update itself or run `upgrade`/`detach`. | Update it once by hand (see above). |
| `RELEASE_REJECTED` | The release is not published, is a draft or prerelease, is not immutable, or has no published digest. | Choose a stable release. |
| `DIGEST_MISMATCH` | The download is not the file GitHub published, or not the one the lock pins. | Do not use it; retry, and report it if it persists. |
| `ATTESTATION_FAILED` | The sigstore attestation did not verify for the release workflow. | Do not use it. |
| `ATTESTATION_UNAVAILABLE` | The GitHub CLI `gh` is missing or not signed in. | Install `gh` and run `gh auth login`. |
| `ATTESTATION_NOT_VERIFIED` | No verified attestation is on record for that bundle. | Run `ai-native init`/`upgrade` with network access. |
| `CACHE_CORRUPT` | A cached bundle does not match its digest. | Delete the file named in the message and retry online. |
| `TRUST_ROOT` | The lock points to another source than the official repository. | Only if you trust it: `--trust-repo owner/name`. |
| `PROFILE_REQUIRED` | The repository gives no hint of what kind of project it is. | `ai-native init --profile <id>`. |
| `PROFILE_CONFLICT` | `--profile` contradicts the profile in the lock. | The profile changes in `ai-native.lock.json`, not by flag. |
| `NOT_ADOPTED` | The repository has no `ai-native.lock.json`. | `ai-native init`. |
| `ADOPTION_INCONSISTENT` | A journal without its lock, or a lock without a journal where `.ai-native/` exists (or the lock is unreadable): ai-native cannot tell what is its own. | Nothing was removed. Restore the missing file from Git history, or run `ai-native upgrade` and then `ai-native detach`. |
| `MIGRATED_FROM_V2` | The repository carries a v2 migration journal. | Revert it with `migrate revert` first. |
| `DOWNGRADE_REFUSED` | `upgrade` only moves forward. | Choose a newer `--to`. |
| `INSTALL_DOWNGRADE_REFUSED` | `install` will not put an older CLI over a newer one. | Use `ai-native self-update`. |
| `DETACH_BLOCKED` | A managed file was edited since ai-native wrote it. | Review it, or `ai-native detach --keep-modified`. |
| `IGNORED_REQUIRED_FILE` | A `.gitignore` rule hides a file ai-native needs to be reproducible. | Adjust the rule named in the message. |
| `MANAGED_FILE_NOT_REPRODUCIBLE` | A managed file is not in the staged state a clean clone gets. | `git add` it, or fix what the message says. |
| `ROLLBACK_INCOMPLETE` | A failed run could not prove it restored the repository exactly. | Read the paths listed and review `git status`. |
| `NOT_INSTALLED` | `self-update` found no installed CLI. | Install it first (see above). |
| `UPDATE_REJECTED` / `UPDATE_FAILED` | The new CLI did not start, or could not replace the old one. | The installed CLI is unchanged and works; retry. |

## Repository Structure

```
ai-native/
├── runtime/              # The platform: bootstrap, release, circuit, gates, adapters, mcp-gateway, migrate, audit, evals, status, ...
├── contracts/            # Schemas and contracts (lock, platform, unit-event, state-machine, sdd-levels, ...)
├── core/                 # Kernel, constitution, roles, agents/models/security policy
├── mcp/                  # MCP catalog and profiles (default: none)
├── profiles/             # Consumer profiles (factory, python-lib, ...)
├── audit/                # Audit method and profiles (PLATFORM, APPLICATION, LIBRARY, FACTORY, TEMPLATE)
├── parity/               # Parity contract with TEMPLATE v2.0.5 (capabilities, tests map, Hash DB, migrate --inventory)
├── evaluation/           # Compat matrix (C1-C6), eval scenarios, audit fixtures, DoD metrics
├── governance/           # Roadmaps, ADRs, gates config, rulesets, session context
├── .github/workflows/    # CI, security, release, and the trust/merge/pr/L3 gates
├── .agents/skills/       # Canonical skills
├── template/ foundation/ knowledge/   # Consolidated areas (git subtree), see ADR-001
└── scripts/              # Repository scripts (validate-actions-pinned, ...)
```

A consumer keeps only `ai-native.lock.json` and the generated tool entry points; everything else is
resolved by reference from a verified release (`node runtime/bootstrap/cli.mjs init|sync|status|doctor|run`).

## Requirements

Node.js >= 20 (CI runs 24; developed on 26). No package install step: every validator and test imports only `node:` built-ins.
`git` and, for release/attestation checks, an authenticated GitHub CLI (`gh`).

## Quick Start (the platform)

```bash
# Validate the platform (the same checks CI runs)
node parity/validate-parity.mjs            # TEST_PARITY, UNMAPPED=0
node contracts/validate-contracts.mjs
node core/validate-core.mjs
node runtime/docs/validate-doc-drift.mjs   # docs vs code
node scripts/validate-actions-pinned.mjs   # every action pinned by full SHA
node runtime/gates/pr-gate.mjs --base origin/main

# Test (one area, or everything)
node --test runtime/gates/*.test.mjs
node --test runtime/*/*.test.mjs contracts/*.test.mjs core/*.test.mjs parity/*.test.mjs evaluation/*/*.test.mjs scripts/*.test.mjs

# Build a release locally (deterministic bundle + platform.json + SHA256SUMS)
node runtime/release/build.mjs --version v3.0.0-rc.1 --out ./out --commit "$(git rev-parse HEAD)"

# Verify a PUBLISHED release the way a consumer would (checksums, attestation, SBOM, revocations, real bootstrap)
node scripts/verify-release.mjs <tag> --expect-commit <sha>
```

Releases: https://github.com/jlbellonGmail/ai-native/releases (latest stable: see the releases page; earlier `v3.0.1`, `v3.0.0` and the `v3.0.0-rc.N` pre-releases).
State of the quality evidence: `governance/quality/QUALITY-MATRIX.md`.

## Advanced: the primitives behind `ai-native init`

You do not need these to start a project. A consumer keeps `ai-native.lock.json` and the generated tool entry points; everything else comes from a verified release.
`ai-native init` is these steps (init → sync → adapters → status) in one verified pass; they remain for upgrades, pinning and debugging.

```bash
node runtime/bootstrap/cli.mjs init   --bundle <bundle.tar.gz> --repo github:<owner>/ai-native --profile factory
node runtime/bootstrap/cli.mjs sync                       # download, sha256 vs the lock, sigstore attestation; or --from-file / --offline
node runtime/bootstrap/cli.mjs status                     # READY | NEEDS_SYNC | DEGRADED_READONLY | REVOKED | NOT_ADOPTED
node runtime/bootstrap/cli.mjs run -- adapters            # derive CLAUDE.md, .mcp.json, .codex/, opencode.json, skills from the release
node runtime/bootstrap/cli.mjs run -- l3                  # consumer gate (also: .github/workflows/l3-consumer.yml, reusable)
node runtime/bootstrap/cli.mjs rollback                   # back to the previous cached release
node runtime/migrate/migrate.mjs plan|apply|revert --target <v2 repo> ...   # v2 -> v3, reversible; see governance/migration/MIGRATION-V2-TO-V3.md
```

Troubleshooting: `status` says why it is not READY; `doctor` checks node, git, the lock, the active release and the cache.
Governance, roadmap and decisions: `governance/roadmaps/AI-NATIVE-V3-ROADMAP.md`, `governance/adr/`.
Merge policy (the agent never merges with the owner credentials; neutral gates block): `governance/security/HITL-MERGE-POLICY.md`.

## Consolidated areas (git subtree, see ADR-001)

`template/`, `foundation/` and `knowledge/` are consolidated here with their history. Their own validators:

```bash
node template/scripts/validate-structure.mjs
node foundation/scripts/validate-enterprise-10-10.mjs
node knowledge/scripts/validate-enterprise-evaluation.mjs
```

The old `ai-cli.mjs` and `quality-gates.mjs` scripts were removed in M7 (retired in M0.2; recoverable from Git history) and must not be reintroduced.

## License

Proprietary, All Rights Reserved (see `LICENSE`). The code is visible while the repository is public; that grants no right to use, copy, modify or redistribute it.
