// CI closure run (spec 002 RF-31): in a fresh checkout of the evaluated commit, re-run the mandatory acceptance
// cases of every changed feature and keep each runner's RAW structured output as an artifact. This job runs
// candidate code, so it never decides: the trusted `analyze` step (runtime/acceptance/verdict.mjs deriveClosure,
// from main) re-parses the raw bytes against the candidate plan read as Git objects.
//
// node runtime/acceptance/ci-closure.mjs --base <ref> --out <dir>
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runFeatureAcceptance } from "./feature.mjs";

export function changedFeatureSlugs(project, base) {
  const out = execFileSync("git", ["diff", "--name-only", "--no-renames", `${base}...HEAD`], { cwd: project, encoding: "utf8" });
  return [...new Set(out.split("\n").map((p) => /^specs\/([^/]+)\//.exec(p)?.[1]).filter(Boolean))].sort();
}

export async function closureRun({ project, base, outDir }) {
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: project, encoding: "utf8" }).trim();
  const features = [];
  for (const slug of changedFeatureSlugs(project, base)) {
    const st = await runFeatureAcceptance(project, slug, { base, rawDir: join(outDir, slug) });
    features.push({ slug, classification: st.classification, localStatus: st.status });
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "closure.json"), `${JSON.stringify({ schemaVersion: 1, headSha: head, base, features }, null, 2)}\n`);
  return { headSha: head, features };
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  const a = process.argv.slice(2);
  const v = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  const r = await closureRun({ project: process.cwd(), base: v("--base"), outDir: resolve(v("--out") ?? "acceptance-closure") });
  for (const f of r.features) console.log(`${f.slug}: ${f.classification} ${f.localStatus} (local view; the trusted analyzer decides)`);
}
