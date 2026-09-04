# services/ and packages/ Refactor Migration Log

## Date and Start State

- Date: 2026-09-04
- Git branch: `refactor/services-packages-architecture` (branched from `production`)
- Repository package manager: `bun@1.3.5`
- Refactor state: **B01 (Documentation Foundation) complete.** B02–B10 are `PENDING`. No
  `services/*` or `packages/*` source has been modified. This branch currently contains only
  `docs/services_packages_refactoring/*`.

## Scope

This migration covers `services/**` and `packages/**`. It is a sibling of the completed
`docs/app_web_refactoring/` effort (which covered `apps/web`). It does **not** touch
`apps/web` except for import paths that follow package renames, and for the new
`/notifications` data source added in B14.

The work is **phased**, and only Phase 1 is currently planned in detail:

| Phase | Theme | Batches | Planned in |
| --- | --- | --- | --- |
| **P1** | Code + process boundaries, one PostgreSQL database | B01–B10 | `architecture-plan.md`, `service-decomposition-plan.md` |
| **P2** | Shared runtime state (Redis): presence, socket fan-out, rate limiting, cache | B11–B12 | `data-architecture-plan.md` |
| **P3** | Event backbone (transactional outbox → Redis Streams), still one DB | B13–B14 | `event-architecture-plan.md` |
| **P4** | Read models + search index | B15–B16 | `data-architecture-plan.md` |
| **P5/P6** | Database extraction / polyglot persistence | B17+, B18+ | `data-architecture-plan.md`, `event-architecture-plan.md` |

**P1 retains one PostgreSQL instance and one `packages/database` Prisma schema.** That is a
phase property, not a permanent constraint: establishing one writer per table is the
precondition for any later extraction. P5 and P6 are **gated on measured triggers** (T-01
through T-07 in `data-architecture-plan.md`) and are deliberately **not scheduled**.

Two of those triggers — T-01 (Redis for presence and socket fan-out) and T-02 (Redis for
gateway rate limiting) — have **already fired**: both are process-local `Map`s today, so
neither `messaging` nor `gateway` can run more than one replica correctly. P2 is therefore a
correctness fix, not an optimisation.

The synchronous API surface, service-to-service call rules, resilience requirements, and
end-to-end data flows are catalogued in `api-and-dataflow-plan.md`.

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
| 16 | Presence is a process-local `Map`; `messaging` cannot run >1 replica without silent delivery bugs | `services/chat/src/state/online-users.ts:2`, `services/chat/src/socket/handlers.ts` | B11 |
| 17 | Rate-limit buckets are a process-local `Map`; N `gateway` replicas grant N× the configured limit | `services/gateway/src/index.ts:79` | B11 |
| 18 | No caching layer anywhere; every read hits Postgres, incl. the 7-query dashboard fan-out | `services/user/src/controllers/user.controller.ts` (`getDashboardHome`) | B12, B15 |
| 19 | Search uses Prisma `contains` + `mode: "insensitive"` → unindexed `ILIKE '%term%'` sequential scans | `discoverGroups`, `getResources` | B16 |
| 20 | No event/outbox/pub-sub primitives exist; all cross-domain communication is a synchronous join or HTTP call | repo-wide | B13 |
| 21 | Gateway proxies with no timeout, retry, or circuit breaker; an unresponsive upstream hangs the request | `services/gateway/src/index.ts` | B10 |
| 22 | `GET /api/messages/get-messages/...` mutates `messageStatus` — a GET with side effects | `services/chat/src/controllers/message.controller.ts` | B09 |
| 23 | `apps/web` `/notifications` route has no backing API; `User.notificationCount` is a hardcoded schema default (`3`) | `services/notifications`, `schema.prisma` | B14 |
| 24 | Response envelopes are inconsistent — some `{ ok, ... }`, some bare (`{ users }`, `{ groups }`, `{ messages }`) | all services | B03 |

### Added by the B01 validation audit (2026-09-04)

