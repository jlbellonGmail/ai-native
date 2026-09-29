import { AIError } from "../core/error-types.js";

export interface RetryStrategy {
    run(error: AIError): Promise<{ success: boolean; data?: any }>;
}

export class AutoFixStrategy implements RetryStrategy {
    async run(error: AIError) {
        console.log("🔧 Intentando AutoFix...");
        return { success: false };
    }
}

export class AlternativeStrategy implements RetryStrategy {
    async run(error: AIError) {
        console.log("🔄 Intentando estrategia alternativa...");
        return { success: false };
    }
}

export class EscalationStrategy implements RetryStrategy {
    async run(error: AIError) {
        console.log("🚨 Escalando a humano...");
        return { success: false };
    }
}