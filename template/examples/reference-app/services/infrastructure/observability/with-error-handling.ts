import { Logger } from "./logger";

export async function withErrorHandling<T>(execute: () => Promise<T>): Promise<T> {
    try {
        return await execute();
    } catch (error) {
        Logger.error("Unhandled reference-app error", {
            message: error instanceof Error ? error.message : "unknown error"
        });
        throw error;
    }
}
