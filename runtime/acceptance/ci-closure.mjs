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
import { featuresCoveringChanges } from "./evidence.mjs";

export function changedFeatureSlugs(project, base) {
  const changed = execFileSync("git", ["diff", "--name-only", "--no-renames", `${base}...HEAD`], { cwd: project, encoding: "utf8" }).split("\n").filter(Boolean);
  const direct = changed.map((p) => /^specs\/([^/]+)\//.exec(p)?.[1]).filter(Boolean);
  // a code-only change re-runs every feature whose plan (BASE or head) declares a changed path as a case input
  const mb = execFileSync("git", ["merge-base", base, "HEAD"], { cwd: project, encoding: "utf8" }).trim();
  const plans = [];
  for (const rev of [mb, "HEAD"]) {
    let files = [];
    try { files = execFileSync("git", ["ls-tree", "-r", "--name-only", rev, "--", "specs"], { cwd: project, encoding: "utf8" }).split("\n").filter((p) => /^specs\/[^/]+\/acceptance\/plan\.json$/.test(p)); } catch { files = []; }
    let contract = null;
    try { contract = JSON.parse(execFileSync("git", ["show", `${rev}:acceptance/validation-contract.json`], { cwd: project, encoding: "utf8", maxBuffer: 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] })); } catch { contract = null; }
    for (const f of files) {
      try { plans.push({ slug: f.split("/")[1], contract, plan: JSON.parse(execFileSync("git", ["show", `${rev}:${f}`], { cwd: project, encoding: "utf8", maxBuffer: 1024 * 1024 })) }); } catch { /* an invalid plan is judged by the run itself */ }
    }
  }
  return [...new Set([...direct, ...featuresCoveringChanges(plans, changed)])].sort();
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
  // the BASE graph counts too: deleting or editing the manifest can never drop a BASE obligation (re-review N1)
  let baseText = null;
  try {
    const mb = execFileSync("git", ["merge-base", base, "HEAD"], { cwd: project, encoding: "utf8" }).trim();
    baseText = execFileSync("git", ["show", `${mb}:${DEFAULT_MANIFEST_PATH}`], { cwd: project, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch { baseText = null; }
  let baseManifest = null;
  if (baseText !== null) { try { baseManifest = JSON.parse(baseText); } catch { baseManifest = { __invalid: true }; } }
  const headManifest = readJsonIf(join(project, DEFAULT_MANIFEST_PATH));
  if (baseManifest === null && headManifest === null) return { slugs: [], blocked: [] };
  const changed = execFileSync("git", ["diff", "--name-only", "--no-renames", `${base}...HEAD`], { cwd: project, encoding: "utf8" }).split("\n").filter(Boolean);
  const declarations = readJsonIf(join(project, "acceptance", "contract-changes.json"));
  if (declarations?.__invalid) return { slugs: [], blocked: ["acceptance/contract-changes.json is not valid JSON"] };
  const blocked = [];
  const consumers = new Set();
  for (const [label, manifest] of [["BASE", baseManifest], ["head", headManifest]]) {
    if (manifest === null) continue;
    if (manifest.__invalid) { blocked.push(`${label} manifest is not valid JSON`); continue; }
    const g = buildGraph(manifest);
    if (!g.ok) { blocked.push(...g.errors.map((e) => `${label} manifest: ${e}`)); continue; }
    const own = (declarations?.changes ?? []).filter((d) => g.graph.modules.includes(d?.providerId) && g.graph.contractPath(d.providerId, d.contractId) !== null);
    const impact = analyzeImpact({ graph: g.graph, changedPaths: changed, declarations: own, resolveRef: gitRefResolver(project) });
    if (impact.status !== "OK") blocked.push(...impact.errors.map((e) => `${label} graph: ${e}`));
    else for (const c of impact.consumers) consumers.add(c);
  }
  if (blocked.length) return { slugs: [], blocked: [...new Set(blocked)].sort() };
  const slugs = [];
  const mapped = new Set();
  const specs = join(project, "specs");
  for (const d of existsSync(specs) ? readdirSync(specs, { withFileTypes: true }) : []) {
    if (!d.isDirectory()) continue;
    const plan = readJsonIf(join(specs, d.name, "acceptance", "plan.json"));
    if (plan && !plan.__invalid && consumers.has(plan.moduleId)) { slugs.push(d.name); mapped.add(plan.moduleId); }
  }
  for (const c of consumers) if (!mapped.has(c)) blocked.push(`affected consumer module ${c} has no acceptance plan`);
  return { slugs: slugs.sort(), blocked, consumers: [...consumers].sort() };
}

export const ANCHOR = "ACCEPTANCE_RAW_DIGEST";
/** One job-log line per runner output, written synchronously the moment the digest is known. */
export const anchorLine = ({ slug, runnerId, outputDigest }) => `${ANCHOR} ${JSON.stringify({ slug, runnerId, digest: outputDigest })}`;

export async function closureRun({ project, base, outDir, log = (line) => process.stdout.write(`${line}
`) }) {
  const anchors = [];
  const anchor = (x) => { const line = anchorLine(x); anchors.push(line); log(line); };
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: project, encoding: "utf8" }).trim();
  const features = [];
  const impact = impactSelection(project, base);
  // changed features plus affected consumers, each run once
  const selected = [...new Set([...changedFeatureSlugs(project, base), ...impact.slugs])].sort();
  for (const slug of selected) {
    const st = await runFeatureAcceptance(project, slug, { base, rawDir: join(outDir, slug), onRaw: (x) => anchor({ slug, ...x }) });
    features.push({ slug, classification: st.classification, localStatus: st.status });
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "closure.json"), `${JSON.stringify({ schemaVersion: 1, headSha: head, base, features, impact }, null, 2)}\n`);
  return { headSha: head, features, impact, selected, anchors };
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  const a = process.argv.slice(2);
  const v = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  const r = await closureRun({ project: resolve(v("--project") ?? "."), base: v("--base"), outDir: resolve(v("--out") ?? "acceptance-closure") });
  for (const f of r.features) console.log(`${f.slug}: ${f.classification} ${f.localStatus} (local view; the trusted analyzer decides)`);
}
