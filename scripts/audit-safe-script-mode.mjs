#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const RESULT = {
  PASS: "PASS",
  FAIL: "FAIL",
  BLOCKED: "BLOCKED",
  NOT_RUN: "NOT_RUN",
  NOT_APPLICABLE: "NOT_APPLICABLE",
};

const BLOCKED_CLASSES = new Set([
  "DESTRUCTIVE",
  "INSTALL_OR_LIFECYCLE",
  "NETWORK_OR_SECRET",
  "PACKAGE_LEVEL",
  "UNKNOWN",
]);

const LIFECYCLE_SCRIPT_NAMES = new Set([
  "preinstall",
  "install",
  "postinstall",
  "prepare",
  "setup",
  "bootstrap",
]);

const SHELL_OPERATORS = /(&&|\|\||\||;|>|<)/;
const INSTALL_RE = /\b(pnpm|npm|yarn|corepack)\s+(install|i|add|remove|update|upgrade|dlx|exec)\b/i;
const PACKAGE_RUN_RE = /\b(pnpm|npm|yarn)\s+(run\s+)?(test|build|start|dev|lint|audit|validate|setup|bootstrap|prepare|[a-z0-9:_-]+)\b/i;
const NETWORK_RE = /\b(curl|wget|fetch)\b|https?:\/\/|OPENAI_API_KEY|api[_-]?key|secret|token|next\s+(dev|start)/i;
const DESTRUCTIVE_RE = /\b(rm|del|erase|Remove-Item|rmdir)\b|\bgit\s+(reset|clean|checkout\s+--)\b/i;
const GENERATOR_RE = /create-ai-native-app|generators[\\/]create-ai-native-app/i;

