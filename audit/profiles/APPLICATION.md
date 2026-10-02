# Audit Profile — APPLICATION

**Versión:** 1.2
**Estado:** Activo
**Tipo de proyecto:** Aplicación o servicio con usuarios finales
**Depende de:**

* `../method/QUALITY_SCORE.md`
* `../method/AUDIT_RULES.md`

---

# 1. Propósito

Audita una aplicación o servicio que se despliega y opera, no una librería ni una plantilla.

Este perfil no redefine la puntuación ni las reglas de ejecución: sólo fija cómo se interpretan las áreas Q1–Q8 de `QUALITY_SCORE.md` para este tipo de repositorio y qué evidencia es obligatoria. Se aplica **exactamente un perfil** por auditoría; no se cargan los demás.

# 2. Interpretación por área

| Área | Qué debe demostrarse para este tipo de repositorio |
|---|---|
| Q1 Contrato | El comportamiento documentado coincide con el implementado (rutas, configuración, SLAs declarados). |
| Q2 Reutilización | Reproducible desde cero: instalación, migraciones y arranque sin pasos manuales ocultos. |
| Q3 Arquitectura | Límites de módulos claros, sin acoplamiento accidental ni código muerto. |
| Q4 Documentación | README operativo: instalación, configuración, operación, troubleshooting. |
| Q5 Calidad | Pruebas unitarias, de integración y e2e sobre rutas críticas; regresión automatizada. |
| Q6 Release | Versionado, pipeline reproducible, rollback documentado y probado. |
| Q7 Seguridad | Gestión de secretos, dependencias auditadas, validación de entradas, authn/authz verificadas. |
| Q8 Gobernanza | Trazabilidad cambio→PR→release; observabilidad y manejo de incidentes.

# 3. Evidencia obligatoria

* Ejecución real de los comandos de verificación del repositorio (no sólo su existencia).
* Commit exacto auditado, reportado en el front matter como `targetCommit` (`contracts/audit-report.schema.json`).
* Los puntos no verificables se marcan NO VERIFICADO según `QUALITY_SCORE.md` §16; no se puntúan como cumplidos.

# 4. Uso

Gate de release o de hito únicamente. Nunca es un gate de merge (`isMergeGate: false`).
