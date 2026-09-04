# services/ and packages/ Refactor Migration Log

## Date and Start State

- Date: 2026-09-04
- Git branch: `refactor/services-packages-architecture` (branched from `production`)
- Repository package manager: `bun@1.3.5`
- Refactor state: **B01 (Documentation Foundation) complete.** B02–B10 are `PENDING`. No
  `services/*` or `packages/*` source has been modified. This branch currently contains only
  `docs/services_packages_refactoring/*`.

## Scope

This migration covers `services/**` and `packages/**` only. It is a sibling of the completed
`docs/app_web_refactoring/` effort (which covered `apps/web`). It does **not** touch
`apps/web` except for import paths that follow package renames, and it does **not** split the
database — one PostgreSQL instance and one `packages/database` Prisma schema are retained.

## Detected Validation Commands

From root `package.json`:

- `bun run build` (`turbo run build`)
- `bun run lint` (`turbo run lint`)
- `bun run check-types` (`turbo run check-types`)
- `bun run check-types:all` (per-service `tsc --noEmit`, sequential)
- `bun run test` (`turbo run test`)
- `bun run test:integration` (`turbo run test:integration` → `tests/contracts.smoke.mjs`)
- `bun run db:migrate` (`turbo run db:migrate`)
- `bun run dev:services` (concurrently: gateway, auth, user, chat, media, notifications, resources)

Per-package / per-service:

- `bun run --cwd services/chat test` (Bun test runner; `src/**/*.test.ts`)
- `bun run --cwd services/resources test` (Bun test runner)
- `bun run --cwd packages/shared test` (Bun test runner; `s3.test.ts`)
- `bun run --cwd services/<name> check-types` (every service)
- `bun run --cwd services/<name> build` (`tsc`)

CI (`.github/workflows/ci.yml`):

- `quality`: `bun run lint`, `bun run check-types`, `bun run test`
- `build-services` matrix: `@services/gateway`, `@services/auth`, `@services/chat`,
  `@services/media`, `@services/notifications`
  — **note: `@services/user` and `@services/resources` are absent.**

Deploy (`.github/workflows/deploy-services.yml`):

- same five-service matrix; builds `./Dockerfile.service`
  — **note: `Dockerfile.service` does not exist in the repository.**

## Baseline Validation

Not yet captured. Baseline is captured at the start of **B02** (first implementation batch),
because B01 changes no `services/*` or `packages/*` source and adding a baseline run here
would only measure the pre-existing state that B02 will re-measure anyway.

Baseline to record at B02 start:

| Area | Command | Exit status | Result |
| --- | --- | --- | --- |
| Turbo typecheck | `bun run check-types` | _pending_ | |
| Per-service typecheck | `bun run check-types:all` | _pending_ | |
| Chat tests | `bun run --cwd services/chat test` | _pending_ | |
| Resources tests | `bun run --cwd services/resources test` | _pending_ | |
| Shared tests | `bun run --cwd packages/shared test` | _pending_ | |
| Turbo build | `bun run build` | _pending_ | |
| Turbo lint | `bun run lint` | _pending_ | |
| Turbo tests | `bun run test` | _pending_ | |
| Integration smoke | `bun run test:integration` | _pending_ | |

Known environment caveat carried over from `docs/app_web_refactoring/migration-log.md`:
root Turbo `lint` / `test` / `build` panicked on this machine with a `system-configuration`
crash (Turbo 2.8.7). If that reproduces, it is classified `ENVIRONMENT`, not a regression,
and per-workspace commands are used instead.

## Pre-existing Issues Inventory (from B01 audit)

These exist before any change in this migration and must not be counted as regressions.

