# source me: clean PATH for the native Linux toolchain installed by linux-setup.sh (no /mnt/c entries)
export HOME="${HOME:-/home/$(id -un)}"
export PATH="$HOME/.local/ai-native-m52/node/bin:$HOME/.local/ai-native-m52/npm/bin:/usr/local/bin:/usr/bin:/bin"
