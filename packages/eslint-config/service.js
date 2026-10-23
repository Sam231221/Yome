import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for Yome's Express backend services (gateway, identity,
 * core, messaging, media, notifications). Node globals only — no React/browser config, and
 * no `@next/eslint-plugin-next`.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const serviceConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ignores: ["dist/**"],
  },
];
