# Estado operativo del Template

## Contexto de trabajo

- Versión/base: evolución hacia TEMPLATE v2.0.0 desde la estable congelada
  v1.1.0; no se publica una release en este bootstrap.
- Fase: 00 — Fundamentos v2 y compatibilidad; alcance 00.1–00.6.
- Estado de coordinación: RUNNING. Etapa: implementación documental completada;
  pendiente verificación final y Reviewer adversarial.
- Completado: principios y responsabilidades, estrategia de compatibilidad,
  matriz v1, invariantes/permisos, métricas, conceptos SDD/convergence/Evals,
  diseño mínimo de supervisor y procedimiento temporal, ROADMAP maestro v2.
- Pendiente: consolidar resultados de tests/validaciones, resolver hallazgos,
  commit, push, PR hacia develop y CI verde antes de PR_READY.
- Bloqueos del alcance actual: ninguno identificado. El checkout principal
  contiene cambios ajenos que se preservan; el trabajo usa aislamiento propio.
- Último checkpoint documental: propuesta aprobada e implementación entregada
  para verificación; evidencia en el expediente enlazado abajo.
- Siguiente acción exacta: verificar diff/documentación y resultados del suite,
  pasar Reviewer adversarial y corregir hasta converger; preparar PR con CI
  verde y detener para decisión humana. No iniciar Fase 01 en esta ejecución.

## Fuentes para retomar

- [Principios](PRINCIPLES.md), [reglas de operación](AGENTS.md),
  [dirección y backlog](ROADMAP.md).
- [Fundamentos técnicos](docs/tecnica/fundamentos-v2.md) y
  [procedimiento temporal](docs/usuario/fundamentos-v2.md).
- [Baseline verificada](.audit/evidence/2026-09-13-fundamentos-v2/baseline.md) y
  [propuesta aprobada](.audit/evidence/2026-09-13-fundamentos-v2/propuesta.md).

Rama, worktree, HEAD, PR, CI y release observados pertenecen únicamente al
bloque AUTO. No mantener otra tabla manual con esos valores. Es una fotografía
fechada: prevalecen Git/GitHub reales y los reportes de cada revisión, incluidos
los cambios posteriores a su actualización. Al retomar leer AGENTS/ROADMAP,
verificar Git y PR/CI, y refrescar con update-status/check-status; no perseguir
el SHA del commit que contendrá este archivo.

La Fase 00 usa una PR de gobernanza chore: el humano decide y ejecuta merge
sobre la PR real con CI verde. Su integración se deriva de GitHub MERGED,
sin cierre automático Feature ni marca nueva [x]. Después del merge, retomar
el primer ítem pendiente v2 con las precondiciones de aislamiento documentadas.
Las ramas históricas integradas no son trabajo activo; no se eliminan ni se
modifican worktrees ajenos.

<!-- STATUS:AUTO:BEGIN -->

## Estado verificado automáticamente

- Actualizado: 2026-09-13T04:21:07Z
- Rama: chore/fundamentos-v2
- HEAD: 9985e0b (9985e0bd14b653f4df163e28de48f72a208ce3b2)
- Remoto: refs/remotes/origin/develop
- Working tree: dirty
- Worktrees: C:/Proyectos/template (chore/cierre-pipeline-secuencial); C:/Proyectos/worktrees/fundamentos-v2 (chore/fundamentos-v2)
- PR activa: {"number":30,"title":"Establecer fundamentos v2 y compatibilidad","url":"https://github.com/jlbellonGmail/template/pull/30"}
- CI: {"conclusion":"success","headSha":"9985e0bd14b653f4df163e28de48f72a208ce3b2","name":"CI","status":"completed","url":"https://github.com/jlbellonGmail/template/actions/runs/34737533092"}
- Última release: {"name":"v1.1.0 — Roadmap → Analyst → Spec Reviewer → Builder → QA → Code Reviewer → .audit → HITL → PR","publishedAt":"2026-09-13T02:03:08Z","tagName":"v1.1.0"}

<!-- STATUS:AUTO:END -->
