// Minimal TAP 13 harness for the factory's own acceptance cases (specs 001-003). Each case is named by its plan
// case ID, runs in order, and prints exactly one test point; a failure prints a bounded TAP comment and the
// process exits 1. Cases exercise the real platform modules, never stubs of the behavior they verify.
export async function runCases(cases) {
  const lines = ["TAP version 13"];
  let failed = 0;
  let n = 0;
  for (const [id, fn] of cases) {
    n += 1;
    try {
      await fn();
      lines.push(`ok ${n} - ${id}`);
    } catch (error) {
      failed += 1;
      lines.push(`not ok ${n} - ${id}`);
      lines.push(`# ${id}: ${String(error?.message ?? error).split("\n")[0].slice(0, 200)}`);
    }
  }
  lines.push(`1..${n}`);
  process.stdout.write(`${lines.join("\n")}\n`);
  process.exitCode = failed ? 1 : 0;
}
