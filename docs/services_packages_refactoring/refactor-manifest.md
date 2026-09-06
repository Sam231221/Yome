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

B04 completed (2026-09-04): `packages/seed` created; `SP-031`–`SP-034`, `SP-038`, and `SP-013`
are `DONE` (seed controller + 4 fixture files extracted verbatim; `db.routes.ts` rewritten as
a thin route mounting one `devSeedGuard` middleware instead of 5 repeated per-handler checks).
4 new files assigned `SP-091`–`SP-094`. The batch's own spec required presenting the
first-run behaviour change before touching the `groupData` runtime fallback in
`services/user/src/controllers/user.controller.ts` (`getUnassociatedGroupsForUser`,
`joinUnjoinedGroups`) — asked the user; **decision: remove it**, matching the batch's original
goal of zero seed code reachable from a production runtime path. Verified end-to-end against
a disposable local Postgres instance (docker, migrated schema, no shared data at risk): a
zero-group database now returns `{"unassociatedGroups":[]}` instead of ~15 synthetic cards,
and `joinUnjoinedGroups` with a `groupData-N` id now 400s "Invalid group to join" instead of
materialising a group. The seed subsystem guard was also verified without touching a real
database: with `ENABLE_DEV_SEED_ROUTES=false` all 5 `/api/db/*` paths still 404 exactly as
before; with it `=true` and a deliberately unreachable `DATABASE_URL`, all 5 pass the guard
and reach the moved `packages/seed/dist/runners.js` code (confirmed in the error stack trace)
before failing on `ECONNREFUSED`.

B05 completed (2026-09-05): `services/auth` renamed to `services/identity` (`SP-029`,
`SP-030`, `SP-035`–`SP-037`, `SP-039` now `DONE`); the credentials module moved verbatim into
`src/modules/credentials/`. The profile portion of `services/user/src/controllers/user.controller.ts`
(`getUserById`, `updateUser`, `getAllUsers`) was extracted into a new `src/modules/profile/`
module (`SP-095`–`SP-097`), leaving `SP-074`/`SP-076`/`SP-077` with their community/learning/
dashboard portions still pending in B06–B08. `SP-038`'s "Current File" is corrected to its
further-renamed path, `services/identity/src/dev/seed-route.ts` (its B04 `DONE` status is
unaffected — only the path moved again). The gateway's routing table was extracted into a
tested, framework-free module (`services/gateway/src/routeRules.ts` + `routeRules.test.ts`,
`SP-098`–`SP-099`) so `index.ts` mounts routes from one ordered array instead of 8 hand-written
`app.use()` calls; the route test parses `apps/web/utils/ApiRoutes.ts` and asserts all 42
externally-visible paths resolve to exactly one upstream, including the 3 profile paths now
resolving to `identity` instead of `user`. Per an explicit user decision, `AUTH_SERVICE_URL`/
`AUTH_SERVICE_PORT` were fully renamed (not kept as aliases) to `IDENTITY_SERVICE_URL`/
`IDENTITY_SERVICE_PORT` everywhere: `turbo.json`, `.env.example`, `.env`, `package.json`
(service-kit's `servicePorts`, gateway's `serviceBaseUrls`), `tests/contracts.smoke.mjs`, both
CI workflows (`@services/auth` → `@services/identity`, `yome-auth` → `yome-identity`), and the
narrative docs. Live-verified end-to-end against a disposable Postgres instance (docker,
migrated schema, ports remapped, no shared data at risk): gateway `/health` reports
`serviceBaseUrls.identity`; `POST /api/auth/register-user` through the gateway reaches
identity and writes a user; `POST /api/user/get-user-by-id` through the gateway reaches
identity (returns the joined profile), while `GET /api/user/get-all-groups` still reaches
`user`; hitting the moved profile path directly against `user` (with the internal token
satisfied) now 404s, and hitting a `user`-only path directly against `identity` also 404s —
confirming a clean split, not an accidental duplication. Disposable container and processes
torn down after verification; the real `.env`/database were never touched.

B06 completed (2026-09-05): `services/core` created with its first module,
`community` (`SP-100`–`SP-105`, all `DONE`). The 16 group/connection/invitation functions in
`services/user/src/controllers/user.controller.ts` (community portion of `SP-074`) moved
verbatim into `community.controller.ts`, along with a new local `assertSelf` guard that
consolidates the repeated `x-user-id` vs `loggedInUserId` 401+403 check — explicitly requested
by the batch rather than left copy-pasted across ~9 handlers. `services/user`'s validation
file adopted `@repo/contracts`'s `positiveInt`/`slugOrUuidSchema`/`toneSchema` primitives
(available since B03, not previously force-adopted here) instead of re-declaring them.

**Plan-vs-reality correction, resolved before implementation, not after:** `architecture-plan.md`'s
B06 "Definition of Done" says `services/user` is deleted, and this manifest's own
`SP-073`/`SP-075`/`SP-078` rows were pre-assigned `DELETE`/B06. Reading the actual controller
before moving anything showed `getLearningEvents`, `getLearningProjects`,
`getLearningProjectById`, and `getDashboardHome` are **not** community-domain — they read
`GroupEvent`/`Post`/`StudyRoom`/`Topic` for the "learning" and "dashboard" pages, and
`architecture-plan.md`'s own B07/B08 sections independently confirm this (B07: "move learning
projects/events reads ... from the former `services/user` code"; neither B07 nor B08's own
Definition of Done repeats B06's "services/user is deleted" claim). Community was the only
domain in scope for this batch's copy-paste instruction, which itself says "delete
`services/user` **when empty**" — conditional wording that already anticipated this exact
case. Followed the more precise, conditional instruction over the imprecise prose:
`services/user` stays alive, now serving only 3 external paths (`events`, `projects`,
`dashboard`); `SP-073`/`SP-075`/`SP-078` corrected from `DELETE`/B06 to `KEEP (for now)`/B08 (or
`REFACTOR`/B06 for `SP-075`, which got a same-batch dead-code fix — see below). No user
decision was needed here: this was a documentation/manifest inconsistency to resolve by
re-deriving the split from the actual code and the plan's own later sections, not a product
trade-off.

**Also fixed, found while touching `services/user/src/index.ts` for the split**: a stale
`validateObjectStorageEnv()` call and `storageProvider` boot-log field, left over from B05 —
this service stopped touching S3/multer entirely when avatar upload moved to `identity`, but
the startup validation call for those env vars was never removed. Zero behavior change for a
correctly configured deploy; a previously-unnecessary startup dependency on `AWS_*` env vars
being set is now gone.

`SCHEMA_OWNERSHIP.md` (`SP-001`) got a real content update — `Group`, `GroupTag`,
`GroupInvitation`, `GroupAnnouncement`, `GroupEvent` reassigned from `Auth`/`User service` to
`Core (community module)`, plus new rows for `StudyRoom`/`Topic` (planned `learning`, B07) and
`Post`/`Comment`/`Like` (planned `feed`, B08) that weren't listed at all before. This is a
partial, name-and-ownership-accuracy pass, not the full model-per-owning-module rewrite
`SP-001`'s own row still defers to B10.

Live-verified end-to-end against a disposable Postgres instance (docker, migrated schema,
remapped ports, `identity` + `user` + `core` + `gateway` all running together): gateway
`/health` reports `serviceBaseUrls.core`; `discoverGroups` and `createGroup` through the
gateway both reach `core` (the latter proven with a direct-to-service call satisfying the
internal-token + `x-user-id` headers the gateway would normally attach, since the gateway's
own NextAuth-cookie auth can't be simulated without a real browser session); `dashboard` and
`events` through the gateway still reach `user`. Cross-service checks in both directions
(`core` hit directly for `/api/user/dashboard` → 404; `user` hit directly for
`/api/user/groups/discover` and `/api/user/get-all-groups` → 404) confirm a clean split, no
duplication. `assertSelf`'s 403 path verified directly (mismatched `x-user-id` vs
`loggedInUserId` on `createGroup` → `{"ok":false,"error":"Forbidden"}`). Disposable
infrastructure torn down after; the real `.env`/database were never touched.

B07 completed (2026-09-05): `services/resources` deleted, folded verbatim into
`services/core/src/modules/learning/resources/` (`SP-066`–`SP-072`, all `DONE`); the learning
reads `getLearningEvents`/`getLearningProjects`/`getLearningProjectById` extracted from
`services/user/src/controllers/user.controller.ts` into a new
`services/core/src/modules/learning/learning.controller.ts` (`SP-106`–`SP-108`), following the
exact same duplicate-what's-still-needed pattern B06 established for `getDashboardHome`'s
remaining dependencies. A new `services/core/src/modules/learning/reads.ts` (`SP-109`)
extracts `getLiveStudyRooms()`/`getTrendingTopics()` out of `getDashboardHome`'s inline
`Promise.all` — per the batch's explicit instruction — as standalone functions `learning` now
owns, but **not yet called by `getDashboardHome`**, which stays in `services/user` (per B06's
established precedent, confirmed again by B07/B08's own manifest-ID scoping never touching the
dashboard portion of `SP-074`) and keeps its own inline duplicate query until B08 moves
dashboard into `core` and wires it to call these instead. `@repo/contracts`'s `toneSchema`
adopted for the moved resource validation (byte-identical value set to the local
`resourceToneSchema` it replaced, fulfilling a note `SP-083` left in B03); `@repo/contracts`
itself dropped as a now-unused direct dependency of `services/user/package.json` once
`projectIdParamsSchema` moved away with it. `ServiceName` (`SP-022`) and `servicePorts`
(`SP-012`) both lost their `resources` member/getter — dead now that the service is gone.
Gateway `routeRules.ts` simplified: with `events`/`projects` moved to `core` (same upstream as
the existing general `/api/user` catch-all), the 3 B06-era user-specific rules collapsed to
just 1 (`dashboard`). `SCHEMA_OWNERSHIP.md` gained a `Resource*` row (didn't exist before B07
at all) and upgraded `StudyRoom`/`Topic` from "planned" to "read-only, owned by learning".
Live-verified end-to-end against a disposable Postgres instance (docker, migrated schema,
remapped ports): a resource created and listed through the real gateway round-trips through
`core`; `events`/`projects` through the gateway reach `core` while `dashboard` still reaches
`user`, confirmed both by the gateway (401-shaped responses proving real controllers were
reached) and directly against each service (`core` 404s on `/api/user/dashboard`; `user` 404s
on `/api/user/events`, `/api/user/projects`, and `/api/resources`). Disposable infrastructure
torn down after; the real `.env`/database were never touched.

