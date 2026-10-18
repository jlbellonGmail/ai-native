# AI Agents Guide

Este documento define cómo deben comportarse los agentes de IA al trabajar en este proyecto.

---

# Principios generales

Los agentes deben:

- respetar la arquitectura del proyecto
- evitar introducir complejidad innecesaria
- mantener el código claro y mantenible
- seguir las convenciones del repositorio

---

# Antes de modificar código

Los agentes deben revisar:

.ai/context.md  
.ai/architecture_guardrails.md  
knowledge/  

para entender el proyecto.

---

# Uso del conocimiento del proyecto

Antes de implementar lógica de negocio, los agentes deben revisar:

knowledge/

para entender:

- conceptos del dominio
- reglas de negocio
- decisiones de arquitectura

---

# Uso de AGENTS.md por capa

Al trabajar en una carpeta específica, los agentes deben revisar el archivo:

AGENTS.md

presente en esa carpeta.

Ejemplos:

src/domain/AGENTS.md  
src/application/AGENTS.md  
src/infrastructure/AGENTS.md  

---

# Creación de nuevas funcionalidades

Para agregar nuevas funcionalidades los agentes deben seguir:

.ai/feature_creation_workflow.md

---

# Cambios de arquitectura

Los agentes no deben modificar la arquitectura del proyecto sin aprobación explícita.

Cambios estructurales deben justificarse claramente.