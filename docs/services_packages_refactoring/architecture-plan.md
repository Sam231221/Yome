# services/ and packages/ Architecture Plan

## Current Architecture Assessment

Yome's backend is a **modular monolith split into processes**, not a set of independent
microservices. Seven Express services in `services/*` (`gateway`, `auth`, `user`, `chat`,
`media`, `notifications`, `resources`) all share **one PostgreSQL database** and **one Prisma
client** (`@repo/database`). There are no per-service schemas, no database-level ownership
boundaries, and the dashboard endpoint already joins across `Group`, `Post`, `StudyRoom`,
`GroupEvent`, `Topic`, and `User` in a single query inside `services/user`.

The process split today buys real value in only three places: the **gateway** (auth edge),
**chat** (Socket.IO, stateful presence, independent scaling), and **media** (upload workload
profile, should hold no DB access). The remaining services are separate processes without an
independent runtime driver: same database, same deploy cadence, low traffic, no independent
scaling story.

Concrete problems found in the current tree:

- **`services/user` is a god service.** One ~1000-line controller owns profile CRUD, avatar
  upload, group discovery/detail/create/join, invitations, connections/follow, dashboard
  aggregation, learning events, and learning projects. Only `controllers/` and `routes/`
  directories exist; there are no internal module boundaries.
- **`services/auth` embeds a cross-domain seed subsystem.** `seed.controller.ts` (~600 lines)
  plus `src/data/{users,resources,dashboard}.ts` seed users, groups, resources, posts, topics,
  study rooms, and group events. Seeding touches every domain and ships inside the production
  auth image.
- **`services/resources` duplicates ownership.** Resource read/shape logic also lives in
  `services/user` (group detail `resources`, `mapResourceCard`) and resource **seeding** lives
  in `services/auth`. The service has ~6 endpoints and no independent runtime driver.
- **`services/user` and `services/resources` are not built or deployed.** `.github/workflows/ci.yml`
  `build-services` matrix and `.github/workflows/deploy-services.yml` list only `gateway`,
  `auth`, `chat`, `media`, `notifications`. Two of seven services are dev-only ghosts.
- **`deploy-services.yml` references `./Dockerfile.service`, which does not exist in the repo.**
  The services deploy pipeline cannot succeed.
- **`SCHEMA_OWNERSHIP.md` is violated.** `services/media` imports `@repo/database` (the doc
  says it must not). `Group` writes are split across `auth` (seed + `createEducationGroups`)
  and `user` (runtime CRUD). `Resource` writes are split across `auth` (seed) and `resources`
  (runtime).
- **`packages/shared` is a grab-bag.** It mixes runtime Express middleware, a logger, env/port
  config, and the S3 storage helper with a **523-line `groupData` seed fixture** that is
  imported by both `auth` seeding and `user` runtime fallback logic. `types/contracts.ts`
  defines a `ServiceName` union that does not even include `resources`.
- **Duplication across services.** `getAuthenticatedUserId`, `slugify`, `uuidPattern`,
  `formatCount`, and "card mapper" record types are re-declared in `auth`, `user`, `chat`, and
  `resources` independently.
- **No shared DTO/contract layer.** Request/response shapes are defined ad hoc per service and
  re-typed by hand in `apps/web`.
- **Lint is not wired into services.** Every service `package.json` has
  `"lint": "echo \"No lint configured\""`. Only `chat`, `resources`, and `shared` have tests.
- **Gateway routing is a hardcoded list** with special-cased path rewrites (`/api/messages` →
  chat `/api/chat`, `/api/db` → auth). There is no declarative route/upstream manifest.

This document (**Phase 1**) keeps one shared database, keeps public API paths and behaviour
stable, and re-cuts the process and package boundaries so that each domain has exactly one
owner and each separate process has a real reason to exist.

Phase 1 is a **prerequisite, not the end state**. Polyglot persistence (Redis, and later a
dedicated or non-relational store for messaging), the event-driven backbone, and the read-model
strategy are planned in three companion documents:

- [`data-architecture-plan.md`](./data-architecture-plan.md) — where each model lives, and the
  measurable trigger that justifies moving it. Includes the Redis introduction (whose trigger
  has **already fired** — presence and rate limiting are process-local today and block
  horizontal scaling).
