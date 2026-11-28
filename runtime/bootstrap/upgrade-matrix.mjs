// Explicit upgrade compatibility matrix (spec 003 RF-4, RF-8, RF-9, RF-10). Admission is by exact source
// release recorded from inspected tags, never inferred from a version prefix. Evaluated before any write.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cmpAny } from "./semver.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const MATRIX_PATH = join(here, "..", "..", "contracts", "upgrade-matrix.json");
export const loadUpgradeMatrix = (path = MATRIX_PATH) => JSON.parse(readFileSync(path, "utf8"));
const STABLE = /^v\d+\.\d+\.\d+$/;
const major = (v) => Number(/^v(\d+)\./.exec(v)?.[1]);

/**
 * @param lock   the consumer's parsed lock (already schema-validated by readLock)
 * @param target the target platform version
 * @returns {{ ok:boolean, applies:boolean, errors:string[], warnings:string[], row?:object }}
 */
export function admitSource({ lock, target, matrix = loadUpgradeMatrix() }) {
  if (!STABLE.test(String(target)) && !/^v\d+\.\d+\.\d+-/.test(String(target))) return { ok: false, applies: true, errors: [`UPGRADE_MATRIX: unknown target version ${JSON.stringify(target)}`], warnings: [] };
  // the matrix speaks for its own target line (v4.1.x); every later line ships its own matrix
  const line = (v) => /^v(\d+\.\d+)\./.exec(v)?.[1];
  if (line(target) !== line(matrix.appliesFrom) || cmpAny(target, matrix.appliesFrom) < 0) return { ok: true, applies: false, errors: [], warnings: [] };
  if (!lock || typeof lock !== "object") return { ok: false, applies: true, errors: ["UPGRADE_MATRIX: source lock is absent or malformed"], warnings: [] };
  if (lock.schemaVersion !== 1) return { ok: false, applies: true, errors: [`UPGRADE_MATRIX: source lock schemaVersion ${JSON.stringify(lock.schemaVersion)} is not admitted (expected 1)`], warnings: [] };
  const source = lock.platform?.version;
  if (typeof source !== "string" || !STABLE.test(source)) return { ok: false, applies: true, errors: [`UPGRADE_MATRIX: source version ${JSON.stringify(source)} is malformed or a prerelease; only exact admitted releases upgrade to ${target}`], warnings: [] };
  if (cmpAny(source, target) > 0) return { ok: false, applies: true, errors: [`UPGRADE_MATRIX: source ${source} is newer than the target ${target} (future source)`], warnings: [] };
  // re-applying the pinned release is the engine's UP_TO_DATE / digest check, and a patch inside the v4.1 line
  // (v4.1.0 -> v4.1.1) is not a crossing into it: neither is a source admission
  if (cmpAny(source, target) === 0 || line(source) === line(target)) return { ok: true, applies: false, errors: [], warnings: [] };
  const row = matrix.admitted.find((r) => r.source === source);
  if (!row) return { ok: false, applies: true, errors: [`UPGRADE_MATRIX: ${source} -> ${target} is not an admitted path (admitted: ${matrix.admitted.map((r) => r.source).join(", ")})`], warnings: [] };
  if (row.lockSchemaBlob !== matrix.lockSchemaBlob || row.bootstrapProtocol !== matrix.bootstrapProtocol || !row.capabilities.includes("upgrade")) return { ok: false, applies: true, errors: [`UPGRADE_MATRIX: ${source} row does not match the admitted lock/protocol family`], warnings: [] };
  const warnings = [];
  if (row.majorCrossing || major(source) !== major(target)) warnings.push(`MAJOR_CROSSING: ${source} -> ${target} crosses a MAJOR line (v${major(source)} -> v${major(target)}); review the migration notes`);
  return { ok: true, applies: true, errors: [], warnings, row };
}
