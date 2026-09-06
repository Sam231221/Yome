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
gateway rate limiting) — had **already fired** before P1 even finished: both were
process-local `Map`s, so neither `messaging` nor `gateway` could run more than one replica
correctly. P2 was therefore a correctness fix, not an optimisation — **and, as of B11, both
are resolved**: presence and rate limiting are now backed by `@repo/cache` (Redis), live-verified
consistent across multiple real replicas of each service.

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
- `bun run dev:services` (concurrently: gateway, identity, user, chat, media, notifications, resources)

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
| 4 | ✅ `services/media` imports `@repo/database` (violates `SCHEMA_OWNERSHIP.md`) | `services/media/src/controllers/media.controller.ts`, `package.json` | **B09 — done.** `@repo/database` removed; `getChatUploadScope` now calls `messaging`'s `POST /api/chat/authorize-upload-scope` instead |
| 5 | ✅ `Group` writes split across `auth` (seed + `createEducationGroups`) and `user` (runtime) | now `services/identity` (dev-only seed via `@repo/seed`) and `services/core`'s community module (runtime) | **B04, B06 — done.** Seed path unchanged (dev-only, guarded); runtime Group CRUD/membership now owned solely by `core` |
| 6 | ✅ `Resource` writes split across `auth` (seed) and `resources` (runtime) | now `services/identity` (dev-only seed via `@repo/seed`) and `services/core`'s learning module (runtime) | **B04, B07 — done.** Seed path unchanged (dev-only, guarded); runtime Resource CRUD/saves/helpful-votes now owned solely by `core` |
| 7 | ✅ ~600-line seed subsystem + fixtures ship in the `auth` production image | now `packages/seed/src/{runners.ts,fixtures/*}` | **B04 — done.** `services/auth` (soon `identity`) has no `src/data/*` and no seed business logic; `packages/seed` owns it |
| 8 | ✅ `services/user` is a single ~1000-line controller spanning 4 domains | now `services/identity/src/modules/profile/`, `services/core/src/modules/{community,learning,dashboard}/` | **B05–B08 — done.** B05: profile out (~170 lines). B06: community out (~870 lines). B07: learning out (~160 lines). B08: dashboard out (the last ~330 lines) — `services/user` deleted entirely |
| 9 | ✅ `groupData` (523-line seed fixture) lived in `packages/shared` and was imported by `user` runtime code | now `packages/seed/src/fixtures/groups.ts` | **B04 — done.** Fixture moved; the two `services/user` runtime call sites removed (decision: remove, confirmed with the user) |
| 10 | ✅ `ServiceName` union in `packages/shared` omits `resources` (and has no DTOs) | now `packages/contracts/src/service.ts` | **B03 — done.** Added `resources`, `identity`, `core`, `messaging`. **B07: `resources` removed again** — not a regression of this issue, `services/resources` itself was deleted (folded into `core`), so the union correctly has no member for it anymore |
| 11 | ✅ `getAuthenticatedUserId` / `slugify` / `uuidPattern` / `formatCount` duplicated across `auth`, `user`, `chat`, `resources` | now `packages/contracts/src/helpers.ts` | **B03 — done, both parts.** Consolidated *and* adopted (all four services import them; five local duplicates deleted from `user.controller.ts` alone) |
| 12 | ✅ No ESLint config in any service (`"lint": "echo ..."`) | every `services/*/package.json` | **B10 — done.** New `packages/eslint-config/service.js`; all 6 services now run `eslint .` for real (0 errors, 3 pre-existing warnings) |
| 13 | Only `chat`, `resources`, `shared` have tests | every other `services/*` / `packages/*` | ongoing; enforced from B05 |
| 14 | ✅ Gateway route/upstream map hardcoded with special-cased rewrites | `services/gateway/src/routes/route-manifest.ts` | **B05 (scoped precursor): extracted to a tested, declarative `routeRules.ts` table. B10 — done in full:** renamed to `route-manifest.ts`, extended with per-rule `timeoutMs`, and `index.ts` now mounts it via one loop with all bootstrap/middleware concerns split into their own files |
| 15 | ✅ `tests/contracts.smoke.mjs` health list omits `resources` | `tests/contracts.smoke.mjs` | **B02 — done. B07: `resources` entry replaced with `core`** (the service itself was deleted, folded into `core`) — **also caught, while making that edit, that B06 had introduced `core` as a real service without ever adding it here; fixed in the same commit rather than leaving it for another audit** |
| 16 | ✅ Presence is a process-local `Map`; `messaging` cannot run >1 replica without silent delivery bugs | `packages/cache/src/presence.ts` | **B11 — done.** Redis-backed via `@repo/cache`; live-verified consistent across 2 real replicas |
| 17 | ✅ Rate-limit buckets are a process-local `Map`; N `gateway` replicas grant N× the configured limit | `services/gateway/src/middleware/rateLimiter.ts` | **B11 — done.** Redis sliding-window via `@repo/cache`; live-verified the combined limit holds across 2 real replicas |
| 18 | No caching layer anywhere; every read hits Postgres, incl. the 7-query dashboard fan-out | `services/core/src/modules/dashboard/dashboard.controller.ts` (`getDashboardHome`, moved from `services/user` in B08 — still 7 queries, now split across `community`/`learning`/`feed` module calls instead of inline, but none of them cached) | B12, B15 |
| 19 | Search uses Prisma `contains` + `mode: "insensitive"` → unindexed `ILIKE '%term%'` sequential scans | `discoverGroups`, `getResources` | B16 |
| 20 | No event/outbox/pub-sub primitives exist; all cross-domain communication is a synchronous join or HTTP call | repo-wide | B13 |
| 21 | ✅ Gateway proxies with no timeout, retry, or circuit breaker; an unresponsive upstream hangs the request | `services/gateway/src/middleware/proxy.ts` | **B10 — done.** 5s default / 30s for `/api/media` timeout; 2-attempt retry for idempotent methods on connection failure or timeout only; per-upstream circuit breaker (opens at 5 consecutive failures, half-opens after 30s). Live-verified against a controlled fake upstream |
| 22 | `GET /api/messages/get-messages/...` mutates `messageStatus` — a GET with side effects | `services/messaging/src/modules/messages/messages.controller.ts` | **Not addressed by B09** — pre-tagged for this batch by the B01 audit, but `architecture-plan.md`'s actual B09 scope (rename + call extraction + media de-DB) never calls for fixing it, and the batch instructions given didn't ask for it either. `getMessages` moved byte-identical; the side effect is unchanged. Retagged: B10 or later |
| 23 | ✅ `apps/web` `/notifications` route has no backing API; `User.notificationCount` is a hardcoded schema default (`3`) | `services/notifications`, `schema.prisma` | **B14 — done.** `services/notifications` is a real event consumer over all `yome:events:*` streams with a Postgres `Notification` store (trigger T-07: `jsonb`, not MongoDB); new `GET /api/notifications` + `POST /:id/read` + `POST /read-all`; `apps/web`'s static mock replaced with a real data view. `User.notificationCount` is written to the live unread count in the same transaction as every notification create/read |
| 24 | Response envelopes are inconsistent — some `{ ok, ... }`, some bare (`{ users }`, `{ groups }`, `{ messages }`) | all services | B03 (never actually addressed then; re-flagged as an optional B10 decision point in `00-START-HERE.md`, explicitly deferred per direct user instruction during B10 — standardizing to `{ ok, data, error }` is a breaking change for every `apps/web` call site and deserves its own batch, not a footnote on gateway modularization). Retagged: unscheduled |

### Added by the B01 validation audit (2026-09-04)

| # | Issue | Location | Severity | Batch |
| --- | --- | --- | --- | --- |
| 25 | ✅ **`apps/web` bypasses the gateway and impersonates it.** `stream.actions.ts` calls `CHAT_SERVICE_URL` directly, forging `x-internal-token` (= `GATEWAY_SHARED_TOKEN`) and `x-user-id`. Violates the "gateway is the only synchronous entry point" invariant | `apps/web/actions/stream.actions.ts` | **High** | **B09 — done.** File deleted; replacement calls go through the gateway (`apps/web/lib/chat/callApi.ts`) |
| 26 | ✅ **Video calling has no service owner.** Stream token minting (`generateUserToken`), `upsertUsers`, and call authorization live in a Next.js server action. An entire domain is missing from the service map | `apps/web/actions/stream.actions.ts` | **High** | **B09 — done.** `services/messaging/src/modules/calls` now owns this domain |
| 27 | ✅ **`STREAM_SECRET_KEY` and `GATEWAY_SHARED_TOKEN` are held by `apps/web`.** The frontend deploy carries backend secrets | `apps/web`, root `.env` | **High** | **B09 — done, for the reason this issue names.** `apps/web` no longer reads either var. (`GATEWAY_SHARED_TOKEN` is still read in two unrelated, already-"correct" call sites — `sync-user`, `devDbProxy` — a different, pre-existing, intentional use of the same shared-token model, not this violation) |
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
| 38 | 5 of 7 services have `"test": "echo ..."` stubs; no coverage target or unit/contract/integration split is defined | `identity`, `media`, `notifications` (`user` deleted in B08; `chat`/`messaging` has a real suite since before B09) | Medium | **Partially addressed.** B10's scope was lint stubs (issue #12), a distinct gap. **B14: `notifications` now has a real `bun test ./src` suite (11 tests — derivation + persist/idempotency).** `identity` and `media` still have echo stubs; no batch currently scheduled to add unit tests to those two |
| 39 | `apps/web` is a de-facto BFF (holds `axios`, `jsonwebtoken`, `@stream-io/node-sdk`, service URLs, and backend secrets) but the docs treat it purely as a frontend | `apps/web` | Medium | **B09 — partially done.** `@stream-io/node-sdk` and the `stream.actions.ts` backend secrets are gone. `axios`, `jsonwebtoken`, service URLs, and the doc-treats-it-as-frontend framing remain — this issue is about the BFF pattern generally, not just the Stream piece; the general framing question is still open for B10 |
| 40 | `check-types` silently depends on `dist/*.d.ts` existing from a prior `build`, but Turbo's `check-types` task only depends on `^check-types` (which runs `tsc --noEmit`, emitting nothing) — not `^build`. After a clean `rm -rf packages/*/dist`, `check-types` fails on any package importing another workspace package's types, until `build` runs once. Found while validating B03 (`@repo/service-kit` → `@repo/contracts`); pre-existing pattern, not introduced by B03. Workaround: always run `build` before `check-types` on a clean checkout | root `turbo.json`, every package `tsconfig.json` | Low | B10 (add `check-types.dependsOn: ["^build"]`, or ship a committed `dist`) |

## Batch Execution History

