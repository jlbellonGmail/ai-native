---
targetRepo: jlbellonGmail/ai-native
targetCommit: 2403b834c34592a8b79072eac707cb40dae241d4
platform:
  version: v3.0.0-dev
  commit: 2403b834c34592a8b79072eac707cb40dae241d4
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-12T14:00:00Z
scope: full repository at the exact commit (candidate v3.1.2, branch fix/v3.1.2-audit-findings), re-audit of the fixes N-01..N-04 over fb0c65f (git diff fb0c65f..2403b83, 6 files) and re-verification of inherited findings
score: 91.5
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ 2403b83 (candidata v3.1.2, re-auditoria)

## A. Identificacion

- Repositorio jlbellonGmail/ai-native; worktree detached `C:/Users/ASUS/AppData/Local/Temp/aud-v312`, HEAD = `2403b834c34592a8b79072eac707cb40dae241d4`. `VERSION` = `3.0.0-dev`. Ultima release publicada: `v3.1.1`. v3.1.2 NO publicada: se audita una CANDIDATA. El informe previo de `fb0c65f` se retiro del arbol (no forma parte de este commit).
- Perfil PLATFORM 1.2; QUALITY_SCORE 1.1; AUDIT_RULES 1.1; auditMethod 1.2. Node v26.10.0, Windows 11, Git Bash. GitHub solo con GET (los puntos de gobierno heredados de `fb0c65f` se re-verificaron en esa auditoria el mismo dia; el diff no toca `.github/**`, `governance/**` salvo el PATCH, ni `runtime/bootstrap`).
- Plantilla: informe `AUDIT-PLATFORM-f4bc663.md`; ninguna conclusion se copia sin re-verificar.

## B. Veredicto

```
Score bruto: 91.50/100
Quality Gate aplicado: ninguno (0 BLOCKER, 0 CRITICAL; validadores PASS; suite 883/884 con un fallo de firma conocida, aislado 3/3 verde)
Score final: 91.50/100
Confianza: MEDIA (F-03, F-11 no verificables; N-02 residual verificado por codigo y sonda, no de extremo a extremo en L3)
Estado: APTO (banda 90-94)
Hallazgos: BLOCKER 0 / CRITICAL 0 / MAJOR 0 / MINOR 12 (con puntos) / informativos 5
```

Estado de los hallazgos de la auditoria anterior: N-01 CERRADO, N-03 CERRADO, N-04 CERRADO, N-02 PARCIALMENTE cerrado (la mitad "fallo de git => NOT_APPLICABLE" esta cerrada; la mitad "borrar el journal" solo se cierra si no queda journal de migracion, ver N-02b). Ningun fix introduce un hallazgo nuevo de severidad MINOR o superior; si deja un residuo del propio N-02.

## C. Alcance y limitaciones

Inspeccionado: `git diff fb0c65f..2403b83` completo (`tracking.mjs`, `adopt.mjs`, `l3.mjs`, tests, `V3.1.2-PATCH.md`), los llamadores de `isGitRepo`/`checkTracking`/`wouldBeIgnored` (`consumer.mjs`, `migrate.mjs`, `l3.mjs`), `journals.mjs`.

NO_RUN: ejecucion extremo a extremo de `l3.mjs` sobre un consumidor con ambos journals (el arnes de `l3.test.mjs` exige release sincronizada; el residuo N-02b se demuestra con `readOwnership` + `checkTracking` + lectura de `l3.mjs`); localizacion de mensajes de git (en esta maquina `LC_ALL=es_ES/de_DE` sigue emitiendo `not a git repository` en ingles); revocacion de claves; `l3-consumer.yml` real.

## D. Matriz de puntuacion

| Area | Max | Obtenido |
|---|--:|--:|
| Q1 | 12 | 11.25 |
| Q2 | 12 | 11.25 |
| Q3 | 12 | 12.00 |
| Q4 | 12 | 11.50 |
| Q5 | 16 | 13.50 |
| Q6 | 16 | 14.75 |
| Q7 | 12 | 9.75 |
| Q8 | 8 | 7.50 |
| **Total** | **100** | **91.50** |

