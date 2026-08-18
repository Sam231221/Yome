import type { Request, Response, NextFunction } from "express";

/**
 * Rejects requests that do not carry the gateway's internal token.
 * Use on downstream services so only the gateway (which adds X-Internal-Token) can call them.
 * Skip this for health checks so load balancers can hit /health without the token.
 */
export function internalTokenGuard(req: Request, res: Response, next: NextFunction): void {
  // Enabled by default; only disable intentionally for isolated local debugging.
  if (process.env.INTERNAL_TOKEN_GUARD_ENABLED === "false") {
    return next();
  }
  if (req.path === "/health" || req.path === "/") {
    return next();
  }
  const token = req.headers["x-internal-token"] as string | undefined;
  const expected = process.env.GATEWAY_SHARED_TOKEN;
  if (!expected) {
    res.status(500).json({
      ok: false,
      error: "server_misconfiguration",
      details: "GATEWAY_SHARED_TOKEN is not configured",
    });
    return;
  }
  if (token !== expected) {
    res.status(401).json({
      ok: false,
      error: "unauthorized",
      details: "Missing or invalid internal token",
    });
    return;
  }
  next();
}
