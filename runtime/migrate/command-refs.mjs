// Does a profile command (`productSetupCommand` / `productTestCommand`) depend on a given repository file? Used by `migrate` so
// it never retires a platform-owned file the profile still needs (gap 1). This is deliberately NOT a shell parser: it is a
// small, documented, CONSERVATIVE matcher. Wrong answers are allowed in exactly one direction: saying "referenced" for a file
// that is not (the file is kept, a harmless leftover), never saying "not referenced" for one that is (the file would be
// retired and the consumer's gate would break). Precise dependencies belong in the profile's declarative `requiredFiles`.
//
// SUPPORTED SYNTAX (a path counts as referenced when it appears as a path or as the tail of a path):
//   - as a word, quoted or not:                  pip install -r requirements-dev.txt     "requirements-dev.txt"
//   - glued to an option:                        -rrequirements-dev.txt   --requirement=requirements-dev.txt   -c f   --constraint f
//   - with a relative prefix or a variable root: ./requirements-dev.txt   sub/requirements-dev.txt   ${ROOT}/requirements-dev.txt
//   - after redirections, subshells, backticks, comments, separators:   >requirements-dev.txt  (pip -r f)  `cat f`  # f  ; & | ,
//   - in any letter case (case-insensitive file systems, and keeping a file is the safe error);
//   - through glob words (`requirements-*.txt`, `requirements?dev.txt`, `req[a-z]*.txt`) that match the path or its base name.
// NOT a reference: a different file that merely contains the name (`requirements-dev.txt.bak`, `my-requirements-dev.txt`).
//
// UNSUPPORTED (cannot be analysed => `commandIsOpaque` => EVERY candidate file is treated as referenced, i.e. kept):
//   variable expansion used as a word (`$FILE`, `${FILE}`), `eval`, `sh|bash|zsh|dash -c ...`, `xargs`, brace lists `{a,b}`.

const OPAQUE = [
  /\$\{?[A-Za-z_@*#?0-9]/, // $VAR, ${VAR}, $1, $@
  /(^|[\s;&|(`])eval(\s|$)/,
  /(^|[\s;&|(`])(?:ba|z|da|k)?sh\s+(?:-[A-Za-z]*\s+)*-[A-Za-z]*c(\s|$)/,
  /(^|[\s;&|(`])xargs(\s|$)/,
  /\{[^{}]*,[^{}]*\}/, // brace expansion
];

/** True when the command cannot be analysed with certainty (see UNSUPPORTED above). */
export const commandIsOpaque = (command) => OPAQUE.some((re) => re.test(command));

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// `-r f`, `-rf`, `--requirement=f`, `-c f`, `--constraint f`: pip's option forms, split so the path is a separate word
const splitOptions = (command) => command.replace(/(^|\s)(-r|--requirement(?:=|\s+)|-c|--constraint(?:=|\s+))\s*/g, "$1$2 ");

/** A glob word (`*`, `?`, `[...]`) -> RegExp over a whole path or base name, or null if it has no glob characters. */
function globWordToRegExp(word) {
  if (!/[*?[]/.test(word)) return null;
  let re = "";
  for (let i = 0; i < word.length; i += 1) {
    const c = word[i];
    if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else if (c === "[") {
      const end = word.indexOf("]", i + 2);
      if (end < 0) return null;
      re += word.slice(i, end + 1).replace(/\\/g, "");
      i = end;
    } else re += escapeRe(c);
  }
  try { return new RegExp(`^${re}$`, "i"); } catch { return null; }
}

/** Does `command` depend on `path` (a repository-relative file path)? Conservative: see the header. */
export function referencesPath(command, path) {
  if (typeof command !== "string" || typeof path !== "string" || !path) return false;
  if (commandIsOpaque(command)) return true;
  const text = splitOptions(command);
  // literal occurrence of the path (or its tail), bounded so that a longer file name does not match
  const literal = new RegExp(`(^|[^A-Za-z0-9_.-])${escapeRe(path)}(?![A-Za-z0-9_-]|\\.[A-Za-z0-9])`, "i");
  if (literal.test(text)) return true;
  const base = path.split("/").at(-1);
  for (const word of text.split(/[\s"'`;&|()<>=,]+/)) {
    const g = globWordToRegExp(word.replace(/^\.\//, ""));
    if (g && (g.test(path) || g.test(base))) return true;
  }
  return false;
}