- [`event-architecture-plan.md`](./event-architecture-plan.md) — the transactional outbox +
  Redis Streams backbone, event catalogue, and consumer contracts. Deliberately built **while
  still on one database**, so contracts are proven before any split.
- [`api-and-dataflow-plan.md`](./api-and-dataflow-plan.md) — the full synchronous API surface,
  service-to-service call rules, resilience requirements, and end-to-end data flows.

The phase model is summarised in `data-architecture-plan.md`: **P1** boundaries (this
document, B01–B10) → **P2** Redis (B11–B12) → **P3** event backbone on one DB (B13–B14) →
**P4** read models and search (B15–B16) → **P5/P6** database extraction, gated on measured
triggers and explicitly **not scheduled**.

You cannot split a database along boundaries that do not exist yet. That is why P1 comes
first: today `services/user` is one ~1000-line controller spanning four domains, and `Group`
has two writers. Splitting data before fixing that would freeze the current confusion into
network boundaries.

## Identified Domains and Owners

Domains are derived from the product surface (the `apps/web` sidebar in
`apps/web/lib/app-shell/navigation.ts`: Home/Feed, Explore, Groups, Connections, Messages,
Study Rooms, Resources, Projects, Events, Settings, plus Account) and from the Prisma schema.

- **identity**: credentials (login, register, OAuth upsert, password change) and profile
  (read, update, avatar upload). Owns `User` and `UserProfile` **rows**. Data:
  `User`, `UserProfile`.
- **community**: groups, group membership, connections/follow, group events, invitations,
  announcements, group tags. Owns `Group` and its children; owns the `_Followers` join.
  Data: `Group`, `GroupTag`, `GroupInvitation`, `GroupAnnouncement`, `GroupEvent`,
  `User` self-relation (follow edges only).
- **learning**: resources (CRUD, save, helpful votes), study rooms, topics, projects
  (the `Post` rows with `kind = "Project"`). Data: `Resource`, `ResourceSave`,
  `ResourceHelpfulVote`, `StudyRoom`, `StudyRoomParticipant`, `Topic`, plus the
  project view over `Post`.
- **feed**: posts, comments, likes, and the read-only dashboard aggregation (a BFF read
  that composes community + learning + feed). Data: `Post`, `Comment`, `Like`.
- **messaging**: direct and group messages, conversations, direct-call conversation
  preparation/validation, Socket.IO realtime (presence, push, read receipts). Data:
  `Messages`, `Conversation`.
- **media**: image and audio upload to object storage. Owns **no** database tables.
- **notifications**: notification delivery. Currently a stub acceptance endpoint. Owns no
  tables yet.
- **edge**: request routing, CORS, rate limiting, session-cookie decode, internal-token
  injection, `x-user-id` propagation. No domain data.

## Domain → Deployment Decision

A domain becomes its **own process** only with a concrete runtime driver (independent
scaling, statefulness, security-surface isolation, or a committed async/queue future).
Everything else is a **module inside a shared process**. Rationale per domain is in
`service-decomposition-plan.md`.

| Domain | Runtime driver | Result |
| --- | --- | --- |
| edge | Yes — auth edge, rate limiting, single ingress | `services/gateway` (own process) |
| identity | Yes — credential/security surface isolation, small and cohesive | `services/identity` (own process) |
| community | No — shared DB, heavy joins with learning/feed, low traffic | module `services/core/src/modules/community` |
| learning | No — shared DB, joins with community/feed | module `services/core/src/modules/learning` |
| feed | No — currently unowned; only seeded + read | module `services/core/src/modules/feed` + `.../dashboard` |
| messaging | Yes — Socket.IO, stateful presence, independent scaling | `services/messaging` (own process, renamed from `chat`) |
| media | Yes — upload workload profile, must hold no DB access | `services/media` (own process) |
| notifications | Weak but cheap — future async workers/queue home | `services/notifications` (own process, unchanged stub) |

