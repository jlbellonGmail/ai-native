---
targetRepo: jlbellonGmail/ai-native
targetCommit: 558642c3f16a2671cc6863f5c2c3bf5376acf59a
platform:
  version: v3.0.0-dev
  commit: 558642c3f16a2671cc6863f5c2c3bf5376acf59a
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (audit role; SAME session lineage that implemented the closure PR #123 - NOT independent in the strict sense, see section INDEPENDENCE)
  model: claude-sonnet-5-5
date: 2026-10-15T01:10:38Z
scope: final release audit of candidate v3.3.0 at main after the merge of PR #123 (N-18, N-21, N-22 and the five GitHub Actions bumps of Dependabot #117-#121), git diff v3.2.0..558642c, adversarial re-verification with REAL v3.2.0 / v3.1.3 assets and a v3.3.0 bundle built from the audited SHA
score: 91.50
isMergeGate: false
---

# Auditoria PLATFORM - ai-native @ 558642c (candidata v3.3.0, post-#123)

## STATUS

**PASS** con 91.50/100 (>= 90 sin tolerancia), 0 BLOCKER / 0 CRITICAL / 0 MAJOR, 14 MINOR abiertos, con una **reserva de independencia** (abajo) y una **reserva sobre un fallo intermitente de la suite local** (F-05, clasificado como limitacion de entorno).

N-12, N-14, N-16, N-17, N-18, N-19, N-20, N-21 y N-22 estan cerrados con evidencia reproducida en esta sesion. Un MINOR nuevo: N-23 (barras invertidas perdidas en un documento).

## INDEPENDENCE (declaracion obligatoria)

**Esta sesion implemento la PR #123** (N-18, N-21, N-22, bumps de acciones) y escribio el informe anterior (`d16adfe`). **No es una auditoria independiente en sentido estricto**, aunque el encargo la pidiera: comparte contexto con el implementador. Mitigaciones: (1) cada cierre se reprodujo con comandos ejecutados ahora y con artefactos que no son fixtures del implementador (assets publicados de v3.2.0 y v3.1.3, un consumidor creado por el bootstrap real de v3.1.3, el bundle v3.3.0 construido del SHA auditado, `cmd.exe` real); (2) se puntua con el metodo oficial y con un control negativo (el CLI de `d16adfe` falla en las mismas condiciones, ver N-18); (3) no se usa tolerancia. Una sesion distinta puede sustituir este informe: el gate acepta el de mayor score vigente. **La decision de aceptar este informe como cierre previo al tag es humana.**

## AUDITED_SHA

`558642c3f16a2671cc6863f5c2c3bf5376acf59a` (merge de la PR #123 sobre `main`; `git rev-parse HEAD` tras `git fetch --tags` y `git pull --ff-only`). `git status --short` = 0 lineas antes y despues. Presente `cdfdb93` y `ee3f0aa`. PR #117, #118, #119, #120 y #121: `CLOSED` (no mergeadas; sus cambios exactos estan en #123). Sin tag `v3.3.0` (`git tag -l`, `git ls-remote --tags origin 'v3.3*'`); sin release (`gh release list`: la ultima es `v3.2.0`).

## BASELINE

`v3.2.0` (`d9b590b`, inmutable). `git diff --stat v3.2.0..HEAD`: 40 ficheros, +2990/-178; `git diff --check v3.2.0..HEAD` limpio. Delta desde el SHA del informe anterior (`d16adfe`): 14 ficheros, +323/-23 (workflows 5, README, SESSION-CONTEXT, V3.3.0-RELEASE, V3.3.0-DEPENDENCIES, `runtime/bootstrap/detach.mjs`, `runtime/cli/ai-native.mjs`, 2 ficheros de test, el informe `d16adfe`).

## SCOPE

Diff completo `v3.2.0..558642c` con foco en init, upgrade, self-update, `--version`, uninstall, detach, contrato CLI<->PLATFORM (`runtime/bootstrap/compat.mjs`), protocolo de bootstrap, revocacion del CLI, anti-downgrade, atomicidad, release workflow/build/`verify-release`, contratos, filtros de CI y cadena de confianza. El codigo de producto de #123 es pequeno y se leyo entero (`detach.mjs` +41, `ai-native.mjs` +8/-5).

## METHOD

Metodo oficial `auditMethod 1.2` perfil PLATFORM (`audit/method/QUALITY_SCORE.md`: Q1..Q8, COMPLETO 100 / MENOR 75 / PARCIAL 50 %, NO VERIFICADO sin credito, Quality Gates G1..G3). Se parte de la matriz del informe `d16adfe` (91.00), se acredita solo lo reproducido cerrado, se mantiene lo heredado no re-verificado y se descuenta lo nuevo. Entorno: Windows 11 es-ES (OEM codepage 850), Node v26.11.1, git, `gh` 2.101.0, PowerShell 5. WSL2 sin Node (no se instalo nada): Linux solo via CI.

## EVIDENCE

| ID | Comando / sonda | Resultado |
|---|---|---|
| E-01 | `git fetch/pull`, `rev-parse`, `status`, `tag -l`, `ls-remote`, `gh release list`, `gh pr view 117..123` | SHA fijado; limpio; #117-121 CLOSED, #123 MERGED; sin v3.3.0 |
| E-02 | `scripts/test-hermetic.mjs` (suite completa, concurrencia 2, Windows) x2 sobre el SHA | corrida A: 1008/1009 (fallo: `L3 tracking (IGNORED_REQUIRED_FILE_TEST)`, `runtime/consumer/l3.test.mjs`); corrida B: 1008/1009 (fallo distinto: `F-20 sdd mark never follows a symlink`, `runtime/adapters/consumer-launcher.test.mjs`). Cada fichero fallido en aislamiento: `l3.test.mjs` 24/24 x3, `consumer-launcher.test.mjs` 10/10 x3. Clasificacion en TEST_RESULTS |
| E-03 | `runtime/audit/cli.mjs check`; `validate-actions-pinned`; `validate-ci-tests-listed`; `runtime/docs/validate-doc-drift`; `runtime/status/validate-integrity`; `core/validate-core` | todos PASS |
| E-04 | `build.mjs --version v3.3.0 --commit 558642c...` x2 | exit 0 ambas; sumas SHA-256 identicas (determinista); 6 ficheros; `ai-native-cli.mjs --version` = `CLI: v3.3.0` |
| E-05 | Clon temporal con `CLI_VERSION` editado y `build.mjs --version <tag>` (N-16) | ver tabla de hallazgos |
| E-06 | Sondas propias con assets REALES (v3.2.0 y v3.1.3 publicados) y el bundle v3.3.0 del SHA: S-A..S-G | 10/10 PASS |
| E-07 | Consumidor creado por el bootstrap REAL de v3.1.3 (`runtime/bootstrap/cli.mjs init`): sondas N21-a..e | a, c, d, e PASS; b = no-op seguro (verificado a mano) |
| E-08 | `self-update` adversarial SU-a..f con un CLI instalado | 6/6 PASS |
| E-09 | N-18: `node runtime/cli/ai-native.mjs install` con `AI_NATIVE_HOME` hostil + `cmd.exe` real (cp850) | ver N-18 |
| E-10 | `gh pr checks`, `gh run list --branch main`, `gh run view` del CI de main | CI de main en success; `runtime/cli tests` success en `validators (ubuntu-latest)` y `validators (windows-latest)`; CodeQL de #123 en pass tras corregir `js/file-system-race` |
| E-11 | `gh api` de los 4 repos de acciones: SHA del tag vs SHA fijado | los 4 coinciden (ver DEPENDABOT) |
| E-12 | `gh api .../code-scanning/alerts?state=open` | solo #27 (`l3-consumer.yml`, heredada F-10) |

## PREVIOUS_FINDINGS_RECHECK

| Hallazgo | Veredicto | Evidencia propia |
|---|---|---|
| **N-12** | **CERRADO** | `release.yml:318`: `case "$VERSION" in *-alpha.*\|*-rc.*)` corta la aceptacion `init --version` tras comprobar `CLI: $VERSION`; `verify-release.mjs` usa `!isPrerelease`. No se ejecuto el workflow en un tag real (NO VERIFICADO, Q6.4). |
| **N-14** | **CERRADO** | README: 2 bloques con `--clobber`; el test `validate-readme-install.test.mjs` lo exige (pasa en la suite). |
| **N-16** | **CERRADO** | Con `CLI_VERSION="v3.3.1-rc.1"`: `--version v3.3.1-rc.1` exit 0 y `CLI: v3.3.1-rc.1`; `-alpha.1` (v3.3.1-alpha.1) y `v3.3.0` con su declaracion exit 0. Rechazados con exit 1 y mensaje: tag distinto del declarado (`-alpha.1`, `v3.3.1`, `v3.3.1` con `v3.3.0`). Exit 2 (uso): `-beta.1`, `-rc.1+b`, `-RC.1`. |
| **N-17** | **CERRADO** | S-A: repo adoptado por v3.2.0 real, con v3.3.0 publicada: `detach` rc=0, 47 gestionados + journal + lock eliminados, `git status` limpio, solo se descarga el bundle v3.3.0. S-D: pin v3.2.0 revocado: `detach` rc=0, `init` sobre el pin sigue `REVOKED`. S-B: solo v3.2.0 publicada: rc=1 sin cambios. S-E: `DETACH_BLOCKED` con arbol identico (hash por fichero); `--keep-modified` deja solo ese fichero. S-F: `CLI_REVOKED`, sin cambios. |
| **N-18** | **CERRADO** | `.cmd` = `@echo off` + `node "%~dp0ai-native.mjs" %*`, **ASCII puro** (0 bytes > 127). Con codepage **OEM 850 por defecto** (sin `chcp 65001`) y `AI_NATIVE_HOME` = `José Muñoz`, `Muñoz`, `’curly ‘q`, `日本`, `O'Brien 100%`, `a&b (x) ^!`, `plain dir`: el `.cmd` real devuelve `CLI: v3.3.0` tanto invocado directamente desde PowerShell como por PATH desde `cmd.exe`. **Control negativo**: el CLI de `d16adfe` bajo las mismas condiciones (`José`, cp850) falla con `Cannot find module`. Salvedad no imputable al shim: una ruta que contiene `%NOMBRE%` (`per%cent%PATH%`) invocada por ruta directa desde un llamador la expande `cmd.exe` en la linea del llamador; por PATH funciona. Shim `sh` y linea de PATH POSIX probados con `'`, `$`, backtick, espacios, `"` (sin cambios, PASS). |
| **N-19** | **CERRADO** | `SESSION-CONTEXT.md`: `STABLE_BASELINE: v3.2.0`, `STATUS: V3_3_0_CANDIDATE_CLOSING_PENDING_FINAL_AUDIT`, sin tag ni release; `V3.2.0-RELEASE.md` PUBLICADA; todo contrastado con `gh`/`git`. Nota: dice que las correcciones "van en PR(s) de cierre" aunque #123 ya esta fusionada; es inevitable (un documento no cita su propio merge) y se actualiza en la sesion de release. |
| **N-20** | **CERRADO** | README: `DETACH_BLOCKED`, `DOWNGRADE_REFUSED`, `CLI_REVOKED` documentados; test N-20 escanea el codigo (>= 26 codigos) y pasa. |
| **N-21** | **CERRADO** | Consumidor REAL creado por el bootstrap de v3.1.3 (unico fichero: `ai-native.lock.json`) mas ficheros del usuario (`src/app.py`, `AGENTS.md`). N21-a: `detach` rc=0, **solo se elimina el lock** (queda staged), `AGENTS.md` y `src/app.py` intactos, aviso `legacy repository: it has no adoption journal, so only ai-native.lock.json ... was removed`; **no exigio `upgrade`**. N21-b: repetir es no-op seguro (`NOT_ADOPTED`). N21-c: pin revocado, sigue funcionando. **Fail-closed**: N21-d con `.ai-native/` sin journal -> rc=1 `ADOPTION_INCONSISTENT ... .ai-native/ exists ... Nothing was removed ... ai-native upgrade`, arbol y lock identicos; un lock que no es JSON, es `[]` o carece de `platform` -> rc=1 sin cambios (tests de la suite). N21-e: `upgrade` crea el journal y luego `detach` normal funciona. Proyecciones desconocidas presentes (p. ej. `CLAUDE.md`): se listan y se dejan. |
| **N-22** | **CERRADO** | `grep -rniE "todos corregidos\|all fixed"` en `governance/` y README: sin afirmaciones de cierre total; `V3.3.0-RELEASE.md` declara N-18 como corregido por #123 y que el informe de `d16adfe` no certifica el SHA final. Ver N-23 por un defecto tipografico en ese mismo texto. |
| N-13, N-15 | CERRADOS (sin cambio desde `d16adfe`) | `runtime/cli tests` en CI de main en ubuntu y windows. |
| F-02, F-04, F-06, F-10 | ABIERTOS (sin cambios) | `required_approving_review_count: 0`; `release.yml` sin `environment:`; `governance/cleanup/M7-*.md` con `_m6/`; alerta #27 abierta. |
| F-03, F-05, F-08, F-11, F-22, F-23, N-08, N-11, P-06r | MANTENIDOS. F-05 **reproducido de nuevo** en esta auditoria (E-02). |

## NEW_FINDINGS

Ningun BLOCKER / CRITICAL / MAJOR. Un MINOR nuevo:

- **N-23 - barras invertidas perdidas en `V3.3.0-RELEASE.md`.** La seccion "Cierre tras la auditoria de `d16adfe`" dice `C:UsersJosé` donde debe decir `C:\Users\José` (`grep -cF 'C:UsersJosé'` = 1; `grep -cF 'C:\Users\José'` = 0). Es un defecto de redaccion en el documento de release (Q1.3, 0.25); no afecta al comportamiento.

Informativos (sin descuento): (I-1) `detach` (ruta con y sin journal) borra `ai-native.lock.json` aunque tenga cambios sin commitear; el contenido sigue en Git si estuvo commiteado. (I-2) `self-update` conserva un solo `.prev` y su staging tiene nombre fijo. (I-3) `ai-native version --<opcion desconocida>` se ignora. (I-4) el `paths` del dry-run de `release.yml` no cubre `core/**`, `profiles/**`, `mcp/**`. (I-5) invocar el `.cmd` por su ruta cuando esa ruta contiene `%X%` es expansion de `cmd.exe` del llamador.

## SECURITY

Sin hallazgos nuevos. (a) El nuevo camino de `detach` legacy solo borra `ai-native.lock.json` (ruta fija), lee el lock una sola vez (sin patron comprobar-y-usar: CodeQL `js/file-system-race` detectado en #123 se corrigio y esta en pass), valida que sea un lock de ai-native y falla cerrado ante `.ai-native/` sin journal, lock ilegible o migracion v2 (`MIGRATED_FROM_V2` se evalua antes). (b) `detach` sigue ejecutando solo el motor de la release verificada y no revocada mas reciente; `CLI_REVOKED` aborta antes de cualquier motor (S-F). (c) `self-update`: digest alterado -> `DIGEST_MISMATCH`, attestation fallida -> `ATTESTATION_FAILED`, sin downgrade, nunca elige prereleases (SU-a..f), CLI intacto. (d) El `.cmd` sin ruta incrustada elimina toda una clase de inyeccion/corrupcion por nombre de directorio en Windows. (e) Workflows fijados por SHA completo (validador PASS). Heredados: F-02, F-03, F-04, F-10, P-06r.

## COMPATIBILITY

- **CLI v3.2.0 REAL (asset publicado) contra la PLATFORM v3.3.0 construida de este SHA**: S-G, `init` rc=0, `STATUS: READY`, `DRIFT: CLEAN`, `ATTESTATION: PASS`, `REVOCATION: CHECKED`, 47 ficheros. `bootstrap.minCliVersion` = `v3.2.0`.
- **CLI v3.3.0 + PLATFORM v3.2.0 REAL**: adopcion y `upgrade` v3.2.0 -> v3.3.0 READY (E-06).
- **Consumidores legacy (bootstrap v3.1.3 real)**: `detach` (N21) y `upgrade` -> `detach` OK.
- Multi-repo / multi-machine / offline: cubiertos por la suite (`MULTI-REPO`, `MULTI-MACHINE`, `DETACH offline`) que pasa en aislamiento y en CI.
- Prereleases: el CLI declara `-rc.N`/`-alpha.N`, se ordena por SemVer, y el comando publico solo instala estables.
- Windows: PASS (local + CI). Linux: PASS solo en CI `ubuntu-latest`; no se ejecuto localmente.

## DEPENDABOT_CHANGES

Los cinco bumps de #117-#121 estan incorporados en #123 con el diff exacto; las cinco PR estan cerradas. Verificado con `gh api repos/<repo>/commits/<tag>`:

| Accion | Tag | SHA fijado | Coincide |
|---|---|---|---|
| `actions/download-artifact` | v8.0.2 | `9000827ccba6bdab643e8b6fd33ac0654aef8333` | si |
| `github/codeql-action/{init,analyze}` | v4.38.3 | `24c54180a607b1449ed407dd24f251e4e9147c8d` | si |
| `actions/setup-node` | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` | si |
| `actions/upload-artifact` | v7.0.2 | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` | si |

`validate-actions-pinned`: PASS. Ningun SHA antiguo queda en `.github/`. Regresiones: ninguna (CI de main en success con los workflows ya actualizados, incluidos CodeQL y `build`).

## RELEASE_SAFETY

Build local determinista (dos construcciones, sumas identicas) y consistente con el tag (`assertCliDeclaresTag`). El bundle declara `bootstrap` y lleva `cli-revocations-1.json`. `release.yml`: tags `vX.Y.Z[-alpha.N|-rc.N]`, acciones fijadas, `build -> publish -> verify`; el dry-run de PR corrio en #123 (`build`: pass). **No verificable antes de publicar**: `publish`/`verify` reales con `cli-revocations-N.json` y `ai-native-cli.mjs` v3.3.0, `self-update` contra una release real y `verify-release.mjs v3.3.0 --expect-commit 558642c3f16a2671cc6863f5c2c3bf5376acf59a` (0.25 en Q6.4). No se creo tag ni release.

## TEST_RESULTS

| Prueba | Resultado |
|---|---|
| Suite hermetica completa, corrida A | 1008/1009 (fallo intermitente: `l3.test.mjs`) |
| Suite hermetica completa, corrida B | 1008/1009 (fallo intermitente distinto: `consumer-launcher.test.mjs`) |
| Cada fichero fallido, aislado | `l3.test.mjs` 24/24 x3; `consumer-launcher.test.mjs` 10/10 x3 |
| `runtime/cli/*.test.mjs` (63 tests: lifecycle, self-update, detach, shims, compat) | PASS (dentro de la suite; ademas en CI ubuntu y windows) |
| Validadores y `audit check` | PASS |
| Sondas propias con assets reales (S-A..S-G, N21-a..e, SU-a..f) | PASS (el unico "FAIL" de mi arnes, N21-b, era una regex de la sonda; verificado a mano) |
| Build x2 | PASS, determinista |
| Linux real | NOT_RUN localmente; CI `ubuntu-latest` en success sobre este SHA |

**Clasificacion de los dos fallos de la suite local: limitacion de entorno (F-05), no defecto de producto.** Razones: (1) fallan tests distintos en cada corrida completa, ninguno reproduce aislado (10/10 y 24/24, tres veces cada uno); (2) son los ficheros que los informes `7e74618` y `6260751` ya asociaban a F-05 (fallos de git al escribir en repos temporales recien creados en Windows: antivirus/indexador, concurrencia); (3) la suite completa pasa 1009/1009 en la misma maquina con el mismo codigo de producto (`ee3f0aa`, antes del merge) y en el CI completo (ubuntu + windows) sobre este SHA; (4) el log del runner no conserva el mensaje del fallo, asi que **no pude demostrar la causa exacta**; la atribucion a F-05 es por patron y por descarte. Si el humano prefiere tratar un fallo no reproducible de la suite principal como Gate G3 (limite 89), el resultado cambiaria a 89 y el gate a FAIL; no lo aplico porque el fallo no es reproducible ni afecta al CI, pero lo declaro.

## SCORE

| Area | Max | Obtenido | Perdida |
|---|--:|--:|--:|
| Q1 Contrato | 12 | 11.75 | N-23 0.25 |
| Q2 Reutilizacion | 12 | 11.25 | F-06 0.75 |
| Q3 Arquitectura | 12 | 12.00 | 0 |
| Q4 Documentacion | 12 | 11.25 | N-11 0.25 + F-08 0.5 |
| Q5 Calidad | 16 | 14.25 | F-11 0.75 + F-05 1.00 (reproducido en esta auditoria) |
| Q6 Release | 16 | 14.00 | F-02 0.75 + NO VERIFICADO publish/verify 0.25 + F-22 0.5 + N-08 0.5 |
| Q7 Seguridad | 12 | 9.50 | F-03 0.75 + F-10 0.5 + F-04/F-23 1.0 + P-06r 0.25 |
| Q8 Gobernanza | 8 | 7.50 | F-02 (causa compartida) 0.5 |
| **Total** | **100** | **91.50** | **8.50** |

Aritmetica: 11.75 + 11.25 + 12.00 + 11.25 + 14.25 + 14.00 + 9.50 + 7.50 = 91.50; perdidas 0.25 + 0.75 + 0 + 0.75 + 1.75 + 2.00 + 2.50 + 0.50 = 8.50. Partida: informe `d16adfe` = 91.00 (perdida 9.00). Se acreditan N-18 0.25 (Q4), N-21 0.25 (Q6) y N-22 0.25 (Q1) = 0.75; se descuenta N-23 0.25 (Q1). 9.00 - 0.75 + 0.25 = 8.50. F-05 ya estaba descontado entero en Q5.3 (1.00 de 4); su nueva reproduccion no suma perdida porque el criterio ya esta en su nivel. Sin N/A. Sin tolerancia. Quality Gate aplicado: **ninguno** (G1/G2 no; G3 no, con la reserva declarada en TEST_RESULTS). Score bruto = final = **91.50**. Confianza: **MEDIA** (auditor no independiente; suite local con fallos intermitentes; publish/verify y Linux local sin ejecutar).

## BLOCKERS

0.

## CRITICALS

0.

## MAJORS

0.

## MINORS

14 abiertos: 13 heredados (F-02, F-03, F-04, F-05, F-06, F-08, F-10, F-11, F-22, F-23, N-08, N-11, P-06r) y 1 nuevo (N-23). Cerrados en este ciclo: N-12, N-14, N-16, N-17, N-18, N-19, N-20, N-21, N-22 (y N-13, N-15 antes). Informativos: 5.

## RECOMMENDATION

`558642c` cumple el criterio del release-gate **sin tolerancia** (91.50 >= 90; 0/0/0) y puede pasar a la sesion de release **si el humano acepta dos reservas**: (1) este informe no es de una sesion independiente; (2) la suite local tuvo un fallo intermitente por corrida, atribuido a F-05. Si cualquiera de las dos no es aceptable, hace falta una auditoria de otra sesion o una corrida limpia de la suite completa.

Antes o durante la publicacion, por orden de valor:
1. N-23: restaurar las barras en `V3.3.0-RELEASE.md` (solo documentacion; un cambio fuera de `.audit/**` invalida este informe para el SHA nuevo, asi que conviene hacerlo con el resto de la actualizacion de estado de la sesion de release o aceptar el MINOR).
2. Tras el tag (no antes): `release.yml` en success, `node scripts/verify-release.mjs v3.3.0 --expect-commit 558642c3f16a2671cc6863f5c2c3bf5376acf59a` y `self-update` contra la release real; cierra el NO VERIFICADO de Q6.4.
3. F-05 merece su propio ticket: capturar el stderr de git en los tests que fallan para no tener que atribuir por patron.

El informe solo es evidencia vigente para `558642c` o un descendiente cuya diferencia neta sea unicamente `.audit/**` y `STATUS.md`.

## RELEASE GATE

`node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 558642c3f16a2671cc6863f5c2c3bf5376acf59a` -> **PASS_WITH_WARNINGS** (exit 0, 17 warnings, 0 errors). Los 17 avisos son informes anteriores marcados `STALE` para este SHA; ninguno es de score ni de tolerancia. Con `--tolerance 0` el resultado es identico: el pase no depende de la tolerancia (91.50 >= 90). `node runtime/audit/cli.mjs check` -> PASS. No se creo tag ni release.
