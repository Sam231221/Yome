# START HERE — How to Execute This Refactor

You have eight planning documents. **You only need this one to begin.** The others are
reference material you open when a batch tells you to.

- **Branch:** `refactor/services-packages-architecture`
- **Status:** B01–B05 complete. `packages/shared` is now a thin shim over `@repo/contracts` /
  `@repo/service-kit` / `@repo/storage`; four duplicated helpers were consolidated and adopted
  by `auth`, `user`, `chat`, `resources`. `packages/seed` now owns all dev seed logic and
  fixtures (including the `groupData` zero-seed fallback, which was removed from
  `services/user` after an explicit product decision — a fresh database now shows zero
  groups until seeded, matching "no seed code in production"). `services/auth` is now
  `services/identity`, which also absorbed the 3 profile endpoints from `services/user`; the
  gateway's routing table is now a tested `routeRules.ts` module; `AUTH_SERVICE_URL`/`PORT`
  were fully renamed to `IDENTITY_SERVICE_URL`/`PORT` everywhere per an explicit user decision.
  **B06 is next.**
- **How work happens:** you paste one command per batch into Claude Code. Claude does the
  batch, updates `migration-log.md`, and commits. You verify, then move to the next.

---

## 1. The 60-second orientation

| Document | Open it when |
| --- | --- |
| **00-START-HERE.md** (this) | Always. It is the run book. |
| [architecture-plan.md](./architecture-plan.md) | You want the detail of a specific batch B01–B10. |
| [service-decomposition-plan.md](./service-decomposition-plan.md) | You are asking "why is this a module and not a service?" |
| [data-architecture-plan.md](./data-architecture-plan.md) | You are asking about Redis, Mongo, caching, or when to split a database. |
| [event-architecture-plan.md](./event-architecture-plan.md) | You are asking about the event bus, outbox, or notifications. |
| [api-and-dataflow-plan.md](./api-and-dataflow-plan.md) | You need the endpoint list, gateway routes, or a data-flow diagram. |
| [refactor-manifest.md](./refactor-manifest.md) | You want to know what happens to one specific file. |
| [migration-log.md](./migration-log.md) | You want to know what has actually been done, and what is broken today. |

**The one-sentence plan:** 7 services → 6 (`gateway`, `identity`, `core`, `messaging`,
`media`, `notifications`), `packages/shared` → 4 focused packages, one Postgres throughout,
Redis and events added later, database splitting only if a measured trigger fires.

---

## 2. What the validation audit found (2026-09-04)

Beyond the original 15 issues, the audit against the live codebase found 15 more. Four matter
enough to change the plan:

| # | Finding | Why it matters | Fixed in |
| --- | --- | --- | --- |
| 25–27 | **`apps/web/actions/stream.actions.ts` bypasses the gateway and impersonates it** — calls `CHAT_SERVICE_URL` directly, forging `x-internal-token` from `GATEWAY_SHARED_TOKEN`. Holds `STREAM_SECRET_KEY`. | Your frontend deploy carries backend secrets and can impersonate the trusted edge. This is the largest boundary violation in the repo. | **B09** |
| 26 | **Video calling has no service owner.** Stream token minting and participant provisioning are a Next.js server action. | An entire domain was missing from the service map. | **B09** |
| 28 | **`sync-user` accepts identity from the request body when `NODE_ENV !== "production"`.** | Account-takeover primitive if `NODE_ENV` is ever unset in a deployed environment. | **B02** |
| 31 | **`turbo.json` `globalEnv` omits ~15 vars services actually read** (`AUTH_SERVICE_URL`, all `*_SERVICE_PORT`, all `AWS_*`, …). | Turbo cache keys are wrong — changing one can serve a **stale cached build**. | **B02** |

