import { AIError } from "../core/error-types.js";

export class Logger {
    log(error: AIError) {
        console.error(
            JSON.stringify(
                {
                    type: error.type,
                    severity: error.severity,
                    message: error.message,
                    timestamp: error.timestamp,
                    context: error.context,
                },
                null,
                2
            )
        );
    }
}