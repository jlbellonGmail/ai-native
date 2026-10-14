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
gh release download --repo jlbellonGmail/ai-native --pattern ai-native-cli.mjs --dir "$dl" \
  && gh attestation verify "$dl/ai-native-cli.mjs" --repo jlbellonGmail/ai-native --signer-workflow jlbellonGmail/ai-native/.github/workflows/release.yml \
  && node "$dl/ai-native-cli.mjs" install
```

```powershell
$dl = Join-Path $HOME ".ai-native/dl"
gh release download --repo jlbellonGmail/ai-native --pattern ai-native-cli.mjs --dir $dl
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
REMOVE AI-NATIVE FROM A REPO    ai-native detach             only what ai-native wrote; --keep-modified keeps files you edited
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
- **Compromised or revoked CLI**: `self-update` is for a CLI you can still trust. If your installed command may be compromised, do not run it to repair
  itself: `governance/security/CLI-RECOVERY.md`.

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
