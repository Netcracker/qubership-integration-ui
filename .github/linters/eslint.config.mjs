import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginJest from "eslint-plugin-jest";
import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  globalIgnores([
    "dist/*",
    "node_modules/*",
    "**/vite.config*.ts",
    "**/jest.config*.ts",
    "**/eslint.config*.{js,mjs}"
  ]),

  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,

  {
    files: ["**/*.{spec,test}.{js,ts,tsx}"],
    plugins: { jest: pluginJest },
    languageOptions: {
      globals: pluginJest.environments.globals.globals
    },
    rules: {
      "jest/valid-expect": ["error", { maxArgs: 2 }],
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      "jest/no-identical-title": "error",
      "jest/prefer-to-have-length": "warn"
    }
  },

  {
    rules: {
      "n/no-missing-import": "off",
      "n/no-unsupported-features/node-builtins": "off",
      "react-hooks/exhaustive-deps": "off",
      "no-unused-vars": "off",
    }
  }
]);
