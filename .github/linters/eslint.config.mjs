import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginJest from "eslint-plugin-jest";
import * as reactHooks from "eslint-plugin-react-hooks";
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
  reactHooks.configs["recommended-latest"],

  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.mjs"],
          defaultProject: "./tsconfig.json"
        },
        tsconfigRootDir: __dirname
      }
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      "react/react-in-jsx-scope": "off"
    }
  },

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
      "@typescript-eslint/no-explicit-any": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn"
    }
  }
]);
