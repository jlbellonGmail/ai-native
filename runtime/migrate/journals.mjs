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

const readJson = (root, rel) => (existsSync(join(root, rel)) ? JSON.parse(readFileSync(join(root, rel), "utf8")) : null);

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
