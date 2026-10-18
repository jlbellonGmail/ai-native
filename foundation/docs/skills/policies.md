  # Reglas de uso, límites y seguridad# Políticas del Sistema de Skills

Este documento define las reglas de calidad y gobierno del sistema de skills
del framework **AI Project Foundation**.

Su objetivo es asegurar que las skills incorporadas al sistema:

- mantengan alta calidad metodológica
- sean reutilizables entre proyectos
- no introduzcan complejidad innecesaria
- puedan ser utilizadas de forma consistente por agentes de IA.

---

# Principios del Sistema de Skills

Toda skill incorporada debe cumplir los siguientes principios:

## 1. Claridad metodológica

Una skill debe estar basada en:

- un framework reconocido
- una práctica consolidada
- o una metodología claramente definida.

No se aceptan skills basadas únicamente en opiniones.

---

## 2. Reutilización

Las skills deben poder ser reutilizadas en múltiples proyectos.

Una skill no debe estar atada a un único producto o dominio específico.

---

## 3. Modularidad

Cada skill debe representar **una capacidad específica**.

Ejemplos correctos:

- UX Research
- Growth Engineering
- Frontend Design

Ejemplos incorrectos:

- "Todo sobre marketing"
- "Desarrollo completo de producto"

Las skills deben mantenerse **pequeñas y especializadas**.

---

## 4. Documentación obligatoria

Toda skill debe tener documentación mínima que explique:

- qué problema resuelve
- cómo se utiliza
- cuándo aplicarla
- ejemplos de uso

---

# Proceso de Validación de Skills

Antes de incorporar una nueva skill al sistema se deben cumplir estos pasos.

1️⃣ Identificación de necesidad  
2️⃣ Investigación de frameworks o fuentes  
3️⃣ Evaluación de calidad metodológica  
4️⃣ Documentación inicial  
5️⃣ Registro en `catalog.md`  
6️⃣ Inclusión en `roadmap.md`

Solo después de este proceso la skill se considera **curada**.

---

# Fuentes Aceptadas

Las skills pueden provenir de:

- frameworks reconocidos
- repositorios open source
- documentación técnica consolidada
- investigación propia documentada

Las fuentes externas deben registrarse en:

```
docs/skills/external_sources.md
```

---

# Versionado del Sistema de Skills

El sistema de skills evoluciona junto con el proyecto.

Las modificaciones relevantes deben registrarse en:

- `catalog.md`
- `roadmap.md`
- `CHANGELOG.md`

---

# Uso por Agentes de IA

Los agentes deben utilizar el sistema de skills como **fuente de conocimiento estructurado**.

Las skills permiten a los agentes:

- aplicar metodologías especializadas
- mejorar calidad de decisiones
- mantener consistencia entre proyectos.

---

# Regla Fundamental

Una skill mal definida es peor que no tener skill.

El sistema prioriza **calidad sobre cantidad**.