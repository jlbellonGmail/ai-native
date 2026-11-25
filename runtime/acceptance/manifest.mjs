// Dependency manifest: structural (schema-lite) + semantic validation (spec 001
// RF-1, RF-2, NF-1, NF-2). Fail-closed, dependency-free, deterministic
// diagnostics, never echoes raw input values beyond bounded identifiers.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validate } from "../lib/schema-lite.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const MANIFEST_SCHEMA = JSON.parse(
  readFileSync(join(here, "..", "..", "contracts", "dependency-manifest.schema.json"), "utf8"),
);

const MAX_DIAG_VALUE = 80;
function safe(value) {
  const s = typeof value === "string" ? value : JSON.stringify(value);
  return String(s ?? "").slice(0, MAX_DIAG_VALUE).replace(/[\r\n\t]/g, " ");
}

/** Normalised repository-relative path, or null when it escapes / is absolute. */
export function normalizeRepoPath(p) {
  if (typeof p !== "string" || p.length === 0 || p.includes("\\") || p.startsWith("/")) return null;
  const out = [];
  for (const part of p.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") return null;
    out.push(part);
  }
  return out.length ? out.join("/") : null;
}

/**
 * @returns {{ ok: boolean, errors: string[] }} sorted, de-duplicated diagnostics.
 */
export function validateManifest(manifest) {
  if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { ok: false, errors: ["manifest must be a JSON object"] };
  }
  const errors = new Set();
  for (const e of validate(manifest, MANIFEST_SCHEMA)) errors.add(`schema: ${safe(e)}`);
  if (errors.size) return { ok: false, errors: [...errors].sort() };

  const moduleIds = new Set();
  const contractsByModule = new Map(); // moduleId -> Set(contractId)
  const pathOwner = new Map();
  for (const m of manifest.modules) {
    if (moduleIds.has(m.id)) errors.add(`duplicate module id: ${safe(m.id)}`);
    moduleIds.add(m.id);
    const cset = contractsByModule.get(m.id) ?? new Set();
    contractsByModule.set(m.id, cset);
    for (const c of m.contracts) {
      if (cset.has(c.id)) errors.add(`duplicate contract id: ${safe(m.id)}/${safe(c.id)}`);
      cset.add(c.id);
      const np = normalizeRepoPath(c.path);
      if (np === null) errors.add(`invalid contract path: ${safe(m.id)}/${safe(c.id)}`);
      else {
        const prev = pathOwner.get(np);
        if (prev && prev !== `${m.id}/${c.id}`) errors.add(`ambiguous contract path declared by ${safe(prev)} and ${safe(m.id)}/${safe(c.id)}`);
        pathOwner.set(np, `${m.id}/${c.id}`);
      }
    }
  }
  const seenEdges = new Set();
  for (const d of manifest.dependencies) {
    const key = `${d.consumer}|${d.provider}|${d.contract}`;
    if (seenEdges.has(key)) errors.add(`duplicate dependency: ${safe(d.consumer)} -> ${safe(d.provider)}/${safe(d.contract)}`);
    seenEdges.add(key);
    if (!moduleIds.has(d.consumer)) errors.add(`unknown consumer module: ${safe(d.consumer)}`);
    if (!moduleIds.has(d.provider)) errors.add(`unknown provider module: ${safe(d.provider)}`);
    else if (!contractsByModule.get(d.provider).has(d.contract)) errors.add(`unknown contract: ${safe(d.provider)}/${safe(d.contract)}`);
    if (d.consumer === d.provider) errors.add(`self dependency: ${safe(d.consumer)}`);
  }
  return { ok: errors.size === 0, errors: [...errors].sort() };
}
