# Yome Event Architecture Plan

## Purpose

This document defines the asynchronous backbone: how domains publish facts, how other domains
consume them, and what guarantees the transport provides.

**The central sequencing decision: the event backbone is built while Yome is still on a single
database (P3), before any database is split (P5).** The transactional outbox pattern means an
event is written in the *same transaction* as the domain write it describes, so there is no
dual-write problem and no consistency risk while the shared database still provides the
fallback of a direct join. Consumers, contracts, idempotency, and replay all get proven under
easy conditions. When a database is later extracted, the publishing side does not change at
all — only the consumer's read path does.

Building events after a database split is the reverse order and is how projects end up with
silent data drift.

## Current State

Verified across the repository:

- **No message broker of any kind.** No Kafka, NATS, RabbitMQ, AMQP, BullMQ, or Redis
  dependency exists in any `package.json`.
- **No event, outbox, or publish/subscribe primitives** exist in `services/**` or
  `packages/**`.
- All cross-domain communication is either a synchronous Prisma join inside one process, or a
  synchronous HTTP call through the gateway.
- `services/notifications` is a stub that accepts a POST and returns `202` without doing
  anything. It is the obvious first event consumer and the proof that the backbone works.

## Transport Decision: Redis Streams

| Option | Verdict |
| --- | --- |
| **Redis Streams** | **Chosen.** Redis is already required by `data-architecture-plan.md` T-01/T-02 for presence, socket fan-out, and rate limiting — both triggers have already fired. Streams add consumer groups, at-least-once delivery, acknowledgement, pending-entry inspection, and replay with **zero additional infrastructure**. Adequate to five figures of events/sec, far beyond Yome's needs. |
| NATS JetStream | Better ergonomics and stronger ordering semantics at scale, but a second piece of infrastructure to run and monitor for no benefit at current volume. A reasonable future migration if event volume or subject-based routing outgrows Streams. |
| Kafka | Strongest durability, ordering, and replay, plus log-based CDC into analytics. Operationally heavy — unjustifiable for a system whose `deploy-services.yml` currently references a `Dockerfile.service` that does not exist in the repository. |
| Postgres `LISTEN`/`NOTIFY` | No durability, no consumer groups, no replay, payload size limits. Unsuitable as a backbone. |

The publisher and consumer runtime is wrapped in `packages/events` so the transport is
swappable. No service imports a Redis client directly for eventing.

## The Outbox Pattern

The single hard rule: **a domain event is written in the same database transaction as the
state change it describes.** Never publish to Redis inside a request handler and hope the
database commit succeeds.

```
┌──────────── one Postgres transaction ────────────┐
│  INSERT INTO "Group" (...)                       │
│  INSERT INTO "OutboxEvent" (type='community.     │
│      group.created', payload={...})              │
└──────────────────────────────────────────────────┘
                       │  commit
                       ▼
        ┌──────────────────────────────┐
        │  Outbox relay (poller)       │
        │  SELECT ... WHERE published_at IS NULL
        │  FOR UPDATE SKIP LOCKED      │
        └──────────────────────────────┘
                       │  XADD
                       ▼
        yome:events:community  (Redis Stream)
                       │  XREADGROUP
        ┌──────────────┴──────────────┐
        ▼                             ▼
  notifications                 dashboard read model
  (consumer group)              (consumer group)
```

### Outbox table

Added to `packages/database/prisma/schema.prisma` in B13. Owned by no domain — it is
infrastructure, written by every module.

```prisma
/// owner: infrastructure (written by every module, read only by the relay)
model OutboxEvent {
  id            String    @id @default(uuid())
  type          String
  version       Int       @default(1)
  subject       String
  producer      String
  correlationId String?
  causationId   String?
  actorUserId   Int?
  payload       Json
  occurredAt    DateTime  @default(now())
  publishedAt   DateTime?
  attempts      Int       @default(0)
  lastError     String?

  @@index([publishedAt, occurredAt])
  @@index([type])
  @@index([subject])
}
```

### Relay

A single relay loop, run inside `services/core` (and later inside each extracted service):

1. `SELECT ... WHERE published_at IS NULL ORDER BY occurred_at LIMIT 100 FOR UPDATE SKIP LOCKED`
   — `SKIP LOCKED` makes the relay safe to run in multiple replicas.
