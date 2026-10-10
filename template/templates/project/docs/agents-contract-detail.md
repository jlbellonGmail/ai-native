# AGENTS.md — detailed operating contract (reference)

Verbatim detail of the sections that this project's `AGENTS.md` summarizes as a router. `AGENTS.md` keeps every non-negotiable rule inline; load this file when a phase needs the full checklist. Moved unchanged; the rules did not change.

---

## Tool Compatibility

This project may be used by multiple AI agents.

Agent-neutral files:

```text
AGENTS.md
.agents/skills/
governance/
```

Optional tool-specific bridge files may exist as thin adapters:

```text
CLAUDE.md
OPENCLAW.md
OPENCODE.md
CURSOR.md
```

Bridge files must not duplicate the full methodology.

Bridge files may only instruct the tool to:

```text
- read AGENTS.md
- use governance as source of truth
- use local skills if supported
- follow SDD
- preserve one-task-per-execution discipline
```

If a bridge file conflicts with AGENTS.md, AGENTS.md wins unless the user explicitly says otherwise.

## Skills Location

Reusable workflows must live under:

```text
.agents/skills/
```

Each skill must be a directory containing:

```text
SKILL.md
```

A skill may also contain:

```text
scripts/
references/
assets/
templates/
```

Skills are used for repeatable procedures, including:

```text
- task execution
- recovery
- governance closure
- validation
- audit
- release checks
- domain-specific project workflows
```

AGENTS.md defines stable rules.

Skills define operational procedures.

Prompts define the current execution request.

Governance defines current state.

## Phase 1 — Specify

The agent must define:

```text
- task objective
- engineering purpose
- affected modules
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

Minimum verification:

```bash
git status --short
git branch --show-current
git log --oneline --decorate -5
git diff --check
```

The agent must also run project-specific validators discovered from the repository, including where applicable:

```text
package.json
pyproject.toml
requirements.txt
scripts/
validation/
tests/
docs/
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
- separate implementation commits from governance commits when practical
- do not mix unrelated changes in one commit
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
