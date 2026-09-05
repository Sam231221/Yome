import type { Request, Response, NextFunction } from "express";
import type { GatewayRequest } from "../types.js";

/**
 * Per-replica, in-memory sliding-window-ish rate limiter (fixed window, keyed by
 * `ip:path`). Known limitation, tracked as issue #17: N gateway replicas each enforce this
 * limit independently, so N replicas grant N× the configured budget. B11 replaces the
 * bucket store with Redis; this batch only extracts the existing logic into its own module.
 */
export function createRateLimiter(options: { windowMs: number; maxRequests: number }) {
  const { windowMs, maxRequests } = options;
  const requestBuckets = new Map<string, { count: number; start: number }>();
  const bucketKey = (req: GatewayRequest) =>
    `${(req as Request & { ip?: string }).ip || "unknown"}:${req.path}`;

  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestBuckets.entries()) {
      if (now - value.start > windowMs) {
        requestBuckets.delete(key);
      }
    }
  }, windowMs).unref();

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const r = req as GatewayRequest;
    const key = bucketKey(r);
    const now = Date.now();
    const existing = requestBuckets.get(key);
    if (!existing || now - existing.start > windowMs) {
      requestBuckets.set(key, { count: 1, start: now });
      return next();
    }
    if (existing.count >= maxRequests) {
      return res.status(429).json({
        ok: false,
        error: "rate_limited",
        requestId: r.requestId,
        details: `Too many requests. Limit ${maxRequests}/${windowMs}ms`,
      });
    }
    existing.count += 1;
    requestBuckets.set(key, existing);
    return next();
  };
}
