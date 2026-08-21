# Fuente canonica agentica

`.agentic/` contiene la configuracion canonica del circuito agentico que
no pertenece a una herramienta concreta.

- `agents.json`: metadatos por rol, modelos por herramienta y permisos de
  adaptador.
- `roles/*.md`: definicion funcional canonica de cada rol.
- `models.json`: router minimo de modelos para OpenCode, allowlists,
  credenciales esperadas y fallbacks autorizados.
- `mcp.json`: fuente canonica de servidores MCP del template. Arranca
  vacia a proposito; no se inventan servidores.
- `run.example.yaml`: declaracion minima previa a `spec.md` para elegir
  modelo, variante y fallback.

Editar estos archivos y luego ejecutar:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agentic-adapters.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agentic-adapters.ps1 -Check
```

Los adaptadores en `.claude/`, `.codex/`, `.opencode/` y `opencode.json`
se regeneran desde esta fuente. No editarlos manualmente.
