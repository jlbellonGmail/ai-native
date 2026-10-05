# Warnings de GitHub Actions: análisis y decisión (2026-10-05)

Origen: anotaciones reales de los check-runs de `main` (`5a60072`) y de los logs de `trust-gate`/`merge-gate`. Regla: **ningún warning no crítico justifica tocar los workflows del modelo de confianza (P44/P45) sin poder validar el cambio antes de mergearlo.** Un fallo en `trust-gate` o `merge-gate` bloquea todo merge (fail-closed) y el fix pasaría por esos mismos gates.

| # | Warning | Dónde (evidencia) | Riesgo hoy | Decisión |
|---|---|---|---|---|
| W1 | `Node.js 20 is deprecated … actions/checkout@11bd719…` | 13 anotaciones en los check-runs de `main`; todas las `actions/checkout` fijadas a v4.2.2 | Ninguno: el runner ya **fuerza** la ejecución en Node 24 (lo dice el propio mensaje) y los jobs pasan | **Diferido**, ver «Plan escalonado» |
| W2 | `Input 'app-id' has been deprecated … Use 'client-id'` | `create-github-app-token@v3.2.0` en `trust-gate.yml` y `merge-gate.yml` | Ninguno: el input sigue funcionando y la acción está fijada por SHA | **Diferido**: exige un dato nuevo (el *Client ID*, distinto del App ID 5170488) |
| W3 | `actions/attest-sbom has been deprecated, please use actions/attest` | `release.yml` (build/publish/verify) | Ninguno hoy: el README de la acción dice que seguirá funcionando como envoltorio de `actions/attest`, con inputs compatibles | **Diferido** hasta después de `v3.0.0`: el paso `publish` no se puede ensayar sin publicar |
| W4 | Futura migración de `ubuntu-latest` a Ubuntu 26 | Dato aportado por el maintainer; **el agente no lo verificó contra un anuncio de GitHub**. Los runs actuales usan Ubuntu 24.04 (`ubuntu24/20260927.320` en el log) con `ubuntu-latest` | Posible deriva de herramientas el día del cambio | **Abierto, NO VERIFICADO**: fijar `ubuntu-24.04` sería un cambio de plano de control; evaluarlo tras `v3.0.0` con una ejecución de prueba en la imagen nueva |
| W5 | Aviso sobre `pull_request_target` | No hay anotación con ese texto en los runs de `main`; el aviso no se pudo reproducir | — | **NO VERIFICADO**: si el maintainer lo vuelve a ver, aportar el texto exacto del run |

## Por qué no se actualiza `actions/checkout` en los gates ahora (PR #48 de Dependabot)

`actions/checkout` **v7.0.0** introdujo «block checking out fork PR for `pull_request_target` and `workflow_run`» y v7.0.1 ajusta el chequeo (*skip running unsafe pr check if input is default*). `trust-gate.yml` y `merge-gate.yml` se ejecutan con `pull_request_target`/`workflow_run`, es decir, justo el contexto donde cambia el comportamiento. Ese cambio es **favorable** en principio (los gates hacen checkout del `base.sha` y traen la cabeza de la PR solo como datos), pero:

- un workflow `pull_request_target` siempre corre desde la **base**, así que el cambio **no se puede ensayar en la propia PR**: se ensaya recién al mergearlo;
- el `Environment ai-native-trust` está restringido a `main`: tampoco se puede ensayar desde una rama.

Por eso #48 queda **abierta** (bloqueada por diseño, `CONTROL_PLANE_REQUIRES_HITL`) y es una decisión humana consciente, no un olvido.

### Plan escalonado (para después de `v3.0.0`)

1. Actualizar `actions/checkout` a v7.0.1 (SHA `3d3c42e5aac5ba805825da76410c181273ba90b1`, ya verificado contra el tag) en los workflows que corren con `pull_request`/`push` (CI, CodeQL, SBOM, Trivy, release, pilot, L3): **sí se ensayan en su propia PR**.
2. Para `trust-gate.yml`, `merge-gate.yml` y `post-merge.yml`: ensayo previo en un repositorio de prueba con un Environment equivalente; solo entonces la PR de plano de control con aprobación humana.
3. Cerrar #48 como superseded cuando 1 y 2 estén mergeados.

## Cómo migrar `app-id` → `client-id` sin dejar los gates sin credenciales

El orden importa (un cambio previo a tener el dato rompe `trust-gate`):

1. El maintainer añade al Environment `ai-native-trust` el *Client ID* de la App como **variable** (`TRUST_APP_CLIENT_ID`; no es un secreto).
2. Solo entonces una PR de plano de control cambia `app-id: ${{ secrets.TRUST_APP_ID }}` por `client-id: ${{ vars.TRUST_APP_CLIENT_ID }}` en los dos workflows, validada con la verificación real (`create-github-app-token` PASS y checks emitidos por la App 5170488) tras el merge.
3. Retirar `TRUST_APP_ID` del Environment después de esa verificación.

Mientras tanto el warning es inocuo y está **registrado**, no oculto.
