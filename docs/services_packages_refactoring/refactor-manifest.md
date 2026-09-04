# services/ and packages/ Refactor Manifest

Every eligible `.ts`, `.js`, `.mjs`, `.json`, `.prisma`, and `.md` file under `services/**`
and `packages/**` is listed below (excluding `node_modules`, `dist`, `.turbo`, and Prisma
`generated/`). IDs follow sorted path order and are stable for this planning pass.

B01 verification (2026-09-04): eligible source count is **78** and matches the 78 manifest
rows. No `services/*` or `packages/*` source was changed. No implementation rows are assigned
to B01; `SP-001`–`SP-078` are inventory inputs only. Files that a batch *creates* get fresh
IDs when they are created (see "Files this migration will create" at the end).

B03 completed (2026-09-04): `packages/shared` split into `@repo/contracts`, `@repo/service-kit`,
and `@repo/storage`; `@repo/shared` kept as a re-export shim (`SP-011`–`SP-024`, excluding
`SP-013` which stays with `packages/shared` until B04). Current-source-count is now **90**:
all 78 original rows still track a live file (no row was deleted — the closest is `SP-014`
and `SP-022`, whose *old paths* were superseded when their content was merged/split into 2 new
paths, but both rows were updated in place rather than retired), plus 12 genuinely new
B03-created files (`SP-079`–`SP-090`: the three new package manifests, tsconfigs, entry
points, and the consolidated-helpers module + its zod-primitives module + its test). The four
duplicated helpers (`getAuthenticatedUserId`, `slugify`, `uuidPattern`/`isUuid`,
`formatCount`/`compactNumber`) now live in `@repo/contracts` and are imported by `auth`,
`user`, `chat`, and `resources` (`SP-030`, `SP-041`, `SP-067`, `SP-074` gain a note; their
MOVE to the target service is still a later batch).

B03 completeness audit (2026-09-04, same day): re-scanning after the batch found three gaps,
all fixed in place rather than left for a later batch. (1) The 12 new files existed with no
manifest row, violating this document's own rule that every eligible file gets one; assigned
`SP-079`–`SP-090`. (2) Nine `DONE` rows (`SP-012`, `SP-014`, `SP-016`–`SP-021`, `SP-023`)
still listed the pre-move path (e.g. `packages/shared/src/logger.ts`) in "Current File" after
the file had already moved to `packages/service-kit` / `packages/storage` / `packages/contracts`
— the column had drifted from what it is supposed to track. Corrected to the actual current
path with the origin recorded in the notes column instead. (3) The first attempt at fixing (1)
assigned fresh IDs to `packages/contracts/src/errors.ts` and `packages/contracts/src/service.ts`
— but those are the very files `SP-014`/`SP-022` already point to after fix (2), so those two
IDs would have duplicated a file already tracked. Caught before commit and removed; the
correct new-file count is 12, not 14. `SP-022` also had a same-day correction: its destination
said `ErrorEnvelope` moved with `ServiceName` into
`service.ts`, but the actual code puts `ErrorEnvelope` in `errors.ts` (SP-014) alongside
`createHttpError` — the manifest's stated destination didn't match the shipped code; the row
now reflects reality. No source code changed during this audit, only manifest accuracy.

B04 in progress (2026-09-04): `packages/seed` created; `SP-031`–`SP-034` and `SP-038` are
`DONE` (seed controller + 3 fixture files extracted verbatim; `db.routes.ts` rewritten as a
thin route mounting one `devSeedGuard` middleware instead of 5 repeated per-handler checks).
4 new files assigned `SP-091`–`SP-094`. Verified locally end-to-end without touching a real
database: with `ENABLE_DEV_SEED_ROUTES=false` all 5 `/api/db/*` paths still 404 exactly as
before; with it `=true` and a deliberately unreachable `DATABASE_URL`, all 5 pass the guard,
reach the moved `packages/seed/dist/runners.js` code (confirmed in the error stack trace), and
fail on `ECONNREFUSED` — proving the guard and route wiring are correct with zero write risk.
**`SP-013` (`packages/shared/src/data/groups.ts`) and the `groupData` runtime fallback in
`services/user/src/controllers/user.controller.ts` (`SP-076` partial) are intentionally not
yet touched** — the batch's own spec requires presenting the first-run behaviour change and
waiting for explicit confirmation before removing that fallback (see `migration-log.md`).

