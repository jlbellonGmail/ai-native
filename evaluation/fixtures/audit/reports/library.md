---
targetRepo: fixture/slugify-lite
targetCommit: e412119a7ecff9df15a24281f056c90e6b3d5e2d
platform:
  version: v3.0.0-alpha.1
  commit: 454aada60509ef81ab69a04b4cb608ab6a1cc4db
auditMethod: "1.2"
profile: LIBRARY
tool:
  name: claude-code (claude -p, independent invocation)
  model: claude-opus-5-5
date: 2026-10-03T13:45:00Z
scope: full repository, 7 versioned files, 3 tests executed
score: 72
isMergeGate: false
---

## Resumen

- **Repositorio:** `slugify-lite` (librería ESM, una sola función) · **Branch:** `main` · **targetCommit:** `e412119` · **Worktree:** limpio · **Tags:** ninguno (`git tag -l` vacío)
- **Estándar:** QUALITY_SCORE 1.1 + AUDIT_RULES 1.1 · **Perfil:** LIBRARY 1.2 · **Fecha:** 2026-10-03
- **Alcance:** 7 ficheros versionados: `src/index.mjs`, `test/index.test.mjs`, `.github/workflows/ci.yml`, `package.json`, `README.md`, `CHANGELOG.md` y `LICENSE`. No hay dependencias.

Es una librería pequeña y bien acotada. La API pública es solo `slugify`, expuesta a través de `exports` (`package.json:7`). La CI es mínima pero está bien endurecida, y los 3 tests pasan.

Defectos principales:
- La validación de `separator` (`src/index.mjs:11`) acepta letras, dígitos y mayúsculas. Con un separador alfanumérico la salida se corrompe.
- No hay proceso de release verificable: no hay tags, ni workflow de publicación, ni política de deprecación.
- La documentación de instalación y de contribución es incompleta.
- No hay controles estáticos.

- **Score bruto:** 71,50/100 · **Quality Gate:** ninguno (no hay BLOCKER ni CRITICAL, y la suite principal pasa) · **Score final:** 71,50 → 72 (redondeo half-up a entero, como pide el formato)
- **Confianza:** MEDIA · **Estado:** APTO CON CORRECCIONES

## Verificación ejecutada

`VERIFICACIÓN OFICIAL DEL PROYECTO`: `node --test`, que es el mismo comando que `package.json:10` (`scripts.test`) y `.github/workflows/ci.yml:16`.

```
✔ basic text, accents and punctuation (61.0362ms)
✔ custom separator and maxLength never leave a trailing separator (1.571ms)
✔ invalid input is rejected (6.139ms)
ℹ tests 3
ℹ suites 0
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 709.8339
EXIT=0
```

Estado: **VERIFICADO**, 3/3 pass y exit code 0. No se ejecutó ningún otro comando aparte de la lectura de ficheros y git (`ls-files`, `log`, `tag -l`, `branch -a`).

## Puntuación por criterio

