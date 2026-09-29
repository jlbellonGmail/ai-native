import { AIDecision } from "../models/decision.model";
import { FileRuntimeRepository } from "../storage/file-runtime.repository";
import { createHash } from "crypto";

export class DecisionTracker {
    private repository = new FileRuntimeRepository();

    async track(params: {
        sessionId: string;
        agent: string;
        input: any;
        thought_trace?: string;
        execute: () => Promise<any>;
    }) {
        const start = Date.now();
        try {
            const output = await params.execute();
            await this.save_decision(params, output, true, start);
            return output;
        } catch (error: any) {
            await this.save_decision(params, error.message, false, start);
            throw error;
        }
    }

    private async save_decision(params: any, output: any, success: boolean, start: number) {
        const decision_id = `dec_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const raw_payload = JSON.stringify({
            id: decision_id,
            input: params.input,
            output,
            thought: params.thought_trace
        });

        const decision: AIDecision = {
            id: decision_id,
            sessionId: params.sessionId,
            agent: params.agent,
            input: params.input,
            output,
            thoughtTrace: params.thought_trace,
            durationMs: Date.now() - start,
            timestamp: new Date().toISOString(),
            success,
            // Generamos hash SHA-256 para inmutabilidad del log [1]
            integrityHash: createHash('sha256').update(raw_payload).digest('hex')
        };

        this.repository.saveDecision(decision);
    }
}