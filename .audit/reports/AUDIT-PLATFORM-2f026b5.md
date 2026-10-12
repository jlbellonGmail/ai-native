---
targetRepo: jlbellonGmail/ai-native
targetCommit: 2f026b5cfc6bc67b9f1a37100d19a3e5ade04e5f
platform:
  version: v3.0.0-dev
  commit: 2f026b5cfc6bc67b9f1a37100d19a3e5ade04e5f
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-12T23:00:00Z
scope: re-audit of the candidate v3.1.3 (branch fix/v3.1.3-n02b-persisted-journals), git diff e36040f..2f026b5, with adversarial verification of the closure of N-08 (symmetric `released` rule for a reverted migration journal in runtime/migrate/tracking.mjs) and re-verification of N-02b, N-05, N-06 and N-07
score: 91.75
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ 2f026b5 (candidata v3.1.3, re-auditoria de N-08)

## A. Identificacion

- Repositorio jlbellonGmail/ai-native; checkout local `C:/Proyectos/ai-native`, rama `fix/v3.1.3-n02b-persisted-journals`, HEAD = `2f026b5cfc6bc67b9f1a37100d19a3e5ade04e5f` (`git rev-parse HEAD`, arbol limpio al empezar). `VERSION` = `3.0.0-dev`. Ultima release publicada `v3.1.2` (`e36040f`); v3.1.3 NO esta publicada: se audita una CANDIDATA.
- Perfil PLATFORM 1.2; QUALITY_SCORE 1.1; AUDIT_RULES 1.1; auditMethod 1.2. Node v26, Windows 11, Git Bash. GitHub solo lectura (`ls-remote`, clones de lectura).
- Plantilla: `AUDIT-PLATFORM-83c4610.md`. Ninguna conclusion heredada se copia sin re-verificar. Unico fichero escrito en el repo: este informe. Sondas y clones en `%TEMP%/aud-v313c` con `GIT_CEILING_DIRECTORIES=%TEMP%`.

## B. Veredicto

```
Score bruto: 91.75/100
Quality Gate aplicado: ninguno (0 BLOCKER, 0 CRITICAL, 0 MAJOR; validadores PASS; 83/83 tests de cinco suites de migrate/consumer)
Score final: 91.75/100
Confianza: MEDIA (F-03, F-11 no verificables; suite completa NO re-ejecutada; N-07 re-verificado en 2 de 9 consumidores)
Estado: APTO (banda 90-94)
Hallazgos: BLOCKER 0 / CRITICAL 0 / MAJOR 0 / MINOR 12 (1 nuevo, N-09) / informativos 12
```

- **N-08: CERRADO.** Con un v2 real (`template-starter` v2.0.4 pinned, `9e7dfb5`) migrado con `--tools codex` y adoptado encima, "revertir adopcion y luego `migrate revert`" da FAIL en `83c4610` (`lost=11`) y PASS en `2f026b5` (`lost=0`, arbol byte a byte igual al v2 original); el orden inverso tambien PASS. El test nuevo es rojo sin el cambio (ejecutado contra el `tracking.mjs` de `83c4610`: 22 tests, 1 fallo, el N-08).
- **N-02b: CERRADO** (mutaciones re-ejecutadas con el v2 real; F.2). Sin regresion.
- **N-05, N-06, N-07: siguen CERRADOS.** 83/83 tests; N-07 re-verificado con `gi-ot` (44/44 ancestros PASS) y `gi-clinicadental` (89/89 PASS), `checkTracking` PASS en ambos.
- **Hallazgo nuevo N-09 (MINOR):** el journal de la base es historia sin autenticar. Un PR1 que solo reescribe el journal (anade `replaced` = todos los `created`) pasa todos los checks; un PR2 posterior que borra solo el journal con TODOS los ficheros en el arbol da PASS. Dentro de un unico PR el bypass NO existe. Misma familia que un patron ya existente en el journal de adopcion (E6), que la regla nueva extiende al de migracion. Detalle en G y F.3.

## C. Alcance y limitaciones