**Net: 7 services → 5–6 deployable units** — `gateway`, `identity`, `core`, `messaging`,
`media`, and `notifications` (kept as a separate stub; may later collapse into a `core`
module if the async story does not materialise). `services/user` and `services/resources`
are removed; their code moves into `identity` and `core`.

A `core` module is promoted to its own process later **only** when a concrete driver appears
(a team owns it, it needs independent scaling, it grows a queue). The module boundaries make
that promotion mechanical.

## Architecture Rules

1. **One writer per table.** Every Prisma model has exactly one owning domain that performs
   writes. Other domains read through that domain's module API or a shared read query helper,
   never by writing the table directly. `packages/database/SCHEMA_OWNERSHIP.md` becomes the
   authoritative, module-level ownership map.
2. **Modules do not import each other's internals.** A `core` module exposes a small
   service-layer surface (`modules/<domain>/index.ts`). Cross-module use goes through that
   surface. No `import "../community/prisma-queries"` from `learning`.
3. **`services/media` holds no database access.** Upload authorization (can this user post to
   this conversation/group) is resolved from a gateway-injected claim or an internal call to
   `messaging`/`core`, not from `@repo/database`.
4. **Seed code and seed fixtures never ship in a production image.** They live in
   `packages/seed` and are mounted only by a dev-guarded route.
5. **Shared packages are single-purpose.** `packages/service-kit` (Express middleware,
   logger, env/ports), `packages/storage` (object storage), `packages/contracts` (DTOs,
   `ServiceName`, error envelope, shared zod primitives), `packages/seed` (dev fixtures +
   seed logic). `@repo/shared` remains only as a temporary re-export shim, removed in B10.
6. **Dependency direction:** `services/* -> packages/contracts -> packages/service-kit ->
   packages/storage`, and every service -> `packages/database`. Packages never import from
   `services/*`. `packages/contracts` never imports `packages/service-kit` or Express.
7. **Every service runs lint and type-check.** `"lint": "eslint ."` with a shared
   `packages/eslint-config` service profile; `"check-types": "tsc --noEmit"` already present
   everywhere and kept green after every batch.
8. **Public API paths do not change.** `apps/web/utils/ApiRoutes.ts` and the gateway's
   external route surface stay stable. Internal upstream targets change; the browser contract
   does not.

## Target Directory Structure

Create only directories that a real move needs.

```text
services/
  gateway/
    src/
      index.ts                # bootstrap only
      routes/route-manifest.ts # declarative upstream map
      middleware/             # cors, rate-limit, session-decode, internal-token, request-id
  identity/                  # renamed from services/auth
    src/
      index.ts
      modules/
        credentials/         # login, register, oauth-upsert, change-password  (from auth)
        profile/             # get, update, avatar upload                       (from user)
      dev/seed-route.ts      # dev-guarded, imports @repo/seed
  core/                      # new; absorbs services/user + services/resources
    src/
      index.ts
      modules/
        community/           # groups, membership, connections/follow, events, invitations
        learning/            # resources, study rooms, topics, projects view
        feed/                # posts, comments, likes
        dashboard/           # read-only BFF aggregation over the three modules above
  messaging/                 # renamed from services/chat
    src/
      index.ts
      modules/
        messages/            # direct + group message persistence, conversations
        calls/               # direct-call conversation prepare/validate
        realtime/            # socket handlers, online-users state
  media/
    src/
      index.ts
      routes/ controllers/   # unchanged shape; no @repo/database
  notifications/             # unchanged stub

packages/
  service-kit/               # was packages/shared: middleware, logger, errors, env/ports, url
  storage/                   # was packages/shared/src/storage
  contracts/                 # was packages/shared/src/types + new DTOs
  seed/                      # was services/auth/src/{seed,data} + packages/shared/src/data
  database/                  # unchanged single schema + client; ownership doc expanded
  eslint-config/             # + a service profile
  typescript-config/         # unchanged
```

## Gateway and Routing Strategy

`services/gateway/src/index.ts` keeps bootstrap and middleware wiring only. The hardcoded
`app.use("/api/...", proxyRequest(...))` list and the `/api/messages -> /api/chat` and
`/api/db -> auth` rewrites move into a declarative `route-manifest.ts`:

