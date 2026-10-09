# M7 — Inventario de limpieza (legado / deprecated)

Estado: **M7 EN CURSO** (no `M7_COMPLETED`). Base: `origin/main` `9c7db00` (PR #69). Este documento registra solo lo verificado con comandos; lo no auditado figura como `NOT_STARTED`/`INVENTORIED`.

Clasificación: ACTIVE, REQUIRED_FOR_{RUNTIME,CI,RELEASE,ROLLBACK,AUDIT,MIGRATION,COMPATIBILITY}, HISTORICAL_EVIDENCE, SUPERSEDED, UNUSED, UNKNOWN. Solo SUPERSEDED y UNUSED se eliminan.

## Métricas de partida (archivos versionados)

| Repo | Rama checkout | Archivos | Workflows | AGENTS.md | `deprecated` | `legacy` | Estado checkout | Estado M7 |
|---|---|---|---|---|---|---|---|---|
| ai-native | (limpieza) | 1517 | 14 | 12 | 120 | 219 | limpio | INVENTORIED / CLEANUP_READY (lote 1) |
| gi-platform-core | develop | 385 | 6 | 1 | 0 | 0 | **sucio (29)** | NOT_STARTED |
| gi-common-tenants | develop | 336 | 5 | 1 | 0 | 0 | **sucio (29)** | NOT_STARTED |
| gi-common-persons | develop | 294 | 5 | 1 | 0 | 0 | **sucio (29)** | NOT_STARTED |
| gi-common-crm | develop | 289 | 5 | 1 | 0 | 0 | **sucio (27)** | NOT_STARTED |
| gi-ocr | develop | 436 | 6 | 1 | 0 | 0 | **sucio (31)** | NOT_STARTED |
| gi-ot | develop | 297 | 1 | 2 | 0 | 0 | limpio | NOT_STARTED |
| gi-clinicadental | develop | 363 | 3 | 1 | 0 | 0 | limpio | NOT_STARTED |
| template-starter | main | 175 | 5 | 1 | 0 | 0 | 1 cambio | NOT_STARTED (canary histórico) |

Los checkouts sucios son del maintainer: no se tocan (limpiar en un worktree nuevo desde `origin/develop`).

## Candidatos de AI-Native

| Candidato | Archivos | Clasificación | Evidencia | Decisión |
|---|---|---|---|---|
| `scripts/_deprecated/` (ai-cli, quality-gates, roadmap-close, verify-w1t1, README) | 5 | **SUPERSEDED** | `git grep` sin llamadores ejecutables; su README declara que ni CI ni governance los invocan. Único vínculo: `package.json` `w1t1:verify`, cuya clasificación (`PACKAGE_LEVEL` → `BLOCKED`) depende del nombre del script, no del archivo (`scripts/audit-safe-script-mode.mjs:171`). Reemplazo: script `validate:audit-safe-script-mode`, que apunta a un validador existente; el fixture sigue verificando lo mismo. | **ELIMINAR** (lote 1). Recuperable desde Git. Debería cerrar la alerta de code scanning #9 (a verificar tras el merge) (`roadmap-close.mjs`). |
| `foundation/_deprecated/2026-06-11`, `knowledge/_deprecated/2026-06-11`, `template/_deprecated/2026-06-11` | 78 / 18 / 24 | **REQUIRED_FOR_CI** (hoy) | `ci.yml` ejecuta todos los `scripts/validate-*.mjs` de cada área; `validate-{legacy-inventory,historical-archive,duplicate-detection,obsolete-artifacts}.mjs` leen `_deprecated/2026-06-11/*.contract.json|md`, y `validation/roadmap-coverage.json` los enumera. | **CONSERVAR por ahora.** Borrarlos exige retirar a la vez 12 validadores, entradas de `roadmap-coverage.json`, `.github/**` (plano de control) y deliverables W8 de un roadmap cerrado. Candidato a PR dedicada con revisión humana (lote 2). |
| `template/_deprecated/.../package-lock.json` | 1 | SUPERSEDED (lockfile duplicado; activo: `pnpm-lock.yaml`) | Triage de alertas 2026-10-04; nunca se instala. | Se elimina junto con el lote 2 (no suelto: el contrato de inventario W8 lo enumera). |
| `legacy/template-v2/` | 165 | **REQUIRED_FOR_CI / AUDIT** | Job `legacy-template-baseline` en `ci.yml`; `parity/v2.0.5/*-map.json` y `build-*-map.mjs` lo referencian; `runtime/gates/gates.test.mjs`, `runtime/lib/result.conformance.test.ps1`, `evaluation/compat/*`, `evaluation/scenarios/*`. | **CONSERVAR.** Es la base de parity (`UNMAPPED=0`) y de la prueba v2→v3. Reducción posible solo tras auditar `parity/*-map.json` archivo por archivo (lote 3). |
| Rutas locales (`C:\Users`, `C:\Proyectos`) en `audit/profiles/TEMPLATE.md`, `governance/adr/ADR-002`, `ADR-003`, `governance/roadmaps/AI-NATIVE-V3-ROADMAP.md`, `governance/standards/ENGRAM-OPERATING-STANDARD.md` | 5 | DOCUMENTAL/HISTÓRICO (ningún código activo) | `git grep` fuera de `legacy`, archive, history, `.audit`. | Sanitizar en lote 3 si el contrato lo permite; ADR/roadmap son registros históricos. |
| Ramas remotas ya mergeadas en `main` (16): `audit/platform-521d203`, `develop`, `docs/*` (7), `feat/*` (2), `fix/*` (3) | — | SUPERSEDED | `git branch -r --merged origin/main`. | Borrar tras el merge humano del lote 1 y verificar que no sean ref de ruleset (`develop` **no** se borra: es la rama protegida). |
| `origin/docs/m6-closure-evidence` | — | **UNKNOWN** | No figura mergeada en git (la PR #69 pudo hacer squash/merge desde otra rama) y tiene worktree en `C:/Proyectos/_m6/ai-native-closure`. | No tocar hasta inspeccionar. |
| PR #48 (`dependabot actions/checkout 4.2.2→7.0.1`) | — | Ver sección PR #48 | Abierta, única PR abierta. | READ-ONLY. |

## Pendiente de auditar (no hechas en este lote)

M7.5 workflows (14), M7.6 scripts huérfanos, M7.7 tests, M7.8 docs (SESSION-CONTEXT dice "M6 no abierto" y `VERSION 3.0.0-dev`: **contradicción con M6 COMPLETED/v3.0.1**, a corregir en governance), M7.9 roles/skills, M7.10 MCP, M7.15 rulesets/checks, M7.16 brechas M6, GI por repo, métricas finales.

## Fuera del repo (solo informativo)

`C:/Proyectos/_m6/` contiene logs, venvs (`venv-*`), scripts de migración y cuatro worktrees temporales de M6; `C:/Proyectos/` raíz tiene ~40 scripts/CSV de auditoría de GitHub Actions y `backup-*`. No son repos versionados: no se borran sin inspección y confirmación del maintainer.
