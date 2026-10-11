# Autonomy, human gate and status

## Human gate per work unit

`human_gate` has three values (`contracts/hitl-policy.json`, rule in `runtime/policy/hitl.mjs`):

| human_gate | Meaning | Allowed for |
|---|---|---|
| `required` | a human approves the plan before implementation (`AWAITING_HUMAN_APPROVAL`) | any risk (the only option for high) |
| `final-only` | automatic until the final gate (`READY_FOR_HITL`), the default for low and medium | low, medium |
| `none` | the work unit completes (`DONE`) with no human step | low risk only |

The agent does not choose its own level. The effective gate is **derived**:

* **risk** comes from the changed paths (ASSESS, `contracts/assess-rules.json`), recomputed from what actually changed; a change that grows into scripts, workflows, auth, data or schema becomes high and `none` is refused. No paths to assess means `medium`, never low.
* **protected areas** keep the gate `required` whatever is declared: control-plane paths (read from the base commit's `governance/gates/gates.json`), security-sensitive paths, and the `release` and `production` environments.
* **repo policy**: `none` is only possible where the pinned profile says `governance.allowNone: true` (default false; a project cannot grant it to itself).
* **the declaration** is the work unit's own explicit statement: `human_gate: none` and `autonomy: full` lines in its `specs/<slug>/spec.md` (reviewed in the PR). A Task without spec has no declaration, so it gets the default.

Where it is enforced (one implementation, `runtime/policy/hitl.mjs`):

| Point | How |
|---|---|
| Coordinator / `/sdd-implement-all` | derives the gate before starting and again from the real changes before validation; refusal = `BLOCKED` before any task |
| factory CI | `node runtime/policy/hitl.mjs --base origin/<base>` on every PR |
| consumer CI (L3) | `human-gate` check, from the pinned platform, against the PR diff |
| merge and release | unchanged: branch protection, `merge-gate` and human merge always apply; `none` never lifts them |

Manual check: `node runtime/policy/hitl.mjs --base <ref> [--environment release|production] [--profile <id>]`. There are no flags for risk or protected areas on purpose.

## Status per feature

A feature's state is derived, not written. `/sdd-status <spec>` prints five lines from `tasks.md` and the artifacts:

```text
STATE / PROGRESS / LAST COMPLETED / NEXT / BLOCKERS
```

Do not keep a hand-written `status.md` (it diverges). Project status stays in `governance/`; feature status never mixes with it. Memory files are not a source of truth: Git, governance, spec, tasks, tests and evidence are.

## Constitution

The ai-native constitution is the default for every project. A project normally has no constitution file; one exists only for real local rules, as additions (`- [ADD] LOCAL-1: ...`) in `.specify/memory/constitution.md`. Only headings and rule lines are accepted, so an override cannot hide in prose; on any conflict, ai-native wins. Checked by `runtime/policy/constitution-extension.mjs` in factory CI and in the consumer L3 gate (`constitution`).
