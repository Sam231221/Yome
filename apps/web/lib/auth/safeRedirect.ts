/**
 * Returns a same-origin path to navigate to after sign-in, or `fallback`.
 *
 * `callbackUrl` comes from the query string (the auth middleware sets it), so it is
 * attacker-controllable: only relative paths and absolute URLs on this site's own origin
 * are allowed. Anything else (other hosts, protocol-relative `//evil.com`, `javascript:`)
 * falls back, which closes an open redirect and a script-URL injection.
 */
export function safeCallbackPath(
  callbackUrl: string | null | undefined,
  origin: string,
  fallback: string
): string {
  if (!callbackUrl) return fallback;
  try {
    const target = new URL(callbackUrl, origin);
    if (target.origin !== origin) return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
