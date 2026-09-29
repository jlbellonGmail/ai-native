import { AIError } from "./error-types.js";
import { RetryEngine } from "./retry-engine.js";
import { Logger } from "../logging/logger.js";
import { IncidentWriter } from "../logging/incident-writer.js";

export class AIErrorHandler {
    private retryEngine = new RetryEngine();
    private logger = new Logger();
    private incidentWriter = new IncidentWriter();

    async handle(error: AIError) {
        this.logger.log(error);

        if (error.retryable) {
            const result = await this.retryEngine.execute(error);
            if (result.success) return result;
        }

        if (error.severity === "HIGH" || error.severity === "CRITICAL") {
            await this.incidentWriter.create(error);
            this.escalate(error);
        }

        return { success: false, error };
    }

    private escalate(error: AIError) {
        console.warn("🚨 Escalado requerido:", error.type);
    }
}