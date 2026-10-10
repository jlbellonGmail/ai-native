// Does a profile command (`productSetupCommand` / `productTestCommand`) depend on a given repository file? Used by `migrate` so
// it never retires a platform-owned file the profile still needs (gap 1). This is deliberately NOT a shell parser, and it does
// not try to enumerate every way a shell can spell a name. It works by ALLOWLIST: a command is analysed only when it is made
// of a small, boring alphabet and runs nothing that could read files on its own; ANYTHING else is "opaque" and then EVERY
// candidate file is treated as referenced (kept). Wrong answers therefore go in exactly one direction: "referenced" for a file
// that is not (a harmless leftover), never "not referenced" for one that is. Precise implicit dependencies (`pytest` reading
// `pytest.ini`) belong in the profile's declarative `requiredFiles`; the commands come from the platform, never from a PR.
//
// ANALYSABLE: the whole command uses only   A-Z a-z 0-9  space tab newline  _ . - / = : , ; & | < > # " ' ( )
//   and a path counts as referenced when it appears:
//   - as a word, quoted or not:                  pip install -r requirements-dev.txt     "requirements-dev.txt"
//   - glued to an option:                        -rrequirements-dev.txt   --requirement=requirements-dev.txt   -c f   --constraint f
//   - with a relative prefix or as a tail:       ./requirements-dev.txt   sub/requirements-dev.txt   ../requirements-dev.txt
//   - after redirections, subshells, comments and separators:   >f  (pip -r f)  # f  ; & | ,
//   - in any letter case (case-insensitive file systems; keeping a file is the safe error);
//   - as a directory that contains it:           pytest tests   ->   tests/test_x.py   (a lone `.` is the project root, not a reference)
// NOT a reference: a different file that merely contains the name (`requirements-dev.txt.bak`, `my-requirements-dev.txt`).
//
// OPAQUE (=> everything is kept): any other character (so `$ % ^ ! ~ @ + * ? [ ] { } \` backtick, non-ASCII: variable and
//   cmd.exe expansion, globs and extglobs, escapes, Windows paths, command/process substitution, response files, ANSI-C quoting,
//   computed names), quotes in the middle of a word (`requirements-"dev".txt`, `d''ev`), `eval`, `sh|bash|zsh|dash -c`, `xargs`,
//   interpreter code strings (`python -c`, `node -e`, `pwsh -Command`, `cmd /c`), task runners (`make`, `tox`, `npm`, …), and
//   running a script that can read anything (`*.sh`, `*.ps1`, `*.bat`, `*.cmd`, `python x.py`, `node x.js`).

const ALPHABET = /^[A-Za-z0-9 \t\r\n_.\-/=:,;&|<>#"'()]*$/;
const OPAQUE = [
  /[<>]\(/, // process substitution: both characters are in the alphabet, the combination is not analysable
  /[A-Za-z0-9_.\-/]["']+[A-Za-z0-9_.\-/]/, // a quote in the middle of a word splits a name: r"equirements-dev.txt", d''ev
  /(^|[\s;&|(])eval(\s|$)/,
  /(^|[\s;&|(])(?:ba|z|da|k)?sh\s+(?:-[A-Za-z]*\s+)*-[A-Za-z]*c(\s|$)/,
  /(^|[\s;&|(])xargs(\s|$)/,
  /(^|[\s;&|(])(?:python[\d.]*|py|node|deno|bun|ruby|perl|php|pwsh|powershell|cmd)(?:\.exe)?\s+(?:-{1,2}[A-Za-z]+\s+)*(?:-c|-e|-p|-Command|-EncodedCommand|\/c|\/k)(\s|$)/i, // an interpreter given code: only flags may sit between (so `python -m pip install -c f` is NOT matched)
  /(^|[\s;&|(])(?:make|gmake|just|tox|nox|npm|npx|pnpm|yarn|poetry|pipenv|uv|invoke|task|rake|gradle|mvn|bash|sh|zsh|dash|ksh)(\s|$)/, // runners and shells: what they execute is outside this command
  /\.(?:sh|bash|ps1|bat|cmd)(?![A-Za-z0-9_-])/i, // a script
  /(^|[\s;&|(])(?:python[\d.]*|py|node|deno|bun|ruby|perl)(?:\.exe)?\s+(?:-[\w-]+\s+)*[^\s-][^\s]*\.(?:py|js|mjs|cjs|rb|pl)(?![A-Za-z0-9_-])/i, // runs a script file
];

/** True when the command cannot be analysed with certainty (see OPAQUE above). */
export const commandIsOpaque = (command) => typeof command === "string" && (!ALPHABET.test(command) || OPAQUE.some((re) => re.test(command)));

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// `-r f`, `-rf`, `--requirement=f`, `-c f`, `--constraint f`: pip's option forms, split so the path is a separate word
const splitOptions = (command) => command.replace(/(^|\s)(-r|--requirement(?:=|\s+)|-c|--constraint(?:=|\s+))\s*/g, "$1$2 ");

/** Does `command` depend on `path` (a repository-relative file path)? Conservative: see the header. */
export function referencesPath(command, path) {
  if (typeof command !== "string" || typeof path !== "string" || !path) return false;
  if (commandIsOpaque(command)) return true;
  const text = splitOptions(command);
  // literal occurrence of the path (or its tail), bounded so that a longer file name does not match
  const literal = new RegExp(`(^|[^A-Za-z0-9_.-])${escapeRe(path)}(?![A-Za-z0-9_-]|\\.[A-Za-z0-9])`, "i");
  if (literal.test(text)) return true;
  // a directory argument that contains the file (`pytest tests` -> tests/test_x.py); `.` alone is the project root, not a reference
  const lower = path.toLowerCase();
  for (const raw of text.split(/[\s"'`;&|()<>=,]+/)) {
    const dir = raw.replace(/^(\.\/)+/, "").replace(/\/+$/, "").toLowerCase();
    if (dir && dir !== "." && lower.startsWith(`${dir}/`)) return true;
  }
  return false;
}