Aritmetica: 11.25+11.25+12+11.5+13.5+14.75+9.75+7.5 = 91.50; perdidas 0.75+0.75+0+0.5+2.5+1.25+2.25+0.5 = 8.50. Sin N/A.

## E. Subcriterios con perdida (el resto COMPLETO)

| ID | Max | Nivel | Obt. | Hallazgo |
|---|--:|---|--:|---|
| Q1.3 | 3 | MENOR | 2.25 | F-01 |
| Q2.2 | 3 | MENOR | 2.25 | F-06 |
| Q4.5 | 2 | MENOR | 1.5 | F-08 |
| Q5.2 | 3 | MENOR | 2.25 | F-11 |
| Q5.3 | 4 | MENOR | 3.0 | F-05 |
| Q5.5 | 3 | MENOR | 2.25 | N-02b |
| Q6.2 | 3 | MENOR | 2.25 | F-02 |
| Q6.6 | 2 | MENOR | 1.5 | F-22 |
| Q7.1 | 3 | MENOR | 2.25 | F-03 |
| Q7.2 | 2 | MENOR | 1.5 | F-10 |
| Q7.3 | 2 | PARCIAL | 1.0 | F-04 (0.5) + F-23 (0.5) |
| Q8.3 | 2 | MENOR | 1.5 | F-02 (causa compartida con Q6.2) |

Por area: Q1 0.75; Q2 0.75; Q4 0.5; Q5 0.75+1.0+0.75 = 2.5; Q6 0.75+0.5 = 1.25; Q7 0.75+0.5+1.0 = 2.25; Q8 0.5. Total 8.5.

## F. Ledger de verificacion (comandos ejecutados por mi)

| ID | Comando | Resultado |
|---|---|---|
| G-01 | `node runtime/audit/cli.mjs check` | PASS |
| G-02 | `node runtime/docs/validate-doc-drift.mjs` | PASS |
| G-03 | `node parity/validate-parity.mjs` | PASS; par-tests 95/95 |
| G-04 | `node contracts/validate-contracts.mjs` | PASS; 20 schemas, 7 datos |
| G-05 | `node core/validate-core.mjs` | PASS; 8 perfiles |
| G-06 | `node evaluation/compat/validate-compat-matrix.mjs` | PASS; 3 fixtures |
| G-07 | `node scripts/validate-ci-tests-listed.mjs` | PASS: 90 `*.test.mjs` ejecutados por un workflow |
| G-08 | `node scripts/validate-actions-pinned.mjs` | PASS |
| G-09 | `node runtime/status/validate-integrity.mjs` | PASS |
| G-10 | `node scripts/test-hermetic.mjs --concurrency 2` (una corrida; los validadores corrian a la vez) | 884 tests, 90 ficheros, 883 pass, **1 fail**, 267 s. Fallo: `L3 product tests: a declared command runs for real, and a failing one fails the gate` (`runtime/consumer/l3.test.mjs`). Firma en el log inmediatamente antes: `error: unable to write file .git/objects/4f/c4...: Permission denied` / `error: ai-native.lock.json: failed to insert into database` / `fatal: adding files failed` (el `git add -A` del arnes). Es la firma de carrera de Windows documentada por el repo (F-05), no un defecto del diff |
| G-11 | `node --test runtime/consumer/l3.test.mjs` x3 aislado | 23 pass / 0 fail las tres veces |
| G-12 | Sondas propias en sandbox bajo `$TEMP` (`GIT_CEILING_DIRECTORIES`) | ver abajo |
| G-13 | `node runtime/audit/cli.mjs release-gate ... --candidate 2403b83...` | resultado en el mensaje de cierre |

