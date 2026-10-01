# Roles

Cinco roles funcionales (SS 6.1 del plan maestro de M2). Solo tres son
invocaciones de un modelo con un prompt propio y tienen archivo en este
directorio; los otros dos no son "agentes" en el sentido de `core/agents.json`.

| Rol | Archivo | Tipo |
|---|---|---|
| Planner | `planner.md` | LLM |
| Builder | `builder.md` | LLM |
| Reviewer | `reviewer.md` | LLM, invocación separada (P45) |
| Orchestrator | — | runtime determinista (`runtime/circuit`, M3.2) |
| Humano | — | la cuenta que mergea; nunca el agente |

Permisos de cada rol: `core/security-policy.json` (matriz capacidad × rol).
Configuración por herramienta (modelo, tools, permisos): `core/agents.json`
+ `core/models.json`.
