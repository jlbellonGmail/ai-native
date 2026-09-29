# Runtime

Runtime primitives for AI-native execution.

Current modules:

* `core/` - runtime execution, sessions, decisions and integration wrapper.
* `models/` - decision and session types.
* `storage/` - file-backed runtime repository.
* `evolution/` - self-improvement and skill registry primitives.

The runtime is validated through TypeScript compilation and the structural checks
in `scripts/validate-structure.mjs`.

Runtime task execution is wired to H3 observability through
`observability/runtime-wiring/runtime-observability.ts`. The default is local
no-op and does not require a collector, endpoint or token.
