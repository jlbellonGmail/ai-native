# Requisitos normativos del Plan Maestro (extracto versionado)

> Extracto **literal** de tres secciones del Plan Maestro de AI-NATIVE v3 (que vivía solo en el plan de sesión del maintainer,
> fuera del repo): §21 *Condiciones P1-P45 y umbrales por hito*, §15.4 *Tests de compatibilidad C1-C6* y §27 *Definition of Done*.
> Se versiona aquí para que los criterios de salida de cada hito (alpha, rc, canary, M6) sean auditables desde el repositorio.
> El Plan completo sigue siendo la fuente; este archivo no lo reemplaza ni lo modifica. Copiado el 2026-10-03 desde el archivo de plan del maintainer
> (ver `SESSION-CONTEXT.md`). Los PAR-tests que demuestran cada condición están registrados en `parity/par-tests.json`.

## 21. Condiciones P1–P43

P1–P14 vienen de la DAC. P15–P21 salen del addendum. P22–P36 salen de Y38. P37–P41 son nuevas. P42–P43 salen de la revisión crítica (§31).

| P# | Condición | Estado actual | Evidencia actual | Falta | Fase | Test / demostración |
|---|---|---|---|---|---|---|
| P1 | Gobernanza reconciliada (incluye H5/H7) | FAIL | Consolidación sin registrar; `cba745a`/`8582290` NOT_FOUND | Registrar, ADRs, rutas | M0.1–M0.2 | Grep de `ai-*` = 0; validador de gobernanza |
| P2 | CI de la raíz en verde | FAIL | No existe `.github` en la raíz | ci.yml + mover workflows | M0.3 | Run remoto en verde |
| P3 | Semántica de resultados | FAIL | check-status y quality-gates dan exit 0 ante fallo | Librería + conformidad | M0.4/M3.1 | PAR-RESULT-SEMANTICS |
| P4 | Gate privilegiado seguro | FAIL (vulnerable) | post-hitl l.64-91 | Contención + rediseño | M0.0/M4.3 | PAR-MERGE-GATE-TRUST |
| P5 | Referencias inmutables | PARTIAL | El Template fija acciones; foundation usa `@master`/tags | pr-gate valida | M4.3 | PAR-SUPPLY-CHAIN |
| P6 | Integridad del manifest | MISSING | — | bootstrap verify | M4.1–M4.2 | PAR-CACHE-*, verify de digest/attestation/revocación |
| P7 | Bootstrap desde clon limpio (Win/Ubuntu) | MISSING | — | bootstrap | M4.1 | Matriz del fixture |
| P8 | Rollback | MISSING | — | — | M4.1/M5.2 | PAR-ROLLBACK-OFFLINE |
| P9 | Enforcement de MCP | FAIL (bug DENY→ALLOW) | mcp-tools l.39-44 | Gateway | M4.4 | PAR-MCP-TRUST |
| P10 | Contrato del generador | Resuelto por diseño | §15.3 | Excluir + documentar; `init` reproducible | M0.2 / M4.1 | Validador de exclusión + PAR-REPRODUCIBLE-INIT |
| P11 | Compatibilidad C1–C6 | NOT_RUN | — | Matriz | M5.2 | C1–C6 |
| P12 | Evals L1/L2 con métricas reales | FAIL | Evals autoconfirmadas; nulls | Harness | M4.6 | PAR-EVAL-REAL |
| P13 | Tests del circuito en la CI de ai-native | MISSING | 264 corren en `template` | Import | M1.1 | CI en verde |
| P14 | Clasificación de migración | MISSING | Anti-drift parcial | migrate | M1.2 | PAR-MIGRATE-CLASSIFY |
| P15 | Paridad SDD en 3 niveles | PARTIAL | Contrato adaptativo v2 | Fuente única + e2e | M3.2 | PAR-SDD-* |
| P16 | Paridad de Work Units | PARTIAL (milestone versionado roto) | — | Fix | M3.2 | PAR-WU-* |
| P17 | Paridad de etapas y roles | PARTIAL (QA sin exec) | — | verify determinista | M3.2 | PAR-SPEC-REVIEW / QA / CODE-REVIEW, PAR-ROLES |
| P18 | Paridad de convergence | PARTIAL (bug, no se invoca) | — | Fix + orquestador | M3.2 | PAR-CONV-* |
| P19 | Autonomía: un único HITL | PARTIAL | Principio sí; gate inseguro | Rediseño del merge | M3.2/M4.3 | PAR-SINGLE-HITL |
| P20 | Eficiencia / fast path medido | MISSING | — | Métricas | M4.1/M5.2 | PAR-CACHE-HIT-FAST-PATH + §27 |
| P21 | Consumidor mínimo | MISSING | Starter con 175 archivos | Bootstrap | M4.1 | PAR-MINIMAL-CONSUMER-FOOTPRINT |
| P22 | Fuente canónica única | FAIL | Docs contradictorias; STATUS como fuente | Reconciliar | M0.1/M3.5 | PAR-CANONICAL-SOURCE (validador de duplicación) |
| P23 | Recovery sin memoria de chat | PARTIAL | Reentrada manual | `recover` | M3.2 | PAR-RECOVERY (interrupción en cada estado) |
| P24 | Idempotencia | PARTIAL | start / complete no idempotentes | Fix | M3.2 | PAR-IDEMPOTENCY |
| P25 | Presupuesto de contexto | FAIL | AGENTS ai-native 866 l. | Kernel ≤60 l. | M2.2/M3.5 | PAR-CONTEXT-BUDGET |
| P26 | Trazabilidad de artefactos | PARTIAL | — | `unit.json.trace` | M3.2 | PAR-TRACE (requisito→merge) |
| P27 | Observabilidad | MISSING | — | Eventos | M4.6 | PAR-OBSERVABILITY-CORRELATION + redacción |
| P28 | Seguridad agéntica | MISSING | — | Matriz §12.3 | M4.3–M4.4 | Tests listados en §12.3 |
| P29 | Supply chain (pinning, provenance verificada, SBOM) | PARTIAL | Workflows inertes | release + verify | M4.2 | Verify rechaza un attestation ajeno |
| P30 | Confianza en MCP | MISSING | — | Gateway | M4.4 | PAR-MCP-TRUST (inyección de un output) |
| P31 | Seguridad brownfield | MISSING | — | migrate | M1.2/M5.3 | PAR-BROWNFIELD-SAFETY |
| P32 | RC / canary | MISSING | — | rc | M5.1/M5.4 | rc.N probado en fixture + Starter |
| P33 | Perfiles de auditoría | FAIL (placeholders) | — | Completar | M4.5 | Auditoría de un fixture APPLICATION y uno LIBRARY |
| P34 | Caché resiliente | MISSING | — | — | M4.1 | PAR-CACHE-* |
| P35 | Drift de documentación | FAIL (13 contradicciones) | — | Validador | M3.5 | PAR-DOC-DRIFT |
| P36 | Routing por evidencia | PARTIAL | Router sin métricas | Métricas + eval | M3.4/M4.6 | PAR-ROUTING-EVIDENCE |
| P37 | STATUS / ROADMAP / runs | PARTIAL | Bugs STA | Fixes | M3.1–M3.2 | PAR-STATUS-*, PAR-ROADMAP, PAR-RUNS |
| P38 | TEST_PARITY | NOT_RUN | 264 en `template` | Mapa + CI | M1.1→M5 | §20.3 |
| P39 | Contención v2 post-HITL | FAIL | §1 | M0.0 (D2) | M0.0 | Workflow deshabilitado/parcheado + autorización reutilizable invalidada |
| P40 | Scorecard de paridad = 0 sin mapear | PASS en diseño (este documento) | §3.2 | Materializar en `parity/` | M0.5 | Validador de `parity/*.json` |
| P41 | Visibilidad y acceso de workflows compatibles con consumidores públicos | FAIL (ai-native privado, consumidores públicos) | `gh api` | D1 | M0.1 (decisión) / M4.3 | C6 |
| P42 | Identidad del agente separada del humano; merge solo humano | FAIL (el agente usa el token del dueño) | `gh auth status`: cuenta del dueño, `repo` + `workflow` | Crear App/PAT (acción humana A1) + ruleset | M4.3 | PAR-AGENT-IDENTITY, PAR-HUMAN-MERGE |
| P43 | Inyección de script en workflows eliminada (B31) | FAIL | post-merge:25, post-hitl:42 | Contención + detector | M0.0/M4.3 | Detector de `pr-gate` + PR fixture con rama maliciosa |
| P44 | **TRUSTED_CALLER_INTEGRITY:** una PR no puede falsificar el check requerido (caller, nombre del job, referencia al reusable o config equivalente). Cadena verificada del lado del servidor: trusted caller → reusable confiable → fuente esperada → `platform.commit` exacto. Control plane evaluado desde la base | FAIL (v2: checks por nombre, fuente GitHub Actions) | Semántica de required checks (§12.1.1) | trust gate + App `ai-native-gate` (A3) + ruleset con fuente = App, o regla nativa de organización si existe | M4.3 | PAR-TRUSTED-CALLER (adversarial: la PR reemplaza el caller por un job que hace `exit 0` → merge bloqueado), PAR-CONTROL-PLANE-AS-DATA |
| P45 | **REVIEWER_INDEPENDENCE_ENFORCEMENT:** el Builder no puede registrar un veredicto de Reviewer; la independencia no depende de un `sessionId` supuesto | FAIL (v2: veredictos como archivos escritos por cualquiera) | §6.1 P45 | Invocación del Reviewer creada por el runtime, ledger, cadena de hash, review-gate en CI para FULL y release | M2.3 (medición) / M3.2 (runtime) / M4.3 (CI) | PAR-REVIEWER-INDEPENDENCE (self-record → REJECT; independiente → ACCEPT), PAR-REVIEW-TAMPER-EVIDENT |

