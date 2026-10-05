// Check-then-use free file reads. `existsSync(p)` followed by `readFileSync(p)` is a
// time-of-check/time-of-use race (CodeQL js/file-system-race): the file can change or
// vanish in between. Reading directly and treating ENOENT as "absent" has no such window.
import { readFileSync } from "node:fs";

/** Returns the file's text, or null when it does not exist. Any other error propagates. */
export function readTextIfExists(path, encoding = "utf8") {
  try {
    return readFileSync(path, encoding);
  } catch (error) {
    if (error && error.code === "ENOENT") return null;
    throw error;
  }
}

/** Non-empty lines of a text file; empty when the file does not exist. */
export function readLinesIfExists(path) {
  const text = readTextIfExists(path);
  return text === null ? [] : text.split("\n").filter(Boolean);
}
