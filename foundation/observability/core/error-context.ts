export function buildErrorContext(additionalContext: Record<string, any> = {}) {
    return {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        ...additionalContext,
    };
}