# Schema ownership (single DB, ownership by code)

All services share one database and one Prisma schema in this package. Ownership is enforced by **which service is allowed to write** to which tables.

| Table(s) | Owner service | Notes |
|----------|----------------|--------|
| User, UserProfile | Identity (login/register/password; also profile read/update/avatar since B05) | Sole writer of `User`/`UserProfile` rows. Renamed from `Auth` in B05, which also absorbed profile fields from `User service`. The `following`/`followers` self-relation on `User` is the one exception: `core` (community module, see below) writes it via follow/unfollow, even though `User` rows themselves belong to `identity`. |
| Group, GroupTag, GroupInvitation, GroupAnnouncement, GroupEvent | Core (community module, since B06) | Group CRUD, membership, invitations, and the announcements/events sub-lists returned by group-detail reads. Dev-only seed (`createEducationGroups`) still runs through `identity`'s dev route via `@repo/seed`, same as every other seed handler — that's a seeding concern, not a runtime ownership one. Moved from `services/user` in B06. |
| Resource, ResourceSave, ResourceHelpfulVote | Core (learning module, since B07) | Resource CRUD, saves, and helpful votes. Moved verbatim from the deleted `services/resources`; external `/api/resources` path unchanged. Dev-only seed (`createLearningResources`) runs through `identity`'s dev route via `@repo/seed`, same pattern as `Group`. |
| Messages | Chat | Only the chat service creates/updates messages. Media service returns URLs; frontend or chat persists. |
| StudyRoom, StudyRoomParticipant, Topic | Core (learning module, since B07) | Read-only so far: `core/src/modules/learning/reads.ts` (`getLiveStudyRooms`, `getTrendingTopics`) formalizes the read path B07 extracted from `getDashboardHome`'s inline queries, but nothing calls it yet — `services/user`'s `getDashboardHome` still runs its own duplicate inline query pending B08, when dashboard moves into `core` and switches to calling these instead. No write path exists for these tables in any service yet. |
| Post, Comment, Like | Feed (planned, B08) | Not yet split. Read by `core`'s learning module (`getLearningProjects`/`getLearningProjectById`, over `Post` rows where `kind="Project"`) and by `services/user`'s `getDashboardHome`; written by neither. |

## Boundaries

- **Media service**: Must not import `@repo/database`. It only uploads files and returns URLs.
- **Chat service**: Only reads/writes `Messages` (and reads User/Group for relations). Uses `@repo/database`.
- **Identity service** (renamed from `Auth` in B05): Reads/writes User, UserProfile (incl. profile read/update/avatar, absorbed from `User service` in B05). Uses `@repo/database`.
- **Core service, community module** (added in B06): Reads/writes `Group`, `GroupTag`, `GroupInvitation`, `GroupAnnouncement`, `GroupEvent`; writes the `following`/`followers` relation on `User` (follow/unfollow) without owning `User` itself. Uses `@repo/database`.
- **Core service, learning module** (added in B07): Reads/writes `Resource`, `ResourceSave`, `ResourceHelpfulVote` (folded in from the deleted `services/resources`); reads (does not write) `GroupEvent` (learning's cross-group events feed, distinct from community's per-group event sub-list), `Post` (`kind="Project"` rows), `StudyRoom`, `StudyRoomParticipant`, and `Topic`. Uses `@repo/database`.
- `services/user` still owns `getDashboardHome`, pending B08 — it holds its own duplicate inline reads of `GroupEvent`, `Post`, `StudyRoom`, and `Topic` until then (see `core/src/modules/learning/reads.ts`'s doc comment).

Future: split into per-service Prisma schemas (each service with its own `prisma/schema.prisma` containing only its tables) and optionally separate databases.
