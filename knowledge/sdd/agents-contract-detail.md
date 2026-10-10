# AGENTS.md — detailed operating contract (reference)

Verbatim detail of the sections that `AGENTS.md` summarizes as a router. `AGENTS.md` keeps every non-negotiable rule inline; this file is loaded on demand when a phase needs the full checklist (procedures: `.agents/skills/task-execution/SKILL.md`). Moved unchanged from `AGENTS.md` when it became a router; the rules did not change. Factory-only on purpose: it is not under a skill so it is never copied into consumers.

---

## Phase 1 — Specify

The agent must define:

```text
- task objective
- engineering purpose
- affected repositories
- expected files or areas
- explicit non-goals
- acceptance criteria
- validation expectations
- risk boundaries
```

The agent must not modify files during this phase unless the user explicitly asks for a planning artifact to be created.

## Phase 2 — Plan

The agent must define:

```text
- minimal change strategy
- files allowed to change
- validators to run
- governance update strategy
- commit strategy
- rollback or recovery considerations
```

The plan must minimize:

```text
- token usage
- file reads
- repository traversal
- unrelated edits
- generated output
```

## Phase 3 — Implement

The agent must implement only the planned change.

Rules:

```text
- no hardcoded shortcuts
- no unrelated formatting
- no generated junk
- no broad rewrites
- no hidden behavior changes
- no silent deletion of legacy assets
- no remote-destructive actions
- no dependency additions unless justified by the task
- no VERSION changes unless explicitly required
```

## Phase 4 — Verify

The agent must verify with real commands and real evidence.

Minimum verification per affected repository:

```bash
git status --short
git branch --show-current
git log --oneline --decorate -5
git diff --check
```

The agent must also run task-specific validators discovered from affected repositories, including where applicable:

```text
package.json
scripts/
validation/
tests/
governance/
README files
task-specific documentation
```

The agent must not claim PASS unless the relevant command was executed or existing evidence was explicitly found in the repository.

## Builder and Inspector

Each execution must include two logical roles.

Builder responsibilities:

```text
- read the minimum required context
- specify the task
- plan the change
- implement only the scoped change
- run validations
- prepare commits
```

Inspector responsibilities:

```text
- audit the diff
- check scope control
- check that no closed task was reopened
- check that no next task was opened
- check that validations are real
- check that commits are auditable
- check governance consistency
- identify residual risk
- determine whether human approval is required
```

The Inspector must be critical.

The Inspector must not rubber-stamp the Builder.

## Factory Scope Control

When working inside the factory, the agent must distinguish between these scopes:

```text
foundation scope:
Changes to foundation/ only.

knowledge scope:
Changes to knowledge/ only.

template scope:
Changes to template/ only.

governance scope:
Changes to governance only.

cross-area scope:
Coordinated changes across more than one factory area (foundation/, knowledge/, template/, governance/) in the same repository.
```

Cross-area changes require explicit justification from the task scope.

The agent must not assume that a change in one area requires changes in the others.

## Template and Generated Project Boundary

template/ may contain assets that are copied, rendered or transformed into generated projects.

The agent must distinguish between:

```text
factory operating files:
Used by the AI-NATIVE factory itself.

template assets:
Copied or rendered into generated projects.

generated project behavior:
Expected behavior after a real project is created from template/ (via its generator or via ai-native bootstrap once available).
```

Changing the factory AGENTS.md does not automatically change generated project templates.

Changing the generated project AGENTS.md template does not automatically change the factory AGENTS.md.

If a task affects generated project behavior, the agent must verify the template and generator path, not only the current factory files.

## Generated Project Standard

Generated projects must be self-contained.

A generated project should receive its own:

```text
AGENTS.md
.agents/skills/
governance/
validation or test entrypoints
project documentation
```

A generated project must not require access to the factory workspace to understand its own operating rules.

External AI-NATIVE standards may be referenced only when the generated project explicitly adopts them through files, dependencies, contracts, documentation or generated metadata.

## Token Discipline

The agent must reduce token usage by default.

Rules:

```text
- read only files needed for the current task
- do not paste large files into responses
- summarize evidence instead of dumping logs
- prefer exact file paths over long explanations
- use skills for repeatable workflows
- use governance for state instead of restating history
- avoid scanning unrelated directories
- avoid restating AGENTS.md in final reports
```

If more context is needed, the agent must first look for the narrowest reliable source.

## Prompt Policy

Prompts should be compact.

