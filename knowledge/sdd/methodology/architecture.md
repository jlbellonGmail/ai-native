# Architecture: hexagonal, modules, contracts

Stack is replaceable; domain is durable. Business rules must survive a change of database, ORM, web framework, UI, cloud, queue, storage or AI provider.

```text
interfaces -> application -> domain <- (ports) <- infrastructure -> DB / APIs / services
```

## Layers

| Layer | Holds | May depend on |
|---|---|---|
| domain | entities, rules, ports (contracts it needs) | nothing |
| application | use cases that orchestrate the domain | domain |
| infrastructure | adapters that implement ports (DB, HTTP clients, files, queues) | application, domain |
| interfaces | controllers, UI, CLI, jobs: translate input and output | application, domain |

Data (storage engine, schema, migrations) is an external responsibility reached through a port.

## Dependency rule

Dependencies point toward the domain, never away. The domain does not know DB, web framework, UI, cloud provider, ORM, filesystem or external APIs; it knows contracts (ports). Avoid: SQL in the UI, business rules in controllers, the domain calling HTTP, the domain importing an ORM, a UI component reading the DB.

## Modules

Each module has its own responsibility, publishes a contract and consumes other modules only through their contracts. Prefer API contracts, events, schemas, ports and interfaces. Avoid reading another module's tables, importing its private code or depending on its internals. A system is a composition of independent modules (core, common-*, vertical-*), not an accidental monolith.

## Contract first

Integration between modules is defined by the contract before the code: versioned, validated, tested, backward compatible whenever possible. A breaking change is a new version, not an edit.

## Enforcing it (optional, per project)

A project declares its layers and modules in an `architecture.json` (schema `contracts/architecture.schema.json`; paths are the project's own, no technology is fixed):

```json
{ "schemaVersion": 1,
  "layers": { "domain": { "paths": ["src/domain"], "mayDependOn": [], "forbiddenImports": ["pg", "express"] },
              "application": { "paths": ["src/application"], "mayDependOn": ["domain"] } },
  "modules": { "billing": { "path": "src/billing", "public": ["src/billing/contract"] } } }
```

Check: `node runtime/policy/architecture.mjs --project .` (PASS, or FAIL listing each violation; no contract means NOT_APPLICABLE). Without a contract, the same rules apply as review criteria.

What the check reads (best effort, not a proof): static imports from code, never from comments, strings or regex literals; a source over 2 MB is reported as `unanalyzable` instead of being skipped. JS/TS: `import ... from` (also multi-line, `import type`, `export ... from`), `import "x"`, `require("x")`, `import("x")`. Python: `import a.b, c`, `from a import b`, `from a import (b, c)` (multi-line, continuations, `;`). What it does not resolve: computed imports (variables, template strings), aliases (`@/x`, tsconfig `paths`), `__import__`/`importlib`; files outside every declared layer are not checked; `public` paths are matched by prefix, ignoring file extension. Run in the consumer L3 gate (`architecture`, contract read from the base branch) or by hand.

## Changing stack

Swap the adapter, keep the port: the domain and the use cases do not change, and the same tests run against both adapters. If a stack change forces a domain edit, the boundary was wrong; fix the boundary.
