# PROJECT START PROMPT
Inicialización de Agente para Desarrollo del Proyecto

Este prompt debe ejecutarse al iniciar una sesión de trabajo
con Antigravity o cualquier agente de desarrollo.

Su objetivo es asegurar que el agente comprenda el proyecto
antes de realizar cualquier acción.

---

# Paso 1 — Comprensión del Proyecto

Lee completamente los siguientes documentos:

1. README.md
2. docs/explanation/PRD.md
3. docs/explanation/MVP.md
4. docs/explanation/HELP_SYSTEM.md

Estos documentos definen:

- propósito del proyecto
- alcance funcional
- restricciones
- criterios de éxito

No continúes hasta haberlos analizado.

---

# Paso 2 — Comprensión de Arquitectura

Analiza la estructura del repositorio.

Debes respetar:

Arquitectura Hexagonal

Separación obligatoria de capas:

- domain
- application
- infrastructure

La lógica de negocio nunca debe depender
de frameworks o tecnologías externas.

---

# Paso 3 — Reglas del Sistema

Debes cumplir estrictamente las reglas definidas en:

.cursorrules.md  
AGENTS.md  
antigravity.rules.md  

Estas reglas definen:

- cómo escribir código
- cómo documentar
- cómo crear nuevas funcionalidades
- cuándo detenerte y pedir aclaración

Si existe conflicto entre reglas:

AGENTS.md tiene prioridad.

---

# Paso 4 — Sistema de Skills

Revisa el catálogo de skills:

docs/skills/catalog.md

Las skills disponibles deben utilizarse cuando
la tarea lo requiera.

Ejemplos:

- marketing
- diseño UI
- arquitectura
- discovery de producto

Si una skill no está disponible,
debes informar antes de continuar.

---

# Paso 5 — Sistema de Prompts

Los prompts del sistema se organizan en:

prompts/system  
prompts/domain  
prompts/guardrails  

Debes cargar este contexto antes de generar:

- código
- arquitectura
- decisiones de producto

---

# Paso 6 — Sistema de Ayuda

Este proyecto posee un sistema de ayuda obligatoria.

Definido en:

docs/explanation/HELP_SYSTEM.md

Regla fundamental:

Ninguna funcionalidad puede considerarse completa
si no posee documentación asociada.

Debes generar documentación en:

docs/tutorials/ui_help  
docs/tutorials/dev_help  

cuando corresponda.

---

# Paso 7 — Gobernanza del Desarrollo

El desarrollo sigue este orden:

1. PRD
2. MVP
3. implementación

No puedes:

- inventar funcionalidades
- ampliar el alcance del MVP
- modificar arquitectura sin autorización.

---

# Paso 8 — Protocolo de Ejecución

Para cada nueva funcionalidad debes seguir este flujo:

1. analizar requerimiento
2. proponer arquitectura
3. identificar riesgos
4. esperar confirmación
5. implementar
6. documentar

---

# Paso 9 — Control de Alcance

Si una tarea:

- no está en el PRD
- no está en el MVP

debes detenerte y preguntar.

---

# Paso 10 — Confirmación

Antes de comenzar cualquier implementación:

Resume:

- tu comprensión del proyecto
- el objetivo de la tarea actual
- los riesgos potenciales

Luego espera confirmación del usuario.