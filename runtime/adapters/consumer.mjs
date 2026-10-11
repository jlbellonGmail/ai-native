#!/usr/bin/env node
// M5.2: consumer-side adapter materialization. A consumer repo holds only
// ai-native.lock.json; after `sync` the release lives in the content-addressed
// cache. This command derives the per-tool files (CLAUDE.md, .mcp.json,
// .codex/*, opencode.json, role files) and the lazily selected skill mirrors
// FROM THE RELEASE it is running from, and writes them into --project through
// the brownfield-safe adoption (runtime/migrate/adopt.mjs): never overwrites a
// differing file, journals what it created, and `--revert` removes exactly that.
//   node runtime/adapters/consumer.mjs --project <dir> [--tool claude|codex|opencode]...
//        [--profile <id>] [--role <r>] [--level LIGHT|STANDARD|FULL]
//        [--mcp-profile <id>] MCP profile the gateway exposes (default none = no MCP)
//        [--skip <path>]...   leave a colliding file untouched
//        [--revert]           undo a previous apply
//        [--upgrade]          apply ONLY the delta between what the journal says was written and this release;
//                             locally edited files are preserved and reported (combine with --plan to preview)
//        [--drift]            read-only (--cache <dir> for the release cache); CLEAN | OUTDATED | DRIFT | MISSING_REFERENCE | INCOMPATIBLE_VERSION; fails on all but CLEAN/OUTDATED. Fails if a generated projection was edited/deleted by hand vs the release (ai-native is canonical)
//        [--plan]             read-only; list files and collisions
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_TOOLS, buildToolFiles } from "./sync.mjs";
import { loadSkillsRegistry, selectSkills, canonicalFilesFor, SKILL_TARGETS } from "./skills.mjs";
import { planAdoption, applyAdoption, revertAdoption } from "../migrate/adopt.mjs";
import { planUpgrade, applyUpgrade, detectDrift } from "../migrate/upgrade-delta.mjs";
import { readLock } from "../bootstrap/install.mjs";
import { checkReference } from "../consumer/knowledge.mjs";
import { buildReport, renderOutput, exitCodeForReport } from "../lib/json.mjs";
import { statusFromCounts } from "../lib/result.mjs";

const SKILL_TARGET_TOOL = { ".claude/skills": "claude", ".opencode/skills": "opencode" };

/** { relPath: content } the release would write into a consumer for `tools`. */
export function consumerFiles(releaseRoot, { tools = ALL_TOOLS, profile, role, level, mcpProfile = "none" } = {}) {
  // the tool launches the gateway of THIS release (absolute path into the cache, forward slashes so it is valid in JSON/TOML on every OS)
  const gatewayScript = join(releaseRoot, "runtime", "mcp-gateway", "server.mjs").split("\\").join("/");
  const files = buildToolFiles(releaseRoot, { tools, mcpProfile, gatewayScript, opencodeRolesDir: ".opencode/roles" });
  const skillIds = selectSkills(loadSkillsRegistry(releaseRoot), { profile, role, level });
  for (const rel of canonicalFilesFor(releaseRoot, skillIds)) {
    const content = readFileSync(join(releaseRoot, ".agents", "skills", rel));
    for (const target of SKILL_TARGETS) {
      if (tools.includes(SKILL_TARGET_TOOL[target])) files[`${target}/${rel}`] = content;
    }
  }
  return files;
}

export function applyConsumer({ releaseRoot, projectRoot, skip = [], ...selection }) {
  return applyAdoption(projectRoot, consumerFiles(releaseRoot, selection), { resolve: Object.fromEntries(skip.map((p) => [p, "skip"])) });
}

export function planConsumer({ releaseRoot, projectRoot, ...selection }) {
  return planAdoption(projectRoot, consumerFiles(releaseRoot, selection));
}

function main() {
  const argv = process.argv.slice(2);
  const values = (n) => argv.flatMap((a, i) => (a === n ? [argv[i + 1]] : []));
  const value = (n) => values(n)[0];
  const releaseRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const projectRoot = resolve(value("--project") ?? process.cwd());
  const tools = values("--tool").length ? values("--tool") : ALL_TOOLS;
  const bad = tools.filter((t) => !ALL_TOOLS.includes(t));
  const errors = [];
  let data = {};
  if (bad.length) errors.push(`unknown tool(s): ${bad.join(", ")}`);
  else {
    const selection = { tools, profile: value("--profile"), role: value("--role"), level: value("--level"), mcpProfile: value("--mcp-profile") ?? "none" };
    try {
      if (argv.includes("--revert")) data = revertAdoption(projectRoot);
      else if (argv.includes("--drift") && argv.includes("--upgrade")) errors.push("--drift is read-only and cannot be combined with --upgrade");
      else if (argv.includes("--drift")) {
        const lockState = readLock(projectRoot);
        if (lockState.errors.length && existsSync(join(projectRoot, "ai-native.lock.json"))) throw new Error(`cannot check references: ${lockState.errors.join("; ")}`);
        const located = lockState.lock ? checkReference({ projectRoot, cacheRoot: value("--cache") }) : undefined;
        data = detectDrift(projectRoot, consumerFiles(releaseRoot, selection), located ? { reference: located } : {});
        if (data.status === "DRIFT") errors.push(`projections diverge from the release (ai-native is canonical; regenerate with --upgrade after reviewing): edited=[${data.edited.join(", ")}] missing=[${data.missing.join(", ")}]`);
        else if (data.status === "MISSING_REFERENCE" || data.status === "INCOMPATIBLE_VERSION") errors.push(`${data.status}: ${data.reference}`);
      }
      else if (argv.includes("--upgrade")) {
        const incoming = consumerFiles(releaseRoot, selection);
        data = argv.includes("--plan") ? planUpgrade(projectRoot, incoming) : applyUpgrade(projectRoot, incoming);
      }
      else if (argv.includes("--plan")) data = planConsumer({ releaseRoot, projectRoot, ...selection });
      else {
        data = applyConsumer({ releaseRoot, projectRoot, skip: values("--skip"), ...selection });
        if (data.status === "BLOCKED") errors.push(`collisions with existing files (use --skip <path> to keep yours): ${data.collisions.join(", ")}`);
      }
    } catch (error) {
      errors.push(error.message);
    }
  }
  const warnings = data.status === "PARTIAL" ? [`kept user-modified files: ${data.kept.join(", ")}`] : [];
  const report = buildReport({ status: statusFromCounts({ errors: errors.length, warnings: warnings.length }), errors, warnings, data: { adoption: data } });
  console.log(renderOutput(report, { json: argv.includes("--json") }));
  process.exit(exitCodeForReport(report));
}

const isMain = process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);
if (isMain) main();