**Consolidaciones:**
- P5 ⊂ P29: pinning. Se mantienen ambas porque P29 agrega provenance y SBOM.
- P9 y P30 comparten el gateway. Se mantienen porque P30 prueba la inyección.

**Umbrales por hito (corregidos; cada condición se exige recién después de la fase que la demuestra):**
- **Antes de `alpha.1` (M4.2):** P1, P2, P3, P13, P15–P19, P22–P26, P37, P38 (la baseline y M3 en verde), P40.
- **Antes de `alpha.1` también:** P45 (parte runtime: self-record → REJECT, cadena de hash).
- **Antes de `rc.1` (M5.1):** lo anterior + P4, P5, P6, P7, P8, P9, P12, P14, P20, P21, P27–P31, P33, P34, P36, P39, P41, P42, P43, **P44** y **P45** completo (incluido el review-gate en CI). Todas se demuestran en M4 con `sync --from-file`, los fixtures y la alpha.
- **P39 queda dividido:** P39a (contención verificada, M0.0v) es **precondición de M0.1**; P39b (corrección v2.0.6) antes de rc.1.
- **Antes del canary real (M5.4):** lo anterior + P11 (C1–C6), P32 (rc probado en el fixture), P35.
- **Antes del primer repo GI (M6):** P1–P45 todas en PASS.

