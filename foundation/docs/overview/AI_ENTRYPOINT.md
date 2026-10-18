# AI Entrypoint


- **Bootstrapping:** `tools/bootstrap.py`
    - **Propósito:** Automatiza la creación de proyectos (Clonación, Identidad, Git y Memoria).
    - **Uso:** Ejecutar `python tools/bootstrap.py` desde la terminal.Si eres un agente de IA, comienza aquí.

Este repositorio forma parte de un ecosistema de desarrollo asistido por IA.

---

# Primeros pasos

1. Leer:

AI_ECOSYSTEM.md

para comprender la relación entre repositorios.

2. Revisar:

.ai/index.md

para entender el contexto del proyecto.

3. Consultar:

AGENTS.md

para conocer las reglas de comportamiento del agente.

---

# Navegación rápida

Contexto del proyecto:

.ai/context.md

Reglas de arquitectura:

.ai/architecture_guardrails.md

Conocimiento del proyecto:

knowledge/

Código fuente:

src/

---

# Objetivo

Permitir que agentes de IA comprendan rápidamente:

- el propósito del repositorio
- las reglas del proyecto
- dónde encontrar información relevante

---

# Platform Tools

Herramientas para la automatización y mantenimiento del ecosistema.

- **Bootstrapping:** `tools/bootstrap.py` (Script para crear nuevos proyectos).
  
# 🛠️ Herramientas de Plataforma (GI AI-Native)

Estas herramientas automatizan el ciclo de vida de los proyectos basados en este framework.

*   **Bootstrapping:** `tools/bootstrap.py`
    *   **Propósito:** Clonar la plantilla oficial, inyectar identidad y activar la memoria del proyecto.
    *   **Uso:** Ejecutar `python tools/bootstrap.py` desde la terminal para crear una nueva instancia de proyecto.
    *   **Gobernanza:** El script asegura que el nuevo proyecto herede todas las reglas de `.antigravity/` y `AGENTS.md` de esta fundación.
  

