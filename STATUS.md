# Estado operativo

Versión: v2.0.0
Estado general: F05 terminada y mergeada; F01–F04 cerradas.
Última fase funcional terminada: F05 — contrato adaptativo de evidencias.
Siguiente fase: F06 — tests, CI y `.audit`.

## Qué ya funciona

El contrato adaptativo consume `sdd.json`, mantiene SUMMARY como entrada humana,
diferencia LIGHT/STANDARD/FULL, preserva legacy y valida convergencia JSON.

## Evidencia real

PR #42 mergeada contra `develop`; CI verde en `circuit-tests`,
`local-reconciler-tests` y `product-tests`. Run: `runs/v2.0.0/10-evidencias-adaptativas/SUMMARY.md`.

## Qué sigue

F06 queda pendiente y no fue iniciada. No se iniciaron fases posteriores.

## Incidencias

La suite local completa tuvo tres timeouts preexistentes del reconciliador Windows;
la suite focalizada F05 (44 pruebas) y CI remoto quedaron verdes.

## Detalle

[SUMMARY de F05](runs/v2.0.0/10-evidencias-adaptativas/SUMMARY.md)

<!-- STATUS:AUTO:BEGIN -->

## Estado verificado automáticamente

- Actualizado: 2026-09-14T00:12:34Z
- Rama: chore/f06-status-develop-final
- HEAD: b778950 (b778950889aff5e4506fdd4bbfe3e0a007ba6faf)
- Remoto: refs/remotes/origin/develop
- Working tree: dirty
- Worktrees: C:/Proyectos/template (chore/f06-status-develop-final)
- PR activa: sin PR
- CI: sin CI
- Última release: {"name":"v1.1.0 — Roadmap → Analyst → Spec Reviewer → Builder → QA → Code Reviewer → .audit → HITL → PR","publishedAt":"2026-09-13T02:03:08Z","tagName":"v1.1.0"}

<!-- STATUS:AUTO:END -->
