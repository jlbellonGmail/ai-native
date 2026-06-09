# Evidence

## Implemented files

- `ai-foundation/.github/workflows/dependency-review.yml`
- `ai-foundation/.github/dependency-review-config.yml`

## Workflow evidence

The workflow:
- Runs on `pull_request`.
- Targets branches `main` and `develop`.
- Uses minimum read-only repository permission.
- Calls `actions/dependency-review-action@v4`.
- Loads policy from `.github/dependency-review-config.yml`.

## Policy evidence

The policy:
- Fails pull requests introducing vulnerable dependencies at `high` severity or above.
- Applies vulnerability checks across `runtime`, `development`, and `unknown` scopes.
- Keeps `warn-only` disabled so policy failures block the check.
- Keeps PR comments disabled, avoiding `pull-requests: write`.
- Enables license checks and denies copyleft/unknown license classes.
- Enables patched version visibility and OpenSSF scorecard output.

## Source references used

- GitHub Dependency Review Action README: https://github.com/actions/dependency-review-action
- GitHub Docs customization guide: https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/customize-dependency-review-action

## Limitations

Dependency Review depends on GitHub's dependency graph and pull request diff API. Local validation cannot reproduce the final GitHub check result.
