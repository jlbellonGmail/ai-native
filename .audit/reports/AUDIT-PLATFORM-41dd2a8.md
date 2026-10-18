---
targetRepo: jlbellonGmail/ai-native
targetCommit: 41dd2a8d23a0856b1aace94e00cefe150efc6c96
platform:
  version: v3.0.0-dev
  commit: 41dd2a8d23a0856b1aace94e00cefe150efc6c96
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-13T12:00:00Z
scope: audit of the candidate v3.2.0 (main @ 41dd2a8, PR #110 merged), git diff v3.1.3..41dd2a8 (18 files; new public command `ai-native init`: runtime/cli/ai-native.mjs, runtime/bootstrap/adopt.mjs, profile-infer.mjs, subcommand adopt, runtime/release/build.mjs, release.yml, scripts/verify-release.mjs, README.md, V3.2.0-RELEASE.md and tests) with adversarial supply-chain probing, and re-verification of inherited findings
score: 87.5
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ 41dd2a8 (candidata v3.2.0, `ai-native init`)

## A. Identificacion

- Repositorio jlbellonGmail/ai-native; checkout local `C:/Proyectos/ai-native`, rama `main`, HEAD = `41dd2a8d23a0856b1aace94e00cefe150efc6c96` (`git rev-parse HEAD`, arbol limpio al empezar: `git status --porcelain` vacio). `VERSION` = `3.0.0-dev`. Ultima release publicada: `v3.1.3` (inmutable, verificado por `gh api`: `immutable: true`). v3.2.0 NO esta publicada (sin tag): se audita una CANDIDATA ya fusionada en `main`.
- Perfil PLATFORM 1.2; QUALITY_SCORE 1.1; AUDIT_RULES 1.1; auditMethod 1.2. Node v26, Windows 11, Git Bash. GitHub solo con GET (`gh api`: releases, rulesets, check-runs, code scanning).
- Plantillas: `AUDIT-PLATFORM-ad7af81.md` y `AUDIT-PLATFORM-83c4610.md`. Ninguna conclusion heredada se copia sin re-verificar. Unico fichero escrito en el repo: este informe. Las sondas viven en el directorio scratchpad de la sesion, fuera del repo.

## B. Veredicto

```
Score bruto: 87.50/100
Quality Gate aplicado: ninguno (0 BLOCKER, 0 CRITICAL; validadores PASS; 57/57 tests de las suites tocadas)
Score final: 87.50/100
Confianza: MEDIA (el primer `ai-native init` real contra GitHub es imposible hasta publicar v3.2.0; `release.yml` publish/verify no ejercitado; F-03, F-11 no verificables; suite completa NO re-ejecutada; los 9 consumidores reales NO accesibles)
Estado: NO APTO para release (87.50 < 90, umbral por defecto del release-gate)
Hallazgos: BLOCKER 0 / CRITICAL 0 / MAJOR 4 / MINOR 4 nuevos + 11 heredados (con puntos) / informativos 8
```

La compatibilidad con los consumidores esta intacta (seccion F.5). El defecto esta en la capa nueva: el lanzador y el motor `adopt` declaran garantias de cadena de suministro que el codigo no cumple del todo (la raiz de confianza la elige el contenido del repositorio, la revocacion la aplica el propio codigo de la release a revocar, el rollback deja el indice sucio) y la instruccion de instalacion para PowerShell esta rota. Ninguno apaga el control de attestation (no hay forma de saltarlo: `gh` ausente/fallido => fail closed, verificado), por eso no se clasifican CRITICAL; ver la discusion de P-01 en la seccion I.

## C. Alcance y limitaciones

Inspeccionado: `git diff v3.1.3..41dd2a8` (18 ficheros, +1450/-19) completo. `git diff v3.1.3 -- contracts core profiles runtime/adapters runtime/migrate runtime/consumer` = vacio (comprobado). Lectura integral de `runtime/cli/ai-native.mjs`, `runtime/bootstrap/adopt.mjs`, `profile-infer.mjs`, el subcomando `adopt` de `cli.mjs`, `build.mjs`, el diff de `release.yml` y `verify-release.mjs`, `README.md`, `V3.2.0-RELEASE.md`, y la lista de tests de las tres suites nuevas.

NO_RUN / NO VERIFICADO: (1) `ai-native init` real contra GitHub (el motor vive dentro de la release; el repo lo declara); (2) pasos `publish` y `verify` de `release.yml`, incluido el acceptance test desde el asset publicado, que solo corren con tag; (3) comportamiento de `gh attestation verify` real con `--signer-workflow` frente a un attestation emitido desde otra rama/tag (solo razonado, P-08); (4) la suite completa `test-hermetic.mjs` (solo se ejecutaron las suites tocadas); (5) los 9 consumidores reales (solo se argumenta por diff vacio de las rutas contractuales); (6) Linux/macOS (solo Windows local; CI en verde en ubuntu y windows segun `gh api` check-runs); (7) revocacion de claves (F-03); (8) comportamiento de `spawnSync` con ejecutables plantados en el cwd en Node < 26 (ver I-14).

## D. Matriz de puntuacion

| Area | Max | Obtenido |
|---|--:|--:|
| Q1 | 12 | 11.25 |
| Q2 | 12 | 11.25 |
| Q3 | 12 | 12.00 |
| Q4 | 12 | 10.00 |
| Q5 | 16 | 13.50 |
| Q6 | 16 | 13.75 |
| Q7 | 12 | 8.25 |
| Q8 | 8 | 7.50 |
| **Total** | **100** | **87.50** |

Aritmetica: 11.25+11.25+12+10+13.5+13.75+8.25+7.5 = 87.50; perdidas 0.75+0.75+0+2.0+2.5+2.25+3.75+0.5 = 12.50. Sin N/A. Respecto de `83c4610` (91.75): Q1 sin cambio (F-01 cerrado, +0.75; P-05 consume ese escalon); Q4 -1.5 (P-04); Q5 -0.75 (P-02, hueco de test); Q6 -0.5 (P-02 sobre el escalon ya parcial de Q6.6); Q7 -1.5 (P-01, P-03 sobre Q7.5).

## E. Subcriterios con perdida (el resto COMPLETO)

| ID | Max | Nivel | Obt. | Hallazgo |
|---|--:|---|--:|---|
| Q1.3 | 3 | MENOR | 2.25 | P-05 (afirmacion de cache "reverificada en cada lectura" vs codigo); F-01 cerrado |
| Q2.2 | 3 | MENOR | 2.25 | F-06 |
| Q4.2 | 3 | PARCIAL | 1.5 | P-04 (instalacion PowerShell rota) |
| Q4.5 | 2 | PARCIAL | 1.5 | F-08 |
| Q5.2 | 3 | MENOR | 2.25 | F-11 |
| Q5.3 | 4 | MENOR | 3.0 | F-05 |
| Q5.4 | 3 | MENOR | 2.25 | P-02 (rollback post-stage sin test; CAUSA RAIZ COMPARTIDA con Q6.6) |
| Q6.2 | 3 | MENOR | 2.25 | F-02 |
| Q6.6 | 2 | DEBIL | 0.5 | F-22 (0.5) + N-08 (0.5) + P-02 (0.5) |
| Q7.1 | 3 | MENOR | 2.25 | F-03 |
| Q7.2 | 2 | MENOR | 1.5 | F-10 |
| Q7.3 | 2 | PARCIAL | 1.0 | F-04 (0.5) + F-23 (0.5) |
| Q7.5 | 3 | PARCIAL | 1.5 | P-01 (1.0) + P-03 (0.5) |
| Q8.3 | 2 | MENOR | 1.5 | F-02 (causa compartida con Q6.2) |

Por area: Q1 0.75; Q2 0.75; Q4 1.5+0.5 = 2.0; Q5 0.75+1.0+0.75 = 2.5; Q6 0.75+1.5 = 2.25; Q7 0.75+0.5+1.0+1.5 = 3.75; Q8 0.5. Total 12.5.

## F. Ledger de verificacion (comandos ejecutados por mi)

| ID | Comando | Resultado |
|---|---|---|
| G-01 | `node runtime/audit/cli.mjs check` | PASS (exit 0) |
| G-02 | `node runtime/docs/validate-doc-drift.mjs` | PASS (exit 0) |
| G-03 | `node parity/validate-parity.mjs` | exit 0; par-tests 95/95, unmapped=0 |
| G-04 | `node contracts/validate-contracts.mjs` | PASS (exit 0) |
| G-05 | `node core/validate-core.mjs` | exit 0 |
| G-06 | `node evaluation/compat/validate-compat-matrix.mjs` | PASS (29 checks) |
| G-07 | `node scripts/validate-ci-tests-listed.mjs` | PASS: 94 `*.test.mjs` ejecutados por un workflow |
| G-08 | `node scripts/validate-actions-pinned.mjs` | PASS |
| G-09 | `node runtime/status/validate-integrity.mjs` | PASS |
| G-10 | `node --test --test-concurrency=1 runtime/cli/ai-native.test.mjs runtime/bootstrap/adopt.test.mjs runtime/bootstrap/profile-infer.test.mjs scripts/verify-release.test.mjs runtime/release/release.test.mjs` | 57 tests, 57 pass, 0 fail, 56.8 s, exit 0 (cli 16, adopt 15, profile-infer 5: coinciden con V3.2.0-RELEASE.md) |
| G-11 | `git diff v3.1.3 -- contracts core profiles runtime/adapters runtime/migrate runtime/consumer` | vacio (0 bytes) |
| G-12 | `git grep "3\.1\.4"` fuera de `.audit/` | 1 coincidencia: `V3.2.0-RELEASE.md:58`, la nota historica intencionada («se habia preparado como v3.1.4»); ningun texto normativo trata la capacidad como v3.1.4 |
| G-13 | `gh api` GET: releases, check-runs de 41dd2a8, rulesets, code scanning | v3.1.1-3 `immutable: true` (el campo existe en la API); CI verde (validators ubuntu/windows, pilots, sbom, trivy, analyze); ruleset `ai-native-main` con `required_approving_review_count: 0`; alerta #27 abierta |
| G-14 | Sonda `p1.mjs`: `git.exe`/`gh.exe` plantados en el cwd, `spawnSync("git")` y `spawnSync("gh")` | NO ejecutan el plantado en Node 26 (devuelve el git/gh reales): refutado aqui, ver I-14 |
| G-15 | Sonda `p2.mjs`: `main(["init"])` con un `ai-native.lock.json` cuyo `platform.repo` es `github:evil/ai-native` y digest coherente con el bundle | descarga `https://github.com/evil/ai-native/releases/download/...`, ejecuta `gh attestation verify --repo evil/ai-native --signer-workflow evil/ai-native/.github/workflows/release.yml` y entrega el control al motor del bundle: P-01 |
| G-16 | Sonda `p3.mjs`: `adopt()` con fallo forzado DESPUES de `stage()` (el directorio `attestations` de la cache es un fichero) en repo vacio y en repo con `.ai-native/keep.txt` versionado | `adoption: ROLLED_BACK (nothing was left in the repository)` pero `git status` muestra ~49 entradas `AD` (indice con los ficheros gestionados, arbol sin ellos) y `D  .ai-native/keep.txt` (borrado STAGED de un fichero versionado del usuario): P-02 |
| G-17 | Sonda `p4.mjs`: cache con `releases/<hex>/runtime/bootstrap/cli.mjs` arbitrario y `attestations/<hex>.json` = `{}`, lock fijando ese digest, `main(["init","--offline"])` | ejecuta el cli.mjs de la cache ("UNVERIFIED CODE RAN"), exit 0: P-05 |
| G-18 | Lectura de `README.md:34-46` con `cat -A` | bloque PowerShell: `--dir $HOME.ai-nativedl`, `$HOME.ai-nativedlai-native-cli.mjs` (se perdieron las barras invertidas): P-04 |
| G-19 | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 41dd2a8...` | antes de este informe: ERROR (sin informe del commit; los previos STALE). Resultado con este informe en la seccion I |

### F.1 Lanzador `runtime/cli/ai-native.mjs`: lo que SI se sostiene (fail-closed verificado por lectura y por tests)

- Sin `gh` (`r.error`) o con `status !== 0` (incluido terminado por senal) => `Fail` antes de desempaquetar o ejecutar nada; no hay flag que lo evite (`--offline` solo evita la red, y exige registro + release en cache).
- El digest publicado (API) o fijado (lock) se compara con el sha256 de los bytes descargados antes de `gh`; `gh attestation verify` se ejecuta sobre el MISMO fichero que luego se desempaqueta (`bytes` en memoria, `bundle` en disco con el mismo contenido); el `platform.version` del bundle debe coincidir con el tag pedido (evita servir otro bundle atestado, p. ej. uno viejo vulnerable, bajo un tag nuevo).
- Valores derivados del lock: `version` con `VERSION`, `digest` con `^sha256:[0-9a-f]{64}$`, `slug` con `^github:[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$` antes de construir URL o ruta (test `a lock is repository content...`); `--version` validado con `VERSION`; `--profile` solo se acepta si esta en los perfiles del bundle; los argumentos al motor se pasan como array (sin shell): sin inyeccion de comandos.
- Extraccion tar: solo ficheros regulares y directorios, sin `..`, `.`, vacios, `\`, rutas absolutas ni letra de unidad, sin duplicados, checksum de cabecera; se ejecuta DESPUES de la attestation y escribe en un `mkdtemp` propio, que se borra en `finally`.
- Filtrado de `latestStable`: ni draft, ni prerelease, ni no-SemVer-estable, ni `immutable === false`; el campo `immutable` existe en la API real (G-13), de modo que el filtro no es vacuo para v3.1.x.
- Windows: `repoFacts` compara `realpathSync.native` sin distinguir mayusculas; el shim `.cmd` usa CRLF y la ruta nativa; probados en la matriz windows-latest (CI verde).
- Idempotencia: segunda ejecucion sobre un repo adoptado: `ALREADY_ADOPTED`, bytes iguales (test del repo, ejecutado 57/57).

### F.2 Release / `verify-release`

- `build.mjs` emite `ai-native-cli.mjs` desde el blob del commit (`readShippedFiles`), lo incluye en `SHA256SUMS`, `release.yml` lo atesta (`subject-path`), lo sube, lo descarga en `verify` y lo verifica con `--signer-workflow`. `release.test.mjs` fija que el asset es byte a byte `git show <commit>:runtime/cli/ai-native.mjs`. `hasCliAsset` (`>= 3.2`) no exige el asset a v3.1.x (inmutables). `expectedAssets` lanza `TypeError` si el tag no casa con `^v\d+\.\d+\.\d+` (ver I-15; fail closed).
- El acceptance test desde el asset publicado corre DESPUES de publicar una release inmutable: si falla, la release ya es irretirable (declarado en V3.2.0-RELEASE.md «Limites honestos»; I-16).

### F.3 Motor `adopt.mjs`

- Registro de attestation: el motor exige `verifiedBy === "gh attestation verify"` y `record.digest === sha256(bytes)`; sin registro (ni propio ni en cache) => `ATTESTATION_NOT_VERIFIED`. Pero el registro es un fichero JSON sin autenticacion (P-06).
- Orden: digest -> registro -> `readTar` -> `platform.json` -> version -> revocaciones -> perfil -> cache -> `planConsumer` ANTES de tocar el proyecto -> `init` -> `sync` -> `applyConsumer` -> `checkTracking(onlyIgnored)` -> `git add` -> verify. El fallo antes de `wrote = true` no deja nada (test `.gitignore`); el fallo posterior invoca `rollbackFresh` (P-02).
- `stage()` pasa `--` y reintenta ante `Permission denied|index.lock`; los paths gestionados son nombres del bundle verificado (no se probaron nombres con magia de pathspec: I-17).

### F.4 Intentos de evasion y resultado

| Intento | Resultado |
|---|---|
| Sin `gh` / `gh` fallido / firmante distinto | fail closed (tests del repo + lectura) |
| Bundle con digest distinto al publicado / al del lock | `DIGEST_MISMATCH`, antes de `gh` y del motor |
| Bundle corrupto con attestation valida | lector estricto lo rechaza; `engine` no se ejecuta |
| Lock con version/digest/repo mal formados | rechazado antes de URL/ruta |
| Lock apuntando a OTRO repositorio bien formado | **ACEPTADO** (G-15): P-01 |
| Cache con motor alterado + registro `{}` | **EJECUTADO** (G-17): P-05 |
| Release revocada con motor propio malicioso | la comprobacion corre dentro del motor de esa release: P-03 (razonado; sonda no necesaria, es la arquitectura) |
| `--version` de un rc/alpha | permitido (VERSION admite `-alpha.N|-rc.N`); sin comprobacion de inmutabilidad; la attestation lo cubre: P-07 |
| Fallo tras `git add` | rollback incompleto (G-16): P-02 |
| `git.exe`/`gh.exe` en el cwd (Windows) | no ejecutado en Node 26 (G-14) |
| Symlinks en el bundle | tipo `2` => rechazado por `unsupported entry type` (lector) y no se publican (`readShippedFiles`) |

### F.5 Compatibilidad con los 9 consumidores adoptados

`git diff v3.1.3 -- contracts core profiles runtime/adapters runtime/migrate runtime/consumer` es vacio (G-11): esquema del lock, journals, proyecciones, launcher y drift son los mismos bytes. `adopt` solo COMPONE primitivas existentes (`init`, `sync`, `applyConsumer`, `detectDrift`, `checkTracking`). Sobre un consumidor ya adoptado en v3.1.2, `ai-native init` descarga su release fijada y falla cerrado con «predates ai-native init» sin escribir (lectura del flujo + test «a release from before...»). Los consumidores reales no se pudieron ejecutar (NO VERIFICADO, (5)). Texto: ningun documento normativo trata la capacidad como v3.1.4 (G-12); SESSION-CONTEXT y `V3.1.3-PATCH.md` se actualizaron coherentemente (v3.1.3 publicada).

## G. Hallazgos abiertos

| ID | Sev | Pts | Tipo | Descripcion / evidencia | Correccion y verificacion |
|---|---|--:|---|---|---|
| P-01 | MAJOR | 1.00 Q7.5 | RIESGO | **La raiz de confianza la elige el contenido del repositorio.** Con `ai-native.lock.json` presente, `o.slug` sale de `platform.repo` (`ai-native.mjs:173`), y el lanzador descarga de `github.com/<slug>`, ejecuta `gh attestation verify --repo <slug> --signer-workflow <slug>/.github/workflows/release.yml` y entrega el control al motor del bundle. Un repositorio hostil clonado por la victima, con un lock `github:evil/ai-native`, hace que `ai-native init` (presentado en el README como comando verificador, «on an adopted repository it only re-verifies») ejecute codigo de la release del atacante, atestado por su propio workflow (G-15). El comentario de cabecera dice «the official repository» y el commit `130d37d` «no confia en repo del lock»: solo valida la FORMA (regex), no el valor. El diseno de lock con `repo` ya existia (sync), pero ahora el primer codigo que corre antes de verificar lo obedece. No hay allowlist de propietarios, ni aviso/confirmacion cuando `slug !== OFFICIAL_REPO`, ni flag `--repo` explicito para optar. | Si `slug !== OFFICIAL_REPO`, exigir opt-in explicito (`--trust-repo owner/repo` o variable de entorno del usuario, nunca del repo) y avisar; test con lock de repo ajeno que espere fallo. |
| P-02 | MAJOR | 0.50 Q6.6 + 0.75 Q5.4 | ROTO | **El rollback tras `git add` es incompleto y puede destruir estado del usuario.** `rollbackFresh` hace `revertAdoption` + `rm lock` + `git rm --cached -r .ai-native lock` solo; los demas ficheros ya en el indice (`.claude/**`, `.codex/**`, `.opencode/**`, `CLAUDE.md`, `.mcp.json`, `opencode.json`, ~49 en la sonda) quedan como `AD` (en indice, borrados del arbol): un `git commit` posterior los comitearia sin lock ni journal. Peor: `git rm --cached -r .ai-native` borra DEL INDICE cualquier fichero versionado preexistente bajo `.ai-native/` (G-16: `D  .ai-native/keep.txt`, el fichero queda como no versionado). El resultado dice `ROLLED_BACK (nothing was left in the repository)`, lo cual es falso (Q8.3). Camino alcanzable: cualquier error de `verify()` o `writeAttestation` tras `stage()`. El unico test de rollback (`.gitignore`) falla ANTES de `stage()`, de modo que no cubre este camino. CAUSA RAIZ COMPARTIDA entre Q6.6 y Q5.4. | Rollback por journal+`git reset -q -- <paths gestionados>` solo para lo que esta corrida anadio (capturar el indice antes: `git ls-files`), no `rm --cached -r .ai-native`; test con fallo inyectado post-stage afirmando `git status --porcelain` identico al inicial, con y sin ficheros previos en `.ai-native/`. |
| P-03 | MAJOR | 0.50 Q7.5 | RIESGO | **La revocacion la aplica el codigo de la release a revocar.** El lanzador no consulta revocaciones; `fetchRevocations` y la comprobacion `revoked` viven en `adopt.mjs`, dentro del bundle que acaba de entregar el control. Una release comprometida o con un motor malicioso (precisamente el caso para el que existe una revocacion) omite su propia revocacion; `latestStable` tampoco la filtra, de modo que tras revocar la ultima estable el comando seguiria eligiendola y ejecutando su motor. La garantia de V3.2.0-RELEASE.md («release revocada ... nada se escribe») solo es cierta para releases honestas. El lanzador es el unico codigo previo a la verificacion y podria leer `revocations-<n>.json` (ya atestado) sin dependencias. | Que el lanzador descargue y verifique el asset de revocaciones y rechace la version/commit antes de ceder el control (o documentar el limite como «revocacion = aviso para releases honestas» y no declararlo garantia). |
| P-04 | MAJOR | 1.50 Q4.2 | ROTO | **Instruccion de instalacion para PowerShell rota.** `README.md:43-45`: `--dir $HOME.ai-nativedl`, `$HOME.ai-nativedlai-native-cli.mjs` (se perdieron las barras invertidas, la misma clase de «escapes perdidos» del commit `5049a2b`). La ruta resultante no existe, `gh attestation verify` falla y `install` no se ejecuta: fail closed pero la via documentada para Windows (la plataforma del mantenedor) no funciona. El bloque bash tambien perdio sus continuaciones (una sola linea con tres espacios; funciona). El validador de doc drift no lo detecta (PASS). V3.2.0-RELEASE.md afirma «Windows y Linux: ... aserciones propias» para rutas y shims, no para el README. | Corregir las rutas (`Join-Path $HOME '.ai-native\dl'`) y anadir una comprobacion automatica de los bloques de comandos del README o ejecutarlos en CI. |
| P-05 | MINOR | 0.75 Q1.3 | ROTO | **Cache hit sin reverificar y afirmacion contraria.** Con digest conocido (lock o API) el lanzador comprueba solo `existsSync` de `releases/<hex>/runtime/bootstrap/cli.mjs` y de `attestations/<hex>.json` y EJECUTA ese cli.mjs (G-17, con registro `{}`); el hash de la cache lo recalcula el propio motor, que ya es el codigo alterado. V3.2.0-RELEASE.md afirma «la cache es direccionada por contenido y se reverifica en cada lectura» y «nunca se ejecuta codigo ... antes de verificarlo». Se declara el limite (usuario que controla `AI_NATIVE_CACHE`), por eso MINOR, pero la afirmacion de garantia es mas fuerte que el codigo. | Que el lanzador recalcule sha256 del blob y el arbol (o al menos verifique el hash de `cli.mjs` contra el manifiesto) antes de ejecutar, o corregir la redaccion. |
| P-06 | MINOR | 0 (causa compartida con P-05) | RIESGO | El registro de attestation no esta autenticado ni ligado al repo/firmante: `readAttestation` acepta cualquier JSON con `verifiedBy` y `digest` correctos (ignora `repo`, `signerWorkflow`, `verifiedAt`); el canal lanzador->motor (`--attestation-record <fichero>`) es un fichero en el directorio temporal. Quien pueda ejecutar `adopt` directamente o escribir la cache salta la attestation. Mismo modelo de usuario local declarado; informativo en puntos para no penalizar dos veces. | Ligar el registro (HMAC con clave de usuario o comparar `repo` con el lock); documentarlo. |
| P-07 | MINOR | 0 (sin criterio material adicional) | RIESGO | `--version` explicito: (a) admite `-alpha/-rc` y no comprueba inmutabilidad (solo el camino «ultima estable» filtra `immutable`), contra la fila «inmutabilidad» del documento; (b) sin lock y sin digest, ni `--offline --version vX` ni una ejecucion online reutilizan la cache (siempre descarga o falla); (c) con lock presente, `--version` y `--profile` se ignoran en silencio (el lock decide). La attestation cubre la integridad; es calidad de la fachada. | Avisar cuando se ignora una opcion; resolver el digest de la cache por version. |
| P-08 | MINOR | 0 (F-04 ya penaliza Q7.3) | RIESGO | `--signer-workflow` fija el workflow pero no el ref: una release atestada desde otra rama/tag de `release.yml` con permisos de escritura (no hay ruleset de tags: F-04) tambien pasaria. No se pudo ejercitar con `gh` real (NO VERIFICADO). | Anadir `--source-ref refs/tags/<tag>` o `--cert-identity` exacta; ruleset de tags. |
| P-09 | MINOR | 0 | RIESGO | Con digest tomado de la API de releases (no del lock), `digest?.replace(...)` se usa sin validar para construir `join(cache,"releases",hex)` y ejecutar el motor de esa ruta. Requiere que la API de GitHub mienta (TLS); el camino del lock SI esta validado (regex). Inconsistencia de endurecimiento. | Aplicar la misma regex `^sha256:[0-9a-f]{64}$` al digest de la API. |
| N-08 | MINOR | 0.50 Q6.6 | ROTO | Heredado de `83c4610`: falso positivo en el rollback completo a v2 (adopcion -> migracion). Sin cambios en el diff (rutas `migrate/` y `consumer/` vacias). | Ver informe previo. |
| F-02 | MINOR | 0.75 Q6.2 + 0.50 Q8.3 | RIESGO | Ruleset `ai-native-main`: `required_approving_review_count: 0`, `require_code_owner_review: false` (GET de hoy). | Segundo mantenedor/code owner o control equivalente documentado. |
| F-03 | MINOR | 0.75 Q7.1 | NO VERIFICADO | Revocacion de claves antiguas: accion humana. | Ejecutarla y documentarla. |
| F-04 | MINOR | 0.50 Q7.3 | FALTA | Un solo ruleset (rama); `release.yml` sin `environment:`. | Ruleset de tags + Environment. |
| F-05 | MINOR | 1.00 Q5.3 | RIESGO | Suite no determinista en Windows (firma `.git/objects ... Permission denied`). Esta auditoria ejecuto las suites tocadas con `--test-concurrency=1` (57/57 a la primera) pero no la suite completa ni tres corridas consecutivas; el motor ya reintenta `git add`. | 3 corridas verdes consecutivas o eliminar la causa. |
| F-06 | MINOR | 0.75 Q2.2 | SOBRA | `governance/cleanup/M7-INVENTORY.md` l.33 y l.51 con `C:/Proyectos/_m6/` (re-verificado). | Descripcion relativa. |
| F-08 | MINOR | 0.50 Q4.5 | INCOMPLETO | El README sigue sin mencionar `IGNORED_REQUIRED_FILE`, `MANAGED_FILE_NOT_REPRODUCIBLE`, `UNSAFE_PATH`, `ATTESTATION_UNAVAILABLE`, `PROFILE_REQUIRED` (grep = 0). Los nuevos mensajes de `init` merecian una entrada. | Seccion de problemas frecuentes. |
| F-10 | MINOR | 0.50 Q7.2 | RIESGO | Alerta #27 `actions/untrusted-checkout/medium` abierta (`l3-consumer.yml`). | Corregir o descartar con justificacion. |
| F-11 | MINOR | 0.75 Q5.2 | NO VERIFICADO | `l3-consumer.yml` sin llamador en este repo ni runs reales. | Llamador o canary. |
| F-22 | MINOR | 0.50 Q6.6 | ROTO | `install.mjs:42` `order = [...]` no conserva `productDir`/`governance`. Sin cambios. | `canonical` conserva los campos + test. |
| F-23 | MINOR | 0.50 Q7.3 | RIESGO | `ci.yml:208` ejecuta `hitl.mjs` del checkout de la PR. Sin cambios. | Ejecutar desde la base o plano de control. |
| F-01 | cerrado | 0 | — | `README.md` ya no fija «latest stable v3.0.2» («see the releases page»). Cerrado (+0.75 en Q1.3, consumido por P-05). | — |
| I-1..I-8 | informativo | 0 | — | Heredados (symlink gestionado, `.gitattributes` con filtros, regex inglesa de `isGitRepo`, CRLF, comparador por cadena exacta, traspaso de propiedad entre journals, desinstalacion indistinguible, symlink como journal no probado). | — |
| I-14 | informativo | 0 | — | Ejecutables plantados (`git.exe`, `gh.exe`) en el cwd del repo NO se ejecutan con Node 26 (G-14). El lanzador declara Node >= 20: el comportamiento en 20/22 no se comprobo (NO VERIFICADO). Mitigable usando rutas absolutas o `NoDefaultCurrentDirectoryInExePath`. | — |
| I-15 | informativo | 0 | — | `expectedAssets`/`hasCliAsset` lanzan `TypeError` ante un tag mal formado (fail closed); el test «malformed tag is a FAIL» lo cubre. | — |
| I-16 | informativo | 0 | — | El acceptance test desde el asset publicado corre tras publicar una release inmutable: un fallo obliga a publicar el siguiente parche (declarado). Los pasos `publish`/`verify` no se ejercitan en PR. | — |
| I-17 | informativo | 0 | — | `git add -- <paths>` sin `--literal-pathspecs`: nombres gestionados con `*`/`:(`... serian pathspec. Los nombres vienen del bundle atestado; sin explotacion. | — |
| I-18 | informativo | 0 | — | `unpack` del lanzador: tamaño no numerico en cabecera tar (`NaN`) y colision fichero/directorio (`a` y `a/b`) producen una excepcion no `Fail` (traza, exit != 0) en vez de un mensaje; solo tras attestation valida; fail closed. | — |
| I-19 | informativo | 0 | — | `install` copia el lanzador a `~/.ai-native/bin` sin autoactualizacion ni reverificacion posterior: el asset instalado es el que el usuario verifico en su momento (README). | — |
| I-20 | informativo | 0 | — | Perfil: `profile-infer` es de solo lectura, no adivina sin senal, nunca ofrece `testing`; sin TTY falla con `PROFILE_REQUIRED` y el comando exacto (verificado por tests). | — |

## H. Camino a 100

Perdidas: Q1.3 0.75 (P-05) + Q2.2 0.75 (F-06) + Q4.2 1.5 (P-04) + Q4.5 0.5 (F-08) + Q5.2 0.75 (F-11) + Q5.3 1.0 (F-05) + Q5.4 0.75 (P-02) + Q6.2 0.75 y Q8.3 0.5 (F-02) + Q6.6 1.5 (F-22 0.5, N-08 0.5, P-02 0.5) + Q7.1 0.75 (F-03) + Q7.2 0.5 (F-10) + Q7.3 1.0 (F-04 0.5, F-23 0.5) + Q7.5 1.5 (P-01 1.0, P-03 0.5) = 12.5. 87.5 + 12.5 = 100. Para superar el umbral de 90 basta cerrar los cuatro MAJOR: P-04 (+1.5) y P-02 (+1.25) y P-01/P-03 (+1.5) llevan a 91.75 aun con todo lo heredado abierto. Orden recomendado antes de publicar v3.2.0: P-01 (opt-in para repos ajenos), P-02 (rollback correcto + test post-stage), P-04 (README PowerShell; trivial), P-03 (decidir: filtrar en el lanzador o rebajar la redaccion de la garantia), luego P-05.

## I. Comprobacion de consistencia

- Toda perdida tiene causa; cada hallazgo puntuable se asocia a un criterio relacionado; P-06..P-09, informativos y cerrados no restan (sin doble penalizacion); el camino a 100 suma exactamente 12.5; sin N/A; ningun gate global se activa (0 BLOCKER, 0 CRITICAL; los validadores y las suites ejecutadas pasan).
- P-01 es el candidato a CRITICAL por el criterio «controles esenciales facilmente evitables». Lo mantengo MAJOR porque: (a) el control de attestation en si no se evade (se verifica contra la identidad que el lock nombra); (b) el modelo «el lock decide el repo» ya existia en `sync` desde v3.0; (c) requiere que la victima ejecute `ai-native init` dentro de un repositorio hostil. Un revisor que considere que el nuevo comando introduce una ejecucion pre-verificacion obediente al contenido del repo puede legitimamente reclasificarlo CRITICAL (tope 79): en ese caso el score final seria 79.
- P-02 es MAJOR (no CRITICAL): no hay perdida irrecuperable (el fichero del usuario sigue en disco, solo se desindexa; basta `git add`), pero el mensaje `ROLLED_BACK` es falso y el indice queda inconsistente.
- Juicio: sin regresion en lo heredado ni cambio de contrato para los 9 consumidores (diff vacio); la capa nueva es solida en su camino feliz y en la mayoria de los fail-closed (digest, `gh`, tar, validacion de lock), pero declara garantias mas fuertes que las que cumple.

Resultado de `release-gate` con este informe: ver el mensaje de cierre (se ejecuta tras escribir el fichero). Veredicto del auditor: **NO APTO** para release bajo el metodo (87.50 < 90).
