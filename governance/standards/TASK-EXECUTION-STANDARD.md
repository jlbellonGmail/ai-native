# AI-NATIVE EXECUTION STANDARD (v2)

Objetivo:
Ejecutar una única tarea del roadmap por sesión con evidencia, cierre, trazabilidad y continuidad.

## FASE 0 — Inicio de sesión

Entradas obligatorias:

1. governance/roadmaps/ENTERPRISE-10-10-ROADMAP.md
2. governance/SESSION-CONTEXT.md
3. governance/versioning/VERSIONING-POLICY.md
4. governance/standards/TASK-EXECUTION-STANDARD.md

Reglas:

* El roadmap define estado.
* SESSION-CONTEXT define continuidad.
* VERSIONING gobierna releases.
* El estándar gobierna ejecución.
* No asumir estado.
* Una única tarea por sesión.
* No avanzar automáticamente.

Salida:

* confirmar tarea activa
* confirmar alcance
* confirmar entregables

---

## FASE 1 — Preparación

Objetivo:

preparar entorno sin modificar repositorio.

Permitido:

* descargar herramientas
* validar versiones
* validar integridad

Prohibido:

* escribir evidencia
* actualizar roadmap
* cambiar versiones

Salida:

PREPARADO

---

## FASE 2 — Ejecución

Objetivo:

ejecutar cambios reales.

Permitido:

* ejecutar herramientas
* generar resultados temporales

Prohibido:

* documentar cierre
* archivar

Salida:

VALIDADO

---

## FASE 3 — Evidencia

Objetivo:

persistir evidencia.

Ubicación:

governance/execution/current/

Estructura:

current/
├── SUMMARY.md
├── VALIDATION.md
├── EVIDENCE.md
├── CHANGES.md
└── artifacts/

Salida:

DOCUMENTADO

---

## FASE 4 — Cierre

Objetivo:

cerrar tarea.

Permitido:

* actualizar roadmap
* actualizar SESSION-CONTEXT
* archivar execution

Destino:

governance/execution/archive/<PROGRAMA>/<TAREA>/

Recrear:

execution/current/

Salida:

CERRADA

---

## FASE 5 — Gobernanza Git

Objetivo:

persistir oficialmente el cierre.

Permitido:

* revisar git status
* validar archivos
* git add selectivo
* git commit

Prohibido:

* push automático
* squash automático
* rebase automático
* cambio de versión automático

Validaciones:

* roadmap actualizado
* execution archivado
* SESSION-CONTEXT actualizado
* commit generado

Salida:

COMMITTEADA

---

## FASE 6 — Memoria

Objetivo:

persistir continuidad mínima.

Guardar únicamente:

* resultado
* decisión
* estado
* siguiente paso
* referencia documental

Nunca:

* logs
* artefactos
* conversaciones
* evidencia completa

Ejemplo:

engram save "... " --project ai-native

Salida:

CONTEXTUALIZADA