B08 completed (2026-09-05): `getDashboardHome` — the last function in
`services/user/src/controllers/user.controller.ts` — moved into a new
`services/core/src/modules/dashboard/` (`SP-110`–`SP-112`, all `DONE`), and `services/user`
deleted outright (`SP-073`, `SP-075`, `SP-078` finally `DONE`, not just `KEEP (for now)`).
Per the batch's explicit architectural requirement, `getDashboardHome` now **composes** the
other modules' own read surfaces instead of querying their tables directly: two new helpers,
`community/reads.ts`'s `getSidebarGroups`/`getUpcomingEvents` (`SP-113`), join `learning/reads.ts`'s
`getLiveStudyRooms`/`getTrendingTopics` (already built in B07, `SP-109`) and a new
`feed/reads.ts`'s `getRecentPosts` (`SP-114`, the first file in `core`'s new `feed` module —
the batch's other requirement, "give `Post`/`Comment`/`Like` an owner"; no write endpoint for
any of the three exists anywhere in the app yet, confirmed by a repo-wide grep before writing
anything, so there was no write code to move). `community.controller.ts` now **exports**
`mapGroupCard`/`mapUserCard`/`getUserName`/`getInitials` (previously private) so dashboard can
import them instead of keeping a 4th duplicate copy — resolving the dashboard-vs-community
duplication B06/B07 explicitly left behind *because* dashboard was in a different service at
the time. `ServiceName` lost `"user"` (and `"auth"`, dead since B05 but never cleaned up) as
literal values; `servicePorts` lost its `user` getter; the gateway's `routeRules.ts` lost its
`"user"` `Upstream` entirely (was already down to one specific rule after B07 — now gone, the
general `/api/user` catch-all to `core` covers everything). `SCHEMA_OWNERSHIP.md`'s `Post`/
`Comment`/`Like` row moved from "Feed (planned)" to `Core (feed module)`.

**Response-shape and latency check, as the batch explicitly required**: git-worktree'd the
parent commit (pre-B08) alongside the current tree, seeded the *same* disposable Postgres
database once, then ran the dashboard endpoint against both — old code (monolithic inline
queries in `services/user`) and new code (composed module calls in `services/core`) — with
identical seeded data. The two JSON responses diffed **byte-for-byte identical** (`diff` on
pretty-printed output: zero lines differ). Timing: ~10 warm requests each, old averaging
~0.010s, new averaging ~0.009s — no regression; the module composition is still an in-process
function call, not a network hop, so there was no reason to expect one, but the batch asked
for the number rather than the assumption. Full numbers recorded in `migration-log.md`.

