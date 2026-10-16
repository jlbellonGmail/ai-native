---
targetRepo: jlbellonGmail/ai-native
targetCommit: 466219dae73b503143d7e4578d726dbd9f4b23ba
platform:
  version: v3.0.0-dev
  commit: 466219dae73b503143d7e4578d726dbd9f4b23ba
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: OpenCode fresh independent auditor context (read-only)
date: 2026-10-16T04:55:11Z
scope: Final independent PLATFORM release-readiness audit for candidate v3.3.0 at main; full v3.2.0-to-candidate diff and exact-SHA checks of CLI lifecycle, bootstrap/CLI contracts, compatibility, Windows/Linux, offline/multi-repo behavior, release/supply chain, documentation and governance.
score: 69.00
isMergeGate: false
---

# Auditoría PLATFORM — ai-native @ 466219d (candidata v3.3.0)

## STATUS

**NO APTO — release bloqueada.** Puntuación bruta: **90.25/100**. Hay **1 BLOCKER, 0 CRITICAL, 0 MAJOR y 11 MINOR**. El Quality Gate G1 limita la puntuación final a **69/100** por el blocker B-01. No se aplica tolerancia.

El auditor independiente no modificó el repositorio ni creó artefactos. El Builder generó únicamente este informe de auditoría, sin cambios de producto; el informe se dirige a una PR separada y no certifica una release publicada.

## INDEPENDENCIA

Auditoría realizada en un contexto nuevo de solo lectura, sin implementar las correcciones de v3.3.0. Las puntuaciones y cierres anteriores se usaron únicamente como lista de afirmaciones que revalidar, no como evidencia heredada. No se ejecutó ninguna reparación.

## AUDITED_SHA Y ESTADO

```text
Repository: jlbellonGmail/ai-native
Branch: main
Commit: 466219dae73b503143d7e4578d726dbd9f4b23ba
Worktree: CLEAN
Tag v3.3.0: absent
Release v3.3.0: absent
Latest public stable release: v3.2.0
Profile: PLATFORM 1.2
Audit method: 1.2
```

`git status --short` estaba vacío; `git diff --check` pasó. La auditoría se refiere al commit exacto del front matter.

## ALCANCE Y MÉTODO

Se aplicaron `audit/method/QUALITY_SCORE.md` 1.1, `audit/method/AUDIT_RULES.md` 1.1 y únicamente `audit/profiles/PLATFORM.md` 1.2. Se revisaron contrato CLI ↔ PLATFORM, protocolo bootstrap, `minCliVersion`, `requiredCapabilities`, fail-closed, revocación, anti-downgrade, `install`, `init`, `upgrade`, `self-update`, `detach`, `uninstall`, Windows/Linux, offline, multi-repo/multi-machine, release, supply chain, documentación, CI y D6.

La severidad BLOCKER de B-01 activa G1. El score final no puede mantenerse en el score bruto cuando G1 lo limita.

## BLOCKER

### B-01 — `detach` legacy elimina un lock sin demostrar que pertenece a ai-native

**Severidad:** BLOCKER · **Tipo:** riesgo de pérdida de datos · **Criterio:** Q1.4.

En `runtime/bootstrap/detach.mjs:89–100`, la ruta sin journal acepta cualquier objeto JSON cuyo campo `platform` sea un objeto. Por ejemplo, `{"platform":{}}` supera la condición de `:97`. La función luego borra `ai-native.lock.json` en `:107` y responde `PASS_WITH_WARNINGS` en `:117`. No valida el lock contra `contracts/lock.schema.json`, que exige `schemaVersion`, `platform.repo/version/commit/digest` y `profiles`, además de restringir campos adicionales.

Esto alcanza a repositorios legacy sin journal: el motor no puede probar que el lock es suyo, pero lo elimina de todos modos. Los tests `runtime/cli/ai-native-lifecycle.test.mjs:951–959` rechazan JSON inválido, un array y un objeto sin `platform`; no cubren un JSON válido con `platform: {}`.

**Evidencia:** inspección del camino ejecutable y comparación con el schema y cobertura de pruebas. No se ejecutó una reproducción mutante en un repo; la ruta de borrado se verificó estáticamente y el worktree auditado permaneció limpio.

**Archivos afectados:** `runtime/bootstrap/detach.mjs`, `contracts/lock.schema.json`, `runtime/cli/ai-native-lifecycle.test.mjs`.

