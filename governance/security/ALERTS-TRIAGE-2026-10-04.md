# Triage de alertas de seguridad (2026-10-04)

Origen: auditoría PLATFORM independiente sobre `ccd981f` (hallazgo F3: 13 alertas de code scanning y 10 de Dependabot abiertas). Cada alerta tiene una de cuatro clasificaciones: `FIXED`, `FALSE_POSITIVE`, `ACCEPTED_WITH_JUSTIFICATION` o `BLOCKING`. **Ninguna quedó `BLOCKING`.** Ninguna se descartó en silencio: las descartadas llevan su justificación en GitHub y aquí.

Las alertas `FIXED` se cierran solas cuando el reanálisis de `main` ya no detecta el patrón; hasta ese reanálisis su estado en GitHub sigue siendo `open`. La columna «Estado final» se verifica después del merge.

## Code scanning (CodeQL)

| # | Sev. | Regla | Ubicación | Clasificación | Qué se hizo |
|---|---|---|---|---|---|
| 1 | high | `js/incomplete-sanitization` | `runtime/docs/doc-drift.mjs` | FIXED | El glob escapaba solo `.`; ahora escapa todos los metacaracteres de regex antes de traducir `*`. |
| 2, 3 | high | `js/incomplete-url-substring-sanitization` | `knowledge/scripts/validate-{agent,prompt}-registry-schema.mjs` | FIXED | `schema.$schema.includes("json-schema.org")` pasa a comparar el `hostname` de la URL parseada. |
| 4 | high | `js/file-system-race` | `runtime/bootstrap/install.mjs` | FIXED | Lectura directa con manejo de `ENOENT` (`runtime/lib/fs-safe.mjs`), sin `existsSync` previo. |
| 5 | high | `js/file-system-race` | `runtime/circuit/claims.mjs` | FIXED | Ídem. Se arreglaron también los otros dos sitios con el mismo patrón en el archivo. |
| 6 | high | `js/file-system-race` | `runtime/circuit/events.mjs` | FIXED | Ídem (`appendEvent`, `readEvents`, `verifyChain`). |
| 7 | high | `js/file-system-race` | `runtime/mcp-gateway/gateway.mjs` | FIXED | Ídem (`appendAudit`, `verifyAuditChain`, `loadMcpProfile`). |
| 8 | high | `js/file-system-race` | `runtime/packs/pack.mjs` | FIXED | Ídem; un directorio donde se declara un archivo cuenta como ausente. |
| 9 | high | `js/file-system-race` | `scripts/_deprecated/roadmap-close.mjs` | ACCEPTED_WITH_JUSTIFICATION | Script deprecado, CLI local interactiva de un solo usuario, sin entrada no confiable ni ejecución en CI; lee y reescribe el ROADMAP del propio checkout. No se modifica código deprecado. Descartada como *won't fix*. |
| 10 | high | `js/file-system-race` | `template/examples/reference-app/.../incident-repository.ts` | FIXED (2.ª pasada) | **Corrección posterior (2026-10-05):** la primera pasada solo quitó el `existsSync` previo a `mkdirSync`; el re-análisis real de `main` (`5a60072`) mantuvo la alerta ABIERTA y la auditoría PLATFORM independiente lo señaló (F-01), porque seguía el patrón `existsSync` → `readFileSync` en `save()` y `getAll()`. Ahora ambos leen directamente y tratan el error como «sin historial» (mismo comportamiento: archivo ausente o corrupto → lista vacía; comprobado). No está en el bundle de release. Se da por cerrada solo cuando GitHub la marque `fixed` tras el re-análisis. |
| 11 | high | `js/file-system-race` | `template/examples/reference-app/.../no-raw-error-validator.ts` | FIXED | `readdirSync({withFileTypes: true})` en lugar de `statSync` por entrada. |
| 12 | medium | `js/file-access-to-http` | `runtime/bootstrap/remote.mjs:97` | FALSE_POSITIVE | El dato que viaja a la petición es el `owner/repo` del lock, ya validado por `parseRepo`; el host es la constante `api.github.com`. No se envía contenido de archivos. Descartada como falso positivo. |
| 18 | medium | `actions/untrusted-checkout/medium` | `.github/workflows/l3-consumer.yml:116` | FALSE_POSITIVE | Es el checkout de la **plataforma** (repo fijado por `platform-repo`, rama por defecto, sin `ref` derivado de la PR); el checkout del código de la PR va aparte, a `consumer/`, sin credenciales. El commit a ejecutar se verifica antes: debe estar en el historial de la rama por defecto de la plataforma. El workflow corre con `contents: read`, sin secretos. Lo que CodeQL marca (ejecutar código tras traer una PR) es el diseño del gate L3 de consumidor y está acotado por esas garantías. Descartada como falso positivo. |
| 26 (2026-10-08) | medium | `js/file-access-to-http` | `runtime/bootstrap/remote.mjs:105` | FALSE_POSITIVE | Mismo patrón que #12; la línea se movió al añadir la cabecera `Authorization` de `v3.0.1`. Solo el `owner/repo` del lock (validado por `parseRepo`) llega a la URL; host constante `api.github.com`; el token viaja únicamente como cabecera hacia ese host; sin contenido de archivos. Descartada como falso positivo. |

