# Autonomy, human gate and status

## Human gate per work unit

`human_gate` is declared per Task or Feature and chosen by risk (`contracts/hitl-policy.json`, checked by `runtime/policy/hitl.mjs`):

| human_gate | Meaning | Allowed for |
|---|---|---|
| `required` | a human approves before the work unit is accepted | any risk (the only option for high) |
| `final-only` | automatic until the final gate (default for low and medium) | low, medium |
| `none` | completes with no human step | low risk only |

`none` is an explicit decision, never a default: it needs `human_gate: none` and `autonomy: full`. Control-plane changes, releases, production and security-sensitive work keep the gate `required` regardless; branch protection and the release policy always win (no hidden bypass). Trivial low-risk tasks are not slowed down by a gate nobody needs.

Usage: `/sdd-implement-all <spec>` with `autonomy: full` and `human_gate: none` for a low-risk Feature; before `/sdd-implement-all` the Coordinator runs `node runtime/policy/hitl.mjs --risk <low|medium|high> --human-gate <gate> --autonomy <mode> [--control-plane --release --production --security]`; exit 1 means refuse and say why. Enforcement is this check plus branch protection, not the prose.

## Status per feature

A feature's state is derived, not written. `/sdd-status <spec>` prints five lines from `tasks.md` and the artifacts:

```text
STATE / PROGRESS / LAST COMPLETED / NEXT / BLOCKERS
```

Do not keep a hand-written `status.md` (it diverges). Project status stays in `governance/`; feature status never mixes with it. Memory files are not a source of truth: Git, governance, spec, tasks, tests and evidence are.

## Constitution

The ai-native constitution is the default for every project. A project normally has no constitution file; one exists only for real local rules, as additions (`- [ADD] LOCAL-1: ...`) in `.specify/memory/constitution.md`, validated by `runtime/policy/constitution-extension.mjs`. Only headings and rule lines are accepted, so an override cannot hide in prose; on any conflict, ai-native wins.
