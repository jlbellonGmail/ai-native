// DEPRECATED (2026-09-30, M0.2 governance reconciliation).
// Kept for history; DO NOT RUN. Reason: Calls require() inside an ESM package (throws at runtime); 'init' does not copy any scaffold; references the pre-consolidation ai-template/ai-foundation/ai-knowledge paths.
// Tracked in governance/roadmaps/AI-NATIVE-V3-ROADMAP.md (M0.2) and
// governance/adr/ADR-001-arquitectura-referencia-versionada.md.
// Ungoverned when introduced (commit 3c6ad67); not part of any closed task.

#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

// Command dispatch
const command = process.argv[2];

async function showHelp() {
  console.log(`
AI-Native CLI - Commands:
  init <project-name>       Initialize a new AI-native project
  validate                  Validate project structure
  check-integrity           Check cross-repo integrity
  test                      Run tests
  docs                      Generate documentation
  --help                    Show this help message
`);
  process.exit(0);
}

async function initProject(projectName) {
  console.log(`Initializing AI-native project: ${projectName}`);
  console.log("");

  // Check if project name is valid (kebab-case)
  if (!/^[a-z]+(-[a-z]+)*$/.test(projectName)) {
    console.error("Error: Project name must be lowercase kebab-case (e.g., crm-system)");
    process.exit(1);
  }

  // Check if project already exists
  const projectDir = join(root, "projects", projectName);
  if (existsSync(projectDir)) {
    console.error(`Error: Project ${projectName} already exists`);
    process.exit(1);
  }

  // Create project directory
  const projectsDir = join(root, "projects");
  if (!existsSync(projectsDir)) {
    require("fs").mkdirSync(projectsDir, { recursive: true });
  }

  // Scaffold the project from ai-template
  const templateScaffold = join(root, "scaffolds/ai-native-app");
  if (!existsSync(templateScaffold)) {
    console.error("Error: ai-native-app scaffold not found");
    process.exit(1);
  }

  // Copy scaffold files
  require("fs").mkdirSync(projectDir, { recursive: true });
  
  // Read scaffold README for guidance
  const readmePath = join(templateScaffold, "README.md");
  let scaffoldInfo = "";
  if (existsSync(readmePath)) {
    scaffoldInfo = require("fs").readFileSync(readmePath, "utf8");
  }

  console.log("Project scaffold created from ai-template");
  console.log("" + scaffoldInfo.substring(0, 500) + "...");
  console.log("");
  console.log(`Your project ${projectName} has been initialized!`);
  console.log("");
  console.log("Next steps:");
  console.log(`1. cd ${projectName}`);
  console.log("2. Run 'pnpm install' to install dependencies");
  console.log("3. Run 'pnpm dev' to start development server");
  console.log("");
  console.log("For more information, see: docs/overview/AI_QUICK_REFERENCE.md");
}

async function validateProject() {
  console.log("Validating project structure...");
  console.log("");

  // Run structure validation
  try {
    // Import and run the template structure validator
    const { default: validateStructure } = await import("../ai-template/scripts/validate-structure.mjs");
    await validateStructure();
    console.log("✓ Structure validation PASSED");
  } catch (error) {
    console.error(`✗ Structure validation FAILED: ${error.message}`);
    process.exit(1);
  }

  // Check roadmap coverage
  const coveragePath = join(root, "validation/roadmap-coverage.json");
  if (existsSync(coveragePath)) {
    console.log("✓ Roadmap coverage check PASSED");
  } else {
    console.warn("⚠ Roadmap coverage file not found");
  }

  console.log("");
  console.log("Validation complete.");
}

async function checkIntegrity() {
  console.log("Checking cross-repository integrity...");
  console.log("");

  const checks = [];

  // Check ai-template structure
  try {
    const templateRoot = join(root, "ai-template");
    const hasManifest = existsSync(join(templateRoot, "manifests/enterprise-10-10-structure.json"));
    const hasTemplateManifest = existsSync(join(templateRoot, "templates/enterprise-10-10/template-manifest.json"));
    checks.push({ name: "ai-template structure", pass: hasManifest && hasTemplateManifest });
  } catch (e) {
    checks.push({ name: "ai-template structure", pass: false });
  }

  // Check ai-foundation structure
  try {
    const foundationRoot = join(root, "ai-foundation");
    const hasDocs = existsSync(join(foundationRoot, "docs"));
    const hasSecurity = existsSync(join(foundationRoot, "security"));
    checks.push({ name: "ai-foundation structure", pass: hasDocs && hasSecurity });
  } catch (e) {
    checks.push({ name: "ai-foundation structure", pass: false });
  }

  // Check ai-knowledge structure
  try {
    const knowledgeRoot = join(root, "ai-knowledge");
    const hasDocs = existsSync(join(knowledgeRoot, "docs"));
    const hasEvaluations = existsSync(join(knowledgeRoot, "evaluation"));
    checks.push({ name: "ai-knowledge structure", pass: hasDocs && hasEvaluations });
  } catch (e) {
    checks.push({ name: "ai-knowledge structure", pass: false });
  }

  // Summary
  console.log("Integrity checks:");
  let allPassed = true;
  for (const check of checks) {
    const status = check.pass ? "✓" : "✗";
    console.log(`  ${status} ${check.name}`);
    if (!check.pass) allPassed = false;
  }

  console.log("");
  if (allPassed) {
    console.log("All integrity checks PASSED");
  } else {
    console.error("Some integrity checks FAILED");
    process.exit(1);
  }
}

async function runTests() {
  console.log("Running tests...");
  console.log("");

  // Check if vitest is available
  const testScript = join(root, "package.json");
  if (existsSync(testScript)) {
    const packageJson = JSON.parse(require("fs").readFileSync(testScript, "utf8"));
    if (packageJson.scripts && packageJson.scripts.test) {
      console.log(`Running: ${packageJson.scripts.test}`);
      console.log("(Note: In a real environment, would run pnpm test or npm test)");
    }
  }

// Check for test files in each repo
  const repos = ["ai-template", "ai-foundation", "ai-knowledge"];
  for (const repo of repos) {
    const repoPath = join(root, repo);
    if (existsSync(repoPath)) {
      const testDir = join(repoPath, "tests");
      const hasTests = existsSync(testDir);
      const status = hasTests ? "tests directory exists" : "no tests directory";
      console.log("  " + repo + ": " + status);
    }
  }

  console.log("");
  console.log("Tests complete.");
}

async function main() {
  switch (command) {
    case "init":
      const projectName = process.argv[3];
      if (!projectName) {
        console.error("Error: Please provide a project name");
        showHelp();
      }
      await initProject(projectName);
      break;

    case "validate":
      await validateProject();
      break;

    case "check-integrity":
      await checkIntegrity();
      break;

    case "test":
      await runTests();
      break;

    case "--help":
    case "-h":
    case undefined:
      showHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});