# Arquitectura — decisiones estructurales del repositorio

`AGENTS.md` (sección "Reglas de dominio") exige que ningún backend, base
de datos, integración externa o dependencia de build se incorpore al
repositorio sin que quede como una decisión explícita en este archivo.

Este template no fija stack: arranca sin código de producto, solo con el
circuito agéntico y su motor ejecutable (`scripts/*.ps1`). Cuando el
proyecto real que use este template agregue su primera pieza de stack
(frontend, backend, base de datos, hosting, integración externa),
documentar acá:

- **Qué se agrega** y en qué archivos/carpetas.
- **Por qué ahora**: qué feature o necesidad lo dispara.
- **Por qué este enfoque y no otro**: alternativas consideradas y motivo
  del descarte.
- **Qué sigue igual**: qué partes del repo no cambian con esta decisión.

Cada decisión nueva se agrega como una sección propia (`## Decisión:
<título>`), sin reescribir ni borrar las anteriores — este documento es
un historial acumulativo de arquitectura, no un snapshot que se
sobreescribe.

## Decisión: fuente canónica agentica y router de modelos

Los roles, modelos, fallbacks y MCP del circuito se centralizan en
`.agentic/` para evitar tres copias manuales entre Claude Code, Codex y
OpenCode.

- `AGENTS.md` conserva las reglas compartidas del repo.
- `.agentic/roles/*.md` contiene la definición funcional canónica por rol.
- `.agentic/agents.json` contiene metadatos, permisos y modelos por
  herramienta.
- `.agentic/models.json` contiene el router mínimo de modelos OpenCode,
  allowlists, variantes válidas, variables de entorno esperadas y
  fallbacks autorizados.
- `.agentic/mcp.json` contiene la fuente MCP canónica. Está vacía porque
  el template no necesita servidores MCP propios todavía.
- `.agents/skills/` es la fuente canónica de skills portables; los mirrors
  en `.claude/skills/` y `.opencode/skills/` se generan si existen skills.

Los adaptadores generados son `.claude/agents/*.md`, `.codex/config.toml`,
`.codex/<role>.config.toml`, `.mcp.json` y `opencode.json`. Se regeneran
con `scripts/sync-agentic-adapters.ps1` y se validan con el mismo script
en modo `-Check`.

El router de modelos se implementa en `scripts/resolve-agentic-model.ps1`.
Resuelve el modelo antes de iniciar cada agente, usando primero una
selección explícita, luego `runs/<NN>-<slug>/run.yaml` y finalmente el
default del rol. La variante se valida separada del modelo. Los fallbacks
no son silenciosos: se registran con motivo en `model-routing.jsonl` y
OpenRouter solo se habilita si se declara explícitamente.

La decisión no introduce backend, base de datos, servicio externo nuevo ni
dependencia de build. Solo agrega configuración, scripts PowerShell y
tests del circuito.
