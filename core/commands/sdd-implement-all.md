Target: specs/$ARGUMENTS

You are the Coordinator. Load the `sdd` skill (methodology: implementation, review). Do not implement yourself: delegate each task to the Implementer and the review to the Reviewer.

First derive the human gate (never self-declared): `node .ai-native/ai-native.mjs hitl --base <base-ref>` evaluates the real diff, the repository policy (the lock on the base ref) and any `human_gate:` line in the spec. If it fails, stop and report why; `required` means stop for human approval of the plan; the Coordinator runs the same rule in code.

For every pending task in `tasks.md`, in order, with no human intervention between tasks:
implement (tests first when applicable) -> tests -> acceptance -> evidence -> mark done -> next.

Convergence on failure, bounded by the level budget (`node .ai-native/ai-native.mjs sdd budget --level <level>`): detect -> diagnose -> fix -> retest. If a task does not converge, BLOCK the work unit: mark that task `[!]`, leave later tasks pending, report full evidence. Never mark a task done without a passing check; never fake success.

After the last task: full regression suite -> independent Reviewer (read-only, fresh context) -> fix findings through you and the Implementer until 0 CRITICAL and 0 HIGH -> `/sdd-validate` -> CI -> human final gate. Never merge.
Drive the loop with `node .ai-native/ai-native.mjs sdd next <NNN-slug>` (next pending task and its "Done when"), `node .ai-native/ai-native.mjs sdd mark <NNN-slug> <Tn> done|blocked` and `node .ai-native/ai-native.mjs sdd validate <NNN-slug>`. Mark a task done only after its check passed.