## Dependabot

| # | Sev. | Paquete | Manifiesto | Clasificación | Qué se hizo |
|---|---|---|---|---|---|
| 2 | high | `brace-expansion` | `foundation/pnpm-lock.yaml` | FIXED | 5.0.6 → 5.0.12 (mismo cambio que la PR #26). |
| 26 | medium | `brace-expansion` | `foundation/pnpm-lock.yaml` | FIXED | Ídem. |
| 20 | medium | `baseline-browser-mapping` | `foundation/pnpm-lock.yaml` | FIXED | 2.10.33 → 2.11.27 (como la PR #25). |
| 28 | medium | `pytest` | `template@v2.0.5:requirements-dev.txt` | FIXED | 8.3.5 → 9.0.3 (como la PR #24). |
| 29 | medium | `mkdocs-material` | `template@v2.0.5:requirements-docs.txt` | FIXED | 9.6.18 → 9.7.7 (como la PR #23). |
| 77, 78 | high | `postcss` | `template/_deprecated/2026-06-11/package-lock.json` | ACCEPTED_WITH_JUSTIFICATION | Lockfile duplicado y **deprecado** (el activo es `pnpm-lock.yaml`); nunca se instala ni se ejecuta. Los contratos de `template` referencian su ruta como evidencia de archivo, por lo que no se borra. Descartadas como *not used*. |
| 42, 83 | medium | `postcss` | idem | ACCEPTED_WITH_JUSTIFICATION | Ídem. |
| 59 | low | `esbuild` | idem | ACCEPTED_WITH_JUSTIFICATION | Ídem. |

Las PRs de Dependabot #23–#26 quedan **superseded** por este cambio (aplica sus mismos parches); se cierran tras el merge. La PR #48 (`actions/checkout` 4.2.2 → 7.0.1) **no** se toca: es un cambio de plano de control que requiere revisión humana (ver `governance/SESSION-CONTEXT.md`).

## Riesgo residual

- Las 5 alertas del lockfile deprecado siguen existiendo en el grafo de dependencias, descartadas con justificación. Si se elimina esa carpeta en el futuro (hay que actualizar los contratos que la citan), desaparecen.
- Los arreglos `file-system-race` eliminan la ventana *comprobar-y-usar*; **no** convierten en atómico el ciclo leer-último-hash/añadir de `appendEvent` y `appendAudit` entre procesos concurrentes. Eso es una propiedad distinta, ya cubierta por el diseño (log por unidad, verificación de cadena) y no se afirma aquí.
