import { AIRuntime } from "../runtime.js";

const runtime = new AIRuntime();

export async function withRuntime(
    metadata: Record<string, any>,
    fn: (runtime: AIRuntime) => Promise<any>
) {
    const session = runtime.startSession(metadata);

    try {
        const result = await fn(runtime);
        runtime.endSession("COMPLETED");
        return result;
    } catch (error) {
        runtime.endSession("FAILED");
        throw error;
    }
}