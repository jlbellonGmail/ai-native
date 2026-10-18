---
targetRepo: jlbellonGmail/ai-native
targetCommit: e4dee28409dbe34470bf3ca25837ed3d24bbbb10
platform:
  version: "3.0.0-dev; v3.3.0 candidate"
  commit: e4dee28409dbe34470bf3ca25837ed3d24bbbb10
auditMethod: "1.2"
profile: PLATFORM
date: "2026-10-16T21:06:13.904Z"
scope: "Independent pre-release PLATFORM 1.2 audit of exact SHA: CLI lifecycle, compatibility, release/supply chain, CI, GitHub policy, governance, and prior open findings."
score: 92.25
isMergeGate: false
---

# AI-NATIVE — PLATFORM 1.2 audit

## A. IDENTIFICACIÓN

```text
Repositorio: jlbellonGmail/ai-native
Ruta: C:\Proyectos\ai-native
Branch: main (audited base)
Commit: e4dee28409dbe34470bf3ca25837ed3d24bbbb10
Tag: none
Fecha: 2026-10-16T21:06:13.904Z
Worktree at audit start: CLEAN
Perfil: PLATFORM 1.2
QUALITY_SCORE: 1.1
AUDIT_RULES: 1.1
Audit method: 1.2
Auditor: separate read-only independent audit agent
Confianza: MEDIA
```

## B. VEREDICTO EJECUTIVO

```text
Score bruto: 92.25/100
Score final: 92.25/100
Puntos aplicables: 100
N/A: 0
Quality Gate aplicado: ninguno (G1/G2/G3 PASS)
Confianza: MEDIA
Estado: NO APTO PARA RELEASE — una MAJOR abierta
Decisión de release: STOP
```

El score numérico supera 90, y no hay BLOCKER ni CRITICAL. No se cumple el
requisito adicional de cero MAJOR: el Environment `ai-native-trust` permite a
administradores saltarse la protección de rama que restringe el acceso a los
secretos a `main`. No se observó ni se probó un bypass o una divulgación real.

El hallazgo rastreado F-001 de `ai-native-human-review` está cerrado remotamente;
el hallazgo nuevo F-001 de este informe corresponde a otro Environment y no es
el mismo hallazgo. B-01 y A-02 también están cerrados.

## C. ALCANCE Y LIMITACIONES

Se inspeccionaron el código, contratos, tests, documentación, workflows,
gobernanza, estado Git y configuración GitHub accesible por API para el SHA
exacto. Se revalidaron lifecycle CLI, CLI↔PLATFORM, CLI v3.2.0, B-01, A-02,
F-001, revocaciones, gates, distribución y findings previos relevantes.

* La publicación v3.3.0 es prospectiva: está condicionada a auditoría, release
  gate y decisión humana. Por ello, que el tag/release todavía no exista no se
  penaliza en Q6.4 bajo `AUDIT_PROMPT.md` §35. Sus assets futuros aún no pueden
  verificarse.
* La API no expone el historial de claves privadas de la GitHub App. La
  revocación de claves antiguas permanece `NO VERIFICADO`; no se afirma que una
  clave antigua siga activa.
* No se ejerció el bypass administrativo ni se encontró evidencia de
  despliegue off-main o exfiltración. La capacidad de bypass está confirmada
  por configuración y por la documentación oficial de GitHub.
* La invocación externa de `l3-consumer.yml` fijada a la versión actual no está
  demostrada por la evidencia C6 existente, que refiere a un blob anterior.
* El runner agregado `scripts/test-hermetic.mjs` no fue ejecutado; las suites
  pertinentes sí se ejecutaron por separado localmente y en CI exacto-SHA.
* Host local Windows: `CONTEXTUAL_NON_BLOCKING`, según instrucción; no se
  investigó su configuración.

## D. CONTRATO EVALUADO

