---
targetRepo: jlbellonGmail/ai-native
targetCommit: d16adfe694f48d7bd05cfca9048100e2373e2951
platform:
  version: v3.0.0-dev
  commit: d16adfe694f48d7bd05cfca9048100e2373e2951
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (audit role; fresh session, NO implementation context; independent final audit of the post-#116 candidate)
  model: claude-sonnet-5-5
date: 2026-10-14T21:29:00Z
scope: final independent release audit of candidate v3.3.0 at main after the merge of PR #116 (global CLI lifecycle + fixes for N-12..N-20), git diff v3.2.0..d16adfe, adversarial re-verification with REAL v3.2.0/v3.1.3 assets and a v3.3.0 bundle built from the audited SHA
score: 91.00
isMergeGate: false
---

# Auditoria PLATFORM - ai-native @ d16adfe (candidata v3.3.0, post-#116) - AUDITORIA FINAL INDEPENDIENTE

## STATUS

**PASS** con 91.00/100 (>= 90 sin usar tolerancia), 0 BLOCKER / 0 CRITICAL / 0 MAJOR, 16 MINOR abiertos. N-12, N-14, N-16, N-17, N-19 y N-20 estan cerrados con evidencia propia. **N-18 queda cerrado solo en parte**: apostrofe, `%`, `$`, backtick y espacios funcionan, pero el shim `.cmd` falla con rutas no ASCII (reproducido, ver N-18). Es MINOR y no bloquea, pero conviene corregirlo antes de publicar (ver RECOMMENDATION).

Esta sesion es la **auditoria final independiente de la candidata post-#116**. No implemento v3.3.0, no escribio ninguna de las correcciones de #116, no comparte contexto con el implementador y no reutiliza sus conclusiones como verdad: cada cierre de abajo se apoya en un comando ejecutado en esta sesion. No se modifico ningun fichero fuera de `.audit/reports/`. No se creo tag, release ni merge.

## AUDITED_SHA

`d16adfe694f48d7bd05cfca9048100e2373e2951` (merge de la PR #116 sobre `main`). Obtenido con `git fetch origin --tags --prune`, `git pull --ff-only` y `git rev-parse HEAD`. `git status --short` = 0 lineas antes y despues de las pruebas. `VERSION` = `3.0.0-dev`. Presente: `b782ff3` y `a9ed9c7` (el contenido de #116). Sin tag `v3.3.0` (`git tag -l`, `git ls-remote --tags origin 'v3.3*'`) y sin release `v3.3.0` (`gh release list`: la ultima es `v3.2.0`, Latest).

## BASELINE

`v3.2.0` (`d9b590b`, release inmutable publicada el 2026-10-13T20:51:59Z). `git diff --stat v3.2.0..HEAD`: 35 ficheros, +2680/-168. Delta de #116 sobre el SHA auditado antes (`6260751`): 21 ficheros, +701/-60 (todos dentro del alcance declarado: `runtime/cli`, `runtime/bootstrap`, `runtime/release`, `scripts`, `.github/workflows`, README, governance/versioning, SESSION-CONTEXT y el informe anterior). `git diff --check v3.2.0..HEAD`: limpio.

## SCOPE

Diff completo `v3.2.0..d16adfe`, con foco en: `runtime/cli/ai-native.mjs` (init, upgrade, detach, self-update, install, uninstall, `--version`), `runtime/bootstrap/{compat,semver,detach,upgrade,adopt,cli}.mjs`, `runtime/release/{build,cli-version,bundle,revocations}.mjs`, `scripts/verify-release.mjs`, `.github/workflows/{ci,release}.yml`, `contracts/` (bootstrap-protocol, platform, revocations), `evaluation/fixtures/cli/` (CLI v3.2.0 byte a byte), README, `governance/SESSION-CONTEXT.md`, `governance/versioning/*`.

## METHOD

Metodo oficial `auditMethod 1.2`, perfil PLATFORM (`audit/method/QUALITY_SCORE.md`: Q1..Q8, niveles COMPLETO 100 / MENOR 75 / PARCIAL 50 / DEBIL 25 / AUSENTE 0 %, NO VERIFICADO sin credito, Quality Gates G1..G3). Puntuacion: partida de la matriz del informe anterior de `6260751` (88.25, auditor no independiente), **recalculando cada perdida** con evidencia de hoy: se acredita solo lo que reproduje cerrado; lo heredado que no pude re-verificar se mantiene; lo nuevo descuenta. No se aplica tolerancia para llegar a 90.

Herramientas: Windows 11 (es-ES, codepage OEM 850), Node v26.11.1, git, `gh` 2.101.0, PowerShell 5. WSL2 presente pero **sin Node** (no se instalaron dependencias): Linux se cubre solo con el CI verde en `ubuntu-latest` (ver LIMITACIONES).

## EVIDENCE

| ID | Comando / sonda | Resultado |
|---|---|---|
| E-01 | `git fetch/pull`, `rev-parse HEAD`, `status`, `tag -l`, `ls-remote --tags`, `gh release list` | SHA fijado; arbol limpio; sin `v3.3.0` |
| E-02 | `node scripts/test-hermetic.mjs --log ...` (suite completa, concurrencia 2, Windows) | **1006/1006 pass, 0 fail, 97 ficheros, 707 s** |
| E-03 | `node runtime/audit/cli.mjs check`; `scripts/validate-ci-tests-listed.mjs`; `scripts/validate-actions-pinned.mjs`; `runtime/docs/validate-doc-drift.mjs`; `runtime/status/validate-integrity.mjs`; `core/validate-core.mjs` | todos PASS (97 tests listados en workflows; acciones fijadas por SHA) |
| E-04 | `node runtime/release/build.mjs --version v3.3.0 --out <dir> --commit d16adfe...` dos veces | exit 0 ambas; 6 ficheros (`ai-native-v3.3.0.tar.gz`, `ai-native-cli.mjs`, `platform.json`, `revocations-1.json`, `cli-revocations-1.json`, `SHA256SUMS`); **sumas SHA-256 identicas entre las dos construcciones** (determinista); `ai-native-cli.mjs --version` = `CLI: v3.3.0`; `platform.json` `bootstrap` = `{protocol:1, minCliVersion:"v3.2.0", requiredCapabilities:["adopt"]}` |
| E-05 | Clon temporal con `CLI_VERSION` editado, `build.mjs --version <tag>` (N-16, ver abajo) | 13 combinaciones, todas con el resultado esperado |
| E-06 | `probe.mjs` (mia, en el scratchpad de la sesion): assets REALES (`gh release download v3.2.0`, v3.1.3) + bundle v3.3.0 construido del SHA; red y `gh attestation` simulados | 10/10 PASS (detalle en COMPATIBILITY) |
| E-07 | `probe4.mjs`: 6 sondas adversariales de `self-update` con un CLI instalado real | 6/6 PASS |
| E-08 | Instalacion real en Windows con `AI_NATIVE_HOME` hostil (PowerShell, `cmd.exe`) | ver N-18 |
| E-09 | Shim `sh` y linea de PATH POSIX con apostrofe, `$`, backtick, espacios, `"` (Git Bash `sh`) | PASS: `sh shim --version` = `CLI: v3.3.0`; la linea de PATH deja una entrada identica a `bin` |
| E-10 | `gh pr checks 116`; `gh run view 38510739220`; `gh run list --branch main` | todos los checks de #116 en pass; el paso `runtime/cli tests` corrio y paso en `validators (ubuntu-latest)` y `validators (windows-latest)`; `main` en success |
| E-11 | `gh api repos/.../rulesets`, `.../code-scanning/alerts?state=open`, `.../environments` | `required_approving_review_count: 0`; alerta #27 abierta (`l3-consumer.yml`); entornos `ai-native-human-review` y `ai-native-trust` existen; `release.yml` sin `environment:` |

## PREVIOUS_FINDINGS_RECHECK

| Hallazgo | Veredicto | Evidencia propia |
|---|---|---|
| **N-12** (aceptacion de `release.yml` no admite alpha/rc) | **CERRADO** | `release.yml` ahora corta la aceptacion `init --version` para `*-alpha.*\|*-rc.*` despues de verificar `CLI: $VERSION`; `verify-release.mjs` hace lo mismo (`!isPrerelease`). La razon es de diseno (el comando publico solo instala estables, README). **No se pudo ejecutar el workflow en un tag real** (NO VERIFICADO, 0.25 en Q6.4). |
| **N-14** (instalacion repetible) | **CERRADO** | Los bloques bash y PowerShell del README llevan `gh release download ... --clobber`; el test `scripts/validate-readme-install.test.mjs` lo exige y pasa en E-02. |
| **N-16** (SemVer release/build) | **CERRADO** | E-05: con `CLI_VERSION="v3.3.1-rc.1"`: `--version v3.3.1-rc.1` exit 0 y `CLI: v3.3.1-rc.1`; con `v3.3.1-alpha.1` y `v3.4.0-rc.2` igual. Rechazados: tag distinto del declarado (`-alpha.1` vs `-rc.1`, `v3.3.1` vs `-rc.1`, `-rc.1` vs `-rc.2`) exit 1 con mensaje claro; `v3.3.1-beta.1`, `v3.3.1-rc.1+build`, `v3.3.1-rc.`, `v3.3.1-RC.1` exit 2 (uso). El filtro de tags de `release.yml` es `vX.Y.Z`, `-alpha.N`, `-rc.N`: build, workflow y CLI aceptan exactamente el mismo conjunto. `self-update` ordena `rc.1 < estable` (SU-f). |
| **N-17** (detach) | **CERRADO para repos con journal; residual en N-21** | Con bundles REALES. S-A: repo adoptado por v3.2.0 real (49 ficheros, lock v3.2.0), con v3.3.0 publicada: `detach` rc=0, 47 gestionados + journal + lock eliminados, `git status` vacio, y solo se descargo el bundle v3.3.0 (nunca el pin). S-D: pin v3.2.0 **revocado** por `revocations-2.json`: `detach` rc=0; `init` sobre ese pin sigue bloqueado con `REVOKED` (la revocacion sigue vigente donde debe). S-B: solo v3.2.0 publicada: rc=1 `fail-closed`, nada cambia. S-E: un fichero gestionado editado: `DETACH_BLOCKED`, arbol identico (hash por fichero); con `--keep-modified` queda exactamente ese fichero. S-F: CLI revocado: `CLI_REVOKED`, rc=1, nada cambia. |
| **N-18** (Windows/Linux robustez) | **PARCIAL: abierto como MINOR (0.25)** | Reproducido en esta maquina (ver NEW_FINDINGS/N-18). Funcionan: `O'Brien 100%`, `a&b (x) ^! ;,=`, `50%`, `per%cent%PATH%` (invocado por PATH desde `cmd.exe`), `plain`. La linea de PATH de PowerShell parsea sin errores (AST, no se ejecuto: tocaria el PATH de usuario real) y su literal es identico a `bin` en todos los casos. **Falla con rutas no ASCII** (`José`, `Muñoz`, `’`): `ai-native.cmd` -> `Cannot find module '...Jos├®\bin\ai-native.mjs'`. |
| **N-19** (estado de gobernanza) | **CERRADO (con nota informativa)** | `SESSION-CONTEXT.md`: `STABLE_BASELINE: v3.2.0`, `PREVIOUS_BASELINE: v3.1.3`, `STATUS: V3_3_0_CANDIDATE_IN_AUDIT_FIXES`, "sin tag ni release"; `V3.2.0-RELEASE.md` ya dice PUBLICADA (2026-10-13T20:51:59Z). Contrastado con `gh release list` y `git tag`: coincide. Nota: sigue diciendo "las correcciones van en una PR posterior" cuando ya estan fusionadas (#116); es inevitable (un documento no cita su propio merge) y se actualiza en la sesion de release. |
| **N-20** (codigos en README) | **CERRADO** | `README.md` seccion "When something stops": `DETACH_BLOCKED`, `DOWNGRADE_REFUSED`, `CLI_REVOKED` (y 20 mas); el test N-20 escanea `ai-native.mjs`, `adopt/upgrade/detach/compat.mjs` y exige >= 26 codigos documentados; pasa en E-02. |
| N-13 (filtro de CI de `runtime/cli`) | CERRADO | E-10: el paso corre en ubuntu y windows en cada PR (`ci.yml` sin `paths`); `release.yml` ahora dispara con `runtime/cli/**`, `contracts/**`, `scripts/verify-release*.mjs`, `evaluation/fixtures/cli/**`. |
| N-15 | CERRADO | Misma correccion de SESSION-CONTEXT que N-19. |
| F-02, F-04, F-06, F-10 | ABIERTOS (re-verificados hoy) | E-11 (revisiones requeridas = 0; sin `environment:` en `release.yml`; alerta #27 abierta); `_m6/` sigue en `governance/cleanup/M7-*.md`. |
| F-03, F-05, F-08, F-11, F-22, F-23, N-08, N-11, P-06r | MANTENIDOS sin re-verificar (no cambiaron en el diff); F-05: la suite completa paso a concurrencia 2 (E-02), no se repitio a concurrencia por defecto. |

## NEW_FINDINGS

Ninguno BLOCKER / CRITICAL / MAJOR. Tres MINOR vivos de este ciclo:

- **N-18 (residual) - el shim `.cmd` rompe con rutas no ASCII.** `install`/`self-update` escriben `ai-native.cmd` en UTF-8, pero `cmd.exe` lo lee con la codepage OEM (850 en esta maquina): el nombre de directorio se desfigura y `node` no encuentra el modulo. Reproducido con `AI_NATIVE_HOME=...\José` y `...\Muñoz`: `Error: Cannot find module '...\Jos├®\bin\ai-native.mjs'`; con `chcp 65001` el mismo shim funciona (`CLI: v3.3.0`), lo que prueba la causa. La ruta por defecto es `%USERPROFILE%\.ai-native`, de modo que **cualquier usuario de Windows con acentos en su carpeta de perfil** (habitual fuera del mundo anglosajon) tendria el comando global roto tras `install`. Sin perdida de datos, falla cerrado (no ejecuta nada incorrecto) y hay rodeo (`node <ruta>\ai-native.mjs`, o un `AI_NATIVE_HOME` ASCII). Lo clasifico MINOR por coherencia con la precedencia del repo (N-18 original, misma clase, MINOR) y porque no afecta a repositorios ni a la cadena de confianza; es el MINOR de mayor impacto de esta lista. Arreglo sugerido: no incrustar la ruta (`node "%~dp0ai-native.mjs" %*` y `"$(dirname "$0")"` en el `sh`). Q4, 0.25.
- **N-21 - `detach` en un repo con lock pero sin journal falla con `ADOPTION_INCONSISTENT` y el README/remedio no lo cubren.** Un repositorio fijado por el bootstrap v3.1.x tiene `ai-native.lock.json` y no tiene `.ai-native/adoption-journal.json` (el journal nace con el CLI v3.2.0; el bundle v3.1.3 no contiene `runtime/bootstrap/adopt.mjs`). Son los consumidores reales (el contexto de gobernanza habla de 9 en v3.1.2). Simulado quitando el journal a un repo adoptado (S-C): `detach` rc=1, `ADOPTION_INCONSISTENT`, nada cambia (fail-closed correcto). Pero el README dice que un repo "pinned to an old ... release can still be detached" y da como remedio "Restore the missing file from Git history", que aqui es falso: el camino real es `ai-native upgrade` (adopta sin sobreescribir, S-C2: `upgrade` rc=0 y luego `detach` rc=0, que deja los 47 ficheros preexistentes como propios del usuario). El test de N-17 usa repos con journal re-pineados, no un repo solo-lock. No es perdida de datos. Q6.6, 0.25.
- **N-22 - los documentos de release afirman mas de lo verificado.** `V3.3.0-RELEASE.md` declara "todos corregidos" (N-16..N-20) y describe N-18 como "probado con ... caracteres especiales"; con N-18 abierto (no ASCII) y N-21 sin documentar, la afirmacion sobra. Q1.3, 0.25.

Informativos (sin descuento): (I-1) `self-update` conserva un solo `.prev` y su staging tiene nombre fijo (heredado). (I-2) `ai-native version --<opcion desconocida>` se ignora en silencio. (I-3) `--offline` no comprueba revocaciones; `detach --offline` lo avisa con `WARNING`. (I-4) el filtro `paths` del dry-run de `release.yml` no cubre `core/**`, `profiles/**`, `mcp/**` (se empaquetan en el bundle); el job `build` solo corre en PR si cambia otro de los paths listados. Preexistente y no regresion de #116.

## SECURITY

Sin hallazgos nuevos de seguridad. Verificado: (a) `detach` ya no lee el lock ni confia en el repo del lock (S-C/`repo: github:evil/...` cubierto por el test y el motor siempre sale del repo oficial; `--trust-repo` fue retirado de `detach`); el motor viene del release estable mas reciente que **no** este revocado y con attestation verificada; offline usa solo la cache verificada y avisa. (b) `self-update` falla cerrado y deja el CLI intacto con digest alterado (`DIGEST_MISMATCH`), attestation fallida (`ATTESTATION_FAILED`), y nunca baja de version ni elige prereleases (SU-a..f). (c) CLI revocado: `CLI_REVOKED` antes de ejecutar ningun motor (S-F). (d) Citado de shells: POSIX (`shq`) y PowerShell (`psq`) probados con hostiles; `cmd` con `%%`. (e) Workflows fijados por SHA (validador PASS). Heredados abiertos: F-02, F-04, F-10, F-03, P-06r.

## COMPATIBILITY

- **CLI v3.2.0 REAL (asset publicado) contra la PLATFORM v3.3.0 construida del SHA**: S-G, `init` rc=0, `STATUS: READY`, `DRIFT: CLEAN`, `ATTESTATION: PASS`, `REVOCATION: CHECKED`, 47 ficheros proyectados. `bootstrap.minCliVersion` = `v3.2.0`.
- **CLI v3.3.0 + PLATFORM v3.2.0 REAL**: `init` y adopcion (E-06, S-A..S-E) READY; `upgrade` v3.2.0 -> v3.3.0 sobre un repo sin journal: rc=0 (S-C2), journal recreado.
- `detach` con repos pinneados a v3.2.0 (S-A, S-D) y v3.3.0 (S-E, S-F): OK sin exigir `upgrade`. Pin v3.1.x solo-lock: N-21.
- Prerelease CLI: `declaredCliVersion`, `negotiate`/`cmpAny` aceptan `-rc.N`/`-alpha.N` y ordenan por SemVer; `self-update` desde `rc.1` a estable funciona.
- Windows: PASS salvo N-18 (no ASCII). Linux: shims y linea de PATH PASS en `sh` (Git Bash); suite y CLI en Linux real solo via CI.

## RELEASE_SAFETY

Build local determinista (dos construcciones, sumas identicas) y consistente con el tag: `assertCliDeclaresTag` rechaza cualquier desajuste `CLI_VERSION` vs tag (stable, `-alpha.N`, `-rc.N`) y rechaza formas no validas. El bundle declara el contrato `bootstrap` y lleva `cli-revocations-1.json`. `release.yml`: tags `vX.Y.Z[-alpha.N|-rc.N]`, acciones fijadas, `build -> publish -> verify`; el dry-run en PR corrio en #116 (`build (gates, reproducible bundle, SBOM)`: pass). **No se pudo verificar antes de publicar**: el `publish`/`verify` reales con la serie `cli-revocations-N.json` y el asset `ai-native-cli.mjs` v3.3.0, `self-update` contra una release real, y `verify-release.mjs v3.3.0 --expect-commit <sha>` (se ejecutan tras el tag; ver RECOMMENDATION). No se creo tag ni release.

## TEST_RESULTS

| Prueba | Resultado |
|---|---|
| Suite hermetica completa (`scripts/test-hermetic.mjs`) | PASS 1006/1006, 97 ficheros, 707 s |
| Validadores (audit check, ci-tests-listed, actions-pinned, doc-drift, integrity, core) | PASS |
| Tests lifecycle/CLI/bootstrap/detach/self-update/contracts/release/scripts | PASS (incluidos en la suite completa) |
| Compatibilidad CLI v3.2.0 real | PASS (S-G) |
| Sondas propias con bundles reales (S-A..S-G) | 10/10 PASS (S-C2 mi aserción sobre `left=0` era erronea: el modo adopcion conserva los preexistentes por diseno; el comportamiento es correcto) |
| `self-update` adversarial (SU-a..f) | 6/6 PASS |
| Build release local x2 | PASS, determinista |
| `release-gate` PLATFORM | ver seccion RELEASE GATE |
| Linux real | NOT_RUN localmente (WSL sin Node; no se instalaron dependencias): CI `ubuntu-latest` en success |

Fallos encontrados: ningun defecto de producto en pruebas automatizadas. Dos fallos de MIS sondas fueron errores de mi propio arnes (uso de `tar` con `C:`, aserción de ficheros restantes) y de invocar `cmd /c` con `%` en la ruta del propio `.cmd`; los corregi y no son defectos del producto. No hubo fallos transitorios de infraestructura.

## SCORE

| Area | Max | Obtenido | Perdida |
|---|--:|--:|--:|
| Q1 Contrato | 12 | 11.75 | N-22 0.25 |
| Q2 Reutilizacion | 12 | 11.25 | F-06 0.75 |
| Q3 Arquitectura | 12 | 12.00 | 0 |
| Q4 Documentacion | 12 | 11.00 | N-11 0.25 + N-18 0.25 + F-08 0.5 |
| Q5 Calidad | 16 | 14.25 | F-11 0.75 + F-05 1.00 |
| Q6 Release | 16 | 13.75 | F-02 0.75 + (NO VERIFICADO publish/verify 0.25) + F-22 0.5 + N-08 0.5 + N-21 0.25 |
| Q7 Seguridad | 12 | 9.50 | F-03 0.75 + F-10 0.5 + F-04/F-23 1.0 + P-06r 0.25 |
| Q8 Gobernanza | 8 | 7.50 | F-02 (causa compartida) 0.5 |
| **Total** | **100** | **91.00** | **9.00** |

Aritmetica: 11.75 + 11.25 + 12.00 + 11.00 + 14.25 + 13.75 + 9.50 + 7.50 = 91.00; perdidas 0.25 + 0.75 + 0 + 1.00 + 1.75 + 2.25 + 2.50 + 0.50 = 9.00. Respecto al informe de `6260751` (perdida 11.75): se acreditan N-12 0.50, N-13 0.75 (Q1.3 0.25 + Q5.5 0.50), N-14 0.25, N-15 0.25, N-16 0.50, N-17 0.50, N-19 0.25 y N-20 0.25 = 3.25; se mantienen N-18 0.25 (no se acredita: no ASCII), el NO VERIFICADO de publish/verify 0.25 y los heredados abiertos; se descuentan los nuevos N-21 0.25 y N-22 0.25 = 0.50. 11.75 - 3.25 + 0.50 = 9.00. Sin N/A. Quality Gate aplicado: **ninguno** (0 BLOCKER, 0 CRITICAL, G3 no se activa: bootstrap, build, suite principal y validacion principal pasan). Score bruto = score final = **91.00**. Confianza: MEDIA-ALTA (no puedo ejecutar el publish/verify real ni Linux real localmente).

## BLOCKERS

0.

## CRITICALS

0.

## MAJORS

0.

## MINORS

16 abiertos: heredados 13 (F-02, F-03, F-04, F-05, F-06, F-08, F-10, F-11, F-22, F-23, N-08, N-11, P-06r), y del ciclo 3 (N-18 residual no ASCII, N-21, N-22). Cerrados en esta auditoria: N-12, N-13, N-14, N-15, N-16, N-17, N-19, N-20. Informativos: 4 (I-1..I-4).

## RECOMMENDATION

La candidata `d16adfe` **cumple el objetivo del release-gate sin tolerancia** (91.00 >= 90, 0/0/0) y es apta para pasar a la sesion de release, **sujeto a decision humana**. Antes de publicar, en orden de valor:

1. **N-18 (no ASCII)**: es la unica pega que un usuario real puede encontrar el dia uno (Windows con acentos en el perfil). Correccion pequena y de bajo riesgo (ruta relativa en los shims). Si se corrige en una PR, la auditoria sigue siendo valida solo para este SHA: un cambio en `runtime/cli/**` exige otra pasada del release-gate.
2. N-21 / N-22: documentar el camino `upgrade` -> `detach` para repos v3.1.x solo-lock y quitar la afirmacion de "todos corregidos" cuando se actualice el estado de release.
3. Tras el tag (no antes): confirmar `release.yml` en success, `node scripts/verify-release.mjs v3.3.0 --expect-commit d16adfe694f48d7bd05cfca9048100e2373e2951`, y `self-update` contra la release real; cierra el NO VERIFICADO de Q6.4.

El informe solo es evidencia vigente para `d16adfe` o un descendiente cuya diferencia neta sea unicamente `.audit/**` y `STATUS.md`.

## RELEASE GATE

`node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate d16adfe694f48d7bd05cfca9048100e2373e2951` -> **PASS_WITH_WARNINGS** (exit 0, 16 warnings). Los 16 avisos son los informes anteriores marcados `STALE` para este SHA (comportamiento normal del gate: su `targetCommit` difiere de la candidata fuera de `.audit/**`); no hay ningun aviso relacionado con el score. Con `--tolerance 0` el resultado es el mismo (PASS_WITH_WARNINGS, exit 0, 0 avisos de tolerancia): el pase **no depende de la tolerancia de 2 puntos** (91.00 >= 90). `node runtime/audit/cli.mjs check` -> PASS. No se creo tag.