Inspeccionado: `git diff e36040f..2f026b5` y el delta `83c4610..2f026b5` (tracking.mjs +9 lineas, journal-contract.test.mjs +30, V3.1.3-PATCH.md), mas `migrate.mjs` (`applyMigration`: `retired`, `replaced`, `created`; `revertMigration`), `journals.mjs` (`parseJournal` no valida `replaced`/`retired`), `l3.mjs`. El diff no toca `contracts/**`, `.github/**`, `runtime/gates/**` ni `AGENTS.md` (el delta 83c4610..2f026b5 solo anade `.audit/reports/AUDIT-PLATFORM-83c4610.md`).

NO_RUN / NO VERIFICADO: suite completa `test-hermetic.mjs`; 7 de los 9 consumidores (solo 2 clonados); `l3-consumer.yml` real; revocacion de claves; symlinks como journal; red de clones parciales; ruleset y alertas de code scanning no re-consultados hoy (se heredan de `83c4610`).

## D. Matriz de puntuacion

| Area | Max | Obtenido |
|---|--:|--:|
| Q1 | 12 | 11.25 |
| Q2 | 12 | 11.25 |
| Q3 | 12 | 12.00 |
| Q4 | 12 | 11.50 |
| Q5 | 16 | 14.25 |
| Q6 | 16 | 14.75 |
| Q7 | 12 | 9.25 |
| Q8 | 8 | 7.50 |
| **Total** | **100** | **91.75** |

Aritmetica: 11.25+11.25+12+11.5+14.25+14.75+9.25+7.5 = 91.75; perdidas 0.75+0.75+0+0.5+1.75+1.25+2.75+0.5 = 8.25. Respecto de `83c4610` (91.75): Q6.6 +0.5 (N-08 cerrado), Q7.3 -0.5 (N-09 nuevo). Sin N/A.

## E. Subcriterios con perdida (el resto COMPLETO)

| ID | Max | Nivel | Obt. | Hallazgo |
|---|--:|---|--:|---|
| Q1.3 | 3 | MENOR | 2.25 | F-01 |
| Q2.2 | 3 | MENOR | 2.25 | F-06 |
| Q4.5 | 2 | PARCIAL | 1.5 | F-08 |
| Q5.2 | 3 | MENOR | 2.25 | F-11 |
| Q5.3 | 4 | MENOR | 3.0 | F-05 |
| Q6.2 | 3 | MENOR | 2.25 | F-02 |
| Q6.6 | 2 | MENOR | 1.5 | F-22 (0.5) |
| Q7.1 | 3 | MENOR | 2.25 | F-03 |
| Q7.2 | 2 | MENOR | 1.5 | F-10 |
| Q7.3 | 2 | PARCIAL | 0.5 | F-04 (0.5) + F-23 (0.5) + N-09 (0.5) |
| Q8.3 | 2 | MENOR | 1.5 | F-02 (causa compartida con Q6.2) |

Por area: Q1 0.75; Q2 0.75; Q4 0.5; Q5 0.75+1.0 = 1.75; Q6 0.75+0.5 = 1.25; Q7 0.75+0.5+1.5 = 2.75; Q8 0.5. Total 8.25.

## F. Ledger de verificacion (comandos ejecutados por mi)