**This manifest tracks Phase 1 (B01–B10) — the existing files and where they go.** Phase 2+
work (Redis, event backbone, read models, database extraction) creates new files rather than
relocating existing ones, so it appears here only in the creation list. Those batches are
planned in [`data-architecture-plan.md`](./data-architecture-plan.md) and
[`event-architecture-plan.md`](./event-architecture-plan.md); their gating triggers are
tracked in `migration-log.md` under "Trigger Measurements".

## Classification legend

- `SERVICE_ENTRY` — an `index.ts` that boots an Express/HTTP server.
- `CONTROLLER` — request handlers.
- `ROUTE` — Express router wiring.
- `VALIDATION` — zod request schemas.
- `DOMAIN_LIB` — pure domain logic (no HTTP).
- `SOCKET` — Socket.IO handlers.
- `STATE` — in-memory process state.
- `SEED_CONTROLLER` / `SEED_DATA` — dev seeding logic / fixtures.
- `TEST` — `*.test.ts`.
- `PKG_ENTRY` / `PKG_MODULE` / `PKG_MANIFEST` — shared-package barrel / module / `package.json`.
- `PRISMA_SCHEMA` / `DB_CLIENT` — database package.
- `TS_CONFIG` / `LINT_CONFIG` — tooling config.
- `DOC` — Markdown.

## Action legend

- `KEEP` — stays where it is, unchanged in ownership.
- `MOVE` — relocated, same behaviour.
- `RENAME` — package/service identifier changes.
- `SPLIT` — one file becomes several, by domain or by responsibility.
- `MERGE` — folded into another unit.
- `EXTRACT` — pulled into a new package.
- `REFACTOR` — reworked in place.
- `DELETE` — removed after its content is proven relocated or dead.
- `CREATE` — a brand-new file with no prior-batch predecessor (new package manifests,
  tsconfigs, entry points, and net-new modules like consolidated helpers).

## Manifest

