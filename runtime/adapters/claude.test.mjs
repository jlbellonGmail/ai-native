import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildClaudeBridge, buildClaudeMcpJson, buildClaudeAgentFile, CLAUDE_HOOK_PATH_RULE } from "./claude.mjs";
import { buildToolFiles } from "./sync.mjs";
import { loadAgents, loadRolePrompt } from "./sources.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

test("buildClaudeBridge is the @AGENTS.md bridge, nothing else", () => {
  assert.equal(buildClaudeBridge(), "@AGENTS.md\n");
});

test("CLAUDE_HOOK_PATH_RULE documents $CLAUDE_PROJECT_DIR (M2.3 finding #1)", () => {
  assert.equal(CLAUDE_HOOK_PATH_RULE, "$CLAUDE_PROJECT_DIR");
});

test("buildClaudeMcpJson is empty mcpServers for an empty catalog", () => {
  assert.equal(buildClaudeMcpJson({ servers: {} }), '{\n  "mcpServers": {}\n}\n');
});

test("buildClaudeMcpJson converts a local server, sorted by name", () => {
  const catalog = { servers: { zeta: { type: "local", command: "zeta-cmd" }, alpha: { type: "local", command: "alpha-cmd", args: ["--x"] } } };
  const result = JSON.parse(buildClaudeMcpJson(catalog));
  assert.deepEqual(Object.keys(result.mcpServers), ["alpha", "zeta"]);
  assert.deepEqual(result.mcpServers.alpha, { command: "alpha-cmd", args: ["--x"] });
});

test("buildClaudeMcpJson converts a remote server to type=http", () => {
  const catalog = { servers: { docs: { type: "remote", url: "https://example.invalid/mcp", headers: { "X-A": "1" } } } };
  const result = JSON.parse(buildClaudeMcpJson(catalog));
  assert.deepEqual(result.mcpServers.docs, { type: "http", url: "https://example.invalid/mcp", headers: { "X-A": "1" } });
});

test("buildClaudeMcpJson throws on an unsupported server type", () => {
  assert.throws(() => buildClaudeMcpJson({ servers: { x: { type: "weird" } } }), /unsupported MCP server type/);
});

test("buildClaudeAgentFile renders frontmatter + prompt body", () => {
  const role = { description: "A role.", claude: { tools: ["Read", "Bash"], model: "sonnet", effort: "high" } };
  const content = buildClaudeAgentFile("builder", role, "Prompt body.", "GENERATED notice");
  assert.match(content, /^---\nname: builder\n/);
  assert.match(content, /tools: Read, Bash/);
  assert.match(content, /<!-- GENERATED notice -->/);
  assert.match(content, /Prompt body\.\n$/);
});

// v3.4.1: `description` was interpolated as a plain YAML scalar, so the reviewer's "lectura: verifica" (323dd4c) made
// its frontmatter invalid YAML. A JSON string is a valid YAML double-quoted scalar: the frontmatter must keep exactly
// five one-line fields and `description` must come back byte for byte. (Node has no YAML parser; the whole document
// was also parsed with PyYAML for the release evidence, governance/versioning/V3.4.1-PATCH.md.)
function frontmatterFields(content) {
  const block = /^---\n([\s\S]*?)\n---\n/.exec(content);
  assert.ok(block, "frontmatter block");
  const lines = block[1].split("\n");
  assert.deepEqual(lines.map((l) => l.slice(0, l.indexOf(":"))), ["name", "description", "tools", "model", "effort"]);
  const quoted = /^description: (".*")$/.exec(lines[1]);
  assert.ok(quoted, `description is not a double-quoted scalar: ${lines[1]}`);
  // YAML 1.1 printable characters minus its line breaks (NEL, LS, PS), from the spec rather than from the generator
  assert.doesNotMatch(quoted[1], /[^\u0020-\u007e\u00a0-\u2027\u202a-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/u, "raw characters that YAML 1.1 folds or rejects");
  return { lines, description: JSON.parse(quoted[1]) };
}

for (const description of [
  "Revisor de solo lectura: verifica intención",
  "uses # inside # and a trailing #",
  'double "quotes", single \'quotes\' and a back\\slash',
  "line one\nline two\r\n\ttabbed",
  "- & * ! | > % @ ` { } [ ] , ? leading YAML indicators",
  ": starts with a colon",
  "DEL \u007f NEL \u0085 LS \u2028 PS \u2029 FFFE \ufffe FFFF \uffff kept",
]) {
  test(`buildClaudeAgentFile keeps a YAML-sensitive description intact: ${JSON.stringify(description)}`, () => {
    const role = { description, claude: { tools: ["Read", "Grep"], model: "sonnet", effort: "high" } };
    const content = buildClaudeAgentFile("reviewer", role, "Prompt body.", "GENERATED notice");
    const { lines, description: parsed } = frontmatterFields(content);
    assert.equal(parsed, description);
    assert.deepEqual([lines[0], ...lines.slice(2)], ["name: reviewer", "tools: Read, Grep", "model: sonnet", "effort: high"]);
    assert.match(content, /\n---\n\n<!-- GENERATED notice -->\n\nPrompt body\.\n$/);
  });
}

test("the projected planner, builder and reviewer keep their core/agents.json fields exactly", () => {
  const agents = loadAgents(repoRoot);
  const files = buildToolFiles(repoRoot, { tools: ["claude"] });
  assert.deepEqual(Object.keys(agents.roles).sort(), ["builder", "planner", "reviewer"]);
  assert.match(agents.roles.reviewer.description, /: /, "the real reviewer description still carries the case that broke");
  for (const [name, role] of Object.entries(agents.roles)) {
    const content = files[`.claude/agents/${name}.md`];
    const { lines, description } = frontmatterFields(content);
    assert.equal(description, role.description, name);
    assert.deepEqual([lines[0], ...lines.slice(2)], [`name: ${name}`, `tools: ${role.claude.tools.join(", ")}`, `model: ${role.claude.model}`, `effort: ${role.claude.effort}`]);
    assert.ok(content.endsWith(`${loadRolePrompt(repoRoot, role)}\n`), `${name} keeps its prompt body`);
  }
});