| Área | Peso | Raw | Subcriterios | Evidencia |
|---|---:|---:|---|---|
| Q1 Contrato | 12 | **9,75** | Q1.1 2,25 (MENOR) · Q1.2 2,25 (MENOR) · Q1.3 2,25 (MENOR) · Q1.4 3 (COMPLETO) | **Q1.1:** propósito claro (`README.md:3`), pero no declara que todo lo que no sea ASCII latino se descarta (H13). **Q1.2:** `slugify`, `separator` y `maxLength` existen (`src/index.mjs:9`), pero el separador alfanumérico corrompe la salida y `maxLength` no se valida (H1, H8). **Q1.3:** mayúsculas aceptadas frente a lo documentado en `README.md:10` y `src/index.mjs:2,7` (H2). **Q1.4:** ningún requisito declarado obligatorio queda incompleto. La API documentada coincide con la exportada (`README.md:6`, `package.json:7`, `src/index.mjs:9`). |
| Q2 Reutilización | 12 | **10,5** | Q2.1 2,25 (MENOR) · Q2.2 2,25 (MENOR) · Q2.3 3 · Q2.4 3 | **Q2.1:** `exports`, `files`, `engines` y la ausencia de dependencias son correctos al inspeccionarlos (`package.json:7-9`), pero la instalación en un proyecto limpio está NO VERIFICADA. **Q2.2:** residuos de fixture en metadatos publicables (H11). **Q2.3:** las opciones y sus defaults están documentados (`README.md:10`) y coinciden con `src/index.mjs:9`. **Q2.4:** no hay rutas, dependencias ni configuración local, y Node ≥20 está declarado (`package.json:9`, `README.md:11`). |
| Q3 Arquitectura | 12 | **12** | Q3.1 3 · Q3.2 3 · Q3.3 3 · Q3.4 3 | La estructura `src/` y `test/` es coherente. La superficie pública es una sola función (`src/index.mjs:9`), y el mapa `exports` (`package.json:7`) impide importar internos. No hay código muerto ni duplicación. Las opciones van en un objeto, que se puede extender sin romper la firma. |
| Q4 Documentación | 12 | **5,75** | Q4.1 3 · Q4.2 0,75 (DÉBIL) · Q4.3 1 (PARCIAL) · Q4.4 0 (AUSENTE) · Q4.5 1 (PARCIAL) | **Q4.1:** el README es breve y correcto, con propósito, ejemplo, opciones, SemVer y versión de Node. **Q4.2:** no hay comando de instalación (H3). **Q4.3:** no documenta test ni release (H12). **Q4.4:** no hay convenciones de contribución (H5). **Q4.5:** un solo ejemplo, los errores no aparecen en el README y no hay troubleshooting (H12). El CHANGELOG existe (`CHANGELOG.md:1-10`). |
| Q5 Calidad | 16 | **10,75** | Q5.1 0 (AUSENTE) · Q5.2 1,5 (PARCIAL) · Q5.3 4 · Q5.4 3 · Q5.5 2,25 (MENOR) | **Q5.1:** no hay lint, format ni typecheck (H6). **Q5.2:** hay tests de la API pública, pero ninguno de compatibilidad entre versiones ni de bordes (H7). **Q5.3:** 3/3 pass, verificado. **Q5.4:** cada entrada del CHANGELOG tiene test: 0.2.0 en `test/index.test.mjs:12`, 0.3.0 y la regresión de 0.3.1 en `test/index.test.mjs:13`. **Q5.5:** la CI ejecuta los tests en push y PR (`ci.yml:2-6,16`) y no hay `continue-on-error`. Que sea check requerido está NO VERIFICADO (H14). |
| Q6 Release | 16 | **6,0** | Q6.1 0,75 (DÉBIL) · Q6.2 0,75 (DÉBIL) · Q6.3 2,25 (MENOR) · Q6.4 0,75 (DÉBIL) · Q6.5 1 (PARCIAL) · Q6.6 0,5 (DÉBIL) | **Q6.1:** la estrategia no está definida y el historial es un solo commit (H15). **Q6.2:** la protección de ramas está NO VERIFICADA; solo hay indicio por `pull_request` (`ci.yml:5`) (H14). **Q6.3:** checkout fijado por SHA (`ci.yml:13`), pero la versión de Node ni se fija ni recorre el rango de `engines` (H9). **Q6.4:** se declara SemVer y la versión 0.3.1 coincide en `package.json:3` y `CHANGELOG.md:3`, pero no hay ningún tag, ni firmado ni sin firmar (H4). **Q6.5:** no hay mecanismo de publicación reproducible (H4). **Q6.6:** no hay política de deprecación; solo `engines` (H4). |
| Q7 Seguridad | 12 | **11,25** | Q7.1 3 · Q7.2 2 · Q7.3 2 · Q7.4 2 · Q7.5 2,25 (MENOR) | **Q7.1:** no hay secretos en los 7 ficheros. **Q7.2:** cero dependencias, así que no hace falta lockfile. **Q7.3:** `permissions: contents: read` (`ci.yml:7-8`), acción fijada por SHA (`ci.yml:13`) y `persist-credentials: false` (`ci.yml:15`). **Q7.4:** los defaults son seguros, el tipo de `text` se valida (`src/index.mjs:10`) y el riesgo ReDoS está solo INFERIDO (va en Riesgos). **Q7.5:** el texto de LICENSE está incompleto frente al `"MIT"` declarado (H10). SBOM y provenance no son razonablemente necesarios con cero dependencias. |
| Q8 Gobernanza | 8 | **5,5** | Q8.1 2 · Q8.2 1 (PARCIAL) · Q8.3 2 · Q8.4 0,5 (DÉBIL) | **Q8.1:** la versión vive en `package.json` y el CHANGELOG la refleja; es duplicación necesaria. **Q8.2:** no hay responsables ni límites del proceso de release y contribución (H4, H5). **Q8.3:** la CI falla cuando falla `node --test` y el código lanza excepción con entrada inválida (`src/index.mjs:10-11`). **Q8.4:** no se puede trazar versión → commit → tag (H4). |
| **Total** | **100** | **71,50** | | 9,75 + 10,5 + 12 + 5,75 + 10,75 + 6,0 + 11,25 + 5,5 = 71,50. No hay criterios N/A, así que los puntos aplicables son 100. |