| ID | Requisito | Clase | Evidencia actual |
|---|---|---|---|
| D-01 | Consumidor fija plataforma por versión, commit, digest y lock | OBLIGATORIO | `contracts/lock.schema.json`; CLI/bootstrap |
| D-02 | Una CLI atiende repositorios fijados de forma independiente | OBLIGATORIO | Lifecycle tests multi-repo |
| D-03 | `install`, `init`, `upgrade`, `detach`, `self-update`, `uninstall`, `--version` | OBLIGATORIO | `runtime/cli/ai-native.mjs`; README |
| D-04 | Protocolo CLI↔PLATFORM y compatibilidad fail-closed | OBLIGATORIO | `contracts/bootstrap-protocol.json`; `runtime/bootstrap/compat.mjs` |
| D-05 | Verificación de digest, attestation y revocaciones | OBLIGATORIO | CLI/bootstrap; limitación en F-009 |
| D-06 | Offline solo con caché verificada y advertencia sobre revocaciones | OBLIGATORIO | Bootstrap/lifecycle tests |
| D-07 | Detach legacy valida lock y solo quita el lock conocido | OBLIGATORIO | `runtime/bootstrap/detach.mjs`; tests B-01 |
| D-08 | Release reproducible, SBOM, checksums, provenance y revocaciones | OBLIGATORIO | Build/release workflow; candidata aún sin publicar |
| D-09 | Protección server-side y límites de confianza | OBLIGATORIO | Ruleset main; F-001 y F-005/F-008 |
| D-10 | Política/MCP default-deny | OBLIGATORIO | `core/security-policy.json`; `mcp/catalog.json` |

## E. PUNTUACIÓN POR ÁREA

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 12.00 | COMPLETO |
| Q2 Reutilización/limpieza | 12 | 11.25 | MENOR — F-002 |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentación/DX | 12 | 12.00 | COMPLETO |
| Q5 Tests/regresión | 16 | 14.50 | MENOR — F-003, F-004 |
| Q6 Git/CI/release | 16 | 14.75 | MENOR — F-005, F-006 |
| Q7 Seguridad/supply chain | 12 | 8.75 | PARCIAL — F-001, F-007–F-010 |
| Q8 Gobernanza | 8 | 7.00 | MENOR — F-005, F-011 |
| **TOTAL** | **100** | **92.25** | **STOP: 1 MAJOR** |

No hay criterios N/A.

