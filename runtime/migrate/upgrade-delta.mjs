// Template upgrade as a minimal delta (builds on adopt.mjs, never replaces it):
//   detect current  -> the adoption journal (what a previous release wrote, by hash)
//   detect target   -> `incoming`, the files the target release would materialize
//   calculate delta -> add / update / remove / unchanged / keepLocal / collisions
//   apply only delta, preserve local customizations, update the journal
// A file is only ever updated or removed when it still equals what the journal
// says this tool wrote (pristine). A locally edited file, or a file the journal
// does not know, is never touched: it is reported so the maintainer decides.
// Re-running an upgrade on an up-to-date project yields an empty delta.
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { AdoptError, JOURNAL_PATH, normalizedSha, pruneEmptyDirs, safeJoin } from "./adopt.mjs";
import { readOwnership } from "./journals.mjs";

// every hash here is of the text with CRLF read as LF: a checkout's core.autocrlf must not turn a pristine projection into an edited one
const sha = (buf) => normalizedSha(Buffer.from(buf));
const readJournal = (root) => {
  const own = readOwnership(root);
  if (!own.hasAdoption && !own.hasMigration) throw new AdoptError("no adoption journal; run the initial adoption first (nothing to upgrade)");
  return own;
};
const hashOf = (full) => normalizedSha(readFileSync(full));

/** incoming: { relPath: content }. Read-only. */
export function planUpgrade(targetRoot, incoming) {
  const journal = readJournal(targetRoot);
  // created and adopted are both managed: the file is updated or removed only while it still equals what the journal recorded
  const created = { ...journal.adopted, ...journal.created };
  const skipped = new Set(journal.skipped);
  const plan = { add: [], update: [], remove: [], unchanged: [], keepLocal: [], collisions: [], keepSkipped: [], refresh: [] };

  for (const rel of Object.keys(incoming).sort()) {
    const full = safeJoin(targetRoot, rel);
    const want = sha(incoming[rel]);
    if (skipped.has(rel)) {
      plan.keepSkipped.push(rel);
      continue;
    }
    if (!existsSync(full)) {
      // never written by us before, or deleted by the user: a deleted generated file is re-added only if it was never ours
      if (created[rel]) plan.keepLocal.push({ path: rel, reason: "deleted locally" });
      else plan.add.push(rel);
      continue;
    }
    const have = hashOf(full);
    if (have === want) {
      plan.unchanged.push(rel);
      // the journal knew this file at another hash (the user made it equal to the target): track the current bytes so the next release can update it
      if (created[rel] && created[rel] !== want) plan.refresh.push(rel);
    }
    else if (created[rel] && have === created[rel]) plan.update.push(rel);
    else if (created[rel]) plan.keepLocal.push({ path: rel, reason: "edited locally" });
    else plan.collisions.push(rel);
  }
  for (const rel of Object.keys(created).sort()) {
    if (rel in incoming) continue;
    const full = safeJoin(targetRoot, rel);
    if (!existsSync(full)) continue;
    if (hashOf(full) === created[rel]) plan.remove.push(rel);
    else plan.keepLocal.push({ path: rel, reason: "obsolete but edited locally" });
  }
  const bytes = [...plan.add, ...plan.update].reduce((sum, rel) => sum + Buffer.byteLength(incoming[rel]), 0);
  return { ...plan, summary: { add: plan.add.length, update: plan.update.length, remove: plan.remove.length, unchanged: plan.unchanged.length, preserved: plan.keepLocal.length + plan.collisions.length + plan.keepSkipped.length, bytesWritten: bytes } };
}

export function applyUpgrade(targetRoot, incoming) {
  const plan = planUpgrade(targetRoot, incoming);
  const journal = readJournal(targetRoot);
  const created = { ...journal.created };
  const adopted = { ...journal.adopted };
  // a hash is re-recorded in the map that already owns the file; a file this upgrade adds is ours (created)
  const record = (rel, hash) => { if (rel in adopted) adopted[rel] = hash; else created[rel] = hash; };
  for (const rel of plan.refresh) record(rel, sha(incoming[rel]));
  for (const rel of [...plan.add, ...plan.update]) {
    const full = safeJoin(targetRoot, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, incoming[rel]);
    record(rel, sha(incoming[rel]));
  }
  for (const rel of plan.remove) {
    rmSync(safeJoin(targetRoot, rel));
    delete created[rel];
    delete adopted[rel];
    pruneEmptyDirs(targetRoot, rel);
  }
  // write-then-rename: an interrupted upgrade never leaves a half-written journal
  const journalPath = join(targetRoot, JOURNAL_PATH);
  writeFileSync(`${journalPath}.tmp`, `${JSON.stringify({ schemaVersion: 1, created, adopted, skipped: journal.skipped }, null, 2)}\n`);
  renameSync(`${journalPath}.tmp`, journalPath);
  const changed = plan.summary.add + plan.summary.update + plan.summary.remove;
  // a refresh only re-tracks hashes in the journal: no project file was written, and it must not read as "nothing happened"
  return { status: changed ? "UPGRADED" : plan.refresh.length ? "REFRESHED" : "UP_TO_DATE", ...plan };
}

/**
 * Drift of the generated projections against the canonical release (read-only).
 *   edited    a projection was changed by hand (the canonical source is ai-native, not the copy)
 *   missing   a projection the journal knows was deleted locally
 *   outdated  the release would add/update/remove files (regenerate with --upgrade)
 * `reference` is the outcome of resolving the pinned release (runtime/consumer/knowledge.mjs checkReference):
 * a release that cannot be resolved is MISSING_REFERENCE, one the resolver cannot read is INCOMPATIBLE_VERSION.
 * Foreign files (collisions) are not drift: they are the project's own.
 * Precedence: INCOMPATIBLE_VERSION > MISSING_REFERENCE > DRIFT > OUTDATED > CLEAN.
 */
export function detectDrift(targetRoot, incoming, { reference = { status: "OK" } } = {}) {
  const plan = planUpgrade(targetRoot, incoming);
  // "edited locally" and "obsolete but edited locally" both mean a hand-modified projection
  const edited = plan.keepLocal.filter((k) => k.reason !== "deleted locally").map((k) => k.path);
  const missing = plan.keepLocal.filter((k) => k.reason === "deleted locally").map((k) => k.path);
  const outdated = [...plan.add, ...plan.update, ...plan.remove].sort();
  let status = "CLEAN";
  if (outdated.length) status = "OUTDATED";
  if (edited.length || missing.length) status = "DRIFT";
  if (reference.status === "MISSING_REFERENCE" || reference.status === "INCOMPATIBLE_VERSION") status = reference.status;
  return { status, edited, missing, outdated, ...(reference.status === "OK" ? {} : { reference: reference.detail }) };
}
