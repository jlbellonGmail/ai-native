import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { checkSources, checkProject, importsOf } from "./architecture.mjs";

const HEX = {
  schemaVersion: 1,
  layers: {
    domain: { paths: ["src/domain"], mayDependOn: [], forbiddenImports: ["fs", "pg", "express", "axios"] },
    application: { paths: ["src/application"], mayDependOn: ["domain"] },
    infrastructure: { paths: ["src/infrastructure"], mayDependOn: ["application", "domain"] },
    interfaces: { paths: ["src/interfaces"], mayDependOn: ["application", "domain"] },
  },
};

const rules = (v) => v.map((x) => x.rule);

test("a hexagonal layout with dependencies pointing to the domain passes", () => {
  const v = checkSources(HEX, {
    "src/domain/order.js": "export const total = (items) => items.length;\n",
    "src/application/place-order.js": "import { total } from '../domain/order.js';\n",
    "src/infrastructure/sql-orders.js": "import { total } from '../domain/order.js';\nimport pg from 'pg';\n",
    "src/interfaces/http.js": "import { placeOrder } from '../application/place-order.js';\n",
  });
  assert.deepEqual(v, []);
});

test("domain depending on infrastructure, or on a DB/web/fs package, is rejected", () => {
  const v = checkSources(HEX, {
    "src/domain/order.js": "import { save } from '../infrastructure/sql-orders.js';\nimport pg from 'pg';\nimport { readFileSync } from 'node:fs';\n",
    "src/infrastructure/sql-orders.js": "export const save = () => {};\n",
  });
  assert.deepEqual(rules(v).sort(), ["dependency-direction", "forbidden-import", "forbidden-import"]);
});

test("interfaces must not reach infrastructure (no SQL in the UI), application must not reach interfaces", () => {
  const v = checkSources(HEX, {
    "src/interfaces/ui.js": "import { query } from '../infrastructure/db.js';\n",
    "src/application/use.js": "import { render } from '../interfaces/ui.js';\n",
    "src/infrastructure/db.js": "",
  });
  assert.deepEqual(v.map((x) => x.file), ["src/interfaces/ui.js:1", "src/application/use.js:1"]);
});

test("Python imports are mapped too (absolute and relative)", () => {
  const py = { schemaVersion: 1, layers: { domain: { paths: ["app/domain"], mayDependOn: [], forbiddenImports: ["sqlalchemy"] }, infra: { paths: ["app/infra"], mayDependOn: ["domain"] } } };
  const v = checkSources(py, {
    "app/domain/order.py": "import sqlalchemy\nfrom app.infra import repo\nfrom ..infra import other\n",
    "app/infra/repo.py": "from app.domain import order\n",
  });
  assert.deepEqual(rules(v).sort(), ["dependency-direction", "dependency-direction", "forbidden-import"]);
});

test("module B may consume module A only through its public contract", () => {
  const mods = { schemaVersion: 1, layers: { all: { paths: ["modules"], mayDependOn: ["all"] } }, modules: { a: { path: "modules/a", public: ["modules/a/contract"] }, b: { path: "modules/b", public: ["modules/b/contract"] } } };
  assert.deepEqual(checkSources(mods, { "modules/b/service.js": "import { port } from '../a/contract/index.js';\nimport { x } from './internal.js';\n" }), []);
  const v = checkSources(mods, { "modules/b/service.js": "import { secret } from '../a/internal/table.js';\n" });
  assert.deepEqual(rules(v), ["module-boundary"]);
  assert.match(v[0].message, /only through its public contract/);
});

test("an invalid contract or an unknown layer reference fails closed", () => {
  assert.equal(checkSources({ schemaVersion: 1 }, {})[0].rule, "contract");
  const bad = { schemaVersion: 1, layers: { a: { paths: ["a"], mayDependOn: ["ghost"] } } };
  assert.match(checkSources(bad, {})[0].message, /unknown layer ghost/);
});

test("import extraction covers import/require/dynamic import/export-from", () => {
  const specs = importsOf("x.ts", "import a from 'a';\nconst b = require('b');\nconst c = await import('c');\nexport * from './d';\nimport './e';\n").map((i) => i.spec);
  assert.deepEqual(specs, ["a", "b", "c", "./d", "./e"]);
});

function write(root, files) {
  for (const [p, c] of Object.entries(files)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), c);
  }
}

