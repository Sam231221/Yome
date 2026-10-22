/**
 * Builds the full frontend URL for a path (e.g. callbacks, redirects).
 * Uses FRONTEND_URL, defaulting to http://localhost:3000.
 */
export function absoluteUrl(path: string): string {
  const base = process.env.FRONTEND_URL || "http://localhost:3000";
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
