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

## Quick Start

`scripts/_deprecated/ai-cli.mjs` and `scripts/_deprecated/quality-gates.mjs` are **deprecated** pending repair
(tracked in `governance/roadmaps/AI-NATIVE-V3-ROADMAP.md`, M0.2): `ai-cli.mjs` calls
`require()` inside an ESM package and `quality-gates.mjs` never exits non-zero on
failure. Do not rely on them until that phase closes. Validate each area directly:

```bash
# Validate template/
node template/scripts/validate-structure.mjs

# Validate foundation/
node foundation/scripts/validate-enterprise-10-10.mjs

# Validate knowledge/
node knowledge/scripts/validate-enterprise-evaluation.mjs
```

## Area Relationships

```
┌─────────────────┐
│  template        │  → Reusable project scaffold
│  (scaffolding)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐  ┌──────────┐
│foundation│  │knowledge │
│(platform)│  │(quality) │
└─────────┘  └──────────┘
```

- **template/**: The scaffold that projects clone from. Contains generation contracts,
  template manifests, reference application code, validation rules, and examples.
- **foundation/**: The product foundation owning runtime primitives, base roles,
  security controls, observability contracts, CI security workflows, and validation tools.
- **knowledge/**: The knowledge, registry, and evaluation product repository owning
  benchmark definitions, datasets, scoring, quality gates, prompt/agent registries,
  and documentation standards.

## Validation

Each area has its own validation scripts:

### template/
```bash
node template/scripts/validate-structure.mjs
node template/scripts/validate-enterprise-template.mjs
```

### foundation/
```bash
node foundation/scripts/validate-enterprise-10-10.mjs
```

### knowledge/
```bash
node knowledge/scripts/validate-enterprise-evaluation.mjs
```

## Documentation

- [AI Ecosystem Overview](template/docs/overview/AI_ECOSYSTEM.md)
- [System Overview](template/docs/overview/SYSTEM_OVERVIEW.md)
- [AI Quick Reference](template/docs/overview/AI_QUICK_REFERENCE.md)
- [First Project Guide](template/docs/onboarding/FIRST-PROJECT.md)
- [Project Bootstrap](template/docs/setup/PROJECT_BOOTSTRAP.md)

## Governance

Governance defines what agents work on. See `governance/` for:
- Roadmaps (`governance/roadmaps/`, including `AI-NATIVE-V3-ROADMAP.md`)
- Architecture decisions (`governance/adr/`)
- Session context (`governance/SESSION-CONTEXT.md`)
- Execution state (`governance/execution/`)
- Evidence, approval records, closure records, decision history
