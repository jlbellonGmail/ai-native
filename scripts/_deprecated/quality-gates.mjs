// DEPRECATED (2026-09-30, M0.2 governance reconciliation).
// Kept for history; DO NOT RUN. Reason: Hardcodes root to ai-template/ (pre-consolidation path); every gate prints FAIL but the process never exits non-zero, so it always reports success.
// Tracked in governance/roadmaps/AI-NATIVE-V3-ROADMAP.md (M0.2) and
// governance/adr/ADR-001-arquitectura-referencia-versionada.md.
// Ungoverned when introduced (commit 3c6ad67); not part of any closed task.

#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "ai-template");

// Quality Gate System
// Validates project readiness against standards

function assert(condition, message) {
  if (!condition) throw new Error(`QUALITY GATE FAILED: ${message}`);
}

async function runQualityGates() {
  console.log("=== AI-Native Quality Gate System ===\n");
  console.log("Running 8 quality gates...\n");

  // Gate 1: Structure Validation
  console.log("[1/8] Structure Validation...");
  try {
    const structurePath = join(root, "manifests/enterprise-10-10-structure.json");
    assert(existsSync(structurePath), "structure manifest missing");
    const structure = JSON.parse(readFileSync(structurePath, "utf8"));
    for (const dir of structure.requiredDirectories) {
      assert(existsSync(join(root, dir)), `directory missing: ${dir}`);
    }
    console.log("  PASS\n");
  } catch (e) {
    console.log(`  FAIL: ${e.message}\n`);
  }

  // Gate 2: Template Integrity
  console.log("[2/8] Template Integrity...");
  try {
    const templatePath = join(root, "templates/enterprise-10-10/template-manifest.json");
    assert(existsSync(templatePath), "template manifest missing");
    const template = JSON.parse(readFileSync(templatePath, "utf8"));
    assert(template.status === "PRODUCT_REPAIRED", "template not repaired");
    assert(template.templates && template.templates.length === 3, "expected 3 templates");
    for (const t of template.templates) {
      assert(t.id && t.targetRepo && t.repairs && t.repairs.length > 0, "invalid template");
    }
    console.log("  PASS\n");
  } catch (e) {
    console.log(`  FAIL: ${e.message}\n`);
  }

  // Gate 3: Roadmap Coverage
  console.log("[3/8] Roadmap Coverage...");
  try {
    const coveragePath = join(root, "validation/roadmap-coverage.json");
    assert(existsSync(coveragePath), "roadmap coverage missing");
    const coverage = JSON.parse(readFileSync(coveragePath, "utf8"));
    for (const [task, files] of Object.entries(coverage.tasks)) {
      assert(files.length > 0, `${task} has no mapped files`);
      for (const file of files) {
        assert(existsSync(join(root, file)), `${task} maps missing file: ${file}`);
      }
    }
    console.log("  PASS\n");
  } catch (e) {
    console.log(`  FAIL: ${e.message}\n`);
  }

  // Gate 4: Documentation Coverage
  console.log("[4/8] Documentation Coverage...");
  try {
    const requiredDocs = [
      "README.md",
      "docs/README.md",
      "docs/overview/AI_ECOSYSTEM.md",
      "docs/overview/SYSTEM_OVERVIEW.md",
      "docs/onboarding/FIRST-PROJECT.md"
    ];
    for (const doc of requiredDocs) {
      assert(existsSync(join(root, doc)), `doc missing: ${doc}`);
    }
    console.log("  PASS\n");
  } catch (e) {
    console.log(`  FAIL: ${e.message}\n`);
  }

  // Gate 5: Generator Contracts
  console.log("[5/8] Generator Contracts...");
  try {
    const contractPath = join(root, "generators/create-ai-native-app/create-ai-native-app.contract.json");
    assert(existsSync(contractPath), "generator contract missing");
    const contract = JSON.parse(readFileSync(contractPath, "utf8"));
    assert(contract.id && contract.entrypoint, "generator contract invalid");
    console.log("  PASS\n");
  } catch (e) {
    console.log(`  FAIL: ${e.message}\n`);
  }

  // Gate 6: Testing Profiles
  console.log("[6/8] Testing Profiles...");
  try {
    const profilesPath = join(root, "testing/profiles/testing-profiles.json");
    assert(existsSync(profilesPath), "testing profiles missing");
    const profiles = JSON.parse(readFileSync(profilesPath, "utf8"));
    assert(profiles.profiles && profiles.profiles.length > 0, "no testing profiles defined");
    console.log("  PASS\n");
  } catch (e) {
    console.log(`  FAIL: ${e.message}\n`);
  }

  // Gate 7: Security Bootstrap
  console.log("[7/8] Security Bootstrap...");
  try {
    const securityPath = join(root, "docs/security/SECURITY-BOOTSTRAP.md");
    assert(existsSync(securityPath), "security bootstrap missing");
    const security = readFileSync(securityPath, "utf8");
    assert(security.length > 100, "security doc too short");
    console.log("  PASS\n");
  } catch (e) {
    console.log(`  FAIL: ${e.message}\n`);
  }

  // Gate 8: Cross-Repo Integration
  console.log("[8/8] Cross-Repo Integration...");
  try {
    const baseDir = process.cwd();
    const repos = [
      { name: "ai-template", path: join(baseDir, "ai-template"), keyFile: "manifests/enterprise-10-10-structure.json" },
      { name: "ai-foundation", path: join(baseDir, "ai-foundation"), keyFile: "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md" },
      { name: "ai-knowledge", path: join(baseDir, "ai-knowledge"), keyFile: "docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md" }
    ];
    for (const repo of repos) {
      assert(existsSync(join(repo.path, repo.keyFile)), `${repo.name} integration check failed`);
    }
    console.log("  PASS\n");
  } catch (e) {
    console.log(`  FAIL: ${e.message}\n`);
  }

  console.log("=== Quality Gate System Complete ===");
}

runQualityGates().catch((err) => {
  console.error("Quality gate system error:", err.message);
  process.exit(1);
});