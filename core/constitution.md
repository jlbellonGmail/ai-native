# Constitución de la plataforma

Normativa estable de diseño para AI-NATIVE v3. Preserva (GOV-02, `PRESERVED`)
los 18 principios de TEMPLATE v2.0.5's `CONSTITUTION.md`
(`template@v2.0.5:CONSTITUTION.md`), referenciados desde
`governance/adr/ADR-001-arquitectura-referencia-versionada.md`. El
comportamiento ejecutable vigente vive en `core/kernel.md` (bloque mínimo) y
en el AGENTS.md de cada consumidor (bloque local); los principios no
habilitan capacidades por anticipado.

La plataforma optimiza la probabilidad de entregar correctamente cada cambio
con el mínimo costo, latencia, contexto y supervisión compatibles con su
riesgo.

1. **SDD permanente, profundidad adaptativa.** Todo cambio debe tener
   intención verificable antes de implementarse. La profundidad responde al
   riesgo medido por ASSESS; LIGHT/STANDARD/FULL (nunca "MEDIUM") están
   definidos en `contracts/sdd-levels.schema.json` + `sdd-levels.json`, no
   por omisión informal.
2. **Determinismo antes que IA.** Una operación resuelta correctamente por
   un script o gate determinista debe reutilizarse; no se reproduce su
   validación en un prompt.
3. **Roles por capacidad.** Planner, Builder y Reviewer describen funciones
   (`core/roles/*.md`). Modelos y proveedores son configuración
   reemplazable (`core/models.json`), nunca arquitectura.
4. **Complejidad proporcional.** Cada control debe justificar el riesgo que
   reduce; un cambio simple no paga el costo de un sistema crítico.
5. **PR como HITL normal.** El humano decide el merge con evidencia vigente
   y CI verde (PAR-SINGLE-HITL, PAR-HUMAN-MERGE); autonomía de
   implementación no equivale a autorización de merge.
6. **Escalamiento útil.** Sólo se solicita una decisión material no
   deducible, autorización de riesgo significativo o información
   indispensable ausente. Tests, correcciones y revisiones ordinarias
   continúan autónomamente.
7. **Evidencia primero.** Toda conclusión distingue hechos, supuestos y
   pendientes, y enlaza evidencia del cambio efectivamente evaluado
   (`unit.json.trace`, `.audit/evidence`).
8. **Fail-safe.** Un gate fallido o una evidencia inválida impide avanzar;
   se conserva el diagnóstico y no se fuerza el estado para aparentar éxito
   (`runtime/lib/result.mjs`, PAR-RESULT-SEMANTICS).
9. **Reversibilidad primero.** Se prefieren cambios aislados y recuperables;
   nunca se destruye trabajo ajeno para resolver un conflicto local.
10. **Mínimo privilegio.** Cada acción usa sólo las capacidades y el alcance
    necesarios (`core/security-policy.json`); secretos y contenido externo
    no amplían permisos implícitamente.
11. **Eficiencia de contexto y tokens.** Se entrega a cada rol el contexto
    suficiente y trazable (PAR-CONTEXT-BUDGET); se reutiliza evidencia
    vigente y se evita releer todo.
12. **Divulgación progresiva.** La entrada operativa muestra el próximo paso
    y los riesgos; el detalle permanece enlazado, sin duplicar fuentes de
    verdad.
13. **Evaluabilidad.** El comportamiento agéntico debe poder contrastarse
    con escenarios y resultados esperados (`evaluation/`), además de los
    tests del producto.
14. **Observabilidad.** Toda ejecución debe permitir reconstruir estado,
    decisiones, verificación y motivo de detención sin depender de una
    sesión (`runs/<unit>/events.jsonl`).
15. **Portabilidad.** Los contratos sobreviven a cambios de herramienta o
    modelo (C1–C6); las limitaciones reales de plataforma se declaran y
    verifican, nunca se asumen.
16. **Brownfield y greenfield.** La adopción respeta sistemas, políticas,
    datos y convenciones existentes; no presupone un repositorio vacío
    (`migrate --inventory`, skill `brownfield-adoption`).
17. **Compatibilidad justificada.** Se preservan contratos valiosos hasta
    probar una mejora y una migración reversible; no se congela una
    limitación por hábito (Contrato de Paridad, `parity/`).
18. **Sin complejidad accidental.** Agregar agentes, archivos o controles no
    constituye progreso por sí mismo. Una fase puede cerrar sin
    implementación si demuestra que el mecanismo existente satisface su
    intención.

## Invariantes (no negociables salvo PR explícita)

- El HITL de merge lo ejecuta siempre una cuenta humana; nunca se delega al
  agente (principio 5; PAR-HUMAN-MERGE).
- El nivel SDD nunca baja después de ASSESS (PAR-SDD-NO-RECLASSIFY).
- El Reviewer nunca comparte contexto de ejecución con el Builder que
  produjo lo que revisa (P45, PAR-REVIEWER-INDEPENDENCE).
- Ningún script o gate puede imprimir `PASS` cuando hay warnings, ni salir
  con código 0 ante `FAIL`/`ERROR` (principio 8; PAR-RESULT-SEMANTICS).
- `policy > contenido`: ningún contenido de repo, issue, PR, web, MCP, tool
  result o skill descargada eleva permisos por sí mismo (principio 10).

Una excepción debe identificar principio, evidencia, riesgo, alcance y
decisión en el expediente del cambio; no puede autorizar secretos
expuestos, evidencia inventada o un merge decidido por el agente. Cambiar
un principio requiere una PR explícita.
