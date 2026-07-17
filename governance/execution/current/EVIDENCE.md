# EVIDENCE

## Governance Evidence

* `governance/SESSION-CONTEXT.md`
* `governance/roadmaps/AI-NATIVE-HARDENING-V1.1-ROADMAP.md`
* `governance/execution/current/`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H8/`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/P0-T2-SPEC/`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/P0-T2-IMPLEMENTATION/`

## Specification And Approval Evidence

```text
P0-T2 specification: APPROVED / FORMALLY_ACCEPTED
Accepted spec commit: f077fe0
Specification approval commit: 70fadaa
Implementation approval: HITL_REQUIRED
```

## Implementation Evidence

* `scripts/audit-safe-script-mode.mjs`
* `scripts/validate-audit-safe-script-mode.mjs`
* `governance/policies/AUDIT-SAFE-SCRIPT-MODE.md`
* `governance/policies/audit-safe-script-mode.implementation.contract.json`

The implementation provides:

* package script inventory without package-level execution
* command classification before execution
* default blocking for lifecycle/install/setup/bootstrap, package-level,
  destructive, network/secret and unknown commands
* dry-run recognition for generator commands
* direct `node` execution only through explicit `--execute`
* baseline and final git state capture
* working-tree mutation detection when side effects are declared as `none`

## Product Repository Evidence

`ai-foundation` evidence HEAD:

```text
74611a7
```

`ai-knowledge` evidence HEAD:

```text
8582290
```

`ai-template` evidence HEAD:

```text
01b0971
```

## HITL

```text
P0-T2 implementation: CLOSED_LOCALLY / HITL_REQUIRED
Human approval required: true
Human approval recorded: false
```

## Push

```text
NOT_PUSHED_BY_POLICY
```
