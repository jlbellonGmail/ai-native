export function create_runtime_observability(config = {}) {
  const resolved_config = {
    enabled: Boolean(config.enabled),
    mode: config.mode === "otel" ? "otel" : "noop",
    service_name: config.service_name || "ai-native-app",
    local_debug: Boolean(config.local_debug)
  };
  const events = [];

  return {
    config: resolved_config,
    events,
    async with_operation(operation_name, attributes, execute) {
      const started_at = Date.now();
      try {
        const result = await execute();
        record_event(events, resolved_config, operation_name, "success", Date.now() - started_at, attributes);
        return result;
      } catch (error) {
        record_event(events, resolved_config, operation_name, "failure", Date.now() - started_at, attributes);
        throw error;
      }
    }
  };
}

function record_event(events, config, operation_name, outcome, duration_ms, attributes = {}) {
  const event = {
    event: "runtime.operation.completed",
    service_name: config.service_name,
    operation_name,
    outcome,
    duration_ms,
    attributes: sanitize_attributes(attributes)
  };

  events.push(event);

  if (config.local_debug) {
    console.log(JSON.stringify(event));
  }
}

function sanitize_attributes(attributes) {
  return Object.fromEntries(
    Object.entries(attributes).filter(([, value]) =>
      ["string", "number", "boolean"].includes(typeof value)
    )
  );
}
