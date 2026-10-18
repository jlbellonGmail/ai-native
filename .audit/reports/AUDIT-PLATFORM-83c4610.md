---
targetRepo: jlbellonGmail/ai-native
targetCommit: 83c461065b8c0df3eceda85ca9a60796501a6d08
platform:
  version: v3.0.0-dev
  commit: 83c461065b8c0df3eceda85ca9a60796501a6d08
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-12T21:00:00Z
scope: re-audit of the candidate v3.1.3 (branch fix/v3.1.3-n02b-persisted-journals), git diff e36040f..83c4610 (journals.mjs, tracking.mjs checkPersistedState, l3.mjs, journal-contract.test.mjs, l3.test.mjs, V3.1.3-PATCH.md, V3.1.3-CONSUMER-COMPAT.md) with adversarial verification of the fixes for N-05, N-06 and N-07 (audit of ad7af81) and of the closure of N-02b
score: 91.75
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ 83c4610 (candidata v3.1.3, re-auditoria de N-05/N-06/N-07)

## A. Identificacion

- Repositorio jlbellonGmail/ai-native; checkout local `C:/Proyectos/ai-native`, rama `fix/v3.1.3-n02b-persisted-journals`, HEAD = `83c461065b8c0df3eceda85ca9a60796501a6d08` (`git rev-parse HEAD`, arbol limpio al empezar). `VERSION` = `3.0.0-dev`. Ultima release publicada: `v3.1.2` (`e36040f`). v3.1.3 NO esta publicada: se audita una CANDIDATA.
- Perfil PLATFORM 1.2; QUALITY_SCORE 1.1; AUDIT_RULES 1.1; auditMethod 1.2. Node v26, Windows 11, Git Bash. GitHub solo con GET (rulesets, code scanning, clones de lectura).
- Plantilla: `AUDIT-PLATFORM-ad7af81.md`. Ninguna conclusion heredada se copia sin re-verificar. Unico fichero escrito en el repo: este informe. Las sondas y los clones viven en `%TEMP%/aud-v313b` con `GIT_CEILING_DIRECTORIES=%TEMP%`.

## B. Veredicto

```
Score bruto: 91.75/100
Quality Gate aplicado: ninguno (0 BLOCKER, 0 CRITICAL; validadores PASS; 63/63 tests de las tres suites tocadas)
Score final: 91.75/100
Confianza: MEDIA (F-03, F-11 no verificables; suite completa NO re-ejecutada; N-07 verificado en 3 de 9 consumidores)
Estado: APTO (banda 90-94)
Hallazgos: BLOCKER 0 / CRITICAL 0 / MAJOR 0 / MINOR 13 (con puntos; 1 nuevo, N-08) / informativos 10
```

- **N-02b: CERRADO** (re-verificado; sin regresion con el cambio de 83c4610). Evidencia en F.1 y en consumidores reales (F.4): en `gi-clinicadental` y `gi-ot`, borrar solo `adoption-journal.json` da FAIL (25 paths).
- **N-05: CERRADO.** `consumer --revert` con un fichero `adopted` que permanece da PASS (tracking `NOT_APPLICABLE` en `runL3`); borrar solo el journal con los `created` presentes sigue dando FAIL (41/47 ficheros). La regla `released` se juzga abajo (I-9): el "bypass" borrar journal + todos los `created` conservando los `adopted` es un estado byte a byte igual al de un revert real; lo clasifico INFORMATIVO, no vulnerabilidad.
- **N-06: CERRADO** (a base ilegible, b journal-directorio y `try/catch` de `l3.mjs`). Queda un residuo estrecho no alcanzable en el flujo soportado (I-10) y la parte (c) del hallazgo (test 4b) se resolvio renombrando el test, no ampliandolo; sin consecuencias de puntaje.
- **N-07: CERRADO.** Reproducido en 3 consumidores reales (`gi-clinicadental`, `gi-ot`, `MyStudyDiary`): los HEAD coinciden con la tabla (`fd13eaf`, `3442293`, `548b85f`) y todas las bases/transiciones PASS (F.4). Los otros 6 consumidores NO se verificaron (no se clonaron); la afirmacion para ellos queda sin refutar pero tampoco independientemente confirmada.
- **Hallazgo nuevo N-08 (MINOR):** el rollback total a v2 en el orden "revertir adopcion y luego migracion" se lee como perdida (falso positivo). Preexistente en la semantica del comparador (no lo introduce 83c4610), pero el PATCH afirma "reverts reales en los dos ordenes". Detalle en G y F.3.