## Hallazgos

1. **H1 — MAJOR — INCORRECTO — ROOT-001** (`src/index.mjs:11`, `src/index.mjs:18`). La validación acepta como separador cualquier letra o dígito. El recorte de la línea 18 (`^[sep]+|[sep]+$`) elimina entonces caracteres legítimos del contenido.
   - *Traza (INFERIDO, no ejecutado):* `slugify("abc def", {separator:"a"})` → `"abcadef"` en la línea 17 → `"bcadef"` en la línea 18. Del mismo modo, `slugify("1 2", {separator:"1"})` → `"2"`.
   - *Criterios:* Q1.2 y Q5.2 (no hay test que lo cubra).
   - *Corrección:* restringir el separador a `[-_]` o recortar solo los separadores que inserta la línea 17.
   - *Verificación:* un test con separador alfanumérico.
2. **H2 — MINOR — CONTRADICTORIO — ROOT-001** (`src/index.mjs:11`). El flag `i` acepta separadores en mayúscula. Esto contradice `README.md:10` ("single `[a-z0-9_-]`") y `src/index.mjs:2` ("lower-case"); por ejemplo, `slugify("a b",{separator:"X"})` → `"aXb"`.
   - *Criterio:* Q1.3.
   - *Corrección:* quitar el flag `i` y añadir un test con `RangeError`.
3. **H3 — MINOR — FALTA** (`README.md:1-11`). No hay instrucción de instalación, que el perfil LIBRARY exige en Q4.
   - *Criterios:* Q4.2, con impacto cruzado en Q2.1.
   - *Corrección:* añadir `npm install slugify-lite`.
4. **H4 — MAJOR — FALTA** (`CHANGELOG.md:3-10`, `.github/workflows/ci.yml`). El CHANGELOG lista 0.2.0, 0.3.0 y 0.3.1, pero:
   - no existe ningún tag (`git tag -l` vacío) y el historial es un único commit (`e412119 fixture: library`);
   - no hay workflow ni procedimiento de publicación;
   - no hay tags firmados ni política de deprecación.

   Los releases declarados no son verificables ni reproducibles.
   - *Criterios:* Q6.4, Q6.5, Q6.6 y Q8.4 (CAUSA RAÍZ COMPARTIDA; el descuento se reparte proporcionalmente).
   - *Corrección:* tags `vX.Y.Z` firmados, un workflow de publicación y una sección de deprecación en el README.
5. **H5 — MINOR — FALTA**. No hay convenciones de contribución en ningún fichero: no existe CONTRIBUTING y el README no trata el tema.
   - *Criterios:* Q4.4 y Q8.2.
6. **H6 — MINOR — FALTA** (`package.json:10`). Solo existe el script `test`. No hay lint, format ni comprobación de tipos de los JSDoc de `src/index.mjs:3-7`.
   - *Criterio:* Q5.1.
7. **H7 — MINOR — INCOMPLETO** (`test/index.test.mjs:1-20`). Faltan tests de compatibilidad entre versiones, que pide el perfil Q5. Tampoco se prueban los bordes: `maxLength` 0, negativo o NaN; separadores alfanuméricos o en mayúscula; `options` `null`.
   - *Criterio:* Q5.2.
