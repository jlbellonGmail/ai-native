# Project Bootstrap

## SDD Specification

H2 solves the gap between a validated template repository and a repeatable
project creation path. `create-ai-native-app` materializes a controlled AI-Native
baseline from `ai-template` without manual copy steps.

The generator accepts:

* `--name`: required project name using lowercase letters, numbers and hyphens.
* `--dest`: destination directory. If omitted, the project name is used.
* `--target`: alias for `--dest`.
* `--preset`: optional initial preset. Default is `controlled-mvp`.
* `--dry-run`: prints the generation plan without writing files.

The generator produces:

* README and setup documentation.
* `ai-native.project.json` manifest.
* Base `package.json` with local validation.
* AI configuration and canonical SDD reference.
* App, service, docs and validation directories.
* A generated project validator.

The generated project explicitly follows:

```text
Specify -> Plan -> Implement -> Verify
```

Out of scope for H2:

* Runtime observability wiring.
* Executable testing profile hardening.
* Real evaluation runs.
* Target repository security validation.
* First client project playbook.
* Adoption readiness final audit.

PASS requires the generator to reject invalid inputs, avoid overwriting existing
destinations, create the expected structure, reference SDD H1 and pass local
validation.

## Implementation Plan

Files owned by H2:

* `generators/create-ai-native-app.mjs`
* `generators/create-ai-native-app/create-ai-native-app.contract.json`
* `scaffolds/ai-native-app/files/`
* `scripts/validate-generated-project.mjs`
* `docs/setup/PROJECT_BOOTSTRAP.md`

Validation:

```bash
node scripts/validate-create-ai-native-app.mjs
node generators/create-ai-native-app.mjs --name demo-ai-native --dest <temp>/demo-ai-native
node scripts/validate-generated-project.mjs --target <temp>/demo-ai-native
node <temp>/demo-ai-native/scripts/validate-ai-native-project.mjs
```

Risks:

* Accidental overwrite is prevented by rejecting existing destinations.
* Local-machine coupling is avoided by resolving paths from the current working
  directory and repository-relative generator assets.
* H3-H8 scope is kept as explicit non-goals.

## Usage

From `ai-template`:

```bash
node generators/create-ai-native-app.mjs --name pilot-app --dest ../pilot-app
```

Validate the generated project:

```bash
node scripts/validate-create-ai-native-app.mjs --target ../pilot-app
```

Or from inside the generated project:

```bash
npm run validate
```

## Limitations

The baseline is intended for a controlled first project, MVP or pilot. It does
not publish packages, configure remotes, install dependencies, create cloud
resources or claim production readiness.
