/**
 * Names a Yome backend deployable unit. Each service's `/health` returns its own name here.
 *
 * Includes both the current names and the post-refactor target names (`core`, `messaging`)
 * so the union stays valid across the migration window. Three names have been removed as
 * their services stopped existing: `auth` (renamed to `identity` in B05), `resources`
 * (folded into `core`'s learning module in B07), and `user` (its last domain, dashboard,
 * moved into `core` in B08 — `services/user` is deleted).
 */
export type ServiceName =
  | "gateway"
  | "identity"
  | "core"
  | "chat"
  | "messaging"
  | "media"
  | "notifications";

export type HealthResponse = {
  ok: boolean;
  service: ServiceName;
};
