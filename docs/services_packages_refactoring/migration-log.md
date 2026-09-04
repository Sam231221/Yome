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

Captured at the start of **B02** on 2026-09-04, before any B02 change, at commit `75b49f0`.
Runtime: `bun@1.3.5`, `node v22.19.0`, `turbo 2.8.7`, `docker 28.3.3`.

| Area | Command | Exit status | Result |
| --- | --- | --- | --- |
| Turbo typecheck | `bun run check-types` | 0 | Pass. 8 tasks, all cached (FULL TURBO). |
| Chat tests | `bun run --cwd services/chat test` | 0 | Pass. 16 tests, 4 files. |
| Resources tests | `bun run --cwd services/resources test` | 0 | Pass. 5 tests, 1 file. |
| Shared tests | `bun run --cwd packages/shared test` | 0 | Pass. 4 tests, 1 file. |
| Turbo build | `bun run build` | 0 | Pass. 9 tasks (8 cached); `@apps/web` builds all routes. |
| Turbo lint | `bun run lint` | 0 | Pass with **174 pre-existing warnings** (0 errors): `turbo/no-undeclared-env-vars`, `no-undef` on config files, `no-img-element`, React hook deps. |
| Turbo tests | `bun run test` | 0 | Pass. 12 tests in `@apps/web`; harmless `no output files for @apps/web#test` Turbo warning. |
| Integration smoke | `bun run test:integration` | not run | Needs running services; `INTEGRATION_STRICT` unset = non-blocking by design. |
| Per-service typecheck | `bun run check-types:all` | not run | Redundant with Turbo `check-types`, which passed. |

**The Turbo `system-configuration` panic noted in `docs/app_web_refactoring/migration-log.md`
did NOT reproduce.** Root `bun run lint` / `test` / `build` all exit 0 on this machine; that
prior failure is treated as environment-transient and is no longer a carried caveat.

Classification: no command fails. The only noise is 174 `@apps/web` lint **warnings**, all
pre-existing and documented in `docs/app_web_refactoring/`. B02 must not increase this count.

## Pre-existing Issues Inventory (from B01 audit)

These exist before any change in this migration and must not be counted as regressions.