| # | Issue | Location | Severity | Batch |
| --- | --- | --- | --- | --- |
| 25 | **`apps/web` bypasses the gateway and impersonates it.** `stream.actions.ts` calls `CHAT_SERVICE_URL` directly, forging `x-internal-token` (= `GATEWAY_SHARED_TOKEN`) and `x-user-id`. Violates the "gateway is the only synchronous entry point" invariant | `apps/web/actions/stream.actions.ts` | **High** | B09 |
| 26 | **Video calling has no service owner.** Stream token minting (`generateUserToken`), `upsertUsers`, and call authorization live in a Next.js server action. An entire domain is missing from the service map | `apps/web/actions/stream.actions.ts` | **High** | B09 |
| 27 | **`STREAM_SECRET_KEY` and `GATEWAY_SHARED_TOKEN` are held by `apps/web`.** The frontend deploy carries backend secrets | `apps/web`, root `.env` | **High** | B09 |
| 28 | **Dev auth bypass in `sync-user`.** When `NODE_ENV !== "production"` the route accepts `email`/`name`/`image` from the request body with no session — an account-takeover primitive if `NODE_ENV` is unset in a deployed environment | `apps/web/app/api/auth/sync-user/route.ts` | **High** | B02 |
| 29 | `visual-qa=1` query param bypasses `withAuth` (gated on dev + localhost). Inventory and confirm the gate cannot be reached in production | `apps/web/middleware.ts` | Medium | B02 |
| 30 | **CI references `apps/mobile`, which does not exist.** `deploy-mobile.yml` in full, plus the `build-mobile` job and `mobile` paths-filter in `ci.yml`. `turbo run build --filter=@apps/mobile` would fail if it ever ran | `.github/workflows/ci.yml`, `deploy-mobile.yml` | Medium | B02 |
| 31 | **`turbo.json` `globalEnv` is incomplete** — missing `AUTH_SERVICE_URL`, `USER_SERVICE_URL`, `MEDIA_SERVICE_URL`, `NOTIFICATIONS_SERVICE_URL`, every `*_SERVICE_PORT`, `GATEWAY_PORT`, `GATEWAY_RATE_WINDOW_MS`, `GATEWAY_RATE_MAX_REQUESTS`, `STORAGE_PROVIDER`, and every `AWS_*`. Turbo cache keys therefore omit them, so changing one can serve a stale cached build | `turbo.json` | **High** | B02 |
| 32 | `JWT_KEY` is declared in `.env` and used nowhere in the repository — dead config | `.env` | Low | B02 |
| 33 | `DEV_SEED_ROUTE_TOKEN` is required by the seed reset route but is absent from `.env`; the documented reset command cannot succeed | `.env`, `README.md` | Low | B02 / B04 |
| 34 | **No containerization exists.** Zero Docker, compose, k8s, helm, or terraform files are tracked, yet `deploy-services.yml` builds `./Dockerfile.service` | repo root | **High** | B02 |
| 35 | No migration coordination strategy — the docs never state who runs `db:migrate` during deploy, or how migrations are ordered against service renames and the `OutboxEvent` addition | `packages/database`, deploy workflows | Medium | B02 / B13 |
| 36 | No observability plan. `createLogger` emits JSON but nothing aggregates it; `x-request-id` is generated and forwarded but never correlated; no metrics, no tracing | all services | Medium | B10 |
| 37 | No per-batch rollback strategy documented | all batches | Medium | B02 |
| 38 | 5 of 7 services have `"test": "echo ..."` stubs; no coverage target or unit/contract/integration split is defined | `auth`, `user`, `gateway`, `media`, `notifications` | Medium | B10 |
| 39 | `apps/web` is a de-facto BFF (holds `axios`, `jsonwebtoken`, `@stream-io/node-sdk`, service URLs, and backend secrets) but the docs treat it purely as a frontend | `apps/web` | Medium | B09 |

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
| B11 — Redis Foundation (P2) | PENDING | | | | Trigger T-01/T-02 already fired. May run in parallel with B05–B08. |
| B12 — Cache-Aside Read Paths (P2) | PENDING | | | | Requires B11. |
| B13 — Event Backbone (P3) | PENDING | | | | Requires B10 + B11. Outbox on the shared DB. |
| B14 — Notifications as First Consumer (P3) | PENDING | | | | Requires B13. Makes the 202 stub real. |
| B15 — Dashboard Read Model (P4) | PENDING | | | | Gated on trigger T-03. |
| B16 — Search Index (P4) | PENDING | | | | Gated on trigger T-04. Postgres FTS before OpenSearch. |
| B17+ — Database Extraction (P5) | NOT SCHEDULED | | | | Gated on trigger T-05/T-06 being measured and recorded below. |
| B18+ — Post-Split Projections (P5) | NOT SCHEDULED | | | | Opened alongside the matching B17+ extraction. |

