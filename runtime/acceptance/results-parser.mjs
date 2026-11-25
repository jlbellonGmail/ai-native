// Structured result parsers (spec 002 RF-23, RF-24): TAP 13, JUnit XML and the
// Node test runner (spec reporter). Observed case IDs come from the output,
// never from the exit code alone.
const MAX_BYTES = 8 * 1024 * 1024;

const addCase = (cases, errors, id, status) => {
  if (cases.has(id)) {
    errors.push(`duplicate observed case ${id}`);
    if (status === "fail") cases.set(id, { status });
    return;
  }
  cases.set(id, { status });
};

/** @returns {{ cases: Map<id,{status}>, errors: string[] }} status: pass | fail | skip */
export function parseTap13(text) {
  const cases = new Map();
  const errors = [];
  if (!/^TAP version 1[34]\b/m.test(text)) errors.push("not TAP output (no version line)");
  const re = /^(\s*)(not ok|ok)\s+\d+\s*-?\s*(.*?)\s*$/;
  for (const line of text.split(/\r?\n/)) {
    const m = re.exec(line);
    if (!m || m[1].length > 0) continue; // nested subtest points belong to their parent
    const raw = m[3];
    const directive = /\s#\s*(SKIP|TODO)\b/i.test(raw);
    const id = raw.replace(/\s#\s*(SKIP|TODO)\b.*$/i, "").trim();
    if (!id) { errors.push("a TAP test point has no name"); continue; }
    addCase(cases, errors, id, directive ? "skip" : m[2] === "ok" ? "pass" : "fail");
  }
  return { cases, errors };
}

const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
export function parseJUnit(text) {
  const cases = new Map();
  const errors = [];
  if (!/<testsuites?\b/.test(text)) errors.push("not JUnit XML (no <testsuite>)");
  const re = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
  let m;
  while ((m = re.exec(text))) {
    const name = /\bname="([^"]*)"/.exec(m[1]);
    if (!name) { errors.push("a testcase has no name"); continue; }
    const body = m[3] ?? "";
    const status = /<skipped\b/.test(body) ? "skip" : /<(failure|error)\b/.test(body) ? "fail" : "pass";
    addCase(cases, errors, decode(name[1]), status);
  }
  return { cases, errors };
}

/** Node `--test-reporter=spec` lines: ✔ pass, ✖ fail, ﹣ skip/todo. Suites are not cases. */
export function parseNodeTest(text) {
  const cases = new Map();
  const errors = [];
  const re = /^\s*(✔|✖|﹣)\s+(.+?)(?:\s+\([0-9.]+ms\))?(?:\s+#\s*(?:SKIP|TODO).*)?\s*$/;
  let sawSummary = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^ℹ (tests|pass|fail) /.test(line)) sawSummary = true;
    const m = re.exec(line);
    if (!m) continue;
    addCase(cases, errors, m[2].trim(), m[1] === "✔" ? "pass" : m[1] === "✖" ? "fail" : "skip");
  }
  if (!sawSummary) errors.push("not a node test report (no summary)");
  return { cases, errors };
}

export function parseStructured(format, output) {
  if (typeof output !== "string" || !output.length) return { cases: new Map(), errors: ["runner produced no structured output"] };
  if (Buffer.byteLength(output) > MAX_BYTES) return { cases: new Map(), errors: ["structured output exceeds the size bound"] };
  switch (format) {
    case "tap13": return parseTap13(output);
    case "junit": return parseJUnit(output);
    case "node-test": return parseNodeTest(output);
    default: return { cases: new Map(), errors: [`unknown format ${format}`] };
  }
}

/**
 * Evaluates observed cases against the registered mandatory case IDs.
 * Zero observed, missing, skipped/todo or unknown IDs are BLOCKED whatever the
 * exit code; a failing mandatory case is FAIL; all passing is PASS (RF-24).
 */
export function evaluateObserved({ expectedIds, observed, parseErrors = [], minObserved = 1, exitCode = 0 }) {
  const reasons = [...parseErrors];
  if (observed.size === 0) return { status: "BLOCKED", reasons: [...reasons, "zero observed cases"], perCase: {} };
  if (observed.size < minObserved) reasons.push(`observed ${observed.size} case(s), below the contract minimum ${minObserved}`);
  const perCase = {};
  let failed = false;
  for (const id of expectedIds) {
    const o = observed.get(id);
    if (!o) { reasons.push(`mandatory case ${id} was not observed`); perCase[id] = "BLOCKED"; continue; }
    if (o.status === "skip") { reasons.push(`mandatory case ${id} was skipped`); perCase[id] = "BLOCKED"; continue; }
    if (o.status === "fail") { failed = true; perCase[id] = "FAIL"; } else perCase[id] = "PASS";
  }
  for (const id of observed.keys()) if (!expectedIds.includes(id)) reasons.push(`observed case ${id} does not match the plan`);
  if (reasons.length) return { status: "BLOCKED", reasons, perCase };
  if (failed) return { status: "FAIL", reasons: ["a mandatory case failed"], perCase };
  if (exitCode !== 0) return { status: "FAIL", reasons: [`runner exited ${exitCode} although all observed cases passed`], perCase };
  return { status: "PASS", reasons: [], perCase };
}
