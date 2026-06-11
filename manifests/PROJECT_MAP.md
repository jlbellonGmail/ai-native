# Project Map

Este documento describe el **mapa estructural del repositorio** para ayudar a agentes de IA y desarrolladores a navegar rápidamente el proyecto.

Antes de trabajar en el código, los agentes deben revisar este archivo.

---

# Propósito del repositorio

Este repositorio es un **template para proyectos de software asistidos por IA**.

Su objetivo es proporcionar:

- arquitectura limpia
- estructura clara para agentes de IA
- base de conocimiento del dominio
- workflows de desarrollo asistido por IA

---

# Estructura principal

El proyecto se organiza en las siguientes áreas:

.ai/
docs/
knowledge/
src/
supabase/
test/

---

# 1. Contexto para IA

.ai/


Contiene el contexto necesario para que los agentes comprendan el proyecto.

Archivos importantes:

.ai/index.md
.ai/context.md
.ai/projectproject_context_prompt.md
.ai/AGENTS.md
.ai/architecture_guardrails.md


También incluye:

- workflows de IA
- prompts reutilizables
- definiciones de agentes

Los agentes deben comenzar leyendo:

.ai/index.md

---

# 2. Código de la aplicación

src/

El código sigue principios de **Clean Architecture**.

src
├─ domain
├─ application
└─ infrastructure


### domain

Contiene:

- entidades del dominio
- objetos de valor
- servicios de dominio

Esta capa contiene la **lógica de negocio principal**.

---

### application

Contiene:

- casos de uso
- coordinación del dominio

Los casos de uso representan operaciones del sistema.

---

### infrastructure

Contiene implementaciones técnicas:

- APIs
- base de datos
- integraciones externas

No debe contener lógica de negocio.

---

# 3. Conocimiento del dominio

knowledge/


Contiene conocimiento estructurado sobre el dominio del proyecto.

Ejemplos:

- conceptos del dominio
- decisiones de arquitectura
- definiciones clave

Antes de implementar lógica de negocio, revisar:

knowledge/index.md

---

# 4. Documentación

docs/


Contiene documentación orientada a desarrolladores y arquitectos.

---

# 5. Base de datos

supabase/


Contiene:

- migraciones
- datos iniciales (seed)

---

# 6. Testing

test/


Define:

- convenciones de testing
- estilo de pruebas

---

# Flujo recomendado de desarrollo

1. Definir conocimiento del dominio en `knowledge/`
2. Crear modelos en `src/domain`
3. Implementar casos de uso en `src/application`
4. Crear adaptadores en `src/infrastructure`
5. Escribir pruebas en `test/`

---

# Reglas importantes

Los agentes deben respetar:

- `.ai/AGENTS.md`
- `.ai/architecture_guardrails.md`
- `src/domain/AGENTS.md`
- `src/application/AGENTS.md`
- `src/infrastructure/AGENTS.md`

Estas reglas mantienen la arquitectura del proyecto consistente.

---

# Objetivo del template

Permitir que **humanos y agentes de IA colaboren eficientemente en el desarrollo de software**, manteniendo una arquitectura clara, conocimiento estructurado y documentación integrada.

