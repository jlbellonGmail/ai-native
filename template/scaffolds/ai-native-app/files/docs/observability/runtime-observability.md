# Runtime Observability

This generated project includes H3 runtime observability wiring with a safe
local/no-op default.

Default behavior:

* No remote export.
* No endpoint required.
* No token required.
* No vendor-specific collector required.

Config:

```text
config/observability/runtime-observability.json
```

Runtime helper:

```text
services/infrastructure/observability/runtime-observability.mjs
```

Validate locally:

```bash
npm run validate
```

To enable a real OpenTelemetry backend later, keep this local wiring and attach
an SDK/provider in the project runtime deployment. Do not hardcode collector
endpoints or secrets in source files.
