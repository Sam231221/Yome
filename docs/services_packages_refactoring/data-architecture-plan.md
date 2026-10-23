# Yome Data Architecture Plan

## Purpose

`architecture-plan.md` covers **code and process boundaries** on a single PostgreSQL
database. This document covers **where data lives**: which store owns which model, when a
model should move to a different store, and what measurable signal justifies the move.

The governing rule: **a store change requires a trigger, not an aspiration.** Every move
below names a signal, a threshold, and how to measure it. Nothing moves because a technology
"feels right" for a workload shape.

## Current State

- **One PostgreSQL instance**, one Prisma schema (`packages/database/prisma/schema.prisma`),
  one generated client shared by every service via `@repo/database`.
- **No Redis, MongoDB, Kafka, NATS, or AMQP dependency exists anywhere in the repo**
  (verified across every `package.json`).
- **No caching layer.** Every read hits Postgres.
- **No search index.** `/explore` and group/resource search use Prisma
  `contains` + `mode: "insensitive"`, which compiles to unindexed `ILIKE '%term%'`.
- **Two pieces of process-local state block horizontal scaling today:**
  - `services/chat/src/state/online-users.ts:2` — `new Map<string, Set<string>>()` holding
    userId → socketIds. Presence is per-replica.
  - `services/gateway/src/index.ts:79` — `requestBuckets` rate-limit map. Per-replica, so N
    gateway replicas grant N× the configured limit.
- `services/chat/src/socket/handlers.ts` fans out with
  `socket.to(socketId).emit(...)` using ids from that local map. Sockets connected to a
  different replica are invisible.

`packages/database/SCHEMA_OWNERSHIP.md:18` already records the intent:
"Future: split into per-service Prisma schemas ... and optionally separate databases." This
document supplies the missing part — *when*.

## Phase Model

Phases are gated, not scheduled. Each phase depends on the previous one being complete.

| Phase | Theme | Batches | Gate to enter |
| --- | --- | --- | --- |
| **P1** | Code + process boundaries, one DB | B01–B10 (`architecture-plan.md`) | — |
| **P2** | Shared runtime state (Redis) | B11–B12 | P1 complete: one writer per table |
| **P3** | Event backbone, still one DB | B13–B14 (`event-architecture-plan.md`) | P2 complete: Redis available |
| **P4** | Read models + search | B15–B16 | P3 complete: events flowing, consumers proven |
| **P5** | First database extraction | B17+ | A P5 trigger below has actually fired |
| **P6** | Further extraction / polyglot | — | Per-domain trigger fired |

**Most systems should stop at P4.** P1–P4 remove the real pain (unscalable presence,
uncacheable reads, a 7-way dashboard join, unindexed search) without paying for eventual
consistency, lost foreign keys, distributed debugging, or a second ops surface. P5 and P6
are legitimate but must be earned by measurement.

## Target Store per Model

`Owner` is the module from `architecture-plan.md`. `Store now` is where the model lives after
P1. `Store target` is where it should end up *if its trigger fires*.

