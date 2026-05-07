import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific generated artifacts:
    "generated/**",
    "prisma/generated/**",
  ]),
  {
    rules: {
      // This codebase uses `any` in several places; keep lint useful, not blocking.
      "@typescript-eslint/no-explicit-any": "off",
      // Avoid noisy false positives in some client components.
      "react-hooks/set-state-in-effect": "off",
      // Avoid blocking builds on stylistic issues while stabilizing the project.
      "prefer-const": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/immutability": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
