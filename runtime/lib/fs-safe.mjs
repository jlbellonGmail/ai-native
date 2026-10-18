// Check-then-use free file reads. `existsSync(p)` followed by `readFileSync(p)` is a
// time-of-check/time-of-use race (CodeQL js/file-system-race): the file can change or
// vanish in between. Reading directly and treating "no such path" as absent has no such window.
//
// "Absent" keeps the meaning `existsSync` had: ENOENT, and also ENOTDIR (POSIX raises it when a
// path component is a regular file, e.g. `runs/README.md/events.jsonl`; Windows raises ENOENT).
// Anything else (EISDIR, EACCES, ...) is a real error and propagates.
import { readFileSync } from "node:fs";

/** Returns the file's text, or null when the path does not exist. Any other error propagates. */
export function readTextIfExists(path, encoding = "utf8") {
  try {
    return readFileSync(path, encoding);
  } catch (error) {
    if (error && (error.code === "ENOENT" || error.code === "ENOTDIR")) return null;
    throw error;
  }
}

/** Non-empty lines of a text file; empty when the file does not exist. */
export function readLinesIfExists(path) {
  const text = readTextIfExists(path);
  return text === null ? [] : text.split("\n").filter(Boolean);
}
