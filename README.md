# AI-Native Factory

The AI-Native Factory is a comprehensive ecosystem for building, maintaining, and
evolving AI-native applications with governance, standards, and reusable assets.

## Repository Structure

```
ai-native/
├── ai-template/         # Reusable project scaffold
│   ├── scaffolds/       # Copyable project skeletons
│   ├── templates/       # Reusable template assets
│   ├── manifests/       # Machine-readable structure manifests
│   ├── generators/      # Project generation entry points
│   ├── examples/        # Reference application code
│   ├── validation/      # Tests and validators
│   ├── config/          # Template configuration
│   └── docs/            # Setup, architecture, overview
├── ai-foundation/       # Product foundation
│   ├── runtime/         # Core runtime primitives
│   ├── roles/           # Base operating roles
│   ├── security/        # Security controls
│   ├── observability/   # SLIs, SLOs, error budgets
│   └── validation/      # Security and observability checks
├── ai-knowledge/        # Knowledge and evaluation
│   ├── evaluation/      # Prompt and agent evaluation
│   ├── benchmarks/      # Benchmark suites
│   ├── datasets/        # Dataset registry
│   ├── scoring/         # Rubrics and scoring rules
│   └── quality-gates/   # Quality gates
├── governance/          # Roadmaps, execution state, archives
├── scripts/             # Factory scripts
└── specs/               # Spec-driven development artifacts
```

## Quick Start

```bash
# Initialize a new AI-native project
node scripts/ai-cli.mjs init my-project

# Validate the current project structure
node scripts/ai-cli.mjs validate

# Check cross-repository integrity
node scripts/ai-cli.mjs check-integrity

# Run quality gates
node scripts/quality-gates.mjs

# Run tests
node scripts/ai-cli.mjs test
```

## Repository Relationships

```
┌─────────────────┐
│  ai-template     │  → Reusable project scaffold
│  (scaffolding)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐  ┌──────────┐
│ai-foundation│  │ai-knowledge│
│(platform)   │  │(quality)    │
└─────────┘  └──────────┘
```

- **ai-template**: The scaffold that projects clone from. Contains generation contracts,
  template manifests, reference application code, validation rules, and examples.
- **ai-foundation**: The product foundation owning runtime primitives, base roles,
  security controls, observability contracts, CI security workflows, and validation tools.
- **ai-knowledge**: The knowledge, registry, and evaluation product repository owning
  benchmark definitions, datasets, scoring, quality gates, prompt/agent registries,
  and documentation standards.

## Validation

Each repository has its own validation scripts:

### ai-template
```bash
cd ai-template
node scripts/validate-structure.mjs
node scripts/validate-enterprise-template.mjs
```

### ai-foundation
```bash
cd ai-foundation
node scripts/validate-enterprise-10-10.mjs
```

### ai-knowledge
```bash
cd ai-knowledge
node scripts/validate-enterprise-evaluation.mjs
```

## Documentation

- [AI Ecosystem Overview](ai-template/docs/overview/AI_ECOSYSTEM.md)
- [System Overview](ai-template/docs/overview/SYSTEM_OVERVIEW.md)
- [AI Quick Reference](ai-template/docs/overview/AI_QUICK_REFERENCE.md)
- [First Project Guide](ai-template/docs/onboarding/FIRST-PROJECT.md)
- [Project Bootstrap](ai-template/docs/setup/PROJECT_BOOTSTRAP.md)

## Governance

Governance defines what agents work on. See `governance/` for:
- Roadmaps
- Session context
- Execution state
- Archives
- Evidence
- Approval records
- Closure records
- Decision history