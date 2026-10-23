# `@repo/eslint-config`

Collection of internal eslint configurations.

- `@repo/eslint-config/base` — the shared base: `@eslint/js` recommended rules,
  `typescript-eslint` recommended rules, Prettier compatibility, and
  `eslint-plugin-only-warn` (every rule reports as a warning, never an error, so lint never
  blocks a build — see `bun run lint`'s 0-errors convention across the repo).
- `@repo/eslint-config/next-js` — `base` plus React/Next.js rules (`apps/web`).
- `@repo/eslint-config/react-internal` — `base` plus React rules for non-Next React
  packages.
- `@repo/eslint-config/service` — `base` plus Node globals, for Yome's Express backend
  services (`services/gateway`, `services/identity`, `services/core`,
  `services/messaging`, `services/media`, `services/notifications`). Added in B10 to
  replace every service's `"lint": "echo ..."` stub. Usage, from a service's
  `eslint.config.js` (imported by relative path, matching `apps/web/eslint.config.mjs`'s
  existing convention — this package isn't wired as a real workspace dependency anywhere):

  ```js
  import { serviceConfig } from "../../packages/eslint-config/service.js";

  export default serviceConfig;
  ```
