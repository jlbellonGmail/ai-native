# Project Bootstrap Workflow

Este workflow describe cómo inicializar un nuevo proyecto usando este template.

---

# Paso 1 — Entender el dominio

El primer paso es definir el dominio del proyecto.

Crear o actualizar documentos en:

knowledge/

Ejemplos:

knowledge/concepts/
knowledge/decisions/

Documentar:

- entidades principales
- reglas de negocio
- conceptos del dominio

---

# Paso 2 — Definir modelos de dominio

Crear modelos en:

src/domain/models

Cada modelo debe representar una entidad del dominio.

Ejemplos:

User
Order
Product

---

# Paso 3 — Crear servicios de dominio

Si el dominio requiere lógica compleja, crear servicios en:

src/domain/services

Los servicios deben contener lógica de negocio pura.

---

# Paso 4 — Crear casos de uso

Los casos de uso viven en:

src/application/use-cases

Cada caso de uso representa una operación del sistema.

Ejemplos:

CreateUser
ProcessOrder
GenerateReport

---

# Paso 5 — Implementar infraestructura

Crear implementaciones técnicas en:

src/infrastructure

Ejemplos:

- API controllers
- repositorios
- integraciones externas

---

# Paso 6 — Configurar base de datos

Si el proyecto utiliza Supabase:

1. crear migraciones en

supabase/migrations

2. agregar datos iniciales en

supabase/seed.sql

---

# Paso 7 — Crear pruebas

Las pruebas deben ubicarse en:

test/

Seguir las reglas definidas en:

test/TEST_STYLE.md