| Model(s) | Owner | Store now | Store target | Trigger to move |
| --- | --- | --- | --- | --- |
| `User`, `UserProfile` | identity | Postgres | **Postgres — never moves** | None. Relational, FK-heavy, low volume, strongly transactional. |
| `Group`, `GroupTag`, `GroupInvitation`, `GroupAnnouncement`, `GroupEvent`, follow edges (`_Followers`) | community | Postgres | **Postgres — never moves** | None. Join-heavy and small. A graph store is only justified above ~100M edges with multi-hop traversal requirements; Yome will not reach this. |
| `Resource`, `ResourceSave`, `ResourceHelpfulVote`, `StudyRoom`, `StudyRoomParticipant`, `Topic` | learning | Postgres | **Postgres (write) + search index (read)** | See "Search index" below. The rows stay in Postgres permanently; only a read projection is added. |
| `Post`, `Comment`, `Like` | feed | Postgres | **Postgres (write) + Redis-cached read model** | See "Dashboard / feed read model" below. Rows stay in Postgres. |
| `Messages`, `Conversation` | messaging | Postgres | **Postgres → dedicated Postgres → (only then) document/wide-column store** | See "Messaging store" below. Two separate, ordered triggers. |
| Presence (online users) | messaging | **in-process `Map`** | **Redis** | **Already fired.** Any horizontal scaling of `messaging`. |
| Socket fan-out routing | messaging | direct socket ids | **Redis pub/sub (`socket.io-redis-adapter`)** | **Already fired.** Same as above. |
| Rate-limit buckets | edge | **in-process `Map`** | **Redis** | **Already fired.** Any horizontal scaling of `gateway`. |
| Notification records | notifications | *none — service is a 202 stub* | **Postgres, or MongoDB if payloads stay schemaless** | Notifications becoming a real feature (P3/B14). |
| Session / JWT | identity (NextAuth) | signed cookie | **unchanged** | None. Stateless by design; do not add a session store. |
| Object assets (images, audio, avatars) | media | S3 | **unchanged** | None. Already correct. |

## Trigger Definitions

Each trigger names the signal, the threshold, and the measurement. A move is only approved
when the measurement is recorded in `migration-log.md`.

### T-01 — Redis for presence and socket fan-out (**FIRED**)

- **Signal:** running more than one `messaging` replica.
- **Threshold:** ≥ 2 replicas, or any autoscaling policy that permits ≥ 2.
- **Measurement:** deployment replica count.
- **Status:** the system cannot scale `messaging` horizontally *at all* today without silent
  presence and delivery bugs. This is a correctness defect, not an optimisation.
- **Action (B11):** move `online-users` to Redis (hash `yome:presence:user:<id>` → socket id
  set, with TTL heartbeat); add `@socket.io/redis-adapter` so `emit` crosses replicas.

### T-02 — Redis for gateway rate limiting (**FIRED**)

- **Signal:** running more than one `gateway` replica.
- **Threshold:** ≥ 2 replicas.
- **Measurement:** deployment replica count.
- **Status:** `GATEWAY_RATE_MAX_REQUESTS` is silently multiplied by replica count today.
- **Action (B11):** replace `requestBuckets` with a Redis sliding-window or token-bucket
  counter keyed `yome:ratelimit:<ip>:<path>`.

### T-03 — Dashboard / feed read model

- **Signal:** latency or query cost of `GET /api/user/dashboard/:loggedInUserId`, which
  currently issues **7 parallel Prisma queries** across `User`, `Post`, `StudyRoom`,
  `GroupEvent`, `User`, `Topic`, and `Group` in a single `Promise.all`.
- **Threshold:** p95 > 300 ms, **or** > 50 req/s sustained, **or** the query fan-out crosses
  a database boundary (i.e. P5 lands first).
- **Measurement:** gateway access logs (`x-request-id` correlated) + Postgres
  `pg_stat_statements`.
- **Action (B15):** materialise a per-user dashboard read model in Redis, invalidated and
  rebuilt from domain events (`feed.post.created`, `community.group.member_joined`,
  `learning.studyroom.started`, …). Cache-aside first; event-driven rebuild second.

### T-04 — Search index for explore / resources / groups

- **Signal:** `ILIKE '%term%'` cannot use a B-tree index, so every search is a sequential
  scan over `Resource` and `Group`.
- **Threshold:** `Resource` rows > 50 000, **or** search p95 > 200 ms, **or** a product
  requirement for relevance ranking, typo tolerance, or faceting.
- **Measurement:** `SELECT count(*) FROM "Resource"`; `pg_stat_statements` for the search
  queries.
- **Action (B16), in order:**
  1. **Postgres full-text first** — `tsvector` generated column + GIN index, plus `pg_trgm`
     for fuzzy matching. This is free, keeps one store, and handles the first order of
     magnitude.
  2. **OpenSearch / Elasticsearch only if** relevance tuning, faceting, or cross-entity
     search demands it. Fed by `learning.resource.*` and `community.group.*` events.