```text
{ publicPrefix: "/api/auth/register-user", ... }
{ externalPrefix: "/api/auth",        upstream: "identity" }
{ externalPrefix: "/api/user",        upstream: "core"     }   # path preserved for apps/web
{ externalPrefix: "/api/resources",   upstream: "core"     }   # path preserved for apps/web
{ externalPrefix: "/api/messages",    upstream: "messaging", rewrite: "/api/chat" }
{ externalPrefix: "/api/chat",        upstream: "messaging" }
{ externalPrefix: "/api/media",       upstream: "media"    }
{ externalPrefix: "/api/notifications", upstream: "notifications" }
{ externalPrefix: "/api/db",          upstream: "identity", devOnly: true }
```

External paths (`/api/user`, `/api/resources`, ...) stay exactly as `apps/web` expects. Only
the upstream target changes. `servicePorts` in `packages/service-kit` gains `core` and drops
nothing until the old services are deleted.

## Shared Package Strategy

`packages/shared` is split by responsibility:

- **`packages/service-kit`**: `errors.ts`, `logger.ts`, `config/env.ts` (`getRequiredEnv`,
  `servicePorts`), `middleware/{errorHandler,internalTokenGuard,validateRequest}.ts`,
  `utils/url.ts`. Depends on `zod` and optionally `express`.
- **`packages/storage`**: `s3.ts` and `s3.test.ts`. Depends on `@aws-sdk/client-s3`.
- **`packages/contracts`**: the current `types/contracts.ts` plus first-class request/response
  DTOs and shared zod primitives (`positiveInt`, `slugOrUuid`, `toneSchema`,
  `getAuthenticatedUserId` helper input type). Zero runtime framework dependencies. This is
  the module `apps/web` also imports for typed API responses.
- **`packages/seed`**: `services/auth/src/seed/*`, `services/auth/src/data/*`, and
  `packages/shared/src/data/groups.ts`. Exposes seed runners and fixtures. Consumed only by
  `services/identity/src/dev/seed-route.ts` and never imported by runtime request paths.

`@repo/shared` stays as a re-export shim for one migration window and is deleted in B10 after
all imports move.

## Database Strategy (Phase 1)

**Phase 1 performs no data-model split.** One PostgreSQL database, one `packages/database`
Prisma schema, one generated client. P1 changes *who writes each table*, not *where the tables
live*.

- `SCHEMA_OWNERSHIP.md` is rewritten as a model → owning-module table, kept in sync with code.
- Each model in `schema.prisma` gets a `/// owner: <module>` doc comment.
- Optional: a lightweight check (script or ESLint rule) that flags a `prisma.<model>.{create,
  update,delete,upsert}` call outside the owning module.
- `services/media` stops importing `@repo/database` entirely.

Establishing one writer per table is precisely what makes a later split possible — it is the
unit of extraction. **What happens after P1 is defined in
[`data-architecture-plan.md`](./data-architecture-plan.md)**, which specifies the target store
for every model and the measurable trigger that must fire before it moves. Summary of that
target:

| Models | Target store | Moves when |
| --- | --- | --- |
| `User`, `UserProfile` | Postgres — permanently | never |
| `Group` + children, follow edges | Postgres — permanently | never |
| `Resource*`, `StudyRoom*`, `Topic` | Postgres (write) + search index (read) | T-04: >50k resources, or search p95 >200 ms, or relevance/faceting required |
| `Post`, `Comment`, `Like` | Postgres (write) + cached read model | T-03: dashboard p95 >300 ms or >50 req/s |
| `Messages`, `Conversation` | Postgres → partitioned → dedicated Postgres → (only then) document/wide-column | T-05: >50M rows or >500 writes/s; T-06: >5k writes/s or >1TB retention |
| Presence, rate-limit buckets, socket fan-out | **Redis** | T-01/T-02: **already fired** — these are process-local `Map`s today |
| Notification records | Postgres `jsonb` or MongoDB | T-07: notifications become a real feature |

