---
targetRepo: jlbellonGmail/ai-native
targetCommit: ad7af8165f4b73ef261a7db80c7279404260d8d9
platform:
  version: v3.0.0-dev
  commit: ad7af8165f4b73ef261a7db80c7279404260d8d9
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-12T18:00:00Z
scope: re-audit of the candidate v3.1.3 (branch fix/v3.1.3-n02b-persisted-journals), git diff e36040f..ad7af81 (9 files; journals.mjs, tracking.mjs checkPersistedState, l3.mjs, journal-contract.test.mjs, l3.test.mjs, V3.1.3-PATCH.md) with adversarial bypass attempts on finding N-02b, and re-verification of inherited findings
score: 90.5
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ ad7af81 (candidata v3.1.3, re-auditoria de N-02b)

## A. Identificacion

- Repositorio jlbellonGmail/ai-native; checkout local `C:/Proyectos/ai-native`, rama `fix/v3.1.3-n02b-persisted-journals`, HEAD = `ad7af8165f4b73ef261a7db80c7279404260d8d9` (verificado con `git rev-parse HEAD`, arbol limpio). `VERSION` = `3.0.0-dev`. Ultima release publicada: `v3.1.2` (`e36040f`). v3.1.3 NO publicada: se audita una CANDIDATA.
- Perfil PLATFORM 1.2; QUALITY_SCORE 1.1; AUDIT_RULES 1.1; auditMethod 1.2. Node v26, Windows 11, Git Bash. GitHub solo con GET (rulesets y alertas de code scanning).
- Plantilla: `AUDIT-PLATFORM-2403b83.md`. Ninguna conclusion heredada se copia sin re-verificar. Unico fichero escrito en el repo: este informe. Las sondas viven en `%TEMP%/aud-v313` con `GIT_CEILING_DIRECTORIES=%TEMP%`.

## B. Veredicto

```
Score bruto: 90.50/100
Quality Gate aplicado: ninguno (0 BLOCKER, 0 CRITICAL; validadores PASS; 61/61 tests de las tres suites tocadas por el diff)
Score final: 90.50/100
Confianza: MEDIA (F-03, F-11 no verificables; suite completa NO re-ejecutada; los journals reales de los 9 consumidores NO accesibles: N-07)
Estado: APTO (banda 90-94)
Hallazgos: BLOCKER 0 / CRITICAL 0 / MAJOR 1 / MINOR 14 (con puntos; 2 nuevos) / informativos 8
```

**N-02b: CERRADO.** El invariante nuevo ("todo path que los journals de la base poseian y que sigue en HEAD debe pertenecer a algun journal de HEAD") elimina la causa raiz: ya no se pregunta "existe algun journal" sino "sigue poseido lo que poseia la base". Intentos de evasion (seccion F) con ambos journals presentes: borrar solo el de adopcion, solo el de migracion, ambos, vaciar a `{}`, mover todas las entradas a `skipped`, quitar una sola entrada, forma valida distinta, prefijo `./`, barras invertidas, cambio de mayusculas, renombrar ficheros, merge commit que trae el borrado: todos FAIL. Los unicos PASS son los declarados (retirar journal Y ficheros = desinstalacion visible; traspasar la propiedad al otro journal).

**Equivalente nuevo: no hay un equivalente de N-02b (ninguna via que apague la cobertura sin pasar por el diff de ficheros).** Si hay un falso positivo (N-05, MAJOR) y dos residuos MINOR de borde (N-06, N-07), descritos abajo.

Estado de lo heredado: sin regresion; F-01 mejora solo a medias (SESSION-CONTEXT ya dice `STABLE_BASELINE: v3.1.2`, `README.md:61` sigue en `v3.0.2`).

## C. Alcance y limitaciones

Inspeccionado: `git diff e36040f..ad7af81` completo (9 ficheros, +533/-33), `readFromCommit`, `checkTracking`, `managedPaths`, `upgrade-delta.mjs`, `migrate.mjs`, `adopt.mjs`, `l3-consumer.yml` (base = `origin/$BASE`, `fetch-depth: 0`). Confirmado que el diff no toca `contracts/**`, `.github/**`, `runtime/gates/**` ni `AGENTS.md` (como declara el PATCH).

