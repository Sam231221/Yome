# Schema ownership (single DB, ownership by code)

All services share one database and one Prisma schema in this package. Ownership is enforced by **which service is allowed to write** to which tables.

| Table(s) | Owner service | Notes |
|----------|----------------|--------|
| User, UserProfile | Identity (login/register/password; also profile read/update/avatar since B05) | Sole writer of `User`/`UserProfile` rows. Renamed from `Auth` in B05, which also absorbed profile fields from `User service`. |
| Messages | Chat | Only the chat service creates/updates messages. Media service returns URLs; frontend or chat persists. |
| Group | User service (runtime CRUD + membership) / Identity (dev-only seed via `@repo/seed`, see `packages/seed`) | Group CRUD and membership. |
| Post, Comment, Like | Social (future) | Not yet split. |

## Boundaries

- **Media service**: Must not import `@repo/database`. It only uploads files and returns URLs.
- **Chat service**: Only reads/writes `Messages` (and reads User/Group for relations). Uses `@repo/database`.
- **Identity service** (renamed from `Auth` in B05): Reads/writes User, UserProfile (incl. profile read/update/avatar, absorbed from `User service` in B05). Uses `@repo/database`.

Future: split into per-service Prisma schemas (each service with its own `prisma/schema.prisma` containing only its tables) and optionally separate databases.
