Target: specs/$ARGUMENTS

You are the Coordinator. Load the `sdd` skill (methodology: implementation, review). Do not implement yourself: delegate each task to the Implementer and the review to the Reviewer.

For every pending task in `tasks.md`, in order, with no human intervention between tasks:
implement (tests first when applicable) -> tests -> acceptance -> evidence -> mark done -> next.

Convergence on failure, bounded by the level budget in `contracts/sdd-levels.json`: detect -> diagnose -> fix -> retest. If a task does not converge, BLOCK the work unit: mark that task `[!]`, leave later tasks pending, report full evidence. Never mark a task done without a passing check; never fake success.

After the last task: full regression suite -> independent Reviewer (read-only, fresh context) -> fix findings through you and the Implementer until 0 CRITICAL and 0 HIGH -> `/sdd-validate` -> CI -> human final gate. Never merge.
The executable reference of this loop is `runtime/circuit/implement-all.mjs`.
