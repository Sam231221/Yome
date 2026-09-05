/**
 * Names a Yome backend deployable unit. Each service's `/health` returns its own name here.
 *
 * Four names have been removed as their services stopped existing or were renamed: `auth`
 * (renamed to `identity` in B05), `resources` (folded into `core`'s learning module in B07),
 * `user` (its last domain, dashboard, moved into `core` in B08 — `services/user` is
 * deleted), and `chat` (renamed to `messaging` in B09 — see `services/messaging`).
 */
export type ServiceName =
  | "gateway"
  | "identity"
  | "core"
  | "messaging"
  | "media"
  | "notifications";

export type HealthResponse = {
  ok: boolean;
  service: ServiceName;
};