NO_RUN / NO VERIFICADO: suite completa `test-hermetic.mjs` (solo se ejecutaron las tres suites tocadas); journals reales de los 9 consumidores (los checkouts `C:/Proyectos/gi-*` no contienen `.ai-native/*journal.json` en ninguna rama ni en el historial: `git log --all -- .ai-native/*-journal.json` devuelve 0 commits en los 8 repos locales); symlinks como journal (no creables sin privilegios en esta maquina); localizacion de mensajes de git; revocacion de claves; `l3-consumer.yml` real; L3 extremo a extremo sobre la forma exacta de gi-clinicadental (se cubre con el test del repo `N02B_REPRODUCTION_TEST` y con sondas a nivel de libreria sobre un fixture con ambos journals reales).

## D. Matriz de puntuacion

| Area | Max | Obtenido |
|---|--:|--:|
| Q1 | 12 | 11.25 |
| Q2 | 12 | 11.25 |
| Q3 | 12 | 12.00 |
| Q4 | 12 | 11.00 |
| Q5 | 16 | 13.50 |
| Q6 | 16 | 14.25 |
| Q7 | 12 | 9.75 |
| Q8 | 8 | 7.50 |
| **Total** | **100** | **90.50** |

Aritmetica: 11.25+11.25+12+11+13.5+14.25+9.75+7.5 = 90.50; perdidas 0.75+0.75+0+1.0+2.5+1.75+2.25+0.5 = 9.50. Sin N/A. Respecto de `2403b83` (91.50): Q5.5 conserva 2.25 (N-02b cerrado, +0.75, pero N-06 consume el mismo escalon MENOR); Q6.6 -0.5 (N-05); Q4.5 -0.5 (N-07).

## E. Subcriterios con perdida (el resto COMPLETO)

| ID | Max | Nivel | Obt. | Hallazgo |
|---|--:|---|--:|---|
| Q1.3 | 3 | MENOR | 2.25 | F-01 |
| Q2.2 | 3 | MENOR | 2.25 | F-06 |
| Q4.5 | 2 | PARCIAL | 1.0 | F-08 (0.5) + N-07 (0.5) |
| Q5.2 | 3 | MENOR | 2.25 | F-11 |
| Q5.3 | 4 | MENOR | 3.0 | F-05 |
| Q5.5 | 3 | MENOR | 2.25 | N-06 (N-02b cerrado) |
| Q6.2 | 3 | MENOR | 2.25 | F-02 |
| Q6.6 | 2 | PARCIAL | 1.0 | F-22 (0.5) + N-05 (0.5) |
| Q7.1 | 3 | MENOR | 2.25 | F-03 |
| Q7.2 | 2 | MENOR | 1.5 | F-10 |
| Q7.3 | 2 | PARCIAL | 1.0 | F-04 (0.5) + F-23 (0.5) |
| Q8.3 | 2 | MENOR | 1.5 | F-02 (causa compartida con Q6.2) |

Por area: Q1 0.75; Q2 0.75; Q4 1.0; Q5 0.75+1.0+0.75 = 2.5; Q6 0.75+1.0 = 1.75; Q7 0.75+0.5+1.0 = 2.25; Q8 0.5. Total 9.5.

## F. Ledger de verificacion (comandos ejecutados por mi)

