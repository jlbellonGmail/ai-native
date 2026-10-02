// M4.2 revocations (SS 12.2 / ADR-004): `revocations-<n>.json` is an asset of
// an immutable release. A consumer takes the HIGHEST n that validates;
// a malformed or inconsistent list is skipped, never trusted.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../lib/schema-lite.mjs";

const schema = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "contracts", "revocations.schema.json"), "utf8"));

export const REVOCATIONS_ASSET = /^revocations-([1-9][0-9]*)\.json$/;

export function parseRevocations(text, assetName = null) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return { errors: [`revocations is not valid JSON: ${error.message}`] };
  }
  const errors = validate(data, schema).map((e) => `revocations: ${e}`);
  const m = assetName?.match(REVOCATIONS_ASSET);
  if (!errors.length && m && Number(m[1]) !== data.n) errors.push(`revocations: asset ${assetName} declares n=${data.n}`);
  return errors.length ? { errors } : { list: data, errors: [] };
}

/** @param {{name:string,text:string}[]} candidates */
export function pickHighest(candidates) {
  const warnings = [];
  let best = null;
  for (const { name, text } of candidates) {
    const { list, errors } = parseRevocations(text, name);
    if (errors.length) {
      warnings.push(`ignored ${name}: ${errors[0]}`);
      continue;
    }
    if (!best || list.n > best.n) best = list;
  }
  return { list: best, warnings };
}

/** First entry that revokes this platform (kind=platform, same version, commit if pinned). */
export function findRevocation(list, { version, commit }) {
  return (list?.entries ?? []).find((e) => e.kind === "platform" && e.version === version && (!e.commit || e.commit === commit)) ?? null;
}
