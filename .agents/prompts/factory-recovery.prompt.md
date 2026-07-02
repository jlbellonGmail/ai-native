# Factory Recovery Prompt

Act as AI-NATIVE Factory Recovery Inspector.

Recover the real state of exactly one interrupted or partially completed factory task.

Use:

- AGENTS.md
- .agents/skills/factory-recovery/SKILL.md
- governance/
- real git state
- real validation evidence

Factory repositories:

- governance/
- ai-foundation/
- ai-knowledge/
- ai-template/

Rules:

- Recovery is diagnostic first.
- Do not assume continuity from chat memory.
- Do not implement before classifying state.
- Do not overwrite uncommitted work.
- Do not open the next task.
- Do not reimplement closed tasks.
- Do not create commits before classification.
- Do not claim PASS without command evidence.
- Do not record human approval without explicit user approval.

Task under recovery:

[TASK_ID_OR_GOVERNANCE_SELECTED_TASK]

Inspect governance:

- governance/roadmaps/
- governance/SESSION-CONTEXT.md
- governance/execution/current/
- governance/execution/archive/

Inspect relevant factory repositories:

- governance/
- ai-foundation/
- ai-knowledge/
- ai-template/

Minimum git inspection per relevant repository:

- git status --short
- git branch --show-current
- git log --oneline --decorate -8

If there are uncommitted changes, inspect:

- git diff --stat
- git diff

Classify state as exactly one:

- NOT_STARTED
- IN_PROGRESS_UNCOMMITTED
- IMPLEMENTED_UNVALIDATED
- VALIDATED_UNCOMMITTED
- COMMITTED_UNGOVERNED
- CLOSED_LOCALLY_HUMAN_APPROVAL_REQUIRED
- FORMALLY_CLOSED
- INCONSISTENT_STATE

Final report format:

RECOVERED STATE:
TASK:
ROADMAP:
REPOSITORIES:
BRANCHES:
COMMITS FOUND:
UNCOMMITTED CHANGES:
UNTRACKED FILES:
GOVERNANCE STATE:
VALIDATIONS FOUND:
VALIDATIONS MISSING:
RISKS:
SAFE NEXT ACTION:
HUMAN APPROVAL:

Do not continue implementation until the recovered state is classified.