function parseArgs(argv) {
  const args = {
    command: null,
    evidence: null,
    expectedSideEffects: "none",
    execute: false,
    json: false,
    mode: "inspect",
    repo: process.cwd(),
    allow: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "inspect") {
      args.mode = "inspect";
    } else if (arg === "--repo") {
      args.repo = argv[++i];
    } else if (arg === "--command") {
      args.command = argv[++i];
    } else if (arg === "--evidence") {
      args.evidence = argv[++i];
    } else if (arg === "--expected-side-effects") {
      args.expectedSideEffects = argv[++i];
    } else if (arg === "--execute") {
      args.execute = true;
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg === "--mode") {
      args.mode = argv[++i];
    } else if (arg === "--allow") {
      args.allow = argv[++i].split(",").map((value) => value.trim()).filter(Boolean);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  process.stdout.write(`Audit-Safe Script Mode

Usage:
  node scripts/audit-safe-script-mode.mjs inspect --repo <path> [--command "<cmd>"] [--execute] [--expected-side-effects none] [--evidence <path>] [--json]

Defaults:
  - inventory package.json scripts without executing them
  - block package-level, lifecycle/install, network/secret, destructive and unknown commands
  - execute only direct, single-purpose commands with declared no side effects
  - report --allow values as audit metadata; unsafe side-effectful execution remains blocked in v1
`);
}

function safeExecFile(file, args, cwd) {
  try {
    return {
      exitCode: 0,
      stdout: execFileSync(file, args, {
        cwd,
        encoding: "utf8",
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      }).trim(),
      stderr: "",
    };
  } catch (error) {
    return {
      exitCode: typeof error.status === "number" ? error.status : 1,
      stdout: String(error.stdout || "").trim(),
      stderr: String(error.stderr || error.message || "").trim(),
    };
  }
}

function gitState(repo) {
  const branch = safeExecFile("git", ["-C", repo, "branch", "--show-current"], repo);
  const head = safeExecFile("git", ["-C", repo, "rev-parse", "--short", "HEAD"], repo);
  const status = safeExecFile("git", ["-C", repo, "status", "--short"], repo);
  const diffStat = safeExecFile("git", ["-C", repo, "diff", "--stat"], repo);
  const diffCheck = safeExecFile("git", ["-C", repo, "diff", "--check"], repo);

  return {
    branch: branch.stdout,
    head: head.stdout,
    statusShort: status.stdout,
    diffStat: diffStat.stdout,
    diffCheck: {
      result: diffCheck.exitCode === 0 ? RESULT.PASS : RESULT.FAIL,
      exitCode: diffCheck.exitCode,
      stdout: diffCheck.stdout,
      stderr: diffCheck.stderr,
    },
  };
}

function packageInventory(repo) {
  const packageJsonPath = path.join(repo, "package.json");
  if (!existsSync(packageJsonPath)) {
    return {
      status: RESULT.NOT_APPLICABLE,
      path: null,
      scripts: [],
    };
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const scripts = Object.entries(packageJson.scripts || {}).map(([name, command]) => ({
    name,
    command,
    classification: classifyCommand(command, { scriptName: name }),
  }));

  return {
    status: RESULT.PASS,
    path: packageJsonPath,
    scripts,
  };
}

function classifyCommand(command, context = {}) {
  const scriptName = context.scriptName || null;
  const classes = [];
  const reasons = [];
  const transitiveReferences = [];

  if (!command || typeof command !== "string") {
    classes.push("UNKNOWN");
    reasons.push("Command is empty or not a string.");
  }

  if (scriptName) {
    classes.push("PACKAGE_LEVEL");
    reasons.push(`Script '${scriptName}' is declared in package.json and is package-level.`);
  }

  if (scriptName && LIFECYCLE_SCRIPT_NAMES.has(scriptName)) {
    classes.push("INSTALL_OR_LIFECYCLE");
    reasons.push(`Script name '${scriptName}' is treated as lifecycle/setup surface.`);
  }

  if (command && SHELL_OPERATORS.test(command)) {
    reasons.push("Command contains shell composition operators.");
  }

  if (command && DESTRUCTIVE_RE.test(command)) {
    classes.push("DESTRUCTIVE");
    reasons.push("Command matches destructive filesystem or git mutation pattern.");
  }

  if (command && (INSTALL_RE.test(command) || /\b(run\s+)?(setup|bootstrap|prepare)\b/i.test(command))) {
    classes.push("INSTALL_OR_LIFECYCLE");
    reasons.push("Command matches install, setup, bootstrap or lifecycle pattern.");
  }

  if (command && NETWORK_RE.test(command)) {
    classes.push("NETWORK_OR_SECRET");
    reasons.push("Command may use network, secrets or runtime server behavior.");
  }

  if (command && GENERATOR_RE.test(command)) {
    classes.push("GENERATOR");
    if (/--dry-run\b/i.test(command)) {
      reasons.push("Generator command declares dry-run mode.");
    } else {
      reasons.push("Generator command lacks dry-run mode.");
    }
  }

  if (command) {
    const runRefs = [...command.matchAll(/\b(?:pnpm|npm|yarn)\s+run\s+([a-z0-9:_-]+)/gi)];
    for (const ref of runRefs) transitiveReferences.push(ref[1]);
  }

  if (command && PACKAGE_RUN_RE.test(command)) {
    classes.push("PACKAGE_LEVEL");
    reasons.push("Command invokes a package manager script or package-level command.");
  }

  if (command && /^node(\.exe)?\s+(-e|--eval)\s+/i.test(command.trim())) {
    classes.push("STATIC_ONLY");
    reasons.push("Command is a direct Node eval command.");
  } else if (command && /^node(\.exe)?\s+.+validate[^ ]*\.mjs\b/i.test(command.trim())) {
    classes.push("DIRECT_VALIDATOR");
    reasons.push("Command is a direct Node validator path.");
  } else if (command && /^node(\.exe)?\s+.+\.mjs\b/i.test(command.trim()) && !classes.includes("GENERATOR")) {
    classes.push("CONTROLLED_DYNAMIC");
    reasons.push("Command is a direct Node module execution.");
  }

  if (classes.length === 0) {
    classes.push("UNKNOWN");
    reasons.push("No safe direct execution class matched.");
  }

  const uniqueClasses = [...new Set(classes)];
  const blocked = uniqueClasses.some((value) => BLOCKED_CLASSES.has(value))
    || (uniqueClasses.includes("GENERATOR") && !/--dry-run\b/i.test(command || ""));

  return {
    classes: uniqueClasses,
    result: blocked ? RESULT.BLOCKED : RESULT.PASS,
    reasons,
    transitiveReferences,
  };
}

function splitCommand(command) {
  const parts = [];
  let current = "";
  let quote = null;

  for (const char of command.trim()) {
    if ((char === "'" || char === "\"") && quote === null) {
      quote = char;
      continue;
    }
    if (char === quote) {
      quote = null;
      continue;
    }
    if (/\s/.test(char) && quote === null) {
      if (current) {
        parts.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }

  if (current) parts.push(current);
  if (quote !== null) throw new Error("Unclosed quote in command.");
  return parts;
}

function executableFor(commandParts) {
  const [bin, ...args] = commandParts;
  if (/^node(\.exe)?$/i.test(bin)) return { file: process.execPath, args };
  return { file: bin, args };
}

function executeDirect(command, repo) {
  if (SHELL_OPERATORS.test(command)) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: "Execution rejected: shell operators are not allowed.",
    };
  }

  const parts = splitCommand(command);
  const executable = executableFor(parts);
  const result = spawnSync(executable.file, executable.args, {
    cwd: repo,
    encoding: "utf8",
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

  return {
    exitCode: typeof result.status === "number" ? result.status : 1,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || result.error?.message || "").trim(),
  };
}

function statusChanged(before, after) {
  return before.statusShort !== after.statusShort || before.diffStat !== after.diffStat;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const repo = path.resolve(args.repo);
  if (!existsSync(repo)) throw new Error(`Repository path does not exist: ${repo}`);

  const baseline = gitState(repo);
  const inventory = packageInventory(repo);
  const commandClassification = args.command
    ? classifyCommand(args.command)
    : null;

  let execution = {
    requested: args.execute,
    status: args.execute ? RESULT.NOT_RUN : RESULT.NOT_APPLICABLE,
    command: args.command,
    exitCode: null,
    stdout: "",
    stderr: "",
  };

  let result = RESULT.PASS;
  if (args.command && commandClassification.result === RESULT.BLOCKED) {
    result = RESULT.BLOCKED;
  }

  if (args.execute) {
    if (!args.command) {
      result = RESULT.FAIL;
      execution.status = RESULT.FAIL;
      execution.stderr = "Cannot execute without --command.";
    } else if (commandClassification.result === RESULT.BLOCKED) {
      execution.status = RESULT.BLOCKED;
      execution.stderr = "Execution blocked by Audit-Safe Script Mode classification.";
    } else if (args.expectedSideEffects !== "none") {
      result = RESULT.BLOCKED;
      execution.status = RESULT.BLOCKED;
      execution.stderr = "Execution requires expected side effects to be declared as none for this implementation.";
    } else {
      const executed = executeDirect(args.command, repo);
      execution = {
        requested: true,
        status: executed.exitCode === 0 ? RESULT.PASS : RESULT.FAIL,
        command: args.command,
        ...executed,
      };
      result = executed.exitCode === 0 ? RESULT.PASS : RESULT.FAIL;
    }
  }

  const final = gitState(repo);
  if (args.execute && args.expectedSideEffects === "none" && statusChanged(baseline, final)) {
    result = RESULT.FAIL;
    execution.status = RESULT.FAIL;
    execution.stderr = [execution.stderr, "Working tree changed despite expected side effects: none."]
      .filter(Boolean)
      .join("\n");
  }

  const report = {
    schemaVersion: "audit-safe-script-mode.report.v1",
    taskId: "P0-T2",
    mode: args.mode,
    result,
    repository: repo,
    sideEffectDeclaration: {
      expected: args.expectedSideEffects,
      evidenceFileWrite: args.evidence ? path.resolve(args.evidence) : null,
    },
    explicitAllowlist: {
      classes: args.allow,
      status: args.allow.length > 0
        ? "RECORDED_UNSAFE_EXECUTION_STILL_BLOCKED_IN_V1"
        : "NOT_PROVIDED",
    },
    baseline,
    packageInventory: inventory,
    command: args.command
      ? {
          value: args.command,
          classification: commandClassification,
        }
      : null,
    execution,
    final,
    cleanupStatus: statusChanged(baseline, final) ? RESULT.FAIL : RESULT.PASS,
  };

  if (args.evidence) {
    const evidencePath = path.resolve(args.evidence);
    mkdirSync(path.dirname(evidencePath), { recursive: true });
    report.sideEffectDeclaration.evidenceFileWrite = evidencePath;
    writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (result === RESULT.FAIL) process.exit(1);
  if (result === RESULT.BLOCKED) process.exit(2);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
