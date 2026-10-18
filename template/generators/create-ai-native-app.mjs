#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const generatorDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(generatorDir, "..");
const scaffoldRoot = path.join(repoRoot, "scaffolds", "ai-native-app", "files");
const validatorPath = path.join(repoRoot, "scripts", "validate-generated-project.mjs");

const allowedPresets = new Set(["controlled-mvp", "pilot"]);
const textFilePattern = /\.(json|md|mjs|js|ts|tsx|txt|yml|yaml)$/i;

function usage() {
  return `create-ai-native-app

Usage:
  node generators/create-ai-native-app.mjs --name <project-name> --dest <directory> [--preset controlled-mvp]
  node generators/create-ai-native-app.mjs --name <project-name> --target <directory> [--preset controlled-mvp]
  node generators/create-ai-native-app.mjs <project-name> --dest <directory>

Options:
  --name       Project name. Use lowercase letters, numbers and hyphens.
  --dest       Destination directory. Defaults to ./<project-name>.
  --target     Alias for --dest.
  --preset     Initial project preset. Allowed: controlled-mvp, pilot. Default: controlled-mvp.
  --dry-run    Print the generation plan without writing files.
  --help       Show this help.
`;
}

function parseArgs(argv) {
  const args = {
    name: "",
    dest: "",
    preset: "controlled-mvp",
    dryRun: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--name") {
      args.name = argv[++index] ?? "";
    } else if (arg.startsWith("--name=")) {
      args.name = arg.slice("--name=".length);
    } else if (arg === "--dest" || arg === "--target") {
      args.dest = argv[++index] ?? "";
    } else if (arg.startsWith("--dest=")) {
      args.dest = arg.slice("--dest=".length);
    } else if (arg.startsWith("--target=")) {
      args.dest = arg.slice("--target=".length);
    } else if (arg === "--preset") {
      args.preset = argv[++index] ?? "";
    } else if (arg.startsWith("--preset=")) {
      args.preset = arg.slice("--preset=".length);
    } else if (!arg.startsWith("-") && !args.name) {
      args.name = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function validateProjectName(name) {
  if (!name || name.trim() !== name) {
    throw new Error("Project name is required and must not include leading or trailing spaces.");
  }
  if (name.includes("/") || name.includes("\\")) {
    throw new Error("Project name must not include path separators.");
  }
  if (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(name)) {
    throw new Error("Project name must use lowercase letters, numbers and hyphens, and start/end with a letter or number.");
  }
}

function validatePreset(preset) {
  if (!allowedPresets.has(preset)) {
    throw new Error(`Unsupported preset "${preset}". Allowed presets: ${[...allowedPresets].join(", ")}.`);
  }
}

function buildPlan(args) {
  validateProjectName(args.name);
  validatePreset(args.preset);

  const destination = path.resolve(process.cwd(), args.dest || args.name);
  const plan = {
    generator: "create-ai-native-app",
    projectName: args.name,
    preset: args.preset,
    destination,
    scaffold: path.relative(repoRoot, scaffoldRoot).replaceAll("\\", "/"),
    validationCommand: `node ${path.relative(destination, path.join(destination, "scripts", "validate-ai-native-project.mjs")).replaceAll("\\", "/")}`
  };

  return plan;
}

async function assertDestinationAvailable(destination) {
  if (existsSync(destination)) {
    throw new Error(`Destination already exists: ${destination}`);
  }
  await mkdir(destination, { recursive: true });
}

async function copyScaffold(sourceDir, targetDir, replacements) {
  const entries = await readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await mkdir(target, { recursive: true });
      await copyScaffold(source, target, replacements);
      continue;
    }

    if (entry.isFile()) {
      if (textFilePattern.test(entry.name)) {
        let content = await readFile(source, "utf8");
        for (const [token, value] of Object.entries(replacements)) {
          content = content.replaceAll(token, value);
        }
        await writeFile(target, content, "utf8");
      } else {
        const content = await readFile(source);
        await writeFile(target, content);
      }
    }
  }
}

async function ensureScaffoldReady() {
  const scaffoldStat = await stat(scaffoldRoot).catch(() => null);
  if (!scaffoldStat?.isDirectory()) {
    throw new Error(`Scaffold directory is missing: ${path.relative(repoRoot, scaffoldRoot)}`);
  }
  const validatorStat = await stat(validatorPath).catch(() => null);
  if (!validatorStat?.isFile()) {
    throw new Error(`Generated project validator is missing: ${path.relative(repoRoot, validatorPath)}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  await ensureScaffoldReady();
  const plan = buildPlan(args);

  if (args.dryRun) {
    console.log(JSON.stringify({ dryRun: true, ...plan }, null, 2));
    return;
  }

  await assertDestinationAvailable(plan.destination);
  await copyScaffold(scaffoldRoot, plan.destination, {
    "__PROJECT_NAME__": plan.projectName,
    "__PROJECT_PRESET__": plan.preset
  });

  console.log(JSON.stringify({ created: true, ...plan }, null, 2));
}

main().catch((error) => {
  console.error(`create-ai-native-app failed: ${error.message}`);
  process.exitCode = 1;
});