Estado de lo heredado: sin regresion; ningun F-xx cambia.

## C. Alcance y limitaciones

Inspeccionado: `git diff e36040f..83c4610` completo y el delta `ad7af81..83c4610` (7 ficheros, incluidos `tracking.mjs`, `journals.mjs`, `l3.mjs`, el test nuevo, PATCH y CONSUMER-COMPAT); `adopt.mjs` (`applyAdoption`/`revertAdoption`), `migrate.mjs` (`revertMigration`, `retired`), `control-plane.mjs:changedFiles`, `l3.mjs`. Confirmado que el diff no toca `contracts/**`, `.github/**`, `runtime/gates/**` ni `AGENTS.md`.

NO_RUN / NO VERIFICADO: suite completa `test-hermetic.mjs`; 6 de los 9 consumidores de la tabla de compat (se verificaron 3); symlinks como journal (sin privilegios); localizacion de mensajes de git; revocacion de claves; `l3-consumer.yml` real; clones parciales con red real. En la sonda del clon parcial el remoto se invalido a proposito (I-10).

## D. Matriz de puntuacion

| Area | Max | Obtenido |
|---|--:|--:|
| Q1 | 12 | 11.25 |
| Q2 | 12 | 11.25 |
| Q3 | 12 | 12.00 |
| Q4 | 12 | 11.50 |
| Q5 | 16 | 14.25 |
| Q6 | 16 | 14.25 |
| Q7 | 12 | 9.75 |
| Q8 | 8 | 7.50 |
| **Total** | **100** | **91.75** |

Aritmetica: 11.25+11.25+12+11.5+14.25+14.25+9.75+7.5 = 91.75; perdidas 0.75+0.75+0+0.5+1.75+1.75+2.25+0.5 = 8.25. Sin N/A. Respecto de `ad7af81` (90.50): Q4.5 +0.5 (N-07 cerrado); Q5.5 +0.75 (N-06 cerrado, sin residuo puntuable); Q6.6 sin cambio (N-05 -0.5 sustituido por N-08 +0.5).

## E. Subcriterios con perdida (el resto COMPLETO)

| ID | Max | Nivel | Obt. | Hallazgo |
|---|--:|---|--:|---|
| Q1.3 | 3 | MENOR | 2.25 | F-01 |
| Q2.2 | 3 | MENOR | 2.25 | F-06 |
| Q4.5 | 2 | PARCIAL | 1.5 | F-08 |
| Q5.2 | 3 | MENOR | 2.25 | F-11 |
| Q5.3 | 4 | MENOR | 3.0 | F-05 |
| Q6.2 | 3 | MENOR | 2.25 | F-02 |
| Q6.6 | 2 | PARCIAL | 1.0 | F-22 (0.5) + N-08 (0.5) |
| Q7.1 | 3 | MENOR | 2.25 | F-03 |
| Q7.2 | 2 | MENOR | 1.5 | F-10 |
| Q7.3 | 2 | PARCIAL | 1.0 | F-04 (0.5) + F-23 (0.5) |
| Q8.3 | 2 | MENOR | 1.5 | F-02 (causa compartida con Q6.2) |

Por area: Q1 0.75; Q2 0.75; Q4 0.5; Q5 0.75+1.0 = 1.75; Q6 0.75+1.0 = 1.75; Q7 0.75+0.5+1.0 = 2.25; Q8 0.5. Total 8.25.

## F. Ledger de verificacion (comandos ejecutados por mi)