## F. MATRIZ COMPLETA

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3 | `README.md:1–10,129–154`; versioning policy | — | Propósito, consumidores y versionado están definidos. |
| Q1.2 | Capacidades prometidas presentes | 3 | COMPLETO | 3 | `runtime/cli/ai-native.mjs`; lifecycle/bootstrap suites | — | Lifecycle, pinning, compatibilidad y fail-closed existen y están probados. |
| Q1.3 | Coherencia entre contrato, docs e implementación | 3 | COMPLETO | 3 | `contracts/bootstrap-protocol.json`; doc-drift PASS | — | Las declaraciones públicas coinciden en general; los gaps específicos se puntúan en Q7.5. |
| Q1.4 | Requisitos obligatorios completos | 3 | COMPLETO | 3 | B-01; release workflow; CI exact-SHA | — | B-01 cerrado; la publicación v3.3.0 es prospectiva y no se exige antes de esta auditoría. |
| Q2.1 | Inicialización reproducible | 3 | COMPLETO | 3 | CLI tests; bundle público v3.2.0 | — | `init` y alta de consumidor están implementados y probados. |
| Q2.2 | Sin residuos de proyecto/host | 3 | MENOR | 2.25 | `governance/cleanup/M7-CLOSURE.md:80–97` | F-002 | Hay rutas históricas `C:\Proyectos\...`; no afectan runtime ni el bundle. |
| Q2.3 | Configuración/customización clara | 3 | COMPLETO | 3 | `contracts/lock.schema.json`; README | — | Locks, perfiles, trust root y opciones son explícitos. |
| Q2.4 | Portabilidad/extensibilidad | 3 | COMPLETO | 3 | `.github/workflows/ci.yml:31–45,227–247`; lifecycle tests | — | Windows/Linux, offline y multi-repo están cubiertos. |
| Q3.1 | Estructura coherente | 3 | COMPLETO | 3 | `README.md:129–149`; runtime/contracts/core | — | Las áreas tienen límites claros. |
| Q3.2 | Separación de responsabilidades | 3 | COMPLETO | 3 | `runtime/cli/ai-native.mjs`; bootstrap engines | — | CLI delgada delega las operaciones al engine verificado. |
| Q3.3 | Simplicidad y duplicación justificada | 3 | COMPLETO | 3 | `package.json`; `runtime/release/bundle.mjs:20–31` | — | Dependencias mínimas; código previo a verificación justificado por trust boundary. |
| Q3.4 | Mantenibilidad/evolución | 3 | COMPLETO | 3 | Contratos, test map, doc-drift y release validators | — | Contratos y regresiones apoyan cambios. |
| Q4.1 | README funcional | 3 | COMPLETO | 3 | `README.md:12–93` | — | Onboarding y lifecycle son accionables. |
| Q4.2 | Instalación/bootstrap reproducibles | 3 | COMPLETO | 3 | README; CLI tests; CI exact-SHA | — | Bash/PowerShell y bootstrap público están documentados y probados. |
| Q4.3 | Operaciones comunes documentadas | 2 | COMPLETO | 2 | `README.md:55–93,151–176` | — | Instalación, lifecycle, validación y release están cubiertos. |
| Q4.4 | Convenciones de contribución | 2 | COMPLETO | 2 | `CONTRIBUTING.md`; `AGENTS.md` | — | Reglas de contribución y gobernanza están definidas. |
| Q4.5 | Ejemplos/troubleshooting | 2 | COMPLETO | 2 | `README.md:95–127` | — | Códigos fail-closed y remedios están explicados. |
| Q5.1 | Controles automáticos de calidad | 3 | COMPLETO | 3 | CI validators; pin/doc-drift | — | Validadores y workflows de seguridad corren automáticamente. |
| Q5.2 | Estrategia de tests adecuada | 3 | MENOR | 2.25 | `evaluation/compat/c6-evidence.json:5–7`; `runtime/pilot/c6.test.mjs:49–70` | F-003 | La invocación real C6 fija un blob antiguo; no demuestra llamada externa al workflow actual. |
| Q5.3 | Tests ejecutables y pasando | 4 | COMPLETO | 4 | Suites local exact-SHA; check-runs GitHub | — | Suites focalizadas y CI exacto pasaron. |
| Q5.4 | Regresiones críticas | 3 | COMPLETO | 3 | `runtime/bootstrap/detach.mjs:20–30,105–129`; lifecycle/rollback tests | — | Detach inválido, legacy y lifecycle tienen regresiones. |
| Q5.5 | Gates de calidad automáticos | 3 | MENOR | 2.25 | `scripts/validate-ci-tests-listed.mjs:14–18,26–44`; `ci.yml`; `release.yml:19–30` | F-004 | El test README-install pasa localmente, pero los filtros CI no aseguran activación en cambios solo README/test. |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3 | `CONTRIBUTING.md`; ruleset live | — | Integración a main basada en PR. |
| Q6.2 | Protección de rama/integración | 3 | MENOR | 2.25 | Ruleset `ai-native-main`: activo, strict, sin bypass, seis checks; approvals=0 | F-005 | Check server-side y frescura fuertes; no se exige aprobación independiente. |
| Q6.3 | CI fiable/reproducible | 3 | COMPLETO | 3 | CI exact-SHA y security workflows | — | Validators y workflows de seguridad/pilot pasaron. |
| Q6.4 | Versionado/releases | 3 | COMPLETO | 3 | `release.yml`; release v3.2.0; proceso v3.3.0 prospectivo | — | El proceso existe; no se penaliza no publicar antes de la auditoría/gate/HITL (§35). |
| Q6.5 | Build/artefactos reproducibles | 2 | COMPLETO | 2 | Dos builds exact-SHA; seis outputs byte-identical | — | Digest de bundle idéntico en ambas construcciones. |
| Q6.6 | Compatibilidad/migración/rollback | 2 | MENOR | 1.5 | `runtime/bootstrap/install.mjs:45–55,262–263`; `bootstrap.test.mjs:251–269` | F-006 | Rollback pierde `productDir` y `governance`, campos permitidos por el schema. |
| Q7.1 | Gestión de secretos | 3 | MENOR | 2.25 | Secrets env-scoped; `SECRETS-BOUNDARY.md:40–47` | F-007 | Revocación de claves antiguas `NO VERIFICADO`; no se afirma que sigan activas. |
| Q7.2 | Gestión de dependencias | 2 | COMPLETO | 2 | `package.json`; lockfile; acciones SHA-pinned | — | Dependencias mínimas, pinning y pin-check PASS. |
| Q7.3 | Seguridad CI/CD/automatizaciones | 2 | PARCIAL | 1 | Trust env API; rulesets; `release.yml:157–229`; `ci.yml:202–209` | F-001, F-008 | Bypass de secret-bearing env y gaps menores de enforcement; deducción compartida de 1 punto. |
| Q7.4 | Defaults seguros | 2 | COMPLETO | 2 | `core/security-policy.json`; `mcp/catalog.json`; validators | — | Política/MCP default-deny. |
| Q7.5 | Supply chain | 3 | PARCIAL | 1.5 | `adopt.mjs:191–195`; SBOM público v3.2.0; `release.yml:130–148` | F-009, F-010 | Engine acepta registro de attestation caller-supplied; SBOM no identifica raíz de producto. |
| Q8.1 | Fuente única de verdad | 2 | MENOR | 1.5 | `execution/current/README.md:11,44–45`; `SUMMARY.md:23–24`; PR #131 API | F-011 | El snapshot dice que PR #131 espera merge aunque está mergeada en el SHA auditado. |
| Q8.2 | Responsabilidades/límites | 2 | COMPLETO | 2 | `HITL-MERGE-POLICY.md:7–25,34–45` | — | La limitación de maintainer único está explícitamente documentada. |
| Q8.3 | Flujos deterministas/fail-safe | 2 | MENOR | 1.5 | `HITL-MERGE-POLICY.md:21,25,36–45`; ruleset approvals=0 | F-005 | D6 es política operativa más detección post-merge, no enforcement de identidad. |
| Q8.4 | Trazabilidad | 2 | COMPLETO | 2 | Checks exact-SHA; schema audit; tests hash-chain | — | Cambio, checks, release identity y evidencia se vinculan a commits. |

