# audit/ — método de auditoría central (auditMethod 1.2)

Método de auditoría de la plataforma, migrado de TEMPLATE v2.0.5 (`.audit`, método 1.1, AUD-01..05).

| Ruta | Contenido |
|---|---|
| `method.json` | Versión del método (`platform.json` → `components.auditMethod`) y estado de cada perfil |
| `method/QUALITY_SCORE.md` | Estándar de puntuación Q1–Q8 (importado sin cambios de 1.1) |
| `method/AUDIT_RULES.md` | Reglas de ejecución del auditor (importado sin cambios de 1.1) |
| `method/AUDIT_PROMPT.md` | Prompt maestro, parametrizado por perfil |
| `profiles/` | `PLATFORM`, `APPLICATION`, `LIBRARY`, `FACTORY`; `TEMPLATE` se conserva para consumidores v2 |

Lo que es local por consumidor (AUD-04): `.audit/reports/`, `.audit/evidence/`, `.audit/history/`. Cada informe lleva el front matter de `contracts/audit-report.schema.json`, con `targetCommit` exacto.

Reglas de la plataforma (`runtime/audit/`):

* Una auditoría del commit X no es una certificación permanente: un informe sólo es evidencia vigente para el commit auditado o para un descendiente cuya diferencia neta sea únicamente `.audit/**` y `STATUS.md`.
* `.audit` es gate de release o de hito, con tolerancia de puntaje; nunca gate de merge.
* Un perfil que no esté `Activo` no puede usarse para puntuar.

Comandos: `node runtime/audit/cli.mjs check` (estructura del método), `node runtime/audit/cli.mjs release-gate --profile <P> --candidate <sha> [--reports <dir>]`.
