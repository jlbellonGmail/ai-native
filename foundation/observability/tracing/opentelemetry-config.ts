import { trace } from "@opentelemetry/api";

export class TelemetryManager {
    static startSpan(name: string) {
        const tracer = trace.getTracer("ai-foundation-sdk");
        return tracer.startSpan(name);
    }
}
