# AI-NATIVE V3 — Roadmap de evolución TEMPLATE v2.0.5 → plataforma de referencia versionada

## Cómo usar este archivo

`[ ]` pendiente, `[-]` en ejecución, `[x]` cerrada con evidencia y push confirmado (ver `governance/adr/ADR-003-evidencia-perdida-h5-h7.md`: no se cierra sin push).

Fuente vinculante: ADR-001 (arquitectura), ADR-002 (Contrato de Paridad), ADR-003 (evidencia perdida H5/H7), ADR-004 (versionado). El detalle completo de cada subfase — matriz de 74 capacidades, mapa de los 264 tests, condiciones P1–P45, riesgos, trazabilidad — vive en el plan de sesión referenciado desde `SESSION-CONTEXT.md` (entrada 2026-09-30) y se traslada a `parity/` y `contracts/` a medida que cada fase lo produce como artefacto.

No se abre una fase M(n+1) sin que las condiciones P de salida de M(n) estén en PASS (ver tabla de umbrales por hito).

## M0 — Contener y reconciliar

- [x] M0.0a — Contención inmediata: deshabilitar `post-hitl-merge-gate.yml` y `post-merge-close-feature.yml` en los repos afectados (B02/B04/B31 vigentes). Reversible, sin commits.
- [x] M0.0v — Verificar la contención: 16/16 workflows aplicables en `disabled_manually`, sin runs posteriores; `gi-vertical-dental` sin exposición (repo remoto vacío). P39a PASS.
- [-] M0.1 — Gobernanza: registrar la consolidación (PR #2), ADR-001..004, `VERSIONING-POLICY` completa, este roadmap, `roadmap-status.json` reconciliado, archivo P0-T1 reconstruido.
- [ ] M0.0b — Corrección definitiva en TEMPLATE: patch v2.0.6 (sin `head.ref` interpolado, sin checkout de PR con escritura, sin pre-autorización por archivo) + rulesets en repos públicos. Puede ir después de M0.1.
- [ ] M0.2 — Reparación post-subtree: rutas `ai-*` y `D:\proyectos` obsoletas, `.gitignore`, validadores rotos (`validate-enterprise-template`, W8 foundation).
- [ ] M0.3a — CI de la raíz de ai-native (validadores node, Ubuntu + Windows), sin dependencias de GHAS.
- [ ] M0.3b — Workflows de seguridad (CodeQL, Trivy, SBOM, dependency-review, supply-chain) movidos a la raíz, fijados por SHA. Depende de **D1** (visibilidad).
- [ ] M0.4 — Semántica de resultados común (PASS / PASS_WITH_WARNINGS / FAIL / ERROR) + corpus de conformidad compartido.
- [ ] M0.5 — `parity/v2.0.5/{capabilities,tests-map,files-map}.json` con validador `UNMAPPED=0`.

## M1 — Baseline

- [ ] M1.1 — Importar TEMPLATE v2.0.5 **filtrado** (sin `runs/`, sin autorizaciones commiteadas, sin `AGENTS.md`/`CLAUDE.md` anidados) a `legacy/template-v2/`; correr los ~285 casos en Ubuntu y Windows como baseline medida (no asumida).
- [ ] M1.2 — Hash DB v2.0.0–v2.0.6 + `migrate --inventory` (solo lectura).
- [ ] M1.3 — Informe de solo lectura del estado real de los repos GI y el Starter (versión declarada, drift).

## M2 — Contratos y core

- [ ] M2.1 — `contracts/`: lock, platform, pack, profile, unit, sdd-levels, state-machine, result-status, audit-report, eval-result, waiver, revocations, roadmap.
- [ ] M2.2 — `core/`: kernel ≤60 líneas, constitución + invariantes, roles, `agents.json`, `models.json`, matriz de seguridad por rol, `mcp/catalog` + perfiles, `profiles/*.json`.
- [ ] M2.3 — Spike de compatibilidad C1–C4 (Claude/Codex/OpenCode): skills, hooks, permisos, identidad de sesión/invocación para P45.

## M3 — Extracción y corrección

- [ ] M3.1 — STATUS/integrity: vista derivada, `observedCommit` first-parent, semántica de resultados aplicada.
- [ ] M3.2 — Circuito completo: identidad, ASSESS, SDD, contrato de evidencia, spec review, QA/verify, code review, convergence, máquina de estados, cierre por merge, `review run` (P45).
- [ ] M3.3 — Adaptadores derivados por herramienta + materialización de skills lazy.
- [ ] M3.4 — Routing, policy aplicada, decisión MCP.
- [ ] M3.5 — Skills core + reconciliación de las 13 contradicciones doc-código de TEMPLATE.

## M4 — Distribución y seguridad

- [ ] M4.1 — Bootstrap, caché, `sync --from-file`, `init` reproducible.
- [ ] M4.2 — `release.yml`: bundle determinista, SBOM, attestation + bundle sigstore, `v3.0.0-alpha.1`. Depende de **D1**.
- [ ] M4.3 — Workflows reutilizables `pr-gate`, `trust-gate` (P44) + App `ai-native-gate` (**A3**), `merge-gate`, `post-merge` de solo lectura, identidad del agente (**A1**).
- [ ] M4.4 — Gateway MCP + step-up.
- [ ] M4.5 — `.audit/` central (perfiles PLATFORM/APPLICATION/LIBRARY/FACTORY).
- [ ] M4.6 — Harness de evaluaciones L1/L2 + observabilidad.
- [ ] M4.7 — Contrato de packs + pack de ejemplo.

## M5 — Piloto sintético y RC

- [ ] M5.1 — `v3.0.0-rc.1`.
- [ ] M5.2 — Fixture desde cero, matriz muestreada (Windows/Ubuntu × online/offline × 3 herramientas).
- [ ] M5.3 — Fixtures de migración v2.0.0…v2.0.6 + Starter v2.0.4.
- [ ] M5.4 — Canary real en `template-starter`. Requiere **D4**.
- [ ] M5.5 — `v3.0.0` estable.

## M6 — Oleadas GI

Cada oleada requiere autorización explícita separada. Orden: `gi-common-persons` → `gi-platform-core` (+ pack) → `gi-common-tenants`/`gi-common-crm` → verticales y apps.

- [ ] M6 — Rollout completo; 0 consumidores v2 → archivar `template`.

## Decisiones humanas y acciones pendientes

| # | Qué | Bloquea |
|---|---|---|
| D1 | Visibilidad de `ai-native` (pública recomendada) | M0.3b, M4.2 |
| D3 | Aprobar deprecaciones D-1…D-6 y el lote de legado | M3 |
| D4 | Autorizar canary real en `template-starter` | M5.4 |
| A1 | Crear identidad propia del agente (`ai-native-agent`) | M4.3 |
| A2 | Crear rulesets en repos públicos | M0.0b, M6 |
| A3 | Crear GitHub App `ai-native-gate` (P44) | M4.3 |

## Condiciones P1–P45

Ver Contrato de Paridad (ADR-002) para la lista completa con fase y test asignado. Umbral resumido:

- Antes de `alpha.1` (M4.2): P1–P3, P13, P15–P19, P22–P26, P37, P38, P40, y la parte runtime de P45.
- Antes de `rc.1` (M5.1): + P4–P9, P12, P14, P20, P21, P27–P31, P33, P34, P36, P39a/b, P41–P45 completo.
- Antes del canary (M5.4): + P11, P32, P35.
- Antes de cualquier repo GI (M6): P1–P45 completas.
