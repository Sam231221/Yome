/**
 * Small pure helpers that were copy-pasted across services. Framework-free on purpose.
 */

/** Anything with an incoming-request `headers` bag. Express `Request` satisfies this. */
type HeaderCarrier = {
  headers: Record<string, string | string[] | undefined>;
};

/**
 * Reads the caller's user id from the gateway-injected `x-user-id` header.
 * Returns `null` when the header is missing or not a number. Downstream services trust this
 * because `internalTokenGuard` proves the request came from the gateway.
 */
export function getAuthenticatedUserId(req: HeaderCarrier): number | null {
  const raw = req.headers["x-user-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(id) ? null : id;
}

/** Lower-cases, replaces non-alphanumerics with `-`, trims dashes, caps at 120 chars. */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

/** RFC-4122 UUID (versions 1–5), case-insensitive. */
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** `1234` -> `1.2k`, `12345` -> `12k`, `999` -> `999`. */
export function compactNumber(value: number): string {
  if (value >= 1000) {
    return `${Number((value / 1000).toFixed(value >= 10000 ? 0 : 1))}k`;
  }
  return String(value);
}

/** `formatCount(3, "member")` -> `"3 members"`; `formatCount(1, "member")` -> `"1 member"`. */
export function formatCount(value: number, noun: string): string {
  return `${compactNumber(value)} ${noun}${value === 1 ? "" : "s"}`;
}