Two consequences for P1 work: `services/media` losing `@repo/database` (B09) is also the first
step toward a clean media boundary under any future split; and the cross-domain reads
catalogued in `data-architecture-plan.md` ("Cross-Domain Reads That Break Under a Split") are
cheap in-process module calls in P1 precisely *because* community, learning, and feed share the
`core` process — which is the direct justification for the module-over-service decision.

## CI/CD and Deployment Strategy

- `.github/workflows/ci.yml` `build-services` matrix and `deploy-services.yml` are updated to
  the target unit list: `gateway`, `identity`, `core`, `messaging`, `media`, `notifications`.
- `Dockerfile.service` (referenced by `deploy-services.yml`, currently missing) is added, or
  the deploy workflow is pointed at a real build file. This is tracked as a B02 blocker item.
- Interim: during B02, before consolidation lands, the matrix is corrected to at least match
  the services that actually exist and are meant to deploy.
- `bun run check-types` (Turbo) already covers every workspace; `bun run lint` starts doing
  real work once services get an ESLint config.

## Implementation Batches

Batches are ordered so that each one leaves the repo type-checking, linting, testing, and
building. No batch changes a public API path or a user-visible behaviour without explicit
validation. Only B01 is complete on creation of this document; every other batch is `PENDING`.

**B01–B10 below are Phase 1 (boundaries, one database).** Later batches are defined in the
companion documents and are not repeated here: **B11–B12** (Redis) and **B15–B17+** (read
models, search, database extraction) in [`data-architecture-plan.md`](./data-architecture-plan.md);
**B13–B14** (event backbone, notifications as first consumer) and **B18+** (post-split
projections) in [`event-architecture-plan.md`](./event-architecture-plan.md). B11 may run in
parallel with B05–B08 since it touches only `messaging` and `gateway`; B13 requires B10.

### B01 — Documentation Foundation

- Purpose: establish this plan, the decomposition plan, the migration log, and the manifest.
- Scope: `docs/services_packages_refactoring/*` only.
- Manifest IDs: none. `SP-001`–`SP-078` are inventory inputs only.
- Dependencies: none.
- Expected moves / refactors / deploy changes: none in `services/*` or `packages/*`.
- Validation: eligible-file count equals manifest row count; every actionable row has a batch.
- Risks: inventory drifts if backend files change during planning.
- Definition of Done: four docs exist, manifest covers every eligible file, actionable rows
  carry a batch, and no `services/*` or `packages/*` source is modified.

### B02 — CI/CD and Deploy Parity

- Purpose: make the build/deploy pipeline real and honest before any code moves.
- Scope: `.github/workflows/ci.yml`, `.github/workflows/deploy-services.yml`, a new
  `Dockerfile.service`, root `package.json` scripts.
- Manifest IDs: infra only (no `SP-*` source rows); `SP-060` (`gateway` package.json) and the
  root workflow files are touched.
- Dependencies: B01.
- Expected changes: add the missing `Dockerfile.service`; correct the `build-services` and
  deploy matrices to include every service that is supposed to ship (`user`, `resources`
  added in the interim, or matrix aligned directly to the target unit list if B05–B08 land
  first); capture a baseline validation run (see `migration-log.md`).
- Expected code moves: none.
- Validation: `bun run check-types`, `bun run --cwd services/chat test`,
  `bun run --cwd services/resources test`, `bun run --cwd packages/shared test`; CI green on
  the branch.
- Risks: deploy workflow secrets/registry differences surface only in CI.
- Definition of Done: CI builds every service that is meant to deploy; `deploy-services.yml`
  references a build file that exists; baseline recorded.

### B03 — Shared Package Split

- Purpose: turn `packages/shared` into single-purpose packages.
- Scope: `packages/shared/**`, and the import sites in every service.
- Manifest IDs: `SP-011`–`SP-023` (`packages/shared` files), plus import updates across
  `services/*` `SERVICE_ENTRY` / `CONTROLLER` / `ROUTE` rows.
- Dependencies: B01. (Can run before or after B02.)
- Expected moves: create `packages/service-kit`, `packages/storage`, `packages/contracts`;
  move middleware/logger/errors/env/url to `service-kit`; move `s3.ts`(+test) to `storage`;
  move `types/contracts.ts` to `contracts`. Keep `@repo/shared` as a thin re-export shim.
  `packages/shared/src/data/groups.ts` is deferred to B04.