| Batch | Status | Started | Completed | Validation Result | Notes |
| --- | --- | --- | --- | --- | --- |
| B01 — Documentation Foundation | COMPLETE | 2026-09-04 | 2026-09-04 | Manifest row count == eligible file count (78); every actionable row has a batch | Docs only. No `services/*` / `packages/*` source changed. |
| B02 — Foundation: CI/CD, Build Integrity, Security Baseline | COMPLETE | 2026-09-04 | 2026-09-04 | `check-types` 0; `build` 0; service tests 16/5/4 pass; `lint` 0 with 166 warnings (↓ from 174 baseline); `docker build -f Dockerfile.service --build-arg SERVICE_DIR=services/gateway .` exit 0, image runs to env-check | Infra + config only. No `services/*` / `packages/*` source moved. `apps/web` touched for the `sync-user` auth fix and a `middleware.ts` doc comment. |
| B03 — Shared Package Split | COMPLETE | 2026-09-04 | 2026-09-04 | `check-types` 0 (11/11); `build` 0 (12/12); `test` 0 (12/12, incl. new `@repo/contracts` suite); `lint` 0 (166 warnings, unchanged); `docker build --build-arg SERVICE_DIR=services/user` exit 0 | No `services/**` runtime behaviour changed. `@repo/shared` is now a shim; 4 duplicated helpers consolidated into `@repo/contracts` and adopted by `auth`, `user`, `chat`, `resources`. |
| B04 — Seed Extraction | COMPLETE | 2026-09-04 | 2026-09-04 | `check-types` 12/12; `build` 13/13; `lint` 166 (unchanged); `test` 13/13; live-verified against both an unreachable DB (guard) and a disposable local Postgres (fallback removal) with zero risk to real data | Seed subsystem fully extracted to `packages/seed`. `groupData` fallback in `services/user` removed per explicit user decision. |
| B05 — identity Service | COMPLETE | 2026-09-05 | 2026-09-05 | `check-types` 12/12; `build` 13/13; `test` 13/13 (incl. new 42-path `routeRules.test.ts`); `lint` 0 errors, 166 warnings (unchanged); live-verified against a disposable Postgres instance (register-user, get-user-by-id, get-all-groups routed correctly; cross-service 404 checks confirmed no duplication) | `services/auth` renamed to `services/identity`; profile endpoints moved from `services/user`; gateway routing extracted to `routeRules.ts`; `AUTH_SERVICE_URL`/`PORT` fully renamed to `IDENTITY_SERVICE_URL`/`PORT` repo-wide per explicit user decision. |
| B06 — core Scaffold + community Module | COMPLETE | 2026-09-05 | 2026-09-05 | `check-types` 13/13; `build` 14/14; `test` 14/14; `lint` 0 errors, 166 warnings (unchanged); `docker build --build-arg SERVICE_DIR=services/core` exit 0, image boots; live-verified against a disposable Postgres instance (community routes reach core, learning/dashboard routes still reach user, cross-service 404 checks confirm no duplication, `assertSelf`'s 403 path verified directly) | `services/core` created with its `community` module (16 functions moved from `services/user`, plus a new `assertSelf` guard consolidating the repeated self-check). `services/user` is **not** deleted — `architecture-plan.md`'s B06 "Definition of Done" said it would be, but the actual code shows learning-reads and dashboard-aggregation are separate domains explicitly scoped to B07/B08; the batch's own conditional instruction ("delete when empty") already anticipated this. Also fixed a B05-leftover dead `validateObjectStorageEnv()` call in `services/user/src/index.ts`. |
| B07 — core/learning Module (fold in resources) | COMPLETE | 2026-09-05 | 2026-09-05 | `check-types` 12/12; `build` 13/13; `test` 13/13; `lint` 0 errors, 166 warnings (unchanged); `docker build --build-arg SERVICE_DIR=services/core` exit 0, image boots; live-verified against a disposable Postgres instance (resource create+list round-trips through core, events/projects reach core, dashboard still reaches user, cross-service 404 checks in both directions confirm no duplication) | `services/resources` deleted, folded into `services/core/src/modules/learning/resources/`; learning reads (`getLearningEvents`/`getLearningProjects`/`getLearningProjectById`) moved from `services/user` into a new `core/modules/learning`; new `reads.ts` extracts study-room/topic queries out of `getDashboardHome` as standalone helpers, not yet wired in (B08's job). `ServiceName` and `servicePorts` both lost their `resources` member. |
| B08 — core/feed + core/dashboard Modules | COMPLETE | 2026-09-05 | 2026-09-05 | `check-types` 11/11; `build` 12/12; `test` 12/12; `lint` 0 errors, 166 warnings (unchanged); dashboard response verified byte-for-byte identical old vs. new against the same seeded data; latency unregressed (~0.010s → ~0.009s, in-process calls throughout); live-verified against a disposable Postgres instance (community/learning/resources/dashboard all reach `core` through the real gateway) | `getDashboardHome` (the last function in `services/user`) moved into `services/core/src/modules/dashboard`, composing new `community`/`learning`/`feed` read helpers instead of querying tables directly. `services/user` deleted. New `core/modules/feed` (read-only for now — no write endpoint for `Post`/`Comment`/`Like` exists anywhere yet). `community.controller.ts` now exports its card-mapping helpers so dashboard can import them instead of re-duplicating a 4th copy. |
| B09 — messaging + media Boundary Cleanup | COMPLETE | 2026-09-05 | 2026-09-05 | `check-types` 11/11; `build` 12/12; `test` 12/12; `lint` 0 errors, 166 warnings (back at the pre-B09 baseline); `grep -r "x-internal-token" apps/web` returns nothing; live-verified against a disposable Postgres instance in 3 stages (messaging alone: call-token, prepare-direct-call-conversation's callerId-spoof check, call-participants' unauthorized-extra-user check, and validate-direct-conversation's asymmetric-following check all behave identically to pre-move; gateway→messaging proxy confirmed via the renamed "messaging" upstream; media→messaging with fake AWS credentials confirmed the upload-scope check gates the upload, not anything downstream, with zero risk of a real S3 write) | Three commits, one per part. **Part 1:** `services/chat` renamed to `services/messaging`, restructured into `modules/{messages,calls,realtime}`; `CHAT_SERVICE_PORT`/`URL` renamed to `MESSAGING_SERVICE_PORT`/`URL` repo-wide; `ServiceName`/`servicePorts`/gateway `Upstream` drop `"chat"`. **Part 2:** `apps/web/actions/stream.actions.ts` deleted — the largest gateway-bypass violation in the repo (forged `x-internal-token` from `GATEWAY_SHARED_TOKEN`, held `STREAM_SECRET_KEY`). Token minting (`createCallToken`) and participant provisioning (`createCallParticipants`) move to `messaging/modules/calls`, byte-compatible with the old `generateUserToken()` call; `apps/web` calls them through the gateway like every other request (`apps/web/lib/chat/callApi.ts`), letting the gateway's existing session-cookie decode supply `x-user-id` instead of a server action resolving its own session. `apps/web` loses `@stream-io/node-sdk` entirely. **Part 3:** `services/media` loses `@repo/database`; `getChatUploadScope` becomes one call to messaging's new `POST /api/chat/authorize-upload-scope` (the one permitted media→messaging call per `api-and-dataflow-plan.md`), reusing the `GATEWAY_SHARED_TOKEN` media already holds rather than introducing a new secret. **Found and fixed a real bug** while live-testing part 3: both `media.controller.ts` and messaging's `calls.controller.ts` read `process.env.X` as module-level constants in files imported before their `index.ts`'s own `dotenv.config()` call runs, so the constant silently captured `undefined` on cold start in local dev while a per-request read of the same var (e.g. `internalTokenGuard`) worked fine — moved both to lazy reads inside the function body. Also: (accidental, disclosed to and acknowledged by the user) an early manual smoke-test curl hit the real Supabase `DATABASE_URL` before disposable-Postgres infrastructure was set up for this batch, creating or idempotently reaching one `Conversation` row between seeded dev users 1 and 2 — inert (no messages), left in place rather than risking a destructive delete; every subsequent live check in this batch used a disposable local Postgres instead. |
| B10 — Gateway Modularization + Final Reconciliation | COMPLETE | 2026-09-05 | 2026-09-05 | `check-types` 10/10; `build` 11/11; `test` 11/11 (gateway's own suite: 48/48, incl. 2 new route-manifest tests); `lint` 11/11 (0 errors, same 3 pre-existing warnings from part 1 — identity's 2 + apps/web's pre-existing 166, unrelated); `prisma validate` clean; live-verified against a controlled fake upstream (not a real service): 504 timeout, exactly 2 attempts per idempotent GET, circuit opens on the 5th consecutive failure and short-circuits with zero further network calls after that, and a normal request still proxies cleanly on a fresh circuit; `docker build` + boot for `services/messaging` confirmed the `@repo/shared` shim removal resolves cleanly (Turbo correctly narrows the build to only `@repo/contracts` + `@repo/service-kit`, no `@repo/storage`, which messaging doesn't need) | Five commits. **Part 1:** real `eslint` wired into all 6 services via a new `packages/eslint-config/service.js` profile (base config + Node globals) — closes issue #12. **Part 2:** `packages/shared` deleted; all 28 remaining `@repo/shared` import sites (across every service plus `packages/seed`) repointed to the specific package (`@repo/contracts`/`@repo/service-kit`/`@repo/storage`) they actually needed, finishing SP-011/SP-015's B10 half. **Part 3:** `services/notifications`'s inline `/send` handler extracted to a controller, matching every other service's convention — closes the structural-parity half of issue #38. **Part 4 (highest risk):** `services/gateway/src/index.ts` (394 lines of bootstrap + CORS + rate limiting + auth + reverse-proxy all in one file) split into a thin bootstrap plus `routes/route-manifest.ts` (renamed from B05's `routeRules.ts`, extended with per-rule `timeoutMs`) and `middleware/{requestId,rateLimiter,auth,proxy}.ts`; `proxy.ts` adds the resilience layer the CLI instructions called for and that never existed before this batch — per-route timeout, retry for idempotent methods only (never on an actual HTTP response), and a per-upstream circuit breaker (matching `api-and-dataflow-plan.md`'s Resilience Requirements table). **Docs commit:** `SCHEMA_OWNERSHIP.md` fully rewritten to a systematic one-row-per-model table (fixed a real gap — `Conversation` had never been listed), matching `/// owner: <module>` doc comments added to all 18 models in `schema.prisma`; `refactor-manifest.md` reconciled to its own Definition of Done — **0 `PENDING` rows remain**, every one of 118 rows is `DONE` or `KEEP` (`SP-063`'s "B10 review" turned out to already be answered by the locked design decisions in `service-decomposition-plan.md`, so it resolved to `KEEP` rather than needing a fresh decision). The response-envelope standardization fork the plan flagged for B10 was explicitly deferred, per direct user instruction — it's not in B10's actual Definition of Done, just listed as optional, and standardizing every service's response shape to `{ ok, data, error }` is a breaking change for every `apps/web` call site that deserves its own batch. Also swept a stale ASCII directory tree in `LOCALHOST_3000_REQUEST_WORKFLOW.md` that still showed the long-deleted `auth`/`user`/`chat` service layout. |
| B11 — Redis Foundation (P2) | COMPLETE | 2026-09-05 | 2026-09-05 | `check-types` 11/11; `build` 12/12; `test` 12/12 (`@repo/cache`: 10/10 new tests across 2 files); `lint` 12/12 (0 errors, same 2 pre-existing identity warnings); live-verified against 2 real messaging replicas + 2 real gateway replicas, each pair sharing one real local Redis (docker-compose, fully disposable — no shared/production infra touched): presence converges across replicas on both connect and disconnect, the rate limit is enforced on the combined request count rather than per-replica, and both the presence store and the rate limiter correctly degrade (empty reads / fail-open, respectively) against a genuinely unreachable Redis instead of crashing or hanging | Three commits. **Part 1:** new `packages/cache` — a lazily-initialized Redis client (same lazy-env-read pattern B10 established), a presence store porting `online-users.ts`'s Map-based API 1:1 in shape but async and Redis-backed (with a `yome:presence:socket:<socketId>` reverse index not in the plan's key table, needed for O(1) "which user owns this socket" lookups once presence is shared state), and a sliding-window rate limiter as a single atomic Lua script. `REDIS_URL` added to `turbo.json`/`.env(.example)`. **Part 2:** `services/messaging`'s `modules/realtime/online-users.ts` deleted; `handlers.ts` and `messages.controller.ts` now call `@repo/cache` directly (every presence call is now async); added a 20s heartbeat per connected socket refreshing the presence TTL; wired `@socket.io/redis-adapter` so `io.to(socketId).emit(...)` crosses replicas. **Part 3:** `services/gateway`'s in-process rate-limit `Map` replaced with `@repo/cache`'s sliding-window limiter. Trigger T-01 and T-02 both marked resolved above. |
| B12 — Cache-Aside Read Paths (P2) | COMPLETE | 2026-09-05 | 2026-09-05 | `check-types` 11/11; `build` 12/12; `test` 12/12 (`@repo/cache`: 22/22 across 4 files, incl. 6 new `cacheAside` tests); `lint` 12/12 (0 errors); live-verified against a disposable local Postgres + Redis: two users in different save/join states hit the same cached list and each correctly saw their own `isSaved`/`isHelpful`/`isJoined` (proven by an identical underlying payload — same `createdAt` — across both requests, i.e. one shared cache entry, not two independent computations); confirmed each key's TTL directly in Redis. **p95 measured before (forced cache miss) vs after (cache hit), 20 requests each, against the disposable Postgres:** resource list 11.2ms → 6.1ms; group discover 16.1ms → 5.0ms; dashboard 11.5ms → 1.9ms. These are absolute numbers against a trivial local DB with near-zero network latency — the relative win in production (networked Supabase, more rows) should be larger, not smaller, since DB round-trip time is what the cache is removing | New `packages/cache/src/cacheAside.ts` (generic get-or-compute-and-set, TTL only — event invalidation is B15) wired into `core`'s three hottest reads named in the batch's scope: `dashboard.controller.ts` (whole response cached per `userId`, safe since the payload is already one viewer's data), `community.controller.ts`'s `discoverGroups` (only the shared group list cached — `viewerId` never in the key or payload; the already-separate `joinedGroupIds` query stays uncached and is merged into `isJoined` fresh every request), `resources.controller.ts`'s `getResources` (same shape — the cached query drops its viewer-scoped `saves`/`helpfulVotes` includes; a small separate query resolves the viewer's `isSaved`/`isHelpful` after the cache read). This is exactly the bug `api-and-dataflow-plan.md` names for this batch: "`mapGroupCard` and `mapResource` currently mix shared and per-viewer fields in the same object... a live bug risk in B12" — solved by never letting a per-viewer flag enter the cached value in the first place. **Found and fixed a real bug during live verification**: `resources.controller.ts`'s `ResourceRecord` typed `createdAt`/`updatedAt` as `Date`, but a cache hit returns them as ISO strings after the JSON round trip through Redis, so `mapResource`'s `.toISOString()` call threw on every cache hit (silently never caught by unit tests, since those don't exercise the cache) — fixed by widening the type to `Date \| string` and switching to `new Date(x).toISOString()`, which accepts either. Also closed a B11 gap found while registering this batch's own env var: `presence.ts`'s `PRESENCE_TTL_SECONDS` was a hardcoded constant despite `REDIS_PRESENCE_TTL_SECONDS` being named in `data-architecture-plan.md`'s env-var table as required "in the same batch that introduces them" — made lazy and wired to the env var. `REDIS_PRESENCE_TTL_SECONDS` and `CACHE_TTL_DASHBOARD_SECONDS` registered in `turbo.json`, `.env.example`, and `README.md`; group-discover and resource-list use a fixed 300s TTL per the plan's key table, not a new env var (only dashboard's TTL is in the plan's env-var table). |
| B13 — Event Backbone (P3) | COMPLETE | 2026-09-06 | 2026-09-06 | `check-types` 12/12; `test` 13/13 (`@repo/events`: 15/15 new tests across 3 files; `@repo/contracts`: +2 events tests; `@services/messaging`: 16/16, incl. 3 `conversations.test.ts` assertions updated for the new `{ conversation, created }` return shape); `build` 13/13; `lint` 13/13 (0 errors, same 2 pre-existing identity warnings). Live-verified end to end against a disposable local Postgres (not the shared/real DB) and the local Redis, calling `packages/events` directly so every stage could be inspected: (1) rollback proof — a domain write that throws inside `withOutbox` leaves neither the domain row nor an outbox row behind; (2) a successful write produces exactly the right unpublished outbox row; (3) `relayOnce()` publishes it to the correct stream and marks it published in the same transaction; (4) a real `consumeOnce()` reads it, runs the handler, acknowledges it, `XPENDING` is empty afterward, and publish-to-consume latency measured at **28ms** (budget: p99 < 1s); (5) the idempotency key is set after processing; (6) multi-replica safety — 20 rows raced by 5 concurrent `relayOnce()` calls were published exactly once each (one replica's transaction won the whole batch via `FOR UPDATE SKIP LOCKED`, the other 4 saw nothing left to claim), stream grew by exactly 20 entries. Also smoke-tested through a real HTTP call to `identity`'s `register-user` endpoint (not just direct package calls), confirming the actual service wiring produces the right outbox row in Postgres | Five commits. **Part 1 (foundation):** `OutboxEvent` model + migration in `packages/database`; `packages/contracts/src/events.ts` — the `DomainEvent<TPayload>` envelope and a zod payload schema for all 23 catalogued events across identity/community/learning/feed/messaging/media (schemas defined for the full catalogue even though not every event has a writer — see below); new `packages/events` with `withOutbox` (the single sanctioned way to write a domain change and its outbox row in one transaction — "use a single withOutbox helper so this cannot be bypassed"), `relay.ts` (the poller — `SELECT ... FOR UPDATE SKIP LOCKED` + `XADD` + mark-published, all in one transaction so multi-replica relays never double-publish; a 10-attempt cap on a poison row), `idempotency.ts` (`markConsumedIfNew`, the mandatory `SET NX` check), and `consumer.ts` (a generic `XREADGROUP` consume loop) — the last two shipped unused in this batch, since B13's own scope is "publish... to Redis Streams," not "consume": ready for B14 to wire `notifications` to them. **Part 2:** `withOutbox` wired into every real write path with a catalogued event in identity (`registerUser`/`upsertOAuthUser` -> `identity.user.registered`, `updateUser` -> `identity.user.profile_updated` with a real before/after diff — publishes nothing when nothing changed, `changePassword` -> `identity.user.password_changed`), community (`createGroup` -> `community.group.created` + `community.group.member_joined` together, `joinUnjoinedGroups`/`joinGroupById` -> `community.group.member_joined`, `followUnfollowedUser` -> `community.connection.followed`), and learning (`createResource` -> `learning.resource.created`; `saveResource`/`deleteResourceSave`/`markResourceHelpful` -> `.saved`/`.unsaved`/`.marked_helpful`, each publishing nothing when the write was a no-op). **Part 3:** messaging wired the same way — `getOrCreateDirectConversation` now returns `{ conversation, created }` so every one of its 3 call sites can decide whether to publish `messaging.conversation.created`; `createDirectMessage` (shared by `addMessage`/`addMediaMessage`) publishes conversation-created (conditional) + message-sent together; group-chat branches -> `messaging.message.sent`; `getMessages`'s bulk read-marking -> one `messaging.message.read` per message; `prepareDirectCallConversation` -> conversation-created (conditional). **Part 4:** the relay started in-process inside `services/core`'s bootstrap (event-architecture-plan.md's own guidance for local/early development), with graceful shutdown on `SIGTERM`/`SIGINT`. **Docs commit:** manifest and this log updated. **Not wired anywhere — no write endpoint exists for these in the app today, documented rather than silently skipped, matching the precedent already established for `Post`/`Comment`/`Like` in earlier batches**: community's `invitation_created`/`announcement_posted`/`event.scheduled`/`connection.unfollowed` (no unfollow endpoint exists at all), learning's `studyroom.started`/`studyroom.participant_joined` (no `StudyRoom` writer exists anywhere), all three of feed's events (`Post`/`Comment`/`Like` remain read-only), and media's `asset.uploaded` (media holds no database access since B09 and was never in B13's scope — its "domain write" is an S3 PUT, not a Postgres transaction, so the outbox pattern doesn't apply to it without a different mechanism entirely). |
| B14 — Notifications as First Consumer (P3) | COMPLETE | 2026-09-06 | 2026-09-06 | `check-types` 12/12; `test` 13/13 (`@repo/events`: 19/19, +5 consumer-runtime tests; `@services/notifications`: 11/11 new across 2 files — 8 derivation + 3 persist/idempotency; every other suite unchanged); `build` 13/13; `lint` 13/13 (0 errors — `apps/web` warnings **166 → 131**, the old static `notifications.tsx` mock's ~35 unused imports gone; same 2 pre-existing `identity` warnings). Live-verified end to end against a disposable local Postgres (port 5433, never the real DB) + the local Redis, driving the real `services/notifications` build: (1) `handleEvent` on a `messaging.message.sent` to an offline user creates exactly one `Notification`, renders the sender's display name, and syncs `User.notificationCount` 3 → 1; an exact replay creates no second row; (2) an *online* recipient (presence set in Redis) gets nothing; (3) full stream round-trip — `startNotificationConsumer()` + `XADD` a `community.connection.followed` envelope → notification row in ~13 ms, `yome:consumed:notifications:<id>` set, `XPENDING` empty; re-publishing the same envelope id creates no duplicate; (4) crash recovery — an entry read by a dead consumer and never acked is picked up by `reclaimStale` (`XAUTOCLAIM`), processed, and `XPENDING` drains to empty; (5) the HTTP surface through the running service — `GET /api/notifications` (+ `?unread`/`?limit`), `POST /:id/read` (200 + fresh `unreadCount`, 404 on a valid-but-unknown uuid, 400 on a malformed one), `POST /read-all`, 401 without `x-user-id`, and `POST /send` still 202; after `read-all`, DB unread count and `User.notificationCount` both 0 | Store decision (trigger T-07): **Postgres `Notification` table with a `jsonb` payload column, not MongoDB.** P3's whole premise is "still one database"; T-07 itself calls `jsonb` "acceptable" and says to decide on whether delivery-state queries need joins — B14's do (the `User.notificationCount` sync is a same-transaction join, trivial in Postgres, a cross-store write in Mongo), and the repo has no deploy pipeline to run a second datastore. Mongo stays the documented option for when a real volume/TTL/retention trigger fires. **Changes:** `Notification` model + `20260906120000_add_notification` migration (`@@unique([eventId, userId])` as the replay backstop on top of the Redis idempotency key); `@repo/events`' consumer runtime grown from B13's single-stream `consumeOnce` to a real runtime — array-of-streams `consumeOnce` (one `XREADGROUP` over all five `yome:events:*`), `reclaimStale` (`XAUTOCLAIM` recovery, rule 4), `startConsumer` (ensure-groups → reclaim+consume loop with a `ready` promise and an idle delay that doubles as the event-loop yield); new `services/notifications/src/consumer/{index,derive}.ts` (event → `NotificationSpec` mapping, payloads validated against `@repo/contracts` zod schemas, skip-not-throw on failure) + `store/notificationStore.ts` (persist with per-`(eventId,userId)` dedupe, list with cursor pagination, mark-read / mark-all-read, `syncUnreadCount` in every mutating transaction) + `notifications.validation.ts`; `index.ts` starts the consumer in-process with graceful shutdown (mirror of `core`'s relay); `apps/web` gains `lib/notifications/notificationsApi.ts` and a real `notifications.tsx`. **Notifications emitted for:** `identity.user.registered`/`.password_changed`, `community.group.member_joined` (the joiner), `community.connection.followed` (the followee), `learning.resource.saved`/`.marked_helpful` (the author, not on a self-action), `messaging.message.sent` (a direct recipient, offline only); `messaging.message.read` clears the matching pending notification. **Deliberately not emitted** (the plan's B14 risk note wants per-user rate-limiting + aggregation windows first): any fan-out needing a membership query — group-admin notifications, group-message recipients, `learning.resource.created` to group members. Delivery channels beyond in-app (email/push) are the plan's open questions #3/#4, not B14. |
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
| T-01 Redis presence / socket fan-out | ≥ 2 `messaging` replicas | n/a — in-process `Map` makes ≥2 replicas incorrect at any count | 2026-09-04 | **FIRED, RESOLVED in B11** — presence moved to `@repo/cache` (Redis), `@socket.io/redis-adapter` wired in. Live-verified against 2 real replicas sharing one Redis: presence converges correctly on connect and disconnect from either replica |
| T-02 Redis rate limiting | ≥ 2 `gateway` replicas | n/a — same defect class | 2026-09-04 | **FIRED, RESOLVED in B11** — gateway's rate limiter moved to `@repo/cache`'s Redis sliding-window script. Live-verified against 2 real replicas sharing one Redis: the combined request count across both replicas hits the configured limit, not each replica's own count |
| T-03 Dashboard read model | p95 > 300 ms, or > 50 req/s | _not measured_ | | not fired |
| T-04 Search index | > 50k `Resource` rows, or search p95 > 200 ms | _not measured_ | | not fired |
| T-05 Messaging own database | > 50M `Messages` rows, or > 500 writes/s | _not measured_ | | not fired |
| T-06 Messaging document/wide-column store | > 5k writes/s, or > 1 TB retention | _not measured_ | | not fired |
| T-07 Notifications store | notifications become a real feature | fired (B14 made `notifications` a real event consumer) | 2026-09-06 | **FIRED, RESOLVED in B14 — Postgres, not MongoDB.** Chose a `Notification` table with a `jsonb` payload column: keeps P3 on one store, the `User.notificationCount` sync stays an in-transaction join, and there is no deploy pipeline to run a second datastore. MongoDB remains the documented target if a later volume/TTL/retention trigger fires |

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

## B08 Execution

- Rollback target: parent commit `274d214`.
- Manifest IDs done: `SP-110`–`SP-114` (new dashboard + feed modules). `SP-073`, `SP-074`,
  `SP-075`, `SP-076`, `SP-077`, `SP-078` all `DONE` — `services/user`'s multi-batch split
  (B05–B08) is finally complete and the service is deleted.

### Composing modules instead of querying tables directly

The batch's own instruction was explicit and non-negotiable: *"The dashboard must compose the
community, learning, and feed module surfaces instead of querying their tables directly."*
Before this batch, `getDashboardHome` ran 7 parallel queries — `User` (×2, profile +
suggested-people), `Post` (feed), `StudyRoom`, `GroupEvent`, `Topic`, and `Group` — all inline
`prisma.*` calls in a file that, as of B07, was about to be deleted. Since `learning`'s
`reads.ts` already existed from B07 (`getLiveStudyRooms`/`getTrendingTopics`, built exactly
for this moment but not yet called by anything), this batch's job was to build the
community-side and feed-side equivalents and wire all three into the dashboard, now that it
finally lives in the same process as the modules it reads from:

- `community/reads.ts` (new): `getSidebarGroups(slugs, take)` — returns raw sorted `Group`
  rows, not fully-mapped cards, because turning them into cards needs the caller's
  `loggedInUserId` as `mapGroupCard`'s viewer-context argument, plus a dashboard-only
  `physics-club` symbol swap — neither belongs in a general community read helper, so both
  stay in `dashboard.controller.ts`. `getUpcomingEvents(titles, take)` — by contrast, needs no
  per-caller context, so it returns fully-mapped event cards directly, matching `learning`'s
  pattern.
- `feed/reads.ts` (new): `getRecentPosts(take)` — fully self-contained, same reasoning as
  `getUpcomingEvents`.
- `dashboard.controller.ts` (new): composes all four (`getSidebarGroups`/`getUpcomingEvents`,
  `getLiveStudyRooms`/`getTrendingTopics`, `getRecentPosts`) via `Promise.all`, in the exact
  same parallel shape the original inline version used. Still queries `User` directly for the
  two profile-adjacent reads — `User` belongs to `identity`, a separate deployable service
  dashboard has no in-process access to, so this is the one place a direct query remains, and
  it's why the batch's own instruction named exactly three modules (not four) to compose.

### Resolving the community-vs-dashboard duplication B06/B07 left behind on purpose

B06's and B07's migration-log entries both said some version of "this duplication resolves
once B08 moves dashboard into core too" — referring to `getUserName`/`getInitials`/
`mapUserCard`/`mapGroupCard`, each defined privately in both `community.controller.ts` and
`services/user/src/controllers/user.controller.ts` because dashboard couldn't import across a
service boundary. Now it can: `community.controller.ts`'s four functions (plus its
`GroupCardRecord`/`UserCardRecord` types) gained `export`, and `dashboard.controller.ts`
imports them directly instead of carrying a fourth copy. `learning.controller.ts` and
`learning/reads.ts`'s own private copies (from B07) were **not** touched — retroactively
refactoring already-shipped B07 code to also import from `community` is a separate cleanup,
not something this batch's scope ("feed + dashboard modules") entailed, so it was left alone
rather than scope-crept into.

### `feed` module: read-only, by necessity not by half-measure

The batch's other requirement — "give `Post`/`Comment`/`Like` an owner" — raised an obvious
question: owner of what, if nothing writes them? A repo-wide grep (`prisma\.post\.\|prisma\.comment\.\|prisma\.like\.`)
across `services/`, `packages/`, and `apps/web` before writing anything found exactly two
existing call sites, both reads (`learning.controller.ts`'s `getLearningProjects`/
`getLearningProjectById`, and the dashboard's own `feedPosts` query) plus the dev-only seed/
reset handlers in `@repo/seed` (the same seeding carve-out already established for `Group`/
`Resource`). No create-post, create-comment, or like endpoint exists anywhere in this app yet.
So `feed`'s module for this batch is exactly one file, `reads.ts`, exporting the one read
`getDashboardHome` needs — not a half-built write API invented to look complete. `feed` is
now the designated, documented place a future compose-a-post feature would add its
controller/routes/validation; `SCHEMA_OWNERSHIP.md` records this explicitly so nobody adds a
`prisma.post.create` call to some other module later without checking here first.

### Changes made

| Area | Change |
| --- | --- |
| New `services/core/src/modules/dashboard/` | `dashboard.controller.ts`: `getDashboardHome` moved from `services/user/src/controllers/user.controller.ts`, rewritten to compose (see above); `mapDashboardSidebarGroup`/`mapDashboardSuggestedPerson` (the two dashboard-only personalization wrappers) stay local, now wrapping the *imported* `mapGroupCard`/`mapUserCard`. `dashboard.routes.ts`/`dashboard.validation.ts`: the one remaining route (`/dashboard/:loggedInUserId`) and schema (`dashboardParamsSchema`), moved verbatim. |
| New `services/core/src/modules/community/reads.ts` | `getSidebarGroups`/`getUpcomingEvents` — see "Composing modules" above. |
| New `services/core/src/modules/feed/` | `reads.ts`: `getRecentPosts`, combining the same `prisma.post.findMany` + `mapDashboardPost` mapping `getDashboardHome` ran inline, as one importable async call — first and only file in the new module. |
| `community.controller.ts` exports | `getUserName`, `getInitials`, `mapUserCard`, `mapGroupCard`, `GroupCardRecord`, `UserCardRecord` all gained `export` (were private module-local helpers). No behavior change — a visibility change only, confirmed by the byte-for-byte response diff below. |
| `services/user` deleted | `package.json`, `tsconfig.json`, `src/index.ts`, `src/controllers/user.controller.ts`, `src/routes/user.routes.ts`, `src/routes/user.validation.ts` — all removed. `services/core/src/index.ts` now mounts `dashboardRoutes` at `/api/user` alongside `communityRoutes`/`learningRoutes`. |
| `packages/contracts/src/service.ts` | `"user"` removed from `ServiceName` (dead — `services/user` no longer exists). Also removed `"auth"`, dead since the B05 rename to `identity` but never cleaned up in that batch — caught here since the file was already open for the `"user"` removal, not left for a future audit. Confirmed via grep neither literal value is referenced anywhere as a `ServiceName`. |
| `packages/service-kit/src/config/env.ts` | `servicePorts.user` getter removed (dead, confirmed via grep no remaining callers). |
| `services/gateway` | `routeRules.ts`: `"user"` removed from `Upstream` — the one specific rule that still routed `/api/user/dashboard` to `user` is gone; the general `/api/user` catch-all (already pointing at `core` since B06) now covers every `/api/user` path with no exceptions. `index.ts`: `serviceBaseUrls` lost its `user` entry. `routeRules.test.ts`: folded the now-nonexistent "dashboard resolves to user" test into the "everything resolves to core" test; retitled the profile-paths test ("not user" → "not core"). |
| Env var / CI / deploy | `turbo.json`: `USER_SERVICE_PORT`/`USER_SERVICE_URL` removed from `globalEnv`. `.env.example` and the local `.env`: same two lines removed from each. `.github/workflows/ci.yml` / `deploy-services.yml`: `@services/user` entry removed from both matrices. Root `package.json`: `dev:services` and `check-types:all` both lost their `user` clause. `tests/contracts.smoke.mjs`: `user` health-check entry removed (the `core` entry, added in the B07 audit, already covers the domains `user` used to own). |
| `packages/database/SCHEMA_OWNERSHIP.md` | `Post, Comment, Like` row moved from "Feed (planned, B08)" to `Core (feed module)`, still read-only, with an explicit note that no write endpoint exists yet. New "Core service, feed module" and "Core service, dashboard module" boundary bullets; the dashboard bullet documents that it composes the other three modules' reads and is the reason this file's `services/user`-still-exists caveats are now gone. |

### Validation

| Command | Exit | Result |
| --- | --- | --- |
| `bun run --cwd services/core check-types` | 0 (after 2 fixes) | Two `implicitly has an 'any' type` errors on `sidebarGroups.map((group) => ...)` callbacks — `Promise.all`'s tuple destructuring doesn't propagate `GroupCardRecord[]`'s element type through automatically. Fixed by annotating the callback parameter explicitly (`(group: GroupCardRecord) => ...`), matching how the pre-B08 code already typed the same two call sites. |
| `bun install` | 0 | Drops `@services/user` from `bun.lock`. |
| `bun run build` | 0 | 12/12 tasks (was 13; `-1` for the deleted `@services/user` package). |
| `bun run check-types` | 0 | 11/11 tasks (was 12; same `-1` reason). |
| `bun run check-types:all` | 0 | All 10 sequential steps pass (was 11; `user` clause removed). |
| `bun run test` | 0 | 12/12 tasks, 0 failures. |
| `bun run lint` | 0 | 166 warnings, 0 errors — unchanged (all pre-existing `apps/web`). |
| `bunx tsc --noEmit` / test suite (`apps/web`) | 0 / 12 pass | Unaffected — no `apps/web` source touched this batch. |

### Response-shape and latency measurement (explicitly required by the batch)

Used `git worktree add /tmp/yome-pre-b08 274d214` to check out the parent commit (the last
commit before this batch) into a second working directory alongside the current one, so both
the old (`services/user`, monolithic inline queries) and new (`services/core`, composed
module calls) code could run against the exact same seeded data — a fair before/after
comparison rather than two runs against different fixtures.

1. Started a disposable `postgres:16-alpine` (port `5436`), migrated the schema.
2. Booted the **old** code (`identity` + `user` + `core` + `gateway`, from the worktree) and
   seeded it: registered one real user, then ran all 4 dev-seed handlers (users, groups,
   resources, dashboard demo data) so the dashboard's every widget had real rows to return,
   not empty arrays.
3. Measured `GET /api/user/dashboard/1` 5 times: first request `0.088s` (connection/module
   warm-up), next 4 averaging `~0.011s`. Saved the full JSON response.
4. Stopped the old services; **did not touch the database** — same rows, now queried by the
   new code.
5. Booted the **new** code (`identity` + `core` + `gateway`, current working tree — no
   `services/user` to start) against the same database, same port-remapping pattern.
6. Measured the same endpoint 15 times total: first request `0.414s` (worse warm-up, since
   the new code touches 3 more files than the old monolith on first import), then 14 more
   averaging `~0.009s`.
7. **`diff` on both saved JSON responses, pretty-printed: zero lines differ.** Every field —
   profile, feed posts, live study rooms, upcoming sessions, suggested people, trending
   topics, sidebar groups, down to emoji in post bodies and the exact `physics-club` symbol
   override — is byte-for-byte identical between old and new.
8. Live-verified the routing split beyond just the dashboard: `GET /api/user/groups/discover`
   (community), `GET /api/user/events` (learning), `GET /api/resources` (resources), and
   `GET /api/user/dashboard/1` all returned real content through the new gateway, confirming
   `core` — not a 404 or a stale route — actually served each one. Gateway `/health` no longer
   lists a `user` key.
9. Torn down: killed old and new service processes, `git worktree remove /tmp/yome-pre-b08
   --force`, removed the disposable Postgres container. The real `.env` and database were
   never touched at any point.

**Result: no latency regression (both ~0.01s warm, well within noise of each other) and zero
shape regression (byte-for-byte identical JSON).** The batch's stated risk — "the dashboard
query is a single large Prisma join today; splitting it into module calls must not regress
latency or shape" — did not materialize, which makes sense in hindsight: every module call is
still an in-process async function invocation within the same Node process and the same
`Promise.all`, not a network hop, so there was no mechanism by which splitting the code could
have added latency. Measuring rather than assuming was still the right call, per the batch's
own instruction — the assumption could have been wrong (e.g. if a module boundary had
introduced N+1 queries), and this proves it didn't.

Definition of Done for B08, fully met: no direct `prisma.post.*` write exists anywhere outside
`feed` (trivially true — no writes exist anywhere in the app yet, and `feed` is now documented
as where the first one belongs); dashboard composes `community`/`learning`/`feed` module
reads instead of querying their tables directly, proven both by the code (imports, not
`prisma.*` calls, for every table `dashboard.controller.ts` doesn't itself own) and by the
identical live output. `services/user` is deleted — the multi-batch split that started in B05
(profile → identity) and continued through B06 (community → core) and B07 (learning →
core) is complete.

## B07 Execution

- Rollback target: parent commit `5f83a2e`.
- Manifest IDs done: `SP-066`–`SP-072` (folded-in `resources`), `SP-106`–`SP-109` (new
  learning module + read helpers). Learning portions of `SP-074`, `SP-076`, `SP-077` done.

### The "study-room and topic reads" scope question, resolved before writing code

`architecture-plan.md`'s B07 "Expected refactors" line says: *"move study-room and topic reads
that live in `getDashboardHome` into learning read helpers."* Read literally, this modifies
`getDashboardHome` — but that function's manifest ownership (the dashboard portion of
`SP-074`) is explicitly scoped to B08, not B07, in the same document's own "Manifest IDs" list
for this batch ("learning portions of the former `user.controller.ts`" — not dashboard
portions) and in B08's own section ("move `getDashboardHome` aggregation into
`services/core/src/modules/dashboard`"). `getDashboardHome` itself stays in `services/user`
until B08 per B06's already-established precedent (see B06's own plan-vs-reality section
above) — it can't import a function from `core` (a different deployable process), so
literally "moving" its inline queries into `core` would either strand dashboard's own read or
require a same-batch cross-service HTTP call neither this batch's scope nor its validation
criteria (which never mentions re-testing the dashboard page) call for.

**Resolution**: read "move ... into learning read helpers" as scoping the *ownership and
reusability* of the query logic, not requiring `getDashboardHome` itself to change in this
batch. Created `services/core/src/modules/learning/reads.ts` exporting `getLiveStudyRooms()`
and `getTrendingTopics()` — pure, testable functions combining the same Prisma queries and
`mapDashboardRoom`/`mapDashboardTopic` mapping `getDashboardHome` already ran inline into one
importable async call each. These are not called by anything yet; they
exist so B08, when it moves `getDashboardHome` into the same process as `learning`, can call
them locally instead of duplicating the query a third time. `getDashboardHome`'s own inline
`prisma.studyRoom.findMany`/`prisma.topic.findMany` calls are untouched — verified live (see
below) that dashboard still returns identical shapes. This is the same category of
plan-vs-manifest tension B06 resolved (a prose summary overstating what a single batch's
manifest-ID scope actually covers), resolved the same way: follow the manifest's own precise
scoping, and document the reasoning rather than silently picking one reading.

### Changes made

| Area | Change |
| --- | --- |
| `services/resources` → `services/core/src/modules/learning/resources/` | `git mv`'d as a unit: `resource.controller.ts` → `resources.controller.ts`, `resource.routes.ts` → `resources.routes.ts` (import paths repointed from `../controllers/resource.controller.js` to `./resources.controller.js`), `resource.validation.ts` → `resources.validation.ts`, `resource.validation.test.ts` → `resources.validation.test.ts` (import path repointed). `package.json`, `tsconfig.json`, and `src/index.ts` deleted outright — `core`'s existing manifest and tsconfig (from B06) already cover this module, and `core/src/index.ts` mounts `resourcesRoutes` at `/api/resources` directly. Old `services/resources/` directory removed after the moves. |
| `resources.validation.ts` cleanup | `resourceToneSchema` (a local `z.enum([...])` of the same 5 values as `@repo/contracts`'s `toneSchema`, just declared in a different order) deleted; the `tone` field now uses `@repo/contracts`'s `toneSchema` directly — fulfills a note `SP-083` left in B03 explicitly anticipating this adoption. The local `slugOrUuidSchema`, by contrast, was **not** merged with `@repo/contracts`'s version — its error message ("must be a resource id or slug") differs meaningfully from the generic one, so it stays a local duplicate per this refactor's established policy of only merging genuinely byte-identical schemas. |
| New `services/core/src/modules/learning/learning.controller.ts` | `getLearningEvents`, `getLearningProjects`, `getLearningProjectById` moved verbatim from `services/user/src/controllers/user.controller.ts`, along with `mapLearningEvent`/`mapLearningProject`/`ProjectPostRecord` (used only by these three) and duplicated copies of `getUserName`/`getInitials`/`formatDashboardEventMeta`/`DashboardEventRecord`/`DashboardPostRecord` (still needed by `getDashboardHome`, which stays behind — same duplication pattern B06 established for `mapUserCard`/`mapGroupCard`). |
| New `services/core/src/modules/learning/learning.validation.ts` / `learning.routes.ts` | `projectIdParamsSchema` and the 3 route registrations (`/events`, `/projects`, `/projects/:id`) moved verbatim from `services/user/src/routes/user.validation.ts` / `user.routes.ts`; mounted at `/api/user` within `core`, alongside `community.routes.ts` — external paths unchanged. |
| New `services/core/src/modules/learning/reads.ts` | See "scope question" above. `getLiveStudyRooms(take = 2)` and `getTrendingTopics(take = 4)`, each combining the Prisma query + response-shaping that `getDashboardHome` runs inline, as one importable async function. Not wired to any route or caller yet. |
| `services/user` cleanup | `user.controller.ts`: removed the 3 learning functions and their exclusive helpers/types (`mapLearningEvent`, `mapLearningProject`, `ProjectPostRecord`) — 160 lines removed (669 → 509). Kept everything `getDashboardHome` still uses, including its own copies of the now-also-duplicated-in-`learning` helpers. `user.routes.ts` / `user.validation.ts`: trimmed to the single remaining route (`/dashboard/:loggedInUserId`) and its one schema (`dashboardParamsSchema`); `@repo/contracts` import dropped (nothing left in this file needs `slugOrUuidSchema` once `projectIdParamsSchema` moved away with it). `package.json`: removed `@repo/contracts` as a now-unused direct dependency — caught immediately while trimming the validation file, not left for a later audit to find (the lesson from the B05 audit). |
| `packages/contracts/src/service.ts` | `"resources"` removed from the `ServiceName` union — fulfills this batch's own Definition of Done ("`ServiceName` no longer needs a `resources` member"). Confirmed via grep that no code anywhere still uses the literal `"resources"` `ServiceName` value. |
| `packages/service-kit/src/config/env.ts` | `servicePorts.resources` getter removed (dead — confirmed via grep no remaining callers before deleting). |
| `services/gateway` | `routeRules.ts`: `"resources"` removed from `Upstream`. The 2 B06-era `/api/user/events`/`/api/user/projects` → `user` rules removed entirely — now that both paths resolve to `core` (the same upstream as the general `/api/user` catch-all already introduced in B06), no specific rule is needed for them anymore; only `/api/user/dashboard` → `user` remains as the one exception. `/api/resources` → `core` (was `resources`). `index.ts`: `serviceBaseUrls` lost its `resources` entry. `routeRules.test.ts`: merged the old "3 remaining paths resolve to user" test down to just `dashboard`; folded `events`/`projects` into the "resolves to core" test; added a dedicated `/api/resources` → `core` assertion. |
| Env var / CI / deploy | `turbo.json`: `RESOURCES_SERVICE_PORT`/`RESOURCES_SERVICE_URL` removed from `globalEnv`. `.env.example`: same two lines removed. `.github/workflows/ci.yml` / `deploy-services.yml`: `@services/resources` entry removed from both matrices. Root `package.json`: `dev:services` and `check-types:all` both lost their `resources` clause. `tests/contracts.smoke.mjs`: `resources` health-check entry replaced with `core` — **also fixed a gap from B06**, which introduced `core` as a real service but never added it to this smoke test; caught while touching this file for the `resources` removal, not left for another audit. |
| `packages/database/SCHEMA_OWNERSHIP.md` | New `Resource, ResourceSave, ResourceHelpfulVote` row (didn't exist at all before this batch), owner `Core (learning module)`. `StudyRoom, StudyRoomParticipant, Topic` upgraded from "planned, B07" to "read-only, owned by learning" — `reads.ts` formalizes the read path, though nothing calls it yet. `Post, Comment, Like`'s note updated to name `core`'s learning module as a reader alongside `services/user`'s dashboard. New "Core service, learning module" boundary bullet; explicit note that `services/user` holds its own duplicate inline reads of these tables until B08. |

### Validation

| Command | Exit | Result |
| --- | --- | --- |
| `bun run --cwd services/resources test` (before the move) | 0 | 5 pass — confirmed the existing suite was green before touching anything. |
| `bun run --cwd services/core test` (after the move) | 0 | Same 5 tests, now running from `core`'s test script (`bun test ./src`, was an echo-stub before this batch — first real test `core` has). |
| `bun run --cwd services/core check-types` / `--cwd services/user check-types` | 0 | Both clean in isolation before the full-repo pass. |
| `bun install` | 0 | Drops `@services/resources` from `bun.lock`; confirms `@repo/contracts` no longer listed under `services/user`. |
| `bun run build` | 0 | 13/13 tasks (was 14 after B06; `-1` for the deleted `@services/resources` package, matching net service count unchanged — `core` absorbed it). |
| `bun run check-types` | 0 | 12/12 tasks (was 13; same `-1` reason). |
| `bun run check-types:all` | 0 | All 11 sequential steps pass (was 12; `resources` clause removed). |
| `bun run test` | 0 | 13/13 tasks, 0 failures. |
| `bun run lint` | 0 | 166 warnings, 0 errors — unchanged (all pre-existing `apps/web`). |
| `bunx tsc --noEmit` / test suite (`apps/web`) | 0 / 12 pass | Unaffected — no `apps/web` source touched this batch. |
| `docker build -f Dockerfile.service --build-arg SERVICE_DIR=services/core` | 0 | Image builds with the new learning/resources modules; container boots and logs `"Core service listening"` on port 4107. Test image/container removed after. |

### Live verification (disposable Postgres, zero risk to real data)

Started a fresh `postgres:16-alpine` container on an alternate port (`5435`), applied every
Prisma migration, then started `identity`, `user`, `core`, and `gateway` standalone on
non-default ports, all pointed at the disposable database (`GATEWAY_REQUIRE_AUTH=false`,
`ENABLE_DEV_SEED_ROUTES=true`). Confirmed:

- `POST /api/resources` through the gateway reaches `core` and creates a real `Resource` row
  (201, full mapped shape including `tone: "blue"` — proving the `toneSchema` adoption
  accepts the same values the old `resourceToneSchema` did); `GET /api/resources` through the
  gateway lists it back (200).
- `GET /api/user/events` and `GET /api/user/projects` through the gateway both 401 with
  `{"ok":false,"error":"Unauthorized"}` (expected — `GATEWAY_REQUIRE_AUTH=false` means the
  gateway never populates `x-user-id`), which by itself proves each request reached a real
  controller's own auth check rather than 404ing.
- `GET /api/user/dashboard/1` through the gateway also 401s the same way.
- To confirm the routing split precisely (not just "some controller answered"), hit each
  service **directly** with the internal token and a manually-set `x-user-id: 1` header — the
  same headers the gateway would attach for a real authenticated request:
  - `core` directly, `/api/user/events` → **200**, `{"ok":true,"events":[]}`.
  - `core` directly, `/api/user/projects` → **200**, `{"ok":true,"projects":[]}`.
  - `core` directly, `/api/user/dashboard/1` → **404** (route doesn't exist there).
  - `user` directly, `/api/user/events` → **404** (route no longer exists there).
  - `user` directly, `/api/user/projects` → **404**.
  - `user` directly, `/api/user/dashboard/1` → **200**, the full dashboard shape (profile,
    feed posts, live study rooms, upcoming sessions, suggested people, trending topics,
    sidebar groups) — confirms `getDashboardHome`'s own untouched inline queries still work.
  - `user` directly, `/api/resources` → **404** (never existed there; confirms no stray
    mount survived anywhere in `services/user`).
- Disposable container and all four service processes torn down immediately after; the real
  `.env` and database were never written to.

Definition of Done for B07, fully met: `services/resources` is deleted; `ServiceName` no
longer has a `resources` member; the 3 learning-read endpoints and all 6 resource endpoints
are served by `core`, proven by both the gateway route-rules test and a live end-to-end check
in both directions. `services/user` continues to build, typecheck, and serve its one
remaining path (`dashboard`) cleanly.

## B06 Execution

- Rollback target: parent commit `9932e13`.
- Manifest IDs done: `SP-100`–`SP-105` (new `services/core` + `community` module). Community
  portions of `SP-074`, `SP-076`, `SP-077` done. `SP-073`/`SP-075`/`SP-078` corrected from
  `DELETE`/B06 to reflect `services/user` staying alive until B08 (see below) — `SP-075` also
  got a same-batch dead-code fix.

### Plan-vs-reality check, done before writing any code

The batch's own copy-paste instruction says: *"Create services/core and move the community
domain (groups, membership, connections/follow, group events, invitations, announcements) out
of services/user into core/src/modules/community. Delete services/user when empty."*
`architecture-plan.md`'s B06 section separately states "Definition of Done: `services/user` is
deleted" — unconditional, and the manifest itself had `SP-073`/`SP-075`/`SP-078`
(`services/user`'s `package.json`/`index.ts`/`tsconfig.json`) pre-assigned `DELETE` at B06.

Before moving anything, read the full 1541-line `user.controller.ts` to see what was
actually in scope. Of its 20 exported functions, 16 are groups/connections/invitations
(community); the other 4 — `getLearningEvents`, `getLearningProjects`,
`getLearningProjectById`, `getDashboardHome` — are **not** community, despite one of them
(`getLearningEvents`) reading the `GroupEvent` table. `getGroupDetail` (which *is* community)
already returns a group's own `events`/`announcements` as nested Prisma includes — that's what
"group events, ... announcements" in the batch instruction refers to, not the standalone
`getLearningEvents` endpoint, which is a cross-group "browse all upcoming events" feed serving
`apps/web`'s Learning section (`/api/user/events`, `LEARNING_EVENTS_ROUTE` in `ApiRoutes.ts`).
Cross-checking `architecture-plan.md`'s own B07/B08 sections confirmed this: B07 explicitly
says it will "move learning projects/events reads (`getLearningProjects`,
`getLearningProjectById`, `getLearningEvents`) from the former `services/user` code," and
*neither* B07 nor B08's own "Definition of Done" repeats B06's "services/user is deleted"
claim — only B06's does, and only B06's turned out to be premature.

**Resolution**: followed the batch's own conditional instruction ("delete when empty") over
the imprecise "Definition of Done" prose. `services/user` is not empty after removing
community — it still serves `/api/user/events`, `/api/user/projects`,
`/api/user/projects/:id`, and `/api/user/dashboard/:id` — so it is not deleted in B06.
`SP-073`/`SP-075`/`SP-078` corrected to reflect this; deletion is now tracked against B08
(when dashboard, the last domain, finally moves out). This was a documentation/manifest
inconsistency to resolve by re-reading the actual code and the plan's own later sections, not
a product trade-off requiring a decision — so it was resolved directly rather than asked.

### The `assertSelf` extraction

The batch explicitly asked to "extract the repeated `x-user-id` vs `loggedInUserId` 403 check
into a shared `assertSelf` guard rather than copying it." Reading all 16 community functions
found the same three-step shape repeated ~11 times (with minor per-function variation): a 401
check (`getAuthenticatedUserId(req) === null`), then a route/body-specific parse-and-400 check
for `loggedInUserId` (response shape and exact position vary slightly per function — one
returns `{msg, unassociatedGroups: []}` instead of `{ok:false, error}`; `joinUnjoinedGroups`
uniquely parses and 400s *before* its `try` block, ahead of the 401 check), then a 403 check
(`authenticatedUserId !== loggedInUserId`).

Only the 401-and-403 pair — never the middle parse/400 step, which differs per function — was
extracted into one local `assertSelf(req, res, loggedInUserId): boolean` in
`community.controller.ts`, called in-place wherever the original two checks stood relative to
each function's own parse/400 step. This preserves every function's existing check *order*
exactly (including `joinUnjoinedGroups`'s outlier 400-before-401), with one narrow,
deliberate exception: the ~11 functions that do [401 → 400 → 403] now effectively do
[400 → assertSelf(401+403)], since `assertSelf` needs an already-parsed `loggedInUserId`
number as its argument. This flips 401/400 precedence only in the edge case of a request that
is simultaneously unauthenticated *and* carries a malformed `loggedInUserId` — such a request
now gets 400 instead of 401. No legitimate caller can hit this (the frontend always sends a
well-formed id together with its session), so this is judged an acceptable, narrow trade-off
for eliminating a duplicated auth check across ~11 handlers, and is called out here rather
than left undocumented, matching this refactor's practice of surfacing even minor behavior
deltas explicitly (see B04's `groupData` fallback removal for precedent).

Live-verified `assertSelf` directly: `POST /api/user/groups` with `x-user-id: 1` and
`loggedInUserId: 1` in the body succeeded (201, group created); the same call with
`loggedInUserId: 2` (mismatched) returned `{"ok":false,"error":"Forbidden"}` (403) — the guard
works correctly in a real request, not just in isolated review.

### Changes made

| Area | Change |
| --- | --- |
| New `services/core` | `package.json` (`@services/core`; depends on `@repo/database`, `@repo/shared`, `@repo/contracts` directly — `community.validation.ts` imports `positiveInt`/`slugOrUuidSchema`/`toneSchema` from it rather than through `@repo/shared`'s re-export, since those primitives were made available in `@repo/contracts` back in B03 but not force-adopted then), `tsconfig.json` (same base as every other service), `src/index.ts` (bootstrap: cors, json, `/health`, `internalTokenGuard`, mounts `community` at `/api/user`, `errorHandler`). |
| New `services/core/src/modules/community/` | `community.controller.ts`: all 16 group/connection/invitation functions moved verbatim from `user.controller.ts`, plus the new `assertSelf` guard (see above) and the shared display-mapping helpers they need (`getGroupWhere`, `getUserName`, `getInitials`, `mapUserCard`, `mapResourceCard`, `mapGroupCard`, and their supporting types). `community.validation.ts`: the 8 schemas those routes use, moved from `user.validation.ts`, adopting `@repo/contracts`'s `positiveInt`/`slugOrUuidSchema`/`toneSchema` instead of re-declaring them locally. `community.routes.ts`: the 16 route registrations, mounted at `/api/user` within `core` — **zero external path changes**, matching the batch's explicit instruction to preserve every path exactly. |
| `services/user` cleanup | `user.controller.ts`: removed the 16 community functions and the community-only helpers/types (`getGroupWhere`, `mapResourceCard`, `ResourceCardRecord`, `GroupInvitationRecord`, `GroupDetailRecord`) — 872 lines removed (1541 → 669). `getUserName`/`getInitials`/`mapUserCard`/`mapGroupCard`/`GroupCardRecord`/`UserCardRecord` are **duplicated**, not deleted: `getDashboardHome` (via `mapDashboardSidebarGroup`/`mapDashboardSuggestedPerson`) still calls them, and this file can't import from a sibling deployable service. This duplication is temporary — it disappears entirely once B08 deletes `services/user`. `user.routes.ts`/`user.validation.ts`: trimmed to the 4 remaining routes and their 2 schemas (`dashboardParamsSchema`, `projectIdParamsSchema`), the latter now built directly against a local `userIdParamsSchema` and `@repo/contracts`'s `slugOrUuidSchema` instead of aliasing the (now-moved) community schemas. `package.json`: added `@repo/contracts` as a direct dependency (validation file now imports from it directly, not just via `@repo/shared`). |
| B05-leftover fix, found while touching `services/user/src/index.ts` | A `validateObjectStorageEnv()` call and `storageProvider` boot-log field were still present, validating `AWS_*` env vars this service hasn't needed since B05 moved avatar upload to `identity`. Grepped `services/user/src` for any remaining S3/storage/multer usage — none — confirmed this was dead weight from an incomplete B05 cleanup, not something this service still needs. Removed both; zero behavior change for a correctly configured deploy, one fewer unnecessary startup dependency for a misconfigured one. |
| `services/gateway` | `routeRules.ts`: `Upstream` gained `"core"`. Three new specific rules (`/api/user/events`, `/api/user/projects`, `/api/user/dashboard` → `user`) precede the general `/api/user` rule, which now points at `core` instead of `user` — same first-match-wins precedence pattern B05 established. `index.ts`: `serviceBaseUrls` gained `core: process.env.CORE_SERVICE_URL \|\| "http://127.0.0.1:4107"`. `routeRules.test.ts`: replaced the single "every other /api/user path still resolves to user" test (now false) with two — one asserting the 3 remaining paths resolve to `user`, one asserting 11 representative community paths resolve to `core`. All 42 auto-extracted `ApiRoutes.ts` paths still resolve to exactly one upstream regardless of which upstream changed. |
| `packages/database/SCHEMA_OWNERSHIP.md` | `Group`, `GroupTag`, `GroupInvitation`, `GroupAnnouncement`, `GroupEvent` reassigned from `Auth`/`User service` to `Core (community module)`; noted that `User.following`/`followers` is written by `core` despite `User` itself belonging to `identity`. Added rows for `StudyRoom`/`Topic` (planned `learning`, B07) and `Post`/`Comment`/`Like` (planned `feed`, B08), which weren't listed at all before. This is a name/ownership-accuracy pass, not the full model-per-owning-module rewrite `SP-001` still defers to B10. |
| Env var / CI / deploy | `.env.example`: uncommented `CORE_SERVICE_URL`. `.env` (local): added `CORE_SERVICE_PORT=4107`, `CORE_SERVICE_URL=http://localhost:4107` (`turbo.json`'s `globalEnv` already had both, added ahead of time when `servicePorts.core` was wired in B05). `.github/workflows/ci.yml`: added `@services/core` to the build-services matrix. `.github/workflows/deploy-services.yml`: added a `core`/`services/core`/`yome-core` entry. Root `package.json`: `dev:services` and `check-types:all` both gained `core`. |

### Validation

| Command | Exit | Result |
| --- | --- | --- |
| `bun run --cwd services/user check-types` | 0 | Confirms the trim compiles standalone (no routes.ts/validation.ts yet — caught expected import errors, then fixed them). |
| `bun run --cwd services/core check-types` | 0 | New service typechecks clean. |
| `bun run --cwd services/gateway test` | 0 | 43 pass, 0 fail, 96 `expect()` calls (was 42/84 in B05 — +1 test, +12 `expect()` calls for the new community-path assertions). |
| `bun install` | 0 | Links `@services/core`'s and the updated `@repo/contracts` dependencies. |
| `bun run build` | 0 | 14/14 tasks (was 13; +1 for `@services/core`). |
| `bun run check-types` | 0 | 13/13 tasks (was 12; +1). |
| `bun run check-types:all` | 0 | All 12 sequential per-package `tsc --noEmit` steps pass, including the newly added `core`. |
| `bun run test` | 0 | 14/14 tasks, 0 failures. |
| `bun run lint` | 0 | 166 warnings, 0 errors — unchanged (all pre-existing `apps/web`). |
| `bunx tsc --noEmit` (`apps/web`) | 0 | Unaffected — no `apps/web` source touched this batch. |
| `docker build -f Dockerfile.service --build-arg SERVICE_DIR=services/core` | 0 | Image builds; container boots and logs `"Core service listening"` on port 4107. Test image/container removed after. |

### Live verification (disposable Postgres, zero risk to real data)

Started a fresh `postgres:16-alpine` container on an alternate port (`5434`), applied every
Prisma migration, then started `identity`, `user`, `core`, and `gateway` standalone on
non-default ports, all pointed at the disposable database (`GATEWAY_REQUIRE_AUTH=false` so no
session/token setup was needed). Confirmed:

- `GET /health` on the gateway reports `services.core` alongside the others.
- `POST /api/auth/register-user` through the gateway still reaches `identity` and writes a
  user (unaffected by this batch, checked as a smoke test).
- `GET /api/user/groups/discover` through the gateway reaches `core` (`{"ok":true,"groups":[]}`
  on the empty database) — a public read, provable through the real gateway without simulating
  a NextAuth session.
- Auth-gated community/dashboard/learning calls through the gateway (`POST /api/user/groups`,
  `GET /api/user/dashboard/1`, `GET /api/user/events`) all correctly 401'd, since
  `GATEWAY_REQUIRE_AUTH=false` means the gateway never populates `x-user-id` — this by itself
  confirms the request reached a real controller's own auth check (matching
  `{"ok":false,"error":"Unauthorized"}` exactly) rather than 404ing or hitting a network error.
- To verify the authenticated path and the routing split more precisely, hit each service
  **directly** (bypassing the gateway) with the internal token and a manually-set `x-user-id`
  header — the same headers the gateway would attach for a real authenticated request:
  - `core` directly, `/api/user/dashboard/1` → **404** (route doesn't exist there).
  - `core` directly, `/api/user/events` → **404**.
  - `user` directly, `/api/user/groups/discover` → **404** (route no longer exists there).
  - `user` directly, `/api/user/get-all-groups` → **404**.
  - `core` directly, `/api/user/groups/discover` → **200**, `{"ok":true,"groups":[]}`.
  - `core` directly, `POST /api/user/groups` with `x-user-id: 1`, `loggedInUserId: 1` →
    **201**, a real group created and returned with the correct `mapGroupCard` shape.
  - `core` directly, same call with `loggedInUserId: 2` (mismatched) → **403**, `assertSelf`'s
    Forbidden path confirmed live.
  - `user` directly, `/api/user/dashboard/1` with `x-user-id: 1` → **200**, full dashboard
    shape including `sidebarGroups: []` — confirms the *duplicated* `mapGroupCard`/`mapUserCard`
    helpers left in `user.controller.ts` still work correctly for `getDashboardHome`.
  - Disposable container and all four service processes torn down immediately after; the real
    `.env` and database were never written to.

Definition of Done for B06, fully met on its actual scope: the community domain (groups,
connections, invitations, and the events/announcements sub-fields group-detail already
returned) is fully out of `services/user` and served by `core`; every external path is
unchanged, proven by both the gateway route-rules test and a live end-to-end check in both
directions; the repeated self-check across community handlers is now one `assertSelf` guard,
not ~11 copies. `services/user` is not deleted — deliberately, per the corrected
understanding above — and continues to build, typecheck, and serve its 3 remaining paths
cleanly, including a same-batch fix for the B05-leftover dead storage-env check.

## B06 Completeness Audit (2026-09-05, same day)

Requested explicitly. Same method as the B03 and B05 audits, extended with one new
technique this time: a scripted per-function `diff` between the pre-B06 controller (`git show`
of the parent commit) and the new files, rather than eyeballing the move. Manifest structure
(0 duplicate IDs, 0 duplicate current-file entries, no ID-sequence gaps across all 105 rows)
and existence checks on every B06 `DONE` row passed clean. Found and fixed 3 small gaps —
none behavioral, all doc/style — plus produced strong positive evidence the extraction itself
introduced zero logic changes.

1. **Extraction correctness, verified mechanically, not just re-read**: wrote a small Python
   script to extract each of the 16 moved functions' full body (by brace-matching) from both
   `git show 9932e13:services/user/src/controllers/user.controller.ts` (the parent commit,
   pre-B06) and the new `community.controller.ts`, then `diff`'d each pair individually.
   Result: all 16 diffs show *only* the intended change — the `authenticatedUserId === null`
   / `!== loggedInUserId` pair replaced with one `assertSelf(...)` call, exactly where those
   two checks originally sat relative to each function's own NaN-parsing step. `getGroupDetail`
   and `getGroupInvitations`'s sibling `joinGroupById` (which delegates, no logic of its own)
   diffed to **zero** lines changed, as expected. `joinUnjoinedGroups`'s outlier ordering
   (NaN-check before the `try`/401, unlike every other function) is preserved exactly.
   Separately diffed the full route-path lists (old `user.routes.ts` vs. new
   `community.routes.ts` + `user.routes.ts` combined) and confirmed the exact same 19 path
   literals appear on both sides, and that every path→handler→validation-schema triple in
   `community.routes.ts` matches its pre-B06 wiring one-for-one. Confirmed
   `positiveInt`/`slugOrUuidSchema`/`toneSchema` (adopted from `@repo/contracts`) are
   byte-identical to the local definitions they replaced in `user.validation.ts`.
2. **Duplicate import statement** (real, minor gap): `community.controller.ts` had two
   separate `import { ... } from "@repo/shared"` statements (`slugify` split out from the
   rest) instead of one merged import. Not a functional bug — TypeScript/ESM tolerate it —
   but untidy and would trip a `no-duplicate-imports` lint rule in a stricter config. Merged
   into one statement; `check-types` confirmed unaffected. Checked every other B06-touched
   file for the same pattern — none found.
3. **`apps/web` sweep**: grepped for `CORE_SERVICE`/hardcoded port `4107` — none found, as
   expected (frontend only ever calls through the gateway). Found one stale comment in
   `apps/web/utils/ApiRoutes.ts` ("`// User service (profiles, groups, follow)`" labelling the
   `/api/user/*` route block) — now inaccurate on two counts, since profiles left in B05 and
   groups/follow left in B06. Reworded to describe the block without naming specific backend
   services, so it won't go stale again the next time this split changes (B07/B08 will move
   more of it). Ran `apps/web`'s own test suite (12/12) and standalone `tsc --noEmit` (clean)
   after the edit.
4. **Docs-only, "core" missing from architecture diagrams/lists** (same category as the B05
   audit's "auth service" prose miss, just for the newly-added service this time):
   `docs/PROJECT_ARCHITECTURE_AND_WORKFLOWS.md`'s high-level architecture flowchart didn't
   include a Core Service node; `docs/LOCALHOST_3000_REQUEST_WORKFLOW.md`'s architecture
   diagram, its `/api/user` routing edge label (still described the B05-era "user is the
   default, 3 paths carved to identity" shape, now inverted — core is the default, 3 paths
   carved to user), its port list, and its short-summary bullets all lacked `core`. Added it
   to each. Left the two docs' known **pre-existing** gaps alone (`services/resources` missing
   from the same diagrams, `services/media` shown writing to Postgres despite
   `SCHEMA_OWNERSHIP.md` saying it shouldn't) — neither is caused by or in scope for B06.
5. **Docker re-verification, independent of B06's own claims**: rebuilt and booted both
   `services/core` (confirms B06's own claim) and, separately, `services/user` (not rechecked
   during B06 itself) with **zero** `AWS_*` env vars set — booted clean, positively confirming
   the `validateObjectStorageEnv()` removal fix actually works and isn't just theoretically
   dead code. Both test images removed after.
6. Full validation re-run clean, fully cached (confirming zero drift since the B06 commit)
   before any audit fixes, and re-run clean again after: `build` 14/14, `check-types` 13/13,
   `check-types:all` (12 sequential), `test` 14/14, `lint` 0 errors, `apps/web` `tsc --noEmit`
   and its own test suite (12/12).

No functional/runtime behavior changed by this audit — the import merge has no code-generation
effect, everything else was comments/docs. B06 stands as complete, and this audit found no
evidence of any regression in the 16-function extraction itself.

## B05 Execution

- Rollback target: parent commit `a9e0a45`.
- Manifest IDs done: `SP-029`, `SP-030`, `SP-035`–`SP-039` (the identity rename), `SP-095`–
  `SP-099` (new profile module + gateway route rules). Profile portions of `SP-074`, `SP-076`,
  `SP-077` done; their community/learning/dashboard portions remain `PENDING` for B06–B08.

### Routing approach (presented before implementation, per the batch's own instruction)

The gateway previously had one `app.use("/api/user", ...)` mount forwarding the whole prefix to
`user`. B05 needed 3 of `/api/user`'s sub-paths (`/get-user-by-id`, `/update-user`,
`/get-all-users`) to go to `identity` instead, while every other `/api/user` path keeps going
to `user`. Two options were considered:

1. **Inline the 3 extra routes as more specific `app.use()` mounts above the general one**,
   relying on Express's own mount-order precedence (`app.use` doesn't stop at a full path
   match — the first matching prefix in registration order wins, so a more specific mount
   registered earlier "wins" the split). Minimal diff, but the routing decision stays buried
   in imperative bootstrap code, and there is no way to unit-test "does path X go to service Y"
   without booting Express.
2. **Extract an ordered, declarative route-rule table** (`routeRules.ts`) with a pure
   `resolveRoute(path)` function, and have `index.ts` mount from a loop over that table. Same
   runtime precedence semantics (first array entry wins, matched on a path-segment boundary —
   `pathMatchesPrefix` mirrors Express's own prefix matching exactly), but the table is now a
   plain data structure that can be asserted against in a test with no Express instance, and
   it is a direct, scoped precursor to the full declarative route manifest already planned for
   B10 (`SP-055`) rather than a one-off.

Went with (2): it costs one new file and doesn't change runtime behavior, and it directly
supports the batch's explicit ask for a route-manifest test. `index.ts` still owns bootstrap,
CORS, rate limiting, and auth — `routeRules.ts` owns only "which upstream does this path go
to".

### Changes made

| Area | Change |
| --- | --- |
| `services/auth` → `services/identity` | `git mv`'d as a unit: `package.json` (renamed to `@services/identity`, `@repo/storage`/`@repo/seed`/`multer` deps added, matching what the profile module needs), `src/index.ts` (rewritten to mount `credentials`, `profile`, and `dev/seed-route` modules), `tsconfig.json` (unchanged). `src/controllers/auth.controller.ts` → `src/modules/credentials/credentials.controller.ts`; `src/routes/auth.routes.ts` → `src/modules/credentials/credentials.routes.ts`; `src/routes/auth.validation.ts` → `src/modules/credentials/credentials.validation.ts` (now imports `nameSchema`/`usernameSchema` from `@repo/contracts` instead of a local definition — see below). `src/routes/db.routes.ts` (already rewritten in B04) → `src/dev/seed-route.ts`, content unchanged. Old `services/auth/` directory (incl. stale `dist`/`.turbo`) removed after the moves. |
| New `services/identity/src/modules/profile/` | `profile.controller.ts`: `getUserById`, `updateUser`, `getAllUsers` extracted verbatim from `services/user/src/controllers/user.controller.ts` (logger renamed `"identity-profile"`). `profile.validation.ts`: `getUserByIdSchema`/`updateUserSchema` moved from `user.validation.ts`, now importing `nameSchema`/`usernameSchema`/`positiveInt` from `@repo/contracts`. `profile.routes.ts`: the 3 routes + the `multer` avatar-upload setup, moved from `user.routes.ts`. Mounted at `/api/user` **inside** identity — the external gateway path is unchanged, only the upstream changes. |
| `services/user` cleanup | `user.controller.ts`: removed the 3 functions and their now-unused imports (`ALLOWED_IMAGE_MIME_TYPES`, `assertAllowedMimeType`, `createLogger`, `uploadBufferToS3`) and the `logger` const. `user.routes.ts`: removed `multer`, the upload setup, the 3 route registrations and their imports; left a comment pointing at the new location. `user.validation.ts`: removed `getUserByIdSchema`/`updateUserSchema` and the local `nameSchema`/`usernameSchema` (now dead — `positiveInt` stays, still used elsewhere in the file). `package.json`: dropped `multer`/`@types/multer` (grep-confirmed no remaining references). |
| `@repo/contracts` | `schemas.ts` gained `nameSchema`/`usernameSchema` (`SP-083`), promoted from byte-identical definitions duplicated in `auth.validation.ts` and `user.validation.ts` — the fourth instance of this exact duplication pattern this refactor has found (see issue #11 in the inventory below). |
| `packages/service-kit` | `config/env.ts`: `servicePorts.auth` → `servicePorts.identity`, now reads `IDENTITY_SERVICE_PORT` (default unchanged, 4101). |
| `services/gateway` | New `src/routeRules.ts` (`Upstream` type, `RouteRule` type, the ordered `routeRules` table, `pathMatchesPrefix`, `resolveRoute`) and `src/routeRules.test.ts` (see below). `src/index.ts`: `services` object → `serviceBaseUrls: Record<Upstream, string>` (the `auth` key renamed `identity`, now reading `IDENTITY_SERVICE_URL`); `/health` handler updated to the renamed variable; the 8 hand-written `app.use("/api/X", ...)` calls replaced with one loop over `routeRules`. `package.json`: `test` script switched from the echo-stub to `bun test ./src`. `tsconfig.json`: excludes `**/*.test.ts` (same fix as B03's glob bug — see below). |
| Env var rename (explicit user decision: fully rename, not alias) | `AUTH_SERVICE_URL`/`AUTH_SERVICE_PORT` → `IDENTITY_SERVICE_URL`/`IDENTITY_SERVICE_PORT` in: `turbo.json` (`globalEnv`), `.env.example`, the working-tree `.env`, `README.md`'s env-var list, `tests/contracts.smoke.mjs` (label `"auth"` → `"identity"` too). |
| Path/label rename cascade | `.github/workflows/ci.yml` (`@services/auth` → `@services/identity` in the build matrix), `.github/workflows/deploy-services.yml` (`@services/auth`/`services/auth`/`yome-auth` → the `identity` equivalents), root `package.json` (`dev:services` concurrently label + `--cwd`, `check-types:all`). |
| Docs | `README.md`, `docs/PROJECT_ARCHITECTURE_AND_WORKFLOWS.md` (12 references), `docs/LOCALHOST_3000_REQUEST_WORKFLOW.md` (2 references): every `services/auth/...` path reference updated to its current `services/identity/...` path; narrative text updated from "the auth service" to "the identity service" where it described current behaviour. `architecture-plan.md`'s manifest-ID citation for B05 was already corrected earlier in this session (before this batch's implementation started) — see its own diff. |

### `routeRules.test.ts` — the route-manifest test

Per the batch's own instruction ("Add a route-manifest test asserting every path in
`apps/web/utils/ApiRoutes.ts` resolves to exactly one upstream"): the test reads
`apps/web/utils/ApiRoutes.ts` as text and walks its two constant-declaration shapes with
regex (a base constant built from a `${HOST}/api/...` template literal, then exported
constants built from `${BASE}/suffix` templates or plain aliases) to recover the `/api/...`
path each of its 42 exported route constants resolves to — without needing a bundler to
actually import a file that also exports an unrelated `CHAT_SOCKET_URL`. Every extracted path
is then asserted to resolve through `resolveRoute()` to exactly one rule, plus targeted checks:
the 3 profile paths resolve to `identity` (not `user`); a sample of other `/api/user` paths
still resolve to `user`; `/api/messages` resolves to `chat` with the rewrite intact; `/api/db`
resolves to `identity`; an unrecognised prefix resolves to nothing. 42 assertions, all passing.

### Validation

| Command | Exit | Result |
| --- | --- | --- |
| `bun run --cwd services/gateway test` | 0 | 42 pass, 0 fail, 84 `expect()` calls. |
| `bun install` | 0 | Regenerates `bun.lock` — confirms no lingering `@services/auth` entry. |
| `bun run build` | 0 | 13/13 tasks (unchanged count; `@services/auth` → `@services/identity` is a rename, not a new package). |
| `bun run check-types` | 0 | 12/12 tasks. |
| `bun run lint` | 0 | 166 warnings, 0 errors — unchanged from B04 (all pre-existing `apps/web` warnings, unrelated to this batch). |
| `bun run test` | 0 | 13/13 tasks, including the new gateway suite. |

### Live verification (disposable Postgres, zero risk to real data)

Started a fresh `postgres:16-alpine` container on an alternate port (`5433`), applied every
Prisma migration to get a byte-for-byte schema match with zero rows, then started `identity`,
`user`, and `gateway` standalone on non-default ports, all pointed at the disposable database
via env-var overrides (`GATEWAY_REQUIRE_AUTH=false` so no session/token setup was needed for
this check). Confirmed:

- `GET /health` on the gateway reports `services.identity` (not `services.auth`), pointing at
  the identity instance's URL — the rename is live, not just in source.
- `POST /api/auth/register-user` through the gateway reaches `identity` and successfully
  writes a `User`/`UserProfile` pair to the disposable database (200, full user object back).
- `POST /api/user/get-user-by-id` through the gateway reaches `identity` (returns the joined
  profile with `bio`/`address`) — confirms the 3-path split works through the real gateway,
  not just in the `routeRules.ts` unit test.
- `GET /api/user/get-all-groups` through the gateway still reaches `user` (`{"groups":[]}` on
  the empty database) — confirms the general `/api/user` prefix still lands on `user`.
- Hitting the moved profile path directly against `user` (internal-token guard satisfied)
  returns `404` — the route is gone, not duplicated. Hitting a `user`-only path directly
  against `identity` also returns `404` — same check in the other direction. Together these
  rule out the failure mode where both services still respond and the gateway is silently
  masking a duplicate.
- Disposable container and all three service processes were torn down immediately after; the
  real `.env` and the real (Supabase) database were read but never written to during this
  verification, and remain exactly as they were beforehand aside from the two intentional
  `.env` edits (`AUTH_SERVICE_PORT`/`URL` → `IDENTITY_SERVICE_PORT`/`URL`) that are part of
  this batch's own scope.

Definition of Done for B05, fully met: `services/auth` no longer exists; `services/identity`
owns credentials and profile; the gateway routes the 3 profile paths to `identity` and every
other `/api/user` path to `user`, proven by both a unit test over the full `ApiRoutes.ts`
surface and a live end-to-end check; the env var rename the user explicitly chose is applied
everywhere it appears in source, config, CI, and docs; full validation and live verification
both pass with zero risk to shared/real data.

## B05 Completeness Audit (2026-09-05, same day)

Requested explicitly, following the same method as the B03 completeness audit: manifest
structural checks (duplicate IDs, duplicate current-file entries, ID-sequence gaps —
grep-derived, not hand-tallied), a filesystem existence check for every row this batch
claims `DONE`, a fresh full-repo validation run, a live Docker build/boot of the renamed
service (not run during B05 itself), and a repo-wide sweep for stale naming — extended past
`services/auth` path strings this time to also catch "auth service" **prose**, since that
was the B03 audit's blind spot pattern repeating. Found and fixed 2 real gaps and corrected
9 stale prose mentions; shipped code (routing, controllers, tests) was otherwise correct.

1. **Manifest structure**: 99 rows, 0 duplicate IDs, 0 duplicate current-file entries, no
   ID-sequence gaps (`SP-001`–`SP-099` all present exactly once). Status accounting
   re-verified by grep: 14 KEEP + 46 DONE + 39 PENDING = 99. ✓ All 12 files the manifest
   marks `DONE` for B05 (`SP-029`, `SP-030`, `SP-035`–`SP-039`, `SP-095`–`SP-099`) confirmed
   to exist on disk at their recorded "Current File" path.
2. **Unused direct dependency** (real gap): `services/identity/package.json` listed
   `@repo/storage` as a direct dependency, but `services/identity/src` has zero direct
   `@repo/storage` imports — `uploadBufferToS3` is only reached via `@repo/shared`'s
   re-export, exactly like `services/user` (the code's original owner) did before the move.
   `services/identity` is the only `package.json` in the repo that listed `@repo/storage`
   directly while never importing it directly. Removed; `build`/`check-types` confirmed
   unaffected (both were already resolving the type through `@repo/shared` transitively).
   `SP-029`'s manifest note corrected to stop claiming this dependency was needed.
3. **Stale "auth service" prose, 9 instances** (real gap; B05's own stale-reference sweep
   only grepped the path string `services/auth`, not the prose phrase "auth service" — the
   same category of miss the B03 audit warned about, just a different string this time):
   - `docs/PROJECT_ARCHITECTURE_AND_WORKFLOWS.md`: 2 numbered-step sentences ("The auth
     service resolves...", "The auth service performs bulk...") + 2 mermaid diagram node
     labels ("Auth Service", "Auth service registerUser").
   - `docs/LOCALHOST_3000_REQUEST_WORKFLOW.md`: 2 mermaid labels ("Auth service"), 1 mermaid
     flowchart edge label ("`/api/auth -> auth service`", extended with a note that 3
     profile sub-paths now go to `identity` instead), 1 sequence-diagram participant alias
     display name, 1 prose sentence ("the auth microservice"), 2 list items ("the gateway
     forwards them to auth, ...", "auth, user, and chat data finally live in Postgres"), and
     the port-list entry "`4101`: auth service".
   - `packages/database/SCHEMA_OWNERSHIP.md`: **not touched at all during B05** — a genuine
     miss, since this file is exactly the kind of cross-cutting doc a service rename should
     update. Rewrote the `User`/`UserProfile` and `Group` ownership rows and the "Auth
     service" boundary bullet to say `Identity`/`User service` and reflect current (not
     B01-era) ownership — the `Group` row previously said "Auth (current) / User service
     (future)", which was stale even before B05 (B04 already moved runtime Group CRUD to
     `user`; only the dev-seed path stays reachable from `identity` via `@repo/seed`). This
     is a **name + accuracy** fix only — the full ownership-model rewrite this file's own
     `SP-001` row defers to B10 was deliberately left alone.
   - `services/identity/src/modules/credentials/credentials.controller.ts`: one doc-comment
     ("...so the password never leaves the auth service") — the one source-code (not docs)
     instance found.
   - Deliberately left unchanged (historical, not stale): `README.md`'s "Completed recently"
     changelog line ("auth, user, and chat route validation" — true of the work at the time
     it was done, before the rename existed); `migration-log.md`'s own B01-era "Detected
     Validation Commands" section (explicitly a frozen snapshot of the *original* repo state,
     evidenced by its own uncorrected "note: `@services/user` and `@services/resources` are
     absent" / "note: `Dockerfile.service` does not exist" — both fixed in B02 but the B01
     snapshot was never rewritten, by design); `architecture-plan.md` and
     `service-decomposition-plan.md`'s "Current" column describing pre-refactor state.
4. **Live-verified the Docker path, which B05 itself skipped** (B02/B03 ran
   `docker build -f Dockerfile.service --build-arg SERVICE_DIR=...`; B04 and B05 did not):
   `docker build -f Dockerfile.service --build-arg SERVICE_DIR=services/identity` succeeds
   (`Dockerfile.service` derives the workspace name generically from `SERVICE_DIR`, no
   hardcoded `auth` string to update), and the resulting image boots cleanly
   (`{"level":"info","service":"identity","msg":"Identity service listening",...,"port":4101}`
   with only `IDENTITY_SERVICE_PORT` set). Test image and container removed after.
5. **Verified against the whole project, not just `services/**`**: grepped all of
   `apps/web` for `AUTH_SERVICE`/hardcoded `4101`/`SERVICE_URL` — none found outside the
   pre-existing, out-of-scope `stream.actions.ts` gateway-bypass (issue #25/#26, tracked for
   B09). Confirmed every `apps/web` file calling a moved-or-adjacent route
   (`userInfo.ts`, `options.ts`, `sync-user/route.ts`, `RegisterContainer.tsx`,
   `dashboardApi.ts`, `chatApi.ts`, `accountApi.ts`, `devDbProxy.ts`) does so through
   `ApiRoutes.ts`/the gateway, never a direct service URL. Ran `apps/web`'s own test suite
   (12/12 pass) and standalone `tsc --noEmit` (clean) — neither had been run standalone
   specifically for B05 before (only via the aggregate `turbo run` tasks).
6. Full validation re-run clean after every fix above: `build` 13/13, `check-types` 12/12,
   `check-types:all` (11 sequential per-package `tsc --noEmit`, the actual root script,
   not previously run for B05) all pass, `test` 13/13 (incl. gateway's 42 and `apps/web`'s
   12), `lint` 0 errors / 166 warnings (unchanged, all pre-existing `apps/web`).

No functional/runtime behavior changed by this audit beyond the one dependency removal
(which had zero build/runtime effect, confirmed above) — everything else was doc/comment
text. B05 stands as complete.

## B04 Execution

- Rollback target: parent commit `ebf93d4`.
- Scope so far: `services/auth/src/controllers/seed.controller.ts`,
  `services/auth/src/data/{users,resources,dashboard}.ts`, and
  `services/auth/src/routes/db.routes.ts`. **Not yet touched:** `packages/shared/src/data/
  groups.ts` (`SP-013`) and the `groupData` runtime fallback in
  `services/user/src/controllers/user.controller.ts` — see below.
- Manifest IDs done: `SP-031`–`SP-034`, `SP-038`, `SP-091`–`SP-094`. `SP-013` and the
  fallback portion of `SP-074`/`SP-076` remain `PENDING`.

Changes made:

| Area | Change |
| --- | --- |
| New package | `packages/seed` — `src/guard.ts` (`canRunSeedMutations`, `devSeedGuard`), `src/runners.ts` (the 5 seed handlers, moved verbatim from `seed.controller.ts` minus their repeated per-handler guard call), `src/fixtures/{users,resources,dashboard}.ts` (moved verbatim), `src/index.ts`. Depends on `@repo/database`, `@repo/shared`, `bcryptjs` — same as `services/auth` did. |
| Guard consolidation | The old code checked `rejectIfSeedDisabled(res)` inside all 5 handlers independently. Replaced with one `router.use(devSeedGuard)` in `db.routes.ts`. Same two conditions (`ENABLE_DEV_SEED_ROUTES === "true"` and `NODE_ENV !== "production"`), same 404 body, checked once instead of five times. |
| `services/auth/src/routes/db.routes.ts` | Rewritten as a thin route: mounts the guard, then the 5 `POST` handlers imported from `@repo/seed`. **External paths unchanged**: `/api/db/create-multiple-users`, `/create-multiple-groups`, `/create-multiple-resources`, `/create-dashboard-demo-data`, `/deleteAll`. |
| `services/auth` | `src/data/` directory deleted (now empty). `src/controllers/seed.controller.ts` deleted. Added `@repo/seed` to `package.json` dependencies. |

Validation:

| Command | Exit | Result |
| --- | --- | --- |
| `bun install` | 0 | Links `@repo/seed`; `bun.lock` updated. |
| `bun run build` | 0 | 13/13 tasks (was 12; +1 for `@repo/seed`). |
| `bun run check-types` | 0 | 12/12 tasks (was 11; +1). |
| `bun run lint` | 0 | 166 warnings — unchanged. |
| `bun run test` | 0 | 13/13 tasks, 0 failures. |
| `bunx tsc --noEmit` (`apps/web`) | 0 | Unaffected. |
| **Live guard verification** | — | Started `services/auth` standalone twice, once with `ENABLE_DEV_SEED_ROUTES=false` and once `=true` with a deliberately unreachable `DATABASE_URL` (`postgresql://noop:noop@127.0.0.1:1/noop`) so no real database could be touched either way. **Disabled:** all `/api/db/*` calls returned `404 {"ok":false,"error":"Not found","details":"Seed endpoints are disabled"}` — byte-identical to the pre-B04 response. **Enabled:** all 5 endpoints passed the guard and reached the moved code — confirmed by the error stack trace naming `packages/seed/dist/runners.js` — then failed cleanly on `ECONNREFUSED`, proving the wiring is correct with zero risk to any real data. |

Risk called out in the plan and how it was handled: "the runtime `groupData` fallback in
`services/user` is load-bearing for first-run UX; removing it needs a product check." Rather
than deciding this unilaterally, the fallback (and the `SP-013` fixture move it's coupled to)
is paused here for an explicit decision. What changes for a first-run user, either way:

**If the fallback is kept** (`packages/shared/src/data/groups.ts` stays where it is, not
moved into `@repo/seed`; `services/user/src/controllers/user.controller.ts` keeps importing
`groupData`): a freshly migrated, completely empty database still shows ~15 synthetic
"discoverable" groups (Python Learners, Physics Club, Nepali Sports Fanatics, ...) the moment
any user calls `GET /api/user/get-unassociated-groups/:id`, with **no seed step required**.
These are virtual cards (id `groupData-N`), not real rows, until a user actually joins one —
at which point `joinUnjoinedGroups` materialises that one specific group into the real
database on demand. This is undocumented behaviour (not mentioned in `README.md` or
`AGENTS.md`) that currently only fires when `prisma.group.count()` is exactly zero.

**If the fallback is removed** (matches B04's original plan: `groupData` moves fully into
`@repo/seed`, `services/user` drops the import): the same freshly migrated database shows
**zero** discoverable groups until an operator explicitly runs
`POST /api/db/create-multiple-groups` (now served by `@repo/seed`) or a real user creates one
via `POST /api/user/groups`. `groupData-N` ids sent to `joinUnjoinedGroups` would 400 as an
unrecognised group rather than silently materialising one. This is more architecturally
correct (no phantom data appears without someone deciding to seed) but changes what a fresh
deploy or fresh local checkout looks like out of the box.

**Decision: remove.** Asked the user directly rather than choosing internally; the answer
matches B04's original plan.

### Fallback removal — what changed and how it was verified

- `packages/shared/src/data/groups.ts` moved to `packages/seed/src/fixtures/groups.ts`
  (`SP-013`, now `DONE`). `packages/shared/src/index.ts` no longer re-exports `groupData` —
  the shim's `src/` directory now contains only `index.ts`, matching its final B10 shape
  early. `packages/seed/src/runners.ts` now imports `groupData` from its own
  `./fixtures/groups.js` instead of `@repo/shared`.
- `services/user/src/controllers/user.controller.ts`: dropped `groupData` from its
  `@repo/shared` import. `getUnassociatedGroupsForUser` no longer special-cases
  `totalGroups === 0`; it now always returns the real (possibly empty) query result.
  `joinUnjoinedGroups` no longer special-cases a `groupIdToJoin` starting with
  `"groupData-"`; such an id now falls through to the normal `getGroupWhere` lookup, which
  finds nothing and 400s "Invalid group to join" — the same response any other unrecognised
  id or slug already produced.
- **Live-verified against a disposable local Postgres** (not the shared/remote database in
  the working-tree `.env`): started `postgres:16-alpine` in Docker on an alternate port,
  applied every Prisma migration (`bun run --cwd packages/database db:migrate`) to get a
  byte-for-byte schema match with zero data, started `services/auth` and `services/user`
  standalone against it, seeded exactly one real user via the (now `@repo/seed`-backed)
  `/api/db/create-multiple-users` endpoint, and confirmed:
  - `GET /api/user/get-unassociated-groups/1` on the empty-of-groups database returns
    `{"unassociatedGroups":[]}` (200) — not the ~15 synthetic cards the old fallback produced.
  - `POST /api/user/connect-user-to-group` with `{"groupIdToJoin":"groupData-0"}` returns
    `{"msg":"Invalid group to join."}` (400) — no group is materialised.
  - `POST /api/db/create-multiple-groups` (the real seed endpoint) is still reachable and
    still works (201) — an operator can still populate the same 15 groups deliberately.
  - The disposable Postgres container and its volume were removed immediately after; nothing
    was written to the real database at any point in this verification.
- Validation after the removal: `bun run build` 13/13, `bun run check-types` 12/12,
  `bun run lint` 166 warnings (unchanged), `bun run test` 13/13, `bunx tsc --noEmit`
  (`apps/web`) clean.

Definition of Done for B04, fully met: `services/auth` (soon `identity`) contains no
`src/data/*` and no seed business logic; `packages/seed` owns all of it, including the
`groupData` fixture; dev seed endpoints behave identically (verified live, both disabled and
enabled); and the one open risk called out in the plan (the runtime fallback) was resolved by
an explicit product decision rather than a unilateral code change.

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
