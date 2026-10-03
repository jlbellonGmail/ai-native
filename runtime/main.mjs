#!/usr/bin/env node
// Release entry point (`ai-native run -- <command>`): the file bootstrap
// executes from a verified cache entry (runtime/bootstrap/install.mjs run()).
// It only dispatches to commands that exist and are tested in this release;
// it never invents capabilities. Unknown command => exit 2.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const COMMANDS = {
  doctor: "bootstrap/cli.mjs",
  status: "bootstrap/cli.mjs",
  sync: "bootstrap/cli.mjs",
  rollback: "bootstrap/cli.mjs",
  adapters: "adapters/consumer.mjs",
  l3: "consumer/l3.mjs",
  audit: "audit/cli.mjs",
  evals: "evals/cli.mjs",
};

const [command, ...args] = process.argv.slice(2);

if (command === "version") {
  const file = join(here, "..", "platform.json");
  if (!existsSync(file)) {
    console.error("platform.json not found next to this release");
    process.exit(1);
  }
  const { version, commit } = JSON.parse(readFileSync(file, "utf8"));
  console.log(`${version} ${commit}`);
  process.exit(0);
}

if (!command || !(command in COMMANDS)) {
  console.error(`usage: main.mjs <version|${Object.keys(COMMANDS).join("|")}> [args]`);
  process.exit(2);
}

// bootstrap/cli.mjs takes the command as its first argument; the others are single-purpose.
const forwarded = COMMANDS[command].startsWith("bootstrap/") ? [command, ...args] : args;
const result = spawnSync(process.execPath, [join(here, COMMANDS[command]), ...forwarded], { stdio: "inherit" });
process.exit(result.status ?? 1);