El fallo intermitente de G-10 no se atribuye al diff: la firma coincide con la que el coordinador reporta para `consumer-launcher.test.mjs` en `fb0c65f` y con F-05; el test pasa 3/3 aislado. No obstante la suite completa NO salio verde en esta corrida, y no hay tres corridas verdes consecutivas (F-05 sigue).

### Verificacion de cada fix

- **N-01 (UNSAFE_PATH): CERRADO.** `tracking.mjs` filtra con `safeJoin` cada clave de `managedPaths` antes de `existsSync`/`readFileSync`/`check-ignore`; las inseguras se reportan en `result.unsafe` y fuerzan FAIL (`describe` imprime `UNSAFE_PATH=[...]`). Test `audit N-01` con `../outside.txt` pasa. Residuo aceptable: `safeJoin` tambien resuelve symlinks de ancestros; una clave con symlink que escape es `UNSAFE_PATH` (fail closed). Contrapartida: `safeJoin` rechaza rutas absolutas y con `..`, sin falso positivo para proyecciones legitimas (todas relativas).
- **N-02a (git falla => NOT_APPLICABLE): CERRADO.** `isGitRepo` ahora devuelve `false` solo si git dice `not a git repository` (regex inglesa, case-insensitive) Y `GIT_DIR`/`GIT_WORK_TREE` no estan definidos; el resto lanza. Verificado:
  - `GIT_DIR=/nonexistent consumer.mjs --drift` => exit 1, `ERROR git rev-parse failed: fatal: not a git repository: '.../nonexistent'` (legible, con codigo).
  - `GIT_DIR=<repo>/.git GIT_WORK_TREE=<repo>` validos => PASS, exit 0 (sin falso FAIL en CI con GIT_DIR definido y correcto, porque el camino `status===0` no mira el entorno).
  - worktree adicional (`git worktree add`) => `--drift` PASS.
  - `migrate.mjs plan` con `GIT_DIR` roto => exit 1 con el `fatal:` de git (falla ademas antes, en `git status --porcelain`, comportamiento previo); `planMigration`/`wouldBeIgnored` estan dentro del `try` de `main` (l.392-430), sin crash sin codigo.
  - `l3.mjs` envuelve `checkTracking` en try/catch y emite `tracking: FAIL` con `git could not be queried (...)`; `consumer.mjs` lo captura en su `try` y lo presenta como error.
  - Casos limite (informativos, 0 pts): un consumidor legitimo NO-git con `GIT_DIR` exportado en el entorno ahora falla en vez de ser NOT_APPLICABLE (es el objetivo del fix); la regex es solo inglesa: si git se ejecutara con un catalogo de mensajes traducido, un directorio no-git lanzaria en vez de NOT_APPLICABLE (falla cerrado; no reproducido, los catalogos es/de de esta maquina siguen en ingles); submodulos: `rev-parse` dentro de un submodulo funciona.
