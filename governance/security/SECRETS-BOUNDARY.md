# Frontera de los secretos de las Apps (`ai-native-trust`, `ai-native-worker`)

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

## Acción del maintainer (no la puede hacer el agente: no puede leer ni mover el valor de un secreto)

El Environment `ai-native-trust` **ya existe** y está restringido a la rama `main` (creado por el agente el 2026-10-03). Faltan, en este orden:

1. **Rotar la clave privada** de la App `ai-native-trust` (GitHub → Settings → Developer settings → GitHub Apps → *Generate a new private key*) y revocar la anterior.
   La ventana de exposición existió desde el merge de la PR #31 hasta la corrección de `merge-gate.yml`; no hay evidencia de abuso, pero no se puede descartar.
2. Cargar `TRUST_APP_ID` y `TRUST_APP_PRIVATE_KEY` como **secretos del Environment** `ai-native-trust` (no del repositorio).
3. **Borrar** `TRUST_APP_ID`, `TRUST_APP_PRIVATE_KEY`, `WORKER_APP_ID` y `WORKER_APP_PRIVATE_KEY` de los secretos **del repositorio**
   (`WORKER_*` no se usa en ningún workflow hoy).
4. Avisar al agente: añadirá `environment: ai-native-trust` a los jobs de `trust-gate.yml` y `merge-gate.yml` (hacerlo antes de tener los secretos en el
   Environment dejaría los gates sin credenciales y bloquearía los merges).

Hasta que eso ocurra, el riesgo residual es: **un actor con push de ramas puede leer los secretos del repositorio mediante un workflow de rama**.

## Estado D5 (2026-10-04, verificado contra GitHub)

* El maintainer rotó la clave privada de `ai-native-trust` (decisión D5). Las credenciales deben residir **exclusivamente** en el Environment `ai-native-trust`, restringido a `main`.
* El Environment `ai-native-trust` existe y está restringido a `main`. En la verificación del 2026-10-04 **su lista de secretos estaba vacía** y los cuatro secretos de repositorio (`TRUST_APP_ID`, `TRUST_APP_PRIVATE_KEY`, `WORKER_APP_ID`, `WORKER_APP_PRIVATE_KEY`) seguían a nivel de repositorio. El agente no puede leer ni mover valores de secretos.
* Los jobs de `trust-gate.yml` y `merge-gate.yml` declaran ya `environment: ai-native-trust`. Mientras el Environment no tenga los secretos, GitHub resuelve `secrets.TRUST_*` desde el repositorio (el gate sigue funcionando); cuando el maintainer los cargue en el Environment, prevalecen sobre los del repositorio.
* **Los `TRUST_*` de repositorio se eliminan SOLO después de verificar con una ejecución real que el Environment emite el check esperado.** `WORKER_*` no se eliminan hasta definir y verificar la frontera operativa de `ai-native-worker`.
* Hasta que esa limpieza se complete, el riesgo residual sigue siendo que un workflow de rama puede leer los secretos de repositorio; no se declara cerrado.
* Se añade el Environment `ai-native-human-review` (revisor requerido: el owner, restringido a `main`) para la aprobación humana de cambios de plano de control (D7, ver `HITL-MERGE-POLICY.md`). No contiene secretos.
