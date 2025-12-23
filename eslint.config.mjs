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

    // Repo generated / vendor-like folders
    "node_modules/**",
    "logs/**",
    "backups/**",
  ]),

  // Project-wide rule tuning.
  // Goal: keep lint useful, but avoid failing CI/dev on non-critical style issues
  // until the codebase is fully standardized.
  {
    files: ["**/*.{ts,tsx,js,jsx}"] ,
    rules: {
      // This repo uses `any` in many places; treat it as allowed for now.
      "@typescript-eslint/no-explicit-any": "off",

      // Some components/pages pass children props in legacy patterns.
      "react/no-children-prop": "off",

      // Some UI copy contains apostrophes/quotes in JSX.
      "react/no-unescaped-entities": "off",

      // The react-hooks-* plugin rules currently flag several legacy patterns.
      // We'll re-enable after refactors.
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },

  // Allow CommonJS require in scripts and service worker files.
  {
    files: ["scripts/**/*.{js,ts}", "public/sw.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
