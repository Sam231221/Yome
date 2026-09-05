# Schema ownership (single DB, ownership by code)

All services share one database and one Prisma schema in this package. Ownership is enforced by **which service is allowed to write** to which tables.

| Table(s) | Owner service | Notes |
|----------|----------------|--------|
| User, UserProfile | Identity (login/register/password; also profile read/update/avatar since B05) | Sole writer of `User`/`UserProfile` rows. Renamed from `Auth` in B05, which also absorbed profile fields from `User service`. The `following`/`followers` self-relation on `User` is the one exception: `core` (community module, see below) writes it via follow/unfollow, even though `User` rows themselves belong to `identity`. |
| Group, GroupTag, GroupInvitation, GroupAnnouncement, GroupEvent | Core (community module, since B06) | Group CRUD, membership, invitations, and the announcements/events sub-lists returned by group-detail reads. Dev-only seed (`createEducationGroups`) still runs through `identity`'s dev route via `@repo/seed`, same as every other seed handler — that's a seeding concern, not a runtime ownership one. Moved from `services/user` in B06. |
| Resource, ResourceSave, ResourceHelpfulVote | Core (learning module, since B07) | Resource CRUD, saves, and helpful votes. Moved verbatim from the deleted `services/resources`; external `/api/resources` path unchanged. Dev-only seed (`createLearningResources`) runs through `identity`'s dev route via `@repo/seed`, same pattern as `Group`. |
| Messages | Chat | Only the chat service creates/updates messages. Media service returns URLs; frontend or chat persists. |
| StudyRoom, StudyRoomParticipant, Topic | Core (learning module, since B07) | Read-only. `core/src/modules/learning/reads.ts` (`getLiveStudyRooms`, `getTrendingTopics`) is the one reader — `core`'s dashboard module composes these instead of querying the tables directly, since B08. No write path exists for these tables in any service yet. |
| Post, Comment, Like | Core (feed module, since B08) | Read-only so far — no create-post/comment/like endpoint exists anywhere in the app yet, so there is nothing to enforce a write boundary on. `core/src/modules/feed/reads.ts` (`getRecentPosts`) is the sole reader for the dashboard's feed widget; `core`'s learning module separately reads `Post` rows where `kind="Project"` (`getLearningProjects`/`getLearningProjectById`) — a learning-facing *view* over feed-owned data, not a fork of ownership. `feed` is the designated owner for whichever service builds the first write endpoint. |

## Boundaries

- **Media service**: Must not import `@repo/database`. It only uploads files and returns URLs.
- **Chat service**: Only reads/writes `Messages` (and reads User/Group for relations). Uses `@repo/database`.
- **Identity service** (renamed from `Auth` in B05): Reads/writes User, UserProfile (incl. profile read/update/avatar, absorbed from `User service` in B05). Uses `@repo/database`.
- **Core service, community module** (added in B06): Reads/writes `Group`, `GroupTag`, `GroupInvitation`, `GroupAnnouncement`, `GroupEvent`; writes the `following`/`followers` relation on `User` (follow/unfollow) without owning `User` itself. Uses `@repo/database`.
- **Core service, learning module** (added in B07): Reads/writes `Resource`, `ResourceSave`, `ResourceHelpfulVote` (folded in from the deleted `services/resources`); reads (does not write) `GroupEvent` (learning's cross-group events feed, distinct from community's per-group event sub-list), `Post` (`kind="Project"` rows), `StudyRoom`, `StudyRoomParticipant`, and `Topic`. Uses `@repo/database`.
- **Core service, feed module** (added in B08): Owns `Post`, `Comment`, `Like` — read-only for now (see the table row above). Uses `@repo/database`.
- **Core service, dashboard module** (added in B08): No table ownership of its own. Composes `community`'s (`getSidebarGroups`/`getUpcomingEvents`), `learning`'s (`getLiveStudyRooms`/`getTrendingTopics`), and `feed`'s (`getRecentPosts`) read surfaces instead of querying their tables directly — the architectural requirement this batch introduced, made possible by dashboard finally living in the same process as the modules it reads from. Still directly queries `User` itself (profile lookup, suggested-people), since `User` belongs to `identity`, a separate deployable service dashboard can't call in-process. `services/user` — the service this module and `community`/`learning` were extracted from across B06–B08 — no longer exists.

Future: split into per-service Prisma schemas (each service with its own `prisma/schema.prisma` containing only its tables) and optionally separate databases.
