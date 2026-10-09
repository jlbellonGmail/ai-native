# actions/checkout 4.2.2 → 7.0.1 (reemplazo controlado de la PR #48)

Fecha: 2026-10-09. Pin: `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1` en los 19 usos de 14 workflows (antes `11bd719… # v4.2.2`).

## Por qué esta PR y no la #48

La PR #48 de Dependabot quedó 39 commits detrás de `main` y falla `pr-gate` y `security-scan` con `docs-gate/DOCS_NOT_UPDATED` (cambia 14 workflows sin tocar documentación ni gobernanza). Ese era el fallo de `security-scan` que M7 dejó «no diagnosticado». Esta PR hace el mismo cambio de pins sobre un `main` actual y añade esta nota, que es lo que el gate exige; el gate no se modifica.

## Auditoría de cambios incompatibles (v4 → v7)

| Versión | Cambio | Efecto aquí |
|---|---|---|
| v5.0.0 | Node 24; runner mínimo 2.327.1 | Solo runners alojados de GitHub: cubierto. |
| v6.0.0 | Credenciales persistidas en un archivo aparte | Los checkouts de `pull_request_target` y el job de publicación ya usan `persist-credentials: false`. El único uso que depende de credenciales persistidas es el job de build de `release.yml` (valor por defecto), cuyo `git fetch origin main` (línea 74) las usa; sigue funcionando en v6+ porque git las lee del archivo referenciado en su configuración. No hay `git push` en ningún workflow. |
| v6.1 / v7.0.0 | `allow-unsafe-pr-checkout`: bloquea por defecto el checkout de un PR de fork en `pull_request_target` / `workflow_run` | `trust-gate` y `merge-gate` (`pull_request_target`) hacen checkout de `base.sha`, no de la cabeza del PR: no se ven afectados. |
| v7.0.1 | Correcciones de saneado de entradas (`--unset`, ramas) | Sin efecto. |

## Evidencia

`node scripts/validate-actions-pinned.mjs` PASS (todas las acciones fijadas por SHA completo); `node --test runtime/gates/*.test.mjs scripts/*.test.mjs` 80/80. Control plane (`.github/**`): merge humano; al mergear, cerrar #48 como superseded.

## Pilot offline (Linux): imagen y Docker Hub

El job `pilot offline (ubuntu)` falló en #78 y #79 con `toomanyrequests: You have reached your unauthenticated pull rate limit` al bajar `node:24-bookworm` de Docker Hub (causa demostrada con el stderr de docker; exit 125). La imagen solo hace de sandbox Node sin red (`docker run --network none`). Se cambia a `public.ecr.aws/docker/library/node:24-bookworm@sha256:3d27e5c1…`, el espejo oficial de Docker de las imágenes `library/*`: mismo digest de índice que sirve Docker Hub para `node:24-bookworm` (comprobado en ambos registros), misma major de Node y misma familia bookworm, fijada por digest (reproducible y verificable). Sin secretos nuevos; el test sigue siendo `--network none` real. `evaluation/m52/offline-image.test.mjs` exige el formato.
