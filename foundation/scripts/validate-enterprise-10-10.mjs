import { readFile } from "node:fs/promises";

const requiredRecordFields = ["id", "surface", "sli", "slo", "errorBudget", "metric", "alert", "dashboard", "otel"];
const requiredNestedIds = ["sli", "slo", "errorBudget", "metric", "alert", "dashboard", "otel"];

async function readJson(path) {
  return JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateObservability(program) {
  assert(program.status === "PRODUCT_REPAIRED", "observability program must be PRODUCT_REPAIRED");
  assert(Array.isArray(program.records), "observability records must be an array");
  assert(program.records.length === 10, "observability program must contain exactly 10 records");

  const ids = new Set();
  for (const record of program.records) {
    for (const field of requiredRecordFields) {
      assert(record[field], `record ${record.id ?? "<missing>"} is missing ${field}`);
    }
    assert(!ids.has(record.id), `duplicate observability record id ${record.id}`);
    ids.add(record.id);

    for (const nested of requiredNestedIds) {
      assert(record[nested].id, `record ${record.id} is missing ${nested}.id`);
    }
    assert(Array.isArray(record.otel.signals) && record.otel.signals.length > 0, `record ${record.id} must define otel signals`);
    assert(Array.isArray(record.otel.attributes) && record.otel.attributes.length > 0, `record ${record.id} must define otel attributes`);
  }
}

function validateSecurityAudit(audit) {
  assert(audit.status === "PRODUCT_REPAIRED", "security audit must be PRODUCT_REPAIRED");
  assert(Array.isArray(audit.controls), "security controls must be an array");
  assert(audit.controls.length === audit.validation.requiredProductControls, "security control count must match requiredProductControls");

  const repaired = audit.controls.find((control) => control.task === "W1-T7");
  assert(repaired?.state === "PRODUCT_REPAIRED", "W1-T7 must be repaired as a product manifest");
  for (const control of audit.controls) {
    assert(control.productPath, `control ${control.task} must map to a product path`);
  }
}

const observability = await readJson("observability/enterprise-10-10/observability-program.json");
const securityAudit = await readJson("security/enterprise-10-10/security-audit-final.json");
const runtimeObservability = await readJson("observability/runtime-wiring/runtime-observability.contract.json");

validateObservability(observability);
validateSecurityAudit(securityAudit);

assert(runtimeObservability.task === "H3", "runtime observability wiring must map to H3");
assert(runtimeObservability.runtimeDefault.mode === "noop", "runtime observability default mode must be noop");
assert(runtimeObservability.runtimeDefault.requiresEndpoint === false, "runtime observability must not require endpoint by default");
assert(runtimeObservability.bindings.enterpriseObservabilityRecords.includes("obs-001-request-success"), "runtime observability must bind request success");
assert(runtimeObservability.bindings.enterpriseObservabilityRecords.includes("obs-002-tool-latency"), "runtime observability must bind tool latency");

console.log("ENTERPRISE-10-10 ai-foundation validation PASS");
