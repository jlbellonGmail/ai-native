# Project Agent Operating Contract

Entrypoint and router for this generated project. Stable and agent-neutral (Codex, Claude Code, OpenClaw, OpenCode, Cursor, Aider, Gemini-based and future agents). It holds identity, essential rules, source of truth, routing and non-negotiables; detail is loaded on demand. Full per-section checklists are central, not copied here: `ai-native run -- knowledge sdd/agents-contract-detail.md` (resolved from the release pinned in `ai-native.lock.json`; works offline from the cache).

This project was created from the AI-NATIVE template and follows: governance as source of truth, SDD, one task per execution, Builder + Inspector, real validations, auditable commits, controlled recovery, human approval when required, low token usage.

It must not contain temporary state: no roadmap names or versions, task or milestone IDs, closure status, branch names, commit hashes, next-task declarations, temporary exceptions or session facts. Those belong in this project's governance files.

---

## Core Principle

```text
AGENTS.md   how agents work          Git         what actually changed
Governance  what agents work on      Validators  what is proven
Skills      reusable procedures      Human       what is formally accepted
Prompts     the current request
```

---

## Project Boundary

This repository is a generated project, not the AI-NATIVE factory. Do not assume the factory workspace exists locally. The project must be operable from its own `AGENTS.md`, `.agents/skills/`, `governance/`, source code, tests, validators and documentation. External AI-NATIVE repositories are used only if this project explicitly references them (dependencies, packages, submodules, documentation sources, generated metadata, integration contracts).

Architecture: preserve the architecture the project declares (Clean, Hexagonal, modular monolith, services, ...). Keep domain logic out of infrastructure and adapters isolated when applicable; align tests with the boundary being changed; no cross-layer shortcuts; do not bypass public interfaces to make tests pass; no business rules outside their layer. If the architecture is unclear, inspect docs and structure first.

Standards: distinguish local project rules, adopted AI-NATIVE standards (explicitly referenced through governance, docs, dependencies, templates, contracts, configuration or generated files) and factory-only rules (which do not apply here).

---

## Authority Order

```text
1. Explicit user instruction in the current session
2. Project governance files under governance/
3. Nearest applicable AGENTS.md
4. Tool-specific bridge files, if present
5. Applicable local skills
6. Project files, tests, validators, scripts and docs
7. Real git state
8. External AI-NATIVE standards only when explicitly adopted by the project
9. External memory systems — auxiliary context only
10. Chat history — auxiliary context only
```

Governance decides task state; Git decides repository state; validators decide verification state; human approval decides formal acceptance. External standards do not override local governance unless adopted; memory never overrides governance; chat never overrides repository evidence; tool-specific files never contradict `AGENTS.md`.

---

## Routing (discover, then load only what the task needs)

```text
Start of any task           governance discovery (below), then this file only
Execute / recover / close   .agents/skills/ (task execution, recovery, delivery-governance)
SDD, /feature, /sdd-*       the `sdd` skill if installed; spec templates central: ai-native run -- knowledge sdd/feature-templates/spec-template.md (override: .specify/templates/)
Full per-section checklists  ai-native run -- knowledge sdd/agents-contract-detail.md
```

Locating ai-native: `ai-native.lock.json` pins the release (version + digest); `ai-native run -- <command>` is `node .ai-native/ai-native.mjs <command>` (generated launcher; `sdd`, `hitl`, `knowledge`, `l3`); `ai-native run -- knowledge <ref>` loads central methodology from it, verified against the cache (offline-capable). Generated projections (`.claude/`, `.opencode/`, `.codex/`) are never edited by hand: `consumer.mjs --drift` detects it, `--upgrade` regenerates by delta. Project files (specs, STATUS, `.specify/templates/` overrides) win over central defaults for project facts only. The ai-native constitution is the default and cannot be overridden; an optional local extension (.specify/memory/constitution.md, absent by default) holds additions only (`- [ADD] LOCAL-n: ...`).

Reusable workflows live in `.agents/skills/<name>/SKILL.md`; do not restate a workflow in chat when a skill defines it. Bridge files (`CLAUDE.md`, `OPENCLAW.md`) are thin adapters that read this file. On conflict, this file wins unless the user explicitly says otherwise. Per-tool directories (`.claude/`, `.opencode/`, `.codex/`) are generated projections, never sources.

---

## Governance Discovery and No Hardcoded State

Before any task, inspect `governance/roadmaps/`, `governance/SESSION-CONTEXT.md`, `governance/execution/current/`, `governance/execution/archive/` and determine: active roadmap or workstream, current and eligible task, closed and blocked tasks, validation gates, governance updates, human approval state, archive expectations.

Never infer project state from memory, previous chats, task numbering, filenames alone, assumptions, old prompts, old commits or stale branches. If governance is missing, incomplete or inconsistent, stop and report the gap before implementing, unless the user explicitly asks to create or repair governance.

---

## One Task Per Execution

Execute one task. Forbidden: batch execution, opening the next task, adjacent tasks, opportunistic refactors, broad cleanup, unrelated repositories, mixing task closures, changing the roadmap beyond scope. Stop if governance does not confirm the task as eligible.

---

## SDD Mandatory Flow