- Expected refactors: update `packages/shared/package.json` workspace deps; add the three new
  package manifests and tsconfigs; update `servicePorts` type to include `core` (value wired
  in B06).
- Expected deploy changes: none.
- Validation: `bun run check-types`, `bun run --cwd packages/storage test`, all service
  `check-types`, `bun run build`.
- Risks: circular dependency if `contracts` accidentally imports `service-kit`; barrel-export
  churn.
- Definition of Done: no service imports `@repo/shared` except through the shim; the three
  new packages build and type-check; `contracts` has zero framework imports.

### B04 — Seed Extraction

- Purpose: get all seed code and fixtures out of production service images.
- Scope: `services/auth/src/controllers/seed.controller.ts`,
  `services/auth/src/data/{users,resources,dashboard}.ts`,
  `services/auth/src/routes/db.routes.ts`, `packages/shared/src/data/groups.ts`, and the
  `groupData` import in `services/user/src/controllers/user.controller.ts`.
- Manifest IDs: `SP-004` (`auth/seed.controller.ts`), `SP-005`–`SP-007` (`auth/src/data/*`),
  `SP-009` (`auth/db.routes.ts`), `SP-013` (`shared/src/data/groups.ts`), and the
  `user.controller.ts` fallback-group path (`SP-076`, partial).
- Dependencies: B03.
- Expected moves: create `packages/seed`; move `seed.controller.ts` logic and all four
  fixture files into it; rewrite `db.routes.ts` as a dev-guarded route that imports
  `@repo/seed`.
- Expected refactors: `services/user` runtime fallback that synthesises groups from
  `groupData` (`getUnassociatedGroupsForUser`, `joinUnjoinedGroups`) is replaced with a
  proper "no groups yet" empty response; that behaviour is seed concern, not runtime concern.
- Expected deploy changes: seed code no longer in the `auth`/`identity` production build
  output.
- Validation: `bun run check-types`; seed route still works locally with
  `ENABLE_DEV_SEED_ROUTES=true`; `curl -X POST http://localhost:3000/api/dev/db/seed-users`
  path unchanged.
- Risks: the runtime `groupData` fallback in `services/user` is load-bearing for first-run UX;
  removing it needs a product check.
- Definition of Done: `services/auth` (soon `identity`) contains no `src/data/*` and no seed
  business logic; `packages/seed` owns it; dev seed endpoints behave identically.

### B05 — identity Service (rename auth + absorb profile)

- Purpose: one service owns `User`/`UserProfile` row writes.
- Scope: rename `services/auth` → `services/identity`; move profile read/update/avatar from
  `services/user` into it.
- Manifest IDs: `SP-029`–`SP-038` (`services/auth/*`), and from `services/user`:
  `getUserById`, `updateUser`, `getAllUsers` in `user.controller.ts` (`SP-076`, partial),
  the matching routes in `user.routes.ts` (`SP-077`, partial), and the profile schemas in
  `user.validation.ts` (`SP-078`, partial).
- Dependencies: B03, B04.
- Expected moves: `services/identity/src/modules/credentials/` (from `auth`),
  `services/identity/src/modules/profile/` (from `user`); avatar upload uses
  `@repo/storage`.
- Expected refactors: `services/auth/package.json` name → `@services/identity`; gateway
  `route-manifest.ts` points `/api/auth` at `identity` (path unchanged externally); the
  profile endpoints keep their `/api/user/...` external path but are served by `identity`
  (gateway sends `/api/user/get-user-by-id`, `/api/user/update-user`, `/api/user/get-all-users`
  to `identity`; everything else on `/api/user` still goes to `core`).
- Expected deploy changes: CI/deploy matrix `auth` → `identity`.
- Validation: `bun run check-types`, register/login/password/profile flows exercised against
  a local gateway; `apps/web` account settings still updates.
- Risks: gateway now needs sub-path routing within `/api/user` (identity vs core); this is
  the main design detail of B05.
- Definition of Done: `services/identity` is the only writer of `User`/`UserProfile` rows;
  `services/user` no longer has profile endpoints.

