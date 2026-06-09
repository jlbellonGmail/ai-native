# Evidence

## Implemented files

- `ai-foundation/.github/dependabot.yml`
- `ai-foundation/package-lock.json` removed to align lockfile governance with `pnpm`.

## Configuration evidence

The Dependabot configuration:
- Uses config schema version `2`.
- Enables `npm` ecosystem checks for the repository root.
- Enables `github-actions` ecosystem checks for workflow dependencies.
- Schedules weekly automated checks.
- Limits open Dependabot pull requests to `5` per ecosystem.
- Adds dependency labels to generated pull requests without labeling routine updates as security events.
- Uses semantic commit prefixes for dependency and action updates.
- Groups npm updates into production and development dependency pull requests.

## Lockfile decision

- Lockfile canonical: `ai-foundation/pnpm-lock.yaml`.
- Package manager alignment: project scripts use `pnpm`, including `build`.
- `ai-foundation/package-lock.json`: removed because it is not the canonical lockfile and created ambiguity for Dependabot evidence.
- Risk status: lockfile ambiguity resolved locally.

## Limitations

Dependabot requires GitHub-side execution to create update pull requests. Local validation confirms configuration only.
