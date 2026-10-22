#!/usr/bin/env node
// M2.2: structural validator for core/ (kernel, constitution, roles,
// agents.json, models.json, security-policy.json), mcp/ (catalog +
// profiles) and profiles/*.json (validated against
// contracts/profile.schema.json). Dependency-free, same convention as
// contracts/validate-contracts.mjs.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { statusFromCounts, exitCodeFor, formatLine } from "../runtime/lib/result.mjs";
import { validate } from "../runtime/lib/schema-lite.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(here);

const errors = [];
const warnings = [];
function fail(msg) {
  errors.push(msg);
}

// --- 1. core/kernel.md respects the PAR-CONTEXT-BUDGET line ceiling ---
const KERNEL_MAX_LINES = 60;
const kernelPath = join(here, "kernel.md");
const kernelLines = readFileSync(kernelPath, "utf8").split("\n").length;
if (kernelLines > KERNEL_MAX_LINES) {
  fail(`core/kernel.md: ${kernelLines} lines, exceeds the ${KERNEL_MAX_LINES}-line budget (PAR-CONTEXT-BUDGET)`);
}

// --- 2. core/agents.json, core/models.json, core/security-policy.json parse and have required top-level shape ---
function readJson(relPath) {
  try {
    return JSON.parse(readFileSync(join(here, relPath), "utf8"));
  } catch (error) {
    fail(`core/${relPath}: invalid JSON (${error.message})`);
    return null;
  }
}

const agents = readJson("agents.json");
const models = readJson("models.json");
const securityPolicy = readJson("security-policy.json");

const agentRoles = agents ? Object.keys(agents.roles || {}) : [];
const modelRoles = models ? Object.keys(models.roles || {}) : [];
const policyRoles = securityPolicy ? securityPolicy.roles || [] : [];

// --- 3. role-name consistency across core/agents.json, core/models.json, core/security-policy.json ---
if (agents && models) {
  const agentSet = new Set(agentRoles);
  const modelSet = new Set(modelRoles);
  for (const r of agentSet) if (!modelSet.has(r)) fail(`core/agents.json declares role "${r}" with no matching entry in core/models.json.roles`);
  for (const r of modelSet) if (!agentSet.has(r)) fail(`core/models.json declares role "${r}" with no matching entry in core/agents.json.roles`);
}
if (agents && securityPolicy) {
  const policySet = new Set(policyRoles);
  for (const r of agentRoles) if (!policySet.has(r)) fail(`core/agents.json declares role "${r}" with no matching entry in core/security-policy.json.roles`);
}

// --- 4. core/security-policy.json matrix is complete: every declared role has every declared capability ---
if (securityPolicy) {
  const caps = securityPolicy.capabilities || [];
  for (const role of policyRoles) {
    const row = (securityPolicy.matrix || {})[role];
    if (!row) {
      fail(`core/security-policy.json: role "${role}" is missing from matrix`);
      continue;
    }
    for (const cap of caps) {
      if (!(cap in row)) fail(`core/security-policy.json: matrix.${role} is missing capability "${cap}"`);
    }
  }
}

// --- 5. each role's prompt file (core/agents.json roles[*].prompt) exists ---
if (agents) {
  for (const [role, def] of Object.entries(agents.roles || {})) {
    if (def.prompt && !existsSync(join(repoRoot, def.prompt))) {
      fail(`core/agents.json: role "${role}" points to prompt "${def.prompt}", which does not exist`);
    }
  }
}

