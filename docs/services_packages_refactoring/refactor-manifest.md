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
| SP-001 | `packages/database/SCHEMA_OWNERSHIP.md` | database | DOC | REFACTOR | Rewrite as a model → owning-module write table; keep in sync with code. **B06: partial name/ownership-accuracy update — `Group*` tables reassigned to `Core (community module)`; `StudyRoom`/`Topic`/`Post`/`Comment`/`Like` rows added as planned-not-yet-owned.** **B07: `Resource*` reassigned to `Core (learning module)` (a row that didn't exist before B07 at all); `StudyRoom`/`Topic` upgraded from "planned" to "read-only, owned by learning" now that `reads.ts` formalizes those reads; noted `Post` is read (not written) by both `core`'s learning module and `services/user`'s dashboard.** **B08: `Post`/`Comment`/`Like` reassigned from "Feed (planned)" to `Core (feed module)` — still read-only, no write endpoint exists anywhere yet; new "Core service, feed module" and "Core service, dashboard module" boundary bullets added; every remaining mention of `services/user` as a currently-existing service removed (it's deleted).** Full model-per-owning-module rewrite still pending. | B10 | database | Low | PENDING |
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
| SP-012 | `packages/service-kit/src/config/env.ts` | shared | PKG_MODULE | MOVE | Moved from `packages/shared/src/config/env.ts`; `servicePorts` gained a `core` getter (value wired B06). **B07: `resources` getter removed — dead now that `services/resources` no longer exists.** **B08: `user` getter removed for the same reason.** | B03 | service-kit | Medium | DONE |
| SP-013 | `packages/seed/src/fixtures/groups.ts` | seed | SEED_DATA | MOVE | Moved from `packages/shared/src/data/groups.ts`. Decision confirmed with the user: the `services/user` runtime fallback that read it directly was removed rather than kept (see `SP-074`/`SP-076`) — this fixture is now reachable only from `@repo/seed`, never from a production runtime path | B04 | seed | Medium | DONE |
| SP-014 | `packages/contracts/src/errors.ts` | shared | PKG_MODULE | MOVE + REFACTOR | Moved from `packages/shared/src/errors.ts` (`createHttpError`); also absorbed `ErrorEnvelope` from the old `types/contracts.ts` (see SP-022) — both are pure, no Express dep | B03 | contracts | Low | DONE |
| SP-015 | `packages/shared/src/index.ts` | shared | PKG_ENTRY | SPLIT | Unchanged path; content replaced with a re-export shim (`@repo/contracts` + `@repo/service-kit` + `@repo/storage` + local `groupData`); deleted in B10 | B03 / B10 | service-kit | Medium | DONE (B03; shim removal B10) |
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
| SP-030 | `services/identity/src/modules/credentials/credentials.controller.ts` | identity | CONTROLLER | MOVE | Moved from `services/auth/src/controllers/auth.controller.ts`. **B03: now imports `getAuthenticatedUserId` from `@repo/shared`, local copy deleted.** | B05 | identity | Medium | DONE |
| SP-031 | `packages/seed/src/runners.ts` | seed | SEED_CONTROLLER | EXTRACT | Moved from `services/auth/src/controllers/seed.controller.ts`; per-handler `rejectIfSeedDisabled` calls removed (5x), guard now applied once at the route layer — see `SP-091` | B04 | seed | High | DONE |
| SP-032 | `packages/seed/src/fixtures/dashboard.ts` | seed | SEED_DATA | MOVE | Moved from `services/auth/src/data/dashboard.ts`, unchanged | B04 | seed | Low | DONE |
| SP-033 | `packages/seed/src/fixtures/resources.ts` | seed | SEED_DATA | MOVE | Moved from `services/auth/src/data/resources.ts`, unchanged | B04 | seed | Low | DONE |
| SP-034 | `packages/seed/src/fixtures/users.ts` | seed | SEED_DATA | MOVE | Moved from `services/auth/src/data/users.ts`, unchanged | B04 | seed | Low | DONE |
| SP-035 | `services/identity/src/index.ts` | identity | SERVICE_ENTRY | REFACTOR | Moved from `services/auth/src/index.ts`; mounts `credentials` (`/api/auth`), `profile` (`/api/user`), and `dev/seed-route` (`/api/db`) modules | B05 | identity | Medium | DONE |
| SP-036 | `services/identity/src/modules/credentials/credentials.routes.ts` | identity | ROUTE | MOVE | Moved from `services/auth/src/routes/auth.routes.ts`, imports repointed to `credentials.controller.ts`/`credentials.validation.ts` | B05 | identity | Low | DONE |
| SP-037 | `services/identity/src/modules/credentials/credentials.validation.ts` | identity | VALIDATION | MOVE | Moved from `services/auth/src/routes/auth.validation.ts`; `nameSchema`/`usernameSchema` now imported from `@repo/contracts` (promoted, byte-identical duplicate in `user.validation.ts` removed — see SP-077) | B05 | identity | Low | DONE |
| SP-038 | `services/identity/src/dev/seed-route.ts` | seed | ROUTE | REFACTOR | B04: rewritten from `services/auth/src/routes/db.routes.ts` as a thin route mounting one `devSeedGuard` from `@repo/seed`. **B05: further moved (path only, no content change) from `services/auth/src/routes/db.routes.ts` to this path as part of the identity rename** — external `/api/db` path preserved throughout | B04 (content), B05 (path) | identity (dev) | Medium | DONE |
| SP-039 | `services/identity/tsconfig.json` | identity | TS_CONFIG | MOVE | Moved from `services/auth/tsconfig.json`, unchanged content | B05 | identity | Low | DONE |
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
| SP-066 | `services/resources/package.json` | learning | PKG_MANIFEST | DELETE | Deleted — folded into `services/core`'s existing manifest (already had every dependency `resources` needed: `@repo/database`, `@repo/shared`, `@repo/contracts`, `zod`, `cors`, `dotenv`, `express`). No `core` package.json change needed | B07 | core | Medium | DONE |
| SP-067 | `services/core/src/modules/learning/resources/resources.controller.ts` | learning | CONTROLLER | MOVE | Moved from `services/resources/src/controllers/resource.controller.ts`, unchanged. **B03: imports `getAuthenticatedUserId`, `isUuid`, `slugify` from `@repo/shared`; local duplicates deleted (predates this move).** | B07 | core | Medium | DONE |
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
| SP-095 | `services/identity/src/modules/profile/profile.controller.ts` | identity | CONTROLLER | CREATE | New in B05: `getUserById`, `updateUser`, `getAllUsers` extracted verbatim from `services/user/src/controllers/user.controller.ts` (see SP-074); logger renamed `"identity-profile"` | B05 | identity | Medium | DONE |
| SP-096 | `services/identity/src/modules/profile/profile.validation.ts` | identity | VALIDATION | CREATE | New in B05: `getUserByIdSchema`/`updateUserSchema` moved from `services/user/src/routes/user.validation.ts` (see SP-077); now imports `nameSchema`/`usernameSchema`/`positiveInt` from `@repo/contracts` | B05 | identity | Low | DONE |
| SP-097 | `services/identity/src/modules/profile/profile.routes.ts` | identity | ROUTE | CREATE | New in B05: the 3 profile routes + `multer` avatar-upload setup moved from `services/user/src/routes/user.routes.ts` (see SP-076); mounted at `/api/user` within identity — external paths unchanged | B05 | identity | Low | DONE |
| SP-100 | `services/core/package.json` | core | PKG_MANIFEST | CREATE | New in B06: `@services/core`, first module is `community`. Depends on `@repo/contracts` directly (community's validation imports `positiveInt`/`slugOrUuidSchema`/`toneSchema` from it, not via `@repo/shared`) | B06 | core | Medium | DONE |
| SP-101 | `services/core/tsconfig.json` | core | TS_CONFIG | CREATE | New in B06 | B06 | core | Low | DONE |
| SP-102 | `services/core/src/index.ts` | core | SERVICE_ENTRY | CREATE | New in B06: mounts `community` at `/api/user`; `learning` (B07) and `feed`/`dashboard` (B08) mount alongside it as they land | B06 | core | Medium | DONE |
| SP-103 | `services/core/src/modules/community/community.controller.ts` | core | CONTROLLER | CREATE | New in B06: `getFollowedUsersByUser`, `getUnfollowedMentors`, `getUnassociatedGroupsForUser`, `getAllGroupsForUser`, `getAllGroups`, `discoverGroups`, `getJoinedGroups`, `getGroupInvitations`, `getGroupDetail`, `createGroup`, `joinGroupById`, `getConnectionSummary`, `getConnectionSuggestions`, `getFollowingConnections`, `followUnfollowedUser`, `joinUnjoinedGroups` — all 16 extracted verbatim from `services/user/src/controllers/user.controller.ts` (see SP-074), plus a new local `assertSelf` guard consolidating the repeated auth-and-self-match check (explicitly requested by the batch). `getGroupWhere`/`mapResourceCard`/`mapGroupCard`/`mapUserCard` and their supporting types moved here too; `mapGroupCard`/`mapUserCard` (and the types built from them) are duplicated back in `user.controller.ts` since `getDashboardHome` still needs them | B06 | core | High | DONE |
| SP-104 | `services/core/src/modules/community/community.validation.ts` | core | VALIDATION | CREATE | New in B06: `loggedInUserIdParamsSchema`, `joinedGroupsParamsSchema`, `followUnfollowedUserSchema`, `joinUnjoinedGroupsSchema`, `discoverGroupsSchema`, `groupIdParamsSchema`, `createGroupSchema`, `joinGroupByIdSchema` moved from `services/user/src/routes/user.validation.ts` (see SP-077); `positiveInt`/`slugOrUuidSchema`/`toneSchema` now imported from `@repo/contracts` instead of re-declared locally (adopting primitives SP-083 made available in B03) | B06 | core | Low | DONE |
| SP-105 | `services/core/src/modules/community/community.routes.ts` | core | ROUTE | CREATE | New in B06: the 16 community routes moved from `services/user/src/routes/user.routes.ts` (see SP-076); mounted at `/api/user` within core — external paths unchanged | B06 | core | Low | DONE |
| SP-106 | `services/core/src/modules/learning/learning.controller.ts` | learning | CONTROLLER | CREATE | New in B07: `getLearningEvents`, `getLearningProjects`, `getLearningProjectById` extracted verbatim from `services/user/src/controllers/user.controller.ts` (see SP-074), along with the helpers/types only they need (`mapLearningEvent`, `mapLearningProject`, `ProjectPostRecord`) and duplicates of the shared ones `getDashboardHome` also needs (`getUserName`, `getInitials`, `formatDashboardEventMeta`, `DashboardEventRecord`, `DashboardPostRecord`) | B07 | core | Medium | DONE |
| SP-107 | `services/core/src/modules/learning/learning.validation.ts` | learning | VALIDATION | CREATE | New in B07: `projectIdParamsSchema` moved from `services/user/src/routes/user.validation.ts` (see SP-077), built from `@repo/contracts`'s `slugOrUuidSchema` | B07 | core | Low | DONE |
| SP-108 | `services/core/src/modules/learning/learning.routes.ts` | learning | ROUTE | CREATE | New in B07: the 3 learning routes (`/events`, `/projects`, `/projects/:id`) moved from `services/user/src/routes/user.routes.ts` (see SP-076); mounted at `/api/user` within core, alongside `community.routes.ts` — external paths unchanged | B07 | core | Low | DONE |
| SP-109 | `services/core/src/modules/learning/reads.ts` | learning | PKG_MODULE | CREATE | New in B07, per the batch's explicit "move study-room and topic reads that live in `getDashboardHome` into learning read helpers" instruction: `getLiveStudyRooms()`/`getTrendingTopics()` extract the `prisma.studyRoom.findMany`/`prisma.topic.findMany` queries (+ their `mapDashboardRoom`/`mapDashboardTopic` mapping) out of `getDashboardHome`'s inline `Promise.all`, as standalone functions `learning` now owns. **Not deleted from `getDashboardHome`** — that stays in `services/user` pending B08 and can't import across a service boundary, so it keeps running its own equivalent inline query until B08 moves it into `core` and wires it to call these instead. See `migration-log.md`'s B07 section for why this doesn't touch `SP-074`. | B07 | core | Medium | DONE |
| SP-110 | `services/core/src/modules/dashboard/dashboard.controller.ts` | dashboard | CONTROLLER | CREATE | New in B08: `getDashboardHome` extracted verbatim in logic (identical response shape, verified byte-for-byte against seeded data) from `services/user/src/controllers/user.controller.ts` (see SP-074) — the last function in that file, which is deleted along with the rest of `services/user` in this same batch. Rewritten to **compose** `community`'s `getSidebarGroups`/`getUpcomingEvents` (SP-113), `learning`'s `getLiveStudyRooms`/`getTrendingTopics` (SP-109), and `feed`'s `getRecentPosts` (SP-114) instead of querying their tables directly — the batch's explicit architectural requirement, now possible since dashboard finally lives in the same process as those modules. Also imports (rather than re-duplicating a 4th copy of) `mapGroupCard`/`mapUserCard`/`getUserName`/`getInitials` from `community.controller.ts`, which now exports them — resolving the dashboard-vs-community duplication B06/B07 left behind specifically because dashboard was in a different service. Still queries `User` directly (profile + suggested-people) since `User` belongs to `identity`, a separate deployable service | B08 | core | High | DONE |
| SP-111 | `services/core/src/modules/dashboard/dashboard.routes.ts` | dashboard | ROUTE | CREATE | New in B08: the one dashboard route (`/dashboard/:loggedInUserId`) moved from `services/user/src/routes/user.routes.ts` (see SP-076); mounted at `/api/user` within core, alongside `community.routes.ts` and `learning.routes.ts` — external path unchanged | B08 | core | Low | DONE |
| SP-112 | `services/core/src/modules/dashboard/dashboard.validation.ts` | dashboard | VALIDATION | CREATE | New in B08: `dashboardParamsSchema` moved from `services/user/src/routes/user.validation.ts` (see SP-077) | B08 | core | Low | DONE |
| SP-113 | `services/core/src/modules/community/reads.ts` | community | PKG_MODULE | CREATE | New in B08: `getSidebarGroups`/`getUpcomingEvents` extract the `prisma.group.findMany`/`prisma.groupEvent.findMany` queries out of `getDashboardHome`'s inline `Promise.all`, mirroring `learning/reads.ts`'s B07 pattern for the community-owned tables (`Group`, `GroupEvent`) dashboard's sidebar/upcoming-sessions widgets read. `getSidebarGroups` returns raw sorted rows rather than fully-mapped cards (unlike `learning/reads.ts`'s helpers) because mapping needs the caller's `loggedInUserId` as `mapGroupCard`'s viewer context, plus a dashboard-only `physics-club` symbol override — both stay in `dashboard.controller.ts` | B08 | core | Medium | DONE |
| SP-114 | `services/core/src/modules/feed/reads.ts` | feed | PKG_MODULE | CREATE | New in B08: `getRecentPosts` — the first (and, as of this batch, only) piece of the new `feed` module, the designated write owner for `Post`/`Comment`/`Like` per the batch's Definition of Done. No write endpoint exists for any of these tables anywhere in the app yet (confirmed by repo-wide grep before writing this module), so there is nothing to move except the one read `getDashboardHome` needs | B08 | core | Medium | DONE |
| SP-098 | `services/gateway/src/routeRules.ts` | edge | PKG_MODULE | CREATE | New in B05: ordered upstream route-rule table + `resolveRoute()`/`pathMatchesPrefix()`, extracted so `index.ts`'s 8 hand-written `app.use()` calls become one loop, and so routing is unit-testable without booting Express. A scoped precursor to the full B10 gateway modularization (SP-055), not that refactor itself | B05 | gateway | Medium | DONE |
| SP-099 | `services/gateway/src/routeRules.test.ts` | edge | TEST | CREATE | New in B05: parses `apps/web/utils/ApiRoutes.ts` and asserts every one of its 42 externally-visible `/api/*` paths resolves through `routeRules` to exactly one upstream, including the 3 profile paths now resolving to `identity` | B05 | gateway | Low | DONE |

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
- **B09** (messaging + media): SP-040 … SP-053, SP-057, SP-058, SP-059.
- **B10** (gateway + reconciliation): SP-001, SP-003, SP-006, SP-009, SP-011 (shim delete),
  SP-015 (shim delete), SP-054, SP-055, SP-062, SP-063, SP-064; final pass so every row is
  `DONE` / `KEEP` / `BLOCKED`.

