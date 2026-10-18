import { metrics, SpanStatusCode, trace, type Attributes, type Histogram, type Counter } from "@opentelemetry/api";

export type RuntimeObservabilityMode = "noop" | "otel";
export type RuntimeOutcome = "success" | "failure";

export type RuntimeObservabilityConfig = {
    enabled: boolean;
    mode: RuntimeObservabilityMode;
    serviceName: string;
    tracerName: string;
    meterName: string;
    localDebug: boolean;
};

export type RuntimeOperationInput = {
    operationName: string;
    attributes?: Record<string, unknown>;
};

const defaultConfig: RuntimeObservabilityConfig = {
    enabled: false,
    mode: "noop",
    serviceName: "ai-native-runtime",
    tracerName: "ai-native-runtime",
    meterName: "ai-native-runtime",
    localDebug: false
};

function normalizeBoolean(value: string | undefined, fallback: boolean): boolean {
    if (value === undefined) return fallback;
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function sanitizeAttributes(attributes: Record<string, unknown> = {}): Attributes {
    const sanitized: Attributes = {};

    for (const [key, value] of Object.entries(attributes)) {
        if (["string", "number", "boolean"].includes(typeof value)) {
            sanitized[key] = value as string | number | boolean;
        }
    }

    return sanitized;
}

export function runtimeObservabilityConfigFromEnv(
    env: Record<string, string | undefined> = process.env
): RuntimeObservabilityConfig {
    const enabled = normalizeBoolean(env.AI_NATIVE_OBSERVABILITY_ENABLED, defaultConfig.enabled);
    const mode = env.AI_NATIVE_OBSERVABILITY_MODE === "otel" ? "otel" : "noop";

    return {
        enabled,
        mode,
        serviceName: env.AI_NATIVE_SERVICE_NAME || defaultConfig.serviceName,
        tracerName: env.AI_NATIVE_OBSERVABILITY_TRACER || defaultConfig.tracerName,
        meterName: env.AI_NATIVE_OBSERVABILITY_METER || defaultConfig.meterName,
        localDebug: normalizeBoolean(env.AI_NATIVE_OBSERVABILITY_DEBUG, defaultConfig.localDebug)
    };
}

export class RuntimeObservability {
    private readonly operationCounter: Counter;
    private readonly durationHistogram: Histogram;

    constructor(private readonly config: RuntimeObservabilityConfig = defaultConfig) {
        const meter = metrics.getMeter(config.meterName);
        this.operationCounter = meter.createCounter("ai_runtime_operation_total", {
            description: "Total runtime operations by outcome"
        });
        this.durationHistogram = meter.createHistogram("ai_runtime_operation_duration_ms", {
            description: "Runtime operation duration in milliseconds",
            unit: "ms"
        });
    }

    async run<T>(input: RuntimeOperationInput, execute: () => Promise<T>): Promise<T> {
        const operationName = input.operationName;
        const start = Date.now();
        const attributes = {
            "service.name": this.config.serviceName,
            "operation.name": operationName,
            ...sanitizeAttributes(input.attributes)
        };

        const span = this.config.enabled && this.config.mode === "otel"
            ? trace.getTracer(this.config.tracerName).startSpan(operationName, { attributes })
            : undefined;

        try {
            const result = await execute();
            this.record(operationName, "success", Date.now() - start, attributes);
            span?.setStatus({ code: SpanStatusCode.OK });
            return result;
        } catch (error) {
            this.record(operationName, "failure", Date.now() - start, attributes);
            if (error instanceof Error) {
                span?.recordException(error);
            }
            span?.setStatus({ code: SpanStatusCode.ERROR });
            throw error;
        } finally {
            span?.end();
        }
    }

    private record(
        operationName: string,
        outcome: RuntimeOutcome,
        durationMs: number,
        attributes: Attributes
    ): void {
        const recordAttributes = { ...attributes, outcome };

        if (this.config.enabled) {
            this.operationCounter.add(1, recordAttributes);
            this.durationHistogram.record(durationMs, recordAttributes);
        }

        if (this.config.localDebug) {
            console.log(JSON.stringify({
                event: "runtime.operation.completed",
                operationName,
                outcome,
                durationMs,
                attributes: recordAttributes
            }));
        }
    }
}

export function createRuntimeObservability(
    config: RuntimeObservabilityConfig = runtimeObservabilityConfigFromEnv()
): RuntimeObservability {
    return new RuntimeObservability(config);
}
