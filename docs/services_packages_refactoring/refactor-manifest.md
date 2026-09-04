# services/ and packages/ Refactor Manifest

Every eligible `.ts`, `.js`, `.mjs`, `.json`, `.prisma`, and `.md` file under `services/**`
and `packages/**` is listed below (excluding `node_modules`, `dist`, `.turbo`, and Prisma
`generated/`). IDs follow sorted path order and are stable for this planning pass.

B01 verification (2026-09-04): eligible source count is **78** and matches the 78 manifest
rows. No `services/*` or `packages/*` source was changed. No implementation rows are assigned
to B01; `SP-001`–`SP-078` are inventory inputs only. Files that a batch *creates* get fresh
IDs when they are created (see "Files this migration will create" at the end).

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
| SP-011 | `packages/shared/package.json` | shared | PKG_MANIFEST | SPLIT | Becomes `@repo/service-kit`; new manifests for `@repo/storage`, `@repo/contracts`, `@repo/seed`; `@repo/shared` kept as shim then deleted | B03 / B10 | service-kit | Medium | PENDING |
| SP-012 | `packages/shared/src/config/env.ts` | shared | PKG_MODULE | MOVE | `packages/service-kit/src/config/env.ts`; `servicePorts` gains `core` (value wired B06) | B03 | service-kit | Medium | PENDING |
| SP-013 | `packages/shared/src/data/groups.ts` | seed | SEED_DATA | MOVE | `packages/seed/src/fixtures/groups.ts`; runtime consumers in `services/user` removed (B04) | B04 | seed | Medium | PENDING |
| SP-014 | `packages/shared/src/errors.ts` | shared | PKG_MODULE | MOVE | `packages/service-kit/src/errors.ts` | B03 | service-kit | Low | PENDING |
| SP-015 | `packages/shared/src/index.ts` | shared | PKG_ENTRY | SPLIT | Re-export shim during transition; deleted in B10 | B03 / B10 | service-kit | Medium | PENDING |
| SP-016 | `packages/shared/src/logger.ts` | shared | PKG_MODULE | MOVE | `packages/service-kit/src/logger.ts` | B03 | service-kit | Low | PENDING |
| SP-017 | `packages/shared/src/middleware/errorHandler.ts` | shared | PKG_MODULE | MOVE | `packages/service-kit/src/middleware/errorHandler.ts` | B03 | service-kit | Low | PENDING |
| SP-018 | `packages/shared/src/middleware/internalTokenGuard.ts` | shared | PKG_MODULE | MOVE | `packages/service-kit/src/middleware/internalTokenGuard.ts` | B03 | service-kit | Low | PENDING |
| SP-019 | `packages/shared/src/middleware/validateRequest.ts` | shared | PKG_MODULE | MOVE | `packages/service-kit/src/middleware/validateRequest.ts` | B03 | service-kit | Low | PENDING |
| SP-020 | `packages/shared/src/storage/s3.test.ts` | shared | TEST | MOVE | `packages/storage/src/s3.test.ts` | B03 | storage | Low | PENDING |
| SP-021 | `packages/shared/src/storage/s3.ts` | shared | PKG_MODULE | MOVE | `packages/storage/src/s3.ts` | B03 | storage | Medium | PENDING |
| SP-022 | `packages/shared/src/types/contracts.ts` | shared | PKG_MODULE | MOVE + REFACTOR | `packages/contracts/src/`; add request/response DTOs + shared zod primitives; `ServiceName` → target unit list | B03 | contracts | Medium | PENDING |
| SP-023 | `packages/shared/src/utils/url.ts` | shared | PKG_MODULE | MOVE | `packages/service-kit/src/utils/url.ts` | B03 | service-kit | Low | PENDING |
| SP-024 | `packages/shared/tsconfig.json` | shared | TS_CONFIG | SPLIT | One tsconfig per new package | B03 | service-kit | Low | PENDING |
| SP-025 | `packages/typescript-config/base.json` | tooling | TS_CONFIG | KEEP | Same | — | typescript-config | Low | KEEP |
| SP-026 | `packages/typescript-config/nextjs.json` | tooling | TS_CONFIG | KEEP | Same | — | typescript-config | Low | KEEP |
| SP-027 | `packages/typescript-config/package.json` | tooling | PKG_MANIFEST | KEEP | Same | — | typescript-config | Low | KEEP |
| SP-028 | `packages/typescript-config/react-library.json` | tooling | TS_CONFIG | KEEP | Same | — | typescript-config | Low | KEEP |
| SP-029 | `services/auth/package.json` | identity | PKG_MANIFEST | RENAME | `@services/identity`; drop seed-only deps; add `@repo/storage` for avatar upload | B05 | identity | Medium | PENDING |
| SP-030 | `services/auth/src/controllers/auth.controller.ts` | identity | CONTROLLER | MOVE | `services/identity/src/modules/credentials/`; adopt shared `getAuthenticatedUserId` / `slugify` from `@repo/contracts` | B05 | identity | Medium | PENDING |
| SP-031 | `services/auth/src/controllers/seed.controller.ts` | seed | SEED_CONTROLLER | EXTRACT | `packages/seed/src/runners/*`; invoked only by the dev seed route | B04 | seed | High | PENDING |
| SP-032 | `services/auth/src/data/dashboard.ts` | seed | SEED_DATA | MOVE | `packages/seed/src/fixtures/dashboard.ts` | B04 | seed | Low | PENDING |
| SP-033 | `services/auth/src/data/resources.ts` | seed | SEED_DATA | MOVE | `packages/seed/src/fixtures/resources.ts` | B04 | seed | Low | PENDING |
| SP-034 | `services/auth/src/data/users.ts` | seed | SEED_DATA | MOVE | `packages/seed/src/fixtures/users.ts` | B04 | seed | Low | PENDING |
| SP-035 | `services/auth/src/index.ts` | identity | SERVICE_ENTRY | REFACTOR | `services/identity/src/index.ts`; mount `credentials` + `profile` modules; dev seed route only when `ENABLE_DEV_SEED_ROUTES` | B05 | identity | Medium | PENDING |
| SP-036 | `services/auth/src/routes/auth.routes.ts` | identity | ROUTE | MOVE | `services/identity/src/modules/credentials/credentials.routes.ts` | B05 | identity | Low | PENDING |
| SP-037 | `services/auth/src/routes/auth.validation.ts` | identity | VALIDATION | MOVE | Credentials module; reusable primitives lifted to `@repo/contracts` | B05 | identity | Low | PENDING |
| SP-038 | `services/auth/src/routes/db.routes.ts` | seed | ROUTE | REFACTOR | `services/identity/src/dev/seed-route.ts`; imports `@repo/seed`; dev-guarded; external `/api/db` path preserved | B04 | identity (dev) | Medium | PENDING |
| SP-039 | `services/auth/tsconfig.json` | identity | TS_CONFIG | MOVE | `services/identity/tsconfig.json` | B05 | identity | Low | PENDING |
| SP-040 | `services/chat/package.json` | messaging | PKG_MANIFEST | RENAME | `@services/messaging` | B09 | messaging | Medium | PENDING |
| SP-041 | `services/chat/src/controllers/message.controller.ts` | messaging | CONTROLLER | SPLIT | `messaging/src/modules/messages/*`; call-prep handlers → `modules/calls/*` | B09 | messaging | Medium | PENDING |
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
| SP-067 | `services/resources/src/controllers/resource.controller.ts` | learning | CONTROLLER | MOVE | `services/core/src/modules/learning/resources/resources.controller.ts`; adopt shared primitives | B07 | core | Medium | PENDING |
| SP-068 | `services/resources/src/index.ts` | learning | SERVICE_ENTRY | DELETE | Entry replaced by `services/core/src/index.ts` | B07 | core | Medium | PENDING |
| SP-069 | `services/resources/src/routes/resource.routes.ts` | learning | ROUTE | MOVE | `services/core/src/modules/learning/resources/resources.routes.ts` | B07 | core | Low | PENDING |
| SP-070 | `services/resources/src/routes/resource.validation.test.ts` | learning | TEST | MOVE | `services/core/src/modules/learning/resources/` | B07 | core | Low | PENDING |
| SP-071 | `services/resources/src/routes/resource.validation.ts` | learning | VALIDATION | MOVE | Learning module; `resourceToneSchema` → `@repo/contracts` | B07 | core | Low | PENDING |
| SP-072 | `services/resources/tsconfig.json` | learning | TS_CONFIG | DELETE | Replaced by `services/core/tsconfig.json` | B07 | core | Low | PENDING |
| SP-073 | `services/user/package.json` | multi | PKG_MANIFEST | DELETE | Replaced by `services/core`; profile deps → `identity`, rest → `core` | B06 | core | Medium | PENDING |
| SP-074 | `services/user/src/controllers/user.controller.ts` | multi | CONTROLLER | SPLIT | profile → `identity/modules/profile` (B05); groups + connections + group-events → `core/modules/community` (B06); learning projects/events reads → `core/modules/learning` (B07); dashboard aggregation → `core/modules/dashboard` (B08) | B05–B08 | identity + core | High | PENDING |
| SP-075 | `services/user/src/index.ts` | multi | SERVICE_ENTRY | DELETE | Entry replaced by `services/core/src/index.ts` | B06 | core | Medium | PENDING |
| SP-076 | `services/user/src/routes/user.routes.ts` | multi | ROUTE | SPLIT | Same fan-out as the controller; every external path preserved through the gateway route manifest | B05–B08 | identity + core | High | PENDING |
| SP-077 | `services/user/src/routes/user.validation.ts` | multi | VALIDATION | SPLIT | Profile schemas → `identity`; group/connection schemas → `core`; primitives → `@repo/contracts` | B05–B08 | identity + core | Medium | PENDING |
| SP-078 | `services/user/tsconfig.json` | multi | TS_CONFIG | DELETE | Replaced by `services/core/tsconfig.json` | B06 | core | Low | PENDING |

