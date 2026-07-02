# Project Context Prompt

Este documento permite que agentes de IA entiendan rápidamente este proyecto.

Los agentes deben leer este archivo antes de comenzar a trabajar.

---

# Qué es este proyecto

Este repositorio es un **AI Project Template** diseñado para construir proyectos de software con soporte para desarrollo asistido por inteligencia artificial.

El objetivo del template es:

- facilitar el desarrollo asistido por IA
- mantener una arquitectura clara
- centralizar conocimiento del dominio
- permitir que agentes de IA trabajen de forma segura en el código

---

# Estructura general del proyecto

El repositorio se organiza en varias áreas principales.

## src/

Contiene el código fuente del proyecto.

Sigue principios de **Clean Architecture**.

Capas principales:

- domain
- application
- infrastructure

### domain

Contiene:

- modelos del dominio
- servicios de dominio
- reglas de negocio

Esta capa debe ser **independiente de frameworks y bases de datos**.

---

### application

Contiene:

- casos de uso
- orquestación de operaciones del sistema

Los casos de uso coordinan lógica del dominio.

---

### infrastructure

Contiene implementaciones técnicas como:

- APIs
- acceso a base de datos
- integraciones externas

No debe contener lógica de negocio.

---

# Conocimiento del proyecto

La carpeta:

knowledge/

contiene conocimiento estructurado sobre el dominio.

Ejemplos:

- conceptos del dominio
- decisiones de arquitectura
- glosario

Antes de implementar lógica de negocio, los agentes deben revisar:

knowledge/index.md

---

# Documentación

La carpeta:

docs/

contiene documentación narrativa como:

- arquitectura
- guías de instalación
- decisiones de diseño

---

# Workflows para IA

La carpeta:

.ai/workflows/

describe procesos de trabajo para agentes de IA.

Ejemplos:

- creación de nuevas funcionalidades
- inicialización de proyectos

---

# Reglas para agentes

Los agentes deben seguir:

.ai/AGENTS.md

---

# Reglas de arquitectura

Los agentes deben respetar:

.ai/architecture_guardrails.md

Estas reglas evitan que la arquitectura del proyecto se degrade.

---

# Reglas específicas por carpeta

Al trabajar en una carpeta específica, los agentes deben revisar el archivo:

AGENTS.md

si existe en esa carpeta.

Ejemplos:

src/domain/AGENTS.md  
src/application/AGENTS.md  
src/infrastructure/AGENTS.md  

---

# Creación de nuevas funcionalidades

Para agregar nuevas funcionalidades seguir el workflow:

.ai/feature_creation_workflow.md

---

# Inicialización del proyecto

Para iniciar un nuevo proyecto seguir:

.ai/project_bootstrap_workflow.md

---

# Objetivo del template

Este template busca permitir que humanos y agentes de IA colaboren en el desarrollo de software de forma estructurada, mantenible y escalable.