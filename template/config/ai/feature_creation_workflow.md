# Feature Creation Workflow

Este workflow describe cómo agregar una nueva funcionalidad al proyecto.

---

# Paso 1 — Entender la funcionalidad

Antes de escribir código:

1. entender el problema
2. revisar knowledge/
3. identificar entidades afectadas

---

# Paso 2 — Actualizar conocimiento si es necesario

Si la funcionalidad introduce nuevos conceptos:

agregar documentación en:

knowledge/concepts

o

knowledge/decisions

---

# Paso 3 — Actualizar modelos de dominio

Si la funcionalidad afecta el dominio:

actualizar o crear modelos en:

src/domain/models

---

# Paso 4 — Crear o modificar servicios de dominio

Si la lógica de negocio lo requiere:

crear o modificar archivos en:

src/domain/services

---

# Paso 5 — Crear caso de uso

Implementar la funcionalidad como un caso de uso en:

src/application/use-cases

Un caso de uso debe:

- tener responsabilidad única
- ser claro y testeable

---

# Paso 6 — Implementar infraestructura

Agregar:

- endpoints
- repositorios
- integraciones externas

en:

src/infrastructure

---

# Paso 7 — Agregar pruebas

Crear pruebas en:

test/

Las pruebas deben cubrir:

- lógica de dominio
- comportamiento del caso de uso