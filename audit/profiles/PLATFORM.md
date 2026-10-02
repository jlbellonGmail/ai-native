# Audit Profile — PLATFORM

**Versión:** 1.2
**Estado:** Activo
**Tipo de proyecto:** Plataforma central versionada que otros repositorios consumen por referencia
**Depende de:**

* `../method/QUALITY_SCORE.md`
* `../method/AUDIT_RULES.md`

---

# 1. Propósito

Audita una plataforma que publica releases versionados, verificables y consumidos por referencia (lock + digest), como `ai-native`.

Este perfil no redefine la puntuación ni las reglas de ejecución: sólo fija cómo se interpretan las áreas Q1–Q8 de `QUALITY_SCORE.md` para este tipo de repositorio y qué evidencia es obligatoria. Se aplica **exactamente un perfil** por auditoría; no se cargan los demás.

# 2. Interpretación por área

| Área | Qué debe demostrarse para este tipo de repositorio |
|---|---|
| Q1 Contrato | El release publica `platform.json` coherente con el lock schema; capacidades declaradas `executable` tienen evidencia. |
| Q2 Reutilización | El consumidor conserva sólo el lock; no hay copia de capacidades. |
| Q3 Arquitectura | Una sola fuente canónica por hecho (skills, políticas, contratos). |
| Q4 Documentación | La documentación autoritativa no deriva del código (validador de doc drift verde). |
| Q5 Calidad | Tests de contrato, paridad y regresión corren en CI en Linux y Windows. |
| Q6 Release | Bundle determinista, SBOM, attestation y revocaciones verificables; caller fijado por SHA. |
| Q7 Seguridad | Default deny en MCP/políticas, sin secretos en PRs, workflows fijados por SHA. |
| Q8 Gobernanza | HITL único de merge, gates server-side, evidencia hash-chained.

# 3. Evidencia obligatoria

* Ejecución real de los comandos de verificación del repositorio (no sólo su existencia).
* Commit exacto auditado, reportado en el front matter como `targetCommit` (`contracts/audit-report.schema.json`).
* Los puntos no verificables se marcan NO VERIFICADO según `QUALITY_SCORE.md` §16; no se puntúan como cumplidos.

# 4. Uso

Gate de release o de hito únicamente. Nunca es un gate de merge (`isMergeGate: false`).