## G. VERIFICATION LEDGER

| ID | Verificación | Resultado | Estado | Evidencia |
|---|---|---|---|---|
| V01 | `git rev-parse HEAD`; `git status --short --branch`; `git diff --check` | SHA exacto; limpio; diff check limpio | PASS | `HEAD=e4dee28409dbe34470bf3ca25837ed3d24bbbb10` |
| V02 | `node --test runtime/cli/ai-native-lifecycle.test.mjs runtime/cli/ai-native.test.mjs` | 64/64 | PASS | Incluye install/init/upgrade/self-update/version/uninstall/detach, v3.2.0, offline y multi-repo |
| V03 | `node --test runtime/bootstrap/profile-infer.test.mjs runtime/bootstrap/bootstrap.test.mjs runtime/bootstrap/adopt.test.mjs` | 49/49 | PASS | Cache, rollback, traversal, attestation y fail-closed |
| V04 | `node contracts/validate-contracts.mjs`; `node --test contracts/validate-contracts.test.mjs` | 20 schemas, 7 data; 3/3 tests | PASS | Contratos y schema-lite |
| V05 | `node --test runtime/gates/trust-gate.test.mjs runtime/gates/secret-exposure.test.mjs runtime/gates/gates.test.mjs` | 62/62 | PASS | HITL, merge/trust gate, sources, secret exposure |
| V06 | `node runtime/docs/validate-doc-drift.mjs` | PASS | PASS | Direct execution |
| V07 | `node --test runtime/release/release.test.mjs runtime/release/cli-version.test.mjs runtime/release/assert-unreleased.test.mjs` | 30/30 | PASS | Bundle, revocations, CLI version, release guards |
| V08 | Pilot test files under `runtime/pilot/` | 55/55 | PASS | Pilot, online/offline fixtures and historical consumers |
| V09 | Dos builds `runtime/release/build.mjs --version v3.3.0 --commit e4dee284...` | Seis outputs byte-identical; bundle digest `sha256:85631c4b3ca897e035734c6df5014a775bf91cb4baf767ec98f870ac29e4b231` | PASS | Bundle de 226 archivos; outputs bajo `C:\TEMP\ai-native-tests/phase3-e4dee284-run{1,2}` |
| V10 | GitHub Actions runs/check-runs API para SHA exacto | Seis workflows y 11/11 checks completados success | PASS | Validators Ubuntu/Windows, pilot online/offline ambos OS, pin-check, SBOM, Trivy, CodeQL, supply-chain, CI |
| V11 | `node --test scripts/validate-readme-install.test.mjs` | 7/7 | PASS | README install examples, flags e interfaz |
| V12 | GitHub API `GET /rulesets/24405506` | `ai-native-main` active; strict=true; sin bypass; seis checks/sources intactos | PASS | Cuatro checks Actions 15368; dos trust-app 5170488; PR approvals=0 |
| V13 | GitHub API environments | `ai-native-human-review.can_admins_bypass=false`; reviewer `jlbellonGmail`; policy `main` | PASS | F-001 histórico cerrado |
| V14 | GitHub API `ai-native-trust` y deployment policies | `can_admins_bypass=true`; única policy de rama `main`; secretos TRUST_APP_* | VERIFIED | F-001 nuevo; docs oficiales indican admins pueden omitir protection rules y forzar deployments; no bypass observado |
| V15 | Tag/release v3.3.0 | Tag local/remoto ausente; API 404 | VERIFIED / PROSPECTIVE | Publicación es etapa posterior por diseño; sin pérdida en Q6.4 (§35) |
| V16 | SBOM público v3.2.0 | CycloneDX con metadata genérica `sbom-src`, sin components/dependencies | VERIFIED | Lista vacía puede ser correcta; falta identidad de raíz de producto (F-010) |
| V17 | Cross-repo C6 contra workflow L3 actual | La evidencia existente fija blob anterior | NO VERIFICADO | No hay caller probado contra el blob actual de `l3-consumer.yml` |
| V18 | Revocación histórica de private keys App | API no expone historial de keys | NO VERIFICADO | `SECRETS-BOUNDARY.md:40–47`; no se asume key activa |
| V19 | Ejecución real de bypass trust env | No realizada | NOT_RUN | La configuración confirma capacidad, no uso/divulgación |
| V20 | Release-gate | No ejecutado | NOT_RUN | Auditoría tiene una MAJOR; no se intentó release |
| V21 | Coherencia del snapshot current | PR #131 mergeada en e4dee; README/SUMMARY siguen diciendo waiting | VERIFIED | F-011, Q8.1 solamente |

