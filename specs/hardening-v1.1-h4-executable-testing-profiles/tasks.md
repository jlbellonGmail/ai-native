# Task Checklist

## Metadata

Feature ID: hardening-v1.1-h4-executable-testing-profiles

Feature Name: H4 - Executable Testing Profiles

Status: COMPLETE

Created: 2026-07-02

Updated: 2026-07-02

---

## Rules

- Execute tasks in order unless the plan says otherwise.
- Do not add tasks silently.
- Do not implement outside this checklist.
- If a new task is required, update this file before implementing it.
- Keep each task small and verifiable.
- Mark tasks complete only after evidence exists.

---

## Tasks

### T001 - Preflight

Status: COMPLETE

Actions:

- Read governance.
- Confirm task eligibility.
- Inspect git state.
- Confirm working tree safety.

Evidence:

- All repos on main and clean before branch creation.
- main and origin/main matched in all four repos after fetch.

---

### T002 - Specify Review

Status: COMPLETE

Actions:

- Confirm spec.md exists.
- Confirm acceptance criteria.
- Confirm non-goals.
- Confirm risks.

Evidence:

- specs/hardening-v1.1-h4-executable-testing-profiles/spec.md

---

### T003 - Plan Review

Status: COMPLETE

Actions:

- Confirm plan.md exists.
- Confirm allowed files.
- Confirm validation strategy.
- Confirm governance strategy.

Evidence:

- specs/hardening-v1.1-h4-executable-testing-profiles/plan.md

---

### T004 - Implementation

Status: COMPLETE

Actions:

- Implement only planned changes.

Evidence:

- ai-template H4 profile assets, generated project scaffold assets and project template assets added.

---

### T005 - Validation

Status: COMPLETE

Actions:

- Run required validators.
- Run task-specific tests.
- Run git diff checks.

Evidence:

- `node scripts\validate-testing-profiles.mjs`: PASS
- `npm run validate`: PASS
- generated project smoke under `C:\tmp\ai-native-h4-smoke-codex`: PASS and cleaned.
- `git diff --check`: PASS

---

### T006 - Inspector Review

Status: COMPLETE

Actions:

- Inspect diff.
- Verify acceptance criteria.
- Verify governance consistency.
- Verify no scope creep.

Evidence:

- specs/hardening-v1.1-h4-executable-testing-profiles/inspector.md

---

### T007 - Commit

Status: COMPLETE

Actions:

- Create auditable commits after validation.

Evidence:

- ai-template product commit: `24e29b3`

---

### T008 - Closure Preparation

Status: COMPLETE

Actions:

- Update governance if required.
- Prepare human approval summary if required.
- Report next eligible task as informational only.

Evidence:

- Governance archive prepared under governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H4/.
- H4 state prepared as CLOSED_LOCALLY / HITL_REQUIRED.
