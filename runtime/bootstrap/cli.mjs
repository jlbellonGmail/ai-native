#!/usr/bin/env node
// M4.1 bootstrap CLI: node runtime/bootstrap/cli.mjs <command> [options]
//   init     --bundle <file> --repo github:o/r --profile <id>... [--mcp-profile <id>...] [--force]
//   sync     [--from-file <bundle>] [--revocations <file>]
//   run      [-- <args for the release>]
//   rollback [--force]
//   doctor
// Common: --project <dir> (default cwd), --cache <dir> (default $AI_NATIVE_CACHE
// or ~/.ai-native/cache), --json.
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { init, sync, run, rollback, doctor } from "./install.mjs";
import { defaultCacheRoot } from "./cache.mjs";
import { renderOutput, exitCodeForReport, buildReport } from "../lib/json.mjs";

const argv = process.argv.slice(2);
const command = argv.shift();
const rest = argv.indexOf("--");
const passthrough = rest === -1 ? [] : argv.splice(rest).slice(1);

function flag(name) {
  return argv.includes(name);
}
function value(name) {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1];
}
function values(name) {
  return argv.flatMap((a, i) => (a === name ? [argv[i + 1]] : []));
}

const projectRoot = resolve(value("--project") ?? process.cwd());
const cacheRoot = resolve(value("--cache") ?? defaultCacheRoot());

let result;
try {
  switch (command) {
    case "init":
      result = init({ projectRoot, bundleFile: value("--bundle"), repo: value("--repo"), profiles: values("--profile"), mcpProfiles: values("--mcp-profile"), force: flag("--force") });
      break;
    case "sync": {
      const revFile = value("--revocations");
      const revocations = revFile && existsSync(revFile) ? JSON.parse(readFileSync(revFile, "utf8")) : null;
      result = sync({ projectRoot, cacheRoot, fromFile: value("--from-file"), revocations });
      break;
    }
    case "run":
      result = run({ projectRoot, cacheRoot, args: passthrough });
      break;
    case "rollback":
      result = rollback({ projectRoot, cacheRoot, force: flag("--force") });
      break;
    case "doctor":
      result = doctor({ projectRoot, cacheRoot });
      break;
    default:
      result = { status: "ERROR", errors: [`unknown command: ${command ?? "(none)"}`], warnings: [] };
  }
} catch (error) {
  result = { status: "ERROR", errors: [error.message], warnings: [] };
}

const { status, errors, warnings, ...data } = result;
const out = buildReport({ status, errors, warnings, data });
console.log(renderOutput(out, { json: flag("--json") }));
process.exit(exitCodeForReport(out, { strict: false }));