| # | Issue | Location | Batch that resolves it |
| --- | --- | --- | --- |
| 1 | `@services/user` and `@services/resources` not in CI `build-services` matrix | `.github/workflows/ci.yml` | B02 |
| 2 | `@services/user` and `@services/resources` not in `deploy-services.yml` matrix | `.github/workflows/deploy-services.yml` | B02 |
| 3 | `deploy-services.yml` references missing `./Dockerfile.service` | `.github/workflows/deploy-services.yml` | B02 (BLOCKED pending the file) |
| 4 | `services/media` imports `@repo/database` (violates `SCHEMA_OWNERSHIP.md`) | `services/media/src/controllers/media.controller.ts`, `package.json` | B09 |
| 5 | `Group` writes split across `auth` (seed + `createEducationGroups`) and `user` (runtime) | `services/auth`, `services/user` | B04, B06 |
| 6 | `Resource` writes split across `auth` (seed) and `resources` (runtime) | `services/auth`, `services/resources` | B04, B07 |
| 7 | ~600-line seed subsystem + fixtures ship in the `auth` production image | `services/auth/src/{seed.controller.ts,data/*}` | B04 |
| 8 | `services/user` is a single ~1000-line controller spanning 4 domains | `services/user/src/controllers/user.controller.ts` | B05–B08 |
| 9 | `groupData` (523-line seed fixture) lives in `packages/shared` and is imported by `user` runtime code | `packages/shared/src/data/groups.ts` | B03/B04 |
| 10 | `ServiceName` union in `packages/shared` omits `resources` (and has no DTOs) | `packages/shared/src/types/contracts.ts` | B03 |
| 11 | `getAuthenticatedUserId` / `slugify` / `uuidPattern` / `formatCount` duplicated across `auth`, `user`, `chat`, `resources` | multiple | B03 (shared primitives), B05–B09 (adoption) |
| 12 | No ESLint config in any service (`"lint": "echo ..."`) | every `services/*/package.json` | B10 |
| 13 | Only `chat`, `resources`, `shared` have tests | every other `services/*` / `packages/*` | ongoing; enforced from B05 |
| 14 | Gateway route/upstream map hardcoded with special-cased rewrites | `services/gateway/src/index.ts` | B10 |
| 15 | `tests/contracts.smoke.mjs` health list omits `resources` | `tests/contracts.smoke.mjs` | B02 / B10 |

## Batch Execution History

| Batch | Status | Started | Completed | Validation Result | Notes |
| --- | --- | --- | --- | --- | --- |
| B01 — Documentation Foundation | COMPLETE | 2026-09-04 | 2026-09-04 | Manifest row count == eligible file count (78); every actionable row has a batch | Docs only. No `services/*` / `packages/*` source changed. |
| B02 — CI/CD and Deploy Parity | PENDING | | | | |
| B03 — Shared Package Split | PENDING | | | | |
| B04 — Seed Extraction | PENDING | | | | |
| B05 — identity Service | PENDING | | | | |
| B06 — core Scaffold + community Module | PENDING | | | | |
| B07 — core/learning Module (fold in resources) | PENDING | | | | |
| B08 — core/feed + core/dashboard Modules | PENDING | | | | |
| B09 — messaging + media Boundary Cleanup | PENDING | | | | |
| B10 — Gateway Modularization + Final Reconciliation | PENDING | | | | |

## B01 Execution

- Manifest IDs completed: none as implementation rows. `SP-001`–`SP-078` were verified as
  inventory inputs.
- Eligible source files under `services/**` + `packages/**`
  (`.ts`, `.js`, `.mjs`, `.json`, `.prisma`, `.md`; excluding `node_modules`, `dist`,
  `.turbo`, `generated`): **78**.
- Manifest rows: **78**. Duplicate IDs: 0. Duplicate file entries: 0.
- Files moved / refactored / deleted: none.
- Process boundaries changed: none.
- CI / deploy changes: none.
- Database / schema changes: none.
- Target topology recorded: 7 services → 6 deployable units (`gateway`, `identity`, `core`,
  `messaging`, `media`, `notifications`), `notifications` on probation; `services/user` and
  `services/resources` deleted as processes; `packages/shared` split into `service-kit` /
  `storage` / `contracts` / `seed`.
- Decisions locked with the requester: resources folds into `core/modules/learning`;
  events is a `core/modules/community` sub-module, not a service; `auth` → `identity` is a
  rename + profile absorption, not a new process; this pass is docs + branch only.

## Notes for Implementers

- Do every batch on this branch. Keep `bun run check-types` green after each batch; do not
  accumulate broken imports.
- Preserve every external API path. The gateway route manifest is where upstream targets
  change; `apps/web/utils/ApiRoutes.ts` should not need edits except where a package rename
  changes a TypeScript import for shared DTOs.
- When moving code out of `services/user/src/controllers/user.controller.ts`, split by the
  domain map in `architecture-plan.md` ("Identified Domains and Owners"), not by file size.
- Prove a file is unused across direct imports, re-exports, dynamic imports, tests, config,
  route references, and CI matrices before deleting it — same rule as
  `docs/app_web_refactoring/`.
- Update `packages/database/SCHEMA_OWNERSHIP.md` in the same batch that moves a table's
  writer.
