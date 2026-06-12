import { UserRepository } from "@/domain/repositories/user-repository";
import { Logger } from "@/infrastructure/observability/logger";
import { WorkflowEngine } from "../workflows/workflow-engine";
import { createUserWorkflow } from "../workflows/create-user-workflow";
import { AppError } from "@/domain/errors/app-error";

// 🔥 desde foundation 
import { withRuntime } from "@/infrastructure/runtime/with-runtime";
import { withErrorHandling } from "@/infrastructure/observability/with-error-handling";

export async function createUserOrchestrator(
    input: { email: string },
    userRepository: UserRepository
) {

    Logger.info("Orchestrator: start create-user", input);

    return withErrorHandling(async () => {

        return withRuntime(
            { feature: "create-user" },
            async (runtime: any) => {

                const workflow = createUserWorkflow(userRepository);

                let attempts = 0;

                while (attempts < 3) {
                    try {
                        attempts++;

                        const result = await runtime.runAgentTask({
                            agent: "backend-agent",
                            input,

                            execute: async () => {

                                const workflowResult = await WorkflowEngine.run(workflow, input);

                                if (!workflowResult.user) {
                                    throw new AppError({
                                        message: "User creation failed",
                                        code: "INTERNAL_ERROR",
                                        statusCode: 500,
                                        retryable: false
                                    });
                                }

                                return workflowResult.user;
                            }
                        });

                        return result;

                    } catch (error: any) {

                        Logger.warn("Retry attempt failed", {
                            attempt: attempts,
                            message: error.message
                        });

                        // ❗ NO reintentar errores de negocio / validación
                        if (error.retryable === false) {
                            throw error;
                        }

                        if (error.code === "INVALID_INPUT") {
                            throw error; // ❌ NO retry
                        }

                        // ❗ cortar si ya agotó intentos
                        if (attempts >= 3) {
                            throw error;
                        }
                    }
                }

            }
        );

    });

}
