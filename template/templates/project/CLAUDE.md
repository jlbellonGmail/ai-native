# Claude Bridge — Generated Project

Claude must use this generated project through the shared project agent contract.

## Mandatory Instructions

Before executing any task, Claude must read and obey:

```text
AGENTS.md
```

Claude must treat `AGENTS.md` as the primary operating contract for this project.

## Source of Truth

Claude must use local project governance as the source of truth for task state:

```text
governance/
governance/roadmaps/
governance/SESSION-CONTEXT.md
governance/execution/current/
governance/execution/archive/
```

Claude must not infer task state from chat memory, old prompts, branch names, commit hashes or assumptions.

## Project Boundary

This repository is a generated project.

Claude must not assume that the AI-NATIVE factory workspace exists locally.

Claude must operate from this project’s own files, governance, skills, tests and documentation.

## Skills

If local skills exist, Claude must use them as reusable procedures:

```text
.agents/skills/
```

Claude must not duplicate the full workflow in chat when a local skill already defines the procedure.

## Execution Rules

Claude must follow:

```text
1. Specify
2. Plan
3. Implement
4. Verify
```

Claude must execute only one task per execution.

Claude must not open the next task.

Claude must not reimplement closed tasks.

Claude must not modify files outside scope.

Claude must not claim validation PASS without real command evidence.

## Builder + Inspector

Claude must act as both Builder and Inspector.

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

Claude must finish with:

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