| # | Issue | Location | Batch that resolves it |
| --- | --- | --- | --- |
| 1 | ✅ `@services/user` and `@services/resources` not in CI `build-services` matrix | `.github/workflows/ci.yml` | **B02 — done** |
| 2 | ✅ `@services/user` and `@services/resources` not in `deploy-services.yml` matrix | `.github/workflows/deploy-services.yml` | **B02 — done** |
| 3 | ✅ `deploy-services.yml` references missing `./Dockerfile.service` | `.github/workflows/deploy-services.yml` | **B02 — done** (file added) |
| 4 | `services/media` imports `@repo/database` (violates `SCHEMA_OWNERSHIP.md`) | `services/media/src/controllers/media.controller.ts`, `package.json` | B09 |
| 5 | `Group` writes split across `auth` (seed + `createEducationGroups`) and `user` (runtime) | `services/auth`, `services/user` | B04, B06 |
| 6 | `Resource` writes split across `auth` (seed) and `resources` (runtime) | `services/auth`, `services/resources` | B04, B07 |
| 7 | ~600-line seed subsystem + fixtures ship in the `auth` production image | `services/auth/src/{seed.controller.ts,data/*}` | B04 |
| 8 | `services/user` is a single ~1000-line controller spanning 4 domains | `services/user/src/controllers/user.controller.ts` | B05–B08 |
| 9 | `groupData` (523-line seed fixture) lives in `packages/shared` and is imported by `user` runtime code | `packages/shared/src/data/groups.ts` | B03/B04 — **deliberately left in place for B03**; extraction + runtime-fallback removal is B04 |
| 10 | ✅ `ServiceName` union in `packages/shared` omits `resources` (and has no DTOs) | now `packages/contracts/src/service.ts` | **B03 — done.** Added `resources`, `identity`, `core`, `messaging` |
| 11 | ✅ `getAuthenticatedUserId` / `slugify` / `uuidPattern` / `formatCount` duplicated across `auth`, `user`, `chat`, `resources` | now `packages/contracts/src/helpers.ts` | **B03 — done, both parts.** Consolidated *and* adopted (all four services import them; five local duplicates deleted from `user.controller.ts` alone) |
| 12 | No ESLint config in any service (`"lint": "echo ..."`) | every `services/*/package.json` | B10 |
| 13 | Only `chat`, `resources`, `shared` have tests | every other `services/*` / `packages/*` | ongoing; enforced from B05 |
| 14 | Gateway route/upstream map hardcoded with special-cased rewrites | `services/gateway/src/index.ts` | B10 |
| 15 | ✅ `tests/contracts.smoke.mjs` health list omits `resources` | `tests/contracts.smoke.mjs` | **B02 — done** |
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
| 28 | ✅ **Dev auth bypass in `sync-user`.** Was gated on `NODE_ENV !== "production"`; now gated on `ENABLE_DEV_USER_SYNC === "true"` (defaults off). Session-only without the flag | `apps/web/app/api/auth/sync-user/route.ts` | **B02 — done** |
| 29 | ✅ `visual-qa=1` bypass audited and documented in `middleware.ts` — three AND-ed conditions, the exact-host check unreachable in production; logic unchanged | `apps/web/middleware.ts` | **B02 — done** |
| 30 | ✅ **CI references `apps/mobile`.** `deploy-mobile.yml` deleted; `build-mobile` job, `mobile` outputs and paths-filter removed from `ci.yml` | `.github/workflows/ci.yml`, `deploy-mobile.yml` | **B02 — done** |
| 31 | ✅ **`turbo.json` `globalEnv` incomplete.** Expanded 18 → 51 entries covering every var application code reads | `turbo.json` | **B02 — done** |
| 32 | ✅ `JWT_KEY` — dead config. Removed from local `.env`; absent from `.env.example` | `.env` | **B02 — done** |
| 33 | ✅ `DEV_SEED_ROUTE_TOKEN` missing. Added to local `.env` and `.env.example` | `.env`, `.env.example` | **B02 — done** |
| 34 | ✅ **No containerization.** `Dockerfile.service`, `.dockerignore`, `docker-compose.yml` (Postgres + Redis) added | repo root | **B02 — done** |
| 35 | ✅ Migration coordination policy documented (see "Migration Coordination Policy" below); release-pipeline wiring lands with B13 | `packages/database`, deploy workflows | **B02 — done** |
| 36 | No observability plan. `createLogger` emits JSON but nothing aggregates it; `x-request-id` is generated and forwarded but never correlated; no metrics, no tracing | all services | Medium | B10 |
| 37 | No per-batch rollback strategy documented | all batches | Medium | B02 |
| 38 | 5 of 7 services have `"test": "echo ..."` stubs; no coverage target or unit/contract/integration split is defined | `auth`, `user`, `gateway`, `media`, `notifications` | Medium | B10 |
| 39 | `apps/web` is a de-facto BFF (holds `axios`, `jsonwebtoken`, `@stream-io/node-sdk`, service URLs, and backend secrets) but the docs treat it purely as a frontend | `apps/web` | Medium | B09 |
| 40 | `check-types` silently depends on `dist/*.d.ts` existing from a prior `build`, but Turbo's `check-types` task only depends on `^check-types` (which runs `tsc --noEmit`, emitting nothing) — not `^build`. After a clean `rm -rf packages/*/dist`, `check-types` fails on any package importing another workspace package's types, until `build` runs once. Found while validating B03 (`@repo/service-kit` → `@repo/contracts`); pre-existing pattern, not introduced by B03. Workaround: always run `build` before `check-types` on a clean checkout | root `turbo.json`, every package `tsconfig.json` | Low | B10 (add `check-types.dependsOn: ["^build"]`, or ship a committed `dist`) |

## Batch Execution History

