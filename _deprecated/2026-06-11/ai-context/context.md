# AI Context — AI Project Foundation

Este archivo define el contexto operativo para los agentes de IA que trabajan dentro de este repositorio.

El objetivo es proporcionar información suficiente para que los agentes comprendan:

- el propósito del repositorio
- su rol dentro del ecosistema
- las fuentes de conocimiento disponibles
- las reglas de trabajo

---

# 1. Propósito del Repositorio

AI Project Foundation es un **framework para construir proyectos diseñados para colaborar con agentes de inteligencia artificial**.

Define:

- estructura de proyectos
- sistema de agentes
- workflows de desarrollo
- pipelines de entrega
- gobernanza de IA
- sistema de prompts
- estructura documental

Este repositorio **no contiene aplicaciones productivas**.

Sirve como **base estructural para proyectos AI-native**.

---

# 2. Ecosistema de Repositorios

El framework forma parte de un ecosistema mayor.

Repositorios principales:

ai-knowledge  
Base de conocimiento compartida.

Contiene:

- skills reutilizables
- prácticas de desarrollo
- estándares técnicos
- prompts reutilizables
- patrones de arquitectura

ai-project-foundation  
Framework para estructurar proyectos colaborativos con IA.

ai-project-template  
Plantilla base para iniciar nuevos proyectos.

---

# 3. Base de Conocimiento

Los agentes deben consultar la base de conocimiento externa:

ai-knowledge

Este repositorio contiene:

- skills reutilizables
- prácticas de desarrollo
- estándares técnicos
- prompts compartidos
- patrones arquitectónicos

El conocimiento no se replica aquí para evitar duplicación.

---

# 4. Sistema de Prompts

Los prompts oficiales del framework se encuentran en:

prompts/

Estructura:

prompts/
system/
domain/
guardrails/

Prioridad de uso:

1. system prompts
2. domain prompts
3. guardrails

---

# 5. Sistema de Roles de Agentes

Los roles de agentes están definidos en:

.ai-roles/

Roles actuales:

- product_manager
- architect
- developer
- reviewer
- documentation

Cada rol define responsabilidades, entradas y resultados esperados.

---

# 6. Workflows

Los workflows de colaboración entre agentes se encuentran en:

.ai-workflows/

Estos documentos describen cómo los agentes cooperan para:

- desarrollar features
- revisar código
- actualizar documentación
- entregar cambios

---

# 7. Pipelines

Los pipelines definen procesos completos de entrega.

Ubicación:

.ai-pipelines/

Un pipeline conecta:

workflow → revisión → pruebas → integración → documentación.

---

# 8. Gobernanza de IA

Las reglas operativas de los agentes se encuentran en:

.antigravity/rules.md

Estas reglas garantizan que los agentes:

- respeten la arquitectura
- consulten la documentación
- mantengan coherencia técnica
- eviten cambios peligrosos