2. `XADD yome:events:<domain> * <envelope fields>` for each row.
3. `UPDATE ... SET published_at = now()`.
4. On failure: increment `attempts`, record `last_error`, retry with exponential backoff. Rows
   exceeding `attempts = 10` are logged and skipped, leaving the row for manual inspection.
5. Rows with `published_at` older than 7 days are pruned by a scheduled job.

Poll interval 200 ms; latency budget publish → consume p99 < 1 s.

## Event Envelope

Every event on every stream carries the same envelope. Payload shape is per event type.

```ts
type DomainEvent<TPayload> = {
  id: string;             // uuid — also the consumer idempotency key
  type: string;           // "community.group.member_joined"
  version: number;        // schema version, starts at 1
  subject: string;        // primary aggregate id ("group:3f2a...", "user:42")
  producer: string;       // "core" | "identity" | "messaging" | "media"
  occurredAt: string;     // ISO 8601, set at transaction time, not publish time
  correlationId?: string; // propagated from the gateway's x-request-id
  causationId?: string;   // id of the event that caused this one
  actorUserId?: number;   // who triggered it, when a user did
  payload: TPayload;
};
```

`correlationId` threads through from the gateway, which already generates `x-request-id`
(`services/gateway/src/index.ts`) and forwards it downstream. This makes a request traceable
across its synchronous hops *and* the asynchronous work it spawns.

Envelope types live in `@repo/contracts` so `apps/web` can also type them if events are ever
surfaced over a websocket.

## Stream Topology

One stream per producing domain. Per-domain streams give independent consumer lag, retention,
and replay.

| Stream key | Producer | Approx. volume |
| --- | --- | --- |
| `yome:events:identity` | identity | low |
| `yome:events:community` | core/community | medium |
| `yome:events:learning` | core/learning | medium |
| `yome:events:feed` | core/feed | high |
| `yome:events:messaging` | messaging | highest |
| `yome:events:media` | media | low |
| `yome:events:dlq` | relay + consumers | rare |

Trimming: `XADD ... MAXLEN ~ 100000` per stream, plus a scheduled `XTRIM MINID` to a 7-day
floor. Retention must exceed the longest expected consumer outage.

## Event Catalogue

Names are `<domain>.<aggregate>.<past-tense-verb>`. Events state **facts that already
happened**; they are never commands and never carry a request for action.

### identity

| Type | Subject | Payload | Primary consumers |
| --- | --- | --- | --- |
| `identity.user.registered` | `user:<id>` | `userId, email, username, firstname, lastname, createdAt` | notifications (welcome), community (seed suggestions) |
| `identity.user.profile_updated` | `user:<id>` | `userId, changed: { name?, username?, bio?, address?, profilePicture? }` | messaging (denormalised sender fields), search index, dashboard read model |
| `identity.user.password_changed` | `user:<id>` | `userId, changedAt` | notifications (security alert) |

### community

| Type | Subject | Payload | Primary consumers |
| --- | --- | --- | --- |
| `community.group.created` | `group:<id>` | `groupId, slug, name, subject, category, creatorUserId` | search index, dashboard |
| `community.group.member_joined` | `group:<id>` | `groupId, userId, role: "member" \| "admin"` | notifications, dashboard, feed (visibility) |
| `community.group.invitation_created` | `group:<id>` | `invitationId, groupId, userId, invitedByUserId` | notifications |
| `community.group.announcement_posted` | `group:<id>` | `announcementId, groupId, authorId, title, pinned` | notifications |
| `community.event.scheduled` | `group:<id>` | `eventId, groupId, title, type, startsAt, location` | notifications (reminders), dashboard |
| `community.connection.followed` | `user:<followerId>` | `followerId, followeeId` | **messaging (DM/call eligibility projection)**, notifications, dashboard |
| `community.connection.unfollowed` | `user:<followerId>` | `followerId, followeeId` | messaging, dashboard |

`community.connection.followed` / `.unfollowed` are the highest-value events in the catalogue.
`services/chat/src/controllers/message.controller.ts` currently calls `isConnectedDirectPeer`,
which reaches directly into community-owned follow edges to decide whether a direct message or
call is permitted. These two events are what replace that cross-domain read with a locally
maintained projection.

### learning

