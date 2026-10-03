const { spawnSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const repoRoot = 'C:/Proyectos/ai-native';
const dir = mkdtempSync(join(tmpdir(), 'ai-native-gw-call-'));
mkdirSync(dir, { recursive: true });

const audit = join(dir, 'audit.jsonl').replace(/\\/g, '/');
const gatewayArgs = [
  repoRoot + '/runtime/mcp-gateway/server.mjs', '--profile', 'evidence', '--role', 'builder',
  '--catalog', repoRoot + '/evaluation/fixtures/mcp/catalog.json', '--profile-dir', repoRoot + '/evaluation/fixtures/mcp/profiles',
  '--downstream', repoRoot + '/evaluation/fixtures/mcp/downstream.mjs', '--audit', audit,
];

writeFileSync(join(dir, 'opencode.json'), JSON.stringify({
  '$schema': 'https://opencode.ai/config.json',
  mcp: { gw: { type: 'local', enabled: true, command: ['node', ...gatewayArgs] } },
  permission: { gw_notes__lookup: 'allow', gw_writer__insert: 'allow' }
}));

const prompt = 'Call the MCP tool notes__lookup of the MCP server named gw with the argument object {"q":"c5-opencode-lookup-bmrcud"}. Then reply with one line: the first line of the tool result.';
const r = spawnSync('opencode', ['run', prompt], { cwd: dir, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 120000 });

console.log('EXIT CODE:', r.status);
console.log('STDERR:', (r.stderr || '').slice(-2000));
console.log('STDOUT:', (r.stdout || '').slice(-2000));

if (existsSync(audit)) {
  const entries = readFileSync(audit, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
  console.log('AUDIT ENTRIES:', JSON.stringify(entries, null, 2));
}
rmSync(dir, { recursive: true, force: true });