---
targetRepo: jlbellonGmail/ai-native
targetCommit: a755c78c834a97b8e39e23b3af72fe3e34bbb4a9
platform:
  version: v3.0.0-dev
  commit: a755c78c834a97b8e39e23b3af72fe3e34bbb4a9
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-13T16:00:00Z
scope: audit of the candidate v3.2.0 (main @ a755c78, PR #111 merged), git diff v3.1.3..a755c78 (ai-native init: runtime/cli/ai-native.mjs, runtime/bootstrap/adopt.mjs, profile-infer.mjs, adopt subcommand, runtime/release/build.mjs, release.yml, scripts/verify-release.mjs, README.md, V3.2.0-RELEASE.md, tests) with adversarial re-validation of P-01..P-09 of the audit of 41dd2a8 and of the fixes themselves, scored from scratch
score: 91.0
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ a755c78 (candidata v3.2.0, re-auditoria de P-01..P-09)

## A. Identificacion

- Repositorio jlbellonGmail/ai-native; checkout local `C:/Proyectos/ai-native`, rama `main`, HEAD = `a755c78c834a97b8e39e23b3af72fe3e34bbb4a9` (`git rev-parse HEAD` exacto; `git status --porcelain` vacio al empezar). `VERSION` = `3.0.0-dev`. Ultima release publicada: `v3.1.3`. `v3.2.0` NO existe (`gh api .../git/ref/tags/v3.2.0` = 404): se audita una CANDIDATA ya fusionada.
- Perfil PLATFORM 1.2; QUALITY_SCORE 1.1; AUDIT_RULES 1.1; auditMethod 1.2. Node v26.11.1, Windows 11, Git Bash, PowerShell 5.1. GitHub solo con GET.
- Plantillas de formato: `AUDIT-PLATFORM-41dd2a8.md` y `AUDIT-PLATFORM-83c4610.md`. La puntuacion se rehizo desde cero sobre este commit: ninguna conclusion previa se acepta sin una orden ejecutada por mi en este commit. Unico fichero escrito en el repo: este informe. Las sondas (`q1..q5.mjs`, `real/`) viven en el scratchpad de la sesion, fuera del repo.

## B. Veredicto

```
Score bruto: 91.00/100
Quality Gate aplicado: ninguno (0 BLOCKER, 0 CRITICAL; validadores PASS; 128/128 tests de las suites tocadas)
Score final: 91.00/100
Confianza: MEDIA (el primer `ai-native init` contra una release v3.2.0 real es imposible hasta publicarla; publish/verify de release.yml no ejercitados; README de instalacion no ejecutable de punta a punta; suite completa test-hermetic NO re-ejecutada; los 9 consumidores reales NO accesibles; F-03 y F-11 no verificables)
Estado: APTO (banda 90-94) segun el umbral del release-gate, con reservas (ver seccion I)
Hallazgos: BLOCKER 0 / CRITICAL 0 / MAJOR 0 / MINOR 3 nuevos (N-09 doc, N-10 rollback, N-11 README sin verificar) + 1 residual P-07 con puntos + 12 heredados (con puntos) / informativos 14
```

Los cuatro MAJOR de `41dd2a8` (P-01, P-02, P-03, P-04) estan corregidos en lo sustancial: reproduje cada exploit original contra el codigo nuevo y ya no funciona (seccion F.3). Queda un residuo real de P-02 (el rollback sigue pudiendo afirmar `ROLLED_BACK` en falso en un caso estrecho: fichero gestionado ya versionado pero borrado del arbol), clasificado MINOR. Mi lectura honesta: la fachada es ahora defendible; lo que NO esta probado es el flujo de release real (primer publish), que solo se puede validar publicando.

## C. Alcance y limitaciones

Inspeccionado: `git diff v3.1.3..a755c78` (19 ficheros, +1855/-19) y el diff de la correccion `41dd2a8..a755c78`. Lectura integral de `runtime/cli/ai-native.mjs`, `runtime/bootstrap/adopt.mjs`, subcomando `adopt` de `cli.mjs`, `remote.mjs` (revocaciones del motor), `build.mjs`, diff de `release.yml` y `verify-release.mjs`, `README.md` (seccion de instalacion), `V3.2.0-RELEASE.md`, `tracking.mjs` (managedPaths), `cache.mjs` (verifyRelease), `contracts/revocations.schema.json`.

NO VERIFICADO: (1) `ai-native init` contra una release `v3.2.0` real (no existe; el motor vive dentro de la release); (2) jobs `publish` y `verify` de `release.yml`, incluido el acceptance test desde el asset publicado y `gh attestation verify` del asset `ai-native-cli.mjs` (solo razonados; ver F.5); (3) el bloque README de instalacion de punta a punta (`gh release download --pattern ai-native-cli.mjs` solo funcionara cuando la ultima release lo contenga; verifique las rutas PowerShell con `Join-Path` en PS 5.1, no la descarga); (4) `gh attestation verify` con `--signer-workflow` frente a un attestation emitido desde otra ref (P-08); (5) suite completa `test-hermetic.mjs` (ejecute 128 tests de los directorios pedidos, no la suite entera, ni tres corridas); (6) los 9 consumidores reales; (7) Linux/macOS locales (CI verde en ubuntu y windows segun `gh api` check-runs); (8) revocacion de claves (F-03); (9) comportamiento de `spawnSync` con ejecutables plantados en el cwd en Node < 26.

## D. Matriz de puntuacion

| Area | Max | Obtenido |
|---|--:|--:|
| Q1 | 12 | 11.75 |
| Q2 | 12 | 11.25 |
| Q3 | 12 | 12.00 |
| Q4 | 12 | 11.00 |
| Q5 | 16 | 14.00 |
| Q6 | 16 | 14.00 |
| Q7 | 12 | 9.50 |
| Q8 | 8 | 7.50 |
| **Total** | **100** | **91.00** |

Aritmetica: 11.75+11.25+12+11+14+14+9.5+7.5 = 91.00; perdidas 0.25+0.75+0+1.0+2.0+2.0+2.5+0.5 = 9.00. Sin N/A. Respecto de `41dd2a8` (87.50): Q1 +0.75 (P-05 cerrado; N-09 consume 0.25 → neto +0.5); Q4 +1.0 (P-04 corregido; N-11 consume 0.5); Q5 +0.5 (P-02 con test post-stage; el caso estrecho consume 0.25); Q6 +0.25; Q7 +1.25 (P-01 y P-03 cerrados; residuo P-07 0.25). Este score es mio, calculado de cero; coincide en orden de magnitud con "cerrar los MAJOR" de la seccion H del informe anterior, pero lo he derivado de las evidencias de abajo, no de esa tabla.

## E. Subcriterios con perdida (el resto COMPLETO)

| ID | Max | Nivel | Obt. | Hallazgo |
|---|--:|---|--:|---|
| Q1.3 | 3 | MENOR | 2.75 | N-09 |
| Q2.2 | 3 | MENOR | 2.25 | F-06 (re-verificado: `M7-INVENTORY.md` l.33 y l.51 con `C:/Proyectos/_m6/`) |
| Q4.2 | 3 | MENOR | 2.5 | N-11 (instalacion por README sin poder verificarse de punta a punta; sin comprobacion automatica de bloques) |
| Q4.5 | 2 | PARCIAL | 1.5 | F-08 (README: 0 menciones de `TRUST_ROOT`, `REVOCATION_UNKNOWN`, `IGNORED_REQUIRED_FILE`, `MANAGED_FILE_NOT_REPRODUCIBLE`, `ATTESTATION_UNAVAILABLE`, `PROFILE_REQUIRED`; `grep -c` = 0) |
| Q5.2 | 3 | MENOR | 2.25 | F-11 |
| Q5.3 | 4 | MENOR | 3.0 | F-05 |
| Q5.4 | 3 | MENOR | 2.75 | N-10 (el test post-stage no cubre el caso tracked-borrado) |
| Q6.2 | 3 | MENOR | 2.25 | F-02 |
| Q6.6 | 2 | DEBIL | 0.75 | F-22 (0.5) + N-08 (0.5) + N-10 (0.25) |
| Q7.1 | 3 | MENOR | 2.25 | F-03 |
| Q7.2 | 2 | MENOR | 1.5 | F-10 (alerta #27 abierta, `gh api` de hoy) |
| Q7.3 | 2 | PARCIAL | 1.0 | F-04 (0.5) + F-23 (0.5) |
| Q7.5 | 3 | MENOR | 2.75 | P-07 residual (0.25) |
| Q8.3 | 2 | MENOR | 1.5 | F-02 |

Por area: Q1 0.25; Q2 0.75; Q4 0.5+0.5 = 1.0; Q5 0.75+1.0+0.25 = 2.0; Q6 0.75+1.25 = 2.0; Q7 0.75+0.5+1.0+0.25 = 2.5; Q8 0.5. Total 9.0.

## F. Ledger de verificacion (comandos ejecutados por mi)

| ID | Comando | Resultado |
|---|---|---|
| G-01 | `git rev-parse HEAD`; `git status --porcelain` | `a755c78c...`; 0 lineas |
| G-02 | `node runtime/audit/cli.mjs check` | PASS (exit 0) |
| G-03 | `node runtime/docs/validate-doc-drift.mjs` | PASS (exit 0) |
| G-04 | `node parity/validate-parity.mjs` | exit 0; par-tests 95/95, unmapped=0 |
| G-05 | `node contracts/validate-contracts.mjs` | PASS (exit 0) |
| G-06 | `node core/validate-core.mjs` | exit 0 |
| G-07 | `node runtime/status/validate-integrity.mjs` | PASS (exit 0) |
| G-08 | `node scripts/validate-actions-pinned.mjs` | PASS (exit 0) |
| G-09 | `node scripts/validate-ci-tests-listed.mjs` | PASS: 94 `*.test.mjs` ejecutados por un workflow |
| G-10 | `node --test --test-concurrency=1 runtime/cli runtime/bootstrap runtime/release scripts runtime/docs runtime/adapters/consumer-launcher.test.mjs` | tests 128, pass 128, fail 0, 124.2 s, exit 0 |
| G-11 | `node --test --test-concurrency=1 runtime/cli/ai-native.test.mjs runtime/bootstrap/adopt.test.mjs runtime/bootstrap/profile-infer.test.mjs` | 41/41 (cli 20, adopt 16, profile-infer 5; coincide con V3.2.0-RELEASE.md) |
| G-12 | `git diff v3.1.3..HEAD --stat -- contracts core profiles mcp runtime/adapters runtime/migrate runtime/consumer AGENTS.md CLAUDE.md` | vacio (0 bytes). Confirmado: compatibilidad contractual intacta |
| G-13 | `gh api` GET: check-runs de a755c78, rulesets, code scanning, releases | CI verde: validators ubuntu/windows, pilots online/offline en ubuntu y windows, sbom, trivy-fs, pin-check, analyze x2; ruleset `ai-native-main` activo; alerta #27 abierta; la API de releases devuelve `immutable` y `digest` por asset (campos reales) |
| G-14 | Sonda REAL `node runtime/cli/ai-native.mjs init --version v3.1.3 --profile factory` en repo Git vacio con cache temporal, contra GitHub | exit 1 con `v3.1.3 predates ai-native init`: antes de eso ejecuto de verdad API de releases, descarga de `revocations-1.json`, `gh attestation verify --signer-workflow` real de la lista de revocaciones y del bundle (Windows). Valida el flujo real de revocaciones/attestation (no solo mocks) hasta la entrega al motor. 16 s |
| G-15 | `q1.mjs` (lock con `github:evil/ai-native`, variantes) | P-01: ver F.3 |
| G-16 | `q2.mjs`, `q2b.mjs` (`adopt()` con fallo forzado tras `stage()`) | P-02: ver F.3 |
| G-17 | `q3.mjs` (revocaciones: revocada, sin attestation, 404, malformada, no JSON, traversal de nombre/tag, draft, offline) | P-03: ver F.3 |
| G-18 | `q4.mjs` (cache con `cli.mjs` plantado, registros forjados) | P-05/P-06: ver F.3 |
| G-19 | `q5.mjs` (`--version` rc/inmutable false, digest de API malformado) | P-07/P-09: ver F.3 |
| G-20 | PowerShell 5.1: `Join-Path $HOME ".ai-native/dl"` y `Join-Path $dl "ai-native-cli.mjs"` | `C:\Users\ASUS\.ai-native\dl` y `...\dl\ai-native-cli.mjs` (rutas correctas) |
| G-21 | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate a755c78... --root .` | ver seccion I |

### F.1 Lanzador `runtime/cli/ai-native.mjs`: lo que se sostiene (fail-closed)

- Sin `gh` o con salida distinta de 0 => `Fail` antes de desempaquetar/ejecutar; `--offline` solo evita la red y exige blob + registro. Digest de API/lock validado con `^sha256:[0-9a-f]{64}$` antes de construir cualquier ruta. `version` del lock con `VERSION`, slug con regex; el `platform.version` del bundle debe coincidir con la version pedida. Argumentos al motor como array (sin shell). El motor siempre arranca desde un bundle recien hasheado y desempaquetado en un temporal privado (`mkdtemp`), nunca desde la copia desempaquetada de la cache.
- Construccion de la URL de revocaciones: `https://github.com/${slug}/releases/download/${r.tag_name}/${a.name}` con `tag_name` forzado por `STABLE`, `a.name` por `^revocations-(\d+)\.json$` y `slug` ya validado: sondas con nombre de asset y tag con `../` (G-17) no llegan a la URL; el lanzador cae en la lista legitima y falla cerrado si esta malformada.

### F.2 Release / `verify-release`

- Activos: `build.mjs` emite `ai-native-cli.mjs` desde el blob del commit; `release.yml` lo incluye en `SHA256SUMS` (`tar, sbom, platform.json, ai-native-cli.mjs, revocations-*.json`), lo atesta (`subject-path`), lo sube y el job `verify` lo descarga, hace `sha256sum -c` y `gh attestation verify --signer-workflow`. `verify-release.mjs` exige el asset desde `v3.2` (`hasCliAsset`) y el conjunto `SHA256SUMS` se recorre por lo listado, por lo que el nuevo asset es consistente con `parseSums` y con el bucle `attestation: <a>` (verifica todo menos `SHA256SUMS` y `.sigstore.json`).

## G. Estado de P-01..P-09 (re-validacion adversarial en este commit)

| ID | Estado | Sonda y resultado |
|---|---|---|
| P-01 | **FIXED** | `q1.mjs`: lock `github:evil/ai-native` => `TRUST_ROOT`, 0 llamadas de red, `gh` no invocado. `--trust-repo other/x` no lo desbloquea; solo `--trust-repo evil/ai-native` (palabra explicita de la persona) llega a la red. Lock oficial + `--trust-repo evil` => se ignora (no cambia la raiz). Variante de mayusculas (`jlbellongmail/...`) => `TRUST_ROOT` (falla del lado seguro; ver I-21). Version con `/../` y slug `../..` malformados => rechazados antes de URL/ruta. Sin lock, `--trust-repo` => error. El opt-in procede de argv del usuario, no del repo. Nota: `--trust-repo ../..` es aceptado por la regex (I-22), pero exige la orden explicita |
| P-02 | **PARTIAL** (camino original FIXED; nuevo residuo N-10) | `q2.mjs`: fallo tras `stage()` en repo vacio, en repo con commit + cambio staged del usuario + fichero sin versionar, con CLAUDE.md versionado y `--keep-existing`, y con CLAUDE.md sin versionar: indice y arbol quedan identicos a antes (`git status --porcelain -z` + `git ls-files -s -z`), `ROLLED_BACK` verdadero. El caso original (`D .ai-native/keep.txt`) ya no ocurre (el test del repo y mi sonda lo confirman). **Residuo (N-10)**: fichero gestionado (`.mcp.json`) versionado en HEAD con contenido del usuario y BORRADO del arbol (` D .mcp.json`): `plan` no ve colision (no esta en disco), `stage` lo reescribe en el indice y `rollbackFresh` no lo restaura porque `indexBefore` guarda solo rutas, no blobs. Resultado: `ROLLED_BACK (nothing was left in the repository or in the index)` pero `git status` pasa de ` D` a `MD` con el blob del bundle en el indice (G-16/`q2b.mjs`). El contenido del usuario sigue en HEAD (recuperable), pero el mensaje es falso en ese caso |
| P-03 | **FIXED** | `q3.mjs` + G-14. Lista revocada => `REVOKED` ANTES de descargar el bundle ni ejecutar motor alguno (la unica descarga y `gh` fueron los de la lista). Lista sin attestation valida => `ATTESTATION_FAILED`. 404, JSON invalido, `entries` ausente => `REVOCATION_UNKNOWN` (fail closed). Sin ningun activo de revocaciones => continua (equivale al motor: no hay informacion; no es fail-open frente a informacion existente). Lista mas alta en release draft => se intenta, la attestation o la descarga decide (sin riesgo, ver I-23). `--offline` omite la comprobacion y lo declara (igual que el motor). La URL se construye solo con datos validados (F.1). El lanzador compara solo `version` (mas estricto que el motor, que ademas filtra por `commit` si existe); el esquema exige `version`, asi que una entrada solo-commit no es valida. Real: el flujo contra GitHub pasa (G-14) |
| P-04 | **FIXED** (verificado en rutas; instalacion de punta a punta NO VERIFICADO) | Bloque bash con variable `$dl` y continuaciones; bloque PowerShell con `Join-Path` (G-20, rutas correctas en PS 5.1). Persisten dos huecos menores: no hay comprobacion automatica de bloques del README (N-11) y el comando solo funciona tras publicar la release |
| P-05 | **FIXED** | `q4.mjs`: cache con `releases/<hex>/runtime/bootstrap/cli.mjs` plantado + registro `{}` + `--offline` => `OFFLINE`, motor NO lanzado (`spawn(process.execPath)` no invocado). Registro completo forjado sin blob => igual. Registro forjado + blob distinto => `CACHE_CORRUPT`. Registro con `repo` ajeno + blob correcto => `OFFLINE`. Solo registro valido + blob cuyo sha256 coincide con el digest => el motor arranca desde un temporal privado con los bytes ya hasheados (leidos una vez, hasheados, escritos al bundle y desempaquetados desde memoria: sin TOCTOU entre hash y uso; el motor ademas exige `record.digest === sha256(bundle)`). Residuo declarado: quien controle `AI_NATIVE_CACHE` y el lock puede plantar blob+registro para un digest que el mismo elija (modelo de usuario local, documentado en "Limites honestos") |
| P-06 | **PARTIAL** (informativo en puntos) | El lanzador ahora liga el registro a digest, `repo` y `version` valida (`readRecord`, `newestCached`) y `q4` lo demuestra. El motor (`adopt.mjs readAttestation`) sigue aceptando cualquier JSON con `verifiedBy` y `digest` correctos si se invoca directamente (`node runtime/bootstrap/cli.mjs adopt --digest ...`): requiere ejecutar el motor a mano o escribir la cache; no hay HMAC. Sin puntos (misma causa que P-05) |
| P-07 | **PARTIAL** | (c) `--version` distinto del lock => error (`q1`: `--version v3.1.0` vs lock v3.2.0 => rechazado sin red) FIXED. (a) `--version` explicito: `q5.mjs` => una `v3.2.0-rc.1` con `immutable:false` pasa al download (no hay comprobacion de inmutabilidad ni de prerelease en el camino explicito) contra la fila "inmutabilidad" del documento: OPEN (0.25, Q7.5). (b) sin lock, `--offline --version vX` sigue sin poder usar la cache (no hay digest); online con `--version` si la usa (digest de la API). (d) `--profile` con lock se ignora en silencio (`q1`) |
| P-08 | **OPEN** | `--signer-workflow` sin ref (`verifyAttestation`, `verify-release.mjs`, README); sin `--source-ref` ni `--cert-identity`. Documentado en "Limites honestos"; sin ruleset de tags (F-04). NO VERIFICADO con `gh` real. Sin puntos adicionales (F-04) |
| P-09 | **FIXED** | `q5.mjs`: digest de API `sha256:../../../../evil` => descartado por `DIGEST.test(published)`, no se construye ruta de cache; el flujo cae a la descarga. Lectura: `digest ??= DIGEST.test(published ?? "") ? published : null` |

## H. Hallazgos abiertos

| ID | Sev | Pts | Tipo | Descripcion / evidencia | Correccion |
|---|---|--:|---|---|---|
| N-09 | MINOR | 0.25 Q1.3 | DRIFT | `V3.2.0-RELEASE.md` ("Limites honestos") dice que un `--version` explicito "no tiene el digest publicado por la API": falso en el codigo (`release = list.find(...)`, `published` se usa y se valida; `q5`). Y la fila de garantia "inmutabilidad: solo releases con `immutable !== false`, no draft, no prerelease" solo se cumple en el camino "ultima estable"; el explicito acepta rc/alpha y `immutable:false` (G-19) | Corregir el texto o aplicar el filtro de inmutabilidad/prerelease al camino explicito (rc solo con aviso) |
| N-10 | MINOR | 0.25 Q6.6 + 0.25 Q5.4 | ROTO | Rollback tras `stage()` no restaura el blob del indice de un fichero gestionado versionado y borrado del arbol: ` D` -> `MD`, con mensaje `ROLLED_BACK (nothing was left ... in the index)` falso (`q2b.mjs`). `indexBefore` = `git ls-files` (solo rutas). Fuera de ese caso, el rollback es correcto en las 5 variantes probadas. Test del repo no lo cubre | Guardar `git ls-files -s` y restaurar con `git update-index --cacheinfo`/`git reset -- <rutas>` para las rutas ya presentes; test con fichero versionado y borrado |
| N-11 | MINOR | 0.5 Q4.2 | NO VERIFICADO | El bloque de instalacion del README (bash y PowerShell) no se ejecuta en CI ni puede ejecutarse hasta publicar `v3.2.0`; la causa raiz de P-04 (bloques de comandos sin comprobacion automatica; el validador de doc drift paso en verde con el bloque roto) sigue sin control | Prueba que extraiga los bloques del README y compruebe al menos sintaxis/rutas, y ejecutarlos en el job `verify` tras publicar |
| P-07r | MINOR | 0.25 Q7.5 | RIESGO | Residuo de P-07(a), ver tabla G | Idem N-09 |
| N-08 | MINOR | 0.50 Q6.6 | ROTO | Heredado de `83c4610` (falso positivo en el rollback completo a v2); `runtime/migrate/` y `runtime/consumer/` sin cambios (G-12) | Ver informe previo |
| F-02 | MINOR | 0.75 Q6.2 + 0.50 Q8.3 | RIESGO | Heredado: `required_approving_review_count: 0` en `ai-native-main` (no re-consultado el valor de hoy: solo el ruleset activo, G-13) | Segundo mantenedor/code owner |
| F-03 | MINOR | 0.75 Q7.1 | NO VERIFICADO | Revocacion de claves antiguas: accion humana | Ejecutarla y documentarla |
| F-04 | MINOR | 0.50 Q7.3 | FALTA | Un solo ruleset (rama); `release.yml` sin `environment:` | Ruleset de tags + Environment |
| F-05 | MINOR | 1.00 Q5.3 | RIESGO | Suite no determinista en Windows (heredado). Esta auditoria: 128/128 y 41/41, una corrida cada una con concurrencia 1, no tres corridas ni la suite completa | 3 corridas verdes consecutivas |
| F-06 | MINOR | 0.75 Q2.2 | SOBRA | `M7-INVENTORY.md` l.33 y l.51 con `C:/Proyectos/_m6/` (re-verificado) | Descripcion relativa |
| F-08 | MINOR | 0.50 Q4.5 | INCOMPLETO | README sin los codigos de error (tambien los nuevos `TRUST_ROOT`, `REVOCATION_UNKNOWN`, `REVOKED`, `CACHE_CORRUPT`, `ROLLBACK_INCOMPLETE`) | Seccion de problemas frecuentes |
| F-10 | MINOR | 0.50 Q7.2 | RIESGO | Alerta #27 `actions/untrusted-checkout/medium` abierta (re-verificado hoy) | Corregir o descartar con justificacion |
| F-11 | MINOR | 0.75 Q5.2 | NO VERIFICADO | `l3-consumer.yml` sin llamador ni runs reales | Llamador o canary |
| F-22 | MINOR | 0.50 Q6.6 | ROTO | `install.mjs` `order = [...]` (sin cambios en el delta: `git diff --name-only` no lo toca) | `canonical` conserva los campos + test |
| F-23 | MINOR | 0.50 Q7.3 | RIESGO | `ci.yml` ejecuta `hitl.mjs` del checkout de la PR (sin cambios en el delta) | Ejecutar desde la base |
| I-1..I-8, I-14..I-20 | informativo | 0 | — | Heredados del informe de `41dd2a8` y anteriores (symlink gestionado, `.gitattributes`, regex inglesa de `isGitRepo`, CRLF, ... ; ejecutables plantados en cwd: no ejecutados en Node 26, no verificado en 20/22; `expectedAssets` lanza `TypeError` ante tag mal formado; acceptance test tras publicar release inmutable; `git add` sin `--literal-pathspecs`; `unpack` con cabecera tar NaN lanza excepcion no `Fail`; `install` sin autoactualizacion; `profile-infer` solo lectura) | — |
| I-21 | informativo | 0 | — | La comparacion lock-vs-oficial del lanzador distingue mayusculas (`pinned.slug !== repo`) aunque GitHub no: un lock legitimo con el repo en otra capitalizacion obtendria `TRUST_ROOT` (falla seguro, mensaje claro, solucion `--trust-repo`). Los locks de los 9 consumidores no se pudieron inspeccionar (NO VERIFICADO) | — |
| I-22 | informativo | 0 | — | `--trust-repo` y el slug del lock aceptan `.`/`..` por la regex (`../..`); requiere palabra explicita de la persona, sin explotacion sin ella | — |
| I-23 | informativo | 0 | — | `assertNotRevoked` no excluye releases draft de la eleccion de la lista de mayor `n`; un draft visible con token y con una lista mas alta provocaria `REVOCATION_UNKNOWN`/fallo de attestation (fail closed, a lo sumo denegacion de servicio para el mantenedor); la lista se localiza via la API sin autenticar (un adversario de red TLS podria ocultar la lista; modelo no considerado) | — |
| I-24 | informativo | 0 | — | `latestStable` queda exportada y sin uso en el lanzador (solo tests); codigo muerto menor | — |

## I. Camino a 100, consistencia y juicio

Perdidas: Q1.3 0.25 (N-09) + Q2.2 0.75 (F-06) + Q4.2 0.5 (N-11) + Q4.5 0.5 (F-08) + Q5.2 0.75 (F-11) + Q5.3 1.0 (F-05) + Q5.4 0.25 (N-10) + Q6.2 0.75 y Q8.3 0.5 (F-02) + Q6.6 1.25 (F-22 0.5, N-08 0.5, N-10 0.25) + Q7.1 0.75 (F-03) + Q7.2 0.5 (F-10) + Q7.3 1.0 (F-04, F-23) + Q7.5 0.25 (P-07r) = 9.0. 91.0 + 9.0 = 100. Sin doble penalizacion (P-06, P-08, P-09, informativos y cerrados no restan; N-10 reparte 0.25+0.25 en Q6.6 y Q5.4 por causa compartida, como en el informe previo). Ningun gate global se activa: 0 BLOCKER, 0 CRITICAL, 0 MAJOR.

Juicio sobre los riesgos del propio parche (lo que pedia el encargo):
- **Revocaciones**: sin hueco explotable en la construccion de URL ni en el origen de la lista; fail closed ante lista ilegible/no atestada; la ausencia total de lista continua (igual que el motor, que lo avisa; el lanzador lo calla). `--offline` omite sin aviso del lanzador pero el motor avisa `offline: revocation status NOT checked`. Revocar por `version` sin `commit` es mas estricto que el motor.
- **Cache**: el camino unico "blob -> hash -> desempaquetar desde memoria" elimina el caso P-05; el modelo "quien controla la cache" sigue siendo de usuario local. La comprobacion `record.version` no se compara con la pedida, pero `platform.version !== o.version` lo cubre.
- **Release real**: la sonda real contra GitHub (G-14) valida, con datos reales, API de releases (`immutable`, `digest` por asset), URL de revocaciones, `gh attestation verify --signer-workflow` y el flujo en Windows. Lo que no se puede ejercitar hasta publicar es que el asset `ai-native-cli.mjs` quede atestado/listado y que el motor complete `READY` contra la release publicada. Riesgo residual: si el acceptance test del job `verify` falla, la release inmutable ya esta publicada y exigiria un parche (declarado en el documento). Antes del tag, el informe de auditoria debe quedar comiteado de modo que la diferencia neta entre el commit etiquetado y `a755c78` sea solo `.audit/**`/`STATUS.md` (regla de vigencia del informe).
- **Compatibilidad**: diff vacio de `contracts core profiles mcp runtime/adapters runtime/migrate runtime/consumer AGENTS.md CLAUDE.md` (G-12). Los 9 consumidores no se pudieron ejecutar (NO VERIFICADO).

Veredicto del auditor: **APTO** bajo el metodo (91.00 >= 90; 0 BLOCKER/CRITICAL/MAJOR). La confianza es MEDIA por lo no verificable del flujo de publicacion real.

## J. Resultado del release-gate (verbatim)

Comando: `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate a755c78c834a97b8e39e23b3af72fe3e34bbb4a9 --root .` ejecutado tras escribir este informe; exit code 0 (el informe de a755c78 fue aceptado: no figura entre los ignorados). Salida verbatim:

```text
PASS_WITH_WARNINGS (14 warnings)
WARNING ignored report AUDIT-PLATFORM-15715ea.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: .agents/skills/registry.json, .agents/skills/sdd/SKILL.md, .github/workflows/ci.yml, .github/workflows/codeql.yml, .github/workflows/dependency-review.yml)
WARNING ignored report AUDIT-PLATFORM-2403b83.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: .github/workflows/release.yml, README.md, evaluation/fixtures/working-tree-release.mjs, governance/SESSION-CONTEXT.md, governance/versioning/V3.1.2-PATCH.md)
WARNING ignored report AUDIT-PLATFORM-2f026b5.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: .github/workflows/release.yml, README.md, evaluation/fixtures/working-tree-release.mjs, governance/SESSION-CONTEXT.md, governance/versioning/V3.1.3-PATCH.md)
WARNING ignored report AUDIT-PLATFORM-3477428.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: .agents/skills/registry.json, .agents/skills/sdd/SKILL.md, .github/workflows/ci.yml, .github/workflows/codeql.yml, .github/workflows/dependency-review.yml)
WARNING ignored report AUDIT-PLATFORM-41dd2a8.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: README.md, governance/versioning/V3.2.0-RELEASE.md, runtime/bootstrap/adopt.mjs, runtime/bootstrap/adopt.test.mjs, runtime/cli/ai-native.mjs)
WARNING ignored report AUDIT-PLATFORM-485c48e.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: .agents/skills/registry.json, .agents/skills/sdd/SKILL.md, .github/workflows/ci.yml, .github/workflows/codeql.yml, .github/workflows/dependency-review.yml)
WARNING ignored report AUDIT-PLATFORM-521d203.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: .agents/skills/registry.json, .agents/skills/sdd/SKILL.md, .github/workflows/ci.yml, .github/workflows/codeql.yml, .github/workflows/dependency-review.yml)
WARNING ignored report AUDIT-PLATFORM-5a60072.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: .agents/skills/registry.json, .agents/skills/sdd/SKILL.md, .github/workflows/ci.yml, .github/workflows/codeql.yml, .github/workflows/dependency-review.yml)
WARNING ignored report AUDIT-PLATFORM-67f6806.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: .agents/skills/sdd/SKILL.md, .github/workflows/ci.yml, .github/workflows/release.yml, README.md, contracts/README.md)
WARNING ignored report AUDIT-PLATFORM-6acd5f7.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: .agents/skills/sdd/SKILL.md, .github/workflows/release.yml, README.md, contracts/README.md, contracts/lock.schema.json)
WARNING ignored report AUDIT-PLATFORM-83c4610.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: .github/workflows/release.yml, README.md, evaluation/fixtures/working-tree-release.mjs, governance/SESSION-CONTEXT.md, governance/versioning/V3.1.3-PATCH.md)
WARNING ignored report AUDIT-PLATFORM-84d28a1.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: .agents/skills/registry.json, .agents/skills/sdd/SKILL.md, .github/workflows/ci.yml, .github/workflows/release.yml, .specify/templates/spec-template.md)
WARNING ignored report AUDIT-PLATFORM-ad7af81.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: .github/workflows/release.yml, README.md, evaluation/fixtures/working-tree-release.mjs, governance/SESSION-CONTEXT.md, governance/versioning/V3.1.3-CONSUMER-COMPAT.md)
WARNING ignored report AUDIT-PLATFORM-f4bc663.md: STALE (candidate differs from the audited commit outside .audit/** and STATUS.md: .github/workflows/release.yml, README.md, evaluation/fixtures/working-tree-release.mjs, governance/SESSION-CONTEXT.md, governance/versioning/V3.1.1-POST-RELEASE-VERIFICATION.md)
```

