# Estrategia de Resiliencia y Fallback de Modelos

## 1. Filosofía de Diseño
El ecosistema no debe depender de un único proveedor de IA (Single Point of Failure). La capacidad de ejecución de auditorías debe persistir ante limitaciones de cuota (Rate Limits) o caídas de servicio.

## 2. Jerarquía de Proveedores (Provider Chain)
El sistema de orquestación en `scripts/ai-audit.js` seguirá este orden:
1. **OpenAI (GPT-4o-mini)**: Eficiencia de costo y velocidad.
2. **Anthropic (Claude 3.5 Sonnet)**: Fallback de alta precisión técnica.
3. **Google Gemini (1.5 Flash)**: Fallback de alta disponibilidad y contexto extendido.

## 3. Implementación
Se utiliza un patrón de **Intento Escalonado**. Si un proveedor devuelve un error de tipo `429` (Quota Exceeded) o `500` (Server Error), el motor salta automáticamente al siguiente nivel.

## 4. Requisitos de Entorno
Es obligatorio que el archivo `.env` contenga las llaves: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` y `GEMINI_API_KEY`.