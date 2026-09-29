# AI Project Foundation

AI Project Foundation es un framework diseñado para estructurar proyectos de software que colaboran con agentes de inteligencia artificial.

El objetivo es crear proyectos que sean:

* mantenibles
* documentados
* escalables
* comprensibles tanto por humanos como por IA.

---

# Problema que Resuelve

Los proyectos modernos que utilizan IA suelen sufrir de:

* falta de estructura para prompts
* conocimiento disperso
* documentación inconsistente
* agentes que no respetan arquitectura
* dificultad para reutilizar aprendizaje entre proyectos

AI Project Foundation resuelve esto mediante una arquitectura que organiza:

* conocimiento
* prompts
* habilidades de agentes
* gobernanza
* documentación viva.

---

# Principios del Framework

El framework se basa en cinco principios fundamentales.

## 1. Documentación como Fuente de Verdad

Toda decisión relevante del proyecto debe estar documentada.

La documentación no es un artefacto secundario, es parte central de la arquitectura.

---

## 2. Arquitectura Comprensible para IA

La estructura del repositorio debe permitir que agentes de IA comprendan fácilmente:

* propósito del proyecto
* arquitectura del sistema
* reglas de trabajo
* habilidades disponibles

---

## 3. Separación de Conocimiento

El conocimiento se divide en diferentes capas:

* documentación del proyecto
* prompts operativos
* habilidades reutilizables
* conocimiento compartido

Esto evita mezclar conceptos y mejora la mantenibilidad.

---

## 4. Gobernanza de Agentes

Los agentes no deben actuar libremente dentro del proyecto.

El framework define reglas claras sobre:

* qué pueden hacer
* qué no deben hacer
* cuándo se requiere aprobación humana.

---

## 5. Reutilización entre Proyectos

El conocimiento generado en un proyecto debe poder reutilizarse en otros.

Esto permite crear ecosistemas de proyectos que evolucionan juntos.

---

# Arquitectura del Repositorio

El repositorio se organiza en varias capas.

## Documentación

docs/

Contiene la documentación oficial del proyecto.

Subcarpetas importantes:

* agents
* artifacts
* explanation
* reference
* tutorials
* skills

---

## Sistema de Prompts

prompts/

Contiene los prompts que definen el comportamiento de los agentes.

Estructura:

prompts/system
prompts/domain
prompts/guardrails

Prioridad:

1. system
2. domain
3. guardrails

---

## Sistema de Skills

docs/skills/

Define las habilidades que los agentes pueden utilizar.

Archivos principales:

catalog.md
policies.md
roadmap.md
external_sources.md

---

## Gobernanza de Agentes

.antigravity/

Define las reglas que los agentes deben seguir al trabajar en el repositorio.

Archivo principal:

rules.md

---

## Base de Conocimiento

El conocimiento reutilizable del ecosistema no vive dentro del framework.

Se mantiene en el repositorio:

ai-knowledge

Esto permite:

- reutilizar conocimiento entre proyectos
- evitar duplicación
- mantener una evolución centralizada de buenas prácticas
  
---

# Flujo de Trabajo con IA

El flujo de trabajo esperado dentro del framework es el siguiente:

1. El agente lee la documentación del proyecto.
2. El agente consulta el catálogo de skills disponibles.
3. El agente analiza los prompts del proyecto.
4. El agente propone soluciones en formato documentado.
5. El agente implementa cambios respetando la arquitectura.

---

# Sistema de Evolución del Framework

El framework evoluciona mediante tres mecanismos.

## Evolución de Skills

Las habilidades del agente se expanden mediante:

docs/skills/roadmap.md

---

## Curación de Skills

Las skills externas deben ser evaluadas antes de ser incorporadas.

El proceso está definido en:

docs/skills/policies.md

---

## Expansión del Conocimiento

El conocimiento generado en proyectos puede convertirse en conocimiento compartido.

Esto permite crear un repositorio central como:

ai-knowledge

---

# Creación de Nuevos Proyectos

Los nuevos proyectos pueden basarse en esta arquitectura utilizando:

.ai/templates/

Esto permite replicar la estructura del framework de forma consistente.

---

# Ecosistema de Proyectos

Cuando múltiples proyectos utilizan AI Project Foundation se puede crear un ecosistema compartido.

Ejemplo:

proyecto-a
proyecto-b
proyecto-c

Todos comparten:

* skills
* patrones arquitectónicos
* prácticas de desarrollo
* conocimiento de colaboración con IA

Esto permite que los equipos evolucionen más rápido.

---

# Objetivo Final

AI Project Foundation busca crear una nueva forma de construir software:

proyectos diseñados para colaborar con inteligencia artificial desde su arquitectura.

Esto permite desarrollar sistemas más mantenibles, escalables y capaces de evolucionar con agentes inteligentes.

---

# Ecosistema del Framework

AI Project Foundation forma parte de un ecosistema de repositorios.

ai-knowledge  
Base de conocimiento compartida.

ai-project-foundation  
Framework para estructurar proyectos colaborativos con IA.

ai-project-template  
Plantilla inicial para crear nuevos proyectos.

Los proyectos finales se construyen utilizando el template y consumiendo el conocimiento compartido.

