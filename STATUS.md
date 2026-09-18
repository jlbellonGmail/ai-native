# Estado operativo

Versión: v2.0.1
Estado general: v2.0.1 publicada y congelada. v2.0.0 permanece intacta en
`f5d4b6cc029c34c0d0c05831bfd28134276fa167`.

## Estado final

- `develop`: `7592018d49f2877a...`.
- `main` en el commit de release: `fa8aade44fe808635e01916da7347b1d1837da7a`.
- PR #102 mergeó la unidad de AGENTS.md y cerró el ROADMAP correspondiente.
- PR #111 promovió `develop` a `main` con CI verde.
- Tag anotado `v2.0.1` apunta al commit definitivo de `main`.
- Release pública v2.0.1 publicada, no draft y no prerelease.
- PR #110 corrigió la carrera de asociación del guard de `develop`; su guard
  post-merge pasó.

## Evidencia

- Readiness: `PASS DRY-RUN` para v2.0.1 sobre `7592018d49f2877a...`.
- CI de `develop`: circuit-tests, product-tests, local-reconciler-tests PASS.
- CI de `main`: circuit-tests, product-tests, local-reconciler-tests PASS.
- `ROADMAP.md`: `23-manual-operativo-agents` en `[x]`.
- v1.1.0 y v2.0.0 conservan sus objetos anotados y commits históricos.

## Próximo paso

No iniciar v2.0.2, bootstrap ni instalación limpia en esta tarea.
