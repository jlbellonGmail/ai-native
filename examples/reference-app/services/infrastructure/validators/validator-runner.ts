import { noInfrastructureInUseCases } from "./rules/no-infrastructure-in-usecases-validator";
import { noRawErrorValidator } from "./rules/no-raw-error-validator";
import { Logger } from "@/infrastructure/observability/logger";

export async function runValidators() {

    const validators = [
        noInfrastructureInUseCases,
        noRawErrorValidator
    ];

    const results = [];

    for (const validator of validators) {
        const result = await validator();
        results.push(result);

        if (!result.success) {
            Logger.error("Validation failed", result);
        } else {
            Logger.info("Validation passed", result);
        }
    }

    return results;
}

export class PromptSnapshot {
    static validate(promptName: string, promptContent: string): boolean {
        console.log(`[Testing-SDK] Validating snapshot for ${promptName}`);
        return promptContent.length > 0;
    }
}