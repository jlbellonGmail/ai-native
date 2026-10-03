// M5 prerequisite (PAR-BROWNFIELD-SAFETY, DIS-03; PAR-MIGRATION-REVERT).
// Brownfield adoption into a repo that already has content:
//   plan   : read-only; reports every path the adoption would create and which
//            of them already exist (collisions). Nothing is written.
//   apply  : creates ONLY non-colliding files and never overwrites. Collisions
//            stop the run (BLOCKED) unless the caller passes `resolve[path] =
//            "skip"` (leave the existing file untouched). Writes a journal
//            with the sha256 of everything it created.
//   revert : removes only files whose current hash still equals the journal;
//            a file edited since adoption is kept and reported. Reverting is
//            idempotent and a missing journal is an error, not a no-op.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync, rmdirSync } from "node:fs";
import { dirname, join, resolve, relative, isAbsolute } from "node:path";

export const JOURNAL_PATH = ".ai-native/adoption-journal.json";
export class AdoptError extends Error {}

const sha = (buf) => `sha256:${createHash("sha256").update(buf).digest("hex")}`;

function safeJoin(root, rel) {
  if (isAbsolute(rel) || rel.split(/[\\/]/).includes("..")) throw new AdoptError(`unsafe path '${rel}'`);
  const full = resolve(root, rel);
  if (relative(root, full).startsWith("..")) throw new AdoptError(`path escapes target: '${rel}'`);
  return full;
}

/** incoming: { relPath: content }. Read-only. */
export function planAdoption(targetRoot, incoming) {
  const create = [];
  const collisions = [];
  for (const rel of Object.keys(incoming).sort()) {
    const full = safeJoin(targetRoot, rel);
    if (existsSync(full)) collisions.push({ path: rel, identical: sha(readFileSync(full)) === sha(Buffer.from(incoming[rel])) });
    else create.push(rel);
  }
  return { create, collisions, blocked: collisions.some((c) => !c.identical) };
}

export function applyAdoption(targetRoot, incoming, { resolve: resolutions = {} } = {}) {
  if (existsSync(join(targetRoot, JOURNAL_PATH))) throw new AdoptError("an adoption journal already exists; revert it first");
  const plan = planAdoption(targetRoot, incoming);
  const unresolved = plan.collisions.filter((c) => !c.identical && resolutions[c.path] !== "skip");
  if (unresolved.length) return { status: "BLOCKED", written: [], skipped: [], collisions: unresolved.map((c) => c.path) };
  const created = {};
  for (const rel of plan.create) {
    const full = safeJoin(targetRoot, rel);
    mkdirSync(dirname(full), { recursive: true });
    try {
      writeFileSync(full, incoming[rel], { flag: "wx" }); // never overwrite, even if the file appeared after the plan
    } catch (error) {
      if (error.code === "EEXIST") throw new AdoptError(`'${rel}' appeared during adoption; nothing was overwritten`);
      throw error;
    }
    created[rel] = sha(Buffer.from(incoming[rel]));
  }
  const skipped = plan.collisions.map((c) => c.path);
  const journal = { schemaVersion: 1, created, skipped };
  mkdirSync(dirname(join(targetRoot, JOURNAL_PATH)), { recursive: true });
  writeFileSync(join(targetRoot, JOURNAL_PATH), `${JSON.stringify(journal, null, 2)}\n`, { flag: "wx" });
  return { status: "APPLIED", written: Object.keys(created), skipped, collisions: [] };
}

function pruneEmptyDirs(root, rel) {
  let dir = dirname(join(root, rel));
  while (relative(root, dir) && !relative(root, dir).startsWith("..")) {
    if (readdirSync(dir).length) break;
    rmdirSync(dir);
    dir = dirname(dir);
  }
}

export function revertAdoption(targetRoot) {
  const jp = join(targetRoot, JOURNAL_PATH);
  if (!existsSync(jp)) throw new AdoptError("no adoption journal; nothing to revert");
  const journal = JSON.parse(readFileSync(jp, "utf8"));
  const removed = [];
  const kept = [];
  for (const [rel, hash] of Object.entries(journal.created)) {
    const full = safeJoin(targetRoot, rel);
    if (!existsSync(full)) continue;
    if (sha(readFileSync(full)) !== hash) {
      kept.push(rel);
      continue;
    }
    rmSync(full);
    removed.push(rel);
    pruneEmptyDirs(targetRoot, rel);
  }
  if (!kept.length) {
    rmSync(jp);
    pruneEmptyDirs(targetRoot, JOURNAL_PATH);
  }
  return { status: kept.length ? "PARTIAL" : "REVERTED", removed, kept };
}