| ID | Comando | Resultado |
|---|---|---|
| G-01..G-09 | `runtime/audit/cli.mjs check`; `validate-doc-drift`; `parity/validate-parity`; `contracts/validate-contracts`; `core/validate-core`; `evaluation/compat/validate-compat-matrix`; `scripts/validate-ci-tests-listed`; `scripts/validate-actions-pinned`; `runtime/status/validate-integrity` | los 9 con exit 0 |
| G-10 | `node --test runtime/migrate/journal-contract.test.mjs runtime/consumer/l3.test.mjs runtime/migrate/tracking.test.mjs runtime/migrate/migrate.test.mjs runtime/migrate/upgrade-delta.test.mjs` | 83 tests, 83 pass, 0 fail, 0 skipped |
| G-11 | el mismo `journal-contract.test.mjs` copiado sobre un `git archive 83c4610` | 22 tests, 21 pass, **1 fail: N-08** (confirma "rojo sin el cambio") |
| G-12 | `probe.mjs`/`probe2.mjs` (nuevo vs `83c4610`): clon del `template-starter` v2.0.4 real, `applyMigration` + `applyConsumer` reales + `revertAdoption`/`revertMigration` reales | F.1 |
| G-13 | `exp.mjs`, `exp2.mjs`, `exp3.mjs`: mutaciones y bypass sobre el mismo fixture | F.2, F.3 |
| G-14 | `cons.mjs`: `checkPersistedState` HEAD contra cada ancestro first-parent y `checkTracking` en `gi-ot`, `gi-clinicadental` (`develop`) | F.4 |
| G-15 | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 2f026b5cfc6bc67b9f1a37100d19a3e5ade04e5f` | ver seccion I |

### F.1 N-08 con un v2 real (starter v2.0.4; migracion `--tools codex --profile factory`: replaced 5, retired 104, created 8; adopcion de claude/opencode/codex encima)

Con la migracion por defecto (todas las herramientas) los ficheros reemplazados son `adopted` en el journal de adopcion y el bug no se manifiesta (PASS tambien en `83c4610`); el caso real es la migracion parcial, donde los ficheros v2 (`CLAUDE.md`, `.mcp.json`, `.claude/agents/*`) los recrea la adopcion como `created`.

| Flujo (paso 2 = estado final) | `83c4610` | `2f026b5` |
|---|---|---|
| A) `revertAdoption` -> commit -> `revertMigration` -> commit; arbol identico al v2 original | paso 1 PASS; **paso 2 FAIL lost=11** | PASS lost=0; `checkTracking` PASS; `git diff` contra el v2 vacio |
| B) `revertMigration` primero (`PARTIAL`: 5 `kept`) -> `revertAdoption` | PASS lost=0 | PASS lost=0 |
| B') tras B, `checkTracking` | FAIL (absent: workflow, lock, ai-native.mjs); un 2.o `migrate revert` lo deja REVERTED, journal ausente, PASS/PASS | igual (preexistente, I-12) |
| Migracion completa (todas las herramientas) + A y B | PASS en ambos | PASS en ambos |

### F.2 N-02b: mutaciones sobre el fixture real (codex-migrado + adopcion)

| Mutacion | `2f026b5` |
|---|---|
| A1 borrar solo el journal de adopcion | FAIL (41) |
| A3 borrar ambos journals, conservar ficheros | FAIL (48) |
| E1 borrar solo el de migracion | FAIL (1: `.github/workflows/ai-native.yml`) |
| E1b borrar ambos | FAIL (48) |
| A4 adopcion -> `{}` | FAIL (41) |
| A4m migracion `created=[]` / sin la clave `created` | FAIL (1) |
| journal de migracion corrupto en HEAD | FAIL (51) |
| BYP6m borrar el journal de migracion, nada mas (sin forjar) | FAIL (1) |
| E7 base con `replaced:"oops"`, `retired:[null,5,{path:3}]`; E8 `replaced:[{path:"../../etc/passwd"}]` | sin excepcion; FAIL (1): entradas no validas se ignoran, nunca liberan |

A9m (quitar una entrada) dio PASS porque la primera entrada era un path que el journal de adopcion posee; no es un agujero. Control de supervivientes (E2 y exp2): borrar el journal de migracion y todos sus `created` salvo uno: superviviente `.github/workflows/ai-native.yml` -> FAIL; `ai-native.lock.json` o `.ai-native/ai-native.mjs` -> PASS, porque el primero siempre esta gestionado (`managedPaths` lo anade si existe) y el segundo sigue en el journal de adopcion; nada se pierde. `stillCreated` descuenta correctamente los paths `replaced`/`retired`.

### F.3 La regla nueva como superficie de ataque

| Caso | Resultado | Lectura |
|---|---|---|
| Un solo PR, base legitima: borrar el journal dejando CUALQUIER `created` de la migracion que nadie mas posea | FAIL | el bypass pedido no existe en un PR |
| E4 borrar el journal + todos los `created` no reemplazados, conservando los `replaced` con contenido v3 | PASS (el journal de adopcion presente sigue poseyendolos como `adopted`; `tracking` FAIL por entradas ausentes del journal de adopcion) | libera ficheros que NO son v2 originales |
| E9 borrar ambos journals + todo salvo los paths `replaced`/`retired` (contenido v3) | PASS | es I-9 con un matiz: el contenido no se compara con el hash v2 del journal; coste identico al de un revert (borrar lock, workflow y demas proyecciones) |
| **E5 dos pasos:** PR1 reescribe `.ai-native/migration-journal.json` con `replaced` = todos los `created` (lock y workflow incluidos) y no borra nada: `checkPersistedState` PASS, `checkTracking` PASS; PR2 (base = PR1) borra solo el journal, todo el arbol presente | **PASS lost=0** | agujero de dos pasos (N-09) |
| **E6 mismo patron en el journal de adopcion (preexistente):** PR1 mueve `created` -> `adopted` (PASS); PR2 borra solo el journal de adopcion | **PASS lost=0** | la familia ya existia en `83c4610`; la regla nueva la extiende |

Nada marca la edicion de un journal: `.ai-native/**` no esta en el plano de control y `parseJournal` no valida `replaced`/`retired`; el comentario de `tracking.mjs` dice que los journals son entrada no confiable ("a PR can edit them") pero la base se trata como historia confiable.

### F.4 N-07 re-verificado

`gi-ot` HEAD `3442293`: 44/44 ancestros first-parent PASS, `checkTracking` PASS. `gi-clinicadental` HEAD `fd13eaf`: 89/89 PASS, `checkTracking` PASS. Los otros 7 consumidores no se re-verificaron esta vez.

## G. Hallazgos abiertos

| ID | Sev | Pts | Tipo | Descripcion / evidencia | Correccion y verificacion |
|---|---|--:|---|---|---|
| N-09 | MINOR | 0.50 Q7.3 | RIESGO | El journal de la base se trata como historia confiable pero un PR puede reescribirlo sin que nada lo vea. Con la regla `released` de migracion, un PR1 que solo anade `replaced`/`retired` = todos los `created` pasa `checkPersistedState` y `checkTracking`; un PR2 que borra solo el journal deja TODO el arbol y da PASS (E5). Para el journal de adopcion el equivalente (mover `created` a `adopted`, luego borrar el journal) ya funcionaba en `83c4610` (E6). En un unico PR no es explotable (la base es la rama destino). Exige dos PR aprobados por el HITL; lo que se des-gestiona son proyecciones y el workflow, no el lock. MINOR y no mayor por: dos pasos revisados, fail-closed en cada paso unico, impacto acotado. El mismo defecto libera ficheros con contenido v3 y no v2 (E4/E9). | (a) liberar un `replaced`/`retired` solo si el contenido en HEAD es el del `sha256` v2 del journal (o esta ausente); (b) `WARN` en L3 cuando un PR cambia un journal sin retirar sus `created`; o (c) proteger `.ai-native/*-journal.json` como plano de control. Anadir el test E5. |
| F-01 | MINOR | 0.75 Q1.3 | OBSOLETO | `README.md:61` «latest stable `v3.0.2`»; STABLE_BASELINE `v3.1.2`. Sin cambios. | Actualizar el README. |
| F-02 | MINOR | 0.75 Q6.2 + 0.50 Q8.3 | RIESGO | Ruleset `ai-native-main`: `required_approving_review_count: 0`, `require_code_owner_review: false` (heredado de `83c4610`, no re-consultado). | Segundo mantenedor/code owner o control equivalente. |
| F-03 | MINOR | 0.75 Q7.1 | NO VERIFICADO | Revocacion de claves antiguas: accion humana. | Ejecutarla y documentarla. |
| F-04 | MINOR | 0.50 Q7.3 | FALTA | Un solo ruleset (rama); `release.yml` sin `environment:`. | Ruleset de tags + Environment. |
| F-05 | MINOR | 1.00 Q5.3 | RIESGO | Suite no determinista en Windows (`.git/objects ... Permission denied`, observado en la auditoria previa); suite completa no re-ejecutada; sin tres corridas completas verdes. Las cinco suites corrieron verdes a la primera aqui. | 3 corridas verdes consecutivas o eliminar la causa. |
| F-06 | MINOR | 0.75 Q2.2 | SOBRA | `governance/cleanup/M7-INVENTORY.md` l.33 y l.51 con `C:/Proyectos/_m6/`. Heredado. | Sustituir por descripcion relativa. |
| F-08 | MINOR | 0.50 Q4.5 | INCOMPLETO | `README.md` no menciona `IGNORED_REQUIRED_FILE`, `MANAGED_FILE_NOT_REPRODUCIBLE`, `UNSAFE_PATH` ni los fallos de v3.1.3. | Seccion de problemas frecuentes. |
| F-10 | MINOR | 0.50 Q7.2 | RIESGO | Alerta #27 `actions/untrusted-checkout/medium` (heredada, no re-consultada). | Corregir o descartar con justificacion. |
| F-11 | MINOR | 0.75 Q5.2 | NO VERIFICADO | `l3-consumer.yml` sin llamador ni runs reales. | Llamador o canary. |
| F-22 | MINOR | 0.50 Q6.6 | ROTO | `runtime/bootstrap/install.mjs:42` `order = [...]` no conserva `productDir`/`governance`. Sin cambios. | `canonical` conserva los campos + test. |
| F-23 | MINOR | 0.50 Q7.3 | RIESGO | `ci.yml:208` ejecuta `hitl.mjs` del checkout de la PR. Sin cambios. | Ejecutar desde la base o anadir al plano de control. |
| N-02b, N-05, N-06, N-07, N-08 | cerrado | 0 | — | Ver B, F.1, F.2, F.4. | — |
| I-1..I-11 | informativo | 0 | — | Heredados de `83c4610` (I-9: borrar journal + todos los `created` equivale a un revert; I-10: base de clon parcial; I-11: `changedFiles` sin `--`). | — |
| I-12 | informativo | 0 | — | Orden "migracion primero": `migrate revert` queda `PARTIAL` cuando la adopcion posee ficheros solapados (5 `kept`) y el journal de migracion permanece; entre medias `checkTracking` da FAIL (workflow/lock ausentes del arbol) hasta repetir `migrate revert`. `checkPersistedState` PASS en todos los pasos y el final es PASS/PASS. Igual en `83c4610`. El PATCH dice «reverts reales en los dos ordenes»: cierto para el estado persistido, no para la ausencia de pasos intermedios. | Documentar que tras B hay que repetir `migrate revert`. |

## H. Camino a 100

Perdidas: Q1.3 0.75 (F-01) + Q2.2 0.75 (F-06) + Q4.5 0.5 (F-08) + Q5.2 0.75 (F-11) + Q5.3 1.0 (F-05) + Q6.2 0.75 y Q8.3 0.5 (F-02) + Q6.6 0.5 (F-22) + Q7.1 0.75 (F-03) + Q7.2 0.5 (F-10) + Q7.3 1.5 (F-04, F-23, N-09 a 0.5) = 8.25. 91.75 + 8.25 = 100. Antes de publicar v3.1.3: N-09 (a) o (b) con test, F-01 como correccion de texto; I-12 como nota en el PATCH.

## I. Comprobacion de consistencia

- Toda perdida tiene causa; los cerrados e informativos no restan; el camino a 100 suma exactamente 8.25; sin N/A; ningun gate global (0 BLOCKER, 0 CRITICAL, 0 MAJOR).
- N-08 cerrado de forma real (v2 real, ambos ordenes, test rojo sin el cambio). La regla nueva no abre un bypass de un solo PR: fail-closed ante cualquier `created` superviviente que nadie mas posea, y ante `replaced`/`retired` malformados o con traversal. El unico vector es de dos pasos y requiere editar el journal en un PR previo (N-09), misma familia que la regla de adopcion existente.
- Resultado de `release-gate` (G-15): `PASS_WITH_WARNINGS (12 warnings)`, exit 0, ejecutado con este informe en su sitio. Las 12 advertencias son los informes anteriores marcados STALE (ignorados por el gate); el de este commit es el vigente. Validadores G-01..G-09 PASS.
