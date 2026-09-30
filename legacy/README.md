# legacy/ — frozen source material, not live instructions

This directory holds material imported for **extraction and regression-testing
purposes only** (M1–M3 of `governance/roadmaps/AI-NATIVE-V3-ROADMAP.md`). It
is not part of the operating ai-native factory and must not be treated as
agent instructions, governance, or an active part of this repository's own
methodology.

## `template-v2/`

A **filtered** import of TEMPLATE v2.0.5 (`github.com/jlbellonGmail/template`,
tag `v2.0.5`), produced with `git filter-repo` from a temporary clone (the
original repository was never modified). History for the kept paths is
preserved.

**Kept:** `scripts/` (29 PowerShell scripts, the agentic circuit),
`tests/` (35 files, 285 pytest cases — the regression baseline), `.agentic/`
(roles, model routing, security policy, MCP catalog, schemas), `evals/`,
the `.audit/` method files, `profiles/`, and the convention `README.md` in
each of `.audit/{evidence,history,reports}/` (these explain the naming
convention for those folders — method, not evidence itself; added in a
follow-up commit without individual file history, after the initial
filtered import, once `tests/test_audit_framework.py::
test_audit_evidence_and_reports_are_separate_from_runs` — which reads
them — surfaced the gap via the real CI baseline run). All 5
`.github/workflows/` (inert here: GitHub only reads workflows from the repo
root, not from a subdirectory — kept for reference/extraction only),
`docs/`, `AGENTS.md`, `CONSTITUTION.md`, `ROADMAP.md`, `STATUS.md`,
`README.md`, `pytest.ini`, `requirements-dev.txt`, `requirements-docs.txt`,
`mkdocs.yml`, `opencode.json`, `.mcp.json`, `.gitignore`, and exactly one
fixture file under `runs/` (`runs/v2.0.0/15-mcp-herramientas/authorization-example.md`,
a static MCP-scoped-write-authorization example that `test_mcp_tools.py`
reads — not a merge/HITL authorization).

**Deliberately excluded:**
- `CLAUDE.md` — the file Claude Code auto-loads as instructions. No test
  requires it (verified). Without it, this subtree is never picked up as
  live agent context by Claude Code.
- The rest of `runs/` (300 of 301 files) — historical work-unit evidence,
  not method; stays in the `template` repository.
- The actual *content* of `.audit/{reports,evidence,history}/` (audit
  reports, captured evidence, the score-history log) — same reasoning as
  `runs/`. Only each folder's `README.md` convention doc is kept (see
  above).
- `.claude/`, `.codex/`, `.opencode/` (generated adapter mirrors) — tests
  that exercise `sync-agentic-adapters.ps1` build their own throwaway
  fixtures for these; none read the real ones from this repo.
- Any path containing `D:\proyectos` or `ai-foundation`/`ai-knowledge`/
  `ai-template` references inside the kept docs/AGENTS.md is left exactly
  as committed in TEMPLATE v2.0.5 — it is that repository's own history,
  not this one's, and is out of scope for `governance/roadmaps/
  AI-NATIVE-V3-ROADMAP.md` M0.2's path-repair task.

**`AGENTS.md`/`CONSTITUTION.md`/`ROADMAP.md`/`STATUS.md` here describe
TEMPLATE's own circuit** (Planner/Builder/Reviewer, the 10-step flow, etc.)
**as it existed at v2.0.5.** They are kept only because `tests/` asserts
against their real content (structural checks, e.g. that `AGENTS.md`
documents the veredicto format). An agent operating in `ai-native` must
continue to follow `ai-native`'s own root `AGENTS.md`, never this one.

**Purpose of the 285 pytest cases:** they are the real, measured
paridad baseline (Contrato de Paridad, `governance/adr/
ADR-002-contrato-paridad-template-v205.md`, condition P38 TEST_PARITY).
Run via `.github/workflows/ci.yml`'s `legacy-template-baseline` job on both
Ubuntu and Windows. As components get extracted to `runtime/`, `contracts/`,
`core/`, etc. (M3), their corresponding tests move out of here with them
(per `parity/v2.0.5/tests-map.json`); this directory is retired once
`0 consumidores v2` remain (M6) and `template` itself is archived.

**Do not** modify files under `template-v2/` to "fix" them — bugs found in
this frozen baseline are tracked as defects (`governance/adr/
ADR-002-contrato-paridad-template-v205.md` section 3.6/3.5, `B01`–`B31`) and
fixed in their new destination during extraction (M3), with a regression
test, never by patching the frozen copy in place.