**Remediación exacta:** antes de borrar, validar que el lock completo tenga la forma ai-native legacy soportada; para cualquier otra forma, fallar cerrado sin modificar archivo ni índice. Comprobar el resultado de `git rm --cached` y no devolver PASS si el staging falla. Añadir regresiones para lock JSON extranjero/malformado con `platform: {}` y para fallo al retirar del índice; verificar archivo, índice y estado intactos.

## HALLAZGOS MINOR

### M-01 — Rutas específicas de workstation en registros históricos
**Q2.2, −0.75 · RESIDUO.** `governance/cleanup/M7-INVENTORY.md` y `M7-CLOSURE.md` conservan rutas `C:\Proyectos` y detalles de archivos fuera del repo. Aunque están marcados como historia, publican datos específicos de máquina. Remediación: neutralizar rutas locales preservando la decisión histórica.

### M-02 — Sin invocación observada del workflow reusable de consumidor
**Q5.2, −0.75 · NO VERIFICADO.** Root CI ejecuta `runtime/consumer/*.test.mjs`, pero la evidencia revisada no demuestra una invocación de `.github/workflows/l3-consumer.yml` desde un consumidor contra el SHA candidato. Remediación: preservar una invocación exitosa de un consumidor representativo fijado al SHA, o un caller de prueba controlado.

### M-03 — Suite hermética completa no verificada en este candidato
**Q5.3, −1.00 · NO VERIFICADO / RIESGO.** El CI ejecuta las suites directamente, no `node scripts/test-hermetic.mjs`. En el Windows limpio del CI pasaron adapters 80/80 y CLI 63/63; los 97 archivos de test están asignados a workflows. No se ejecutó el runner hermético completo. El diagnóstico local Windows anterior reportó denegaciones de escritura Git en repos temporales; la causa sigue desconocida y no se atribuye a Norton ni al producto. Remediación: obtener un run completo del runner en Windows limpio y preservar diagnóstico reproducible.

### M-04 — Filtro de workflow no cubre el test de instalación del README
**Q5.5, −0.75 · INCOMPLETO.** `ci.yml` valida el inventario de tests pero no ejecuta `scripts/validate-readme-install.test.mjs`; los paths de PR de `release.yml` no incluyen `README.md` ni ese test. El validador de inventario comprueba presencia en workflows, no que sus filtros activen el workflow para cada archivo. Remediación: ejecutar el test desde CI sin filtro o corregir los paths del workflow y hacer que el validador considere esos filtros.

### M-05 — D6 es política operativa, no separación de identidad impuesta por el servidor
**Q6.2, −0.75; Q8.3, −0.50 · RIESGO.** La API de GitHub muestra reglaset de main con PR y seis checks, sin bypass, pero `required_approving_review_count: 0` y `strict_required_status_checks_policy: false`. `HITL-MERGE-POLICY.md` documenta correctamente que D6 depende de norma operativa y detección post-merge para PR ordinarias. Un merge humano observado no impone la identidad en el futuro. Remediación: al incorporar un segundo maintainer, exigir aprobación independiente, CODEOWNERS y checks estrictos.

### M-06 — Publish/verify de v3.3.0 no ejecutados
**Q6.4, −0.75 · NO VERIFICADO.** No existe tag ni Release `v3.3.0`; el workflow de tag `build → publish → verify` no se ha ejecutado para la candidata. Tests y build local no sustituyen una publicación real. Remediación: tras superar los gates y el HITL, exigir workflow de release completo y `verify-release` para el SHA publicado.

### M-07 — Rollback omite campos opcionales del lock
**Q6.6, −0.50 · ROTO.** `contracts/lock.schema.json` permite `productDir` y `governance`, pero `runtime/bootstrap/install.mjs:41–51` omite ambos en `canonical()`, y rollback persiste esa representación en `:258–259`. El test de rollback no comprueba esos campos. Remediación: preservar todo campo soportado y añadir regresiones para rollback.

### M-08 — Revocación de claves antiguas de GitHub App no verificada
**Q7.1, −0.75 · NO VERIFICADO.** La gobernanza registra que no puede verificarse por API la revocación de claves privadas antiguas de `ai-native-trust`. Secret scanning y push protection activos y cero alertas de secretos no prueban esa revocación. Remediación: el owner verifica/revoca las claves antiguas y registra confirmación no sensible.

### M-09 — Publicación no está protegida por reglas de tag ni Environment
**Q7.3, −1.00 compartido con M-10 · RIESGO / INCOMPLETO.** La API devolvió solo un ruleset de branch, sin reglas de tags. El job `publish` de `release.yml` tiene `contents: write`, `id-token: write` y `attestations: write`, sin `environment:`. Remediación: reglas para tags `v*` y Environment protegido para el job que publica; verificar configuración por API.