### B06 — core Service Scaffold + community Module

- Purpose: stand up `services/core` and move the community domain into it.
- Scope: create `services/core`; move groups, membership, connections/follow, group events,
  invitations, announcements from `services/user` into `services/core/src/modules/community`.
- Manifest IDs: `SP-073`–`SP-075` (`services/user` entry/manifest/tsconfig, DELETE),
  `SP-076`–`SP-078` (community portions of controller/routes/validation, MOVE).
- Dependencies: B05.
- Expected moves: `services/core/src/index.ts`, `services/core/src/modules/community/**`;
  `services/user` shell deleted once empty.
- Expected refactors: `servicePorts.core` wired; gateway `route-manifest.ts` points the
  non-profile `/api/user/*` paths and `/api/user/groups/*`, `/api/user/connections/*` at
  `core`; `SCHEMA_OWNERSHIP.md` updated so `Group*` and follow edges are `community`.
- Expected deploy changes: CI/deploy matrix gains `core`, loses `user`.
- Validation: `bun run check-types`, `bun run build`; groups/connections pages in `apps/web`
  work end to end.
- Risks: `user.controller.ts` fan-out is large; the split must preserve every route path.
- Definition of Done: `services/user` is deleted; community endpoints served by `core`.

### B07 — core/learning Module (fold in resources)

- Purpose: delete `services/resources`; consolidate the learning domain in `core`.
- Scope: move `services/resources/src/**` into `services/core/src/modules/learning/resources`;
  move learning projects/events reads (`getLearningProjects`, `getLearningProjectById`,
  `getLearningEvents`) from the former `services/user` code into
  `services/core/src/modules/learning`; move study-room and topic reads that live in
  `getDashboardHome` into learning read helpers.
- Manifest IDs: `SP-066`–`SP-072` (`services/resources/*`), plus learning portions of the
  former `user.controller.ts`.
- Dependencies: B06.
- Expected moves: `core/src/modules/learning/**`; `services/resources` deleted.
- Expected refactors: gateway `route-manifest.ts` points `/api/resources` at `core` (external
  path unchanged); `SCHEMA_OWNERSHIP.md` sets `Resource*`, `StudyRoom*`, `Topic` to
  `learning`; the `Post kind=Project` view is documented as a learning read over feed-owned
  `Post`.
- Expected deploy changes: CI/deploy matrix loses `resources`.
- Validation: `bun run --cwd services/core test` (moved resource validation tests),
  `bun run check-types`, resources pages in `apps/web`.
- Risks: `Post`↔`Resource` and `Post`↔`Group` relations cross module lines; reads must go
  through module surfaces.
- Definition of Done: `services/resources` deleted; `ServiceName` no longer needs a
  `resources` member; learning endpoints served by `core`.

### B08 — core/feed + core/dashboard Modules

- Purpose: give `Post`/`Comment`/`Like` an owner and make dashboard an in-process BFF read.
- Scope: create `services/core/src/modules/feed` (write owner for `Post`, `Comment`, `Like`);
  move `getDashboardHome` aggregation into `services/core/src/modules/dashboard` composing
  `community` + `learning` + `feed` module surfaces.
- Manifest IDs: dashboard portion of the former `user.controller.ts`; new feed module files
  get fresh IDs when created.
- Dependencies: B06, B07.
- Expected moves: `core/src/modules/{feed,dashboard}/**`.
- Expected refactors: `SCHEMA_OWNERSHIP.md` sets `Post`, `Comment`, `Like` to `feed`; the
  dashboard endpoint keeps its `/api/user/dashboard/:id` external path.
- Expected deploy changes: none beyond B06.
- Validation: `bun run check-types`, dashboard page in `apps/web` renders identically.
- Risks: the dashboard query is a single large Prisma join today; splitting it into module
  calls must not regress latency or shape. Measure before and after.
- Definition of Done: no direct `prisma.post.*` writes outside `feed`; dashboard composes
  module reads.

### B09 — messaging + media Boundary Cleanup

- Purpose: rename `chat` → `messaging`, split calls out as a module, and remove DB access
  from `media`.
