# Prompt Registry Storage

This directory is the repository-backed storage surface for governed prompts in
`ai-knowledge`.

W4-T2 defines storage only. It gives prompt files a stable location, an index,
integrity checks and a lifecycle contract. It does not define compatibility
rules, approval ownership, evaluation linkage or runtime persistence.

## Files

| File | Purpose |
|---|---|
| `registry.storage.json` | Machine-readable storage contract and prompt index for W4-T2. |
| `code-generator/v*/system-prompt.md` | Stored prompt bodies referenced by the registry index. |
| `general-prompt-guidelines.md` | General authoring guidance, not a registry entry. |

## Storage Layout

Prompt bodies are stored under:

```text
registries/prompts/<prompt-family>/<storage-slot>/system-prompt.md
```

The storage slot, such as `v1`, is a filesystem coordinate for a major prompt
version line. Compatibility and versioning policy are defined in
`config/prompt-registry/versioning.compatibility.json`.

## Usage

Use `registry.storage.json` as the entry point when locating prompt bodies.
Every listed entry must include a stable prompt id, a family, a storage slot, a
relative storage path, lifecycle state and SHA-256 checksum.

Run the storage validator after changing prompt storage:

```powershell
node scripts/validate-prompt-registry-storage.mjs
```

The validator confirms that indexed prompt files exist, paths stay inside this
registry, checksums match current file contents and W4-T3+ remain open.
