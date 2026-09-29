# Sistema de Skills

## Propósito

El sistema de **Skills** permite extender las capacidades de los agentes de IA utilizados en el proyecto de forma controlada, documentada y reutilizable.

Una **Skill** representa un conjunto estructurado de conocimientos, heurísticas, metodologías o prácticas que los agentes pueden utilizar para resolver tareas específicas de forma más eficiente.

El objetivo del sistema es:

- Centralizar capacidades especializadas de los agentes.
- Reutilizar conocimiento entre proyectos.
- Evitar prompts improvisados o conocimientos no versionados.
- Garantizar trazabilidad y gobernanza del conocimiento aplicado por IA.

Este sistema forma parte del **framework AI Project Foundation** y se versiona junto con el proyecto.

---

# Qué es una Skill

Una **Skill** es un módulo de conocimiento que describe cómo un agente debe abordar un tipo de problema o actividad.

Puede incluir:

- metodologías
- heurísticas
- buenas prácticas
- patrones de solución
- criterios de decisión
- reglas de diseño o implementación

Las skills permiten que los agentes trabajen como **especialistas en dominios concretos**.

Ejemplos de dominios:

- diseño de interfaces
- marketing digital
- copywriting
- arquitectura de software
- generación de prompts
- análisis de producto
- optimización de UX

---

# Qué NO es una Skill

Para evitar confusión, una skill **no es**:

- un prompt suelto
- una instrucción puntual
- un fragmento de código
- una automatización
- una regla del sistema

Las skills representan **capacidades persistentes del agente**, no instrucciones temporales.

---

# Principios del Sistema de Skills

El sistema de skills se rige por los siguientes principios:

## 1. Gobernanza

Toda skill utilizada en el proyecto debe estar:

- documentada
- versionada
- auditada

No se permite el uso de skills externas no registradas.

---

## 2. Transparencia

Cada skill debe indicar:

- su origen
- su propósito
- cuándo utilizarla
- cuándo no utilizarla

Esto permite entender **por qué el agente toma determinadas decisiones**.

---

## 3. Reutilización

Las skills deben diseñarse para ser reutilizables entre distintos proyectos que utilicen la plantilla **AI Project Foundation**.

---

## 4. Modularidad

Cada skill debe mantenerse independiente de otras siempre que sea posible.

Esto facilita:

- su mantenimiento
- su actualización
- su reutilización

---

## 5. Seguridad

Las skills no deben:

- introducir dependencias externas no verificadas
- modificar el comportamiento central de los agentes
- ejecutar acciones fuera del alcance del proyecto

---

# Tipos de Skills

Las skills pueden clasificarse en diferentes categorías.

## Skills de Producto

Relacionadas con:

- diseño de funcionalidades
- experiencia de usuario
- definición de producto
- análisis de requisitos

---

## Skills de Diseño

Relacionadas con:

- UI
- UX
- diseño visual
- sistemas de diseño
- diseño de interfaces modernas

---

## Skills de Marketing

Relacionadas con:

- copywriting
- posicionamiento
- growth
- conversión
- comunicación

---

## Skills de Ingeniería

Relacionadas con:

- arquitectura
- desarrollo
- testing
- patrones de software

---

# Estructura del Sistema de Skills

La estructura del sistema es la siguiente:

docs/skills/
  README.md
  catalog.md
  policies.md
  sources/
    superpowers.md
    frontend-design.md
    marketing.md
  

Descripción:

| Archivo     | Propósito                            |
| ----------- | ------------------------------------ |
| README.md   | Documento base del sistema de skills |
| catalog.md  | Catálogo de skills disponibles       |
| policies.md | Políticas de uso de skills           |
| sources/    | Skills externas curadas e integradas |

---

# Origen de las Skills

Las skills pueden provenir de tres fuentes:

## 1. Skills nativas del proyecto

Diseñadas específicamente para el framework.

---

## 2. Skills externas curadas

Skills provenientes de proyectos externos que han sido:

- analizadas
- filtradas
- documentadas
- adaptadas al sistema

Ejemplos:

- superpowers
- frontend-design
- marketing-skills

---

## 3. Skills específicas del proyecto

Algunos proyectos pueden requerir skills adicionales especializadas.

Estas deben documentarse dentro del sistema de skills del proyecto.

---

# Uso de Skills por Agentes

Los agentes pueden utilizar skills para:

- mejorar la calidad de sus respuestas
- aplicar metodologías especializadas
- tomar decisiones mejor fundamentadas
- generar resultados más profesionales

Las skills deben utilizarse como **herramientas cognitivas**, no como instrucciones rígidas.

---

# Integración con el Sistema de Agentes

Las skills complementan el sistema de agentes definido en el proyecto.

Los agentes:

- definen **roles**
- las skills definen **capacidades**

Ejemplo:

Agente:

Product Designer

Skills aplicables:

- UX heuristics
- UI design patterns
- conversion optimization

---

# Integración con Antigravity

Cuando se inicializa un workspace en Antigravity, el sistema de skills puede utilizarse para ampliar las capacidades del agente.

En lugar de copiar prompts o instrucciones manualmente, el agente puede referenciar el sistema de skills documentado en este repositorio.

Esto garantiza:

- consistencia
- trazabilidad
- reutilización

---

# Evolución del Sistema

El sistema de skills debe evolucionar junto con el proyecto.

Cada incorporación o modificación debe:

1. documentarse
2. justificarse
3. versionarse

---

# Relación con otros sistemas del proyecto

El sistema de skills complementa:

- PRD
- MVP
- Sistema de agentes
- Sistema de ayuda
- Arquitectura del proyecto

Las skills **no sustituyen estos documentos**, sino que los potencian.

---

# Regla Fundamental

Ninguna skill puede utilizarse dentro del proyecto si no está:

- documentada
- incluida en el catálogo
- versionada en el repositorio
