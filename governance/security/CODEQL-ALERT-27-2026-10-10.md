# CodeQL alerta #27 (`actions/untrusted-checkout/medium`, `l3-consumer.yml:116`) — evidencia

Fecha: 2026-10-10. Estado: **`PREEXISTING_MAIN_FINDING`** — la alerta ya está abierta en `main` desde el merge de #78 (instancia en `refs/heads/main`, commit `0e439ec`) y **no la introduce #79**. **No se ha descartado, no hay waiver y no se ha tocado el estado de ninguna alerta**: la decisión de descartar #27 (o de endurecer el workflow) es humana.

## Veredicto

| Clase | Resultado |
|---|---|
| A. Vulnerabilidad real introducida por #79 | **No**: `l3-consumer.yml` no cambia en #79; su diff contra `main` (tras #78) está vacío. El pin de `actions/checkout` que cambió el archivo es el de #78. |
| B. Artefacto del análisis del merge ref de una PR grande | **Observado en los experimentos** (previos al merge de #78; ver la actualización de abajo para el estado actual): aparece con 305 o más ficheros cambiados y no con 211 o menos, con cualquier contenido, incluso con solo borrados (el umbral real está entre 212 y 305; no se acotó más). |
| C. Falso positivo ya triado | **Sí, para el mismo hallazgo**: `main` ya lo tiene (alerta **#18**, mismo `rule.id`, fichero y línea, descartada como `false positive` por el owner el 2026-10-05). |

## Hechos medidos (CodeQL `/language:actions`, resultados del SARIF)

| Análisis | Ficheros cambiados vs `main` | `results_count` |
|---|---|---|
| `main` `f8612b0` (análisis completo) | — | **1** (alerta #18, descartada) |
| #78 (checkout v7.0.1, 20 ficheros) | 20 | 0 |
| #78 + `ci.yml` de #79 | 18 | 0 |
| #79 con `legacy/` restaurado (B) | 211 | 0 |
| #78 + solo borrado de `legacy/` (A) | 183 | 0 |
| #78 + `.github` de #79 + `legacy/` borrado, sin más (C) | 183 | 0 |
| **#78 + borrado de `legacy/` y de las 3 `_deprecated` (E, solo borrados, ningún código)** | **305** | **1** (#27) |
| **#79 con el `.github` de #78 (D)** | **369** | **1** (#27) |
| **#79** | **369** | **1** (#27) |

* Todas las ramas probadas con ≤ 211 ficheros dan 0 y todas las de 305 o más, 1, **independientemente del contenido** (E son solo borrados); el umbral exacto entre 212 y 304 no se midió. El propio resumen del check de CodeQL dice: *«Alerts not introduced by this pull request might have been detected because the code changes were too large.»* Eso es coherente con una hipótesis (por encima de cierto tamaño el análisis deja de acotarse al diff y reporta el estado completo, que es lo que `main` ya reporta), pero **GitHub no documenta ese umbral ni ese mecanismo**: es una conclusión empírica de estos experimentos, no un comportamiento documentado.
* La huella (`primaryLocationLineHash`) cambió de `6bc77edd671f08f8:1` (main, pin v4.2.2) a `ae547d973d6b49ea:1` (PR, pin v7.0.1): por eso GitHub no la empareja con la #18 descartada y la muestra como alerta nueva (#27). No es un hallazgo nuevo: mismo `rule.id`, fichero y línea.
* Alerta de otra clase: durante estas pruebas CodeQL levantó **#30 `js/http-to-file-access`** en `evaluation/m52/update-offline-image.mjs` (código nuevo de #78). Esa **sí era real y se corrigió** (el script ya no escribe datos de red a disco): ver `ACTIONS-CHECKOUT-7.0.1.md`.

## Actualización tras el merge de #78 (estado vigente)

* La alerta #27 está **abierta en `refs/heads/main`** (commit `0e439ec`, el merge de #78), además de en `refs/pull/79/merge` y en las PRs de experimento #85 y #86. Es la única alerta de code scanning abierta en `main`. #18 (mismo hallazgo, huella anterior) sigue descartada como falso positivo.
* #79 no la introduce ni la agrava: no modifica `l3-consumer.yml`. Su origen en `main` es el cambio de pin de `actions/checkout` de #78, que cambió la huella (ver abajo) y por eso GitHub ya no la empareja con #18.
* Los experimentos de la tabla se midieron **antes** de este merge y se conservan como evidencia histórica. El umbral de tamaño explica por qué el análisis de una PR grande (≥ 305 ficheros) la reportaba; **no explica** por qué está en `main`, cuyo análisis es completo: ahí la causa coherente con los datos es solo el cambio de huella, y esta nota no la da por demostrada.

## Estructura del workflow (por qué no es explotable)

`l3-consumer.yml` es `workflow_call` con `permissions: contents: read` y sin secretos.

* El paso marcado (`Checkout platform (default branch)`, líneas 116-124) **no tiene `ref:`**: obtiene la rama por defecto del repositorio de plataforma que fija el input `platform-repo` (por defecto `jlbellonGmail/ai-native`), con `persist-credentials: false`. Un `ref` derivado del PR queda explícitamente descartado en el comentario del propio paso.
* El código del PR (`consumer/`) se baja en otro paso, también sin credenciales, y se trata como dato; lo único que se ejecuta de él son sus propios tests de producto, con permisos de solo lectura y sin secretos, que es el propósito del gate L3 (modelo de amenaza P44 documentado en la cabecera del workflow).
* El commit de plataforma sale del lock de la rama **base** y debe estar en el historial de la rama por defecto de la plataforma antes de ejecutarse.

## Qué queda para un humano

1. Decidir si descarta #27 como falso positivo (mismo criterio que #18) o si prefiere endurecer el workflow (p. ej. separar el checkout del consumidor en un job sin acceso a `platform/`); eso toca `.github/**` y no se hizo aquí.
2. Tras el merge de #78, `main` ya muestra la huella nueva (#27); es la misma alerta que #18 con otra huella. El merge de #79 no cambia esto.

Experimentos: PRs #81–#86 (borradores, cerradas, ramas borradas); no contienen nada que no esté en #78/#79.