### T-05 — Messaging on its own PostgreSQL database

- **Signal:** `Messages` volume, or a retention/backup policy that differs from the rest of
  the system.
- **Threshold:** `Messages` rows > 50 M, **or** sustained write rate > 500 writes/s, **or**
  messaging requires a different backup window / retention / PITR policy than identity and
  community data.
- **Measurement:** row count; `pg_stat_user_tables.n_tup_ins` delta over time.
- **Prerequisite before moving:** **partition `Messages` in the existing Postgres first**
  (range on `createdAt`, or hash on `conversationId`). Partitioning typically buys an order
  of magnitude and costs a migration, not an architecture.
- **Action (B17+):** extract `Messages` + `Conversation` to a dedicated Postgres instance.
  `senderId` / `receiverId` / `groupId` become soft references; the messaging service keeps a
  local projection of the user and group fields it needs (name, username, profilePicture),
  fed by `identity.user.*` and `community.group.*` events.

### T-06 — Messaging on a document or wide-column store

- **Signal:** write throughput or retention beyond what a single partitioned Postgres serves.
- **Threshold:** sustained write rate > 5 000 writes/s, **or** retention > 1 TB, **or** a
  requirement for per-conversation sharding across nodes.
- **Measurement:** as T-05, after partitioning is already in place.
- **Action:** MongoDB (time-series or standard collections, sharded on `conversationId`) or
  Cassandra/ScyllaDB (partition key `conversationId`, clustering key `createdAt DESC` — the
  natural fit for "last N messages in a thread").
- **Cost to accept, explicitly:** `Messages` currently has foreign keys to `User` (sender and
  receiver), `Conversation`, and `Group`. All four are lost. Sender/receiver display fields
  must be denormalised into each message document and kept current via
  `identity.user.profile_updated` events. Message search requires a separate index. Read
  receipts (`messageStatus`) become a separate write path.
- **Recommendation:** do not schedule this. Yome has no deployment pipeline today
  (`deploy-services.yml` references a `Dockerfile.service` that does not exist). Revisit only
  when T-05 has already been executed and its ceiling is measured.

### T-07 — Notifications store

- **Signal:** `services/notifications` becoming a real feature rather than a 202 stub.
- **Threshold:** the first real consumer requirement (in-app notification list, read state,
  delivery retry).
- **Action (B14):** notification records need schemaless payloads (different shape per event
  type), high write volume, and TTL expiry. **MongoDB is a genuinely good fit here** — better
  than for chat history. Postgres with a `jsonb` payload column is also acceptable and keeps
  the store count at one. Decide at B14 based on whether delivery-state querying needs joins.

## Redis Introduction (P2 / B11–B12)

Redis is the first additional store and the only one whose trigger has already fired. It is
introduced as `packages/cache` exporting a shared client plus typed helpers.

| Concern | Key pattern | Structure | TTL |
| --- | --- | --- | --- |
| Presence | `yome:presence:user:<userId>` | SET of socket ids | 60 s, refreshed by heartbeat |
| Presence index | `yome:presence:online` | SET of userIds | maintained on add/remove |
| Socket.IO adapter | managed by `@socket.io/redis-adapter` | pub/sub | — |
| Rate limiting | `yome:ratelimit:<ip>:<path>` | sorted set (sliding window) | window length |
| Dashboard cache | `yome:cache:dashboard:<userId>` | JSON string | 60 s + event invalidation |
| Group discover cache | `yome:cache:groups:discover:<queryHash>` | JSON string | 300 s |
| Resource list cache | `yome:cache:resources:<queryHash>` | JSON string | 300 s |
| Event streams | `yome:events:<domain>` | stream | see `event-architecture-plan.md` |
| Consumer idempotency | `yome:consumed:<consumer>:<eventId>` | string | 24 h |

Rules:

- **Redis is never the system of record.** Every value above is either derivable from
  Postgres or is ephemeral runtime state (presence). Losing Redis degrades performance and
  drops presence; it must never lose durable data.
