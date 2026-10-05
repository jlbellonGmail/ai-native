# Frontera de los secretos de las Apps (`ai-native-trust`, `ai-native-worker`)

> Estado vigente en la sección «Estado vigente» (más abajo). Lo anterior explica el problema y las defensas; los pasos históricos están marcados como superseded.

## El problema (hallazgo H1 de la auditoría PLATFORM del 2026-10-03)

GitHub ejecuta un workflow desde el **archivo del ref que lo dispara**. Con `push`, `pull_request`, `pull_request_review`,
`workflow_dispatch` o `schedule` en una rama, es el archivo **de esa rama**; con `pull_request_target` o `workflow_run`, el de la rama por defecto.
Cualquiera que pueda empujar una rama a este repo (la App `ai-native-worker` tiene `workflows: write`) puede añadir un workflow con
`on: push` que imprima **todos los secretos del repositorio**, sin PR ni revisión. Un detector no lo impide: actúa cuando el secreto ya se usó.

## Qué hace el repositorio (verificable, hoy)

* `runtime/gates/secret-exposure.mjs` + `supply-chain.mjs` (pr-gate y security-scan), **fail-closed**: cualquier mencion de `secrets` distinta de
  `GITHUB_TOKEN` (cualquier forma y sin distinguir mayusculas: `secrets.X`, `secrets['X']`, `toJSON(secrets)`, `secrets: inherit`, `${{ secrets }}` desnudo)
  solo se admite en workflows cuyos eventos TODOS ejecutan el archivo de la rama por defecto (`pull_request_target`, `workflow_run`, `workflow_call`,
  `issue_comment`, `issues`); si los eventos no se pueden determinar tambien es hallazgo. Es un analisis de texto de YAML: **puede sobre-reportar, no debe sub-reportar**,
  pero un parser casero no es una garantia. Probado con el `merge-gate.yml` que estuvo publicado (`pull_request_review` + clave de la App).
* `merge-gate.yml` ya no escucha `pull_request_review`. `post-merge.yml` lee la config del `base.sha`.
* Los cambios a `.github/**` marcan `trust-gate = neutral` (revisión humana obligatoria).

## Qué NO impide eso (límite explícito)

Un workflow malicioso en una rama **que no pase por una PR gateada** (un `push` directo a una rama nueva) se ejecuta antes de cualquier
gate. La única defensa preventiva es **no entregar el secreto a esas ejecuciones**: un *Environment* con ramas de despliegue limitadas a `main`.

## Estado vigente (2026-10-04, verificado contra GitHub)

| Secreto | Dónde vive | Quién puede leerlo |
|---|---|---|
| `TRUST_APP_ID`, `TRUST_APP_PRIVATE_KEY` | **Solo** Environment `ai-native-trust`, restringido a `main` | únicamente un job que corre en `main` con `environment: ai-native-trust` |
| `WORKER_APP_ID`, `WORKER_APP_PRIVATE_KEY` | **En ningún secreto de GitHub** (eliminados del repositorio el 2026-10-04) | nadie desde Actions; la clave la custodia el maintainer fuera de GitHub |

* Los secretos de repositorio están **vacíos** (`gh api repos/<repo>/actions/secrets` devuelve `[]`). Un workflow empujado a una rama ya no puede leer ninguna clave de App: el riesgo H1 queda cerrado para `ai-native-trust` y para `ai-native-worker`.
* `ai-native-trust`: keypair validado localmente contra `GET /app` (HTTP 200, `slug=ai-native-trust`, `id=5170488`). Tres ejecuciones reales de `trust-gate`/`merge-gate` con el Environment (la tercera ya sin fallback de repositorio): `create-github-app-token` PASS y los checks `ai-native/trust-gate` y `ai-native/merge-gate` emitidos por la App 5170488.
* Causa del 401 `A JSON web token could not be decoded` que apareció al pasar a Environment Secrets: la **carga** de los secretos, no el gate ni el workflow. La recarga byte-safe (`gh secret set TRUST_APP_PRIVATE_KEY --env ai-native-trust < archivo.pem` y `printf '%s' <ID> | gh secret set TRUST_APP_ID --env ai-native-trust`) lo resolvió. No cargar el PEM mediante una tubería de PowerShell.
* `ai-native-worker` **no es necesario hoy**: ningún workflow usa `secrets.WORKER_*` (el detector `secret-exposure` lo vigila). La App sigue instalada con sus permisos (incluido `workflows: write`) pero **sin credenciales expuestas en GitHub**. No se degradaron sus permisos. Si algún workflow llega a necesitarla, debe seguir el patrón de `ai-native-trust`: Environment propio restringido a `main` y verificación con ejecución real antes de usarla; nunca como secreto de repositorio.
* Se añadió el Environment `ai-native-human-review` (revisor requerido: el owner, restringido a `main`) para la aprobación humana de cambios de plano de control (D7, ver `HITL-MERGE-POLICY.md`). No contiene secretos.

## Pendiente humano (no comprobable desde la API)

* **Revocar las claves privadas antiguas de `ai-native-trust`** en la página de la App (la clave vigente es la generada el 2026-10-04). GitHub no expone por API la lista de claves de una App, así que el agente **no puede verificar** que se hayan revocado y **no lo da por hecho**. Hasta que el maintainer lo confirme, la rotación no está cerrada.
* Custodiar fuera del repositorio y de carpetas sincronizadas los `.pem` locales de ambas Apps.

## Historia (superseded): pasos que se pidieron al maintainer en 2026-10-03

Rotar la clave de `ai-native-trust`, cargarla como secreto del Environment, borrar los secretos del repositorio y añadir `environment: ai-native-trust` a `trust-gate.yml` y `merge-gate.yml`. Todo ejecutado (ver "Estado vigente"); queda solo la revocación de claves antiguas. La ventana de exposición existió desde el merge de la PR #31 hasta la corrección de `merge-gate.yml`; no hay evidencia de abuso, pero no se puede descartar.
