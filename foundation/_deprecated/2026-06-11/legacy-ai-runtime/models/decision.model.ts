export interface AIDecision {
    // Identificadores de rastro
    id: string;
    sessionId: string;
    agent: string;

    // Datos de la ejecución
    input: any;
    output: any;

    /** 
     * Thought Trace / Reasoning: El "Chain of Thought" capturado del agente.
     * Mantenemos 'reasoning' por claridad o cambiamos a 'thoughtTrace' si prefieres el término técnico.
     */
    thoughtTrace?: string;

    // Métricas y Auditoría (Siguiendo ISO 42001 para trazabilidad)
    /** Firma de integridad para asegurar que la decisión no fue alterada */
    integrityHash: string;
    timestamp: string;
    /** Duración en milisegundos (camelCase corregido) */
    durationMs: number;
    success: boolean;

    /** Metadatos adicionales para flexibilidad futura */
    metadata?: Record<string, any>;
}
