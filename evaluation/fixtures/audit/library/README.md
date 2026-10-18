# slugify-lite

Turn text into URL slugs. No dependencies.

```js
import { slugify } from "slugify-lite";
slugify("Hello, World!"); // "hello-world"
```

Options: `separator` (single `[a-z0-9_-]`, default `-`), `maxLength` (default 80).
Versioning: SemVer; see CHANGELOG.md. Supported Node: >= 20.
