---
targetRepo: jlbellonGmail/ai-native
targetCommit: d98a89e5079c98bb6f65b74f7f658e47553ac7e9
platform:
  version: "v3.3.0 candidate"
  commit: d98a89e5079c98bb6f65b74f7f658e47553ac7e9
auditMethod: "1.2"
profile: PLATFORM
date: "2026-10-16T23:10:23Z"
scope: "Independent, read-only PLATFORM 1.2 audit of the exact v3.3.0 candidate SHA and live GitHub control plane; release-gate, tag and publication excluded."
score: 93.00
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2

## A. Identificación y veredicto

```text
Repositorio: jlbellonGmail/ai-native
Rama auditada: main
Commit exacto: d98a89e5079c98bb6f65b74f7f658e47553ac7e9
PR #133: MERGED en el commit auditado
Tag/release v3.3.0 al auditar: no existen
Perfil: PLATFORM 1.2 (único perfil aplicado)
QUALITY_SCORE: 1.1
AUDIT_RULES: 1.1
Método: auditMethod 1.2
Auditor: agente independiente, separado del Builder; auditoría de solo lectura
Confianza: MEDIA
Resultado: PASS — apto para continuar al release-gate, sujeto a D6
Score: 93.00/100
BLOCKER: 0 | CRITICAL: 0 | MAJOR: 0 | MINOR: 10
N/A: 0
```

El candidato supera el umbral de 90 y no tiene BLOCKER, CRITICAL ni MAJOR abiertos. Los diez MINOR puntuables son no bloqueantes y no abren scope de remediación. Esta auditoría no ejecuta `release-gate`, no autoriza por sí sola un tag y no publica la release. D6 sigue aplicando a las PRs protegidas y a cualquier merge humano requerido.

## B. Alcance, método y límites

Se auditó exactamente `d98a89e5079c98bb6f65b74f7f658e47553ac7e9` y el estado remoto relevante del control plane de `jlbellonGmail/ai-native`. Se aplicó exclusivamente el perfil `audit/profiles/PLATFORM.md`, con `audit/method/QUALITY_SCORE.md` y `audit/method/AUDIT_RULES.md`. La revisión cubrió B-01; D6; trust-gate, merge-gate e HITL; lifecycle del CLI y compatibilidad CLI↔PLATFORM; bootstrap y sus capacidades; fail-closed, revocación y anti-downgrade; CLI v3.2.0; Windows/Linux, offline y multi-repo; pinning; reproducibilidad; distribución, atestaciones y supply chain; documentación y gobernanza.

La release v3.3.0 aún no está publicada: los assets, digest público, atestaciones de publicación y aceptación desde la release pública no son verificables antes del release. No se penaliza su ausencia en esta auditoría pre-release; se deben verificar en sus gates posteriores. La API disponible no expone el historial de claves privadas de la GitHub App: la revocación histórica permanece `NO VERIFICADO`, sin afirmar que una clave antigua siga activa. La evidencia C6 disponible refiere a un blob anterior del workflow reusable; se mantiene como MINOR.

El host Windows local permanece `CONTEXTUAL_NON_BLOCKING` conforme a la instrucción del maintainer. No se investigó ni se puntuó: la CI limpia del SHA exacto es la evidencia autoritativa.

## C. Estado remoto del control plane y CI exacta

Consultas live de GitHub API / `gh`:

| Control | Evidencia remota | Resultado |
|---|---|---|
| PR #133 | Estado `MERGED`; `merge_commit_sha=d98a89e5079c98bb6f65b74f7f658e47553ac7e9` | PASS |
| `ai-native-human-review` | `can_admins_bypass=false`; reviewer requerido configurado; deployment policy restringida a `main` | PASS |
| `ai-native-trust` | `can_admins_bypass=false`; deployment policy restringida a `main` | PASS |
| `ai-native-main` (ID 24405506) | `enforcement=active`; `strict_required_status_checks_policy=true`; `bypass_actors=[]` | PASS |
| Contextos requeridos | Actions app 15368: validators Ubuntu/Windows, pin-check, pr-gate; trust app 5170488: trust-gate, merge-gate | PASS |
| `v3.3.0` | Ref/tag ausente; release inexistente | PASS pre-release |

Runs del SHA exacto, todos terminales y exitosos:

