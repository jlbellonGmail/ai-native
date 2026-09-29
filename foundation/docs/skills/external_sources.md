# Fuentes Externas de Skills

Este documento registra repositorios externos que contienen habilidades (skills)
que los agentes pueden utilizar dentro del framework **AI Project Foundation**.

Las skills externas permiten ampliar las capacidades del agente sin modificar
la arquitectura principal del repositorio.

Su objetivo es:

- mantener trazabilidad del conocimiento externo utilizado
- evaluar la calidad de las fuentes
- evitar dependencias inseguras o no mantenidas
- permitir auditoría del origen de las metodologías utilizadas por los agentes

---

# Principios de Uso

Las fuentes externas **no se integran automáticamente** en el sistema.

Antes deben pasar por el proceso definido en:

docs/skills/policies.md

Solo después de ser evaluadas y documentadas pueden convertirse en **skills curadas**
dentro del catálogo oficial del proyecto.

---

# Reglas de Uso

1. Solo utilizar skills que estén registradas en este documento.
2. Priorizar siempre las skills internas del proyecto.
3. No ejecutar automáticamente código proveniente de repositorios externos.
4. Analizar la skill antes de aplicarla al proyecto.
5. Documentar cualquier adaptación antes de integrarla al catálogo interno.

---

# Repositorios de Skills Autorizados

## 1. Superpowers

Repositorio:

https://github.com/obra/superpowers

Tipo de habilidades:

- productividad
- workflows de desarrollo
- automatización de tareas
- mejora del flujo de trabajo con IA

Estado:

Curado parcialmente.

Uso recomendado:

Optimización del flujo de desarrollo y ampliación de capacidades de los agentes.

---

## 2. Frontend Design Skills

Repositorio:

https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design

Tipo de habilidades:

- diseño UI
- layout
- componentes frontend
- heurísticas UX
- patrones de diseño visual

Estado:

Curado parcialmente.

Uso recomendado:

Diseño de interfaces modernas y consistentes para aplicaciones web.

---

## 3. Marketing Skills

Repositorio:

https://github.com/coreyhaines31/marketingskills

Tipo de habilidades:

- growth
- posicionamiento
- copywriting
- funnels
- estrategia de adquisición

Estado:

Curado parcialmente.

Uso recomendado:

Diseño de estrategias de marketing y optimización de conversión de productos.

---

# Fuentes en Observación

Estas fuentes aún no han sido evaluadas completamente y se mantienen registradas
para análisis futuro.

## Product Discovery Frameworks

Referencias:

- Continuous Discovery (Teresa Torres)
- Inspired (Marty Cagan)
- Lean Product Discovery

Estado:

Investigación metodológica.

---

## UX Research Frameworks

Referencias:

- Nielsen Heuristics
- UX Audit frameworks
- Usability evaluation models

Estado:

Investigación.

---

# Criterio de Curación

Una skill externa pasa a estado **Curada** cuando:

- ha sido probada en al menos un proyecto
- su resultado es consistente
- no introduce deuda técnica
- su uso está documentado dentro del catálogo del proyecto

Las skills curadas deben registrarse en:

docs/skills/catalog.md

---

# Regla de Seguridad

Los agentes **no deben descargar ni ejecutar código externo**
directamente desde repositorios listados en este documento.

Toda integración debe ser:

1. revisada
2. documentada
3. aprobada
4. incorporada al catálogo interno de skills

---

# Política del Proyecto

Las skills externas son consideradas **complementos**.

No reemplazan:

- la arquitectura del sistema
- las reglas definidas en `.antigravity/rules.md`
- las políticas del framework

El conocimiento externo siempre debe adaptarse al modelo
de desarrollo definido por **AI Project Foundation**.