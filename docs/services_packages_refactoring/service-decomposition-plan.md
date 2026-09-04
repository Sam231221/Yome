# services/ Decomposition Plan

## Summary

This document audits **process boundaries**, not file organisation. Splitting a controller
into modules, renaming a service, or moving code between packages is not decomposition.
The question here is narrow: **does a domain need its own OS process / deploy unit, or is it
a module inside a shared process?**

A domain gets its own process only with a concrete **runtime driver**:

- **Scaling** — it needs to scale on a different axis than the rest (CPU, memory, connections).
- **Statefulness / protocol** — long-lived connections, in-memory state, non-HTTP transport.
- **Security surface** — an isolation boundary that materially reduces blast radius.
- **Committed async future** — a queue / worker model that is planned and resourced, not
  hypothetical.

Absent a driver, a domain is a **module** in `services/core`. Yome runs one shared PostgreSQL
database and one Prisma client, so "it's a different domain" is not by itself a reason to run
a different process — the current tree already proves that (two of seven services are not even
deployed).

B01 verification (2026-09-04): the eight domains below were each evaluated against the four
drivers. No service code was moved during B01.

## Deployment Unit Decisions

| Unit ID | Domain | Current | Decision | Runtime driver | Batch |
| --- | --- | --- | --- | --- | --- |
| DU-01 | edge | `services/gateway` | **OWN PROCESS** | Single ingress; auth-cookie decode; rate limiting; the one component that must sit in front of everything. | B10 (modularize) |
| DU-02 | identity | `services/auth` (+ profile bits in `services/user`) | **OWN PROCESS** (rename `auth` → `identity`, absorb profile) | Security-surface isolation: credential endpoints, bcrypt, future lockout / MFA / per-identity rate limiting. Small (~7 endpoints) and cohesive; sole writer of `User`/`UserProfile` rows. | B05 |
| DU-03 | community | `services/user` | **MODULE** `core/modules/community` | None. Shared DB; every read joins `User` (identity) and is joined by learning + feed + dashboard. Low traffic. No independent scaling story. | B06 |
| DU-04 | learning | `services/resources` (+ reads in `services/user`, seed in `services/auth`) | **MODULE** `core/modules/learning`; delete `services/resources` | None. ~6 endpoints. `Resource` relates to `Post` (feed) and `Group` (community); the "projects" view *is* a `Post` query. Splitting it out forces cross-process joins for every list. | B07 |
| DU-05 | feed | unowned (`Post`/`Comment`/`Like` only seeded + read via dashboard/projects) | **MODULE** `core/modules/feed` + `core/modules/dashboard` | None. Not yet a real feature. Dashboard aggregation is a read that composes community + learning + feed — cheapest as an in-process BFF call. Promote to its own process only when a feed feature with its own scaling profile ships. | B08 |
| DU-06 | messaging | `services/chat` | **OWN PROCESS** (rename `chat` → `messaging`) | Statefulness + protocol: Socket.IO, in-memory `online-users` presence map, read-receipt fan-out. Genuinely scales on connection count, not request rate. | B09 |
| DU-07 | media | `services/media` | **OWN PROCESS** | Scaling: upload workload (large multipart bodies, buffer handling, S3 latency) is a different profile from JSON APIs. Must hold **no** DB access. | B09 (DB removal) |
| DU-08 | notifications | `services/notifications` | **OWN PROCESS (kept), stub** | Weak driver today (it is a 202 stub). Kept separate because it is the designated home for the future async/worker/queue model and the cost of an idle Express stub is trivial. Revisit at B10: collapse into `core/modules/notifications` if no async work is scheduled. | — (unchanged) |

**Net: 7 processes → 6** (`gateway`, `identity`, `core`, `messaging`, `media`,
`notifications`), with `notifications` on probation. `services/user` and `services/resources`
are deleted as processes; their code becomes `identity` and `core` modules.

## Why NOT more services

| Tempting split | Why it is a module, not a service |
| --- | --- |
| **events as its own service** | `GroupEvent` is a cascade child of `Group` with no standalone CRUD — rows are only created by the seeder and inside group creation. A service owning one child table needs a cross-process join to `Group` on every response. → `core/modules/community` sub-module. |
| **connections / follow as its own service** | Follow only writes the `_Followers` join table on `User`; every read needs `User` + shared-group context. → part of `core/modules/community`. |
| **projects as its own service** | "Projects" is `prisma.post.findMany({ where: { kind: "Project" } })`. It is a *view*, not a domain. → `core/modules/learning` read over feed-owned `Post`. |
| **dashboard / BFF as its own service** | It is a pure read that aggregates three `core` modules. Its own process would fan out three network calls to do what is now one in-process join. → `core/modules/dashboard`. |
| **profile as its own service** | Same tables as credentials (`User`, `UserProfile`), same write cadence. Two processes writing `User` is the current bug, not the target. → `identity/modules/profile`. |
| **calls as its own service** | Direct-call conversation prepare/validate is three endpoints that read `Conversation` and follow edges; the actual media path is Stream (third-party) + `services/media`. → `messaging/modules/calls`. |

## Module Promotion Criteria

A `services/core` module may be promoted to its own process later. It is only worth doing
when at least one is true:

- A dedicated team takes ownership and wants an independent deploy cadence.
- Load testing shows the module needs to scale on an axis the rest of `core` does not.
- The module grows a non-HTTP surface (queue consumer, cron worker, websocket).
- A compliance or security boundary requires process isolation.

Because modules already expose a narrow `modules/<domain>/index.ts` surface and own a
disjoint set of Prisma models, promotion is: new `services/<domain>` package, move the
module directory, add a gateway route-manifest entry, add a CI/deploy matrix row. No code
rewrite.