test("E2E stack change: swapping the storage adapter does not touch the domain and keeps domain tests green", async () => {
  const root = mkdtempSync(join(tmpdir(), "hex-"));
  write(root, {
    "package.json": '{"type":"module"}',
    "src/domain/ports.js": "export const assertStorage = (s) => { for (const m of ['save','load']) if (typeof s[m] !== 'function') throw new Error('storage port: ' + m); return s; };\n",
    "src/application/notes.js": "import { assertStorage } from '../domain/ports.js';\nexport const makeNotes = (storage) => { assertStorage(storage); return { add: async (t) => storage.save(t.trim()), all: async () => storage.load() }; };\n",
    "src/infrastructure/storage-a.js": "export const storageA = () => { const m = []; return { save: async (t) => { m.push(t); return t; }, load: async () => [...m] }; };\n",
    "src/infrastructure/storage-b.js": "import { writeFileSync, readFileSync, existsSync } from 'node:fs';\nexport const storageB = (file) => ({ save: async (t) => { const a = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []; a.push(t); writeFileSync(file, JSON.stringify(a)); return t; }, load: async () => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []) });\n",
  });
  assert.deepEqual(checkProject(root, HEX), []);
  const domainBefore = readFileSync(join(root, "src/domain/ports.js"), "utf8");
  const appBefore = readFileSync(join(root, "src/application/notes.js"), "utf8");
  const load = (p) => import(pathToFileURL(join(root, p)).href);
  const { makeNotes } = await load("src/application/notes.js");
  const { storageA } = await load("src/infrastructure/storage-a.js");
  const { storageB } = await load("src/infrastructure/storage-b.js");
  for (const storage of [storageA(), storageB(join(root, "notes.json"))]) {
    const notes = makeNotes(storage);
    await notes.add("  hello ");
    assert.deepEqual(await notes.all(), ["hello"]);
  }
  assert.equal(readFileSync(join(root, "src/domain/ports.js"), "utf8"), domainBefore);
  assert.equal(readFileSync(join(root, "src/application/notes.js"), "utf8"), appBefore);
  // and the rule still catches the shortcut a hurried change would take
  write(root, { "src/domain/ports.js": domainBefore + "import { storageB } from '../infrastructure/storage-b.js';\n" });
  assert.deepEqual(rules(checkProject(root, HEX)), ["dependency-direction"]);
});

test("review fixes: python `from .. import x`, public entry with extension, backslash keys", () => {
  const py = { schemaVersion: 1, layers: { domain: { paths: ["app/domain"], mayDependOn: [] }, infra: { paths: ["app/infra"], mayDependOn: ["domain"] } } };
  assert.deepEqual(rules(checkSources(py, { "app/domain/o.py": "from .. import infra\n" })), ["dependency-direction"]);
  const mods = { schemaVersion: 1, layers: { all: { paths: ["src"], mayDependOn: ["all"] } }, modules: { billing: { path: "src/billing", public: ["src/billing/index.ts"] }, web: { path: "src/web", public: ["src/web/index.ts"] } } };
  assert.deepEqual(checkSources(mods, { "src/web/page.ts": "import { x } from '../billing/index';\n" }), []);
  assert.deepEqual(rules(checkSources(HEX, { [["src", "domain", "o.js"].join(String.fromCharCode(92))]: "import { s } from '../infrastructure/s.js';\n" })), ["dependency-direction"]);
});

const specs = (file, text) => importsOf(file, text).map((i) => i.spec);

test("F-13 Python: import, from-import, parenthesized and multi-line lists, continuations, aliases, semicolons", () => {
  assert.deepEqual(specs("a.py", "import os\nimport a.b, c as d\n"), ["os", "a.b", "c"]);
  assert.deepEqual(specs("a.py", "from x.y import z\n"), ["x.y.z"]);
  assert.deepEqual(specs("a.py", "from x import (a, b)\n"), ["x.a", "x.b"]);
  assert.deepEqual(specs("a.py", "from x import (\n    a,\n    b as bb,  # note\n    c,\n)\n"), ["x.a", "x.b", "x.c"]);
  assert.deepEqual(specs("a.py", `from x import a, ${String.fromCharCode(92)}\n    b\n`), ["x.a", "x.b"]);
  assert.deepEqual(specs("a.py", "import a; import b\n"), ["a", "b"]);
  assert.deepEqual(specs("a.py", "from .. import infra\nfrom .repo import Repo\n"), ["..infra", ".repo.Repo"]);
  assert.deepEqual(specs("a.py", "from x import *\n"), ["x"]);
});

test("F-13 Python negatives: comments, strings and docstrings are not imports", () => {
  assert.deepEqual(specs("a.py", "# import secret\nx = 'import nope'\n"), []);
  assert.deepEqual(specs("a.py", '"""\nimport hidden\nfrom a import b\n"""\nimport real\n'), ["real"]);
  assert.deepEqual(specs("a.py", "def f():\n    return important_value\n"), []);
});

test("F-13 JS/TS: import-from (single and multi-line), type imports, export-from, side-effect, require, dynamic import", () => {
  assert.deepEqual(specs("a.ts", "import a from 'a';\nimport { b, c } from \"b\";\nimport * as d from 'd';\n"), ["a", "b", "d"]);
  assert.deepEqual(specs("a.ts", "import {\n  x,\n  y,\n} from '../multi';\n"), ["../multi"]);
  assert.deepEqual(specs("a.ts", "import type { T } from './t';\nexport * from './e1';\nexport { z } from './e2';\n"), ["./t", "./e1", "./e2"]);
  assert.deepEqual(specs("a.js", "import './side';\nconst r = require('r');\nconst m = await import('m');\n"), ["./side", "r", "m"]);
  assert.deepEqual(specs("a.js", "import a from 'a'\nimport b from 'b'\n"), ["a", "b"]);
});

