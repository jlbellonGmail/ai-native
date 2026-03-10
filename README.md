# AI Project Template

Este repositorio es un **template base para proyectos de software asistidos por IA**.

Está diseñado para funcionar junto con:

- ai-project-foundation
- ai-knowledge

El objetivo es proporcionar una estructura clara para:

- desarrollo asistido por IA
- arquitectura limpia
- gestión de conocimiento del proyecto
- documentación clara
- evolución sostenible del software

---

# Estructura del Proyecto

El proyecto está dividido en cuatro áreas principales.

---

# 1. Código de la aplicación

src/

Contiene la implementación principal siguiendo principios de **Clean Architecture**.

src
├─ domain
├─ application
└─ infrastructure


### domain

Contiene:

- entidades del dominio
- objetos de valor
- servicios de dominio

Aquí vive la lógica de negocio.

---

### application

Contiene:

- casos de uso
- orquestación del sistema

---

### infrastructure

Contiene:

- APIs
- adaptadores
- acceso a base de datos
- integraciones externas

---

# 2. Contexto para IA

.ai/

Contiene la información necesaria para que **agentes de IA comprendan el proyecto**.

Archivos importantes:

.ai/context.md
.ai/index.md
.ai/AGENTS.md
.ai/architecture_guardrails.md


También incluye:

- workflows de desarrollo
- prompts reutilizables
- reglas para agentes

---

# 3. Conocimiento del proyecto

knowledge/

Base de conocimiento estructurada del proyecto.

Contiene:

- conceptos del dominio
- decisiones de arquitectura
- definiciones clave

Los agentes deben revisar:

knowledge/index.md


antes de implementar lógica de negocio.

---

# 4. Documentación

docs/

Documentación pensada para **personas**.

Incluye:

- arquitectura
- guías
- referencias

---

# Base de Datos

El proyecto incluye integración con **Supabase**.

supabase/


Contiene:

- migraciones
- seed de datos

---

# Testing

test/


Define:

- convenciones de testing
- estilo de pruebas

---

# Cómo iniciar un proyecto

1️⃣ Clonar el template

2️⃣ Definir el dominio en:

knowledge/


3️⃣ Crear modelos de dominio en:

src/domain

4️⃣ Crear casos de uso en:

src/application/use-cases



