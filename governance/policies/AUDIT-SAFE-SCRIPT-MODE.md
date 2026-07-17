# Audit-Safe Script Mode

P0-T2 implements Audit-Safe Script Mode as a governance-owned execution gate for
factory validation and inspection commands.

The mode is intentionally direct:

```text
node scripts/audit-safe-script-mode.mjs inspect --repo <repo>
node scripts/audit-safe-script-mode.mjs inspect --repo <repo> --command "<command>"
```

It does not add package-level wrappers and must not be invoked through `pnpm`,
`npm`, lifecycle hooks, setup, bootstrap or install scripts.

## Default Policy

Audit-Safe Script Mode classifies commands before execution and blocks unsafe
surfaces by default.

Blocked by default:

* `INSTALL_OR_LIFECYCLE`
* `PACKAGE_LEVEL`
* `NETWORK_OR_SECRET`
* `DESTRUCTIVE`
* `UNKNOWN`

Permitted without target execution:

* static package script inventory
* command classification
* direct evidence report writing through `--evidence`

Permitted for execution only when explicitly requested:

* `STATIC_ONLY`
* `DIRECT_VALIDATOR`
* non-package direct Node commands classified as controlled and side-effect-free

Execution requires:

```text
--execute --expected-side-effects none
```

The command is executed with `shell: false`. If the repository working tree
changes while expected side effects are `none`, the result is `FAIL`.

`--allow` values are recorded as audit metadata. This v1 implementation does
not use `--allow` as a bypass for package-level, lifecycle/install, destructive,
network/secret or unknown execution. Those classes remain blocked until a later
approved task defines isolated side-effect handling for them.

## Repository Compatibility

The implementation supports the current factory repository layout:

* root/governance
* `ai-foundation`
* `ai-knowledge`
* `ai-template`

`ai-knowledge` currently has no root `package.json`; package inventory is
therefore reported as `NOT_APPLICABLE` for that repository.

## Evidence Fields

Reports include:

* schema version and task id
* repository path
* baseline git branch, HEAD, status, diff stat and diff check
* package script inventory where applicable
* command classification where a command is supplied
* execution result where execution is requested
* final git branch, HEAD, status, diff stat and diff check
* cleanup status

## Non-Goals

This policy does not implement P0-T2 as a product runtime feature, does not
modify productive package scripts, does not open H9, does not create
`ENTERPRISE-10-10-V2`, and does not start the first real application.
