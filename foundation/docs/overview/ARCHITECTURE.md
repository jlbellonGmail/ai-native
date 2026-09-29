# Architecture

Este documento describe la arquitectura interna del framework **AI Project Foundation**.

El objetivo del framework es proporcionar una estructura clara para desarrollar proyectos de software diseñados para colaborar con agentes de inteligencia artificial.

---

# Principios Arquitectónicos

El framework se basa en los siguientes principios:

- claridad estructural
- separación de responsabilidades
- documentación como parte del sistema
- colaboración humano-IA
- gobernanza explícita de agentes

La arquitectura busca que tanto humanos como agentes puedan comprender y evolucionar el sistema.

---

# Componentes del Framework

El framework está compuesto por los siguientes componentes principales:

.ai
.ai-roles
.ai-workflows
.ai-pipelines
.antigravity
prompts
docs


Cada componente cumple una función específica dentro del sistema.

---

# Capa de Contexto de IA

Ubicación:

.ai/


Esta capa contiene información utilizada por agentes de IA para comprender el proyecto.

Ejemplos:

- contexto del sistema
- índice de conocimiento
- plantillas de proyecto

---

# Sistema de Roles

Ubicación:

.ai-roles/


Define los roles de agentes que pueden participar en el desarrollo.

Roles típicos:

- Product Manager
- Architect
- Developer
- Reviewer
- Documentation Agent

Cada rol tiene responsabilidades claras.

---

# Sistema de Workflows

Ubicación:

.ai-workflows/


Los workflows definen cómo colaboran los agentes.

Ejemplos:

feature-development
project-initialization


Un workflow describe el flujo de trabajo entre roles.

---

# Pipelines

Ubicación:

.ai-pipelines/


Los pipelines describen procesos completos de entrega.

Ejemplo:

feature-delivery


Un pipeline conecta múltiples workflows hasta entregar una funcionalidad completa.

---

# Gobernanza de Agentes

Ubicación:

.antigravity/


Define reglas obligatorias para agentes.

Ejemplos:

- restricciones de seguridad
- límites de modificación
- reglas de operación

Esto evita comportamientos peligrosos de agentes.

---

# Sistema de Prompts

Ubicación:

prompts/


Define cómo interactúan los agentes con el proyecto.

Estructura:

prompts/system
prompts/domain
prompts/guardrails


Esto permite controlar el comportamiento de los agentes.

---

# Sistema de Documentación

Ubicación:

docs/


El framework promueve **documentación viva**.

La documentación se organiza en:

docs/explanation
docs/reference
docs/tutorials
docs/templates
docs/skills


Esto permite que humanos y agentes comprendan el sistema.

---

# Integración con el Ecosistema

AI Project Foundation forma parte de un ecosistema mayor:

ai-knowledge
↓
ai-project-foundation
↓
ai-project-template
↓
AI-native projects


Cada repositorio cumple un rol específico:

**ai-knowledge**  
Base de conocimiento reutilizable.

**ai-project-foundation**  
Framework que define arquitectura, agentes y workflows.

**ai-project-template**  
Plantilla para iniciar nuevos proyectos.

**AI-native projects**  
Aplicaciones reales construidas con el ecosistema.

---

# Objetivo de la Arquitectura

Permitir la creación de proyectos que sean:

- comprensibles
- mantenibles
- documentados
- compatibles con agentes de IA
- evolutivos en el tiempo
- 