// N-11 / P-04: the README's "New project" onboarding is the first thing a person runs, so it is tested like code. The fenced blocks of that
// section are extracted and (1) syntax-checked by the real shell parser (bash -n; PowerShell's own parser when pwsh/powershell exists),
// (2) checked against the public interface they must stay compatible with (the asset name, the signer workflow release.yml really uses,
// the subcommands and flags the command really accepts). No general Markdown parser: only the section between its heading and the next one.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8").replace(/\r\n/g, "\n");

/** { lang, body }[] of the fenced blocks under `## New project`. */
export function onboardingBlocks(readme) {
  const start = readme.indexOf("\n## New project\n");
  assert.ok(start >= 0, "README has a '## New project' section");
  const rest = readme.slice(start + 1);
  const end = rest.indexOf("\n## ", 4);
  const section = end < 0 ? rest : rest.slice(0, end);
  return [...section.matchAll(/```(\w*)\n([\s\S]*?)\n```/g)].map((m) => ({ lang: m[1], body: m[2] }));
}

const readme = read("README.md");
const blocks = onboardingBlocks(readme);
const byLang = (lang) => blocks.filter((b) => b.lang === lang);
const tmp = mkdtempSync(join(tmpdir(), "readme-install-"));
process.on("exit", () => rmSync(tmp, { recursive: true, force: true }));

test("the onboarding section has the three blocks a person needs: `ai-native init`, a bash install, a PowerShell install", () => {
  assert.equal(byLang("bash").length, 2, "git clone + init, and the once-per-machine install");
  assert.equal(byLang("powershell").length, 1);
  const first = byLang("bash")[0].body;
  assert.match(first, /^git clone <your-repo>/m);
  assert.match(first, /^ai-native init$/m);
});

test("the bash blocks parse (bash -n) and keep their line continuations intact", () => {
  for (const [i, b] of byLang("bash").entries()) {
    const file = join(tmp, `block-${i}.sh`);
    // placeholders like <your-repo> are prose, not syntax: quote them for the parser only
    writeFileSync(file, b.body.replace(/<[^>\n]+>/g, "placeholder"));
    const r = spawnSync("bash", ["-n", file], { encoding: "utf8" });
    assert.equal(r.status, 0, `bash -n failed for block ${i}: ${r.stderr}`);
    for (const line of b.body.split("\n")) assert.ok(!/\\\s+$/.test(line), `a continuation backslash must be the last character: ${JSON.stringify(line)}`);
  }
});

test("the PowerShell block has no corrupted paths ($HOME.x, lost separators) and parses with PowerShell when available", () => {
  const body = byLang("powershell")[0].body;
  assert.doesNotMatch(body, /\$HOME[A-Za-z0-9.]/, "P-04: $HOME must be followed by a separator or used through Join-Path");
  assert.doesNotMatch(body, /\.ai-native[A-Za-z]/, "P-04: '.ai-native' must be followed by a separator");
  assert.match(body, /Join-Path \$HOME "\.ai-native\/dl"/);
  for (const exe of ["pwsh", "powershell"]) {
    const probe = spawnSync(exe, ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.Major"], { encoding: "utf8" });
    if (probe.status !== 0) continue;
    const file = join(tmp, "block.ps1");
    writeFileSync(file, body);
    const parser = join(tmp, "parse.ps1");
    writeFileSync(parser, ["param($f)", "$e = $null", "[System.Management.Automation.Language.Parser]::ParseFile($f, [ref]$null, [ref]$e) | Out-Null", "if ($e) { $e | ForEach-Object { $_.Message }; exit 1 }", ""].join("\n"));
    const r = spawnSync(exe, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", parser, file], { encoding: "utf8" });
    assert.equal(r.status, 0, `${exe} parser rejected the block: ${r.stdout}${r.stderr}`);
    return;
  }
});

test("the install blocks match the public interface: asset, official repo, the signer workflow release.yml really uses, the `install` subcommand", () => {
  const cli = read("runtime/cli/ai-native.mjs");
  const release = read(".github/workflows/release.yml");
  const official = /OFFICIAL_REPO = "([^"]+)"/.exec(cli)?.[1];
  assert.ok(official);
  const signer = `${official}/.github/workflows/release.yml`;
  assert.match(release, /ai-native-cli\.mjs/, "release.yml publishes the asset the README downloads");
  assert.match(cli, /verifyAttestation[\s\S]*--signer-workflow/);
  assert.match(cli, /command === "install"/);
  for (const b of [...byLang("bash").slice(1), ...byLang("powershell")]) {
    assert.match(b.body, /gh release download --repo \S+ --pattern ai-native-cli\.mjs/);
    assert.ok(b.body.includes(`--repo ${official}`), "the official repository");
    assert.ok(b.body.includes(`--signer-workflow ${signer}`), `the signer workflow must be ${signer}`);
    assert.match(b.body, /gh attestation verify/);
    assert.match(b.body, /ai-native-cli\.mjs["')]* install/, "the last step installs the command");
    // verification comes BEFORE execution
    assert.ok(b.body.indexOf("gh attestation verify") < b.body.search(/node .*install/), "attest before running");
  }
});

test("every `ai-native init` flag the README shows is one the command accepts", () => {
  const cli = read("runtime/cli/ai-native.mjs");
  const accepted = new Set([...cli.matchAll(/"(--[a-z-]+)"/g)].map((m) => m[1]));
  const shown = new Set([...readme.matchAll(/ai-native init[^\n`]*?(--[a-z-]+)/g)].map((m) => m[1]));
  for (const flag of shown) assert.ok(accepted.has(flag), `README shows ${flag} but the command does not accept it`);
});
