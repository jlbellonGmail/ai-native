# Skills Index

Este archivo proporciona un índice de las habilidades disponibles en la base de conocimiento.

Su objetivo es permitir que los agentes de IA identifiquen rápidamente qué habilidades pueden aplicar para resolver una tarea.

---

# Catálogo de Skills

| Skill                    | Ubicación                       | Descripción                                       |
| ------------------------ | ------------------------------- | ------------------------------------------------- |
| Requirements Analysis    | skills/requirements-analysis    | Analiza requisitos de funcionalidades o productos |
| Architecture Design      | skills/architecture-design      | Diseña la arquitectura técnica de sistemas        |
| Code Review              | skills/code-review              | Evalúa la calidad del código                      |
| Documentation Generation | skills/documentation-generation | Genera documentación técnica clara                |
| Prompt Design            | skills/prompt-design            | Diseña prompts claros para interacción con IA     |

---

# Lista de Skills

## Requirements Analysis

Ubicación:

```
skills/requirements-analysis/
```

Descripción:

Analiza requisitos de funcionalidades o productos para identificar:

* objetivos
* actores
* restricciones
* criterios de aceptación

---

## Architecture Design

Ubicación:

```
skills/architecture-design/
```

Descripción:

Diseña la arquitectura técnica de sistemas o funcionalidades, definiendo:

* componentes
* responsabilidades
* interacciones entre módulos

---

## Code Review

Ubicación:

```
skills/code-review/
```

Descripción:

Evalúa la calidad del código para asegurar:

* claridad
* mantenibilidad
* cumplimiento de estándares del proyecto

---

## Documentation Generation

Ubicación:

```
skills/documentation-generation/
```

Descripción:

Genera documentación técnica clara y estructurada para explicar:

* funcionalidades
* arquitectura
* procesos del sistema

---

## Prompt Design

Ubicación:

```
skills/prompt-design/
```

Descripción:

Diseña prompts claros y estructurados para mejorar la interacción con agentes de IA.

Incluye prácticas para:

* estructuración de prompts
* claridad de instrucciones
* optimización de interacción con modelos.

---

# Uso por parte de agentes

Cuando un agente recibe una tarea debe seguir el siguiente proceso:

1. consultar este índice
2. identificar habilidades relevantes
3. revisar la documentación de la skill correspondiente
4. aplicar el proceso definido en la skill

Este enfoque permite reutilizar conocimiento y mantener consistencia entre proyectos.

---

# Extensión del sistema

Cuando se añadan nuevas habilidades al repositorio:

1. crear una nueva carpeta dentro de:

```
skills/
```

2. nombrar la carpeta usando **kebab-case**

Ejemplo:

```
skills/api-design
```

3. crear el archivo:

```
skill.md
```

4. registrar la nueva habilidad en este índice.

---

# Objetivo del sistema de Skills

Las skills permiten a los agentes de IA aplicar **conocimiento estructurado reutilizable** para resolver tareas comunes en proyectos de desarrollo de software.

Esto facilita:

* reutilización de experiencia
* consistencia entre proyectos
* colaboración eficiente entre humanos y agentes de IA.