## H. HALLAZGOS

**Nota de IDs:** el F-001 histórico de `ai-native-human-review` está cerrado.
El F-001 de este informe es un hallazgo nuevo sobre `ai-native-trust`.

| ID | Tipo | Severidad | Hallazgo | Criterio | Puntos |
|---|---|---|---|---|---:|
| F-001 | RIESGO / INCOMPLETO | **MAJOR** | `ai-native-trust` permite bypass administrativo de la protección de rama de su Environment con secretos | Q7.3 | Compartido en −1.00 Q7.3 con F-008 |
| F-002 | RESIDUO | MINOR | Registros históricos contienen rutas específicas de workstation | Q2.2 | −0.75 |
| F-003 | NO VERIFICADO | MINOR | No hay llamada externa verificada contra el blob actual de L3 consumer | Q5.2 | −0.75 |
| F-004 | INCOMPLETO | MINOR | El filtro de paths no asegura ejecutar el test README en cambios README/test-only | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | D6 no impone server-side una identidad humana independiente | Q6.2, Q8.3 | −1.25 |
| F-006 | ROTO / INCOMPLETO | MINOR | Rollback pierde campos opcionales permitidos del lock | Q6.6 | −0.50 |
| F-007 | NO VERIFICADO | MINOR | Revocación de claves privadas antiguas de App no verificable | Q7.1 | −0.75 |
| F-008 | RIESGO / INCOMPLETO | MINOR | No hay ruleset de tags y el policy check de CI ejecuta código de PR | Q7.3 | Compartido en −1.00 Q7.3 con F-001 |
| F-009 | RIESGO | MINOR | Engine directo acepta JSON caller-supplied como prueba de attestation | Q7.5 | −0.75 |
| F-010 | INCOMPLETO | MINOR | SBOM publicado v3.2.0 no identifica la plataforma ni sus componentes | Q7.5 | −0.75 |
| F-011 | CONTRADICTORIO | MINOR | Current execution dice que PR #131 sigue pendiente aunque está mergeada | Q8.1 | −0.50 |

### F-001 — Bypass administrativo del Environment de confianza