| Type | Subject | Payload | Primary consumers |
| --- | --- | --- | --- |
| `learning.resource.created` | `resource:<id>` | `resourceId, slug, authorId, groupId?, subject, topic, level, type` | search index, notifications (group members), dashboard |
| `learning.resource.saved` | `resource:<id>` | `resourceId, userId` | dashboard, author notification |
| `learning.resource.unsaved` | `resource:<id>` | `resourceId, userId` | dashboard |
| `learning.resource.marked_helpful` | `resource:<id>` | `resourceId, userId` | notifications (author), dashboard |
| `learning.studyroom.started` | `studyroom:<id>` | `studyRoomId, slug, title, groupId?` | dashboard, notifications |
| `learning.studyroom.participant_joined` | `studyroom:<id>` | `studyRoomId, userId` | dashboard |

### feed

| Type | Subject | Payload | Primary consumers |
| --- | --- | --- | --- |
| `feed.post.created` | `post:<id>` | `postId, slug, authorId, groupId?, kind, tags` | dashboard read model, notifications, search index |
| `feed.post.commented` | `post:<id>` | `commentId, postId, authorId` | notifications (post author), dashboard |
| `feed.post.liked` | `post:<id>` | `postId, userId` | notifications, dashboard |

### messaging

| Type | Subject | Payload | Primary consumers |
| --- | --- | --- | --- |
| `messaging.conversation.created` | `conversation:<id>` | `conversationId, participantAId, participantBId` | dashboard |
| `messaging.message.sent` | `conversation:<id>` or `group:<id>` | `messageId, conversationId?, groupId?, senderId, receiverId?, type, createdAt` | **notifications (push/email when recipient offline)**, dashboard unread counts |
| `messaging.message.read` | `conversation:<id>` | `messageId, readerId, readAt` | notifications (clear pending) |

`messaging.message.sent` is what finally makes `services/notifications` real: the socket layer
already handles delivery to *online* users; this event handles everyone else.

### media

| Type | Subject | Payload | Primary consumers |
| --- | --- | --- | --- |
| `media.asset.uploaded` | `asset:<key>` | `key, url, contentType, target, ownerUserId` | audit, future moderation pipeline |

## Consumer Map

| Consumer group | Service | Subscribes to | Purpose |
| --- | --- | --- | --- |
| `notifications` | notifications | identity, community, learning, feed, messaging | Create and deliver notification records. The primary P3 consumer. |
| `dashboard-readmodel` | core | community, learning, feed, messaging | Maintain the materialised dashboard (`data-architecture-plan.md` T-03). |
| `search-index` | core | community, learning | Maintain the resource/group search index (T-04). |
| `messaging-connections` | messaging | community (`connection.*`) | Local follow-edge projection for DM/call eligibility. |
| `messaging-userprofile` | messaging | identity (`user.profile_updated`) | Keep denormalised sender/receiver display fields current. |

## Delivery Guarantees and Consumer Rules

**At-least-once delivery. Consumers must be idempotent. There is no exactly-once.**

1. **Idempotency is mandatory.** Every consumer checks `yome:consumed:<group>:<eventId>`
   (Redis `SET NX` with 24 h TTL) before processing, or relies on a naturally idempotent
   operation (`UPSERT` keyed by event id). A consumer that is not idempotent is a bug.
2. **Acknowledge after side effects commit,** never before. `XACK` follows the database write.
3. **Ordering is per stream, not global.** With multiple consumers in a group, Redis
   distributes entries and per-subject ordering is lost. For an order-sensitive consumer,
   either run a single consumer in that group, or hash-partition the subject across N streams.
   State the ordering requirement in the consumer's own README.
4. **Retry with backoff.** Unacknowledged entries are recovered with `XPENDING` / `XCLAIM`
   after a 30 s idle threshold. After 5 delivery attempts the entry is moved to
   `yome:events:dlq` with the original envelope plus the failure reason.
5. **The DLQ is monitored, not ignored.** Any DLQ entry is an alert. Replay is a manual,
   audited operation.
6. **Consumers never call back into the producer synchronously** to enrich an event. If a
   consumer needs a field, the event carries it or the consumer maintains a projection.
7. **Events are facts, not commands.** `notifications` decides what to send; producers never
   emit `notifications.send_email`.

## Schema Evolution

- The `version` field starts at `1` per event type.
- **Additive changes** (new optional payload field) do not bump the version. Consumers must
  tolerate unknown fields.