| ID | Current File | Domain | Classification | Action | Proposed Destination / Change | Batch | Owner After | Risk | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SP-001 | `packages/database/SCHEMA_OWNERSHIP.md` | database | DOC | REFACTOR | Rewrite as a model → owning-module write table; keep in sync with code | B10 | database | Low | PENDING |
| SP-002 | `packages/database/package.json` | database | PKG_MANIFEST | KEEP | Same | B10 | database | Low | KEEP |
| SP-003 | `packages/database/prisma/schema.prisma` | database | PRISMA_SCHEMA | KEEP | Single schema retained; add `/// owner: <module>` doc comment per model | B10 | database | Medium | PENDING |
| SP-004 | `packages/database/src/client.d.ts` | database | DB_CLIENT | KEEP | Same | — | database | Low | KEEP |
| SP-005 | `packages/database/src/client.js` | database | DB_CLIENT | KEEP | Same | — | database | Low | KEEP |
| SP-006 | `packages/eslint-config/README.md` | tooling | DOC | REFACTOR | Document the new `service` profile | B10 | eslint-config | Low | PENDING |
| SP-007 | `packages/eslint-config/base.js` | tooling | LINT_CONFIG | KEEP | Same | — | eslint-config | Low | KEEP |
| SP-008 | `packages/eslint-config/next.js` | tooling | LINT_CONFIG | KEEP | Same | — | eslint-config | Low | KEEP |
| SP-009 | `packages/eslint-config/package.json` | tooling | PKG_MANIFEST | REFACTOR | Add a `./service` export for service linting | B10 | eslint-config | Low | PENDING |
| SP-010 | `packages/eslint-config/react-internal.js` | tooling | LINT_CONFIG | KEEP | Same | — | eslint-config | Low | KEEP |
| SP-011 | `packages/shared/package.json` | shared | PKG_MANIFEST | SPLIT | Unchanged path (still the shim's manifest); now depends on `@repo/contracts`, `@repo/service-kit`, `@repo/storage` only, dropped `zod`/`@aws-sdk/client-s3`/`express` peer | B03 / B10 | service-kit | Medium | DONE (B03; shim removal B10) |
| SP-012 | `packages/service-kit/src/config/env.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/config/env.ts`; `servicePorts` gained a `core` getter (value wired B06) | B03 | service-kit | Medium | DONE |
| SP-013 | `packages/shared/src/data/groups.ts` | seed | SEED_DATA | MOVE | `packages/seed/src/fixtures/groups.ts`; runtime consumers in `services/user` removed (B04) | B04 | seed | Medium | PENDING |
| SP-014 | `packages/contracts/src/errors.ts` | shared | PKG_MODULE | MOVE + REFACTOR | Moved from `packages/shared/src/errors.ts` (`createHttpError`); also absorbed `ErrorEnvelope` from the old `types/contracts.ts` (see SP-022) — both are pure, no Express dep | B03 | contracts | Low | DONE |
| SP-015 | `packages/shared/src/index.ts` | shared | PKG_ENTRY | SPLIT | Unchanged path; content replaced with a re-export shim (`@repo/contracts` + `@repo/service-kit` + `@repo/storage` + local `groupData`); deleted in B10 | B03 / B10 | service-kit | Medium | DONE (B03; shim removal B10) |
| SP-016 | `packages/service-kit/src/logger.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/logger.ts`, unchanged | B03 | service-kit | Low | DONE |
| SP-017 | `packages/service-kit/src/middleware/errorHandler.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/middleware/errorHandler.ts`; `ErrorEnvelope` import repointed to `@repo/contracts` | B03 | service-kit | Low | DONE |
| SP-018 | `packages/service-kit/src/middleware/internalTokenGuard.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/middleware/internalTokenGuard.ts`, unchanged | B03 | service-kit | Low | DONE |
| SP-019 | `packages/service-kit/src/middleware/validateRequest.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/middleware/validateRequest.ts`, unchanged | B03 | service-kit | Low | DONE |
| SP-020 | `packages/storage/src/s3.test.ts` | shared | TEST | MOVE | Moved from `packages/shared/src/storage/s3.test.ts`; test script fixed to `bun test ./src` (glob bug found in B03 — see issue #40-adjacent note in migration-log) | B03 | storage | Low | DONE |
| SP-021 | `packages/storage/src/s3.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/storage/s3.ts`; `createHttpError` import repointed to `@repo/contracts` | B03 | storage | Medium | DONE |
| SP-022 | `packages/contracts/src/service.ts` | shared | PKG_MODULE | MOVE + REFACTOR + SPLIT | Moved from `packages/shared/src/types/contracts.ts`; `ServiceName`/`HealthResponse` stayed here, `ErrorEnvelope` moved into SP-014 instead (`errors.ts`) — the one place this manifest's own MOVE destinations disagreed with the actual split, corrected in the B03 completeness audit | B03 | contracts | Medium | DONE |
| SP-023 | `packages/service-kit/src/utils/url.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/utils/url.ts`, unchanged | B03 | service-kit | Low | DONE |
| SP-024 | `packages/shared/tsconfig.json` | shared | TS_CONFIG | KEEP | Unchanged path; still builds the shim. New packages get their own tsconfigs — see SP-086, SP-089, SP-092 | B03 | shared | Low | DONE |
| SP-025 | `packages/typescript-config/base.json` | tooling | TS_CONFIG | KEEP | Same | — | typescript-config | Low | KEEP |
| SP-026 | `packages/typescript-config/nextjs.json` | tooling | TS_CONFIG | KEEP | Same | — | typescript-config | Low | KEEP |
| SP-027 | `packages/typescript-config/package.json` | tooling | PKG_MANIFEST | KEEP | Same | — | typescript-config | Low | KEEP |
| SP-028 | `packages/typescript-config/react-library.json` | tooling | TS_CONFIG | KEEP | Same | — | typescript-config | Low | KEEP |
| SP-029 | `services/auth/package.json` | identity | PKG_MANIFEST | RENAME | `@services/identity`; drop seed-only deps; add `@repo/storage` for avatar upload | B05 | identity | Medium | PENDING |
| SP-030 | `services/auth/src/controllers/auth.controller.ts` | identity | CONTROLLER | MOVE | `services/identity/src/modules/credentials/`; **B03: now imports `getAuthenticatedUserId` from `@repo/shared`, local copy deleted.** Destination MOVE still pending | B05 | identity | Medium | PENDING |
| SP-031 | `packages/seed/src/runners.ts` | seed | SEED_CONTROLLER | EXTRACT | Moved from `services/auth/src/controllers/seed.controller.ts`; per-handler `rejectIfSeedDisabled` calls removed (5x), guard now applied once at the route layer — see `SP-091` | B04 | seed | High | DONE |
| SP-032 | `packages/seed/src/fixtures/dashboard.ts` | seed | SEED_DATA | MOVE | Moved from `services/auth/src/data/dashboard.ts`, unchanged | B04 | seed | Low | DONE |
| SP-033 | `packages/seed/src/fixtures/resources.ts` | seed | SEED_DATA | MOVE | Moved from `services/auth/src/data/resources.ts`, unchanged | B04 | seed | Low | DONE |
| SP-034 | `packages/seed/src/fixtures/users.ts` | seed | SEED_DATA | MOVE | Moved from `services/auth/src/data/users.ts`, unchanged | B04 | seed | Low | DONE |
| SP-035 | `services/auth/src/index.ts` | identity | SERVICE_ENTRY | REFACTOR | `services/identity/src/index.ts`; mount `credentials` + `profile` modules; dev seed route only when `ENABLE_DEV_SEED_ROUTES` | B05 | identity | Medium | PENDING |
| SP-036 | `services/auth/src/routes/auth.routes.ts` | identity | ROUTE | MOVE | `services/identity/src/modules/credentials/credentials.routes.ts` | B05 | identity | Low | PENDING |
| SP-037 | `services/auth/src/routes/auth.validation.ts` | identity | VALIDATION | MOVE | Credentials module; reusable primitives lifted to `@repo/contracts` | B05 | identity | Low | PENDING |
| SP-038 | `services/auth/src/routes/db.routes.ts` | seed | ROUTE | REFACTOR | Thin route: mounts `devSeedGuard` from `@repo/seed` once, then the 5 seed handlers; external `/api/db` path preserved. Path itself unchanged in B04 — the further rename to `services/identity/src/dev/seed-route.ts` is B05's job | B04 | identity (dev) | Medium | DONE |
| SP-039 | `services/auth/tsconfig.json` | identity | TS_CONFIG | MOVE | `services/identity/tsconfig.json` | B05 | identity | Low | PENDING |
| SP-040 | `services/chat/package.json` | messaging | PKG_MANIFEST | RENAME | `@services/messaging` | B09 | messaging | Medium | PENDING |
| SP-041 | `services/chat/src/controllers/message.controller.ts` | messaging | CONTROLLER | SPLIT | `messaging/src/modules/messages/*`; call-prep handlers → `modules/calls/*`. **B03: now imports `getAuthenticatedUserId` from `@repo/shared`, local copy deleted.** Split still pending | B09 | messaging | Medium | PENDING |
| SP-042 | `services/chat/src/index.ts` | messaging | SERVICE_ENTRY | REFACTOR | `services/messaging/src/index.ts`; mount `messages` / `calls` / `realtime` | B09 | messaging | Medium | PENDING |
| SP-043 | `services/chat/src/lib/conversations.test.ts` | messaging | TEST | MOVE | `messaging/src/modules/messages/conversations.test.ts` | B09 | messaging | Low | PENDING |
| SP-044 | `services/chat/src/lib/conversations.ts` | messaging | DOMAIN_LIB | MOVE | `messaging/src/modules/messages/conversations.ts` | B09 | messaging | Low | PENDING |
| SP-045 | `services/chat/src/lib/direct-messages.test.ts` | messaging | TEST | MOVE | `messaging/src/modules/messages/` | B09 | messaging | Low | PENDING |
| SP-046 | `services/chat/src/lib/direct-messages.ts` | messaging | DOMAIN_LIB | MOVE | `messaging/src/modules/messages/` | B09 | messaging | Low | PENDING |
| SP-047 | `services/chat/src/routes/chat.routes.ts` | messaging | ROUTE | SPLIT | Messages routes + calls routes; external `/api/chat` and `/api/messages` paths preserved | B09 | messaging | Medium | PENDING |
| SP-048 | `services/chat/src/routes/chat.validation.test.ts` | messaging | TEST | MOVE | `messaging/src/modules/messages/` | B09 | messaging | Low | PENDING |
| SP-049 | `services/chat/src/routes/chat.validation.ts` | messaging | VALIDATION | MOVE | `messages` / `calls` modules; primitives → `@repo/contracts` | B09 | messaging | Low | PENDING |
| SP-050 | `services/chat/src/socket/handlers.ts` | messaging | SOCKET | MOVE | `messaging/src/modules/realtime/handlers.ts` | B09 | messaging | Medium | PENDING |
| SP-051 | `services/chat/src/state/online-users.test.ts` | messaging | TEST | MOVE | `messaging/src/modules/realtime/` | B09 | messaging | Low | PENDING |
| SP-052 | `services/chat/src/state/online-users.ts` | messaging | STATE | MOVE | `messaging/src/modules/realtime/online-users.ts` | B09 | messaging | Low | PENDING |
| SP-053 | `services/chat/tsconfig.json` | messaging | TS_CONFIG | MOVE | `services/messaging/tsconfig.json` | B09 | messaging | Low | PENDING |
| SP-054 | `services/gateway/package.json` | edge | PKG_MANIFEST | REFACTOR | Add real `eslint` lint script | B10 | gateway | Low | PENDING |
| SP-055 | `services/gateway/src/index.ts` | edge | SERVICE_ENTRY | SPLIT + REFACTOR | Bootstrap + `routes/route-manifest.ts` (declarative upstream map, target units, `/api/user` split identity vs core) + `middleware/*` | B10 | gateway | High | PENDING |
| SP-056 | `services/gateway/tsconfig.json` | edge | TS_CONFIG | KEEP | Same | — | gateway | Low | KEEP |
| SP-057 | `services/media/package.json` | media | PKG_MANIFEST | REFACTOR | Remove `@repo/database` dependency; keep `@repo/storage` | B09 | media | Medium | PENDING |
| SP-058 | `services/media/src/controllers/media.controller.ts` | media | CONTROLLER | REFACTOR | Remove `getChatUploadScope` DB calls; upload scope from a gateway-injected claim or an internal `messaging` call | B09 | media | High | PENDING |
| SP-059 | `services/media/src/index.ts` | media | SERVICE_ENTRY | REFACTOR | Drop any DB env validation; keep object-storage env validation | B09 | media | Low | PENDING |
| SP-060 | `services/media/src/routes/media.routes.ts` | media | ROUTE | KEEP | Same | B09 | media | Low | KEEP |
| SP-061 | `services/media/tsconfig.json` | media | TS_CONFIG | KEEP | Same | — | media | Low | KEEP |
| SP-062 | `services/notifications/package.json` | notifications | PKG_MANIFEST | REFACTOR | Add real `eslint` lint script | B10 | notifications | Low | PENDING |
| SP-063 | `services/notifications/src/index.ts` | notifications | SERVICE_ENTRY | KEEP | Same. B10 review: keep as a process vs fold into `core/modules/notifications` | B10 | notifications | Low | PENDING |
| SP-064 | `services/notifications/src/routes/notifications.routes.ts` | notifications | ROUTE | REFACTOR | Extract the inline `/send` handler into a controller for structural parity | B10 | notifications | Low | PENDING |
| SP-065 | `services/notifications/tsconfig.json` | notifications | TS_CONFIG | KEEP | Same | — | notifications | Low | KEEP |
| SP-066 | `services/resources/package.json` | learning | PKG_MANIFEST | DELETE | Folded into `services/core`; deps merged into the core manifest | B07 | core | Medium | PENDING |
| SP-067 | `services/resources/src/controllers/resource.controller.ts` | learning | CONTROLLER | MOVE | `services/core/src/modules/learning/resources/resources.controller.ts`. **B03: now imports `getAuthenticatedUserId`, `isUuid`, `slugify` from `@repo/shared`; local `uuidPattern`/`getAuthenticatedUserId`/`slugify` deleted.** Move still pending | B07 | core | Medium | PENDING |
| SP-068 | `services/resources/src/index.ts` | learning | SERVICE_ENTRY | DELETE | Entry replaced by `services/core/src/index.ts` | B07 | core | Medium | PENDING |
| SP-069 | `services/resources/src/routes/resource.routes.ts` | learning | ROUTE | MOVE | `services/core/src/modules/learning/resources/resources.routes.ts` | B07 | core | Low | PENDING |
| SP-070 | `services/resources/src/routes/resource.validation.test.ts` | learning | TEST | MOVE | `services/core/src/modules/learning/resources/` | B07 | core | Low | PENDING |
| SP-071 | `services/resources/src/routes/resource.validation.ts` | learning | VALIDATION | MOVE | Learning module; `resourceToneSchema` → `@repo/contracts` | B07 | core | Low | PENDING |
| SP-072 | `services/resources/tsconfig.json` | learning | TS_CONFIG | DELETE | Replaced by `services/core/tsconfig.json` | B07 | core | Low | PENDING |
| SP-073 | `services/user/package.json` | multi | PKG_MANIFEST | DELETE | Replaced by `services/core`; profile deps → `identity`, rest → `core` | B06 | core | Medium | PENDING |
| SP-074 | `services/user/src/controllers/user.controller.ts` | multi | CONTROLLER | SPLIT | profile → `identity/modules/profile` (B05); groups + connections + group-events → `core/modules/community` (B06); learning projects/events reads → `core/modules/learning` (B07); dashboard aggregation → `core/modules/dashboard` (B08). **B03: now imports `getAuthenticatedUserId`, `isUuid`, `slugify`, `formatCount`, `compactNumber` from `@repo/shared`; all five local duplicates deleted.** Domain split still pending | B05–B08 | identity + core | High | PENDING |
| SP-075 | `services/user/src/index.ts` | multi | SERVICE_ENTRY | DELETE | Entry replaced by `services/core/src/index.ts` | B06 | core | Medium | PENDING |
| SP-076 | `services/user/src/routes/user.routes.ts` | multi | ROUTE | SPLIT | Same fan-out as the controller; every external path preserved through the gateway route manifest | B05–B08 | identity + core | High | PENDING |
| SP-077 | `services/user/src/routes/user.validation.ts` | multi | VALIDATION | SPLIT | Profile schemas → `identity`; group/connection schemas → `core`; primitives → `@repo/contracts` | B05–B08 | identity + core | Medium | PENDING |
| SP-078 | `services/user/tsconfig.json` | multi | TS_CONFIG | DELETE | Replaced by `services/core/tsconfig.json` | B06 | core | Low | PENDING |
| SP-079 | `packages/contracts/package.json` | shared | PKG_MANIFEST | CREATE | New in B03 | B03 | contracts | Low | DONE |
| SP-080 | `packages/contracts/src/helpers.test.ts` | shared | TEST | CREATE | New in B03 — coverage `@repo/shared` never had, proving the 4 consolidated helpers match every implementation they replaced | B03 | contracts | Low | DONE |
| SP-081 | `packages/contracts/src/helpers.ts` | shared | PKG_MODULE | CREATE | New in B03: `getAuthenticatedUserId`, `slugify`, `UUID_PATTERN`/`isUuid`, `compactNumber`/`formatCount` — consolidated from 4 duplicate per-service definitions (issue #11) | B03 | contracts | Low | DONE |
| SP-082 | `packages/contracts/src/index.ts` | shared | PKG_ENTRY | CREATE | New in B03 | B03 | contracts | Low | DONE |
| SP-083 | `packages/contracts/src/schemas.ts` | shared | PKG_MODULE | CREATE | New in B03: `positiveInt`, `positiveIntString`, `slugOrUuidSchema`, `toneSchema` zod primitives, available for B05+ adoption (not force-adopted in B03) | B03 | contracts | Low | DONE |
| SP-084 | `packages/contracts/tsconfig.json` | shared | TS_CONFIG | CREATE | New in B03 | B03 | contracts | Low | DONE |
| SP-085 | `packages/service-kit/package.json` | shared | PKG_MANIFEST | CREATE | New in B03 | B03 | service-kit | Low | DONE |
| SP-086 | `packages/service-kit/src/index.ts` | shared | PKG_ENTRY | CREATE | New in B03 | B03 | service-kit | Low | DONE |
| SP-087 | `packages/service-kit/tsconfig.json` | shared | TS_CONFIG | CREATE | New in B03 | B03 | service-kit | Low | DONE |
| SP-088 | `packages/storage/package.json` | shared | PKG_MANIFEST | CREATE | New in B03 | B03 | storage | Low | DONE |
| SP-089 | `packages/storage/src/index.ts` | shared | PKG_ENTRY | CREATE | New in B03 | B03 | storage | Low | DONE |
| SP-090 | `packages/storage/tsconfig.json` | shared | TS_CONFIG | CREATE | New in B03 | B03 | storage | Low | DONE |
| SP-091 | `packages/seed/src/guard.ts` | seed | PKG_MODULE | CREATE | New in B04: `canRunSeedMutations`, `devSeedGuard` — extracted from the 5 repeated per-handler checks in the old `seed.controller.ts` into one route-level middleware | B04 | seed | Low | DONE |
| SP-092 | `packages/seed/src/index.ts` | seed | PKG_ENTRY | CREATE | New in B04 | B04 | seed | Low | DONE |
| SP-093 | `packages/seed/package.json` | seed | PKG_MANIFEST | CREATE | New in B04; depends on `@repo/database`, `@repo/shared`, `bcryptjs` | B04 | seed | Low | DONE |
| SP-094 | `packages/seed/tsconfig.json` | seed | TS_CONFIG | CREATE | New in B04 | B04 | seed | Low | DONE |

Note: `packages/contracts/src/errors.ts` and `packages/contracts/src/service.ts` are **not**
`CREATE` rows — they are the MOVE destinations already tracked by `SP-014` and `SP-022`
respectively (see the B03 completeness-audit note above). Assigning them fresh IDs here would
have been a duplicate-file-entry bug; caught and corrected before commit.

## Rows by batch

- **B01** (docs only): none.
- **B02** (CI/CD parity): infra files only — `.github/workflows/ci.yml`,
  `.github/workflows/deploy-services.yml`, new `Dockerfile.service`,
  `tests/contracts.smoke.mjs`, root `package.json`. No `SP-*` source rows.
- **B03** (shared split): SP-011, SP-012, SP-014, SP-015, SP-016, SP-017, SP-018, SP-019,
  SP-020, SP-021, SP-022, SP-023, SP-024, SP-079–SP-090 (+ import updates in SP-030, SP-041,
  SP-067, SP-074).
- **B04** (seed extraction): SP-031, SP-032, SP-033, SP-034, SP-038, SP-091–SP-094 **done**;
  SP-013 and the SP-074/SP-076 runtime-fallback removal **pending a product decision** (see
  migration-log.md).
- **B05** (identity): SP-029, SP-030, SP-035, SP-036, SP-037, SP-039 (+ profile portions of
  SP-074, SP-076, SP-077).
- **B06** (core scaffold + community): SP-073, SP-075, SP-078 (+ community portions of
  SP-074, SP-076, SP-077).
- **B07** (core/learning + fold resources): SP-066, SP-067, SP-068, SP-069, SP-070, SP-071,
  SP-072 (+ learning portions of SP-074, SP-076, SP-077).
- **B08** (core/feed + core/dashboard): dashboard/feed portions of SP-074, SP-076, SP-077;
  new feed module files get fresh IDs.
- **B09** (messaging + media): SP-040 … SP-053, SP-057, SP-058, SP-059.
- **B10** (gateway + reconciliation): SP-001, SP-003, SP-006, SP-009, SP-011 (shim delete),
  SP-015 (shim delete), SP-054, SP-055, SP-062, SP-063, SP-064; final pass so every row is
  `DONE` / `KEEP` / `BLOCKED`.

## Status accounting

Counts below are machine-verified (`grep`-extracted from the actual table, not hand-tallied
— a hand-tally error during the B03 completeness audit is exactly why this rule exists now).

- Rows: 94 (the original 78, plus 12 B03-created rows `SP-079`–`SP-090`, plus 4 B04-created
  rows `SP-091`–`SP-094`). Duplicate IDs: 0. Duplicate current-file entries: 0.
- `KEEP` (no change intended): SP-002, SP-004, SP-005, SP-007, SP-008, SP-010, SP-025,
  SP-026, SP-027, SP-028, SP-056, SP-060, SP-061, SP-065 — **14 rows**.
- `DONE`: SP-011, SP-012, SP-014–SP-024 (13 rows, B03's `packages/shared` split) +
  SP-031–SP-034, SP-038 (5 rows, B04's seed extraction) + SP-079–SP-090 (12 rows, B03-created
  files) + SP-091–SP-094 (4 rows, B04-created files) — **34 rows**.
- `PENDING` (actionable, batch assigned): **46 rows** — includes `SP-013` (the `groupData`
  fixture, deliberately not yet moved — see the B04-in-progress note above) and `SP-030`,
  `SP-041`, `SP-067`, `SP-074`, `SP-076`, which carry an adoption note but are not `DONE`
  because their full MOVE/domain-split is a separate, later batch or (for `SP-074`/`SP-076`)
  gated on the same product decision as `SP-013`.
- `BLOCKED`: 0 in the manifest. One infra blocker was tracked in
  `service-decomposition-plan.md` (the missing `Dockerfile.service`) and was resolved in B02.
- Row-count check: 14 KEEP + 34 DONE + 46 PENDING = 94. ✓

## Files this migration will create (IDs assigned on creation)

**Phase 1 (B01–B10):**

- ✅ `packages/service-kit/**`, `packages/storage/**`, `packages/contracts/**` — **created in
  B03**, tracked as `SP-079`–`SP-090` (also: `packages/contracts/src/helpers.test.ts`, new
  coverage).
- ✅ `packages/seed/**` — **created in B04**, tracked as `SP-091`–`SP-094` (the fixtures and
  runners are moves, tracked by `SP-031`–`SP-034`). `SP-013` (`groupData`) has not moved
  into it yet — pending the product decision on the runtime fallback.
- `services/identity/**` (rename target of `services/auth`; new `modules/profile/**`) (B05)
- `services/core/**` with `src/modules/{community,learning,feed,dashboard}/**` (B06–B08)
- `services/messaging/**` (rename target of `services/chat`; new `modules/calls/**`) (B09)
- `services/gateway/src/routes/route-manifest.ts`, `services/gateway/src/middleware/**` (B10)
- ✅ `Dockerfile.service` — **created in B02**
- `packages/eslint-config/service.js` (B10)

**Phase 2+ (B11–B18+), planned in the companion documents:**

- `packages/cache/**` — shared Redis client, presence, rate limiting, cache helpers (B11)
- ✅ `docker-compose.yml` — **created in B02** (Postgres + Redis; Redis unused until B11)
- `packages/events/**` — event envelope, outbox publisher, consumer runtime, DLQ,
  idempotency helper (B13)
- `OutboxEvent` model + migration in `packages/database` (B13)
- Event zod schemas in `packages/contracts/src/events/**` (B13)
- `services/notifications/src/modules/**` — consumer group, notification store, delivery
  adapters (B14)
- `services/core/src/modules/dashboard/read-model/**` (B15)
- `services/core/src/modules/{learning,community}/search/**` (B16)
- `services/messaging/src/projections/**` — follow-edge and user-profile projections
  (B18+, only if a database is extracted)
