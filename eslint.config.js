// @ts-check
import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import astro from "eslint-plugin-astro";

export default [
  {
    ignores: ["dist/**", ".astro/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    plugins: { prettier },
    rules: {
      "prettier/prettier": "error",
    },
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        Notiflix: "readonly",
        grecaptcha: "readonly",
      },
    },
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        Notiflix: "readonly",
        grecaptcha: "readonly",
      },
    },
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      "no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.gs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.node,
        CONFIG: "readonly",
        SpreadsheetApp: "readonly",
        DriveApp: "readonly",
        DocumentApp: "readonly",
        ContentService: "readonly",
        UrlFetchApp: "readonly",
        LockService: "readonly",
        PropertiesService: "readonly",
        Utilities: "readonly",
        Session: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-redeclare": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  ...astro.configs["flat/recommended"],
  eslintConfigPrettier,
];
