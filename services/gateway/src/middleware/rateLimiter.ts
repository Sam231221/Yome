import type { Request, Response, NextFunction } from "express";
import { createSlidingWindowLimiter, getRedisClient } from "@repo/cache";
import type { GatewayRequest } from "../types.js";

/**
 * Redis-backed sliding-window rate limiter (B11), replacing the in-process `Map` that made N
 * gateway replicas grant N× the configured budget (issue #17 — `GATEWAY_RATE_MAX_REQUESTS`
 * was silently multiplied by replica count). `@repo/cache`'s limiter fails open on a Redis
 * error, so a Redis outage degrades to "no rate limiting" rather than rejecting every request.
 */
export function createRateLimiter(options: { windowMs: number; maxRequests: number }) {
  const { windowMs, maxRequests } = options;
  const checkLimit = createSlidingWindowLimiter(getRedisClient(), { windowMs, maxRequests });
  const bucketKey = (req: GatewayRequest) =>
    `yome:ratelimit:${(req as Request & { ip?: string }).ip || "unknown"}:${req.path}`;

  return async function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const r = req as GatewayRequest;
    const { allowed } = await checkLimit(bucketKey(r));
    if (!allowed) {
      return res.status(429).json({
        ok: false,
        error: "rate_limited",
        requestId: r.requestId,
        details: `Too many requests. Limit ${maxRequests}/${windowMs}ms`,
      });
    }
    return next();
  };
}