El GET actual de `ai-native-trust` devuelve `can_admins_bypass=true`, una
protección `branch_policy`, y política de despliegue custom que lista solo
`main`. El Environment contiene `TRUST_APP_ID` y `TRUST_APP_PRIVATE_KEY`.
`SECRETS-BOUNDARY.md:24–35` describe la restricción a `main` como control
preventivo para que workflows de ramas no reciban esos secretos. La
documentación oficial de GitHub indica que administradores pueden omitir las
protection rules y forzar deployments: [Environment protections](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments#allow-administrators-to-bypass-configured-protection-rules).

Esto demuestra una capacidad de bypass, no su uso. No se observó despliegue
off-main ni divulgación; los workflows trust/merge usan `pull_request_target`,
código del base y reciben el head como datos. La ruta de bypass en un
Environment de credenciales de confianza es MAJOR para el umbral solicitado,
no BLOCKER/CRITICAL. **Cierre:** deshabilitar
`ai-native-trust.can_admins_bypass`, mantener policy `main` y verificar por API
más un intento controlado desde rama no permitida.

### F-002 — Rutas de workstation en historia de gobernanza

`governance/cleanup/M7-CLOSURE.md:80–97` mantiene rutas `C:\Proyectos\...` y
nombres de artefactos locales. No afectan runtime ni bundle; impacto residual.
No se corrigió por instrucción de no remediar MINORs.

### F-003 — Invocación L3 externa no fijada al workflow actual

`evaluation/compat/c6-evidence.json:5–7` registra una llamada real que fija un
blob anterior de `.github/workflows/l3-consumer.yml`. El test revalida esa
evidencia histórica; no demuestra caller externo sobre el blob actual. Pilot
exact-SHA pasa, pero no sustituye esa llamada específica.

### F-004 — Activación del test de instalación README por filtros CI

`scripts/validate-readme-install.test.mjs` pasa localmente (7/7). El inventario
de tests y los globs de workflow encuentran scripts de test, pero filtros de
`ci.yml`/`release.yml` no garantizan el run cuando cambia solo README o ese test;
`validate-ci-tests-listed.mjs` no modela activación por path filters. No se
remedia por ser MINOR.

### F-005 — Límite D6 de maintainer único

El ruleset `ai-native-main` conserva `required_approving_review_count=0` y
`require_code_owner_review=false`; D6 depende de política operativa y detección
post-merge (`HITL-MERGE-POLICY.md:21,25,34–45`). `ai-native-human-review` sí está
cerrado a bypass y conserva el reviewer requerido. Este límite ya estaba
documentado (M-05 en `AUDIT-PLATFORM-466219d.md`); no es la MAJOR nueva.

### F-006 — Rollback pierde campos opcionales del lock

`contracts/lock.schema.json` permite `productDir` y `governance`, mientras que
`runtime/bootstrap/install.mjs:45–55,262–263` canonicaliza el lock sin ellos al
hacer rollback. Los tests actuales no cubren dichos campos.

### F-007 — Revocación de claves antiguas `NO VERIFICADO`

`SECRETS-BOUNDARY.md:40–47` registra que la API no expone historial de claves
privadas. No hay evidencia de key vieja activa o uso indebido. Se mantiene como
MINOR `NO VERIFICADO`, según QUALITY_SCORE §16.

### F-008 — Protección de release tags y ejecución de policy check

La API devuelve el ruleset `ai-native-main` de rama, sin ruleset de tags. El job
`publish` de `release.yml:157–229` tiene permisos de escritura y no usa
Environment. Además, `ci.yml:202–209` ejecuta un policy check cuyo código sale
del checkout PR; el token es read-only y no se observó exfiltración. Deducción
única compartida en Q7.3; no se infiere publicación no autorizada.

### F-009 — Registro de attestation caller-supplied en engine directo

`runtime/bootstrap/cli.mjs` acepta `--attestation-record`; el path directo
comprueba campos JSON en `runtime/bootstrap/adopt.mjs:191–195`, no la firma allí.
El launcher público sí usa `gh attestation verify`. Se limita a invocación
directa del engine.

### F-010 — Identidad/inventario de SBOM

El SBOM v3.2.0 es CycloneDX, pero usa `sbom-src` como componente genérico y no
incluye componentes/dependencias. Una lista vacía puede ser correcta; falta una
raíz de producto ligada a versión/commit. `release.yml:130–148` valida formato,
no esa identidad. El finding histórico F-002 sigue MINOR.

### F-011 — Current execution posterior a PR #131 está desactualizado

`governance/execution/current/README.md:11,44–45` dice
`WAITING_FOR_HUMAN_GOVERNANCE_MERGE`; `SUMMARY.md:23–24` dice que la PR espera
merge. La API confirma PR #131 `MERGED` con SHA
`e4dee28409dbe34470bf3ca25837ed3d24bbbb10`. Se descuenta una sola vez en Q8.1,
sin duplicar en Q4/Q8.4. No se corrigió por ser MINOR.

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos | Impacto |
|---|---|---|---|
| ROOT-001 | Environment de secretos permite bypass admin de su única policy de rama | F-001 | Administrador puede omitir límite main-only del Environment de confianza. |
| ROOT-002 | Garantías humanas y algunas automatizaciones no son impuestas independientemente por servidor | F-005, F-008 | D6 operativo; publicación/policy tienen enforcement limitado. |
| ROOT-003 | Evidencia externa y snapshot current se refieren a estado anterior | F-003, F-011 | Caller workflow actual no probado; snapshot no refleja merge #131. |
| ROOT-004 | Límites de canonicalización/provenance/inventario | F-006, F-009, F-010 | Rollback, engine directo y SBOM tienen gaps menores. |

## J. QUÉ ES INNECESARIO

No se verificó código/workflow específico innecesario. No se recomienda borrar
componentes.

## K. QUÉ FALTA

### Para satisfacer el umbral solicitado

* **F-001:** deshabilitar bypass administrativo de `ai-native-trust`, conservar
  policy `main` y revalidar configuración remota.

### MINORs no bloqueantes (no corregidos por instrucción)

* F-002–F-011: rutas históricas, caller L3 actual, activación CI, D6, campos
  rollback, revocación no verificable, protección de tag/policy, attestation,
  SBOM y estado current stale.

## L. NO VERIFICADO

| Elemento | Razón | Impacto |
|---|---|---|
| Revocación histórica de keys App | API no expone historial de keys | Q7.1 MENOR; no se infiere key activa |
| Bypass real trust env | No se ejecutó bypass | Capacidad configurada sí está verificada; no se afirma divulgación |
| Caller externo workflow L3 actual | C6 fija blob previo | Q5.2 MENOR |
| Assets/attestation v3.3.0 | Sin tag/release | Prospectivo; no penalizado antes del release-gate (§35) |
| Release-gate de la candidata | No ejecutado; auditoría tiene una MAJOR | No se afirma PASS |
| SBOM v3.3.0 | Asset futuro inexistente | F-010 se basa en v3.2.0 publicado y workflow actual |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS — ninguno abierto
G2 CRITICAL: PASS — ninguno abierto
G3 VERIFICACIÓN ESENCIAL: PASS — suites focalizadas y CI exact-SHA pasaron
Umbral adicional solicitado: FAIL — 1 MAJOR abierto
```

No se aplica cap global. El gate combinado solicitado no pasa debido a F-001.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 92.25/100

F-002 → +0.75 (Q2.2)
F-003 → +0.75 (Q5.2)
F-004 → +0.75 (Q5.5)
F-005 → +1.25 (Q6.2 + Q8.3)
F-006 → +0.50 (Q6.6)
F-007 → +0.75 (Q7.1)
F-001 + F-008 → +1.00 compartido (Q7.3; sin doble penalización)
F-009 → +0.75 (Q7.5)
F-010 → +0.75 (Q7.5)
F-011 → +0.50 (Q8.1)

92.25 + 7.75 = 100.00
Puntos aplicables: 100
```

## O. ORDEN DE REMEDIACIÓN

| Prioridad | Finding | Cierre mínimo |
|---|---|---|
| 1. MAJOR | F-001 | `ai-native-trust.can_admins_bypass=false`; mantener policy `main`; verificar GET y rechazo de rama no permitida. |
| 2. MINOR | F-002–F-011 | Correcciones/evidencias descritas en cada finding; no bloquean umbral de 90 y no se tocaron. |

## P. SEGUNDA PASADA PARA 100

```text
N/A — score provisional < 100.
```

## Q. CERTIFICACIÓN FINAL

**¿Puede aprobarse el SHA `e4dee28409dbe34470bf3ca25837ed3d24bbbb10` como release
PLATFORM bajo el umbral solicitado?**

```text
NO — STOP
Score: 92.25/100
BLOCKER: 0
CRITICAL: 0
MAJOR: 1 (F-001, Environment ai-native-trust)
MINOR: 10
```

La puntuación numérica supera 90, pero no se cumple el requisito independiente
de cero MAJOR. No se ejecutó release-gate, no se creó tag y no se publicó
release.
