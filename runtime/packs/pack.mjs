// Domain pack contract (M4.7, GOV-07; PAR-PACK-RULES). A pack is a
// consumer-selected bundle of DOMAIN rules, skills, MCP profiles and
// testing profiles, owned by its own repo (contracts/pack.schema.json) --
// ai-native stays agnostic of any domain. Replaces TEMPLATE v2.0.5's
// per-project `.claude/rules/` + "Reglas de dominio" section of AGENTS.md
// that every consumer copied by hand.
//
// The one invariant: a pack ADDS context, it never widens authority.
//   - rules are markdown context; a rule that tries to override the
//     platform contract/policy is rejected (advisory text screen), and
//     structurally a pack has no field that can carry a permission, a
//     security-policy override or an MCP server registration;
//   - skills must not reuse a canonical platform skill id;
//   - MCP profiles may only reference servers ALREADY registered in the
//     platform catalog (a pack cannot register a server: default deny);
//   - every pack file stays inside the pack root (no traversal/symlinks);
//   - two packs providing the same rule/skill/profile id conflict, never
//     silently shadow each other;
//   - the lock pins each pack by commit + content digest, verified here.
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../lib/schema-lite.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const packSchema = JSON.parse(readFileSync(join(here, "..", "..", "contracts", "pack.schema.json"), "utf8"));

const ID_RE = /^[a-z][a-z0-9-]*$/;
// Text that tries to take authority away from the platform. Advisory: the
// structural guarantees above are what actually bound a pack.
const AUTHORITY_OVERRIDES = [
  /\b(ignore|disregard|override|supersede|replace)\b[^.\n]{0,40}\b(AGENTS\.md|security[- ]policy|platform (rules|contract)|constitution)\b/i,
  /\b(disable|skip|bypass|remove)\b[^.\n]{0,30}\b(review|hitl|human approval|policy|gate|trust[- ]gate|merge[- ]gate)\b/i,
  /\b(auto[- ]?merge|merge without)\b/i,
  /\bgrant(s|ed)?\b[^.\n]{0,30}\b(permission|capability|EXTERNAL_WRITE|SECRET_ACCESS|DESTRUCTIVE|MERGE|ADMIN)\b/i,
];

function walk(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`symlink in pack: ${relative(base, full)}`);
    if (entry.isDirectory()) walk(full, base, out);
    else out.push(relative(base, full).split(sep).join("/"));
  }
  return out.sort();
}

/** Deterministic content digest: path-sorted `path\0sha256(file)\n` records. */
export function packDigest(packRoot) {
  const lines = walk(packRoot).map((p) => `${p}\0${createHash("sha256").update(readFileSync(join(packRoot, p))).digest("hex")}\n`);
  return `sha256:${createHash("sha256").update(lines.join("")).digest("hex")}`;
}

function parseVersion(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([\w.]+))?$/.exec(v ?? "");
  return m ? { n: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ?? null } : null;
}
function cmp(a, b) {
  for (let i = 0; i < 3; i += 1) if (a.n[i] !== b.n[i]) return a.n[i] < b.n[i] ? -1 : 1;
  if (a.pre === b.pre) return 0;
  if (a.pre === null) return 1;
  if (b.pre === null) return -1;
  return a.pre < b.pre ? -1 : 1;
}

