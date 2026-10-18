# AGENTS.md — AI Project Foundation

Este archivo define cómo deben operar los agentes de inteligencia artificial dentro de este repositorio.

Su objetivo es asegurar que los agentes:

- comprendan el propósito del framework
- respeten la arquitectura del sistema
- utilicen correctamente la documentación
- colaboren siguiendo workflows definidos
- mantengan coherencia técnica

---

# 1. Propósito del Repositorio

AI Project Foundation es un **framework para construir proyectos diseñados para colaborar con agentes de inteligencia artificial**.

El framework define:

- estructura de proyectos
- sistema de roles de agentes
- workflows de desarrollo
- pipelines de entrega
- gobernanza de IA
- sistema de prompts
- estructura documental

Este repositorio **no contiene aplicaciones productivas**.

Las aplicaciones se crean utilizando el repositorio:

ai-project-template

---

# 2. Ecosistema de Repositorios

El framework forma parte de un ecosistema compuesto por tres repositorios principales.

## ai-knowledge

Base de conocimiento compartida.

Contiene:

- skills reutilizables
- prácticas de desarrollo
- estándares técnicos
- prompts reutilizables
- patrones de arquitectura

---

## ai-project-foundation

Framework que define cómo estructurar proyectos colaborativos con IA.

Incluye:

- sistema de roles
- workflows
- pipelines
- gobernanza
- estructura documental

---

## ai-project-template

Plantilla base para crear nuevos proyectos utilizando el framework.

---

# 3. Lectura Obligatoria para Agentes

Antes de realizar cambios en el repositorio, los agentes deben revisar:

README.md

docs/explanation/AI_PROJECT_FOUNDATION.md

docs/explanation/HELP_SYSTEM.md

docs/skills/catalog.md

docs/skills/policies.md

.ai/context.md

.antigravity/rules.md

Estos documentos definen:

- arquitectura del framework
- sistema de ayuda
- habilidades disponibles
- políticas de calidad
- gobernanza de agentes

---

# 4. Sistema de Roles de Agentes

Los roles de agentes están definidos en:

.ai-roles/

Roles disponibles:

Product Manager  
Define requisitos y criterios de aceptación.

Architect  
Diseña la arquitectura del sistema.

Developer  
Implementa funcionalidades.

Reviewer  
Valida calidad técnica y consistencia.

Documentation Agent  
Mantiene la documentación y el sistema de ayuda.

Cada rol tiene responsabilidades específicas y produce artefactos distintos.

---

# 5. Workflows de Agentes

Los workflows describen cómo los agentes colaboran para desarrollar funcionalidades.

Ubicación:

.ai-workflows/

Ejemplo:

feature-development.md

Un workflow define:

- secuencia de agentes
- responsabilidades
- artefactos generados

---

# 6. Pipelines

Los pipelines describen procesos completos de entrega.

Ubicación:

.ai-pipelines/

Un pipeline conecta:

requisitos → diseño → implementación → revisión → pruebas → documentación → integración.

---

# 7. Sistema de Prompts

Los prompts oficiales del proyecto se encuentran en:

prompts/

Estructura:

prompts/system/

prompts/domain/

prompts/guardrails/

Prioridad de uso:

1. system prompts
2. domain prompts
3. guardrails

---

# 8. Base de Conocimiento

El conocimiento reutilizable del ecosistema se encuentra en:

ai-knowledge

Los agentes deben consultar esta base antes de proponer soluciones.

El conocimiento incluye:

- skills
- prácticas de desarrollo
- estándares (ver especialmente: [standards/naming-conventions.md])
- patrones arquitectónicos

---

# 9. Documentación

La documentación del framework se encuentra en:

docs/

Tipos de documentación:

explanation  
Explicaciones conceptuales.

reference  
Guías de referencia.

tutorials  
Tutoriales prácticos.

skills  
Catálogo de habilidades para agentes.

templates  
Plantillas para issues y pull requests.

---

# 10. Reglas de Trabajo

Los agentes deben seguir estos principios:

1. No modificar la arquitectura del framework sin justificación.
2. No introducir dependencias innecesarias.
3. Mantener coherencia con la documentación oficial.
4. Priorizar claridad, simplicidad y mantenibilidad.
5. Documentar cualquier cambio significativo.

---

# 11. Seguridad

Los agentes nunca deben:

- incluir secretos en el repositorio
- exponer claves o tokens
- modificar configuraciones críticas sin aprobación humana

---

# 12. Resolución de Conflictos

Si existen múltiples fuentes de información, la prioridad es:

1. AGENTS.md local
2. .antigravity/rules.md
3. documentación en docs/
4. prompts del sistema

Si el conflicto persiste, el agente debe solicitar decisión humana.

---

# 13. Flujo de Trabajo Recomendado

Cuando un agente recibe una tarea:

1. Leer documentación relevante.
2. Analizar el problema.
3. Proponer solución.
4. Evaluar impacto.
5. Implementar cambios.
6. Actualizar documentación.

---

# 14. Objetivo Final

El objetivo de los agentes es contribuir a mantener un framework que permita construir proyectos:

- mantenibles
- bien documentados
- seguros
- colaborativos entre humanos e IA.
    