| Workflow | Run | Jobs relevantes |
|---|---:|---|
| CI | 38975427980 | `validators (ubuntu-latest)` y `validators (windows-latest)`; todos los pasos PASS |
| Supply chain | 38975428030 | `pin-check` PASS |
| SBOM | 38975427965 | generación y validación CycloneDX PASS |
| Trivy | 38975428036 | `trivy-fs` PASS |
| CodeQL | 38975428123 | `analyze (actions)` y `analyze (javascript-typescript)` PASS |
| Pilot | 38975428107 | online/offline en Ubuntu y Windows PASS; el offline Linux usa aislamiento de red real y Windows el net-guard declarado por la matriz |

En PR #133 también finalizaron PASS `pr-gate`, `trust-gate`, `merge-gate`, `dependency-review`, `security-scan` y los checks requeridos; `human-review` y `merge-gate-finalize` fueron `SKIPPED` para esa PR. No se ejecutó ningún merge de PR por el agente.

## D. Validaciones ejecutadas

Comandos locales ejecutados sobre el checkout limpio de `d98a89e5079c98bb6f65b74f7f658e47553ac7e9`:

| Validación | Resultado |
|---|---|
| `node parity/validate-parity.mjs` | PASS; 74 capacidades, `UNMAPPED=0`; 95/95 PAR-tests implementados |
| `node contracts/validate-contracts.mjs` | PASS; 20 schemas y 7 datos |
| `node core/validate-core.mjs` | PASS; kernel 52/60 líneas, 8 perfiles |
| `node runtime/status/validate-integrity.mjs` | PASS |
| `node runtime/docs/validate-doc-drift.mjs` | PASS |
| `node scripts/validate-actions-pinned.mjs` | PASS; todas las acciones fijadas por SHA completo |
| `node scripts/validate-ci-tests-listed.mjs` | PASS; 97/97 archivos de test listados por workflows |
| `node runtime/adapters/validate-entrypoints.mjs` | PASS |
| `node runtime/audit/cli.mjs check` | PASS |
| `node evaluation/m52/validate-evidence.mjs` | PASS |
| `pwsh -NoProfile -File ./runtime/lib/result.conformance.test.ps1` | PASS; 19 checks |
| `git diff --check` | PASS |

La suite de release `node --test runtime/*/*.test.mjs contracts/*.test.mjs core/*.test.mjs parity/*.test.mjs evaluation/*/*.test.mjs scripts/*.test.mjs` reportó localmente 1000 passed y 2 fallos en el host Windows. No se investigaron ni se trataron como fallos de producto; las suites autoritativas Windows y Linux del mismo SHA terminaron PASS, conforme a la clasificación `CONTEXTUAL_NON_BLOCKING` solicitada.

### Lifecycle, B-01 y compatibilidad

La matriz autoritativa CI ejecutó y pasó `runtime/bootstrap/*.test.mjs`, `runtime/cli/*.test.mjs`, `runtime/gates/*.test.mjs`, `runtime/adapters/*.test.mjs`, `runtime/release/*.test.mjs` y `runtime/pilot/*.test.mjs` en sus jobs correspondientes. La cobertura del CLI incluye `init`, `install`, `upgrade`, `self-update --check`, `--version`, `detach`, `uninstall`, multi-repo, rollback, lock, attestation, digest, revocaciones, downgrade, offline y fixture CLI v3.2.0. El bootstrap publica protocolo 1, `minCliVersion: v3.2.0` y `requiredCapabilities: ["adopt"]` en el bundle construido. Los gates y tests verifican fail-closed para contrato incompatible, lock inválido, revocación y verificación de integridad.

B-01 está **CLOSED**: el detach legacy valida el lock con `contracts/lock.schema.json`; el caso `platform: {}` se rechaza sin modificar archivos, índice ni estado Git. La auditoría no considera la falta de fault-injection del posterior `git rm --cached` como reapertura del hallazgo original ni como nuevo scope.

### Build reproducible

Auditoría independiente ejecutó dos veces el mecanismo oficial, leyendo los blobs del commit exacto:

```text
node runtime/release/build.mjs --version v3.3.0 --commit d98a89e5079c98bb6f65b74f7f658e47553ac7e9 --out C:\TEMP\ai-native-tests\audit-d98a89e\run1
node runtime/release/build.mjs --version v3.3.0 --commit d98a89e5079c98bb6f65b74f7f658e47553ac7e9 --out C:\TEMP\ai-native-tests\audit-d98a89e\run2
```

Ambos builds finalizaron con 226 archivos y bundle de 1,209,542 bytes. Comparación byte a byte: idéntica. SHA-256 de ambos tarballs: `b2c88d4713c6fe832763a3eb8d1b03cde65d0803dfe6033e66dbf17d60b16f73`.

## E. Score por áreas y subcriterios