```text
1. Specify   2. Plan   3. Implement   4. Verify
```

No implementation before the task is specified and planned. Keep proportion: small change light, capability normal, critical or architectural full.

* **Specify**: objective, purpose, affected repositories, expected files, non-goals, acceptance criteria, validation expectations, risk boundaries. No file changes unless a planning artifact is requested.
* **Plan**: minimal change strategy, allowed files, validators, governance update, commit strategy, rollback. Minimize tokens, reads, traversal, unrelated edits.
* **Implement**: only the planned change. No hardcoded shortcuts, unrelated formatting, generated junk, broad rewrites, hidden behavior changes, silent deletion of legacy assets, remote-destructive actions, unjustified dependencies, or VERSION changes unless required.
* **Verify**: real commands and evidence: `git status --short`, `git branch --show-current`, `git log --oneline --decorate -5`, `git diff --check`, plus the project's validators (package scripts, `scripts/`, `validation/`, `tests/`, governance). Never claim PASS without a command run or existing evidence.

---

## Builder and Inspector

Every execution has both roles. Builder: minimum context, specify, plan, implement only the scope, validate, prepare commits. Inspector (critical, never a rubber stamp): audit the diff, scope control, no closed task reopened, no next task opened, validations real, commits auditable, governance consistent, residual risk, whether human approval is required.

---

## Files, Tokens, Commits, Recovery, Approval

* Before changing a file know why it is in scope, which criterion it satisfies and how it is verified. Avoid unrelated cleanup, style-only churn, renaming without need, moving files without governance reason, deleting legacy files without explicit authorization.
* Token discipline: read only what the task needs; never paste large files; summarize evidence; exact paths over prose; skills for repeatable workflows; governance for state; do not scan unrelated directories. Prompts stay compact: objective, read `AGENTS.md`, relevant skills, constraints, report format; a prompt that conflicts with governance stops the execution unless the user explicitly orders a governance update.
* Update governance only when the task requires it, with evidence. Do not mark a task closed without validation evidence, record human approval without explicit user approval, open the next task during closure, or rewrite historical records without explicit instruction.
* Commits are atomic and auditable; no generated junk, no failing validation unless documented and accepted, no rewriting published history, push only when instructed or governance requires it; messages never claim more than the evidence supports.
* Recovery starts with diagnosis (git state, governance state, current execution, recent commits, uncommitted changes), then classification: `NOT_STARTED`, `IN_PROGRESS_UNCOMMITTED`, `IMPLEMENTED_UNVALIDATED`, `VALIDATED_UNCOMMITTED`, `COMMITTED_UNGOVERNED`, `CLOSED_LOCALLY_HUMAN_APPROVAL_REQUIRED`, `FORMALLY_CLOSED`, `INCONSISTENT_STATE`. No new changes until classified.
* Human approval is required where governance defines a gate; never record it unless the user explicitly grants it.
* Reports distinguish `PASS`, `FAIL`, `NOT_RUN`, `NOT_APPLICABLE`, `CONTEXTUAL_NON_BLOCKING`, and never hide warnings, skipped checks, dirty trees, failed commands, unpushed commits or unclear governance.

---

## Security and Safety

Never: expose secrets, commit credentials, weaken security controls, bypass tests to make checks pass, disable validators without justification, perform destructive remote operations, install dependencies without task justification, execute unknown scripts without inspecting their purpose. A risky action requires explicit user approval first.

---

## Final Report Contract

```text
STATUS: SCOPE: REPOSITORIES: FILES CHANGED: VALIDATIONS: COMMITS: GOVERNANCE: INSPECTOR RESULT: RISKS: HUMAN APPROVAL: NEXT ELIGIBLE:
```

`NEXT ELIGIBLE` is informational and does not open that task. `STATUS` must not overstate closure. All uncertainty is explicit.

---

## Maintenance of this file

Update only when the agent repeats the same mistake, a stable rule changes, a recurring review comment should be permanent, routing would cut unnecessary reading, or the skill layout or governance architecture changes. Never for a roadmap version, task number or closure, commit hash, temporary branch, one-off exception or current milestone state. New procedure goes to a skill; new rule detail to the reference file.

<!-- AI_NATIVE_PROJECT_DELIVERY_GOVERNANCE_REFERENCE_START -->

---

## Delivery Governance Reference

Every executable project task is one feature unless project governance defines it as audit-only, documentation-only or governance-only. For feature-per-task, Git, GitHub, GitHub Actions, worktree, Engram, MCP, context-window, documentation, Security by Design, DevSecOps and monitoring rules, use:

- .agents/skills/delivery-governance/SKILL.md
- ai-native run -- knowledge sdd/feature-templates/documentation-template.md (a project may override it with its own .specify/templates/documentation-template.md)
- ai-native run -- knowledge sdd/feature-templates/security-template.md (a project may override it with its own .specify/templates/security-template.md)

Before closure, classify: branch / worktree, GitHub / push / PR, GitHub Actions / CI, Engram, MCP, technical documentation, user/project documentation, Security by Design, DevSecOps, observability / monitoring.

<!-- AI_NATIVE_PROJECT_DELIVERY_GOVERNANCE_REFERENCE_END -->
