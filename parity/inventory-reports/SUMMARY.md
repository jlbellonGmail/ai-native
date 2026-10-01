# M1.3 — Informe de solo lectura del estado real de los repos GI y el Starter

Generado 2026-09-30 con `parity/migrate-inventory.mjs` (solo lectura; ningún
archivo de ningún repo listado abajo fue modificado). Hash DB fuente:
`parity/hash-db/hash-db.json` (tags `v2.0.0`…`v2.0.5` de
`C:\Proyectos\template`, hasheado con normalización CRLF→LF).

**Ningún repo GI fue modificado.** Esta es una fotografía de su estado,
no una migración. La migración real (`--apply`) es una fase posterior
(M4/M6), no construida todavía, y requiere autorización explícita por
repositorio.

## Resumen

| Repo | Versión declarada | Total archivos | Idéntico | Modificado | Local | Duplicado | Tag más cercano |
|---|---|---|---|---|---|---|---|
| gi-clinicadental | (ninguna) | 365 | 7 | 54 | 304 | 0 | v2.0.0 (empate en 7) |
| gi-common-crm | (ninguna) | 294 | 151 | 21 | 122 | 0 | v2.0.1 (151) |
| gi-common-persons | (ninguna) | 310 | 157 | 20 | 133 | 0 | v2.0.3 (154) |
| gi-common-tenants | (ninguna) | 336 | 147 | 25 | 164 | 0 | v2.0.0 (147, empate con v2.0.1) |
| gi-ocr | (ninguna) | 521 | 96 | 70 | 355 | 0 | v2.0.0 (96) |
| gi-ot | (ninguna) | 297 | 1 | 61 | 229 | 6 | v2.0.0 (1; prácticamente sin rastro del circuito) |
| gi-platform-core | (ninguna) | 509 | 126 | 52 | 331 | 0 | v2.0.4 (123) |
| gi-vertical-dental | (ninguna) | 133 | 88 | 38 | 6 | 1 | v2.0.0 (88) |
| template-starter | (ninguna; manifest schema 1) | 175 | 164 | 11 | 0 | 0 | v2.0.3 (160, empate con v2.0.4) |

**Ningún consumidor declara su versión de plantilla** (confirma lo ya
documentado en la auditoría original): ni `template-starter`, que sí tiene
`scripts/template-starter-manifest.json`, declara `templateVersion` (su
manifest sigue en `schemaVersion: 1`, que no tiene ese campo). El resto ni
siquiera tiene manifest.

"Tag más cercano" es una heurística (el tag con más archivos `IDENTICAL_TO_TEMPLATE`
coincidentes), no una versión real declarada — son solo indicios de a qué
snapshot del circuito se parece más cada consumidor hoy.

## Lecturas

- **`gi-ot` casi no tiene circuito** (1 archivo idéntico de 297, el resto es
  61 modificado + 229 local + 6 posibles duplicados). Es el caso más alejado
  de TEMPLATE; conviene tratarlo como un caso especial en M6, no como parte
  de la primera oleada.
- **`template-starter`** es, como se esperaba, el más cercano al TEMPLATE
  real (164/175 idénticos), consistente con ser un repo "starter" recién
  sincronizado — aunque igual quedó 2 versiones atrás de v2.0.5 (ver la
  auditoría original: nunca se sincronizó a v2.0.5).
- **6 archivos `DUPLICATED_CAPABILITY`** detectados, todos en `gi-ot` y 1 en
  `gi-vertical-dental` — candidatos a revisión de si duplican algo que la
  plataforma v3 va a centralizar (MCP, skills, reglas de dominio). El
  heurístico es deliberadamente conservador; ver `parity/migrate-inventory.mjs`
  (`DUPLICATE_CAPABILITY_HINTS`).
- **`gi-vertical-dental`**: el repositorio remoto está vacío (ver auditoría
  original); este inventario corre contra el checkout local
  (`codex/vertical-dental-baseline`, sin pushear). 6 directorios de temp de
  pytest bloqueados por el sistema operativo, saltados correctamente (no
  cuentan en `totalFiles`).
- Varios repos tienen el working tree sucio al momento de la corrida
  (`gi-common-crm`, `gi-common-persons`, `gi-ocr`, `gi-vertical-dental`,
  `template-starter`) — trabajo del usuario en curso, ajeno a este
  inventario, que no se tocó.

## Archivos

Reporte completo por repo (todas las clasificaciones, archivo por archivo):
`parity/inventory-reports/<repo>.json`.

## Regenerar

```bash
node parity/hash-db/build-hash-db.mjs --source <ruta a template>
node parity/migrate-inventory.mjs --target <ruta al repo> --out parity/inventory-reports/<repo>.json
```
