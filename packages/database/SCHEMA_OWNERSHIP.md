# Schema ownership (single DB, ownership by code)

All services share one database and one Prisma schema in this package. Ownership is enforced by **which service is allowed to write** to which tables.

| Table(s) | Owner service | Notes |
|----------|----------------|--------|
| User, UserProfile | Auth (auth fields); User service (profiles, when extracted) | Auth: login, register, password. User service (future): profile update, follow, groups. |
| Messages | Chat | Only the chat service creates/updates messages. Media service returns URLs; frontend or chat persists. |
| Group | Auth (current) / User service (future) | Group CRUD and membership. |
| Post, Comment, Like | Social (future) | Not yet split. |

## Boundaries

- **Media service**: Must not import `@repo/database`. It only uploads files and returns URLs.
- **Chat service**: Only reads/writes `Messages` (and reads User/Group for relations). Uses `@repo/database`.
- **Auth service**: Reads/writes User, UserProfile; reads/writes Group and follow relations. Uses `@repo/database`.

Future: split into per-service Prisma schemas (each service with its own `prisma/schema.prisma` containing only its tables) and optionally separate databases.