/** Space-separated comparators (>=,>,<=,<,=) plus ^ and ~; all must hold. Unparseable => false (fail-closed). */
export function satisfiesRange(version, range) {
  const v = parseVersion(version);
  if (!v || typeof range !== "string" || !range.trim()) return false;
  for (const token of range.trim().split(/\s+/)) {
    const m = /^(\^|~|>=|<=|>|<|=)?(v?\d+\.\d+\.\d+(?:-[\w.]+)?)$/.exec(token);
    const base = m && parseVersion(m[2]);
    if (!base) return false;
    const op = m[1] ?? "=";
    const c = cmp(v, base);
    let ok;
    if (op === "^") {
      const upper = { n: base.n[0] > 0 ? [base.n[0] + 1, 0, 0] : base.n[1] > 0 ? [0, base.n[1] + 1, 0] : [0, 0, base.n[2] + 1], pre: null };
      ok = c >= 0 && cmp(v, upper) < 0;
    } else if (op === "~") {
      ok = c >= 0 && cmp(v, { n: [base.n[0], base.n[1] + 1, 0], pre: null }) < 0;
    } else {
      ok = { ">=": c >= 0, "<=": c <= 0, ">": c > 0, "<": c < 0, "=": c === 0 }[op];
    }
    if (!ok) return false;
  }
  return true;
}

function inside(root, rel) {
  const full = resolve(root, rel);
  return full === resolve(root) || full.startsWith(resolve(root) + sep) ? full : null;
}

/**
 * Validates one pack directory (the `ai-pack/` folder: pack.json at its root).
 * @param {{platformCatalog?: object, canonicalSkills?: string[]}} ctx
 */
export function validatePack(packRoot, { platformCatalog = { servers: {} }, canonicalSkills = [] } = {}) {
  const errors = [];
  const manifestPath = join(packRoot, "pack.json");
  if (!existsSync(manifestPath)) return { errors: ["pack.json not found"] };
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    return { errors: [`pack.json is not valid JSON: ${error.message}`] };
  }
  errors.push(...validate(manifest, packSchema).map((e) => `pack.json: ${e}`));
  if (errors.length) return { errors };

  try {
    walk(packRoot);
  } catch (error) {
    return { errors: [error.message] };
  }

  const provided = { rules: [], skills: [], mcpProfiles: [], testingProfiles: manifest.provides.testingProfiles ?? [] };
  const fileFor = (kind, id) => ({ rules: `rules/${id}.md`, skills: `skills/${id}/SKILL.md`, mcpProfiles: `mcp-profiles/${id}.json` })[kind];

  for (const kind of ["rules", "skills", "mcpProfiles"]) {
    for (const id of manifest.provides[kind] ?? []) {
      if (!ID_RE.test(id)) { errors.push(`${kind}: invalid id ${JSON.stringify(id)}`); continue; }
      const rel = fileFor(kind, id);
      const full = inside(packRoot, rel);
      if (!full || !existsSync(full) || !lstatSync(full).isFile()) { errors.push(`${kind}: ${id} declared but ${rel} is missing`); continue; }
      provided[kind].push(id);
      const text = readFileSync(full, "utf8");
      if (kind === "rules") {
        if (!text.trim()) errors.push(`rule ${id}: empty`);
        for (const re of AUTHORITY_OVERRIDES) {
          if (re.test(text)) { errors.push(`rule ${id}: tries to override platform authority (matched ${re})`); break; }
        }
      }
      if (kind === "skills") {
        const name = /^---\r?\nname:\s*(.+?)\r?\n/.exec(text)?.[1]?.trim();
        if (name !== id) errors.push(`skill ${id}: frontmatter name is ${name ?? "missing"}`);
        if (canonicalSkills.includes(id)) errors.push(`skill ${id}: shadows a canonical platform skill`);
      }
      if (kind === "mcpProfiles") {
        let profile;
        try {
          profile = JSON.parse(text);
        } catch {
          errors.push(`mcp profile ${id}: not valid JSON`);
          continue;
        }
        if (profile.schemaVersion !== 1 || profile.id !== id || !Array.isArray(profile.servers)) errors.push(`mcp profile ${id}: invalid shape`);
        else for (const s of profile.servers) {
          if (!platformCatalog.servers?.[s]) errors.push(`mcp profile ${id}: server ${s} is not registered in the platform catalog (a pack cannot register servers)`);
        }
        if (profile.permissions || profile.overrides || profile.securityPolicy) errors.push(`mcp profile ${id}: carries permission fields; a pack cannot widen authority`);
      }
    }
  }
  // Undeclared files under rules/ and skills/ are drift between manifest and content.
  for (const p of walk(packRoot)) {
    const m = /^(rules)\/([^/]+)\.md$/.exec(p) ?? /^(skills)\/([^/]+)\/SKILL\.md$/.exec(p) ?? /^(mcp-profiles)\/([^/]+)\.json$/.exec(p);
    if (!m) continue;
    const kind = m[1] === "mcp-profiles" ? "mcpProfiles" : m[1];
    if (!(manifest.provides[kind] ?? []).includes(m[2])) errors.push(`${p} exists but is not declared in pack.json provides.${kind}`);
  }
  return { errors, manifest, provided };
}