- **N-02b (borrado del journal): PARCIAL.** `journalHiddenByPr(project, base)` solo se invoca en la rama `else` de `if (owned.hasAdoption || owned.hasMigration)`. Un consumidor con AMBOS journals (la forma real de gi-clinicadental: `migrate apply` + adopcion) que borra solo el journal de adopcion sigue en la rama `if` (hay journal de migracion) y nunca se consulta el journal de la base. Sonda: tras `git rm .ai-native/adoption-journal.json` en un repo con `migration-journal.json`, `readOwnership` => `hasAdoption false, hasMigration true`; `checkTracking` => PASS (`1 managed file(s)`). Los 19 ficheros `.claude/**` proyectados por la adopcion dejan de estar gestionados. No hay falso negativo del caso "sin ningun journal" (probado por test), ni falso positivo en un `--revert` real (test: journal y ficheros fuera => `NOT_APPLICABLE`). Falsos positivos de `journalHiddenByPr` (informativo): una PR que abandona deliberadamente ai-native conservando los ficheros falla con mensaje accionable; es el comportamiento declarado. Sin `--base` devuelve `[]` (NOT_APPLICABLE): L3 en PR usa `--require-base`, y sin base circuit/p45 ya fallan. El texto del PATCH solo promete lo que se cierra («borrar el journal de adopcion conservando los archivos... falla tracking»), pero omite el caso con journal de migracion.
- **N-03 (CRLF): CERRADO.** `revertAdoption` acepta `sha(now) === hash || normalizedSha(now) === hash`; `l3.mjs` `matchesJournal` usa `normalizedSha` en una sola lectura (try/catch, sin `existsSync` previo). Test `audit N-03` (autocrlf) pasa. Pregunta (c): un fichero realmente editado NO pasa por normalizado salvo que la unica diferencia sean finales de linea CRLF/LF (por diseno: no es edicion; `normalizedSha` solo sustituye `\r\n` por `\n`, binarios con byte 0 en los primeros 8000 se hashean crudos). Informativo (0 pts): un fichero convertido por completo a CRLF se acepta como intacto; ninguna proyeccion contiene `\r\n` crudo (grep), asi que no hay falso WARN por hash crudo con CRLF.
- **N-04 (afirmaciones del PATCH): CERRADO.** El PATCH ahora dice 18 tests en `tracking.test.mjs` (contados: 18), 2 tests nuevos en `l3.test.mjs` mas aserciones en el test `adoption` (verificado: el de `IGNORED_REQUIRED_FILE_TEST` y el `audit N-02`), y declara que los tres nombres de gate no son literales de test, indicando a que casos corresponden. Reserva menor: la frase «La validacion post-release los ejecuta contra el bundle publicado» no tiene evidencia en el repo (ningun documento ni script los menciona fuera del PATCH) pero es una declaracion de proceso futura, no de codigo. Segunda reserva: el PATCH afirma que N-02 «se corrige» sin matizar el caso con journal de migracion (ver N-02b).

## G. Hallazgos abiertos

