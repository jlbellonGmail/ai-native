# Antigravity Rules — AI Project Foundation

Este archivo define las reglas operativas que deben seguir los agentes de IA que trabajan dentro de este repositorio.

El objetivo es garantizar que cualquier agente respete:

- la arquitectura del framework
- la documentación oficial
- el sistema de prompts
- el sistema de roles
- las políticas de gobernanza
- las reglas de calidad del desarrollo

---

# 1. Lectura Obligatoria Inicial

Antes de realizar cualquier tarea, el agente debe revisar los siguientes documentos:

1. README.md
2. docs/explanation/AI_PROJECT_FOUNDATION.md
3. docs/explanation/MVP.md
4. docs/explanation/PRD.md
5. docs/explanation/HELP_SYSTEM.md
6. docs/skills/catalog.md
7. docs/skills/policies.md

Estos documentos definen:

- propósito del framework
- alcance funcional
- arquitectura conceptual
- sistema de ayuda
- habilidades disponibles
- políticas de calidad

---

# 2. Principios de Trabajo del Agente

El agente debe seguir estos principios:

1. No implementar funcionalidades fuera del alcance definido.
2. No modificar arquitectura sin justificación explícita.
3. No crear features sin documentación asociada.
4. Mantener coherencia con la arquitectura del framework.
5. Priorizar claridad, simplicidad y mantenibilidad.

---

# 3. Arquitectura del Framework

Este repositorio define **estructura y gobernanza**, no aplicaciones productivas.

Por lo tanto:

- no se debe agregar código de aplicación
- no se deben incluir implementaciones específicas de negocio
- el framework debe mantenerse genérico y reutilizable

Las aplicaciones reales se crean utilizando:

ai-project-template

---

# 4. Sistema de Prompts

Los prompts oficiales del framework se encuentran en:

prompts/

Estructura:

prompts/
system/
domain/
guardrails/

Los agentes deben consultar estos prompts antes de generar código o respuestas.

---

# 5. Sistema de Skills

Las habilidades disponibles para los agentes se encuentran en:

docs/skills/catalog.md

Estados posibles de una skill:

- proposed
- in_evaluation
- curated
- deprecated

Solo las skills **curadas** pueden usarse automáticamente.

---

# 6. Documentación Obligatoria

Cada cambio debe incluir documentación correspondiente.

La documentación puede incluir:

- explicación técnica
- referencia
- tutorial
- guía de usuario

Una funcionalidad no se considera completa sin documentación.

---

# 7. Flujo de Trabajo del Agente

Flujo recomendado:

1. Leer documentación relevante
2. Analizar el problema
3. Proponer solución
4. Evaluar riesgos
5. Implementar cambios
6. Actualizar documentación

---

# 8. Seguridad

El agente nunca debe:

- exponer API keys
- incluir secretos en el repositorio
- modificar configuraciones críticas sin aprobación humana

---

# 9. Gobernanza Humana

Las siguientes decisiones requieren aprobación humana:

- cambios de arquitectura
- cambios en el framework
- incorporación de nuevas políticas
- cambios en el sistema de agentes

---

# 10. Objetivo del Sistema

El objetivo del agente es contribuir a construir un framework que permita desarrollar:

software mantenible, documentado, seguro y colaborativo entre humanos e inteligencia artificial.