- Presence loss on Redis restart is acceptable — clients re-announce via the `add-user`
  socket event on reconnect.
- Cache invalidation is event-driven where an event exists, TTL-only otherwise. Never
  invalidate by scanning keys.
- Deployment: managed Redis (ElastiCache / Upstash / Redis Cloud) with AOF or RDB persistence
  enabled for stream durability, but the system must tolerate a cold Redis.

## Database Split Mechanics (P5, when triggered)

When a domain's store trigger fires, the extraction follows a fixed sequence. Do not
improvise this order.

1. **Prerequisite: the domain must already be a `core` module or its own service with one
   writer per table**, and its events must already be published (P3). Never split first.
2. **Split the Prisma schema before the database.** Move the domain's models into
   `packages/database/prisma/<domain>.prisma` with its own generated client, still pointing
   at the same `DATABASE_URL`. Compile-time isolation, zero runtime change.
3. **Replace cross-schema relations with soft references.** A `Messages.senderId` that no
   longer has a Prisma relation to `User` becomes a plain `Int` with an application-level
   contract. Fix every broken `include` before proceeding.
4. **Stand up the local projection.** The extracted service builds and backfills its own copy
   of the foreign fields it renders (username, profilePicture, group name) from events. Run
   this in production against the shared DB until the projection is proven consistent.
5. **Point the new schema at a new `DATABASE_URL`.** Dual-write or replicate-then-cut,
   depending on downtime tolerance.
6. **Delete the old tables** only after a full retention window with no reads.

**Consistency contract after any split:** cross-domain reads become **eventually consistent**,
with a stated staleness budget per projection (proposed default: 5 s p99). Anything requiring
strong consistency must live in the same database as its transaction. Notably: a message's
`messageStatus` and its `Conversation` must never be split apart.

## Cross-Domain Reads That Break Under a Split

These exist in the code today and each needs an explicit answer before its domain is split.
They are the concrete cost of P5.

| # | Read | Location | Crosses | Resolution |
| --- | --- | --- | --- | --- |
| 1 | `isConnectedDirectPeer` — `prisma.user.count({ where: { id: callerId, following: { some: { id: peerId } } } })` | `services/chat/src/controllers/message.controller.ts` | messaging → community | Local follow-edge projection fed by `community.connection.followed` / `.unfollowed` |
| 2 | `getChatUploadScope` — reads `Conversation` / `Group` to authorise an upload | `services/media/src/controllers/media.controller.ts` | media → messaging + community | Gateway-injected scope claim, or a sync call to `messaging` (already scheduled in B09) |
| 3 | `getGroupDetail` — `include: { resources: {...} }` | `services/user/src/controllers/user.controller.ts` | community → learning | In-process module call at P1; sync HTTP or projection after a split |
| 4 | `getLearningProjects` — `prisma.post.findMany({ where: { kind: "Project" } })` | `services/user/src/controllers/user.controller.ts` | learning → feed | In-process module call; "projects" is a view over feed-owned `Post` |
| 5 | `getLearningEvents` — `prisma.groupEvent.findMany` | `services/user/src/controllers/user.controller.ts` | learning → community | In-process module call; `GroupEvent` is community-owned |
| 6 | `getDashboardHome` — 7-way parallel fan-out | `services/user/src/controllers/user.controller.ts` | dashboard → everything | Read model (T-03/B15) |
| 7 | Message list `include: { sender: true, receiver: true }` | `services/chat/src/controllers/message.controller.ts` | messaging → identity | Denormalise display fields into the message, refreshed by `identity.user.profile_updated` |

Items 3–5 are cheap today (same process, same DB) and expensive after a split. This is a
direct argument for keeping community, learning, and feed as **`core` modules** rather than
separate services with separate databases — exactly the decision recorded in
`service-decomposition-plan.md`.

## Batches

### B11 — Redis Foundation (P2)

- Purpose: eliminate process-local state that blocks horizontal scaling.
- Scope: new `packages/cache`; `services/chat/src/state/online-users.ts`;
  `services/chat/src/socket/handlers.ts`; `services/gateway/src/index.ts` rate limiter.
