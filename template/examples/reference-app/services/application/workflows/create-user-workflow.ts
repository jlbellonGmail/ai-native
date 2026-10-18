import { Workflow } from "./workflow-types";
import { createUserUseCase } from "../use-cases/create-user-use-case";
import { Logger } from "@/infrastructure/observability/logger";
import { AppError } from "@/domain/errors/app-error";


export function createUserWorkflow(userRepository: any): Workflow {

    return {
        name: "create-user",

        steps: [

            async (context) => {
                Logger.info("Step: validate input", context);

                if (!context.email) {
                    throw new AppError({
                        message: "Email is required",
                        code: "INVALID_INPUT",
                        statusCode: 400,
                        retryable: false
                    });
                }
                return context;
            },

            async (context) => {
                Logger.info("Step: create user", context);

                const user = await createUserUseCase(
                    { email: context.email },
                    userRepository
                );

                return { ...context, user };
            },

            async (context) => {
                Logger.info("Step: finalize", context);

                return context;
            }

        ]
    };
}