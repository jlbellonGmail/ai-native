import { existsSync, readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Base path is the template root (parent of scripts/), independent of the caller's cwd
const root = fileURLToPath(new URL("..", import.meta.url));

// Helper: resolve path relative to root
function resolvePath(p) {
  if (typeof p === "string" && p.match(/^[A-Z]:\\/)) return p;
  return join(root, p);
}

// Helper: check if path exists
function pathExists(p) {
  const absPath = resolvePath(p);
  return existsSync(absPath);
}

// Load required directories from structure manifest
const structurePath = join(root, "manifests/enterprise-10-10-structure.json");
const structureContent = readFileSync(structurePath, "utf8");
const structure = JSON.parse(structureContent);
const requiredDirs = structure.requiredDirectories;
const requiredFiles = structure.requiredFiles;

// Validate required directories exist
for (const dir of requiredDirs) {
  const dirPath = join(root, dir);
  if (!existsSync(dirPath)) {
    throw new Error("missing required directory: " + dir);
  }
}

// Validate required files exist
for (const file of requiredFiles) {
  const filePath = join(root, file);
  if (!existsSync(filePath)) {
    throw new Error("missing required file: " + file);
  }
}

// Load roadmap coverage
const coveragePath = join(root, "validation/roadmap-coverage.json");
const coverageContent = readFileSync(coveragePath, "utf8");
const coverage = JSON.parse(coverageContent);

// Validate roadmap coverage tasks have mapped files
for (const task in coverage.tasks) {
  const files = coverage.tasks[task];
  if (files.length === 0) {
    throw new Error(task + " has no mapped files");
  }
  for (const file of files) {
    const filePath = join(root, file);
    if (!existsSync(filePath)) {
      throw new Error(task + " maps missing file: " + file);
    }
  }
}

// Check for empty active directories (skip _deprecated and scaffold reference paths)
const emptyDirs = [];
function walkDirs(dirPath) {
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if ([".git", "node_modules", ".next"].includes(entry.name)) continue;
      const full = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const dirName = entry.name;
        const scaffoldRefNames = structure.scaffolds
          .filter((s) => s.reference)
          .map((s) => s.reference.split("/").pop());
        if (scaffoldRefNames.includes(dirName)) {
          walkDirs(full);
          continue;
        }
        emptyDirs.push(full);
        walkDirs(full);
      }
    }
  } catch {
    // Skip directories that don't exist or can't be read
  }
}

walkDirs(root);

// Check directories that have no files at all (except .gitkeep)
function checkDirEmpty(dirPath) {
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    if (entries.length === 0) return true;
    return entries.every((e) => e.name === ".gitkeep");
  } catch {
    return true;
  }
}

// Check if a directory is under any scaffold reference path
function isScaffoldReferencePath(dirPath) {
  for (const scaffold of structure.scaffolds) {
    if (scaffold.reference) {
      const refPath = join(root, scaffold.reference);
      if (dirPath.startsWith(refPath)) return true;
    }
  }
  return false;
}

// Filter out _deprecated directories and scaffold reference paths, then check for truly empty active dirs
const meaningfulEmptyDirs = emptyDirs
  .filter((d) => !d.includes("_deprecated") && !isScaffoldReferencePath(d))
  .filter((d) => checkDirEmpty(d));

if (meaningfulEmptyDirs.length > 0) {
  throw new Error("empty active directories found: " + meaningfulEmptyDirs.join(", "));
}

// Cross-repo integration checks
const templateManifestPath = join(root, "templates/enterprise-10-10/template-manifest.json");
const templateManifestContent = readFileSync(templateManifestPath, "utf8");
const templateManifest = JSON.parse(templateManifestContent);

// Validate scaffold references exist
for (const scaffold of structure.scaffolds) {
  if (scaffold.reference) {
    const refPath = join(root, scaffold.reference);
    if (!existsSync(refPath)) {
      throw new Error("scaffold reference " + scaffold.reference + " does not exist");
    }
  }
}

// Validate template manifest repairs map to target repos
for (const template of templateManifest.templates) {
  if (!template.id || !template.targetRepo) {
    throw new Error("template must have id and targetRepo");
  }
  if (!template.repairs || template.repairs.length === 0) {
    throw new Error("template must list repairs");
  }

  // Validate each repair is a valid task ID format (e.g., W1-T7, W2-T1)
  const taskPattern = /^W\d+-T\d+$/;
  for (const repair of template.repairs) {
    if (!taskPattern.test(repair)) {
      throw new Error("invalid repair task format: " + repair);
    }
  }
}

// Validate generators have proper contracts
for (const generator of structure.generators) {
  const contractPath = join(root, generator.contract);
  if (!existsSync(contractPath)) {
    throw new Error("generator " + generator.id + " contract " + generator.contract + " does not exist");
  }
  const contract = JSON.parse(readFileSync(contractPath, "utf8"));
  if (!contract.id || !contract.entrypoint) {
    throw new Error("generator contract must have id and entrypoint");
  }
}

console.log("ai-template structure validation PASS");
console.log("Cross-repo integration checks PASSED");