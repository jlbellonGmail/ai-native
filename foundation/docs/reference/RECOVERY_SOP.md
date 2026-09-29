## Guía de "Red-Team" para auto-corrección de errores.

* **Estructura**: Un diccionario de errores comunes (ej. errores de hidratación en Next.js, fallos de RLS en Supabase).
* **Flujo de Escalado**: "Si el error persiste tras consultar este manual, detén la ejecución y solicita intervención humana enviando un resumen del 'Thought Process' fallido".
* **Mejora 1**: Árbol de Troubleshooting: Estructura este archivo como un diccionario de errores comunes (hidratación en Next.js, fallos de API de IA). El agente debe intentar auto-corregirse usando estos patrones antes de pedir ayuda humana.
* **Mejora 2**: Escalado de Errores: Define que si el agente falla tres veces consecutivas en la misma tarea, debe generar un Artifact de diagnóstico con su "Thought Trace" y detenerse para revisión del Senior PM. 

## Regla de Corte Definitivo

- Tras generar el Artifact de diagnóstico, el agente debe detenerse.
- Está prohibido continuar sin aprobación humana.

## Criterio de Cobertura del SOP

- Este SOP se considera suficiente cuando cubre al menos el 90% de los errores recurrentes conocidos.
- Si un error no está documentado, el agente debe proponer su incorporación antes de escalar.