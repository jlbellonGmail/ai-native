# M2.3 — Spike de compatibilidad C1–C4

Spike de compatibilidad real (no inferida) contra Claude Code, Codex CLI y
OpenCode, con fixtures mínimos y reproducibles. Entrada para `runtime/
adapters` (M3.3) y para la matriz completa contra fixture + Starter (M5.2).

| Archivo | Contenido |
|---|---|
| `compat-matrix.json` | Hallazgos estructurados, legibles por máquina: un registro por (herramienta, capacidad) con `status` (`CONFIRMED` / `PARTIAL` / `NOT_AVAILABLE_FROM_TOOL`) y un puntero a la evidencia. |
| `findings.md` | Narrativa con los comandos reales ejecutados y extractos reales de su salida. |
| `fixtures/{claude,codex,opencode}/` | Los árboles mínimos usados (AGENTS.md, skill `ping`, settings/config por herramienta). Reproducibles: `cd fixtures/<tool> && <comando de findings.md>`. |
| `validate-compat-matrix.mjs` | Validador estructural dependencia-cero (no reejecuta las CLIs; valida que cada hallazgo tenga evidencia real o un fallback documentado). |

## Por qué esto no corre en `pr-gate`

Estas invocaciones usan CLIs reales con credenciales y costo, y no son
deterministas (plan maestro §12.5: "las evaluaciones estocásticas nunca
corren en `pr-gate`"). `validate-compat-matrix.mjs` sí corre en CI — valida
la *estructura* de los hallazgos ya capturados, no re-ejecuta las
herramientas. La re-ejecución real contra fixture + Starter es trabajo de
M5.2 (workflow confiable, no gateado por PR).

## Metodología

1. Un fixture mínimo por herramienta: `AGENTS.md` + una skill `ping`
   trivial + el archivo de config/permisos propio de la herramienta.
2. Invocación no interactiva real (`claude -p`, `codex exec`, `opencode
   run`), con salida JSON cuando el CLI lo soporta.
3. Cada fila de `compat-matrix.json` cita el extracto real de esa salida en
   `findings.md`. Donde una capacidad no se pudo verificar con evidencia
   real, `status: NOT_AVAILABLE_FROM_TOOL` (o `PARTIAL` si hay evidencia
   parcial, p. ej. "el mecanismo existe" sin verificar su sintaxis
   completa) — nunca se asumió compatibilidad.
4. Cada entrada `NOT_AVAILABLE_FROM_TOOL` trae un fallback decidido en sus
   `notes`.