- **Breaking changes** (removing or retyping a field, changing semantics) bump the version and
  publish **both** versions until every consumer has migrated. Consumers declare which
  versions they accept.
- Event types are **never renamed**. A rename is a new type plus a deprecation window.
- Payload schemas are defined as zod schemas in `@repo/contracts`, giving both producers and
  consumers a single validated definition. The relay validates on publish; consumers validate
  on receive and DLQ anything that fails.

## Local Development

- `docker-compose.yml` (added in B11) provides Postgres + Redis.
- `bun run dev:services` continues to work with an empty Redis; presence and streams degrade
  gracefully.
- A `bun run events:tail` script (`XREAD` from `$`) prints live events for debugging.
- The outbox relay runs in-process during development; in production it can run as its own
  process if publish latency demands it.

## Batches

### B13 — Event Backbone (P3)

- **Purpose:** publish domain events from the transactional outbox to Redis Streams, still on
  one database.
- **Scope:** new `packages/events` (envelope types, publisher, consumer runtime, DLQ, idempotency
  helper); `OutboxEvent` model + migration in `packages/database`; outbox writes added to
  `identity`, `core/community`, `core/learning`, `core/feed`, `messaging`; the relay loop;
  event zod schemas in `@repo/contracts`.
- **Dependencies:** B10 (module boundaries — you cannot emit `community.*` until `community`
  is a real module), B11 (Redis).
- **Expected changes:** every domain write that appears in the catalogue also writes an outbox
  row **in the same transaction**. No consumer behaviour change yet beyond B14.
- **Validation:** `bun run check-types`; integration test asserting that a rolled-back domain
  transaction leaves no outbox row; relay publishes and marks rows; `XPENDING` empty after a
  consumer run; publish→consume p99 < 1 s measured locally.
- **Risks:** an outbox write outside the domain transaction silently reintroduces dual-write —
  enforce via a single `withOutbox(tx, event)` helper and code review; relay hot-looping on a
  poison row — capped by `attempts`.
- **Definition of Done:** every catalogue event is published; no `prisma.$transaction` in a
  cataloged write path lacks its outbox row; DLQ and replay are exercised at least once.

### B14 — Notifications as the First Consumer (P3)

- **Purpose:** turn the 202 stub into a real, event-driven service and prove the backbone.
- **Scope:** `services/notifications` — consumer group, notification store (T-07 decision),
  read/unread state, delivery adapters (in-app first; email/push behind an interface).
- **Dependencies:** B13.
- **Expected changes:** `services/notifications/src/routes/notifications.routes.ts` keeps its
  `/send` endpoint for direct sends but the primary path becomes event consumption; new
  endpoints for listing and marking notifications read; `apps/web` `/notifications` route
  gains a real data source (it currently has none).
- **Validation:** send a message to an offline user and assert a notification record is
  created exactly once; replay the same event and assert no duplicate; kill the consumer
  mid-batch and assert recovery via `XCLAIM`.
- **Risks:** notification storms from bulk operations (seeding, group creation with many
  members) — add per-user rate limiting and aggregation windows.
- **Definition of Done:** `notifications` consumes from at least three domains, is idempotent
  under replay, and `User.notificationCount` (currently a hardcoded default of `3` in the
  schema) reflects real data.

### B18+ — Event-Driven Projections After a Split (P5)

- **Purpose:** replace cross-domain reads with locally maintained projections.
- **Scope:** `messaging-connections` and `messaging-userprofile` consumers; whatever a split
  domain needs.
- **Dependencies:** B13, B14, and a fired extraction trigger.
- **Status:** **not scheduled.** Opened alongside the corresponding B17+ extraction.

## Open Questions

| # | Question | Needed by |
| --- | --- | --- |
| 1 | Does the relay run in-process or as its own deployable? Depends on publish-latency budget under load. | B13 |
| 2 | Which consumers are order-sensitive enough to require a single consumer per group rather than a partitioned one? | B13 |
| 3 | Notification aggregation policy — per-event, or windowed digests for high-volume groups? | B14 |
| 4 | Delivery channels for notifications beyond in-app (email provider, web push) and who owns those credentials. | B14 |
| 5 | Event retention window — must exceed the longest tolerable consumer outage; proposed 7 days. | B13 |