| ID | Sev | Pts | Tipo | Descripcion / evidencia | Correccion y verificacion |
|---|---|--:|---|---|---|
| N-02b | MINOR | 0.75 Q5.5 | RIESGO | Residuo de N-02. `runtime/consumer/l3.mjs` (rama `if (owned.hasAdoption \|\| owned.hasMigration)`) no llama a `journalHiddenByPr`; con journal de migracion presente, borrar el journal de adopcion de la base apaga la cobertura de las proyecciones de adopcion. Sonda en G-12: `hasAdoption false / hasMigration true`, tracking PASS. Mitigacion: revision humana; reduccion de journals ya declarada como backlog. | Llamar a `journalHiddenByPr` tambien cuando `!owned.hasAdoption` (con migracion presente) y anadir test con ambos journals; o leer ambos journals de la base. |
| F-01 | MINOR | 0.75 Q1.3 | OBSOLETO | `README.md:61` «latest stable `v3.0.2`»; `SESSION-CONTEXT.md:12` `STABLE_BASELINE: v3.0.2`; `QUALITY-MATRIX.md` 2026-10-05; la release publicada es `v3.1.1`. Sin cambios en el diff. | Actualizar los tres. |
| F-02 | MINOR | 0.75 Q6.2 + 0.50 Q8.3 | RIESGO | Ruleset `ai-native-main`: 0 aprobaciones requeridas, sin code owner (re-verificado hoy, GET). | Segundo mantenedor/code owner o control equivalente documentado. |
| F-03 | MINOR | 0.75 Q7.1 | NO VERIFICADO | Revocacion de claves antiguas: accion humana. | Ejecutarla y documentarla. |
| F-04 | MINOR | 0.50 Q7.3 | FALTA | Un solo ruleset (rama); `release.yml` sin `environment:`. Sin cambios en el diff. | Ruleset de tags + Environment. |
| F-05 | MINOR | 1.00 Q5.3 | RIESGO | Suite no determinista en Windows: esta corrida 883/884 (firma `.git/objects ... Permission denied`, G-10), aislado 3/3; la corrida anterior sobre `fb0c65f` fue 880/880. Sin tres corridas verdes consecutivas. | 3 corridas verdes consecutivas o eliminar la causa en los helpers git de test. |
| F-06 | MINOR | 0.75 Q2.2 | SOBRA | `governance/cleanup/M7-INVENTORY.md` l.33 y l.51 con `C:/Proyectos/_m6/`. | Sustituir por descripcion relativa. |
| F-08 | MINOR | 0.50 Q4.5 | INCOMPLETO | Troubleshooting del README de una linea; los nuevos `FAIL:` (`IGNORED_REQUIRED_FILE`, `MANAGED_FILE_NOT_REPRODUCIBLE`, `UNSAFE_PATH`) solo en cabeceras, PATCH y GI-BATCH-UPGRADE. | Seccion de problemas frecuentes. |
| F-10 | MINOR | 0.50 Q7.2 | RIESGO | Alerta #27 `actions/untrusted-checkout/medium` abierta. | Corregir o descartar con justificacion. |
| F-11 | MINOR | 0.75 Q5.2 | NO VERIFICADO | `l3-consumer.yml` sin llamador ni runs reales. | Llamador o canary. |
| F-22 | MINOR | 0.50 Q6.6 | ROTO | `runtime/bootstrap/install.mjs` `canonical()` (l.41) y `rollback` (l.259) no conservan `productDir`/`governance`; sin cambios en el diff. | `canonical` conserva los campos + test. |
| F-23 | MINOR | 0.50 Q7.3 | RIESGO | `ci.yml:208` ejecuta `hitl.mjs` del checkout de la PR; `runtime/policy/**` fuera del plano de control. Sin cambios. | Ejecutar desde la base o anadir al plano de control. |
| N-01 / N-03 / N-04 | cerrados | 0 | — | Ver seccion F. | — |
| I-1..I-5 | informativo | 0 | — | I-1 symlink gestionado trackeado => `divergent` (teorico); I-2 `.gitattributes` con filtros (no probado); I-3 `isGitRepo` solo reconoce el mensaje en ingles (falla cerrado); I-4 conversion total a CRLF aceptada como intacta (por diseno); I-5 `journalHiddenByPr` rechaza el abandono deliberado de ai-native conservando ficheros (declarado). | — |

## H. Camino a 100

Perdidas: Q1.3 0.75 (F-01) + Q2.2 0.75 (F-06) + Q4.5 0.5 (F-08) + Q5.2 0.75 (F-11) + Q5.3 1.0 (F-05) + Q5.5 0.75 (N-02b) + Q6.2 0.75 y Q8.3 0.5 (F-02) + Q6.6 0.5 (F-22) + Q7.1 0.75 (F-03) + Q7.2 0.5 (F-10) + Q7.3 1.0 (F-04 0.5 + F-23 0.5) = 8.5. 91.5 + 8.5 = 100. Correccion y verificacion de cada fila en la seccion G.

## I. Comprobacion de consistencia

- Toda perdida tiene causa; cada hallazgo se asocia a un criterio materialmente relacionado; informativos y cerrados no restan; el camino a 100 suma exactamente 8.5; sin N/A; ningun gate global se activa (0 BLOCKER, 0 CRITICAL; ejecucion esencial verde, el unico rojo de la suite es la carrera de Windows documentada y reproduce verde aislado).
- N-02 se mantiene abierto con la misma puntuacion que tenia (0.75, Q5.5) porque la mitad restante es el mismo defecto de gate abierto por el control del journal; N-01 (+0.5, Q7.4) y N-03 (+0.5, Q6.6) recuperan sus puntos; N-04 no puntuaba.
- Juicio: ningun fix introduce regresion; el unico cambio de comportamiento relevante (isGitRepo lanza ante GIT_DIR definido) falla cerrado con mensaje legible en todos los llamadores revisados.
