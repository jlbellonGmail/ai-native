# Estándar: Trazas Cognitivas y Observabilidad

## Convenciones Semánticas de Spans 

Todo agente debe estructurar su rastro de pensamiento (thought_trace) siguiendo estas etiquetas:

    1. ****: Instrucciones de control activas.

    2. ****: El razonamiento interno (scratchpad) antes de actuar.

    3. ****: Qué herramienta se decidió usar y por qué.

    4. ****: Respuesta final entregada al usuario.

## Regla de Oro

Ninguna decisión agéntica es válida si no posee un integrity_hash. Los logs sin firma se consideran "no auditables" y fallarán en la certificación ISO 42001.