test("F-13 JS/TS negatives: comments, strings, templates and computed imports are not static imports", () => {
  assert.deepEqual(specs("a.js", "// import x from 'nope'\n/* require('nope2') */\nconst s = \"import y from 'nope3'\";\nconst t = `import('nope4')`;\n"), []);
  assert.deepEqual(specs("a.js", "const name = 'x';\nawait import(name);\nrequire(`./${name}`);\n"), []);
  assert.deepEqual(specs("a.js", "export const answer = 42;\nexport function f() {}\n"), []);
});

test("F-13 detected imports feed the rules: multi-line Python import of a forbidden package and of an upper layer", () => {
  const py = { schemaVersion: 1, layers: { domain: { paths: ["app/domain"], mayDependOn: [], forbiddenImports: ["sqlalchemy"] }, infra: { paths: ["app/infra"], mayDependOn: ["domain"] } } };
  const v = checkSources(py, { "app/domain/o.py": "from sqlalchemy import (\n    Column,\n    Integer,\n)\nfrom app.infra import (\n    repo,\n)\n" });
  assert.deepEqual(rules(v).sort(), ["dependency-direction", "forbidden-import", "forbidden-import"]);
  const clean = checkSources(py, { "app/domain/o.py": '"""from sqlalchemy import Column"""\n# from app.infra import repo\nx = 1\n' });
  assert.deepEqual(clean, []);
});

test("F-13 scanner stays linear on hostile input", () => {
  const big = "import " + "a, ".repeat(20000) + "z\n" + "export const x = '" + "from ".repeat(20000) + "';\n" + "import {" + " ".repeat(50000) + "\n";
  const t = Date.now();
  importsOf("big.py", big);
  importsOf("big.ts", big);
  assert.ok(Date.now() - t < 3000, "import scanning must not backtrack");
});

test("review: a regex literal or nested template before an import does not hide it", () => {
  assert.deepEqual(specs("a.js", `const r = /"/; import x from "./a";\n`), ["./a"]);
  assert.deepEqual(specs("a.js", `const r = /[/]"/g;\nimport y from './b';\n`), ["./b"]);
  assert.deepEqual(specs("a.js", `const r = /'/g; const z = require('./c');\n`), ["./c"]);
  assert.deepEqual(specs("a.js", "const t = `${\"`\"} x`;\nimport d from './d';\n"), ["./d"]);
  assert.deepEqual(specs("a.js", "const t = `${require('./e')}`;\n"), ["./e"]);
  assert.deepEqual(specs("a.js", "const m = await import(`./g`);\n"), ["./g"]);
  assert.deepEqual(specs("a.js", "const x = a / b; const y = c / d;\nimport k from './k';\n"), ["./k"]);
  assert.deepEqual(specs("a.js", "return /x/.test(s); import q from './q';\n"), ["./q"]);
  assert.deepEqual(specs("a.js", "const m = await import(`./${name}`);\n"), []);
});

test("review: an unterminated template or block comment falls back to over-reporting, never to hiding", () => {
  assert.deepEqual(specs("a.js", "import a from './a';\nconst t = `never closed\n"), ["./a"]);
  assert.deepEqual(specs("a.js", "/* never closed\nimport b from './b';\n"), ["./b"]);
});

test("review: Python imports after a same-line colon, CRLF input", () => {
  assert.deepEqual(specs("a.py", "try:\n    import fast\nexcept ImportError:\n    import slow\nif x: import lazy\nelse: from a import b\n"), ["fast", "slow", "lazy", "a.b"]);
  assert.deepEqual(specs("a.py", "from x import (\r\n    a,\r\n    b,\r\n)\r\n"), ["x.a", "x.b"]);
  assert.deepEqual(specs("a.py", "d = {'k': 1}\nx = y if z else w\n"), []);
});

test("review: scanning is near-linear (20000 imports, hostile repeats) and huge sources fail closed", () => {
  const many = Array.from({ length: 20000 }, (_, i) => `import m${i} from './m${i}.js';`).join("\n");
  let t = Date.now();
  assert.equal(importsOf("big.js", many).length, 20000);
  assert.ok(Date.now() - t < 1500, `20000 imports took ${Date.now() - t} ms`);
  t = Date.now();
  importsOf("hostile.js", "import ".repeat(300000));
  assert.ok(Date.now() - t < 3000, `hostile repeat took ${Date.now() - t} ms`);
  const v = checkSources(HEX, { "src/domain/big.js": "x".repeat(2 * 1024 * 1024 + 1) });
  assert.deepEqual(rules(v), ["unanalyzable"]);
});