- Scope: `services/chat/**` → `services/messaging/**` with `modules/{messages,calls,realtime}`;
  `services/media/src/controllers/media.controller.ts` and `package.json`.
- Manifest IDs: `SP-040`–`SP-052` (`services/chat/*`), `SP-060`–`SP-064` (`services/media/*`).
- Dependencies: B03. (Independent of B05–B08; can run in parallel.)
- Expected moves: chat controller/lib/socket/state into messaging modules; call-prep
  functions (`prepareDirectCallConversation`, `validateDirectConversation`) into
  `modules/calls`.
- Expected refactors: `services/media` drops `@repo/database`; `getChatUploadScope` is
  replaced by a gateway-injected scope claim or an internal call to `messaging`; gateway
  `route-manifest.ts` `chat`/`messages` upstream → `messaging`.
- Expected deploy changes: CI/deploy matrix `chat` → `messaging`.
- Validation: `bun run --cwd services/messaging test` (moved chat tests),
  `bun run check-types`, chat send/receive + audio/image upload + direct call flow.
- Risks: socket auth and the media upload-scope check are behaviour-sensitive; keep payloads
  byte-compatible.
- Definition of Done: `services/media` does not import `@repo/database`; `services/messaging`
  owns messages + calls + realtime.

### B10 — Gateway Modularization + Final Reconciliation

- Purpose: finish the edge refactor and close the migration.
- Scope: `services/gateway/src/index.ts` → bootstrap + `routes/route-manifest.ts` +
  `middleware/*`; `packages/database/SCHEMA_OWNERSHIP.md`; remove the `@repo/shared` shim;
  add the `packages/eslint-config` service profile and wire `"lint": "eslint ."` into every
  service; extract `services/notifications` inline handler into a controller.
- Manifest IDs: `SP-054`–`SP-056` (`gateway`), `SP-001` (`SCHEMA_OWNERSHIP.md`),
  `SP-011`/`SP-014` (`@repo/shared` shim removal), `SP-024`–`SP-028`
  (`packages/eslint-config`, `typescript-config`), `SP-057`–`SP-059` (`notifications`).
- Dependencies: B02–B09.
- Expected moves: gateway middleware into separate files; declarative route manifest.
- Expected refactors: delete `packages/shared`; every `@repo/shared` import now points at
  `@repo/service-kit` / `@repo/storage` / `@repo/contracts`; optional write-ownership lint
  rule added; final manifest pass so every row is `DONE`, `KEEP`, or `BLOCKED`.
- Expected deploy changes: final CI/deploy matrix = `gateway`, `identity`, `core`,
  `messaging`, `media`, `notifications`.
- Validation: `bun run lint`, `bun run check-types`, `bun run test`,
  `bun run test:integration`, `bun run build`; full smoke of every `apps/web` sidebar route.
- Risks: stale imports if the shim is removed before every reference is updated.
- Definition of Done: no `@repo/shared`; gateway route map is declarative; every eligible
  file is `DONE`/`KEEP`/`BLOCKED`; no `PENDING` or `IN_PROGRESS` rows remain.

## Global Definition of Done

This section defines done for **Phase 1 (B01–B10)** only. Phases 2–6 carry their own
definitions of done in the companion documents, and each is gated on a trigger recorded in
`migration-log.md` rather than on Phase 1 completing.

- Every eligible file under `services/**` and `packages/**` has a manifest row with a stable
  ID, domain, classification, action, batch (if actionable), risk, and status.
- All non-`KEEP` / non-`BLOCKED` rows belong to an implementation batch.
- Each domain has exactly one writer per Prisma model, recorded in `SCHEMA_OWNERSHIP.md`.
- Each separately deployed process has a stated runtime driver in
  `service-decomposition-plan.md`.
- No public API path (`apps/web/utils/ApiRoutes.ts`, gateway external routes) or user-visible
  behaviour changes without explicit implementation validation.
- CI builds and (where configured) deploys exactly the target unit list.
- `packages/shared` is deleted; `packages/seed` code is absent from production images.
- Final `bun run lint`, `bun run check-types`, `bun run test`, `bun run build`, and
  `bun run test:integration` pass, or pre-existing failures are documented separately.
