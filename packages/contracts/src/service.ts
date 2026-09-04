/**
 * Names a Yome backend deployable unit. Each service's `/health` returns its own name here.
 *
 * Includes both the current names and the post-refactor target names (`identity`, `core`,
 * `messaging`) so the union stays valid across the migration window.
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
  | "notifications"
  | "resources";

export type HealthResponse = {
  ok: boolean;
  service: ServiceName;
};
