# Project Initialization Workflow

Este workflow define el proceso para crear un nuevo proyecto utilizando **AI Project Foundation**.

Su objetivo es asegurar que todos los proyectos iniciados con este framework:

- sigan la misma arquitectura
- integren correctamente agentes de IA
- utilicen la base de conocimiento compartida
- mantengan consistencia estructural.

---

# Agentes Involucrados

1. Product Manager
2. Architect
3. Developer
4. Documentation Agent

---

# Paso 1 — Definición del Proyecto

Responsable: Product Manager

El Product Manager debe definir el propósito del proyecto.

Debe documentar:

- problema a resolver
- objetivos del sistema
- usuarios objetivo
- valor del producto

Documentos generados:

docs/explanation/PRD.md  
docs/explanation/MVP.md

---

# Paso 2 — Creación del Proyecto Base

Responsable: Developer

El Developer debe crear el proyecto utilizando el repositorio:

ai-project-template

Acciones:

1. clonar ai-project-template
2. renombrar el proyecto
3. configurar repositorio
4. inicializar dependencias

Objetivo:

Crear una base técnica consistente con el framework.

---

# Paso 3 — Diseño de Arquitectura

Responsable: Architect

El Architect debe definir la arquitectura inicial del sistema.

Debe definir:

- estructura del dominio
- servicios principales
- integraciones externas
- límites del sistema

Artefactos generados:

documentación de arquitectura  
diagramas de sistema  
decisiones técnicas

---

# Paso 4 — Configuración de Agentes

Responsable: Architect

El proyecto debe configurar los agentes necesarios.

Roles mínimos recomendados:

Product Manager  
Architect  
Developer  
Reviewer  
Documentation Agent

Los roles se definen en:

.ai-roles/

---

# Paso 5 — Configuración del Conocimiento

Responsable: Architect

El proyecto debe integrarse con la base de conocimiento:

ai-knowledge

Esto permite reutilizar:

- skills
- estándares técnicos
- prompts compartidos
- patrones de arquitectura.

---

# Paso 6 — Configuración de Prompts

Responsable: Developer

El proyecto debe configurar el sistema de prompts.

Ubicación:

prompts/

Estructura recomendada:

prompts/system/  
prompts/domain/  
prompts/guardrails/

Los prompts permiten controlar el comportamiento de los agentes.

---

# Paso 7 — Configuración de Documentación

Responsable: Documentation Agent

El Documentation Agent debe asegurar que la documentación inicial exista.

Estructura mínima:

docs/explanation/  
docs/reference/  
docs/tutorials/

Esto garantiza que el proyecto sea comprensible desde el inicio.

---

# Paso 8 — Verificación del Framework

Responsable: Reviewer

El Reviewer debe verificar que el proyecto:

- respeta la arquitectura del framework
- incluye documentación básica
- tiene roles definidos
- utiliza correctamente prompts y workflows.

---

# Resultado Esperado

Al finalizar el workflow, el proyecto debe:

- estar basado en ai-project-template
- utilizar AI Project Foundation
- integrarse con ai-knowledge
- tener roles de agentes definidos
- tener documentación inicial.

---

# Objetivo del Workflow

Asegurar que todos los proyectos iniciados con este framework sean:

- coherentes
- mantenibles
- documentados
- compatibles con colaboración humano-IA.
  