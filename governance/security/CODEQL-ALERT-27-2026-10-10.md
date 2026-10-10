# CodeQL alerta #27 (`actions/untrusted-checkout/medium`, `l3-consumer.yml:116`) — evidencia

Fecha: 2026-10-10. Estado: **EXPLICADA (no introducida por #79)**. **No se ha descartado, no hay waiver y no se ha tocado el estado de ninguna alerta**: la decisión de descartar #27 (o de endurecer el workflow) es humana.

## Veredicto

| Clase | Resultado |
|---|---|
| A. Vulnerabilidad real introducida por #79 | **No**: `l3-consumer.yml` no cambia en #79 salvo el pin de `actions/checkout` (el de #78). |
| B. Artefacto del análisis del merge ref de una PR grande | **Sí** (ver experimentos): aparece con ≥ 305 ficheros cambiados, con cualquier contenido, incluso con solo borrados. |
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

* Todas las ramas `< 305` ficheros dan 0; todas las `≥ 305`, 1, **independientemente del contenido** (E son solo borrados). El propio resumen del check de CodeQL dice: *«Alerts not introduced by this pull request might have been detected because the code changes were too large.»* Es el comportamiento documentado: por encima de un tamaño el análisis deja de acotarse al diff y reporta el estado completo, que es lo que `main` ya reporta.
* La huella (`primaryLocationLineHash`) cambió de `6bc77edd671f08f8:1` (main, pin v4.2.2) a `ae547d973d6b49ea:1` (PR, pin v7.0.1): por eso GitHub no la empareja con la #18 descartada y la muestra como alerta nueva (#27). No es un hallazgo nuevo: mismo `rule.id`, fichero y línea.
* Alerta de otra clase: durante estas pruebas CodeQL levantó **#30 `js/http-to-file-access`** en `evaluation/m52/update-offline-image.mjs` (código nuevo de #78). Esa **sí era real y se corrigió** (el script ya no escribe datos de red a disco): ver `ACTIONS-CHECKOUT-7.0.1.md`.

## Estructura del workflow (por qué no es explotable)

`l3-consumer.yml` es `workflow_call` con `permissions: contents: read` y sin secretos.

* El paso marcado (`Checkout platform (default branch)`, líneas 116-124) **no tiene `ref:`**: obtiene la rama por defecto del repositorio de plataforma que fija el input `platform-repo` (por defecto `jlbellonGmail/ai-native`), con `persist-credentials: false`. Un `ref` derivado del PR queda explícitamente descartado en el comentario del propio paso.
* El código del PR (`consumer/`) se baja en otro paso, también sin credenciales, y se trata como dato; lo único que se ejecuta de él son sus propios tests de producto, con permisos de solo lectura y sin secretos, que es el propósito del gate L3 (modelo de amenaza P44 documentado en la cabecera del workflow).
* El commit de plataforma sale del lock de la rama **base** y debe estar en el historial de la rama por defecto de la plataforma antes de ejecutarse.

## Qué queda para un humano

1. Decidir si descarta #27 como falso positivo (mismo criterio que #18) o si prefiere endurecer el workflow (p. ej. separar el checkout del consumidor en un job sin acceso a `platform/`); eso toca `.github/**` y no se hizo aquí.
2. Tras el merge de #78 y #79, `main` mostrará la huella nueva si CodeQL sigue reportándola; es la misma alerta con otra huella.

Experimentos: PRs #81–#86 (borradores, cerradas, ramas borradas); no contienen nada que no esté en #78/#79.
