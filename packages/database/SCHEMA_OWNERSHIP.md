# Schema ownership (single DB, ownership by code)

All services share one database and one Prisma schema in this package (`prisma/schema.prisma`,
which also carries an `/// owner: <module>` doc comment on every model — added in B10 to keep
this file honest against drift). Ownership is enforced by **which service/module is allowed to
write** to which tables — the schema is not partitioned yet (see "Future" below).

This is a full, one-row-per-model table (20 models, matching `schema.prisma` exactly) — B10's
rewrite of the table-group-with-narrative-notes version B01–B08 built up incrementally, plus
`OutboxEvent` (B13) and `Notification` (B14).

| Model | Owning module | Access | Notes |
| --- | --- | --- | --- |
| `User` | `identity` | RW | Sole writer of `User` rows (registration, credential/password changes, profile update, avatar). Two exceptions: the `following`/`followers` self-relation is written by `core`'s community module (follow/unfollow); `User.notificationCount` is written by `services/notifications` (B14) to track the live unread count. The `User` row itself still belongs to `identity`. Renamed from `Auth` in B05, which absorbed profile read/update/avatar from the then-`services/user`. |
| `UserProfile` | `identity` | RW | One-to-one with `User`; same writer. |
| `Messages` | `messaging` | RW | Only `messaging` creates/updates messages (including read-receipt status updates). `media` never persists a message — it uploads a file and returns a URL; `messaging`'s `add-media-message` endpoint does the write. Renamed from `Chat` in B09. |
| `Conversation` | `messaging` | RW | Direct-conversation records (`get-or-create-direct-conversation`, `prepare-direct-call-conversation`) and the direct-call flow's authorization checks (`validate-direct-conversation`) both live in `messaging`'s `calls` module. Missing from this table before the B10 rewrite — a real gap, not a rename. |
| `Group` | `core` / `community` | RW | Group CRUD, membership. Read cross-domain by `messaging` (`isGroupParticipant`, group-chat access checks) and by `core`'s own `learning`/`dashboard` modules in-process — tolerated at P1 (single DB); see `data-architecture-plan.md`'s cross-domain-read table for the post-split resolution. Moved from `services/user` in B06. |
| `GroupTag` | `core` / `community` | RW | Moved from `services/user` in B06. |
| `GroupInvitation` | `core` / `community` | RW | Moved from `services/user` in B06. |
| `GroupAnnouncement` | `core` / `community` | RW | Moved from `services/user` in B06. |
| `GroupEvent` | `core` / `community` (write) + `core` / `learning` (read-only) | RW (community) / R (learning) | Community owns the per-group event sub-list returned by group-detail reads; `learning`'s cross-group events feed (`getLearningEvents`) reads the same table as a different *view*, not a fork of ownership. Moved from `services/user` in B06 (community) and B07 (the learning read). |
| `Post` | `core` / `feed` (designated owner) + `core` / `learning` (read-only view) | R only, both modules | No create-post/comment/like endpoint exists anywhere in the app yet, so there is nothing to enforce a write boundary on — `feed` is simply the designated owner for whichever service builds the first write endpoint. `feed`'s `getRecentPosts` serves the dashboard's feed widget; `learning`'s `getLearningProjects`/`getLearningProjectById` read `Post` rows where `kind="Project"` as a learning-facing view over feed-owned data. Added as a Core-owned table in B08. |
| `Comment` | `core` / `feed` | R only (no writer exists) | Same no-write-endpoint-yet situation as `Post`. Added in B08. |
| `Like` | `core` / `feed` | R only (no writer exists) | Same. Added in B08. |
| `Resource` | `core` / `learning` | RW | Resource CRUD. Moved verbatim from the deleted `services/resources` in B07; external `/api/resources` path unchanged. |
| `ResourceSave` | `core` / `learning` | RW | Moved from `services/resources` in B07. |
| `ResourceHelpfulVote` | `core` / `learning` | RW | Moved from `services/resources` in B07. |
| `StudyRoom` | `core` / `learning` | R only (no writer exists) | `getLiveStudyRooms` is the one reader; `core`'s dashboard module composes it instead of querying the table directly (since B08). No write path exists in any service yet. |
| `StudyRoomParticipant` | `core` / `learning` | R only (no writer exists) | Same — read alongside `StudyRoom`. |
| `Topic` | `core` / `learning` | R only (no writer exists) | `getTrendingTopics` is the one reader, same pattern as `StudyRoom`. |
| `OutboxEvent` | infrastructure (not a domain) | W by every module's `withOutbox` transaction, R by the outbox relay only | The transactional-outbox table — one row written in the same transaction as every catalogued domain write, drained to Redis Streams by `@repo/events`' relay running in `core`. Added in B13; was missing from this table until B14 filled the gap. |
| `Notification` | `notifications` | RW | Every row is created by the `notifications` event consumer from a domain event (`@repo/events`' `startConsumer`, consumer group `notifications` over all `yome:events:*` streams); the list / mark-read / read-all HTTP endpoints in `services/notifications` are the only other access. Also writes `User.notificationCount` in the same transaction. Added in B14. |

## Boundaries (by service/module, not by table — cross-reference with the table above)

- **`gateway`**: No database access. Pure HTTP reverse proxy (`services/gateway/src/middleware/proxy.ts`) plus session/token auth (`middleware/auth.ts`) — never imports `@repo/database`.
- **`identity`** (renamed from `Auth` in B05): Reads/writes `User`, `UserProfile`. Uses `@repo/database` directly.
- **`core`, community module** (added in B06): Reads/writes `Group`, `GroupTag`, `GroupInvitation`, `GroupAnnouncement`, `GroupEvent`; writes the `following`/`followers` relation on `User` without owning `User` itself. Uses `@repo/database`.
- **`core`, learning module** (added in B07): Reads/writes `Resource`, `ResourceSave`, `ResourceHelpfulVote`; reads (does not write) `GroupEvent`, `Post` (`kind="Project"` rows), `StudyRoom`, `StudyRoomParticipant`, `Topic`. Uses `@repo/database`.
- **`core`, feed module** (added in B08): Designated owner of `Post`, `Comment`, `Like` — read-only in practice today (no write endpoint exists for any of the three). Uses `@repo/database`.
- **`core`, dashboard module** (added in B08): No table ownership of its own. Composes `community`'s (`getSidebarGroups`/`getUpcomingEvents`), `learning`'s (`getLiveStudyRooms`/`getTrendingTopics`), and `feed`'s (`getRecentPosts`) read surfaces instead of querying their tables directly. Still directly queries `User` itself (profile lookup, suggested-people), since `User` belongs to `identity`, a separate deployable service dashboard can't call in-process.
- **`messaging`** (renamed from `Chat` in B09): Reads/writes `Messages`, `Conversation`; also owns direct-call setup (Stream token minting + participant provisioning, absorbed from `apps/web/actions/stream.actions.ts` in B09) and the `authorize-upload-scope` endpoint `media` calls. Reads `Group`/`User.following` cross-domain for chat/call authorization (tolerated at P1 — see `data-architecture-plan.md`). Uses `@repo/database`.
- **`media`**: Does not import `@repo/database` (enforced since B09 — previously read `Conversation`/`Group` directly to authorise uploads). It only uploads files and returns URLs. Its one permitted service-to-service call is `POST /api/chat/authorize-upload-scope` on `messaging`, replacing that direct read.
- **`notifications`** (real event consumer since B14): Reads/writes `Notification`; writes `User.notificationCount` (unread-count tracking only). Consumes every `yome:events:*` stream as consumer group `notifications` and turns domain facts into notification rows; also keeps the pre-existing `POST /api/notifications/send` stub for direct/system sends. Store decision per trigger T-07: **Postgres `jsonb` payload column**, not MongoDB — keeps the store count at one for P3, lets `notificationCount` stay consistent in-transaction, and needs no new infra. Uses `@repo/database`.

## Future

Split into per-service Prisma schemas (each service with its own `prisma/schema.prisma`
containing only its tables) and optionally separate databases — the P5 "Database Extraction"
phase (`B17+`, not scheduled; see `data-architecture-plan.md`'s "Database Split Mechanics").
