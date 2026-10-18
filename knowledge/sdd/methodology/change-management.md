# Change management (`/sdd-change`)

A requirement change flows in a fixed order: **spec, then plan and tasks, then code.**

1. Update `spec.md`: new/changed requirement in EARS, edge cases, non-goals. Identifiers stay stable; never renumber.
2. Identify the affected parts of `plan.md` and `tasks.md` and update them. Done tasks affected by the change are not rewritten: add new tasks.
3. Show the spec diff. Then implement through `/sdd-implement`.

Changes to a closed work unit are a new work unit that references the old one; closed tasks are not reopened silently.

Compatible changes to foundation/knowledge reach consumers by version bump (pinned in `ai-native.lock.json`) and a delta-only upgrade; nothing is overwritten in place.
