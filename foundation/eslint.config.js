import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "coverage/**",

      ".ai-runtime/**",
      ".ai-error-system/**",

      "scripts/**",
      "testing/**",

      "public/**",

      ".source-legacy-analysis/**",
      "_deprecated/**"
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: [
      "runtime/**/*.ts",
      "observability/**/*.ts",
      "telemetry/**/*.ts"
    ],

    languageOptions: {
      parserOptions: {
        project: false
      },

      globals: {
        process: "readonly",
        console: "readonly",
        fetch: "readonly"
      }
    },

    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn"
    }
  }
];
