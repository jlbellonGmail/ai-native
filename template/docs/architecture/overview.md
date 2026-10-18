# Architecture Overview

`ai-template` provides a reusable application scaffold with three active
surfaces:

| Surface | Product role |
|---|---|
| `scaffolds/` | Copyable starting points for new AI-native applications. |
| `templates/` | Reusable files and manifests that encode repair patterns. |
| `examples/reference-app/` | Reference implementation code kept outside the repository root. |

The template keeps application code under `examples/reference-app/` so the root
stays focused on generation, validation and documentation. New project assets
should be registered in `manifests/enterprise-10-10-structure.json` and covered
by `validation/roadmap-coverage.json`.