/**
 * Checks the packs a lock pins: each pack found, digest/commit verified,
 * platformRange satisfied, dependencies present and acyclic, no id
 * conflicts across packs.
 * @param {Array} lockPacks lock.packs
 * @param {Map<string,{root:string}>} available pack id -> checkout dir
 */
export function resolvePacks({ lockPacks, available, platformVersion, platformCatalog, canonicalSkills }) {
  const errors = [];
  const loaded = new Map();
  for (const pin of lockPacks) {
    const entry = available.get(pin.id);
    if (!entry) { errors.push(`pack ${pin.id}: pinned in the lock but not available`); continue; }
    const { errors: packErrors, manifest, provided } = validatePack(entry.root, { platformCatalog, canonicalSkills });
    errors.push(...packErrors.map((e) => `pack ${pin.id}: ${e}`));
    if (!manifest) continue;
    if (manifest.id !== pin.id) errors.push(`pack ${pin.id}: manifest id is ${manifest.id}`);
    if (manifest.repo !== pin.repo) errors.push(`pack ${pin.id}: manifest repo ${manifest.repo} != lock ${pin.repo}`);
    if (manifest.version !== pin.version) errors.push(`pack ${pin.id}: manifest version ${manifest.version} != lock ${pin.version}`);
    const actual = packDigest(entry.root);
    if (actual !== pin.digest) errors.push(`pack ${pin.id}: content digest ${actual} does not match lock ${pin.digest}`);
    if (manifest.platformRange && !satisfiesRange(platformVersion, manifest.platformRange)) {
      errors.push(`pack ${pin.id}: requires platform ${manifest.platformRange}, lock has ${platformVersion}`);
    }
    loaded.set(pin.id, { manifest, provided });
  }
  for (const [id, { manifest }] of loaded) {
    for (const dep of manifest.dependsOn ?? []) {
      const found = loaded.get(dep.id);
      if (!found) errors.push(`pack ${id}: depends on ${dep.id}, which is not pinned in the lock`);
      else if (!satisfiesRange(found.manifest.version, dep.range)) errors.push(`pack ${id}: depends on ${dep.id} ${dep.range}, lock has ${found.manifest.version}`);
    }
  }
  const state = new Map();
  const visit = (id, trail) => {
    if (state.get(id) === 2 || !loaded.has(id)) return;
    if (state.get(id) === 1) { errors.push(`pack dependency cycle: ${[...trail, id].join(" -> ")}`); return; }
    state.set(id, 1);
    for (const dep of loaded.get(id).manifest.dependsOn ?? []) visit(dep.id, [...trail, id]);
    state.set(id, 2);
  };
  for (const id of loaded.keys()) visit(id, []);
  const owner = new Map();
  for (const [id, { provided }] of loaded) {
    for (const kind of ["rules", "skills", "mcpProfiles"]) {
      for (const item of provided[kind]) {
        const key = `${kind}:${item}`;
        if (owner.has(key)) errors.push(`${kind} id ${item} is provided by both ${owner.get(key)} and ${id}`);
        else owner.set(key, id);
      }
    }
  }
  return { errors, loaded };
}
