# Architecture Guardrails

Este documento define las reglas de arquitectura que los agentes de IA deben respetar al trabajar en este proyecto.

El objetivo es mantener consistencia, claridad y separación de responsabilidades.

---

# Arquitectura general

El proyecto sigue principios de **Clean Architecture**.

Estructura principal:

src/
- domain
- application
- infrastructure

Cada capa tiene responsabilidades específicas.

---

# Reglas obligatorias

## 1. El dominio no depende de infraestructura

El código en:

src/domain

NO debe depender de:

- bases de datos
- frameworks
- APIs externas

El dominio debe ser **puro y desacoplado**.

---

## 2. Los casos de uso viven en application

La lógica de aplicación debe ubicarse en:

src/application/use-cases

Los casos de uso:

- coordinan lógica de dominio
- llaman a servicios
- orquestan operaciones

---

## 3. Infrastructure implementa detalles técnicos

La carpeta:

src/infrastructure

contiene:

- APIs
- acceso a base de datos
- integraciones externas

No debe contener lógica de negocio.

---

## 4. No mezclar responsabilidades

Evitar:

- lógica de dominio en controllers
- lógica de negocio en repositorios
- lógica de aplicación en infraestructura

---

# Cambios estructurales

Los agentes **no deben modificar la arquitectura del proyecto** sin justificación clara.

Cambios como:

- mover capas
- cambiar estructura de carpetas
- eliminar carpetas base

requieren aprobación humana.

---

# Uso de knowledge

Antes de implementar lógica de dominio, los agentes deben revisar:

knowledge/

para entender conceptos y reglas del dominio.

---

# Uso de AGENTS.md

Cada capa puede contener un archivo:

AGENTS.md

con instrucciones específicas para agentes.

Los agentes deben revisar esos archivos antes de modificar código en esa carpeta.