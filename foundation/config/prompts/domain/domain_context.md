# Domain Context

Este documento define el contexto del dominio del proyecto.

Los agentes de IA deben utilizar esta información para interpretar
correctamente las funcionalidades, datos y procesos del sistema.

---

# Dominio del Proyecto

El dominio representa el problema de negocio que el sistema resuelve.

Debe describir:

- el tipo de negocio
- las entidades principales
- los flujos principales
- los objetivos del sistema

---

# Entidades del Dominio

Las entidades representan los conceptos principales del sistema.

Ejemplos posibles:

- Usuario
- Cliente
- Lead
- Ticket
- Producto
- Servicio

Las entidades reales del proyecto deben definirse
según lo indicado en el PRD.

---

# Flujos del Dominio

Los flujos representan cómo interactúan los usuarios con el sistema.

Ejemplos:

- registro de cliente
- creación de ticket
- consulta de servicio
- interacción con agente de IA

---

# Relación con la Arquitectura

Las entidades definidas en este documento deben corresponder
con los modelos del dominio ubicados en:

src/domain/models

La lógica asociada debe implementarse en:

src/domain/services

---

# Fuente de Verdad

Si existe contradicción entre este documento y otros artefactos:

PRD.md tiene prioridad.

Luego:

1. PRD.md
2. MVP.md
3. README.md
4. domain_context.md