| Batch | Status | Started | Completed | Validation Result | Notes |
| --- | --- | --- | --- | --- | --- |
| B01 — Documentation Foundation | COMPLETE | 2026-09-04 | 2026-09-04 | Manifest row count == eligible file count (78); every actionable row has a batch | Docs only. No `services/*` / `packages/*` source changed. |
| B02 — Foundation: CI/CD, Build Integrity, Security Baseline | COMPLETE | 2026-09-04 | 2026-09-04 | `check-types` 0; `build` 0; service tests 16/5/4 pass; `lint` 0 with 166 warnings (↓ from 174 baseline); `docker build -f Dockerfile.service --build-arg SERVICE_DIR=services/gateway .` exit 0, image runs to env-check | Infra + config only. No `services/*` / `packages/*` source moved. `apps/web` touched for the `sync-user` auth fix and a `middleware.ts` doc comment. |
| B03 — Shared Package Split | COMPLETE | 2026-09-04 | 2026-09-04 | `check-types` 0 (11/11); `build` 0 (12/12); `test` 0 (12/12, incl. new `@repo/contracts` suite); `lint` 0 (166 warnings, unchanged); `docker build --build-arg SERVICE_DIR=services/user` exit 0 | No `services/**` runtime behaviour changed. `@repo/shared` is now a shim; 4 duplicated helpers consolidated into `@repo/contracts` and adopted by `auth`, `user`, `chat`, `resources`. |
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

## Rollback Procedure (all batches)

Every batch is one or more commits on `refactor/services-packages-architecture`. Nothing is
force-pushed and history is not rewritten on this branch until it merges. The commit boundary
is the rollback boundary, so **batches are never squashed together during development**.

| Situation | Command | Effect |
| --- | --- | --- |
| Inspect what a batch changed | `git show --stat HEAD` | Read-only. |
| Undo a batch, keep the changes staged | `git reset --soft HEAD~1` | Commit gone; files still modified. |
| Undo a batch completely | `git reset --hard HEAD~1` | Commit and file changes gone. |
| Undo a batch several commits back | `git revert <sha>` (newest first) | Adds inverse commits; safe once other work sits on top. |
| The batch was pushed / shared | `git revert`, never `reset` | Avoids diverging a shared branch. |

Batch-specific notes:

- **B02** touches only workflow files, `turbo.json`, `Dockerfile.service`,
  `docker-compose.yml`, `.dockerignore`, `.env.example`, `tests/contracts.smoke.mjs`,
  `package.json`, and two `apps/web` auth files. `git revert` of the B02 commit is fully
  safe; it restores the prior (broken) CI matrices and the `NODE_ENV`-gated `sync-user`
  fallback. The **local `.env` edits are not committed** (`.env` is gitignored) — to undo
  them, re-add `JWT_KEY` and remove `DEV_SEED_ROUTE_TOKEN` / `ENABLE_DEV_USER_SYNC` by hand.
- **B03–B09** move code between packages/services. Prefer `git revert` of the whole batch
  range once later batches exist; otherwise `git reset --hard` to the sha recorded at the top
  of that batch's execution section.
- Record the current `HEAD` sha at the start of each batch's execution section as an explicit
  rollback target.

## Migration Coordination Policy

Migrations live in `packages/database/prisma/migrations` and are applied with
`bun run --cwd packages/database db:migrate` (`prisma migrate deploy`).

- **Who runs it in deploy:** a dedicated one-shot step that runs **once per release, before**
  any service image rolls out — not inside a service container's start-up, and never in
  parallel across services. `deploy-services.yml` builds images only; a migration step is
  added to the release pipeline in the same change that first needs a new migration (B13's
  `OutboxEvent` is the first).
- **Ordering against renames:** schema changes and service renames go in **separate batches**.
  Renames (B05 `auth`→`identity`, B09 `chat`→`messaging`) change no tables. B13 adds
  `OutboxEvent` with **no change to existing tables**, so it is backward compatible: old
  images keep working after it applies.
- **Expand/contract:** any column/table removal is two migrations across two releases
  (add-new / dual-write, then remove-old once no running image reads it). No P1 batch removes
  a column.
- **Local:** `bun run infra:up` starts Postgres + Redis; point `DATABASE_URL` / `DIRECT_URL`
  at the local instance, then `bun run --cwd packages/database db:migrate`.

## B03 Execution

- Rollback target: parent commit `727d4d3`.
- Scope: `packages/shared/**` split, three new packages created, import-site cleanup in four
  services. **No `services/*` runtime behaviour changed** — every consolidated helper is
  byte-identical to the code it replaced (verified by the new `@repo/contracts` test suite).
