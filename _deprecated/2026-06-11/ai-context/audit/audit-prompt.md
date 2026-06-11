<# Instrucción de Auditoría Técnica - GI Gestión Integral

Analiza el siguiente contexto del proyecto, la arquitectura de archivos y los cambios recientes en el código para generar un reporte de salud técnica.

## Contexto del Proyecto
{{PROJECT_CONTEXT}}

## Tarea de Análisis
Evalúa el score general de salud del software (0-10) basándote en:
1.  **Deuda Técnica:** Complejidad ciclomática y archivos excesivamente largos.
2.  **Naming:** Uso estricto de `snake_case` según los estándares de Jose Luis Bellon.
3.  **Seguridad:** Presencia de secretos expuestos o falta de validación de entradas.
4.  **Resiliencia:** Manejo de errores en operaciones críticas.

## Formato de Salida (ESTRICTO JSON)
Debes responder ÚNICAMENTE con un objeto JSON válido. No incluyas explicaciones fuera del JSON. Cada objeto en la lista 'hotspots' DEBE contener la propiedad "file".

### Estructura Requerida:
{
  "score": [Número del 0 al 10],
  "trend": "improving" | "stable" | "declining",
  "security": { "score": [0-10] },
  "architecture": { "score": [0-10] },
  "hotspots": [
    {
      "file": "nombre_del_archivo_con_ruta_completa.ext",
      "score": [0-10],
      "reason": "Explicación breve de por qué es crítico",
      "fixPriority": "LOW" | "MEDIUM" | "HIGH"
    }
  ],
  "criticalIssues": ["Lista de strings con problemas detectados"]
}

## Regla de Oro
Si el archivo analizado supera las 100 líneas o carece de manejo de errores asíncronos, DEBE aparecer en la lista de 'hotspots' con prioridad MEDIUM o HIGH.