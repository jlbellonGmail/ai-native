---
targetRepo: jlbellonGmail/ai-native
targetCommit: 6260751da5522e4c51c80225c70d57935bae8f0c
platform:
  version: v3.0.0-dev
  commit: 6260751da5522e4c51c80225c70d57935bae8f0c
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (audit role; SAME session lineage that implemented v3.3.0 - NOT independent in the strict sense, see section C)
  model: claude-sonnet-5-5
date: 2026-10-14T05:00:00Z
scope: release audit of the candidate v3.3.0 (global CLI lifecycle: --version, upgrade, detach, self-update, uninstall, CLI<->PLATFORM contract, CLI revocation), git diff v3.2.0..6260751 (merge of PR #115), adversarial re-verification with REAL v3.2.0 and v3.3.0 bundles
score: 88.25
isMergeGate: false
---

# Auditoria PLATFORM - ai-native @ 6260751 (candidata v3.3.0)

## A. Identificacion

- Repositorio jlbellonGmail/ai-native; checkout local `C:/Proyectos/ai-native`, rama `main`, HEAD = `6260751da5522e4c51c80225c70d57935bae8f0c` (`git rev-parse HEAD` exacto; `git status --short` = 0 lineas al empezar; igual a `origin/main`). `VERSION` = `3.0.0-dev`. Ultima release publicada: `v3.2.0` (inmutable). `v3.3.0` NO existe (sin tag ni release): se audita una CANDIDATA ya fusionada (merge de la PR #115).
- Baseline: `v3.2.0` (`d9b590b`). `git diff --stat v3.2.0..HEAD`: 29 ficheros, +2024/-153.
- Perfil PLATFORM 1.2; auditMethod 1.2. Node v26.11.1, gh 2.101.0, Windows 11, Git Bash, PowerShell 5.1. GitHub solo con GET (`gh api`, `gh release view/download` a temporales).
- Unico fichero escrito en el repo: este informe. Las sondas (`probe.mjs`, `probe2.mjs`, `probe3.mjs`) y los bundles de prueba viven en el scratchpad de la sesion, fuera del repo.

## B. Veredicto

```
Score bruto: 88.25/100
Quality Gate aplicado: ninguno (0 BLOCKER, 0 CRITICAL, 0 MAJOR)
Score final: 88.25/100
Confianza: MEDIA (publish/verify de release.yml con la serie cli-revocations, y self-update contra una release real, son imposibles de ejecutar antes de publicar; auditor NO independiente)
Estado: NO alcanza 90; cae dentro de la tolerancia de 2 puntos del release-gate (PASS_WITH_WARNINGS). No es APTO limpio.
Hallazgos: BLOCKER 0 / CRITICAL 0 / MAJOR 0 / MINOR 22 (5 nuevos: N-16..N-20; 17 heredados: 10 re-verificados hoy, 7 mantenidos sin re-verificar) / informativos 4
```

- Lectura honesta: el codigo nuevo es solido. 15/15 sondas con bundles REALES de v3.2.0 y v3.3.0 pasan, 7/7 sondas adversariales de `self-update` fallan cerrado donde deben, y las suites del alcance dan 195/195. No encontre ningun defecto de seguridad ni de integridad de datos.
- El score baja de 90 porque el informe anterior (`7e74618`) estaba EXACTAMENTE en 90.00 con 17 MINOR y este diff anade 5 MINOR reproducidos. Ninguno es bloqueante; todos son de release-process, documentacion o robustez de Windows. El informe anterior ya advertia: "cualquier descuento adicional lo dejaria por debajo".
- Recomendacion: la decision de publicar con 88.25 (dentro de tolerancia, no >= 90) es del humano. Cerrar N-16, N-17, N-19 y N-20 antes de publicar devolveria el score a >= 90 con poco trabajo (ver I).

## C. Alcance y limitaciones

**Independencia (declaracion obligatoria).** Este informe lo redacta la misma linea de sesion que implemento v3.3.0 (comparte contexto con el implementador). No es una auditoria independiente en sentido estricto, aunque el rol y el metodo sean los de auditor. Mitigaciones: (1) puntue partiendo del informe independiente anterior (`7e74618`, 90.00) y de sus perdidas, re-verificadas con comandos de hoy, no del criterio del implementador; (2) cada afirmacion de este informe se apoya en un comando ejecutado en esta pasada (seccion F); (3) los bundles de v3.2.0 y v3.3.0 son reconstruidos por `build.mjs`, no fixtures del implementador, y el digest reconstruido de v3.2.0 coincide con el publicado. Un auditor realmente independiente puede sustituir este informe: el gate acepta el de mayor score vigente.

Inspeccionado: `git diff v3.2.0..6260751` (29 ficheros): `runtime/cli/ai-native.mjs` (lectura integral), `runtime/bootstrap/{compat,semver,upgrade,detach}.mjs` (nuevos, integrales), `adopt.mjs` y `cli.mjs` (diff), `runtime/release/{build,bundle,revocations}.mjs`, `.github/workflows/release.yml`, `scripts/verify-release.mjs`, `contracts/{bootstrap-protocol,platform.schema,revocations.schema}`, `evaluation/fixtures/cli/`, README, `V3.3.0-RELEASE.md`, `CLI-RECOVERY.md`, `VERSIONING-POLICY.md`, `SESSION-CONTEXT.md`.

NO VERIFICADO: (1) `publish` y `verify` de `release.yml` con la serie `cli-revocations-N.json`, la comprobacion `CLI: $VERSION` y el paso del CLI v3.2.0 en `verify-release` (solo `build` corre en PR; los demas aparecen `skipped`); (2) `gh attestation verify` real sobre `cli-revocations-N.json` y sobre un `ai-native-cli.mjs` de v3.3.0 (en las sondas `gh` es un doble); (3) `self-update` contra una release publicada real (no hay release con version superior); (4) `verify-release.mjs` contra una release real v3.3.0; (5) Linux/macOS locales (solo CI verde en ubuntu y windows); (6) PowerShell 7 y `.cmd` en rutas con caracteres no ASCII; (7) F-03 (revocacion de claves antiguas) y los 9 consumidores reales.

## D. Matriz de puntuacion

| Area | Max | Obtenido |
|---|--:|--:|
| Q1 | 12 | 11.25 |
| Q2 | 12 | 11.25 |
| Q3 | 12 | 12.00 |
| Q4 | 12 | 10.50 |
| Q5 | 16 | 13.75 |
| Q6 | 16 | 12.50 |
| Q7 | 12 | 9.50 |
| Q8 | 8 | 7.50 |
| **Total** | **100** | **88.25** |

Aritmetica: 11.25+11.25+12+10.5+13.75+12.5+9.5+7.5 = 88.25; perdidas 0.75+0.75+0+1.5+2.25+3.5+2.5+0.5 = 11.75. Sin N/A. Metodo: partida de `7e74618` (perdidas 10.00); cada perdida heredada se re-verifico o se mantuvo por NO VERIFICADO (indicado en E); se acredita lo cerrado (NV de publish/verify del asset, ejecutado de verdad en v3.2.0) y se descuentan los hallazgos nuevos (1.75). 10.00 - 0.00 (credito y nuevo NV se compensan) + 1.75 = 11.75.

## E. Subcriterios con perdida (el resto COMPLETO)

| ID | Max | Nivel | Obt. | Hallazgo |
|---|--:|---|--:|---|
| Q1.3 | 3 | MENOR | 2.25 | N-13 (0.25, heredado: la documentacion afirma una cobertura de CI por PR que no existe para `runtime/cli`) + N-15 (0.25, heredado, sigue abierto: la linea de v3.2.0 en `SESSION-CONTEXT.md` dice "PR abierta") + N-19 (0.25, nuevo: la misma clase de desfase para v3.3.0) |
| Q2.2 | 3 | MENOR | 2.25 | F-06 (re-verificado: `governance/cleanup/M7-INVENTORY.md` y `M7-CLOSURE.md` con `_m6/`) |
| Q4.2 | 3 | MENOR | 2.25 | N-11 residual (0.25) + N-14 (0.25, re-verificado: segunda ejecucion del bloque falla) + N-18 (0.25, nuevo) |
| Q4.5 | 2 | PARCIAL | 1.25 | F-08 (0.5, re-verificado) + N-20 (0.25, nuevo: README sin `DETACH_BLOCKED`, `DOWNGRADE_REFUSED`, `CLI_REVOKED`) |
| Q5.2 | 3 | MENOR | 2.25 | F-11 (re-verificado: `l3-consumer.yml` solo `workflow_call`) |
| Q5.3 | 4 | MENOR | 3.0 | F-05 (observado hoy en esta maquina: `git commit ... Permission denied` en `l3.test.mjs`, suite completa previa; no se repitio en esta auditoria) |
| Q5.5 | 3 | MENOR | 2.5 | N-13 (0.5, re-verificado: `release.yml` filtra `paths` sin `runtime/cli/**`) |
| Q6.2 | 3 | MENOR | 2.25 | F-02 (re-verificado por GET: `required_approving_review_count: 0`) |
| Q6.4 | 3 | MENOR | 1.75 | N-12 (0.5, heredado) + N-16 (0.5, nuevo) + NO VERIFICADO publish/verify de la serie nueva (0.25; el NV heredado del asset se cierra: `push v3.2.0` = success) |
| Q6.6 | 2 | PARCIAL | 0.5 | F-22 (0.5) + N-08 (0.5) heredados sin cambios + N-17 (0.5, nuevo): detach |
| Q7.1 | 3 | MENOR | 2.25 | F-03 (NO VERIFICADO) |
| Q7.2 | 2 | MENOR | 1.5 | F-10 (re-verificado por GET: alerta #27 abierta) |
| Q7.3 | 2 | PARCIAL | 1.0 | F-04 (re-verificado: un solo ruleset, `release.yml` sin `environment:`) + F-23 |
| Q7.5 | 3 | MENOR | 2.75 | P-06r (heredado, no re-verificado) |
| Q8.3 | 2 | MENOR | 1.5 | F-02 (causa compartida con Q6.2) |

Por area: Q1 0.25+0.25+0.25 = 0.75; Q2 0.75; Q3 0; Q4 (N-11 0.25 + N-14 0.25 + N-18 0.25) + (F-08 0.5 + N-20 0.25) = 1.5; Q5 0.75+1.0+0.5 = 2.25; Q6 F-02 0.75 + Q6.4 (N-12 0.5 + N-16 0.5 + NV 0.25 = 1.25) + Q6.6 (F-22 0.5 + N-08 0.5 + N-17 0.5 = 1.5) = 3.5; Q7 0.75+0.5+1.0+0.25 = 2.5; Q8 0.5. Total 0.75+0.75+0+1.5+2.25+3.5+2.5+0.5 = 11.75.

## F. Ledger de verificacion (comandos ejecutados por mi)

| ID | Comando | Resultado |
|---|---|---|
| F-01 | `git rev-parse HEAD`; `git status --short \| wc -l` | `6260751da5522e4c51c80225c70d57935bae8f0c`; 0 |
| F-02 | `git log --oneline v3.2.0..HEAD`; `git diff --stat v3.2.0..HEAD` | 4 commits + merge; 29 ficheros, +2024/-153 |
| F-03 | `node runtime/release/build.mjs --version v3.2.0 --commit <v3.2.0>` vs `gh release view v3.2.0` digest | `sha256:a675339e...efff` identico: el build reproduce la release publicada |
| F-04 | `gh release download v3.2.0 --pattern ai-native-cli.mjs`; `cmp` con `evaluation/fixtures/cli/ai-native-v3.2.0.mjs` y con `git show v3.2.0:runtime/cli/ai-native.mjs` | identicos byte a byte: el fixture ES el CLI publicado |
| F-05 | `node runtime/release/build.mjs --version v3.3.0 --commit 6260751...` | exit 0; 5 assets (`cli-revocations-1.json` incluido); `ai-native-cli.mjs --version` = `CLI: v3.3.0` |
| F-06 | `build.mjs --version v3.3.1-rc.1` y `v3.4.0-alpha.1` | exit 1: "declares CLI_VERSION v3.3.0; this release is ..." (N-16) |
| F-07 | `probe.mjs` (bundles REALES v3.2.0 y v3.3.0, red y gh simulados) | 15/15 PASS (detalle en G); S3 y S6 informativos (N-17) |
| F-08 | `probe2.mjs`: `install` con `AI_NATIVE_HOME` = `...\O'Brien 100%` | la linea de PATH de PowerShell no parsea (excepcion de `[scriptblock]::Create`); el shim `.cmd` falla con `Cannot find module '...O'Brien 100*'` (N-18) |
| F-09 | `probe3.mjs`: 7 sondas adversariales de `self-update` | P1, P2, P5, P6 fallan cerrado con el CLI intacto; P3, P4 actualizan; P7 ignora el downgrade; sin restos de staging |
| F-10 | `node scripts/test-hermetic.mjs -- <15 ficheros: runtime/cli (2), bootstrap (3), release (2), scripts (3), docs, migrate (3), adapters launcher>` | 195/195 pass, 247 s, Windows, concurrencia 2 |
| F-11 | `node runtime/audit/cli.mjs check`; `validate-ci-tests-listed`; `validate-actions-pinned`; `validate-doc-drift`; `core/validate-core`; `validate-integrity` | todos PASS |
| F-12 | `git diff --check v3.2.0..HEAD` | sin salida |
| F-13 | `gh api .../rulesets`, `.../rulesets/<id>`; `gh api .../code-scanning/alerts?state=open`; `grep environment: release.yml` | un ruleset `ai-native-main`, `pull_request` con `required_approving_review_count` 0; alerta #27 abierta; sin `environment:` |
| F-14 | `grep -n "on:" -A12 .github/workflows/release.yml`; `grep runtime/cli .github/workflows/*.yml` | `paths` = release.yml, runtime/release, runtime/bootstrap, runtime/main.mjs, governance/versioning; los tests de `runtime/cli` solo corren en el job `build` via `runtime/*/*.test.mjs` |
| F-15 | `gh run list --workflow release.yml`; `gh release view v3.2.0` | `push v3.2.0` completed/success; inmutable, 7 assets: el pipeline publish+verify con `ai-native-cli.mjs` se ejecuto de verdad |
| F-16 | `gh release download --pattern ai-native-cli.mjs` dos veces al mismo directorio | 1a exit 0; 2a exit 1 `already exists (use --clobber...)` (N-14) |
| F-17 | `grep -c` de codigos de error en README | TRUST_ROOT, RELEASE_REJECTED, REVOCATION_UNKNOWN, ROLLBACK_INCOMPLETE, IGNORED_REQUIRED_FILE, MANAGED_FILE_NOT_REPRODUCIBLE, PROFILE_REQUIRED, ATTESTATION_UNAVAILABLE, CLI_REVOKED, DETACH_BLOCKED, DOWNGRADE_REFUSED = 0; INCOMPATIBLE_CLI y LEGACY_CLI = 1 |
| F-18 | `grep` en `governance/SESSION-CONTEXT.md` y `V3.3.0-RELEASE.md` | `STABLE_BASELINE: v3.1.3` (v3.2.0 ya publicada); dos lineas "En curso"/"PR abierta"; V3.3.0-RELEASE dice CANDIDATA con la PR ya mergeada (N-19) |
| F-19 | `grep _m6/ governance/**/*.md`; `grep on: l3-consumer.yml` | F-06 y F-11 siguen abiertos |
| F-20 | `release-gate --profile PLATFORM --candidate 6260751...` | ver J |

## G. Re-validacion adversarial de los elementos obligatorios

| Elemento | Resultado | Evidencia |
|---|---|---|
| CLI nuevo + PLATFORM vieja REAL (v3.2.0) | PASS: `init` READY, DRIFT CLEAN, lock v3.2.0 | F-07 S1 |
| `init` sobre repo pinneado v3.2.0 con v3.3.0 publicada | PASS: no cambia | S2a |
| `upgrade` v3.2.0 -> v3.3.0 con bundles REALES | PASS: READY, DRIFT CLEAN, lock v3.3.0, launcher funcional, `init` posterior idempotente, `status` READY | S2b-S2e |
| CLI v3.2.0 REAL contra PLATFORM v3.3.0 REAL | PASS: READY y `LEGACY_CLI` con el remedio; re-ejecucion sobre repo v3.3.0 READY | S4, S4b |
| `detach` sobre repo v3.3.0 | PASS: elimina los 47 gestionados, journal y lock; `git status` vacio | S5 |
| multi-repo (v3.2.0 y v3.3.0 con un mismo CLI y cache) | PASS: ninguno se mueve; `--version` correcto por repo | S7, S7b |
| asset REAL v3.3.0: install / --version / self-update --check / uninstall | PASS | S8a-S8d |
| revocacion del CLI y anti-downgrade | PASS: lista mal formada, `entries` no array, attestation de la lista fallida => cerrado; version marcada falsificada en comentario => rechazada; downgrade ignorado | F-09 |
| fallo al reemplazar / rollback | PASS en la suite (`SELF-UPDATE failure while replacing`, `UPGRADE failure ... exactly as it was`) dentro de F-10 | |
| compatibilidad contrato CLI<->PLATFORM | PASS: matriz de 7 casos + CLI v3.2.0 real | F-10, S4 |

## H. Hallazgos abiertos

**Nuevos (todos MINOR):**

- **N-16 - el build rechaza cualquier prerelease de una version >= 3.3.** `build.mjs` exige `CLI_VERSION == tag`, pero `CLI_VERSION` es un literal estable `vX.Y.Z` y `release.yml` sigue disparandose con tags `-alpha.N` / `-rc.N`. `build.mjs --version v3.3.1-rc.1` y `v3.4.0-alpha.1` salen con exit 1 (F-06). Falla cerrado (no se publica nada), pero contradice la politica de versionado y los tags que el workflow acepta. Se suma a N-12 (el paso de aceptacion tampoco admite alpha/rc).
- **N-17 - `detach` tiene dos limites de disponibilidad.** (a) En un repo pinneado a una release sin motor `detach` (v3.2.0 y anteriores, es decir, todos los consumidores actuales) falla con "predates `ai-native detach` ... run `ai-native upgrade` first" y no cambia nada (S3): honesto y sin perdida, pero obliga a subir antes de poder quitar. (b) Si la release pinneada esta revocada y hay red, `detach` aborta con `REVOKED` (S6) cuando el motivo para quitarla es justo esa revocacion; `--offline` lo evita si la release esta en cache. La causa es que `main` aplica `assertNotRevoked` tambien a `detach`.
- **N-18 - robustez de `install` en Windows con rutas atipicas.** La linea de PATH de PowerShell que `install` imprime no parsea si la ruta contiene apostrofe (p. ej. usuario `O'Brien`), y el shim `.cmd` falla si la ruta contiene `%` (F-08). Inocuo en rutas normales; es regresion de calidad respecto a la promesa "funciona en Windows" para esos nombres.
- **N-19 - estado de gobernanza desfasado.** `SESSION-CONTEXT.md` mantiene `STABLE_BASELINE: v3.1.3` y dos bloques "En curso ... PR abierta" cuando v3.2.0 esta publicada y la PR #115 esta mergeada; `V3.3.0-RELEASE.md` dice "CANDIDATA ... PR" tras el merge (F-18). Misma clase que N-15 del informe anterior.
- **N-20 - la documentacion de usuario no cubre los codigos de fallo nuevos.** `DETACH_BLOCKED`, `DOWNGRADE_REFUSED` y `CLI_REVOKED` no aparecen en el README (F-17); extiende F-08.

**Heredados re-verificados hoy (10, siguen abiertos):** F-02, F-04, F-05 (observado hoy en esta maquina en la suite completa previa; NO incluido en la suite de esta auditoria), F-06, F-08, F-10, F-11, N-13, N-14, N-15.
**Heredados mantenidos sin re-verificar (7):** F-03 (no verificable), F-22 y N-08 (los ficheros no cambian en el diff), N-11 (el guardia del README sigue cubriendo solo "New project"; la seccion nueva del README no esta guardada), N-12, F-23, P-06r.
**Cerrado:** el NV de publish/verify del asset del CLI (`push v3.2.0` = success, release inmutable con 7 assets).

**Informativos (sin descuento):** (I-1) `self-update` conserva un solo `.prev` y su fichero de staging tiene nombre fijo (`ai-native.next.mjs`): dos `self-update` simultaneos pueden pisarse; no hay perdida (el reemplazo es por rename y se re-sonda). (I-2) `ai-native version --<opcion desconocida>` la ignora en silencio (`version` no pasa por `parse`). (I-3) la revocacion del CLI no se consulta con `--offline` (declarado: la salida lo advierte para la release, no para el CLI). (I-4) `uninstall` borra por nombre los ficheros propios de `bin/`: solo dentro del directorio propio de ai-native.

## I. Camino 100

1. N-16: declarar un marcador de CLI que admita sufijo `-rc.N`/`-alpha.N` (o exentarlo del chequeo del build en prereleases) y probar `build.mjs` con ambos tags. +0.5.
2. N-17(b): `detach` no debe exigir "no revocada" a la release que se quita (o debe degradar a aviso). +0.25.
3. N-19 y N-20: actualizar `SESSION-CONTEXT.md` / `V3.3.0-RELEASE.md` tras publicar y documentar los codigos nuevos en el README. +0.5.
4. N-18: citar el apostrofe en la linea de PATH (`''`) y usar `%%`-seguro o ruta corta en el `.cmd`. +0.25.
5. N-13: anadir `runtime/cli/**` al `paths` de `release.yml` (o ejecutar esa suite en `ci.yml`). +0.5.
6. Tras publicar: ejecutar `verify-release.mjs v3.3.0 --expect-commit <sha>` y registrar el resultado para cerrar el NV de la serie nueva. +0.25.

Cerrar 1-3 y 5 devuelve el score a >= 90 sin tocar el diseno.

## J. Resultado de `release-gate`

`node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 6260751da5522e4c51c80225c70d57935bae8f0c` con este informe presente (ejecutado despues de escribirlo):

```
PASS_WITH_WARNINGS (16 warnings)
WARNING score 88.25 is below 90 but within the 2-point tolerance
```

Las 15 advertencias restantes son los informes anteriores marcados STALE para este SHA (comportamiento normal). El gate pasa SOLO por la tolerancia: el score no alcanza 90. Aceptar o no un pase por tolerancia es una decision humana, no del gate.
