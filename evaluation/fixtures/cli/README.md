# CLI fixtures

`ai-native-v3.2.0.mjs` is the public CLI exactly as released in `v3.2.0` (`git show v3.2.0:runtime/cli/ai-native.mjs`, byte for byte). It is the
**minimum supported CLI**: it sends no version to the engine and cannot update itself. The compatibility matrix
(`runtime/cli/ai-native-lifecycle.test.mjs`) runs it against the engine of the current tree, so every release proves it still serves the CLIs
already installed on people's machines, not only the CLI built in the same release. Never edit it; to support a newer minimum, add the new file.