| ID | Comando | Resultado |
|---|---|---|
| G-01 | `node runtime/audit/cli.mjs check` | PASS |
| G-02 | `node runtime/docs/validate-doc-drift.mjs` | PASS |
| G-03 | `node parity/validate-parity.mjs` | exit 0; par-tests 95/95, unmapped=0 |
| G-04 | `node contracts/validate-contracts.mjs` | PASS |
| G-05 | `node core/validate-core.mjs` | exit 0 |
| G-06 | `node evaluation/compat/validate-compat-matrix.mjs` | PASS (29 checks) |
| G-07 | `node scripts/validate-ci-tests-listed.mjs` | PASS: 91 `*.test.mjs` ejecutados por un workflow |
| G-08 | `node scripts/validate-actions-pinned.mjs` | PASS |
| G-09 | `node runtime/status/validate-integrity.mjs` | PASS |
| G-10 | `node --test runtime/migrate/journal-contract.test.mjs runtime/consumer/l3.test.mjs runtime/migrate/tracking.test.mjs` | 63 tests, 63 pass, 0 fail, 152 s (PATCH: 21 en journal-contract; coherente) |
| G-11 | `probe.mjs`, `mut.mjs`, `s2.mjs`: fixtures con ambos journals reales (`applyMigration` + `applyConsumer`) y ficheros preexistentes identicos (`adopted`) | F.1, F.2, F.3 |
| G-12 | `l3probe.mjs`: `runL3` extremo a extremo con bundle real, lock y `--require-base` | F.2 |
| G-13 | `cons.mjs`, `cons2.mjs`: clones de `gi-clinicadental`, `gi-ot`, `MyStudyDiary` (`develop`) | F.4 |
| G-14 | `gh api` GET: rulesets, code scanning | `required_approving_review_count: 0`, `require_code_owner_review: false`; alerta #27 abierta |
| G-15 | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 83c461065b8c0df3eceda85ca9a60796501a6d08` | ver seccion I |

### F.1 Mutaciones del check de estado persistido (fixture con ambos journals, `CLAUDE.md` y `.mcp.json` preexistentes)

| Mutacion en la PR | `checkPersistedState` | Nota |
|---|---|---|
| A1 borrar solo el journal de adopcion | FAIL (41) | N-02b |
| A2 borrar solo el de migracion | FAIL (1: `.github/workflows/ai-native.yml`) | |
| A3 borrar ambos conservando ficheros | FAIL (48) | |
| A4 / A4b adopcion -> `{}` / solo `created:{}` | FAIL (41) | el journal presente no libera nada |
| A5 mover todo a `skipped` | FAIL (41) | |
| A9 quitar una sola entrada | FAIL (1) | granularidad por path |
| A10 prefijo `./` en las claves | FAIL (41) | |
| B3 borrar journal y todos los `created` salvo uno | FAIL (L5 en L3: tracking FAIL) | la regla `released` exige que NO quede ningun `created` |
| A13 / B1 borrar journal + TODOS los `created` (conservando `adopted`) | PASS | equivalente a un revert real: I-9 |
| BYP6 solo el journal, ningun `created` borrado | FAIL (47) | |
| BYP7 borrar `created` y conservar el journal | PASS | el journal sigue poseyendo; es una perdida visible de ficheros, la cubre `adoption`/`tracking` |
| BYP8 base cuyo journal tiene `created = {}` (todo `adopted`), borrar solo el journal | PASS | equivale a un revert real (que tampoco borra nada mas); `MyStudyDiary` real tiene `created=0, adopted=36` pero sus 36 paths los posee tambien el journal de migracion |

### F.2 N-06 y extremo a extremo con `runL3`

Sonda de base (cada una FAIL cerrado con "cannot be read in this checkout"): sha inexistente `0000...`, `nope`, `--help`, `--output=x`, `-h`, `main:README.md`, `HEAD^{tree}`, `@{u}`, `" "`, `main\n--x`, sha de un blob y de un arbol. Control positivo: `main` y un sha de commit valido dan PASS; base vacia es `NOT_APPLICABLE`. Las refs con forma de opcion se rechazan antes de llegar a git (`startsWith("-")`) y las demas pasan por `rev-parse --verify --quiet X^{commit}` con la ref como argumento unico (no hay shell).

Journal que es un directorio (`.ai-native/migration-journal.json/` con un fichero dentro): `checkPersistedState` -> FAIL (51 perdidos, el journal es ilegible, `JournalError`); `readOwnership` lanza `JournalError`; `runL3` ya NO lanza (antes `EISDIR`): `adoption: FAIL`, `tracking: FAIL`.

`runL3` con bundle real, lock y `--require-base`, consumidor con `CLAUDE.md` preexistente identico (`adopted`; `created` = 21):

| Caso | Resultado |
|---|---|
| L1 sin cambios | PASS |
| L2 `revertAdoption` (deja `CLAUDE.md`) y commit | PASS, tracking `NOT_APPLICABLE` (N-05 cerrado) |
| L3 borrar solo el journal | FAIL, tracking FAIL |
| L4 borrar journal + todos los `created` (conserva `CLAUDE.md`) | PASS, tracking `NOT_APPLICABLE` (identico a L2; I-9) |
| L5 borrar journal + todos los `created` salvo uno | FAIL, tracking FAIL |
| L6 journal como directorio | FAIL (`adoption`, `tracking`), sin excepcion |
| L7 / L7b base inexistente / `--help` | FAIL (`circuit` y `tracking`) |

### F.3 Flujos legitimos (falsos positivos)

| Flujo | Resultado | Nota |
|---|---|---|
| S1 `consumer --revert` con 4 ficheros `adopted` (solo adopcion) | PASS; `checkTracking` PASS | N-05 cerrado |
| S1b adopcion + migracion; `consumer --revert` | PASS | |
| S1c migracion revertida primero, luego adopcion | PASS en ambos pasos | |
| S1d revert PARCIAL (un `created` editado: el journal se conserva) | PASS | |
| S1b' adopcion revertida y luego `migrate revert` con v2 retirados | **FAIL** (`.mcp.json`, `CLAUDE.md`, y en el fixture con ficheros `adopted` tambien `.codex/*`) | **N-08**; ver s2: con solo `CLAUDE.md` y `.mcp.json` preexistentes: paso 1 PASS, paso 2 FAIL (2) en "adopcion primero", PASS en "migracion primero" |
| `--upgrade` / anadir una herramienta | sin cambios en el diff; el journal permanece, la regla `released` no se activa; cubierto por los tests existentes (CASE 9, upgrade-delta) | no re-sondeado con un journal real de upgrade |

### F.4 N-07: consumidores reales (clones nuevos de `develop`, `cons.mjs`)

| Repo | HEAD | commits (first-parent) | journals | `checkTracking` | `checkPersistedState` HEAD contra cada ancestro | transiciones adyacentes |
|---|---|--:|---|---|---|---|
| gi-clinicadental | `fd13eaf` | 90 | adopcion (27 created / 12 adopted) + migracion (16) | PASS | 89/89 PASS | 40/40 PASS |
| gi-ot | `3442293` | 45 | adopcion (25 / 11) + migracion (13) | PASS | 44/44 PASS | 40/40 PASS |
| MyStudyDiary | `548b85f` | 3 | adopcion (0 / 36) + migracion (38) | PASS | 2/2 PASS | 2/2 PASS |

Esto supera lo que dice la tabla (5 bases): se probaron todas las bases first-parent. Borrar solo el journal de adopcion: `gi-clinicadental` FAIL (25), `gi-ot` FAIL (25), `MyStudyDiary` PASS (0) porque el journal de migracion posee ya los 36 paths (caso 2b declarado). Borrar journal + `created`: PASS (I-9).

### Verificacion del codigo y del PATCH

- `tracking.mjs`: la regla `released` solo se activa si hay journal de adopcion en la base Y no esta en el arbol de HEAD Y ningun `created` esta en HEAD; libera unicamente las claves `adopted`. Lo demas se juzga como antes.
- `journals.mjs`: `readJson` captura el fallo de lectura y lo convierte en `JournalError`. `l3.mjs`: `checkPersistedState` dentro de `try/catch` con FAIL cerrado.
- PATCH: "21 tests" correcto (63 totales de las tres suites). La frase "Reverts reales en los dos ordenes" sigue sin ser cierta para el rollback a v2 (N-08). `V3.1.3-CONSUMER-COMPAT.md` es reproducible con los dos funciones indicadas; el texto no incluye el script, pero la reproduccion es trivial (F.4).
- Fuera del diff pero relacionado: `changedFiles` (`control-plane.mjs:52`) interpola `${baseSha}...${headSha}` como argumento de `git diff` sin `--` ni validacion; una base con forma `--output=...` seria una opcion. En el flujo soportado la base es `origin/${{ github.base_ref }}` (siempre con prefijo), de modo que no es alcanzable; informativo (I-11), no puntuado.

## G. Hallazgos abiertos

| ID | Sev | Pts | Tipo | Descripcion / evidencia | Correccion y verificacion |
|---|---|--:|---|---|---|
| N-08 | MINOR | 0.50 Q6.6 | ROTO | Falso positivo en el rollback completo a v2 en el orden adopcion -> migracion. Un consumidor v2 con `CLAUDE.md` y `.mcp.json` fue migrado (`retired` en el journal de migracion) y luego adoptado (la adopcion los recrea: `created`). `consumer --revert` los borra (PASS); `migrate revert` los RESTAURA (`restored`) y entonces `checkPersistedState` los cuenta como perdidos: `FAIL lost=2 [.mcp.json, CLAUDE.md]` (sonda s2). Con ficheros `adopted` identicos ademas se pierde la liberacion de la regla `released` (queda un `created` en el arbol, la restauracion de v2), y se reportan tambien los `adopted` (`.codex/*`). En el orden migracion -> adopcion pasa. El test CASE 4b ("en ambos ordenes") no tiene ficheros retirados, por eso no lo ve. No lo introduce 83c4610 (el comparador ya lo contaba asi), pero el PATCH declara los reverts reales en ambos ordenes. Fail-cerrado y flujo infrecuente (volver a v2) -> MINOR. | Excluir de `lost` los paths que un journal de migracion de la base lista en `retired` y que reaparecen (restauracion), o documentar el orden obligatorio (migracion primero); anadir test con `CLAUDE.md`/`.mcp.json` v2. |
| F-01 | MINOR | 0.75 Q1.3 | OBSOLETO | `README.md:61` sigue «latest stable `v3.0.2`»; `SESSION-CONTEXT.md:12` `STABLE_BASELINE: v3.1.2`. Re-verificado. | Actualizar el README. |
| F-02 | MINOR | 0.75 Q6.2 + 0.50 Q8.3 | RIESGO | Ruleset `ai-native-main`: `required_approving_review_count: 0`, `require_code_owner_review: false` (GET de hoy). | Segundo mantenedor/code owner o control equivalente documentado. |
| F-03 | MINOR | 0.75 Q7.1 | NO VERIFICADO | Revocacion de claves antiguas: accion humana. | Ejecutarla y documentarla. |
| F-04 | MINOR | 0.50 Q7.3 | FALTA | Un solo ruleset (rama); `release.yml` sin `environment:` (grep vacio). | Ruleset de tags + Environment. |
| F-05 | MINOR | 1.00 Q5.3 | RIESGO | Suite no determinista en Windows: en esta auditoria `git add` fallo con `.git/objects ... Permission denied` en mis propias sondas (sin reintento) y obligo a anadirlo; el test del repo ya reintenta. Suite completa no re-ejecutada; sin tres corridas completas verdes. | 3 corridas verdes consecutivas o eliminar la causa. |
| F-06 | MINOR | 0.75 Q2.2 | SOBRA | `governance/cleanup/M7-INVENTORY.md` l.33 y l.51 con `C:/Proyectos/_m6/`. Re-verificado. | Sustituir por descripcion relativa. |
| F-08 | MINOR | 0.50 Q4.5 | INCOMPLETO | `README.md` no menciona `IGNORED_REQUIRED_FILE`, `MANAGED_FILE_NOT_REPRODUCIBLE`, `UNSAFE_PATH` ni los fallos de v3.1.3 (grep = 0). | Seccion de problemas frecuentes. |
| F-10 | MINOR | 0.50 Q7.2 | RIESGO | Alerta #27 `actions/untrusted-checkout/medium` abierta (GET). | Corregir o descartar con justificacion. |
| F-11 | MINOR | 0.75 Q5.2 | NO VERIFICADO | `l3-consumer.yml` sin llamador en este repo ni runs reales. | Llamador o canary. |
| F-22 | MINOR | 0.50 Q6.6 | ROTO | `runtime/bootstrap/install.mjs:42` `order = [...]` no conserva `productDir`/`governance`. Sin cambios. | `canonical` conserva los campos + test. |
| F-23 | MINOR | 0.50 Q7.3 | RIESGO | `ci.yml:208` ejecuta `hitl.mjs` del checkout de la PR. Sin cambios. | Ejecutar desde la base o anadir al plano de control. |
| N-02b, N-05, N-06, N-07 | cerrado | 0 | — | Ver B, F.1-F.4. | — |
| I-1..I-8 | informativo | 0 | — | Heredados de `ad7af81` (symlink gestionado, `.gitattributes` con filtros, regex inglesa de `isGitRepo`, CRLF, comparador por cadena exacta, traspaso de propiedad entre journals, desinstalacion indistinguible, symlink como journal no probado). | — |
| I-9 | informativo | 0 | — | **Regla `released` (pedido de juicio).** Borrar el journal de adopcion Y todos sus `created`, conservando los `adopted` que ningun otro journal posee, da PASS en `checkPersistedState` y PASS global en `runL3` (L4). Severidad asignada: INFORMATIVA, no MINOR ni superior, por tres razones verificables: (1) el estado resultante es byte a byte el de `consumer --revert` real (L2): es la definicion de revert, no una evasion; (2) el coste es retirar TODA la proyeccion `created` (21 ficheros en el fixture, 25-27 en `gi-clinicadental`/`gi-ot`), un cambio enorme y visible en el diff, y dejar uno solo basta para FAIL (L5/B3); (3) lo que se «libera» son ficheros del proyecto identicos al canonico cuya proteccion previa era solo un `WARN` por hash (`adoption`), y no los `created` ni el lock. Efecto residual: tras ese PR los `adopted` dejan de estar bajo `adoption`/`tracking` y pueden editarse sin aviso (L4b); lo mismo que ocurre tras un revert legitimo. Los `adopted` que posee tambien el journal de migracion siguen poseidos. No hay un camino mas barato: no se puede liberar los `adopted` sin borrar la proyeccion entera. | Opcional: exigir que la retirada completa lleve tambien la retirada del lock/workflow, o un aviso `WARN` («adopcion retirada») en L3 para que el revisor lo vea. |
| I-10 | informativo | 0 | — | Residuo de N-06a: `git cat-file blob base:path` con `status != 0` sigue leyendose como «la base no tuvo el journal». Tras la verificacion `rev-parse ^{commit}`, un blob de la base que no pueda leerse (clon parcial `--filter=blob:none` con el promisor inaccesible, `fatal: could not fetch ... from promisor remote`) da PASS con 14 paths en la sonda `pc.mjs` (journal borrado en HEAD, blob del journal de la base sin traer). No alcanzable en el flujo soportado: `l3-consumer.yml` usa `fetch-depth: 0` (clon completo) y el promisor, de estar disponible, trae el blob de forma perezosa. | Distinguir «ausente» de «ilegible» con `git ls-tree base -- path` antes de `cat-file`. |
| I-11 | informativo | 0 | — | `changedFiles` interpola la base en `git diff --name-only <base>...<head>` sin `--`; una base con forma de opcion seria una opcion de git. Preexistente y fuera del diff; no alcanzable porque el workflow antepone `origin/`. `checkPersistedState` si lo valida ahora. | Validar la ref igual que `checkPersistedState`. |

## H. Camino a 100

Perdidas: Q1.3 0.75 (F-01) + Q2.2 0.75 (F-06) + Q4.5 0.5 (F-08) + Q5.2 0.75 (F-11) + Q5.3 1.0 (F-05) + Q6.2 0.75 y Q8.3 0.5 (F-02) + Q6.6 0.5 (F-22) y 0.5 (N-08) + Q7.1 0.75 (F-03) + Q7.2 0.5 (F-10) + Q7.3 1.0 (F-04 0.5 + F-23 0.5) = 8.25. 91.75 + 8.25 = 100. Correccion y verificacion de cada fila en la seccion G. Orden recomendado antes de publicar v3.1.3: N-08 (o documentar el orden), F-01 como correccion de texto; I-9 como `WARN` opcional.

## I. Comprobacion de consistencia

- Toda perdida tiene causa; cada hallazgo se asocia a un criterio materialmente relacionado; los informativos y cerrados no restan; el camino a 100 suma exactamente 8.25; sin N/A; ningun gate global se activa (0 BLOCKER, 0 CRITICAL, 0 MAJOR).
- N-05 cerrado y no reabierto en forma de evasion: la regla `released` es estrecha (todo-o-nada sobre `created`). N-08 es la unica variante nueva y es un falso positivo (fail-cerrado), no una evasion; MINOR porque el flujo es un rollback a v2, infrecuente, con orden alternativo que pasa.
- Cierre de N-07: verificado en 3 de 9 consumidores; los 6 restantes quedan sin confirmar de forma independiente (no se baja la nota: el mecanismo es el mismo, los HEAD y las formas de journal coinciden en los 3 probados).
- Resultado de `release-gate` (G-15): `PASS_WITH_WARNINGS (11 warnings)`, exit 0; las 11 advertencias son los informes anteriores marcados STALE (ignorados por el gate); el de este commit es el vigente.
- Juicio: la candidata 83c4610 cierra N-02b, N-05, N-06 y N-07 sin introducir una evasion; un unico falso positivo nuevo (N-08) en el rollback total a v2.
