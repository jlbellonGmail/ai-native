# Estado operativo

Versión: v2.0.0  
Estado general: F07, F09 y F11 terminadas y mergeadas; F01–F07, F09 y F11 cerradas.  
Últimas fases completadas en la oleada paralela: F07 — Agentic Evals; F09 — Skills; F11 — Seguridad profesional.

## Próximas unidades habilitadas

- F08 — routing dinámico, habilitada por F07; pendiente y no iniciada.
- F10 — MCP y herramientas externas, habilitada por F09 + F11; pendiente y no iniciada.
- F12 — supply chain / CI-CD, habilitada por F06 + F11; pendiente y no iniciada.

## Evidencia real

PR #52 (F07), PR #53 (F09) y PR #54 (F11) están mergeadas contra `develop`.
CI de las PR y de `develop` verde en `circuit-tests`,
`local-reconciler-tests` y `product-tests`.
Runs: `runs/v2.0.0/12-agentic-evals/SUMMARY.md`,
`runs/v2.0.0/14-skills-reutilizables/SUMMARY.md` y
`runs/v2.0.0/16-seguridad-profesional/SUMMARY.md`.

## Qué sigue

F09 concluyó sin crear Skills porque no se demostró un procedimiento
especializado repetido que no estuviera mejor cubierto por `AGENTS.md` o por
scripts determinísticos. La infraestructura canónica queda disponible para
proyectos reales que demuestren esa necesidad.

F08, F10 y F12 están habilitadas por sus prerrequisitos indicados arriba,
pero ninguna de las tres comenzó.

## Incidencias

La suite local de F09 pasó 226 de 228 tests; dos fallos fueron permisos del
host Windows al crear repositorios temporales en tests preexistentes. La CI
vigente pasó los tres gates. Las advertencias de Node.js 20 en Actions no
bloquean la ejecución.

<!-- STATUS:AUTO:BEGIN -->

## Estado verificado automáticamente

- Actualizado: 2026-09-14T02:38:10Z
- Rama: maintenance/v2.0.0-T02-status-auto-postmerge
- HEAD: 0aba719 (0aba7190716a30ba70be887763df68ee0f8b8bbf)
- Remoto: refs/remotes/origin/develop
- Working tree: dirty
- Worktrees: C:/Proyectos/template (maintenance/v2.0.0-T02-status-auto-postmerge)
- PR activa: {"number":60,"title":"[v2.0.0][T02] Reconciliar bloque STATUS:AUTO post-merge","url":"https://github.com/jlbellonGmail/template/pull/60"}
- CI: {"conclusion":"","headSha":"4317b482cd6a7bce0f5e92ed73056fa7bbd9777f","name":"CI","status":"in_progress","url":"https://github.com/jlbellonGmail/template/actions/runs/34799827688"}
- Última release: {"name":"v1.1.0 — Roadmap → Analyst → Spec Reviewer → Builder → QA → Code Reviewer → .audit → HITL → PR","publishedAt":"2026-09-13T02:03:08Z","tagName":"v1.1.0"}

<!-- STATUS:AUTO:END -->