| Área | Resultado |
|---|---:|
| Q1 Contrato | 12.00 / 12 |
| Q2 Reutilización y limpieza | 11.25 / 12 |
| Q3 Arquitectura | 12.00 / 12 |
| Q4 Documentación y DX | 11.75 / 12 |
| Q5 Calidad y regresión | 14.50 / 16 |
| Q6 Git, CI/CD y releases | 14.75 / 16 |
| Q7 Seguridad y supply chain | 9.25 / 12 |
| Q8 Gobernanza | 7.50 / 8 |
| **TOTAL** | **93.00 / 100** |

No hay criterios N/A ni caps globales por Quality Gate.

| Criterio | Puntos | Evidencia / hallazgo que explica cualquier descuento |
|---|---:|---|
| Q1.1 Propósito y alcance | 3/3 | `README.md`; política de versionado |
| Q1.2 Capacidades prometidas | 3/3 | `runtime/cli/`; `runtime/bootstrap/`; CI exacta |
| Q1.3 Contratos, docs e implementación | 3/3 | `contracts/bootstrap-protocol.json`; doc-drift PASS |
| Q1.4 Requisitos obligatorios | 3/3 | B-01 cerrado; lifecycle y release workflow |
| Q2.1 Inicialización reproducible | 3/3 | CLI lifecycle tests; README |
| Q2.2 Residuos históricos | 2.25/3 | Rutas de workstation persisten en registros históricos — F-002 |
| Q2.3 Configuración | 3/3 | `contracts/lock.schema.json`; README |
| Q2.4 Portabilidad | 3/3 | CI y pilot Ubuntu/Windows, online/offline |
| Q3.1 Estructura | 3/3 | `runtime/`, `contracts/`, `core/` |
| Q3.2 Separación de responsabilidades | 3/3 | CLI delgada; motores bootstrap verificados |
| Q3.3 Simplicidad/duplicación | 3/3 | dependencias mínimas; bundle determinista |
| Q3.4 Mantenibilidad | 3/3 | contratos, tests y validadores de docs/CI |
| Q4.1 README funcional | 3/3 | onboarding público |
| Q4.2 Instalación y bootstrap | 2.75/3 | guard de mutaciones README parcialmente cubierto — N-11 |
| Q4.3 Operaciones comunes | 2/2 | comandos lifecycle y troubleshooting |
| Q4.4 Convenciones | 2/2 | `CONTRIBUTING.md`; `AGENTS.md` |
| Q4.5 Ejemplos/troubleshooting | 2/2 | códigos fail-closed explicados |
| Q5.1 Controles automáticos | 3/3 | CI exacta y workflows de seguridad |
| Q5.2 Estrategia de pruebas | 2.25/3 | C6 fija un blob anterior del workflow — F-003 |
| Q5.3 Tests ejecutables/pasando | 4/4 | CI exacta verde Windows y Linux |
| Q5.4 Regresiones críticas | 3/3 | B-01 y lifecycle/rollback tests |
| Q5.5 Activación de gates | 2.25/3 | filtros no aseguran test README en cambios solo README/test — F-004 |
| Q6.1 Estrategia Git | 3/3 | PR #133 mergeada; main protegido |
| Q6.2 Protección de integración | 2.25/3 | estricto y sin bypass; D6 no fuerza segunda identidad — F-005 |
| Q6.3 CI fiable | 3/3 | checks del SHA exacto completados |
| Q6.4 Versionado y release | 3/3 | v3.3.0 sigue prospectiva pre-release |
| Q6.5 Artefacto reproducible | 2/2 | dos bundles byte-idénticos en esta auditoría |
| Q6.6 Compatibilidad/rollback | 1.5/2 | rollback omite `productDir` y `governance` permitidos por schema — F-006 |
| Q7.1 Gestión de secretos | 2.25/3 | historial de revocación de claves de App no verificable — F-007 |
| Q7.2 Dependencias | 2/2 | SHA pinning, pin-check y security workflows PASS |
| Q7.3 Seguridad CI/CD | 1.5/2 | sin ruleset de tags; policy check ejecuta código de PR — F-008 |
| Q7.4 Defaults seguros | 2/2 | default-deny en política/MCP y validadores |
| Q7.5 Supply chain | 1.5/3 | registro de attestation caller-supplied y SBOM sin identidad de plataforma — F-009, F-010 |
| Q8.1 Fuente de verdad | 2/2 | estado candidato reconciliado en snapshot vigente |
| Q8.2 Roles/límites | 2/2 | D6 documentado; el agente no mergea |
| Q8.3 Gobernanza fail-safe | 1.5/2 | límite de single-maintainer no impuesto server-side — F-005 |
| Q8.4 Trazabilidad | 2/2 | SHA exacto, checks y schema de auditoría |

