// CI closure run (spec 002 RF-31): in a fresh checkout of the evaluated commit, re-run the mandatory acceptance
// cases of every changed feature and keep each runner's RAW structured output as an artifact. This job runs
// candidate code, so it never decides: the trusted `analyze` step (runtime/acceptance/verdict.mjs deriveClosure,
// from main) re-parses the raw bytes against the candidate plan read as Git objects.
//
// node runtime/acceptance/ci-closure.mjs --base <ref> --out <dir>
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_MANIFEST_PATH, runFeatureAcceptance } from "./feature.mjs";
import { buildGraph } from "./graph.mjs";
import { analyzeImpact, gitRefResolver } from "./impact.mjs";

export function changedFeatureSlugs(project, base) {
  const out = execFileSync("git", ["diff", "--name-only", "--no-renames", `${base}...HEAD`], { cwd: project, encoding: "utf8" });
  return [...new Set(out.split("\n").map((p) => /^specs\/([^/]+)\//.exec(p)?.[1]).filter(Boolean))].sort();
}

const readJsonIf = (file) => {
  try { return JSON.parse(readFileSync(file, "utf8")); } catch (error) { return error.code === "ENOENT" ? null : { __invalid: true }; }
};

/**
 * 003 RF-2: when a provider's public contract changes, the features of its known consumers (plans whose `moduleId`
 * consumes it) are selected too, each once. Impact comes from spec 001's analyzer (declarations in
 * `acceptance/contract-changes.json`); an unverifiable public change is an `impact` BLOCKED entry, never skipped.
 */
export function impactSelection(project, base) {
  const manifest = readJsonIf(join(project, DEFAULT_MANIFEST_PATH));
  if (manifest === null) return { slugs: [], blocked: [] };
  const g = buildGraph(manifest);
  if (!g.ok) return { slugs: [], blocked: g.errors.map((e) => `manifest: ${e}`) };
  const changed = execFileSync("git", ["diff", "--name-only", "--no-renames", `${base}...HEAD`], { cwd: project, encoding: "utf8" }).split("\n").filter(Boolean);
  const declarations = readJsonIf(join(project, "acceptance", "contract-changes.json"));
  if (declarations?.__invalid) return { slugs: [], blocked: ["acceptance/contract-changes.json is not valid JSON"] };
  const impact = analyzeImpact({ graph: g.graph, changedPaths: changed, declarations: declarations?.changes ?? [], resolveRef: gitRefResolver(project) });
  if (impact.status !== "OK") return { slugs: [], blocked: impact.errors };
  const consumers = new Set(impact.consumers);
  const slugs = [];
  const specs = join(project, "specs");
  for (const d of existsSync(specs) ? readdirSync(specs, { withFileTypes: true }) : []) {
    if (!d.isDirectory()) continue;
    const plan = readJsonIf(join(specs, d.name, "acceptance", "plan.json"));
    if (plan && !plan.__invalid && consumers.has(plan.moduleId)) slugs.push(d.name);
  }
  return { slugs: slugs.sort(), blocked: [], consumers: [...consumers] };
}

export async function closureRun({ project, base, outDir }) {
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: project, encoding: "utf8" }).trim();
  const features = [];
  const impact = impactSelection(project, base);
  // changed features plus affected consumers, each run once
  const selected = [...new Set([...changedFeatureSlugs(project, base), ...impact.slugs])].sort();
  for (const slug of selected) {
    const st = await runFeatureAcceptance(project, slug, { base, rawDir: join(outDir, slug) });
    features.push({ slug, classification: st.classification, localStatus: st.status });
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "closure.json"), `${JSON.stringify({ schemaVersion: 1, headSha: head, base, features, impact }, null, 2)}\n`);
  return { headSha: head, features, impact, selected };
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  const a = process.argv.slice(2);
  const v = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  const r = await closureRun({ project: process.cwd(), base: v("--base"), outDir: resolve(v("--out") ?? "acceptance-closure") });
  for (const f of r.features) console.log(`${f.slug}: ${f.classification} ${f.localStatus} (local view; the trusted analyzer decides)`);
}
