// Template upgrade as a minimal delta (builds on adopt.mjs, never replaces it):
//   detect current  -> the adoption journal (what a previous release wrote, by hash)
//   detect target   -> `incoming`, the files the target release would materialize
//   calculate delta -> add / update / remove / unchanged / keepLocal / collisions
//   apply only delta, preserve local customizations, update the journal
// A file is only ever updated or removed when it still equals what the journal
// says this tool wrote (pristine). A locally edited file, or a file the journal
// does not know, is never touched: it is reported so the maintainer decides.
// Re-running an upgrade on an up-to-date project yields an empty delta.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { AdoptError, JOURNAL_PATH, pruneEmptyDirs, safeJoin, sha } from "./adopt.mjs";

const readJournal = (root) => {
  const path = join(root, JOURNAL_PATH);
  if (!existsSync(path)) throw new AdoptError("no adoption journal; run the initial adoption first (nothing to upgrade)");
  return JSON.parse(readFileSync(path, "utf8"));
};
const hashOf = (full) => sha(readFileSync(full));

/** incoming: { relPath: content }. Read-only. */
export function planUpgrade(targetRoot, incoming) {
  const journal = readJournal(targetRoot);
  const created = journal.created ?? {};
  const skipped = new Set(journal.skipped ?? []);
  const plan = { add: [], update: [], remove: [], unchanged: [], keepLocal: [], collisions: [], keepSkipped: [] };

  for (const rel of Object.keys(incoming).sort()) {
    const full = safeJoin(targetRoot, rel);
    const want = sha(Buffer.from(incoming[rel]));
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
    if (have === want) plan.unchanged.push(rel);
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
  for (const rel of [...plan.add, ...plan.update]) {
    const full = safeJoin(targetRoot, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, incoming[rel]);
    created[rel] = sha(Buffer.from(incoming[rel]));
  }
  for (const rel of plan.remove) {
    rmSync(safeJoin(targetRoot, rel));
    delete created[rel];
    pruneEmptyDirs(targetRoot, rel);
  }
  writeFileSync(join(targetRoot, JOURNAL_PATH), `${JSON.stringify({ ...journal, created }, null, 2)}\n`);
  return { status: plan.summary.add + plan.summary.update + plan.summary.remove === 0 ? "UP_TO_DATE" : "UPGRADED", ...plan };
}
