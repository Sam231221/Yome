/**
 * Builds the full frontend URL for a path (e.g. callbacks, redirects).
 * Prefers FRONTEND_URL; falls back to FRONTEND_CLIENT_PORT for backward compatibility.
 */
export function absoluteUrl(path: string): string {
  const base =
    process.env.FRONTEND_URL ||
    process.env.FRONTEND_CLIENT_PORT ||
    "http://localhost:3000";
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
