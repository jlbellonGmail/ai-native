---
targetRepo: jlbellonGmail/ai-native
targetCommit: 7e7461892b8353db13c280f41ce11e026ea3b628
platform:
  version: v3.0.0-dev
  commit: 7e7461892b8353db13c280f41ce11e026ea3b628
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-13T15:00:00Z
scope: final release audit of the candidate v3.2.0 (new public command `ai-native init`), git diff v3.1.3..7e74618 (merge of PR #113), adversarial re-verification of P-01..P-09, N-09, N-10, N-11 and supply chain of the launcher end to end
score: 90.0
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ 7e74618 (candidata v3.2.0, auditoria final de release)

## A. Identificacion

- Repositorio jlbellonGmail/ai-native; checkout local `C:/Proyectos/ai-native`, rama `main`, HEAD = `7e7461892b8353db13c280f41ce11e026ea3b628` (`git rev-parse HEAD` exacto; `git status --short` vacio al empezar; `origin/main` = mismo SHA). `VERSION` = `3.0.0-dev`. Ultima release publicada: `v3.1.3`. `v3.2.0` NO existe (`gh api .../git/ref/tags/v3.2.0` = 404): se audita una CANDIDATA ya fusionada (merge de la PR #113).
- Perfil PLATFORM 1.2; QUALITY_SCORE 1.1; AUDIT_RULES 1.1; auditMethod 1.2. Node v26.11.1, gh 2.101.0, Windows 11, Git Bash, PowerShell 5.1 y 7.6. GitHub solo con GET (`gh api`, `gh release download` a un directorio temporal).
- Plantillas de formato: `AUDIT-PLATFORM-83c4610.md` y `AUDIT-PLATFORM-41dd2a8.md`. El informe de `a755c78` (solo en la rama cerrada `origin/docs/v3.2.0-audit-a755c78`) se leyo unicamente como lista de afirmaciones a re-verificar. La puntuacion se calculo de cero sobre este commit; ninguna conclusion anterior se acepta sin una orden ejecutada por mi aqui.
- Unico fichero escrito en el repo: este informe. Las sondas (`n09.mjs`, `off.mjs`, `lock.mjs`, `rb.mjs`, `ke.mjs`, `tar.mjs`, `eng.mjs`, `mut*.sh`, etc.) viven en `%TEMP%/aud7e`, fuera del repo; los repos Git de prueba, en temporales con rutas propias.

## B. Veredicto

```
Score bruto: 90.00/100
Quality Gate aplicado: ninguno (0 BLOCKER, 0 CRITICAL, 0 MAJOR; todos los validadores PASS)
Score final: 90.00/100
Confianza: MEDIA (el primer publish/verify de release.yml con el asset nuevo y `ai-native init` contra una release real v3.2.0 son imposibles de ejecutar antes de publicar; suite con fallos intermitentes F-05 en Windows; F-03 y F-11 no verificables; 9 consumidores no accesibles)
Estado: APTO en el umbral exacto (>= 90, 0 BLOCKER/CRITICAL/MAJOR), sin margen
Hallazgos: BLOCKER 0 / CRITICAL 0 / MAJOR 0 / MINOR 17 (5 nuevos: N-12, N-13, N-14, N-15, P-06r; N-11 residual; 11 heredados con puntos) / informativos 9
```

- Los cuatro MAJOR de `41dd2a8` y los residuos de `a755c78` estan cerrados en lo sustancial: reproduje los escenarios originales contra el codigo actual (seccion G). Estado: P-01 FIXED, P-02 FIXED, P-03 FIXED, P-04 FIXED, P-05 FIXED, P-06 PARTIAL, P-07 FIXED, P-08 OPEN (declarado), P-09 FIXED; N-09 FIXED, N-10 FIXED, N-11 PARTIAL.
- Mi lectura honesta: el lanzador y el rollback son solidos y fallan cerrado en todas las ramas que sondee (mas de 130 sondas). Lo que queda son defectos MINOR de proceso: la suite del comando nuevo no esta en el CI por PR (N-13), el paso de aceptacion del release es incompatible con tags alpha/rc (N-12), el guardia del README es parcial (N-11 residual) y el bloque de instalacion del README no es re-ejecutable (N-14). El score cae en el umbral exacto (90.00): cualquier descuento adicional por algo que no pude verificar lo dejaria por debajo; lo declaro tal cual.

## C. Alcance y limitaciones

Inspeccionado: `git diff v3.1.3..7e74618` completo (20 ficheros, +2135/-19): `runtime/cli/ai-native.mjs` (lectura integral), `runtime/bootstrap/adopt.mjs` (integral), subcomando `adopt` de `runtime/bootstrap/cli.mjs`, `profile-infer.mjs`, `runtime/release/build.mjs`, `.github/workflows/release.yml` (build/publish/verify completos), `scripts/verify-release.mjs` (+test), `scripts/validate-readme-install.test.mjs`, `README.md`, `V3.2.0-RELEASE.md`, `evaluation/fixtures/working-tree-release.mjs`, mas `remote.mjs` y `tar.mjs` del motor existente.

NO VERIFICADO: (1) `publish` y `verify` de `release.yml` con `ai-native-cli.mjs` (solo `build` corre en PR: verde en 50ac151 segun check-runs; `publish`/`verify` aparecen `skipped`); (2) `ai-native init` extremo a extremo contra una release v3.2.0 real (el motor vive dentro de la release); (3) instalacion del README de punta a punta (`gh release download --pattern ai-native-cli.mjs` sin tag falla hoy: "no assets match the file pattern"); (4) `gh attestation verify --signer-workflow` frente a un attestation emitido desde otra ref (P-08); (5) revocacion de claves antiguas (F-03); (6) los 9 consumidores reales; (7) `l3-consumer.yml` real (F-11); (8) Linux/macOS locales (solo CI verde en ubuntu y windows); (9) busqueda de `gh.exe`/`git.exe` en el cwd solo se probo en Node 26.11.1 (no se hijackea); versiones anteriores de Node NO VERIFICADO; (10) `pr-gate.mjs --base origin/main` solo es trivial aqui (HEAD = origin/main, diff vacio): PASS sin significado.

## D. Matriz de puntuacion

| Area | Max | Obtenido |
|---|--:|--:|
| Q1 | 12 | 11.50 |
| Q2 | 12 | 11.25 |
| Q3 | 12 | 12.00 |
| Q4 | 12 | 11.00 |
| Q5 | 16 | 13.75 |
| Q6 | 16 | 13.50 |
| Q7 | 12 | 9.50 |
| Q8 | 8 | 7.50 |
| **Total** | **100** | **90.00** |

Aritmetica: 11.5+11.25+12+11+13.75+13.5+9.5+7.5 = 90.00; perdidas 0.5+0.75+0+1.0+2.25+2.5+2.5+0.5 = 10.00. Sin N/A. Puntuado de cero: cada perdida abajo se apoya en una orden o lectura de este commit; los heredados se re-verificaron cuando fue posible (indicado en E/G).

## E. Subcriterios con perdida (el resto COMPLETO)

| ID | Max | Nivel | Obt. | Hallazgo |
|---|--:|---|--:|---|
| Q1.3 | 3 | MENOR | 2.5 | N-13 (V3.2.0-RELEASE afirma que la matriz `validators` ejecuta todas las pruebas y que el guardia README "ya corre en la suite de CI": falso por PR, 0.25) + N-15 (SESSION-CONTEXT "PR abierta", 0.25) |
| Q2.2 | 3 | MENOR | 2.25 | F-06 (re-verificado: `M7-INVENTORY.md` l.33 y l.51 con `C:/Proyectos/_m6/`) |
| Q4.2 | 3 | MENOR | 2.5 | N-11 residual (0.25) + N-14 (0.25) |
| Q4.5 | 2 | PARCIAL | 1.5 | F-08 (re-verificado: `grep -c` en README de `TRUST_ROOT`, `RELEASE_REJECTED`, `REVOCATION_UNKNOWN`, `ROLLBACK_INCOMPLETE`, `IGNORED_REQUIRED_FILE`, `MANAGED_FILE_NOT_REPRODUCIBLE`, `PROFILE_REQUIRED`, `ATTESTATION_UNAVAILABLE` = 0) |
| Q5.2 | 3 | MENOR | 2.25 | F-11 (`l3-consumer.yml` solo `workflow_call`, sin llamador) |
| Q5.3 | 4 | MENOR | 3.0 | F-05 (reproducido hoy, ver F) |
| Q5.5 | 3 | MENOR | 2.5 | N-13 (0.5) |
| Q6.2 | 3 | MENOR | 2.25 | F-02 (GET hoy: `required_approving_review_count: 0`, `require_code_owner_review: false`) |
| Q6.4 | 3 | MENOR | 2.25 | N-12 (0.5) + NO VERIFICADO publish/verify del asset nuevo (0.25, QUALITY_SCORE 16: lo no verificable no puntua como cumplido) |
| Q6.6 | 2 | PARCIAL | 1.0 | F-22 (0.5, `install.mjs` `order` sin `productDir`/`governance`, sin cambios) + N-08 (0.5, `runtime/migrate` sin cambios) |
| Q7.1 | 3 | MENOR | 2.25 | F-03 |
| Q7.2 | 2 | MENOR | 1.5 | F-10 (GET hoy: alerta #27 `actions/untrusted-checkout/medium` abierta) |
| Q7.3 | 2 | PARCIAL | 1.0 | F-04 (0.5: un solo ruleset de rama `ai-native-main`; `release.yml` sin `environment:`; abarca P-08) + F-23 (0.5: `ci.yml:208` ejecuta `hitl.mjs` del checkout de la PR) |
| Q7.5 | 3 | MENOR | 2.75 | P-06r (0.25) |
| Q8.3 | 2 | MENOR | 1.5 | F-02 (causa compartida con Q6.2) |

Por area: Q1 0.5; Q2 0.75; Q4 0.5+0.5 = 1.0; Q5 0.75+1.0+0.5 = 2.25; Q6 0.75+0.75+1.0 = 2.5; Q7 0.75+0.5+1.0+0.25 = 2.5; Q8 0.5. Total 10.0.

## F. Ledger de verificacion (comandos ejecutados por mi)

| ID | Comando | Resultado |
|---|---|---|
| G-01 | `git rev-parse HEAD`; `git status --short` | `7e74618...`; 0 lineas |
| G-02 | `node parity/validate-parity.mjs` | exit 0; par-tests 95/95, unmapped=0 |
| G-03 | `node contracts/validate-contracts.mjs` | PASS (20 esquemas, 7 ficheros de datos) |
| G-04 | `node core/validate-core.mjs` | exit 0 |
| G-05 | `node runtime/status/validate-integrity.mjs` | PASS |
| G-06 | `node runtime/docs/validate-doc-drift.mjs` | PASS |
| G-07 | `node scripts/validate-actions-pinned.mjs` | PASS |
| G-08 | `node scripts/validate-ci-tests-listed.mjs` | PASS: 95 `*.test.mjs` ejecutados por algun workflow (ver N-13: "algun workflow" incluye `release.yml`) |
| G-09 | `node runtime/audit/cli.mjs check` | PASS |
| G-10 | `node runtime/gates/pr-gate.mjs --base origin/main` | PASS, pero trivial (diff vacio: HEAD = origin/main; `product tests: NOT_APPLICABLE`) |
| G-11 | `node --test --test-concurrency=1 runtime/cli runtime/bootstrap runtime/release scripts runtime/docs runtime/migrate` (maquina en reposo) | tests 253, pass 253, fail 0, 384 s |
| G-12 | `node --test --test-concurrency=1 runtime/cli runtime/bootstrap runtime/release scripts runtime/docs runtime/adapters runtime/migrate runtime/consumer` (2 corridas completas, con mis sondas en paralelo parte del tiempo) | corrida 1: 368 tests, 367 pass, 1 fail (F-20 sdd mark, `consumer-launcher.test.mjs`); corrida 2: 368, 362 pass, 6 fail (todos en `runtime/adapters` y `runtime/consumer`). Causa en el log: `git ... unable to write file .git/objects/..: Permission denied` (F-05) |
| G-13 | `node --test --test-concurrency=1 runtime/adapters runtime/consumer` (reposo) | 115 tests, 113 pass, 2 fail (F-19 hitl y F-20, mismo `Permission denied`) |
| G-14 | `node --test runtime/adapters/consumer-launcher.test.mjs` x3 | 10/10, 10/10, 7/10 (3 fallos `Permission denied` en `.git/objects`): F-05 reproducido, intermitente, ajeno al delta (ninguno de los 6 ficheros de la suite nueva falla) |
| G-15 | `git diff v3.1.3..HEAD --stat -- contracts core profiles mcp runtime/adapters runtime/migrate runtime/consumer AGENTS.md CLAUDE.md` | vacio (0 bytes). Confirmado |
| G-16 | `git diff v3.1.3..HEAD --name-only -- .github` | solo `.github/workflows/release.yml` (asset en SHA256SUMS, attest `subject-path`, upload, lista de descarga del `verify`, bucle de attestation y paso de aceptacion). Nada mas fuera de `.audit`, `governance`, `runtime/{cli,bootstrap,release}`, `scripts`, `evaluation/fixtures`, `README.md` |
| G-17 | `n09.mjs`: 47 casos de `main()` con red y `gh` simulados | N-09 en G |
| G-18 | `off.mjs`: 11 casos con cache fabricada `--offline` | N-09/P-05 en G |
| G-19 | `lock.mjs`: 26 casos con lock, revocaciones y listas manipuladas | P-01/P-03/P-07 en G |
| G-20 | `rb.mjs`: 20 escenarios de rollback con `adopt()` y `afterStage` | N-10/P-02 en G (comparacion de `status --porcelain=v1 -z --untracked-files=all`, `ls-files -s -z`, `status --ignored` y hash de todo el arbol) |
| G-21 | `ke.mjs`: `--keep-existing`, idempotencia, `PROFILE_CONFLICT` del motor | G |
| G-22 | `tar.mjs`: 18 tars hostiles contra `unpack` (lanzador) y `readTar` (motor) | G |
| G-23 | `eng.mjs`: motor invocado a mano con registro forjado | P-06 en G |
| G-24 | `mut.sh`/`mut2.sh`: 18 mutaciones del README/CLI/workflow contra `validate-readme-install.test.mjs` | N-11 en G |
| G-25 | `hij.mjs`: `spawnSync("git"/"gh")` con `git.exe` plantado en el cwd | no se ejecuta el plantado (Node 26.11.1) |
| G-26 | Real: `AI_NATIVE_CACHE=<tmp> node runtime/cli/ai-native.mjs init --version v3.1.3 --profile factory` en un repo Git vacio temporal | exit 1, `v3.1.3 predates ai-native init`; 18.6 s; ejecuta de verdad API de releases, `revocations-1.json` y `gh attestation verify --signer-workflow` real. El repo temporal solo contiene `.git`; el arbol de trabajo no se tocaba (`git status --short` = solo este informe) |
| G-27 | `gh api repos/.../releases?per_page=100` | todas las releases con `immutable: true` y `digest` por asset (campos reales); las pre-releases `draft:false, prerelease:true, immutable:true` |
| G-28 | `gh api` GET: rulesets, review rules, code scanning, check-runs de `7e74618` y `50ac151`, `release.yml` runs | un ruleset de rama; 0 aprobaciones; alerta #27; CI verde en `7e74618` (validators y pilots ubuntu/windows, pin-check, trivy, sbom, analyze x2); `build` de `release.yml` verde en la PR; `publish`/`verify` skipped |
| G-29 | PowerShell 5.1 y 7.6: `Join-Path $HOME ".ai-native/dl"`, `Join-Path $dl "ai-native-cli.mjs"` y `Parser::ParseFile` del bloque del README | `C:\Users\ASUS\.ai-native\dl`, `...\dl\ai-native-cli.mjs`; 0 errores de sintaxis |
| G-30 | `gh release download v3.1.3 --pattern platform.json --dir <nuevo>` dos veces | 1.a: crea el directorio, exit 0; 2.a: `already exists (use --clobber...)` exit 1 (N-14) |
| G-31 | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 7e74618... --root .` | ver seccion J |

### F.1 Lanzador `runtime/cli/ai-native.mjs`: lo que se sostiene (fail-closed)

- Sin `gh` o `gh` con salida distinta de 0 => `Fail` antes de desempaquetar/ejecutar. `--offline` solo omite la red y exige blob + registro. Digest de la API o del lock validado con `^sha256:[0-9a-f]{64}$` antes de construir rutas. `version` del lock con `VERSION`, slug con regex; el `platform.version` del bundle debe coincidir con la version pedida. Argumentos al motor siempre como array (`spawnSync` sin shell; no hay interpolacion). Motor arrancado siempre desde un bundle recien hasheado y desempaquetado en `mkdtemp`, nunca desde la copia desempaquetada de la cache (el codigo no contiene ninguna lectura de `releases/`: `grep` solo encuentra las dos URLs `releases/download`).
- Win32: `spawnSync("git")`/`("gh")` no buscan en el cwd (G-25); sin hijack por un `git.exe` en el repositorio.
- TOCTOU de la cache: el blob se lee una vez, se hashea, se escribe en el bundle temporal y se desempaqueta desde memoria; el motor vuelve a exigir `record.digest === sha256(bundle)`.

### F.2 Release / `verify-release` (primera release con `ai-native-cli.mjs`)

- `build.mjs` emite el asset desde el blob del commit (`readShippedFiles`), lo mete en `SHA256SUMS`; `release.yml` lo atesta (`subject-path`), lo sube y lo publica; el job `verify` lo descarga, hace `sha256sum -c`, `gh attestation verify --signer-workflow` y ejecuta el paso de aceptacion. `verify-release.mjs` exige el asset con `hasCliAsset` (desde v3.2.0) y verifica su attestation y el acceptance test; los tests existentes confirman que v3.1.3 y anteriores siguen sin exigirlo. La lista de assets y `SHA256SUMS` (que se recorre por lo listado) son consistentes.
- Donde puede fallar el flujo real aunque los mocks pasen: (a) tags alpha/rc (N-12, demostrado); (b) `immutable` y `digest` por asset son los campos reales de la API (G-27), asi que `assertPublishable` pasa para una release publicada; (c) el paso de aceptacion necesita `GH_TOKEN` (lo tiene) y que el motor lea la lista de revocaciones atestada: el flujo real contra GitHub funciona hasta la entrega al motor (G-26), pero el tramo del motor contra la release v3.2.0 NO VERIFICADO; (d) si el listado de releases tardase en reflejar `immutable: true` justo tras publicar, el paso fallaria cerrado (no se vio en v3.1.3, que lo muestra true).

## G. Re-validacion adversarial de los elementos obligatorios

### P-01..P-09

| ID | Estado | Sonda y resultado |
|---|---|---|
| P-01 | **FIXED** | `lock.mjs`: lock con `github:evil/ai-native` => `TRUST_ROOT`, 0 llamadas de red y 0 de `gh`; con `--trust-repo other/x` sigue `TRUST_ROOT`; con `--trust-repo evil/ai-native` (palabra explicita) llega a la red de ese repo; lock oficial + `--trust-repo evil/x` se ignora y sigue en la raiz oficial; `github:../..` y variante de mayusculas => `TRUST_ROOT`; `github:...?x=1` => "not usable"; sin lock, `--trust-repo` => error. El opt-in procede de argv del usuario, no del repo |
| P-02 | **FIXED** | `rb.mjs` (G-20): fallo tras `git add` en 20 escenarios; en los 16 que terminan en `ROLLED_BACK` el estado final es identico al previo en `status`, `ls-files -s`, `status --ignored` y hash del arbol. Incluye el caso original (` D`/`D ` de un gestionado versionado). Detalle en N-10 |
| P-03 | **FIXED** | `lock.mjs`: lista con la version revocada => `REVOKED`, el bundle NO se descarga (comprobado: ninguna URL `.tar.gz` llamada) y `gh` solo se invoco una vez (la lista). 404, JSON invalido y `entries` ausente con el asset listado => `REVOCATION_UNKNOWN` (cierra). Sin ningun asset de revocaciones => continua (el motor las vuelve a comprobar). Nombre de asset y `tag_name` con `../` no llegan a la URL. Entrada solo-`commit` no revoca (el esquema exige `version`). `--offline` omite y lo declara. Real: G-26. La URL se construye con `slug` validado + `tag_name` forzado por `STABLE` + `a.name` forzado por `^revocations-(\d+)\.json$` |
| P-04 | **FIXED** (instalacion de punta a punta NO VERIFICADO) | G-29: rutas correctas en PS 5.1 y 7.6, 0 errores de sintaxis; bash con `$dl` y continuaciones validas (`bash -n` por el test). Residuos en N-11 (guardia parcial) y N-14 (no re-ejecutable) |
| P-05 | **FIXED** | `off.mjs`: sin blob, sin registro, registro de `repo` ajeno, `verifiedBy` distinto, o blob manipulado => el motor NO se lanza (`OFFLINE`/`CACHE_CORRUPT`); registro que declara v3.2.0 sobre un blob v3.2.5 => `bundle says v3.2.5, release is v3.2.0`. El codigo no lee ni ejecuta `releases/<hex>/` de la cache |
| P-06 | **PARTIAL** | El lanzador liga el registro a digest, `repo`, `verifiedBy` y `version` valida (G-18). El motor invocado a mano (`G-23`): `node runtime/bootstrap/cli.mjs adopt --repo github:evil/x --bundle B --attestation-record forged.json --offline` con `forged.json = {"digest":"sha256:<B>","verifiedBy":"gh attestation verify"}` termina en `STATUS: READY ... ATTESTATION: PASS` sin ninguna verificacion real. Requiere ejecutar el motor a mano o escribir la cache (modelo de usuario local, declarado en "Limites honestos"), pero la etiqueta `ATTESTATION: PASS` se afirma desde JSON del llamante, el motor persiste ese registro en la cache y `--revocations <file>` permite sustituir la lista. Residuo declarado, 0.25 en Q7.5 (P-06r) |
| P-07 | **FIXED** | `lock.mjs`: `--version` distinto del lock => error sin red; igual => se acepta y revalida; `--profile` contradictorio => `PROFILE_CONFLICT` sin red (tambien en el motor, `ke.mjs`); coincidente => se acepta; lock sin `profiles` + `--profile x` => `PROFILE_CONFLICT`. Version/digest del lock con traversal => "not usable". Camino explicito sin lock: ver N-09 |
| P-08 | **OPEN** (declarado, no puntua aparte) | `--signer-workflow` sin ref (`verifyAttestation`, `verify-release.mjs`, README); sin `--source-ref` ni `--cert-identity`. NO VERIFICADO con `gh` real frente a un attestation de otra ref. Un unico ruleset (rama), sin ruleset de tags ni `environment:` (G-28): F-04. Las releases inmutables protegen los tags publicados, no el primer push de un tag |
| P-09 | **FIXED** | `n09.mjs`: digest `undefined`, `null`, vacio, truncado, mayusculas, `sha1:`, con espacio o salto de linea, numero => `RELEASE_REJECTED` sin descargar nada. La cache nunca recibe una ruta derivada de un digest no validado (`readRecord` solo se llama con digest que paso `DIGEST`) |

### N-09: `--version` explicito (47 casos; ver `n09.mjs`)

Solo se instala una release estable, publicada, no draft, `immutable === true` y con digest sha256 valido publicado:

- Aceptado (control): estable + todo correcto => motor (mock) lanzado, 1 descarga.
- Rechazado sin descargar: `immutable` false, ausente o `"true"` (cadena); `prerelease: true`; `draft: true` o `draft` ausente; `tag_name` distinto del pedido (incluso una release `v3.2.1` listada para `v3.2.0`); sin asset de bundle o `assets` ausente; digest `undefined`/`null`/vacio/corto/en mayusculas/`sha1:`/con espacio/con `\n`/numero. Release v3.2.0 inexistente en la lista => `is not among the published releases`.
- Versiones raras rechazadas en `parse()` antes de red: `V3.2.0`, ` v3.2.0`, `v3.2.0 `, `v3.2.0\n`, `v3.2`, `3.2.0`, `v3.2.0/../x`, `v３.２.０` (cifras anchas), `v3.2.0+b`, `v3.2.0-alpha.1`, `v3.2.0-rc.1`, NUL, `%2e`, `../v3.2.0`. `v03.2.0` pasa `STABLE` (ceros a la izquierda) pero no esta en la lista => rechazado (informativo I-3).
- Duplicados en la lista: se toma el primero; si el primero es malo y el segundo bueno => rechazado (cierra); GitHub no admite tags duplicados. Digest valido pero bundle descargado distinto => `DIGEST_MISMATCH`; bundle que declara otra version => `bundle says v3.2.9, release is v3.2.0`.
- Latest: solo prerelease, solo `immutable:false` => `no stable, immutable release found`; estable + rc mas nuevo => elige la estable; `v3.3.0 immutable:false` + `v3.2.0` bueno => elige `v3.2.0`; el mejor candidato sin digest => `RELEASE_REJECTED` (no cae a uno mas viejo: cierra); `v3.10.0` > `v3.9.0` (orden semver).
- Offline (`off.mjs`): `--offline --version v3.2.0` solo usa exactamente esa version en cache con blob y registro; con solo `v3.2.1` en cache => `OFFLINE`; sin `--version` usa la mas nueva estable verificada; solo `rc` en cache => `OFFLINE`.

**N-09: FIXED.** La documentacion (`V3.2.0-RELEASE.md`, "Limites honestos") ya coincide con el codigo.

### N-10: rollback tras `git add` (20 escenarios, `rb.mjs`)

Criterio de exito: `status --porcelain=v1 -z --untracked-files=all`, `ls-files -s -z`, `status --ignored=matching` y hash de contenido de todo el arbol (salvo `.git`) antes == despues, y `ROLLED_BACK` impreso solo si es cierto.

| Escenario | Resultado |
|---|---|
| repo sin commits; fichero sin versionar preexistente | `ROLLED_BACK`, todo identico |
| nombres con espacios, `ñ`, `é`, `ü`, subdirectorio con espacio (versionados y sin versionar) | identico |
| cambio staged ajeno a lo gestionado | identico |
| gestionado `.mcp.json` versionado + borrado SIN stage (` D`) | identico (era el residuo N-10 de `a755c78`) |
| gestionado `.mcp.json` versionado + borrado CON stage (`D `) | identico |
| `CLAUDE.md` versionado + modificacion CON stage, `--keep-existing` | identico |
| `CLAUDE.md` versionado + modificacion sin stage, `--keep-existing`; y sin versionar con `--keep-existing` | identico |
| ficheros ignorados (`*.log`, `build/`) y nuevos ignorados | identico (incluida la vista `--ignored`) |
| fichero versionado con modo ejecutable 100755 | identico |
| `core.autocrlf=true` con ficheros CRLF | identico |
| `.gitignore` oculta `.claude/` o `CLAUDE.md` (`IGNORED_REQUIRED_FILE`, sin `afterStage`) | `ROLLED_BACK` verificado, identico |
| `assume-unchanged` en gestionado editado (`--keep-existing`) | identico |
| ` D` de un fichero staged-borrado en un dir donde se anade otro | identico |
| **control sin fallo** | `PASS_WITH_WARNINGS ADOPTED`, 47 ficheros en el indice (cambio de estado real) |
| el usuario edita `CLAUDE.md` durante la ejecucion (simulado en `afterStage`) | `ROLLBACK_INCOMPLETE (differs from before: ?? .ai-native/adoption-journal.json, ...)`; honesto. Queda `AM CLAUDE.md`: `git rm --cached` (sin `-f`) se niega cuando el indice difiere de HEAD y del fichero (I-1) |
| el usuario crea un fichero nuevo durante la ejecucion | `ROLLBACK_INCOMPLETE (differs from before: ?? newfile.txt)` (conservador: culpa a la ejecucion de algo ajeno, pero nunca afirma lo falso) |
| `skip-worktree` sobre un gestionado borrado | `ROLLBACK_INCOMPLETE (differs from before:  D .mcp.json)`: el bit skip-worktree se pierde, y el comparador lo detecta (I-2) |

Veredicto N-10: **FIXED**. `ROLLED_BACK` solo se imprime tras comparar indice completo (modo, blob, stage, ruta) y `status`. Preguntas del encargo: (1) *status iguales con contenido distinto*: el comparador usa el indice con blob, y el hash de arbol que yo compare no vario en ningun escenario; la ejecucion solo escribe rutas gestionadas que no existian o eran identicas (colision distinta aborta antes de escribir, o `--keep-existing` las deja); (2) *ficheros gestionados editados por el usuario*: `revertAdoption` los conserva y el resultado es `ROLLBACK_INCOMPLETE`, no `ROLLED_BACK`; (3) `ROLLBACK_INCOMPLETE` es honesto en los tres casos adversos. El comparador es conservador (puede falsos positivos de "incompleto", nunca falsos de "completo" en lo que sondee). No cubre directorios vacios ni contenido de ficheros ignorados por separado, pero el hash del arbol de mis sondas (que si los incluye) no encontro diferencias.

### N-11: guardia del README

`validate-readme-install.test.mjs` (5 tests) se extrae por seccion `## New project`; verifica sintaxis (`bash -n`, parser PowerShell si hay), el patron original de P-04 (`$HOME[A-Za-z0-9.]`, `.ai-native[A-Za-z]` solo en el bloque PowerShell, `Join-Path $HOME ".ai-native/dl"`), la interfaz publica (asset, repo oficial, signer workflow, `install`, orden verificar-antes-de-ejecutar) y los flags de `ai-native init`. Mutaciones (G-24, 18 casos): detecta el P-04 original y variantes (`$HOME.ai-native`, `.ai-native-dl` en PowerShell), signer workflow equivocado, verificacion eliminada o posterior a la ejecucion, `install` renombrado, `--signer-workflow` eliminado del CLI, asset renombrado en `release.yml`, flag inexistente, comillas rotas, nombre de asset equivocado. **No detecta** perdidas de separador en otros puntos (`gh attestation verify "$dlai-native-cli.mjs"` en bash, `node $dl"ai-native-cli.mjs"` y `gh attestation verify $dlai-native-cli.mjs` en PowerShell, `dl=~/.ai-nativedl` en bash) ni un repo oficial con typo en la linea de descarga (el `includes` del repo se satisface con otra linea). Corre localmente y en `release.yml` build (tag, o PR con rutas acotadas), no en `ci.yml` (N-13). **N-11: PARTIAL** (protege P-04 en su forma exacta y la interfaz; la clase de defecto "ruta corrupta" sigue pudiendo reaparecer).

### Seguridad de la cadena de suministro de `ai-native init` (resto del encargo)

- Digest: GitHub publica el sha256 del asset; el lanzador lo compara con los bytes descargados (`DIGEST_MISMATCH`) y el motor con el lock (`sync`). Attestation: `gh attestation verify --repo --signer-workflow <repo>/.github/workflows/release.yml`, obligatoria sin bypass; falta `gh` => `ATTESTATION_UNAVAILABLE`.
- Revocaciones: lista de mayor `n`, atestada, antes de ejecutar cualquier motor; ausente => continua (el motor reintenta y falla cerrado si la conoce); ilegible => `REVOCATION_UNKNOWN`; revocada => `REVOKED`. El lanzador elige la primera aparicion por nombre en el listado (mas nueva) sin filtrar draft/prerelease: la attestation y el digest deciden, y quien publique una lista mas alta debe pasar la attestation del workflow (informativo I-6). El motor valida la lista con `--repo` sin `--signer-workflow` (mas laxo que el lanzador; I-7).
- Raiz de confianza y conflicto de perfil: ver P-01/P-07. Cache: blob re-hasheado en cada uso, registro ligado a digest/repo/version, sin TOCTOU, registros plantados rechazados (P-05); quien controle `AI_NATIVE_CACHE` y el lock puede plantar un par blob+registro para un digest que el mismo elija (modelo local, declarado).
- Extraccion tar (G-22): el lanzador y el motor coinciden: rechazan `..`, absolutas, unidad `C:`, backslash, symlink/hardlink, duplicados, prefijo con traversal y archivo vacio (el motor acepta vacio; lo rechaza luego el resto). Ambos aceptan `a/b:stream`, `CON`, `a.`, `A.md`+`a.md` y conflicto fichero/directorio (no son traversal; en Windows `:stream` crea un ADS dentro del temporal privado; solo atestado: I-4).
- Inyeccion: sin shell en ninguna llamada; los valores derivados del lock pasan por `VERSION`, `DIGEST` y regex de slug; `--profile`/`--version`/`--trust-repo` validados o comparados; `git add -- <rutas>` con `--` (las rutas son nombres de la release atestada; sondee `git add` con rutas gestionadas y no hay pathspec magic en ellas).
- `git add` de lo gestionado e idempotencia (`ke.mjs`): `--keep-existing` con `CLAUDE.md` versionado y modificado sin stage deja el contenido del usuario y NO lo stagea; `.mcp.json` sin versionar del usuario tampoco se stagea. Segunda ejecucion: `ALREADY_ADOPTED (no file changed)`, `status` + indice + arbol identicos.
- El motor invocado a mano es una frontera nueva (P-06): acepta registro, `--bundle`, `--revocations` y `--offline` del llamante; documentado como interno pero accesible por el CLI del bundle.

## H. Hallazgos abiertos

| ID | Sev | Pts | Tipo | Descripcion / evidencia | Correccion y verificacion |
|---|---|--:|---|---|---|
| N-12 | MINOR | 0.50 Q6.4 (+0.25 Q6.4 no verificado) | ROTO | `release.yml` publica tags `vX.Y.Z-alpha.N|-rc.N` (`on.push.tags`, `--prerelease`), pero el paso de aceptacion del job `verify` ejecuta `node pub/ai-native-cli.mjs init --version "$VERSION" ...` y `verify-release.mjs` lo exige para todo `hasCliAsset(tag)` (incluido `v3.2.0-rc.1`: lo afirma el test nuevo). El lanzador rechaza `--version` no estable: `main(["init","--version","v3.2.0-rc.1"])` => `invalid --version: v3.2.0-rc.1 (only stable releases...)` (n09.mjs). Resultado: toda pre-release >= v3.2 publicaria y luego fallaria su `verify` (release inmutable publicada con verificacion roja). No afecta a `v3.2.0` estable. Tambien NO VERIFICADO el primer `publish`/`verify` con el asset | Condicionar el paso de aceptacion y su equivalente en `verify-release.mjs` a tags estables (`hasCliAsset` solo estable) o permitir al lanzador `--version` de pre-release solo para verificacion; test con rc |
| N-13 | MINOR | 0.50 Q5.5 + 0.25 Q1.3 | RIESGO / DRIFT | `ci.yml` (CI por PR, matriz ubuntu + windows) no ejecuta `runtime/cli/*.test.mjs` (24 tests, incluida la prueba critica repo vacio -> READY) ni `scripts/*.test.mjs` (incluido el guardia del README): grep de `node --test` en `ci.yml`. Solo corren en `release.yml` build (Linux, en tag o en PR cuyo diff toque `.github/workflows/release.yml`, `runtime/release/**`, `runtime/bootstrap/**`, `runtime/main.mjs`, `governance/versioning/**`). Una PR que toque solo `runtime/cli/**`, `README.md` o `scripts/**` no las ejecuta; `validate-ci-tests-listed` cuenta `release.yml` como "un workflow" y no lo detecta. Fue verde en 50ac151 solo porque esa PR toco `runtime/bootstrap`. `V3.2.0-RELEASE.md` afirma "la matriz validators ejecuta todos" y que el guardia N-11 "ya corre en la suite de CI" | Anadir `runtime/cli/*.test.mjs` y `scripts/*.test.mjs` a `ci.yml` y extender `release.yml` `paths` con `runtime/cli/**`, `scripts/**` y `README.md`; o corregir el texto |
| N-11r | MINOR | 0.25 Q4.2 | INCOMPLETO | Guardia del README parcial (seccion G, N-11): 6 de 18 mutaciones de ruta/separador/repo no se detectan | Validar cada ocurrencia de `$dl`/`~/.ai-native` seguida de separador, y ejecutar el bloque en el job `verify` tras publicar |
| N-14 | MINOR | 0.25 Q4.2 | ROTO | El bloque "Once per machine" del README no se puede re-ejecutar: `gh release download` sin `--clobber` falla con `already exists` si `~/.ai-native/dl/ai-native-cli.mjs` existe (G-30), y como la cadena es `&&`/`if ($?)`, no verifica ni instala. Impide actualizar el comando con el mismo bloque; el segundo uso exige borrar el fichero a mano | Anadir `--clobber` al `gh release download` y actualizar el guardia |
| N-15 | MINOR | 0.25 Q1.3 | OBSOLETO | `governance/SESSION-CONTEXT.md` l.7 "Actualizado: 2026-10-12", `STATUS: N02B_CLOSED_AND_PATCH_RELEASED` y l.16 "PR abierta, pendiente de revision y merge humanos" cuando `7e74618` ya es el merge de la PR #113 | Actualizar el estado al merge (candidata fusionada, pendiente de publicar) |
| P-06r | MINOR | 0.25 Q7.5 | RIESGO | Ver P-06: `ATTESTATION: PASS` afirmado desde un registro JSON del llamante en el motor invocado a mano (G-23); el registro se persiste en la cache | Que el motor solo acepte el registro firmado por un secreto local o que reporte `ATTESTATION: PROVIDED` en vez de `PASS` si no lo verifico el mismo |
| F-02 | MINOR | 0.75 Q6.2 + 0.50 Q8.3 | RIESGO | Heredado, re-verificado hoy: ruleset `ai-native-main` con `required_approving_review_count: 0`, `require_code_owner_review: false` | Segundo mantenedor/code owner o control equivalente documentado |
| F-03 | MINOR | 0.75 Q7.1 | NO VERIFICADO | Heredado: revocacion de claves antiguas, accion humana | Ejecutarla y documentarla |
| F-04 | MINOR | 0.50 Q7.3 | FALTA | Heredado, re-verificado: un solo ruleset (rama), `release.yml` sin `environment:`. Abarca P-08 | Ruleset de tags + Environment |
| F-05 | MINOR | 1.00 Q5.3 | RIESGO | Re-verificado: suite no determinista en Windows (G-12..G-14), `Permission denied` en `.git/objects` en los tests de `runtime/adapters` y `runtime/consumer` (git del propio test, sin el reintento del motor). No toca la suite nueva | 3 corridas completas verdes o eliminar la causa (reintento en los helpers de test) |
| F-06 | MINOR | 0.75 Q2.2 | SOBRA | Re-verificado: `governance/cleanup/M7-INVENTORY.md` l.33 y l.51 con `C:/Proyectos/_m6/` | Sustituir por descripcion relativa |
| F-08 | MINOR | 0.50 Q4.5 | INCOMPLETO | Re-verificado: el README no documenta ninguno de los codigos de error de v3.1.3/v3.2.0 | Seccion de problemas frecuentes |
| F-10 | MINOR | 0.50 Q7.2 | RIESGO | Re-verificado: alerta #27 `actions/untrusted-checkout/medium` abierta | Corregir o descartar con justificacion |
| F-11 | MINOR | 0.75 Q5.2 | NO VERIFICADO | Re-verificado: `l3-consumer.yml` solo `workflow_call`, sin llamador | Llamador o canary |
| F-22 | MINOR | 0.50 Q6.6 | ROTO | Re-verificado: `runtime/bootstrap/install.mjs:40` `order = [...]` no conserva `productDir`/`governance` | `canonical` conserva los campos + test |
| F-23 | MINOR | 0.50 Q7.3 | RIESGO | Re-verificado: `ci.yml:208` ejecuta `hitl.mjs` del checkout de la PR | Ejecutar desde la base |
| N-08 | MINOR | 0.50 Q6.6 | ROTO | Heredado: falso positivo en el rollback a v2; `runtime/migrate`/`consumer` sin cambios (G-15), no re-sondeado | Ver informe de `83c4610` |

Informativos (0 puntos): **I-1** `git rm --cached` sin `-f` deja `AM` si el usuario edita un gestionado durante la ejecucion (`ROLLBACK_INCOMPLETE` honesto). **I-2** el rollback pierde el bit `skip-worktree` (detectado, honesto). **I-3** `STABLE` acepta ceros a la izquierda (`v03.2.0`). **I-4** el lector tar acepta `:` y nombres reservados de Windows (solo contenido atestado). **I-5** `STAGED: 47 file(s)` cuenta tambien rutas que `--keep-existing` dejo sin stagear (cosmetico). **I-6** el lanzador no filtra draft/prerelease al elegir la lista de revocaciones (la attestation decide). **I-7** el motor verifica la lista de revocaciones con `--repo` sin `--signer-workflow`. **I-8** `--trust-repo ../..` lo admite la regex (exige la orden explicita). **I-9** busqueda de `git.exe`/`gh.exe` en cwd solo probada en Node 26.11.1.

## I. Camino a 100

Perdidas: Q1.3 0.5 (N-13 0.25 + N-15 0.25) + Q2.2 0.75 (F-06) + Q4.2 0.5 (N-11r + N-14) + Q4.5 0.5 (F-08) + Q5.2 0.75 (F-11) + Q5.3 1.0 (F-05) + Q5.5 0.5 (N-13) + Q6.2 0.75 y Q8.3 0.5 (F-02) + Q6.4 0.75 (N-12 0.5 + no verificado 0.25) + Q6.6 1.0 (F-22 + N-08) + Q7.1 0.75 (F-03) + Q7.2 0.5 (F-10) + Q7.3 1.0 (F-04 + F-23) + Q7.5 0.25 (P-06r) = 10.0. 90.0 + 10.0 = 100. Orden recomendado antes de publicar: N-12 y N-13 (tocan el flujo de release y el CI), N-14 y N-15 (texto), luego publicar y re-ejecutar `verify-release.mjs v3.2.0` para cerrar el 0.25 no verificado.

Comprobacion de consistencia: toda perdida tiene causa y criterio asociado; los informativos no restan; el camino a 100 suma exactamente 10.0; sin N/A; ningun gate global se activa (0 BLOCKER, 0 CRITICAL, 0 MAJOR). Heredados no tocados por el delta (F-02, F-03, F-04, F-06, F-08, F-10, F-11, F-22, F-23, N-08) se arrastran como en los informes anteriores; F-02, F-04, F-06, F-08, F-10, F-11, F-22, F-23 los re-verifique hoy con comandos; F-03 y N-08 no (F-03 no es verificable; N-08 vive en `runtime/migrate/`, byte a byte igual a v3.1.3 por G-15). F-01 (README `v3.0.2`) ya no existe en este commit.

Juicio: el score cae exactamente en 90.00 y las dos decisiones de redondeo que importan son (a) cobrar 0.25 por lo NO VERIFICADO del primer publish (QUALITY_SCORE 16) y (b) tratar N-13 como MINOR y no MAJOR, porque el CI de release (build, con la suite completa en Linux) si bloquea el publish y la suite paso en 50ac151. Si un revisor discrepara en cualquiera, el veredicto cambiaria. Para v3.2.0 estable el resultado es APTO.

## J. Resultado de `release-gate`

Orden: `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 7e7461892b8353db13c280f41ce11e026ea3b628 --root .` (exit 0). Salida verbatim (este informe no genera aviso: es el vigente para el candidato; los 14 avisos son los informes anteriores, STALE y ignorados por el gate):

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
exit=0
```
