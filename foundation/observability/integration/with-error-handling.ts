/**
 * Wrapper de alto nivel para manejar errores en flujos agénticos.
 * Elimina la dependencia rígida del Template para evitar Errores 500.
 */
export async function withErrorHandling(fn: () => Promise<any>, externalLogger?: any) {
    try {
        return await fn();
    } catch (error: any) {
        // Mapeo exhaustivo para transformar errores internos en HTTP comprensibles [1]
        const errorMapping: Record<string, number> = {
            "INVALID_INPUT": 400,
            "CONTEXT_MISSING": 422,
            "ARCHITECTURE_VIOLATION": 403,
            "AGENT_FAILURE": 502,
            "MCP_FAILURE": 503,
            "EXTERNAL_API_FAILURE": 504,
            "TIMEOUT": 504
        };

        const statusCode = errorMapping[error.code] || 500;
        error.status = statusCode;

        console.error(`🚨 [Foundation Error] Code: ${error.code || 'UNKNOWN'} | Status: ${statusCode}`);

        // Registro asíncrono si existe un logger inyectado
        if (externalLogger && typeof externalLogger.log === 'function') {
            externalLogger.log(error).catch(() => console.warn("⚠️ Logger externo no disponible"));
        }

        throw error;
    }
}