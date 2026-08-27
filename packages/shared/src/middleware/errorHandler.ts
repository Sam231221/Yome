import type { Request, Response, NextFunction } from "express";
import type { ErrorEnvelope } from "../types/contracts.js";

/**
 * Express error-handling middleware. Attach as the last middleware.
 * Logs the error and sends a JSON error envelope; preserves statusCode if set on the error.
 */
export function errorHandler(
  err: Error & { statusCode?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode =
    err.statusCode ??
    (err.name === "MulterError" && err.code === "LIMIT_FILE_SIZE" ? 413 : 500);
  const requestId = _req.headers["x-request-id"];
  const envelope: ErrorEnvelope = {
    ok: false,
    error: err.message || "Internal server error",
    ...(requestId && { requestId: String(requestId) }),
  };
  if (process.env.NODE_ENV !== "production" && err.stack) {
    (envelope as ErrorEnvelope & { details?: string }).details = err.stack;
  }
  res.status(statusCode).json(envelope);
}
