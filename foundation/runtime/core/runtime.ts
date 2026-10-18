import { SessionManager } from "./session-manager.js";
import { DecisionTracker } from "./decision-tracker.js";
import { SkillsRegistry } from "../evolution/skills-registry.js";
import { SelfImprovement } from "../evolution/self-improvement.js";
import { AutoActions } from "../evolution/auto-actions.js";
import { createRuntimeObservability, RuntimeObservability } from "../../observability/runtime-wiring/runtime-observability.js";
import fs from "fs";
import path from "path";

export class AIRuntime {
    private sessionManager = new SessionManager();
    private decisionTracker = new DecisionTracker();
    private observability: RuntimeObservability;

    constructor(observability: RuntimeObservability = createRuntimeObservability()) {
        this.observability = observability;
    }

    startSession(metadata: Record<string, any> = {}) {
        return this.sessionManager.start(metadata);
    }

    endSession(status: "COMPLETED" | "FAILED") {
        this.sessionManager.end(status);
    }

    /**
     * Misión: Ejecutar tareas agénticas con trazabilidad 12/10. 
     */
    async runAgentTask({ agent, input, execute, thought_trace }: any) {
        try {
            // 🧠 Lógica de auto-aprendizaje (mantenemos tu lógica actual)
            let incidents: any = [];
            const incidentsFile = path.resolve(process.cwd(), "logs/incidents-history.json");
            if (fs.existsSync(incidentsFile)) {
                incidents = JSON.parse(fs.readFileSync(incidentsFile, "utf-8"));
            }

            SelfImprovement.run(incidents);
            const actions = AutoActions.evaluate(incidents);

            // ⚡ Registro de Skills
            await SkillsRegistry.run({ input });

            // 🔥 EL PUENTE CRÍTICO: Usar el DecisionTracker
            // Esto es lo que genera los archivos decision-dec_...json
            const sessionId = this.sessionManager.getSession()?.id || "no-session";

            return await this.observability.run(
                {
                    operationName: "runtime.agent_task",
                    attributes: {
                        "agent.name": String(agent || "unknown"),
                        "runtime.session_id": sessionId
                    }
                },
                async () => {
                    return await this.decisionTracker.track({
                        sessionId,
                        agent,
                        input,
                        thought_trace: thought_trace || "Ejecución de tarea de dominio",
                        execute: async () => {
                            return await execute();
                        }
                    });
                }
            );

        } catch (error: any) {
            console.error("❌ Runtime error", {
                code: error.code || "UNKNOWN",
                message: error.message
            });
            throw error;
        }
    }
}
