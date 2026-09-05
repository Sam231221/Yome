import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import type { GatewayRequest } from "../types.js";

/** Assigns (or trusts an upstream-provided) request id and echoes it back on the response,
 * so every log line and error body for a request can be correlated. Must run before
 * anything else that might reject the request, so even a 401/429/503 carries a requestId. */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const r = req as GatewayRequest;
  r.requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  res.setHeader("x-request-id", r.requestId);
  next();
}