## Rows by batch

- **B01** (docs only): none.
- **B02** (CI/CD parity): infra files only — `.github/workflows/ci.yml`,
  `.github/workflows/deploy-services.yml`, new `Dockerfile.service`,
  `tests/contracts.smoke.mjs`, root `package.json`. No `SP-*` source rows.
- **B03** (shared split): SP-011, SP-012, SP-014, SP-015, SP-016, SP-017, SP-018, SP-019,
  SP-020, SP-021, SP-022, SP-023, SP-024 (+ import updates across every service entry/route).
- **B04** (seed extraction): SP-013, SP-031, SP-032, SP-033, SP-034, SP-038 (+ SP-074/SP-076
  runtime-fallback removal).
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

- Rows: 78. Duplicate IDs: 0. Duplicate files: 0.
- `KEEP` (no change intended): SP-002, SP-004, SP-005, SP-007, SP-008, SP-010, SP-025,
  SP-026, SP-027, SP-028, SP-056, SP-060, SP-061, SP-065 — 14 rows.
- `PENDING` (actionable, batch assigned): 64 rows.
- `BLOCKED`: 0 in the manifest. One infra blocker tracked in
  `service-decomposition-plan.md`: the missing `Dockerfile.service` (B02).
- `DONE`: 0 — no implementation batch has run.

## Files this migration will create (IDs assigned on creation)

**Phase 1 (B01–B10):**

- `packages/service-kit/**`, `packages/storage/**`, `packages/contracts/**`,
  `packages/seed/**` (B03, B04)
- `services/identity/**` (rename target of `services/auth`; new `modules/profile/**`) (B05)
- `services/core/**` with `src/modules/{community,learning,feed,dashboard}/**` (B06–B08)
- `services/messaging/**` (rename target of `services/chat`; new `modules/calls/**`) (B09)
- `services/gateway/src/routes/route-manifest.ts`, `services/gateway/src/middleware/**` (B10)
- `Dockerfile.service` (B02)
- `packages/eslint-config/service.js` (B10)

**Phase 2+ (B11–B18+), planned in the companion documents:**

- `packages/cache/**` — shared Redis client, presence, rate limiting, cache helpers (B11)
- `docker-compose.yml` — local Postgres + Redis (B11)
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
