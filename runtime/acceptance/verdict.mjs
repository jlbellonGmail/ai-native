// `analyze` step of the trusted acceptance-governance verdict path (spec 002 RF-25, RF-31; plan "Trusted verdict path").
// Runs from the TRUSTED platform checkout (main) and reads the candidate ONLY as Git objects of the exact head SHA:
// size-bounded, parsed as JSON/Markdown, never executed, imported, installed or checked out. It holds no secret and
// writes one schema-checked verdict JSON; a separate `publish` job (not here) posts it under the trust App identity.
//
// node runtime/acceptance/verdict.mjs --repo <dir> --base <sha> --head <sha> --out <file>
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { detectDowngrades } from "./downgrade.mjs";

const MAX_BYTES = 1024 * 1024;
const SHA = /^[0-9a-f]{40}$/;
const CONTRACT = "acceptance/validation-contract.json";
const CUTOFF = "acceptance/legacy-cutoff.json";

function gitBlob(repo, sha, path) {
  try {
    const size = Number(execFileSync("git", ["cat-file", "-s", `${sha}:${path}`], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim());
    if (!Number.isFinite(size) || size > MAX_BYTES) return { tooLarge: true };
    return { text: execFileSync("git", ["cat-file", "blob", `${sha}:${path}`], { cwd: repo, encoding: "utf8", maxBuffer: MAX_BYTES + 1024, stdio: ["ignore", "pipe", "ignore"] }) };
  } catch {
    return { absent: true };
  }
}
const asJson = (b) => (b.text === undefined ? null : (() => { try { return JSON.parse(b.text); } catch { return { __invalid: true }; } })());

/** @returns verdict { schemaVersion, headSha, baseSha, status: PASS|NEEDS_HUMAN|BLOCKED, findings, reasons } */
export function analyze({ repo, base, head }) {
  const reasons = [];
  if (!SHA.test(String(base)) || !SHA.test(String(head))) return { schemaVersion: 1, headSha: head ?? null, baseSha: base ?? null, status: "BLOCKED", findings: [], reasons: ["base and head must be full commit SHAs"] };
  const changed = execFileSync("git", ["diff", "--name-only", "--no-renames", base, head], { cwd: repo, encoding: "utf8" }).split("\n").filter(Boolean);
  const slugs = [...new Set(changed.map((p) => /^specs\/([^/]+)\/(spec\.md|acceptance\/plan\.json)$/.exec(p)?.[1]).filter(Boolean))].sort();
  const read = (sha, p) => gitBlob(repo, sha, p);
  const findings = [];
  const shared = (sha) => ({ contract: asJson(read(sha, CONTRACT)), cutoff: asJson(read(sha, CUTOFF)) });
  for (const p of [CONTRACT, CUTOFF]) if (read(head, p).tooLarge) reasons.push(`${p} exceeds the size bound`);
  const b0 = shared(base);
  const h0 = shared(head);
  if (h0.contract?.__invalid || h0.cutoff?.__invalid) reasons.push("candidate acceptance governance data is not valid JSON");
  findings.push(...detectDowngrades({ ...b0, plan: null, specText: null }, { ...h0, plan: null, specText: null }).findings);
  for (const slug of slugs) {
    const pb = read(base, `specs/${slug}/acceptance/plan.json`);
    const ph = read(head, `specs/${slug}/acceptance/plan.json`);
    const sb = read(base, `specs/${slug}/spec.md`);
    const sh = read(head, `specs/${slug}/spec.md`);
    if (ph.tooLarge || sh.tooLarge) { reasons.push(`specs/${slug} acceptance data exceeds the size bound`); continue; }
    const own = detectDowngrades({ contract: null, cutoff: null, plan: asJson(pb), specText: sb.text ?? null }, { contract: null, cutoff: null, plan: asJson(ph), specText: sh.text ?? null }).findings;
    findings.push(...own.map((f) => ({ ...f, slug })));
  }
  const status = reasons.length ? "BLOCKED" : findings.length ? "NEEDS_HUMAN" : "PASS";
  return { schemaVersion: 1, headSha: head, baseSha: base, status, findings, reasons };
}

if (process.argv[1] && resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1])) {
  const a = process.argv.slice(2);
  const v = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : undefined; };
  const verdict = analyze({ repo: resolve(v("--repo") ?? "."), base: v("--base"), head: v("--head") });
  const text = `${JSON.stringify(verdict, null, 2)}\n`;
  if (v("--out")) writeFileSync(v("--out"), text); else process.stdout.write(text);
  process.exit(verdict.status === "BLOCKED" ? 1 : 0);
}
