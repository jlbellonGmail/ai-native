# Knowledge Configuration

Este archivo define cómo el proyecto utiliza la base de conocimiento.

---

# Ubicación del conocimiento

Todo el conocimiento del dominio se almacena en:

knowledge/

Los agentes deben considerar esta carpeta como la fuente principal de verdad sobre el dominio del proyecto.

---

# Tipo de conocimiento almacenado

El proyecto utiliza la base de conocimiento para almacenar:

- conceptos del dominio
- decisiones de arquitectura
- definiciones clave
- glosario del proyecto
- reglas de negocio

---

# Reglas de uso para agentes

Antes de implementar lógica de negocio, los agentes deben revisar:

knowledge/index.md

Esto evita:

- duplicación conceptual
- interpretaciones incorrectas del dominio
- inconsistencias en la lógica del sistema

---

# Integración con AI

Los agentes de IA deben utilizar el conocimiento almacenado para:

- comprender el dominio
- tomar decisiones coherentes
- mantener consistencia conceptual
- documentar nuevos conceptos si aparecen

---

# Evolución del conocimiento

Si durante el desarrollo aparece un nuevo concepto del dominio, los agentes deben:

1. documentarlo en knowledge/
2. actualizar knowledge/index.md si es necesario
3. luego implementar el código correspondiente