## F. Hallazgos MINOR actuales

Los identificadores son locales a este informe. No se propone corregirlos ni ampliar scope; ninguno bloquea el release-gate bajo el umbral vigente.

| ID | Área | Estado | Evidencia y descripción |
|---|---|---|---|
| F-002 | Q2.2 | OPEN / MINOR | Rutas específicas de workstation permanecen en registros históricos de gobernanza; no afectan el runtime ni el bundle. |
| F-003 | Q5.2 | OPEN / MINOR | La evidencia C6 fija un blob anterior de `l3-consumer.yml`; no prueba invocación externa del blob actual. |
| F-004 | Q5.5 | OPEN / MINOR | Los filtros de workflows no garantizan ejecutar el test de instalación del README con cambios solo de README/test. |
| F-005 | Q6.2, Q8.3 | OPEN / MINOR | D6 es norma operativa más detección: con un maintainer no hay enforcement server-side de identidad humana independiente para PRs ordinarias. |
| F-006 | Q6.6 | OPEN / MINOR | Rollback no conserva los campos `productDir` y `governance` permitidos por el schema del lock. |
| F-007 | Q7.1 | OPEN / MINOR | No se pudo verificar por API la revocación histórica de claves privadas de GitHub App. |
| F-008 | Q7.3 | OPEN / MINOR | No hay ruleset para tags y la validación de política de CI deriva del checkout de PR; no se observó bypass. |
| F-009 | Q7.5 | OPEN / MINOR | El motor directo acepta un registro de attestation aportado por el caller; los caminos públicos verificados conservan la raíz de confianza documentada. |
| F-010 | Q7.5 | OPEN / MINOR | El SBOM público v3.2.0 usa metadata genérica `sbom-src` y no identifica la plataforma raíz. |
| N-11 | Q4.2 | OPEN / MINOR | La prueba de instalación README detecta 12 de 18 mutaciones previas; el guard es parcial. |

La alerta CodeQL #27 (`actions/untrusted-checkout/medium`) permanece abierta, pero la revisión independiente confirmó que el reusable workflow es de solo lectura, no persiste credenciales del checkout y selecciona por separado el commit confiable. Se trata como contextual y no puntuable, no como gate de release.

## G. Disposición de hallazgos previos

Cada estado corresponde al hallazgo del informe fuente, no a una reapertura automática. Las equivalencias abiertas se puntúan una sola vez en la sección F.

| Informe fuente / ID | Disposición actual | Evidencia / correspondencia |
|---|---|---|
| `AUDIT-PLATFORM-466219d` — B-01 | CLOSED | Validación del lock con schema y regresión `platform: {}` sin cambios en archivo, índice o estado. |
| `AUDIT-PLATFORM-466219d` — M-01, M-02, M-04, M-05, M-07, M-08, M-09, M-10, M-11 | OPEN | Equivalentes a los MINOR descritos en F-002…F-010 y N-11; contabilizados una vez. |
| `AUDIT-PLATFORM-466219d` — M-03 | SUPERSEDED | La CI remota limpia del SHA exacto sustituye la verificación anterior incompleta; los dos fallos del host no se investigan ni puntúan. |
| `AUDIT-PLATFORM-466219d` — M-06 | NOT_APPLICABLE | Publicación y verify son pasos posteriores a esta auditoría y al release-gate. |
| `AUDIT-PLATFORM-466219d` — N-08 | CLOSED | Reconciliación de tracking/rollback cubierta por tests de migración de CI. |
| `AUDIT-PLATFORM-466219d` — N-12…N-20, N-23 | CLOSED | Correcciones de CLI/release corroboradas por tests lifecycle y CI actual; N-11 sigue OPEN. |
| `AUDIT-PLATFORM-e4dee28` — F-001 de `ai-native-trust` | CLOSED | GET live: `can_admins_bypass=false`; deployment policy sigue en `main`. No se infiere un bypass histórico. |
| `AUDIT-PLATFORM-e4dee28` — F-002…F-010 | OPEN | Se mantienen como los equivalentes MINOR de esta auditoría; no se duplican en el score. |
| `AUDIT-PLATFORM-e4dee28` — F-011 | CLOSED | PR #133 está mergeada; SHA y snapshot post-merge están reconciliados. |
| `AUDIT-PLATFORM-2ef6b5b` — bypass de `ai-native-human-review` | CLOSED | GET live: `can_admins_bypass=false`; reviewer y policy de `main` conservados. |
| `AUDIT-PLATFORM-d16adfe` / `AUDIT-PLATFORM-6260751` — N-12…N-23 | CLOSED | CLI prerelease/versioning, shims, `detach` legacy y documentación verificados en el candidato y CI. |
| `AUDIT-PLATFORM-d16adfe` / `AUDIT-PLATFORM-6260751` — N-11 | OPEN | Guard parcial de instalación README, MINOR actual N-11. |
| Informes previos v3.3.0 — findings duplicados F-02/F-03/F-04/F-06/F-11/F-22/F-23/P-06r | OPEN | Se consolidan respectivamente en F-005/F-007/F-008/F-002/F-003/F-006/F-008/F-009; cada causa se cuenta una sola vez. |
| Informes previos v3.3.0 — F-05 de host local | SUPERSEDED | Clasificación explícita `CONTEXTUAL_NON_BLOCKING`; CI exacta verde; no se investiga ni puntúa. |
| Hallazgo F-08 de informe previo (ID local al informe; distinto de F-008 en `e4dee28`) | CLOSED | Tabla pública de errores y troubleshooting del README. |
| Hallazgo F-10 de alerta en informe previo (ID local al informe; distinto de F-010 SBOM) | SUPERSEDED para scoring | La alerta CodeQL sigue OPEN, pero su revisión actual la declara contextual/no puntuable; el residual de identidad SBOM queda separado en F-010. |
| A-02 / strict status checks | CLOSED | Ruleset live estricto, activo, sin bypass actors y con los seis contextos requeridos. |

