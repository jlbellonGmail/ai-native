import { AIError } from "./error-types.js";
import {
    AutoFixStrategy,
    AlternativeStrategy,
    EscalationStrategy,
    RetryStrategy,
} from "../strategies/retry-strategy.js";

export class RetryEngine {
    async execute(error: AIError) {
        for (let attempt = 1; attempt <= 3; attempt++) {
            const strategy = this.selectStrategy(attempt);

            const result = await strategy.run(error);

            if (result.success) {
                return result;
            }
        }

        return { success: false };
    }

    private selectStrategy(attempt: number): RetryStrategy {
        if (attempt === 1) return new AutoFixStrategy();
        if (attempt === 2) return new AlternativeStrategy();
        return new EscalationStrategy();
    }
}