# Estado operativo

Versión: v2.0.1
Estado general: v2.0.0 permanece publicada y congelada. La unidad
`23-manual-operativo-agents` está mergeada en `develop` mediante PR #102.
El preflight de release v2.0.1 está bloqueado por el CI post-merge: el
reconciliador Windows falló una vez y el test histórico de release-readiness
rechazó el candidato viejo tras el avance automático de `develop`.

## Próximo paso exacto

Resolver el gate post-merge fuera del alcance de v2.0.1 o registrar la
excepción autorizada; después ejecutar release-readiness para v2.0.1. No crear
tag ni publicar mientras el preflight no pase.

## Evidencia real

PR #69 (F08), PR #68 (F10), PR #67 (F12), PR #77 (F13), PR #78 (F15)
y PR #86 (F16) y PR #90 (F17) están mergeadas contra `develop`.
PR #91 está mergeada contra `main`; v2.0.0 conserva el commit esperado
`f5d4b6cc029c34c0d0c05831bfd28134276fa167`. PR #102 está abierta contra
`develop` y fue mergeada con `5f32865ab91eb0e5b62536adf2f674fbf10e62e2`.
El cierre automático marcó el ítem `[x]` en `origin/develop` con
`c206148d9fd6287a6269660e0727c92a09bd1577`.

## Incidencias

La suite local completa pasó 267 tests. El CI de feature pasó; el CI
post-merge falló en `local-reconciler-tests` por timeout de arranque y en
`test_release_gate_is_safe_for_the_current_v200_candidate` porque el script
devolvió `origin/develop no coincide con el commit candidato`. No se modificó
código funcional ni se forzó ningún estado.

<!-- STATUS:AUTO:BEGIN -->

## Estado verificado automáticamente

- Actualizado: 2026-09-18T13:26:37Z
- Versión: v2.0.0
- Rama: develop
- HEAD: c206148d9fd6287a6269660e0727c92a09bd1577
- Remoto: https://github.com/jlbellonGmail/template.git
- Working tree: dirty
- Worktrees: 2
- Worktrees Git: 2
- Unidades activas: = [feature/v2.0.1-23-manual-operativo-agents]
- PR activa: UNKNOWN / sin PR abierta
- CI: UNKNOWN / sin CI verificable
- CI vigente: UNKNOWN / sin CI verificable
- Última release: UNKNOWN / no disponible

<!-- STATUS:AUTO:END -->
