# Schema ownership (single DB, ownership by code)

All services share one database and one Prisma schema in this package. Ownership is enforced by **which service is allowed to write** to which tables.

| Table(s) | Owner service | Notes |
|----------|----------------|--------|
| User, UserProfile | Identity (login/register/password; also profile read/update/avatar since B05) | Sole writer of `User`/`UserProfile` rows. Renamed from `Auth` in B05, which also absorbed profile fields from `User service`. The `following`/`followers` self-relation on `User` is the one exception: `core` (community module, see below) writes it via follow/unfollow, even though `User` rows themselves belong to `identity`. |
| Group, GroupTag, GroupInvitation, GroupAnnouncement, GroupEvent | Core (community module, since B06) | Group CRUD, membership, invitations, and the announcements/events sub-lists returned by group-detail reads. Dev-only seed (`createEducationGroups`) still runs through `identity`'s dev route via `@repo/seed`, same as every other seed handler — that's a seeding concern, not a runtime ownership one. Moved from `services/user` in B06. |
| Messages | Chat | Only the chat service creates/updates messages. Media service returns URLs; frontend or chat persists. |
| StudyRoom, StudyRoomParticipant, Topic | Learning (planned, B07) | Currently read (not owned) by `services/user`'s dashboard aggregation; formal ownership lands with the `core/modules/learning` module. |
| Post, Comment, Like | Feed (planned, B08) | Not yet split; currently read by `services/user`'s dashboard and learning-reads code. |

## Boundaries

- **Media service**: Must not import `@repo/database`. It only uploads files and returns URLs.
- **Chat service**: Only reads/writes `Messages` (and reads User/Group for relations). Uses `@repo/database`.
- **Identity service** (renamed from `Auth` in B05): Reads/writes User, UserProfile (incl. profile read/update/avatar, absorbed from `User service` in B05). Uses `@repo/database`.
- **Core service, community module** (added in B06): Reads/writes `Group`, `GroupTag`, `GroupInvitation`, `GroupAnnouncement`, `GroupEvent`; writes the `following`/`followers` relation on `User` (follow/unfollow) without owning `User` itself. Uses `@repo/database`. Moved from `services/user`, which still owns the remaining learning-reads and dashboard-aggregation code pending B07/B08.

Future: split into per-service Prisma schemas (each service with its own `prisma/schema.prisma` containing only its tables) and optionally separate databases.
