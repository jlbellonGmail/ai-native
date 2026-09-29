# Catálogo de Skills

## Propósito

Este documento define el **catálogo oficial de skills disponibles para los agentes de IA** dentro del framework **AI Project Foundation**.

Su objetivo es:

- centralizar las capacidades disponibles
- documentar el origen de cada skill
- indicar cuándo deben utilizarse
- garantizar trazabilidad del conocimiento aplicado por los agentes

Solo las skills registradas en este catálogo pueden utilizarse dentro del proyecto.

---

# Estructura del Catálogo

Cada skill del catálogo debe documentar:

- **Nombre**
- **Categoría**
- **Origen**
- **Propósito**
- **Cuándo utilizarla**
- **Cuándo no utilizarla**
- **Estado de curación**

---

# Tipos de Skills

El sistema distingue dos tipos de skills:

### Skills Curadas
Son habilidades provenientes de repositorios, frameworks o metodologías externas ya validadas e integradas.

Estas pueden ser utilizadas directamente por los agentes.

### Skills en Curación
Son capacidades estratégicas identificadas para el sistema, pero que aún requieren:

- selección de framework
- definición metodológica
- documentación completa

Hasta completar este proceso **no pueden ser utilizadas por los agentes**.

---

# Categorías de Skills

Las skills se agrupan en las siguientes categorías:

- Producto
- Diseño
- Marketing
- Ingeniería
- Estrategia

---

# Skills Disponibles

---

# Superpowers

### Categoría
Ingeniería / Productividad

### Origen
https://github.com/obra/superpowers

### Propósito

Superpowers proporciona heurísticas y patrones que ayudan a los agentes a trabajar con mayor eficiencia, claridad estructural y capacidad analítica.

Estas habilidades están orientadas a:

- descomposición de problemas
- estructuración de soluciones
- pensamiento sistemático
- optimización de prompts

### Cuándo utilizarla

Cuando el agente necesita:

- estructurar soluciones complejas
- organizar información extensa
- mejorar claridad de razonamiento
- dividir un problema en subproblemas

### Cuándo no utilizarla

No es necesaria cuando la tarea es simple o puramente informativa.

### Estado

Curada e integrada en el sistema de skills.

---

# Frontend Design

### Categoría
Diseño / UX

### Origen
https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design

### Propósito

Proporciona heurísticas y patrones para el diseño de interfaces modernas y profesionales.

Permite a los agentes:

- generar layouts coherentes
- mejorar experiencia de usuario
- aplicar principios modernos de UI
- estructurar componentes visuales

### Cuándo utilizarla

Cuando el agente trabaja en:

- diseño de interfaces
- diseño de dashboards
- sistemas de diseño
- componentes visuales

### Cuándo no utilizarla

No se requiere en tareas puramente backend o análisis de datos.

### Estado

Curada e integrada en el sistema de skills.

---

# Marketing Skills

### Categoría
Marketing / Comunicación

### Origen
https://github.com/coreyhaines31/marketingskills

### Propósito

Proporciona marcos de trabajo para:

- posicionamiento de producto
- comunicación efectiva
- marketing digital
- generación de valor percibido

Permite que los agentes produzcan:

- textos orientados a conversión
- mensajes claros de valor
- contenido alineado con objetivos comerciales

### Cuándo utilizarla

Cuando el agente trabaja en:

- landing pages
- contenido de marketing
- copywriting
- estrategia de posicionamiento

### Cuándo no utilizarla

No es necesaria para tareas puramente técnicas o de ingeniería.

### Estado

Curada e integrada en el sistema de skills.

---

# Product Discovery 

## Categoría 

Producto / Estrategia 

## Origen 

Continuous Discovery (Teresa Torres) / Inspired (Marty Cagan) 

## Propósito 

Validar problemas de negocio e identificar oportunidades antes del desarrollo. 

## Cuándo utilizarla 

Al definir el MVP o feature-sets mayores para reducir riesgo de valor. 

## Cuándo no utilizarla 

En correcciones de errores técnicos o mantenimiento de infraestructura.

## Estado

Curada e integrada.

---

# UX Research 

## Categoría 

Diseño / Producto

## Origen 

Nielsen Heuristics / Lean UX Audit 

## Propósito 

Identificar fricciones de usuario mediante auditorías de usabilidad. 

## Cuándo utilizarla 

Al diseñar flujos de usuario complejos o mejorar la retención.

## Cuándo no utilizarla

En procesos backend sin interfaz de usuario o lógica de servidor pura.

## Estado 

Curada e integrada.

---

# Software Architecture Patterns 

## Categoría 

Ingeniería 

## Origen 

Hexagonal Architecture / Clean Architecture 

## Propósito 

Garantizar la inmutabilidad de la lógica de negocio y el desacoplamiento técnico.

## Cuándo utilizarla 

Al definir la estructura de nuevos módulos, servicios o integraciones externas. 

## Cuándo no utilizarla

En scripts de automatización simples o prototipos de un solo archivo.

## Estado

Curada e integrada.

---


# Skills en Curación

Las siguientes capacidades han sido identificadas como estratégicas
para el crecimiento del framework, pero aún se encuentran en proceso
de análisis y curación.

No deben utilizarse hasta completar su definición formal.

---

# AI Prompt Engineering

## Categoría
Ingeniería / IA

## Propósito

Optimizar el uso de modelos de lenguaje mediante:

- diseño avanzado de prompts
- estructuración de instrucciones
- control de contexto
- evaluación de respuestas

## Estado

Propuesta

---

# Growth Engineering

## Categoría
Producto / Marketing

## Propósito

Capacidad para optimizar productos digitales mediante:

- análisis de métricas de crecimiento
- experimentación
- optimización de conversión
- análisis de funnels

## Estado

Propuesta

# Expansión del Catálogo

El catálogo de skills se expandirá con nuevas capacidades:

Cada nueva skill deberá pasar por un proceso de:

1. análisis
2. curación
3. documentación
4. incorporación al catálogo

---

# Gobernanza del Catálogo

Toda incorporación o modificación de skills debe cumplir con las siguientes reglas:

- documentarse en este catálogo
- registrar su origen
- indicar propósito y límites
- versionarse junto con el proyecto

Esto garantiza que los agentes utilicen únicamente **capacidades auditadas y controladas**.

---

# Regla Fundamental

Los agentes del proyecto **solo pueden utilizar skills incluidas en este catálogo**.