Live-verified end-to-end beyond the timing check: through the real gateway, community
(`/api/user/groups/discover`), learning (`/api/user/events`), resources (`/api/resources`),
and dashboard (`/api/user/dashboard/1`) all now reach `core` — confirmed by response content,
not just status code, since `core` is the only upstream left for `/api/user`. Gateway
`/health` no longer lists a `user` key at all. Disposable Postgres, worktree, and all
processes torn down after; the real `.env`/database were never touched.

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
| SP-001 | `packages/database/SCHEMA_OWNERSHIP.md` | database | DOC | REFACTOR | **B10: full rewrite to a systematic one-row-per-model table (all 18 models, matching `schema.prisma` exactly).** Fixed a real gap: `Conversation` had never been listed at all, despite `messaging` owning it since B09 (and `chat` before that). B06-B08's incremental narrative-notes history is summarized in the new table's per-row notes rather than kept verbatim. **B14: added `OutboxEvent` (infra; the B13 outbox table this file had never listed) and `Notification` (owner `notifications`) rows; noted `User.notificationCount` as a second cross-module write exception on `User`; rewrote the `notifications` boundary bullet (real consumer, Postgres `jsonb` store per T-07)** | B06 (partial), B07 (partial), B08 (partial), B10 (full rewrite), B14 | database | Low | DONE |
| SP-002 | `packages/database/package.json` | database | PKG_MANIFEST | KEEP | Same | B10 | database | Low | KEEP |
| SP-003 | `packages/database/prisma/schema.prisma` | database | PRISMA_SCHEMA | REFACTOR | Single schema retained (splitting it is P5, not this batch); added a `/// owner: <module>` doc comment above all models, cross-referenced from `SCHEMA_OWNERSHIP.md`'s opening paragraph so the two can be diffed against each other instead of drifting independently. `prisma validate` and `prisma generate` both verified clean. **B13: `OutboxEvent` model + `20260905212323_add_outbox_event` migration.** **B14: `Notification` model (`userId` FK, `type`, `eventId`, `title`, `body`, `payload` Json, `readAt`, `createdAt`; `@@unique([eventId, userId])` as the replay backstop; indexes on `[userId, createdAt]` and `[userId, readAt]`) + `User.notifications` back-relation + `20260906120000_add_notification` migration. `SCHEMA_OWNERSHIP.md` (SP-001) updated with both new models — it had never listed `OutboxEvent`** | B10, B13, B14 | database | Medium | DONE |
| SP-004 | `packages/database/src/client.d.ts` | database | DB_CLIENT | KEEP | Same | — | database | Low | KEEP |
| SP-005 | `packages/database/src/client.js` | database | DB_CLIENT | KEEP | Same | — | database | Low | KEEP |
| SP-006 | `packages/eslint-config/README.md` | tooling | DOC | REFACTOR | Documents the new `service` profile (SP-009) and every existing profile, which the README never described at all before B10 | B10 | eslint-config | Low | DONE |
| SP-007 | `packages/eslint-config/base.js` | tooling | LINT_CONFIG | KEEP | Same | — | eslint-config | Low | KEEP |
| SP-008 | `packages/eslint-config/next.js` | tooling | LINT_CONFIG | KEEP | Same | — | eslint-config | Low | KEEP |
| SP-009 | `packages/eslint-config/package.json` | tooling | PKG_MANIFEST | REFACTOR | Added a `./service` export pointing at the new `service.js` (base config + Node globals, no React/browser rules) | B10 | eslint-config | Low | DONE |
| SP-010 | `packages/eslint-config/react-internal.js` | tooling | LINT_CONFIG | KEEP | Same | — | eslint-config | Low | KEEP |
| SP-011 | `packages/shared/package.json` | shared | PKG_MANIFEST | DELETE | **B03: unchanged path (still the shim's manifest); depended on `@repo/contracts`, `@repo/service-kit`, `@repo/storage` only, dropped `zod`/`@aws-sdk/client-s3`/`express` peer.** **B10: deleted along with the rest of `packages/shared`** — every one of the 28 remaining `@repo/shared` import sites was repointed to the specific package it needed in the same commit | B03 (split), B10 (delete) | service-kit | Medium | DONE |
| SP-012 | `packages/service-kit/src/config/env.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/config/env.ts`; `servicePorts` gained a `core` getter (value wired B06). **B07: `resources` getter removed — dead now that `services/resources` no longer exists.** **B08: `user` getter removed for the same reason.** | B03 | service-kit | Medium | DONE |
| SP-013 | `packages/seed/src/fixtures/groups.ts` | seed | SEED_DATA | MOVE | Moved from `packages/shared/src/data/groups.ts`. Decision confirmed with the user: the `services/user` runtime fallback that read it directly was removed rather than kept (see `SP-074`/`SP-076`) — this fixture is now reachable only from `@repo/seed`, never from a production runtime path | B04 | seed | Medium | DONE |
| SP-014 | `packages/contracts/src/errors.ts` | shared | PKG_MODULE | MOVE + REFACTOR | Moved from `packages/shared/src/errors.ts` (`createHttpError`); also absorbed `ErrorEnvelope` from the old `types/contracts.ts` (see SP-022) — both are pure, no Express dep | B03 | contracts | Low | DONE |
| SP-015 | `packages/shared/src/index.ts` | shared | PKG_ENTRY | DELETE | **B03: content replaced with a re-export shim** (`@repo/contracts` + `@repo/service-kit` + `@repo/storage`; `groupData` moved out to `@repo/seed` in B04). **B10: deleted** — the shim's whole reason to exist | B03 (split), B10 (delete) | service-kit | Medium | DONE |
| SP-016 | `packages/service-kit/src/logger.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/logger.ts`, unchanged | B03 | service-kit | Low | DONE |
| SP-017 | `packages/service-kit/src/middleware/errorHandler.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/middleware/errorHandler.ts`; `ErrorEnvelope` import repointed to `@repo/contracts` | B03 | service-kit | Low | DONE |
| SP-018 | `packages/service-kit/src/middleware/internalTokenGuard.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/middleware/internalTokenGuard.ts`, unchanged | B03 | service-kit | Low | DONE |
| SP-019 | `packages/service-kit/src/middleware/validateRequest.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/middleware/validateRequest.ts`, unchanged | B03 | service-kit | Low | DONE |
| SP-020 | `packages/storage/src/s3.test.ts` | shared | TEST | MOVE | Moved from `packages/shared/src/storage/s3.test.ts`; test script fixed to `bun test ./src` (glob bug found in B03 — see issue #40-adjacent note in migration-log) | B03 | storage | Low | DONE |
| SP-021 | `packages/storage/src/s3.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/storage/s3.ts`; `createHttpError` import repointed to `@repo/contracts` | B03 | storage | Medium | DONE |
| SP-022 | `packages/contracts/src/service.ts` | shared | PKG_MODULE | MOVE + REFACTOR + SPLIT | Moved from `packages/shared/src/types/contracts.ts`; `ServiceName`/`HealthResponse` stayed here, `ErrorEnvelope` moved into SP-014 instead (`errors.ts`) — the one place this manifest's own MOVE destinations disagreed with the actual split, corrected in the B03 completeness audit. **B07: `"resources"` removed from the `ServiceName` union — fulfills this batch's own Definition of Done ("`ServiceName` no longer needs a `resources` member").** **B08: `"user"` removed for the same reason (`services/user` deleted); also removed `"auth"`, dead since the B05 rename to `identity` but never cleaned up until now — confirmed via grep neither literal value is referenced anywhere as a `ServiceName`.** | B03 | contracts | Medium | DONE |
| SP-023 | `packages/service-kit/src/utils/url.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/utils/url.ts`, unchanged | B03 | service-kit | Low | DONE |
| SP-024 | `packages/shared/tsconfig.json` | shared | TS_CONFIG | KEEP | Unchanged path; still builds the shim. New packages get their own tsconfigs — see SP-086, SP-089, SP-092 | B03 | shared | Low | DONE |
| SP-025 | `packages/typescript-config/base.json` | tooling | TS_CONFIG | KEEP | Same | — | typescript-config | Low | KEEP |
| SP-026 | `packages/typescript-config/nextjs.json` | tooling | TS_CONFIG | KEEP | Same | — | typescript-config | Low | KEEP |
| SP-027 | `packages/typescript-config/package.json` | tooling | PKG_MANIFEST | KEEP | Same | — | typescript-config | Low | KEEP |
| SP-028 | `packages/typescript-config/react-library.json` | tooling | TS_CONFIG | KEEP | Same | — | typescript-config | Low | KEEP |
| SP-029 | `services/identity/package.json` | identity | PKG_MANIFEST | RENAME | Renamed to `@services/identity`; added `@repo/seed`/`multer` (absorbed from `services/user`). **B05 completeness audit (2026-09-05): `@repo/storage` was also added on the (wrong) assumption that avatar upload needs it directly — `uploadBufferToS3` is only reached via `@repo/shared`'s re-export, exactly like `services/user` did before the move, and `services/identity/src` has zero direct `@repo/storage` imports. Removed as an unused direct dependency; `build`/`check-types` unaffected.** | B05 | identity | Medium | DONE |
| SP-030 | `services/identity/src/modules/credentials/credentials.controller.ts` | identity | CONTROLLER | MOVE | Moved from `services/auth/src/controllers/auth.controller.ts`. **B03: now imports `getAuthenticatedUserId` from `@repo/shared`, local copy deleted.** **B13: `registerUser`/`upsertOAuthUser` wrapped in `withOutbox` (see SP-139) -> `identity.user.registered`; `changePassword` -> `identity.user.password_changed`** | B05, B13 | identity | Medium | DONE |
| SP-031 | `packages/seed/src/runners.ts` | seed | SEED_CONTROLLER | EXTRACT | Moved from `services/auth/src/controllers/seed.controller.ts`; per-handler `rejectIfSeedDisabled` calls removed (5x), guard now applied once at the route layer — see `SP-091` | B04 | seed | High | DONE |
| SP-032 | `packages/seed/src/fixtures/dashboard.ts` | seed | SEED_DATA | MOVE | Moved from `services/auth/src/data/dashboard.ts`, unchanged | B04 | seed | Low | DONE |
| SP-033 | `packages/seed/src/fixtures/resources.ts` | seed | SEED_DATA | MOVE | Moved from `services/auth/src/data/resources.ts`, unchanged | B04 | seed | Low | DONE |
| SP-034 | `packages/seed/src/fixtures/users.ts` | seed | SEED_DATA | MOVE | Moved from `services/auth/src/data/users.ts`, unchanged | B04 | seed | Low | DONE |
| SP-035 | `services/identity/src/index.ts` | identity | SERVICE_ENTRY | REFACTOR | Moved from `services/auth/src/index.ts`; mounts `credentials` (`/api/auth`), `profile` (`/api/user`), and `dev/seed-route` (`/api/db`) modules | B05 | identity | Medium | DONE |
| SP-036 | `services/identity/src/modules/credentials/credentials.routes.ts` | identity | ROUTE | MOVE | Moved from `services/auth/src/routes/auth.routes.ts`, imports repointed to `credentials.controller.ts`/`credentials.validation.ts` | B05 | identity | Low | DONE |
| SP-037 | `services/identity/src/modules/credentials/credentials.validation.ts` | identity | VALIDATION | MOVE | Moved from `services/auth/src/routes/auth.validation.ts`; `nameSchema`/`usernameSchema` now imported from `@repo/contracts` (promoted, byte-identical duplicate in `user.validation.ts` removed — see SP-077) | B05 | identity | Low | DONE |
| SP-038 | `services/identity/src/dev/seed-route.ts` | seed | ROUTE | REFACTOR | B04: rewritten from `services/auth/src/routes/db.routes.ts` as a thin route mounting one `devSeedGuard` from `@repo/seed`. **B05: further moved (path only, no content change) from `services/auth/src/routes/db.routes.ts` to this path as part of the identity rename** — external `/api/db` path preserved throughout | B04 (content), B05 (path) | identity (dev) | Medium | DONE |
| SP-039 | `services/identity/tsconfig.json` | identity | TS_CONFIG | MOVE | Moved from `services/auth/tsconfig.json`, unchanged content | B05 | identity | Low | DONE |
| SP-040 | `services/messaging/package.json` | messaging | PKG_MANIFEST | RENAME | `@services/messaging`. `test` script also changed from `bun test src/**/*.test.ts` to `bun test ./src` — the exact B03 sh-vs-bun-glob bug recurred once test files moved under `modules/`. **B11: added `@repo/cache` + `@socket.io/redis-adapter`** | B09, B11 | messaging | Medium | DONE |
| SP-041 | `services/messaging/src/modules/messages/messages.controller.ts` | messaging | CONTROLLER | SPLIT | Messages handlers (`getMessages`, `getOrCreateConversation`, `addMessage`, `addMediaMessage`, `getInitialUsersWithMessages`, `getInitialGroupsWithMessages`) stay here, byte-identical; call-prep handlers (`prepareDirectCallConversation`, `validateDirectConversation`) moved to `modules/calls/calls.controller.ts` (see SP-115). New `authorizeUploadScope` handler added here too (no separate row — it's an addition to this same file, same convention as B08's community.controller.ts export additions in SP-103). **B11: `isUserOnline`/`getOnlineUserIds` now imported from `@repo/cache` (see SP-052) instead of the deleted local module, both calls now `await`ed.** **B13: `createDirectMessage` (shared by `addMessage`/`addMediaMessage`'s direct-chat branches) wrapped in `withOutbox` -> `messaging.conversation.created` (only when one was actually created) + `messaging.message.sent` together; `getOrCreateConversation` -> `messaging.conversation.created` (conditional); `addMessage`/`addMediaMessage`'s group-chat branches -> `messaging.message.sent`; `getMessages`'s bulk unread-to-read update -> one `messaging.message.read` per message (issue #22's GET-with-side-effects is unchanged, now outbox-instrumented like every other write)** | B09, B11, B13 | messaging | Medium | DONE |
| SP-042 | `services/messaging/src/index.ts` | messaging | SERVICE_ENTRY | REFACTOR | Mounts `messages.routes.ts` and `calls.routes.ts`, both still at `/api/chat`; `attachSocketHandlers` now imported from `modules/realtime/handlers.ts`. `service`/`servicePorts` key `chat` → `messaging`. **B11: wires `@socket.io/redis-adapter` with two duplicated `@repo/cache` Redis connections (pub/sub), so `io.to(socketId).emit(...)` crosses replicas** | B09, B11 | messaging | Medium | DONE |
| SP-043 | `services/messaging/src/modules/messages/conversations.test.ts` | messaging | TEST | MOVE | Unchanged | B09 | messaging | Low | DONE |
| SP-044 | `services/messaging/src/modules/messages/conversations.ts` | messaging | DOMAIN_LIB | MOVE | Unchanged. **B13: `getOrCreateDirectConversation` now returns `{ conversation, created }` instead of just the conversation — every caller needs `created` to decide whether to publish `messaging.conversation.created`** | B09, B13 | messaging | Low | DONE |
| SP-045 | `services/messaging/src/modules/messages/direct-messages.test.ts` | messaging | TEST | MOVE | Unchanged | B09 | messaging | Low | DONE |
| SP-046 | `services/messaging/src/modules/messages/direct-messages.ts` | messaging | DOMAIN_LIB | MOVE | Unchanged | B09 | messaging | Low | DONE |
| SP-047 | `services/messaging/src/modules/messages/messages.routes.ts` | messaging | ROUTE | SPLIT | Messages routes stay here (+ new `authorize-upload-scope` route); calls routes moved to `modules/calls/calls.routes.ts` (see SP-116). Both mount at `/api/chat` in `index.ts`; external `/api/chat` and `/api/messages` paths preserved | B09 | messaging | Medium | DONE |
| SP-048 | `services/messaging/src/modules/messages/messages.validation.test.ts` | messaging | TEST | SPLIT | Messages-schema tests stay here; call-schema tests moved to `modules/calls/calls.validation.test.ts` (new — see SP-118) | B09 | messaging | Low | DONE |
| SP-049 | `services/messaging/src/modules/messages/messages.validation.ts` | messaging | VALIDATION | SPLIT | Messages schemas (+ new `authorizeUploadScopeSchema`) stay here; call schemas moved to `modules/calls/calls.validation.ts` (see SP-117). Primitives stayed local (each file only needs a subset — `uuidString`/`positiveIntString` aren't needed by any call schema), so nothing moved to `@repo/contracts` here | B09 | messaging | Low | DONE |
| SP-050 | `services/messaging/src/modules/realtime/handlers.ts` | messaging | SOCKET | MOVE | **B09:** unchanged besides the relative import of `online-users.js` (now same-directory). **B11: REFACTOR** — presence calls now import from `@repo/cache` (async), every handler that touches presence is now an `async` function; added a 20s per-socket heartbeat refreshing the presence TTL, cleared on signout/disconnect | B09, B11 | messaging | Medium | DONE |
| SP-051 | `services/messaging/src/modules/realtime/online-users.test.ts` | messaging | TEST | MOVE | Unchanged | B09 | messaging | Low | DONE |
| SP-052 | `services/messaging/src/modules/realtime/online-users.ts` | messaging | STATE | DELETE | **B09:** moved unchanged from `services/chat`. **B11: deleted** — its Map-based API moved to `packages/cache/src/presence.ts` (see SP-127), now Redis-backed instead of in-process, fixing issue #16 | B09, B11 | messaging | Low | DONE |
| SP-053 | `services/messaging/tsconfig.json` | messaging | TS_CONFIG | MOVE | Unchanged | B09 | messaging | Low | DONE |
| SP-054 | `services/gateway/package.json` | edge | PKG_MANIFEST | REFACTOR | **B10:** `"lint": "eslint ."` replaces the echo stub. **B11: added `@repo/cache`** | B10, B11 | gateway | Low | DONE |
| SP-055 | `services/gateway/src/index.ts` | edge | SERVICE_ENTRY | SPLIT + REFACTOR | Split into bootstrap-only `index.ts` + `routes/route-manifest.ts` (renamed from B05's `routeRules.ts`, extended with per-rule `timeoutMs`) + `middleware/{requestId,rateLimiter,auth,proxy}.ts`. `proxy.ts` adds the resilience layer that never existed: per-route timeout (5s default, 30s for `/api/media`), retry for idempotent methods only (2 attempts, exponential backoff, never on an actual HTTP response), and a per-upstream circuit breaker (opens at 5 consecutive failures, half-opens after 30s). Live-verified against a controlled fake upstream: timeout returns 504, exactly 2 attempts hit the fake server per idempotent GET, the circuit opens on the 5th failure and short-circuits with zero further network calls after that | B10 | gateway | High | DONE |
| SP-056 | `services/gateway/tsconfig.json` | edge | TS_CONFIG | KEEP | Same | — | gateway | Low | KEEP |
| SP-057 | `services/media/package.json` | media | PKG_MANIFEST | REFACTOR | `@repo/database` dependency removed; `axios` added (for the new call to `messaging`). Note: media never actually depended on `@repo/storage` as a workspace package — S3 upload helpers reach it via `@repo/shared`'s re-export, same pattern the B05 audit found and fixed for `identity` | B09 | media | Medium | DONE |
| SP-058 | `services/media/src/controllers/media.controller.ts` | media | CONTROLLER | REFACTOR | `getChatUploadScope`'s direct `Conversation`/`Group` Prisma reads replaced with one `POST /api/chat/authorize-upload-scope` call to `messaging` (per `api-and-dataflow-plan.md`'s Service-to-Service Call Rules — a sync call, not a gateway-injected claim). Fixed a real bug found while live-testing this: `GATEWAY_SHARED_TOKEN`/`MESSAGING_SERVICE_URL` must be read inside the function body, not as a module-level constant — this file is imported before `index.ts`'s own `dotenv.config()` call runs | B09 | media | High | DONE |
| SP-059 | `services/media/src/index.ts` | media | SERVICE_ENTRY | REFACTOR | No change needed — it never had DB env validation to drop, only `validateObjectStorageEnv()`, which is kept | B09 | media | Low | DONE |
| SP-060 | `services/media/src/routes/media.routes.ts` | media | ROUTE | KEEP | Same | B09 | media | Low | KEEP |
| SP-061 | `services/media/tsconfig.json` | media | TS_CONFIG | KEEP | Same | — | media | Low | KEEP |
| SP-062 | `services/notifications/package.json` | notifications | PKG_MANIFEST | REFACTOR | `"lint": "eslint ."` replaces the echo stub. **B14: added `@repo/database`, `@repo/contracts`, `@repo/events`, `@repo/cache`, and `zod` deps; `"test"` is now `bun test ./src` (real suite) not an echo stub** | B10, B14 | notifications | Low | DONE |
| SP-063 | `services/notifications/src/index.ts` | notifications | SERVICE_ENTRY | REFACTOR | **B10 review resolved: keep as its own process** (`service-decomposition-plan.md`'s locked design decisions already settled this — `services/notifications` is the designated first event consumer, which justifies its own deployable). **B14: that consumer is now wired — `startNotificationConsumer()` runs in-process here (the mirror of `core`'s in-process `startRelay`), with graceful shutdown draining the consumer loop before the HTTP server on `SIGTERM`/`SIGINT`** | B10, B14 | notifications | Low | DONE |
| SP-064 | `services/notifications/src/routes/notifications.routes.ts` | notifications | ROUTE | REFACTOR | Extracted the inline `/send` handler to a new `controllers/notifications.controller.ts` (B10). **B14: added `GET /` (list, `?unread`/`?limit`/`?cursor`, `validateRequest`-guarded), `POST /read-all`, and `POST /:id/read` (uuid-param-guarded); `POST /send` stub unchanged. `notifications.controller.ts` gained `getNotifications`/`readNotification`/`readAllNotifications` (auth via gateway `x-user-id`, delegating to `store/notificationStore.ts` — SP-149); new `notifications.validation.ts` (SP-151) holds the zod schemas** | B10, B14 | notifications | Low | DONE |
| SP-065 | `services/notifications/tsconfig.json` | notifications | TS_CONFIG | KEEP | Same | — | notifications | Low | KEEP |
| SP-066 | `services/resources/package.json` | learning | PKG_MANIFEST | DELETE | Deleted — folded into `services/core`'s existing manifest (already had every dependency `resources` needed: `@repo/database`, `@repo/shared`, `@repo/contracts`, `zod`, `cors`, `dotenv`, `express`). No `core` package.json change needed | B07 | core | Medium | DONE |
| SP-067 | `services/core/src/modules/learning/resources/resources.controller.ts` | learning | CONTROLLER | MOVE | Moved from `services/resources/src/controllers/resource.controller.ts`, unchanged. **B03: imports `getAuthenticatedUserId`, `isUuid`, `slugify` from `@repo/shared`; local duplicates deleted (predates this move).** **B12: `getResources` wrapped in `cacheAside` (see SP-132) — the query no longer includes viewer-scoped `saves`/`helpfulVotes`; a small separate per-viewer query resolves `isSaved`/`isHelpful` after the cache read. Found and fixed a real bug here: `ResourceRecord.createdAt`/`updatedAt` were typed `Date`, but a cache hit returns ISO strings after the JSON round trip — widened to `Date \| string` and switched to `new Date(x).toISOString()`.** **B13: `createResource` wrapped in `withOutbox` -> `learning.resource.created`; `saveResource`/`deleteResourceSave`/`markResourceHelpful` (already `prisma.$transaction`, now `withOutbox`) -> `learning.resource.saved`/`.unsaved`/`.marked_helpful`, each publishing nothing when the write was a no-op (already saved / not saved / already marked helpful). Removed the now-dead local `TransactionClient`/`PrismaClient` type aliases these three used to need** | B07, B12, B13 | core | Medium | DONE |
| SP-068 | `services/resources/src/index.ts` | learning | SERVICE_ENTRY | DELETE | Deleted — replaced by `services/core/src/index.ts` mounting `resourcesRoutes` at `/api/resources` | B07 | core | Medium | DONE |
| SP-069 | `services/core/src/modules/learning/resources/resources.routes.ts` | learning | ROUTE | MOVE | Moved from `services/resources/src/routes/resource.routes.ts`; import paths repointed to `./resources.controller.js`/`./resources.validation.js` | B07 | core | Low | DONE |
| SP-070 | `services/core/src/modules/learning/resources/resources.validation.test.ts` | learning | TEST | MOVE | Moved from `services/resources/src/routes/resource.validation.test.ts`; import path repointed. Still `node:test`/`node:assert` style (unchanged, Bun runs it fine) | B07 | core | Low | DONE |
| SP-071 | `services/core/src/modules/learning/resources/resources.validation.ts` | learning | VALIDATION | MOVE | Moved from `services/resources/src/routes/resource.validation.ts`. `resourceToneSchema` deleted, replaced with `@repo/contracts`'s `toneSchema` (same 5 values, byte-identical set — fulfills the adoption note left on `SP-083` back in B03); local `slugOrUuidSchema` kept as-is (its error message, "must be a resource id or slug", differs from `@repo/contracts`'s generic one — not force-merged) | B07 | core | Low | DONE |
| SP-072 | `services/resources/tsconfig.json` | learning | TS_CONFIG | DELETE | Deleted — `services/core/tsconfig.json` (already existed since B06) covers this module too | B07 | core | Low | DONE |
| SP-073 | `services/user/package.json` | multi | PKG_MANIFEST | DELETE | **B08: now actually deleted.** `services/user` served only `dashboard` since B07; that moved to `services/core/src/modules/dashboard` in this batch, so the service is empty and retired, fulfilling the B06 correction's own deferred plan | B08 | core | Medium | DONE |
| SP-074 | `services/user/src/controllers/user.controller.ts` | multi | CONTROLLER | SPLIT | profile → `identity/modules/profile` (B05); groups + connections + group-events → `core/modules/community` (B06); learning projects/events reads → `core/modules/learning` (B07); dashboard aggregation → `core/modules/dashboard` (B08). **B03: now imports `getAuthenticatedUserId`, `isUuid`, `slugify`, `formatCount`, `compactNumber` from `@repo/shared`; all five local duplicates deleted.** **B04: the `groupData` zero-seed fallback removed from `getUnassociatedGroupsForUser` and `joinUnjoinedGroups` (user decision: remove, not keep) — live-verified against a disposable Postgres instance.** **B05: profile portion (`getUserById`, `updateUser`, `getAllUsers`) extracted verbatim into `services/identity/src/modules/profile/profile.controller.ts` — see SP-095; deleted from this file.** **B06: the 16 community functions (groups, connections, invitations — see SP-103 for the full list) extracted into `services/core/src/modules/community/community.controller.ts`; the repeated `x-user-id` vs `loggedInUserId` 401+403 check across ~9 of them consolidated into one local `assertSelf` guard in the new file per the batch's explicit instruction, rather than copied. `getGroupWhere`/`mapResourceCard` and their community-only types deleted from this file entirely (no longer needed here); `getUserName`/`getInitials`/`mapUserCard`/`mapGroupCard`/`GroupCardRecord`/`UserCardRecord` stay duplicated in both files — `getDashboardHome`, which remains here, still needs them.** **B07: `getLearningEvents`/`getLearningProjects`/`getLearningProjectById` (+ `mapLearningEvent`/`mapLearningProject`/`ProjectPostRecord`) extracted verbatim into `services/core/src/modules/learning/learning.controller.ts` — see SP-106; deleted from this file. `getUserName`/`getInitials`/`formatDashboardEventMeta`/`DashboardEventRecord`/`DashboardPostRecord` duplicated there too (`getDashboardHome` still needs its own copies here).** **B08: `getDashboardHome` (the last function) extracted into `services/core/src/modules/dashboard/dashboard.controller.ts` — see SP-110; this file deleted entirely, along with the rest of `services/user`.** Fully split | B05–B08 | identity + core | High | DONE |
| SP-075 | `services/user/src/index.ts` | multi | SERVICE_ENTRY | DELETE | B06 refactored this (dropped the community mount, fixed a stale `validateObjectStorageEnv()` leftover from B05). **B08: deleted — `services/core/src/index.ts` (SP-102) now mounts `dashboardRoutes` too, the last thing this entry point served** | B06 (fix), B08 (delete) | core | Medium | DONE |
| SP-076 | `services/user/src/routes/user.routes.ts` | multi | ROUTE | SPLIT | Same fan-out as the controller; every external path preserved through the gateway route manifest. **B05: the 3 profile routes (`get-user-by-id`, `update-user`, `get-all-users`) and the `multer` upload setup they used moved to `services/identity/src/modules/profile/profile.routes.ts` — see SP-097.** **B06: the 16 community routes moved to `services/core/src/modules/community/community.routes.ts` (SP-105); only the 4 learning/dashboard routes (`/events`, `/projects`, `/projects/:id`, `/dashboard/:id`) remain, still mounted at `/api/user`.** **B07: `/events`, `/projects`, `/projects/:id` moved to `services/core/src/modules/learning/learning.routes.ts` — see SP-108; only `/dashboard/:loggedInUserId` remains.** **B08: `/dashboard/:loggedInUserId` (the last route) moved to `services/core/src/modules/dashboard/dashboard.routes.ts` — see SP-111; this file deleted.** Fully split | B05–B08 | identity + core | High | DONE |
| SP-077 | `services/user/src/routes/user.validation.ts` | multi | VALIDATION | SPLIT | Profile schemas → `identity`; group/connection schemas → `core`; primitives → `@repo/contracts`. **B05: `getUserByIdSchema`/`updateUserSchema` moved to `services/identity/src/modules/profile/profile.validation.ts` (see SP-096); the `nameSchema`/`usernameSchema` they and `credentials.validation.ts` both duplicated were promoted to `@repo/contracts` (SP-083) and both local copies deleted.** **B06: `loggedInUserIdParamsSchema`/`groupIdParamsSchema` and everything that aliased them moved to `services/core/src/modules/community/community.validation.ts` (SP-104); only `dashboardParamsSchema`/`projectIdParamsSchema` stay, now defined directly against a local `userIdParamsSchema` and `@repo/contracts`'s `slugOrUuidSchema` instead of aliasing the (now moved) community schemas.** **B07: `projectIdParamsSchema` moved to `services/core/src/modules/learning/learning.validation.ts` (see SP-107); `@repo/contracts` import dropped from this file (nothing left needs it) and removed as an unused dependency from `services/user/package.json`. Only `dashboardParamsSchema` remains.** **B08: `dashboardParamsSchema` (the last schema) moved to `services/core/src/modules/dashboard/dashboard.validation.ts` — see SP-112; this file deleted.** Fully split | B05–B08 | identity + core | Medium | DONE |
| SP-078 | `services/user/tsconfig.json` | multi | TS_CONFIG | DELETE | **B08: now actually deleted**, along with the rest of `services/user` | B08 | core | Low | DONE |
| SP-079 | `packages/contracts/package.json` | shared | PKG_MANIFEST | CREATE | New in B03 | B03 | contracts | Low | DONE |
| SP-080 | `packages/contracts/src/helpers.test.ts` | shared | TEST | CREATE | New in B03 — coverage `@repo/shared` never had, proving the 4 consolidated helpers match every implementation they replaced | B03 | contracts | Low | DONE |
| SP-081 | `packages/contracts/src/helpers.ts` | shared | PKG_MODULE | CREATE | New in B03: `getAuthenticatedUserId`, `slugify`, `UUID_PATTERN`/`isUuid`, `compactNumber`/`formatCount` — consolidated from 4 duplicate per-service definitions (issue #11) | B03 | contracts | Low | DONE |
| SP-082 | `packages/contracts/src/index.ts` | shared | PKG_ENTRY | CREATE | New in B03 | B03 | contracts | Low | DONE |
| SP-083 | `packages/contracts/src/schemas.ts` | shared | PKG_MODULE | CREATE | New in B03: `positiveInt`, `positiveIntString`, `slugOrUuidSchema`, `toneSchema` zod primitives, available for B05+ adoption (not force-adopted in B03). **B05: `nameSchema`/`usernameSchema` added, promoted from byte-identical duplicates in `services/auth`'s and `services/user`'s validation files (see SP-037, SP-077)** | B03, B05 | contracts | Low | DONE |
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
| SP-095 | `services/identity/src/modules/profile/profile.controller.ts` | identity | CONTROLLER | CREATE | New in B05: `getUserById`, `updateUser`, `getAllUsers` extracted verbatim from `services/user/src/controllers/user.controller.ts` (see SP-074); logger renamed `"identity-profile"`. **B13: `updateUser` wrapped in `withOutbox` -> `identity.user.profile_updated`, with a real diff (`changed`) against the pre-update user/profile rather than a full snapshot — publishes nothing when nothing actually changed** | B05, B13 | identity | Medium | DONE |
| SP-096 | `services/identity/src/modules/profile/profile.validation.ts` | identity | VALIDATION | CREATE | New in B05: `getUserByIdSchema`/`updateUserSchema` moved from `services/user/src/routes/user.validation.ts` (see SP-077); now imports `nameSchema`/`usernameSchema`/`positiveInt` from `@repo/contracts` | B05 | identity | Low | DONE |
| SP-097 | `services/identity/src/modules/profile/profile.routes.ts` | identity | ROUTE | CREATE | New in B05: the 3 profile routes + `multer` avatar-upload setup moved from `services/user/src/routes/user.routes.ts` (see SP-076); mounted at `/api/user` within identity — external paths unchanged | B05 | identity | Low | DONE |
| SP-100 | `services/core/package.json` | core | PKG_MANIFEST | CREATE | New in B06: `@services/core`, first module is `community`. Depends on `@repo/contracts` directly (community's validation imports `positiveInt`/`slugOrUuidSchema`/`toneSchema` from it, not via `@repo/shared`) | B06 | core | Medium | DONE |
| SP-101 | `services/core/tsconfig.json` | core | TS_CONFIG | CREATE | New in B06 | B06 | core | Low | DONE |
| SP-102 | `services/core/src/index.ts` | core | SERVICE_ENTRY | CREATE | New in B06: mounts `community` at `/api/user`; `learning` (B07) and `feed`/`dashboard` (B08) mount alongside it as they land. **B13: starts `@repo/events`' `startRelay()` in-process (the outbox relay), with graceful shutdown on `SIGTERM`/`SIGINT` stopping it before the HTTP server drains** | B06, B13 | core | Medium | DONE |
| SP-103 | `services/core/src/modules/community/community.controller.ts` | core | CONTROLLER | CREATE | New in B06: `getFollowedUsersByUser`, `getUnfollowedMentors`, `getUnassociatedGroupsForUser`, `getAllGroupsForUser`, `getAllGroups`, `discoverGroups`, `getJoinedGroups`, `getGroupInvitations`, `getGroupDetail`, `createGroup`, `joinGroupById`, `getConnectionSummary`, `getConnectionSuggestions`, `getFollowingConnections`, `followUnfollowedUser`, `joinUnjoinedGroups` — all 16 extracted verbatim from `services/user/src/controllers/user.controller.ts` (see SP-074), plus a new local `assertSelf` guard consolidating the repeated auth-and-self-match check (explicitly requested by the batch). `getGroupWhere`/`mapResourceCard`/`mapGroupCard`/`mapUserCard` and their supporting types moved here too; `mapGroupCard`/`mapUserCard` (and the types built from them) are duplicated back in `user.controller.ts` since `getDashboardHome` still needs them. **B12: `discoverGroups`'s group list wrapped in `cacheAside` (see SP-132) — cached without `viewerId` in the key or the payload; `joinedGroupIds` (already a separate per-viewer query) stays uncached and is merged into `isJoined` fresh on every request, per `api-and-dataflow-plan.md`'s explicit warning that `mapGroupCard` mixes shared and per-viewer fields.** **B13: `createGroup` wrapped in `withOutbox` -> `community.group.created` + `community.group.member_joined` (role: admin, the creator's own membership) in the same transaction; `joinUnjoinedGroups` (and `joinGroupById`, which delegates to it) -> `community.group.member_joined` (role: member); `followUnfollowedUser` -> `community.connection.followed`. Not wired (no writer exists for these anywhere in the app): `invitation_created`, `announcement_posted`, `event.scheduled`, `connection.unfollowed`** | B06, B12, B13 | core | High | DONE |
| SP-104 | `services/core/src/modules/community/community.validation.ts` | core | VALIDATION | CREATE | New in B06: `loggedInUserIdParamsSchema`, `joinedGroupsParamsSchema`, `followUnfollowedUserSchema`, `joinUnjoinedGroupsSchema`, `discoverGroupsSchema`, `groupIdParamsSchema`, `createGroupSchema`, `joinGroupByIdSchema` moved from `services/user/src/routes/user.validation.ts` (see SP-077); `positiveInt`/`slugOrUuidSchema`/`toneSchema` now imported from `@repo/contracts` instead of re-declared locally (adopting primitives SP-083 made available in B03) | B06 | core | Low | DONE |
| SP-105 | `services/core/src/modules/community/community.routes.ts` | core | ROUTE | CREATE | New in B06: the 16 community routes moved from `services/user/src/routes/user.routes.ts` (see SP-076); mounted at `/api/user` within core — external paths unchanged | B06 | core | Low | DONE |
| SP-106 | `services/core/src/modules/learning/learning.controller.ts` | learning | CONTROLLER | CREATE | New in B07: `getLearningEvents`, `getLearningProjects`, `getLearningProjectById` extracted verbatim from `services/user/src/controllers/user.controller.ts` (see SP-074), along with the helpers/types only they need (`mapLearningEvent`, `mapLearningProject`, `ProjectPostRecord`) and duplicates of the shared ones `getDashboardHome` also needs (`getUserName`, `getInitials`, `formatDashboardEventMeta`, `DashboardEventRecord`, `DashboardPostRecord`) | B07 | core | Medium | DONE |
| SP-107 | `services/core/src/modules/learning/learning.validation.ts` | learning | VALIDATION | CREATE | New in B07: `projectIdParamsSchema` moved from `services/user/src/routes/user.validation.ts` (see SP-077), built from `@repo/contracts`'s `slugOrUuidSchema` | B07 | core | Low | DONE |
| SP-108 | `services/core/src/modules/learning/learning.routes.ts` | learning | ROUTE | CREATE | New in B07: the 3 learning routes (`/events`, `/projects`, `/projects/:id`) moved from `services/user/src/routes/user.routes.ts` (see SP-076); mounted at `/api/user` within core, alongside `community.routes.ts` — external paths unchanged | B07 | core | Low | DONE |
| SP-109 | `services/core/src/modules/learning/reads.ts` | learning | PKG_MODULE | CREATE | New in B07, per the batch's explicit "move study-room and topic reads that live in `getDashboardHome` into learning read helpers" instruction: `getLiveStudyRooms()`/`getTrendingTopics()` extract the `prisma.studyRoom.findMany`/`prisma.topic.findMany` queries (+ their `mapDashboardRoom`/`mapDashboardTopic` mapping) out of `getDashboardHome`'s inline `Promise.all`, as standalone functions `learning` now owns. **Not deleted from `getDashboardHome`** — that stays in `services/user` pending B08 and can't import across a service boundary, so it keeps running its own equivalent inline query until B08 moves it into `core` and wires it to call these instead. See `migration-log.md`'s B07 section for why this doesn't touch `SP-074`. | B07 | core | Medium | DONE |
| SP-110 | `services/core/src/modules/dashboard/dashboard.controller.ts` | dashboard | CONTROLLER | CREATE | New in B08: `getDashboardHome` extracted verbatim in logic (identical response shape, verified byte-for-byte against seeded data) from `services/user/src/controllers/user.controller.ts` (see SP-074) — the last function in that file, which is deleted along with the rest of `services/user` in this same batch. Rewritten to **compose** `community`'s `getSidebarGroups`/`getUpcomingEvents` (SP-113), `learning`'s `getLiveStudyRooms`/`getTrendingTopics` (SP-109), and `feed`'s `getRecentPosts` (SP-114) instead of querying their tables directly — the batch's explicit architectural requirement, now possible since dashboard finally lives in the same process as those modules. Also imports (rather than re-duplicating a 4th copy of) `mapGroupCard`/`mapUserCard`/`getUserName`/`getInitials` from `community.controller.ts`, which now exports them — resolving the dashboard-vs-community duplication B06/B07 left behind specifically because dashboard was in a different service. Still queries `User` directly (profile + suggested-people) since `User` belongs to `identity`, a separate deployable service. **B12: the entire response wrapped in `cacheAside` (see SP-132), keyed `yome:cache:dashboard:<userId>` — safe to cache whole because the payload is already scoped to one viewer, unlike `discoverGroups`/`getResources`** | B08, B12 | core | High | DONE |
| SP-111 | `services/core/src/modules/dashboard/dashboard.routes.ts` | dashboard | ROUTE | CREATE | New in B08: the one dashboard route (`/dashboard/:loggedInUserId`) moved from `services/user/src/routes/user.routes.ts` (see SP-076); mounted at `/api/user` within core, alongside `community.routes.ts` and `learning.routes.ts` — external path unchanged | B08 | core | Low | DONE |
| SP-112 | `services/core/src/modules/dashboard/dashboard.validation.ts` | dashboard | VALIDATION | CREATE | New in B08: `dashboardParamsSchema` moved from `services/user/src/routes/user.validation.ts` (see SP-077) | B08 | core | Low | DONE |
| SP-113 | `services/core/src/modules/community/reads.ts` | community | PKG_MODULE | CREATE | New in B08: `getSidebarGroups`/`getUpcomingEvents` extract the `prisma.group.findMany`/`prisma.groupEvent.findMany` queries out of `getDashboardHome`'s inline `Promise.all`, mirroring `learning/reads.ts`'s B07 pattern for the community-owned tables (`Group`, `GroupEvent`) dashboard's sidebar/upcoming-sessions widgets read. `getSidebarGroups` returns raw sorted rows rather than fully-mapped cards (unlike `learning/reads.ts`'s helpers) because mapping needs the caller's `loggedInUserId` as `mapGroupCard`'s viewer context, plus a dashboard-only `physics-club` symbol override — both stay in `dashboard.controller.ts` | B08 | core | Medium | DONE |
| SP-114 | `services/core/src/modules/feed/reads.ts` | feed | PKG_MODULE | CREATE | New in B08: `getRecentPosts` — the first (and, as of this batch, only) piece of the new `feed` module, the designated write owner for `Post`/`Comment`/`Like` per the batch's Definition of Done. No write endpoint exists for any of these tables anywhere in the app yet (confirmed by repo-wide grep before writing this module), so there is nothing to move except the one read `getDashboardHome` needs | B08 | core | Medium | DONE |
| SP-115 | `services/messaging/src/modules/calls/calls.controller.ts` | messaging | CONTROLLER | CREATE | New in B09: `validateDirectConversation`/`prepareDirectCallConversation` moved here verbatim from `messages.controller.ts` (see SP-041). Two new handlers replace `apps/web/actions/stream.actions.ts`'s `tokenProvider()`/`ensureDirectCallUsers()`: `createCallToken` (byte-compatible `generateUserToken` call, same `@stream-io/node-sdk` version) and `createCallParticipants` (same participant-set validation, now checking `callerId` against the gateway-authenticated `x-user-id` instead of a Next.js server action's own session lookup). `checkDirectConversationAccess` factors out the DB check `validateDirectConversation` and `createCallParticipants` both need — an in-process call replacing what used to be `ensureDirectCallUsers`'s HTTP round trip to `stream.actions.ts`'s own `validateDirectCallConversation` helper, back when the two lived in different processes. **B13: `prepareDirectCallConversation` wrapped in `withOutbox` -> `messaging.conversation.created` (only when one was actually created)** | B09, B13 | messaging | High | DONE |
| SP-116 | `services/messaging/src/modules/calls/calls.routes.ts` | messaging | ROUTE | CREATE | New in B09: `/validate-direct-conversation` and `/prepare-direct-call-conversation` moved here from `messages.routes.ts` (see SP-047); `POST /api/chat/call-token` and `/call-participants` added, replacing the two `apps/web` server actions | B09 | messaging | Medium | DONE |
| SP-117 | `services/messaging/src/modules/calls/calls.validation.ts` | messaging | VALIDATION | CREATE | New in B09: `validateDirectConversationSchema`/`prepareDirectCallConversationSchema` moved here from `messages.validation.ts` (see SP-049); new `callParticipantsSchema` added for `createCallParticipants`. `call-token` takes no body, so it has no schema | B09 | messaging | Low | DONE |
| SP-118 | `services/messaging/src/modules/calls/calls.validation.test.ts` | messaging | TEST | CREATE | New in B09: the call-schema tests split out of `chat.validation.test.ts` (see SP-048), plus new coverage for `callParticipantsSchema` | B09 | messaging | Low | DONE |
| SP-119 | `services/gateway/src/types.ts` | edge | PKG_MODULE | CREATE | New in B10: the `GatewayRequest` interface (`requestId`/`rawBody`/`gatewayUser`), extracted so every middleware file can share one augmented-request type instead of each redeclaring it. Backfilled — missed when B10 first shipped, caught while touching this area again in B11 (same lesson the B03 audit already established: assign IDs to new files in the same commit as the code move) | B10 | gateway | Low | DONE |
| SP-120 | `services/gateway/src/middleware/requestId.ts` | edge | PKG_MODULE | CREATE | New in B10: request-id assignment, extracted verbatim from `index.ts`. Backfilled (see SP-119's note) | B10 | gateway | Low | DONE |
| SP-121 | `services/gateway/src/middleware/rateLimiter.ts` | edge | PKG_MODULE | CREATE | New in B10: the in-process rate limiter, extracted verbatim from `index.ts` (backfilled, see SP-119's note). **B11: REFACTOR** — the in-process `Map` replaced with `@repo/cache`'s Redis sliding-window limiter, fixing issue #17. Live-verified across 2 real gateway replicas sharing one Redis: the combined limit holds, and the limiter fails open against an unreachable Redis | B10, B11 | gateway | Medium | DONE |
| SP-122 | `services/gateway/src/middleware/auth.ts` | edge | PKG_MODULE | CREATE | New in B10: the NextAuth/shared-token auth middleware, extracted verbatim from `index.ts`. Backfilled (see SP-119's note) | B10 | gateway | Low | DONE |
| SP-123 | `services/gateway/src/middleware/proxy.ts` | edge | PKG_MODULE | CREATE | New in B10: the reverse-proxy logic, extended with the timeout/retry/circuit-breaker resilience layer (see SP-055's note for detail). Backfilled (see SP-119's note) | B10 | gateway | High | DONE |
| SP-124 | `packages/cache/package.json` | cache | PKG_MANIFEST | CREATE | New in B11: `@repo/cache`, depends on `ioredis` + `@repo/service-kit` | B11 | cache | Low | DONE |
| SP-125 | `packages/cache/tsconfig.json` | cache | TS_CONFIG | CREATE | New in B11 | B11 | cache | Low | DONE |
| SP-126 | `packages/cache/src/client.ts` | cache | PKG_MODULE | CREATE | New in B11: `getRedisClient()` (lazy singleton, read only inside a function body — never at module load, the same hazard B10 fixed for `GATEWAY_SHARED_TOKEN`/`STREAM_SECRET_KEY`) and `createRedisConnection()` (a fresh independent connection, for Socket.IO's adapter's pub/sub clients) | B11 | cache | Medium | DONE |
| SP-127 | `packages/cache/src/presence.ts` | cache | PKG_MODULE | CREATE | New in B11: Redis-backed presence, replacing `services/messaging`'s in-process `online-users.ts` (see SP-052) — same function shapes, now async, each taking an optional injectable Redis client for testability. Every read degrades to empty and every write swallows its error on a Redis failure, per `data-architecture-plan.md`'s explicit risk mitigation. Adds a `yome:presence:socket:<socketId>` reverse index not in the plan's key table, needed for O(1) "which user owns this socket" lookups now that presence is shared state instead of one process's memory. **B12: the hardcoded `PRESENCE_TTL_SECONDS` constant became a lazily-read `presenceTtlSeconds()` function backed by `REDIS_PRESENCE_TTL_SECONDS`** — closing a B11 gap: that env var is in `data-architecture-plan.md`'s own env-var table, which B11 never actually registered | B11, B12 | cache | High | DONE |
| SP-128 | `packages/cache/src/presence.test.ts` | cache | TEST | CREATE | New in B11: 10 tests (2 files) against a hand-rolled fake Redis client, matching this codebase's existing DI-for-testability pattern rather than a mocking library — covers multi-socket presence, the reverse-index disconnect path, and degraded-mode behavior on a throwing client | B11 | cache | Medium | DONE |
| SP-129 | `packages/cache/src/rateLimiter.ts` | cache | PKG_MODULE | CREATE | New in B11: the sliding-window limiter as one atomic Lua script (`ZREMRANGEBYSCORE` + `ZCARD` + conditional `ZADD`), replacing `services/gateway`'s in-process `Map` (see SP-121). Fails open on any Redis error | B11 | cache | High | DONE |
| SP-130 | `packages/cache/src/rateLimiter.test.ts` | cache | TEST | CREATE | New in B11: covers the allow/deny paths, the exact key/window/limit arguments passed to the script, and the fail-open path against a throwing client | B11 | cache | Low | DONE |
| SP-131 | `packages/cache/src/index.ts` | cache | PKG_ENTRY | CREATE | New in B11: barrel re-exporting `client.ts` + `presence.ts` + `rateLimiter.ts`. **B12: now also re-exports `cacheAside.ts`** | B11, B12 | cache | Low | DONE |
| SP-132 | `packages/cache/src/cacheAside.ts` | cache | PKG_MODULE | CREATE | New in B12: the generic `cacheAside(key, ttlSeconds, compute, redis?)` get-or-compute-and-set helper (falls through to `compute` on any Redis error, same degraded-mode philosophy as `presence.ts`/`rateLimiter.ts`) and `hashQuery()`, a stable fixed-length hash of a query's own parameters for building cache keys. Used by `dashboard.controller.ts` (SP-110), `community.controller.ts`'s `discoverGroups` (SP-103), and `resources.controller.ts`'s `getResources` (SP-067) | B12 | cache | Medium | DONE |
| SP-133 | `packages/cache/src/cacheAside.test.ts` | cache | TEST | CREATE | New in B12: 6 tests against a hand-rolled fake Redis client — compute-once-on-miss, key isolation, degraded-mode fallthrough on a throwing client, and `hashQuery`'s key-order stability/undefined-filtering/distinctness | B12 | cache | Low | DONE |
| SP-134 | `packages/contracts/src/events.ts` | contracts | PKG_MODULE | CREATE | New in B13: the `DomainEvent<TPayload>` envelope type and a zod payload schema for all 23 catalogued events (identity, community, learning, feed, messaging, media), plus an `eventPayloadSchemas` registry keyed by event type. Defined for the full catalogue even though not every event has a writer yet (see SP-030/SP-095/SP-103/SP-067/SP-044/SP-041/SP-115's notes below for which do) | B13 | events | Medium | DONE |
| SP-135 | `packages/contracts/src/events.test.ts` | contracts | TEST | CREATE | New in B13: every event type has a payload schema (23), every type has a representative sample payload that parses, and no sample payload is orphaned (references an unknown type) | B13 | events | Low | DONE |
| SP-136 | `packages/events/package.json` | events | PKG_MANIFEST | CREATE | New in B13: `@repo/events`, depends on `@repo/cache`, `@repo/contracts`, `@repo/database`, `@repo/service-kit` | B13 | events | Low | DONE |
| SP-137 | `packages/events/tsconfig.json` | events | TS_CONFIG | CREATE | New in B13 | B13 | events | Low | DONE |
| SP-138 | `packages/events/src/index.ts` | events | PKG_ENTRY | CREATE | New in B13: barrel re-exporting `withOutbox.ts` + `relay.ts` + `idempotency.ts` + `consumer.ts` | B13 | events | Low | DONE |
| SP-139 | `packages/events/src/withOutbox.ts` | events | PKG_MODULE | CREATE | New in B13: `withOutbox(prisma, fn, buildEvents)` — the single sanctioned way to write a domain change and its outbox row in one transaction, per the batch's explicit instruction ("use a single withOutbox helper so this cannot be bypassed"). Supports zero, one, or many events per write (`buildEvents` returning `null` publishes nothing — the no-op-write case, e.g. saving an already-saved resource) | B13 | events | High | DONE |
| SP-140 | `packages/events/src/withOutbox.test.ts` | events | TEST | CREATE | New in B13: 5 tests against a fake Prisma client, incl. the batch's required proof — a thrown domain-write error or a thrown `buildEvents` call each abort before any outbox row is written. Live-verified separately against a real disposable Postgres (see migration-log.md) | B13 | events | Medium | DONE |
| SP-141 | `packages/events/src/relay.ts` | events | PKG_MODULE | CREATE | New in B13: `relayOnce`/`startRelay` — `SELECT ... FOR UPDATE SKIP LOCKED` + `XADD` + mark-published, all in one Postgres transaction so concurrent relay replicas never double-publish (the transaction holding the row lock is the only one that sees the row; every other replica's `SKIP LOCKED` passes over it). Per-row failure isolation with a 10-attempt cap (the plan's "cap by attempts" hot-loop mitigation) — a capped-out row stays unpublished in Postgres for manual inspection, not pushed to a Redis DLQ (nothing was ever published to lose) | B13 | events | High | DONE |
| SP-142 | `packages/events/src/idempotency.ts` | events | PKG_MODULE | CREATE | New in B13: `markConsumedIfNew` — the mandatory `SET NX` idempotency check (`yome:consumed:<group>:<eventId>`, 24h TTL) every future consumer must call before any side effect. Degrades to "treat as new" on a Redis error, matching `@repo/cache`'s fail-open philosophy | B13 | events | Medium | DONE |
| SP-143 | `packages/events/src/idempotency.test.ts` | events | TEST | CREATE | New in B13: 4 tests against a fake Redis client — first-seen returns true, a repeat returns false, two different consumer groups are independent, and a Redis error degrades to "new" | B13 | events | Low | DONE |
| SP-144 | `packages/events/src/consumer.ts` | events | PKG_MODULE | CREATE | New in B13: `ensureConsumerGroup`/`consumeOnce` — a generic `XREADGROUP` consume loop with ack-after-side-effects-commit semantics (rule 2: never `XACK` before the handler's side effect completes). **B14 wired the first real consumer (`notifications`) to it and grew it accordingly: `consumeOnce` now takes one stream key or an array (one `XREADGROUP` spans every `yome:events:*` stream); `reclaimStale` (rule 4's `XPENDING`/`XCLAIM` recovery, via `XAUTOCLAIM`, Redis 6.2+) re-runs entries a crashed consumer left pending; `startConsumer` is the long-running loop — ensure-groups then reclaim+consume until `stop()`, with a `ready` promise (groups exist at `$`, so a caller can wait before publishing on a brand-new stream) and an idle delay that also guarantees an event-loop yield. Per-entry logic factored into a shared `processEntry`** | B13, B14 | events | High | DONE |
| SP-145 | `packages/events/src/consumer.test.ts` | events | TEST | CREATE | New in B13: 6 tests against a fake Redis client. **B14: +5 — multi-stream `consumeOnce` in one `XREADGROUP`, `reclaimStale` re-running a stale entry, `reclaimStale` skipping an already-consumed one (idempotent), and `startConsumer` creating the group on every stream then stopping cleanly** (14/14 across the file's group). Live-verified separately against real disposable infra (see migration-log.md) | B13, B14 | events | Medium | DONE |
| SP-146 | `services/notifications/src/consumer/index.ts` | notifications | PKG_MODULE | CREATE | New in B14: `startNotificationConsumer()` wires `@repo/events`' `startConsumer` to all five `yome:events:*` streams as consumer group `notifications`; `handleEvent` is the per-entry handler — `messaging.message.read` clears a pending notification, everything else runs `deriveNotifications` (SP-147) then `persistNotifications` (SP-149). `buildContext()` supplies the Prisma-backed cross-domain lookups (group name, user display name, resource author) and the `@repo/cache` presence check | B14 | notifications | High | DONE |
| SP-147 | `services/notifications/src/consumer/derive.ts` | notifications | PKG_MODULE | CREATE | New in B14: `deriveNotifications(envelope, ctx)` — pure mapping of a domain event to zero-or-more `NotificationSpec`s, validating each payload against its `@repo/contracts` zod schema (skip, don't throw, on failure). Notifies on `identity.user.registered` (welcome), `identity.user.password_changed` (security), `community.group.member_joined` (the joiner), `community.connection.followed` (the followee), `learning.resource.saved`/`.marked_helpful` (the author, not on a self-action), and `messaging.message.sent` (a direct recipient, only when offline per `@repo/cache`). Fan-out cases needing a membership query (group-admin notifications, group messages, `resource.created` to group members) deliberately not emitted yet — the plan's B14 risk note wants rate-limiting/aggregation first | B14 | notifications | High | DONE |
| SP-148 | `services/notifications/src/consumer/derive.test.ts` | notifications | TEST | CREATE | New in B14: 8 tests with a fake context — welcome on register, followee notified on follow, nothing when the group is gone, author notified on save but not a self-save, offline-only for direct messages, nothing for a group message, nothing for non-notifying/uncatalogued types, and a schema-invalid payload skipped rather than thrown | B14 | notifications | Low | DONE |
| SP-149 | `services/notifications/src/store/notificationStore.ts` | notifications | PKG_MODULE | CREATE | New in B14: the DB surface — `persistNotifications(eventId, specs)` (one row per spec, `(eventId, userId)`-keyed so a redelivery is a no-op; the count of rows actually created returned), `clearMessageNotification`, `listNotifications` (newest-first, `unreadOnly`/`limit`/`cursor`, returns `unreadCount` + `nextCursor`), `markNotificationRead` (distinguishes not-found/not-owned from already-read), `markAllNotificationsRead`. Every mutation calls `syncUnreadCount` in the same transaction, keeping `User.notificationCount` == live unread count (closes `api-and-dataflow-plan.md` issue #10's hardcoded-`3`) | B14 | notifications | High | DONE |
| SP-150 | `services/notifications/src/store/notificationStore.test.ts` | notifications | TEST | CREATE | New in B14: 3 tests against an in-memory Prisma stand-in enforcing the `(eventId, userId)` uniqueness — one row per spec + `notificationCount` set, **replaying the same event creates no duplicate** (the batch's required idempotency proof), and an empty spec list is a no-op | B14 | notifications | Medium | DONE |
| SP-151 | `services/notifications/src/notifications.validation.ts` | notifications | PKG_MODULE | CREATE | New in B14: zod schemas for `validateRequest` — `listNotificationsSchema` (`unread` enum→boolean, `limit` 1–50, `cursor` uuid) and `notificationIdParamsSchema` (`id` uuid) | B14 | notifications | Low | DONE |
| SP-152 | `apps/web/lib/notifications/notificationsApi.ts` | apps/web | PKG_MODULE | CREATE | New in B14: the client for the new endpoints — `getNotifications`, `markNotificationRead`, `markAllNotificationsRead` (all `withCredentials`, so the gateway supplies `x-user-id`), plus response normalization. Consumed by the rewritten `features/learning/pages/notifications.tsx` (previously a static 3-item mock; now fetches real data, unread badge, click-to-read, mark-all-read). `NOTIFICATIONS_LIST_ROUTE`/`NOTIFICATIONS_READ_ALL_ROUTE` added to `utils/ApiRoutes.ts`; `/api/notifications` already routed to the `notifications` upstream since B10, so no gateway change | B14 | apps/web | Medium | DONE |
| SP-098 | `services/gateway/src/routes/route-manifest.ts` | edge | PKG_MODULE | CREATE | New in B05: ordered upstream route-rule table + `resolveRoute()`/`pathMatchesPrefix()`, extracted so `index.ts`'s 8 hand-written `app.use()` calls become one loop, and so routing is unit-testable without booting Express. **B10: renamed from `routeRules.ts` to `routes/route-manifest.ts` and extended with per-rule `timeoutMs`** — the full gateway modularization SP-055 describes, not a precursor to it anymore | B05, B10 | gateway | Medium | DONE |
| SP-099 | `services/gateway/src/routes/route-manifest.test.ts` | edge | TEST | CREATE | New in B05: parses `apps/web/utils/ApiRoutes.ts` and asserts every one of its 42 externally-visible `/api/*` paths resolves through the route manifest to exactly one upstream, including the 3 profile paths now resolving to `identity`. **B10: renamed alongside its source file; 2 new tests added covering `timeoutMs`** | B05, B10 | gateway | Low | DONE |

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
- **B04** (seed extraction): SP-013, SP-031, SP-032, SP-033, SP-034, SP-038, SP-091–SP-094
  **done**, incl. the fallback-removal portions of SP-074/SP-076 (decision: remove — see
  migration-log.md).
- **B05** (identity): SP-029, SP-030, SP-035, SP-036, SP-037, SP-039, SP-095–SP-099 **done**
  (+ profile portions of SP-074, SP-076, SP-077 — also done; row status stays `PENDING` since
  their community/learning/dashboard portions are still B06–B08).
- **B06** (core scaffold + community): SP-100–SP-105 **done** (+ community portions of
  SP-074, SP-076, SP-077 — also done; row status stays `PENDING` since their learning/dashboard
  portions are still B07/B08). SP-073/SP-075/SP-078 corrected from `DELETE`/B06 to
  `KEEP (for now)`/B08 — see the B06-completed note above for why `services/user` isn't
  deleted yet.
- **B07** (core/learning + fold resources): SP-066–SP-072, SP-106–SP-109 **done** (+ learning
  portions of SP-074, SP-076, SP-077 — also done at the time; their dashboard portion, and so
  their row status, finished in B08 below).
- **B08** (core/feed + core/dashboard, and `services/user`'s actual deletion): SP-110–SP-114
  **done**; SP-073, SP-075, SP-078 **done** (`services/user` actually deleted, not just
  `KEEP (for now)`); dashboard portions of SP-074, SP-076, SP-077 done, and since that was the
  last portion of each, all three rows are now fully `DONE`.
- **B09** (messaging + media): SP-040–SP-053, SP-057–SP-059 **done**; SP-115–SP-118
  **created** (`services/messaging/src/modules/calls/**` — a genuinely new module, so its
  files get fresh IDs, same convention B06–B08 used for `core`'s new modules).
- **B10** (gateway + reconciliation): SP-001, SP-003, SP-006, SP-009, SP-011 (shim delete),
  SP-015 (shim delete), SP-054, SP-055, SP-062, SP-064 **done**; SP-063 **resolved to `KEEP`**
  (its "B10 review" was already answered by `service-decomposition-plan.md`'s locked design
  decisions — not actually open by the time B10 ran). Final pass: **0 `PENDING` rows remain**,
  every one of the 118 rows is `DONE` or `KEEP` — the manifest's own Definition of Done.
  **SP-119–SP-123 backfilled** (gateway's `types.ts` + 4 `middleware/*.ts` files never got IDs
  when B10 actually shipped them — caught while touching this area again in B11); **SP-098/
  SP-099's own "Current File" paths were also stale** (still `routeRules.ts`, not updated when
  B10 renamed it) — both fixed in the same B11 pass.
- **B11** (Redis foundation): SP-124–SP-131 **created** (`packages/cache/**`, a new package —
  fresh IDs, same convention every prior batch's new modules used). SP-040, SP-041, SP-042,
  SP-050, SP-054 **updated in place** (Redis wiring added to already-tracked files). SP-052
  **flipped from MOVE to DELETE** (`online-users.ts` removed once its logic moved into
  `packages/cache`). SP-121 **updated in place** (its B10 backfill note now also covers B11's
  Redis rewrite of the same file).
- **B12** (cache-aside reads): SP-132–SP-133 **created** (`packages/cache/src/cacheAside.ts`
  + test). SP-067, SP-103, SP-110 **updated in place** (`getResources`/`discoverGroups`/
  `getDashboardHome` wrapped in `cacheAside`). SP-127 **updated in place** (closed a B11 gap:
  `REDIS_PRESENCE_TTL_SECONDS` registered, `presence.ts`'s TTL constant made lazy). SP-131
  **updated in place** (barrel now re-exports `cacheAside.ts` too).
- **B13** (event backbone): SP-134–SP-145 **created** (`packages/contracts/src/events.ts` +
  test, new `packages/events/**` — 8 files). SP-030, SP-095, SP-103, SP-067, SP-044, SP-041,
  SP-115, SP-102 **updated in place** (`withOutbox` wired into every real write path that has
  a catalogued event — identity's register/OAuth-register/profile-update/password-change,
  community's create-group/join-group/follow, learning's create/save/unsave/mark-helpful,
  messaging's conversation-create/message-send/message-read/call-prepare — plus the relay
  started in `core`'s bootstrap). SP-003 already covered the `OutboxEvent` model addition
  (done in B10's schema-ownership pass, extended here). Not wired anywhere: community's
  `invitation_created`/`announcement_posted`/`event.scheduled`/`connection.unfollowed`,
  learning's `studyroom.*` (2 events), all of feed's events, and all of media's — none of
  these have a write endpoint anywhere in the app today (documented, not silently skipped;
  see migration-log.md's B13 section).
- **B14** (notifications as first consumer): SP-146–SP-152 **created** (`services/notifications/src/consumer/**`
  + `store/**` + `notifications.validation.ts` — 6 files — and `apps/web/lib/notifications/notificationsApi.ts`).
  SP-063 **flipped `KEEP`→`DONE`** (the consumer it was kept for is now wired). SP-003, SP-001,
  SP-062, SP-064, SP-144, SP-145 **updated in place** (`Notification` model + migration and the
  `OutboxEvent`/`Notification` `SCHEMA_OWNERSHIP.md` rows B13 had skipped; notifications deps +
  real test script; list/mark-read routes + controller handlers; `@repo/events`' consumer
  runtime grown with multi-stream `consumeOnce` / `reclaimStale` / `startConsumer`). Store
  decision (trigger T-07): **Postgres `jsonb`**, not MongoDB — keeps P3 on one store, keeps
  `User.notificationCount` consistent in-transaction, no new infra. `apps/web`'s static
  `notifications.tsx` mock replaced with a real data view.

## Status accounting

Counts below are machine-verified (`grep`-extracted from the actual table, not hand-tallied
— a hand-tally error during the B03 completeness audit is exactly why this rule exists now).

- Rows: 152 (the original 78, plus 12 B03-created rows `SP-079`–`SP-090`, plus 4 B04-created
  rows `SP-091`–`SP-094`, plus 5 B05-created rows `SP-095`–`SP-099`, plus 6 B06-created rows
  `SP-100`–`SP-105`, plus 4 B07-created rows `SP-106`–`SP-109`, plus 5 B08-created rows
  `SP-110`–`SP-114`, plus 4 B09-created rows `SP-115`–`SP-118`, plus 5 B10-created rows
  `SP-119`–`SP-123` (backfilled — see the B10 summary line), plus 8 B11-created rows
  `SP-124`–`SP-131`, plus 2 B12-created rows `SP-132`–`SP-133`, plus 12 B13-created rows
  `SP-134`–`SP-145`, plus 7 B14-created rows `SP-146`–`SP-152`). Duplicate IDs: 0. Duplicate
  current-file entries: 0.
- `KEEP` (no change intended): SP-002, SP-004, SP-005, SP-007, SP-008, SP-010, SP-025,
  SP-026, SP-027, SP-028, SP-056, SP-060, SP-061, SP-065 — **14 rows**. `SP-063` left this
  list in B14 (`KEEP`→`DONE`): the event consumer it was being kept for is now wired.
- `DONE`: SP-011, SP-012, SP-014–SP-024 (13 rows, B03's `packages/shared` split) +
  SP-013, SP-031–SP-034, SP-038 (6 rows, B04's seed extraction incl. the `groupData` fixture) +
  SP-079–SP-090 (12 rows, B03-created files) + SP-091–SP-094 (4 rows, B04-created files) +
  SP-029, SP-030, SP-035–SP-037, SP-039 (6 rows, B05's identity rename) + SP-095–SP-099
  (5 rows, B05-created profile module + gateway route rules) + SP-100–SP-105 (6 rows,
  B06-created core service + community module) + SP-066–SP-072 (7 rows, B07's folded-in
  `resources`) + SP-106–SP-109 (4 rows, B07-created learning module) + SP-110–SP-114 (5 rows,
  B08-created dashboard + feed modules) + SP-073, SP-074, SP-075, SP-076, SP-077, SP-078
  (6 rows, `services/user`'s multi-batch split finally complete — its last domain, dashboard,
  moved out in B08 and the service itself is deleted) + SP-040–SP-053, SP-057–SP-059 (17 rows,
  B09's `chat`→`messaging` rename + media de-DB) + SP-115–SP-118 (4 rows, B09-created `calls`
  module) + SP-001, SP-003, SP-006, SP-009, SP-054, SP-055, SP-062, SP-064 (8 rows, B10's
  schema-ownership docs, eslint service profile, gateway modularization, and notifications
  controller extraction) + SP-119–SP-123 (5 rows, backfilled B10-created gateway middleware
  files) + SP-124–SP-131 (8 rows, B11-created `packages/cache`) + SP-132–SP-133 (2 rows,
  B12-created `cacheAside.ts` + test) + SP-134–SP-145 (12 rows, B13-created
  `packages/contracts/src/events.ts` + test and `packages/events/**`) + SP-063 (flipped
  `KEEP`→`DONE` in B14 — its consumer is wired) + SP-146–SP-152 (7 rows, B14-created
  `services/notifications` consumer + store + validation and `apps/web`'s notifications API
  client) — **138 rows**. The
  two former
  compound rows (`SP-011`/`SP-015`, previously `DONE (B03; shim removal B10)`) are now plain
  `DONE`: the B10 half (deleting `packages/shared` itself) is finished, so the caveat no
  longer applies.
- `PENDING`: **0 rows.** The manifest's own Definition of Done: every row is now `DONE` or
  `KEEP`.
- `BLOCKED`: 0 in the manifest. One infra blocker was tracked in
  `service-decomposition-plan.md` (the missing `Dockerfile.service`) and was resolved in B02.
- Row-count check: 14 KEEP + 138 DONE + 0 PENDING = 152. ✓ (machine-counted via
  `grep -cE "^\| SP-[0-9]+"` and per-status `grep` anchored to the status column specifically —
  a naive substring grep against the whole row over-counts, since some rows' ACTION column is
  also literally "KEEP" or "PENDING"-shaped text, not just their STATUS column; not
  hand-tallied.)

## Files this migration will create (IDs assigned on creation)

**Phase 1 (B01–B10):**

- ✅ `packages/service-kit/**`, `packages/storage/**`, `packages/contracts/**` — **created in
  B03**, tracked as `SP-079`–`SP-090` (also: `packages/contracts/src/helpers.test.ts`, new
  coverage).
- ✅ `packages/seed/**` — **created in B04**, tracked as `SP-091`–`SP-094` (the fixtures and
  runners are moves, tracked by `SP-013`, `SP-031`–`SP-034`).
- ✅ `services/identity/**` (rename target of `services/auth`; new `modules/profile/**`) —
  **created in B05**, tracked as `SP-029`, `SP-030`, `SP-035`–`SP-039`, `SP-095`–`SP-097`.
- ✅ `services/core/**` with `src/modules/community/**` — **created in B06**, tracked as
  `SP-100`–`SP-105`.
- ✅ `services/core/src/modules/learning/**` (incl. `resources/` folded in from the deleted
  `services/resources`) — **created in B07**, tracked as `SP-066`–`SP-072`, `SP-106`–`SP-109`.
- ✅ `services/core/src/modules/{feed,dashboard}/**` — **created in B08**, tracked as
  `SP-110`–`SP-114`. All four `core` modules (`community`, `learning`, `feed`, `dashboard`)
  now exist; Phase 1's `services/core/**` line item is complete.
- ✅ `services/user` deleted — **B08**, tracked as `SP-073`/`SP-075`/`SP-078` (package
  manifest / entry point / tsconfig) finally `DONE`.
- ✅ `services/messaging/**` (rename target of `services/chat`; new `modules/calls/**`) —
  **created in B09**, tracked as `SP-040`–`SP-053`, `SP-057`–`SP-059` (renamed/moved files)
  and `SP-115`–`SP-118` (new `calls` module).
- ✅ `services/gateway/src/routeRules.ts` + `routeRules.test.ts` — **created in B05**, tracked
  as `SP-098`–`SP-099`; a scoped precursor. **B10: renamed to `routes/route-manifest.ts` +
  `route-manifest.test.ts`** (SP-055) and the full `services/gateway/src/middleware/**` split
  (`requestId.ts`, `rateLimiter.ts`, `auth.ts`, `proxy.ts`) plus `types.ts` landed alongside it.
- ✅ `Dockerfile.service` — **created in B02**
- ✅ `packages/eslint-config/service.js` — **created in B10** (SP-009), wired into all 6
  services via `eslint.config.js` (relative-imported, matching `apps/web`'s existing
  convention — `@repo/eslint-config` isn't a real workspace dependency anywhere).
- ✅ `services/notifications/src/controllers/notifications.controller.ts` — **created in B10**
  (SP-064), extracted from the inline handler in `notifications.routes.ts`.

**Phase 2+ (B11–B18+), planned in the companion documents:**

- ✅ `packages/cache/**` — shared Redis client, presence, and rate limiting — **created in
  B11**, tracked as `SP-124`–`SP-131`. Cache-aside helpers (dashboard/group-discover/resource
  caching) are still B12's job — this batch only covers presence and rate limiting, the two
  triggers (T-01/T-02) that had already fired.
- ✅ `docker-compose.yml` — **created in B02** (Postgres + Redis; Redis unused until B11)
- ✅ `packages/events/**` — `withOutbox`, the outbox relay, a generic `XREADGROUP` consumer
  runtime, and the idempotency helper — **created in B13**, tracked as `SP-136`–`SP-145`.
  **B14 grew the consumer runtime** (`SP-144`/`SP-145` notes): multi-stream `consumeOnce`,
  `reclaimStale` (`XAUTOCLAIM` recovery), `startConsumer` (the long-running loop). Still no
  DLQ stream — `notifications`' handlers skip a bad payload rather than fail, and a genuinely
  stuck entry stays pending for `reclaimStale`/manual inspection, matching B13's "nothing was
  published to lose" reasoning; a real `yome:events:dlq` is deferred to when a consumer needs
  poison-pill quarantine.
- ✅ `OutboxEvent` model + migration in `packages/database` — **created in B13** (SP-003's
  updated note).
- ✅ Event zod schemas — **created in B13** as `packages/contracts/src/events.ts` (SP-134),
  not a `src/events/` subdirectory as originally sketched here — one file covers all 23
  catalogued event types cleanly, no subdirectory needed yet.
- ✅ `services/notifications/src/{consumer,store}/**` + `notifications.validation.ts` —
  consumer group + Postgres `jsonb` notification store (trigger T-07 decision) + list/mark-read
  endpoints — **created in B14**, tracked as `SP-146`–`SP-152`. Landed as `consumer/` +
  `store/` (flat), not `modules/**` as sketched here — the service has one concern, so a
  module layer would be ceremony. Delivery adapters beyond in-app (email/push) are **not** in
  B14 — the plan lists them as open questions #3/#4 (aggregation policy, channel credentials).
- `services/core/src/modules/dashboard/read-model/**` (B15)
- `services/core/src/modules/{learning,community}/search/**` (B16)
- `services/messaging/src/projections/**` — follow-edge and user-profile projections
  (B18+, only if a database is extracted)