### M-10 — Un chequeo de política en PR ejecuta código de la propia PR
**Q7.3, incluido en la deducción compartida con M-09 · RIESGO.** `ci.yml:202–209` ejecuta `runtime/policy/hitl.mjs` desde el checkout de PR. El token es read-only y los trust/merge gates separados usan código confiable del base, así que no se observó una ruta de escritura o exfiltración; aun así, esta instancia del chequeo puede cambiarse por la PR que evalúa. Remediación: evaluar el diff con un validador fijado al base o depender del gate confiable; desactivar credenciales persistentes donde no se necesiten.

### M-11 — El motor acepta como prueba de attestation un JSON aportado por el caller
**Q7.5, −0.75 · RIESGO.** El launcher público ejecuta `gh attestation verify`, pero invocación directa de `runtime/bootstrap/cli.mjs adopt/upgrade` acepta `--attestation-record`; `adopt.mjs:191–195` comprueba campos JSON (`verifiedBy` y digest) sin verificar criptográficamente el registro allí. Esto afecta la invocación directa del motor, no el camino normal del launcher. Remediación: verificar provenance en el límite del motor o emplear un handoff no falsificable; no reportar `ATTESTATION: PASS` por un registro provisto por el caller.

## REVALIDACIÓN DE HALLAZGOS ANTERIORES

| Hallazgo | Estado en 466219d | Evidencia |
|---|---|---|
| N-18 | CERRADO | Shim `.cmd` ASCII con `%~dp0`; test actual incluye rutas acentuadas, caracteres Unicode, `%` y `&`; test pasó en CI Windows. |
| N-21 | CERRADO para la forma legacy documentada; límite B-01 | Legacy lock sin journal elimina solo el lock; `.ai-native/` existente o lock ilegible falla cerrado. Tests pasaron en Windows CI; el caso `platform: {}` queda fuera de cobertura. |
| N-22 | CERRADO | `V3.3.0-RELEASE.md` y `SESSION-CONTEXT.md` no afirman “all fixed”; mantienen que la candidata necesita auditoría independiente. |
| N-23 | CERRADO | `V3.3.0-RELEASE.md:84` contiene `C:\Users\José`. |
| N-08 | CERRADO | `runtime/migrate/tracking.mjs:201–207` reconoce revert completo; `journal-contract.test.mjs:369–397` cubre rollback y caso parcial; CI pasó. |
| N-12/N-14/N-16/N-17/N-19/N-20/N-13 | CERRADOS en la implementación/docs/tests actuales | Se verificó aceptación stable-only, `--clobber`, SemVer, detach, estado de sesión, códigos de error y suites CLI en ambas plataformas. La publicación real sigue NOT_VERIFIED (M-06). |
| F-08 | CERRADO para el README revisado | README contiene tabla accionable de códigos fail-closed; M-04 registra por separado la cobertura de activación del test. |
| F-10 / alert #27 | No se descuenta; requiere triage | La alerta medium de `.github/workflows/l3-consumer.yml` es probablemente falso positivo: checkout de default branch seguido de verificación de ancestro y checkout fijado, ambos sin credenciales persistentes; workflow reusable read-only y no privilegiado. Sigue abierta en API y requiere triage del maintainer. |

## EVIDENCIA DE VALIDACIÓN

Los runs citados tienen `headSha` igual al commit auditado:

| Workflow / evidencia | Resultado observado |
|---|---|
| CI `38742541452` | Ubuntu y Windows PASS. En Windows: `runtime/cli` 63/63 y `runtime/adapters` 80/80. La suite hermética completa no se invocó. |
| Pilot `38742541506` | Retry final PASS: Windows offline guard 10/10; Ubuntu Docker offline/net-proof 10/10; online Windows y Ubuntu PASS. El primer Ubuntu Docker `net-proof` falló en arranque con exit 125 y pasó al reintentar el job. |
| CodeQL `38742541535` | JS/TS y Actions SARIF upload PASS; 270 JS, 72 TS y 14 workflows escaneados. Warning no fatal de contención de cache matrix y aviso de migración futura de `ubuntu-latest`. Una ejecución exitosa no prueba cero findings. |
| Code scanning API | Una alerta abierta: #27 `actions/untrusted-checkout/medium`, `.github/workflows/l3-consumer.yml`; ver F-10. |
| Trivy `38742541440` | Trivy 0.70.0: cero vulnerabilidades en los dos lockfiles analizados; `Detected config files num=0`. Warning: un módulo CloudFront en la policy cache requiere Trivy ≥0.72 y el scanner usado fue 0.70.0; no hubo IaC config detectada. |
| SBOM `38742541633` | CycloneDX 1.7, 737 componentes; validación no vacía y upload PASS. Syft derivó nombre/versión del directorio por no recibirlos explícitamente. |
| Supply chain `38742541488` | Tests del validador 5/5; pin de acciones por SHA completo PASS. |
| Validadores locales del Builder | parity 95/95; contracts; core; integrity; docs drift; audit framework check; pinned actions; inventario CI 97 archivos; compatibility matrix — todos PASS. |
| Build reproducible local | Dos builds del mismo SHA: ambos `sha256:c9d6dc67661bd03f6af156e27fd68708267370f37c4a471eac4604034107df3c`; CLI embebido `CLI: v3.3.0`. Es evidencia de build, no publicación/attestation. |
| Release real v3.3.0 | NOT RUN: no tag ni release. |

