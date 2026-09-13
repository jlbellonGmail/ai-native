# Estado operativo del Template

## Contexto de trabajo

- Versión/base: evolución hacia TEMPLATE v2.0.0 desde la estable congelada
  v1.1.0; no se publica una release en este bootstrap.
- Fase: 01 — ASSESS / motor adaptativo (`06-assess-motor-adaptativo`).
- Estado de coordinación: RUNNING. Etapa: implementación, QA y revisión final
  completados localmente; pendiente commit, PR y CI.
- Completado: evaluador determinista de riesgo/profundidad, fallo cerrado,
  JSONL auditable, tests, documentación, índices y artefactos SDD.
- Pendiente: commit/push, crear PR contra `develop`, esperar CI y corregir
  cualquier fallo propio del alcance.
- Bloqueos del alcance actual: ninguno identificado. El checkout principal
  contiene cambios ajenos que se preservan; el trabajo usa aislamiento propio.
- Último checkpoint: contrato Feature aprobado, adaptadores sincronizados y
  evidencia de ASSESS en `runs/06-assess-motor-adaptativo/`.
- Siguiente acción exacta: revisar diff final, commitear, publicar PR y esperar
  todos los checks; detener sólo ante decisión humana MERGE/NO MERGE.

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

- Actualizado: 2026-09-13T05:33:58Z
- Rama: feature/06-assess-motor-adaptativo
- HEAD: c31cfcb (c31cfcb0a88bf229bfa8726916c5a52aa0eed6f9)
- Remoto: refs/remotes/origin/develop
- Working tree: dirty
- Worktrees: C:/Proyectos/template (develop); C:/Proyectos/worktrees/06-assess-motor-adaptativo (feature/06-assess-motor-adaptativo)
- PR activa: sin PR
- CI: sin CI
- Última release: {"name":"v1.1.0 — Roadmap → Analyst → Spec Reviewer → Builder → QA → Code Reviewer → .audit → HITL → PR","publishedAt":"2026-09-13T02:03:08Z","tagName":"v1.1.0"}

<!-- STATUS:AUTO:END -->