// --- 5b. core/agents.json runtimes: every tool states its independent-review support and which execution classes
// it can run a Reviewer in; `verified` needs its evidence and at least one verified execution. Runtime-neutral: how a
// runtime satisfies a capability (tools, hooks, agent types) lives in runtime/adapters, never here. ---
const RUNTIME_TOOLS = ["claude", "codex", "opencode"];
const RUNTIME_SUPPORT = ["verified", "unverified", "unsupported"];
const EXECUTION_CLASSES = ["delegated-fresh-context", "separate-process"];
const EXECUTION_SUPPORT = ["verified", "unverified", "unavailable"];
if (agents) {
  const runtimes = agents.runtimes ?? {};
  for (const tool of RUNTIME_TOOLS) {
    const runtime = runtimes[tool];
    if (!runtime) {
      fail(`core/agents.json: runtimes.${tool} is missing (state its independent-review support, even if unverified)`);
      continue;
    }
    if (!RUNTIME_SUPPORT.includes(runtime.independentReview)) fail(`core/agents.json: runtimes.${tool}.independentReview must be one of ${RUNTIME_SUPPORT.join(", ")}`);
    const executions = runtime.executions ?? {};
    for (const [execution, support] of Object.entries(executions)) {
      if (!EXECUTION_CLASSES.includes(execution)) fail(`core/agents.json: runtimes.${tool}.executions.${execution} is not an execution class (${EXECUTION_CLASSES.join(", ")})`);
      if (!EXECUTION_SUPPORT.includes(support)) fail(`core/agents.json: runtimes.${tool}.executions.${execution} must be one of ${EXECUTION_SUPPORT.join(", ")}`);
    }
    const verifiedExecutions = Object.values(executions).filter((s) => s === "verified").length;
    if (runtime.independentReview === "verified") {
      const evidenceFile = String(runtime.evidence ?? "").split("#")[0];
      if (!evidenceFile || !existsSync(join(repoRoot, evidenceFile))) fail(`core/agents.json: runtimes.${tool} is verified but its evidence "${runtime.evidence}" does not exist`);
      if (!verifiedExecutions) fail(`core/agents.json: runtimes.${tool} is verified but no execution class is verified for it`);
    } else if (verifiedExecutions) {
      fail(`core/agents.json: runtimes.${tool} has a verified execution class but its independent review is ${runtime.independentReview}`);
    }
    for (const key of Object.keys(runtime)) {
      if (!["independentReview", "evidence", "executions"].includes(key)) fail(`core/agents.json: runtimes.${tool}.${key} is not a core field (runtime mechanics belong to runtime/adapters)`);
    }
  }
  for (const tool of Object.keys(runtimes)) if (!RUNTIME_TOOLS.includes(tool)) fail(`core/agents.json: runtimes.${tool} is not a projected tool (${RUNTIME_TOOLS.join(", ")})`);
}

// --- 6. mcp/profiles/*.json only reference servers that exist in mcp/catalog.json ---
const mcpDir = join(repoRoot, "mcp");
const catalogPath = join(mcpDir, "catalog.json");
let catalog = null;
try {
  catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
} catch (error) {
  fail(`mcp/catalog.json: invalid JSON (${error.message})`);
}
if (catalog) {
  const knownServers = new Set(Object.keys(catalog.servers || {}));
  const profilesDir = join(mcpDir, "profiles");
  if (existsSync(profilesDir)) {
    for (const file of readdirSync(profilesDir).filter((f) => f.endsWith(".json"))) {
      let profile;
      try {
        profile = JSON.parse(readFileSync(join(profilesDir, file), "utf8"));
      } catch (error) {
        fail(`mcp/profiles/${file}: invalid JSON (${error.message})`);
        continue;
      }
      for (const serverId of profile.servers || []) {
        if (!knownServers.has(serverId)) fail(`mcp/profiles/${file}: references server "${serverId}", not registered in mcp/catalog.json`);
      }
    }
  }
}

// --- 7. profiles/*.json each validate against contracts/profile.schema.json ---
const profileSchemaPath = join(repoRoot, "contracts", "profile.schema.json");
const profileSchema = JSON.parse(readFileSync(profileSchemaPath, "utf8"));
const profilesDir = join(repoRoot, "profiles");
let profileCount = 0;
for (const file of readdirSync(profilesDir).filter((f) => f.endsWith(".json"))) {
  profileCount += 1;
  let data;
  try {
    data = JSON.parse(readFileSync(join(profilesDir, file), "utf8"));
  } catch (error) {
    fail(`profiles/${file}: invalid JSON (${error.message})`);
    continue;
  }
  const errs = validate(data, profileSchema);
  for (const e of errs) fail(`profiles/${file} vs contracts/profile.schema.json: ${e}`);
  if (data.id && `${data.id}.json` !== file) {
    fail(`profiles/${file}: id "${data.id}" does not match its filename`);
  }
}

const status = statusFromCounts({ errors: errors.length, warnings: warnings.length });
console.log(`core validation: ${formatLine(status, { errors: errors.length, warnings: warnings.length })}`);
console.log(`  kernel.md: ${kernelLines}/${KERNEL_MAX_LINES} lines`);
console.log(`  roles checked (agents/models/security-policy): ${agentRoles.length}`);
console.log(`  mcp profiles checked: ${existsSync(join(mcpDir, "profiles")) ? readdirSync(join(mcpDir, "profiles")).filter((f) => f.endsWith(".json")).length : 0}`);
console.log(`  profiles/*.json checked: ${profileCount}`);
for (const w of warnings) console.log(`  WARNING: ${w}`);
for (const e of errors) console.log(`  ERROR: ${e}`);

process.exit(exitCodeFor(status, { strict: true }));
