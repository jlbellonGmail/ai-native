#!/bin/bash
# M5.2 / cli-linux-real: manual, reproducible real-CLI run on Linux (native binaries, clean PATH).
#   bash evaluation/m52/linux-run.sh <commit-sha> <evidence-out.json>
# Prerequisites (once): `bash evaluation/m52/linux-setup.sh`, then log in to each CLI inside Linux:
#   claude  (/login)   |   codex login --device-auth   |   opencode auth login
# The commit is exported with `git archive` into the Linux filesystem so the run does not depend on the Windows checkout.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
. "$here/linux-env.sh"
sha="${1:?usage: linux-run.sh <commit-sha> <evidence-out.json>}"
out="${2:?usage: linux-run.sh <commit-sha> <evidence-out.json>}"
repo="$(cd "$here/../.." && pwd)"
src="$HOME/.local/ai-native-m52/src-$sha"
rm -rf "$src"; mkdir -p "$src"
git -c safe.directory='*' -C "$repo" archive "$sha" | tar -x -C "$src"
cd "$src"
git config --global --get user.email >/dev/null 2>&1 || true
AI_NATIVE_SOURCE_COMMIT="$sha" node evaluation/m52/real-cli.mjs --out "$out"
