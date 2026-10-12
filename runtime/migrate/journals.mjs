// What ai-native owns in a consumer, read from BOTH journals. Two commands write files into a consumer and each keeps
// its own record: `consumer.mjs` (.ai-native/adoption-journal.json) and `migrate apply` (.ai-native/migration-journal.json).
// Drift, upgrade, the L3 gate and the tracking check must see the union, otherwise what one command wrote and the other
// did not record is covered by nothing.
//   created  written by the adoption; revert removes it
//   adopted  already there and identical when adopted (or written by migrate apply): managed, never removed by the adoption revert
//   skipped  deliberately left to the project; not managed
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JOURNAL_PATH, normalizedSha, safeJoin } from "./adopt.mjs";

export const ADOPTION_JOURNAL = JOURNAL_PATH;
export const MIGRATION_JOURNAL = ".ai-native/migration-journal.json";
/** Written by `migrate apply` but not a projection of the release: the upgrade delta must never treat them as obsolete projections. */
export const NON_PROJECTION = ["ai-native.lock.json", ".github/workflows/ai-native.yml"];

// Contract (v3.1.3, N-02b). Both journals are persisted state: a journal the base branch had may leave the tree only with the files
// it lists (its own revert). They are not redundant: the adoption journal lists the projections `consumer.mjs` wrote, the migration
// journal lists what `migrate apply` wrote (lock, caller workflow, retired files). Neither is derived from the other.
export class JournalError extends Error {}

const isMap = (v) => v !== null && typeof v === "object" && !Array.isArray(v) && Object.values(v).every((x) => typeof x === "string");
const isPaths = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");

/** Parses and shape-checks one journal. A journal that is not what its writer produces is corrupt, never an empty set. */
export function parseJournal(text, rel) {
  let j;
  try {
    j = JSON.parse(text);
  } catch (error) {
    throw new JournalError(`${rel} is not valid JSON (${error.message})`);
  }
  if (j === null || typeof j !== "object" || Array.isArray(j)) throw new JournalError(`${rel} is not a JSON object`);
  if (rel === ADOPTION_JOURNAL) {
    for (const k of ["created", "adopted"]) if (j[k] !== undefined && !isMap(j[k])) throw new JournalError(`${rel}: '${k}' must map path -> sha256`);
    if (j.skipped !== undefined && !isPaths(j.skipped)) throw new JournalError(`${rel}: 'skipped' must be a list of paths`);
  } else if (j.created !== undefined && !(Array.isArray(j.created) && j.created.every((c) => c && typeof c.path === "string" && typeof c.sha256 === "string"))) {
    throw new JournalError(`${rel}: 'created' must be a list of { path, sha256 }`);
  }
  return j;
}

const readJson = (root, rel) => (existsSync(join(root, rel)) ? parseJournal(readFileSync(join(root, rel), "utf8"), rel) : null);

/** { hasAdoption, hasMigration, created, adopted, skipped, migrationCreated } with legacy journals healed (see below). */
export function readOwnership(root) {
  const adoption = readJson(root, ADOPTION_JOURNAL);
  const migration = readJson(root, MIGRATION_JOURNAL);
  const migrationCreated = Object.fromEntries((migration?.created ?? []).map((c) => [c.path, c.sha256]));
  const created = { ...(adoption?.created ?? {}) };
  const adopted = { ...(adoption?.adopted ?? {}) };
  let skipped = [...(adoption?.skipped ?? [])];
  if (!adoption && migration) {
    // migrate apply only: its projections are managed even though no adoption journal exists
    for (const [rel, hash] of Object.entries(migrationCreated)) if (!NON_PROJECTION.includes(rel)) adopted[rel] = hash;
  } else if (adoption) {
    // journals written before v3.1.2 recorded an identical pre-existing file (the ones `migrate apply` had just written) as
    // `skipped`. If migrate wrote it and it is still pristine, it was never the project's: it is managed. An edited one stays the project's.
    skipped = skipped.filter((rel) => {
      const written = migrationCreated[rel];
      if (!written || NON_PROJECTION.includes(rel)) return true;
      let have;
      try { have = normalizedSha(readFileSync(safeJoin(root, rel))); } catch { return true; }
      if (have !== written) return true;
      adopted[rel] = written;
      return false;
    });
  }
  return { hasAdoption: adoption !== null, hasMigration: migration !== null, created, adopted, skipped, migrationCreated };
}
