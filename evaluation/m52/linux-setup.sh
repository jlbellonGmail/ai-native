#!/bin/bash
# M5.2 / cli-linux-real: native Linux toolchain for the manual real-CLI run (no sudo, user prefix only).
#   bash evaluation/m52/linux-setup.sh
# The PATH is rebuilt WITHOUT any /mnt/c entry: under WSL the Windows binaries leak into PATH through interop, and a run
# with them would be a Windows run, not a Linux one. Every tool is checked to be an ELF executable under $HOME.
set -euo pipefail
NODE_VERSION="${NODE_VERSION:-24.9.0}"
PREFIX="$HOME/.local/ai-native-m52"
mkdir -p "$PREFIX"
export PATH="$PREFIX/node/bin:$PREFIX/npm/bin:/usr/local/bin:/usr/bin:/bin"

if [ ! -x "$PREFIX/node/bin/node" ]; then
  base="https://nodejs.org/dist/v${NODE_VERSION}"
  tgz="node-v${NODE_VERSION}-linux-x64.tar.xz"
  cd "$PREFIX"
  curl -fsSLO "$base/$tgz"
  curl -fsSLO "$base/SHASUMS256.txt"
  grep " $tgz\$" SHASUMS256.txt | sha256sum -c -
  mkdir -p node && tar -xJf "$tgz" -C node --strip-components=1
  rm -f "$tgz" SHASUMS256.txt
fi
node --version
npm config set prefix "$PREFIX/npm" >/dev/null
npm install -g --no-audit --no-fund @anthropic-ai/claude-code @openai/codex @opencode/cli 2>&1 | tail -3

echo "--- native check"
for c in node claude codex opencode; do
  p="$(command -v "$c")"
  case "$p" in /mnt/*) echo "FAIL: $c resolves to a Windows binary: $p"; exit 1;; esac
  real="$(readlink -f "$p")"
  kind="$(file -b "$real" 2>/dev/null | cut -c1-40 || true)"
  echo "$c: $p -> $real [$kind] $("$c" --version 2>&1 | head -1)"
done
