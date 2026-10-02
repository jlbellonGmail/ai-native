#!/usr/bin/env node
// M3.3: "check de puntos de entrada", always active in CI. Runs
// sources.mjs#checkEntryPoints read-only against this repo's own
// core/agents.json + mcp/catalog.json + role prompts.
//
// Deliberately does NOT run runtime/adapters/sync.mjs's full check()
// against this repo's own root: ai-native's root CLAUDE.md/OPENCLAW.md
// are hand-authored bridge files (AGENTS.md's "Tool Compatibility"
// policy), not the generic "@AGENTS.md" one-liner profiles/factory.json
// consumers would get -- running the generated-consumer check (or,
// worse, sync()) against ai-native's own root would flag/overwrite
// legitimate hand-authored content. Dogfooding runtime/adapters onto
// ai-native's own root (profiles/factory.json already describes that
// intent) is a deliberate, separate decision, not an automatic side
// effect of landing the mechanism itself.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkEntryPoints } from "./sources.mjs";
import { buildReport, renderOutput, exitCodeForReport } from "../lib/json.mjs";
import { statusFromCounts } from "../lib/result.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

const json = process.argv.includes("--json");

const problems = checkEntryPoints(repoRoot);
const status = statusFromCounts({ errors: problems.length, warnings: 0 });
const report = buildReport({ status, errors: problems, warnings: [] });

console.log(renderOutput(report, { json }));
process.exit(exitCodeForReport(report, { strict: true }));