Also found: CI references `apps/mobile` which does not exist (#30); zero Docker/compose files
tracked despite `deploy-services.yml` building `./Dockerfile.service` (#34); `JWT_KEY` is dead
config (#32); no observability, rollback, or migration-coordination plan (#35–#37).

Full list: [migration-log.md](./migration-log.md) → "Pre-existing Issues Inventory".

---

## 3. The order to do it in

Do these in order, top to bottom. One batch per session is a good rhythm.

| # | Batch | What it does | Size | Risk | Needs |
| --- | --- | --- | --- | --- | --- |
| 1 | **B02** | CI, Docker, turbo env, security baseline | M | Low | — |
| 2 | **B03** | Split `packages/shared` into 4 packages | M | Low-Med | B02 |
| 3 | **B04** | Move seed code + fixtures to `packages/seed` | M | Med | B03 |
| 4 | **B05** | `auth` → `identity`, absorb profile from `user` | L | **High** | B04 |
| 5 | **B06** | Create `services/core`, move community domain | L | **High** | B05 |
| 6 | **B07** | Fold `resources` into `core/modules/learning` | M | Med | B06 |
| 7 | **B08** | `core/modules/feed` + `dashboard` | M | Med | B07 |
| 8 | **B09** | `chat` → `messaging`, extract calls from `apps/web`, de-DB `media` | L | **High** | B03 |
| 9 | **B10** | Gateway route manifest, lint, final reconciliation | M | Med-High | B02–B09 |
| 10 | **B11** | Redis: presence, socket adapter, rate limiting | M | Med | B09 |
| 11 | **B12** | Cache-aside read paths | S | Low | B11 |
| 12 | **B13** | Event backbone (outbox → Redis Streams) | L | Med | B10, B11 |
| 13 | **B14** | Notifications becomes a real event consumer | M | Low | B13 |

> **Move B11 to position 2** (right after B02) if you plan to run more than one replica of
> `gateway` or `messaging` before the refactor finishes. Presence and rate limiting are
> process-local `Map`s today — that is a **correctness defect**, not a performance issue. B09
> will simply move the two Redis files into the renamed service.

**B15–B16** (read models, search) and **B17+** (database extraction) are trigger-gated. Do not
start them until a threshold in `data-architecture-plan.md` is measured and recorded.

---

## 4. The commands

Paste these into Claude Code, one per batch. Each is self-contained.

### Before you start anything

```text
Read docs/services_packages_refactoring/00-START-HERE.md and confirm the plan
is still accurate against the current codebase. Tell me anything that has
drifted since the docs were written. Do not change any code.
```

### B02 — Foundation

```text
Run batch B02 from docs/services_packages_refactoring/architecture-plan.md.

Capture the baseline validation table into migration-log.md first. Then do the
full B02 scope: add Dockerfile.service and docker-compose.yml, fix the CI and
deploy matrices, delete the dead apps/mobile workflow and jobs, complete
turbo.json globalEnv, close the sync-user dev auth bypass, add .env.example,
add DEV_SEED_ROUTE_TOKEN, remove the dead JWT_KEY, extend
tests/contracts.smoke.mjs, and document the rollback procedure.

Update migration-log.md and commit.
```

### B03 — Split packages/shared

```text
Run batch B03 from docs/services_packages_refactoring/architecture-plan.md.

Split packages/shared into @repo/service-kit, @repo/storage, and @repo/contracts.
Keep @repo/shared as a re-export shim. Leave the groups.ts fixture for B04.
Move the duplicated getAuthenticatedUserId, slugify, uuidPattern, and formatCount
helpers into @repo/contracts and update all four services to use them.

Update migration-log.md and refactor-manifest.md statuses, then commit.
```

### B04 — Seed extraction

```text
Run batch B04 from docs/services_packages_refactoring/architecture-plan.md.

Create packages/seed and move seed.controller.ts, services/auth/src/data/*, and
packages/shared/src/data/groups.ts into it. Rewrite db.routes.ts as a dev-guarded
route importing @repo/seed.

Before removing the runtime groupData fallback in getUnassociatedGroupsForUser
and joinUnjoinedGroups, show me exactly what changes for a first-run user and
wait for my confirmation.

Update migration-log.md and refactor-manifest.md, then commit.
```

### B05 — identity service

```text
Run batch B05 from docs/services_packages_refactoring/architecture-plan.md.

Rename services/auth to services/identity and move the profile endpoints
(get-user-by-id, update-user, get-all-users) out of services/user into
identity/modules/profile.

The gateway must route those three /api/user paths to identity while the rest of
/api/user still goes to core. Show me the routing approach before implementing it.
Add a route-manifest test asserting every path in apps/web/utils/ApiRoutes.ts
resolves to exactly one upstream.

Update migration-log.md and refactor-manifest.md, then commit.
```

### B06 — core service + community module

```text
Run batch B06 from docs/services_packages_refactoring/architecture-plan.md.

Create services/core and move the community domain (groups, membership,
connections/follow, group events, invitations, announcements) out of
services/user into core/src/modules/community. Delete services/user when empty.

Preserve every external API path exactly. Extract the repeated x-user-id vs
loggedInUserId 403 check into a shared assertSelf guard rather than copying it.

Update migration-log.md, refactor-manifest.md, and SCHEMA_OWNERSHIP.md, then commit.
```

### B07 — learning module

```text
Run batch B07 from docs/services_packages_refactoring/architecture-plan.md.

Fold services/resources into core/src/modules/learning and delete it. Move the
learning projects and events reads out of the former user controller into the
same module. Keep /api/resources and /api/user/projects paths unchanged.

Update migration-log.md, refactor-manifest.md, and SCHEMA_OWNERSHIP.md, then commit.
```

### B08 — feed + dashboard modules

```text
Run batch B08 from docs/services_packages_refactoring/architecture-plan.md.

Create core/src/modules/feed as the write owner for Post, Comment, and Like, and
core/src/modules/dashboard for the aggregation. The dashboard must compose the
community, learning, and feed module surfaces instead of querying their tables
directly.

Measure the dashboard endpoint's response time before and after and record both
in migration-log.md.

Update migration-log.md and refactor-manifest.md, then commit.
```

### B09 — messaging, media, and call extraction

```text
Run batch B09 from docs/services_packages_refactoring/architecture-plan.md.

Three parts:
1. Rename services/chat to services/messaging with modules/{messages,calls,realtime}.
2. Extract the Stream server logic from apps/web/actions/stream.actions.ts into
   messaging/modules/calls, exposed through the gateway. apps/web must end up with
   no STREAM_SECRET_KEY, no GATEWAY_SHARED_TOKEN, no CHAT_SERVICE_URL, and no
   @stream-io/node-sdk.
3. Remove @repo/database from services/media and replace getChatUploadScope.

This is the highest-risk batch. Do the three parts as separate commits. Before
part 2, show me the plan for keeping Stream token minting byte-compatible.
Verify with: grep -r "x-internal-token" apps/web returns nothing.

Update migration-log.md and refactor-manifest.md, then commit.
```

### B10 — gateway + reconciliation

```text
Run batch B10 from docs/services_packages_refactoring/architecture-plan.md.

Split services/gateway/src/index.ts into a bootstrap, a declarative
routes/route-manifest.ts, and middleware/* files. Add timeouts, retry for
idempotent methods only, and a per-upstream circuit breaker. Delete the
@repo/shared shim. Add the eslint service profile and wire real lint into every
service. Extract the notifications inline handler into a controller.

Then reconcile refactor-manifest.md so every row is DONE, KEEP, or BLOCKED.

Update migration-log.md and commit.
```

### B11 — Redis

```text
Run batch B11 from docs/services_packages_refactoring/data-architecture-plan.md.

Create packages/cache. Move presence out of the in-process Map into Redis with a
heartbeat TTL, add @socket.io/redis-adapter so emit crosses replicas, and replace
the gateway's in-memory rate limiter with a Redis sliding window.

Verify by running 2 messaging replicas and 2 gateway replicas locally and
confirming presence is consistent, cross-replica delivery works, and the rate
limit is global.

Update migration-log.md, mark triggers T-01 and T-02 resolved, and commit.
```

### B13 — event backbone

```text
Run batch B13 from docs/services_packages_refactoring/event-architecture-plan.md.

Create packages/events, add the OutboxEvent model and migration, and add outbox
writes to every catalogued domain write. Every outbox row must be written in the
same transaction as its domain change — use a single withOutbox helper so this
cannot be bypassed. Build the relay with FOR UPDATE SKIP LOCKED.

Add a test proving a rolled-back domain transaction publishes no event.

Update migration-log.md and commit.
```

### B14 — notifications

```text
Run batch B14 from docs/services_packages_refactoring/event-architecture-plan.md.

Turn services/notifications into a real event consumer. Decide the store per
trigger T-07 and tell me which you chose and why. Add the list and mark-read
endpoints, and wire the apps/web /notifications route to real data.

Test idempotency by replaying the same event and asserting no duplicate.

Update migration-log.md and commit.
```

### Generic template

If you want something not on the list:

```text
Run batch B<NN> from docs/services_packages_refactoring/<doc>.md.
<any specific constraint or thing you want shown to you first>
Update migration-log.md and refactor-manifest.md, then commit.
```

---

## 5. Verify each batch yourself

After every batch, run these. They should all pass before you move on.

```bash
bun run check-types
```

```bash
bun run --cwd services/chat test && bun run --cwd services/resources test && bun run --cwd packages/shared test
```

```bash
bun run build
```

Then start the stack and click through the app:

```bash
bun run dev:services
```

```bash
bun run dev:web
```

Smoke-check the routes the batch touched — at minimum `/dashboard`, `/chat`, `/groups`,
`/resources`, and `/account`. For B09 you must also complete a full direct call.

If Turbo panics on the root commands (a known environment issue on this machine, recorded in
the web refactor log), use the per-workspace commands instead.

---

## 6. Where I will stop and ask you

These are genuine forks. Claude will pause rather than guess:

| Batch | Decision |
| --- | --- |
| B02 | Whether removing the `sync-user` dev fallback breaks your local OAuth flow |
| B04 | Whether the first-run "synthesise groups from a fixture" behaviour is intended product behaviour or a seeding artefact |
| B05 | How the gateway splits `/api/user` between `identity` and `core` |
| B09 | How Stream token minting stays byte-compatible during the move |
| B09 | Whether media's upload-scope check becomes an HTTP call or a gateway-signed claim |
| B10 | Whether to standardise response envelopes to `{ ok, data, error }` — it is a breaking change for `apps/web` call sites |
| B14 | Notification store: Postgres `jsonb` or MongoDB |

---

## 7. If something goes wrong

Every batch is one or more commits on this branch. Nothing is destructive.

```bash
git log --oneline refactor/services-packages-architecture
```

Undo the last batch, keeping the changes as uncommitted edits to inspect:

```bash
git reset --soft HEAD~1
```

Discard the last batch entirely:

```bash
git reset --hard HEAD~1
```

Or just say: `Roll back batch B0X and tell me what went wrong.`

**Do not squash batches together.** The commit boundary is the rollback boundary.

---

## 8. Progress tracker

Tick these off as you go.

- [x] **B01** Documentation — *complete 2026-09-04*
- [x] **B02** CI, Docker, turbo env, security baseline — *complete 2026-09-04 (issues #1–3, #15, #28–35, #37 resolved)*
- [x] **B03** Split `packages/shared` — *complete 2026-09-04 (issues #10, #11 resolved; new `@repo/contracts`/`@repo/service-kit`/`@repo/storage`)*
- [x] **B04** Seed extraction to `packages/seed` — *complete 2026-09-04 (issue #7, #9 resolved; `groupData` fallback removed per user decision)*
- [x] **B05** `identity` service (rename + profile absorption) — *complete 2026-09-05 (`services/auth` → `services/identity`; profile endpoints moved from `user`; gateway routing extracted to tested `routeRules.ts`; `AUTH_SERVICE_URL`/`PORT` fully renamed to `IDENTITY_SERVICE_URL`/`PORT`; live-verified against a disposable Postgres instance)*
- [ ] **B06** `core` service + `community` module
- [ ] **B07** `learning` module (fold in `resources`)
- [ ] **B08** `feed` + `dashboard` modules
- [ ] **B09** `messaging`, media de-DB, call extraction from `apps/web`
- [ ] **B10** Gateway modularization + final reconciliation
- [ ] **B11** Redis (presence, socket adapter, rate limiting)
- [ ] **B12** Cache-aside read paths
- [ ] **B13** Event backbone (outbox → Redis Streams)
- [ ] **B14** Notifications as first event consumer
- [ ] **B15+** Read models, search, DB extraction — *only when a trigger fires*

---

## 9. If you only do three things

Short on time? These three give the most value per unit of risk:

1. **B02** — your build cache is currently wrong and a dev auth bypass is reachable. Small,
   low risk, fixes real defects today.
2. **B09** — your frontend holds backend secrets and can impersonate the gateway. This is the
   one finding that is a genuine security problem rather than an architecture preference.
3. **B11** — you cannot run a second replica of `gateway` or `messaging` correctly. If you
   ever plan to scale, this is not optional.

Everything else is structural improvement that can proceed at whatever pace suits you.
