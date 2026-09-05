/**
 * The gateway's upstream routing table.
 *
 * This is a precursor to the full declarative route manifest planned for B10 (see
 * docs/services_packages_refactoring/architecture-plan.md) — not that refactor itself.
 * `index.ts` still owns bootstrap, CORS, rate limiting, and auth; this module owns only
 * "which upstream does this external path go to", extracted so it can be unit-tested
 * (see routeRules.test.ts) independently of booting an Express app.
 *
 * Rules are checked in array order, and the first match wins — identical to how Express's
 * own `app.use(prefix, ...)` mounts behave today. That is why the 3 specific
 * `/api/user/...` profile paths are listed before the general `/api/user` rule: B05 moved
 * them to `identity`, while B06 (community), B07 (learning reads + resources), and B08
 * (dashboard, the last domain) moved everything else on `/api/user` to `core` —
 * `services/user` no longer exists.
 */

/** Keys of `serviceBaseUrls` in index.ts. Add a new upstream there before adding a rule for it. */
export type Upstream =
  | "identity"
  | "core"
  | "media"
  | "notifications"
  | "messaging";

export type RouteRule = {
  /** External path prefix, matched on a path-segment boundary (see `pathMatchesPrefix`). */
  prefix: string;
  upstream: Upstream;
  /** If set, this literal prefix is stripped from the forwarded URL... */
  rewriteFrom?: string;
  /** ...and this is prepended in its place before reaching the upstream. */
  rewriteTo?: string;
};

export const routeRules: RouteRule[] = [
  // Profile endpoints B05 moved to identity. Must precede the general /api/user rule below.
  { prefix: "/api/user/get-user-by-id", upstream: "identity" },
  { prefix: "/api/user/update-user", upstream: "identity" },
  { prefix: "/api/user/get-all-users", upstream: "identity" },

  { prefix: "/api/auth", upstream: "identity" },
  { prefix: "/api/db", upstream: "identity" },

  // Everything else on /api/user: groups/connections/invitations (community, B06),
  // events/projects (learning reads, B07), and dashboard (B08) — all live in core now.
  { prefix: "/api/user", upstream: "core" },

  { prefix: "/api/media", upstream: "media" },
  { prefix: "/api/notifications", upstream: "notifications" },
  // Folded into core's learning module in B07; external path unchanged.
  { prefix: "/api/resources", upstream: "core" },

  {
    prefix: "/api/messages",
    upstream: "messaging",
    rewriteFrom: "/api/messages",
    rewriteTo: "/api/chat",
  },
  { prefix: "/api/chat", upstream: "messaging" },
];

/** Matches on a path-segment boundary: `/api/user` matches `/api/user` and `/api/user/x`,
 * but not `/api/userfoo` — the same semantics Express's own `app.use(prefix)` already has. */
export function pathMatchesPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** Returns the first rule (in array order) whose prefix matches `path`, or `undefined`. */
export function resolveRoute(path: string): RouteRule | undefined {
  return routeRules.find((rule) => pathMatchesPrefix(path, rule.prefix));
}