## H. Evaluación de la superficie solicitada

| Superficie | Estado | Evidencia principal |
|---|---|---|
| B-01 / detach y lock inválido | CLOSED / PASS | `runtime/bootstrap/detach.mjs`, lifecycle suite y CI exacta |
| D6 / merge humano | VIGENTE | Política `HITL-MERGE-POLICY.md`; el agente no aprueba ni mergea |
| Human-review y trust bypass | PASS | Ambos `can_admins_bypass=false` en GET live |
| Ruleset main / required checks | PASS | Activo, estricto, cero bypass actors, seis contexts con App IDs correctos |
| trust-gate / merge-gate / HITL | PASS | Jobs y check-runs de PR #133; las reglas de D6 permanecen |
| install / init / upgrade / self-update / version / detach / uninstall | PASS | `runtime/cli/ai-native-lifecycle.test.mjs`, tests bootstrap y CI Windows/Linux |
| CLI ↔ PLATFORM / protocolo | PASS | `contracts/bootstrap-protocol.json`, schemas y negociación fail-closed |
| `minCliVersion` / capabilities | PASS | Bundle del SHA: protocolo 1, mínimo v3.2.0, capability `adopt` |
| Fail-closed / revocaciones / anti-downgrade | PASS | suites lifecycle, bootstrap y release; supply-chain CI |
| CLI v3.2.0 legacy | PASS | Fixture real `evaluation/fixtures/cli/` y tests de compatibilidad |
| Windows / Linux | PASS remoto | validators y lifecycle suites en ambos runners |
| Offline | PASS remoto | Pilot online/offline; aislamiento Linux real y guard Windows declarado |
| Multi-repo / pinning | PASS | lifecycle tests y `validate-actions-pinned` |
| Reproducibilidad / distribución | PASS pre-release | Dos builds oficiales byte-idénticos; hash registrado en sección D |
| Attestations / SBOM / supply chain | PASS por diseño, publicación pendiente | workflow de release, checksum/SBOM/provenance; assets v3.3.0 no existen aún |
| Documentación / gobernanza | PASS con MINORs | doc-drift PASS; estado, autoridad y D6 clasificados |

## I. Conclusión

```text
AUDITED_SHA: d98a89e5079c98bb6f65b74f7f658e47553ac7e9
SCORE: 93.00/100
BLOCKER: 0
CRITICAL: 0
MAJOR: 0
MINOR: 10 (no bloqueantes)
VERDICT: PASS — supera el gate de auditoría PLATFORM
RELEASE_GATE: NOT_RUN — corresponde después del merge humano de este informe
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED
HUMAN APPROVAL: D6 vigente; este informe no aprueba ni ejecuta merges
```

El informe certifica únicamente el SHA objetivo indicado en el front matter y los estados live consultados al auditar. El framework permite heredarlo solo a un descendiente cuya diferencia neta sea exclusivamente `.audit/**` y `STATUS.md`. No se propone remediar los MINOR no bloqueantes.