---

---

### 15.4 Tests de compatibilidad de herramientas C1–C6

| ID | Qué prueba | Fallback si falla |
|

---

## 27. Definition of Done de AI-Native v3

- P1–P45 en PASS. TEST_PARITY en verde. `parity/*.json` con `UNMAPPED=0`.
- **P44 demostrado del lado del servidor:** la PR adversarial que reemplaza el caller queda bloqueada por el ruleset.
- **P45 demostrado:** self-record → REJECT; independiente → ACCEPT; alteración detectada.
- `v3.0.0` publicada con digest, SBOM y attestation verificada. Release notes generadas.
- Fixture y Starter canary en verde en la matriz completa.
- **Métricas objetivo (U), medidas contra la baseline v2.0.5:**

  | Métrica | Baseline v2 | Objetivo v3 |
  |---|---|---|
  | Archivos de plataforma gestionados por consumidor | Starter = 175 | ≤ 12 |
  | Bytes copiados por consumidor (bootstrap) | a medir en M5 (Starter) | −90 % |
  | Tiempo de bootstrap con caché | n/a | < 300 ms |
  | Tiempo de bootstrap sin caché | n/a | < 30 s |
  | Llamadas de red por sesión con caché | n/a | 0 |
  | Archivos cambiados por bump MINOR/PATCH | copia de hasta 17 | 2 |
  | Contexto en la reentrada | ≈6.5–7.5k tokens | ≤ 2.5k (kernel + frontmatter de skills) |
  | HITL por unidad | 1 | 1 |
  | Circuitos por milestone | 1 | 1 |
  | Tiempo de validación LIGHT / STANDARD / FULL | a medir | LIGHT ≤ 25 % de FULL |
  | % de capacidades centralizadas | ≈0 % | ≥ 90 % |
  | Drift posible respecto de la plataforma | 17+ archivos copiados | solo 10 puntos de entrada (verificados por pr-gate) |

  Métrica conceptual: **CAPACIDAD / COMPLEJIDAD ↑**.
