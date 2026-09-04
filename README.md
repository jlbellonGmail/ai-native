# AI-Native Template - Quick Start

Bienvenido al template AI-Native con circuito agente completo. Sigue estos 3 pasos
para tener tu proyecto operativo en menos de 5 minutos.

## 🚀 PASO 1: Clonar y configurar

```bash
# Clonar el template
git clone https://github.com/tu-usuario/tu-proyecto.git
cd tu-proyecto

# Inicializar el circuito agente
git checkout -b develop
git push -u origin develop
```

## 🤖 PASO 2: Activar el circuito

```bash
# 1. Sincronizar adaptadores para Claude Code, opencode y Codex
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agentic-adapters.ps1

# 2. Validar estructura y tests
pytest -v tests/

# 3. Marcar feature READY_FOR_PR y crear PR
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\ready-for-pr.ps1 -Mode Feature -Slug 01-mi-feature
```

## 📋 PASO 3: Flujo completo

```bash
# El circuito fluye automáticamente:
# Analyst-agent → spec.md, plan.md, tasks.md
# Reviewer-agent → audit verificación
# Builder-agent → código + documentación
# QA-agent → tests + validación de contrato
# Code-Reviewer-agent → revisión final diff
# HITL humano → aprobacion MERGE/NO MERGE en GitHub
# Post-HITL gate → merge automático si checks verdes
# Post-merge close → ROADMAP.md [ ] → [x] automático
```

## 💻 Compatibilidad de plataforma

El motor del circuito (`scripts/*.ps1`) es PowerShell **por decisión
explícita**, no por descuido — ver "Decisión: motor de scripts en
PowerShell, plataforma primaria Windows" en `docs/tecnica/arquitectura.md`.

- La mayoría de los scripts corren igual en Windows, macOS o Linux con
  **PowerShell 7 (`pwsh`)**: `brew install --cask powershell` (macOS) o
  el paquete `powershell` de Microsoft para `apt`/`dnf` (Linux).
- Excepción: el reconciliador local
  (`scripts/local-feature-reconcile.ps1`, invocado por
  `ready-for-pr.ps1`/`complete-approved-pr.ps1` para limpiar
  worktree/rama tras un merge) usa `Start-Process -WindowStyle Hidden` y
  en un punto llama directo a `powershell.exe`. Solo está validado en
  Windows. Si no arranca en tu plataforma, no bloquea el circuito: es
  limpieza local de conveniencia (CI, el gate post-HITL y el cierre
  remoto de `ROADMAP.md` corren en GitHub Actions, no dependen de esto).
  Alternativa manual: `git worktree remove` + `git branch -d`.

## 📁 Estructura importante

- `.agentic/` - Configuración de roles, modelos y schemas JSON
- `scripts/` - Motor ejecutable (ver `scripts/*.ps1` para el listado y número actuales)
- `tests/` - tests de validación estructural del circuito (correr `pytest -v tests/` para el número y detalle actuales)
- `docs/producto/contexto-producto.md` - Conocimiento funcional persistente
- `docs/tecnica/` - Decisiones de diseño e implementación
- `docs/usuario/` - Guía de uso y propósito
- `ROADMAP.md` - Estados `[ ]` pendiente, `[−]` READY_FOR_PR, `[x]` completado

## 🆘 ¿Problemas?

- Si los adapters están desactualizados: `scripts/sync-agentic-adapters.ps1 -Check`
- Si los tests fallan: revisa `tests/test_workunit_lib.py` y `tests/test_ci_integration.py`
- Si el circuito no avanza: revisa `ROADMAP.md` estados y `spec.md` criterios de aceptación

## 📚 Más información

- `AGENTS.md` - Reglas compartidas del repositorio
- `ROADMAP.md` - Mapa de features y estados
- `docs/producto/contexto-producto.md` - Contexto del producto
- `.github/workflows/ci.yml` - Workflows de integración continua

---

**¿Listo para comenzar?** Clona el template y ejecuta el Paso 1 arriba.