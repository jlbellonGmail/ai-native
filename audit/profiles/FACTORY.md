# Audit Profile — FACTORY

**Versión:** 1.2
**Estado:** Activo
**Tipo de proyecto:** Fábrica de proyectos y de capacidades agénticas (el propio ai-native como repositorio de trabajo)
**Depende de:**

* `../method/QUALITY_SCORE.md`
* `../method/AUDIT_RULES.md`

---

# 1. Propósito

Audita el repositorio de trabajo de la fábrica: gobernanza, roadmap, circuito agéntico y capacidades que luego se publican.

Este perfil no redefine la puntuación ni las reglas de ejecución: sólo fija cómo se interpretan las áreas Q1–Q8 de `QUALITY_SCORE.md` para este tipo de repositorio y qué evidencia es obligatoria. Se aplica **exactamente un perfil** por auditoría; no se cargan los demás.

# 2. Interpretación por área

| Área | Qué debe demostrarse para este tipo de repositorio |
|---|---|
| Q1 Contrato | El roadmap, los contratos y el plan de paridad coinciden con lo implementado (UNMAPPED=0). |
| Q2 Reutilización | Lo que sale de la fábrica se genera/deriva, no se copia a mano. |
| Q3 Arquitectura | Áreas con responsabilidad única; legado congelado en `legacy/`. |
| Q4 Documentación | AGENTS.md agnóstico y sin estado temporal; estado sólo en governance/. |
| Q5 Calidad | Toda fase cerrada tiene tests y evidencia de CI real; sin tests degradados. |
| Q6 Release | Fases cierran por merge con CI verde; sin cierre sin push. |
| Q7 Seguridad | P1–P45 vigentes; sin ejecutar código no confiable con token de escritura. |
| Q8 Gobernanza | Una unidad de trabajo por ejecución; revisor independiente (P45); evidencia hash-chained.

# 3. Evidencia obligatoria

* Ejecución real de los comandos de verificación del repositorio (no sólo su existencia).
* Commit exacto auditado, reportado en el front matter como `targetCommit` (`contracts/audit-report.schema.json`).
* Los puntos no verificables se marcan NO VERIFICADO según `QUALITY_SCORE.md` §16; no se puntúan como cumplidos.

# 4. Uso

Gate de release o de hito únicamente. Nunca es un gate de merge (`isMergeGate: false`).
