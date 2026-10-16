/**
 * The JSON error body every service returns. `errorHandler` (in `@repo/service-kit`) writes
 * this shape; clients (including `apps/web`) can type against it.
 */
export type ErrorEnvelope = {
  ok: false;
  error: string;
  details?: string;
  requestId?: string;
};

/**
 * An `Error` carrying an HTTP status code. `errorHandler` reads `.statusCode` when present.
 * Pure (no framework dependency) so it is usable from storage helpers and the web app.
 */
export function createHttpError(
  message: string,
  statusCode = 400,
): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}
