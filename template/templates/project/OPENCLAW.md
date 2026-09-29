# OpenClaw Bridge — Generated Project

OpenClaw must use this generated project through the shared project agent contract.

## Mandatory Instructions

Before executing any task, OpenClaw must read and obey:

```text
AGENTS.md
```

OpenClaw must treat `AGENTS.md` as the primary operating contract for this project.

## Source of Truth

OpenClaw must use local project governance as the source of truth for task state:

```text
governance/
governance/roadmaps/
governance/SESSION-CONTEXT.md
governance/execution/current/
governance/execution/archive/
```

OpenClaw must not infer task state from chat memory, old prompts, branch names, commit hashes or assumptions.

## Project Boundary

This repository is a generated project.

OpenClaw must not assume that the AI-NATIVE factory workspace exists locally.

OpenClaw must operate from this project’s own files, governance, skills, tests and documentation.

## Skills

If local skills exist, OpenClaw must use them as reusable procedures:

```text
.agents/skills/
```

OpenClaw must not duplicate the full workflow in chat when a local skill already defines the procedure.

## Execution Rules

OpenClaw must follow:

```text
1. Specify
2. Plan
3. Implement
4. Verify
```

OpenClaw must execute only one task per execution.

OpenClaw must not open the next task.

OpenClaw must not reimplement closed tasks.

OpenClaw must not modify files outside scope.

OpenClaw must not claim validation PASS without real command evidence.

## Builder + Inspector

OpenClaw must act as both Builder and Inspector.

Builder:

```text
- read the minimum required context
- specify the task
- plan the change
- implement only the scoped change
- run validations
```

Inspector:

```text
- audit the diff
- verify scope control
- verify real validations
- verify governance consistency
- verify commits are auditable
- identify residual risk
```

## Final Report

OpenClaw must finish with:

```text
STATUS:
SCOPE:
FILES CHANGED:
VALIDATIONS:
COMMITS:
GOVERNANCE:
INSPECTOR RESULT:
RISKS:
HUMAN APPROVAL:
NEXT ELIGIBLE:
```

`NEXT ELIGIBLE` is informational only and does not open the next task.
