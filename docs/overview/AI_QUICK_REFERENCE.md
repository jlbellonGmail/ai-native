# ⚡ AI Quick Reference

Guía rápida para agentes de IA que trabajan en este proyecto.

---

# 🚀 Inicio Obligatorio

Antes de realizar cualquier acción:

1. Leer `AI_ENTRYPOINT.md`
2. Leer `PROJECT_MAP.md`
3. Identificar tu rol (PM, Architect, Developer, Reviewer)
4. Revisar contexto en `knowledge/`
5. Ejecutar usando workflows definidos

---

# 🧠 Contexto del Proyecto

Este es un proyecto REAL basado en:

- Clean Architecture
- Separación estricta de responsabilidades
- Uso de conocimiento reutilizable
- Integración con el ecosistema AI

---

# 📂 Archivos Importantes

## Contexto del proyecto
.ai/context.md

## Reglas de arquitectura
.ai/architecture_guardrails.md

## Mapa del repositorio
PROJECT_MAP.md

## Conocimiento del dominio
knowledge/index.md

---

# 🏗️ Capas del Sistema

## Dominio
src/domain

Contiene:
- Entidades
- Value Objects
- Reglas de negocio

❌ No depende de infraestructura

---

## Casos de Uso
src/application/use-cases

Responsables de:
- Orquestar lógica
- Coordinar dominio
- Definir flujo de aplicación

---

## Infraestructura
src/infrastructure

Responsable de:
- Base de datos
- APIs externas
- Adaptadores

---

# ⚠️ Reglas de Arquitectura (CRÍTICAS)

- El dominio NO depende de infraestructura
- Los casos de uso coordinan la lógica
- La infraestructura implementa detalles externos
- No mezclar capas
- No acceder directo a la DB desde dominio

Si tienes dudas:

→ Revisar `.ai/architecture_guardrails.md`

---

# 🗄️ Base de Datos

Proveedor:
Supabase

Ubicación:

- Migraciones → `supabase/migrations`
- Seed → `supabase/seed.sql`

⚠️ Nunca modificar datos sin contexto claro

---

# 🧪 Testing

Ubicación:
test/

Convenciones:
test/TEST_STYLE.md

Reglas:

- Escribir tests cuando sea necesario
- Seguir estilo definido
- Validar lógica crítica

---

# 📚 Documentación

Ubicación:
docs/

Incluye:

- decisiones técnicas
- guías
- referencias del sistema

---

# 🧠 Reglas de Operación de IA

- No asumir requerimientos
- No inventar lógica
- No romper arquitectura
- No duplicar código
- No sobreingenierizar

---

# 🔄 Flujo de Trabajo

Siempre seguir:

1. Entender requerimiento
2. Validar contexto
3. Revisar conocimiento existente
4. Aplicar arquitectura
5. Implementar
6. Validar

---

# 🚨 Cuándo detenerse

Debes detenerte y pedir intervención humana si:

- El requerimiento es ambiguo
- Hay múltiples soluciones válidas
- Se requiere modificar arquitectura
- Falta información clave

---

# 🎯 Objetivo

Generar código:

- Correcto
- Mantenible
- Alineado con arquitectura
- Sin retrabajo

---

# 🧠 Recordatorio Final

Este proyecto es parte de un sistema mayor.

→ No trabajes como IA genérica  
→ Trabaja como agente dentro de un sistema estructurado