- Dependencies: B10 (or B09 for the messaging half — can run in parallel with B05–B08).
- Expected changes: Redis-backed presence with heartbeat TTL; `@socket.io/redis-adapter`;
  Redis sliding-window rate limiting; `REDIS_URL` added to `turbo.json` `globalEnv`, root
  `.env`, and the deploy workflows.
- Validation: run 2 `messaging` replicas and 2 `gateway` replicas locally; confirm presence
  is consistent across replicas, cross-replica message delivery works, and the rate limit is
  enforced globally rather than per-replica.
- Risks: presence heartbeat tuning; Redis becoming a single point of failure for chat —
  mitigate with a degraded mode where presence returns empty rather than erroring.
- Definition of Done: no `new Map<...>` holding cross-request state remains in
  `services/messaging` or `services/gateway`; both scale to N replicas correctly.

### B12 — Cache-Aside Read Paths (P2)

- Purpose: remove repeated Postgres load from the hottest reads.
- Scope: dashboard, group discover, resource list.
- Dependencies: B11.
- Expected changes: cache-aside with the key patterns above; TTL only (event invalidation
  arrives in B15).
- Validation: measure p95 before and after; record both in `migration-log.md`.
- Risks: serving stale group membership or save state — keep TTLs short and never cache
  per-viewer mutable flags (`isJoined`, `isSaved`, `isHelpful`) inside a shared cache entry.
- Definition of Done: cached endpoints have a recorded before/after p95 and documented TTLs.

### B15 — Dashboard Read Model (P4)

- Purpose: retire the 7-way dashboard join.
- Scope: `core/modules/dashboard`; event consumers.
- Dependencies: B13 (events), B12 (cache).
- Trigger: T-03.
- Definition of Done: the dashboard endpoint serves from a materialised model; the fan-out
  query runs only on cold rebuild.

### B16 — Search Index (P4)

- Purpose: make explore/resource/group search indexable.
- Scope: `learning` and `community` read paths.
- Dependencies: B13.
- Trigger: T-04.
- Definition of Done: Postgres FTS in place with GIN indexes; OpenSearch only if the
  relevance/faceting threshold is documented as met.

### B17+ — Database Extraction (P5)

- Purpose: move a domain to its own database.
- Scope: per the "Database Split Mechanics" sequence.
- Dependencies: B13, B14, and the relevant trigger recorded as fired.
- Status: **not scheduled.** Opened only when T-05 (or a peer trigger) is measured and
  recorded in `migration-log.md`.

## Environment Variables Added

| Variable | Phase | Purpose |
| --- | --- | --- |
| `REDIS_URL` | P2 | Shared Redis connection for presence, rate limiting, cache, streams |
| `REDIS_PRESENCE_TTL_SECONDS` | P2 | Presence heartbeat expiry (default 60) |
| `CACHE_TTL_DASHBOARD_SECONDS` | P2 | Dashboard cache TTL (default 60) |
| `EVENT_STREAM_PREFIX` | P3 | Stream key namespace (default `yome:events`) |
| `<DOMAIN>_DATABASE_URL` | P5 | Per-domain connection string, added only at extraction |

All must be registered in `turbo.json` `globalEnv` and documented in `README.md` in the same
batch that introduces them.

## Open Questions

| # | Question | Needed by |
| --- | --- | --- |
| 1 | Managed Redis provider and persistence mode (AOF vs RDB) — affects stream durability guarantees | B11 |
| 2 | Acceptable presence staleness on Redis failover (degrade to "all offline" vs last-known) | B11 |
| 3 | Notification store: Postgres `jsonb` vs MongoDB — depends on whether delivery-state queries need joins | B14 |
| 4 | Current `Messages` row count and insert rate — required to know how far T-05 actually is | before any P5 discussion |
| 5 | Retention policy for messages and notifications — drives partitioning strategy and T-05/T-06 | B17 |