- Manifest IDs: `SP-011`–`SP-024` (all `DONE` except `SP-013`, deliberately deferred to B04)
  plus 12 newly created files assigned `SP-079`–`SP-090`; `SP-030`, `SP-041`, `SP-067`,
  `SP-074` gain an adoption note (destination MOVE still pending their own batch).

New packages:

| Package | Contents | Depends on |
| --- | --- | --- |
| `@repo/contracts` | `service.ts` (`ServiceName`, `HealthResponse`), `errors.ts` (`ErrorEnvelope`, `createHttpError`), `helpers.ts` (`getAuthenticatedUserId`, `slugify`, `UUID_PATTERN`/`isUuid`, `compactNumber`/`formatCount`), `schemas.ts` (`positiveInt`, `positiveIntString`, `slugOrUuidSchema`, `toneSchema` — available for B05+ adoption, not force-adopted here) | `zod` only — **zero Express, zero `@repo/service-kit`**, confirmed by `check-types` |
| `@repo/service-kit` | `logger.ts`, `config/env.ts` (`getRequiredEnv`, `servicePorts` — gained a `core` getter), `middleware/{errorHandler,internalTokenGuard,validateRequest}.ts`, `utils/url.ts` | `@repo/contracts` (for `ErrorEnvelope`), `zod`, `express` (peer, optional) |
| `@repo/storage` | `s3.ts`, `s3.test.ts` | `@aws-sdk/client-s3`, `@repo/contracts` (for `createHttpError` — a deliberate deviation from the plan's "storage depends on nothing" table, made because `createHttpError` is pure and belongs with the error-envelope contract, not duplicated) |
| `@repo/shared` | Shim: `export * from "@repo/contracts" / "@repo/service-kit" / "@repo/storage"`, plus local `groupData` (B04 still owns moving it) | the three packages above |

Deviation from the plan recorded: `createHttpError` was originally listed only as an
`@repo/service-kit` consumer concern; it is defined in `@repo/contracts` instead so
`@repo/storage` does not need to depend on `@repo/service-kit` (which pulls in Express types)
just to throw a typed HTTP error. This keeps the dependency graph exactly as specified —
`contracts → (nothing)`, `service-kit → contracts`, `storage → contracts` — with no cycle.

Helper consolidation (issue #11), by file:

| File | Local duplicates removed | Now imports (from `@repo/shared`) |
| --- | --- | --- |
| `services/auth/src/controllers/auth.controller.ts` | `getAuthenticatedUserId` | `getAuthenticatedUserId` |
| `services/auth/src/controllers/seed.controller.ts` | `slugify` | `slugify` (added to its existing `@repo/shared` import) |
| `services/chat/src/controllers/message.controller.ts` | `getAuthenticatedUserId` | `getAuthenticatedUserId` |
| `services/resources/src/controllers/resource.controller.ts` | `getAuthenticatedUserId`, `uuidPattern`, `slugify` | `getAuthenticatedUserId`, `isUuid`, `slugify` |
| `services/user/src/controllers/user.controller.ts` | `getAuthenticatedUserId`, `uuidPattern`, `slugify`, `formatCount`, `getCompactCount` | `getAuthenticatedUserId`, `isUuid`, `slugify`, `formatCount`, `compactNumber` |

A bug was found and fixed while doing this: the `test` script pattern `bun test
src/**/*.test.ts` only worked in `packages/shared` because `s3.test.ts` sat one directory
deep (`src/storage/`) and the unquoted glob is expanded by `sh`, not `bun`, before bun ever
sees it — `sh` has no globstar, so `src/**/*.test.ts` behaves like `src/*/*.test.ts`. Moving
`s3.test.ts` to `packages/storage/src/s3.test.ts` (one level shallower) broke that pattern
silently — `bun test src/**/*.test.ts` matched nothing (script exited 1). Separately, TypeScript
was compiling `*.test.ts` into `dist/`, so a bare `bun test` (no path) double-counted every
test (found it in the built `.js` *and* the `.ts` source — 8 results instead of 4). Fixed for
all three new packages: `tsconfig.json` now excludes `**/*.test.ts` from the build, and the
`test` script is `bun test ./src` (packages with no tests use the `echo` convention already
used by services). `@repo/shared`'s own `test` script was also changed to `echo` — it has no
test files any more and the old glob-based script would fail the same way.

Also added: `packages/contracts/src/helpers.test.ts` — 4 tests (Bun runner) proving the
consolidated helpers match the behaviour of every local implementation they replaced
(`getAuthenticatedUserId` header parsing incl. array headers; `slugify` trim/lowercase/dash
collapsing/120-char cap; `isUuid` accept/reject; `compactNumber`/`formatCount` thousand-suffix
formatting). This is new coverage `@repo/shared` never had.

Infra touched: `turbo.json` `globalEnv` gained `CORE_SERVICE_PORT` / `CORE_SERVICE_URL`
(service-kit's new `servicePorts.core` getter); `.env.example` documents both as reserved for
B06; root `package.json` `check-types:all` gained the three new packages.

Validation (run `build` before `check-types` on a clean tree — see issue #40):

| Command | Exit | Result |
| --- | --- | --- |
| `bun install` | 0 | Links the 3 new workspace packages; `bun.lock` updated. |
| `bun run build` | 0 | 12/12 tasks. |
| `bun run check-types` | 0 | 11/11 tasks (was 8 baseline; +3 new packages). One transient failure caught and diagnosed during this batch (see issue #40): running `check-types` against a freshly `rm -rf`'d `dist/` failed with `Cannot find module '@repo/contracts'` in `@repo/service-kit`, because `check-types` doesn't depend on `build`. Re-running after `build` passed; not a code defect. |
| `bunx tsc --noEmit` (in `apps/web`) | 0 | Unaffected by the split (no direct `@repo/shared` import in `apps/web`). |
| `bun run test` (turbo) | 0 | 12/12 tasks — chat 16, resources 5, `@repo/storage` 4, `@repo/contracts` 4 (new), `@apps/web` 12. |
| `bun run lint` | 0 | 166 warnings — **unchanged** from B02. |
| `node tests/contracts.smoke.mjs` | 0 | All 7 services `[OK] 200` (services were left running locally throughout). |
| `docker build -f Dockerfile.service --build-arg SERVICE_DIR=services/user .` | 0 | Chosen deliberately — `user` is the heaviest consumer of the consolidated helpers. Confirms the split resolves correctly inside the container build, not just local `bun`. |

Risks called out in the plan and their outcome: circular dependency — none; verified acyclic
(`contracts` has zero workspace deps, `service-kit`/`storage` depend only on `contracts`).
Barrel-export churn — contained to `packages/shared/src/index.ts`, which is a 5-line shim.
An unplanned but real finding, not in the original risk list: `bun run lint` and `bun run
test/build/check-types` reformatted five controller files far beyond the intended edit when
run through `bunx prettier --write` (the repo's controllers are not prettier-clean today).
Reverted and reapplied the same semantic edits by hand so the B03 diff stays scoped to the
helper consolidation — same lesson as the doc-formatting issue caught during B02.

## B03 Completeness Audit

Requested explicitly, run the same day against the already-committed B03 (`2715430`). Method:
re-derive every Definition-of-Done claim from the live tree rather than trusting the batch's
own summary — full clean rebuild (`rm -rf packages/*/dist packages/*/.turbo` then `build` →
`check-types` → `lint` → `test`), grep-based checks for each Definition-of-Done clause, a
repo-wide search for stale references to moved file paths, and a re-derivation of the
manifest's own row/status counts by machine rather than by hand. No source code changed by
this audit — only manifest/doc corrections and, separately, the stale-reference fixes below.

**Verified clean (no action needed):**

- No service imports `@repo/service-kit`, `@repo/storage`, or `@repo/contracts` directly —
  every consumer still goes through the `@repo/shared` shim, per the plan's Definition of
  Done.
- `@repo/contracts` has zero framework imports and zero workspace dependencies (`zod` only).
- No circular dependency: `service-kit` and `storage` each depend only on `contracts`;
  neither imports the other.
- No remaining local `getAuthenticatedUserId` / `slugify` / `uuidPattern` / `formatCount` /
  `getCompactCount` definitions anywhere in `services/**` — the consolidation in the B03
  Execution section above is complete, not partial.
- A fully clean rebuild (`build` → `check-types` → `lint` → `test`, `dist`/`.turbo` wiped
  first) reproduces the same green result as the batch's own validation: 12/12, 11/11, 166
  warnings, 12/12 with 0 failures across every suite. B03 is not an artefact of a warm cache.
- No `packages/*/dist` or `packages/*/.turbo` output is git-tracked.

**Gaps found and fixed:**

1. **Two doc-only bugs in `architecture-plan.md` and `refactor-manifest.md` that predate B03**
   (introduced during B01 planning, not by B03 itself): the B03 scope line said
   `SP-011`–`SP-023` when the actual row range is `SP-011`–`SP-024` (the `tsconfig.json` row
   was undercounted by one); `refactor-manifest.md`'s "Files this migration will create"
   section still listed `docker-compose.yml` as a B11 future file when it was already created
   in B02. Both corrected.
2. **12 B03-created files had no manifest row** (`SP-079`–`SP-090`) — a direct violation of
   the manifest's own stated rule that every eligible file gets one. Assigned during this
   audit. A first attempt also assigned IDs to `packages/contracts/src/errors.ts` and
   `packages/contracts/src/service.ts`, which turned out to duplicate files already tracked
   by `SP-014`/`SP-022` — caught by the same audit before commit and removed; final new-file
   count is 12, not 14.
3. **Nine `DONE` rows still showed the pre-move path** in "Current File"
   (`SP-012`, `SP-014`, `SP-016`–`SP-021`, `SP-023`) — e.g. `SP-016` said
   `packages/shared/src/logger.ts`, which no longer exists; the file is at
   `packages/service-kit/src/logger.ts`. The column had drifted from what it is supposed to
   track (the *current* location, not the origin). Corrected all nine; the origin is now
   recorded in the row's notes instead.
4. **`SP-022`'s recorded destination didn't match the shipped code.** It said `ServiceName`
   and `ErrorEnvelope` moved together into `service.ts`; the actual split put `ErrorEnvelope`
   in `errors.ts` (with `createHttpError`, tracked by `SP-014`) and only `ServiceName` /
   `HealthResponse` in `service.ts`. Corrected to match the code, not the other way around.
5. **Manifest status-accounting totals were hand-tallied and wrong twice in a row** while
   fixing (2)-(4) above (off-by-one in opposite directions each time). Replaced with a
   `grep`-derived count (`KEEP` 14, `DONE` 25, `PENDING` 51, sum 90) and a row-count check
   line, so the numbers are reproducible rather than asserted.
6. **Four stale references to pre-B03 file paths in docs outside this refactor's own folder**
   — `README.md` (the media-storage section, the shared-packages list, and the validation
   command list all still said `packages/shared/src/storage/s3.ts` /
   `bun run --cwd packages/shared test`), `docs/LOCALHOST_3000_REQUEST_WORKFLOW.md` (a
   directory-tree diagram and three inline path references). All fixed to point at
   `packages/{contracts,service-kit,storage}` as appropriate, with a pointer back to this
   refactor's docs for context. `docs/PROJECT_ARCHITECTURE_AND_WORKFLOWS.md` updated
   similarly (its `packages/shared` bullet was still accurate on its own but incomplete).

None of the six items involved incorrect *code* — every gap was in planning-document
accuracy (manifest bookkeeping, stale cross-references in adjacent docs). B03's actual
implementation (the package split, the shim, the helper consolidation) was correct as
committed; this audit closes the documentation gap around it.

## B02 Execution

- Rollback target: parent commit `75b49f0`.
- Scope: infrastructure and configuration only. **No `services/**` or `packages/**` source
  file moved, renamed, or deleted.** Two `apps/web` files changed for the security fix.
- Manifest IDs: none (`SP-*` rows untouched; B02 is infra-only per the plan).

Changes:

| Area | Change | Issue(s) |
| --- | --- | --- |
| Baseline | Recorded the validation table above; Turbo panic did not reproduce. | #37 |
| Containerization | Added `Dockerfile.service` (multi-stage, `SERVICE_DIR` build-arg, `bun` + Turbo) — `deploy-services.yml` already referenced it. Added `.dockerignore`. Added `docker-compose.yml`: Postgres 16 + Redis 7 (Redis unused until B11). Verified: `docker build --build-arg SERVICE_DIR=services/gateway` exits 0; the image runs `bun services/gateway/dist/index.js` to its env check. Image is ~1.85 GB (copies the full resolved workspace) — a prod-slimming pass is a later follow-up, not a B02 blocker. | #34 |
| CI matrices | `ci.yml`: removed the `mobile` paths-filter, `build-mobile` job, and `mobile` from `changes` outputs and the `quality` gate; added `.github/workflows/**` to the `packages` filter; added `@services/user` and `@services/resources` to `build-services`. | #1, #2, #30 |
| Deploy matrix | `deploy-services.yml`: added `user` (`yome-user`) and `resources` (`yome-resources`); added `Dockerfile.service` to trigger paths. **Deleted `deploy-mobile.yml`** (no `apps/mobile`). | #2, #30 |
| Turbo cache | `turbo.json` `globalEnv` 18 → 51 entries: every `*_SERVICE_URL` / `*_SERVICE_PORT`, `GATEWAY_PORT`, `GATEWAY_RATE_*`, `INTERNAL_TOKEN_GUARD_ENABLED`, `DATABASE_POOL_MAX`, all `AWS_*`, `STORAGE_PROVIDER`, OAuth provider vars, `NEXTAUTH_URL`, `ENABLE_DEV_USER_SYNC`. Confirmed effective: the change busted the `check-types` cache (0 cached) and removed 8 `turbo/no-undeclared-env-vars` lint warnings (174 → 166). | #31 |
| Security — `sync-user` | The request-body identity fallback is now gated on `ENABLE_DEV_USER_SYNC === "true"` (defaults off) instead of `NODE_ENV !== "production"`. Session-only without the flag. | #28 |
| Security — middleware | Documented the `visual-qa=1` bypass: three AND-ed conditions; the exact-host check is the production-unreachable boundary. Logic unchanged. | #29 |
| Config hygiene | Removed dead `JWT_KEY` (local `.env` only — gitignored). Added `DEV_SEED_ROUTE_TOKEN` and `ENABLE_DEV_USER_SYNC` to local `.env`. Added committed **`.env.example`** — every key, no values. | #32, #33 |
| Smoke test | `tests/contracts.smoke.mjs` now includes `resources` (4106). Verified locally: all 7 services return `[OK] 200`. Added root `smoke` script. | #15 |
| Scripts | Added `infra:up` / `infra:down` / `infra:reset` (docker compose) and `smoke` to root `package.json`. | — |
| Migration policy | Documented above. | #35 |

Deferred (not B02): observability (#36 → B10); test-coverage strategy (#38 → B10);
`apps/web` BFF cleanup (#39 → B09); the malformed `process.env.GOOGLE_Secret` case-variant
fallback in `apps/web/app/api/auth/[...nextauth]/options.ts` (still emits one
`turbo/no-undeclared-env-vars` warning — intentionally not added to `globalEnv` since the
correct `GOOGLE_CLIENT_SECRET` is already declared; noted as an app-level typo).

Validation:

| Command | Exit | Result |
| --- | --- | --- |
| `bun run check-types` | 0 | Pass (cache correctly busted by the `globalEnv` change). |
| `bunx tsc --noEmit` (in `apps/web`) | 0 | Pass — `sync-user` / `middleware` edits typecheck. |
| `bun run --cwd services/chat test` | 0 | 16 pass. |
| `bun run --cwd services/resources test` | 0 | 5 pass. |
| `bun run --cwd packages/shared test` | 0 | 4 pass. |
| `bun run build` | 0 | Pass. |
| `bun run lint` | 0 | **166 warnings** (↓ 8 from 174 baseline; 0 errors). No new warning introduced. |
| `node tests/contracts.smoke.mjs` | 0 | All 7 services `[OK] 200`, incl. `resources`. |
| `docker build -f Dockerfile.service --build-arg SERVICE_DIR=services/gateway .` | 0 | Image builds; entrypoint resolves and runs. |

Security note surfaced during B02 (no B02 action): the working-tree `.env` contains
live-looking AWS access keys, a real database password, and a real Stream secret. `.env` is
correctly gitignored so none of it is in the repository, but rotate these if they were ever
shared or committed elsewhere.

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
