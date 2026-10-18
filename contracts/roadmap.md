# ROADMAP.md contract

ROADMAP.md is markdown, not structured data — this file documents its
contract in prose, parsed by `runtime/circuit/identity` (M3.2). Content is
local to each consumer (STA-01, `LOCAL_BY_DESIGN`); this contract (the
format and the parser) is central and shared.

## Item line format

```
- [ ] NN-slug — Title
- [ ] TNN-slug — Title          (maintenance)
- [ ] slug — Title              (milestone: no leading NN)
```

## States

| Marker | Meaning |
|---|---|
| `[ ]` | Pending |
| `[x]` | Done — merged into the integration branch |
| `[~]` | Accepted alias of `[ ]` on read, for compatibility with TEMPLATE v2.0.5 fixtures; never written by `ai-native` tooling |

`[-]` ("ready for PR") from TEMPLATE v2.0.5 is **not** a persisted ROADMAP
state in v3: see CIR-18 `PAR-CLOSURE-BY-MERGE` — the item goes straight from
`[ ]` to `[x]` **inside the PR that merges it**; "in progress" is observed
live via the open PR and the claims registry (CIR-24), not written into
ROADMAP.md.

## Transition rule

`[ ]` -> `[x]`: only by `unit ready`, committed as part of the Work Unit's
own PR. On the integration branch, the item is `[x]` if and only if that PR
is merged (NO MERGE leaves it `[ ]`, because the commit changing it was
never merged).

## Grouping

Items are grouped under `## vX.Y.Z — <label>` headings, matching TEMPLATE
v2.0.5's convention. The current development version is read from the
highest such heading when no other version source is available
(`runtime/lib` version-detection order, ported from the Template v2.0.5 status library (`status-lib`, tag v2.0.5)).

## Identity patterns

- Feature: `^[0-9]{2}-[a-z0-9]+(-[a-z0-9]+)*$`
- Maintenance: `^T[0-9]{2}-[a-z0-9]+(-[a-z0-9]+)*$`
- Milestone: `^(?!\d{2}-)[a-z0-9]+(-[a-z0-9]+)*$` (no leading `NN-`)

Same patterns as TEMPLATE v2.0.5's `workunit-lib` (tag v2.0.5) (CIR-01), carried
forward unchanged.