A task prompt should include only:

```text
- target task or objective
- instruction to read AGENTS.md
- instruction to use relevant skills
- instruction to use governance as source of truth
- specific constraints for this execution
- expected final report format
```

Prompts must not repeat the full operating methodology.

If a prompt conflicts with governance, the agent must stop and report the conflict unless the user explicitly instructs a governance update.

## Governance Update Policy

The agent may update governance only when the current task requires it.

Governance updates must be evidence-based.

Rules:

```text
- do not mark a task closed without validation evidence
- do not mark human approval without explicit user approval
- do not open the next task during closure of the current one
- do not rewrite historical records without explicit instruction
- keep current execution and archive records consistent
- record residual risks and non-blocking issues honestly
```

## Commit Policy

Commits must be atomic and auditable.

Rules:

```text
- separate product commits from governance commits when practical
- do not mix unrelated repositories in one commit unless the task requires coordinated changes
- do not commit generated junk
- do not commit failing validation unless the failure is explicitly documented and accepted
- do not rewrite published history unless explicitly instructed
- do not push unless explicitly instructed or the applicable governance policy requires an attempt
```

Commit messages must describe the actual change and must not claim broader completion than evidence supports.

## Recovery Policy

Recovery must start with diagnosis.

The agent must not assume continuity from previous chat context.

Recovery sequence:

```text
1. inspect git state
2. inspect governance state
3. inspect current execution state
4. inspect recent commits
5. inspect uncommitted changes
6. classify task state
7. choose the safest next action
```

Possible recovery states:

```text
NOT_STARTED
IN_PROGRESS_UNCOMMITTED
IMPLEMENTED_UNVALIDATED
VALIDATED_UNCOMMITTED
COMMITTED_UNGOVERNED
CLOSED_LOCALLY_HUMAN_APPROVAL_REQUIRED
FORMALLY_CLOSED
INCONSISTENT_STATE
```

The agent must not implement new changes during recovery until the state is classified.

## Human Approval Policy

Human approval is required when governance defines a human-in-the-loop closure gate.

The agent may prepare a task for human approval only after:

```text
- SDD flow completed
- implementation completed
- validations completed
- commits created if required
- governance updated if required
- Inspector audit completed
- residual risks documented
```

The agent must not record formal human approval unless the user explicitly grants it.

## Validation Evidence Policy

Final reports must distinguish between:

```text
PASS:
A validation command was run and passed.

FAIL:
A validation command was run and failed.

NOT_RUN:
A relevant validation was identified but not run.

NOT_APPLICABLE:
A validation does not apply to the task.

CONTEXTUAL_NON_BLOCKING:
An issue exists but does not block closure under the applicable policy.
```

The agent must never hide:

```text
- warnings
- skipped checks
- dirty working trees
- failed commands
- unpushed commits
- unclear governance state
```

## File Change Policy

Before changing files, the agent must know:

```text
- why the file is in scope
- what acceptance criterion the change satisfies
- how the change will be verified
```

The agent must avoid:

```text
- unrelated cleanup
- style-only churn
- formatting unrelated files
- renaming without need
- moving files without governance reason
- deleting legacy files without explicit authorization
```

## Multi-Repository Policy

When a task affects multiple repositories, the agent must report per repository:

```text
- branch
- status
- files changed
- validation commands
- commit hash if committed
- remaining risk
```

The agent must not assume all repositories share the same branch, state or remote status.

## Security and Safety Policy

The agent must not:

```text
- expose secrets
- commit credentials
- weaken security controls
- bypass tests to make checks pass
- disable validators without justification
- perform destructive remote operations
- install dependencies without task justification
- execute unknown scripts without inspecting purpose
```

If a task requires a risky action, the agent must stop and request explicit user approval.

## AGENTS.md Maintenance Policy

This file should be stable.

Update this file only when:

```text
- the agent repeatedly makes the same mistake
- a stable factory rule changes
- a recurring review comment should become permanent
- routing guidance is needed to reduce unnecessary file reading
- the skill layout changes
- the governance architecture changes
- a new agent family requires a neutral adapter rule
```

Do not update this file for:

```text
- a new roadmap version
- a new task number
- a task closure
- a commit hash
- a temporary branch
- a one-off exception
- a current milestone state
```

Temporary or changing facts belong in governance, not here.

<!-- AI_NATIVE_FACTORY_DELIVERY_GOVERNANCE_REFERENCE_START -->