| ID | Comando | Resultado |
|---|---|---|
| G-01 | `node runtime/audit/cli.mjs check` | PASS |
| G-02 | `node runtime/docs/validate-doc-drift.mjs` | PASS |
| G-03 | `node parity/validate-parity.mjs` | PASS; par-tests 95/95 |
| G-04 | `node contracts/validate-contracts.mjs` | PASS (exit 0) |
| G-05 | `node core/validate-core.mjs` | PASS (exit 0) |
| G-06 | `node evaluation/compat/validate-compat-matrix.mjs` | PASS (exit 0) |
| G-07 | `node scripts/validate-ci-tests-listed.mjs` | PASS: 91 `*.test.mjs` ejecutados por un workflow (el nuevo `journal-contract.test.mjs` esta listado) |
| G-08 | `node scripts/validate-actions-pinned.mjs` | PASS |
| G-09 | `node runtime/status/validate-integrity.mjs` | PASS |
| G-10 | `node --test runtime/migrate/journal-contract.test.mjs runtime/consumer/l3.test.mjs runtime/migrate/tracking.test.mjs` | 61 tests, 61 pass, 0 fail, 142 s. El PATCH dice 19 tests nuevos: contados 19 (`grep -c "^test("`) |
| G-11 | Sonda A (`probe.mjs`): 26 mutaciones sobre un fixture con ambos journals reales (`applyMigration` + `applyConsumer`, 51 paths poseidos), `checkPersistedState(root, {base})` | ver tabla F.1 |
| G-12 | Sonda B (`l3probe.mjs`): `runL3` extremo a extremo con `--require-base` | ver F.2 |
| G-13 | Sonda C (`fp2.mjs`, `fp3.mjs`, `fp4.mjs`): flujos legitimos (revert, migrate revert, merge, rama obsoleta) | ver F.3 |
| G-14 | `gh api` GET: ruleset `ai-native-main`, alertas code scanning abiertas | `required_approving_review_count: 0`, `require_code_owner_review: false`; alerta #27 abierta |
| G-15 | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate ad7af81...` | resultado en el mensaje de cierre / seccion I |

### F.1 Intentos de evasion de N-02b (sonda A, base = HEAD antes de la "PR")

| Mutacion en la PR | `checkPersistedState` | Nota |
|---|---|---|
| A1 borrar solo `adoption-journal.json` | FAIL (41 ficheros) | `checkTracking` solo = PASS: es exactamente N-02b y ahora lo detecta el invariante nuevo |
| A2 borrar solo `migration-journal.json` | FAIL (1: `.github/workflows/ai-native.yml`) | no cubierto antes |
| A3 borrar ambos conservando ficheros | FAIL (48) | |
| A4 adopcion -> `{}` | FAIL (41) | |
| A5 mover created/adopted a `skipped` | FAIL (41) | `skipped` no es propiedad |
| A6 forma valida distinta (`{created:{}}`) | FAIL (41) | |
| A7 / A8 migracion -> `created:[]` / `{}` | FAIL (1) | |
| A9 quitar una sola entrada | FAIL (1) | granularidad por path |
| A10 prefijo `./` en las claves | FAIL (41) | la comparacion es por cadena exacta: normalizar distinto = perdido |
| A11 barras invertidas | FAIL (38) | |
| A12 cambio de mayusculas | FAIL (41) | |
| A13 borrar journal + todos sus ficheros | PASS (51 siguen poseidos) | desinstalacion visible en el diff; declarada |
| A14 / A15 borrar journal + renombrar `.claude`, o `git mv` solo por mayusculas | FAIL (22 / 38) | quedan ficheros fuera del renombrado |
| A16 / A17 / A18 `{schemaVersion:9}` / texto no JSON / `[]` | FAIL (corrupto, falla cerrado) | |
| A19 / A20 / A25 base inexistente (`deadbeef…`, `origin/nope`, `--help`) + journal borrado | **PASS (0 paths poseidos)** | falla ABIERTO: ver N-06 |
| A21 base == HEAD | PASS | |
| A22 journal sustituido por un directorio | lanza `EISDIR` (excepcion no capturada) | ver N-06 |
| A24 borrar adopcion y pasar sus paths al journal de migracion con hashes basura | PASS | traspaso de propiedad; informativo I-6 |
| A26 base vacia | NOT_APPLICABLE | |
| Merge commit que trae el borrado (S6, S6b: base = main antes del merge) | FAIL | |

Mutaciones A1-A9 y A16-A18 se reprodujeron ademas bajo el nombre de test del repo (`N02B_REPRODUCTION_TEST`, `CASE 2..8`); pasan.

### F.2 Extremo a extremo con `runL3` (sonda B, consumidor sintetico con lock + adopcion)

- Base == HEAD, journal intacto: `tracking: PASS`.
- `git rm adoption-journal.json`: `tracking: FAIL` (detalle "no longer belong to any journal").
- Mismo caso con base inalcanzable (`deadbeef…`) y `--require-base`: `tracking: NOT_APPLICABLE` pero `circuit: FAIL` ("cannot diff against base"); resultado global FAIL. Clon superficial `--depth 1` de una PR que borra el journal, sin el sha base: `circuit: FAIL`, `bootstrap: FAIL`, global FAIL. Conclusion: el fallo abierto de `checkPersistedState` ante base inalcanzable queda cubierto en L3 por el check `circuit`, no por el propio `tracking`.
- Journal sustituido por un directorio: `runL3` lanza `EISDIR` sin veredicto estructurado.

### F.3 Flujos legitimos (falsos positivos)

| Flujo | `checkPersistedState` | Nota |
|---|---|---|
| S1 `consumer --revert` de una adopcion con un fichero `adopted` (p. ej. `CLAUDE.md` identico preexistente) | **FAIL** (`CLAUDE.md`) | **N-05**: el revert deja el fichero adoptado y borra el journal |
| S2 `migrate revert` solo migracion | PASS | |
| S3a revertir adopcion y luego migracion | PASS en ambos pasos | |
| S3b revertir migracion y luego adopcion | `checkPersistedState` PASS en ambos pasos, pero `checkTracking(head)` FAIL en el paso intermedio (6 `absent`: `.ai-native/ai-native.mjs`, `.codex/*`, listados por el journal de adopcion) | preexistente (`checkTracking` no cambia); el test CASE 4b ("en ambos ordenes") solo afirma `checkPersistedState`. En L3 el paso intermedio daria `tracking: FAIL`. N-06 |
| Upgrade que retira proyecciones pristine; upgrade con fichero obsoleto editado | PASS (el fichero sigue en el journal: `keepLocal`) | revisado `upgrade-delta.mjs` y CASE 9 |
| Segunda aplicacion para anadir una herramienta | no ejecutable con `applyConsumer` (rechaza "journal already exists"); el camino es `applyUpgrade`, solo anade | sin falso positivo por construccion (el journal solo crece) |
| Borrar a mano una proyeccion con el journal vigente (S5) | PASS | cubierto por `adoption: WARN` y `checkTracking` |
| Rama de PR obsoleta frente a una base que adopto despues (S7) | PASS | los paths no estan en el arbol de HEAD |
| Merge commit (S6/S6b) | FAIL solo cuando el merge borra el journal | correcto |

### Verificacion de la coherencia del PATCH y del codigo

- **Codigo.** `parseJournal`/`JournalError` estrictos: valida mapa path->sha256 (`created`, `adopted`), lista de strings (`skipped`) y `created: [{path, sha256}]` para migracion. Los formatos historicos (`{schemaVersion, created, skipped}` de `8250757`; migracion con `created:[{path,sha256}]`) lo cumplen, asi que la validacion no deberia rechazar journals legitimos antiguos (revisado por lectura de los escritores en `git show dfbd244^`, no con journals reales: N-07).
- **`l3.mjs`.** `journalHiddenByPr` eliminado (sin referencias residuales: `grep` limpio). Un journal corrupto da `adoption: FAIL` y `tracking: FAIL` (verificado en el test del repo). `checkPersistedState` se invoca fuera de cualquier `try`, a diferencia de `checkTracking` (N-06).
- **PATCH.** Cuenta de tests correcta (19). La frase "Los journals reales de los 9 consumidores... pasan" no tiene artefacto de evidencia en el repo y no se pudo reproducir (N-07). La tabla del contrato dice que `adopted` es "gestionado, revert no lo borra" y a la vez que un journal "puede faltar solo si los archivos salieron del arbol": ambas frases se contradicen en el revert de adopcion con ficheros `adopted` (N-05).

## G. Hallazgos abiertos

| ID | Sev | Pts | Tipo | Descripcion / evidencia | Correccion y verificacion |
|---|---|--:|---|---|---|
| N-05 | MAJOR | 0.50 Q6.6 | ROTO | Falso positivo en el revert legitimo. Un `consumer.mjs --revert` de una adopcion que registro algun fichero en `adopted` (fichero preexistente identico, p. ej. `CLAUDE.md`, ver `adopt.mjs:69`) borra el journal y deja ese fichero en el arbol, por contrato ("revert no lo borra"). `checkPersistedState` lo cuenta como perdido: sonda S1 => `FAIL CLAUDE.md`, y `l3.mjs` lo emite como `tracking: FAIL` con la recomendacion "remove the files together with it", que obligaria a borrar un fichero del proyecto. El comportamiento ya existia en v3.1.2 (`journalHiddenByPr` listaba `adopted`), pero v3.1.3 fija el contrato afirmando que el revert real no falla y el test CASE 4b/`l3.test.mjs` solo ejercita adopciones sin ficheros `adopted`. | En `checkPersistedState` no contar como perdidos los paths que estaban en `adopted` de la base cuando HEAD no tiene el journal de adopcion Y el fichero sigue byte a byte igual (el revert los conserva por diseno), o que el revert escriba una marca; anadir test con un fichero preexistente identico y `revertAdoption`. |
| N-06 | MINOR | 0.75 Q5.5 | RIESGO | Bordes de `checkPersistedState`: (a) falla ABIERTO cuando la lectura de la base falla por una razon distinta de "el journal no existe": `git cat-file blob base:path` con `status !== 0` se trata como "la base nunca tuvo el journal" (`continue`). Sondas A19/A20/A25: base inalcanzable, ref inexistente o `--help` => PASS con 0 paths poseidos. En L3 lo cubre `circuit` (`changedFiles` falla con `--require-base`, F.2), pero el helper no distingue "ausente" de "ilegible" ni valida el ref (p. ej. clon superficial sin el sha base). (b) Excepciones no controladas: `checkPersistedState` se llama sin `try` en `l3.mjs:110`; un journal que es un directorio (`EISDIR`, A22) o un fallo de git hace que `runL3` lance sin veredicto estructurado (el mismo modo que el PATCH decia haber cerrado para JSON invalido). Sigue siendo fail-closed por codigo de salida. (c) El test CASE 4b ("no fallan, en ningun orden") solo afirma `checkPersistedState`; en el orden migracion-primero `checkTracking` da FAIL (6 `absent`) en el paso intermedio (S3b). | (a) Distinguir con `git cat-file -e base^{commit}` (o `rev-parse --verify`) y `ls-tree`: base irresoluble => FAIL, journal ausente en una base valida => continuar; (b) envolver en try/catch como `checkTracking`; (c) afirmar `checkTracking`/`runL3` en CASE 4b o documentar el estado intermedio. |
| N-07 | MINOR | 0.50 Q4.5 | NO VERIFICADO | El PATCH afirma «Los journals reales de los 9 consumidores en v3.1.2 (HEAD y cinco bases anteriores cada uno) pasan `checkPersistedState` y `checkTracking`». No hay artefacto de evidencia en `governance/versioning/evidence/` ni script en el repo, y los clones locales `C:/Proyectos/gi-*` no contienen ningun journal en ningun ref (0 commits en `git log --all`). No es refutable ni reproducible; las sondas de compatibilidad de formato (journals generados por los escritores actuales e historicos) pasan. | Guardar el volcado (por consumidor: ref, hash del journal, resultado) o rebajar la afirmacion a «journals generados por los escritores». |
| F-01 | MINOR | 0.75 Q1.3 | OBSOLETO | `README.md:61` sigue «latest stable `v3.0.2`»; `SESSION-CONTEXT.md` ya dice `STABLE_BASELINE: v3.1.2` (mejora parcial); `QUALITY-MATRIX.md` sin re-verificar. | Actualizar el README. |
| F-02 | MINOR | 0.75 Q6.2 + 0.50 Q8.3 | RIESGO | Ruleset `ai-native-main`: `required_approving_review_count: 0`, `require_code_owner_review: false` (GET de hoy). | Segundo mantenedor/code owner o control equivalente documentado. |
| F-03 | MINOR | 0.75 Q7.1 | NO VERIFICADO | Revocacion de claves antiguas: accion humana. | Ejecutarla y documentarla. |
| F-04 | MINOR | 0.50 Q7.3 | FALTA | Un solo ruleset (rama); `release.yml` sin `environment:` (grep). | Ruleset de tags + Environment. |
| F-05 | MINOR | 1.00 Q5.3 | RIESGO | Suite no determinista en Windows (firma `.git/objects ... Permission denied` en `2403b83`). Esta auditoria no re-ejecuto la suite completa; las tres suites tocadas pasaron 61/61 a la primera. El propio `journal-contract.test.mjs` incluye un reintento ante `Permission denied` en su helper `git`. Sin tres corridas completas verdes consecutivas. | 3 corridas verdes consecutivas o eliminar la causa. |
| F-06 | MINOR | 0.75 Q2.2 | SOBRA | `governance/cleanup/M7-INVENTORY.md` l.33 y l.51 con `C:/Proyectos/_m6/`. | Sustituir por descripcion relativa. |
| F-08 | MINOR | 0.50 Q4.5 | INCOMPLETO | Troubleshooting del README: `IGNORED_REQUIRED_FILE`, `MANAGED_FILE_NOT_REPRODUCIBLE`, `UNSAFE_PATH` siguen sin aparecer en `README.md`; los nuevos fallos de v3.1.3 ("no longer belong to any journal", "corrupt journal") tampoco. | Seccion de problemas frecuentes. |
| F-10 | MINOR | 0.50 Q7.2 | RIESGO | Alerta #27 `actions/untrusted-checkout/medium` abierta (GET). | Corregir o descartar con justificacion. |
| F-11 | MINOR | 0.75 Q5.2 | NO VERIFICADO | `l3-consumer.yml` sin llamador en este repo ni runs reales. | Llamador o canary. |
| F-22 | MINOR | 0.50 Q6.6 | ROTO | `runtime/bootstrap/install.mjs` `canonical()` usa `order = ["schemaVersion","platform","profiles","mcpProfiles","packs","overrides"]`: no conserva `productDir`/`governance`. Sin cambios en el diff. | `canonical` conserva los campos + test. |
| F-23 | MINOR | 0.50 Q7.3 | RIESGO | `ci.yml:208` ejecuta `hitl.mjs` del checkout de la PR; `runtime/policy/**` fuera del plano de control. Sin cambios. | Ejecutar desde la base o anadir al plano de control. |
| N-02b | cerrado | 0 | — | Ver seccion B y F.1/F.2. | — |
| I-1..I-8 | informativo | 0 | — | I-1..I-4 heredados de `2403b83` (symlink gestionado, `.gitattributes` con filtros, regex inglesa de `isGitRepo`, CRLF total aceptado). I-5 el comparador es por cadena exacta: una clave de HEAD con `./` o mayusculas no "cuenta" como propiedad (fail closed, A10-A12), pero una clave de la BASE con forma distinta de la del arbol no se detectaria como perdida (la base es de confianza). I-6 la propiedad se puede traspasar de un journal a otro (A24): decision declarada en el PATCH (caso 2b); la unica consecuencia es que `adoption: WARN` por hash distinto es el unico indicio. I-7 retirar journal y ficheros a la vez (A13) o renombrar todo el arbol proyectado es indistinguible de una desinstalacion; limite honesto declarado. I-8 symlink como journal no probado (sin privilegios). | — |

## H. Camino a 100

Perdidas: Q1.3 0.75 (F-01) + Q2.2 0.75 (F-06) + Q4.5 0.5 (F-08) y 0.5 (N-07) + Q5.2 0.75 (F-11) + Q5.3 1.0 (F-05) + Q5.5 0.75 (N-06) + Q6.2 0.75 y Q8.3 0.5 (F-02) + Q6.6 0.5 (F-22) y 0.5 (N-05) + Q7.1 0.75 (F-03) + Q7.2 0.5 (F-10) + Q7.3 1.0 (F-04 0.5 + F-23 0.5) = 9.5. 90.5 + 9.5 = 100. Correccion y verificacion de cada fila en la seccion G. Orden recomendado para v3.1.3: N-05 (unico MAJOR, falso positivo en un flujo documentado) y N-06 (a, b) antes de publicar; N-07 como correccion de texto.

## I. Comprobacion de consistencia

- Toda perdida tiene causa; cada hallazgo se asocia a un criterio materialmente relacionado; informativos y cerrados no restan; el camino a 100 suma exactamente 9.5; sin N/A; ningun gate global se activa (0 BLOCKER, 0 CRITICAL).
- N-02b recupera su escalon en Q5.5 solo en el sentido de que la causa raiz esta cerrada; el escalon MENOR (2.25) se mantiene por N-06, que es un residuo de borde del propio mecanismo nuevo (fail-open ante base ilegible, excepciones no controladas, hueco de test), no la misma via de evasion.
- N-05 es MAJOR (falso positivo en un flujo de rollback documentado, sin remedio no destructivo), no CRITICAL: no apaga ningun control, el fallo es cerrado y el flujo afectado (revert de adopcion con ficheros `adopted`) es infrecuente. Preexistia en v3.1.2; no es una regresion de comportamiento, es un contrato nuevo que no lo cubre.
- Juicio: el fix cierra N-02b sin introducir una evasion nueva ni regresion en lo heredado; ver N-05 antes de dar por buena la afirmacion «reverts reales en los dos ordenes».
