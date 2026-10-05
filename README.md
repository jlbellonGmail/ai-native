# AI-Native Factory

The AI-Native Factory is a comprehensive ecosystem for building, maintaining, and
evolving AI-native applications with governance, standards, and reusable assets.

Since 2026-09-29 (PR #2), `foundation/`, `knowledge/` and `template/` are consolidated
inside this single repository via `git subtree` (full history preserved). They are no
longer separate Git repositories. `ai-native` is evolving from that consolidated state
toward a versioned-reference platform (see `governance/adr/ADR-001-arquitectura-referencia-versionada.md`
and `governance/roadmaps/AI-NATIVE-V3-ROADMAP.md`).

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
├── legacy/template-v2/   # TEMPLATE v2.0.5 baseline (imported, filtered)
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
```

## Using the platform from a consumer repository

A consumer keeps `ai-native.lock.json` and the generated tool entry points. Everything else comes from a verified release.

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

The old `scripts/_deprecated/ai-cli.mjs` and `quality-gates.mjs` were retired in M0.2 (see the roadmap) and must not be used.

## License

Proprietary, All Rights Reserved (see `LICENSE`). The code is visible while the repository is public; that grants no right to use, copy, modify or redistribute it.
