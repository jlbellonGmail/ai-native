# Domain Layer Rules

Este archivo define cómo los agentes deben trabajar dentro de la capa de dominio.

La capa de dominio representa el núcleo del sistema.

---

# Principio fundamental

El dominio debe ser **puro y agnóstico a la tecnología**.

No debe depender de:

- frameworks
- APIs externas
- bases de datos
- infraestructura

---

# Restricciones de importación

Está PROHIBIDO importar desde:

src/infrastructure
src/application

También está prohibido importar librerías externas como:

- Supabase
- Stripe
- SDKs externos

Solo se permiten:

- tipos de TypeScript
- modelos del dominio
- utilidades puras

---

# Reglas de entidades

Las entidades del dominio deben:

- representar conceptos reales del negocio
- contener reglas de negocio
- proteger su estado interno

---

# Regla de validez del dominio

Ninguna entidad puede existir en estado inválido.

Por lo tanto:

- toda validación ocurre en el constructor
- si los datos no son válidos el dominio debe fallar explícitamente

---

# Objetos de valor

Los objetos de valor deben ser:

- inmutables
- comparables por valor
- validados al momento de su creación

---

# Servicios de dominio

Los servicios de dominio se utilizan cuando:

- la lógica involucra múltiples entidades
- la lógica no pertenece a una sola entidad