/**
 * Names a Yome backend deployable unit. Each service's `/health` returns its own name here.
 *
 * Includes both the current names and the post-refactor target names (`identity`, `core`,
 * `messaging`) so the union stays valid across the migration window. `resources` was removed
 * in B07 — `services/resources` was folded into `core`'s learning module and no longer
 * exists as its own deployable unit.
 */
export type ServiceName =
  | "gateway"
  | "auth"
  | "identity"
  | "user"
  | "core"
  | "chat"
  | "messaging"
  | "media"
  | "notifications";

export type HealthResponse = {
  ok: boolean;
  service: ServiceName;
};
