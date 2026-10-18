# Repository Structure Standard

Este estándar define la estructura recomendada para proyectos que utilizan **AI Project Foundation**.

Su objetivo es mantener consistencia entre proyectos y facilitar la colaboración entre desarrolladores y agentes de IA.

---

# Estructura base

Un proyecto debe seguir la siguiente organización:

```
project-root
│
docs/
prompts/
knowledge/
src/
│
.ai/
.ai-agents/
.ai-workflows/
.ai-pipelines/
```

---

# Descripción de carpetas

## docs/

Contiene documentación del proyecto.

Ejemplos:

* arquitectura
* decisiones técnicas
* documentación funcional

---

## prompts/

Contiene prompts reutilizables específicos del proyecto.

Estos prompts pueden ser utilizados por agentes de IA para realizar tareas dentro del proyecto.

---

## knowledge/

Contiene la base de conocimiento utilizada por el proyecto.

Normalmente incluye conocimiento compartido como:

* AI Knowledge
* documentación técnica adicional
* referencias internas

---

## src/

Contiene el código fuente del sistema.

Debe organizarse según la arquitectura del proyecto.

---

## .ai/

Contiene archivos de contexto utilizados por agentes de IA.

Ejemplos:

* contexto del proyecto
* índice de conocimiento
* instrucciones generales

---

## .ai-agents/

Define los agentes disponibles en el proyecto.

Cada agente puede tener:

* rol
* responsabilidades
* instrucciones específicas

---

## .ai-workflows/

Define procesos de colaboración entre agentes.

Ejemplos:

* desarrollo de features
* revisión de código
* generación de documentación

---

## .ai-pipelines/

Define pipelines completos de desarrollo que combinan múltiples workflows o agentes.

Estos pipelines permiten automatizar procesos de desarrollo complejos.

---

# Objetivo de esta estructura

Esta estructura permite:

* separar claramente código, conocimiento y prompts
* facilitar la colaboración con agentes de IA
* mantener consistencia entre proyectos
* mejorar la navegabilidad del repositorio