## Trigger Measurements

Phase 5 and Phase 6 batches may only be opened after the relevant trigger from
`data-architecture-plan.md` is measured and recorded here. "Fired" is a recorded measurement,
not an opinion.

| Trigger | Threshold | Measured value | Date | Status |
| --- | --- | --- | --- | --- |
| T-01 Redis presence / socket fan-out | ≥ 2 `messaging` replicas | n/a — in-process `Map` makes ≥2 replicas incorrect at any count | 2026-09-04 | **FIRED** (correctness defect) |
| T-02 Redis rate limiting | ≥ 2 `gateway` replicas | n/a — same defect class | 2026-09-04 | **FIRED** (correctness defect) |
| T-03 Dashboard read model | p95 > 300 ms, or > 50 req/s | _not measured_ | | not fired |
| T-04 Search index | > 50k `Resource` rows, or search p95 > 200 ms | _not measured_ | | not fired |
| T-05 Messaging own database | > 50M `Messages` rows, or > 500 writes/s | _not measured_ | | not fired |
| T-06 Messaging document/wide-column store | > 5k writes/s, or > 1 TB retention | _not measured_ | | not fired |
| T-07 Notifications store | notifications become a real feature | _not applicable yet_ | | not fired |

Measurement commands to run before opening any P4/P5 batch are listed under each trigger in
`data-architecture-plan.md`. T-05 additionally requires that `Messages` partitioning has
already been applied and its ceiling measured.

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

### B01 addendum — system design (same day)

The initial B01 pass scoped out persistence, caching, and eventing entirely, asserting "no
data-model split". That was too narrow: it answered *where code lives* but not *where data
lives* or *how domains share it*. Three documents were added and the original two were
reframed from a flat B01–B10 plan into the P1–P6 phase model.

- Added `data-architecture-plan.md` — target store per model, seven trigger definitions
  (T-01…T-07) with thresholds and measurement methods, the Redis introduction with key
  patterns, database-split mechanics, and the seven cross-domain reads that break under a
  split.
- Added `event-architecture-plan.md` — transactional outbox + Redis Streams, `OutboxEvent`
  model, event envelope, stream topology, a 25-event catalogue across six domains, consumer
  map, delivery/idempotency/ordering rules, and schema evolution policy.
- Added `api-and-dataflow-plan.md` — the complete synchronous API surface (every endpoint →
  owner → models → kind), the gateway route manifest with the `/api/user` sub-path split,
  sync-vs-async decision rules, service-to-service call rules, read-model strategy,
  resilience requirements, four end-to-end flow diagrams, and ten catalogued API defects.
- Reframed `architecture-plan.md` (Database Strategy is now Phase 1 scoped, with the target
  store table and links to the companion docs) and `service-decomposition-plan.md` (process
  boundaries and data boundaries stated as separate decisions; DU-06 and DU-08 rationale
  updated).
- Recorded 9 additional pre-existing issues (#16–#24) found during the system-design audit.

Decisions locked with the requester for this addendum: polyglot persistence is documented as
**trigger-gated with thresholds**, not a committed roadmap; the event backbone is **Redis
Streams** (Redis is already required by T-01/T-02, so it adds no new infrastructure); all
three documents were written plus the reframe. Still docs only — no `services/*` or
`packages/*` source changed.

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