## Gateway Route Map — Before / After

External paths are the contract with `apps/web` and **do not change**. Only `upstream`
changes.

| External prefix | Before (upstream) | After (upstream) | Notes |
| --- | --- | --- | --- |
| `/api/auth/*` | `auth` | `identity` | rename only |
| `/api/user/get-user-by-id`, `/update-user`, `/get-all-users` | `user` | `identity` | profile endpoints move to identity |
| `/api/user/*` (all other) | `user` | `core` | groups, connections, dashboard, learning reads |
| `/api/resources/*` | `resources` | `core` | `services/resources` deleted |
| `/api/messages/*` | `chat` (rewrite `/api/chat`) | `messaging` (rewrite `/api/chat`) | rewrite preserved |
| `/api/chat/*` | `chat` | `messaging` | rename only |
| `/api/media/*` | `media` | `media` | unchanged |
| `/api/notifications/*` | `notifications` | `notifications` | unchanged |
| `/api/db/*` | `auth` (dev) | `identity` (dev) | dev-only seed route |

The `/api/user` prefix routes to **two** upstreams after B05 (three profile paths →
`identity`, everything else → `core`). This sub-path routing is the one new piece of gateway
logic and is the main design detail of B05.

## Shared Package Extraction

`packages/shared` is not a deployment unit, but its decomposition is on the critical path
because every service imports it.

| Target package | Contents (from `packages/shared/src/`) | Depends on | Consumers |
| --- | --- | --- | --- |
| `@repo/service-kit` | `errors.ts`, `logger.ts`, `config/env.ts`, `middleware/errorHandler.ts`, `middleware/internalTokenGuard.ts`, `middleware/validateRequest.ts`, `utils/url.ts` | `zod`, `express` (peer, optional) | every service |
| `@repo/storage` | `storage/s3.ts`, `storage/s3.test.ts` | `@aws-sdk/client-s3` | `identity` (avatar), `media` |
| `@repo/contracts` | `types/contracts.ts` + new request/response DTOs + shared zod primitives (`positiveInt`, `slugOrUuid`, `toneSchema`, ...) | `zod` only | every service, and `apps/web` |
| `@repo/seed` | `services/auth/src/seed/*`, `services/auth/src/data/{users,resources,dashboard}.ts`, `packages/shared/src/data/groups.ts` | `@repo/database`, `bcryptjs` | `services/identity` dev route only |
| `@repo/shared` | re-export shim only, then deleted | the four packages above | transitional |

Rules:

- `@repo/contracts` must not import Express or `@repo/service-kit` (keeps it usable from
  `apps/web`).
- `@repo/seed` must never be imported by a runtime request path — only by a dev-guarded
  route. Enforced by review and, optionally, an ESLint `no-restricted-imports` rule.
- `@repo/shared` is removed in B10 after every import is repointed.

## Keep-As-Is Decisions

| Item | Decision | Reason | Batch |
| --- | --- | --- | --- |
| `packages/database` — single schema, single client | **KEEP** | "No data modellings" split requested. One DB, ownership enforced by code + `SCHEMA_OWNERSHIP.md`. | B10 (doc only) |
| `packages/typescript-config` | **KEEP** | Already single-purpose and correct. | — |
| `packages/eslint-config` | **KEEP + extend** | Add a `service.js` profile; services currently have no lint. | B10 |
| `services/notifications` as a process | **KEEP (probation)** | Trivial cost; designated async-future home. Collapse into `core` at B10 only if no async work is committed. | B10 review |
| `services/media` as a process | **KEEP** | Real workload-profile driver. Only its `@repo/database` dependency is removed. | B09 |
| Socket.IO direct connection (bypassing gateway) | **KEEP** | WebSocket cannot go through the HTTP proxy gateway; documented in `LOCALHOST_3000_REQUEST_WORKFLOW.md`. | — |
| `Conversation` model as the direct-thread owner | **KEEP** | Recent migration already made this first-class; messaging owns it. | — |

## Blocked / Open Items

| Item | Status | Needs |
| --- | --- | --- |
| `Dockerfile.service` missing but referenced by `deploy-services.yml` | **BLOCKED (B02)** | The real service Dockerfile, or a decision to change the deploy build step. |
| Runtime `groupData` fallback in `services/user` (`getUnassociatedGroupsForUser`, `joinUnjoinedGroups`) | **OPEN (B04)** | Product decision: is first-run "synthesise groups from a fixture at request time" behaviour intended, or can it become an empty-state response once `@repo/seed` owns fixtures? |
| `notifications` process vs module | **OPEN (B10)** | Confirmation that an async/worker model is actually on the roadmap. |
| Dashboard aggregation latency after module split | **OPEN (B08)** | Before/after measurement of the dashboard endpoint; the current single Prisma join must not regress. |
| Media upload-scope check without DB | **OPEN (B09)** | Choose: gateway-injected scope claim vs internal call to `messaging`. |

## Validation

For every batch that changes a process boundary or a package boundary, run:

- `bun run check-types`
- `bun run lint` (meaningful once B10 wires service ESLint; `check-types` is the gate before that)
- `bun run --cwd services/<touched> test` for services that have tests
  (`messaging`/`chat`, `core`/`resources`, `packages/storage`/`shared`)
- `bun run build`
- `bun run test:integration` (health-endpoint smoke; extend `tests/contracts.smoke.mjs` to
  the new unit list)
- Manual smoke of the affected `apps/web` sidebar routes against a locally running gateway.

Each deployment unit must retain: a stated runtime driver (or "module"), a single set of
owned Prisma models, a gateway route-manifest entry, a CI build matrix row, and a
`deploy-services.yml` matrix row before it is considered done.