No se ejecutó `node scripts/test-hermetic.mjs` en este audit ni en los workflows: no se afirma 1009/1009. La causa de las denegaciones Git observadas históricamente en el host Windows local sigue desconocida; no se atribuye a Norton ni al producto. El comportamiento relevante sí pasó en Windows CI mediante las suites de adapters y CLI.

## SCORE

| Área | Máximo | Bruto | Pérdida |
|---|---:|---:|---:|
| Q1 Contrato | 12 | 10.50 | 1.50 (B-01) |
| Q2 Reutilización y limpieza | 12 | 11.25 | 0.75 (M-01) |
| Q3 Arquitectura | 12 | 12.00 | 0 |
| Q4 Documentación y DX | 12 | 12.00 | 0 |
| Q5 Pruebas y regresión | 16 | 13.50 | 2.50 (M-02, M-03, M-04) |
| Q6 Git/CI/CD/releases | 16 | 14.00 | 2.00 (M-05, M-06, M-07) |
| Q7 Seguridad y supply chain | 12 | 9.50 | 2.50 (M-08, M-09, M-10, M-11) |
| Q8 Automatización y gobernanza | 8 | 7.50 | 0.50 (M-05) |
| **Total bruto** | **100** | **90.25** | **9.75** |

Las pérdidas por área suman **9.75**; `100 − 9.75 = 90.25`. El resumen entregado por el auditor indicaba “7.75 perdidos”, inconsistente con su propia tabla; el Inspector recalculó y corrigió la suma a 9.75 sin cambiar las puntuaciones por área. G1 aplica por B-01 y limita el **score final a 69.00/100**. No hay N/A. El umbral de release no se cumple con el score final ni con el requisito obligatorio de cero BLOCKER.

## BLOCKERS / CRITICALS / MAJORS / MINORS

- BLOCKER: **1** — B-01.
- CRITICAL: **0**.
- MAJOR: **0**.
- MINOR: **11** — M-01 a M-11.

## RELEASE GATE Y RECOMENDACIÓN

**NO APTO. No crear ni publicar `v3.3.0`.** B-01 es un riesgo de borrado de datos: el lock solo debe eliminarse cuando el motor demuestre que es un lock ai-native legacy soportado. El raw score 90.25 no supera G1; score final 69.00.

Validación real del informe con el framework (`node runtime/audit/cli.mjs check`) -> **PASS**. El comando `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 466219dae73b503143d7e4578d726dbd9f4b23ba --root . --tolerance 0 --json` -> **FAIL** (1 error, 18 warnings): `score 69 is below the release threshold 90 (tolerance 0)`. Los 18 warnings corresponden a informes históricos ignorados por `STALE`; no hubo informes `INVALID`. El informe actual fue reconocido como `AUDIT-PLATFORM-466219d.md`, score 69.

Informes históricos `STALE` reportados por el framework: `AUDIT-PLATFORM-15715ea.md`, `2403b83`, `2f026b5`, `3477428`, `41dd2a8`, `485c48e`, `521d203`, `558642c`, `5a60072`, `6260751`, `67f6806`, `6acd5f7`, `7e74618`, `83c4610`, `84d28a1`, `ad7af81`, `d16adfe` y `f4bc663`.

El tag, publish, verify, attestations y aceptación pública permanecen sin ejecutar. La publicación queda detenida por B-01. Cualquier remediación de producto requiere autorización y una nueva candidata, CI completo y auditoría independiente nueva.

## D6 / MERGE

Este informe no es merge gate (`isMergeGate: false`). Cualquier merge de su PR corresponde al humano bajo D6; el agente no debe mergearla.
