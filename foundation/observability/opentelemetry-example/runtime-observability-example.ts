import { createRuntimeObservability } from "../runtime-wiring/runtime-observability.js";

const observability = createRuntimeObservability({
    enabled: true,
    mode: "otel",
    serviceName: "example-ai-native-service",
    tracerName: "example-ai-native-runtime",
    meterName: "example-ai-native-runtime",
    localDebug: true
});

export async function runObservableExample() {
    return observability.run(
        {
            operationName: "runtime.agent_task",
            attributes: {
                "agent.name": "example-agent",
                "runtime.session_id": "local-example"
            }
        },
        async () => ({ ok: true })
    );
}
