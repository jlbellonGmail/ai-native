# Audit Profile — LIBRARY

**Versión:** 1.2
**Estado:** Activo
**Tipo de proyecto:** Librería o paquete reutilizable
**Depende de:**

* `../method/QUALITY_SCORE.md`
* `../method/AUDIT_RULES.md`

---

# 1. Propósito

Audita una librería publicada para ser consumida por terceros: API pública estable y verificable.

Este perfil no redefine la puntuación ni las reglas de ejecución: sólo fija cómo se interpretan las áreas Q1–Q8 de `QUALITY_SCORE.md` para este tipo de repositorio y qué evidencia es obligatoria. Se aplica **exactamente un perfil** por auditoría; no se cargan los demás.

# 2. Interpretación por área

| Área | Qué debe demostrarse para este tipo de repositorio |
|---|---|
| Q1 Contrato | La API pública documentada es exactamente la exportada; semver respetado. |
| Q2 Reutilización | Instalable en un proyecto limpio; sin dependencias del autor ni del entorno. |
| Q3 Arquitectura | Superficie pública mínima; internos no filtrados. |
| Q4 Documentación | README con instalación, uso mínimo, ejemplos ejecutables y changelog. |
| Q5 Calidad | Tests de la API pública, de compatibilidad entre versiones y de regresión. |
| Q6 Release | Publicación reproducible, tags firmados/verificables, política de deprecación. |
| Q7 Seguridad | Supply chain: dependencias mínimas y fijadas, SBOM/provenance cuando aplica. |
| Q8 Gobernanza | Proceso de contribución y de release trazable.

# 3. Evidencia obligatoria

* Ejecución real de los comandos de verificación del repositorio (no sólo su existencia).
* Commit exacto auditado, reportado en el front matter como `targetCommit` (`contracts/audit-report.schema.json`).
* Los puntos no verificables se marcan NO VERIFICADO según `QUALITY_SCORE.md` §16; no se puntúan como cumplidos.

# 4. Uso

Gate de release o de hito únicamente. Nunca es un gate de merge (`isMergeGate: false`).