## Status accounting

Counts below are machine-verified (`grep`-extracted from the actual table, not hand-tallied
— a hand-tally error during the B03 completeness audit is exactly why this rule exists now).

- Rows: 114 (the original 78, plus 12 B03-created rows `SP-079`–`SP-090`, plus 4 B04-created
  rows `SP-091`–`SP-094`, plus 5 B05-created rows `SP-095`–`SP-099`, plus 6 B06-created rows
  `SP-100`–`SP-105`, plus 4 B07-created rows `SP-106`–`SP-109`, plus 5 B08-created rows
  `SP-110`–`SP-114`). Duplicate IDs: 0. Duplicate current-file entries: 0.
- `KEEP` (no change intended): SP-002, SP-004, SP-005, SP-007, SP-008, SP-010, SP-025,
  SP-026, SP-027, SP-028, SP-056, SP-060, SP-061, SP-065 — **14 rows**.
- `DONE`: SP-011, SP-012, SP-014–SP-024 (13 rows, B03's `packages/shared` split) + SP-013,
  SP-031–SP-034, SP-038 (6 rows, B04's seed extraction incl. the `groupData` fixture) +
  SP-079–SP-090 (12 rows, B03-created files) + SP-091–SP-094 (4 rows, B04-created files) +
  SP-029, SP-030, SP-035–SP-037, SP-039 (6 rows, B05's identity rename) + SP-095–SP-099
  (5 rows, B05-created profile module + gateway route rules) + SP-100–SP-105 (6 rows,
  B06-created core service + community module) + SP-066–SP-072 (7 rows, B07's folded-in
  `resources`) + SP-106–SP-109 (4 rows, B07-created learning module) + SP-110–SP-114 (5 rows,
  B08-created dashboard + feed modules) + SP-073, SP-074, SP-075, SP-076, SP-077, SP-078
  (6 rows, `services/user`'s multi-batch split finally complete — its last domain,
  dashboard, moved out in B08 and the service itself is deleted) — **74 rows**.
- `PENDING` (actionable, batch assigned): **26 rows** — includes `SP-041`, which carries an
  adoption note but isn't `DONE` because its full MOVE is a separate, later batch (B09).
- `BLOCKED`: 0 in the manifest. One infra blocker was tracked in
  `service-decomposition-plan.md` (the missing `Dockerfile.service`) and was resolved in B02.
- Row-count check: 14 KEEP + 74 DONE + 26 PENDING = 114. ✓ (machine-counted via
  `grep -cE "^\| SP-[0-9]+"` and per-status `grep`, not hand-tallied.)

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
- `services/messaging/**` (rename target of `services/chat`; new `modules/calls/**`) (B09)
- ✅ `services/gateway/src/routeRules.ts` + `routeRules.test.ts` — **created in B05**, tracked
  as `SP-098`–`SP-099`; a scoped precursor to the full `services/gateway/src/routes/route-manifest.ts`
  + `services/gateway/src/middleware/**` split, still planned for B10 (SP-055).
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
