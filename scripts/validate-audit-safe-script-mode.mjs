#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const REPOS = {
  root: ROOT,
  aiFoundation: path.join(ROOT, "ai-foundation"),
  aiKnowledge: path.join(ROOT, "ai-knowledge"),
  aiTemplate: path.join(ROOT, "ai-template"),
};
const SCRIPT = path.join(ROOT, "scripts", "audit-safe-script-mode.mjs");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseJsonFile(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function runAudit(args, options = {}) {
  const result = spawnSync(process.execPath, [SCRIPT, ...args, "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (!options.allowBlocked && result.status !== 0) {
    throw new Error(`Audit command failed (${result.status}): ${result.stderr || result.stdout}`);
  }

  const json = JSON.parse(result.stdout);
  return { exitCode: result.status, json };
}

function gitStatus(repo) {
  return execFileSync("git", ["-C", repo, "status", "--short"], {
    encoding: "utf8",
    shell: false,
  }).trim();
}

function gitDiffCheck(repo) {
  execFileSync("git", ["-C", repo, "diff", "--check"], {
    encoding: "utf8",
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function scriptByName(report, name) {
  return report.packageInventory.scripts.find((script) => script.name === name);
}

function stableInventory(report) {
  return JSON.stringify(report.packageInventory.scripts.map((script) => ({
    name: script.name,
    command: script.command,
    classes: script.classification.classes,
    result: script.classification.result,
  })));
}

function main() {
  parseJsonFile(path.join(ROOT, "specs", "p0-t2-audit-safe-script-mode", "audit-safe-script-mode.contract.json"));
  parseJsonFile(path.join(ROOT, "governance", "policies", "audit-safe-script-mode.implementation.contract.json"));

  const initialStatuses = Object.fromEntries(
    Object.entries(REPOS).map(([name, repo]) => [name, gitStatus(repo)]),
  );

  const root = runAudit(["inspect", "--repo", REPOS.root]).json;
  assert(root.result === "PASS", "Root inventory should pass as static inspection.");
  assert(root.packageInventory.status === "PASS", "Root package.json should be inventoried.");
  assert(scriptByName(root, "w1t1:verify").classification.result === "BLOCKED", "Root package-level validator wrapper should be blocked.");

  const foundation = runAudit(["inspect", "--repo", REPOS.aiFoundation]).json;
  assert(foundation.packageInventory.status === "PASS", "ai-foundation package.json should be inventoried.");
  assert(scriptByName(foundation, "test").classification.classes.includes("PACKAGE_LEVEL"), "ai-foundation test script should be package-level.");

  const knowledge = runAudit(["inspect", "--repo", REPOS.aiKnowledge]).json;
  assert(knowledge.packageInventory.status === "NOT_APPLICABLE", "ai-knowledge has no root package.json.");

  const template = runAudit(["inspect", "--repo", REPOS.aiTemplate]).json;
  assert(template.packageInventory.status === "PASS", "ai-template package.json should be inventoried.");
  assert(scriptByName(template, "prepare").classification.classes.includes("INSTALL_OR_LIFECYCLE"), "ai-template prepare must be lifecycle-blocked.");
  assert(scriptByName(template, "setup").classification.result === "BLOCKED", "ai-template setup must be blocked.");
  assert(scriptByName(template, "bootstrap").classification.result === "BLOCKED", "ai-template bootstrap must be blocked.");
  assert(scriptByName(template, "create-ai-native-app").classification.classes.includes("GENERATOR"), "ai-template generator must be classified.");

  const blockedInstall = runAudit([
    "inspect",
    "--repo",
    REPOS.root,
    "--command",
    "pnpm install",
  ], { allowBlocked: true });
  assert(blockedInstall.exitCode === 2, "Blocked install should return exit code 2.");
  assert(blockedInstall.json.result === "BLOCKED", "Blocked install result should be BLOCKED.");
  assert(blockedInstall.json.command.classification.classes.includes("INSTALL_OR_LIFECYCLE"), "pnpm install must be lifecycle/install.");

  const blockedInstallWithAllow = runAudit([
    "inspect",
    "--repo",
    REPOS.root,
    "--command",
    "pnpm install",
    "--allow",
    "INSTALL_OR_LIFECYCLE",
  ], { allowBlocked: true });
  assert(blockedInstallWithAllow.exitCode === 2, "Allow metadata must not bypass install blocking.");
  assert(blockedInstallWithAllow.json.explicitAllowlist.status === "RECORDED_UNSAFE_EXECUTION_STILL_BLOCKED_IN_V1", "Allow metadata should be recorded explicitly.");

  const generatorDryRun = runAudit([
    "inspect",
    "--repo",
    REPOS.aiTemplate,
    "--command",
    "node generators/create-ai-native-app.mjs --dry-run --name audit-safe-demo --dest C:\\tmp\\audit-safe-demo",
  ]).json;
  assert(generatorDryRun.result === "PASS", "Generator dry-run classification should pass without execution.");
  assert(generatorDryRun.command.classification.classes.includes("GENERATOR"), "Dry-run generator should be classified as generator.");

  const directNoop = runAudit([
    "inspect",
    "--repo",
    REPOS.root,
    "--command",
    "node -e \"console.log('audit safe noop')\"",
    "--execute",
    "--expected-side-effects",
    "none",
  ]).json;
  assert(directNoop.result === "PASS", "Direct no-op execution should pass.");
  assert(directNoop.execution.stdout === "audit safe noop", "Direct no-op stdout should be captured.");
  assert(directNoop.cleanupStatus === "PASS", "Direct no-op must not mutate the working tree.");

  const firstTemplateInventory = runAudit(["inspect", "--repo", REPOS.aiTemplate]).json;
  const secondTemplateInventory = runAudit(["inspect", "--repo", REPOS.aiTemplate]).json;
  assert(stableInventory(firstTemplateInventory) === stableInventory(secondTemplateInventory), "Inspection output should be repeatable.");

  for (const [name, repo] of Object.entries(REPOS)) {
    gitDiffCheck(repo);
    assert(gitStatus(repo) === initialStatuses[name], `${name} working tree changed during validation.`);
  }

  process.stdout.write("audit-safe script mode validation PASS\n");
}

try {
  main();
} catch (error) {
  process.stderr.write(`audit-safe script mode validation FAIL: ${error.message}\n`);
  process.exit(1);
}