8. **H8 — MINOR — INCORRECTO** (`src/index.mjs:9`, `src/index.mjs:19`). `maxLength` no se valida, lo que produce estos comportamientos no documentados:
   - un valor negativo hace que `slice(0, -n)` recorte por el final;
   - `NaN` devuelve `""`;
   - `options = null` lanza un `TypeError` en la desestructuración.
   - *Criterio:* Q1.2 (comparte la puntuación MENOR con H1).
9. **H9 — MINOR — RIESGO** (`.github/workflows/ci.yml:10-16`). No hay `actions/setup-node`: la CI usa el Node que traiga preinstalado `ubuntu-latest` y no prueba el rango `>=20` declarado en `package.json:9`.
   - *Criterio:* Q6.3.
10. **H10 — MINOR — CONTRADICTORIO** (`LICENSE:5`, `package.json:6`). El texto de LICENSE está truncado: le faltan la condición de conservar el aviso y la exención de garantía del MIT. No es el texto MIT que declara `package.json`.
    - *Criterio:* Q7.5.
11. **H11 — MINOR — SOBRA** (`package.json:4`, `LICENSE:3`). Hay residuos de fixture en metadatos que se publicarían: `"Fixture LIBRARY: ..."` y `Copyright (c) 2026 fixture`.
    - *Criterio:* Q2.2.
12. **H12 — MINOR — INCOMPLETO** (`README.md:5-11`). El README no documenta cómo ejecutar los tests, cómo se publica ni los errores `TypeError`/`RangeError`, que solo aparecen en `src/index.mjs:6-7`. Solo hay un ejemplo y ninguno de las opciones.
    - *Criterios:* Q4.3 y Q4.5.
13. **H13 — MINOR — INCOMPLETO** (`README.md:3`, `src/index.mjs:14-17`). No se declara que el texto que no sea latino/ASCII se pierde. INFERIDO por el código: el cirílico da `""` y `"ß"` se convierte en separador.
    - *Criterio:* Q1.1.
14. **H14 — MINOR — NO VERIFICADO**. No se puede comprobar desde el repo la protección de `main` ni que `CI / test` sea un check requerido.
    - *Criterios:* Q6.2 y Q5.5.
15. **H15 — MINOR — FALTA**. No hay estrategia Git documentada y el historial de un solo commit no permite observar el flujo.
    - *Criterio:* Q6.1.

## No verificado

- Ejecuciones remotas de GitHub Actions, protección de ramas y checks requeridos (Q5.5, Q6.2).
- Que `slugify-lite` esté publicado en npm, su contenido real y su provenance (Q2.1, Q6.4, Q6.5).
- La instalación en un proyecto limpio: no se ejecutó `npm pack` ni `npm install`, porque fuera de `node --test` no se permite ejecutar nada (Q2.1).
- Que SemVer se haya respetado entre 0.2.0, 0.3.0 y 0.3.1, porque no existen esas versiones en el historial ni en tags (Q6.4).
- La versión de Node con la que se ejecutó `node --test` localmente y su compatibilidad con Node 20 exacto.
- Las trazas de H1, H2, H8 y H13 y el riesgo ReDoS se obtuvieron leyendo el código, no ejecutándolo (INFERIDO).

## Riesgos

- **ReDoS (INFERIDO, sin descuento).** Con un separador alfanumérico (ROOT-001), `[sep]+$` en `src/index.mjs:18` se aplica al texto completo sin límite de longitud. Las rachas largas de ese carácter pueden provocar backtracking cuadrático. Con los defaults `-` y `_` no ocurre, porque la línea 17 colapsa las rachas.
- **Pérdida silenciosa de contenido.** El texto no latino produce slugs vacíos (`""`). Si se usan como identificadores, puede haber colisiones (H13).
- **Releases no reproducibles.** Sin tags ni workflow de publicación, nadie puede reconstruir qué código corresponde a cada versión del CHANGELOG (H4).
- **Deriva de entorno en CI.** El Node de `ubuntu-latest` puede cambiar sin aviso y dejar de cubrir Node 20 (H9).
- **Licencia.** El texto MIT incompleto genera ambigüedad legal para los consumidores y para las herramientas de cumplimiento (H10).

SCORE: 72
