// M4.3 docs gate. A PR that changes behaviour-bearing paths must also touch
// documentation/governance, so docs cannot silently lag the code. Paths come
// from governance/gates/gates.json (read from base). Deeper drift (paths and
// ids cited by docs that do not exist) is runtime/docs/validate-doc-drift.mjs.
import { classifyPaths } from "./control-plane.mjs";

export function evaluateDocsGate(changed, docGate) {
  const { controlPlane: relevant } = classifyPaths(changed, docGate.relevantPaths);
  if (!relevant.length) return { ok: true, findings: [], relevant };
  const { controlPlane: docs } = classifyPaths(changed, docGate.docPaths);
  if (docs.length) return { ok: true, findings: [], relevant };
  return { ok: false, relevant, findings: [{ code: "DOCS_NOT_UPDATED", detail: `${relevant.length} behaviour-bearing file(s) changed, no documentation/governance file touched (${docGate.docPaths.join(", ")})` }] };
}
